import { apiClient } from './client'
import type { User } from '../store/auth'

type LoginResponse = { token: string; user: User }

export async function loginWithEmail(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export function getGithubOAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL}/v1/auth/github`
}
