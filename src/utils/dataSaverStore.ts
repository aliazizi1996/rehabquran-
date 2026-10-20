/**
 * خدمة ومخزن وضع «توفير البيانات» (Data Saver Mode)
 * لمقرأة رحاب القرآن الإلكترونية
 * 
 * الهدف:
 * 1. حفظ خيار المستخدم محلياً في المتصفح (localStorage).
 * 2. عند تفعيله: منع أي تحميل تلقائي لمقاطع الفيديو أو الصوت أو ملفات PDF أو الصور الكبيرة.
 * 3. جعل تشغيل الوسائط عند طلب وضغط الطالب يدوياً فقط (0 بايت خلفي حتى النقر).
 * 4. توفير استهلاك باقات الإنترنت 3G/4G وشبكات الهاتف المحمول في اليمن والعالم الإسلامي.
 */

import { useState, useEffect } from 'react';

const DATA_SAVER_STORAGE_KEY = 'rehab_quran_data_saver_mode_v1';
const DATA_SAVER_EVENT = 'rehab_data_saver_changed';

/**
 * فحص ما إذا كان وضع توفير البيانات مفعلاً
 * مفعّل افتراضياً لحماية باقة الطالب وتسريع تحميل الصفحات
 */
export function isDataSaverEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(DATA_SAVER_STORAGE_KEY);
    if (saved === null) {
      // الوضع الافتراضي: مفعّل لتوفير البيانات
      return true;
    }
    return saved === 'true';
  } catch {
    return true;
  }
}

/**
 * تعديل وحفظ وضع توفير البيانات محلياً مع إشعار كافة المكونات فوراً
 */
export function setDataSaverEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DATA_SAVER_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(DATA_SAVER_EVENT, { detail: { enabled } }));
  } catch (err) {
    console.warn('[DataSaver] Could not save setting to localStorage:', err);
  }
}

/**
 * تبديل وضع توفير البيانات
 */
export function toggleDataSaver(): boolean {
  const current = isDataSaverEnabled();
  const next = !current;
  setDataSaverEnabled(next);
  return next;
}

/**
 * Hook تفاعلي لاستخدام وضع توفير البيانات في مكونات React
 */
export function useDataSaver(): {
  isDataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  toggleDataSaver: () => boolean;
} {
  const [isDataSaver, setIsDataSaverState] = useState<boolean>(() => isDataSaverEnabled());

  useEffect(() => {
    const handleSync = (e?: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent?.detail && typeof customEvent.detail.enabled === 'boolean') {
        setIsDataSaverState(customEvent.detail.enabled);
      } else {
        setIsDataSaverState(isDataSaverEnabled());
      }
    };

    window.addEventListener(DATA_SAVER_EVENT, handleSync as EventListener);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SAVER_EVENT, handleSync as EventListener);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleSet = (enabled: boolean) => {
    setDataSaverEnabled(enabled);
    setIsDataSaverState(enabled);
  };

  const handleToggle = () => {
    const next = toggleDataSaver();
    setIsDataSaverState(next);
    return next;
  };

  return {
    isDataSaver,
    setDataSaver: handleSet,
    toggleDataSaver: handleToggle,
  };
}
