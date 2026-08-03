import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSpy = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toastSpy }))

const apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
vi.mock('@/services/api.service', () => ({ default: apiServiceMock }))

const { default: productService } = await import('./product.service')

describe('product.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns response.data.data unwrapped when the request succeeds', async () => {
      const products = [
        { id: 1, product_name: 'Laptop', unit_price: 999.99, category_id: 1 },
        { id: 2, product_name: 'Smartphone', unit_price: 599.99, category_id: 1 },
      ]
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK', data: products } })

      const result = await productService.getAll()

      expect(apiServiceMock.get).toHaveBeenCalledWith('/products')
      expect(result).toEqual(products)
    })

    it('returns an empty array when response.data.data is missing', async () => {
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK' } })

      const result = await productService.getAll()

      expect(result).toEqual([])
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Something broke' } } }
      apiServiceMock.get.mockRejectedValue(error)

      await expect(productService.getAll()).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Something broke')
    })
  })

  describe('create', () => {
    it('posts the payload, toasts success and returns the created product', async () => {
      const input = { product_name: 'Laptop', unit_price: 999.99, category_id: 1 }
      const created = { id: 1, ...input }
      apiServiceMock.post.mockResolvedValue({ data: { success: true, message: 'Product created.', data: created } })

      const result = await productService.create(input)

      expect(apiServiceMock.post).toHaveBeenCalledWith('/products', input)
      expect(toastSpy.success).toHaveBeenCalledWith('Product created.')
      expect(result).toEqual(created)
    })

    it('toasts the joined validation error messages and rethrows on 422', async () => {
      const error = {
        response: {
          data: { success: false, message: 'Validation failed.', errors: [{ msg: 'product_name is required' }] },
        },
      }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(productService.create({ product_name: '' })).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('product_name is required')
      expect(toastSpy.success).not.toHaveBeenCalled()
    })

    it('toasts a generic fallback message when the error has no response body', async () => {
      apiServiceMock.post.mockRejectedValue({})

      await expect(productService.create({ product_name: 'Laptop' })).rejects.toBeDefined()
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })

  describe('update', () => {
    it('puts the payload, toasts success and returns the updated product', async () => {
      const updated = { id: 1, product_name: 'Updated', unit_price: 1099.99, category_id: 1 }
      apiServiceMock.put.mockResolvedValue({ data: { success: true, message: 'Product updated.', data: updated } })

      const result = await productService.update(1, { product_name: 'Updated' })

      expect(apiServiceMock.put).toHaveBeenCalledWith('/products/1', { product_name: 'Updated' })
      expect(toastSpy.success).toHaveBeenCalledWith('Product updated.')
      expect(result).toEqual(updated)
    })
  })

  describe('remove', () => {
    it('deletes by id and toasts success', async () => {
      apiServiceMock.delete.mockResolvedValue({ data: { success: true, message: 'Product deleted.' } })

      await productService.remove(1)

      expect(apiServiceMock.delete).toHaveBeenCalledWith('/products/1')
      expect(toastSpy.success).toHaveBeenCalledWith('Product deleted.')
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Product not found.' } } }
      apiServiceMock.delete.mockRejectedValue(error)

      await expect(productService.remove(999)).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Product not found.')
    })
  })
})
