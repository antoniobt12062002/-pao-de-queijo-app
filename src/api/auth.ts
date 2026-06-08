import { apiClient } from './client'

export async function loginWithEmail(email: string, password: string): Promise<string> {
  const { data } = await apiClient.post<{ token: string }>('/auth/login', { email, password })
  return data.token
}

export function getGithubOAuthUrl(): string {
  return `${import.meta.env.VITE_API_URL}/v1/auth/github`
}
