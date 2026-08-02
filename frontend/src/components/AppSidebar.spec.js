import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppSidebar from './AppSidebar.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/categories', component: { template: '<div />' } },
      { path: '/products', component: { template: '<div />' } },
      { path: '/customers', component: { template: '<div />' } },
      { path: '/orders', component: { template: '<div />' } },
    ],
  })
}

describe('AppSidebar', () => {
  it('renders a nav link for each registered route', async () => {
    const router = createTestRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(AppSidebar, { global: { plugins: [createVuetify(), router] } })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Categories')
    expect(wrapper.text()).toContain('Products')
    expect(wrapper.text()).toContain('Customers')
    expect(wrapper.text()).toContain('Orders')
  })
})
