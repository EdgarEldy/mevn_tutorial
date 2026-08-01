import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import DataTable from './DataTable.vue'

const columns = [
  { key: 'name', header: 'Name', value: (row) => row.name },
  { key: 'price', header: 'Price', value: (row) => `$${row.price}` },
]

const items = [
  { id: 1, name: 'Laptop', price: 999 },
  { id: 2, name: 'Mouse', price: 20 },
]

function mountTable(props = {}) {
  return mount(DataTable, {
    props: { columns, items, ...props },
    global: { plugins: [createVuetify()] },
  })
}

describe('DataTable', () => {
  it('renders a header per column plus each row through its value() transform', () => {
    const wrapper = mountTable()

    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Price')
    expect(wrapper.text()).toContain('Laptop')
    expect(wrapper.text()).toContain('$999')
    expect(wrapper.text()).toContain('$20')
  })

  it('filters rows using each column value() function when searching', async () => {
    const wrapper = mountTable()

    await wrapper.find('input').setValue('mouse')

    expect(wrapper.text()).toContain('Mouse')
    expect(wrapper.text()).not.toContain('Laptop')
  })

  it('renders an actions column and calls the handler with the row', async () => {
    const handler = vi.fn()
    const wrapper = mountTable({ actions: [{ icon: 'mdi-pencil', label: 'Edit', handler }] })

    await wrapper.find('button[aria-label="Edit"]').trigger('click')

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it('exports a PDF using jsPDF + autoTable when the export button is clicked', async () => {
    const save = vi.fn()
    const autoTable = vi.fn()
    vi.doMock('jspdf', () => ({ default: vi.fn(() => ({ save })) }))
    vi.doMock('jspdf-autotable', () => ({ default: autoTable }))
    vi.resetModules()
    const { default: FreshDataTable } = await import('./DataTable.vue')

    const wrapper = mount(FreshDataTable, {
      props: { columns, items },
      global: { plugins: [createVuetify()] },
    })

    await wrapper.find('button', { text: 'Export PDF' })
    const exportButton = wrapper.findAll('button').find((b) => b.text().includes('Export PDF'))
    await exportButton.trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(autoTable).toHaveBeenCalled()
    expect(save).toHaveBeenCalledWith('export.pdf')

    vi.doUnmock('jspdf')
    vi.doUnmock('jspdf-autotable')
  })
})
