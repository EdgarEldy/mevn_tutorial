import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { nextTick } from 'vue'
import CategoryForm from './CategoryForm.vue'

// VDialog teleports its content to document.body, so wrapper.find()/wrapper.text()
// (which only search the component's own render tree) can't see it - interactions and
// assertions go through document.body directly instead. VDialog's own lazy-mount
// mechanics also add unpredictable extra async delay before vee-validate's handleSubmit
// (itself async, since it awaits the yup schema's validate()) actually resolves - a
// fixed number of nextTick()/flushPromises() calls isn't reliably enough, so assertions
// on the post-submit state use vi.waitFor() to poll until it settles instead of guessing.
function mountForm(props) {
  return mount(CategoryForm, {
    props: { modelValue: true, category: null, ...props },
    global: { plugins: [createVuetify()] },
    attachTo: document.body,
  })
}

describe('CategoryForm', () => {
  let wrapper

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('shows "New category" in create mode', async () => {
    wrapper = mountForm()
    await nextTick()

    expect(document.body.textContent).toContain('New category')
  })

  it('shows "Edit category" and pre-fills the name in edit mode', async () => {
    wrapper = mountForm({ category: { id: 1, category_name: 'Books' } })
    await nextTick()

    expect(document.body.textContent).toContain('Edit category')
    expect(document.querySelector('input').value).toBe('Books')
  })

  it('shows a validation error and does not emit submit when the name is empty', async () => {
    wrapper = mountForm()
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('Category name is required.')
    })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit with the form values when valid', async () => {
    wrapper = mountForm()
    await nextTick()

    const input = document.querySelector('input')
    input.value = 'New Category'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    document.querySelector('form').requestSubmit()

    await vi.waitFor(() => {
      expect(wrapper.emitted('submit')).toBeDefined()
    })
    expect(wrapper.emitted('submit')[0]).toEqual([{ category_name: 'New Category' }])
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
