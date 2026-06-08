import { apiClient } from './client'

export type User = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  created_at: string
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users')
  return data
}
