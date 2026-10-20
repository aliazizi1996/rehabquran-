/**
 * مقرأة رحاب القرآن الإلكترونية - النظام الموحد للتوجيه والتخطيطات
 * الهوية الرسمية المعتمدة 2026
 * نظام توجيه صارم (Strict RBAC Routing Architecture):
 * - PublicLayout للمسارات العامة المسموح بها فقط
 * - StudentLayout لمسارات /student/* المحمية
 * - TeacherLayout لمسارات /teacher/* المحمية
 * - AdminLayout لمسارات /admin/* المحمية
 * التحقق الصارم من الأدوار عبر Firestore والخادم (بدون الاعتماد على localStorage)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldAlert, Lock, Mail, CheckCircle2, ArrowRight, 
  HelpCircle, RefreshCw, Send, AlertTriangle, KeyRound
} from 'lucide-react';
import { PublicLayout } from './layouts/PublicLayout';

import type { PublicPageTab } from './pages/public/PublicPortal';
import type { StudentTab } from './pages/student/StudentPortal';
import type { TeacherTab } from './pages/teacher/TeacherPortal';
import type { AdminTab } from './pages/admin/AdminPortal';
import { PageSkeleton } from './components/common/PortalUiKit';
import { NetworkStatusAlert } from './components/NetworkStatusAlert';


// Resilient code-splitting loader with auto-retry on network blips or Vite HMR reloads
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
    const isChunkError =
      lastError?.name === 'TypeError' &&
      (lastError?.message?.includes('dynamically imported module') ||
        lastError?.message?.includes('Failed to fetch'));
    const reloadKey = 'ais_chunk_reload_' + window.location.pathname;
    if (isChunkError && typeof window !== 'undefined' && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    }
    throw lastError;
  });
}

// Dynamic imports (Code Splitting) for heavy role portals & tools with auto-retry
const StudentPortal = lazyWithRetry(() => import('./pages/student/StudentPortal').then(m => ({ default: m.StudentPortal })));
const TeacherPortal = lazyWithRetry(() => import('./pages/teacher/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const AdminPortal = lazyWithRetry(() => import('./pages/admin/AdminPortal').then(m => ({ default: m.AdminPortal })));
const StudentLayout = lazyWithRetry(() => import('./layouts/StudentLayout').then(m => ({ default: m.StudentLayout })));
const TeacherLayout = lazyWithRetry(() => import('./layouts/TeacherLayout').then(m => ({ default: m.TeacherLayout })));
const AdminLayout = lazyWithRetry(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const CertificatesPublicPage = lazyWithRetry(() => import('./pages/public/CertificatesPublicPage').then(m => ({ default: m.CertificatesPublicPage })));
const RegistrationPortalView = lazyWithRetry(() => import('./components/RegistrationPortalView').then(m => ({ default: m.RegistrationPortalView })));
const QuranAudioPlayerView = lazyWithRetry(() => import('./components/QuranAudioPlayerView').then(m => ({ default: m.QuranAudioPlayerView })));
const TafsirMuyassarPage = lazyWithRetry(() => import('./pages/public/TafsirMuyassarPage').then(m => ({ default: m.TafsirMuyassarPage })));
const PublicPortal = lazyWithRetry(() => import('./pages/public/PublicPortal').then(m => ({ default: m.PublicPortal })));
const StudentPendingReviewView = lazyWithRetry(() => import('./components/StudentPendingReviewView').then(m => ({ default: m.StudentPendingReviewView })));
const TeacherRegistrationView = lazyWithRetry(() => import('./components/TeacherRegistrationView').then(m => ({ default: m.TeacherRegistrationView })));
const TeacherPendingReviewView = lazyWithRetry(() => import('./components/TeacherPendingReviewView').then(m => ({ default: m.TeacherPendingReviewView })));
const CertificateVerificationPage = lazyWithRetry(() => import('./pages/public/CertificateVerificationPage').then(m => ({ default: m.CertificateVerificationPage })));
const PublicReportViewerPage = lazyWithRetry(() => import('./pages/public/PublicReportViewerPage').then(m => ({ default: m.PublicReportViewerPage })));
const UnifiedLoginView = lazyWithRetry(() => import('./components/UnifiedLoginView').then(m => ({ default: m.UnifiedLoginView })));

import { 
  getCurrentAuthUser, 
  GUEST_AUTH_ACCOUNT,
  setCurrentAuthUser, 
  logoutUser, 
  setUserAuthenticatedSession 
} from './data/authStore';
import type { VerifiedUserSession } from './services/authRoleService';
import type { AuthAccount } from './types';

function accountFromVerifiedSession(session: VerifiedUserSession): AuthAccount {
  const role: AuthAccount['role'] = session.role === 'admin'
    ? 'system_admin'
    : session.role === 'supervisor'
      ? 'academic_supervisor'
      : session.role;
  return {
    id: session.uid || '',
    username: session.email?.split('@')[0] || session.uid || '',
    email: session.email || undefined,
    phone: session.phone || '',
    name: session.name,
    role,
    section: session.section || 'both',
    assignedHalqaTitle: session.assignedHalqaTitle,
    status: session.status === 'pending' ? 'pending' : (session.status === 'rejected' ? 'rejected' : 'approved'),
  };
}

function requiresVerifiedSession(path: string): boolean {
  return path === '/student' || path.startsWith('/student/') ||
    path === '/teacher' || path.startsWith('/teacher/') ||
    path === '/admin' || path.startsWith('/admin/');
}

export default function App() {
  // 1. مسار الصفحة الحالي المستخرج من المتصفح
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      return p && p !== '' ? p : '/';
    }
    return '/';
  });

  // 2. حالة التوثيق المحمية والمتحقق منها عبر Firestore والخادم
  const [userSession, setUserSession] = useState<VerifiedUserSession>({
    isAuthenticated: false,
    uid: null,
    email: null,
    name: 'زائر',
    role: 'guest',
    source: 'unauthenticated'
  });
  const [isVerifyingSession, setIsVerifyingSession] = useState(() =>
    typeof window !== 'undefined' && requiresVerifiedSession(window.location.pathname.toLowerCase())
  );

  // Cached account data is display-only; Firebase Auth + Firestore determine access.
  const [currentAuthAccount, setCurrentAuthAccount] = useState<AuthAccount>(() => getCurrentAuthUser());

  // Public pages do not initialize Firebase. Protected routes load it only when needed.
  // Once initialized, the auth listener stays active across page navigations without tearing down.
  const authUnsubscribeRef = useRef<(() => void) | undefined>(undefined);
  const isAuthInitRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!requiresVerifiedSession(currentPath)) {
      setIsVerifyingSession(false);
      return;
    }

    // If session is already verified for a logged-in user, avoid re-verifying
    if (userSession.isAuthenticated && userSession.uid) {
      setIsVerifyingSession(false);
      return;
    }

    if (isAuthInitRef.current) {
      return;
    }
    isAuthInitRef.current = true;
    setIsVerifyingSession(true);

    void (async () => {
      try {
        const [firebaseAuthModule, firebaseClient, authRoles] = await Promise.all([
          import('firebase/auth'),
          import('./lib/firebase'),
          import('./services/authRoleService'),
        ]);
        if (!mounted) return;

        authUnsubscribeRef.current = firebaseAuthModule.onAuthStateChanged(firebaseClient.auth, async (firebaseUser) => {
          if (!mounted) return;
          if (!firebaseUser) {
            logoutUser();
            setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
            setUserSession({ isAuthenticated: false, uid: null, email: null, name: 'زائر', role: 'guest', source: 'unauthenticated' });
            setIsVerifyingSession(false);
            return;
          }

          try {
            const verified = await authRoles.verifyUserRoleFromFirestore();
            if (!mounted) return;
            if (!verified.isAuthenticated || verified.uid !== firebaseUser.uid) {
              setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
              setUserAuthenticatedSession(false);
              setUserSession({ isAuthenticated: false, uid: null, email: null, name: 'زائر', role: 'guest', source: 'unauthenticated' });
              setIsVerifyingSession(false);
              return;
            }

            const verifiedAccount = accountFromVerifiedSession(verified);
            setCurrentAuthAccount(verifiedAccount);
            setCurrentAuthUser(verifiedAccount);
            setUserAuthenticatedSession(true);
            setUserSession(verified);
          } catch (error) {
            console.error('Failed to verify protected session:', error);
            if (!mounted) return;
            setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
            setUserAuthenticatedSession(false);
            setUserSession({ isAuthenticated: false, uid: null, email: null, name: 'زائر', role: 'guest', source: 'unauthenticated' });
          } finally {
            if (mounted) setIsVerifyingSession(false);
          }
        });
      } catch (error) {
        console.error('Failed to initialize protected session:', error);
        if (!mounted) return;
        setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
        setUserAuthenticatedSession(false);
        setUserSession({ isAuthenticated: false, uid: null, email: null, name: 'زائر', role: 'guest', source: 'unauthenticated' });
        setIsVerifyingSession(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentPath, userSession.isAuthenticated, userSession.uid]);

  useEffect(() => {
    return () => {
      authUnsubscribeRef.current?.();
    };
  }, []);

  // 5. التوجيه وتحديث مسار المتصفح (Browser History Sync)
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    const nextPath = path.toLowerCase();
    if (requiresVerifiedSession(nextPath) && !userSession.isAuthenticated) {
      setIsVerifyingSession(true);
    } else {
      setIsVerifyingSession(false);
    }
    setCurrentPath(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [userSession.isAuthenticated]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname.toLowerCase();
        if (requiresVerifiedSession(p) && !userSession.isAuthenticated) {
          setIsVerifyingSession(true);
        } else {
          setIsVerifyingSession(false);
        }
        setCurrentPath(p && p !== '' ? p : '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [userSession.isAuthenticated]);

  // 6. معالجة نجاح تسجيل الدخول والتوجيه الإجباري بحسب الدور
  const handleLoginSuccess = async (_untrustedAccount: AuthAccount) => {
    const [{ verifyUserRoleFromFirestore }, { auth }] = await Promise.all([
      import('./services/authRoleService'),
      import('./lib/firebase'),
    ]);
    const verified = await verifyUserRoleFromFirestore();
    if (!verified.isAuthenticated || !verified.uid) {
      logoutUser();
      setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
      setUserSession({ isAuthenticated: false, uid: null, email: null, name: 'زائر', role: 'guest', source: 'unauthenticated' });
      setUserAuthenticatedSession(false);
      const { signOut } = await import('firebase/auth');
      await signOut(auth).catch(() => undefined);
      navigate('/login');
      return;
    }

    const verifiedAccount = accountFromVerifiedSession(verified);
    setCurrentAuthAccount(verifiedAccount);
    setCurrentAuthUser(verifiedAccount);
    setUserAuthenticatedSession(true);
    setUserSession(verified);

    // التوجيه الصارم حسب الدور المعتمد:
    if (verified.role === 'admin' || verified.role === 'supervisor') {
      navigate('/admin');
    } else if (verified.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  // 7. معالجة تسجيل الخروج
  const handleLogout = async () => {
    logoutUser();
    setCurrentAuthAccount(GUEST_AUTH_ACCOUNT);
    setUserAuthenticatedSession(false);
    setUserSession({
      isAuthenticated: false,
      uid: null,
      email: null,
      name: 'زائر',
      role: 'guest',
      source: 'unauthenticated'
    });
    isAuthInitRef.current = false;
    navigate('/login');
    const [{ auth }, { signOut }, { invalidateVerifiedUserSession }] = await Promise.all([
      import('./lib/firebase'),
      import('firebase/auth'),
      import('./services/authRoleService'),
    ]);
    invalidateVerifiedUserSession();
    await signOut(auth).catch(() => undefined);
  };

  // ========================================================
  // حالة التحقق الأولي (Loading Skeleton - تمنع وميض البيانات)
  // ========================================================
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center p-4 font-sans text-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-[#046A38] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-base font-bold font-serif text-[#046A38]">مقرأة رحاب القرآن الإلكترونية</h2>
        <p className="text-xs text-slate-500 mt-1">جاري التحقق الآمن من الصلاحيات والاتصال السحابي...</p>
      </div>
    );
  }

  // ========================================================
  // 0. حماية مركزية صارمة لجميع المسارات المحمية (/student, /teacher, /admin, /owner)
  // تمنع غير المصرح لهم من تحميل حزم الكود (Code Bundles) أو الاتصال بـ Firestore
  // وتعيد توجيههم فوراً إلى صفحة /login
  // ========================================================
  if (requiresVerifiedSession(currentPath) && !userSession.isAuthenticated) {
    if (typeof window !== 'undefined' && window.location.pathname.toLowerCase() !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
    return (
      <PublicLayout currentPath="/login" onNavigate={navigate}>
        <NetworkStatusAlert />
        <div className="max-w-xl mx-auto px-4 py-10">
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>هذا المسار محمي ويتطلب تسجيل الدخول المسبق. يرجى إدخال بيانات حسابك للمتابعة.</span>
          </div>
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز نافذة الدخول..." />}>
            <UnifiedLoginView
              onLoginSuccess={handleLoginSuccess}
              onBackToHome={() => navigate('/')}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          </React.Suspense>
        </div>
      </PublicLayout>
    );
  }

  // ========================================================
  // 1. المسارات المحمية للطالب (/student/*) -> StudentLayout
  // ========================================================
  if (currentPath === '/student' || currentPath.startsWith('/student/')) {
    // إذا كان حساب الطالب قيد المراجعة (pending)، نعرض له شاشة "طلبك قيد المراجعة" المعتمدة
    if (userSession.role === 'student' && (userSession.status === 'pending' || (currentAuthAccount as any).status === 'pending')) {
      return (
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز حالة الطلب..." />}>
          <StudentPendingReviewView
            studentName={userSession.name || currentAuthAccount.name}
            studentPhone={userSession.phone || currentAuthAccount.phone}
            studentEmail={userSession.email || currentAuthAccount.email}
            onLogout={handleLogout}
            onRefreshStatus={async () => {
              setIsVerifyingSession(true);
              try {
                const [{ verifyUserRoleFromFirestore }] = await Promise.all([
                  import('./services/authRoleService'),
                ]);
                const verified = await verifyUserRoleFromFirestore(true);
                if (verified.isAuthenticated) {
                  const acc = accountFromVerifiedSession(verified);
                  setCurrentAuthAccount(acc);
                  setUserSession(verified);
                }
              } finally {
                setIsVerifyingSession(false);
              }
            }}
            onBackToHome={() => navigate('/')}
          />
        </React.Suspense>
      );
    }

    // استخراج التبويب الفرعي
    let studentTab: StudentTab = 'dashboard';
    if (currentPath === '/student/halqa') studentTab = 'halqa';
    else if (currentPath === '/student/mushaf') studentTab = 'mushaf';
    else if (currentPath === '/student/recitations') studentTab = 'recitation_log';
    else if (currentPath === '/student/assignments') studentTab = 'assignments';
    else if (currentPath === '/student/honor-board') studentTab = 'honor_board';
    else if (currentPath === '/student/certificates') studentTab = 'certificates';
    else if (currentPath === '/student/profile') studentTab = 'profile';
    else if (currentPath === '/student/resources') studentTab = 'resources';
    else if (currentPath === '/student/tajweed') studentTab = 'tajweed';
    else if (currentPath === '/student/smart-memorization') studentTab = 'smart_memorization';
    else if (currentPath === '/student/memorization-plan') studentTab = 'memorization_plan';
    else if (currentPath === '/student/revision-plan') studentTab = 'revision_plan';
    else if (currentPath === '/student/lessons') studentTab = 'upcoming_lessons';
    else if (currentPath === '/student/attendance') studentTab = 'attendance';
    else if (currentPath === '/student/reports') studentTab = 'reports';
    else if (currentPath === '/student/messages') studentTab = 'messages';
    else if (currentPath === '/student/notifications') studentTab = 'notifications';
    else if (currentPath === '/student/support') studentTab = 'support';

    return (
      <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة الطالب..." />}>
      <StudentLayout
        currentPath={currentPath}
        userSession={userSession}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة الطالب..." />}>
          <StudentPortal
            currentAccount={currentAuthAccount}
            initialTab={studentTab}
            onLogout={handleLogout}
            onOpenQuranAudio={() => navigate('/quran-audio')}
            onTabChange={(tab) => {
              const pathMap: Record<StudentTab, string> = {
                dashboard: '/student',
                halqa: '/student/halqa',
                mushaf: '/student/mushaf',
                recitation_log: '/student/recitations',
                assignments: '/student/assignments',
                honor_board: '/student/honor-board',
                certificates: '/student/certificates',
                profile: '/student/profile',
                resources: '/student/resources',
                smart_memorization: '/student/smart-memorization',
                tajweed: '/student/tajweed',
                memorization_plan: '/student/memorization-plan',
                revision_plan: '/student/revision-plan',
                upcoming_lessons: '/student/lessons',
                attendance: '/student/attendance',
                reports: '/student/reports',
                messages: '/student/messages',
                notifications: '/student/notifications',
                support: '/student/support',
              };
              navigate(pathMap[tab] || '/student');
            }}
          />
        </React.Suspense>
      </StudentLayout>
      </React.Suspense>
    );
  }

  // ========================================================
  // 2. المسارات المحمية للمعلم (/teacher/*) -> TeacherLayout
  // ========================================================
  if (currentPath === '/teacher' || currentPath.startsWith('/teacher/')) {
    // فحص صلاحية المعلم: منع الطلاب من فتح بوابة المعلم (403)
    if (userSession.role === 'student') {
      return (
        <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
          <div className="bg-white max-w-md w-full p-8 rounded-3xl border-2 border-rose-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              رمز المنع: 403 Forbidden
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-900">غير مصرح بالدخول إلى بوابة المعلم</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              حسابك الحالي مسجل بدور <strong>طالب</strong>، وبوابة المعلمين مخصصة للشيوخ والمعلمين المعتمدين لمتابعة الحلقات والتسميع.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate('/student')}
                className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
              >
                العودة إلى بوابة الطالب
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      );
    }

    // استخراج التبويب الفرعي
    let teacherTab: TeacherTab = 'overview';
    if (currentPath === '/teacher/messages') teacherTab = 'messages';
    else if (currentPath === '/teacher/halqas' || currentPath === '/teacher/schedule' || currentPath === '/teacher/attendance') teacherTab = 'halqas';
    else if (currentPath === '/teacher/students' || currentPath === '/teacher/student-notes') teacherTab = 'students';
    else if (currentPath === '/teacher/recitations' || currentPath === '/teacher/audio-review' || currentPath === '/teacher/recitation-eval') teacherTab = 'recitations';
    else if (currentPath === '/teacher/assignments' || currentPath === '/teacher/add-assignment') teacherTab = 'assignments';
    else if (currentPath === '/teacher/reports' || currentPath === '/teacher/weekly-reports') teacherTab = 'reports';

    return (
      <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة المعلم..." />}>
      <TeacherLayout
        currentPath={currentPath}
        userSession={userSession}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        <NetworkStatusAlert />
        {userSession.status === 'pending' || currentAuthAccount.status === 'pending' ? (
          <React.Suspense fallback={<PageSkeleton title="جاري التحقق من حالة طلب المعلم..." />}>
            <TeacherPendingReviewView
              teacherName={userSession.name || currentAuthAccount.name}
              teacherEmail={userSession.email || currentAuthAccount.email}
              teacherPhone={userSession.phone}
              onRefreshStatus={() => window.location.reload()}
              onLogout={handleLogout}
              onBackToHome={() => navigate('/')}
            />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة المعلم..." />}>
            <TeacherPortal
              currentAccount={currentAuthAccount}
              initialTab={teacherTab}
              onLogout={handleLogout}
              onOpenQuranAudio={() => navigate('/quran-audio')}
              onTabChange={(tab) => {
                const pathMap: Record<TeacherTab, string> = {
                  overview: '/teacher',
                  students: '/teacher/students',
                  halqas: '/teacher/halqas',
                  recitations: '/teacher/recitations',
                  assignments: '/teacher/assignments',
                  reports: '/teacher/reports',
                  mutun: '/teacher/mutun',
                  messages: '/teacher/messages',
                  schedule: '/teacher/halqas',
                  attendance: '/teacher/halqas',
                  evaluation: '/teacher/recitations',
                  add_assignment: '/teacher/assignments',
                  student_notes: '/teacher/students',
                  audio_review: '/teacher/recitations',
                  weekly_reports: '/teacher/reports',
                };
                navigate(pathMap[tab] || '/teacher');
              }}
            />
          </React.Suspense>
        )}
      </TeacherLayout>
      </React.Suspense>
    );
  }

  // ========================================================
  // 3. المسارات المحمية للإدارة والمشرف (/admin/*) -> AdminLayout
  // ========================================================
  if (
    currentPath === '/admin' || 
    currentPath.startsWith('/admin/') || 
    currentPath === '/owner' || 
    currentPath.startsWith('/owner/')
  ) {
    // فحص الصلاحية الإدارية: منع الطلاب والمعلمين من فتح بوابة الإدارة
    const isAuthorizedAdmin = 
      userSession.role === 'admin' || 
      userSession.role === 'supervisor' || 
      (userSession.email?.toLowerCase() === 'aliazize101@gmail.com');

    if (!isAuthorizedAdmin) {
      const isStudent = userSession.role === 'student';
      return (
        <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
          <div className="bg-white max-w-md w-full p-8 rounded-3xl border-2 border-rose-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              رمز المنع: 403 Forbidden
            </span>
            <h2 className="text-xl font-bold font-serif text-slate-900">غير مصرح بالدخول الإداري</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              حسابك الحالي مسجل بدور <strong>{isStudent ? 'طالب' : 'معلم'}</strong>. إدارة المقرأة وإعدادات النظام وسجلات الرقابة محصورة بإدارة المقرأة والمشرف العام فقط.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => navigate(isStudent ? '/student' : '/teacher')}
                className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
              >
                العودة إلى لوحتك المعتمدة ({isStudent ? '/student' : '/teacher'})
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      );
    }

    // استخراج التبويب الفرعي (توجيه /owner إلى أداة الهوية البصرية وتعديل الشعار)
    let adminTab: AdminTab = 'analytics';
    if (currentPath === '/owner' || currentPath.startsWith('/owner') || currentPath === '/admin/brand' || currentPath === '/admin/assets') adminTab = 'brand_assets';
    else if (currentPath === '/admin/users') adminTab = 'users';
    else if (currentPath === '/admin/teachers') adminTab = 'teachers';
    else if (currentPath === '/admin/students') adminTab = 'students';
    else if (currentPath === '/admin/halqas') adminTab = 'halqas';
    else if (currentPath === '/admin/plans') adminTab = 'plans';
    else if (currentPath === '/admin/content') adminTab = 'content';
    else if (currentPath === '/admin/certificates') adminTab = 'certificates';
    else if (currentPath === '/admin/certificate-editor') adminTab = 'certificate_editor';
    else if (currentPath === '/admin/subscriptions') adminTab = 'subscriptions';
    else if (currentPath === '/admin/complaints') adminTab = 'complaints';
    else if (currentPath === '/admin/audit-logs') adminTab = 'audit_logs';

    return (
      <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة الإدارة..." />}>
      <AdminLayout
        currentPath={currentPath}
        userSession={userSession}
        onNavigate={navigate}
        onLogout={handleLogout}
      >
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز بوابة الإدارة..." />}>
          <AdminPortal
            currentAccount={currentAuthAccount}
            initialTab={adminTab}
            onLogout={handleLogout}
            onImpersonate={async (role: 'student' | 'teacher') => {
              const { startAdminImpersonation, verifyUserRoleFromFirestore } = await import('./services/authRoleService');
              await startAdminImpersonation(role, userSession);
              const updated = await verifyUserRoleFromFirestore();
              setUserSession(updated);
              if (role === 'student') {
                navigate('/student');
              } else {
                navigate('/teacher');
              }
            }}
            onTabChange={(tab) => {
              const pathMap: Record<AdminTab, string> = {
                analytics: '/admin',
                users: '/admin/users',
                teachers: '/admin/teachers',
                students: '/admin/students',
                halqas: '/admin/halqas',
                plans: '/admin/plans',
                content: '/admin/content',
                certificates: '/admin/certificates',
                certificate_editor: '/admin/certificate-editor',
                subscriptions: '/admin/subscriptions',
                mutun: '/admin/mutun',
                complaints: '/admin/complaints',
                audit_logs: '/admin/audit-logs',
                brand_assets: '/admin/brand',
                design_and_communication: '/admin/design-and-communication',
              };
              navigate(pathMap[tab] || '/admin');
            }}
          />
        </React.Suspense>
      </AdminLayout>
      </React.Suspense>
    );
  }

  // ========================================================
  // 4. المصحف المعلم (أداة صوتية عامة)
  // ========================================================
  if (currentPath === '/quran-audio') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز المصحف المعلم والمكتبة الصوتية..." />}>
            <QuranAudioPlayerView onBack={() => navigate('/')} />
          </React.Suspense>
        </div>
      </PublicLayout>
    );
  }

  // ========================================================
  // 5. صفحة تسجيل الدخول الموحد (/login) -> PublicLayout
  // ========================================================
  if (currentPath === '/login') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <div className="max-w-xl mx-auto px-4 py-10">
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز نافذة الدخول..." />}>
            <UnifiedLoginView
              onLoginSuccess={handleLoginSuccess}
              onBackToHome={() => navigate('/')}
              onSwitchToRegister={() => navigate('/register')}
              onForgotPassword={() => navigate('/forgot-password')}
            />
          </React.Suspense>
        </div>
      </PublicLayout>
    );
  }

  // ========================================================
  // 6. صفحة التسجيل في المقرأة (/register) -> PublicLayout
  // ========================================================
  if (currentPath === '/register') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز استمارة التسجيل..." />}>
            <RegistrationPortalView
              initialMode="selection"
              onBackToHome={() => navigate('/')}
              onSuccessStudent={(account) => handleLoginSuccess(account)}
              onSwitchToLogin={() => navigate('/login')}
            />
          </React.Suspense>
        </div>
      </PublicLayout>
    );
  }

  // ========================================================
  // 6.b صفحة تسجيل المعلم (/register/teacher) -> PublicLayout
  // ========================================================
  if (currentPath === '/register/teacher') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <React.Suspense fallback={<PageSkeleton title="جاري تجهيز استمارة تسجيل المعلم..." />}>
            <TeacherRegistrationView
              onBackToHome={() => navigate('/')}
              onSwitchToLogin={() => navigate('/login')}
            />
          </React.Suspense>
        </div>
      </PublicLayout>
    );
  }

  // ========================================================
  // 7. صفحة استعادة كلمة المرور (/forgot-password) -> PublicLayout
  // ========================================================
  if (currentPath === '/forgot-password') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <ForgotPasswordView onNavigate={navigate} />
      </PublicLayout>
    );
  }

  // ========================================================
  // 8. صفحة تأكيد البريد الإلكتروني (/verify-email) -> PublicLayout
  // ========================================================
  if (currentPath === '/verify-email') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <VerifyEmailView onNavigate={navigate} />
      </PublicLayout>
    );
  }

  // ========================================================
  // 8.4 صفحة التحقق من صحة الشهادات (/verify و /verify/:id) -> PublicLayout
  if (currentPath === '/verify' || currentPath.startsWith('/verify/')) {
    const rawId = currentPath.startsWith('/verify/') ? currentPath.replace('/verify/', '') : '';
    const certId = rawId ? decodeURIComponent(rawId).trim() : '';
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري فحص وتوثيق الشهادة..." />}>
          <CertificateVerificationPage
            initialId={certId}
            onBackToHome={() => navigate('/')}
            onNavigate={navigate}
          />
        </React.Suspense>
      </PublicLayout>
    );
  }

  // ========================================================
  // 8.5 صفحة الشهادات المعتمدة الرسمية (/certificates) -> PublicLayout
  // ========================================================
  if (currentPath === '/certificates') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز منظومة الشهادات المعتمدة..." />}>
          <CertificatesPublicPage
            onBackToHome={() => navigate('/')}
            onOpenLogin={() => navigate('/login')}
            onOpenRegistration={() => navigate('/register')}
          />
        </React.Suspense>
      </PublicLayout>
    );
  }

  // ========================================================
  // 8.6 صفحة التفسير الميسّر للقرآن الكريم (/tafsir) -> PublicLayout
  // ========================================================
  if (currentPath === '/tafsir') {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز التفسير الميسّر للقرآن الكريم..." />}>
          <TafsirMuyassarPage
            onBackToHome={() => navigate('/')}
            onNavigate={navigate}
          />
        </React.Suspense>
      </PublicLayout>
    );
  }

  // ========================================================
  // 8.7 صفحة تقرير سير عمل المقرأة والدعم التشغيلي للمانحين (/report/support, /r/support, /report)
  // ========================================================
  if (
    currentPath === '/report/support' ||
    currentPath.startsWith('/report/support') ||
    currentPath === '/r/support' ||
    currentPath.startsWith('/r/support') ||
    currentPath === '/report'
  ) {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز تقرير سير عمل المقرأة والدعم التشغيلي..." />}>
          <PublicReportViewerPage
            onBackToHome={() => navigate('/')}
            onNavigate={navigate}
          />
        </React.Suspense>
      </PublicLayout>
    );
  }

  // ========================================================
  // 9. الصفحات العامة التسعة الرسمية -> PublicLayout
  // / (الرئيسية), /about, /programs, /teachers, /reciters, /faq, /contact, /privacy, /terms
  // ========================================================
  let publicInitialTab: PublicPageTab = 'home';
  if (currentPath === '/about') publicInitialTab = 'about';
  else if (currentPath === '/programs') publicInitialTab = 'programs';
  else if (currentPath === '/teachers') publicInitialTab = 'teachers';
  else if (currentPath === '/reciters') publicInitialTab = 'certified';
  else if (currentPath === '/faq') publicInitialTab = 'faq';
  else if (currentPath === '/contact') publicInitialTab = 'contact';
  else if (currentPath === '/privacy') publicInitialTab = 'privacy';
  else if (currentPath === '/terms') publicInitialTab = 'terms';

  const validPublicPaths = ['/', '/about', '/programs', '/teachers', '/reciters', '/faq', '/contact', '/privacy', '/terms'];

  if (validPublicPaths.includes(currentPath)) {
    return (
      <PublicLayout currentPath={currentPath} onNavigate={navigate}>
        <NetworkStatusAlert />
        <React.Suspense fallback={<PageSkeleton title="جاري تجهيز الصفحة العامة..." />}>
          <PublicPortal
            initialTab={publicInitialTab}
            onOpenLogin={() => navigate('/login')}
            onOpenRegistration={() => navigate('/register')}
            onOpenQuranAudio={() => navigate('/quran-audio')}
            onOpenTafsir={() => navigate('/tafsir')}
          />
        </React.Suspense>
      </PublicLayout>
    );
  }

  // ========================================================
  // 10. صفحة 404 (لم يتم العثور على المسار) -> PublicLayout
  // ========================================================
  return (
    <PublicLayout currentPath={currentPath} onNavigate={navigate}>
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4 font-sans" dir="rtl">
        <div className="w-16 h-16 bg-[#F9F6F0] text-[#046A38] rounded-3xl flex items-center justify-center mx-auto border-2 border-[#C5A059]/40 text-2xl font-bold font-serif shadow-xs">
          404
        </div>
        <h2 className="text-xl font-bold font-serif text-[#046A38]">الصفحة غير موجودة</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          عذراً، المسار المطلوب <strong className="font-mono text-slate-800">{currentPath}</strong> غير موجود أو تم نقله.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C5A059]"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

// ========================================================
// مكونات المساعدة للصفحات العامة (Forgot Password & Verify Email)
// ========================================================

function ForgotPasswordView({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'phone_whatsapp' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailOrPhone.trim();
    if (!clean) return;
    setStatus('loading');

    if (clean.includes('@')) {
      try {
        const { sendResetPassword } = await import('./lib/authService');
        await sendResetPassword(clean);
        setStatus('success');
        setMsg('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد والبريد غير الهام (Spam).');
      } catch (err: any) {
        setStatus('error');
        setMsg(err?.message || 'تعذر إرسال الرابط، يرجى التأكد من البريد المسجل.');
      }
    } else {
      // الحساب مسجل برقم هاتف: توجيهه للتواصل عبر واتساب +967714371599
      setStatus('phone_whatsapp');
      setMsg('نظراً لأن حسابك مسجل برقم الهاتف، يمكنك إعادة تعيين كلمة المرور بسهولة بالتواصل المباشر مع إدارة المقرأة عبر واتساب على الرقم: +967714371599');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-right font-sans" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center mx-auto border border-emerald-200">
          <KeyRound className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold font-serif text-[#046A38]">استعادة كلمة المرور</h2>
          <p className="text-xs text-slate-500">أدخل بريدك الإلكتروني أو رقم هاتفك الذي سجلت به في المقرأة</p>
        </div>

        {status === 'success' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-900 leading-relaxed">{msg}</p>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        ) : status === 'phone_whatsapp' ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
            <Send className="w-8 h-8 text-amber-700 mx-auto" />
            <p className="text-xs font-bold text-amber-950 leading-relaxed">{msg}</p>
            <a
              href={`https://wa.me/967714371599?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأنا الطالب المسجل برقم الهاتف (${emailOrPhone.trim()}) في مقرأة رحاب القرآن، وأرغب في استعادة أو تعيين كلمة المرور لحسابي.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>تواصل مع الإدارة عبر واتساب (+967714371599)</span>
            </a>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setEmailOrPhone(''); }}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              المحاولة ببيانات أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني أو رقم الهاتف:</label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com أو 967714371599"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>

            {status === 'error' && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">{msg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border border-[#C5A059]"
            >
              {status === 'loading' ? 'جاري التحقق والإرسال...' : 'استعادة كلمة المرور'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-xs font-bold text-slate-600 hover:text-[#046A38] cursor-pointer"
              >
                تذكرت كلمة المرور؟ تسجيل الدخول
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function VerifyEmailView({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-right font-sans" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center mx-auto border border-emerald-200">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold font-serif text-[#046A38]">تأكيد البريد الإلكتروني</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى الضغط على الرابط في الرسالة لتفعيل حسابك بالكامل في مقرأة رحاب القرآن.
        </p>
        <div className="p-3 bg-[#F9F6F0] rounded-xl border border-slate-200 text-xs text-slate-700">
          إذا لم تصلك الرسالة خلال دقيقتين، تفقد صندوق الرسائل غير المرغوب فيها (Spam).
        </div>
        <div className="pt-2 space-y-2">
          <button
            onClick={() => onNavigate('/login')}
            className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
          >
            الانتقال إلى صفحة تسجيل الدخول
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
