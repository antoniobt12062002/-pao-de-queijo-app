import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client'
import { loginWithEmail } from './auth'

vi.mock('./client', () => ({ apiClient: { post: vi.fn() } }))

describe('loginWithEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('faz POST /auth/login e retorna o token JWT', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: { token: 'abc' },
    })

    const token = await loginWithEmail('a@a.com', 'pass')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { email: 'a@a.com', password: 'pass' })
    expect(token).toBe('abc')
  })
})
