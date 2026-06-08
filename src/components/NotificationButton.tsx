import { useState } from 'react'
import { getFirebaseMessaging, getToken, VAPID_KEY } from '../lib/firebase'
import { registerDevice } from '../api/devices'

const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent)
const isStandalone = () => (navigator as any).standalone === true

export default function NotificationButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const activate = async () => {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('idle')
        return
      }
      localStorage.removeItem('fcm_token')
      const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
      await registerDevice(token)
      localStorage.setItem('fcm_token', token)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (isIOS() && !isStandalone()) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        Para ativar notificações, abra no Safari, toque em{' '}
        <strong>Compartilhar</strong> e escolha{' '}
        <strong>"Adicione à Tela Inicial"</strong>. Depois abra o app pelo ícone.
      </div>
    )
  }

  if (Notification.permission === 'denied') {
    return (
      <p className="text-sm text-red-500 text-center py-2">
        Notificações bloqueadas. Habilite nas configurações do browser.
      </p>
    )
  }

  if (Notification.permission === 'granted') {
    return (
      <div className="space-y-2">
        <p className="text-sm text-green-600 text-center py-1">✅ Notificações ativas</p>
        <button
          onClick={activate}
          disabled={status === 'loading'}
          className="w-full border border-amber-400 text-amber-600 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-amber-50 transition-colors"
        >
          {status === 'loading' ? 'Atualizando…' : 'Atualizar registro de notificação'}
        </button>
        {status === 'done' && <p className="text-sm text-green-600 text-center">✅ Registro atualizado</p>}
        {status === 'error' && <p className="text-sm text-red-500 text-center">Erro ao atualizar. Tente novamente.</p>}
      </div>
    )
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
