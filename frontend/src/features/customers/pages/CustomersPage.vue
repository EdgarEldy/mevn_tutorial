<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import customerService from '../services/customer.service'
import CustomerList from '../components/CustomerList.vue'
import CustomerForm from '../components/CustomerForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth.store'

const { isAdmin } = storeToRefs(useAuthStore())

const customers = ref([])
const loading = ref(false)
const formOpen = ref(false)
const editingCustomer = ref(null)
const confirmOpen = ref(false)
const customerToDelete = ref(null)

async function load() {
  loading.value = true
  try {
    customers.value = await customerService.getAll()
  } catch {
    // The service already toasted the error.
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingCustomer.value = null
  formOpen.value = true
}

function openEdit(customer) {
  editingCustomer.value = customer
  formOpen.value = true
}

async function handleSubmit(values) {
  try {
    if (editingCustomer.value) {
      await customerService.update(editingCustomer.value.id, values)
    } else {
      await customerService.create(values)
    }
    formOpen.value = false
    await load()
  } catch {
    // The service already toasted the error; keep the dialog open so the user can retry.
  }
}

function confirmDelete(customer) {
  customerToDelete.value = customer
  confirmOpen.value = true
}

async function handleConfirmDelete() {
  try {
    await customerService.remove(customerToDelete.value.id)
    await load()
  } catch {
    // The service already toasted the error.
  } finally {
    customerToDelete.value = null
  }
}

onMounted(load)
</script>

<template>
  <v-card>
    <v-card-title>Customers</v-card-title>
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-text>
      <div v-if="isAdmin" class="d-flex justify-end mb-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New customer</v-btn>
      </div>

      <CustomerList :customers="customers" :is-admin="isAdmin" @edit="openEdit" @delete="confirmDelete" />
    </v-card-text>

    <CustomerForm v-model="formOpen" :customer="editingCustomer" @submit="handleSubmit" />
    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete customer"
      :message="`Delete “${customerToDelete?.first_name ?? customerToDelete?.email ?? 'this customer'}”? This cannot be undone.`"
      @confirm="handleConfirmDelete"
    />
  </v-card>
</template>
