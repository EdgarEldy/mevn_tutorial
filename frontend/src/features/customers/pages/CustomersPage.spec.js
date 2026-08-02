import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import CustomersPage from './CustomersPage.vue'
import CustomerList from '../components/CustomerList.vue'
import CustomerForm from '../components/CustomerForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

vi.mock('../services/customer.service', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))
const { default: customerService } = await import('../services/customer.service')

const customers = [{ id: 1, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }]

function mountPage() {
  return mount(CustomersPage, {
    global: { plugins: [createVuetify()] },
  })
}

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    customerService.getAll.mockResolvedValue(customers)
  })

  it('loads customers on mount and passes them to CustomerList', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(customerService.getAll).toHaveBeenCalled()
    expect(wrapper.findComponent(CustomerList).props('customers')).toEqual(customers)
  })

  it('opens the form in create mode when "New customer" is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')

    const form = wrapper.findComponent(CustomerForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('customer')).toBe(null)
  })

  it('opens the form in edit mode when CustomerList emits edit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CustomerList).vm.$emit('edit', customers[0])

    const form = wrapper.findComponent(CustomerForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('customer')).toEqual(customers[0])
  })

  it('creates a customer and reloads when the form emits submit in create mode', async () => {
    customerService.create.mockResolvedValue({ id: 2, first_name: 'John' })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CustomerForm).vm.$emit('submit', { first_name: 'John' })
    await flushPromises()

    expect(customerService.create).toHaveBeenCalledWith({ first_name: 'John' })
    expect(customerService.getAll).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(CustomerForm).props('modelValue')).toBe(false)
  })

  it('updates a customer and reloads when the form emits submit in edit mode', async () => {
    customerService.update.mockResolvedValue({ id: 1, first_name: 'Updated' })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CustomerList).vm.$emit('edit', customers[0])
    await wrapper.findComponent(CustomerForm).vm.$emit('submit', { first_name: 'Updated' })
    await flushPromises()

    expect(customerService.update).toHaveBeenCalledWith(1, { first_name: 'Updated' })
    expect(customerService.getAll).toHaveBeenCalledTimes(2)
  })

  it('keeps the form open when the submit fails', async () => {
    customerService.create.mockRejectedValue(new Error('boom'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await wrapper.findComponent(CustomerForm).vm.$emit('submit', { first_name: 'John' })
    await flushPromises()

    expect(wrapper.findComponent(CustomerForm).props('modelValue')).toBe(true)
  })

  it('opens the confirm dialog when CustomerList emits delete', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CustomerList).vm.$emit('delete', customers[0])

    expect(wrapper.findComponent(ConfirmDialog).props('modelValue')).toBe(true)
  })

  it('removes the customer and reloads when the confirm dialog emits confirm', async () => {
    customerService.remove.mockResolvedValue()
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CustomerList).vm.$emit('delete', customers[0])
    await wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(customerService.remove).toHaveBeenCalledWith(1)
    expect(customerService.getAll).toHaveBeenCalledTimes(2)
  })
})
