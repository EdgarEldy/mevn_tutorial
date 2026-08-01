import { describe, it, expect, vi, beforeEach } from 'vitest'

const toastSpy = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toastSpy }))

const apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
vi.mock('@/services/api.service', () => ({ default: apiServiceMock }))

const { default: categoryService } = await import('./category.service')

describe('category.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAll', () => {
    it('returns response.data.data unwrapped when the request succeeds', async () => {
      const categories = [
        { id: 1, category_name: 'Books' },
        { id: 2, category_name: 'Electronics' },
      ]
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK', data: categories } })

      const result = await categoryService.getAll()

      expect(apiServiceMock.get).toHaveBeenCalledWith('/categories')
      expect(result).toEqual(categories)
    })

    it('returns an empty array when response.data.data is missing', async () => {
      apiServiceMock.get.mockResolvedValue({ data: { success: true, message: 'OK' } })

      const result = await categoryService.getAll()

      expect(result).toEqual([])
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Something broke' } } }
      apiServiceMock.get.mockRejectedValue(error)

      await expect(categoryService.getAll()).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Something broke')
    })
  })

  describe('create', () => {
    it('posts the payload, toasts success and returns the created category', async () => {
      const input = { category_name: 'Books' }
      const created = { id: 1, category_name: 'Books' }
      apiServiceMock.post.mockResolvedValue({ data: { success: true, message: 'Category created.', data: created } })

      const result = await categoryService.create(input)

      expect(apiServiceMock.post).toHaveBeenCalledWith('/categories', input)
      expect(toastSpy.success).toHaveBeenCalledWith('Category created.')
      expect(result).toEqual(created)
    })

    it('toasts the joined validation error messages and rethrows on 422', async () => {
      const error = {
        response: {
          data: { success: false, message: 'Validation failed.', errors: [{ msg: 'category_name is required' }] },
        },
      }
      apiServiceMock.post.mockRejectedValue(error)

      await expect(categoryService.create({ category_name: '' })).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('category_name is required')
      expect(toastSpy.success).not.toHaveBeenCalled()
    })

    it('toasts a generic fallback message when the error has no response body', async () => {
      apiServiceMock.post.mockRejectedValue({})

      await expect(categoryService.create({ category_name: 'Books' })).rejects.toBeDefined()
      expect(toastSpy.error).toHaveBeenCalledWith('Something went wrong. Please try again.')
    })
  })

  describe('update', () => {
    it('puts the payload, toasts success and returns the updated category', async () => {
      const updated = { id: 1, category_name: 'Updated' }
      apiServiceMock.put.mockResolvedValue({ data: { success: true, message: 'Category updated.', data: updated } })

      const result = await categoryService.update(1, { category_name: 'Updated' })

      expect(apiServiceMock.put).toHaveBeenCalledWith('/categories/1', { category_name: 'Updated' })
      expect(toastSpy.success).toHaveBeenCalledWith('Category updated.')
      expect(result).toEqual(updated)
    })
  })

  describe('remove', () => {
    it('deletes by id and toasts success', async () => {
      apiServiceMock.delete.mockResolvedValue({ data: { success: true, message: 'Category deleted.' } })

      await categoryService.remove(1)

      expect(apiServiceMock.delete).toHaveBeenCalledWith('/categories/1')
      expect(toastSpy.success).toHaveBeenCalledWith('Category deleted.')
    })

    it('toasts the error message and rethrows when the request fails', async () => {
      const error = { response: { data: { success: false, message: 'Category not found.' } } }
      apiServiceMock.delete.mockRejectedValue(error)

      await expect(categoryService.remove(999)).rejects.toBe(error)
      expect(toastSpy.error).toHaveBeenCalledWith('Category not found.')
    })
  })
})
