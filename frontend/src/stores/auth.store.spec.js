import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth.store'

describe('auth.store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('isAuthenticated is false when no token is stored', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true when a token was already in localStorage on init', () => {
    localStorage.setItem('token', 'abc123')
    const store = useAuthStore()
    expect(store.token).toBe('abc123')
    expect(store.isAuthenticated).toBe(true)
  })

  it('isAdmin is always false (placeholder, no role data yet)', () => {
    localStorage.setItem('token', 'abc123')
    const store = useAuthStore()
    expect(store.isAdmin).toBe(false)
  })
})
