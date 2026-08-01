'use strict';

const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const mountGraphQL = require('../../src/graphql/mountGraphQL');
const { createUserWithRole, loginAndGetToken } = require('../helpers/auth');

let adminToken;
let userToken;
let categoryId, productId, customerId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await mountGraphQL(app.v1);

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

function gql(query, variables, token) {
  const req = request(app).post('/api/v1/graphql').send({ query, variables });
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req;
}

describe('Query.orders', () => {
  it('requires authentication', async () => {
    const res = await gql('query { orders { id } }');
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('returns an empty list before any order exists, for an authenticated user', async () => {
    const res = await gql('query { orders { id } }', undefined, userToken);
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.orders).toEqual([]);
  });
});

describe('Mutation.createOrder', () => {
  it('requires the admin role', async () => {
    const res = await gql(
      `mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id } }`,
      { input: { customer_id: String(customerId), product_id: String(productId), quantity: 1 } },
      userToken,
    );
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  it('creates an order and computes total server-side for an admin', async () => {
    const res = await gql(
      `mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          quantity
          total
          customer { id first_name }
          product { id product_name category { id category_name } }
        }
      }`,
      { input: { customer_id: String(customerId), product_id: String(productId), quantity: 2 } },
      adminToken,
    );

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createOrder.total).toBeCloseTo(1999.98, 1);
    expect(res.body.data.createOrder.customer.first_name).toBe('Alice');
    expect(res.body.data.createOrder.product.category.category_name).toBe('Electronics');
  });

  it('returns a GraphQL error (not an HTTP error) when product_id does not exist', async () => {
    const res = await gql(
      `mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id } }`,
      { input: { customer_id: String(customerId), product_id: '999999', quantity: 1 } },
      adminToken,
    );

    // Apollo Server returns HTTP 200 even when a resolver throws - the failure
    // signal is a non-empty `errors` array, not the HTTP status code.
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe('Product not found.');
  });
});

describe('Query.order / Mutation.updateOrder / Mutation.deleteOrder', () => {
  let orderId;

  beforeAll(async () => {
    const res = await gql(
      `mutation CreateOrder($input: CreateOrderInput!) { createOrder(input: $input) { id } }`,
      { input: { customer_id: String(customerId), product_id: String(productId), quantity: 1 } },
      adminToken,
    );
    orderId = res.body.data.createOrder.id;
  });

  it('order(id) returns the order for an authenticated user', async () => {
    const res = await gql(`query Order($id: ID!) { order(id: $id) { id quantity } }`, { id: orderId }, userToken);
    expect(res.body.data.order.id).toBe(orderId);
  });

  it('order(id) returns a GraphQL error for an unknown id (not a null field)', async () => {
    const res = await gql(`query Order($id: ID!) { order(id: $id) { id } }`, { id: '999999' }, userToken);
    expect(res.body.errors).toBeDefined();
  });

  it('updateOrder requires the admin role', async () => {
    const res = await gql(
      `mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) { updateOrder(id: $id, input: $input) { id } }`,
      { id: orderId, input: { quantity: 5 } },
      userToken,
    );
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  it('updateOrder recomputes total for an admin', async () => {
    const res = await gql(
      `mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) {
        updateOrder(id: $id, input: $input) { id quantity total }
      }`,
      { id: orderId, input: { quantity: 5 } },
      adminToken,
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.updateOrder.quantity).toBe(5);
    expect(res.body.data.updateOrder.total).toBeCloseTo(4999.95, 1);
  });

  it('deleteOrder requires the admin role', async () => {
    const res = await gql(`mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }`, { id: orderId }, userToken);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
  });

  it('deleteOrder removes the order for an admin', async () => {
    const res = await gql(`mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }`, { id: orderId }, adminToken);
    expect(res.body.data.deleteOrder).toBe(true);

    const check = await gql(`query Order($id: ID!) { order(id: $id) { id } }`, { id: orderId }, adminToken);
    expect(check.body.errors).toBeDefined();
  });
});
