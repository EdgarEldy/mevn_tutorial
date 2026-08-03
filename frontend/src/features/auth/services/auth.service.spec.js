import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSpy = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toastSpy }))

const apiServiceMock = { get: vi.fn(), post: vi.fn() }
vi.mock('@/services/api.service', () => ({ default: apiServiceMock }))

const authStoreMock = { setSession: vi.fn(), clearSession: vi.fn() }
vi.mock('@/stores/auth.store', () => ({ useAuthStore: () => authStoreMock }))

const { default: authService } = await import('./auth.service')

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('posts the payload, toasts success and returns the created user', async () => {
      const input = { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', password: 'Password123' }
      const created = { id: 1, first_name: 'Jane', email: 'jane@example.com' }
      apiServiceMock.post.mockResolvedValue({
        data: { success: true, message: 'Registration successful. Check your email to activate your account.', data: created },
      })

      const result = await authService.register(input)

      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/register', input)
      expect(toastSpy.success).toHaveBeenCalledWith('Registration successful. Check your email to activate your account.')
      expect(result).toEqual(created)
    })

    it('toasts the error message and rethrows on failure', async () => {
      const error = { response: { data: { success: false, message: 'Email already in use.' } } }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(authService.register({})).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Email already in use.')
    })
  })

  describe('activate', () => {
    it('gets the activation endpoint and toasts success', async () => {
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'Account activated successfully.' } })

      await authService.activate('abc123')

      expect(apiServiceMock.get).toHaveBeenCalledWith('/auth/activate/abc123')
      expect(toastSpy.success).toHaveBeenCalledWith('Account activated successfully.')
    })

    it('toasts the error message and rethrows on an invalid token', async () => {
      const error = { response: { data: { success: false, message: 'Invalid activation token.' } } }
      apiServiceMock.get.mockRejectedValue(error)

      await expect(authService.activate('bad-token')).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid activation token.')
    })
  })

  describe('login', () => {
    it('posts the credentials, toasts success, sets the session and returns the user', async () => {
      const user = { id: 1, email: 'jane@example.com', roles: [{ role_name: 'user' }] }
      apiServiceMock.post.mockResolvedValue({
        data: { success: true, message: 'Login successful.', data: { token: 'jwt-token', user } },
      })

      const result = await authService.login({ email: 'jane@example.com', password: 'Password123' })

      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/login', { email: 'jane@example.com', password: 'Password123' })
      expect(authStoreMock.setSession).toHaveBeenCalledWith('jwt-token', user)
      expect(toastSpy.success).toHaveBeenCalledWith('Login successful.')
      expect(result).toEqual(user)
    })

    it('toasts the error message, does not touch the session, and rethrows on invalid credentials', async () => {
      const error = { response: { data: { success: false, message: 'Invalid credentials.' } } }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(authService.login({ email: 'jane@example.com', password: 'wrong' })).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Invalid credentials.')
      expect(authStoreMock.setSession).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('posts to /auth/logout and clears the session', async () => {
      apiServiceMock.post.mockResolvedValue({ data: { success: true, message: 'Logged out successfully.' } })

      await authService.logout()

      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/logout')
      expect(authStoreMock.clearSession).toHaveBeenCalled()
    })

    it('still clears the session even when the backend call fails', async () => {
      apiServiceMock.post.mockRejectedValue(new Error('Network error'))

      await authService.logout()

      expect(authStoreMock.clearSession).toHaveBeenCalled()
    })
  })

  describe('forgotPassword', () => {
    it('posts the email and toasts the generic success message', async () => {
      apiServiceMock.post.mockResolvedValue({
        data: { success: true, message: 'If this email exists, a reset link has been sent.' },
      })

      await authService.forgotPassword({ email: 'jane@example.com' })

      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'jane@example.com' })
      expect(toastSpy.success).toHaveBeenCalledWith('If this email exists, a reset link has been sent.')
    })
  })

  describe('resetPassword', () => {
    it('posts the token and new password, and toasts success', async () => {
      apiServiceMock.post.mockResolvedValue({ data: { success: true, message: 'Password reset successfully.' } })

      await authService.resetPassword({ token: 'reset-token', password: 'NewPassword123' })

      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'reset-token', password: 'NewPassword123' })
      expect(toastSpy.success).toHaveBeenCalledWith('Password reset successfully.')
    })

    it('toasts the error message and rethrows on an expired token', async () => {
      const error = { response: { data: { success: false, message: 'Reset token has expired.' } } }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(authService.resetPassword({ token: 'expired', password: 'NewPassword123' })).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Reset token has expired.')
    })
  })
})
