'use strict';

const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const { createUserWithRole, loginAndGetToken } = require('../helpers/auth');

let adminToken;
let userToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const admin = await createUserWithRole('admin');
  adminToken = await loginAndGetToken(app, request, admin.email, admin.password);

  const user = await createUserWithRole('user');
  userToken = await loginAndGetToken(app, request, user.email, user.password);
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/v1/categories', () => {
  it('returns 200 with an empty list (public, no auth needed)', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: [] });
  });
});

describe('POST /api/v1/categories', () => {
  it('creates a category and returns 201 for an admin', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Electronics' });
    expect(res.status).toBe(201);
    expect(res.body.data.category_name).toBe('Electronics');
  });

  it('returns 422 when category_name is missing', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/v1/categories').send({ category_name: 'Ghost' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category_name: 'Ghost' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/categories/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Books' });
    id = res.body.data.id;
  });

  it('returns the category (public, no auth needed)', async () => {
    const res = await request(app).get(`/api/v1/categories/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.category_name).toBe('Books');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/categories/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/categories/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Clothes' });
    id = res.body.data.id;
  });

  it('updates and returns the new data for an admin', async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Clothing' });
    expect(res.status).toBe(200);
    expect(res.body.data.category_name).toBe('Clothing');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app)
      .put('/api/v1/categories/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .put(`/api/v1/categories/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ category_name: 'Nope' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/categories/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category_name: 'Temp' });
    id = res.body.data.id;
  });

  it('returns 403 for a non-admin authenticated user, without deleting', async () => {
    const res = await request(app).delete(`/api/v1/categories/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes and returns 200 for an admin', async () => {
    const res = await request(app).delete(`/api/v1/categories/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/categories/${id}`);
    expect(res.status).toBe(404);
  });
});
