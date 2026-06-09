import { apiClient } from './client'

export type User = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  active: boolean
  created_at: string
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users')
  return data
}

export async function registerUser(name: string, email: string, password: string): Promise<void> {
  await apiClient.post('/users', { name, email, password })
}

export async function updateUserRole(id: string, role: 'admin' | 'dev'): Promise<void> {
  await apiClient.put(`/users/${id}/role`, { role })
}

export async function deactivateUser(id: string): Promise<void> {
  await apiClient.put(`/users/${id}/deactivate`)
}
