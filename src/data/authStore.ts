import { AuthAccount, UserProfile } from '../types';
import { saveRegisteredStudent, saveRegisteredTeacher } from './registrationStore';

const AUTH_STORAGE_KEY = 'rehab_quran_auth_account_prod_v1';
const ALL_ACCOUNTS_STORAGE_KEY = 'rehab_quran_all_accounts_prod_v1';
const AUTH_SESSION_FLAG_KEY = 'rehab_quran_session_authenticated_prod_v1';

export const GUEST_AUTH_ACCOUNT: AuthAccount = {
  id: '',
  username: '',
  phone: '',
  name: 'زائر',
  role: 'guest',
};

export const isUserAuthenticatedSession = (): boolean => {
  try {
    return localStorage.getItem(AUTH_SESSION_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setUserAuthenticatedSession = (isAuth: boolean) => {
  try {
    if (isAuth) {
      localStorage.setItem(AUTH_SESSION_FLAG_KEY, 'true');
    } else {
      localStorage.removeItem(AUTH_SESSION_FLAG_KEY);
    }
  } catch (e) {
    console.error('Failed to set session auth flag', e);
  }
};

// Standard official supervisor accounts - Empty of mock students
export const GENERAL_SUPERVISOR_ACCOUNT: AuthAccount = {
  id: 'user-supervisor-general',
  username: 'supervisor_general',
  phone: '0967713801916',
  name: 'المشرف العام على المقرأة',
  role: 'supervisor',
  section: 'both',
  titleBadge: 'المشرف العام والمؤسس',
  assignedHalqaTitle: 'الإشراف العام على المقرأة',
  avatarUrl: '',
  registeredAt: '2026-01-01',
};

export const DEFAULT_ACCOUNTS: AuthAccount[] = [];

export const getAllAccounts = (): AuthAccount[] => {
  try {
    const saved = localStorage.getItem(ALL_ACCOUNTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleanList: AuthAccount[] = parsed
          .filter((a): a is AuthAccount => Boolean(a && typeof a === 'object' && a.id))
          .map((a) => {
            const cleanAccount = { ...a };
            delete cleanAccount.password;
            return { ...cleanAccount, section: (a.section || 'both') as 'male' | 'female' | 'both' };
          });
        saveAccounts(cleanList);
        // Ensure defaults exist
        DEFAULT_ACCOUNTS.forEach((def) => {
          if (!cleanList.some((a) => a && (a.id === def.id || a.phone === def.phone))) {
            cleanList.push(def);
          }
        });
        return cleanList;
      }
    }
  } catch (e) {
    console.error('Failed to read accounts', e);
  }
  return [...DEFAULT_ACCOUNTS];
};

export const saveAccounts = (accounts: AuthAccount[]) => {
  try {
    const safeAccounts = accounts.map((account) => {
      const safeAccount = { ...account };
      delete safeAccount.password;
      return safeAccount;
    });
    localStorage.setItem(ALL_ACCOUNTS_STORAGE_KEY, JSON.stringify(safeAccounts));
  } catch (e) {
    console.error('Failed to save accounts', e);
  }
};

export const getCurrentAuthUser = (): AuthAccount => {
  // localStorage is not an authentication source; Firebase Auth hydrates the session.
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* storage may be unavailable */ }
  return GUEST_AUTH_ACCOUNT;
};

export const setCurrentAuthUser = (account: AuthAccount) => {
  try {
    const safeAccount = { ...account };
    delete safeAccount.password;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeAccount));
    window.dispatchEvent(new CustomEvent('rehab_auth_changed', { detail: safeAccount }));
  } catch (e) {
    console.error('Failed to set auth user', e);
  }
};

export interface LoginResult {
  success: boolean;
  message: string;
  account?: AuthAccount;
}

export const authenticateSupervisorPassword = (passwordInput: string): LoginResult => {
  void passwordInput;
  return {
    success: false,
    message: 'تسجيل دخول المشرفين المحلي معطل؛ يلزم التحقق عبر Firebase Auth.',
  };
};

export const authenticateUser = (identifier: string, passwordInput: string): LoginResult => {
  void identifier;
  void passwordInput;
  return { 
    success: false,
    message: 'تسجيل الدخول المحلي معطل؛ استخدم خدمة Firebase Auth.',
  };
};

export const registerNewAccount = (data: {
  name: string;
  phone: string;
  username: string;
  password?: string;
  role: 'student' | 'teacher';
  section: 'male' | 'female';
  memorization?: string;
}): LoginResult => {
  void data;
  return {
    success: false,
    message: 'إنشاء الحساب المحلي معطل؛ استخدم التسجيل عبر Firebase Auth.',
  };
};

export const logoutUser = () => {
  setUserAuthenticatedSession(false);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('rehab_auth_changed', { detail: null }));
};

export const authAccountToUserProfile = (auth?: AuthAccount | null): UserProfile => {
  const safeAuth = auth || GUEST_AUTH_ACCOUNT;
  const isMale = (safeAuth.section || 'male') === 'male';
  return {
    id: safeAuth.id,
    name: safeAuth.name,
    email: `${safeAuth.username || 'user'}@rehab-quran.com`,
    role: safeAuth.role === 'supervisor' || safeAuth.role === 'teacher' ? 'teacher' : 'student',
    riwayah: 'حفص عن عاصم من طريق الشاطبية',
    level: safeAuth.role === 'supervisor' || safeAuth.role === 'teacher' ? 'مقرئ ومجاز بالقراءات' : 'متوسط (حفظ وتثبيت)',
    enrolledHalqaIds: isMale ? ['h-m1', 'h-1'] : ['h-f1', 'h-f2'],
    memorizedJuzs: [1, 2, 3, 28, 29, 30],
    dailyTargetPages: 4,
    streakDays: 14,
    totalSubmissions: 28,
    attendanceRate: 98,
  };
};

/**
 * Legacy local account index helper. Authentication credentials are managed only by Firebase Auth.
 */
export const adminCreateAccount = (data: {
  name: string;
  phone: string;
  username?: string;
  password?: string;
  role: 'student' | 'teacher' | 'supervisor';
  section: 'male' | 'female' | 'both';
  titleBadge?: string;
  assignedHalqaTitle?: string;
  notes?: string;
}): { success: boolean; message: string; account?: AuthAccount } => {
  const accounts = getAllAccounts();
  const cleanPhone = data.phone ? data.phone.trim().replace(/\s+/g, '') : '';

  // If no username provided, generate a clean username from phone or name
  let cleanUsername = data.username ? data.username.trim().toLowerCase().replace(/\s+/g, '_') : '';
  if (!cleanUsername) {
    if (cleanPhone) {
      cleanUsername = cleanPhone.replace(/[^0-9]/g, '');
    } else {
      cleanUsername = `user_${Date.now().toString().slice(-6)}`;
    }
  }

  // Check if account already exists
  const existing = accounts.find((a) => {
    const matchUsername = a.username.toLowerCase() === cleanUsername;
    const matchPhone = cleanPhone && a.phone && a.phone.replace(/[\s+-]/g, '') === cleanPhone.replace(/[\s+-]/g, '');
    return matchUsername || matchPhone;
  });

  if (existing) {
    return {
      success: false,
      message: `يوجد حساب مسجل مسبقاً بنفس ${existing.username.toLowerCase() === cleanUsername ? 'اسم المستخدم' : 'رقم الهاتف'} باسم (${existing.name}).`,
    };
  }

  const assignedHalqa = data.assignedHalqaTitle || (
    data.section === 'male'
      ? 'حلقة قسم الطلاب (بنين)'
      : data.section === 'female'
        ? 'حلقة قسم الطالبات (أخوات)'
        : 'كلا القسمين'
  );

  const defaultBadge = data.titleBadge || (
    data.role === 'supervisor'
      ? 'مشرف في المقرأة'
      : data.role === 'teacher'
        ? (data.section === 'female' ? 'معلمة مجازة ومعتمدة' : 'معلم مجاز ومعتمد')
        : (data.section === 'female' ? 'طالبة في المقرأة' : 'طالب في المقرأة')
  );

  const newAccount: AuthAccount = {
    id: `acc-manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: data.name.trim(),
    phone: cleanPhone || `0${Date.now().toString().slice(-8)}`,
    username: cleanUsername,
    role: data.role,
    section: data.section,
    titleBadge: defaultBadge,
    assignedHalqaTitle: assignedHalqa,
    registeredAt: new Date().toISOString().split('T')[0],
  };

  accounts.unshift(newAccount);
  saveAccounts(accounts);

  // If role is student, also ensure registered in registrationStore with status approved
  if (data.role === 'student') {
    saveRegisteredStudent({
      name: newAccount.name,
      section: newAccount.section === 'female' ? 'female' : 'male',
      phone: newAccount.phone,
      memorization: 'حفظ وتثبيت القرآن الكريم',
      wantsSanad: 'نعم',
      preferredTime: newAccount.section === 'male' ? '5:00 ص - 6:30 ص' : '4:00 م - 6:00 م',
      country: 'اليمن',
      notes: data.notes || `تمت الإضافة اليدوية بواسطة المشرف بحساب دخول مباشر (${newAccount.username})`,
      status: 'approved',
    });
  } else if (data.role === 'teacher') {
    saveRegisteredTeacher({
      name: newAccount.name,
      qualification: 'إجازة في القرآن الكريم بالسند المتصل',
      country: 'اليمن',
      phone: newAccount.phone,
      targetSection: newAccount.section || 'both',
      experience: 'معلم معتمد في المقرأة',
      status: 'approved',
      assignedHalqaTitle: newAccount.assignedHalqaTitle,
    });
  }

  window.dispatchEvent(new CustomEvent('rehab_auth_accounts_updated', { detail: accounts }));

  return {
    success: true,
    message: `تم إنشاء حساب ${data.role === 'student' ? 'الطالب' : data.role === 'teacher' ? 'المعلم' : 'المشرف'} (${newAccount.name}) بنجاح!`,
    account: newAccount,
  };
};

export const adminUpdateAccount = (
  id: string,
  updates: Partial<AuthAccount>
): { success: boolean; message: string; account?: AuthAccount } => {
  const accounts = getAllAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { success: false, message: 'الحساب غير موجود.' };
  }

  const safeUpdates = { ...updates };
  delete safeUpdates.password;
  accounts[index] = { ...accounts[index], ...safeUpdates };
  delete accounts[index].password;
  saveAccounts(accounts);
  window.dispatchEvent(new CustomEvent('rehab_auth_accounts_updated', { detail: accounts }));

  return {
    success: true,
    message: 'تم تحديث بيانات الحساب بنجاح.',
    account: accounts[index],
  };
};

export const adminResetPassword = (id: string, newPassword: string): { success: boolean; message: string } => {
  void id;
  void newPassword;
  return { success: false, message: 'تغيير كلمة المرور يتم عبر Firebase Auth، ولا تُحفظ كلمات المرور محلياً.' };
};

export const adminDeleteAccount = (id: string): { success: boolean; message: string } => {
  if (id === 'user-supervisor-male' || id === 'user-supervisor-female') {
    return { success: false, message: 'لا يمكن حذف الحسابات الإشرافية الرئيسية للمقرأة.' };
  }
  const accounts = getAllAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  saveAccounts(filtered);
  window.dispatchEvent(new CustomEvent('rehab_auth_accounts_updated', { detail: filtered }));
  return { success: true, message: 'تم حذف الحساب بنجاح.' };
};
