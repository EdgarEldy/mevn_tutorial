import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSpy = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toastSpy }))

const apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
vi.mock('@/services/api.service', () => ({ default: apiServiceMock }))

const { default: customerService } = await import('./customer.service')

describe('customer.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns response.data.data unwrapped when the request succeeds', async () => {
      const customers = [
        { id: 1, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
        { id: 2, first_name: null, last_name: null, email: null },
      ]
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK', data: customers } })

      const result = await customerService.getAll()

      expect(apiServiceMock.get).toHaveBeenCalledWith('/customers')
      expect(result).toEqual(customers)
    })

    it('returns an empty array when response.data.data is missing', async () => {
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK' } })

      const result = await customerService.getAll()

      expect(result).toEqual([])
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Something broke' } } }
      apiServiceMock.get.mockRejectedValue(error)

      await expect(customerService.getAll()).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Something broke')
    })
  })

  describe('create', () => {
    it('posts the payload, toasts success and returns the created customer', async () => {
      const input = { first_name: 'Jane' }
      const created = { id: 1, ...input }
      apiServiceMock.post.mockResolvedValue({ data: { success: true, message: 'Customer created.', data: created } })

      const result = await customerService.create(input)

      expect(apiServiceMock.post).toHaveBeenCalledWith('/customers', input)
      expect(toastSpy.success).toHaveBeenCalledWith('Customer created.')
      expect(result).toEqual(created)
    })

    it('toasts the joined validation error messages and rethrows on 422', async () => {
      const error = {
        response: {
          data: { success: false, message: 'Validation failed.', errors: [{ msg: 'email must be a valid email' }] },
        },
      }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(customerService.create({ email: 'not-an-email' })).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('email must be a valid email')
      expect(toastSpy.success).not.toHaveBeenCalled()
    })

    it('toasts a generic fallback message when the error has no response body', async () => {
      apiServiceMock.post.mockRejectedValue({})

      await expect(customerService.create({ first_name: 'Jane' })).rejects.toBeDefined()
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })

  describe('update', () => {
    it('puts the payload, toasts success and returns the updated customer', async () => {
      const updated = { id: 1, first_name: 'Updated' }
      apiServiceMock.put.mockResolvedValue({ data: { success: true, message: 'Customer updated.', data: updated } })

      const result = await customerService.update(1, { first_name: 'Updated' })

      expect(apiServiceMock.put).toHaveBeenCalledWith('/customers/1', { first_name: 'Updated' })
      expect(toastSpy.success).toHaveBeenCalledWith('Customer updated.')
      expect(result).toEqual(updated)
    })
  })

  describe('remove', () => {
    it('deletes by id and toasts success', async () => {
      apiServiceMock.delete.mockResolvedValue({ data: { success: true, message: 'Customer deleted.' } })

      await customerService.remove(1)

      expect(apiServiceMock.delete).toHaveBeenCalledWith('/customers/1')
      expect(toastSpy.success).toHaveBeenCalledWith('Customer deleted.')
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Customer not found.' } } }
      apiServiceMock.delete.mockRejectedValue(error)

      await expect(customerService.remove(999)).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Customer not found.')
    })
  })
})
