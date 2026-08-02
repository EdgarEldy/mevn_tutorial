import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import ProductList from './ProductList.vue'

const products = [
  { id: 1, product_name: 'Laptop', unit_price: 999.99, category: { id: 1, category_name: 'Electronics' } },
  { id: 2, product_name: 'Desk', unit_price: 149.5, category: { id: 2, category_name: 'Furniture' } },
]

describe('ProductList', () => {
  it('renders each product name, category and formatted unit price via the shared DataTable', () => {
    const wrapper = mount(ProductList, {
      props: { products },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Laptop')
    expect(wrapper.text()).toContain('Electronics')
    expect(wrapper.text()).toContain('$999.99')
    expect(wrapper.text()).toContain('Desk')
    expect(wrapper.text()).toContain('$149.50')
  })

  it('falls back to "Uncategorized" when a product has no category', () => {
    const wrapper = mount(ProductList, {
      props: { products: [{ id: 3, product_name: 'Mystery item', unit_price: 1, category: null }] },
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.text()).toContain('Uncategorized')
  })

  it('emits edit with the row when the edit action is clicked', async () => {
    const wrapper = mount(ProductList, {
      props: { products },
      global: { plugins: [createVuetify()] },
    })

    await wrapper.find('button[aria-label="Edit"]').trigger('click')

    expect(wrapper.emitted('edit')[0]).toEqual([products[0]])
  })

  it('emits delete with the row when the delete action is clicked', async () => {
    const wrapper = mount(ProductList, {
      props: { products },
      global: { plugins: [createVuetify()] },
    })

    const deleteButtons = wrapper.findAll('button[aria-label="Delete"]')
    await deleteButtons[0].trigger('click')

    expect(wrapper.emitted('delete')[0]).toEqual([products[0]])
  })
})
