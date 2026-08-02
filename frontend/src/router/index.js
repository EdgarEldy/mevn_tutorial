import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import HomeView from '@/views/HomeView.vue'
import categoriesRoutes from '@/features/categories/categories.routes'
import productsRoutes from '@/features/products/products.routes'
import customersRoutes from '@/features/customers/customers.routes'

// DefaultLayout is a parent route with its own <router-view /> (nested-routes layout
// pattern) rather than composed directly in App.vue, so a future route tree without
// this chrome (feature/frontend/auth's login/register pages) can sit as a sibling of
// this one instead of needing a layout-switching mechanism in App.vue.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        ...categoriesRoutes,
        ...productsRoutes,
        ...customersRoutes,
      ],
    },
  ],
})

export default router
