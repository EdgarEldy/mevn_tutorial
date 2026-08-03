import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import OrdersPage from './OrdersPage.vue'
import OrderList from '../components/OrderList.vue'
import OrderForm from '../components/OrderForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

vi.mock('../services/order.service', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))
const { default: orderService } = await import('../services/order.service')

vi.mock('@/features/customers/services/customer.service', () => ({
  default: { getAll: vi.fn().mockResolvedValue([{ id: 1, first_name: 'Jane', last_name: 'Doe' }]) },
}))
vi.mock('@/features/products/services/product.service', () => ({
  default: { getAll: vi.fn().mockResolvedValue([{ id: 1, product_name: 'Laptop', unit_price: 999.99 }]) },
}))

const orders = [
  {
    id: '1',
    quantity: 2,
    total: 1999.98,
    customer: { id: '1', first_name: 'Jane', last_name: 'Doe' },
    product: { id: '1', product_name: 'Laptop' },
  },
]

function mountPage() {
  return mount(OrdersPage, {
    global: { plugins: [createVuetify()] },
  })
}

describe('OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    orderService.getAll.mockResolvedValue(orders)
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, roles: [{ role_name: 'admin' }] }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('loads orders on mount and passes them to OrderList', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(orderService.getAll).toHaveBeenCalled()
    expect(wrapper.findComponent(OrderList).props('orders')).toEqual(orders)
  })

  it('opens the form in create mode when "New order" is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')

    const form = wrapper.findComponent(OrderForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('order')).toBe(null)
  })

  it('opens the form in edit mode when OrderList emits edit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(OrderList).vm.$emit('edit', orders[0])

    const form = wrapper.findComponent(OrderForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('order')).toEqual(orders[0])
  })

  it('creates an order and reloads when the form emits submit in create mode', async () => {
    orderService.create.mockResolvedValue({ id: '2', quantity: 1 })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(OrderForm).vm.$emit('submit', { customer_id: 1, product_id: 1, quantity: 1 })
    await flushPromises()

    expect(orderService.create).toHaveBeenCalledWith({ customer_id: 1, product_id: 1, quantity: 1 })
    expect(orderService.getAll).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(OrderForm).props('modelValue')).toBe(false)
  })

  it('updates an order and reloads when the form emits submit in edit mode', async () => {
    orderService.update.mockResolvedValue({ id: '1', quantity: 3 })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(OrderList).vm.$emit('edit', orders[0])
    await wrapper.findComponent(OrderForm).vm.$emit('submit', { customer_id: 1, product_id: 1, quantity: 3 })
    await flushPromises()

    expect(orderService.update).toHaveBeenCalledWith('1', { customer_id: 1, product_id: 1, quantity: 3 })
    expect(orderService.getAll).toHaveBeenCalledTimes(2)
  })

  it('keeps the form open when the submit fails', async () => {
    orderService.create.mockRejectedValue(new Error('boom'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await wrapper.findComponent(OrderForm).vm.$emit('submit', { customer_id: 1, product_id: 1, quantity: 1 })
    await flushPromises()

    expect(wrapper.findComponent(OrderForm).props('modelValue')).toBe(true)
  })

  it('opens the confirm dialog when OrderList emits delete', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(OrderList).vm.$emit('delete', orders[0])

    expect(wrapper.findComponent(ConfirmDialog).props('modelValue')).toBe(true)
  })

  it('removes the order and reloads when the confirm dialog emits confirm', async () => {
    orderService.remove.mockResolvedValue()
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(OrderList).vm.$emit('delete', orders[0])
    await wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(orderService.remove).toHaveBeenCalledWith('1')
    expect(orderService.getAll).toHaveBeenCalledTimes(2)
  })

  it('hides the "New order" button for a non-admin', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 2, roles: [{ role_name: 'user' }] }))
    setActivePinia(createPinia())
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).not.toContain('New order')
    expect(wrapper.findComponent(OrderList).props('isAdmin')).toBe(false)
  })
})
