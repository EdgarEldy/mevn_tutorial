<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import authService from '../services/auth.service'

const route = useRoute()
const state = ref('pending')

// Route-driven page for /auth/activate/:token: fires the activation call as soon as it
// loads, simulating a user clicking a link from an activation email.
onMounted(async () => {
  try {
    await authService.activate(route.params.token)
    state.value = 'success'
  } catch {
    state.value = 'error'
  }
})
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="420" width="100%">
      <v-card-text class="d-flex flex-column align-center text-center pa-6">
        <template v-if="state === 'pending'">
          <v-progress-circular indeterminate color="primary" size="32" class="mb-4" />
          <p>Activating your account...</p>
        </template>
        <template v-else-if="state === 'success'">
          <p class="mb-4">Your account is now active.</p>
          <v-btn color="primary" variant="flat" to="/login">Go to login</v-btn>
        </template>
        <template v-else>
          <p class="mb-4">This activation link is invalid or has already been used.</p>
          <v-btn color="primary" variant="flat" to="/register">Back to registration</v-btn>
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>
