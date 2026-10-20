/**
 * خدمة إدارة طلبات واستمارات تسجيل الطلاب
 * Student Applications & Enrollment Lifecycle Service
 * 
 * الميزات:
 * 1. حفظ جميع بيانات الاستمارة في Firebase Firestore ضمن مجموعة `student_applications`.
 * 2. عدم تخزين كلمات المرور كنص مكشوف في Firestore إطلاقاً.
 * 3. إظهار الطلبات بحالة «قيد المراجعة» (pending_review) فور تقديمها.
 * 4. قبول الطلب: إنشاء رقم أكاديمي فريد، ربطه بـ Firebase Auth & Firestore، وتجهيز بيانات الدخول ورسالة واتساب.
 * 5. رفض الطلب: حفظ سبب الرفض وتجهيز رسالة واتساب المعتذرة للطالب.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  saveRegisteredStudent, 
  updateStudentStatus, 
  getRegisteredStudents,
  RegisteredStudent,
  addSupervisorNotification
} from '../data/registrationStore';
import { 
  createNewStudentAccount, 
  getAcademyDatabase, 
  saveAcademyDatabase,
  DbStudent,
  DbUser
} from '../data/academyDb';
import { 
  buildAcceptanceMessage, 
  buildRejectionMessage, 
  sendOrPrepareWhatsAppMessage,
  buildStudentAccountWhatsAppMessage,
  buildStudentAdmissionWhatsAppInstructions,
  validateAndCleanWhatsAppNumber,
  WhatsAppMessageResult 
} from './whatsappService';
import { formatPhoneToEmail, formatAcademicIdToEmail } from '../lib/authService';
import { assignStudentHalqaBySupervisor } from './chatService';
import { getAllAccounts, saveAccounts } from '../data/authStore';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface StudentApplicationItem {
  id: string;
  fullName: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  whatsapp: string;
  country: string;
  memorization: string;
  studyType: string;
  riwayah: string;
  preferredTime: string;
  preferredTimeDetail?: string;
  monthlyContribution?: string;
  academicId?: string;
  userId?: string;
  email?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'pending' | 'accepted';
  notes?: string;
  assignedHalqaTitle?: string;
  teacherName?: string;
  halqaDays?: string;
  halqaTime?: string;
  timezone?: string;
  googleMeetUrl?: string;
  whatsappGroupUrl?: string;
  createdAt: string;
  registeredAt?: string;
}

export function normalizeStudyType(val?: string): 'foundation' | 'memorization' | 'review' | 'consolidation' | 'sanad' {
  if (!val) return 'memorization';
  if (val.includes('سند') || val.includes('إجازة') || val.toLowerCase() === 'sanad') return 'sanad';
  if (val.includes('تأسيس') || val.includes('تلقين') || val.includes('نورانية') || val.toLowerCase() === 'foundation') return 'foundation';
  if (val.includes('تثبيت') || val.includes('مراجعة') || val.toLowerCase() === 'consolidation') return 'consolidation';
  if (val.includes('تصحيح') || val.includes('تجويد') || val.toLowerCase() === 'review') return 'review';
  return 'memorization';
}

/**
 * توليد رقم أكاديمي فريد للطالب المقبول
 * الصيغة الرسمية: RQ-2026-XXXX
 */
export function generateUniqueAcademicId(existingIds: string[] = []): string {
  const currentYear = new Date().getFullYear();
  let candidate = '';
  let attempts = 0;
  
  do {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 أرقام
    candidate = `RQ-${currentYear}-${randomSuffix}`;
    attempts++;
  } while (existingIds.includes(candidate) && attempts < 50);

  return candidate;
}

/**
 * تقديم وحفظ طلب تسجيل جديد في Firebase Firestore
 * مع تنبيه المشرف فوراً وعدم تخزين كلمة المرور كنص مكشوف.
 */
export async function submitStudentApplicationToFirestore(data: {
  fullName: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  whatsapp: string;
  country: string;
  memorization: string;
  studyType: string;
  riwayah: string;
  preferredTime: string;
  preferredTimeDetail?: string;
  monthlyContribution?: string;
  notes?: string;
  userId?: string;
  email?: string;
}): Promise<StudentApplicationItem> {
  const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const registeredAtArabic = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const applicationItem: StudentApplicationItem = {
    id: appId,
    userId: data.userId || undefined,
    email: data.email || undefined,
    fullName: data.fullName.trim(),
    gender: data.gender,
    age: Number(data.age) || 18,
    phone: data.phone.trim(),
    whatsapp: (data.whatsapp || data.phone).trim(),
    country: data.country.trim(),
    memorization: data.memorization,
    studyType: data.studyType,
    riwayah: data.riwayah,
    preferredTime: data.preferredTime,
    preferredTimeDetail: data.preferredTimeDetail || '',
    monthlyContribution: data.monthlyContribution || '',
    status: 'pending',
    notes: data.notes || '',
    createdAt: now,
    registeredAt: registeredAtArabic,
  };

  // 1. الحفظ في Firebase Firestore (بدون أي كلمات مرور)
  try {
    const docRef = doc(db, 'student_applications', appId);
    await setDoc(docRef, {
      ...applicationItem,
      createdAtServer: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firestore] تعذر الحفظ السحابي المباشر، جاري الحفظ المحلي الآمن:', err);
  }

  // 2. المزامنة مع المخزن المحلي والإشعار الفوري للمشرف
  try {
    saveRegisteredStudent({
      name: applicationItem.fullName,
      age: String(applicationItem.age),
      country: applicationItem.country,
      section: applicationItem.gender,
      memorization: applicationItem.memorization,
      studyType: applicationItem.studyType,
      riwayah: applicationItem.riwayah,
      preferredTime: applicationItem.preferredTime,
      preferredTimeDetail: applicationItem.preferredTimeDetail,
      wantsSanad: applicationItem.studyType.includes('سند') ? 'نعم' : 'لا',
      phone: applicationItem.phone,
      monthlyContribution: applicationItem.monthlyContribution,
      notes: `رقم واتساب: ${applicationItem.whatsapp} | ${applicationItem.notes || ''}`.trim(),
      status: 'pending',
    });

    addSupervisorNotification({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'new_student_registration',
      title: `طلب تسجيل جديد قيد المراجعة: ${applicationItem.fullName}`,
      message: `سجّل طالب جديد (${applicationItem.fullName}) في ${applicationItem.gender === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}. رقم الواتساب: ${applicationItem.whatsapp}. بانتظار اعتماد المشرف.`,
      studentId: appId,
      studentName: applicationItem.fullName,
      section: applicationItem.gender,
      phone: applicationItem.whatsapp,
      memorization: applicationItem.memorization,
      timestamp: registeredAtArabic,
      createdAtMs: Date.now(),
      read: false,
    });
    invalidateStudentApplicationsCache();
  } catch (e) {
    console.error('Failed to notify supervisor', e);
  }

  invalidateStudentApplicationsCache();
  return applicationItem;
}

let studentApplicationsCache: { timestamp: number; data: StudentApplicationItem[] } | null = null;
const CACHE_TTL_MS = 45000; // 45 seconds

export function invalidateStudentApplicationsCache() {
  studentApplicationsCache = null;
}

/**
 * جلب جميع طلبات التسجيل من Firestore مع التخزين المؤقت وتحديد العدد لتقليل القراءات السحابية
 */
export async function fetchAllStudentApplications(forceRefresh = false): Promise<StudentApplicationItem[]> {
  const now = Date.now();
  if (!forceRefresh && studentApplicationsCache && (now - studentApplicationsCache.timestamp < CACHE_TTL_MS)) {
    return studentApplicationsCache.data;
  }

  try {
    const q = query(
      collection(db, 'student_applications'), 
      orderBy('createdAt', 'desc'),
      limit(60)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items: StudentApplicationItem[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as StudentApplicationItem);
      });
      studentApplicationsCache = { timestamp: now, data: items };
      return items;
    }
  } catch (err) {
    console.warn('[Firestore] تعذر قراءة الطلبات من السحابة، جلب السجلات المحلية:', err);
  }

  // Fallback من السجلات المحلية المسجلة
  const localStudents = getRegisteredStudents();
  return localStudents.map((s) => ({
    id: s.id,
    fullName: s.name,
    gender: s.section,
    age: Number(s.age) || 18,
    phone: s.phone || '',
    whatsapp: s.phone || '',
    country: s.country || 'اليمن',
    memorization: s.memorization,
    studyType: s.studyType || 'تحفيظ القرآن الكريم',
    riwayah: s.riwayah || 'حفص عن عاصم',
    preferredTime: s.preferredTime,
    preferredTimeDetail: s.preferredTimeDetail,
    monthlyContribution: s.monthlyContribution,
    status: s.status === 'approved' ? 'approved' : s.status === 'rejected' ? 'rejected' : 'pending_review',
    createdAt: new Date().toISOString(),
    registeredAt: s.registeredAt,
    notes: s.notes,
  }));
}

/**
 * قبول طلب التسجيل وإنشاء الحساب الأكاديمي وربطه بـ Firebase وتجهيز رسالة واتساب
 */
export async function approveStudentApplication(params: {
  applicationId: string;
  adminName: string;
  application: StudentApplicationItem;
}): Promise<{
  success: boolean;
  academicId: string;
  whatsAppResult: WhatsAppMessageResult;
  error?: string;
}> {
  try {
    const { applicationId, adminName, application } = params;

    // 1. جمع المعرفات الموجودة لضمان فرادة الرقم الأكاديمي
    const academyDb = getAcademyDatabase();
    const existingAcademicIds = academyDb.students.map((s) => s.academicId).filter(Boolean);
    const uniqueAcademicId = generateUniqueAcademicId(existingAcademicIds);

    const now = new Date().toISOString();
    const halqaTitle = application.gender === 'female' 
      ? 'حلقة قسم الطالبات (الفجر)' 
      : 'حلقة قسم الطلاب (الفجر)';

    // 2. تحديث وثيقة طلب التسجيل في Firestore
    try {
      const appRef = doc(db, 'student_applications', applicationId);
      await updateDoc(appRef, {
        status: 'approved',
        academicId: uniqueAcademicId,
        approvedAt: now,
        approvedBy: adminName,
      });
    } catch (e) {
      console.warn('[Firestore] Error updating application status:', e);
    }

    const studentDocId = `std-${applicationId.replace(/^app-/, '')}`;
    const studyTypeNormalized = normalizeStudyType(application.studyType);
    const academicEmail = formatAcademicIdToEmail(uniqueAcademicId);

    const { user: newAccountUser, student: newAccountStudent } = createNewStudentAccount({
      id: studentDocId,
      name: application.fullName,
      email: academicEmail,
      phone: application.whatsapp || application.phone,
      age: application.age || 18,
      gender: application.gender,
      cityCountry: application.country || 'اليمن',
      studyType: studyTypeNormalized,
      riwayah: application.riwayah,
      preferredTime: application.preferredTime,
      preferredTimeDetail: application.preferredTimeDetail,
      memorizationLevel: application.memorization,
    });

    // تعيين المعرف الأكاديمي الموحد
    newAccountUser.academicId = uniqueAcademicId;
    newAccountStudent.academicId = uniqueAcademicId;
    newAccountStudent.className = halqaTitle;

    try {
      await setDoc(doc(db, 'students', studentDocId), newAccountStudent, { merge: true });
      await setDoc(doc(db, 'users', studentDocId), newAccountUser, { merge: true });
    } catch (e) {
      console.warn('[Firestore] Error saving approved student profile:', e);
    }

    updateStudentStatus(applicationId, 'approved');

    // 5. تجهيز رسالة القبول الرسمية ورابط واتساب
    const msgText = buildAcceptanceMessage({
      studentName: application.fullName,
      academicId: uniqueAcademicId,
      section: application.gender,
      studyType: application.studyType,
      riwayah: application.riwayah,
      preferredTime: application.preferredTime,
      preferredTimeDetail: application.preferredTimeDetail,
    });

    const whatsAppResult = await sendOrPrepareWhatsAppMessage({
      phone: application.whatsapp || application.phone,
      messageText: msgText,
      countryOrCode: application.country,
    });

    invalidateStudentApplicationsCache();
    return {
      success: true,
      academicId: uniqueAcademicId,
      whatsAppResult,
    };
  } catch (err: any) {
    console.error('Error approving student application:', err);
    return {
      success: false,
      academicId: '',
      whatsAppResult: {
        sentViaApi: false,
        whatsappUrl: '',
        messageText: '',
        cleanPhone: '',
      },
      error: err?.message || 'فشل قبول الطلب',
    };
  }
}

export interface ApproveWithAssignmentParams {
  applicationId: string;
  adminName: string;
  application: StudentApplicationItem;
  academicId: string;
  username: string;
  temporaryPassword: string;
  halqaId: string;
  halqaTitle: string;
  teacherId: string;
  teacherName: string;
  halqaDays: string;
  halqaTime: string;
  timezone: string;
  studentLevelOrPlan: string;
  googleMeetUrl?: string;
  whatsappGroupUrl?: string;
}

export interface ApproveWithAssignmentResult {
  success: boolean;
  academicId: string;
  username: string;
  temporaryPassword: string;
  halqaTitle: string;
  teacherName: string;
  halqaSchedule: string;
  googleMeetUrl?: string;
  whatsappGroupUrl?: string;
  whatsAppResult: WhatsAppMessageResult;
  error?: string;
}

/**
 * قبول طلب التسجيل وتعيين الحلقة والمعلم وبناء الحساب الأكاديمي الشامل
 * يربط: student -> assignedHalqa -> assignedTeacher
 * ويولد رسالة WhatsApp المجهزة ببيانات الدخول ورابط المنصة
 */
export async function approveStudentApplicationWithAssignment(
  params: ApproveWithAssignmentParams
): Promise<ApproveWithAssignmentResult> {
  const {
    applicationId,
    adminName,
    application,
    academicId,
    username,
    temporaryPassword,
    halqaId,
    halqaTitle,
    teacherId,
    teacherName,
    halqaDays,
    halqaTime,
    timezone,
    studentLevelOrPlan,
    googleMeetUrl,
    whatsappGroupUrl
  } = params;

  try {
    const now = new Date().toISOString();
    const halqaSchedule = `${halqaDays} (${halqaTime}) - ${timezone}`;
    const cleanMeetUrl = googleMeetUrl?.trim() || undefined;
    const cleanWhatsappGroupUrl = whatsappGroupUrl?.trim() || undefined;
    const studentDocId = `std-${applicationId.replace(/^app-/, '')}`;
    const academicEmail = formatAcademicIdToEmail(academicId);
    const phoneEmail = formatPhoneToEmail(application.whatsapp || application.phone);
    const primaryAuthEmail = academicEmail;

    // 1. إنشاء حساب الطالب في Firebase Auth بأمان وبنفس كلمة المرور المعتمدة
    let authUid = studentDocId;
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const apiRes = await fetch('/api/admin/create-student-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          academicId,
          password: temporaryPassword,
          fullName: application.fullName,
          phone: application.whatsapp || application.phone,
          gender: application.gender,
          country: application.country,
          timezone,
          assignedHalqaId: halqaId,
          assignedHalqaTitle: halqaTitle,
          teacherId,
          teacherName,
          days: halqaDays,
          timeSlot: halqaTime,
          studyLevel: studentLevelOrPlan,
          googleMeetUrl: cleanMeetUrl,
          whatsappGroupUrl: cleanWhatsappGroupUrl
        })
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.uid) {
          authUid = apiData.uid;
        }
      }
    } catch (apiErr) {
      console.warn('[studentApplicationService] create-student-account server call fallback:', apiErr);
    }

    // خطة بديلة عبر تطبيق ثانوي لـ Firebase لضمان عدم خروج المشرف
    if (authUid === studentDocId) {
      try {
        const { initializeApp, deleteApp } = await import('firebase/app');
        const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');
        const { firebaseConfig } = await import('../lib/firebase');
        const secApp = initializeApp(firebaseConfig, `create-std-${Date.now()}`);
        const secAuth = getAuth(secApp);
        const cred = await createUserWithEmailAndPassword(secAuth, primaryAuthEmail, temporaryPassword).catch(() => null);
        if (cred?.user?.uid) {
          authUid = cred.user.uid;
        }
        await deleteApp(secApp).catch(() => {});
      } catch (secErr) {
        console.warn('[studentApplicationService] secondary client auth creation:', secErr);
      }
    }

    // 2. تحديث وثيقة طلب التسجيل في Firestore إلى accepted
    try {
      const appRef = doc(db, 'student_applications', applicationId);
      await updateDoc(appRef, {
        status: 'accepted',
        academicId,
        username: academicId,
        authEmail: primaryAuthEmail,
        authUid,
        assignedHalqaId: halqaId,
        assignedHalqaTitle: halqaTitle,
        teacherId,
        teacherName,
        halqaDays,
        halqaTime,
        timezone,
        halqaSchedule,
        googleMeetUrl: cleanMeetUrl || null,
        whatsappGroupUrl: cleanWhatsappGroupUrl || null,
        studentLevelOrPlan,
        approvedAt: now,
        approvedBy: adminName,
      });
    } catch (e) {
      console.warn('[Firestore] Error updating application document:', e);
    }

    // 3. إنشاء وتحديث سجل الطالب في Firestore /students (بدون كلمة المرور كنص مكشوف)
    const studentRecord = {
      id: studentDocId,
      userId: authUid,
      academicId,
      name: application.fullName,
      email: primaryAuthEmail,
      phoneEmail,
      phone: application.whatsapp || application.phone,
      gender: application.gender,
      age: application.age || 18,
      cityCountry: application.country || 'اليمن',
      assignedHalqaId: halqaId,
      assignedHalqaTitle: halqaTitle,
      classId: halqaId,
      className: halqaTitle,
      teacherId,
      teacherName,
      halqaDays,
      halqaTime,
      timezone,
      halqaSchedule,
      googleMeetUrl: cleanMeetUrl || null,
      whatsappGroupUrl: cleanWhatsappGroupUrl || null,
      studyType: normalizeStudyType(studentLevelOrPlan),
      memorizationLevel: studentLevelOrPlan,
      riwayah: application.riwayah || 'حفص عن عاصم',
      attendanceRate: 100,
      status: 'active',
      isActive: true,
      registeredAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'students', studentDocId), studentRecord, { merge: true });
      if (authUid && authUid !== studentDocId) {
        await setDoc(doc(db, 'students', authUid), { ...studentRecord, id: authUid }, { merge: true });
      }
    } catch (e) {
      console.warn('[Firestore] Error saving student record:', e);
    }

    // 4. إنشاء وتحديث سجل المستخدم في Firestore /users (بدون كلمة المرور)
    const userRecord = {
      id: authUid,
      userId: authUid,
      academicId,
      username: academicId, // اسم المستخدم الظاهر للطالب = الرقم الأكاديمي
      fullName: application.fullName,
      name: application.fullName,
      email: primaryAuthEmail,
      phoneEmail,
      phone: application.whatsapp || application.phone,
      role: 'student' as const,
      gender: application.gender,
      country: application.country || 'اليمن',
      timezone,
      assignedHalqaId: halqaId,
      assignedHalqaTitle: halqaTitle,
      teacherId,
      teacherName,
      halqaSchedule,
      googleMeetUrl: cleanMeetUrl || null,
      whatsappGroupUrl: cleanWhatsappGroupUrl || null,
      isActive: true,
      status: 'accepted',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', studentDocId), userRecord, { merge: true });
      if (authUid && authUid !== studentDocId) {
        await setDoc(doc(db, 'users', authUid), userRecord, { merge: true });
      }
      if (application.userId && application.userId !== authUid && application.userId !== studentDocId) {
        await setDoc(doc(db, 'users', application.userId), userRecord, { merge: true });
      }
    } catch (e) {
      console.warn('[Firestore] Error saving user record:', e);
    }

    // 5. ربط الطالب والمعلم والحلقة في خدمة المحادثة ومخزن الإسناد
    try {
      await assignStudentHalqaBySupervisor({
        studentId: studentDocId,
        studentName: application.fullName,
        academicId,
        teacherId,
        teacherName,
        halqaId,
        halqaTitle,
        halqaSchedule,
        whatsappGroupUrl: cleanWhatsappGroupUrl,
        googleMeetUrl: cleanMeetUrl,
      });
    } catch (e) {
      console.warn('[Chat/Halqa Service] Error linking assignment:', e);
    }

    // 6. تحديث قاعدة بيانات المقرأة (Academy Database) لتظهر في الحلقات والمعلمين فوراً
    try {
      const academyDb = getAcademyDatabase();
      const existingIdx = academyDb.students.findIndex(s => s && (s.id === studentDocId || s.academicId === academicId));
      const studentDbRecord: DbStudent = {
        id: studentDocId,
        userId: authUid,
        academicId,
        name: application.fullName,
        email: primaryAuthEmail,
        phone: application.whatsapp || application.phone,
        age: application.age || 18,
        gender: application.gender,
        cityCountry: application.country || 'اليمن',
        studyType: normalizeStudyType(studentLevelOrPlan),
        riwayah: application.riwayah || 'حفص عن عاصم',
        preferredTime: halqaSchedule,
        teacherId,
        teacherName,
        classId: halqaId,
        className: halqaTitle,
        currentJuz: 1,
        currentSurah: 'الفاتحة',
        currentAyahStart: 1,
        currentAyahEnd: 7,
        totalMemorizedPages: 0,
        attendanceRate: 100,
        lastAttendanceDate: now.split('T')[0],
        lastRecitationDate: '',
        lastScore: 100,
        lastGrade: 'ممتاز',
        nextLessonDate: halqaDays.split('،')[0] || 'السبت',
        nextLessonSurah: 'البقرة',
        notes: `مستوى الطالب: ${studentLevelOrPlan}`,
        registeredAt: now.split('T')[0],
      };

      if (existingIdx >= 0) {
        academyDb.students[existingIdx] = studentDbRecord;
      } else {
        academyDb.students.unshift(studentDbRecord);
      }

      // إضافة أو تحديث المستخدم المقابل في academyDb.users
      const existingUserIdx = academyDb.users.findIndex(u => u && (u.id === authUid || u.academicId === academicId));
      const userDbRecord: DbUser = {
        id: authUid,
        name: application.fullName,
        email: primaryAuthEmail,
        phone: application.whatsapp || application.phone,
        academicId,
        role: 'student',
        section: application.gender,
        status: 'approved',
        createdAt: now.split('T')[0],
      };
      if (existingUserIdx >= 0) {
        academyDb.users[existingUserIdx] = { ...academyDb.users[existingUserIdx], ...userDbRecord };
      } else {
        academyDb.users.push(userDbRecord);
      }

      // زيادة عدد الطلاب في الحلقة وتحديث بياناتها
      const halqaClass = academyDb.classes.find(c => c && (c.id === halqaId || c.name === halqaTitle));
      if (halqaClass) {
        halqaClass.enrolledCount = (halqaClass.enrolledCount || 0) + 1;
        halqaClass.teacherId = teacherId;
        halqaClass.teacherName = teacherName;
        if (cleanMeetUrl) halqaClass.meetUrl = cleanMeetUrl;
        halqaClass.scheduleTime = `${halqaTime} (${timezone})`;
        halqaClass.days = halqaDays.split('،').map(d => d.trim()).filter(Boolean);
      }

      saveAcademyDatabase(academyDb);
    } catch (e) {
      console.warn('[AcademyDb] Error syncing student in local database:', e);
    }

    // 7. تحديث مخزن الحسابات المحلي authStore لتمكين تسجيل الدخول المباشر
    try {
      const allAccounts = getAllAccounts();
      const existingAccountIdx = allAccounts.findIndex(a => a && (a.username === academicId || a.id === studentDocId || a.id === authUid));
      const newAuthAccount = {
        id: authUid,
        academicId,
        name: application.fullName,
        username: academicId, // اسم المستخدم = الرقم الأكاديمي
        email: primaryAuthEmail,
        phone: application.whatsapp || application.phone,
        role: 'student' as const,
        section: application.gender,
        titleBadge: 'طالب في المقرأة',
        assignedHalqaTitle: halqaTitle,
        registeredAt: now.split('T')[0],
        status: 'approved' as const,
        isActive: true,
      };

      if (existingAccountIdx >= 0) {
        allAccounts[existingAccountIdx] = { ...allAccounts[existingAccountIdx], ...newAuthAccount };
      } else {
        allAccounts.unshift(newAuthAccount);
      }
      saveAccounts(allAccounts);
      window.dispatchEvent(new CustomEvent('rehab_auth_accounts_updated', { detail: allAccounts }));
    } catch (e) {
      console.warn('[AuthStore] Error syncing student account:', e);
    }

    updateStudentStatus(applicationId, 'accepted');

    // 8. تجهيز نص رسالة واتساب الرسمية المعتمدة لتعليمات الدخول
    const loginIdentifierDisplay = (application.email && !application.email.includes('@student.rehabquran.com'))
      ? application.email
      : (application.phone || application.whatsapp || application.email || academicId);

    const messageText = buildStudentAdmissionWhatsAppInstructions({
      username: loginIdentifierDisplay,
      halqaTitle,
      teacherName,
      halqaDays,
      halqaTime,
      loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://rehab-quran.web.app/login',
      googleMeetUrl: cleanMeetUrl,
      whatsappGroupUrl: cleanWhatsappGroupUrl,
    });

    const phoneValidation = validateAndCleanWhatsAppNumber(
      application.whatsapp || application.phone,
      application.country
    );

    const whatsAppResult: WhatsAppMessageResult = {
      sentViaApi: false,
      whatsappUrl: phoneValidation.isValid 
        ? `https://wa.me/${phoneValidation.cleanPhone}?text=${encodeURIComponent(messageText)}`
        : '',
      messageText,
      cleanPhone: phoneValidation.cleanPhone,
      formattedDisplay: phoneValidation.formattedDisplay,
      isValid: phoneValidation.isValid,
      error: phoneValidation.error,
    };

    invalidateStudentApplicationsCache();

    return {
      success: true,
      academicId,
      username,
      temporaryPassword,
      halqaTitle,
      teacherName,
      halqaSchedule,
      googleMeetUrl: cleanMeetUrl,
      whatsappGroupUrl: cleanWhatsappGroupUrl,
      whatsAppResult,
    };
  } catch (err: any) {
    console.error('Error approving student application with assignment:', err);
    return {
      success: false,
      academicId,
      username,
      temporaryPassword,
      halqaTitle,
      teacherName,
      halqaSchedule: `${halqaDays} (${halqaTime})`,
      whatsAppResult: {
        sentViaApi: false,
        whatsappUrl: '',
        messageText: '',
        cleanPhone: '',
      },
      error: err?.message || 'حدث خطأ غير متوقع أثناء إعداد وتعيين حساب الطالب',
    };
  }
}


/**
 * رفض طلب التسجيل وحفظ سبب الرفض وتجهيز رسالة واتساب المعتذرة
 */
export async function rejectStudentApplication(params: {
  applicationId: string;
  adminName: string;
  reason: string;
  application: StudentApplicationItem;
}): Promise<{
  success: boolean;
  whatsAppResult: WhatsAppMessageResult;
  error?: string;
}> {
  try {
    const { applicationId, adminName, reason, application } = params;
    const now = new Date().toISOString();

    // 1. تحديث Firestore بحالة الرفض وسبب الرفض
    try {
      const appRef = doc(db, 'student_applications', applicationId);
      await updateDoc(appRef, {
        status: 'rejected',
        rejectionReason: reason.trim(),
        rejectedAt: now,
        rejectedBy: adminName,
      });
    } catch (e) {
      console.warn('[Firestore] Error updating rejection status:', e);
    }

    // 2. تحديث المخزن المحلي
    updateStudentStatus(applicationId, 'rejected');

    // 3. تجهيز رسالة الاعتذار اللبقة ورابط واتساب
    const msgText = buildRejectionMessage({
      studentName: application.fullName,
      section: application.gender,
      reason: reason.trim(),
    });

    const whatsAppResult = await sendOrPrepareWhatsAppMessage({
      phone: application.whatsapp || application.phone,
      messageText: msgText,
      countryOrCode: application.country,
    });

    invalidateStudentApplicationsCache();
    return {
      success: true,
      whatsAppResult,
    };
  } catch (err: any) {
    console.error('Error rejecting student application:', err);
    return {
      success: false,
      whatsAppResult: {
        sentViaApi: false,
        whatsappUrl: '',
        messageText: '',
        cleanPhone: '',
      },
      error: err?.message || 'فشل تسجيل الرفض',
    };
  }
}

export interface StudentAuthSyncStatusItem {
  id: string;
  academicId: string;
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  halqaTitle: string;
  teacherName: string;
  registeredAt: string;
  existsInAuth: boolean;
  authStatus: 'synced' | 'missing' | 'error';
  authUid: string | null;
  detailedError: string | null;
}

export interface StudentAuthSyncStatusResult {
  success: boolean;
  totalApproved: number;
  syncedCount: number;
  pendingCount: number;
  pendingStudents: StudentAuthSyncStatusItem[];
  allStudentsStatus: StudentAuthSyncStatusItem[];
  error?: string;
}

/**
 * استعلام حالة حسابات Firebase Auth للطلاب المقبولين
 */
export async function fetchPendingAuthStudents(): Promise<StudentAuthSyncStatusResult> {
  try {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
    const res = await fetch('/api/admin/students/auth-sync-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'تعذر جلب حالة حسابات الطلاب من الخادم');
    }

    const data: StudentAuthSyncStatusResult = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[studentApplicationService] fetchPendingAuthStudents fallback/notice:', err);
    return {
      success: false,
      totalApproved: 0,
      syncedCount: 0,
      pendingCount: 0,
      pendingStudents: [],
      allStudentsStatus: [],
      error: err?.message || 'تعذر الاتصال بالخادم لفحص حالة الحسابات'
    };
  }
}

/**
 * إعادة محاولة إنشاء حساب طالب في Firebase Auth
 */
export async function retryCreateStudentAuth(params: {
  academicId: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{
  success: boolean;
  uid?: string;
  email?: string;
  academicId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
    const res = await fetch('/api/admin/students/retry-create-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'فشلت عملية إنشاء الحساب في Firebase Auth');
    }

    return data;
  } catch (err: any) {
    console.error('Error retrying student auth creation:', err);
    return {
      success: false,
      error: err?.message || 'حدث خطأ أثناء محاولة إنشاء حساب Firebase Auth'
    };
  }
}
