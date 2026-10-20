/**
 * خدمة تحويل الروابط إلى روابط مطلقة والتأكد من اكتمال تحميل وفك ترميز الصور قبل الطباعة
 * Image Absolute URL Resolver & Print Preloader
 */

/**
 * تحويل أي مسار نسبي إلى رابط مطلق كامل (Absolute URL)
 * مثال: /brand/official-logo.png -> https://domain.com/brand/official-logo.png
 */
export function toAbsoluteUrl(url?: string): string {
  if (!url) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/brand/official-logo.png`;
    }
    return '/brand/official-logo.png';
  }

  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (typeof window === 'undefined') return trimmed;

  const origin = window.location.origin.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${origin}${cleanPath}`;
}

/**
 * انتظار اكتمال تحميل وفك ترميز جميع الصور داخل مستند أو عنصر عبر Promise.all قبل استدعاء نافذة الطباعة
 * لضمان عدم ظهور الشعار أو الختم فارغاً عند الطباعة أو حفظ PDF
 */
export async function waitForImagesToLoad(
  docOrElement: Document | HTMLElement | null,
  timeoutMs = 5000
): Promise<void> {
  if (!docOrElement || typeof window === 'undefined') return;

  const targetDoc: Document =
    docOrElement instanceof Document
      ? docOrElement
      : docOrElement.ownerDocument || document;

  const images: HTMLImageElement[] = Array.from(
    (docOrElement as any).querySelectorAll
      ? (docOrElement as any).querySelectorAll('img')
      : targetDoc.querySelectorAll('img')
  );

  // إجبار المتصفح على تحميل الصور كـ eager و فك ترميزها فوراً مع تأكيد crossorigin
  images.forEach((img) => {
    img.loading = 'eager';
    if (!img.getAttribute('crossorigin')) {
      img.setAttribute('crossorigin', 'anonymous');
      img.crossOrigin = 'anonymous';
    }
    // تحويل أي رابط نسبي متبقي إلى رابط مطلق
    const currentSrc = img.getAttribute('src');
    if (currentSrc && !currentSrc.startsWith('http') && !currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:')) {
      img.src = toAbsoluteUrl(currentSrc);
    }
  });

  const promises: Promise<void>[] = images.map((img) => {
    // إذا كانت الصورة مكتملة ولها أبعاد حقيقية، نقوم بمحاولة decode السريع
    if (img.complete && img.naturalWidth > 0) {
      if ('decode' in img && typeof img.decode === 'function') {
        return img.decode().catch(() => {});
      }
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, timeoutMs);

      const onDone = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode().then(resolve).catch(resolve);
          } else {
            resolve();
          }
        }
      };

      img.addEventListener('load', onDone, { once: true });
      img.addEventListener('error', onDone, { once: true });

      // محاولة فك الترميز في المتصفحات الحديثة فوراً
      if ('decode' in img && typeof img.decode === 'function') {
        img.decode().then(onDone).catch(onDone);
      }
    });
  });

  // التأكد أيضاً من جاهزية الخطوط في المستند
  if (targetDoc.fonts && targetDoc.fonts.ready) {
    promises.push(
      targetDoc.fonts.ready
        .then(() => {})
        .catch(() => {})
    );
  }

  // تنفيذ انتظار جميع الصور في نفس الوقت باستخدام Promise.all
  await Promise.all(promises);
}

/**
 * تحميل مسبق لقائمة من روابط الصور في ذاكرة المتصفح عبر crossorigin="anonymous" وفك ترميزها
 */
export async function preloadImages(urls: string[], timeoutMs = 5000): Promise<void> {
  if (typeof window === 'undefined' || urls.length === 0) return;

  const promises = urls.filter(Boolean).map((rawUrl) => {
    const absUrl = toAbsoluteUrl(rawUrl);
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, timeoutMs);

      const finish = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode().then(resolve).catch(resolve);
          } else {
            resolve();
          }
        }
      };

      img.onload = finish;
      img.onerror = finish;
      img.src = absUrl;

      if (img.complete && img.naturalWidth > 0) {
        finish();
      }
    });
  });

  await Promise.all(promises);
}

/**
 * تحميل مسبق وضمان جاهزية الشعار والختم الرسميين بروابط مطلقة وفك ترميزهما
 */
export async function preloadOfficialBrandAssets(): Promise<{ logoUrl: string; sealUrl: string }> {
  const logoUrl = toAbsoluteUrl('/brand/official-logo.png');
  const sealUrl = toAbsoluteUrl('/brand/official-seal.png');
  await preloadImages([logoUrl, sealUrl]);
  return { logoUrl, sealUrl };
}
