/**
 * خدمة الربط الحقيقي بقاعدة بيانات Cloud Firestore
 * مقرأة رحاب القرآن الإلكترونية
 * تدعم: القراءة، الكتابة، الحذف، الترقيم، البحث، والتصفية مع معالجة الأخطاء وحالات التحميل
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp, 
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TaskItem, ScheduleEvent } from '../types';

// Helper for safe timestamps
export const getNowTimestamp = () => new Date().toISOString();

// ==========================================
// 1. واجهات البيانات المشتركة (Common Interfaces)
// ==========================================

export interface MemorizationPlanItem {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  type: 'memorization' | 'revision';
  surahName: string;
  fromAyah: number;
  toAyah: number;
  targetDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_repeat';
  grade?: number; // 0 - 100
  notes?: string;
  updatedAt?: string;
}

export interface UpcomingLessonItem {
  id: string;
  title: string;
  halqaTitle: string;
  teacherName: string;
  teacherId?: string;
  studentId?: string;
  timeDisplay: string;
  date: string;
  durationMinutes: number;
  meetingUrl?: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  halqaTitle: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  halqaTitle?: string;
  studentId?: string;
  studentName?: string;
  teacherName: string;
  dueDate: string;
  status: 'assigned' | 'submitted' | 'reviewed';
  submissionAudioUrl?: string;
  studentSubmissionNotes?: string;
  feedback?: string;
  grade?: number;
  submittedAt?: string;
}

export interface RecitationLogItem {
  id: string;
  studentId: string;
  studentName: string;
  teacherName: string;
  surah: string;
  ayahRange: string;
  riwayah: string;
  date: string;
  gradeScore: number; // 0 - 100
  tajweedNotes: string;
  status: 'mastered' | 'good' | 'needs_practice';
  audioUrl?: string;
  teacherVoiceNoteUrl?: string;
  teacherVoiceDuration?: string;
}

export interface ReportEvaluationItem {
  id: string;
  studentId: string;
  studentName: string;
  teacherName: string;
  period: string; // e.g., 'أسبوع 3 - سبتمبر 2026'
  memorizationScore: number; // 100
  tajweedScore: number; // 100
  attendanceScore: number; // 100
  overallGrade: 'ممتاز مرتفع' | 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول';
  sheikhRecommendation: string;
  date: string;
}

export interface CertificateItem {
  id: string;
  studentName: string;
  courseTitle: string;
  riwayah: string;
  sheikhTeacherName: string;
  serialNumber: string;
  issueDate: string;
  grade: string;
  status: 'issued' | 'pending_verification' | 'revoked';
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'urgent';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface HalqaGroupItem {
  id: string;
  title: string;
  section: 'male' | 'female' | 'both';
  halqaType?: string; // تحفيظ القرآن، تثبيت وإتقان، إجازة بالسند، تصحيح تلاوة، أشبال أطفال، تجويد
  classification?: 'hifz' | 'morajaah' | 'ijazah' | 'tashih' | 'ashbal' | string;
  classificationLabel?: string;
  teacherName: string;
  teacherId?: string;
  timeSlot: string;
  whatsappGroupUrl?: string | null;
  googleMeetUrl?: string | null; // رابط البث المباشر Google Meet المنشور من المعلم
  studentsCount: number;
  maxCapacity: number;
  riwayah: string;
  status: 'active' | 'full' | 'paused';
  days?: string[];
  isLiveNow?: boolean;
}

export interface HalqaAnnouncementItem {
  id: string;
  halqaId: string;
  halqaTitle: string;
  teacherId: string;
  teacherName: string;
  title: string;
  content: string;
  priority?: 'normal' | 'urgent';
  createdAt: string;
  createdAtMs: number;
}

export interface ComplaintTicketItem {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  subject: string;
  category: 'technical' | 'academic' | 'financial' | 'general';
  description: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  operatorName: string;
  operatorRole: string;
  details: string;
  targetId?: string;
  timestamp: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

export interface SubscriptionItem {
  id: string;
  subscriberName: string;
  subscriberPhone: string;
  section: 'male' | 'female';
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'active' | 'pending_renewal' | 'expired';
  startDate: string;
  renewalDate: string;
  receiptNumber?: string;
}

export interface MonthlyContributionItem {
  id: string;
  studentId: string;
  studentName: string;
  month: string;           // e.g. "2026-10"
  monthLabel: string;      // e.g. "أكتوبر 2026"
  amount?: number;
  currency?: string;
  status: 'due' | 'pending_confirmation' | 'paid';
  paymentMethod?: string;
  transferReference?: string;
  studentNotes?: string;
  paymentReportedAt?: string;
  paidAt?: string;
  confirmedByAdminId?: string;
  confirmedByAdminName?: string;
  confirmedAt?: string;
  amountModifiedByAdminName?: string;
  amountModifiedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalContributionSettings {
  defaultMonthlyAmount: number;
  currency: string;
  allowCustomAmount: boolean;
  minAmount?: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  notes?: string;
}

// ==========================================
// 2. دوال الجلب والحفظ المباشرة من Firestore
// ==========================================

// Cache layer for Firestore collection reads (5 minutes TTL) to prevent repeated network queries
const queryMemoryCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateFirestoreCache(collectionName?: string) {
  if (collectionName) {
    for (const key of queryMemoryCache.keys()) {
      if (key.startsWith(`${collectionName}:`)) {
        queryMemoryCache.delete(key);
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(`rehab_fs_${collectionName}:`)) {
            sessionStorage.removeItem(k);
          }
        }
      } catch {}
    }
  } else {
    queryMemoryCache.clear();
    if (typeof sessionStorage !== 'undefined') {
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('rehab_fs_')) {
            sessionStorage.removeItem(k);
          }
        }
      } catch {}
    }
  }
}

export async function fetchCollectionItems<T>(
  collectionName: string,
  options?: {
    whereClause?: { field: string; op: any; value: any }[];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
    bypassCache?: boolean;
  }
): Promise<{ data: T[]; lastDoc?: QueryDocumentSnapshot<DocumentData>; error?: string }> {
  // Generate deterministic cache key
  const cacheKey = `${collectionName}:${JSON.stringify(options?.whereClause || [])}:${options?.orderByField || ''}:${options?.orderDirection || ''}:${options?.limitCount || 25}`;

  // Check in-memory cache if not bypassing and no cursor
  if (!options?.bypassCache && !options?.startAfterDoc) {
    const cached = queryMemoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { data: cached.data as T[] };
    }
    // Check sessionStorage fallback
    if (typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`rehab_fs_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Date.now() - (parsed.timestamp || 0) < CACHE_TTL_MS) {
            queryMemoryCache.set(cacheKey, parsed);
            return { data: parsed.data as T[] };
          }
        }
      } catch {}
    }
  }

  try {
    const colRef = collection(db, collectionName);
    const queryConstraints: any[] = [];

    if (options?.whereClause && options.whereClause.length > 0) {
      options.whereClause.forEach((w) => {
        queryConstraints.push(where(w.field, w.op, w.value));
      });
    }

    if (options?.orderByField) {
      queryConstraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    // Always enforce a default limit (default 25) to avoid downloading entire databases on slow connections
    const safeLimit = options?.limitCount !== undefined ? options.limitCount : 25;
    if (safeLimit > 0) {
      queryConstraints.push(limit(safeLimit));
    }

    if (options?.startAfterDoc) {
      queryConstraints.push(startAfter(options.startAfterDoc));
    }

    const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : query(colRef, limit(25));
    const snapshot = await getDocs(q);

    const items: T[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    } as unknown as T));

    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

    // Cache the query result
    if (!options?.startAfterDoc) {
      const cacheEntry = { timestamp: Date.now(), data: items };
      queryMemoryCache.set(cacheKey, cacheEntry);
      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem(`rehab_fs_${cacheKey}`, JSON.stringify(cacheEntry));
        } catch {}
      }
    }

    return { data: items, lastDoc };
  } catch (err: any) {
    console.warn(`Firestore read warning for ${collectionName}:`, err?.message || err);
    return { data: [], error: err?.message || 'فشل جلب البيانات من قاعدة البيانات السحابية' };
  }
}

export async function saveDocumentItem(
  collectionName: string,
  id: string | null,
  data: Record<string, any>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const colRef = collection(db, collectionName);
    const timestamp = getNowTimestamp();
    const payload: Record<string, any> = {
      ...data,
      updatedAt: timestamp,
    };

    if (id) {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, payload, { merge: true });
      invalidateFirestoreCache(collectionName);
      return { success: true, id };
    } else {
      payload.createdAt = timestamp;
      const newDocRef = await addDoc(colRef, payload);
      invalidateFirestoreCache(collectionName);
      return { success: true, id: newDocRef.id };
    }
  } catch (err: any) {
    console.error(`Firestore save error in ${collectionName}:`, err);
    return { success: false, error: err?.message || 'فشل حفظ السجل في Firestore' };
  }
}

export async function deleteDocumentItem(
  collectionName: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    invalidateFirestoreCache(collectionName);
    return { success: true };
  } catch (err: any) {
    console.error(`Firestore delete error in ${collectionName}:`, err);
    return { success: false, error: err?.message || 'فشل حذف السجل' };
  }
}


// ==========================================
// 3. Task & Schedule Service Functions
// ==========================================
export async function fetchUserTasks(
  userId: string,
  role: 'student' | 'teacher' | 'supervisor' | 'parent' | 'admin' | string,
  filterDate?: string
): Promise<TaskItem[]> {
  try {
    const whereConditions: { field: string; op: any; value: any }[] = [];
    if (role === 'student') {
      whereConditions.push({ field: 'studentId', op: '==', value: userId });
    } else if (role === 'teacher') {
      whereConditions.push({ field: 'teacherId', op: '==', value: userId });
    }
    if (filterDate) {
      whereConditions.push({ field: 'dueDate', op: '==', value: filterDate });
    }

    const res = await fetchCollectionItems<TaskItem>('tasks', {
      whereClause: whereConditions.length > 0 ? whereConditions : undefined,
      limitCount: 50,
      orderByField: 'dueDate',
      orderDirection: 'asc'
    });

    if (res.data && res.data.length > 0) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.warn('Could not fetch tasks from Firestore:', err);
    return [];
  }
}

export async function fetchUserScheduleEvents(
  userId: string,
  role: 'student' | 'teacher' | 'supervisor' | 'parent' | 'admin' | string,
  filterDate?: string
): Promise<ScheduleEvent[]> {
  try {
    const whereConditions: { field: string; op: any; value: any }[] = [];
    if (role === 'student') {
      whereConditions.push({ field: 'studentId', op: '==', value: userId });
    } else if (role === 'teacher') {
      whereConditions.push({ field: 'teacherId', op: '==', value: userId });
    }
    if (filterDate) {
      whereConditions.push({ field: 'date', op: '==', value: filterDate });
    }

    const res = await fetchCollectionItems<ScheduleEvent>('schedules', {
      whereClause: whereConditions.length > 0 ? whereConditions : undefined,
      limitCount: 50,
      orderByField: 'date',
      orderDirection: 'asc'
    });

    if (res.data && res.data.length > 0) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.warn('Could not fetch schedules from Firestore:', err);
    return [];
  }
}


export async function saveTask(task: Partial<TaskItem> & { title: string; dueDate: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  const id = task.id || null;
  const payload = {
    ...task,
    status: task.status || "pending",
    priority: task.priority || "medium",
    type: task.type || "memorization"
  };
  return saveDocumentItem("tasks", id, payload);
}

export async function updateTaskStatus(taskId: string, status: TaskItem["status"]): Promise<{ success: boolean; error?: string }> {
  const updateData: Record<string, any> = { status };
  if (status === "completed") {
    updateData.completedAt = new Date().toISOString();
  }
  return saveDocumentItem("tasks", taskId, updateData);
}

export async function deleteTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  return deleteDocumentItem("tasks", taskId);
}

export async function saveScheduleSession(session: Partial<ScheduleEvent> & { title: string; date: string; startTime: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  const id = session.id || null;
  const payload = {
    ...session,
    status: session.status || "upcoming",
    type: session.type || "halqa",
    timeDisplay: session.timeDisplay || (session.startTime + (session.endTime ? " - " + session.endTime : ""))
  };
  return saveDocumentItem("schedules", id, payload);
}

export async function deleteScheduleSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  return deleteDocumentItem("schedules", sessionId);
}

// ==========================================
// 6. دوال المساهمة الشهرية لدعم المقرأة (Monthly Contributions)
// ==========================================

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function getCurrentMonthInfo(): { key: string; label: string } {
  const d = new Date();
  const year = d.getFullYear();
  const monthNum = d.getMonth(); // 0-indexed
  const key = `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  const label = `${ARABIC_MONTHS[monthNum]} ${year}`;
  return { key, label };
}

export async function fetchStudentMonthlyContributions(studentId: string): Promise<MonthlyContributionItem[]> {
  try {
    const res = await fetchCollectionItems<MonthlyContributionItem>('monthly_contributions', {
      whereClause: [{ field: 'studentId', op: '==', value: studentId }],
      orderByField: 'month',
      orderDirection: 'desc',
      limitCount: 24,
      bypassCache: true
    });
    return res.data || [];
  } catch (err) {
    console.warn('Error fetching monthly contributions for student:', err);
    return [];
  }
}

export async function fetchMonthlyContributionsForAdmin(): Promise<MonthlyContributionItem[]> {
  try {
    const res = await fetchCollectionItems<MonthlyContributionItem>('monthly_contributions', {
      orderByField: 'month',
      orderDirection: 'desc',
      limitCount: 50,
      bypassCache: true
    });
    return res.data || [];
  } catch (err) {
    console.warn('Error fetching monthly contributions for admin:', err);
    return [];
  }
}

export async function getOrCreateCurrentMonthContribution(
  studentId: string, 
  studentName: string
): Promise<MonthlyContributionItem> {
  const { key, label } = getCurrentMonthInfo();
  const docId = `${studentId}_${key}`;

  try {
    // 1. Check existing record
    const existingList = await fetchStudentMonthlyContributions(studentId);
    const found = existingList.find(c => c.month === key || c.id === docId);
    if (found) {
      return found;
    }

    // 2. Create initial due record if none exists yet
    const nowIso = new Date().toISOString();
    const globalSettings = await getGlobalContributionSettings();
    const newRecord: MonthlyContributionItem = {
      id: docId,
      studentId,
      studentName,
      month: key,
      monthLabel: label,
      amount: globalSettings.defaultMonthlyAmount || 3000,
      currency: globalSettings.currency || 'ريال يمني',
      status: 'due',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await saveDocumentItem('monthly_contributions', docId, newRecord);
    invalidateFirestoreCache('monthly_contributions');
    return newRecord;
  } catch (err) {
    console.warn('Fallback generating local month record:', err);
    return {
      id: docId,
      studentId,
      studentName,
      month: key,
      monthLabel: label,
      amount: 3000,
      currency: 'ريال يمني',
      status: 'due',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export async function reportMonthlyContributionPayment(
  contributionId: string,
  studentId: string,
  paymentData: {
    paymentMethod: string;
    transferReference?: string;
    studentNotes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: 'pending_confirmation',
      paymentMethod: paymentData.paymentMethod,
      transferReference: paymentData.transferReference?.trim() || '',
      studentNotes: paymentData.studentNotes?.trim() || '',
      paymentReportedAt: nowIso,
      updatedAt: nowIso
    };

    const res = await saveDocumentItem('monthly_contributions', contributionId, updatePayload);
    if (!res.success) {
      return { success: false, error: res.error || 'تعذر تسجيل الإشعار' };
    }

    // Send in-app notification to supervisors/admin
    try {
      await saveDocumentItem('notifications', null, {
        userId: 'admin',
        title: 'إشعار سداد مساهمة شهرية جديد',
        message: `قام الطالب بإرسال إشعار سداد المساهمة الشهرية عبر ${paymentData.paymentMethod}، بانتظار المراجعة والاعتماد.`,
        type: 'info',
        createdAt: nowIso,
        read: false,
        referenceId: contributionId
      });
    } catch {
      // Non-blocking notification
    }

    invalidateFirestoreCache('monthly_contributions');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل إرسال الإشعار' };
  }
}

export async function confirmMonthlyContributionByAdmin(
  contributionId: string,
  adminId: string,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: 'paid',
      confirmedByAdminId: adminId,
      confirmedByAdminName: adminName,
      confirmedAt: nowIso,
      paidAt: nowIso,
      updatedAt: nowIso
    };

    const res = await saveDocumentItem('monthly_contributions', contributionId, updatePayload);
    if (!res.success) {
      return { success: false, error: res.error || 'تعذر تأكيد السداد' };
    }

    invalidateFirestoreCache('monthly_contributions');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل تأكيد السداد من الإدارة' };
  }
}

// دالة جلب مستند مفرد من Firestore
export async function fetchDocumentItem<T>(collectionName: string, docId: string): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { success: false, error: 'Document not found' };
    }
    return { success: true, data: { id: snap.id, ...snap.data() } as T };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error fetching document' };
  }
}

// 7. دوال صلاحيات المشرف العام لتعديل مبالغ وإعدادات المساهمة
export const DEFAULT_CONTRIBUTION_SETTINGS: GlobalContributionSettings = {
  defaultMonthlyAmount: 3000,
  currency: 'ريال يمني',
  allowCustomAmount: true,
  minAmount: 1000,
  notes: 'المساهمة الشهرية المقترحة لدعم حلقات التحفيظ ورواتب المعلمين والمعلمات (3000 ريال يمني قديم أو ما يعادلها)'
};

export async function getGlobalContributionSettings(): Promise<GlobalContributionSettings> {
  try {
    const res = await fetchDocumentItem<GlobalContributionSettings>('app_settings', 'monthly_contribution');
    if (res.data && res.data.defaultMonthlyAmount) {
      return res.data;
    }
  } catch (err) {
    console.warn('Fallback fetching global contribution settings from local storage:', err);
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('rihab_global_contribution_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return DEFAULT_CONTRIBUTION_SETTINGS;
}

export async function saveGlobalContributionSettings(
  settings: Partial<GlobalContributionSettings>,
  adminName: string
): Promise<{ success: boolean; data?: GlobalContributionSettings; error?: string }> {
  try {
    const current = await getGlobalContributionSettings();
    const updated: GlobalContributionSettings = {
      ...current,
      ...settings,
      lastUpdatedBy: adminName,
      lastUpdatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('rihab_global_contribution_settings', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('contribution_settings_updated', { detail: updated }));
    }

    await saveDocumentItem('app_settings', 'monthly_contribution', updated);
    invalidateFirestoreCache('app_settings');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'تعذر حفظ إعدادات مبلغ المساهمة' };
  }
}

export async function updateMonthlyContributionAmount(
  contributionId: string,
  newAmount: number,
  adminName: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      amount: newAmount,
      amountModifiedByAdminName: adminName,
      amountModifiedAt: nowIso,
      updatedAt: nowIso
    };
    if (adminNotes && adminNotes.trim()) {
      updatePayload.adminNotes = adminNotes.trim();
    }

    const res = await saveDocumentItem('monthly_contributions', contributionId, updatePayload);
    if (!res.success) {
      return { success: false, error: res.error || 'تعذر تعديل مبلغ المساهمة' };
    }

    invalidateFirestoreCache('monthly_contributions');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل تعديل مبلغ المساهمة في الخادم' };
  }
}

export async function updateSubscriptionAmount(
  subscriptionId: string,
  newAmount: number,
  adminName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      amount: newAmount,
      modifiedByAdminName: adminName,
      updatedAt: nowIso
    };

    const res = await saveDocumentItem('financialContributions', subscriptionId, updatePayload);
    if (!res.success) {
      return { success: false, error: res.error || 'تعذر تعديل مبلغ الاشتراك' };
    }

    invalidateFirestoreCache('financialContributions');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل تعديل مبلغ الاشتراك' };
  }
}

