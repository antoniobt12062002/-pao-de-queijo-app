import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from './client'
import {
  getTodayRound,
  confirmRound,
  cancelRound,
  participate,
  removeParticipation,
  getParticipations,
} from './rounds'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

describe('rounds API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTodayRound chama GET /rounds/today', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: '1', status: 'open' } })
    const result = await getTodayRound()
    expect(apiClient.get).toHaveBeenCalledWith('/rounds/today')
    expect(result.id).toBe('1')
  })

  it('confirmRound chama POST /rounds/:id/confirm', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'confirmed' } })
    const result = await confirmRound('abc')
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/confirm')
    expect(result.message).toBe('confirmed')
  })

  it('cancelRound chama POST /rounds/:id/cancel', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { message: 'cancelled' } })
    const result = await cancelRound('abc')
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/cancel')
    expect(result.message).toBe('cancelled')
  })

  it('participate chama POST com quantity', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: {} })
    await participate('abc', 2)
    expect(apiClient.post).toHaveBeenCalledWith('/rounds/abc/participate', { quantity: 2 })
  })

  it('removeParticipation chama DELETE', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: {} })
    await removeParticipation('abc')
    expect(apiClient.delete).toHaveBeenCalledWith('/rounds/abc/participate')
  })

  it('getParticipations chama GET /rounds/:id/participations', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        participations: [{ user_id: 'u1', name: 'Alice', quantity: 2 }],
        total_quantity: 2,
      },
    })
    const result = await getParticipations('abc')
    expect(apiClient.get).toHaveBeenCalledWith('/rounds/abc/participations')
    expect(result.total_quantity).toBe(2)
    expect(result.participations[0].name).toBe('Alice')
  })

  it('getTodayRound propaga erro da API', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({ response: { status: 404 } })
    await expect(getTodayRound()).rejects.toMatchObject({ response: { status: 404 } })
  })
})
