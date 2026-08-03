<script setup>
import { computed } from 'vue'
import DataTable from '@/components/DataTable.vue'

const props = defineProps({
  categories: { type: Array, required: true },
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

const columns = [{ key: 'category_name', header: 'Name', value: (row) => row.category_name }]

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
    :items="categories"
    search-label="Search categories"
    export-file-name="categories"
  />
</template>
