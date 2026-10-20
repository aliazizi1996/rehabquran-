/**
 * إدارة Service Worker وتحديثات PWA لمقرأة رحاب القرآن الإلكترونية
 */

let registrationInstance: ServiceWorkerRegistration | null = null;

export function registerPWA() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registrationInstance = reg;

        // التحقق من وجود نسخة جديدة قيد التثبيت
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // إشعار التطبيق بتوفر إصدار جديد
              window.dispatchEvent(new CustomEvent('pwa_update_available'));
            }
          });
        });

        // التحقق الدوري كل 30 دقيقة
        setInterval(() => {
          reg.update().catch(() => {});
        }, 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[SW] Registration notice:', err);
      });
  });

  // إعادة تحميل الصفحة بسلاسة عند تفعيل النسخة المحدثة
  let isRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!isRefreshing) {
      isRefreshing = true;
      window.location.reload();
    }
  });
}

/**
 * تطبيق التحديث الجديد للـ Service Worker فوراً
 */
export function applyPWAUpdate() {
  if (registrationInstance && registrationInstance.waiting) {
    registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
  }
}
