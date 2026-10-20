import React, { useState } from 'react';
import { 
  LogIn, UserCheck, Shield, Phone, Key, User, 
  CheckCircle2, AlertCircle, Sparkles, Copy, Check, 
  Share2, Eye, EyeOff, BookOpen, GraduationCap, Users, 
  ArrowRight, MessageCircle, Info, Lock
} from 'lucide-react';
import { AuthAccount } from '../types';
import { authenticateUser, registerNewAccount, getAllAccounts, getCurrentAuthUser, logoutUser } from '../data/authStore';

interface AuthViewProps {
  currentUser: AuthAccount;
  onAuthSuccess: (account: AuthAccount) => void;
  onNavigateHome: () => void;
  onOpenWelcomeScreen?: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({
  currentUser,
  onAuthSuccess,
  onNavigateHome,
  onOpenWelcomeScreen,
  initialMode = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Sign Up / Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regSection, setRegSection] = useState<'male' | 'female'>('male');
  const [regMemorization, setRegMemorization] = useState('5 أجزاء');
  const [regError, setRegError] = useState<string | null>(null);

  // Post-Registration Credentials Card Modal / Box
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    phone: string;
    password: string;
    role: 'student' | 'teacher';
    roleLabel: string;
    section: 'male' | 'female';
    sectionLabel: string;
  } | null>(null);

  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginIdentifier.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم أو رقم الهاتف المسجل.');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('يرجى إدخال كلمة المرور الخاصة بك.');
      return;
    }

    const res = authenticateUser(loginIdentifier, loginPassword);
    if (res.success && res.account) {
      setLoginSuccess(res.message);
      setTimeout(() => {
        onAuthSuccess(res.account!);
        onNavigateHome();
      }, 700);
    } else {
      setLoginError(res.message);
    }
  };

  // Handle Sign Up
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('يرجى كتابة الاسم الثلاثي أو الرباعي الكريم.');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('يرجى إدخال رقم الهاتف أو الواتساب للتواصل وتأكيد الحساب.');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('يرجى اختيار اسم مستخدم للدخول.');
      return;
    }
    if (!regPassword || regPassword.length < 3) {
      setRegError('يرجى اختيار كلمة مرور قوية (لا تقل عن 3 أحرف/أرقام).');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
      return;
    }

    const res = registerNewAccount({
      name: regName.trim(),
      phone: regPhone.trim(),
      username: regUsername.trim(),
      password: regPassword,
      role: regRole,
      section: regSection,
      memorization: regMemorization,
    });

    if (res.success && res.account) {
      const creds = {
        name: res.account.name,
        username: res.account.username,
        phone: res.account.phone,
        password: regPassword,
        role: regRole,
        roleLabel: regRole === 'teacher' ? 'معلم / معلّمة مقرأة' : 'طالب / طالبة مقرأة',
        section: regSection,
        sectionLabel: regSection === 'male' ? 'قسم الطلاب (بنين)' : 'قسم الطالبات (أخوات)',
      };
      setCreatedCredentials(creds);
      onAuthSuccess(res.account);
    } else {
      setRegError(res.message);
    }
  };

  // Copy credentials
  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `بيانات حسابي في مقرأة رحاب القرآن الإلكترونية 📖
━━━━━━━━━━━━━━━━━━━━
• الاسم: ${createdCredentials.name}
• الصفة والدور: ${createdCredentials.roleLabel}
• القسم: ${createdCredentials.sectionLabel}
• اسم المستخدم: ${createdCredentials.username}
• رقم الهاتف: ${createdCredentials.phone}
• كلمة المرور: ${createdCredentials.password}
━━━━━━━━━━━━━━━━━━━━
يرجى الاحتفاظ بهذه البيانات لتسجيل الدخول بأمان.`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Share credentials via WhatsApp
  const handleShareWhatsApp = () => {
    if (!createdCredentials) return;
    const msg = `*بيانات حسابي في مقرأة رحاب القرآن الإلكترونية* 📖
━━━━━━━━━━━━━━━━━━━━
• *الاسم:* ${createdCredentials.name}
• *الصفة:* ${createdCredentials.roleLabel} (${createdCredentials.sectionLabel})
• *اسم المستخدم:* ${createdCredentials.username}
• *رقم الهاتف:* ${createdCredentials.phone}
• *كلمة المرور:* ${createdCredentials.password}
━━━━━━━━━━━━━━━━━━━━
مقرأة رحاب القرآن الإلكترونية - نحو إتقان كتاب الله تعالى`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-4 py-6 text-right" dir="rtl">
      {/* Top Breadcrumb & Identity Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif flex items-center gap-2">
              <span>بوابة الدخول وإنشاء الحساب</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans">
                الطلاب والمعلمون
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-300/80 mt-0.5">
              نظام التسجيل والدخول الموحد لمقرأة رحاب القرآن الإلكترونية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onOpenWelcomeScreen && (
            <button
              type="button"
              onClick={onOpenWelcomeScreen}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/70 text-amber-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>الشاشة الترحيبية</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateHome}
            className="px-3.5 py-1.5 rounded-xl bg-[#092216] hover:bg-[#0e2f1f] border border-emerald-700/70 text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>العودة للحلقات الرئيسية</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Active User Status Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#0d271c] to-[#091b13] border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">الحساب النشط حالياً:</span>
              <span className="text-sm font-bold text-white">{currentUser.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-300 mt-0.5">
              <span className="font-semibold">{currentUser.titleBadge || (currentUser.role === 'teacher' ? 'معلم مقرأة' : 'طالب مقرأة')}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-mono text-[11px]">{currentUser.phone || currentUser.username}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              logoutUser();
              const guest = getCurrentAuthUser();
              onAuthSuccess(guest);
            }}
            className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 text-xs font-bold transition-colors cursor-pointer"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Success Credentials Card Pop-up/Alert after Registration */}
      {createdCredentials && (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0a271a] to-[#06170f] border-2 border-amber-400 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-300 font-serif">
                  تم إنشاء حسابك بنجاح في المقرأة! 🎉
                </h3>
                <p className="text-xs text-slate-300">
                  تم تجهيز وحفظ بيانات حسابك لتنظيم الدخول بشكل آمن
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCreatedCredentials(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 cursor-pointer"
            >
              إغلاق الإشعار ✕
            </button>
          </div>

          {/* Credentials Display Grid */}
          <div className="p-4 rounded-2xl bg-[#04100a] border border-amber-500/40 space-y-3 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0a1e14] border border-emerald-800/80">
                <span className="text-slate-400 block text-[11px]">الاسم الكامل:</span>
                <span className="text-white font-bold text-sm block mt-0.5">{createdCredentials.name}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a1e14] border border-emerald-800/80">
                <span className="text-slate-400 block text-[11px]">الصفة والقسم:</span>
                <span className="text-amber-300 font-bold block mt-0.5">
                  {createdCredentials.roleLabel} • {createdCredentials.sectionLabel}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a1e14] border border-emerald-800/80">
                <span className="text-slate-400 block text-[11px]">اسم المستخدم للدخول:</span>
                <span className="text-white font-mono font-bold text-sm block mt-0.5">{createdCredentials.username}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a1e14] border border-emerald-800/80">
                <span className="text-slate-400 block text-[11px]">رقم الهاتف / الواتساب:</span>
                <span className="text-emerald-300 font-mono font-bold text-sm block mt-0.5">{createdCredentials.phone}</span>
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/50 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 block text-[11px] font-bold">كلمة المرور الخاصة بك:</span>
                  <span className="text-white font-mono font-black text-base tracking-wider block mt-0.5">
                    {createdCredentials.password}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-200">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">محفوظة بأمان في حسابك</span>
                </div>
              </div>
            </div>

            {/* Action buttons: Copy & WhatsApp Share */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'تم نسخ البيانات بنجاح!' : 'نسخ بيانات الحساب'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>إرسال أو حفظ عبر الواتساب</span>
              </button>

              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#092216] hover:bg-[#0f3523] border border-emerald-700 text-emerald-200 text-xs font-bold transition-all cursor-pointer"
              >
                الدخول مباشرة إلى الحلقات القرآنية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <div className="bg-[#091a12] border-2 border-emerald-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl">
        {/* Navigation Tabs: Login vs Register */}
        <div className="grid grid-cols-2 gap-2 mb-8 bg-[#05130d] p-1.5 rounded-2xl border border-emerald-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border border-emerald-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول (Login)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border border-emerald-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>إنشاء حساب جديد (Sign Up)</span>
          </button>
        </div>

        {/* TAB 1: LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 max-w-xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-black text-white font-serif">تسجيل الدخول إلى حسابك</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أدخل اسم المستخدم أو رقم الهاتف المسجل للدخول لحلقتك ومتابعة وردك
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم أو رقم الهاتف المسجل:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="مثال: ali_azize أو 967713801916"
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10"
                />
                <User className="w-4 h-4 text-emerald-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  كلمة المرور:
                </label>
                <span className="text-[11px] text-slate-500">
                  (كلمة المرور الافتراضية لجميع الحسابات التجريبية: 123)
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10 pl-10"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute right-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 cursor-pointer transition-all active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول للمقرأة</span>
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-400">ليس لديك حساب بعد؟ </span>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                إنشاء حساب جديد الآن مجاناً
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SIGN UP / REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 max-w-xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-lg font-black text-white font-serif">إنشاء حساب جديد للطلاب والمعلمين</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                سجّل بياناتك لتنضم لحلقات المقرأة وتستلم تفاصيل حسابك وكلمة المرور
              </p>
            </div>

            {regError && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {/* Role Selection (Student vs Teacher) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                اختر نوع التسجيل (الدور في المقرأة):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegRole('student')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    regRole === 'student'
                      ? 'bg-emerald-950/80 border-amber-400 shadow-md'
                      : 'bg-[#05130d] border-emerald-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>طالب / طالبة</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    للانضمام للحلقات وحفظ وتسميع القرآن
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('teacher')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    regRole === 'teacher'
                      ? 'bg-amber-950/40 border-amber-400 shadow-md'
                      : 'bg-[#05130d] border-emerald-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-white">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>معلم / معلّمة</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    لإدارة الحلقات والتقييم ورصد الحضور
                  </span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الاسم الثلاثي أو الرباعي:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="أدخل اسمك الكريم"
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10"
                />
                <User className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Section and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  القسم:
                </label>
                <select
                  value={regSection}
                  onChange={(e) => setRegSection(e.target.value as 'male' | 'female')}
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="male">قسم الطلاب (بنين)</option>
                  <option value="female">قسم الطالبات (أخوات)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الهاتف (الواتساب):
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="مثال: 967713801916"
                    className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono pr-10"
                  />
                  <Phone className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            {/* Username & Memorization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم المستخدم (Username):
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="مثال: ahmed_quran"
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  مقدار الحفظ الحالي:
                </label>
                <select
                  value={regMemorization}
                  onChange={(e) => setRegMemorization(e.target.value)}
                  className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="مبتدئ (جزء عم فقط)">مبتدئ (جزء عم فقط)</option>
                  <option value="3 أجزاء">3 أجزاء</option>
                  <option value="5 أجزاء">5 أجزاء</option>
                  <option value="10 أجزاء">10 أجزاء</option>
                  <option value="15 جزءاً">15 جزءاً</option>
                  <option value="20 جزءاً">20 جزءاً</option>
                  <option value="خاتم لكتاب الله كاملاً">خاتم لكتاب الله كاملاً (مسار الإتقان والإجازة)</option>
                </select>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="أنشئ كلمة مرور"
                    className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <Key className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأكيد كلمة المرور:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <Key className="w-3.5 h-3.5 text-emerald-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#05130d] border border-emerald-800/80 flex items-start gap-2 text-xs text-slate-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                فور إتمام إنشاء الحساب، سيتم إظهار بطاقة اعتماد حسابك مع خيار نسخها أو إرسالها وحفظها عبر الواتساب لتنظيم الدخول بشكل دائم.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
            >
              <UserCheck className="w-4 h-4" />
              <span>إنشاء الحساب واستلام بيانات الدخول</span>
            </button>
          </form>
        )}

        <p className="mt-8 pt-6 border-t border-emerald-800/80 text-xs text-slate-400">
          لا توجد حسابات دخول سريعة. يتم التحقق من بيانات الحساب عبر Firebase Auth.
        </p>
      </div>
    </div>
  );
};
