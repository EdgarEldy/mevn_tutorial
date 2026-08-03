<script setup>
import { computed } from 'vue'
import DataTable from '@/components/DataTable.vue'

const props = defineProps({
  customers: { type: Array, required: true },
  isAdmin: { type: Boolean, default: false },
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
    :items="customers"
    search-label="Search customers"
    export-file-name="customers"
  />
</template>
