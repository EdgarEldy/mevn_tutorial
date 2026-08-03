import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth.store'

const adminUser = { id: 1, email: 'admin@example.com', roles: [{ role_name: 'admin' }] }
const plainUser = { id: 2, email: 'user@example.com', roles: [{ role_name: 'user' }] }

describe('auth.store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('isAuthenticated is false and isAdmin is false when no session is stored', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(store.isAdmin).toBe(false)
  })

  it('reads a previously persisted session from localStorage on init', () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', JSON.stringify(adminUser))
    const store = useAuthStore()

    expect(store.token).toBe('abc123')
    expect(store.user).toEqual(adminUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isAdmin).toBe(true)
  })

  it('ignores a corrupted user record in localStorage instead of throwing', () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', '{not valid json')
    const store = useAuthStore()

    expect(store.user).toBeNull()
    expect(store.isAdmin).toBe(false)
  })

  it('setSession persists the token and user, and updates isAuthenticated/isAdmin', () => {
    const store = useAuthStore()

    store.setSession('new-token', adminUser)

    expect(store.token).toBe('new-token')
    expect(store.user).toEqual(adminUser)
    expect(store.isAuthenticated).toBe(true)
    expect(store.isAdmin).toBe(true)
    expect(localStorage.getItem('token')).toBe('new-token')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(adminUser)
  })

  it('isAdmin is false for a user without the admin role', () => {
    const store = useAuthStore()
    store.setSession('token', plainUser)

    expect(store.isAdmin).toBe(false)
  })

  it('clearSession removes the token and user from state and localStorage', () => {
    const store = useAuthStore()
    store.setSession('token', adminUser)

    store.clearSession()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
