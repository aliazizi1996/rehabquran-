import React, { useState } from 'react';
import { 
  X, MessageCircle, User, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, ExternalLink, Calendar, Copy, Check,
  Send, Video, AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';
import { saveRegisteredStudent } from '../data/registrationStore';
import { COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';

interface MaleStudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinMeet?: () => void;
}

export const MaleStudentRegistrationModal: React.FC<MaleStudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onJoinMeet,
}) => {
  const WHATSAPP_NUMBER = '967714371599';
  const WHATSAPP_DISPLAY = '+967 714 371 599';
  const CALL_PHONE = '0967713801916';
  const CALL_DISPLAY = '0967713801916';
  const GOOGLE_MEET_URL = 'https://meet.google.com/fid-iqwm-zxm';

  // Form Fields
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentCountry, setStudentCountry] = useState('');
  const [studentCountryCode, setStudentCountryCode] = useState('967'); // رمز الدولة (اليمن +967 افتراضياً)
  const [studentPhone, setStudentPhone] = useState('');
  const [studentStudyType, setStudentStudyType] = useState('تحفيظ القرآن الكريم');
  const [studentRiwayah, setStudentRiwayah] = useState('حفص عن عاصم');
  const [studentCustomRiwayah, setStudentCustomRiwayah] = useState('');
  const [studentMemorization, setStudentMemorization] = useState('5 أجزاء');
  const [studentPreferredTime, setStudentPreferredTime] = useState('الصباح');
  const [studentCustomTime, setStudentCustomTime] = useState('');
  const [studentTimeFrom, setStudentTimeFrom] = useState('');
  const [studentTimeTo, setStudentTimeTo] = useState('');
  const [studentGoal, setStudentGoal] = useState('حفظ وتثبيت القرآن الكريم وضبط الإتقان');
  const [studentCommitment, setStudentCommitment] = useState('نعم، ملتزم بموعد الفجر اليومي (05:00 ص - 06:30 ص)');
  const [studentMonthlyContribution, setStudentMonthlyContribution] = useState('نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)');
  const [studentNotes, setStudentNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('0967713801916');
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyMeet = () => {
    navigator.clipboard.writeText(GOOGLE_MEET_URL);
    setCopiedMeet(true);
    setTimeout(() => setCopiedMeet(false), 2000);
  };

  const finalRiwayah = studentRiwayah === 'رواية أخرى' && studentCustomRiwayah.trim()
    ? studentCustomRiwayah.trim()
    : studentRiwayah;

  const finalTime = studentPreferredTime === 'وقت آخر' && studentCustomTime.trim()
    ? studentCustomTime.trim()
    : studentPreferredTime;

  const finalTimeDetail = (studentTimeFrom.trim() || studentTimeTo.trim())
    ? `من ${studentTimeFrom.trim() || '--'} إلى ${studentTimeTo.trim() || '--'}`
    : '';

  const generateWhatsAppMessage = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `طلب تسجيل مستقل في *قسم الطلاب بمقرأة رحاب القرآن الإلكترونية*:\n\n`;
    msg += `• اسم الطالب: ${studentName.trim() || 'طالب جديد'}\n`;
    if (studentAge.trim()) msg += `• العمر: ${studentAge.trim()} سنة\n`;
    if (studentCountry.trim()) msg += `• بلد / مدينة الإقامة: ${studentCountry.trim()}\n`;
    if (studentPhone.trim()) msg += `• رقم الواتساب: ${studentPhone.trim()}\n`;
    msg += `• نوع الدراسة المطلوب: ${studentStudyType}\n`;
    msg += `• الرواية القرآنية: ${finalRiwayah}\n`;
    msg += `• مقدار الحفظ الحالي: ${studentMemorization}\n`;
    msg += `• الوقت المناسب للحصة: ${finalTime}${finalTimeDetail ? ` (${finalTimeDetail})` : ''}\n`;
    msg += `• الهدف القرآني: ${studentGoal}\n`;
    msg += `• منصة الحضور: Google Meet مباشرة\n`;
    msg += `• تأكيد الالتزام بالموعد: ${studentCommitment}\n`;
    msg += `• المساهمة الشهرية (3000 ريال يمني أو ما يعادلها): ${studentMonthlyContribution}\n`;
    if (studentNotes.trim()) {
      msg += `• ملاحظات إضافية: ${studentNotes.trim()}\n`;
    }
    msg += `\nأرجو التكرم بقبول تسجيلي وتوجيهي للحلقة المباركة، جزاكم الله خيراً.`;
    return msg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('يرجى إدخال اسم الطالب الكامل');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Persist directly in official database so student appears in student registry & live room
      saveRegisteredStudent({
        name: studentName.trim(),
        age: studentAge.trim() || undefined,
        country: studentCountry.trim() || undefined,
        phone: studentPhone.trim() || undefined,
        section: 'male',
        memorization: studentMemorization,
        studyType: studentStudyType,
        riwayah: finalRiwayah,
        wantsSanad: studentStudyType === 'إجازة بالسند' ? 'نعم' : 'لا',
        preferredTime: finalTime,
        preferredTimeDetail: finalTimeDetail || undefined,
        monthlyContribution: studentMonthlyContribution,
        notes: `تسجيل مستقل بقسم الطلاب. نوع الدراسة: ${studentStudyType} | الرواية: ${finalRiwayah} | الوقت: ${finalTime} ${finalTimeDetail} | الهدف: ${studentGoal}. ${studentNotes.trim()}`.trim(),
        status: 'pending',
      });

      // 2. Generate WhatsApp link and open it
      const msg = generateWhatsAppMessage();
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // 3. Show success state
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0a1f16] border-2 border-emerald-500/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="relative p-5 bg-gradient-to-r from-[#061710] via-[#0e2a1e] to-[#0a1f16] border-b border-emerald-800/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  استمارة تسجيل مستقلة
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                  قسم الطلاب (بنين)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif mt-1">
                تسجيل الطلاب • حلقات البنين المعتمدة
              </h2>
              <p className="text-xs text-emerald-200/80 font-medium">
                مقرأة رحاب القرآن الإلكترونية • ربط وتوجيه مباشر عبر الواتساب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-emerald-950/80 text-slate-300 hover:text-white hover:bg-emerald-900 border border-emerald-800 cursor-pointer transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule & Supervisor Info Banner */}
        <div className="p-4 bg-[#081811] border-b border-emerald-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-[#0c2419] border border-emerald-700/50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">الموعد اليومي للحلقة:</span>
              <strong className="text-white font-bold text-[11px]">05:00 ص - 06:30 ص</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c2419] border border-emerald-700/50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">أيام الانعقاد:</span>
              <strong className="text-emerald-300 font-bold text-[11px]">جميع الأيام عدا الجمعة</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c2419] border border-emerald-700/50 flex items-center gap-2">
            <Video className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">منصة الحضور المباشر:</span>
              <strong className="text-sky-300 font-bold text-[11px]">Google Meet</strong>
            </div>
          </div>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-300 shadow-xl shadow-emerald-950">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-serif">
                تم تجهيز وإرسال طلب التسجيل بنجاح!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-md mx-auto leading-relaxed">
                تم حفظ بيانات الطالب <strong className="text-amber-300 font-bold">{studentName}</strong> في سجل طلاب المقرأة وتوجيه الاستمارة رسمياً إلى <strong className="text-white">إدارة قسم الطلاب</strong> عبر الواتساب.
              </p>
            </div>

            {/* Google Meet Direct Box */}
            <div className="p-4 rounded-2xl bg-[#081b13] border-2 border-amber-500/60 text-right space-y-3 max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-amber-400" />
                  رابط حلقة Google Meet المباشرة:
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  05:00 ص - 06:30 ص
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#05110d] p-2 rounded-xl border border-emerald-900 font-mono text-xs text-slate-300 dir-ltr">
                <span className="truncate flex-1 text-emerald-300">{GOOGLE_MEET_URL}</span>
                <button
                  type="button"
                  onClick={handleCopyMeet}
                  className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-white cursor-pointer"
                  title="نسخ الرابط"
                >
                  {copiedMeet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={GOOGLE_MEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span>انضمام مباشر الآن عبر Google Meet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {onJoinMeet && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onJoinMeet();
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <span>دخول القاعة التفاعلية</span>
                  </button>
                )}
              </div>
            </div>

            {/* Re-open WhatsApp & Done Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generateWhatsAppMessage())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إعادة فتح محادثة الواتساب</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        ) : (
          /* The Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            
            {/* Student Full Name & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>اسم الطالب الرباعي *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الرحمن محمد يوسف الصنعاني"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>العمر (سنة)</span>
                </label>
                <input
                  type="number"
                  placeholder="مثال: 18"
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Country / City & Student Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الدولة والمدينة</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: اليمن - صنعاء / السعودية - الرياض"
                  value={studentCountry}
                  onChange={(e) => setStudentCountry(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم هاتف الطالب / الواتساب</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-28 sm:w-36 shrink-0">
                    <select
                      value={studentCountryCode}
                      onChange={(e) => setStudentCountryCode(e.target.value)}
                      className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-2 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.iso} value={c.dialCode} className="bg-[#071710] text-white">
                          {c.flag} {c.dialCode ? `+${c.dialCode}` : c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      placeholder="713801916 أو 0713801916"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none dir-ltr text-left font-mono"
                    />
                  </div>
                </div>
                {studentPhone.trim() && (() => {
                  const preview = validateAndCleanWhatsAppNumber(studentPhone, studentCountryCode);
                  return (
                    <div className="mt-1 flex items-center justify-between text-[11px] px-1">
                      <span className="text-slate-400">الصيغة الدولية المعتمدة للإرسال:</span>
                      <span className={`font-mono font-bold ${preview.isValid ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">
                        {preview.isValid ? preview.formattedDisplay : 'يرجى إكمال الرقم'}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Study Type & Riwayah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>نوع الدراسة المطلوب *</span>
                </label>
                <select
                  value={studentStudyType}
                  onChange={(e) => setStudentStudyType(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="تأسيس في القرآن الكريم">تأسيس في القرآن الكريم</option>
                  <option value="تحفيظ القرآن الكريم">تحفيظ القرآن الكريم</option>
                  <option value="مراجعة الحفظ">مراجعة الحفظ</option>
                  <option value="تثبيت الحفظ">تثبيت الحفظ</option>
                  <option value="إجازة بالسند">إجازة بالسند</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الرواية التي يرغب الطالب في تعلمها *</span>
                </label>
                <select
                  value={studentRiwayah}
                  onChange={(e) => setStudentRiwayah(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="حفص عن عاصم">حفص عن عاصم</option>
                  <option value="ورش عن نافع">ورش عن نافع</option>
                  <option value="قالون عن نافع">قالون عن نافع</option>
                  <option value="شعبة عن عاصم">شعبة عن عاصم</option>
                  <option value="رواية أخرى">رواية أخرى</option>
                </select>

                {studentRiwayah === 'رواية أخرى' && (
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم الرواية المطلوبة..."
                    value={studentCustomRiwayah}
                    onChange={(e) => setStudentCustomRiwayah(e.target.value)}
                    className="w-full mt-1.5 bg-[#0a2318] border border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Memorization Level & Preferred Study Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مستوى الحفظ الحالي *</span>
                </label>
                <select
                  value={studentMemorization}
                  onChange={(e) => setStudentMemorization(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="مبتدئ من الصفر (تعلم القراءة والتجويد)">مبتدئ من الصفر (تعلم القراءة والتجويد)</option>
                  <option value="جزء عمّ فقط">جزء عمّ فقط</option>
                  <option value="3 أجزاء">3 أجزاء</option>
                  <option value="5 أجزاء">5 أجزاء</option>
                  <option value="10 أجزاء">10 أجزاء</option>
                  <option value="15 جزءاً (نصف القرآن)">15 جزءاً (نصف القرآن)</option>
                  <option value="20 جزءاً">20 جزءاً</option>
                  <option value="القرآن الكريم كاملاً (مراجعة وتثبيت)">القرآن الكريم كاملاً (مراجعة وتثبيت)</option>
                  <option value="خاتم ويرغب في الإجازة بالسند المتصل">خاتم ويرغب في الإجازة بالسند المتصل</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>الوقت المناسب للحصة *</span>
                </label>
                <select
                  value={studentPreferredTime}
                  onChange={(e) => setStudentPreferredTime(e.target.value)}
                  className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="الصباح">الصباح</option>
                  <option value="الظهر">الظهر</option>
                  <option value="العصر">العصر</option>
                  <option value="المغرب">المغرب</option>
                  <option value="العشاء">العشاء</option>
                  <option value="وقت آخر">وقت آخر</option>
                </select>

                {studentPreferredTime === 'وقت آخر' && (
                  <input
                    type="text"
                    required
                    placeholder="اكتب الوقت المناسب لك..."
                    value={studentCustomTime}
                    onChange={(e) => setStudentCustomTime(e.target.value)}
                    className="w-full mt-1.5 bg-[#0a2318] border border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Optional detailed hours */}
            <div className="bg-[#071710]/90 border border-emerald-900/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300">تحديد الوقت بالتفصيل (اختياري):</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">اختياري</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">من الساعة:</label>
                  <input
                    type="text"
                    value={studentTimeFrom}
                    onChange={(e) => setStudentTimeFrom(e.target.value)}
                    placeholder="مثال: 05:00 ص"
                    className="w-full bg-[#05120c] border border-emerald-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">إلى الساعة:</label>
                  <input
                    type="text"
                    value={studentTimeTo}
                    onChange={(e) => setStudentTimeTo(e.target.value)}
                    placeholder="مثال: 06:30 ص"
                    className="w-full bg-[#05120c] border border-emerald-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Commitment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>الالتزام بالحضور والمتابعة اليومية</span>
              </label>
              <select
                value={studentCommitment}
                onChange={(e) => setStudentCommitment(e.target.value)}
                className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-amber-300 font-semibold focus:outline-none"
              >
                <option value="نعم، ملتزم بموعد الفجر اليومي (05:00 ص - 06:30 ص) عدا الجمعة">
                  ✓ نعم، ملتزم بموعد الفجر اليومي المعتمد (من 5:00 ص إلى 6:30 ص - عدا الجمعة)
                </option>
                <option value="نعم، ملتزم بأي موعد تحدده إدارة المقرأة بحسب اختياري">
                  ✓ نعم، ملتزم بالموعد المناسب المحدد مع إدارة المقرأة
                </option>
                <option value="أرغب بالتنسيق مع إدارة القسم حول التوقيت الأنسب">
                  أرغب بالتنسيق مع إدارة قسم الطلاب لتحديد أنسب وقت
                </option>
              </select>
            </div>

            {/* الخيار قبل الأخير: رسوم المساهمة الشهرية */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-1">
              <label className="block text-slate-200 mb-1 font-bold text-xs leading-relaxed">
                هل تستطيع دفع مساهمة شهرية مبلغ بسيط قدره 3000 ريال يمني قديم أو ما يعادلها من خارج اليمن؟ <span className="text-amber-400">*</span>
              </label>
              <select
                value={studentMonthlyContribution}
                onChange={(e) => setStudentMonthlyContribution(e.target.value)}
                className="w-full bg-[#071710] border border-amber-600/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)">
                  نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)
                </option>
                <option value="أستطيع المساهمة بمبلغ جزئي ميسر حسب الاستطاعة">
                  أستطيع المساهمة بمبلغ جزئي ميسر حسب الاستطاعة
                </option>
                <option value="لا أستطيع حالياً (طلب منحة مجانية كاملة وتسهيل الحفظ)">
                  لا أستطيع حالياً (طلب منحة مجانية كاملة وتسهيل الحفظ)
                </option>
              </select>
              <p className="text-[10px] text-amber-300/80">
                💡 المساهمة الرمزية تدعم كفالة الحلقات ورواتب المعلمين، ولا يُحرم أي راغب في حفظ كتاب الله.
              </p>
            </div>

            {/* Student Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>ملاحظات أو رغبات خاصة (اختياري)</span>
              </label>
              <textarea
                rows={2}
                placeholder="أية ملاحظات حول السور المراد البدء بها أو أوقات التسميع المفضلة..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="w-full bg-[#071710] border border-emerald-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Notice Strip */}
            <div className="p-3 rounded-xl bg-[#091b12] border border-emerald-700/60 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-300 text-[11px]">
                  سيتم توجيه هذه الاستمارة مباشرة وبخصوصية تامة إلى واتساب <strong className="text-white">إدارة قسم الطلاب</strong>
                </span>
              </div>

              <span className="text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span>ربط آمن بالواتساب</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال استمارة التسجيل مباشرة عبر الواتساب</span>
                <Send className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
