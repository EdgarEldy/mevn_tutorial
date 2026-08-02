import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import CustomerForm from './CustomerForm.vue'

// Same VDialog + vee-validate timing considerations as CategoryForm.spec.js: content is
// teleported to document.body, and submit assertions use vi.waitFor() to poll for
// handleSubmit's async validation resolving rather than a fixed number of flushes.
function mountForm(props) {
  return mount(CustomerForm, {
    props: { modelValue: true, customer: null, ...props },
    global: { plugins: [createVuetify()] },
    attachTo: document.body,
  })
}

describe('CustomerForm', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows "New customer" in create mode', async () => {
    wrapper = mountForm()
    await nextTick()

    expect(document.body.textContent).toContain('New customer')
  })

  it('shows "Edit customer" and pre-fills the fields in edit mode', async () => {
    const customer = { id: 1, first_name: 'Jane', last_name: 'Doe', telephone: '555-1234', email: 'jane@example.com', address: '1 Main St' }
    wrapper = mountForm({ customer })
    await nextTick()

    expect(document.body.textContent).toContain('Edit customer')
    const inputs = document.querySelectorAll('input')
    expect(inputs[0].value).toBe('Jane')
    expect(inputs[1].value).toBe('Doe')
    expect(inputs[3].value).toBe('jane@example.com')
  })

  it('emits submit with every field stripped when all fields are left empty', async () => {
    wrapper = mountForm()
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })
    expect(wrapper.emitted('submit')[0]).toEqual([{}])
  })

  it('shows a validation error and does not emit submit when the email is not valid', async () => {
    wrapper = mountForm()
    await nextTick()

    const emailInput = document.querySelectorAll('input')[3]
    emailInput.value = 'not-an-email'
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Must be a valid email address.')
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows a validation error and does not emit submit when the telephone has disallowed characters', async () => {
    wrapper = mountForm()
    await nextTick()

    const telephoneInput = document.querySelectorAll('input')[2]
    telephoneInput.value = 'call me maybe'
    telephoneInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Telephone may only contain digits, spaces and + - . ( )')
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit with only the filled-in fields, stripping the blank ones', async () => {
    wrapper = mountForm()
    await nextTick()

    const firstNameInput = document.querySelectorAll('input')[0]
    firstNameInput.value = 'Jane'
    firstNameInput.dispatchEvent(new Event('input', { bubbles: true }))
    const emailInput = document.querySelectorAll('input')[3]
    emailInput.value = 'jane@example.com'
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })
    expect(wrapper.emitted('submit')[0]).toEqual([{ first_name: 'Jane', email: 'jane@example.com' }])
  })

  it('emits update:modelValue false on cancel', async () => {
    wrapper = mountForm()
    await nextTick()

    const cancelButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Cancel')
    cancelButton.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })
})
