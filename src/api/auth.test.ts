import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client'
import { loginWithEmail } from './auth'

vi.mock('./client', () => ({ apiClient: { post: vi.fn() } }))

describe('loginWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('faz POST /auth/login e retorna token e user', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { token: 'abc', user: { id: '1', name: 'A', email: 'a@a.com', role: 'member' } },
    })

    const result = await loginWithEmail('a@a.com', 'pass')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@a.com', password: 'pass' })
    expect(result.token).toBe('abc')
  })
})
