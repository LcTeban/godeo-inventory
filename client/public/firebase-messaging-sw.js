importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB51Y-fnSEWojYOTyGi7MIVEX2DbFgG-QA",
  authDomain: "godeo-inventory.firebaseapp.com",
  projectId: "godeo-inventory",
  storageBucket: "godeo-inventory.firebasestorage.app",
  messagingSenderId: "633055021311",
  appId: "1:633055021311:web:aaa083691608923cada4ca"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.data;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/godeo-inventory/icon-192.png',
    badge: '/godeo-inventory/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: payload.data.url || '/' }
  });
});
