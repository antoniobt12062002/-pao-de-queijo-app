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

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.data?.title ?? 'Pão de Queijo', {
    body: payload.data?.body,
    icon: '/icon-192.png',
    data: { url: '/' },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'))
})
