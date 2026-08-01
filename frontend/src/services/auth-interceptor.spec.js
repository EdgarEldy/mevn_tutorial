import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { attachAuthInterceptor } from './auth-interceptor'

function fakeAxiosInstance() {
  const handlers = []
  return {
    interceptors: {
      request: {
        use: (onFulfilled) => handlers.push(onFulfilled),
      },
    },
    run(config) {
      return handlers[0](config)
    },
  }
}

describe('auth-interceptor', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('attaches the Authorization header when a token is present', () => {
    localStorage.setItem('token', 'abc123')
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    const config = instance.run({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer abc123')
  })

  it('does not set an Authorization header when no token is present', () => {
    const instance = fakeAxiosInstance()
    attachAuthInterceptor(instance)

    const config = instance.run({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })
})
