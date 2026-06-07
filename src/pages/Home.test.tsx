import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../store/auth'
import Home from './Home'
import * as roundsApi from '../api/rounds'

vi.mock('../api/rounds')

const renderHome = () => {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'A', email: 'a@a.com', role: 'member' }))
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Home', () => {
  it('mostra mensagem quando API retorna 404', async () => {
    vi.mocked(roundsApi.getTodayRound).mockRejectedValueOnce({ response: { status: 404 } })
    renderHome()
    await waitFor(() => expect(screen.getByText(/nenhuma rodada hoje/i)).toBeInTheDocument())
  })

  it('mostra botões confirmar/cancelar para o pagador em pending', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '1', status: 'pending',
      notify_at: '', closes_at: '', is_payer: true,
    })
    renderHome()
    await waitFor(() => expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })

  it('mostra mensagem de aguarde para não-pagador em pending', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '99', status: 'pending',
      notify_at: '', closes_at: '', is_payer: false,
    })
    renderHome()
    await waitFor(() => expect(screen.getByText(/aguardando confirmação do pagador/i)).toBeInTheDocument())
  })

  it('mostra botão participar quando status é open', async () => {
    vi.mocked(roundsApi.getTodayRound).mockResolvedValueOnce({
      id: '1', date: '2026-06-07', payer_id: '99', status: 'open',
      notify_at: '', closes_at: '', is_payer: false,
    })
    renderHome()
    await waitFor(() => expect(screen.getByRole('button', { name: /participar/i })).toBeInTheDocument())
  })
})
