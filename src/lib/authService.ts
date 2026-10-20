/**
 * خدمة المصادقة وإدارة المستخدمين والصلاحيات لمقرأة رحاب القرآن الإلكترونية
 * Professional Firebase Authentication & RBAC Service
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  onAuthStateChanged, 
  updateProfile,
  User as FirebaseUser,
  getIdTokenResult,
  IdTokenResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole, SecurityActivityLog, AuthAccount } from '../types';
import { setCurrentAuthUser } from '../data/authStore';
import { cleanEmail } from '../utils/emailValidation';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * تحويل رقم الهاتف إلى بريد وهمي رسمي معتمد للمصادقة:
 * بصيغة: {phone}@student.rehabquran.com
 */
export function formatPhoneToStudentEmail(phone: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `${cleanPhone}@student.rehabquran.com`;
}

/**
 * تحويل رقم الهاتف إلى بريد إلكتروني افتراضي للمصادقة الموحدة
 */
export function formatPhoneToEmail(phone: string): string {
  return formatPhoneToStudentEmail(phone);
}

/**
 * تحويل الرقم الأكاديمي إلى البريد الإلكتروني الرسمي المعتمد في Firebase Auth
 * مثال: RQ-2026-6365 -> user_rq_2026_6365@rehab-quran.com
 */
export function formatAcademicIdToEmail(academicId: string): string {
  const clean = academicId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').toLowerCase();
  return `user_${clean}@rehab-quran.com`;
}

/**
 * تسجيل النشاط الأمني في فايرستور
 */
export async function logSecurityActivity(
  userId: string,
  userEmail: string,
  action: SecurityActivityLog['action'],
  details: string,
  status: SecurityActivityLog['status'] = 'SUCCESS',
  role?: UserRole
): Promise<void> {
  try {
    const logData: Omit<SecurityActivityLog, 'id'> = {
      userId,
      userEmail,
      userRole: role,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      status
    };

    // Save critical events to Firestore; routine events to server logs to conserve Spark 20k daily writes
    if (status !== 'SUCCESS' || action === 'ROLE_UPDATED' || action === 'PASSWORD_RESET') {
      try {
        await addDoc(collection(db, 'security_logs'), {
          ...logData,
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        // Non-blocking firestore write
      }
    }

    // Mirror all logs to server audit disk storage
    try {
      await fetch('/api/admin/security-logs/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch {
      // Non-blocking server log mirror
    }
  } catch (err) {
    console.warn('[Security Log] Could not save security log:', err);
  }
}

/**
 * جلب الملف التعريفي الكامل للمستخدم من Firestore
 */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (err: any) {
    console.warn('[authService] Notice fetching user profile from Firestore:', err?.message || err);
    return null;
  }
}

/**
 * مزامنة المستخدم في مخزن الجلسة المحلي للواجهة
 */
export function syncAuthAccountStore(user: User): AuthAccount {
  const rawAcademicId = (user as any).academicId || (user as any).username;
  const inferredAcademicId = rawAcademicId || (
    user.email && user.email.startsWith('user_rq_')
      ? user.email.replace(/^user_/, '').replace(/@rehab-quran\.com$/, '').toUpperCase().replace(/_/g, '-')
      : undefined
  );

  const account: AuthAccount = {
    id: user.id,
    academicId: inferredAcademicId,
    name: user.fullName,
    username: inferredAcademicId || user.email.split('@')[0],
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    assignedHalqaTitle: user.assignedHalqaTitle,
    registeredAt: user.createdAt,
    status: user.isActive ? 'approved' : 'rejected'
  };
  setCurrentAuthUser(account);
  return account;
}

/**
 * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
 */
export async function loginWithEmail(email: string, password: string): Promise<{ user: User; tokenResult: IdTokenResult }> {
  const sanitizedEmail = cleanEmail(email);
  const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
  const fbUser = userCredential.user;

  // Verify ID Token Result and Custom Claims
  const tokenResult = await fbUser.getIdTokenResult(true);

  // Fetch Firestore profile safely (do not block login if profile read/write fails)
  let profile: User | null = null;
  try {
    profile = await fetchUserProfile(fbUser.uid);
  } catch (profileErr) {
    console.warn('[AuthService] Notice: fetchUserProfile fallback:', profileErr);
  }

  const isMasterAdminEmail = Boolean(email && email.trim().toLowerCase() === 'aliazize101@gmail.com');
  const assignedRole: UserRole = isMasterAdminEmail 
    ? 'system_admin' 
    : ((tokenResult.claims.role as UserRole) || profile?.role || 'student');

  if (!profile) {
    // Generate default profile if not exists
    const now = new Date().toISOString();
    profile = {
      id: fbUser.uid,
      fullName: fbUser.displayName || (isMasterAdminEmail ? 'د. علي عزيزي (المشرف الرئيسي)' : email.split('@')[0]),
      email: fbUser.email || email,
      phone: '',
      role: assignedRole,
      gender: 'male',
      country: 'اليمن',
      timezone: 'Asia/Aden',
      avatarUrl: fbUser.photoURL || undefined,
      isActive: true,
      emailVerified: fbUser.emailVerified,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      notificationPreferences: {
        email: true,
        push: true,
        whatsapp: true,
        halqaReminders: true
      }
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile);
    } catch (setErr) {
      console.warn('[AuthService] Notice: Initial profile Firestore write skipped:', setErr);
    }
  }

  // Check if account is disabled (master admin is never disabled)
  if (!isMasterAdminEmail && profile.isActive === false) {
    await signOut(auth);
    try {
      await logSecurityActivity(fbUser.uid, email, 'LOGIN_FAILED', 'محاولة دخول بحساب معطل', 'WARNING', profile.role);
    } catch {}
    throw new Error('تم تعطيل هذا الحساب من قِبل إدارة المقرأة. يرجى التواصل مع المشرف الأكاديمي.');
  }

  // Update last login timestamp in Firestore only if more than 2 hours elapsed to conserve Spark writes
  const now = new Date().toISOString();
  const lastLoginMs = profile.lastLoginAt ? new Date(profile.lastLoginAt).getTime() : 0;
  if (!lastLoginMs || (Date.now() - lastLoginMs > 2 * 3600 * 1000)) {
    try {
      await updateDoc(doc(db, 'users', fbUser.uid), {
        lastLoginAt: now,
        emailVerified: fbUser.emailVerified,
        updatedAt: now
      });
    } catch {}
  }
  profile.lastLoginAt = now;
  profile.emailVerified = fbUser.emailVerified;

  // Log successful login safely
  try {
    await logSecurityActivity(fbUser.uid, email, 'LOGIN_SUCCESS', 'تسجيل دخول ناجح بالبريد وكلمة المرور', 'SUCCESS', profile.role);
  } catch {}

  syncAuthAccountStore(profile);
  return { user: profile, tokenResult };
}

/**
 * تسجيل الدخول برقم الهاتف / الواتساب أو الرقم الأكاديمي وكلمة المرور
 * يدعم الربط الآمن للرقم الأكاديمي بحساب Firebase Auth الحقيقي (مثل RQ-2026-6365)
 */
export async function loginWithPhone(phoneOrAcademicId: string, password: string): Promise<{ user: User; tokenResult: IdTokenResult }> {
  const cleanInput = phoneOrAcademicId.trim();
  if (!cleanInput) {
    throw new Error('يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور.');
  }

  const upperInput = cleanInput.toUpperCase();
  const isAcademic = upperInput.startsWith('RQ-') || upperInput.startsWith('STU-') || upperInput.startsWith('TCH-') || upperInput.startsWith('ADM-');

  // إذا أدخل رقم هاتف: نحوله داخلياً إلى البريد الوهمي {phone}@student.rehabquran.com
  if (!isAcademic) {
    const cleanDigits = cleanInput.replace(/[^0-9]/g, '');
    if (!cleanDigits) {
      throw new Error('يرجى إدخال رقم هاتف صحيح.');
    }

    const candidateEmails = [
      `${cleanDigits}@student.rehabquran.com`,
      // في حال إدخال الرقم بصيغة محلية أو دولية بديلة
      cleanDigits.startsWith('0') ? `${cleanDigits.replace(/^0+/, '')}@student.rehabquran.com` : null,
      cleanDigits.startsWith('967') ? `${cleanDigits.replace(/^967/, '')}@student.rehabquran.com` : `967${cleanDigits}@student.rehabquran.com`,
      cleanDigits.startsWith('0967') ? `${cleanDigits.replace(/^0967/, '967')}@student.rehabquran.com` : null,
      // توافقية عكسية مع الحسابات السابقة المسجلة بالنطاق القديم
      `user_${cleanDigits}@rehab-quran.com`
    ].filter(Boolean) as string[];

    let lastError: any = null;
    for (const email of candidateEmails) {
      try {
        return await loginWithEmail(email, password);
      } catch (err: any) {
        lastError = err;
        if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
          throw new Error('كلمة المرور المدخلة غير صحيحة. يرجى إدخال كلمة المرور التي اخترتها عند التسجيل، أو طلب استعادة كلمة المرور.');
        }
        // إذا كان خطأ آخر غير user-not-found نواصل المحاولة
      }
    }

    if (lastError?.code === 'auth/wrong-password' || lastError?.code === 'auth/invalid-credential') {
      throw new Error('كلمة المرور المدخلة غير صحيحة. يرجى إدخال كلمة المرور التي اخترتها عند التسجيل، أو طلب استعادة كلمة المرور.');
    }
    throw new Error('رقم الهاتف غير مسجل في المقرأة، أو لم يتم إنشاء الحساب بعد. يرجى التأكد من الرقم أو استعادة كلمة المرور.');
  }

  // في حال كان رقماً أكاديمياً (للمشرفين أو التوافق القديم)
  let targetEmail = '';
  try {
    const res = await fetch('/api/auth/resolve-identifier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanInput })
    });
    const data = await res.json();
    if (res.ok && data.success && data.email) {
      targetEmail = data.email;
    }
  } catch {}

  if (!targetEmail) {
    targetEmail = formatAcademicIdToEmail(upperInput);
  }

  try {
    return await loginWithEmail(targetEmail, password);
  } catch (authErr: any) {
    if (authErr?.code === 'auth/invalid-credential' || authErr?.code === 'auth/wrong-password') {
      throw new Error('كلمة المرور المدخلة غير صحيحة. يرجى التأكد من كلمة المرور وإعادة المحاولة.');
    }
    if (authErr?.code === 'auth/user-not-found') {
      throw new Error('الحساب غير مسجل أو لم يتم إنشاؤه بعد في المقرأة. يرجى مراجعة إدارة المقرأة.');
    }
    throw authErr;
  }
}

/**
 * تسجيل الدخول بحساب Google الرسمي
 */
export async function loginWithGoogle(): Promise<{ user: User; tokenResult: IdTokenResult }> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const tokenResult = await fbUser.getIdTokenResult(true);

  let profile = await fetchUserProfile(fbUser.uid);
  const now = new Date().toISOString();

  if (!profile) {
    // New user registering with Google
    profile = {
      id: fbUser.uid,
      fullName: fbUser.displayName || 'مستخدم المقرأة',
      email: fbUser.email || '',
      phone: fbUser.phoneNumber || '',
      role: 'student', // Default role
      gender: 'male',
      country: 'اليمن',
      timezone: 'Asia/Aden',
      avatarUrl: fbUser.photoURL || undefined,
      isActive: true,
      emailVerified: fbUser.emailVerified,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      notificationPreferences: {
        email: true,
        push: true,
        whatsapp: true,
        halqaReminders: true
      }
    };
    await setDoc(doc(db, 'users', fbUser.uid), profile);
  } else {
    // Check if account is disabled
    if (profile.isActive === false) {
      await signOut(auth);
      await logSecurityActivity(fbUser.uid, fbUser.email || '', 'LOGIN_FAILED', 'محاولة دخول بحساب معطل عبر Google', 'WARNING', profile.role);
      throw new Error('تم تعطيل هذا الحساب من قِبل إدارة المقرأة.');
    }

    // Update profile
    await updateDoc(doc(db, 'users', fbUser.uid), {
      lastLoginAt: now,
      emailVerified: fbUser.emailVerified,
      updatedAt: now
    });
    profile.lastLoginAt = now;
  }

  await logSecurityActivity(fbUser.uid, fbUser.email || '', 'LOGIN_SUCCESS', 'تسجيل دخول ناجح بحساب Google', 'SUCCESS', profile.role);

  syncAuthAccountStore(profile);
  return { user: profile, tokenResult };
}

/**
 * إنشاء حساب جديد وتخزين نموذج User في Firestore
 */
export async function registerNewUser(
  userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt' | 'emailVerified'>,
  password: string
): Promise<User> {
  if (userData.role !== 'student') {
    throw new Error('التسجيل الذاتي متاح للطلاب فقط؛ تُعتمد أدوار المعلمين والإدارة من خلال إدارة المقرأة.');
  }

  const emailToUse = userData.email?.trim() || formatPhoneToStudentEmail(userData.phone);

  const cred = await createUserWithEmailAndPassword(auth, emailToUse, password);
  const fbUser = cred.user;

  if (userData.fullName) {
    await updateProfile(fbUser, { displayName: userData.fullName }).catch(() => {});
  }

  const now = new Date().toISOString();

  // حفظ في Firestore فقط: الاسم، البريد، رقم الهاتف، الدور (student)، وحالة الطلب (pending)
  // دون تخزين كلمة المرور كنص واضح إطلاقاً
  const firestoreStudentDoc = {
    id: fbUser.uid,
    name: userData.fullName?.trim() || '',
    fullName: userData.fullName?.trim() || '',
    email: emailToUse,
    phone: userData.phone?.trim() || '',
    role: 'student' as const,
    status: 'pending' as const,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'users', fbUser.uid), firestoreStudentDoc);

  const fullUser: User = {
    ...userData,
    ...firestoreStudentDoc,
    emailVerified: fbUser.emailVerified,
    lastLoginAt: now,
    notificationPreferences: userData.notificationPreferences || {
      email: true,
      push: true,
      whatsapp: true,
      halqaReminders: true
    }
  };

  await logSecurityActivity(fbUser.uid, emailToUse, 'LOGIN_SUCCESS', `إنشاء حساب طالب جديد بحالة معلقة (pending)`, 'SUCCESS', 'student');

  syncAuthAccountStore(fullUser);
  return fullUser;
}

/**
 * إرسال رابط استعادة كلمة المرور
 */
export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
  await logSecurityActivity('anon', email, 'PASSWORD_RESET', 'طلب إعادة ضبط كلمة المرور', 'SUCCESS');
}

/**
 * إرسال رابط التحقق من البريد الإلكتروني
 */
export async function resendEmailVerification(): Promise<void> {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
    await logSecurityActivity(auth.currentUser.uid, auth.currentUser.email || '', 'PASSWORD_RESET', 'إعادة إرسال رابط التحقق من البريد', 'SUCCESS');
  } else {
    throw new Error('لا يوجد مستخدم مسجل حالياً.');
  }
}

/**
 * تسجيل الخروج من جميع الأجهزة وإلغاء جلسات المستخدم
 */
export async function logoutFromAllDevices(): Promise<void> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    await logSecurityActivity(currentUser.uid, currentUser.email || '', 'LOGOUT_ALL', 'تسجيل خروج من جميع الأجهزة', 'SUCCESS');
    
    // Revoke server tokens
    try {
      const idToken = await currentUser.getIdToken();
      await fetch('/api/auth/revoke-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
    } catch (e) {
      console.warn('Revoke sessions call:', e);
    }
  }

  await signOut(auth);
  localStorage.removeItem('rehab_auth_user');
  sessionStorage.clear();
}

/**
 * فحص الصلاحيات والتحقق من Custom Claims
 */
export async function verifyUserRoleAndClaims(): Promise<{
  role: UserRole;
  isAdmin: boolean;
  isSupervisor: boolean;
  claims: any;
}> {
  if (!auth.currentUser) {
    return { role: 'guest', isAdmin: false, isSupervisor: false, claims: {} };
  }

  const tokenResult = await getIdTokenResult(auth.currentUser, true);
  const claims = tokenResult.claims;
  const role = (claims.role as UserRole) || 'student';
  const isAdmin = role === 'system_admin' || claims.admin === true;
  const isSupervisor = isAdmin || role === 'academic_supervisor' || claims.supervisor === true;

  return {
    role,
    isAdmin,
    isSupervisor,
    claims
  };
}
