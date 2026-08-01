import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VApp } from 'vuetify/components'
import DefaultLayout from './DefaultLayout.vue'

// VNavigationDrawer/VAppBar need Vuetify's layout system, which only exists inside a
// mounted VApp. VApp must be imported/registered explicitly: vite-plugin-vuetify's
// auto-import only rewrites .vue SFCs at transform time, and this inline test-host
// template isn't one.
const TestHost = {
  components: { VApp, DefaultLayout },
  template: '<v-app><DefaultLayout /></v-app>',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div class="home-stub">home</div>' } },
      { path: '/categories', component: { template: '<div />' } },
    ],
  })
}

describe('DefaultLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('composes the sidebar, topbar, footer and the routed page content', async () => {
    const router = createTestRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(TestHost, { global: { plugins: [createVuetify(), router] } })

    expect(wrapper.text()).toContain('MEVN Tutorial')
    expect(wrapper.find('.home-stub').exists()).toBe(true)
  })

  it('starts with the navigation drawer open and closes it via the topbar toggle', async () => {
    const router = createTestRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(TestHost, { global: { plugins: [createVuetify(), router] } })
    const layout = wrapper.findComponent(DefaultLayout)

    expect(layout.findComponent({ name: 'VNavigationDrawer' }).props('modelValue')).toBe(true)

    await wrapper.find('button[aria-label="Toggle navigation"]').trigger('click')

    expect(layout.findComponent({ name: 'VNavigationDrawer' }).props('modelValue')).toBe(false)
  })
})
