<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

defineEmits(['toggle-drawer'])

// Placeholder until feature/frontend/auth: isAuthenticated always reads the
// placeholder store, and there is no real logout action to wire up yet.
const authStore = useAuthStore()
const { isAuthenticated } = storeToRefs(authStore)
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
        <!-- Neither entry navigates yet: /login doesn't exist until feature/frontend/auth
             adds it, and there is no logout action to wire up until then either. -->
        <v-list-item v-if="isAuthenticated" title="Logout" prepend-icon="mdi-logout" disabled />
        <v-list-item v-else title="Login" prepend-icon="mdi-login" disabled />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>
