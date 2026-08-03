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

describe('GET /api/v1/customers', () => {
  it('returns 200 with an empty list for an authenticated user', async () => {
    const res = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/customers');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/customers', () => {
  it('creates a customer with all fields for an admin', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Alice', last_name: 'Smith', email: 'alice@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.data.first_name).toBe('Alice');
  });

  it('creates a customer with an empty body (every field is nullable)', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data.first_name).toBeNull();
  });

  it('returns 422 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ first_name: 'Ghost' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/customers/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Bob', last_name: 'Jones' });
    id = res.body.data.id;
  });

  it('returns the customer for an authenticated user', async () => {
    const res = await request(app).get(`/api/v1/customers/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.first_name).toBe('Bob');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/v1/customers/999999').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/customers/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Carol' });
    id = res.body.data.id;
  });

  it('updates and returns the new data for an admin', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Caroline' });
    expect(res.status).toBe(200);
    expect(res.body.data.first_name).toBe('Caroline');
  });

  it('accepts an explicit null to clear a field', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: null });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBeNull();
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const res = await request(app)
      .put(`/api/v1/customers/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ first_name: 'Nope' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/customers/:id', () => {
  let id;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ first_name: 'Temp' });
    id = res.body.data.id;
  });

  it('returns 403 for a non-admin authenticated user, without deleting', async () => {
    const res = await request(app).delete(`/api/v1/customers/${id}`).set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('deletes and returns 200 for an admin', async () => {
    const res = await request(app).delete(`/api/v1/customers/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/v1/customers/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
