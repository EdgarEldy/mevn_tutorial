import { useAuthStore } from '@/stores/auth.store'

export function attachAuthInterceptor(axiosInstance) {
  axiosInstance.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })

  // A 401 here means the token is missing/invalid/expired/revoked (see
  // auth.middleware.js's protect()), so the local session is stale either way. This
  // also fires harmlessly on a failed login attempt itself (wrong credentials also
  // return 401), since clearing an already-empty session and redirecting to /login
  // (where the user already is) is a no-op.
  //
  // The router is imported dynamically inside the handler, not statically at the top of
  // this file: a static import would create a real circular dependency (router/index.js
  // eagerly imports DefaultLayout.vue -> AppTopbar.vue -> auth.service.js ->
  // api.service.js -> this file -> back to router/index.js, which is still mid-evaluation
  // at that point). That cycle would currently still work by accident, since nothing here
  // touches `router` until this callback actually runs, long after the whole module graph
  // has finished initializing - but it's a TDZ crash waiting to happen the moment any of
  // those modules' top-level code starts touching the router eagerly. A dynamic import()
  // sidesteps the cycle entirely instead of relying on that ordering.
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        useAuthStore().clearSession()
        const { default: router } = await import('@/router')
        router.push('/login')
      }
      return Promise.reject(error)
    },
  )
}
