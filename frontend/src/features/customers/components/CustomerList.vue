<script setup>
import DataTable from '@/components/DataTable.vue'

defineProps({
  customers: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'delete'])

// Every field can be null, so each column falls back to a placeholder instead of
// rendering nothing when a customer was created without that detail filled in.
function fullName(row) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ')
  return name || 'N/A'
}

const columns = [
  { key: 'name', header: 'Name', value: (row) => fullName(row) },
  { key: 'email', header: 'Email', value: (row) => row.email ?? 'N/A' },
  { key: 'telephone', header: 'Telephone', value: (row) => row.telephone ?? 'N/A' },
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
    :items="customers"
    search-label="Search customers"
    export-file-name="customers"
  />
</template>
