import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import CategoryList from './CategoryList.vue'

const categories = [
  { id: 1, category_name: 'Books' },
  { id: 2, category_name: 'Electronics' },
]

describe('CategoryList', () => {
  it('renders each category name via the shared DataTable', () => {
    const wrapper = mount(CategoryList, {
      props: { categories },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Books')
    expect(wrapper.text()).toContain('Electronics')
  })

  it('hides the edit/delete actions when isAdmin is false', () => {
    const wrapper = mount(CategoryList, {
      props: { categories, isAdmin: false },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.find('button[aria-label="Edit"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Delete"]').exists()).toBe(false)
  })

  it('emits edit with the row when the edit action is clicked', async () => {
    const wrapper = mount(CategoryList, {
      props: { categories, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    await wrapper.find('button[aria-label="Edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([categories[0]])
  })

  it('emits delete with the row when the delete action is clicked', async () => {
    const wrapper = mount(CategoryList, {
      props: { categories, isAdmin: true },
      global: { plugins: [createVuetify()] },
    })

    const deleteButtons = wrapper.findAll('button[aria-label="Delete"]')
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([categories[0]])
  })
})
