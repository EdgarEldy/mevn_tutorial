<script setup>
import { computed } from 'vue'
import DataTable from '@/components/DataTable.vue'

const props = defineProps({
  products: { type: Array, required: true },
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

// The backend already resolves each product's category (see product.repository.js's
// include), so the category name is read straight off the row instead of an extra request.
const columns = [
  { key: 'product_name', header: 'Name', value: (row) => row.product_name },
  { key: 'category_name', header: 'Category', value: (row) => row.category?.category_name ?? 'Uncategorized' },
  { key: 'unit_price', header: 'Unit price', value: (row) => `$${Number(row.unit_price).toFixed(2)}` },
]

// UI-only role gating: hides the edit/delete actions for non-admins. The backend already
// enforces this for real on the mutating routes (see authorize.middleware.js), so this is
// a UX nicety on top of a real backend boundary, not a substitute for one.
const actions = computed(() =>
  props.isAdmin
    ? [
        { icon: 'mdi-pencil', label: 'Edit', handler: (row) => emit('edit', row) },
        { icon: 'mdi-delete', label: 'Delete', handler: (row) => emit('delete', row) },
      ]
    : [],
)
</script>

<template>
  <DataTable
    :columns="columns"
    :actions="actions"
    :items="products"
    search-label="Search products"
    export-file-name="products"
  />
</template>
