import { apiClient } from './client'

export type Score = {
  user_id: string
  user_name: string
  user_email: string
  score: number
  times_paid: number
  times_participated: number
  current_streak: number
  skip_count: number
  total_amount_spent: number
}

export type Badge = {
  id: string
  user_id: string
  type: string
  period: string | null
  earned_at: string
}

export async function getAllScores(): Promise<Score[]> {
  const { data } = await apiClient.get<Score[]>('/scores')
  return data
}

export async function getUserScore(userId: string): Promise<Score> {
  const { data } = await apiClient.get<Score>(`/scores/${userId}`)
  return data
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data } = await apiClient.get<Badge[]>(`/badges/${userId}`)
  return data
}
