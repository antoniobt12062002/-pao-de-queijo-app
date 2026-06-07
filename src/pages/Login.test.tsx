import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import Login from './Login'

vi.mock('../api/auth', () => ({
  loginWithEmail: vi.fn().mockResolvedValue({
    token: 'tok',
    user: { id: '1', name: 'A', email: 'a@a.com', role: 'member' },
  }),
  getGithubOAuthUrl: vi.fn().mockReturnValue('http://api/auth/github'),
}))

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )

describe('Login', () => {
  it('renderiza campos de email e senha', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('renderiza link do GitHub', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument()
  })

  it('chama loginWithEmail ao submeter', async () => {
    const { loginWithEmail } = await import('../api/auth')
    renderLogin()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@a.com' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(loginWithEmail).toHaveBeenCalledWith('a@a.com', 'pass'))
  })
})
