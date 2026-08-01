import { useAuthStore } from '@/stores/auth.store'

// Placeholder until feature/frontend/auth: attaches the token if present. No 401
// handling yet - that needs the real session-clearing logic auth.store.js doesn't
// have until that branch.
export function attachAuthInterceptor(axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })
}
