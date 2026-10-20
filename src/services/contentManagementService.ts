/**
 * خدمة إدارة المحتوى والتحكم في ظهور الميزات وسجل الرقابة (Audit Log)
 * Content & Feature Toggle Management + Audit Trail Service
 * 
 * الميزات:
 * 1. إخفاء أو إظهار أي ميزة أو محتوى دون حذفها (visible / hidden).
 * 2. حفظ التغييرات ومزامنتها في Firebase Firestore ضمن مجموعتي `site_content` و `audit_logs`.
 * 3. تسجيل كل عملية إدارية بدقة: المشرف + نوع العملية + العنصر المستهدف + التاريخ والوقت.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ContentFeatureItem {
  id: string;
  title: string;
  category: 'tools' | 'curriculum' | 'pages' | 'programs';
  categoryLabel: string;
  description: string;
  status: 'visible' | 'hidden';
  routePath?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  operatorName: string;
  operatorEmail: string;
  operatorRole: string;
  action: string;
  targetItem: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  createdAtMs: number;
}

// الميزات والمحتويات الافتراضية للمقرأة
export const DEFAULT_CONTENT_FEATURES: ContentFeatureItem[] = [
  {
    id: 'quran_audio_player',
    title: 'المصحف المعلم والمكتبة الصوتية',
    category: 'tools',
    categoryLabel: 'الأدوات الصوتية',
    description: 'مشغل القرآن الكريم الصوتي المصحوب بالتكرار لكبار القراء مع التظليل وتيسير الحفظ.',
    status: 'visible',
    routePath: '/quran-audio',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'مفعل لعموم الطلاب والزوار',
  },
  {
    id: 'tajweed_lessons_bank',
    title: 'دروس التجويد والمتون (التحفة والجزرية)',
    category: 'curriculum',
    categoryLabel: 'المناهج والمتون',
    description: 'شروحات التجويد المرئية، المتون العلمية المسندة، واختبارات قياس الاستيعاب.',
    status: 'visible',
    routePath: '/student/recitations',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'متاح للطلاب المنتظمين',
  },
  {
    id: 'tafsir_muyassar',
    title: 'تفسير القرآن الكريم الميسر والفوائد',
    category: 'curriculum',
    categoryLabel: 'التفسير والتدبر',
    description: 'التفسير الميسر وغريب القرآن الكريم والوقفات التدبرية للآيات المقروءة.',
    status: 'visible',
    routePath: '/tafsir',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'متاح للجميع',
  },
  {
    id: 'honor_board',
    title: 'لوحة الشرف والطلاب المتفوقون',
    category: 'pages',
    categoryLabel: 'الأنشطة والتحفيز',
    description: 'تكريم الطلاب المثاليين والحاصلين على أعلى معدلات الإتقان والتزام الحلقات.',
    status: 'visible',
    routePath: '/student',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'محدثة أسبوعياً',
  },
  {
    id: 'sanad_ijazah_track',
    title: 'مسار الإجازات بالسند المتصل',
    category: 'programs',
    categoryLabel: 'المسارات التخصصية',
    description: 'برنامج الإقراء بالسند المتصل إلى رسول الله ﷺ بروايات حفص وشعبة وورش وقالون.',
    status: 'visible',
    routePath: '/register',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'يتطلب اجتياز اختبار القبول',
  },
  {
    id: 'student_registration_portal',
    title: 'استمارة التسجيل الذاتي للطلاب الجدد',
    category: 'pages',
    categoryLabel: 'القبول والتسجيل',
    description: 'بوابة تسجيل الطلاب والطالبات واختيار الأوقات والمستويات وتلقي إشعارات واتساب.',
    status: 'visible',
    routePath: '/register',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'متاحة للعموم وتخضع لمراجعة المشرف',
  },
  {
    id: 'monthly_contributions_calculator',
    title: 'حاسبة المساهمة الشهرية وكفالة الحلقات',
    category: 'tools',
    categoryLabel: 'الدعم والمساهمات',
    description: 'تسهيل مساهمة الطلاب الشهرية (3000 ريال يمني) وكفالة المشايخ والمعلمين.',
    status: 'visible',
    routePath: '/student',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'متاحة للطلاب والداعمين',
  },
  {
    id: 'live_audio_rooms',
    title: 'الغرف الصوتية المباشرة للحلقات القرآنية',
    category: 'tools',
    categoryLabel: 'الحلقات المباشرة',
    description: 'غرف التسميع التفاعلية المباشرة ذات النقاء الصوتي العالي للبنين والبنات.',
    status: 'visible',
    routePath: '/student/lessons',
    lastModifiedBy: 'إدارة المقرأة الرئيسية',
    lastModifiedAt: '2026-10-01 08:00',
    notes: 'تعمل بمواعيد الحلقات المعتمدة',
  },
];

const LOCAL_STORAGE_CONTENT_KEY = 'rehab_quran_site_content_features_v1';
const LOCAL_STORAGE_AUDIT_KEY = 'rehab_quran_audit_logs_v1';

let contentFeaturesMemoryCache: { timestamp: number; data: ContentFeatureItem[] } | null = null;
const CONTENT_CACHE_TTL = 60000; // 60s

export function invalidateContentFeaturesCache() {
  contentFeaturesMemoryCache = null;
}

/**
 * جلب قائمة الميزات والمحتويات (Firestore مع مخزن محلي احتياطي وتخزين مؤقت)
 */
export async function fetchContentFeatures(forceRefresh = false): Promise<ContentFeatureItem[]> {
  const now = Date.now();
  if (!forceRefresh && contentFeaturesMemoryCache && (now - contentFeaturesMemoryCache.timestamp < CONTENT_CACHE_TTL)) {
    return contentFeaturesMemoryCache.data;
  }

  try {
    const snap = await getDocs(collection(db, 'site_content'));
    if (!snap.empty) {
      const items: ContentFeatureItem[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ContentFeatureItem));
      contentFeaturesMemoryCache = { timestamp: now, data: items };
      // حفظ محلياً للتسريع
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CONTENT_KEY, JSON.stringify(items));
      }
      return items;
    }
  } catch (err) {
    console.warn('[ContentService] تعذر الجلب من Firestore، الاعتماد على المخزن المحلي:', err);
  }

  // مخزن محلي
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONTENT_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
  }

  return DEFAULT_CONTENT_FEATURES;
}

/**
 * التحقق هل الميزة معروضة حالياً أم مخفية
 */
export function isFeatureVisible(featureId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONTENT_KEY);
    if (raw) {
      const items: ContentFeatureItem[] = JSON.parse(raw);
      const found = items.find((f) => f.id === featureId);
      if (found) {
        return found.status !== 'hidden';
      }
    }
  } catch {}
  return true;
}

/**
 * تبديل حالة الظهور (إخفاء / إظهار) دون حذف المحتوى
 */
export async function toggleFeatureVisibility(
  featureId: string,
  newStatus: 'visible' | 'hidden',
  admin: { name: string; email: string }
): Promise<boolean> {
  const now = new Date().toISOString();
  const nowFormatted = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const allFeatures = await fetchContentFeatures();
  const target = allFeatures.find((f) => f.id === featureId);
  const targetTitle = target ? target.title : featureId;

  // 1. تحديث Firestore
  try {
    const docRef = doc(db, 'site_content', featureId);
    await setDoc(docRef, {
      id: featureId,
      status: newStatus,
      lastModifiedBy: admin.name || admin.email,
      lastModifiedAt: nowFormatted,
      updatedAt: now,
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] تعذر تحديث حالة الميزة سحابياً:', err);
  }

  // 2. تحديث المخزن المحلي
  const updatedList = allFeatures.map((item) => {
    if (item.id === featureId) {
      return {
        ...item,
        status: newStatus,
        lastModifiedBy: admin.name || admin.email,
        lastModifiedAt: nowFormatted,
      };
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_CONTENT_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('rehab_content_updated', { detail: updatedList }));
  }
  invalidateContentFeaturesCache();

  // 3. توثيق العملية في سجل الرقابة (Audit Log)
  const actionText = newStatus === 'hidden' ? 'إخفاء ميزة/محتوى' : 'إظهار ميزة/محتوى';
  const detailText = `قام المشرف (${admin.name || admin.email}) بتغيير حالة [${targetTitle}] إلى (${newStatus === 'hidden' ? 'مخفي' : 'معروض للجميع'}).`;

  await recordAuditLog({
    operatorName: admin.name || 'المشرف العام',
    operatorEmail: admin.email,
    operatorRole: 'supervisor',
    action: actionText,
    targetItem: targetTitle,
    details: detailText,
    status: 'SUCCESS',
    timestamp: nowFormatted,
  });

  return true;
}

/**
 * تعديل تفاصيل ونصوص المحتوى من لوحة المشرف فقط
 */
export async function updateFeatureContent(
  featureId: string,
  updates: Partial<Pick<ContentFeatureItem, 'title' | 'description' | 'notes'>>,
  admin: { name: string; email: string }
): Promise<boolean> {
  const now = new Date().toISOString();
  const nowFormatted = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const allFeatures = await fetchContentFeatures();
  const target = allFeatures.find((f) => f.id === featureId);
  const targetTitle = target ? target.title : featureId;

  // 1. تحديث Firestore
  try {
    const docRef = doc(db, 'site_content', featureId);
    await setDoc(docRef, {
      ...updates,
      lastModifiedBy: admin.name || admin.email,
      lastModifiedAt: nowFormatted,
      updatedAt: now,
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] تعذر تحديث نصوص المحتوى سحابياً:', err);
  }

  // 2. تحديث المخزن المحلي
  const updatedList = allFeatures.map((item) => {
    if (item.id === featureId) {
      return {
        ...item,
        ...updates,
        lastModifiedBy: admin.name || admin.email,
        lastModifiedAt: nowFormatted,
      };
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_CONTENT_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('rehab_content_updated', { detail: updatedList }));
  }

  // 3. توثيق العملية في سجل الرقابة (Audit Log)
  await recordAuditLog({
    operatorName: admin.name || 'المشرف العام',
    operatorEmail: admin.email,
    operatorRole: 'supervisor',
    action: 'تعديل محتوى ونصوص',
    targetItem: targetTitle,
    details: `تم تحديث نصوص وتفاصيل [${targetTitle}]. العنوان الجديد: "${updates.title || targetTitle}"`,
    status: 'SUCCESS',
    timestamp: nowFormatted,
  });

  return true;
}

/**
 * تسجيل وتوثيق عملية إدارية جديدة في سجل الرقابة الموحد (Audit Log)
 */
export async function recordAuditLog(log: Omit<AuditLogEntry, 'id' | 'createdAtMs'>): Promise<AuditLogEntry> {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowMs = Date.now();
  const entry: AuditLogEntry = {
    ...log,
    id,
    createdAtMs: nowMs,
  };

  // 1. الحفظ في Firestore
  try {
    const docRef = doc(db, 'audit_logs', id);
    await setDoc(docRef, {
      ...entry,
      serverCreatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firestore] تعذر حفظ سجل الرقابة سحابياً، حفظ محلياً:', err);
  }

  // 2. الحفظ في المخزن المحلي
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalAuditLogs();
      const updated = [entry, ...existing].slice(0, 300); // حفظ آخر 300 سجل
      localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('rehab_audit_logs_updated', { detail: updated }));
    } catch {}
  }

  return entry;
}

/**
 * جلب سجلات الرقابة المخزنة محلياً
 */
export function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * جلب جميع سجلات العمليات الإدارية (Firestore مع Fallback محلي)
 */
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('createdAtMs', 'desc'), limit(150));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: AuditLogEntry[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AuditLogEntry));
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(list));
      }
      return list;
    }
  } catch (err) {
    console.warn('[Firestore] تعذر جلب سجل الرقابة من السحابة، قراءة المحلي:', err);
  }

  return getLocalAuditLogs();
}
