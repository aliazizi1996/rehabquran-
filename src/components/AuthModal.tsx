import React, { useState } from 'react';
import { 
  X, LogIn, UserCheck, Shield, Phone, Key, User,
  CheckCircle2, AlertCircle, Sparkles, LogOut, ArrowRight,
  Copy, Check, Share2, Lock, Eye, EyeOff
} from 'lucide-react';
import { AuthAccount } from '../types';
import { 
  authenticateUser,
  registerNewAccount,
  getCurrentAuthUser,
  logoutUser
} from '../data/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (account: AuthAccount) => void;
  currentUser: AuthAccount;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regSection, setRegSection] = useState<'male' | 'female'>('male');

  // Registration confirmation / receipt card
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

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('يرجى إدخال اسم المستخدم أو رقم الهاتف المسجل.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('يرجى إدخال كلمة المرور الخاصة بك.');
      return;
    }

    const result = authenticateUser(identifier, password);
    if (result.success && result.account) {
      setSuccessMessage(result.message);
      setTimeout(() => {
        onAuthSuccess(result.account!);
        onClose();
      }, 700);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regPhone.trim() || !regUsername.trim()) {
      setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة (الاسم، الهاتف، اسم المستخدم).');
      return;
    }

    if (!regPassword || regPassword.length < 3) {
      setErrorMessage('يرجى كتابة كلمة مرور لا تقل عن 3 خانات.');
      return;
    }

    const result = registerNewAccount({
      name: regName,
      phone: regPhone,
      username: regUsername,
      password: regPassword,
      role: regRole,
      section: regSection,
    });

    if (result.success && result.account) {
      const creds = {
        name: result.account.name,
        username: result.account.username,
        phone: result.account.phone,
        password: regPassword,
        role: regRole,
        roleLabel: regRole === 'teacher' ? 'معلم / معلّمة مقرأة' : 'طالب / طالبة مقرأة',
        section: regSection,
        sectionLabel: regSection === 'male' ? 'قسم الطلاب (بنين)' : 'قسم الطالبات (أخوات)',
      };
      setCreatedCredentials(creds);
      onAuthSuccess(result.account);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `بيانات حسابي في مقرأة رحاب القرآن الكريم 📖
• الاسم: ${createdCredentials.name}
• الصفة: ${createdCredentials.roleLabel} (${createdCredentials.sectionLabel})
• اسم المستخدم: ${createdCredentials.username}
• رقم الهاتف: ${createdCredentials.phone}
• كلمة المرور: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!createdCredentials) return;
    const msg = `*بيانات حسابي في مقرأة رحاب القرآن الكريم* 📖\n• *الاسم:* ${createdCredentials.name}\n• *الصفة:* ${createdCredentials.roleLabel} (${createdCredentials.sectionLabel})\n• *اسم المستخدم:* ${createdCredentials.username}\n• *رقم الهاتف:* ${createdCredentials.phone}\n• *كلمة المرور:* ${createdCredentials.password}\nمقرأة رحاب القرآن الإلكترونية`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLogout = () => {
    logoutUser();
    const guest = getCurrentAuthUser();
    onAuthSuccess(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#091a12] border-2 border-emerald-600/70 p-6 sm:p-8 shadow-2xl text-right my-8">
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-slate-300 hover:text-white border border-emerald-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-serif">
            بوابة الدخول وإنشاء الحساب
          </h2>
          <p className="text-xs text-emerald-300 mt-1">
            تسجيل حساب جديد أو تسجيل الدخول للطلاب والمعلمين مع تسليم بيانات الحساب وكلمة المرور
          </p>
        </div>

        {/* Current logged in status badge */}
        <div className="mb-6 p-3 rounded-2xl bg-[#0e271c] border border-emerald-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <span className="text-[10px] text-slate-300 block">الحساب النشط حالياً:</span>
              <span className="text-xs font-bold text-white block">{currentUser.name}</span>
              <span className="text-[10px] text-amber-400 font-semibold">{currentUser.titleBadge || currentUser.role}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-700 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل خروج</span>
          </button>
        </div>

        {/* Post-Registration Credentials Banner */}
        {createdCredentials && (
          <div className="mb-6 p-4 rounded-2xl bg-[#04100a] border-2 border-amber-400 shadow-xl animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-black text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                تم إنشاء حسابك بنجاح!
              </span>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-emerald-950"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#081811] border border-emerald-800/80">
              <div>
                <span className="text-slate-400 block text-[10px]">الاسم:</span>
                <span className="text-white font-bold block">{createdCredentials.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">الصفة والقسم:</span>
                <span className="text-amber-300 font-bold block">{createdCredentials.roleLabel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">اسم المستخدم:</span>
                <span className="text-white font-mono font-bold block">{createdCredentials.username}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
                <span className="text-emerald-300 font-mono font-bold block">{createdCredentials.phone}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-emerald-900/60 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 block text-[10px] font-bold">كلمة المرور:</span>
                  <span className="text-white font-mono font-black text-sm">{createdCredentials.password}</span>
                </div>
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'تم النسخ!' : 'نسخ البيانات'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>إرسال لواتساب</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-[#06150e] p-1.5 rounded-2xl border border-emerald-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل الدخول (Login)
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إنشاء حساب جديد (Sign Up)
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">
                اسم المستخدم أو رقم الهاتف المسجل:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="اسم المستخدم أو رقم الهاتف"
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10"
                />
                <User className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور (الافتراضية: 123)"
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10 pl-10"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/70 cursor-pointer transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول للمقرأة</span>
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">
                الاسم الثلاثي أو الرباعي:
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="أدخل الاسم الكريم"
                className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">
                  رقم الهاتف (الواتساب):
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="9677xxxxxxxx"
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">
                  اسم المستخدم للدخول:
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="user_name"
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">
                  نوع الحساب والدور:
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="student">طالب / طالبة مقرأة</option>
                  <option value="teacher">معلم / معلّمة مقرأة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-1">
                  القسم:
                </label>
                <select
                  value={regSection}
                  onChange={(e) => setRegSection(e.target.value as any)}
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="male">قسم الطلاب (بنين)</option>
                  <option value="female">قسم الطالبات (أخوات)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-1">
                كلمة المرور للدخول:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="أنشئ كلمة مرور لحسابك"
                  className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-10 pl-10"
                />
                <Key className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>إنشاء الحساب واستلام كلمة المرور</span>
            </button>
          </form>
        )}

        <p className="mt-6 pt-5 border-t border-emerald-800/80 text-[11px] text-slate-400">
          لا تتوفر حسابات تجريبية أو دخول سريع؛ يجب التحقق من الحساب عبر Firebase Auth.
        </p>

      </div>
    </div>
  );
};
