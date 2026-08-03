import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import CustomerList from './CustomerList.vue'

const customers = [
  { id: 1, first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', telephone: '555-1234' },
  { id: 2, first_name: null, last_name: null, email: null, telephone: null },
]

describe('CustomerList', () => {
  it('renders each customer full name, email and telephone via the shared DataTable', () => {
    const wrapper = mount(CustomerList, {
      props: { customers },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('jane@example.com')
    expect(wrapper.text()).toContain('555-1234')
  })

  it('falls back to N/A for every column when a customer has no details filled in', () => {
    const wrapper = mount(CustomerList, {
      props: { customers: [customers[1]] },
      global: { plugins: [createVuetify()] },
    })

    const naCount = (wrapper.text().match(/N\/A/g) ?? []).length
    expect(naCount).toBe(3)
  })

  it('hides the edit/delete actions when isAdmin is false', () => {
    const wrapper = mount(CustomerList, {
      props: { customers, isAdmin: false },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Delete"]').exists()).toBe(false)
  })

  it('emits edit with the row when the edit action is clicked', async () => {
    const wrapper = mount(CustomerList, {
      props: { customers, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    await wrapper.find('button[aria-label="Edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([customers[0]])
  })

  it('emits delete with the row when the delete action is clicked', async () => {
    const wrapper = mount(CustomerList, {
      props: { customers, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    const deleteButtons = wrapper.findAll('button[aria-label="Delete"]')
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([customers[0]])
  })
})
