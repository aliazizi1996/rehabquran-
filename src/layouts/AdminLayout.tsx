/**
 * AdminLayout - التخطيط الرسمي لمسارات لوحة الإدارة (/admin/*)
 * مقرأة رحاب القرآن الإلكترونية
 * محمية بالكامل: تمنع الطلاب والمعلمين والزوار من دخول إدارة النظام (403 Forbidden)
 * تشمل شريط الملاحة الخاص بالـ 11 صفحة المخصصة للإدارة
 */

import React, { useState } from 'react';
import { 
  BarChart3, Users, GraduationCap, BookOpen, Layers, 
  Award, CreditCard, AlertTriangle, ShieldCheck, Settings, 
  LogOut, Menu, X, ChevronLeft, ShieldAlert, ArrowRight, Sliders, Palette,
  UserPlus, Plus, Video, ExternalLink, Sparkles
} from 'lucide-react';
import { OfficialLogo } from '../components/OfficialLogo';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { VerifiedUserSession } from '../services/authRoleService';
import { AddUserAccountModal } from '../components/AddUserAccountModal';
import { GoogleMeetManagerModal } from '../components/GoogleMeetManagerModal';

const ManualLogoEditorModal = React.lazy(() => 
  import('../components/ManualLogoEditorModal').then(m => ({ default: m.ManualLogoEditorModal }))
);

interface AdminLayoutProps {
  currentPath: string;
  userSession: VerifiedUserSession;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentPath,
  userSession,
  onNavigate,
  onLogout,
  children
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBrandEditorOpen, setIsBrandEditorOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isGoogleMeetModalOpen, setIsGoogleMeetModalOpen] = useState(false);
  const [addUserRole, setAddUserRole] = useState<'student' | 'teacher'>('student');

  // 1. فحص الحماية: إذا لم يكن مسجلاً، تحويل
  if (!userSession.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#046A38]">تنبيه: يلزم تسجيل الدخول الإداري</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            مسار لوحة الإدارة <strong>/admin</strong> محمي ويتطلب صلاحيات المشرف العام أو مدير النظام المعتمد.
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

  // إذا كان المستخدم مشرفاً رئيسياً في وضع المعاينة المؤقتة، يتم إنهاء المعاينة والعودة فوراً للوحة الإدارة
  if ((userSession.actualRole === 'admin' || userSession.actualRole === 'supervisor' || userSession.isImpersonating) && userSession.role !== 'admin' && userSession.role !== 'supervisor') {
    import('../services/authRoleService').then(m => m.stopAdminImpersonation()).then(() => {
      onNavigate(currentPath || '/admin');
    });
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-4 font-sans text-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-[#046A38] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-600 font-bold">جاري إنهاء المعاينة والعودة إلى لوحة المشرف...</p>
      </div>
    );
  }

  // 2. فحص الصلاحية: الطلاب والمعلمون غير مصرح لهم بالدخول للوحة الإدارة
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
              onClick={() => onNavigate(isStudent ? '/student' : '/teacher')}
              className="w-full py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
            >
              العودة إلى لوحتك المعتمدة ({isStudent ? '/student' : '/teacher'})
            </button>
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

  const adminNavItems = [
    { label: 'لوحة الإحصاءات', path: '/admin', icon: BarChart3 },
    { label: 'إدارة المستخدمين', path: '/admin/users', icon: Users },
    { label: 'إدارة المعلمين', path: '/admin/teachers', icon: GraduationCap },
    { label: 'إدارة الطلاب', path: '/admin/students', icon: Users },
    { label: 'إدارة الحلقات', path: '/admin/halqas', icon: Layers },
    { label: 'إدارة الخطط', path: '/admin/plans', icon: BookOpen },
    { label: 'إدارة المحتوى', path: '/admin/content', icon: BookOpen },
    { label: 'إدارة وتعديل الشهادات', path: '/admin/certificates', icon: Award },
    { label: 'محرر الشهادات التفاعلي', path: '/admin/certificate-editor', icon: Sparkles },
    { label: 'الهوية البصرية', path: '/admin/brand', icon: Palette },
    { label: 'إدارة الاشتراكات', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'إدارة البلاغات', path: '/admin/complaints', icon: AlertTriangle },
    { label: 'سجل العمليات Audit Log', path: '/admin/audit-logs', icon: ShieldCheck },
  ];

  const handleItemClick = (path: string) => {
    setIsSidebarOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] via-white to-[#F9F6F0] text-[#2C3531] font-sans text-right flex flex-col" dir="rtl">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleItemClick('/admin')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <OfficialLogo size="md" showText={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold font-serif text-[#046A38]">لوحة الإدارة والمشرف العام</h1>
                  <span className="text-[10px] font-bold bg-[#C5A059]/20 text-[#046A38] px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                    صلاحيات كاملة
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">منظومة الإدارة والمتابعة المركزية</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/admin/certificate-editor')}
              className="px-3.5 py-1.5 bg-[#046A38] hover:bg-[#057a40] text-[#f7e8c6] rounded-xl text-xs font-bold border border-[#C5A059] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="محرر الشهادات التفاعلي، رفع التصميمات، الأختام، والتوقيعات"
            >
              <Award className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">محرر وتعديل الشهادات</span>
              <span className="sm:hidden">محرر الشهادات</span>
            </button>

            <span className="hidden md:inline-block text-xs text-slate-600 bg-[#F9F6F0] px-3 py-1.5 rounded-xl border border-slate-200">
              المسؤول: <strong>{userSession.name}</strong>
            </span>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-600 rounded-xl transition-all cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {/* زر فتح قاعات Google Meet السريع */}
            <button
              type="button"
              onClick={() => setIsGoogleMeetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#046A38] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="إنشاء وإدارة قاعات Google Meet الرسمية"
            >
              <Video className="w-4 h-4 text-[#046A38]" />
              <span className="hidden sm:inline">Google Meet</span>
            </button>

            {/* زر الخطوط الثلاثة (القائمة الإدارية) - متاح دائماً على كافة الشاشات */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isSidebarOpen
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'bg-[#F9F6F0] text-[#046A38] border-[#C5A059] hover:bg-[#C5A059]/20'
              }`}
              title="فتح القائمة الإدارية الشاملة (الخطوط الثلاثة ☰)"
              aria-label="القائمة الإدارية"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5 text-[#046A38]" />}
              <span className="font-serif font-bold text-xs">القائمة الإدارية</span>
            </button>
          </div>
        </div>
      </header>

      {/* القائمة الإدارية الشاملة المنبثقة عند الضغط على الخطوط */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-start p-3 sm:p-6 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="bg-white max-w-2xl w-full mx-auto rounded-3xl border-2 border-[#C5A059] shadow-2xl overflow-hidden mt-14 max-h-[85vh] flex flex-col text-right animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header of the Dropdown Menu */}
            <div className="bg-[#F9F6F0] p-4 border-b border-[#C5A059]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#046A38] text-white flex items-center justify-center font-bold shadow-xs">
                  <Menu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-[#046A38]">القائمة الإدارية الشاملة</h3>
                  <span className="text-xs text-slate-500">اختر القسم المطلوب للانتقال الفوري</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* خيارات الإضافة اليدوية في القائمة الإدارية */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 via-[#F9F6F0] to-amber-50/70 border-b border-[#C5A059]/30 space-y-2">
              <span className="text-[11px] font-bold text-[#046A38] block font-serif">
                ✨ خيارات الإضافة والخدمات السريعة:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddUserRole('student');
                    setIsAddUserModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-300 hover:border-[#046A38] hover:bg-emerald-50 text-[#046A38] font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#046A38] flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <span>إضافة طالب يدويًا</span>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddUserRole('teacher');
                    setIsAddUserModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#C5A059] hover:border-[#046A38] hover:bg-amber-50 text-amber-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#046A38] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span>إضافة معلم يدويًا</span>
                  </div>
                  <Plus className="w-4 h-4 text-[#C5A059]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleMeetModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#046A38] text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-[#03542c] transition-all cursor-pointer border border-[#C5A059]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center">
                      <Video className="w-4 h-4 text-amber-300" />
                    </div>
                    <span>إنشاء وإدارة قاعة Google Meet رسمية للحلقات</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-100" />
                </button>
              </div>
            </div>

            {/* Grid of All 12 Navigation Items */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleItemClick(item.path)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#046A38] text-white border-[#046A38] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#C5A059] hover:bg-[#F9F6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-[#046A38]'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-serif text-xs sm:text-sm">{item.label}</span>
                    </div>
                    <ChevronLeft className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>

            {/* Footer of Menu */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 text-[11px] font-bold">المسؤول: {userSession.name}</span>
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  onLogout();
                }}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Workspace with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-1">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#046A38] text-white flex items-center justify-center font-bold font-serif text-sm">
                م
              </div>
              <div className="overflow-hidden">
                <span className="block font-bold text-xs text-slate-900 truncate">{userSession.name}</span>
                <span className="block text-[11px] text-[#C5A059] font-bold truncate">إدارة النظام المركزية</span>
              </div>
            </div>
          </div>

          {/* أزرار الإضافة اليدوية في القائمة الجانبية للمشرف */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs mb-3 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 block px-1">إضافة يدوية سريعة</span>
            <button
              type="button"
              onClick={() => {
                setAddUserRole('student');
                setIsAddUserModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5 text-[#046A38]" />
                <span>إضافة طالب يدويًا</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAddUserRole('teacher');
                setIsAddUserModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#046A38]" />
                <span>إضافة معلم يدويًا</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
            </button>
          </div>

          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            {adminNavItems.map((item) => {
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
                  </div>
                  <ChevronLeft className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Child Content */}
        <section className="flex-1 min-w-0">
          {children}
        </section>
      </div>

      {/* Manual Brand, Certificate & Seal Customizer Modal */}
      {isBrandEditorOpen && (
        <React.Suspense fallback={null}>
          <ManualLogoEditorModal
            isOpen={isBrandEditorOpen}
            onClose={() => setIsBrandEditorOpen(false)}
          />
        </React.Suspense>
      )}

      {/* نافذة إضافة حساب طالب أو معلم يدويًا للمشرف العام */}
      <AddUserAccountModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        initialRole={addUserRole}
        initialSection="male"
        onAccountCreated={(account) => {
          window.dispatchEvent(new CustomEvent('rehab_admin_data_refresh', { detail: account }));
        }}
      />

      {/* نافذة إدارة Google Meet للمشرف العام */}
      <GoogleMeetManagerModal
        isOpen={isGoogleMeetModalOpen}
        onClose={() => setIsGoogleMeetModalOpen(false)}
      />
    </div>
  );
};
