import React, { useState } from 'react';
import { 
  ArrowRight, LogIn, Eye, EyeOff, ShieldCheck, HelpCircle, 
  Mail, Phone, Lock, User, CheckCircle2, AlertTriangle, 
  Send, Sparkles 
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { AuthAccount, UserRole } from '../types';
import { 
  loginWithEmail, 
  loginWithPhone, 
  registerNewUser, 
  sendResetPassword 
} from '../lib/authService';
import { formatFirebaseAuthError } from '../utils/firebaseAuthErrors';
import { cleanEmail } from '../utils/emailValidation';

const ALL_ROLES: { id: UserRole; label: string; icon: string; desc: string }[] = [
  { id: 'student', label: 'طالب', icon: '📖', desc: 'حفظ وتسميع وحضور الحلقات' },
  { id: 'teacher', label: 'معلم', icon: '👨‍🏫', desc: 'إدارة وتصحيح حلقات التسميع' },
  { id: 'academic_supervisor', label: 'مشرف أكاديمي', icon: '🎓', desc: 'متابعة الحلقات والمناهج' },
  { id: 'parent', label: 'ولي أمر', icon: '👨‍👧‍👦', desc: 'متابعة تقارير وإنجاز الأبناء' },
  { id: 'quality_auditor', label: 'مراجع جودة', icon: '📜', desc: 'تدقيق التلاوات والأداء الإقرائي' },
];

interface UnifiedLoginViewProps {
  initialRole?: UserRole | 'supervisor';
  onLoginSuccess: (account: AuthAccount) => void;
  onBackToHome: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export const UnifiedLoginView: React.FC<UnifiedLoginViewProps> = ({
  initialRole = 'student',
  onLoginSuccess,
  onBackToHome,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(() => {
    if (initialRole === 'system_admin' || (initialRole as any) === 'admin') {
      return 'student';
    }
    return initialRole === 'supervisor' ? 'academic_supervisor' : (initialRole as UserRole);
  });

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [regCountry, setRegCountry] = useState('اليمن');
  const [regTimezone, setRegTimezone] = useState('Asia/Aden');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Password Reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isPhoneResetMode, setIsPhoneResetMode] = useState(false);

  // Status & Errors
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Submit Login Form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cleanId = cleanEmail(loginIdentifier);
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور.');
      setIsSubmitting(false);
      return;
    }

    // Try Firebase Authentication First
    try {
      const isEmail = cleanId.includes('@');
      let result;
      if (isEmail) {
        result = await loginWithEmail(cleanId, cleanPass);
      } else {
        result = await loginWithPhone(cleanId, cleanPass);
      }

      const inferredAcademicId = (result.user as any).academicId || (
        cleanId.toUpperCase().startsWith('RQ-') || cleanId.toUpperCase().startsWith('STU-') 
          ? cleanId.toUpperCase() 
          : undefined
      );

      const acc: AuthAccount = {
        id: result.user.id,
        academicId: inferredAcademicId,
        name: result.user.fullName,
        username: inferredAcademicId || result.user.email.split('@')[0],
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        gender: result.user.gender,
        avatarUrl: result.user.avatarUrl,
        isActive: result.user.isActive,
        emailVerified: result.user.emailVerified,
        registeredAt: result.user.createdAt,
        status: result.user.isActive ? 'approved' : 'rejected'
      };

      onLoginSuccess(acc);
      return;
    } catch (fbErr: any) {
      console.warn('[Firebase Auth Login Notice]:', {
        code: fbErr?.code,
        message: fbErr?.message,
        cleanId
      });
      if (
        fbErr?.message && (
          fbErr.message.includes('غير مسجل') || 
          fbErr.message.includes('كلمة المرور المدخلة غير صحيحة') || 
          fbErr.message.includes('تعطيل هذا الحساب') ||
          fbErr.message.includes('لم يتم اعتماد')
        )
      ) {
        setError(fbErr.message);
      } else {
        const formatted = formatFirebaseAuthError(fbErr);
        setError(formatted);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Registration Form
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim() || !regPhone.trim()) {
      setError('يرجى ملء الاسم الكامل ورقم الهاتف / الواتساب.');
      return;
    }

    if (role !== 'student') {
      setError('التسجيل الذاتي متاح للطلاب فقط؛ تُعتمد الأدوار الأخرى من إدارة المقرأة.');
      return;
    }

    if (regPassword.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    setIsSubmitting(true);

    try {
      const email = regEmail.trim() || `${regPhone.replace(/[^0-9]/g, '')}@rehab-quran.com`;

      const newUser = await registerNewUser(
        {
          fullName: regFullName.trim(),
          email,
          phone: regPhone.trim(),
          role,
          gender: regGender,
          country: regCountry,
          timezone: regTimezone,
          isActive: true,
          notificationPreferences: {
            email: true,
            push: true,
            whatsapp: true,
            halqaReminders: true
          }
        },
        regPassword
      );

      setSuccessNotice('تم إنشاء الحساب بنجاح وتسجيله في سحابة المقرأة.');
      const acc: AuthAccount = {
        id: newUser.id,
        name: newUser.fullName,
        username: email.split('@')[0],
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        gender: newUser.gender,
        registeredAt: newUser.createdAt,
        isActive: true,
        status: 'approved'
      };

      setTimeout(() => {
        onLoginSuccess(acc);
      }, 1000);
    } catch (err: any) {
      console.warn('[Registration notice]:', err?.message || err);
      setError(`فشل التسجيل: ${err?.message || 'يرجى التأكد من البيانات والمحاولة مجدداً.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  // 4. Send Reset Password
  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanEmail(resetIdentifier);
    if (!clean) return;

    if (clean.includes('@')) {
      try {
        await sendResetPassword(clean);
        setIsPhoneResetMode(false);
        setResetMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد ورسائل الترويجات/غير المرغوب فيها.');
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetMessage(null);
        }, 5000);
      } catch (err: any) {
        console.warn('[Firebase Reset Password Notice]:', err?.message || err);
        setResetMessage(formatFirebaseAuthError(err));
      }
    } else {
      // الحساب برقم هاتف فقط: إرشاد الطالب للتواصل عبر واتساب +967714371599
      setIsPhoneResetMode(true);
      setResetMessage('نظراً لتسجيل حسابك برقم الهاتف، يمكنك إعادة تعيين كلمة المرور بسهولة عبر التواصل المباشر مع إدارة المقرأة عبر واتساب على الرقم: +967714371599');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-4 font-sans text-right" dir="rtl">
      <div>
        <div className="bg-white py-6 sm:py-8 px-5 sm:px-8 shadow-xl rounded-3xl border border-[#C5A059]/40 space-y-6">
          {/* Card Title Header */}
          <div className="text-center space-y-1.5 pb-2 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#046A38] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6 text-[#046A38]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
              تسجيل الدخول إلى حسابك
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans">
              أدخل بيانات حسابك المعتمد للدخول إلى حلقات القرآن الكريم
            </p>
          </div>

          {/* Top Switcher: Login vs Register */}
          <div className="flex items-center p-1 bg-[#F9F6F0] rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSwitchToRegister) {
                  onSwitchToRegister();
                } else {
                  setAuthMode('register');
                  setRole('student');
                  setError(null);
                }
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          {authMode === 'login' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs leading-relaxed text-emerald-950 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#046A38] shrink-0" />
              <span>
                تسجيل الدخول متاح بالبيانات المعتمدة في النظام فقط (البريد الإلكتروني أو رقم الهاتف وكلمة المرور)، ويتم التوجيه المباشر تلقائياً حسب صلاحيات الحساب المعتمدة.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#2C3531]">التسجيل الذاتي متاح للطلاب فقط:</label>
              <div className="rounded-2xl border border-[#046A38] bg-emerald-50 p-3 text-right text-[#046A38]">
                <span className="font-bold text-xs">📖 طالب</span>
                <span className="mr-2 text-[10px] text-slate-500">حفظ وتسميع وحضور الحلقات</span>
              </div>
            </div>
          )}

          {/* Notifications / Errors */}
          {error && (
            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#046A38] shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* صندوق مساعدة وإرشادات للطلاب */}
              <div className="rounded-2xl border border-[#C5A059]/35 bg-[#F9F6F0] p-3.5 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-[#046A38]">
                  <HelpCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                  <span>تلميح ومساعدة للطلاب:</span>
                </div>
                <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside pr-1">
                  <li><strong>اسم المستخدم:</strong> هو البريد الإلكتروني أو رقم الهاتف الذي سجلت به في المقرأة.</li>
                  <li><strong>كلمة المرور:</strong> هي كلمة المرور التي اخترتها بنفسك عند تعبئة استمارة التسجيل.</li>
                  <li>في حال نسيت كلمة المرور، يمكنك الضغط على رابط «هل نسيت كلمة المرور؟» لاستعادتها أو التواصل مع الدعم.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3531] mb-1">
                  البريد الإلكتروني أو رقم الهاتف الذي سجلت به:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(cleanEmail(e.target.value))}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (text) {
                        e.preventDefault();
                        setLoginIdentifier(cleanEmail(text));
                      }
                    }}
                    onBlur={() => setLoginIdentifier((prev) => cleanEmail(prev))}
                    placeholder="مثال: 967714371599 أو student@example.com"
                    className="w-full pl-3 pr-10 py-2.5 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] bg-slate-50/50"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#2C3531]">
                    كلمة المرور التي اخترتها عند التسجيل:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetModalOpen(true);
                      setResetIdentifier(loginIdentifier.trim());
                      setResetMessage(null);
                      setIsPhoneResetMode(!loginIdentifier.includes('@') && loginIdentifier.trim().length > 0);
                    }}
                    className="text-xs text-[#046A38] font-bold hover:underline cursor-pointer"
                  >
                    هل نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] bg-slate-50/50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#046A38] hover:bg-[#03582e] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جارٍ تسجيل الدخول والتحقق...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول إلى حسابك</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= REGISTER FORM ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">
                    الاسم الكامل:
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="الاسم الرباعي أو الثلاثي"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">
                    رقم الهاتف / الواتساب:
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="مثال: +967 714 371 599"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3531] mb-1">
                  البريد الإلكتروني (اختياري، يولد تلقائياً من الهاتف إن لم يتوفر):
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(cleanEmail(e.target.value))}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text) {
                      e.preventDefault();
                      setRegEmail(cleanEmail(text));
                    }
                  }}
                  onBlur={() => setRegEmail((prev) => cleanEmail(prev))}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">الجنس:</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as 'male' | 'female')}
                    className="w-full py-2 px-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white cursor-pointer"
                  >
                    <option value="male">ذكر (طلاب / معلمون)</option>
                    <option value="female">أنثى (طالبات / معلمات)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">الدولة:</label>
                  <input
                    type="text"
                    value={regCountry}
                    onChange={(e) => setRegCountry(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">المنطقة الزمنية:</label>
                  <input
                    type="text"
                    value={regTimezone}
                    onChange={(e) => setRegTimezone(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">
                    كلمة المرور:
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C3531] mb-1">
                    تأكيد كلمة المرور:
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#C5A059] hover:bg-[#b58f48] text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جارٍ إنشاء الحساب ورصد الصلاحيات...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>إتمام التسجيل وإنشاء الحساب في فايرستور</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back Button */}
          <div className="pt-2 border-t border-slate-100 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#046A38] flex items-center gap-1.5 cursor-pointer py-1"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى الصفحة الرئيسية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-3.5 text-right animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">استعادة كلمة المرور</h3>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              أدخل البريد الإلكتروني أو رقم الهاتف الذي سجلت به في المقرأة:
            </p>

            <form onSubmit={handleSendReset} className="space-y-3">
              <input
                type="text"
                required
                value={resetIdentifier}
                onChange={(e) => {
                  setResetIdentifier(e.target.value);
                  setResetMessage(null);
                  setIsPhoneResetMode(false);
                }}
                placeholder="name@example.com أو 967714371599"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                dir="ltr"
              />

              {resetMessage && (
                <div className={`p-2.5 rounded-xl text-[11px] font-bold border leading-relaxed ${
                  isPhoneResetMode 
                    ? 'bg-amber-50 text-amber-900 border-amber-300' 
                    : resetMessage.includes('تم إرسال') 
                      ? 'bg-emerald-50 text-[#046A38] border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {resetMessage}
                </div>
              )}

              {isPhoneResetMode && (
                <a
                  href={`https://wa.me/967714371599?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأنا الطالب المسجل برقم الهاتف (${resetIdentifier.trim() || 'الخاص بي'}) في مقرأة رحاب القرآن، وأرغب في استعادة أو تعيين كلمة المرور لحسابي.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تواصل عبر واتساب (+967714371599)</span>
                </a>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#046A38] hover:bg-[#03582e] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  استعادة كلمة المرور
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLoginView;
