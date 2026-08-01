import { describe, it, expect } from 'vitest'
import apiService from './api.service'

describe('api.service', () => {
  it('defaults baseURL to the local backend when VITE_API_URL is not set', () => {
    expect(apiService.defaults.baseURL).toBe('http://localhost:3001/api/v1')
  })

  it('registers the auth request interceptor', () => {
    expect(apiService.interceptors.request.handlers.length).toBeGreaterThan(0)
  })
})
