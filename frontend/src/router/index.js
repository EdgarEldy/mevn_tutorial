import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import HomeView from '@/views/HomeView.vue'
import categoriesRoutes from '@/features/categories/categories.routes'
import productsRoutes from '@/features/products/products.routes'
import customersRoutes from '@/features/customers/customers.routes'
import ordersRoutes from '@/features/orders/orders.routes'
import authRoutes from '@/features/auth/auth.routes'
import { authGuard } from './guards/auth.guard'

// Every CRUD feature route requires a session (some of their own GET endpoints already
// do too, e.g. customers and orders - see customer.routes.js/order.resolvers.js), so the
// whole section is gated for a consistent UX rather than only gating individual actions.
const protectedRoutes = [...categoriesRoutes, ...productsRoutes, ...customersRoutes, ...ordersRoutes].map(
  (route) => ({ ...route, beforeEnter: authGuard }),
)

// DefaultLayout is a parent route with its own <router-view /> (nested-routes layout
// pattern) rather than composed directly in App.vue, so authRoutes (no sidebar/topbar
// chrome) can sit as top-level siblings of this one instead of needing a
// layout-switching mechanism in App.vue.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [{ path: '', name: 'home', component: HomeView }, ...protectedRoutes],
    },
    ...authRoutes,
  ],
})

export default router
