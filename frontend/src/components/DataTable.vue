<script setup>
import { computed, ref } from 'vue'

// columns: [{ key, header, value: (row) => string }]
// actions: [{ icon, label, handler: (row) => void }]
const props = defineProps({
  columns: { type: Array, required: true },
  actions: { type: Array, default: () => [] },
  items: { type: Array, required: true },
  searchLabel: { type: String, default: 'Search' },
  exportFileName: { type: String, default: 'export' },
})

const search = ref('')

const headers = computed(() => [
  ...props.columns.map((column) => ({ title: column.header, key: column.key })),
  ...(props.actions.length ? [{ title: '', key: 'actions', sortable: false }] : []),
])

// v-data-table's default quick-filter only inspects each item's own raw values, which
// doesn't match what's actually rendered per column (see the #item.<key> slots below,
// each backed by a column.value() transform). Filtering through the same value()
// functions keeps search consistent with what the user can see on screen.
function filterItems(_value, query, item) {
  if (!query) return true
  const needle = query.toString().toLowerCase()
  const row = item.raw ?? item
  return props.columns.some((column) => column.value(row).toLowerCase().includes(needle))
}

async function exportPdf() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const doc = new jsPDF()
  autoTable(doc, {
    head: [props.columns.map((column) => column.header)],
    body: props.items.map((row) => props.columns.map((column) => column.value(row))),
  })
  doc.save(`${props.exportFileName}.pdf`)
}
</script>

<template>
  <div class="d-flex align-center ga-2 mb-2">
    <v-text-field
      v-model="search"
      :label="searchLabel"
      prepend-inner-icon="mdi-magnify"
      density="compact"
      variant="outlined"
      hide-details
      class="flex-grow-1"
    />
    <v-btn prepend-icon="mdi-file-pdf-box" variant="outlined" @click="exportPdf">Export PDF</v-btn>
  </div>

  <v-data-table :headers="headers" :items="items" :search="search" :custom-filter="filterItems">
    <template v-for="column in columns" :key="column.key" #[`item.${column.key}`]="{ item }">
      {{ column.value(item) }}
    </template>

    <template v-if="actions.length" #item.actions="{ item }">
      <v-btn
        v-for="action in actions"
        :key="action.label"
        :icon="action.icon"
        :aria-label="action.label"
        variant="text"
        density="comfortable"
        @click="action.handler(item)"
      />
    </template>

    <template #no-data>
      <span>No data.</span>
    </template>
  </v-data-table>
</template>
