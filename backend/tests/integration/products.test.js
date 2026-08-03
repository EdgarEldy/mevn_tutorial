'use strict';

const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const { createUserWithRole, loginAndGetToken } = require('../helpers/auth');

let adminToken;
let userToken;
let categoryId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const admin = await createUserWithRole('admin');
  adminToken = await loginAndGetToken(app, request, admin.email, admin.password);

  const user = await createUserWithRole('user');
  userToken = await loginAndGetToken(app, request, user.email, user.password);

  const catRes = await request(app)
    .post('/api/v1/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ category_name: 'Electronics' });
  categoryId = catRes.body.data.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/v1/products', () => {
  it('returns 200 with an empty list (public, no auth needed)', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/v1/products', () => {
  it('creates a product and returns 201 for an admin', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'Laptop', unit_price: 999.99, category_id: categoryId });
    expect(res.status).toBe(201);
    expect(res.body.data.product_name).toBe('Laptop');
  });

  it('returns 422 when product_name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unit_price: 9.99, category_id: categoryId });
    expect(res.status).toBe(422);
  });

  it('returns 422 when unit_price is missing', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'X', category_id: categoryId });
    expect(res.status).toBe(422);
  });

  it('returns 404 when category_id does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'Ghost', unit_price: 1, category_id: 999999 });
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .send({ product_name: 'Ghost', unit_price: 1, category_id: categoryId });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_name: 'Ghost', unit_price: 1, category_id: categoryId });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/products/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'Smartphone', unit_price: 599.99, category_id: categoryId });
    id = res.body.data.id;
  });

  it('returns the product with the nested category (public, no auth needed)', async () => {
    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe('Smartphone');
    expect(res.body.data.category).toBeDefined();
    expect(res.body.data.category.id).toBe(categoryId);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/products/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/products/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'Old Name', unit_price: 10.0, category_id: categoryId });
    id = res.body.data.id;
  });

  it('updates and returns the new data for an admin', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.product_name).toBe('New Name');
  });

  it('returns 404 when category_id does not exist', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_id: 999999 });
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .put(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ product_name: 'Nope' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/products/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ product_name: 'Temp', unit_price: 1.0, category_id: categoryId });
    id = res.body.data.id;
  });

  it('returns 403 for a non-admin authenticated user, without deleting', async () => {
    const res = await request(app).delete(`/api/v1/products/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes and returns 200 for an admin', async () => {
    const res = await request(app).delete(`/api/v1/products/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/products/${id}`);
    expect(res.status).toBe(404);
  });
});
