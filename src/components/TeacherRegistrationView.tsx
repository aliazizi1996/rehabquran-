/**
 * صفحة تسجيل المعلم والمقرئ (/register/teacher)
 * مقرأة رحاب القرآن الإلكترونية - الإصدار المعتمد 2026
 *
 * الحقول المطلوبة:
 * - الاسم الكامل
 * - رقم الواتساب
 * - البريد الإلكتروني
 * - كلمة المرور (يختارها بنفسه)
 * - المؤهلات العلمية (الإجازات، السند المتصل، سنوات الخبرة)
 * - التخصص (حفظ / تجويد / تصحيح تلاوة / إجازة)
 * - نبذة تعريفية (اختياري)
 *
 * عند الإرسال:
 * - إنشاء حساب Firebase Auth بالبريد وكلمة المرور.
 * - حفظ في Firestore مجموعة teachers مع status: "pending".
 * - عرض رسالة: "تم استلام طلبك، سيتم مراجعته".
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Send, 
  CheckCircle2, 
  Award, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  ArrowRight,
  Sparkles,
  Check,
  FileText,
  UserCheck
} from 'lucide-react';
import { COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';
import { submitTeacherApplicationToFirestore } from '../services/teacherApplicationService';
import { cleanEmail, isValidEmail } from '../utils/emailValidation';

interface TeacherRegistrationViewProps {
  onBackToHome?: () => void;
  onSwitchToLogin?: () => void;
}

export const TeacherRegistrationView: React.FC<TeacherRegistrationViewProps> = ({
  onBackToHome,
  onSwitchToLogin,
}) => {
  const WHATSAPP_MAIN = '967714371599';
  const WHATSAPP_DISPLAY = '+967 714 371 599';

  // State: الحقول المطلوبة
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('967'); // رمز الدولة (اليمن +967 افتراضياً)
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // المؤهلات العلمية (الإجازات، السند المتصل، سنوات الخبرة)
  const [ijazat, setIjazat] = useState('');
  const [qiraatList, setQiraatList] = useState<string[]>(['حفص عن عاصم']);
  const [hasConnectedSanad, setHasConnectedSanad] = useState(true);
  const [sanadDetails, setSanadDetails] = useState('');
  const [experienceYears, setExperienceYears] = useState('3-5');
  const [experienceDetails, setExperienceDetails] = useState('');

  // التخصص (حفظ / تجويد / تصحيح تلاوة / إجازة)
  const specialtyOptions = [
    'حفظ',
    'تجويد',
    'تصحيح تلاوة',
    'إجازة',
  ];
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['حفظ', 'تجويد']);
  const [customSpecialty, setCustomSpecialty] = useState('');

  // نبذة تعريفية (اختياري)
  const [bio, setBio] = useState('');

  // قسم التدريس والأوقات المفضلة
  const [targetDepartment, setTargetDepartment] = useState<'male' | 'female' | 'both'>('male');
  const [preferredTimes, setPreferredTimes] = useState('');

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [registeredTeacherName, setRegisteredTeacherName] = useState('');

  // الروايات الشائعة للاختيار السريع
  const commonQiraat = [
    'حفص عن عاصم',
    'شعبة عن عاصم',
    'ورش عن نافع',
    'قالون عن نافع',
    'الدوري عن أبي عمرو',
    'السوسي عن أبي عمرو',
    'ابن كثير بروايتيه',
    'القراءات السبع',
    'القراءات العشر الصغرى',
    'القراءات العشر الكبرى',
  ];

  const toggleQiraah = (item: string) => {
    if (qiraatList.includes(item)) {
      setQiraatList(qiraatList.filter((q) => q !== item));
    } else {
      setQiraatList([...qiraatList, item]);
    }
  };

  const toggleSpecialty = (item: string) => {
    if (selectedSpecialties.includes(item)) {
      if (selectedSpecialties.length === 1) return; // إبقاء تخصص واحد على الأقل
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // تحقق من صحة الحقول الإلزامية
    if (!fullName.trim()) {
      setValidationError('يرجى إدخال الاسم الكامل رباعياً.');
      return;
    }
    if (!whatsapp.trim()) {
      setValidationError('يرجى إدخال رقم الواتساب للتواصل وتلقي تعليمات القبول.');
      return;
    }
    // تنظيف البريد الإلكتروني من أي مسافات أو رموز غير مرئية (علامات الاتجاه العربية RTL/LTR)
    const sanitizedEmail = cleanEmail(email);
    if (!isValidEmail(sanitizedEmail)) {
      setValidationError('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('يرجى كتابة كلمة مرور تتكون من 6 خانات أو أكثر.');
      return;
    }
    if (!ijazat.trim() && qiraatList.length === 0) {
      setValidationError('يرجى توضيح الإجازات والروايات القرآنية المجاز بها.');
      return;
    }
    if (selectedSpecialties.length === 0 && !customSpecialty.trim()) {
      setValidationError('يرجى تحديد التخصص القرآني (حفظ / تجويد / تصحيح تلاوة / إجازة).');
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedIjazat = [
        ijazat.trim(),
        qiraatList.length > 0 ? `الروايات: ${qiraatList.join('، ')}` : null,
      ].filter(Boolean).join(' • ');

      const combinedSpecialty = [
        ...selectedSpecialties,
        customSpecialty.trim(),
      ].filter(Boolean).join(' / ');

      // تنفيذ عملية التسجيل: إنشاء حساب Firebase Auth وحفظه في Firestore (teachers بـ status: "pending")
      const result = await submitTeacherApplicationToFirestore({
        fullName: fullName.trim(),
        whatsapp: whatsapp.trim(),
        countryCode,
        email: sanitizedEmail.toLowerCase(),
        password: password.trim(),
        ijazat: combinedIjazat,
        hasConnectedSanad,
        sanadDetails: sanadDetails.trim(),
        experienceYears,
        experienceDetails: experienceDetails.trim(),
        specialty: combinedSpecialty,
        specialtiesList: selectedSpecialties,
        bio: bio.trim(),
        targetSection: targetDepartment,
        preferredTimes: preferredTimes.trim(),
      });

      if (!result.success) {
        setValidationError(result.error || 'حدث خطأ أثناء إرسال طلب المعلم، يرجى المحاولة ثانية.');
        setIsSubmitting(false);
        return;
      }

      setRegisteredTeacherName(fullName.trim());
      setIsSubmitted(true);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.warn('[Teacher Registration Catch]:', err?.message || err);
      setValidationError(err?.message || 'حدث خطأ غير متوقع أثناء إرسال الطلب.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-3xl mx-auto font-sans text-right" dir="rtl">
      
      {/* رأس الصفحة المباشر لاستمارة تسجيل معلم جديد */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c2419] via-[#123624] to-[#071710] p-6 sm:p-7 border-2 border-emerald-600/70 shadow-2xl relative overflow-hidden text-center sm:text-right">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>بوابة انضمام وتسجيل المعلمين والمقرئين</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide leading-snug">
            استمارة تسجيل معلم جديد بمقرأة رحاب القرآن
          </h1>

          <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed max-w-2xl">
            نرحب بالمعلمين والمعلمات والمقرئين المجازين بالسند المتصل للإقراء وتعليم كتاب الله تعالى عن بُعد لطلبة العلم في مختلف دول العالم.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-amber-300/90 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>إجازات معتمدة بالسند</span>
            </span>
            <span className="text-emerald-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>مرونة في اختيار الأوقات</span>
            </span>
            <span className="text-emerald-600">•</span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>بيئة تعليمية تقنية متكاملة</span>
            </span>
          </div>
        </div>
      </div>

      {/* إذا تم الإرسال بنجاح -> عرض رسالة: "تم استلام طلبك، سيتم مراجعته" */}
      {isSubmitted ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#C5A059]/50 shadow-2xl space-y-6 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#046A38] via-[#C5A059] to-[#046A38]" />
          
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border-2 border-emerald-500/50 flex items-center justify-center text-[#046A38] shadow-lg animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#046A38]">
              تم استلام طلبك، سيتم مراجعته
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              أهلاً بكم فضيلة الشيخ <strong>{registeredTeacherName}</strong>. تم تسجيل حسابكم في النظام بنجاح وطلبكم الآن <strong>قيد المراجعة والتدقيق</strong> لدى المشرف العام وإدارة شؤون المعلمين.
            </p>
          </div>

          <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/30 text-xs text-slate-700 max-w-lg mx-auto text-right space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-[#046A38]">
              <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>ما هي الخطوات التالية؟</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pr-2">
              <li>يقوم المشرف بمراجعة المؤهلات والإجازات القرآنية.</li>
              <li>عند القبول، سيتم تعيين الحلقات والأوقات المناسبة لكم.</li>
              <li>ستصلكم رسالة رسمية عبر الواتساب بتعليمات الدخول وتفاصيل الحلقات.</li>
              <li>يمكنكم تسجيل الدخول ببريدكم وكلمة المرور التي اخترتموها فور اعتماد الطلب.</li>
            </ul>
          </div>

          {/* زر المتابعة والتواصل المباشر عبر واتساب الإدارة */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={`https://wa.me/${WHATSAPP_MAIN}?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته، أنا المعلم (${registeredTeacherName}) قمت بتقديم طلب انضمام كمعلم بمقرأة رحاب القرآن وأود المتابعة معكم.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#046A38] hover:from-emerald-500 hover:to-[#03542c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>متابعة الطلب عبر واتساب الإدارة ({WHATSAPP_DISPLAY})</span>
            </a>

            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>الانتقال لصفحة تسجيل الدخول</span>
              </button>
            )}

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-slate-600 hover:text-[#046A38] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للرئيسية</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* استمارة تسجيل المعلم */
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 rounded-3xl bg-[#0a1e15] border-2 border-emerald-800/80 shadow-2xl space-y-6">
          
          <div className="border-b border-emerald-900/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>بيانات المعلم والمؤهلات الإقرائية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يرجى تعبئة الحقول المطلوبة لإنشاء حسابكم واعتماده من قبل الإدارة
              </p>
            </div>
            <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-400/30">
              تسجيل معلم معتمد
            </span>
          </div>

          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-shake">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
              {validationError.includes('مسجل مسبقاً') && onSwitchToLogin && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-400/40 text-xs transition-colors shrink-0 cursor-pointer"
                >
                  تسجيل الدخول الآن
                </button>
              )}
            </div>
          )}

          {/* 1. البيانات الأساسية وبيانات الدخول */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>1. البيانات الشخصية وبيانات تسجيل الدخول:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* الاسم الكامل */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  الاسم الكامل رباعياً مع اللقب <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: الشيخ عبد الرحمن أحمد الشهري"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* رقم الواتساب */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  رقم الواتساب للتواصل والاعتماد <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-28 sm:w-36 shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full py-2.5 px-2 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                      title="رمز الدولة"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.iso} value={c.dialCode} className="bg-[#06150e] text-white">
                          {c.flag} {c.dialCode ? `+${c.dialCode}` : c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="713801916"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors dir-ltr text-left font-mono"
                    />
                  </div>
                </div>
                {whatsapp.trim() && (() => {
                  const preview = validateAndCleanWhatsAppNumber(whatsapp, countryCode);
                  return (
                    <div className="mt-1 flex items-center justify-between text-[11px] px-1">
                      <span className="text-slate-400">الصيغة الدولية المعتمدة:</span>
                      <span className={`font-mono font-bold ${preview.isValid ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">
                        {preview.isValid ? preview.formattedDisplay : 'يرجى إكمال الرقم'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  البريد الإلكتروني (اسم الدخول) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(cleanEmail(e.target.value))}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text');
                      if (text) {
                        e.preventDefault();
                        setEmail(cleanEmail(text));
                      }
                    }}
                    onBlur={() => setEmail((prev) => cleanEmail(prev))}
                    placeholder="teacher@example.com"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors dir-ltr text-right"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">يُستخدم لتسجيل الدخول إلى لوحة المعلم بعد الاعتماد</p>
              </div>

              {/* كلمة المرور */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  كلمة المرور (يختارها بنفسه) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="اختر كلمة مرور قوية (6 خانات أو أكثر)"
                    className="w-full pr-9 pl-10 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors dir-ltr text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">احفظ كلمة المرور لاستخدامها عند الدخول</p>
              </div>
            </div>
          </div>

          {/* 2. المؤهلات العلمية (الإجازات، السند المتصل، سنوات الخبرة) */}
          <div className="space-y-4 pt-3 border-t border-emerald-900/60">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>2. المؤهلات العلمية والإجازات: <span className="text-rose-400">*</span></span>
            </h3>

            {/* الإجازات والروايات */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                الروايات والقراءات المجاز بها (انقر للتحديد):
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {commonQiraat.map((q) => {
                  const isSelected = qiraatList.includes(q);
                  return (
                    <button
                      type="button"
                      key={q}
                      onClick={() => toggleQiraah(q)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                          : 'bg-[#06150e] text-slate-300 border-emerald-800 hover:border-emerald-600'
                      }`}
                    >
                      {isSelected && <span className="ml-1">✓</span>}
                      {q}
                    </button>
                  );
                })}
              </div>

              {/* تفاصيل الإجازات والمؤهلات الأكاديمية */}
              <input
                type="text"
                required
                value={ijazat}
                onChange={(e) => setIjazat(e.target.value)}
                placeholder="تفاصيل الإجازات (مثال: مجاز بروايتي حفص وشعبة عن عاصم، وبكالوريوس دراسات إسلامية/قرآن)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* السند المتصل */}
              <div className="bg-[#06150e] p-3.5 rounded-xl border border-emerald-800/80 space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  السند المتصل إلى رسول الله ﷺ: <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-4 text-xs text-white">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sanadChoice"
                      checked={hasConnectedSanad}
                      onChange={() => setHasConnectedSanad(true)}
                      className="accent-amber-400"
                    />
                    <span>نعم، أحمل سنداً متصلاً</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sanadChoice"
                      checked={!hasConnectedSanad}
                      onChange={() => setHasConnectedSanad(false)}
                      className="accent-amber-400"
                    />
                    <span>إجازة عامة / بدون سند متصل</span>
                  </label>
                </div>

                {hasConnectedSanad && (
                  <input
                    type="text"
                    value={sanadDetails}
                    onChange={(e) => setSanadDetails(e.target.value)}
                    placeholder="اسم الشيخ المجيز وطريق السند (اختياري)..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0a1e15] border border-emerald-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 mt-1"
                  />
                )}
              </div>

              {/* سنوات الخبرة */}
              <div className="bg-[#06150e] p-3.5 rounded-xl border border-emerald-800/80 space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  سنوات الخبرة في تحفيظ القرآن الكريم: <span className="text-rose-400">*</span>
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a1e15] border border-emerald-700/60 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="1-2">سنة إلى سنتين</option>
                  <option value="3-5">3 إلى 5 سنوات</option>
                  <option value="6-10">6 إلى 10 سنوات</option>
                  <option value="+10">أكثر من 10 سنوات (مقرئ قدير)</option>
                </select>

                <input
                  type="text"
                  value={experienceDetails}
                  onChange={(e) => setExperienceDetails(e.target.value)}
                  placeholder="موجز عن المقارئ أو المساجد التي درّست بها سابقاً..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0a1e15] border border-emerald-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 mt-1"
                />
              </div>
            </div>
          </div>

          {/* 3. التخصص (حفظ / تجويد / تصحيح تلاوة / إجازة) */}
          <div className="space-y-3 pt-3 border-t border-emerald-900/60">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>3. التخصص الإقرائي المرغوب بالتدريس فيه: <span className="text-rose-400">*</span></span>
              </h3>
              <span className="text-[11px] text-amber-400">حدد تخصصاً أو أكثر</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {specialtyOptions.map((sp) => {
                const isSelected = selectedSpecialties.includes(sp);
                return (
                  <button
                    type="button"
                    key={sp}
                    onClick={() => toggleSpecialty(sp)}
                    className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-[#06150e] text-slate-300 border-emerald-800 hover:border-emerald-600'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4 text-slate-950" /> : <BookOpen className="w-4 h-4 text-slate-400" />}
                    <span>{sp}</span>
                  </button>
                );
              })}
            </div>

            {/* تخصص إضافي إن وجد */}
            <div>
              <input
                type="text"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                placeholder="تخصص إضافي أو شرح مختصر (اختياري)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* 4. نبذة تعريفية (اختياري) + القسم المفضل */}
          <div className="space-y-4 pt-3 border-t border-emerald-900/60">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>4. نبذة تعريفية وقسم التدريس (اختياري):</span>
            </h3>

            {/* نبذة تعريفية */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                نبذة تعريفية عن السيرة والمنهج القرآني (اختياري):
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة موجزة عن سيرتكم في خدمة القرآن الكريم، المشايخ الذين تلقيت عنهم، أو المنهجية التي تتبعها في التدريس..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* قسم التدريس */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  القسم المرغوب بالتدريس فيه:
                </label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="male">قسم الطلاب (حلقات البنين والرجال)</option>
                  <option value="female">قسم الطالبات (حلقات الأخوات والبنات - للمعلمات)</option>
                  <option value="both">متاح للإقراء في كلا القسمين</option>
                </select>
              </div>

              {/* الأوقات المناسبة */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  الأوقات المفضلة أسبوعياً:
                </label>
                <input
                  type="text"
                  value={preferredTimes}
                  onChange={(e) => setPreferredTimes(e.target.value)}
                  placeholder="مثال: الفجر، العصر، أو المساء (بتوقيت مكة)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06150e] border border-emerald-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* زر الإرسال الرئيسي */}
          <div className="pt-4 border-t border-emerald-900/80 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-[#046A38] hover:from-emerald-500 hover:to-[#03542c] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/80 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري إنشاء الحساب وإرسال الطلب للمراجعة...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 rotate-180 text-amber-300" />
                  <span>إرسال استمارة تسجيل المعلم لاعتمادها</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              {onSwitchToLogin && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  لديك حساب معلم مسبقاً؟ تسجيل الدخول
                </button>
              )}

              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-slate-400 hover:text-white cursor-pointer mr-auto"
                >
                  العودة للصفحة الرئيسية
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              🔒 يتم حفظ بياناتكم وسيرتكم العلمية بأمان في قاعدة بيانات المقرأة، ولن تُنشر أي بيانات إلا بعد اعتماد طلبكم وتعيين الحلقات.
            </p>
          </div>
        </form>
      )}

    </div>
  );
};
