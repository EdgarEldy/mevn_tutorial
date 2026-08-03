<script setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import authService from '@/features/auth/services/auth.service'

defineEmits(['toggle-drawer'])

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)

async function logout() {
  await authService.logout()
  router.push('/login')
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-nav-icon aria-label="Toggle navigation" @click="$emit('toggle-drawer')" />
    <v-spacer />
    <v-menu>
      <template #activator="{ props: menuProps }">
        <v-btn icon="mdi-account-circle" aria-label="User menu" v-bind="menuProps" />
      </template>
      <v-list>
        <v-list-item v-if="isAuthenticated" title="Logout" prepend-icon="mdi-logout" @click="logout" />
        <v-list-item v-else title="Login" prepend-icon="mdi-login" to="/login" />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>
