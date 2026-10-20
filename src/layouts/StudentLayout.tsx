/**
 * StudentLayout - التخطيط الرسمي لمسارات لوحة الطالب (/student/*)
 * مقرأة رحاب القرآن الإلكترونية
 * محمية بالكامل: لا يمكن للزوار أو المعلمين غير المصرح لهم الدخول
 * تشمل شريط الملاحة الخاص بالـ 12 صفحة المخصصة للطالب
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, RefreshCw, Calendar, CheckSquare, ClipboardList, 
  Mic, Award, BarChart3, MessageSquare, Bell, User, LogOut, 
  Menu, X, ChevronLeft, ShieldAlert, ArrowRight, ArrowLeft, Headphones,
  HeartHandshake, Sparkles, Video, WifiOff, Trophy, Brain
} from 'lucide-react';
import { OfficialLogo } from '../components/OfficialLogo';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { VerifiedUserSession } from '../services/authRoleService';
import { AdminImpersonationBanner } from '../components/AdminImpersonationBanner';
import { useDataSaver } from '../utils/dataSaverStore';

import { subscribeToUnreadCount } from '../services/chatService';
import { NotificationBanner } from '../components/NotificationBanner';
import { getInAppNotifications } from '../data/wirdNotificationStore';
import { getBrandLogoSettings } from '../utils/brandLogoStore';

interface StudentLayoutProps {
  currentPath: string;
  userSession: VerifiedUserSession;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  currentPath,
  userSession,
  onNavigate,
  onLogout,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDataSaver, toggleDataSaver } = useDataSaver();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(() => {
    return getInAppNotifications().filter(n => !n.isRead).length;
  });

  // Subscribe to live unread message count from the teacher
  useEffect(() => {
    if (!userSession.uid) return;
    const unsub = subscribeToUnreadCount(userSession.uid, (count) => {
      setUnreadChatCount(count);
    });
    return () => unsub();
  }, [userSession.uid]);

  // Subscribe to in-app notifications updates
  useEffect(() => {
    const handleNotifsChanged = () => {
      setUnreadNotifCount(getInAppNotifications().filter(n => !n.isRead).length);
    };
    window.addEventListener('rehab_notifications_updated', handleNotifsChanged);
    return () => {
      window.removeEventListener('rehab_notifications_updated', handleNotifsChanged);
    };
  }, []);

  // State for showGlobalAssemblyMembership (controlled by Supervisor)
  const [showGlobalAssembly, setShowGlobalAssembly] = useState(() => getBrandLogoSettings().showGlobalAssemblyMembership);

  useEffect(() => {
    const handleBrandUpdated = (e: any) => {
      setShowGlobalAssembly(e.detail?.showGlobalAssemblyMembership ?? getBrandLogoSettings().showGlobalAssemblyMembership);
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdated);
    return () => {
      window.removeEventListener('brand_logo_updated', handleBrandUpdated);
    };
  }, []);

  // 1. فحص الحماية: إذا لم يكن مسجلاً، تحويل أو حظر
  if (!userSession.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#046A38]">تنبيه: يلزم تسجيل الدخول</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            مسار لوحة الطالب <strong>/student</strong> محمي ولا يمكن تصفحه للزوار حفاظاً على خصوصية البيانات وحلقات التسميع.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/login?redirect=' + encodeURIComponent(currentPath))}
              className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
            >
              الانتقال إلى صفحة تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. فحص الصلاحية: (student فقط + الأدوار الأعلى: المشرفين والإداريين)
  const isStudentOrHigher = 
    userSession.role === 'student' || 
    ['admin', 'super_admin', 'system_admin', 'supervisor', 'academic_supervisor', 'moderator'].includes(userSession.role) ||
    Boolean(userSession.isImpersonating);

  if (!isStudentOrHigher) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border-2 border-rose-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            رمز المنع: 403 Forbidden
          </span>
          <h2 className="text-xl font-bold font-serif text-slate-900">غير مصرح بالدخول</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            مسار لوحة الطالب <strong>/student</strong> مخصص للطلاب والأدوار الإشرافية والإدارية فقط. دور حسابك الحالي: <strong>{userSession.role === 'teacher' ? 'معلم مقرأة' : userSession.role}</strong>.
          </p>
          <div className="pt-2 space-y-2">
            {userSession.role === 'teacher' && (
              <button
                onClick={() => onNavigate('/teacher')}
                className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
              >
                العودة إلى لوحة المعلم المعتمدة (/teacher)
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  const studentNavItems = [
    { label: 'الرئيسية', path: '/student', icon: BarChart3 },
    { label: 'حلقتي', path: '/student/halqa', icon: BookOpen },
    { label: 'المصاحف', path: '/student/mushaf', icon: BookOpen },
    { label: 'التسميع', path: '/student/recitations', icon: Mic },
    { label: 'الواجبات', path: '/student/assignments', icon: ClipboardList },
    { label: 'لوحة الشرف', path: '/student/honor-board', icon: Trophy },
    { label: 'شهاداتي', path: '/student/certificates', icon: Award },
    { label: 'الملف الشخصي', path: '/student/profile', icon: User },
    { label: 'دروس التجويد والمستويات', path: '/student/tajweed', icon: Sparkles },
    { label: 'مكتبة المصادر والتسجيلات', path: '/student/resources', icon: Video },
    { label: 'التحفيظ الذكي (Gemini)', path: '/student/smart-memorization', icon: Brain },
    { label: 'خطة الحفظ', path: '/student/memorization-plan', icon: BookOpen },
    { label: 'الحضور والغياب', path: '/student/attendance', icon: CheckSquare },
    { label: 'الرسائل مع الشيخ', path: '/student/messages', icon: MessageSquare },
    { label: 'المساهمة لدعم المقرأة', path: '/student/support', icon: HeartHandshake },
  ];

  const handleItemClick = (path: string) => {
    setIsSidebarOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C3531] font-sans text-right flex flex-col" dir="rtl">
      {/* Administrative Impersonation Session Banner */}
      {userSession.isImpersonating && (
        <AdminImpersonationBanner
          targetRole="student"
          adminName={userSession.name}
          onReturnToAdmin={() => onNavigate('/admin')}
        />
      )}

      {/* 1. الشريط التعريفي الموحد */}
      <div className="bg-[#046A38] text-white text-xs py-1.5 px-4 text-center font-medium border-b border-[#C5A059]/40 flex items-center justify-center gap-2 shadow-xs">
        <span className="font-sans font-bold text-[#F9F6F0] flex items-center gap-2 flex-wrap justify-center text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
          <span>مقرأة رحاب القرآن الإلكترونية</span>
          {showGlobalAssembly && (
            <>
              <span className="text-[#C5A059]">•</span>
              <span className="text-[#F9F6F0] bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-[#C5A059]/50 text-[11px] font-sans">عضو التجمع العالمي للقرآن الكريم</span>
            </>
          )}
          <span className="text-[#C5A059]">•</span>
          <span className="hidden sm:inline text-emerald-100">بوابة الطالب المتخصصة بالإجازات والسند</span>
        </span>
      </div>

      {/* Global In-App Notification Banner (Golden Toast for Favorite Sheikh & Recitation Alerts) */}
      <NotificationBanner onJoinHalqa={() => handleItemClick('/student')} />

      {/* Top Student Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleItemClick('/student')}
              className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-98"
            >
              <OfficialLogo size="md" showText={false} />
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold font-serif text-[#046A38] group-hover:text-emerald-800 transition-colors">بوابة الطالب</h1>
                  <span className="hidden sm:inline-block text-[10px] font-sans font-bold text-[#C5A059] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    رسمي 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">{userSession.assignedHalqaTitle || 'حلقة القرآن الكريم بالسند المتصل'}</p>
              </div>
            </button>

            {currentPath !== '/student' && (
              <button
                type="button"
                onClick={() => handleItemClick('/student')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#C5A059] group"
                title="الرجوع إلى لوحة الطالب الرئيسية"
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                <span className="hidden sm:inline font-sans">الرئيسية</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-700 bg-[#F9F6F0] px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 shadow-2xs">
              <span className="text-slate-500">طالب المقرأة:</span>
              <strong className="text-slate-900 font-bold">{userSession.name}</strong>
              {((userSession as any).academicId || (userSession as any).username) && (
                <span className="font-mono text-[10px] font-bold text-[#046A38] bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 mr-1" dir="ltr">
                  {(userSession as any).academicId || (userSession as any).username}
                </span>
              )}
            </span>

            {/* زر تثبيت تطبيق الويب PWA */}
            <PWAInstallButton variant="header" />

            {/* زر تبديل وضع توفير البيانات الموفر للشبكة والوسائط */}
            <button
              type="button"
              onClick={() => toggleDataSaver()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isDataSaver
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-2xs'
              }`}
              title="وضع توفير البيانات: عند تفعيله لا يتم تحميل أي وسائط إلا بطلب الطالب"
            >
              <WifiOff className={`w-3.5 h-3.5 ${isDataSaver ? 'text-amber-800' : 'text-slate-400'}`} />
              <span className="text-[11px] font-sans">
                {isDataSaver ? 'توفير البيانات ⚡' : 'توفير البيانات'}
              </span>
            </button>

            <button
              onClick={() => handleItemClick('/student/notifications')}
              className="relative p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer transition-colors shadow-2xs"
              title="مركز الإشعارات والتنبيهات المباشرة"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center animate-bounce shadow-xs">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-bold text-slate-600 rounded-xl transition-all cursor-pointer border border-transparent shadow-2xs"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-sans">تسجيل الخروج</span>
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer shadow-2xs"
              aria-label="قائمة التنقل"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Workspace with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-1">
          <div className="bg-white p-3.5 rounded-2xl border border-[#C5A059]/30 shadow-xs mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#046A38] to-[#02311c] text-[#C5A059] flex items-center justify-center font-bold font-serif text-base shadow-xs border border-[#C5A059]/40">
                {userSession.name.charAt(0)}
              </div>
              <div className="overflow-hidden min-w-0">
                <span className="block font-bold text-xs text-slate-900 truncate font-sans">{userSession.name}</span>
                <span className="inline-block text-[10px] font-sans font-bold text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate mt-0.5">
                  {userSession.role === 'admin' ? 'مدير (عرض الطالب)' : 'طالب منتظم بالسند'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F9F6F0] hover:text-[#046A38]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.path === '/student/messages' && unreadChatCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                    {item.path === '/student/notifications' && unreadNotifCount > 0 && (
                      <span className="bg-[#C5A059] text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>
                  <ChevronLeft className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isSidebarOpen && (
          <div className="lg:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-lg space-y-1 mb-4 animate-fadeIn">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#046A38] text-white'
                      : 'text-slate-700 hover:bg-[#F9F6F0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.path === '/student/messages' && unreadChatCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs">
                        {unreadChatCount}
                      </span>
                    )}
                    {item.path === '/student/notifications' && unreadNotifCount > 0 && (
                      <span className="bg-[#C5A059] text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs">
                        {unreadNotifCount}
                      </span>
                    )}
                  </div>
                  <ChevronLeft className="w-3.5 h-3.5 opacity-50" />
                </button>
              );
            })}
          </div>
        )}

        {/* Child Content */}
        <section className="flex-1 min-w-0">
          {children}
        </section>
      </div>

    </div>
  );
};

