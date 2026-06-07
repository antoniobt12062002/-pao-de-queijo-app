import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export { getToken, onMessage }
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// getMessaging() requires browser context — lazy init to avoid crashing in tests (jsdom)
let _messaging: ReturnType<typeof getMessaging> | null = null
export function getFirebaseMessaging() {
  if (!_messaging) _messaging = getMessaging(app)
  return _messaging
}

// Send Firebase config to firebase-messaging-sw.js so it can initialize in background
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'INIT_FIREBASE', config: firebaseConfig })
  })
}
