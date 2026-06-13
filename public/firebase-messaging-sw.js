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

// FCM exibe a notificação automaticamente via webpush.notification.
// Não registramos onBackgroundMessage para evitar duplicatas no iOS.

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
