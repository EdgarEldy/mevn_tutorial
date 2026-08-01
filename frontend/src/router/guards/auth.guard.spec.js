import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authGuard } from './auth.guard'

describe('auth.guard', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('calls next() when authenticated', () => {
    localStorage.setItem('token', 'abc123')
    const next = vi.fn()

    authGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('redirects to /login when not authenticated', () => {
    const next = vi.fn()

    authGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith('/login')
  })
})
