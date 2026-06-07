import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './store/auth'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

async function refreshFcmToken() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    // Dynamic import to prevent Firebase startup crash if env vars missing
    const { getFirebaseMessaging, getToken, VAPID_KEY } = await import('./lib/firebase')
    const { registerDevice } = await import('./api/devices')
    const token = await getToken(getFirebaseMessaging(), { vapidKey: VAPID_KEY })
    const saved = localStorage.getItem('fcm_token')
    if (token && token !== saved) {
      await registerDevice(token)
      localStorage.setItem('fcm_token', token)
    }
  } catch {
    // Silently ignore — Firebase may not be configured or permission may have changed
  }
}

refreshFcmToken()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
