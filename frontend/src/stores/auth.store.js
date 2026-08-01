import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const TOKEN_KEY = 'token'

// Placeholder until feature/frontend/auth: reads/checks a localStorage token, but
// nothing in this branch ever sets one. isAdmin has no role data to read yet, so it
// always returns false.
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => false)

  return { token, isAuthenticated, isAdmin }
})
