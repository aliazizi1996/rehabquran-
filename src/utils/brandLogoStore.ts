export interface BrandLogoCustomization {
  // 1. الشعار (The Logo)
  customLogoUrl: string;
  customSmallLogoUrl: string;
  scale: number;        // 0.6 to 1.6, default 1
  rotation: number;     // -45 to 45 deg, default 0
  brightness: number;   // 50 to 150%, default 100
  contrast: number;     // 50 to 150%, default 100

  // 2. الختم الرسمي (The Official Seal)
  customSealUrl: string;
  customCertificateBgUrl?: string;
  sealTextTop: string;        // 'مقرأة رحاب'
  sealTextBottom: string;     // 'القرآن الإلكترونية'
  sealCenterText: string;     // 'إتقان وسند'
  sealColor: string;          // '#046A38'
  sealScale: number;          // 0.8 to 1.5, default 1
  sealRotation: number;       // default -3
  sealOpacity: number;        // 0.5 to 1, default 0.95

  // 3. العنوان وبيانات المقرأة (Title, Address & General Info)
  titleText: string;          // 'مقرأة رحاب القرآن الإلكترونية'
  sloganText: string;         // 'بناء جيل يتلو القرآن ويعمل به'
  subText: string;            // 'ـ لتعليم القرآن الكريم عن بُعد ـ'
  organizationName: string;   // 'مقرأة رحاب القرآن الإلكترونية العالمية'
  officialAddress: string;    // 'اليمن - ومن جميع دول العالم'
  contactEmail: string;       // 'rehabquran383@gmail.com'
  contactPhone: string;       // '+967 714 371 599'
  facebookUrl: string;        // 'https://www.facebook.com/profile.php?id=61594338165497'
  instagramUrl: string;       // 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4'
  whatsappUrl: string;        // 'https://wa.me/967714371599'
  whatsappChannelUrl: string; // 'https://whatsapp.com/channel/0029Vb4RehabQuran'
  telegramUrl?: string;       // 'https://t.me/rehabpa'
  youtubeUrl?: string;        // 'https://www.youtube.com/@RehabQuran-s5m'
  tiktokUrl?: string;         // 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/'
  googleMapsUrl: string;      // 'https://maps.app.goo.gl/eiRa7YpZgcxqAvuH8'
  accreditationNumber: string;// '1447/ق/892'
  establishedYear: string;    // '1447 هـ / 2026 م'

  // 4. الشهادات المعتمدة (Certificates Configuration)
  certDefaultTitle: string;          // 'شهادة إتقان وتثبيت جزء من القرآن الكريم'
  certHeaderBadge: string;           // 'شهادة إنجاز'
  certIntroText: string;             // '❖ تَشْهَدُ مَقْرَأَةُ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ: ❖'
  certCompletionPhrase: string;      // 'قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ مُتَطَلَّبَاتِ إِتْقَانِ وَتَثْبِيتِ:'
  certNarrationText: string;         // 'بِرِوَايَةِ حَفْصٍ عَنْ عَاصِمٍ بِالسَّنَدِ الْمُتَّصِلِ'
  certAdminSignerName: string;       // 'د. علي عزيزي'
  certAdminSignerTitle: string;      // 'المشرف العام على المقرأة'
  certTeacherSignerTitle: string;    // 'المعلم المجيز'
  certWatermarkOpacity: number;      // 0.06 (default)
  certBorderColor: string;           // '#C5A059'
  certPrimaryColor: string;          // '#046A38'

  // 5. إعدادات ظهور عضوية التجمع العالمي (إظهار/إخفاء في لوحة المشرف)
  showGlobalAssemblyMembership: boolean; // افتراضياً: false (محذوفة من جميع الصفحات الظاهرة وتظهر فقط إذا اختار المشرف إظهارها)

  lastUpdated: number;
}

const STORAGE_KEY = 'rihab_brand_logo_customization_v1';
const BRAND_ASSET_VERSION_KEY = 'rihab_brand_asset_version';
const BRAND_ASSET_VERSION = 'identity-2026-pptx-v2';

/**
 * Strips oversized base64 data strings (e.g. data:image/...) to protect localStorage quota.
 * Replaces them with the clean server asset URL (/brand/...).
 */
export function sanitizeBrandSettingsForStorage(settings: BrandLogoCustomization): BrandLogoCustomization {
  const safe: any = { ...settings };
  const timestamp = safe.lastUpdated || Date.now();
  // We only replace giant base64 data URLs if they would exhaust localStorage quota (> 30KB).
  // We NEVER replace valid http/https URLs (e.g. Firebase Storage, Cloudinary, etc.) or valid asset paths!
  if (typeof safe.customLogoUrl === 'string' && safe.customLogoUrl.startsWith('data:image/') && safe.customLogoUrl.length > 30000) {
    safe.customLogoUrl = '/brand/official-logo.png?t=' + timestamp;
  }
  if (typeof safe.customSmallLogoUrl === 'string' && safe.customSmallLogoUrl.startsWith('data:image/') && safe.customSmallLogoUrl.length > 30000) {
    safe.customSmallLogoUrl = '/brand/official-logo-small.png?t=' + timestamp;
  }
  if (typeof safe.customSealUrl === 'string' && safe.customSealUrl.startsWith('data:image/') && safe.customSealUrl.length > 30000) {
    safe.customSealUrl = '/brand/official-seal.png?t=' + timestamp;
  }
  if (typeof safe.customCertificateBgUrl === 'string' && safe.customCertificateBgUrl.startsWith('data:image/') && safe.customCertificateBgUrl.length > 30000) {
    safe.customCertificateBgUrl = '/brand/official-certificate-template.png?t=' + timestamp;
  }
  return safe;
}

/**
 * Safely writes to localStorage, handling quota exceptions gracefully.
 */
function safeLocalStorageSet(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('LocalStorage quota warning, retrying with minimal payload:', err);
    try {
      localStorage.removeItem(key);
      const parsed = JSON.parse(value);
      const minimal = sanitizeBrandSettingsForStorage({
        ...DEFAULT_BRAND_LOGO_SETTINGS,
        ...parsed,
        customLogoUrl: parsed.customLogoUrl || '',
        customSmallLogoUrl: parsed.customSmallLogoUrl || '',
        customSealUrl: parsed.customSealUrl || '',
        customCertificateBgUrl: parsed.customCertificateBgUrl || ''
      });
      localStorage.setItem(key, JSON.stringify(minimal));
    } catch {
      console.warn('LocalStorage quota permanently exceeded, running in-memory safely.');
    }
  }
}

export const DEFAULT_BRAND_LOGO_SETTINGS: BrandLogoCustomization = {
  // Logo
  customLogoUrl: '/brand/official-logo.png',
  customSmallLogoUrl: '/brand/official-logo-small.png',
  scale: 1,
  rotation: 0,
  brightness: 100,
  contrast: 100,

  // Seal
  customSealUrl: '/brand/official-seal.png',
  customCertificateBgUrl: '',
  sealTextTop: 'مقرأة رحاب',
  sealTextBottom: 'القرآن الإلكترونية',
  sealCenterText: 'إتقان وسند',
  sealColor: '#046A38',
  sealScale: 1,
  sealRotation: 0,
  sealOpacity: 0.95,

  // Title & Address
  titleText: 'مقرأة رحاب القرآن الإلكترونية',
  sloganText: 'بناء جيل يتلو القرآن ويعمل به',
  subText: 'ـ لتعليم القرآن الكريم عن بُعد ـ',
  organizationName: 'مقرأة رحاب القرآن الإلكترونية العالمية',
  officialAddress: 'اليمن - ومن جميع دول العالم',
  contactEmail: 'rehabquran383@gmail.com',
  contactPhone: '+967 714 371 599',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61594338165497',
  instagramUrl: 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4',
  whatsappUrl: 'https://wa.me/967714371599',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb4RehabQuran',
  telegramUrl: 'https://t.me/rehabpa',
  youtubeUrl: 'https://www.youtube.com/@RehabQuran-s5m',
  tiktokUrl: 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/',
  googleMapsUrl: 'https://maps.app.goo.gl/eiRa7YpZgcxqAvuH8',
  accreditationNumber: '1447/ق/892',
  establishedYear: '1447 هـ / 2026 م',

  // Certificates
  certDefaultTitle: 'شهادة إتقان وتثبيت جزء من القرآن الكريم',
  certHeaderBadge: 'شهادة إنجاز',
  certIntroText: '❖ تَشْهَدُ مَقْرَأَةُ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ: ❖',
  certCompletionPhrase: 'قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ مُتَطَلَّبَاتِ إِتْقَانِ وَتَثْبِيتِ:',
  certNarrationText: 'بِرِوَايَةِ حَفْصٍ عَنْ عَاصِمٍ بِالسَّنَدِ الْمُتَّصِلِ',
  certAdminSignerName: 'د. علي عزيزي',
  certAdminSignerTitle: 'المشرف العام على المقرأة',
  certTeacherSignerTitle: 'المعلم المجيز',
  certWatermarkOpacity: 0.06,
  certBorderColor: '#C5A059',
  certPrimaryColor: '#046A38',

  // افتراضياً: محذوفة من جميع الصفحات الظاهرة وتتحكم فيها لوحة المشرف
  showGlobalAssemblyMembership: false,

  lastUpdated: Date.now(),
};

export function getBrandLogoSettings(): BrandLogoCustomization {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        let safe = sanitizeBrandSettingsForStorage({ ...DEFAULT_BRAND_LOGO_SETTINGS, ...parsed });
        if (localStorage.getItem(BRAND_ASSET_VERSION_KEY) !== BRAND_ASSET_VERSION) {
          safe = sanitizeBrandSettingsForStorage({
            ...DEFAULT_BRAND_LOGO_SETTINGS,
            ...safe,
            // Keep user's custom uploaded logo and seal!
            customLogoUrl: safe.customLogoUrl || DEFAULT_BRAND_LOGO_SETTINGS.customLogoUrl,
            customSmallLogoUrl: safe.customSmallLogoUrl || DEFAULT_BRAND_LOGO_SETTINGS.customSmallLogoUrl,
            customSealUrl: safe.customSealUrl || DEFAULT_BRAND_LOGO_SETTINGS.customSealUrl,
            customCertificateBgUrl: safe.customCertificateBgUrl || DEFAULT_BRAND_LOGO_SETTINGS.customCertificateBgUrl,
            lastUpdated: parsed.lastUpdated || Date.now(),
          });
          safeLocalStorageSet(STORAGE_KEY, JSON.stringify(safe));
          localStorage.setItem(BRAND_ASSET_VERSION_KEY, BRAND_ASSET_VERSION);
        }
        // Migration for new official communication email: rehabquran383@gmail.com
        if (
          !safe.contactEmail ||
          safe.contactEmail === 'info@rehab-quran.com' ||
          safe.contactEmail === 'info@rehabquran.com' ||
          safe.contactEmail === 'aliazize101@gmail.com'
        ) {
          safe.contactEmail = 'rehabquran383@gmail.com';
        }
        return safe;
      }
      localStorage.setItem(BRAND_ASSET_VERSION_KEY, BRAND_ASSET_VERSION);
    }
  } catch (err) {
    console.error('Failed to load logo customization:', err);
  }
  return DEFAULT_BRAND_LOGO_SETTINGS;
}

export function isGlobalAssemblyMembershipEnabled(): boolean {
  try {
    return !!getBrandLogoSettings().showGlobalAssemblyMembership;
  } catch {
    return false;
  }
}

export function saveBrandLogoSettings(settings: Partial<BrandLogoCustomization>): BrandLogoCustomization {
  const current = getBrandLogoSettings();
  const updated: BrandLogoCustomization = {
    ...current,
    ...settings,
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save logo settings to localStorage:', err);
  }

  // Sync to server in background
  if (typeof fetch !== 'undefined') {
    void import('../lib/firebase').then(({ getFirebaseAuthHeaders }) => getFirebaseAuthHeaders()).then((authHeaders) => fetch('/api/brand/settings', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })).catch(() => {});
  }

  // Dispatch custom event to notify all logo and certificate components immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('brand_logo_updated', { detail: updated }));
  }

  return updated;
}

// Background sync from server on boot
export async function syncBrandSettingsFromServer(): Promise<BrandLogoCustomization> {
  try {
    const res = await fetch('/api/brand/settings');
    if (res.ok) {
      const serverSettings = await res.json();
      if (serverSettings && Object.keys(serverSettings).length > 0) {
        const current = getBrandLogoSettings();
        // If server is newer or local is default, apply server
        if (!current.lastUpdated || (serverSettings.lastUpdated && serverSettings.lastUpdated >= current.lastUpdated)) {
          const merged = { ...DEFAULT_BRAND_LOGO_SETTINGS, ...current, ...serverSettings };
          safeLocalStorageSet(STORAGE_KEY, JSON.stringify(sanitizeBrandSettingsForStorage(merged)));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('brand_logo_updated', { detail: merged }));
          }
          return merged;
        }
      }
    }
  } catch (err) {
    // offline or server unavailable, fallback to local
  }
  return getBrandLogoSettings();
}

// Auto-run sync on browser boot
if (typeof window !== 'undefined') {
  syncBrandSettingsFromServer().catch(() => {});
}

export type CalibrationPreset = 'balanced' | 'login' | 'header' | 'showcase';

export const CALIBRATION_PRESETS: Record<CalibrationPreset, {
  name: string;
  description: string;
  scale: number;
  rotation: number;
  brightness: number;
  contrast: number;
}> = {
  balanced: {
    name: 'النسبة الهندسية المعتمدة (متوازن)',
    description: 'استقامة تامة 0°، تحجيم دقيق 100%، تباين وإضاءة متناسقة',
    scale: 1.0,
    rotation: 0,
    brightness: 100,
    contrast: 100,
  },
  login: {
    name: 'شاشة الدخول (Login Optimal)',
    description: 'بروز واضح مريح للعين بنسبة 105% مع توسيط عمودي مثالي',
    scale: 1.05,
    rotation: 0,
    brightness: 100,
    contrast: 102,
  },
  header: {
    name: 'الهيدر والشريط العلوي (Header Compact)',
    description: 'أبعاد مصغرة متناسقة تلائم كافة مقاسات الشاشات والهواتف',
    scale: 0.95,
    rotation: 0,
    brightness: 100,
    contrast: 100,
  },
  showcase: {
    name: 'عرض الواجهة الترحيبية (Showcase)',
    description: 'حجم فخم 115% مع تشبع ألوان محسّن للهوية البصرية',
    scale: 1.15,
    rotation: 0,
    brightness: 102,
    contrast: 104,
  },
};

/**
 * Automatically calculates and applies optimal geometric alignment,
 * resetting tilt/rotation to 0 deg and setting golden proportions.
 */
export function autoCalibrateBrandLogo(preset: CalibrationPreset = 'balanced'): BrandLogoCustomization {
  const config = CALIBRATION_PRESETS[preset] || CALIBRATION_PRESETS.balanced;
  return saveBrandLogoSettings({
    scale: config.scale,
    rotation: config.rotation,
    brightness: config.brightness,
    contrast: config.contrast,
  });
}

export function resetBrandLogoSettings(): BrandLogoCustomization {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset logo settings:', err);
  }

  // Also reset on server
  if (typeof fetch !== 'undefined') {
    void import('../lib/firebase').then(({ getFirebaseAuthHeaders }) => getFirebaseAuthHeaders()).then((authHeaders) => fetch('/api/brand/settings', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_BRAND_LOGO_SETTINGS),
    })).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('brand_logo_updated', { detail: DEFAULT_BRAND_LOGO_SETTINGS }));
  }

  return DEFAULT_BRAND_LOGO_SETTINGS;
}

export async function uploadBrandLogoToServer(
  imageBase64: string,
  target: 'official-logo' | 'small' | 'seal' | 'certificate-bg' = 'official-logo'
): Promise<{ status: string; path: string; file: string }> {
  const { getFirebaseAuthHeaders } = await import('../lib/firebase');
  const authHeaders = await getFirebaseAuthHeaders();
  const res = await fetch('/api/brand/upload-logo', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, target }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload logo');
  }

  return res.json();
}
