<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import productService from '../services/product.service'
import ProductList from '../components/ProductList.vue'
import ProductForm from '../components/ProductForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth.store'

const { isAdmin } = storeToRefs(useAuthStore())

const products = ref([])
const loading = ref(false)
const formOpen = ref(false)
const editingProduct = ref(null)
const confirmOpen = ref(false)
const productToDelete = ref(null)

async function load() {
  loading.value = true
  try {
    products.value = await productService.getAll()
  } catch {
    // The service already toasted the error.
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingProduct.value = null
  formOpen.value = true
}

function openEdit(product) {
  editingProduct.value = product
  formOpen.value = true
}

async function handleSubmit(values) {
  try {
    if (editingProduct.value) {
      await productService.update(editingProduct.value.id, values)
    } else {
      await productService.create(values)
    }
    formOpen.value = false
    await load()
  } catch {
    // The service already toasted the error; keep the dialog open so the user can retry.
  }
}

function confirmDelete(product) {
  productToDelete.value = product
  confirmOpen.value = true
}

async function handleConfirmDelete() {
  try {
    await productService.remove(productToDelete.value.id)
    await load()
  } catch {
    // The service already toasted the error.
  } finally {
    productToDelete.value = null
  }
}

onMounted(load)
</script>

<template>
  <v-card>
    <v-card-title>Products</v-card-title>
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-text>
      <div v-if="isAdmin" class="d-flex justify-end mb-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New product</v-btn>
      </div>

      <ProductList :products="products" :is-admin="isAdmin" @edit="openEdit" @delete="confirmDelete" />
    </v-card-text>

    <ProductForm v-model="formOpen" :product="editingProduct" @submit="handleSubmit" />
    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete product"
      :message="`Delete “${productToDelete?.product_name}”? This cannot be undone.`"
      @confirm="handleConfirmDelete"
    />
  </v-card>
</template>
