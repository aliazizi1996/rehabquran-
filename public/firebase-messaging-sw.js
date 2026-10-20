/**
 * Firebase Cloud Messaging Service Worker (FCM)
 * مقرأة رحاب القرآن الإلكترونية
 * يستقبل الإشعارات الفورية في الخلفية عند بدء الحلقات القرآنية أو إرسال تقييمات التلاوة
 */

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAUgU0A8eSb6HusDiyZxEjGRWsqCSc5TSE",
  authDomain: "flawless-cacao-n4r4b.firebaseapp.com",
  projectId: "flawless-cacao-n4r4b",
  storageBucket: "flawless-cacao-n4r4b.firebasestorage.app",
  messagingSenderId: "676593542004",
  appId: "1:676593542004:web:fa56fe0a9f962d8ea1c221",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM Service Worker] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'مقرأة رحاب القرآن الإلكترونية';
  const body = payload.notification?.body || payload.data?.body || 'لديك إشعار جديد في مقرأة رحاب القرآن';
  const type = payload.data?.type || 'general';
  const clickAction = payload.data?.click_action || payload.data?.url || '/';

  const notificationOptions = {
    body: body,
    icon: '/brand/official-logo-small.png',
    badge: '/brand/official-logo-small.png',
    tag: type === 'halqa_started' ? ('halqa_' + (payload.data?.halqaId || Date.now())) : ('notif_' + Date.now()),
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: type === 'halqa_started', // Keeps halqa alerts visible until user interacts
    data: {
      url: clickAction,
      type: type,
      halqaId: payload.data?.halqaId,
      timestamp: Date.now(),
    },
    actions: type === 'halqa_started' ? [
      { action: 'join', title: '🎙️ دخول الحلقة الآن' },
      { action: 'dismiss', title: 'إغلاق' },
    ] : [
      { action: 'open', title: 'عرض التفاصيل' },
    ],
  };

  self.registration.showNotification(title, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Or open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
