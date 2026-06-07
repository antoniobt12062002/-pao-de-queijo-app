import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('exporta apiClient com métodos HTTP', async () => {
    const { apiClient } = await import('./client')
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
  })

  it('interceptor de request adiciona Authorization quando há token', async () => {
    localStorage.setItem('token', 'test-jwt')
    const { apiClient } = await import('./client')
    const handler = (apiClient.interceptors.request as any).handlers[0]
    const config = { headers: new axios.AxiosHeaders() }
    const result = await handler.fulfilled(config)
    expect(result.headers.get('Authorization')).toBe('Bearer test-jwt')
  })

  it('interceptor de response limpa localStorage em 401', async () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', '{}')
    const { apiClient } = await import('./client')
    const handler = (apiClient.interceptors.response as any).handlers[0]
    await handler.rejected({ response: { status: 401 } }).catch(() => {})
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
