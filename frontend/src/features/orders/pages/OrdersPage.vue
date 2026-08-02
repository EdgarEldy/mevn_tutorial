<script setup>
import { onMounted, ref } from 'vue'
import orderService from '../services/order.service'
import OrderList from '../components/OrderList.vue'
import OrderForm from '../components/OrderForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const orders = ref([])
const loading = ref(false)
const formOpen = ref(false)
const editingOrder = ref(null)
const confirmOpen = ref(false)
const orderToDelete = ref(null)

async function load() {
  loading.value = true
  try {
    orders.value = await orderService.getAll()
  } catch {
    // The service already toasted the error.
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingOrder.value = null
  formOpen.value = true
}

function openEdit(order) {
  editingOrder.value = order
  formOpen.value = true
}

async function handleSubmit(values) {
  try {
    if (editingOrder.value) {
      await orderService.update(editingOrder.value.id, values)
    } else {
      await orderService.create(values)
    }
    formOpen.value = false
    await load()
  } catch {
    // The service already toasted the error; keep the dialog open so the user can retry.
  }
}

function confirmDelete(order) {
  orderToDelete.value = order
  confirmOpen.value = true
}

async function handleConfirmDelete() {
  try {
    await orderService.remove(orderToDelete.value.id)
    await load()
  } catch {
    // The service already toasted the error.
  } finally {
    orderToDelete.value = null
  }
}

onMounted(load)
</script>

<template>
  <v-card>
    <v-card-title>Orders</v-card-title>
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-text>
      <div class="d-flex justify-end mb-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New order</v-btn>
      </div>

      <OrderList :orders="orders" @edit="openEdit" @delete="confirmDelete" />
    </v-card-text>

    <OrderForm v-model="formOpen" :order="editingOrder" @submit="handleSubmit" />
    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete order"
      :message="`Delete order #${orderToDelete?.id}? This cannot be undone.`"
      @confirm="handleConfirmDelete"
    />
  </v-card>
</template>
