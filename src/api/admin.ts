import { apiClient } from './client'

export async function adminTriggerRound(): Promise<void> {
  await apiClient.post('/admin/trigger-round')
}

export async function adminSendNotification(userIds: string[], title: string, body: string): Promise<{ recipients: number }> {
  const { data } = await apiClient.post<{ recipients: number }>('/admin/notifications/send', { user_ids: userIds, title, body })
  return data
}
