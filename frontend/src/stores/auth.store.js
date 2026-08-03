import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Owns the authenticated session so the whole app (router guard, axios interceptor,
// topbar, isAdmin-gated UI across every feature) can reactively read login/role state
// without re-deriving it from the JWT, which carries no role info (see
// auth.service.js's login() on the backend: jwt.sign({ id, email, jti }, ...)). The full
// user (with roles) comes from the login response body and is persisted alongside the
// token so a page reload doesn't lose role information, since there is no GET /auth/me
// endpoint on the backend to re-fetch it.
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  const user = ref(readStoredUser())

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.roles?.some((role) => role.role_name === 'admin') ?? false)

  function setSession(newToken, newUser) {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    token.value = newToken
    user.value = newUser
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = null
    user.value = null
  }

  return { token, user, isAuthenticated, isAdmin, setSession, clearSession }
})
