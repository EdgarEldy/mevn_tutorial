'use strict';

const request = require('supertest');
const app = require('../../src/app');
const sequelize = require('../../src/config/database');
const mountGraphQL = require('../../src/graphql/mountGraphQL');

let categoryId, productId, customerId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await mountGraphQL(app.v1);

  const catRes = await request(app).post('/api/v1/categories').send({ category_name: 'Electronics' });
  categoryId = catRes.body.data.id;
  const prodRes = await request(app)
    .post('/api/v1/products')
    .send({ product_name: 'Laptop', unit_price: 999.99, category_id: categoryId });
  productId = prodRes.body.data.id;
  const custRes = await request(app).post('/api/v1/customers').send({ first_name: 'Alice', last_name: 'Smith' });
  customerId = custRes.body.data.id;
});

afterAll(async () => {
  await sequelize.close();
});

function gql(query, variables) {
  return request(app).post('/api/v1/graphql').send({ query, variables });
}

describe('Query.orders', () => {
  it('returns an empty list before any order exists', async () => {
    const res = await gql('query { orders { id } }');
    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.orders).toEqual([]);
  });
});

describe('Mutation.createOrder', () => {
  it('creates an order and computes total server-side', async () => {
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
    );

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createOrder.total).toBeCloseTo(1999.98, 1);
    expect(res.body.data.createOrder.customer.first_name).toBe('Alice');
    expect(res.body.data.createOrder.product.category.category_name).toBe('Electronics');
  });

  it('returns a GraphQL error (not an HTTP error) when product_id does not exist', async () => {
    const res = await gql(
      `mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) { id }
      }`,
      { input: { customer_id: String(customerId), product_id: '999999', quantity: 1 } },
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
      `mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) { id }
      }`,
      { input: { customer_id: String(customerId), product_id: String(productId), quantity: 1 } },
    );
    orderId = res.body.data.createOrder.id;
  });

  it('order(id) returns the order', async () => {
    const res = await gql(`query Order($id: ID!) { order(id: $id) { id quantity } }`, { id: orderId });
    expect(res.body.data.order.id).toBe(orderId);
  });

  it('order(id) returns a GraphQL error for an unknown id (not a null field)', async () => {
    const res = await gql(`query Order($id: ID!) { order(id: $id) { id } }`, { id: '999999' });
    expect(res.body.errors).toBeDefined();
  });

  it('updateOrder recomputes total', async () => {
    const res = await gql(
      `mutation UpdateOrder($id: ID!, $input: UpdateOrderInput!) {
        updateOrder(id: $id, input: $input) { id quantity total }
      }`,
      { id: orderId, input: { quantity: 5 } },
    );
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.updateOrder.quantity).toBe(5);
    expect(res.body.data.updateOrder.total).toBeCloseTo(4999.95, 1);
  });

  it('deleteOrder removes the order', async () => {
    const res = await gql(`mutation DeleteOrder($id: ID!) { deleteOrder(id: $id) }`, { id: orderId });
    expect(res.body.data.deleteOrder).toBe(true);

    const check = await gql(`query Order($id: ID!) { order(id: $id) { id } }`, { id: orderId });
    expect(check.body.errors).toBeDefined();
  });
});
