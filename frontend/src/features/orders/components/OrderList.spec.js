import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import OrderList from './OrderList.vue'

const orders = [
  {
    id: '1',
    quantity: 2,
    total: 1999.98,
    customer: { id: '1', first_name: 'Jane', last_name: 'Doe' },
    product: { id: '1', product_name: 'Laptop' },
  },
  {
    id: '2',
    quantity: 1,
    total: 149.5,
    customer: null,
    product: null,
  },
]

describe('OrderList', () => {
  it('renders customer name, product, quantity and formatted total via the shared DataTable', () => {
    const wrapper = mount(OrderList, {
      props: { orders },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('Laptop')
    expect(wrapper.text()).toContain('$1999.98')
  })

  it('renders the total revenue summed across every order', () => {
    const wrapper = mount(OrderList, {
      props: { orders },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Total revenue: $2149.48')
  })

  it('falls back to Unknown customer/product when either is null', () => {
    const wrapper = mount(OrderList, {
      props: { orders: [orders[1]] },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Unknown customer')
    expect(wrapper.text()).toContain('Unknown product')
    expect(wrapper.text()).toContain('$149.50')
  })

  it('hides the edit/delete actions when isAdmin is false', () => {
    const wrapper = mount(OrderList, {
      props: { orders, isAdmin: false },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Delete"]').exists()).toBe(false)
  })

  it('emits edit with the row when the edit action is clicked', async () => {
    const wrapper = mount(OrderList, {
      props: { orders, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    await wrapper.find('button[aria-label="Edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([orders[0]])
  })

  it('emits delete with the row when the delete action is clicked', async () => {
    const wrapper = mount(OrderList, {
      props: { orders, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    const deleteButtons = wrapper.findAll('button[aria-label="Delete"]')
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([orders[0]])
  })
})
