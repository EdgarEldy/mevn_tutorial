'use strict';

const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const { createUserWithRole, loginAndGetToken } = require('../helpers/auth');

let adminToken;
let userToken;
let categoryId, productId, customerId;

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

  const prodRes = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ product_name: 'Laptop', unit_price: 999.99, category_id: categoryId });
  productId = prodRes.body.data.id;

  const custRes = await request(app)
    .post('/api/v1/customers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ first_name: 'Alice', last_name: 'Smith' });
  customerId = custRes.body.data.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/v1/orders', () => {
  it('returns 200 with an empty list for an authenticated user', async () => {
    const res = await request(app).get('/api/v1/orders').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/orders');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/orders', () => {
  it('creates an order and computes total server-side for an admin', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data.total).toBeCloseTo(1999.98, 1);
    expect(res.body.data.quantity).toBe(2);
  });

  it('ignores a client-supplied total', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 1, total: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.total).toBeCloseTo(999.99, 1);
  });

  it('returns 422 when quantity is missing', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId });
    expect(res.status).toBe(422);
  });

  it('returns 404 when the product does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: 999999, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 404 when the customer does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: 999999, product_id: productId, quantity: 1 });
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 1 });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/orders/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 1 });
    id = res.body.data.id;
  });

  it('returns the order with nested customer and product (and product.category)', async () => {
    const res = await request(app).get(`/api/v1/orders/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.customer).toBeDefined();
    expect(res.body.data.product).toBeDefined();
    expect(res.body.data.product.category).toBeDefined();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/orders/999999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/orders/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 1 });
    id = res.body.data.id;
  });

  it('updates quantity and recomputes total for an admin', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data.quantity).toBe(3);
    expect(res.body.data.total).toBeCloseTo(2999.97, 1);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/orders/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customer_id: customerId, product_id: productId, quantity: 1 });
    id = res.body.data.id;
  });

  it('returns 403 for a non-admin authenticated user, without deleting', async () => {
    const res = await request(app).delete(`/api/v1/orders/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes and returns 200 for an admin', async () => {
    const res = await request(app).delete(`/api/v1/orders/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/orders/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
