import { apiClient } from './client'

export async function registerDevice(token: string): Promise<void> {
  await apiClient.post('/devices', { token, platform: 'web' })
}
