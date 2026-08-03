<script setup>
import { computed } from 'vue'
import DataTable from '@/components/DataTable.vue'

const props = defineProps({
  orders: { type: Array, required: true },
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete'])

// Recomputed only when the orders prop actually changes, not on every render.
const totalRevenue = computed(() => props.orders.reduce((sum, order) => sum + Number(order.total), 0))

// customer/product are nullable in the GraphQL schema (a resolver could return null for a
// dangling foreign key), so every column falls back instead of assuming they're always set.
function customerName(row) {
  if (!row.customer) return 'Unknown customer'
  const name = [row.customer.first_name, row.customer.last_name].filter(Boolean).join(' ')
  return name || `Customer #${row.customer.id}`
}

const columns = [
  { key: 'customer', header: 'Customer', value: (row) => customerName(row) },
  { key: 'product', header: 'Product', value: (row) => row.product?.product_name ?? 'Unknown product' },
  { key: 'quantity', header: 'Quantity', value: (row) => String(row.quantity) },
  { key: 'total', header: 'Total', value: (row) => `$${Number(row.total).toFixed(2)}` },
]

// UI-only role gating: hides the edit/delete actions for non-admins. The backend already
// enforces this for real via requireRole() on the mutations, so this is a UX nicety on
// top of a real backend boundary, not a substitute for one.
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
  <p class="text-body-2 text-medium-emphasis">Total revenue: ${{ totalRevenue.toFixed(2) }}</p>
  <DataTable
    :columns="columns"
    :actions="actions"
    :items="orders"
    search-label="Search orders"
    export-file-name="orders"
  />
</template>
