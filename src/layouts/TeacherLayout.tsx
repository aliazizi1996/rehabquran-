/**
 * TeacherLayout - التخطيط الرسمي لمسارات لوحة المعلم (/teacher/*)
 * مقرأة رحاب القرآن الإلكترونية
 * محمية بالكامل: تمنع الطلاب والزوار من دخول أقسام المعلمين (403 Forbidden)
 * تشمل شريط الملاحة الخاص بالـ 10 صفحات المخصصة للمعلم
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, CheckSquare, Edit3, PlusCircle, 
  FileText, Headphones, BarChart3, Bell, LogOut, 
  Menu, X, ChevronLeft, ShieldAlert, ArrowRight, MessageSquare
} from 'lucide-react';
import { OfficialLogo } from '../components/OfficialLogo';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';

import { VerifiedUserSession } from '../services/authRoleService';
import { AdminImpersonationBanner } from '../components/AdminImpersonationBanner';
import { subscribeToUnreadCount } from '../services/chatService';
import { getBrandLogoSettings } from '../utils/brandLogoStore';

interface TeacherLayoutProps {
  currentPath: string;
  userSession: VerifiedUserSession;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  currentPath,
  userSession,
  onNavigate,
  onLogout,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    if (!userSession.uid) return;
    const unsub = subscribeToUnreadCount(userSession.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsub();
  }, [userSession.uid]);

  // 1. فحص الحماية: إذا لم يكن مسجلاً، تحويل
  if (!userSession.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#046A38]">تنبيه: يلزم تسجيل الدخول</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            مسار لوحة المعلم <strong>/teacher</strong> محمي ويتطلب صلاحيات المعلم المعتمد لمتابعة الطلاب ورصد التقييمات.
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

  // 2. فحص الصلاحية: حماية المسار (teacher + owner/admin/supervisor)
  const isOwnerOrSupervisor = 
    userSession.role === 'admin' || 
    userSession.role === 'supervisor' || 
    (userSession.email?.toLowerCase() === 'aliazize101@gmail.com');

  const isAuthorizedRole = 
    userSession.role === 'teacher' || 
    isOwnerOrSupervisor ||
    Boolean(userSession.isImpersonating);

  if (!isAuthorizedRole) {
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
            مسار لوحة المعلم <strong>/teacher</strong> محمي ومخصص فقط للمعلمين المعتمدين وإدارة المقرأة (المشرف العام والمالك). دور حسابك الحالي: <strong>{userSession.role === 'student' ? 'طالب' : userSession.role || 'زائر'}</strong>.
          </p>
          <div className="pt-2 space-y-2">
            {userSession.role === 'student' ? (
              <button
                onClick={() => onNavigate('/student')}
                className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
              >
                العودة إلى لوحة الطالب المعتمدة (/student)
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/')}
                className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
              >
                العودة إلى الصفحة الرئيسية
              </button>
            )}

            <PWAInstallButton variant="header" />

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

  // القائمة الموحدة لأقسام لوحة المعلم
  const teacherNavItems = [
    { label: 'الرئيسية', path: '/teacher', icon: BarChart3 },
    { label: 'طلابي', path: '/teacher/students', icon: Users },
    { label: 'حلقاتي', path: '/teacher/halqas', icon: Calendar },
    { label: 'التسميعات', path: '/teacher/recitations', icon: Headphones },
    { label: 'الواجبات', path: '/teacher/assignments', icon: PlusCircle },
    { label: 'التقارير', path: '/teacher/reports', icon: FileText },
    { label: 'محادثات الطلاب', path: '/teacher/messages', icon: MessageSquare },
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
          targetRole="teacher"
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
          <span className="hidden sm:inline text-emerald-100">بوابة المعلم وشيوخ الإقراء المسندين</span>
        </span>
      </div>

      {/* Top Teacher Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleItemClick('/teacher')}
              className="flex items-center gap-2.5 cursor-pointer group transition-transform active:scale-98"
            >
              <OfficialLogo size="md" showText={false} />
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold font-serif text-[#046A38] group-hover:text-emerald-800 transition-colors">بوابة المعلم</h1>
                  <span className="hidden sm:inline-block text-[10px] font-sans font-bold text-[#C5A059] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    إشراف وإقراء
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">{userSession.assignedHalqaTitle || 'حلقات الإقراء والتحفيظ بالسند المتصل'}</p>
              </div>
            </button>

            {currentPath !== '/teacher' && (
              <button
                type="button"
                onClick={() => handleItemClick('/teacher')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#C5A059] group"
                title="الرجوع إلى لوحة المعلم الرئيسية"
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                <span className="hidden sm:inline font-sans">الرئيسية</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-700 bg-[#F9F6F0] px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40 shadow-2xs">
              <span className="text-slate-500">فضيلة الشيخ:</span>
              <strong className="text-slate-900 font-bold">{userSession.name}</strong>
              <span className="text-[10px] text-[#046A38] font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                مجاز معتمد
              </span>
            </span>

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
              aria-label="قائمة المعلم"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Teacher Workspace with Sidebar */}
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
                  معلم مقرأة معتمد بالسند
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            {teacherNavItems.map((item) => {
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
                    {item.path === '/teacher/messages' && unreadCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                        {unreadCount}
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
            {teacherNavItems.map((item) => {
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
                    {item.path === '/teacher/messages' && unreadCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-2xs">
                        {unreadCount}
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

