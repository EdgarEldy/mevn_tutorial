import { useAuthStore } from '@/stores/auth.store'

// Wired in as beforeEnter on the categories/products/customers/orders route groups
// (see router/index.js's protectedRoutes).
export function authGuard(to, from, next) {
  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    next()
  } else {
    next('/login')
  }
}
