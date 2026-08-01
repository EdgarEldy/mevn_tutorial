<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import AppFooter from '@/components/AppFooter.vue'

const drawer = ref(true)
</script>

<template>
  <v-navigation-drawer v-model="drawer">
    <AppSidebar />
  </v-navigation-drawer>

  <AppTopbar @toggle-drawer="drawer = !drawer" />

  <v-main>
    <v-container fluid>
      <router-view />
    </v-container>
  </v-main>

  <AppFooter />
</template>
