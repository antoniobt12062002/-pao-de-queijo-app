import { apiClient } from './client'

export type RoundStatus = 'pending' | 'open' | 'closed' | 'cancelled'

export type Round = {
  id: string
  date: string
  payer_id: string
  status: RoundStatus
  notify_at: string
  closes_at: string
  is_payer?: boolean
}

export type Participation = {
  user_id: string
  name: string
  quantity: number
}

export type ParticipationsResponse = {
  participations: Participation[]
  total_quantity: number
}

export async function getTodayRound(): Promise<Round> {
  const { data } = await apiClient.get<Round>('/rounds/today')
  return data
}

export async function confirmRound(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(`/rounds/${id}/confirm`)
  return data
}

export async function cancelRound(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(`/rounds/${id}/cancel`)
  return data
}

export async function getParticipations(roundId: string): Promise<ParticipationsResponse> {
  const { data } = await apiClient.get<ParticipationsResponse>(`/rounds/${roundId}/participations`)
  return data
}

export async function participate(roundId: string, quantity: number): Promise<void> {
  await apiClient.post(`/rounds/${roundId}/participate`, { quantity })
}

export async function removeParticipation(roundId: string): Promise<void> {
  await apiClient.delete(`/rounds/${roundId}/participate`)
}

type PaginatedRoundsResponse = {
  data: Round[]
  total: number
  page: number
  limit: number
}

export async function getRounds(): Promise<Round[]> {
  const { data } = await apiClient.get<PaginatedRoundsResponse>('/rounds')
  return data.data
}

export async function adminCreateRound(date: string, payerId?: string, notifyAt?: string): Promise<void> {
  await apiClient.post('/admin/rounds', { date, payer_id: payerId ?? '', notify_at: notifyAt ?? '' })
}

export async function adminForceCloseRound(id: string): Promise<void> {
  await apiClient.post(`/admin/rounds/${id}/force-close`)
}

export async function adminChangePayer(roundId: string, userId: string): Promise<void> {
  await apiClient.put(`/admin/rounds/${roundId}/payer`, { user_id: userId })
}
