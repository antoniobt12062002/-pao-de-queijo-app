import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import AuthCallback from './AuthCallback'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('AuthCallback', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockClear()
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  it('lê token da URL, salva e redireciona para /', () => {
    // JWT payload: { sub: '1', name: 'Test', email: 't@t.com', role: 'member' }
    const payload = btoa(JSON.stringify({ sub: '1', name: 'Test', email: 't@t.com', role: 'member' }))
    const token = `header.${payload}.sig`

    render(
      <MemoryRouter initialEntries={[`/auth/callback?token=${token}`]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(localStorage.getItem('token')).toBe(token)
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/')
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })
})
