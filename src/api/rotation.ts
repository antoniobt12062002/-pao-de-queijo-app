import { apiClient } from './client'

export type RotationMember = {
  user_id: string
  name: string
  position: number
}

export type Rotation = {
  current_pos: number
  current_payer_id: string
  members: RotationMember[]
}

export async function getRotation(): Promise<Rotation> {
  const { data } = await apiClient.get<Rotation>('/rotation')
  return data
}

export async function updateRotationOrder(userIds: string[]): Promise<void> {
  await apiClient.put('/rotation/order', { user_ids: userIds })
}

export async function skipRotation(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/rotation/skip')
  return data
}
