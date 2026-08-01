import { useAuthStore } from '@/stores/auth.store'

// Not yet wired into router/index.js - no protected routes exist until
// feature/frontend/categories and friends land.
export function authGuard(to, from, next) {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    next()
  } else {
    next('/login')
  }
}
