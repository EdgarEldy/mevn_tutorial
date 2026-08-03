import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import ResetPasswordPage from './ResetPasswordPage.vue'

vi.mock('../services/auth.service', () => ({ default: { resetPassword: vi.fn() } }))
const { default: authService } = await import('../services/auth.service')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/auth/reset-password/:token', component: ResetPasswordPage },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
}

function mountPage(router) {
  return mount(ResetPasswordPage, {
    global: { plugins: [createVuetify(), router] },
    attachTo: document.body,
  })
}

describe('ResetPasswordPage', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows a validation error when the passwords do not match', async () => {
    const router = createTestRouter()
    router.push('/auth/reset-password/reset-token')
    await router.isReady()
    wrapper = mountPage(router)

    const inputs = document.querySelectorAll('input')
    inputs[0].value = 'Password123'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1].value = 'Different123'
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Passwords do not match.')
    })
    expect(authService.resetPassword).not.toHaveBeenCalled()
  })

  it('calls authService.resetPassword with the route token and navigates to /login on success', async () => {
    authService.resetPassword.mockResolvedValue()
    const router = createTestRouter()
    router.push('/auth/reset-password/reset-token')
    await router.isReady()
    wrapper = mountPage(router)

    const inputs = document.querySelectorAll('input')
    inputs[0].value = 'Password123'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1].value = 'Password123'
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({ token: 'reset-token', password: 'Password123' })
    })
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })
})
