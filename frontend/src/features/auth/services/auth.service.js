import { useToast } from 'vue-toastification'
import apiService from '@/services/api.service'
import { useAuthStore } from '@/stores/auth.store'

const basePath = '/auth'
const toast = useToast()

function extractErrorMessage(error) {
  const body = error.response?.data
  if (body?.errors?.length) {
    return body.errors.map((e) => e.msg).join(', ')
  }
  return body?.message ?? 'Something went wrong. Please try again.'
}

async function register(payload) {
  try {
    const response = await apiService.post(`${basePath}/register`, payload)
    toast.success(response.data.message)
    return response.data.data
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function activate(token) {
  try {
    const response = await apiService.get(`${basePath}/activate/${token}`)
    toast.success(response.data.message)
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

// Unlike the other feature services, login() also updates the shared auth store on
// success, since a successful login is the one place the app-wide session actually
// changes. logout() lives on the store itself instead, since the topbar needs to
// trigger it without depending on this feature.
async function login(payload) {
  try {
    const response = await apiService.post(`${basePath}/login`, payload)
    toast.success(response.data.message)
    const { token, user } = response.data.data
    useAuthStore().setSession(token, user)
    return user
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

// Logout should always leave the client logged out, even if the backend call fails
// (e.g. the token already expired, or a network error), so the failure is swallowed
// here instead of propagated: the whole point of calling the endpoint is to blacklist
// the token server-side, but the local session is cleared regardless.
async function logout() {
  try {
    await apiService.post(`${basePath}/logout`)
  } catch {
    // The local session is cleared below regardless.
  } finally {
    useAuthStore().clearSession()
  }
}

async function forgotPassword(payload) {
  try {
    const response = await apiService.post(`${basePath}/forgot-password`, payload)
    toast.success(response.data.message)
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function resetPassword(payload) {
  try {
    const response = await apiService.post(`${basePath}/reset-password`, payload)
    toast.success(response.data.message)
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

export default { register, activate, login, logout, forgotPassword, resetPassword }
