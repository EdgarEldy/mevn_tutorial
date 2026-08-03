import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import CategoriesPage from './CategoriesPage.vue'
import CategoryList from '../components/CategoryList.vue'
import CategoryForm from '../components/CategoryForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

vi.mock('../services/category.service', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))
const { default: categoryService } = await import('../services/category.service')

const categories = [{ id: 1, category_name: 'Books' }]

function mountPage() {
  return mount(CategoriesPage, {
    global: { plugins: [createVuetify()] },
  })
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    categoryService.getAll.mockResolvedValue(categories)
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', JSON.stringify({ id: 1, roles: [{ role_name: 'admin' }] }))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('loads categories on mount and passes them to CategoryList', async () => {
    const wrapper = mountPage()
    await flushPromises()

    expect(categoryService.getAll).toHaveBeenCalled()
    expect(wrapper.findComponent(CategoryList).props('categories')).toEqual(categories)
  })

  it('opens the form in create mode when "New category" is clicked', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')

    const form = wrapper.findComponent(CategoryForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('category')).toBe(null)
  })

  it('opens the form in edit mode when CategoryList emits edit', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CategoryList).vm.$emit('edit', categories[0])

    const form = wrapper.findComponent(CategoryForm)
    expect(form.props('modelValue')).toBe(true)
    expect(form.props('category')).toEqual(categories[0])
  })

  it('creates a category and reloads when the form emits submit in create mode', async () => {
    categoryService.create.mockResolvedValue({ id: 2, category_name: 'New' })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CategoryForm).vm.$emit('submit', { category_name: 'New' })
    await flushPromises()

    expect(categoryService.create).toHaveBeenCalledWith({ category_name: 'New' })
    expect(categoryService.getAll).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(CategoryForm).props('modelValue')).toBe(false)
  })

  it('updates a category and reloads when the form emits submit in edit mode', async () => {
    categoryService.update.mockResolvedValue({ id: 1, category_name: 'Updated' })
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CategoryList).vm.$emit('edit', categories[0])
    await wrapper.findComponent(CategoryForm).vm.$emit('submit', { category_name: 'Updated' })
    await flushPromises()

    expect(categoryService.update).toHaveBeenCalledWith(1, { category_name: 'Updated' })
    expect(categoryService.getAll).toHaveBeenCalledTimes(2)
  })

  it('keeps the form open when the submit fails', async () => {
    categoryService.create.mockRejectedValue(new Error('boom'))
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await wrapper.findComponent(CategoryForm).vm.$emit('submit', { category_name: 'New' })
    await flushPromises()

    expect(wrapper.findComponent(CategoryForm).props('modelValue')).toBe(true)
  })

  it('opens the confirm dialog when CategoryList emits delete', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CategoryList).vm.$emit('delete', categories[0])

    expect(wrapper.findComponent(ConfirmDialog).props('modelValue')).toBe(true)
  })

  it('removes the category and reloads when the confirm dialog emits confirm', async () => {
    categoryService.remove.mockResolvedValue()
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findComponent(CategoryList).vm.$emit('delete', categories[0])
    await wrapper.findComponent(ConfirmDialog).vm.$emit('confirm')
    await flushPromises()

    expect(categoryService.remove).toHaveBeenCalledWith(1)
    expect(categoryService.getAll).toHaveBeenCalledTimes(2)
  })

  it('hides the "New category" button for a non-admin', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 2, roles: [{ role_name: 'user' }] }))
    setActivePinia(createPinia())
    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.text()).not.toContain('New category')
    expect(wrapper.findComponent(CategoryList).props('isAdmin')).toBe(false)
  })
})
