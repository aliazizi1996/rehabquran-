import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  DesignAndCommunicationSettings,
  DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS,
  SocialLinkItem,
} from '../types/designAndCommunication';
import { getBrandLogoSettings, saveBrandLogoSettings } from '../utils/brandLogoStore';

const STORAGE_KEY = 'rihab_design_communication_settings_v1';
const FIRESTORE_COLLECTION = 'system_settings';
const FIRESTORE_DOC_ID = 'design_and_communication';

/**
 * دمج الإعدادات الافتراضية مع المحفوظ محلياً لضمان عدم وجود حقول ناقصة
 */
function mergeWithDefaults(raw: any): DesignAndCommunicationSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS };
  }

  return {
    ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS,
    ...raw,
    studentDashboard: {
      ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.studentDashboard,
      ...(raw.studentDashboard || {}),
    },
    teacherDashboard: {
      ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.teacherDashboard,
      ...(raw.teacherDashboard || {}),
    },
    curriculumDisplay: {
      ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.curriculumDisplay,
      ...(raw.curriculumDisplay || {}),
    },
    socialLinks: (() => {
      if (!Array.isArray(raw.socialLinks) || raw.socialLinks.length === 0) {
        return DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.socialLinks;
      }
      const existing = [...raw.socialLinks];
      const hasYoutube = existing.some((l: any) => l.platform === 'youtube' || l.id === 'youtube');
      const hasTiktok = existing.some((l: any) => l.platform === 'tiktok' || l.id === 'tiktok');
      if (!hasYoutube) {
        const defaultYt = DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.socialLinks.find(l => l.id === 'youtube');
        if (defaultYt) existing.push(defaultYt);
      }
      if (!hasTiktok) {
        const defaultTt = DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.socialLinks.find(l => l.id === 'tiktok');
        if (defaultTt) existing.push(defaultTt);
      }
      return existing;
    })(),
    contactEmail: typeof raw.contactEmail === 'string' && raw.contactEmail.trim()
      ? raw.contactEmail.trim()
      : DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.contactEmail,
    contactPhone: raw.contactPhone || DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.contactPhone,
    whatsappNumber: raw.whatsappNumber || DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.whatsappNumber,
    supportWorkingHours: raw.supportWorkingHours || DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.supportWorkingHours,
    lastUpdated: raw.lastUpdated || Date.now(),
    updatedBy: raw.updatedBy || DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS.updatedBy,
    version: raw.version || 1,
  };
}

/**
 * استرجاع إعدادات التصميم والتواصل الحالية فورياً من التخزين المحلي
 */
export function getDesignAndCommunicationSettings(): DesignAndCommunicationSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeWithDefaults(parsed);
    }
  } catch (err) {
    console.warn('[DesignSettingsService] Failed to read from localStorage:', err);
  }

  // في حال عدم وجودها، قراءة إعدادات التواصل الحالية من brandLogoStore
  const brand = getBrandLogoSettings();
  const initial = { ...DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS };
  if (brand.contactEmail) initial.contactEmail = brand.contactEmail;
  if (brand.contactPhone) initial.contactPhone = brand.contactPhone;

  return initial;
}

/**
 * حفظ الإعدادات محلياً وفي Firestore ومزامنة بريد وروابط التواصل مع المنظومة
 */
export async function saveDesignAndCommunicationSettings(
  updatedSettings: Partial<DesignAndCommunicationSettings>,
  updatedByName: string = 'المشرف العام'
): Promise<DesignAndCommunicationSettings> {
  const current = getDesignAndCommunicationSettings();
  const merged: DesignAndCommunicationSettings = mergeWithDefaults({
    ...current,
    ...updatedSettings,
    lastUpdated: Date.now(),
    updatedBy: updatedByName,
  });

  // 1. الحفظ الفوري في التخزين المحلي (LocalStorage) لسرعة العرض الفوري
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch (err) {
    console.warn('[DesignSettingsService] LocalStorage save warning:', err);
  }

  // 2. تحديث متزامن لـ BrandLogoStore لضمان تناسق بريد التواصل وروابط المقرأة مع الهيدر والفوتر والشهادات
  try {
    const fbLink = merged.socialLinks.find((l) => l.platform === 'facebook' && l.enabled);
    const igLink = merged.socialLinks.find((l) => l.platform === 'instagram' && l.enabled);
    const waChannel = merged.socialLinks.find((l) => l.id === 'wa-channel' && l.enabled) ||
      merged.socialLinks.find((l) => l.platform === 'whatsapp' && l.url.includes('channel') && l.enabled);
    const waDirect = merged.socialLinks.find((l) => l.platform === 'whatsapp' && (l.id === 'wa-direct' || !l.url.includes('channel')) && l.enabled);
    const tgLink = merged.socialLinks.find((l) => l.platform === 'telegram' && l.enabled);
    const ytLink = merged.socialLinks.find((l) => l.platform === 'youtube' && l.enabled);
    const ttLink = merged.socialLinks.find((l) => l.platform === 'tiktok' && l.enabled);

    saveBrandLogoSettings({
      contactEmail: merged.contactEmail,
      contactPhone: merged.contactPhone,
      facebookUrl: fbLink?.url,
      instagramUrl: igLink?.url,
      whatsappUrl: waDirect?.url || `https://wa.me/${merged.whatsappNumber.replace(/[^0-9]/g, '')}`,
      whatsappChannelUrl: waChannel?.url,
      telegramUrl: tgLink?.url,
      youtubeUrl: ytLink?.url || 'https://www.youtube.com/@RehabQuran-s5m',
      tiktokUrl: ttLink?.url || 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/',
    });
  } catch (err) {
    console.warn('[DesignSettingsService] Brand store sync warning:', err);
  }

  // 3. إطلاق حدث مخصص لتحديث جميع الواجهات المفتوحة تلقائياً دون إعادة تحميل
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('rehab_design_settings_updated', {
        detail: merged,
      })
    );
  }

  // 4. الحفظ في Firestore بقاعدة البيانات السحابية (نظام الإعدادات المركزي)
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(docRef, merged, { merge: true });
  } catch (err) {
    console.warn('[DesignSettingsService] Firestore save error (continuing with local cache):', err);
  }

  return merged;
}

/**
 * مزامنة الإعدادات من Firestore عند بدء تشغيل التطبيق أو فتح لوحة التحكم
 */
export async function syncDesignSettingsFromFirestore(): Promise<DesignAndCommunicationSettings> {
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const current = getDesignAndCommunicationSettings();

      // تطبيق إعدادات السحابة إذا كانت أحدث أو لم تكن الإعدادات المحلية معدلة
      if (!current.lastUpdated || (data.lastUpdated && data.lastUpdated >= current.lastUpdated)) {
        const merged = mergeWithDefaults(data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('rehab_design_settings_updated', {
              detail: merged,
            })
          );
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('[DesignSettingsService] Firestore fetch error:', err);
  }

  return getDesignAndCommunicationSettings();
}

/**
 * إضافة رابط تواصل اجتماعي جديد
 */
export async function addSocialLink(
  link: Omit<SocialLinkItem, 'id' | 'order'>
): Promise<DesignAndCommunicationSettings> {
  const current = getDesignAndCommunicationSettings();
  const newLink: SocialLinkItem = {
    ...link,
    id: `social-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    order: current.socialLinks.length + 1,
  };
  const updatedLinks = [...current.socialLinks, newLink];
  return await saveDesignAndCommunicationSettings({ socialLinks: updatedLinks });
}

/**
 * تعديل رابط تواصل اجتماعي قائم
 */
export async function updateSocialLink(
  linkId: string,
  updates: Partial<SocialLinkItem>
): Promise<DesignAndCommunicationSettings> {
  const current = getDesignAndCommunicationSettings();
  const updatedLinks = current.socialLinks.map((item) =>
    item.id === linkId ? { ...item, ...updates } : item
  );
  return await saveDesignAndCommunicationSettings({ socialLinks: updatedLinks });
}

/**
 * حذف رابط تواصل اجتماعي
 */
export async function deleteSocialLink(linkId: string): Promise<DesignAndCommunicationSettings> {
  const current = getDesignAndCommunicationSettings();
  const updatedLinks = current.socialLinks.filter((item) => item.id !== linkId);
  return await saveDesignAndCommunicationSettings({ socialLinks: updatedLinks });
}
