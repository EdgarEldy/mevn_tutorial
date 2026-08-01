import { useToast } from 'vue-toastification'
import apiService from '@/services/api.service'

const basePath = '/categories'
const toast = useToast()

function extractErrorMessage(error) {
  const body = error.response?.data
  if (body?.errors?.length) {
    return body.errors.map((e) => e.msg).join(', ')
  }
  return body?.message ?? 'Something went wrong. Please try again.'
}

async function getAll() {
  try {
    const response = await apiService.get(basePath)
    return response.data.data ?? []
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function create(payload) {
  try {
    const response = await apiService.post(basePath, payload)
    toast.success(response.data.message)
    return response.data.data
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function update(id, payload) {
  try {
    const response = await apiService.put(`${basePath}/${id}`, payload)
    toast.success(response.data.message)
    return response.data.data
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

async function remove(id) {
  try {
    const response = await apiService.delete(`${basePath}/${id}`)
    toast.success(response.data.message)
  } catch (error) {
    toast.error(extractErrorMessage(error))
    throw error
  }
}

export default { getAll, create, update, remove }
