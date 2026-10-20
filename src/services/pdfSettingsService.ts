/**
 * خدمة إدارة إعدادات وثائق وملخصات دروس التجويد PDF
 * مقرأة رحاب القرآن الإلكترونية (هوية 2026 الرسمية)
 * تحفظ الإعدادات في Firebase Firestore (مجموعة curriculum_settings) مع التخزين المحلي
 * ومقتصرة في التعديل على المشرف العام والإدارة الأكاديمية
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TajweedPdfSettings {
  academyName: string;            // 'مقرأة رحاب القرآن الإلكترونية'
  headerBismillah: string;        // 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ'
  logoUrl: string;                // '/brand/official-logo.png'
  sealUrl: string;                // '/brand/official-seal.png'
  contactPhone: string;           // '0967714371599'
  whatsappUrl: string;            // 'https://wa.me/967714371599'
  whatsappChannelUrl: string;     // 'https://whatsapp.com/channel/0029Vb4RehabQuran'
  facebookUrl: string;            // 'https://www.facebook.com/profile.php?id=61594338165497'
  instagramUrl: string;           // 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4'
  contactEmail: string;           // 'rehabquran383@gmail.com'
  telegramUrl?: string;           // 'https://t.me/rehabpa'
  youtubeUrl?: string;            // 'https://www.youtube.com/@RehabQuran-s5m'
  tiktokUrl?: string;             // 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/'
  copyrightText: string;          // '© مقرأة رحاب القرآن الإلكترونية – جميع الحقوق محفوظة'
  watermarkEnabled: boolean;      // true
  watermarkOpacity: number;       // 0.05
  showSeal: boolean;              // true
  sealTitle: string;              // 'ختم مقرأة رحاب القرآن الإلكترونية'
  adminSignerName: string;        // 'د. علي عزيزي'
  adminSignerTitle: string;       // 'المشرف العام على المقرأة'
  lastUpdated?: number;
  updatedBy?: string;
}

export const DEFAULT_TAJWEED_PDF_SETTINGS: TajweedPdfSettings = {
  academyName: 'مقرأة رحاب القرآن الإلكترونية',
  headerBismillah: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ',
  logoUrl: '/brand/official-logo.png',
  sealUrl: '/brand/official-seal.png',
  contactPhone: '0967714371599',
  whatsappUrl: 'https://wa.me/967714371599',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb4RehabQuran',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61594338165497',
  instagramUrl: 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4',
  contactEmail: 'rehabquran383@gmail.com',
  telegramUrl: 'https://t.me/rehabpa',
  youtubeUrl: 'https://www.youtube.com/@RehabQuran-s5m',
  tiktokUrl: 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/',
  copyrightText: '© مقرأة رحاب القرآن الإلكترونية – جميع الحقوق محفوظة',
  watermarkEnabled: true,
  watermarkOpacity: 0.05,
  showSeal: true,
  sealTitle: 'ختم مقرأة رحاب القرآن الإلكترونية',
  adminSignerName: 'د. علي عزيزي',
  adminSignerTitle: 'المشرف العام على المقرأة',
  lastUpdated: Date.now(),
};

const PDF_SETTINGS_STORAGE_KEY = 'rehab_quran_tajweed_pdf_settings_v1';
const FIRESTORE_COLLECTION = 'curriculum_settings';
const FIRESTORE_DOC_ID = 'pdf_document_settings';

import { getBrandLogoSettings } from '../utils/brandLogoStore';

/**
 * جلب إعدادات وثائق PDF الحالية من التخزين المحلي مع استرجاع القيم الافتراضية المعتمدة
 * تقرأ الشعار والختم المرفوعين ديناميكياً من لوحة المشرف
 */
export function getTajweedPdfSettings(): TajweedPdfSettings {
  const brand = getBrandLogoSettings();
  const dynamicLogo = brand.customLogoUrl || DEFAULT_TAJWEED_PDF_SETTINGS.logoUrl;
  const dynamicSeal = brand.customSealUrl || DEFAULT_TAJWEED_PDF_SETTINGS.sealUrl;

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(PDF_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_TAJWEED_PDF_SETTINGS,
          ...parsed,
          academyName: brand.titleText || parsed.academyName || DEFAULT_TAJWEED_PDF_SETTINGS.academyName,
          // استخدام الشعار والختم الديناميكي المرفوع من لوحة المشرف
          logoUrl: (parsed.logoUrl && parsed.logoUrl !== '/brand/official-logo.png')
            ? parsed.logoUrl
            : dynamicLogo,
          sealUrl: (parsed.sealUrl && parsed.sealUrl !== '/brand/official-seal.png')
            ? parsed.sealUrl
            : dynamicSeal,
          contactPhone: parsed.contactPhone || DEFAULT_TAJWEED_PDF_SETTINGS.contactPhone,
          whatsappUrl: parsed.whatsappUrl || DEFAULT_TAJWEED_PDF_SETTINGS.whatsappUrl,
          whatsappChannelUrl: parsed.whatsappChannelUrl || DEFAULT_TAJWEED_PDF_SETTINGS.whatsappChannelUrl,
          facebookUrl: parsed.facebookUrl || DEFAULT_TAJWEED_PDF_SETTINGS.facebookUrl,
          instagramUrl: parsed.instagramUrl || DEFAULT_TAJWEED_PDF_SETTINGS.instagramUrl,
          contactEmail: (parsed.contactEmail && parsed.contactEmail !== 'aliazize101@gmail.com' && parsed.contactEmail !== 'info@rehab-quran.com')
            ? parsed.contactEmail
            : (brand.contactEmail || DEFAULT_TAJWEED_PDF_SETTINGS.contactEmail),
          telegramUrl: parsed.telegramUrl || DEFAULT_TAJWEED_PDF_SETTINGS.telegramUrl,
          youtubeUrl: parsed.youtubeUrl || DEFAULT_TAJWEED_PDF_SETTINGS.youtubeUrl,
          tiktokUrl: parsed.tiktokUrl || DEFAULT_TAJWEED_PDF_SETTINGS.tiktokUrl,
          copyrightText: parsed.copyrightText || DEFAULT_TAJWEED_PDF_SETTINGS.copyrightText,
        };
      }
    }
  } catch (err) {
    console.warn('[PDF Settings] Failed to read from localStorage:', err);
  }
  return {
    ...DEFAULT_TAJWEED_PDF_SETTINGS,
    logoUrl: dynamicLogo,
    sealUrl: dynamicSeal,
    academyName: brand.titleText || DEFAULT_TAJWEED_PDF_SETTINGS.academyName,
  };
}

/**
 * إعادة تعيين إعدادات وثائق PDF إلى الوضع الافتراضي الرسمي لمقرأة رحاب القرآن
 */
export function resetTajweedPdfSettingsToDefault(): TajweedPdfSettings {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_TAJWEED_PDF_SETTINGS));
      window.dispatchEvent(new CustomEvent('rehab_pdf_settings_updated', { detail: DEFAULT_TAJWEED_PDF_SETTINGS }));
    }
  } catch (err) {
    console.warn('[PDF Settings] Failed to reset to default:', err);
  }
  return DEFAULT_TAJWEED_PDF_SETTINGS;
}

/**
 * حفظ إعدادات وثائق PDF محلياً وفي Cloud Firestore (متاح للمشرفين فقط)
 */
export async function saveTajweedPdfSettings(
  updatedFields: Partial<TajweedPdfSettings>,
  currentUserRole?: string,
  currentUserEmail?: string
): Promise<TajweedPdfSettings> {
  // التحقق من الصلاحيات الإشرافية
  const isSupervisorUser = 
    currentUserRole === 'academic_supervisor' || 
    currentUserRole === 'system_admin' || 
    currentUserRole === 'admin' ||
    currentUserEmail?.toLowerCase() === 'aliazize101@gmail.com' ||
    currentUserEmail?.toLowerCase() === 'rehabquran383@gmail.com' ||
    currentUserEmail?.toLowerCase() === 'admin@rehab-quran.com';

  if (!isSupervisorUser) {
    throw new Error('غير مصرح لك بتعديل إعدادات وثائق PDF الرسمية. هذه الصلاحية مقتصرة على المشرف العام والإدارة.');
  }

  const current = getTajweedPdfSettings();
  const merged: TajweedPdfSettings = {
    ...current,
    ...updatedFields,
    lastUpdated: Date.now(),
    updatedBy: currentUserEmail || 'المشرف الأكاديمي',
  };

  // 1. التحديث المحلي السريع
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (err) {
    console.warn('[PDF Settings] LocalStorage write failed:', err);
  }

  // 2. إرسال حدث مخصص لتحديث جميع المكونات المفتوحة فوراً
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rehab_pdf_settings_updated', { detail: merged }));
  }

  // 3. المزامنة مع Firestore
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(docRef, merged, { merge: true });
  } catch (err) {
    console.warn('[PDF Settings] Firestore save failed (offline or permission):', err);
    // المحاولة على الخادم الخلفي كنسخة احتياطية
    try {
      const { getFirebaseAuthHeaders } = await import('../lib/firebase');
      const authHeaders = await getFirebaseAuthHeaders();
      await fetch('/api/brand/settings', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfAcademyName: merged.academyName,
          pdfContactPhone: merged.contactPhone,
          pdfWhatsappUrl: merged.whatsappUrl,
          pdfCopyrightText: merged.copyrightText,
          lastUpdated: merged.lastUpdated,
        }),
      });
    } catch {}
  }

  return merged;
}

/**
 * مزامنة الإعدادات من Firestore عند بدء التشغيل
 */
export async function syncTajweedPdfSettingsFromFirestore(): Promise<TajweedPdfSettings> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as TajweedPdfSettings;
      const merged: TajweedPdfSettings = {
        ...DEFAULT_TAJWEED_PDF_SETTINGS,
        ...data,
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rehab_pdf_settings_updated', { detail: merged }));
      }
      return merged;
    }
  } catch (err) {
    console.warn('[PDF Settings] Sync from Firestore skipped (offline or not found):', err);
  }
  return getTajweedPdfSettings();
}

/**
 * الاشتراك في التحديثات الفورية من Firestore
 */
export function subscribeTajweedPdfSettings(callback: (settings: TajweedPdfSettings) => void): () => void {
  // تزويد القيمة الحالية أولاً
  callback(getTajweedPdfSettings());

  let unsubscribeFirestore = () => {};
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    unsubscribeFirestore = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as TajweedPdfSettings;
        const merged: TajweedPdfSettings = {
          ...DEFAULT_TAJWEED_PDF_SETTINGS,
          ...data,
        };
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PDF_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          }
        } catch {}
        callback(merged);
      }
    }, (err) => {
      console.warn('[PDF Settings] Firestore snapshot listener warning:', err);
    });
  } catch (e) {
    console.warn('[PDF Settings] Could not attach firestore snapshot:', e);
  }

  const handleCustomEvent = (e: any) => {
    if (e.detail) {
      callback(e.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('rehab_pdf_settings_updated', handleCustomEvent);
  }

  return () => {
    unsubscribeFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('rehab_pdf_settings_updated', handleCustomEvent);
    }
  };
}

// تشغيل المزامنة التلقائية عند تشغيل التطبيق في المتصفح
if (typeof window !== 'undefined') {
  syncTajweedPdfSettingsFromFirestore().catch(() => {});
}
