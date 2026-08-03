import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import ForgotPasswordPage from './ForgotPasswordPage.vue'

vi.mock('../services/auth.service', () => ({ default: { forgotPassword: vi.fn() } }))
const { default: authService } = await import('../services/auth.service')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/forgot-password', component: ForgotPasswordPage },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
}

function mountPage(router) {
  return mount(ForgotPasswordPage, {
    global: { plugins: [createVuetify(), router] },
    attachTo: document.body,
  })
}

describe('ForgotPasswordPage', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows a validation error when the email is empty', async () => {
    const router = createTestRouter()
    router.push('/forgot-password')
    await router.isReady()
    wrapper = mountPage(router)

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Email is required.')
    })
    expect(authService.forgotPassword).not.toHaveBeenCalled()
  })

  it('calls authService.forgotPassword and shows the generic confirmation', async () => {
    authService.forgotPassword.mockResolvedValue()
    const router = createTestRouter()
    router.push('/forgot-password')
    await router.isReady()
    wrapper = mountPage(router)

    const input = document.querySelector('input')
    input.value = 'jane@example.com'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith({ email: 'jane@example.com' })
    })
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('If an account exists for that email')
    })
  })
})
