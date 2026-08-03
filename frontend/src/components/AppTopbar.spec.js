import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import { VApp } from 'vuetify/components'
import AppTopbar from './AppTopbar.vue'

vi.mock('@/features/auth/services/auth.service', () => ({
  default: { logout: vi.fn().mockResolvedValue() },
}))
const { default: authService } = await import('@/features/auth/services/auth.service')

// VAppBar needs Vuetify's layout system, which only exists inside a mounted VApp -
// mounting AppTopbar standalone throws "[Vuetify] Could not find injected layout".
// VApp must be imported/registered explicitly: vite-plugin-vuetify's auto-import only
// rewrites .vue SFCs at transform time, and this inline test-host template isn't one.
const TestHost = {
  components: { VApp, AppTopbar },
  template: '<v-app><AppTopbar /></v-app>',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
}

describe('AppTopbar', () => {
  let wrapper

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    wrapper?.unmount()
  })

  it('emits toggle-drawer when the nav icon is clicked', async () => {
    const router = createTestRouter()
    router.push('/')
    await router.isReady()
    wrapper = mount(TestHost, { global: { plugins: [createVuetify(), router] } })

    await wrapper.find('button[aria-label="Toggle navigation"]').trigger('click')

    expect(wrapper.findComponent(AppTopbar).emitted('toggle-drawer')).toHaveLength(1)
  })

  it('shows a Login link to /login when not authenticated', async () => {
    const router = createTestRouter()
    router.push('/')
    await router.isReady()
    wrapper = mount(TestHost, { global: { plugins: [createVuetify(), router] }, attachTo: document.body })

    await wrapper.find('button[aria-label="User menu"]').trigger('click')
    await nextTick()

    const loginLink = Array.from(document.querySelectorAll('a, [role="menuitem"]')).find((el) =>
      el.textContent.includes('Login'),
    )
    expect(loginLink).toBeTruthy()
  })

  it('logs out and redirects to /login when Logout is clicked while authenticated', async () => {
    localStorage.setItem('token', 'abc123')
    localStorage.setItem('user', JSON.stringify({ id: 1, roles: [] }))
    const router = createTestRouter()
    router.push('/')
    await router.isReady()
    wrapper = mount(TestHost, { global: { plugins: [createVuetify(), router] }, attachTo: document.body })

    await wrapper.find('button[aria-label="User menu"]').trigger('click')
    await nextTick()

    const logoutItem = Array.from(document.querySelectorAll('[role="menuitem"], .v-list-item')).find((el) =>
      el.textContent.includes('Logout'),
    )
    logoutItem.click()
    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(authService.logout).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })
})
