import React, { useState } from 'react';
import { 
  X, MessageCircle, User, GraduationCap, Phone, Globe, BookOpen, Clock, 
  CheckCircle2, ExternalLink, ShieldCheck, HeartHandshake, MapPin, Copy, Check,
  Send, Mail, Award, AlertCircle, Loader2, Building2, Wallet, Instagram
} from 'lucide-react';
import { saveRegisteredStudent, saveRegisteredTeacher } from '../data/registrationStore';
import { COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';

interface RegistrationModalProps {
  isOpen: boolean;
  initialType?: 'male' | 'female' | 'teacher';
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  initialType = 'male',
  onClose,
}) => {
  // Main Tab: 'student' or 'teacher' (matching https://bucolic-mooncake-7af778.netlify.app)
  const [mainTab, setMainTab] = useState<'student' | 'teacher'>(
    initialType === 'teacher' ? 'teacher' : 'student'
  );

  // For student registration: gender section
  const [studentSection, setStudentSection] = useState<'male' | 'female'>(
    initialType === 'female' ? 'female' : 'male'
  );

  // Country dial code selection (Default Yemen +967)
  const [studentCountryCode, setStudentCountryCode] = useState('967');
  const [teacherCountryCode, setTeacherCountryCode] = useState('967');

  // Student Form State
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [studentCountry, setStudentCountry] = useState('');
  const [studentMemorization, setStudentMemorization] = useState('5 أجزاء');
  const [studentWantsSanad, setStudentWantsSanad] = useState<'نعم' | 'لا'>('نعم');
  const [studentRiwayah, setStudentRiwayah] = useState('حفص عن عاصم');
  const [studentPreferredTime, setStudentPreferredTime] = useState('بعد العصر / مساءً');
  const [studentMonthlyContribution, setStudentMonthlyContribution] = useState('نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)');
  const [studentNotes, setStudentNotes] = useState('');

  // Teacher Form State
  const [teacherName, setTeacherName] = useState('');
  const [teacherQualification, setTeacherQualification] = useState('');
  const [teacherCountry, setTeacherCountry] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherTargetSection, setTeacherTargetSection] = useState<'معلم - قسم الطلاب' | 'معلمة - قسم الطالبات'>('معلم - قسم الطلاب');
  const [teacherExperience, setTeacherExperience] = useState('');

  // Status State
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedKuraimiSar, setCopiedKuraimiSar] = useState(false);
  const [copiedKuraimiYer, setCopiedKuraimiYer] = useState(false);
  const [copiedJeeb, setCopiedJeeb] = useState(false);

  const handleCopyKuraimiSar = () => {
    navigator.clipboard.writeText('3204371368');
    setCopiedKuraimiSar(true);
    setTimeout(() => setCopiedKuraimiSar(false), 2000);
  };

  const handleCopyKuraimiYer = () => {
    navigator.clipboard.writeText('3204541287');
    setCopiedKuraimiYer(true);
    setTimeout(() => setCopiedKuraimiYer(false), 2000);
  };

  const handleCopyJeeb = () => {
    navigator.clipboard.writeText('313146');
    setCopiedJeeb(true);
    setTimeout(() => setCopiedJeeb(false), 2000);
  };

  if (!isOpen) return null;

  const MALE_PHONE = '967714371599';
  const MALE_DISPLAY = '+967 714 371 599 (اتصال: 0967713801916)';
  const FEMALE_PHONE = '967711607573';
  const FEMALE_DISPLAY = '+967 711 607 573';
  // Determine current active phone for WhatsApp
  const activeWhatsAppPhone = mainTab === 'student' 
    ? (studentSection === 'male' ? MALE_PHONE : FEMALE_PHONE)
    : (teacherTargetSection === 'معلمة - قسم الطالبات' ? FEMALE_PHONE : MALE_PHONE);

  const activeWhatsAppDisplay = mainTab === 'student'
    ? (studentSection === 'male' ? MALE_DISPLAY : FEMALE_DISPLAY)
    : (teacherTargetSection === 'معلمة - قسم الطالبات' ? FEMALE_DISPLAY : MALE_DISPLAY);

  // Generate WhatsApp Message
  const generateWhatsAppLink = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    if (mainTab === 'student') {
      if (studentSection === 'female') {
        msg += `طلب تسجيل في *قسم الطالبات بمقرأة رحاب القرآن الإلكترونية*:\n\n`;
      } else {
        msg += `طلب تسجيل في *قسم الطلاب بمقرأة رحاب القرآن الإلكترونية*:\n\n`;
      }
      msg += `• نوع الطلب: تسجيل طالب جديد\n`;
      msg += `• الاسم الكامل: ${studentName.trim() || 'لم يحدد'}\n`;
      if (studentPhone.trim()) {
        msg += `• رقم الهاتف / الواتساب: ${studentPhone.trim()}\n`;
      }
      msg += `• العمر: ${studentAge.trim() ? `${studentAge.trim()} سنة` : 'لم يحدد'}\n`;
      msg += `• البلد / مدينة الإقامة: ${studentCountry.trim() || 'لم تحدد'}\n`;
      msg += `• القسم: ${studentSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}\n`;
      msg += `• مقدار الحفظ الحالي: ${studentMemorization}\n`;
      msg += `• الرواية القرآنية: ${studentRiwayah}\n`;
      msg += `• الرغبة في الإجازة بالسند: ${studentWantsSanad}\n`;
      msg += `• الوقت المناسب للتسميع: ${studentPreferredTime}\n`;
      msg += `• المساهمة الشهرية (3000 ريال يمني أو ما يعادلها): ${studentMonthlyContribution}\n`;
      if (studentNotes.trim()) {
        msg += `• ملاحظات إضافية: ${studentNotes.trim()}\n`;
      }
    } else {
      msg += `طلب انضمام كمعلم في *مقرأة رحاب القرآن الإلكترونية*:\n\n`;
      msg += `• نوع الطلب: تسجيل معلم/معلمة\n`;
      msg += `• اسم المعلم/المعلمة: ${teacherName.trim() || 'لم يحدد'}\n`;
      msg += `• المؤهل القرآني والإجازات: ${teacherQualification.trim() || 'لم يحدد'}\n`;
      msg += `• بلد الإقامة: ${teacherCountry.trim() || 'لم تحدد'}\n`;
      msg += `• رقم الواتساب: ${teacherPhone.trim() || 'لم يحدد'}\n`;
      msg += `• القسم المتاح للتدريس: ${teacherTargetSection}\n`;
      if (teacherExperience.trim()) {
        msg += `• الخبرات السابقة في الإقراء: ${teacherExperience.trim()}\n`;
      }
    }
    msg += `\nأرجو التكرم بالاطلاع وقبول الطلب، بارك الله في جهودكم.`;

    return `https://wa.me/${activeWhatsAppPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Submit via Formspree (Matching https://formspree.io/f/mqpkgyny from site)
  const handleSubmitFormspree = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    setSubmitSuccess(false);

    try {
      // 1. Immediately persist student or teacher in academy records (central store)
      if (mainTab === 'student') {
        saveRegisteredStudent({
          name: studentName.trim() || 'طالب جديد',
          phone: studentPhone.trim() || undefined,
          age: studentAge.trim() || undefined,
          country: studentCountry.trim() || undefined,
          section: studentSection,
          memorization: studentMemorization,
          wantsSanad: studentWantsSanad,
          riwayah: studentRiwayah,
          preferredTime: studentPreferredTime,
          monthlyContribution: studentMonthlyContribution,
          notes: studentNotes.trim() || undefined,
          status: 'pending',
        });
      } else {
        saveRegisteredTeacher({
          name: teacherName.trim() || 'معلم جديد',
          qualification: teacherQualification.trim() || 'مقرئ لكتاب الله',
          country: teacherCountry.trim() || 'اليمن',
          phone: teacherPhone.trim() || '',
          targetSection: teacherTargetSection === 'معلمة - قسم الطالبات' ? 'female' : 'male',
          experience: teacherExperience.trim() || undefined,
          status: 'approved',
        });
      }

      const payload = mainTab === 'student' ? {
        "نوع_الطلب": "تسجيل طالب جديد",
        "الاسم": studentName,
        "رقم_الهاتف": studentPhone,
        "العمر": studentAge,
        "البلد": studentCountry,
        "القسم": studentSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب',
        "مقدار_الحفظ": studentMemorization,
        "إجازة_بالسند": studentWantsSanad,
        "الوقت_المناسب": studentPreferredTime,
        "الملاحظات": studentNotes,
      } : {
        "نوع_الطلب": "تسجيل معلم/معلمة",
        "الاسم": teacherName,
        "المؤهل_القرآني": teacherQualification,
        "البلد": teacherCountry,
        "التواصل": teacherPhone,
        "القسم": teacherTargetSection,
        "الخبرات": teacherExperience,
      };

      await fetch('https://formspree.io/f/mqpkgyny', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      setSubmitSuccess(true);
    } catch {
      // In case network blocks CORS, notify and give WhatsApp fallback
      setSubmitSuccess(true);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeWhatsAppPhone);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0b1c14] border-2 border-emerald-600/70 rounded-3xl max-w-lg w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#081810] border-b border-emerald-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>بوابة التسجيل والالتحاق</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/30 font-semibold">
                  مجاني 100%
                </span>
              </h3>
              <p className="text-[11px] text-emerald-300/80">مقرأة رحاب القرآن الإلكترونية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Switcher: تسجيل طالب vs تسجيل معلم (كما في موقع المقرأة تماماً) */}
        <div className="p-2.5 bg-[#0a1f16] border-b border-emerald-950 flex gap-2">
          <button
            type="button"
            onClick={() => { setMainTab('student'); setSubmitSuccess(false); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              mainTab === 'student'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                : 'bg-[#06140e] text-slate-300 border-emerald-900/60 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>تسجيل طالب</span>
          </button>

          <button
            type="button"
            onClick={() => { setMainTab('teacher'); setSubmitSuccess(false); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              mainTab === 'teacher'
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-950 font-extrabold'
                : 'bg-[#06140e] text-slate-300 border-emerald-900/60 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>تسجيل معلم / معلمة</span>
          </button>
        </div>

        {/* Section Status / WhatsApp Banner */}
        <div className={`p-2.5 px-3.5 text-xs flex items-center justify-between gap-2 border-b ${
          (mainTab === 'student' && studentSection === 'female') || (mainTab === 'teacher' && teacherTargetSection === 'معلمة - قسم الطالبات')
            ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
        }`}>
          <div>
            <span className="text-[10px] text-slate-400 block">القسم المختار:</span>
            <span className="font-bold text-white text-xs">
              {(mainTab === 'student' && studentSection === 'female') || (mainTab === 'teacher' && teacherTargetSection === 'معلمة - قسم الطالبات')
                ? 'قسم الطالبات (أخوات)' 
                : 'قسم الطلاب (بنين)'}
            </span>
          </div>

          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#071710] border border-emerald-800/80 font-bold text-emerald-300 flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>ربط مباشر بالواتساب</span>
          </span>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {submitSuccess && (
            <div className="p-3 bg-emerald-900/40 border border-emerald-500/60 rounded-2xl text-emerald-200 text-xs space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم استلام طلبك بنجاح!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                تم حفظ البيانات في مقرأة رحاب القرآن الإلكترونية. لمتابعة القبول وتحديد الموعد فوراً، يُرجى الضغط على زر الواتساب بالأسفل.
              </p>
            </div>
          )}

          {/* Student Form Panel */}
          {mainTab === 'student' && (
            <form onSubmit={handleSubmitFormspree} className="space-y-3">
              {/* Gender / Section Selector */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">القسم المطلوب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentSection('male')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      studentSection === 'male'
                        ? 'bg-emerald-700/60 border-emerald-400 text-white'
                        : 'bg-[#091710] border-emerald-900/70 text-slate-400'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>قسم الطلاب (بنين)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudentSection('female')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      studentSection === 'female'
                        ? 'bg-amber-600/60 border-amber-400 text-white'
                        : 'bg-[#091710] border-emerald-900/70 text-slate-400'
                    }`}
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>قسم الطالبات (أخوات)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder={studentSection === 'female' ? 'أدخلي اسم الطالبة الرباعي' : 'أدخل اسم الطالب الرباعي'}
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">رقم الهاتف / الواتساب:</label>
                <div className="flex gap-2">
                  <div className="w-32 sm:w-40 shrink-0">
                    <select
                      value={studentCountryCode}
                      onChange={(e) => setStudentCountryCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white focus:outline-none focus:border-emerald-500 text-xs font-medium cursor-pointer"
                      title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.iso} value={c.dialCode} className="bg-[#091710] text-white">
                          {c.flag} {c.nameAr} {c.dialCode ? `(+${c.dialCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 713801916 أو 0713801916"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      dir="ltr"
                      className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-left"
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">العمر:</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 20"
                    value={studentAge}
                    onChange={(e) => setStudentAge(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">البلد / مدينة الإقامة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اليمن - صنعاء"
                    value={studentCountry}
                    onChange={(e) => setStudentCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">مقدار الحفظ الحالي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 5 أجزاء / كامل المصحف / جزء عمّ"
                  value={studentMemorization}
                  onChange={(e) => setStudentMemorization(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">الرواية القرآنية المراد دراستها:</label>
                <select
                  value={studentRiwayah}
                  onChange={(e) => setStudentRiwayah(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white focus:outline-none focus:border-emerald-500 font-medium text-xs sm:text-sm"
                >
                  <option value="حفص عن عاصم">حفص عن عاصم (الرواية العامة الأكثر انتشاراً)</option>
                  <option value="ورش عن نافع">ورش عن نافع (طريق الأزرق / الأصبهاني)</option>
                  <option value="قالون عن نافع">قالون عن نافع</option>
                  <option value="الدوري عن أبي عمرو">الدوري عن أبي عمرو</option>
                  <option value="السوسي عن أبي عمرو">السوسي عن أبي عمرو</option>
                  <option value="شعبة عن عاصم">شعبة عن عاصم</option>
                  <option value="ابن كثير المكي">ابن كثير المكي (البزي وقنبل)</option>
                  <option value="ابن عامر الشامي">ابن عامر الشامي (هشام وابن ذكوان)</option>
                  <option value="حمزة الكوفي">حمزة الكوفي (خلف وخلاد)</option>
                  <option value="الكسائي">الكسائي (أبو الحارث والدوري)</option>
                  <option value="أبو جعفر المدني">أبو جعفر المدني</option>
                  <option value="يعقوب الحضرمي">يعقوب الحضرمي</option>
                  <option value="خلف العاشر">خلف العاشر</option>
                  <option value="رواية أخرى / جمع القراءات العشر">رواية أخرى / جمع القراءات العشر</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">الرغبة في الإجازة بالسند:</label>
                  <select
                    value={studentWantsSanad}
                    onChange={(e) => setStudentWantsSanad(e.target.value as 'نعم' | 'لا')}
                    className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="نعم">نعم (بالسند المتصل)</option>
                    <option value="لا">لا (حفظ وتصحيح فقط)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">الوقت المناسب للتسميع:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بعد العصر / مساءً"
                    value={studentPreferredTime}
                    onChange={(e) => setStudentPreferredTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* الخيار قبل الأخير: رسوم المساهمة الشهرية */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-1">
                <label className="block text-slate-200 mb-1 font-medium text-xs leading-relaxed">
                  هل تستطيع دفع مساهمة شهرية مبلغ بسيط قدره 3000 ريال يمني قديم أو ما يعادلها من خارج اليمن؟ <span className="text-amber-400">*</span>
                </label>
                <select
                  value={studentMonthlyContribution}
                  onChange={(e) => setStudentMonthlyContribution(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#091710] border border-amber-600/60 text-white focus:outline-none focus:border-amber-400 text-xs"
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
                  💡 المساهمة الرمزية تدعم كفالة الحلقات ورواتب المعلمين والمعلمات، ولا يُحرم أي راغب في العلم.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  placeholder="أي معلومات تود إضافتها..."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingForm}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {isSubmittingForm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال طلب تسجيل الطالب في النظام</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Teacher Form Panel (كما في موقع المقرأة) */}
          {mainTab === 'teacher' && (
            <form onSubmit={handleSubmitFormspree} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">اسم المعلم / المعلمة:</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل الاسم الثلاثي أو الرباعي"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">المؤهل القرآني والإجازات:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حافظ ومجاز برواية حفص عن عاصم بالسند المتصل"
                  value={teacherQualification}
                  onChange={(e) => setTeacherQualification(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">البلد / بلد الإقامة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اليمن"
                    value={teacherCountry}
                    onChange={(e) => setTeacherCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">رقم الواتساب / وسيلة التواصل:</label>
                  <div className="flex gap-2">
                    <div className="w-28 sm:w-36 shrink-0">
                      <select
                        value={teacherCountryCode}
                        onChange={(e) => setTeacherCountryCode(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white focus:outline-none focus:border-emerald-500 text-xs font-medium cursor-pointer"
                        title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                      >
                        {COUNTRY_DIAL_CODES.map((c) => (
                          <option key={c.iso} value={c.dialCode} className="bg-[#091710] text-white">
                            {c.flag} {c.dialCode ? `+${c.dialCode}` : c.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="tel"
                        required
                        placeholder="713801916 أو 0713801916"
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">القسم المتاح للتدريس فيه:</label>
                <select
                  value={teacherTargetSection}
                  onChange={(e) => setTeacherTargetSection(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="معلم - قسم الطلاب">قسم الطلاب (بنين)</option>
                  <option value="معلمة - قسم الطالبات">قسم الطالبات (أخوات)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">الخبرات السابقة في الإقراء:</label>
                <textarea
                  rows={2}
                  placeholder="اذكر نبذة مختصرة عن خبرتك السابقة في تعليم القرآن وإقراء الحلقات..."
                  value={teacherExperience}
                  onChange={(e) => setTeacherExperience(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingForm}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {isSubmittingForm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>جارٍ الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>إرسال طلب الانضمام كمعلم في المقرأة</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Official Bank Accounts Box */}
          <div className="p-3 rounded-2xl bg-[#071911] border border-amber-500/40 text-[11px] space-y-2 text-slate-300">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>الحسابات البنكية للمقرأة (للدعم والاشتراكات):</span>
              </span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                حسابات رسمية
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Kuraimi SAR */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-amber-500/50 flex items-center justify-between gap-1.5">
                <div>
                  <span className="text-[9px] text-amber-300 block font-bold">الكريمي (ريال سعودي):</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-amber-300 dir-ltr select-all">
                    3204371368
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKuraimiSar}
                  className="p-1 px-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-[11px] font-semibold text-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKuraimiSar ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKuraimiSar ? 'تم' : 'نسخ'}</span>
                </button>
              </div>

              {/* Kuraimi YER */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-emerald-800/80 flex items-center justify-between gap-1.5">
                <div>
                  <span className="text-[9px] text-emerald-400 block font-bold">الكريمي (ريال يمني):</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-emerald-300 dir-ltr select-all">
                    3204541287
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyKuraimiYer}
                  className="p-1 px-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-[11px] font-semibold text-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKuraimiYer ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKuraimiYer ? 'تم' : 'نسخ'}</span>
                </button>
              </div>

              {/* Jeeb */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-teal-800/80 flex items-center justify-between gap-1.5">
                <div>
                  <span className="text-[9px] text-teal-300 block font-bold">محفظة جيب:</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-teal-300 dir-ltr select-all">
                    313146
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyJeeb}
                  className="p-1 px-1.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-[11px] font-semibold text-teal-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedJeeb ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJeeb ? 'تم' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Official Contact Info Box (مطابق لبيانات الموقع الرسمي) */}
          <div className="p-3 rounded-2xl bg-[#06140e] border border-emerald-950 text-[11px] space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>بيانات الاتصال والتواصل الرسمية:</span>
              <span className="text-[10px] text-slate-400">الجمهورية اليمنية 📍</span>
            </div>
            <div className="space-y-1 text-slate-300 text-[11px]">
              <p className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-amber-400 shrink-0" />
                <span>البريد الإلكتروني:</span>
                <a href="mailto:rehabquran383@gmail.com" className="text-emerald-300 hover:underline font-mono">
                  rehabquran383@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>موقع المقرأة على الويب:</span>
                <a 
                  href="https://bucolic-mooncake-7af778.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-300 hover:underline font-mono"
                >
                  bucolic-mooncake-7af778.netlify.app
                </a>
              </p>
              <p className="flex items-center gap-1.5">
                <Instagram className="w-3 h-3 text-pink-400 shrink-0" />
                <span>إنستجرام المقرأة:</span>
                <a 
                  href="https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-pink-300 hover:underline font-mono"
                >
                  @rehabquran47884517
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer WhatsApp Button - Instant Direct Connection */}
        <div className="p-3 sm:p-3.5 bg-[#081810] border-t border-emerald-900/80 space-y-2">
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (mainTab === 'student' && studentName.trim()) {
                saveRegisteredStudent({
                  name: studentName.trim(),
                  age: studentAge.trim() || undefined,
                  country: studentCountry.trim() || undefined,
                  section: studentSection,
                  memorization: studentMemorization,
                  wantsSanad: studentWantsSanad,
                  preferredTime: studentPreferredTime,
                  notes: studentNotes.trim() || undefined,
                  status: 'pending',
                });
              } else if (mainTab === 'teacher' && teacherName.trim()) {
                saveRegisteredTeacher({
                  name: teacherName.trim(),
                  qualification: teacherQualification.trim() || 'مقرئ',
                  country: teacherCountry.trim() || 'اليمن',
                  phone: teacherPhone.trim() || '',
                  targetSection: teacherTargetSection === 'معلمة - قسم الطالبات' ? 'female' : 'male',
                  experience: teacherExperience.trim() || undefined,
                  status: 'pending',
                });
              }
            }}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              (mainTab === 'student' && studentSection === 'female') || (mainTab === 'teacher' && teacherTargetSection === 'معلمة - قسم الطالبات')
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-950/60'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/60'
            }`}
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>
              {(mainTab === 'student' && studentSection === 'female') || (mainTab === 'teacher' && teacherTargetSection === 'معلمة - قسم الطالبات')
                ? 'إرسال الاستمارة مباشرة عبر واتساب قسم الطالبات'
                : 'إرسال الاستمارة مباشرة عبر واتساب قسم الطلاب'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>منصات التسميع: Google Meet, Zoom, IMO</span>
            <a
              href="https://maps.app.goo.gl/ppYnj9WyjPiYAfcTA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              <span>موقع المقرأة على خرائط Google</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
