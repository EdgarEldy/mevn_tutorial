import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import ProductForm from './ProductForm.vue'

vi.mock('@/features/categories/services/category.service', () => ({
  default: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, category_name: 'Electronics' },
      { id: 2, category_name: 'Furniture' },
    ]),
  },
}))

// Same VDialog + vee-validate timing considerations as CategoryForm.spec.js: content is
// teleported to document.body, and handleSubmit's async validation needs vi.waitFor()
// rather than a fixed number of flushes to observe reliably. VSelect has no plain native
// input to drive with DOM events, so category selection is set by emitting update:modelValue
// on the VSelect component directly rather than simulating a full menu click-through.
function mountForm(props) {
  return mount(ProductForm, {
    props: { modelValue: true, product: null, ...props },
    global: { plugins: [createVuetify()] },
    attachTo: document.body,
  })
}

describe('ProductForm', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows "New product" in create mode', async () => {
    wrapper = mountForm()
    await flushPromises()

    expect(document.body.textContent).toContain('New product')
  })

  it('shows "Edit product" and pre-fills the fields in edit mode', async () => {
    const product = { id: 1, product_name: 'Laptop', unit_price: 999.99, category_id: 1 }
    wrapper = mountForm({ product })
    await flushPromises()

    expect(document.body.textContent).toContain('Edit product')
    expect(document.querySelectorAll('input')[0].value).toBe('Laptop')
    expect(document.querySelectorAll('input')[1].value).toBe('999.99')
  })

  it('shows validation errors and does not emit submit when required fields are empty', async () => {
    wrapper = mountForm()
    await flushPromises()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Product name is required.')
    })
    expect(document.body.textContent).toContain('Unit price is required.')
    expect(document.body.textContent).toContain('Category is required.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows an error when the selected category no longer exists', async () => {
    wrapper = mountForm()
    await flushPromises()

    const nameInput = document.querySelectorAll('input')[0]
    nameInput.value = 'Laptop'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    const priceInput = document.querySelectorAll('input')[1]
    priceInput.value = '999.99'
    priceInput.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.findComponent({ name: 'VSelect' }).vm.$emit('update:modelValue', 999)
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Selected category no longer exists.')
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit with the form values when valid', async () => {
    wrapper = mountForm()
    await flushPromises()

    const nameInput = document.querySelectorAll('input')[0]
    nameInput.value = 'Laptop'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    const priceInput = document.querySelectorAll('input')[1]
    priceInput.value = '999.99'
    priceInput.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.findComponent({ name: 'VSelect' }).vm.$emit('update:modelValue', 1)
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })
    expect(wrapper.emitted('submit')[0]).toEqual([{ product_name: 'Laptop', unit_price: 999.99, category_id: 1 }])
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
