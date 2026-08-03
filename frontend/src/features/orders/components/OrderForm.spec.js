import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import OrderForm from './OrderForm.vue'

vi.mock('@/features/customers/services/customer.service', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, first_name: 'Jane', last_name: 'Doe' },
      { id: 2, first_name: null, last_name: null },
    ]),
  },
}))
vi.mock('@/features/products/services/product.service', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue([{ id: 1, product_name: 'Laptop', unit_price: 999.99 }]),
  },
}))

// Same VDialog + vee-validate timing considerations as CategoryForm.spec.js/ProductForm.spec.js.
// VSelect has no plain native input to drive with DOM events, so customer/product selection
// is set by emitting update:modelValue on the VSelect components directly.
function mountForm(props) {
  return mount(OrderForm, {
    props: { modelValue: true, order: null, ...props },
    global: { plugins: [createVuetify()] },
    attachTo: document.body,
  })
}

describe('OrderForm', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows "New order" in create mode', async () => {
    wrapper = mountForm()
    await flushPromises()

    expect(document.body.textContent).toContain('New order')
  })

  it('shows "Edit order" and pre-fills the fields in edit mode', async () => {
    const order = {
      id: '1',
      quantity: 3,
      customer: { id: '1', first_name: 'Jane', last_name: 'Doe' },
      product: { id: '1', product_name: 'Laptop' },
    }
    wrapper = mountForm({ order })
    await flushPromises()

    expect(document.body.textContent).toContain('Edit order')
    expect(document.querySelector('input[type="number"]').value).toBe('3')
  })

  it('shows validation errors and does not emit submit when no customer/product is selected', async () => {
    wrapper = mountForm()
    await flushPromises()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Customer is required.')
    })
    expect(document.body.textContent).toContain('Product is required.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows a validation error and does not emit submit when the quantity is cleared', async () => {
    wrapper = mountForm()
    await flushPromises()

    const quantityInput = document.querySelector('input[type="number"]')
    quantityInput.value = ''
    quantityInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Quantity must be a number.')
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows an error when the selected customer or product no longer exists', async () => {
    wrapper = mountForm()
    await flushPromises()

    await wrapper.findAllComponents({ name: 'VSelect' })[0].vm.$emit('update:modelValue', 999)
    await wrapper.findAllComponents({ name: 'VSelect' })[1].vm.$emit('update:modelValue', 999)
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Selected customer no longer exists.')
    })
    expect(document.body.textContent).toContain('Selected product no longer exists.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit with numeric-cast values when valid', async () => {
    wrapper = mountForm()
    await flushPromises()

    await wrapper.findAllComponents({ name: 'VSelect' })[0].vm.$emit('update:modelValue', 1)
    await wrapper.findAllComponents({ name: 'VSelect' })[1].vm.$emit('update:modelValue', 1)
    const quantityInput = document.querySelector('input[type="number"]')
    quantityInput.value = '2'
    quantityInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })
    expect(wrapper.emitted('submit')[0]).toEqual([{ customer_id: 1, product_id: 1, quantity: 2 }])
  })

  it('shows a live estimated total based on the selected product and quantity', async () => {
    wrapper = mountForm()
    await flushPromises()

    await wrapper.findAllComponents({ name: 'VSelect' })[1].vm.$emit('update:modelValue', 1)
    const quantityInput = document.querySelector('input[type="number"]')
    quantityInput.value = '2'
    quantityInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(document.body.textContent).toContain('Estimated total: $1999.98')
  })

  it('emits update:modelValue false on cancel', async () => {
    wrapper = mountForm()
    await flushPromises()

    const cancelButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Cancel')
    cancelButton.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })
})
