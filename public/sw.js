/**
 * Service Worker - مقرأة رحاب القرآن الإلكترونية
 * PWA Service Worker (V4 - 2026 Production Standard)
 *
 * سياسة الأمان والخصوصية:
 * 1. كاش آمن مخصص للملفات الثابتة والأصول والخطوط لتسريع التصفح.
 * 2. منع تام لتخزين بيانات الطلاب، الجلسات الحساسة، مستندات Firestore، أو توثيق Auth.
 * 3. العمليات التي تتطلب حفظاً أو اتصالاً بقاعدة البيانات لا تنجح كاذباً عند انقطاع الشبكة بل توضح حالة عدم الاتصال.
 */

const CACHE_NAME = 'rihab-quran-pwa-v4';

// الأصول الثابتة الأساسية لواجهة المنصة
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/brand/official-logo.png',
  '/brand/official-logo-small.png',
  '/brand/official-seal.png'
];

// 1. التثبيت والتخزين المؤقت للأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical error pre-caching assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. التفعيل وحذف النسخ القديمة من الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. الاستماع لرسالة التحديث الفوري
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. استراتيجية إدارة الطلبات والشبكة
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // أ. استثناء مباشر لكافة العمليات الإنشائية أو التعديلية (POST, PUT, DELETE, PATCH)
  if (req.method !== 'GET') {
    return;
  }

  // ب. استثناء مباشر لكافة خدمات البيانات والمصادقة والملفات الحساسة
  const isExcluded =
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase') ||
    (url.hostname.includes('googleapis.com') && !url.hostname.includes('fonts.googleapis.com')) ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/peerjs/');

  if (isExcluded) {
    if (url.pathname.startsWith('/api/')) {
      // إذا انقطع الإنترنت أثناء طلب API، إرجاع رسالة خطأ واضحة تمنع الإيهام بالنجاح
      event.respondWith(
        fetch(req).catch(() => {
          return new Response(
            JSON.stringify({
              ok: false,
              offline: true,
              error: 'لا يوجد اتصال نشط بالإنترنت. تتطلب هذه العملية اتصالاً مباشراً بقاعدة البيانات لضمان حفظ بياناتك بأمان.'
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }
          );
        })
      );
      return;
    }
    // باقي الطلبات الخارجية تمر مباشرة عبر الشبكة
    return;
  }

  // ج. استراتيجية Stale-While-Revalidate للملفات الثابتة والخطوط والأصول المنسقة
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/brand/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // د. لطلبات التنقل بين الصفحات (HTML Navigation): Network First ثم الانتقال للـ Shell المخزن
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = (await cache.match('/index.html')) || (await cache.match('/'));
        if (cached) return cached;
        return new Response(
          '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>غير متصل</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>أنت غير متصل بالإنترنت</h2><p>يرجى التحقق من اتصالك بالشبكة وإعادة المحاولة.</p></body></html>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      })
    );
  }
});
