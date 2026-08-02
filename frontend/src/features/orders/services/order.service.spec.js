import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSpy = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toastSpy }))

const graphqlServiceMock = { request: vi.fn() }
vi.mock('@/services/graphql.service', () => ({ default: graphqlServiceMock }))

const { default: orderService } = await import('./order.service')

describe('order.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns data.orders unwrapped when the request succeeds', async () => {
      const orders = [{ id: '1', quantity: 2, total: 1999.98 }]
      graphqlServiceMock.request.mockResolvedValue({ orders })

      const result = await orderService.getAll()

      expect(graphqlServiceMock.request).toHaveBeenCalledWith(expect.stringContaining('query Orders'))
      expect(result).toEqual(orders)
    })

    it('returns an empty array when data.orders is missing', async () => {
      graphqlServiceMock.request.mockResolvedValue({})

      const result = await orderService.getAll()

      expect(result).toEqual([])
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = new Error('Authentication required.')
      graphqlServiceMock.request.mockRejectedValue(error)

      await expect(orderService.getAll()).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Authentication required.')
    })
  })

  describe('create', () => {
    it('sends the mutation with the input variable, toasts success and returns the created order', async () => {
      const input = { customer_id: 1, product_id: 1, quantity: 2 }
      const created = { id: '1', quantity: 2, total: 1999.98 }
      graphqlServiceMock.request.mockResolvedValue({ createOrder: created })

      const result = await orderService.create(input)

      expect(graphqlServiceMock.request).toHaveBeenCalledWith(expect.stringContaining('mutation CreateOrder'), {
        input,
      })
      expect(toastSpy.success).toHaveBeenCalledWith('Order created.')
      expect(result).toEqual(created)
    })

    it('toasts the error message and rethrows when the mutation fails', async () => {
      const error = new Error('Product not found.')
      graphqlServiceMock.request.mockRejectedValue(error)

      await expect(orderService.create({})).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Product not found.')
      expect(toastSpy.success).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('sends the mutation with id and input variables, toasts success and returns the updated order', async () => {
      const updated = { id: '1', quantity: 3, total: 2999.97 }
      graphqlServiceMock.request.mockResolvedValue({ updateOrder: updated })

      const result = await orderService.update('1', { quantity: 3 })

      expect(graphqlServiceMock.request).toHaveBeenCalledWith(expect.stringContaining('mutation UpdateOrder'), {
        id: '1',
        input: { quantity: 3 },
      })
      expect(toastSpy.success).toHaveBeenCalledWith('Order updated.')
      expect(result).toEqual(updated)
    })
  })

  describe('remove', () => {
    it('sends the delete mutation with the id and toasts success', async () => {
      graphqlServiceMock.request.mockResolvedValue({ deleteOrder: true })

      await orderService.remove('1')

      expect(graphqlServiceMock.request).toHaveBeenCalledWith(expect.stringContaining('mutation DeleteOrder'), {
        id: '1',
      })
      expect(toastSpy.success).toHaveBeenCalledWith('Order deleted.')
    })

    it('toasts the error message and rethrows when the mutation fails', async () => {
      const error = new Error('Order not found.')
      graphqlServiceMock.request.mockRejectedValue(error)

      await expect(orderService.remove('999')).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Order not found.')
    })
  })
})
