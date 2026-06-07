import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './auth'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => localStorage.clear())

  it('retorna user null quando não há token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login salva token e user no localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const user = { id: '1', name: 'Test', email: 'test@test.com', role: 'member' }

    act(() => result.current.login('mytoken', user))

    expect(localStorage.getItem('token')).toBe('mytoken')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('Test')
  })

  it('logout limpa token e user', () => {
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role: 'member' }))
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.logout())

    expect(localStorage.getItem('token')).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
