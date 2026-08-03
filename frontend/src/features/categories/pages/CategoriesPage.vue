<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import categoryService from '../services/category.service'
import CategoryList from '../components/CategoryList.vue'
import CategoryForm from '../components/CategoryForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth.store'

const { isAdmin } = storeToRefs(useAuthStore())

const categories = ref([])
const loading = ref(false)
const formOpen = ref(false)
const editingCategory = ref(null)
const confirmOpen = ref(false)
const categoryToDelete = ref(null)

async function load() {
  loading.value = true
  try {
    categories.value = await categoryService.getAll()
  } catch {
    // The service already toasted the error.
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingCategory.value = null
  formOpen.value = true
}

function openEdit(category) {
  editingCategory.value = category
  formOpen.value = true
}

async function handleSubmit(values) {
  try {
    if (editingCategory.value) {
      await categoryService.update(editingCategory.value.id, values)
    } else {
      await categoryService.create(values)
    }
    formOpen.value = false
    await load()
  } catch {
    // The service already toasted the error; keep the dialog open so the user can retry.
  }
}

function confirmDelete(category) {
  categoryToDelete.value = category
  confirmOpen.value = true
}

async function handleConfirmDelete() {
  try {
    await categoryService.remove(categoryToDelete.value.id)
    await load()
  } catch {
    // The service already toasted the error.
  } finally {
    categoryToDelete.value = null
  }
}

onMounted(load)
</script>

<template>
  <v-card>
    <v-card-title>Categories</v-card-title>
    <v-progress-linear v-if="loading" indeterminate />
    <v-card-text>
      <div v-if="isAdmin" class="d-flex justify-end mb-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">New category</v-btn>
      </div>

      <CategoryList :categories="categories" :is-admin="isAdmin" @edit="openEdit" @delete="confirmDelete" />
    </v-card-text>

    <CategoryForm v-model="formOpen" :category="editingCategory" @submit="handleSubmit" />
    <ConfirmDialog
      v-model="confirmOpen"
      title="Delete category"
      :message="`Delete “${categoryToDelete?.category_name}”? This cannot be undone.`"
      @confirm="handleConfirmDelete"
    />
  </v-card>
</template>
