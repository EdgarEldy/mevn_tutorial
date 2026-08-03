import { describe, it, expect, vi, beforeEach } from 'vitest'

const apiServiceMock = { post: vi.fn() }
vi.mock('./api.service', () => ({ default: apiServiceMock }))

const { default: graphqlService } = await import('./graphql.service')

describe('graphql.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('posts the query and variables to /graphql and returns response.data.data', async () => {
    apiServiceMock.post.mockResolvedValue({ data: { data: { orders: [] } } })

    const result = await graphqlService.request('query { orders { id } }', { foo: 'bar' })

    expect(apiServiceMock.post).toHaveBeenCalledWith('/graphql', {
      query: 'query { orders { id } }',
      variables: { foo: 'bar' },
    })
    expect(result).toEqual({ orders: [] })
  })

  it('throws with the joined error messages when the response carries a GraphQL errors array', async () => {
    apiServiceMock.post.mockResolvedValue({
      data: { errors: [{ message: 'Authentication required.' }], data: null },
    })

    await expect(graphqlService.request('query { orders { id } }')).rejects.toThrow('Authentication required.')
  })

  it('joins multiple error messages', async () => {
    apiServiceMock.post.mockResolvedValue({
      data: { errors: [{ message: 'First error.' }, { message: 'Second error.' }] },
    })

    await expect(graphqlService.request('query {}')).rejects.toThrow('First error., Second error.')
  })

  it('propagates a transport-level failure as-is, without misreading it as a GraphQL errors array', async () => {
    const networkError = new Error('Network Error')
    apiServiceMock.post.mockRejectedValue(networkError)

    await expect(graphqlService.request('query {}')).rejects.toBe(networkError)
  })
})
