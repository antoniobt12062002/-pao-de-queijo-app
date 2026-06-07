import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import BottomNav from './BottomNav'

const renderNav = (role = 'member') => {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role }))
  return render(
    <MemoryRouter>
      <AuthProvider>
        <BottomNav />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  beforeEach(() => localStorage.clear())

  it('mostra 4 itens para usuário comum', () => {
    renderNav('member')
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rotação/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /placar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /perfil/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('mostra link Admin para role admin', () => {
    renderNav('admin')
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })
})
