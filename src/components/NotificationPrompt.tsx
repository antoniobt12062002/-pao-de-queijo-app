import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'notif_prompt_seen'

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'default' ||
      localStorage.getItem(STORAGE_KEY)
    ) return
    // Small delay so it doesn't flash on mount
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const activate = async () => {
    setActivating(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        dismiss()
        return
      }
      const { getFirebaseMessaging, getToken, VAPID_KEY } = await import('../lib/firebase')
      const { registerDevice } = await import('../api/devices')
      const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
      const saved = localStorage.getItem('fcm_token')
      if (token && token !== saved) {
        await registerDevice(token)
        localStorage.setItem('fcm_token', token)
      }
      toast.success('Notificações ativadas! 🔔')
      dismiss()
    } catch {
      toast.error('Não foi possível ativar as notificações.')
      dismiss()
    } finally {
      setActivating(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={dismiss} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Bell size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Ativar notificações</p>
              <p className="text-xs text-gray-500">Receba avisos quando for sua vez</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Saiba quando é sua vez de pagar o pão de queijo e quando a rodada abrir para participações.
        </p>

        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Agora não
          </button>
          <button
            onClick={activate}
            disabled={activating}
            className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            {activating ? 'Ativando…' : 'Ativar agora'}
          </button>
        </div>
      </div>
    </>
  )
}
