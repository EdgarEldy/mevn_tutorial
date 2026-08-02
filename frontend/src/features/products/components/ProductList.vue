<script setup>
import DataTable from '@/components/DataTable.vue'

defineProps({
  products: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'delete'])

// The backend already resolves each product's category (see product.repository.js's
// include), so the category name is read straight off the row instead of an extra request.
const columns = [
  { key: 'product_name', header: 'Name', value: (row) => row.product_name },
  { key: 'category_name', header: 'Category', value: (row) => row.category?.category_name ?? 'Uncategorized' },
  { key: 'unit_price', header: 'Unit price', value: (row) => `$${Number(row.unit_price).toFixed(2)}` },
]

// No isAdmin gating yet: deferred to feature/frontend/auth, same as CategoryList.vue.
const actions = [
  { icon: 'mdi-pencil', label: 'Edit', handler: (row) => emit('edit', row) },
  { icon: 'mdi-delete', label: 'Delete', handler: (row) => emit('delete', row) },
]
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
