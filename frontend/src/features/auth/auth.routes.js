// All public (no authGuard). Registered as top-level siblings of the DefaultLayout route
// in router/index.js, not nested inside it, since these pages have no sidebar/topbar chrome.
// The activate/reset-password paths must match the URLs the backend emails out verbatim
// (see auth.service.js's register()/forgotPassword() on the backend: `${frontendUrl}/auth/activate/${token}`
// and `${frontendUrl}/auth/reset-password/${token}`).
export default [
  { path: '/login', name: 'login', component: () => import('./pages/LoginPage.vue') },
  { path: '/register', name: 'register', component: () => import('./pages/RegisterPage.vue') },
  { path: '/auth/activate/:token', name: 'activate', component: () => import('./pages/ActivatePage.vue') },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('./pages/ForgotPasswordPage.vue') },
  {
    path: '/auth/reset-password/:token',
    name: 'reset-password',
    component: () => import('./pages/ResetPasswordPage.vue'),
  },
]
