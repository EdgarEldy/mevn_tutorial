import axios from 'axios'
import { attachAuthInterceptor } from './auth-interceptor'

const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
})

// Returns the full { success, message, data?, errors? } envelope unmodified - callers
// read response.data themselves. Every feature service built on top of this owns its
// own unwrapping, so a validation failure's `errors` array is never silently dropped
// here.
attachAuthInterceptor(apiService)

export default apiService
