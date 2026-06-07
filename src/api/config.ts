import { apiClient } from './client'

export type Config = {
  key: string
  value: string
}

export async function getConfigs(): Promise<Config[]> {
  const { data } = await apiClient.get<Config[]>('/config')
  return data
}

export async function updateConfig(key: string, value: string): Promise<void> {
  await apiClient.put('/config', { key, value })
}
