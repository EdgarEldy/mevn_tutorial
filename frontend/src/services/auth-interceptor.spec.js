import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const routerMock = { push: vi.fn() }
vi.mock('@/router', () => ({ default: routerMock }))

const { attachAuthInterceptor } = await import('./auth-interceptor')

function fakeAxiosInstance() {
  const requestHandlers = []
  const responseHandlers = []
  return {
    interceptors: {
      request: { use: (onFulfilled) => requestHandlers.push(onFulfilled) },
      response: { use: (onFulfilled, onRejected) => responseHandlers.push({ onFulfilled, onRejected }) },
    },
    runRequest(config) {
      return requestHandlers[0](config)
    },
    runResponseRejected(error) {
      return responseHandlers[0].onRejected(error)
    },
  }
}

describe('auth-interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    routerMock.push.mockClear()
  })

  it('attaches the Authorization header when a token is present', () => {
    localStorage.setItem('token', 'abc123')
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    const config = instance.runRequest({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer abc123')
  })

  it('does not set an Authorization header when no token is present', () => {
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    const config = instance.runRequest({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('clears the session and redirects to /login on a 401 response', async () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    await expect(instance.runResponseRejected({ response: { status: 401 } })).rejects.toBeDefined()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(routerMock.push).toHaveBeenCalledWith('/login')
  })

  it('leaves the session untouched and rethrows on a non-401 error', async () => {
    localStorage.setItem('token', 'abc123')
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    await expect(instance.runResponseRejected({ response: { status: 500 } })).rejects.toBeDefined()

    expect(localStorage.getItem('token')).toBe('abc123')
    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
