import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginPage from './LoginPage.vue'

vi.mock('../services/auth.service', () => ({ default: { login: vi.fn() } }))
const { default: authService } = await import('../services/auth.service')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: LoginPage },
      { path: '/register', component: { template: '<div />' } },
      { path: '/forgot-password', component: { template: '<div />' } },
    ],
  })
}

function mountPage(router) {
  return mount(LoginPage, {
    global: { plugins: [createVuetify(), router] },
    attachTo: document.body,
  })
}

describe('LoginPage', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows validation errors and does not call the service when fields are empty', async () => {
    const router = createTestRouter()
    router.push('/login')
    await router.isReady()
    wrapper = mountPage(router)

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Email is required.')
    })
    expect(document.body.textContent).toContain('Password is required.')
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('calls authService.login and navigates home on success', async () => {
    authService.login.mockResolvedValue({ id: 1 })
    const router = createTestRouter()
    router.push('/login')
    await router.isReady()
    wrapper = mountPage(router)

    const inputs = document.querySelectorAll('input')
    inputs[0].value = 'jane@example.com'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1].value = 'Password123'
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }))

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'Password123' })
    })
    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  it('stays on the page when login fails', async () => {
    authService.login.mockRejectedValue(new Error('Invalid credentials.'))
    const router = createTestRouter()
    router.push('/login')
    await router.isReady()
    wrapper = mountPage(router)

    const inputs = document.querySelectorAll('input')
    inputs[0].value = 'jane@example.com'
    inputs[0].dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1].value = 'wrong'
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }))

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(authService.login).toHaveBeenCalled()
    })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
