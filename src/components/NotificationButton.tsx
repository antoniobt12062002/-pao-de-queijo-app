import { useState } from 'react'
import { Bell, BellOff, BellRing, RefreshCw, Smartphone } from 'lucide-react'
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
      if (permission !== 'granted') { setStatus('idle'); return }
      localStorage.removeItem('fcm_token')
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
      await registerDevice(token)
      localStorage.setItem('fcm_token', token)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
        <Bell size={15} className="text-amber-500" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notificações</p>
      </div>

      <div className="px-5 py-4">
        {/* iOS fora do standalone */}
        {isIOS() && !isStandalone() && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Smartphone size={17} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Adicione à tela inicial</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Abra no Safari, toque em <strong className="text-slate-600">Compartilhar</strong> e escolha{' '}
                <strong className="text-slate-600">Adicionar à Tela Inicial</strong>. Depois abra pelo ícone.
              </p>
            </div>
          </div>
        )}

        {/* Bloqueada */}
        {!isIOS() && Notification.permission === 'denied' && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <BellOff size={17} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Notificações bloqueadas</p>
              <p className="text-xs text-slate-400 mt-0.5">Habilite nas configurações do navegador para receber avisos.</p>
            </div>
          </div>
        )}

        {/* Ativa */}
        {!isIOS() && Notification.permission === 'granted' && (
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <BellRing size={17} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Notificações ativas</p>
                <p className="text-xs text-slate-400">Você receberá avisos de rodadas e lembretes.</p>
              </div>
            </div>
            <button
              onClick={activate}
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} className={status === 'loading' ? 'animate-spin' : ''} />
              {status === 'loading' ? 'Atualizando…' : 'Atualizar registro'}
            </button>
            {status === 'done' && <p className="text-xs text-emerald-600 text-center font-medium">Registro atualizado com sucesso!</p>}
            {status === 'error' && <p className="text-xs text-red-500 text-center">Erro ao atualizar. Tente novamente.</p>}
          </div>
        )}

        {/* Não solicitada */}
        {!isIOS() && Notification.permission === 'default' && (
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Bell size={17} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Ativar notificações</p>
                <p className="text-xs text-slate-400">Receba avisos quando a rodada abrir ou fechar.</p>
              </div>
            </div>
            <button
              onClick={activate}
              disabled={status === 'loading'}
              className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-amber-600 transition-colors active:scale-[0.98]"
            >
              {status === 'loading' ? 'Ativando…' : 'Ativar notificações'}
            </button>
            {status === 'done' && <p className="text-xs text-emerald-600 text-center font-medium">Notificações ativas!</p>}
            {status === 'error' && <p className="text-xs text-red-500 text-center">Erro ao ativar. Tente novamente.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
