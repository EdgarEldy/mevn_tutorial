import apiService from './api.service'

// Thin POST wrapper around the /graphql endpoint, the GraphQL counterpart to api.service.js.
// Only the orders feature uses this (the backend only exposes orders over GraphQL), but it
// lives here alongside api.service.js since it's base HTTP infrastructure, not feature logic.
// Reuses the same axios instance, so the auth interceptor already attaches the bearer token.
async function request(query, variables) {
  const response = await apiService.post('/graphql', { query, variables })
  // A resolver throwing (e.g. "Product not found") still comes back as HTTP 200 with an
  // errors array, so this has to be checked explicitly instead of relying on axios's catch.
  if (response.data.errors?.length) {
    throw new Error(response.data.errors.map((error) => error.message).join(', '))
  }
  return response.data.data
}

export default { request }
