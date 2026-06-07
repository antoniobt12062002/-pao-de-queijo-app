import { useState } from 'react'
import { getFirebaseMessaging, getToken, VAPID_KEY } from '../lib/firebase'
import { registerDevice } from '../api/devices'

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const isStandalone = () => (navigator as any).standalone === true

export default function NotificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  if (isIOS() && !isStandalone()) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        Para ativar notificações, abra no Safari, toque em{' '}
        <strong>Compartilhar</strong> e escolha{' '}
        <strong>"Adicione à Tela Inicial"</strong>. Depois abra o app pelo ícone.
      </div>
    )
  }

  if (Notification.permission === 'granted') {
    return <p className="text-sm text-green-600 text-center py-2">✅ Notificações ativas</p>
  }

  if (Notification.permission === 'denied') {
    return (
      <p className="text-sm text-red-500 text-center py-2">
        Notificações bloqueadas. Habilite nas configurações do browser.
      </p>
    )
  }

  const activate = async () => {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('idle')
        return
      }
      const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
      const saved = localStorage.getItem('fcm_token')
      if (token !== saved) {
        await registerDevice(token)
        localStorage.setItem('fcm_token', token)
      }
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={activate}
        disabled={status === 'loading'}
        className="w-full bg-amber-500 text-white py-3 rounded-xl font-medium disabled:opacity-50"
      >
        {status === 'loading' ? 'Ativando…' : 'Ativar notificações'}
      </button>
      {status === 'done' && <p className="text-sm text-green-600 text-center">✅ Notificações ativas</p>}
      {status === 'error' && (
        <p className="text-sm text-red-500 text-center">Erro ao ativar. Tente novamente.</p>
      )}
    </div>
  )
}
