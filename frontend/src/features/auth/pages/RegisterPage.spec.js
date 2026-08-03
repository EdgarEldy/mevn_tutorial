import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterPage from './RegisterPage.vue'

vi.mock('../services/auth.service', () => ({ default: { register: vi.fn() } }))
const { default: authService } = await import('../services/auth.service')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
}

function mountPage(router) {
  return mount(RegisterPage, {
    global: { plugins: [createVuetify(), router] },
    attachTo: document.body,
  })
}

function fillAndSubmit({ firstName, lastName, email, password, confirmPassword }) {
  const inputs = document.querySelectorAll('input')
  const values = [firstName, lastName, email, password, confirmPassword]
  inputs.forEach((input, i) => {
    input.value = values[i]
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  document.querySelector('form').requestSubmit()
}

describe('RegisterPage', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows a validation error when the password lacks required complexity', async () => {
    const router = createTestRouter()
    router.push('/register')
    await router.isReady()
    wrapper = mountPage(router)

    fillAndSubmit({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'weakpassword',
      confirmPassword: 'weakpassword',
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('needs an uppercase letter')
    })
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('shows a validation error when the passwords do not match', async () => {
    const router = createTestRouter()
    router.push('/register')
    await router.isReady()
    wrapper = mountPage(router)

    fillAndSubmit({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password123',
      confirmPassword: 'Different123',
    })

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Passwords do not match.')
    })
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('registers and shows the check-your-email confirmation on success', async () => {
    authService.register.mockResolvedValue({ id: 1, email: 'jane@example.com' })
    const router = createTestRouter()
    router.push('/register')
    await router.isReady()
    wrapper = mountPage(router)

    fillAndSubmit({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    })

    await vi.waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'Password123',
      })
    })
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Check your email')
    })
    expect(document.body.textContent).toContain('jane@example.com')
  })
})
