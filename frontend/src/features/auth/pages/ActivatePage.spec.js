import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import ActivatePage from './ActivatePage.vue'

vi.mock('../services/auth.service', () => ({ default: { activate: vi.fn() } }))
const { default: authService } = await import('../services/auth.service')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/auth/activate/:token', component: ActivatePage },
      { path: '/login', component: { template: '<div />' } },
      { path: '/register', component: { template: '<div />' } },
    ],
  })
}

describe('ActivatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls authService.activate with the route token and shows success', async () => {
    authService.activate.mockResolvedValue()
    const router = createTestRouter()
    router.push('/auth/activate/abc123')
    await router.isReady()
    const wrapper = mount(ActivatePage, { global: { plugins: [createVuetify(), router] } })

    expect(authService.activate).toHaveBeenCalledWith('abc123')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Your account is now active.')
    })
  })

  it('shows an error state when activation fails', async () => {
    authService.activate.mockRejectedValue(new Error('Invalid activation token.'))
    const router = createTestRouter()
    router.push('/auth/activate/bad-token')
    await router.isReady()
    const wrapper = mount(ActivatePage, { global: { plugins: [createVuetify(), router] } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('invalid or has already been used')
    })
  })
})
