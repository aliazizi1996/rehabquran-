/**
 * خدمة التوثيق الصارم وإدارة الصلاحيات (RBAC Service)
 * مقرأة رحاب القرآن الإلكترونية
 * 
 * الميزات:
 * 1. فرض الصلاحيات عبر Firebase Auth + Custom Claims + Firestore.
 * 2. تعيين حساب المشرف الرئيسي (aliazize101@gmail.com) بصلاحيات كاملة تلقائياً.
 * 3. دعم وضع المعاينة الإدارية (Impersonation):
 *    - المشرف يستطيع فتح لوحة الطالب كعرض واختبار إداري.
 *    - المشرف يستطيع فتح لوحة المعلم كعرض واختبار إداري.
 *    - العودة إلى لوحة المشرف في أي وقت دون المساس ببيانات أو كلمات مرور المستخدمين.
 * 4. حظر وصول الطلاب إلى لوحات المعلم أو المشرف، وحظر وصول المعلم إلى لوحة المشرف.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { recordAuditLog } from './contentManagementService';

export type UserRole = 'student' | 'teacher' | 'admin' | 'supervisor' | 'guest';

export interface VerifiedUserSession {
  isAuthenticated: boolean;
  uid: string | null;
  email: string | null;
  name: string;
  role: UserRole;
  actualRole?: UserRole; // الدور الأصلي الحقيقي للمشرف عند تفعيل وضع المعاينة
  isImpersonating?: boolean;
  impersonatingTargetRole?: 'student' | 'teacher';
  phone?: string;
  section?: 'male' | 'female' | 'both';
  assignedHalqaTitle?: string;
  status?: 'pending' | 'accepted' | 'approved' | 'rejected' | 'active';
  source: 'firestore' | 'server' | 'unauthenticated';
}

const IMPERSONATION_STORAGE_KEY = 'rehab_admin_active_impersonation_session_v1';
export const MAIN_ADMIN_EMAIL = 'aliazize101@gmail.com';
export const OFFICIAL_CONTACT_EMAIL = 'rehabquran383@gmail.com';

export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower === MAIN_ADMIN_EMAIL.toLowerCase() || lower === OFFICIAL_CONTACT_EMAIL.toLowerCase();
}

export interface ImpersonationState {
  isImpersonating: boolean;
  targetRole: 'student' | 'teacher';
  adminUid: string;
  adminEmail: string;
  adminName: string;
  startedAt: string;
  note: string;
}

const guestSession = (): VerifiedUserSession => ({
  isAuthenticated: false,
  uid: null,
  email: null,
  name: 'زائر',
  role: 'guest',
  source: 'unauthenticated',
});

function roleFromProfile(rawRole: unknown): Exclude<UserRole, 'guest'> | null {
  if (typeof rawRole !== 'string') return null;
  switch (rawRole.toLowerCase()) {
    case 'admin':
    case 'system_admin':
      return 'admin';
    case 'supervisor':
    case 'academic_supervisor':
    case 'general_supervisor':
      return 'supervisor';
    case 'teacher':
    case 'sheikh':
    case 'muqri':
      return 'teacher';
    case 'student':
      return 'student';
    default:
      return null;
  }
}

function signedRoleFromClaims(claims: Record<string, unknown>, email?: string | null): Exclude<UserRole, 'guest'> | null {
  // الحساب الرئيسي المعتمد من قبل الإدارة
  if (isMasterAdminEmail(email)) {
    return 'admin';
  }
  if (claims.admin === true || claims.role === 'admin' || claims.role === 'system_admin') return 'admin';
  if (claims.supervisor === true || claims.role === 'supervisor' || claims.role === 'academic_supervisor') return 'supervisor';
  if (claims.teacher === true || claims.role === 'teacher') return 'teacher';
  if (claims.student === true || claims.role === 'student') return 'student';
  return roleFromProfile(claims.role);
}

function isApproved(data: Record<string, any>): boolean {
  // السماح للطلاب والمعلمين ذوي حالة قيد المراجعة بتسجيل الدخول لعرض شاشة "طلبك قيد المراجعة"
  if ((data.role === 'student' || data.role === 'teacher') && (data.status === 'pending' || data.status === 'pending_review')) {
    return true;
  }
  return data.isActive !== false && data.status !== 'pending' && data.status !== 'rejected';
}

function makeSession(
  uid: string,
  email: string | null,
  role: Exclude<UserRole, 'guest'>,
  data: Record<string, any> = {},
  source: 'firestore' | 'server' = 'firestore',
): VerifiedUserSession {
  // فحص ما إذا كانت هناك جلسة معاينة إدارية نشطة للمشرف
  const impersonation = getAdminImpersonationState();
  if (impersonation && impersonation.isImpersonating && (role === 'admin' || role === 'supervisor')) {
    return {
      isAuthenticated: true,
      uid,
      email: data.email || email,
      name: data.fullName || data.name || data.displayName || 'المشرف العام (معاينة)',
      role: impersonation.targetRole,
      actualRole: role,
      isImpersonating: true,
      impersonatingTargetRole: impersonation.targetRole,
      phone: data.phone,
      section: data.section || 'both',
      assignedHalqaTitle: data.assignedHalqaTitle || data.halqaTitle || (impersonation.targetRole === 'student' ? 'حلقة الطلاب التجريبية' : 'حلقة الإتقان'),
      status: (data.status as any) || 'active',
      source,
    };
  }

  return {
    isAuthenticated: true,
    uid,
    email: data.email || email,
    name: data.fullName || data.name || data.displayName || (role === 'admin' ? 'المشرف الرئيسي' : 'مستخدم مسجل'),
    role,
    actualRole: role,
    isImpersonating: false,
    phone: data.phone,
    section: data.section || 'both',
    assignedHalqaTitle: data.assignedHalqaTitle || data.halqaTitle,
    status: (data.status as any) || (data.isActive === false ? 'rejected' : 'active'),
    source,
  };
}

/**
 * الحصول على حالة المعاينة الإدارية الحالية إن وجدت
 */
export function getAdminImpersonationState(): ImpersonationState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * بدء جلسة معاينة واختبار إدارية كطالب أو كمعلم (دون تعديل كلمة المرور أو البيانات)
 */
export async function startAdminImpersonation(
  targetRole: 'student' | 'teacher',
  adminSession: VerifiedUserSession
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const state: ImpersonationState = {
    isImpersonating: true,
    targetRole,
    adminUid: adminSession.uid || '',
    adminEmail: adminSession.email || MAIN_ADMIN_EMAIL,
    adminName: adminSession.name || 'المشرف الرئيسي',
    startedAt: new Date().toISOString(),
    note: 'جلسة معاينة واختبار إدارية دون المساس ببيانات أو كلمات مرور المستخدمين',
  };

  try {
    sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(state));

    // توثيق في سجل الرقابة
    await recordAuditLog({
      operatorName: state.adminName,
      operatorEmail: state.adminEmail,
      operatorRole: 'admin',
      action: `بدء معاينة إدارية (دخول كـ ${targetRole === 'student' ? 'طالب' : 'معلم'})`,
      targetItem: targetRole === 'student' ? 'لوحة الطالب (/student)' : 'لوحة المعلم (/teacher)',
      details: `قام المشرف (${state.adminName}) ببدء جلسة معاينة واختبار إدارية للوحة ${targetRole === 'student' ? 'الطالب' : 'المعلم'}. لا يتم تعديل أي كلمات مرور.`,
      status: 'SUCCESS',
      timestamp: new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    return true;
  } catch (err) {
    console.error('Failed to start impersonation', err);
    return false;
  }
}

/**
 * إنهاء جلسة المعاينة الإدارية والعودة الفورية لحساب المشرف
 */
export async function stopAdminImpersonation(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  const current = getAdminImpersonationState();
  try {
    sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);

    if (current) {
      await recordAuditLog({
        operatorName: current.adminName,
        operatorEmail: current.adminEmail,
        operatorRole: 'admin',
        action: 'إنهاء المعاينة والعودة للوحة المشرف',
        targetItem: 'لوحة الإدارة (/admin)',
        details: `أنهى المشرف (${current.adminName}) جلسة المعاينة الإدارية وعاد إلى لوحة المشرف العامة.`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to stop impersonation', err);
    return false;
  }
}

let memorySessionCache: { uid: string; timestamp: number; session: VerifiedUserSession } | null = null;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateVerifiedUserSession(): void {
  memorySessionCache = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('rehab_verified_session');
  }
}

/**
 * التحقق الصارم من هوية وصلاحيات المستخدم عبر Firebase Auth و Firestore
 * مع التخزين المؤقت الذكي (Session Cache) لتجنب القراءات المتكررة على الخطة المجانية
 */
export async function verifyUserRoleFromFirestore(forceRefresh = false): Promise<VerifiedUserSession> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return guestSession();

  // فحص الكاش المؤقت في الذاكرة لتوفير قراءات Firestore
  const now = Date.now();
  if (!forceRefresh && memorySessionCache && memorySessionCache.uid === firebaseUser.uid && (now - memorySessionCache.timestamp < SESSION_CACHE_TTL_MS)) {
    return memorySessionCache.session;
  }

  // فحص الكاش في sessionStorage للمتصفح
  if (!forceRefresh && typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('rehab_verified_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid === firebaseUser.uid && (now - (parsed._cachedAt || 0) < SESSION_CACHE_TTL_MS)) {
          memorySessionCache = { uid: firebaseUser.uid, timestamp: parsed._cachedAt, session: parsed };
          return parsed;
        }
      }
    } catch {}
  }

  function cacheAndReturnSession(session: VerifiedUserSession): VerifiedUserSession {
    if (session.isAuthenticated && session.uid) {
      const nowTs = Date.now();
      memorySessionCache = { uid: session.uid, timestamp: nowTs, session };
      try {
        sessionStorage.setItem('rehab_verified_session', JSON.stringify({ ...session, _cachedAt: nowTs }));
      } catch {}
    }
    return session;
  }

  try {
    const isMasterAdmin = isMasterAdminEmail(firebaseUser.email);

    // 1. Get token claims (use cache unless forceRefresh is true)
    const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
    let signedRole = signedRoleFromClaims(tokenResult.claims, firebaseUser.email);

    // في حال كان البريد هو بريد المشرف الرئيسي المعتمد، يمنح صلاحيات admin كاملة فوراً
    if (isMasterAdminEmail) {
      let profileData: any = {
        fullName: 'د. علي عزيزي (المشرف الرئيسي)',
        role: 'admin',
        isActive: true,
      };
      try {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userSnap.exists()) {
          profileData = { ...profileData, ...userSnap.data(), role: 'admin', isActive: true };
        }
      } catch (fsErr) {
        console.warn('[Security] Master admin Firestore read skipped/fallback:', fsErr);
      }
      return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'admin', profileData, 'server'));
    }

    // 2. فحص ملف المستخدم في Firestore
    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userSnap.exists()) {
      const data = userSnap.data();

      if (!isApproved(data)) return guestSession();
      if (signedRole === 'teacher' && data.isApproved === false && data.status !== 'pending') return guestSession();

      // Signed claims or Firestore elevated roles
      if (signedRole && signedRole !== 'student') {
        return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, signedRole, data, 'server'));
      }

      const profileRole = roleFromProfile(data.role);
      if (profileRole === 'admin' || profileRole === 'supervisor') {
        return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, profileRole, data, 'firestore'));
      }

      // Public self-registration for student or teacher
      if (profileRole === 'student') {
        return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'student', data, 'firestore'));
      }

      if (profileRole === 'teacher') {
        return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'teacher', data, 'firestore'));
      }

      return guestSession();
    }

    // إذا كان المشرف الرئيسي ولم ينشئ ملفاً بعد في Firestore
    if (isMasterAdminEmail) {
      return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'admin', {
        fullName: 'د. علي عزيزي (المشرف الرئيسي)',
        role: 'admin',
        isActive: true,
      }, 'server'));
    }

    // Teacher records fallback
    if (signedRole === 'teacher') {
      const teacherSnap = await getDoc(doc(db, 'teachers', firebaseUser.uid));
      if (teacherSnap.exists()) {
        const data = teacherSnap.data();
        if (isApproved(data) && data.isApproved !== false) {
          return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'teacher', data, 'server'));
        }
      }
      return guestSession();
    }

    // Students fallback
    if (!signedRole || signedRole === 'student') {
      try {
        const studentSnap = await getDoc(doc(db, 'students', firebaseUser.uid));
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          if (isApproved(data)) {
            return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'student', data, 'firestore'));
          }
        }
      } catch {}

      // التحقق من حسابات الطلاب المعتمدة بالرقم الأكاديمي
      if (firebaseUser.email && (firebaseUser.email.startsWith('user_rq_') || firebaseUser.email.startsWith('user_stu_') || firebaseUser.email.includes('@rehab-quran.com'))) {
        try {
          const { getAcademyDatabase } = await import('../data/academyDb');
          const academyDb = getAcademyDatabase();
          const std = academyDb.students.find(s => s && (s.userId === firebaseUser.uid || (s.email && s.email.toLowerCase() === firebaseUser.email!.toLowerCase())));
          const usr = academyDb.users.find(u => u && (u.id === firebaseUser.uid || (u.email && u.email.toLowerCase() === firebaseUser.email!.toLowerCase())));
          const name = std?.name || usr?.name || 'طالب المقرأة';
          const halqa = std?.className || (std as any)?.assignedHalqaTitle;
          return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'student', {
            fullName: name,
            role: 'student',
            assignedHalqaTitle: halqa,
            isActive: true,
            status: 'approved'
          }, 'server'));
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[Security] Firebase session/role verification failed:', err);
    if (firebaseUser?.email && firebaseUser.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
      return cacheAndReturnSession(makeSession(firebaseUser.uid, firebaseUser.email, 'admin', {
        fullName: 'د. علي عزيزي (المشرف الرئيسي)',
        role: 'admin',
        isActive: true,
      }, 'server'));
    }
  }

  return guestSession();
}
