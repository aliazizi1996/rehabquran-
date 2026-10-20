import React, { useState, useEffect } from 'react';
import { getBrandLogoSettings } from '../utils/brandLogoStore';
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  FileText,
  Briefcase,
  Check,
  ExternalLink
} from 'lucide-react';
import { 
  createNewStudentAccount, 
  createNewTeacherAccount, 
  DbStudent, 
  DbUser, 
  DbTeacher 
} from '../data/academyDb';
import { 
  saveRegisteredStudent, 
  saveRegisteredTeacher 
} from '../data/registrationStore';
import { AuthAccount } from '../types';
import { registerNewUser, formatPhoneToStudentEmail } from '../lib/authService';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { submitStudentApplicationToFirestore } from '../services/studentApplicationService';
import { COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';
import { TeacherRegistrationView } from './TeacherRegistrationView';

export type RegistrationPortalMode = 'selection' | 'student_male' | 'student_female' | 'teacher';

interface RegistrationPortalViewProps {
  initialMode?: RegistrationPortalMode;
  onSuccessStudent: (account: AuthAccount, student: DbStudent) => void;
  onBackToHome: () => void;
  onSwitchToLogin: (role?: 'student' | 'teacher') => void;
}

export const RegistrationPortalView: React.FC<RegistrationPortalViewProps> = ({
  initialMode = 'selection',
  onSuccessStudent,
  onBackToHome,
  onSwitchToLogin,
}) => {
  const [currentMode, setCurrentMode] = useState<RegistrationPortalMode>(initialMode);

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // State for showGlobalAssemblyMembership (controlled by Supervisor)
  const [showGlobalAssembly, setShowGlobalAssembly] = useState(() => getBrandLogoSettings().showGlobalAssemblyMembership);

  useEffect(() => {
    const handleBrandUpdated = (e: any) => {
      setShowGlobalAssembly(e.detail?.showGlobalAssemblyMembership ?? getBrandLogoSettings().showGlobalAssemblyMembership);
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdated);
    return () => window.removeEventListener('brand_logo_updated', handleBrandUpdated);
  }, []);

  // Student Form State (Both male & female)
  const [studentName, setStudentName] = useState('');
  const [studentContact, setStudentContact] = useState(''); // Email or Phone
  const [studentWhatsapp, setStudentWhatsapp] = useState(''); // رقم واتساب الطالب للتواصل والقبول
  const [studentCountryCode, setStudentCountryCode] = useState('967'); // رمز الدولة المعتمد (اليمن +967 افتراضياً)
  const [studentPassword, setStudentPassword] = useState('');
  const [studentCountryCity, setStudentCountryCity] = useState('');
  const [studentAge, setStudentAge] = useState<number | ''>('');
  const [studentMemorization, setStudentMemorization] = useState('مبتدئ (من الفاتحة وقصار السور)');
  const [studentStudyType, setStudentStudyType] = useState<'foundation' | 'memorization' | 'review' | 'consolidation' | 'sanad'>('memorization');
  
  // 1. الرواية القرآنية
  const [studentRiwayah, setStudentRiwayah] = useState('حفص عن عاصم');
  const [studentCustomRiwayah, setStudentCustomRiwayah] = useState('');
  const [studentMonthlyContribution, setStudentMonthlyContribution] = useState('نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)');

  // 2. الوقت المناسب للحصة
  const [studentPreferredTime, setStudentPreferredTime] = useState('الصباح');
  const [studentCustomTime, setStudentCustomTime] = useState('');
  const [studentTimeFrom, setStudentTimeFrom] = useState('');
  const [studentTimeTo, setStudentTimeTo] = useState('');

  // Student Submission Success Notice (Pending Review)
  const [studentSubmittedSuccess, setStudentSubmittedSuccess] = useState(false);
  const [submittedStudentInfo, setSubmittedStudentInfo] = useState<{
    name: string;
    section: 'male' | 'female';
    whatsapp: string;
    studyType: string;
    applicationId: string;
  } | null>(null);

  // Reset errors when changing view mode
  const handleSelectMode = (mode: RegistrationPortalMode) => {
    setError(null);
    setShowPassword(false);
    setCurrentMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Student Registration Submission (Male or Female)
  const handleStudentSubmit = async (e: React.FormEvent, gender: 'male' | 'female') => {
    e.preventDefault();
    setError(null);

    if (!studentName.trim()) {
      setError('يرجى إدخال الاسم الكامل الثلاثي.');
      return;
    }
    if (!studentAge || Number(studentAge) < 4 || Number(studentAge) > 99) {
      setError('يرجى إدخال العمر بشكل صحيح (بين 4 و 99 سنة).');
      return;
    }
    if (!studentCountryCity.trim()) {
      setError('يرجى إدخال الدولة والمدينة (مثال: اليمن - صنعاء).');
      return;
    }
    if (!studentContact.trim()) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
      return;
    }
    if (!studentWhatsapp.trim()) {
      setError('يرجى إدخال رقم واتساب الطالب لتلقي بيانات الحساب وإشعار القبول.');
      return;
    }
    if (!studentPassword || studentPassword.length < 6) {
      setError('يرجى كتابة كلمة مرور تتكون من 6 خانات على الأقل.');
      return;
    }
    if (studentRiwayah === 'رواية أخرى' && !studentCustomRiwayah.trim()) {
      setError('يرجى كتابة اسم الرواية القرآنية المطلوبة.');
      return;
    }
    if (studentPreferredTime === 'وقت آخر' && !studentCustomTime.trim()) {
      setError('يرجى تحديد الوقت المناسب لك للحصة.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isEmail = studentContact.includes('@');
      const cleanPhone = isEmail ? studentWhatsapp.trim() : (studentContact.trim() || studentWhatsapp.trim());
      const effectiveRiwayah = studentRiwayah === 'رواية أخرى' ? studentCustomRiwayah.trim() : studentRiwayah;
      const effectiveTimePeriod = studentPreferredTime === 'وقت آخر' ? studentCustomTime.trim() : studentPreferredTime;
      const detailedTimeStr = (studentTimeFrom.trim() || studentTimeTo.trim())
        ? `من الساعة ${studentTimeFrom.trim() || '...'} إلى الساعة ${studentTimeTo.trim() || '...'}`
        : '';

      // 1. تحويل رقم الهاتف أو البريد إلى بريد المصادقة الرسمي
      // إذا استخدم رقم الهاتف، نحوله داخلياً إلى بريد وهمي: {phone}@student.rehabquran.com
      const emailToUse = isEmail
        ? studentContact.trim().toLowerCase()
        : formatPhoneToStudentEmail(cleanPhone);

      // 2. استخدام Firebase Authentication (createUserWithEmailAndPassword) لحفظ كلمة المرور بأمان
      let authUid = '';
      try {
        const cred = await createUserWithEmailAndPassword(auth, emailToUse, studentPassword.trim());
        authUid = cred.user.uid;
        if (studentName.trim()) {
          await updateProfile(cred.user, { displayName: studentName.trim() }).catch(() => {});
        }
      } catch (authErr: any) {
        if (authErr?.code === 'auth/email-already-in-use') {
          setError('البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً في المقرأة. يمكنك تسجيل الدخول مباشرة أو طلب استعادة كلمة المرور.');
          setIsSubmitting(false);
          return;
        }
        if (authErr?.code === 'auth/weak-password') {
          setError('كلمة المرور ضعيفة. يرجى اختيار كلمة مرور تتكون من 6 خانات أو أكثر.');
          setIsSubmitting(false);
          return;
        }
        throw authErr;
      }

      const now = new Date().toISOString();

      // 3. احفظ في Firestore فقط: الاسم، البريد، رقم الهاتف، الدور (student)، وحالة الطلب (pending)
      // مع منع تخزين أي كلمة مرور كنص واضح إطلاقاً
      if (authUid) {
        try {
          await setDoc(doc(db, 'users', authUid), {
            id: authUid,
            name: studentName.trim(),
            fullName: studentName.trim(),
            email: emailToUse,
            phone: cleanPhone || studentWhatsapp.trim(),
            role: 'student',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
          });
        } catch (userFsErr) {
          console.warn('[Firestore] Notice: saving to users collection skipped/fallback:', userFsErr);
        }
      }

      // 4. حفظ استمارة التسجيل في student_applications بدون أي كلمة مرور
      const savedApplication = await submitStudentApplicationToFirestore({
        userId: authUid,
        email: emailToUse,
        fullName: studentName.trim(),
        gender,
        age: Number(studentAge) || 18,
        phone: cleanPhone || studentWhatsapp.trim(),
        whatsapp: studentWhatsapp.trim(),
        country: studentCountryCity.trim(),
        memorization: studentMemorization,
        studyType: studyTypeToArabic(studentStudyType),
        riwayah: effectiveRiwayah,
        preferredTime: effectiveTimePeriod,
        preferredTimeDetail: detailedTimeStr,
        monthlyContribution: studentMonthlyContribution,
        notes: [
          `نوع الدراسة: ${studyTypeToArabic(studentStudyType)}`,
          `الرواية: ${effectiveRiwayah}`,
          `الوقت المناسب: ${effectiveTimePeriod}${detailedTimeStr ? ` (${detailedTimeStr})` : ''}`,
          `المستوى: ${studentMemorization}`,
          `وسيلة الاتصال: ${studentContact.trim()}`
        ].join(' - '),
      });

      // إظهار شاشة استلام الطلب وتأكيد المراجعة للمستخدم
      setSubmittedStudentInfo({
        name: studentName.trim(),
        section: gender,
        whatsapp: studentWhatsapp.trim(),
        studyType: studyTypeToArabic(studentStudyType),
        applicationId: savedApplication.id,
      });
      setStudentSubmittedSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.warn('[Student Registration Notice]:', err?.message || err);
      setError(err?.message || 'حدث خطأ أثناء إرسال طلب التسجيل، يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
      setIsSubmitting(false);
    }
  };


  const studyTypeToArabic = (type: string) => {
    switch (type) {
      case 'foundation': return 'تأسيس في القرآن الكريم';
      case 'memorization': return 'تحفيظ القرآن الكريم';
      case 'review': return 'مراجعة الحفظ';
      case 'consolidation': return 'تثبيت الحفظ';
      case 'sanad': return 'إجازة بالسند';
      default: return type;
    }
  };

  // ================= 1. THE MAIN SELECTION VIEW (3 SECTIONS) =================
  if (currentMode === 'selection') {
    return (
      <div className="w-full text-slate-800 font-sans flex flex-col py-6 select-none" dir="rtl">
        <div className="max-w-4xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight font-serif">
              استمارة التسجيل في المقرأة
            </h1>
            {showGlobalAssembly && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xs font-bold text-[#046A38] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  عضو التجمع العالمي للقرآن الكريم
                </span>
              </div>
            )}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed font-sans">
              اختر القسم المناسب لتعبئة بيانات الالتحاق بحلقات القرآن الكريم عن بُعد وعرض القراءة لنيل الإجازة على يد الشيخ المجيز بالسند المتصل
            </p>

            {/* شريط الدخول السريع */}
            <div className="pt-2 flex items-center justify-center">
              <div className="bg-[#F9F6F0] border border-[#C5A059]/60 px-4 py-2 rounded-xl text-slate-700 flex items-center gap-2 text-xs sm:text-sm">
                <span>لديك حساب مسجل بالفعل؟</span>
                <button
                  type="button"
                  onClick={() => onSwitchToLogin('student')}
                  className="font-bold text-[#046A38] hover:underline underline-offset-4 cursor-pointer"
                >
                  تسجيل الدخول مباشرة ←
                </button>
              </div>
            </div>
          </div>

          {/* 3 Main Realistic Cards (No AI slop pills) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: تسجيل طالب (بنين) */}
            <div
              onClick={() => handleSelectMode('student_male')}
              className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-[#046A38] hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group space-y-5"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 text-[#046A38] group-hover:bg-[#046A38] group-hover:text-white transition-colors flex items-center justify-center font-bold text-2xl border border-emerald-200">
                  👦
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#046A38] block">حلقات البنين والرجال</span>
                  <h2 className="text-xl font-bold text-slate-900 font-serif group-hover:text-[#046A38] transition-colors">
                    تسجيل طالب (بنين)
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  لحفظ وضبط وتجويد القرآن الكريم في حلقات مخصصة للأشبال والشباب والرجال بإشراف نخبة من مشايخ المقرأة المجازين بالقراءات.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-[#046A38] group-hover:bg-[#03542c] text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>فتح استمارة تسجيل الطالب</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>

            {/* Card 2: تسجيل طالبة (أخوات) */}
            <div
              onClick={() => handleSelectMode('student_female')}
              className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-teal-700 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group space-y-5"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-800 group-hover:bg-teal-800 group-hover:text-white transition-colors flex items-center justify-center font-bold text-2xl border border-teal-200">
                  🧕
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-teal-800 block">حلقات الفتيات والنساء</span>
                  <h2 className="text-xl font-bold text-slate-900 font-serif group-hover:text-teal-900 transition-colors">
                    تسجيل طالبة (أخوات)
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  لحفظ وتصحيح التلاوة في بيئة تعليمية خاصة ومستقلة تماماً بإشراف معلمات ومقرئات مجازات في القراءات العشر بأوقات مرنة.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-teal-800 group-hover:bg-teal-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>فتح استمارة تسجيل الطالبة</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>

            {/* Card 3: تسجيل معلم */}
            <div
              onClick={() => handleSelectMode('teacher')}
              className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-amber-700 hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer group space-y-5"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-800 group-hover:bg-amber-800 group-hover:text-white transition-colors flex items-center justify-center font-bold text-2xl border border-amber-200">
                  📜
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 block">كادر التدريس والإقراء</span>
                  <h2 className="text-xl font-bold text-slate-900 font-serif group-hover:text-amber-900 transition-colors">
                    تسجيل معلم / مقرئ
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  للانضمام إلى كادر المشايخ والمعلمين بالمقرأة للتدريس والإقراء بالسند المتصل (يخضع لمراجعة واعتماد الإدارة).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-amber-800 group-hover:bg-amber-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>تقديم طلب انضمام كمعلم</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ================= 1.5. STUDENT SUBMISSION SUCCESS (PENDING REVIEW) =================
  if (studentSubmittedSuccess && submittedStudentInfo) {
    const isFemale = submittedStudentInfo.section === 'female';
    const sectionBadge = isFemale ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)';

    return (
      <div className="min-h-screen bg-[#F9F6F0] text-slate-800 font-sans flex flex-col justify-center px-4 py-8" dir="rtl">
        <div className="max-w-lg w-full mx-auto bg-white rounded-3xl p-7 sm:p-9 border-2 border-[#C5A059]/60 shadow-xl text-center space-y-6 animate-scale-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#046A38] border-2 border-emerald-300 mx-auto flex items-center justify-center font-bold text-2xl shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-[#046A38]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 inline-block border border-amber-200">
              طلب تسجيل قيد المراجعة والاعتماد
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
              تم استلام طلب تسجيلك بنجاح!
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              أهلاً بك <strong>{submittedStudentInfo.name}</strong> في مقرأة رحاب القرآن الإلكترونية. تم حفظ بيانات تسجيلك في النظام بنجاح والطلب الآن معروض في لوحة المشرف للمراجعة.
            </p>
          </div>

          {/* Details Box */}
          <div className="bg-[#F9F6F0] border border-[#C5A059]/40 rounded-2xl p-5 text-right space-y-3 text-xs sm:text-sm text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">الرقم المرجعي للطلب:</span>
              <strong className="font-mono text-emerald-950 font-bold">{submittedStudentInfo.applicationId}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">القسم المختار:</span>
              <strong className="text-slate-900 font-bold">{sectionBadge}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">رقم واتساب الطالب:</span>
              <strong className="text-slate-900 font-mono" dir="ltr">{submittedStudentInfo.whatsapp}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500">المسار القرآني:</span>
              <strong className="text-[#046A38] font-bold">{submittedStudentInfo.studyType}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">حالة الطلب:</span>
              <strong className="text-amber-800 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>قيد المراجعة والاعتماد من الشيخ المجيز</span>
              </strong>
            </div>
          </div>

          {/* Notice about WhatsApp Acceptance notification */}
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed text-right flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>ماذا بعد؟</strong> سيقوم الشيخ المجيز وإدارة شؤون الحلقات بمراجعة طلبك وتحديد حلقتك المناسبة. ستصلك رسالة عبر تطبيق <strong>واتساب</strong> برقمك الأكاديمي ورابط تسجيل الدخول فور قبول الطلب.
            </span>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={onBackToHome}
              className="w-full py-3.5 bg-[#046A38] hover:bg-[#03582e] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm border border-[#C5A059]"
            >
              العودة إلى الصفحة الرئيسية
            </button>
            <button
              onClick={() => onSwitchToLogin('student')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              الانتقال لصفحة تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. TEACHER REGISTRATION VIEW =================
  if (currentMode === 'teacher') {
    return (
      <div className="py-4">
        <TeacherRegistrationView
          onBackToHome={() => {
            if (initialMode !== 'selection') {
              onBackToHome();
            } else {
              handleSelectMode('selection');
            }
          }}
          onSwitchToLogin={() => onSwitchToLogin('teacher')}
        />
      </div>
    );
  }

  // ================= 4. STUDENT REGISTRATION FORM (MALE OR FEMALE) =================
  const isFemale = currentMode === 'student_female';
  const themeColor = isFemale ? 'teal' : 'emerald';
  const titleText = isFemale ? 'تسجيل طالبة جديدة (قسم البنات)' : 'تسجيل طالب جديد (قسم البنين)';
  const subtitleText = isFemale
    ? 'سجّلي بياناتك للانضمام إلى حلقات الطالبات بإشراف معلمات ومقرئات مجازات'
    : 'سجّل بياناتك للانضمام إلى حلقات القرآن الكريم بإشراف مشايخ المقرأة المعتمدين';

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-slate-800 font-sans flex flex-col justify-center px-4 py-8 select-none" dir="rtl">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 text-right">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button
            onClick={() => {
              if (initialMode !== 'selection') {
                onBackToHome();
              } else {
                handleSelectMode('selection');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-900 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            isFemale 
              ? 'bg-teal-50 text-teal-800 border-teal-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {isFemale ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)'}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {titleText}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {subtitleText}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleStudentSubmit(e, isFemale ? 'female' : 'male')} className="space-y-4 text-xs sm:text-sm">
          
          {/* ================= القسم الأول: البيانات الشخصية والأساسية ================= */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isFemale ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                ١
              </span>
              <span>البيانات الشخصية والأساسية</span>
            </div>

            {/* الاسم الكامل */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                الاسم الكامل {isFemale ? 'للطالبة' : 'للطالب'} <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder={isFemale ? "مثال: مريم خالد الزبيدي" : "مثال: عمر عبدالرحمن الوصابي"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
              />
            </div>

            {/* الدولة والمدينة + العمر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  الدولة والمدينة <span className="text-red-500 font-normal">* (إلزامي)</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentCountryCity}
                  onChange={(e) => setStudentCountryCity(e.target.value)}
                  placeholder="مثال: اليمن - صنعاء / السعودية - مكة"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  العمر (بالسنوات) <span className="text-red-500 font-normal">* (إلزامي)</span>
                </label>
                <input
                  type="number"
                  required
                  min={4}
                  max={99}
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 19"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* ================= القسم الثاني: بيانات الدخول والتواصل ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isFemale ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                ٢
              </span>
              <span>بيانات الدخول والتواصل</span>
            </div>

            {/* البريد الإلكتروني أو رقم الهاتف */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                البريد الإلكتروني أو رقم الهاتف <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <input
                type="text"
                required
                value={studentContact}
                onChange={(e) => setStudentContact(e.target.value)}
                placeholder="009677... أو name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                يُستخدم كرقم دخول أو اسم مستخدم للحساب وتلقي روابط الحلقات والإشعارات
              </span>
            </div>

            {/* رقم واتساب الطالب مع اختيار رمز الدولة */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                رقم واتساب الطالب <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <div className="flex gap-2">
                <div className="w-32 sm:w-44 shrink-0">
                  <select
                    value={studentCountryCode}
                    onChange={(e) => setStudentCountryCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-slate-800 focus:outline-none focus:border-emerald-700 focus:bg-white text-xs font-medium cursor-pointer"
                    title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                  >
                    {COUNTRY_DIAL_CODES.map((c) => (
                      <option key={c.iso} value={c.dialCode}>
                        {c.flag} {c.nameAr} {c.dialCode ? `(+${c.dialCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="tel"
                    required
                    value={studentWhatsapp}
                    onChange={(e) => setStudentWhatsapp(e.target.value)}
                    placeholder="مثال: 713801916 أو 0713801916"
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm font-mono text-left"
                  />
                </div>
              </div>
              {studentWhatsapp.trim() && (() => {
                const preview = validateAndCleanWhatsAppNumber(studentWhatsapp, studentCountryCode);
                return (
                  <div className="mt-1 flex items-center justify-between text-[11px] px-1">
                    <span className="text-slate-400">الصيغة الدولية المعتمدة للإرسال:</span>
                    <span className={`font-mono font-bold ${preview.isValid ? 'text-emerald-700' : 'text-amber-600'}`} dir="ltr">
                      {preview.isValid ? preview.formattedDisplay : 'يرجى إكمال الرقم'}
                    </span>
                  </div>
                );
              })()}
              <span className="text-[11px] text-slate-400 block mt-1">
                سيتم إرسال إشعار القبول الرسمي وبيانات الدخول عبر رسالة واتساب على هذا الرقم فور مراجعة واعتماد الطلب
              </span>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                كلمة المرور <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="كلمة مرور للدخول إلى حسابك (4 خانات فأكثر)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* ================= القسم الثالث: المسار القرآني المطلوب ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isFemale ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                ٣
              </span>
              <span>المسار القرآني ونوع الدراسة</span>
            </div>

            {/* نوع الدراسة: 5 خيارات */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                نوع الدراسة المناسب لك <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'foundation', title: 'تأسيس في القرآن الكريم', desc: 'تلقين ومخارج الحروف وتصحيح التلاوة' },
                  { id: 'memorization', title: 'تحفيظ القرآن الكريم', desc: 'حفظ جديد مع جدول متابعة وتسميع يومي' },
                  { id: 'review', title: 'مراجعة الحفظ', desc: 'مراجعة الأجزاء المحفوظة وضبط المتشابهات' },
                  { id: 'consolidation', title: 'تثبيت الحفظ', desc: 'تمكين الحفظ وإتقان الأداء والتجويد' },
                  { id: 'sanad', title: 'إجازة بالسند', desc: 'عرض وإقراء بالسند المتصل إلى النبي ﷺ' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStudentStudyType(item.id as any)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      item.id === 'sanad' ? 'sm:col-span-2' : ''
                    } ${
                      studentStudyType === item.id
                        ? isFemale 
                          ? 'bg-teal-50 border-teal-700 text-teal-950 ring-1 ring-teal-700/30 shadow-xs' 
                          : 'bg-emerald-50 border-emerald-700 text-emerald-950 ring-1 ring-emerald-700/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">{item.title}</span>
                      {studentStudyType === item.id && (
                        <Check className={`w-3.5 h-3.5 ${isFemale ? 'text-teal-700' : 'text-emerald-700'}`} />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* الرواية القرآنية */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                الرواية التي يرغب {isFemale ? 'الطالبة' : 'الطالب'} في تعلمها <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <select
                value={studentRiwayah}
                onChange={(e) => setStudentRiwayah(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
              >
                <option value="حفص عن عاصم">حفص عن عاصم</option>
                <option value="ورش عن نافع">ورش عن نافع</option>
                <option value="قالون عن نافع">قالون عن نافع</option>
                <option value="شعبة عن عاصم">شعبة عن عاصم</option>
                <option value="رواية أخرى">رواية أخرى</option>
              </select>

              {studentRiwayah === 'رواية أخرى' && (
                <div className="mt-2 animate-fadeIn">
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    اكتب الرواية المطلوبة بالتفصيل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCustomRiwayah}
                    onChange={(e) => setStudentCustomRiwayah(e.target.value)}
                    placeholder="مثال: الدوري عن أبي عمرو / السوسي / قنبل عن ابن كثير..."
                    className="w-full bg-amber-50/60 border border-amber-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>

            {/* مستوى الحفظ */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                مستوى الحفظ الحالي <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <select
                value={studentMemorization}
                onChange={(e) => setStudentMemorization(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-emerald-700 focus:bg-white transition-all text-xs sm:text-sm"
              >
                <option value="مبتدئ (من الفاتحة وقصار السور)">مبتدئ (من الفاتحة وقصار السور)</option>
                <option value="جزء عم وتبارك (1 إلى 2 أجزاء)">جزء عم وتبارك (1 إلى 2 أجزاء)</option>
                <option value="من 3 إلى 5 أجزاء">من 3 إلى 5 أجزاء</option>
                <option value="من 6 إلى 10 أجزاء">من 6 إلى 10 أجزاء</option>
                <option value="من 11 إلى 15 جزءاً">من 11 إلى 15 جزءاً</option>
                <option value="من 16 إلى 20 جزءاً">من 16 إلى 20 جزءاً</option>
                <option value="أكثر من 20 جزءاً">أكثر من 20 جزءاً</option>
                <option value="خاتم لكتاب الله كاملاً (مراجعة وإتقان)">خاتم لكتاب الله كاملاً (مراجعة وإتقان)</option>
              </select>
            </div>
          </div>

          {/* ================= القسم الرابع: موعد وأوقات الحصص ================= */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isFemale ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                ٤
              </span>
              <span>الوقت المناسب للدراسة والحصص</span>
            </div>

            {/* الوقت المناسب للحصة */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">
                الوقت المناسب للحصة <span className="text-red-500 font-normal">* (إلزامي)</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {[
                  { id: 'الصباح', label: 'الصباح' },
                  { id: 'الظهر', label: 'الظهر' },
                  { id: 'العصر', label: 'العصر' },
                  { id: 'المغرب', label: 'المغرب' },
                  { id: 'العشاء', label: 'العشاء' },
                  { id: 'وقت آخر', label: 'وقت آخر' },
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setStudentPreferredTime(slot.id)}
                    className={`py-2 px-1.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      studentPreferredTime === slot.id
                        ? isFemale
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>

              {studentPreferredTime === 'وقت آخر' && (
                <div className="mt-1 animate-fadeIn">
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    حدد الوقت المناسب لك للحصة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCustomTime}
                    onChange={(e) => setStudentCustomTime(e.target.value)}
                    placeholder="مثال: بعد صلاة الفجر / متأخر في الليل / الجمعة والسبت..."
                    className="w-full bg-amber-50/60 border border-amber-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-all text-xs sm:text-sm"
                  />
                </div>
              )}

              {/* حقل اختياري لتحديد الوقت بالتفصيل */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2 mt-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">تحديد الوقت بالتفصيل (اختياري)</span>
                  <span className="text-[11px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md font-normal">اختياري</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">من الساعة:</label>
                    <input
                      type="text"
                      value={studentTimeFrom}
                      onChange={(e) => setStudentTimeFrom(e.target.value)}
                      placeholder="مثال: 05:30 ص أو 4:00 م"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">إلى الساعة:</label>
                    <input
                      type="text"
                      value={studentTimeTo}
                      onChange={(e) => setStudentTimeTo(e.target.value)}
                      placeholder="مثال: 06:30 ص أو 5:30 م"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= الخيار قبل الأخير: رسوم المساهمة الشهرية ================= */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 space-y-1.5">
            <label className="block text-slate-900 font-bold text-xs leading-relaxed">
              هل تستطيع دفع مساهمة شهرية مبلغ بسيط قدره 3000 ريال يمني قديم أو ما يعادلها من خارج اليمن؟ <span className="text-amber-700">*</span>
            </label>
            <select
              value={studentMonthlyContribution}
              onChange={(e) => setStudentMonthlyContribution(e.target.value)}
              className="w-full bg-white border border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-amber-600"
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
            <p className="text-[11px] text-amber-800 leading-normal">
              💡 المساهمة الرمزية تدعم استمرارية الحلقات ورواتب المعلمين والمعلمات، ولا يُحرم أي راغب في العلم لعدم الاستطاعة.
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                isFemale
                  ? 'bg-teal-800 hover:bg-teal-900 active:bg-teal-950'
                  : 'bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950'
              }`}
            >
              {isSubmitting ? (
                <span>جاري إنشاء الحساب وتخصيص الحلقة...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إتمام التسجيل والدخول للحلقات</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Switch to login */}
        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={() => onSwitchToLogin('student')}
            className="text-xs text-slate-500 hover:text-emerald-900 transition-colors cursor-pointer"
          >
            لديك حساب طالب مسجل بالفعل؟ <strong className="text-emerald-900 underline underline-offset-4">تسجيل دخول الطلاب</strong>
          </button>
        </div>

      </div>
    </div>
  );
};
