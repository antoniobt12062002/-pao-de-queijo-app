importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDCCC6uj-m8227qWmQ6nYWusCgx2T90gLM',
  authDomain: 'pao-de-queijo-app-66391.firebaseapp.com',
  projectId: 'pao-de-queijo-app-66391',
  messagingSenderId: '23935102804',
  appId: '1:23935102804:web:0aefe8a8342bcaa911a2c1',
})

const messaging = firebase.messaging()

// iOS Safari requires the SW to explicitly call showNotification().
// Chrome ignores this when webpush.notification is set (no duplicates).
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification ?? {}
  return self.registration.showNotification(
    n.title ?? 'Pão de Queijo',
    {
      body: n.body ?? '',
      icon: 'https://glowing-syrniki-17cec4.netlify.app/icon-192.png',
      badge: 'https://glowing-syrniki-17cec4.netlify.app/icon-192.png',
      data: { url: 'https://glowing-syrniki-17cec4.netlify.app/' },
    }
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
