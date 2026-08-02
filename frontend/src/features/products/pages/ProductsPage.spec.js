import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ProductsPage from './ProductsPage.vue'
import ProductList from '../components/ProductList.vue'
import ProductForm from '../components/ProductForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

vi.mock('../services/product.service', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))
const { default: productService } = await import('../services/product.service')

vi.mock('@/features/categories/services/category.service', () => ({
  default: { getAll: vi.fn().mockResolvedValue([{ id: 1, category_name: 'Electronics' }]) },
}))

const products = [{ id: 1, product_name: 'Laptop', unit_price: 999.99, category_id: 1 }]

function mountPage() {
  return mount(ProductsPage, {
    global: { plugins: [createVuetify()] },
  })
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    productService.getAll.mockResolvedValue(products)
  })

  it('loads products on mount and passes them to ProductList', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(productService.getAll).toHaveBeenCalled()
    expect(wrapper.findComponent(ProductList).props('products')).toEqual(products)
  })

  it('opens the form in create mode when "New product" is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')

    const form = wrapper.findComponent(ProductForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('product')).toBe(null)
  })

  it('opens the form in edit mode when ProductList emits edit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(ProductList).vm.$emit('edit', products[0])

    const form = wrapper.findComponent(ProductForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('product')).toEqual(products[0])
  })

  it('creates a product and reloads when the form emits submit in create mode', async () => {
    productService.create.mockResolvedValue({ id: 2, product_name: 'Desk', unit_price: 149.5, category_id: 1 })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(ProductForm).vm.$emit('submit', { product_name: 'Desk', unit_price: 149.5, category_id: 1 })
    await flushPromises()

    expect(productService.create).toHaveBeenCalledWith({ product_name: 'Desk', unit_price: 149.5, category_id: 1 })
    expect(productService.getAll).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(ProductForm).props('modelValue')).toBe(false)
  })

  it('updates a product and reloads when the form emits submit in edit mode', async () => {
    productService.update.mockResolvedValue({ id: 1, product_name: 'Updated', unit_price: 899.99, category_id: 1 })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(ProductList).vm.$emit('edit', products[0])
    await wrapper.findComponent(ProductForm).vm.$emit('submit', { product_name: 'Updated', unit_price: 899.99, category_id: 1 })
    await flushPromises()

    expect(productService.update).toHaveBeenCalledWith(1, { product_name: 'Updated', unit_price: 899.99, category_id: 1 })
    expect(productService.getAll).toHaveBeenCalledTimes(2)
  })

  it('keeps the form open when the submit fails', async () => {
    productService.create.mockRejectedValue(new Error('boom'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await wrapper.findComponent(ProductForm).vm.$emit('submit', { product_name: 'Desk', unit_price: 149.5, category_id: 1 })
    await flushPromises()

    expect(wrapper.findComponent(ProductForm).props('modelValue')).toBe(true)
  })

  it('opens the confirm dialog when ProductList emits delete', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(ProductList).vm.$emit('delete', products[0])

    expect(wrapper.findComponent(ConfirmDialog).props('modelValue')).toBe(true)
  })

  it('removes the product and reloads when the confirm dialog emits confirm', async () => {
    productService.remove.mockResolvedValue()
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(ProductList).vm.$emit('delete', products[0])
    await wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(productService.remove).toHaveBeenCalledWith(1)
    expect(productService.getAll).toHaveBeenCalledTimes(2)
  })
})
