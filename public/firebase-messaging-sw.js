importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

self.addEventListener('message', (event) => {
  if (event.data?.type === 'INIT_FIREBASE') {
    firebase.initializeApp(event.data.config)
    const messaging = firebase.messaging()
    messaging.onBackgroundMessage((payload) => {
      self.registration.showNotification(payload.notification?.title ?? 'Pão de Queijo', {
        body: payload.notification?.body,
        icon: '/icon-192.png',
        data: { url: '/' },
      })
    })
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
