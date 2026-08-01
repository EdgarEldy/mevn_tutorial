<script setup>
import DataTable from '@/components/DataTable.vue'

defineProps({
  categories: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'delete'])

const columns = [{ key: 'category_name', header: 'Name', value: (row) => row.category_name }]

// No isAdmin gating yet: the auth store is still core-architecture's placeholder
// (isAdmin always false) until feature/frontend/auth lands and retrofits this,
// matching how the backend's authorize() middleware was retrofitted onto these
// routes in feature/api/auth rather than built upfront.
const actions = [
  { icon: 'mdi-pencil', label: 'Edit', handler: (row) => emit('edit', row) },
  { icon: 'mdi-delete', label: 'Delete', handler: (row) => emit('delete', row) },
]
</script>

<template>
  <DataTable
    :columns="columns"
    :actions="actions"
    :items="categories"
    search-label="Search categories"
    export-file-name="categories"
  />
</template>
