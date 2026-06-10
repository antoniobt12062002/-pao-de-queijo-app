import { apiClient } from './client'

export type Absence = {
  id: string
  user_id: string
  date: string
  created_at: string
}

export async function getAbsences(): Promise<Absence[]> {
  const { data } = await apiClient.get<Absence[]>('/absences')
  return data
}

export async function markAbsent(date: string): Promise<void> {
  await apiClient.post('/absences', { date })
}

export async function removeAbsence(date: string): Promise<void> {
  await apiClient.delete(`/absences/${date}`)
}
