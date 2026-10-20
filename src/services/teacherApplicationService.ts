/**
 * خدمة استمارات وتسجيل واعتماد المعلمين
 * مقرأة رحاب القرآن الإلكترونية - الإصدار المعتمد 2026
 *
 * تتولى:
 * 1. تسجيل المعلم الجديد في Firebase Auth و Firestore (teachers & users) بحالة "pending".
 * 2. جلب وتحديث طلبات المعلمين المعلقة في لوحة المشرف.
 * 3. قبول المعلم مع تعيين الحلقات والأوقات.
 * 4. رفض الطلب وتوثيق الإجراء.
 * 5. إنشاء رسالة WhatsApp الرسمية بتعليمات الدخول بعد القبول.
 */

import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { validateAndCleanWhatsAppNumber } from './whatsappService';
import { recordAuditLog } from './contentManagementService';
import { cleanEmail as sanitizeEmail, isValidEmail } from '../utils/emailValidation';

export interface TeacherApplication {
  id: string;
  uid: string;
  name: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  // المؤهلات العلمية
  qualifications: {
    ijazat: string; // الإجازات القرآنية والروايات
    hasConnectedSanad: boolean; // السند المتصل
    sanadDetails?: string; // تفاصيل شيوخ السند
    experienceYears: string; // سنوات الخبرة (1-2، 3-5، 6-10، +10)
  };
  qualificationSummary: string;
  experienceYears: string;
  experienceDetails: string;
  // التخصص (حفظ / تجويد / تصحيح تلاوة / إجازة)
  specialty: string;
  specialtiesList?: string[];
  // نبذة تعريفية (اختياري)
  bio?: string;
  targetSection?: 'male' | 'female' | 'both';
  preferredTimes?: string;
  // حالة الطلب
  status: 'pending' | 'active' | 'accepted' | 'approved' | 'rejected';
  rejectionReason?: string;
  // التعيينات بعد القبول
  assignedHalqaIds?: string[];
  assignedHalqaTitles?: string[];
  assignedTimes?: string[];
  timeSlot?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTeacherInput {
  fullName: string;
  whatsapp: string;
  countryCode?: string;
  email: string;
  password: string;
  ijazat: string;
  hasConnectedSanad: boolean;
  sanadDetails?: string;
  experienceYears: string;
  experienceDetails?: string;
  specialty: string;
  specialtiesList?: string[];
  bio?: string;
  targetSection?: 'male' | 'female' | 'both';
  preferredTimes?: string;
}

export interface TeacherAssignmentInput {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  assignedHalqaTitles: string[];
  assignedHalqaIds?: string[];
  assignedTimes: string[];
  timeSlot: string;
  targetSection: 'male' | 'female' | 'both';
  adminName: string;
  notes?: string;
}

/**
 * 1. تسجيل معلم جديد:
 * - إنشاء حساب في Firebase Auth بالبريد وكلمة المرور
 * - حفظ مستند المعلم في مجموعة `teachers` بـ status: "pending"
 * - حفظ مستند المستخدم في مجموعة `users` بـ role: "teacher" و status: "pending"
 */
export async function submitTeacherApplicationToFirestore(
  input: RegisterTeacherInput
): Promise<{ success: boolean; teacherId: string; error?: string }> {
  try {
    const cleanEmail = sanitizeEmail(input.email).toLowerCase();
    const cleanPassword = input.password.trim();

    if (!isValidEmail(cleanEmail)) {
      return { success: false, teacherId: '', error: 'يرجى إدخال بريد إلكتروني صالح.' };
    }
    if (cleanPassword.length < 6) {
      return { success: false, teacherId: '', error: 'كلمة المرور يجب أن تتكون من 6 خانات على الأقل.' };
    }

    // تنظيف رقم الواتساب
    const phoneCleanResult = validateAndCleanWhatsAppNumber(input.whatsapp, input.countryCode || '967');
    const finalPhone = phoneCleanResult.cleanPhone || input.whatsapp.trim();

    // 1. إنشاء حساب Firebase Auth أو استخدام الحساب الحالي إذا كان مسجلاً بنفس كلمة المرور
    let userCredential: any;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-in-use') {
        // إذا كان البريد مسجلاً مسبقاً، نتحقق من صحة كلمة المرور لتحديث طلب المعلم بالحساب نفسه
        try {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        } catch (signInErr: any) {
          console.warn('[submitTeacherApplicationToFirestore] Notice: Email already registered, credentials mismatch:', cleanEmail);
          return {
            success: false,
            teacherId: '',
            error: 'هذا البريد الإلكتروني مسجل مسبقاً في المقرأة. يرجى إدخال كلمة المرور الصحيحة لتسجيل/تحديث الطلب، أو الانتقال لصفحة تسجيل الدخول.'
          };
        }
      } else {
        throw createErr;
      }
    }
    const uid = userCredential.user.uid;

    // تحديث الاسم المعروض في Firebase Auth
    if (input.fullName.trim()) {
      await updateProfile(userCredential.user, {
        displayName: input.fullName.trim()
      }).catch(() => {});
    }

    const now = new Date().toISOString();

    const qualificationSummary = [
      input.ijazat.trim(),
      input.hasConnectedSanad ? 'سند متصل' : null,
      `خبرة ${input.experienceYears} سنوات`,
    ].filter(Boolean).join(' • ');

    const teacherDocData: TeacherApplication = {
      id: uid,
      uid: uid,
      name: input.fullName.trim(),
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: finalPhone,
      whatsapp: finalPhone,
      qualifications: {
        ijazat: input.ijazat.trim(),
        hasConnectedSanad: input.hasConnectedSanad,
        sanadDetails: input.sanadDetails?.trim() || '',
        experienceYears: input.experienceYears,
      },
      qualificationSummary,
      experienceYears: input.experienceYears,
      experienceDetails: input.experienceDetails?.trim() || '',
      specialty: input.specialty.trim(),
      specialtiesList: input.specialtiesList || [input.specialty.trim()],
      bio: input.bio?.trim() || '',
      targetSection: input.targetSection || 'both',
      preferredTimes: input.preferredTimes?.trim() || '',
      status: 'pending',
      assignedHalqaIds: [],
      assignedHalqaTitles: [],
      assignedTimes: [],
      createdAt: now,
      updatedAt: now,
    };

    // 2. حفظ في Firestore مجموعة teachers بـ status: "pending" مع merge لتفادي الكتابة فوق البيانات السابقة
    await setDoc(doc(db, 'teachers', uid), teacherDocData, { merge: true });

    // 3. حفظ في Firestore مجموعة users لربط الجلسة والصلاحيات
    await setDoc(doc(db, 'users', uid), {
      id: uid,
      uid: uid,
      name: input.fullName.trim(),
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: finalPhone,
      whatsapp: finalPhone,
      role: 'teacher',
      status: 'pending',
      qualification: qualificationSummary,
      specialty: input.specialty.trim(),
      section: input.targetSection || 'both',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    return { success: true, teacherId: uid };
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      console.warn('[submitTeacherApplicationToFirestore] Notice: Email already registered:', input.email);
      return { 
        success: false, 
        teacherId: '', 
        error: 'هذا البريد الإلكتروني مسجل مسبقاً في المقرأة. يمكنك تسجيل الدخول مباشرة أو استعادة كلمة المرور.' 
      };
    }
    if (err?.code === 'auth/weak-password') {
      return { success: false, teacherId: '', error: 'كلمة المرور ضعيفة. يرجى اختيار كلمة مرور أقوى (6 خانات على الأقل).' };
    }
    console.warn('[submitTeacherApplicationToFirestore] Notice:', err?.code, err?.message || err);
    return { success: false, teacherId: '', error: err?.message || 'حدث خطأ أثناء إرسال طلب تسجيل المعلم.' };
  }
}

/**
 * 2. جلب طلبات المعلمين من Firestore
 */
export async function fetchTeacherApplicationsFromFirestore(): Promise<TeacherApplication[]> {
  try {
    const colRef = collection(db, 'teachers');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    
    const list: TeacherApplication[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      list.push({
        id: d.id,
        uid: data.uid || d.id,
        name: data.fullName || data.name || 'معلم بدون اسم',
        fullName: data.fullName || data.name || 'معلم بدون اسم',
        email: data.email || '',
        phone: data.phone || data.whatsapp || '',
        whatsapp: data.whatsapp || data.phone || '',
        qualifications: data.qualifications || {
          ijazat: data.qualification || '',
          hasConnectedSanad: false,
          experienceYears: data.experience || '',
        },
        qualificationSummary: data.qualificationSummary || data.qualification || '',
        experienceYears: data.experienceYears || data.experience || '',
        experienceDetails: data.experienceDetails || data.experience || '',
        specialty: data.specialty || 'تجويد وقراءات',
        specialtiesList: data.specialtiesList || (data.specialty ? [data.specialty] : []),
        bio: data.bio || data.notes || '',
        targetSection: data.targetSection || data.section || 'both',
        preferredTimes: data.preferredTimes || data.availableTimes || '',
        status: data.status || 'pending',
        rejectionReason: data.rejectionReason,
        assignedHalqaIds: data.assignedHalqaIds || [],
        assignedHalqaTitles: data.assignedHalqaTitles || [],
        assignedTimes: data.assignedTimes || [],
        timeSlot: data.timeSlot || '',
        approvedAt: data.approvedAt,
        approvedBy: data.approvedBy,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    // ترتيب الأحدث أولاً
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('[fetchTeacherApplicationsFromFirestore] fallback to empty:', err);
    return [];
  }
}

/**
 * 3. قبول المعلم وتعيين الحلقات والأوقات
 */
export async function approveTeacherApplicationWithAssignment(
  input: TeacherAssignmentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const { teacherId, teacherName, teacherEmail, assignedHalqaTitles, assignedTimes, timeSlot, targetSection, adminName } = input;

    // 1. تحديث مستند المعلم في مجموعة `teachers`
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, {
      status: 'active',
      assignedHalqaTitles,
      assignedHalqaIds: input.assignedHalqaIds || [],
      assignedTimes,
      timeSlot: timeSlot || assignedTimes.join(' • '),
      targetSection,
      approvedAt: now,
      approvedBy: adminName,
      updatedAt: now,
    }).catch(async (e) => {
      // إذا لم يكن المستند موجوداً، ننشئه
      await setDoc(teacherRef, {
        id: teacherId,
        uid: teacherId,
        name: teacherName,
        fullName: teacherName,
        email: teacherEmail,
        phone: input.teacherPhone,
        status: 'active',
        assignedHalqaTitles,
        assignedHalqaIds: input.assignedHalqaIds || [],
        assignedTimes,
        timeSlot: timeSlot || assignedTimes.join(' • '),
        targetSection,
        approvedAt: now,
        approvedBy: adminName,
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    });

    // 2. تحديث مستند المستخدم في مجموعة `users`
    const userRef = doc(db, 'users', teacherId);
    await setDoc(userRef, {
      id: teacherId,
      name: teacherName,
      fullName: teacherName,
      email: teacherEmail,
      phone: input.teacherPhone,
      role: 'teacher',
      status: 'active',
      isActive: true,
      isApproved: true,
      section: targetSection,
      assignedHalqaTitle: assignedHalqaTitles[0] || 'حلقة القرآن الكريم',
      assignedHalqaTitles,
      timeSlot: timeSlot || assignedTimes.join(' • '),
      updatedAt: now,
    }, { merge: true });

    // 3. ربط الحلقات المحددة في مجموعة `halqas` بالمعلم
    try {
      for (const title of assignedHalqaTitles) {
        const halqaId = `hlq-${teacherId.slice(0, 6)}-${Math.random().toString(36).substring(2, 6)}`;
        const halqaDocRef = doc(db, 'halqas', halqaId);
        await setDoc(halqaDocRef, {
          id: halqaId,
          title: title,
          teacherId: teacherId,
          teacherName: teacherName,
          teacherEmail: teacherEmail,
          section: targetSection === 'female' ? 'female' : 'male',
          timeSlot: timeSlot || assignedTimes.join(' • ') || 'يحدد بالتنسيق',
          status: 'active',
          updatedAt: now,
          createdAt: now,
        }, { merge: true });
      }
    } catch (halqaErr) {
      console.warn('[approveTeacherApplicationWithAssignment] halqas setup notice:', halqaErr);
    }

    // 4. توثيق في سجل الرقابة الإدارية
    await recordAuditLog({
      operatorName: adminName,
      operatorEmail: 'admin@rehab-quran.com',
      operatorRole: 'admin',
      action: 'اعتماد وتعيين معلم جديد',
      targetItem: `المعلم: ${teacherName}`,
      details: `تم قبول طلب المعلم (${teacherName}) وتعيين الحلقات: [${assignedHalqaTitles.join(', ')}] والأوقات: [${timeSlot || assignedTimes.join(', ')}]`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    return { success: true };
  } catch (err: any) {
    console.warn('[approveTeacherApplicationWithAssignment] notice:', err?.message || err);
    return { success: false, error: err?.message || 'فشل قبول وتعيين المعلم.' };
  }
}

/**
 * 4. رفض طلب المعلم
 */
export async function rejectTeacherApplicationInFirestore(
  teacherId: string,
  teacherName: string,
  adminName: string,
  reason: string = 'عدم توفر شواغر حالياً'
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: now,
      rejectedBy: adminName,
      updatedAt: now,
    }).catch(async () => {
      await setDoc(teacherRef, { status: 'rejected', rejectionReason: reason, updatedAt: now }, { merge: true });
    });

    const userRef = doc(db, 'users', teacherId);
    await updateDoc(userRef, {
      status: 'rejected',
      isActive: false,
      updatedAt: now,
    }).catch(() => {});

    // توثيق في سجل الرقابة
    await recordAuditLog({
      operatorName: adminName,
      operatorEmail: 'admin@rehab-quran.com',
      operatorRole: 'admin',
      action: 'رفض طلب انضمام معلم',
      targetItem: `المعلم: ${teacherName}`,
      details: `تم رفض طلب المعلم (${teacherName}). السبب: ${reason}`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    return { success: true };
  } catch (err: any) {
    console.warn('[rejectTeacherApplicationInFirestore] notice:', err?.message || err);
    return { success: false, error: err?.message || 'فشل رفض الطلب.' };
  }
}

/**
 * 5. توليد رسالة WhatsApp المعتمدة بتعليمات الدخول بعد قبول المعلم
 */
export function buildTeacherAdmissionWhatsAppInstructions(params: {
  teacherName: string;
  email: string;
  assignedHalqas: string[];
  assignedTimes: string;
  portalUrl?: string;
}): string {
  const portalUrl = params.portalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://rehab-quran.com/login');
  const halqasText = params.assignedHalqas.length > 0 ? params.assignedHalqas.join('، ') : 'حلقة القرآن الكريم';
  const timesText = params.assignedTimes || 'بحسب الجدول المعتمد';

  return `*مقرأة رحاب القرآن الإلكترونية العالمية*
━━━━━━━━━━━━━━━━━━━━
السلام عليكم ورحمة الله وبركاته فضيلة الشيخ / *${params.teacherName}* 🌿

مبارك انضمامكم إلى الكادر التعليمي والإقرائي بمقرأة رحاب القرآن الإلكترونية. يسر إدارة المقرأة إبلاغكم باعتماد طلبكم وتعيينكم في الحلقات القرآنية.

📋 *تفاصيل التعيين والمهام التعليمية:*
- *الحلقات المسندة:* ${halqasText}
- *أوقات الحصص والإقراء:* ${timesText}

🔑 *بيانات الدخول إلى لوحة المعلم:*
- *البريد الإلكتروني:* ${params.email}
- *كلمة المرور:* كلمة المرور التي اخترتموها عند تقديم طلب التسجيل
- *رابط الدخول المباشر:* ${portalUrl}

💡 *الخطوات التالية:*
1. الدخول عبر الرابط أعلاه باستخدام بريدكم وكلمة المرور.
2. تصفح لوحة المعلم والاطلاع على أسماء الطلاب وبياناتهم والحلقات المسندة إليكم.
3. إدارة الحضور والغياب وتسجيل تقييمات التلاوة اليومية للطلاب.

سائلين الله تعالى أن يبارك في جهودكم وينفع بكم وبعلمكم في خدمة كتابه العظيم.

*إدارة شؤون المعلمين - مقرأة رحاب القرآن الإلكترونية*
━━━━━━━━━━━━━━━━━━━━`;
}
