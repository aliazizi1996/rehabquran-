import React, { useState, useEffect } from 'react';
import { 
  User, UserPlus, Phone, BookOpen, GraduationCap, MapPin, Clock, 
  CheckCircle2, AlertCircle, Copy, Check, MessageCircle, ArrowRight, 
  ShieldCheck, Eye, EyeOff, Key, Sparkles, LogIn, Lock, Shield, 
  Heart, Loader2, ChevronLeft, ArrowLeft, Info, X, Award, FileText, Menu, Instagram, Headphones
} from 'lucide-react';
import { AuthAccount } from '../types';
import { ActiveTab } from './Navigation';
import { 
  authenticateUser, 
  authenticateSupervisorPassword,
  registerNewAccount, 
  GENERAL_SUPERVISOR_ACCOUNT
} from '../data/authStore';
import { 
  saveRegisteredStudent, 
  saveRegisteredTeacher, 
  RegisteredStudent, 
  RegisteredTeacher 
} from '../data/registrationStore';
import { OfficialLogo } from './OfficialLogo';
import { getBrandLogoSettings } from '../utils/brandLogoStore';

interface WelcomeScreenProps {
  onEnterApp: (account: AuthAccount, targetTab?: ActiveTab) => void;
  onExploreAsGuest: () => void;
  onOpenQuranAudio?: () => void;
  onOpenPublicPortal?: () => void;
  onOpenAcademicPortal?: () => void;
}

// Three main categories requested by user: (المعلمون)، (قسم الطلاب - بنين)، (قسم الطالبات - أخوات)
export type PortalCategory = 'teachers' | 'male_students' | 'female_students';

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterApp,
  onExploreAsGuest,
  onOpenQuranAudio,
  onOpenPublicPortal,
  onOpenAcademicPortal,
}) => {
  // Current view mode: null for clean home screen, or specific category for registration, or login
  const [activeView, setActiveView] = useState<'home' | 'teachers' | 'male_students' | 'female_students' | 'login'>('home');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // State for showGlobalAssemblyMembership (controlled by Supervisor)
  const [showGlobalAssembly, setShowGlobalAssembly] = useState(() => getBrandLogoSettings().showGlobalAssemblyMembership);

  useEffect(() => {
    const handleBrandUpdated = (e: any) => {
      setShowGlobalAssembly(e.detail?.showGlobalAssemblyMembership ?? getBrandLogoSettings().showGlobalAssemblyMembership);
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdated);
    return () => window.removeEventListener('brand_logo_updated', handleBrandUpdated);
  }, []);

  // ==================== FORM STATES ====================

  // 1. Male Student State
  const [maleName, setMaleName] = useState('');
  const [malePhone, setMalePhone] = useState('');
  const [maleAge, setMaleAge] = useState('');
  const [maleCountry, setMaleCountry] = useState('اليمن');
  const [maleMemorization, setMaleMemorization] = useState('5 أجزاء');
  const [maleWantsSanad, setMaleWantsSanad] = useState<'نعم' | 'لا'>('نعم');
  const [maleRiwayah, setMaleRiwayah] = useState('حفص عن عاصم');
  const [malePreferredTime, setMalePreferredTime] = useState('فجراً بعد صلاة الفجر (5:00 ص - 6:30 ص)');
  const [maleMonthlyContribution, setMaleMonthlyContribution] = useState('نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)');
  const [malePassword, setMalePassword] = useState('');
  const [maleNotes, setMaleNotes] = useState('');
  const [showMalePassword, setShowMalePassword] = useState(false);

  // 2. Female Student State
  const [femaleName, setFemaleName] = useState('');
  const [femalePhone, setFemalePhone] = useState('');
  const [femaleAge, setFemaleAge] = useState('');
  const [femaleCountry, setFemaleCountry] = useState('اليمن');
  const [femaleMemorization, setFemaleMemorization] = useState('5 أجزاء');
  const [femaleWantsSanad, setFemaleWantsSanad] = useState<'نعم' | 'لا'>('نعم');
  const [femaleRiwayah, setFemaleRiwayah] = useState('حفص عن عاصم');
  const [femalePreferredTime, setFemalePreferredTime] = useState('عصراً (4:00 م - 6:00 م)');
  const [femaleMonthlyContribution, setFemaleMonthlyContribution] = useState('نعم، أستطيع المساهمة شهرياً لدعم المقرأة (3000 ريال يمني قديم أو ما يعادلها)');
  const [femalePassword, setFemalePassword] = useState('');
  const [femaleNotes, setFemaleNotes] = useState('');
  const [showFemalePassword, setShowFemalePassword] = useState(false);

  // 3. Teacher State
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherQualification, setTeacherQualification] = useState('');
  const [teacherCountry, setTeacherCountry] = useState('اليمن');
  const [teacherTargetSection, setTeacherTargetSection] = useState<'male' | 'female'>('male');
  const [teacherExperience, setTeacherExperience] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // General Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Informational Modals (About & Courses from landing page)
  const [infoModal, setInfoModal] = useState<'about' | 'courses' | null>(null);

  // General Supervisor Secret Modal
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supervisorSecretPassword, setSupervisorSecretPassword] = useState('');
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);
  const [supervisorError, setSupervisorError] = useState<string | null>(null);
  const [supervisorSuccess, setSupervisorSuccess] = useState<string | null>(null);
  const [isSupervisorVerifying, setIsSupervisorVerifying] = useState(false);

  // Form Submitting & Error feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Success Admission Confirmation State
  const [admissionSuccess, setAdmissionSuccess] = useState<{
    account: AuthAccount;
    rawPassword: string;
    studentInfo?: RegisteredStudent;
    teacherInfo?: RegisteredTeacher;
    assignedSupervisor: string;
    supervisorPhone: string;
  } | null>(null);

  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Official Administration WhatsApp & Call Contacts
  const MAIN_WHATSAPP_PHONE = '967714371599';
  const MAIN_WHATSAPP_DISPLAY = '+967 714 371 599';
  const MAIN_CALL_PHONE = '0967713801916';
  const MAIN_CALL_DISPLAY = '0967713801916 (+967 713 801 916)';
  const INSTAGRAM_URL = 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4';
  const INSTAGRAM_HANDLE = '@rehabquran47884517';

  const MALE_PHONE = '967714371599';
  const MALE_DISPLAY = '+967 714 371 599 (اتصال: 0967713801916)';
  const MALE_SUPERVISOR = 'إدارة قسم الطلاب (بنين)';

  const FEMALE_PHONE = '967711607573';
  const FEMALE_DISPLAY = '+967 711 607 573';
  const FEMALE_SUPERVISOR = 'إدارة قسم الطالبات (أخوات)';

  // Open Direct WhatsApp Inquiry
  const handleOpenGeneralWhatsApp = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،\nمراسلة مقرأة رحاب القرآن الإلكترونية لتعليم القرآن الكريم عن بعد عبر واتساب 📖✨`;
    window.open(`https://wa.me/${MAIN_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Direct Phone Call
  const handleDirectCall = () => {
    window.open(`tel:${MAIN_CALL_PHONE}`, '_self');
  };

  // Generate WhatsApp text for Male Student
  const generateMaleStudentWhatsApp = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `طلب انضمام وتسجيل في *مقرأة رحاب القرآن الإلكترونية* 📖✨\n\n`;
    msg += `• *نوع الطلب:* تسجيل طالب جديد\n`;
    msg += `• *القسم:* قسم الطلاب (بنين) 👦\n`;
    msg += `• *الاسم الكريم:* ${maleName.trim() || 'طالب جديد'}\n`;
    msg += `• *رقم الهاتف / الواتساب:* ${malePhone.trim() || 'لم يحدد'}\n`;
    if (maleAge.trim()) msg += `• *العمر:* ${maleAge.trim()} سنة\n`;
    if (maleCountry.trim()) msg += `• *البلد:* ${maleCountry.trim()}\n`;
    msg += `• *مقدار الحفظ:* ${maleMemorization}\n`;
    msg += `• *الرواية القرآنية:* ${maleRiwayah}\n`;
    msg += `• *الرغبة في الإجازة بالسند:* ${maleWantsSanad}\n`;
    msg += `• *الوقت المفضل:* ${malePreferredTime}\n`;
    msg += `• *المساهمة الشهرية (3000 ريال يمني أو ما يعادلها):* ${maleMonthlyContribution}\n`;
    if (maleNotes.trim()) msg += `• *ملاحظات:* ${maleNotes.trim()}\n`;
    msg += `\nأرجو قبول انضمامي لحلقات قسم الطلاب وتوجيهي للحلقة المناسبة، جزاكم الله خيراً.`;
    return msg;
  };

  // Generate WhatsApp text for Female Student
  const generateFemaleStudentWhatsApp = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `طلب انضمام وتسجيل في *مقرأة رحاب القرآن الإلكترونية* 📖✨\n\n`;
    msg += `• *نوع الطلب:* تسجيل طالبة جديدة\n`;
    msg += `• *القسم:* قسم الطالبات (أخوات) 🧕\n`;
    msg += `• *الاسم الكريمة:* ${femaleName.trim() || 'طالبة جديدة'}\n`;
    msg += `• *رقم الهاتف / الواتساب:* ${femalePhone.trim() || 'لم يحدد'}\n`;
    if (femaleAge.trim()) msg += `• *العمر:* ${femaleAge.trim()} سنة\n`;
    if (femaleCountry.trim()) msg += `• *البلد:* ${femaleCountry.trim()}\n`;
    msg += `• *مقدار الحفظ:* ${femaleMemorization}\n`;
    msg += `• *الرواية القرآنية:* ${femaleRiwayah}\n`;
    msg += `• *الرغبة في الإجازة بالسند:* ${femaleWantsSanad}\n`;
    msg += `• *الوقت المفضل:* ${femalePreferredTime}\n`;
    msg += `• *المساهمة الشهرية (3000 ريال يمني أو ما يعادلها):* ${femaleMonthlyContribution}\n`;
    if (femaleNotes.trim()) msg += `• *ملاحظات:* ${femaleNotes.trim()}\n`;
    msg += `\nأرجو قبول انضمامي لحلقات الأخوات وتوجيهي للمعلمة المناسبة، بارك الله فيكم.`;
    return msg;
  };

  // Generate WhatsApp text for Teacher
  const generateTeacherWhatsApp = () => {
    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `طلب انضمام كمعلم/مقرئ في *مقرأة رحاب القرآن الإلكترونية* 📖✨\n\n`;
    msg += `• *نوع الطلب:* انضمام كمعلم / معلمة\n`;
    msg += `• *الاسم الكريم:* ${teacherName.trim() || 'معلم جديد'}\n`;
    msg += `• *رقم الهاتف / الواتساب:* ${teacherPhone.trim() || 'لم يحدد'}\n`;
    msg += `• *القسم:* ${teacherTargetSection === 'female' ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)'}\n`;
    msg += `• *المؤهل القرآني والإجازات:* ${teacherQualification.trim() || 'لم يحدد'}\n`;
    if (teacherCountry.trim()) msg += `• *بلد الإقامة:* ${teacherCountry.trim()}\n`;
    if (teacherExperience.trim()) msg += `• *الخبرات السابقة:* ${teacherExperience.trim()}\n`;
    msg += `\nأرجو الاطلاع وقبول انضمامي إلى الكادر التعليمي للمقرأة، بارك الله في جهودكم.`;
    return msg;
  };

  // Submit Male Student Registration
  const handleMaleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!maleName.trim()) {
      setFormError('يرجى إدخال اسم الطالب كاملاً.');
      return;
    }

    if (!malePhone.trim() || malePhone.trim().length < 6) {
      setFormError('يرجى إدخال رقم هاتف أو واتساب صحيح للتواصل.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedStudent = saveRegisteredStudent({
        name: maleName.trim(),
        phone: malePhone.trim(),
        age: maleAge.trim() || undefined,
        country: maleCountry.trim() || 'اليمن',
        section: 'male',
        memorization: maleMemorization,
        wantsSanad: maleWantsSanad,
        riwayah: maleRiwayah,
        preferredTime: malePreferredTime,
        monthlyContribution: maleMonthlyContribution,
        notes: maleNotes.trim() || undefined,
        status: 'pending',
      });

      const cleanPhone = malePhone.trim().replace(/[\s+-]/g, '');
      const baseUsername = (maleName.trim().split(' ')[0] || 'student') + '_' + Math.floor(100 + Math.random() * 900);
      const rawPass = malePassword.trim() || (Math.random().toString(36).slice(-8) + Math.floor(10 + Math.random() * 90));

      const authRes = registerNewAccount({
        name: maleName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'student',
        section: 'male',
        memorization: maleMemorization,
      });

      const finalAccount: AuthAccount = authRes.account || {
        id: savedStudent.id,
        name: maleName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'student',
        section: 'male',
        titleBadge: 'طالب في قسم الطلاب (بنين)',
        assignedHalqaTitle: 'حلقة قسم الطلاب (الفجر)',
        registeredAt: new Date().toISOString().split('T')[0],
      };

      setAdmissionSuccess({
        account: finalAccount,
        rawPassword: rawPass,
        studentInfo: savedStudent,
        assignedSupervisor: MALE_SUPERVISOR,
        supervisorPhone: MALE_DISPLAY,
      });
    } catch (err: any) {
      setFormError(err?.message || 'حدث خطأ أثناء حفظ التسجيل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Female Student Registration
  const handleFemaleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!femaleName.trim()) {
      setFormError('يرجى إدخال اسم الطالبة كاملاً.');
      return;
    }

    if (!femalePhone.trim() || femalePhone.trim().length < 6) {
      setFormError('يرجى إدخال رقم الواتساب للتواصل وإرسال روابط الحلقات.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedStudent = saveRegisteredStudent({
        name: femaleName.trim(),
        phone: femalePhone.trim(),
        age: femaleAge.trim() || undefined,
        country: femaleCountry.trim() || 'اليمن',
        section: 'female',
        memorization: femaleMemorization,
        wantsSanad: femaleWantsSanad,
        riwayah: femaleRiwayah,
        preferredTime: femalePreferredTime,
        monthlyContribution: femaleMonthlyContribution,
        notes: femaleNotes.trim() || undefined,
        status: 'pending',
      });

      const cleanPhone = femalePhone.trim().replace(/[\s+-]/g, '');
      const baseUsername = 'sister_' + Math.floor(100 + Math.random() * 900);
      const rawPass = femalePassword.trim() || (Math.random().toString(36).slice(-8) + Math.floor(10 + Math.random() * 90));

      const authRes = registerNewAccount({
        name: femaleName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'student',
        section: 'female',
        memorization: femaleMemorization,
      });

      const finalAccount: AuthAccount = authRes.account || {
        id: savedStudent.id,
        name: femaleName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'student',
        section: 'female',
        titleBadge: 'طالبة في قسم الطالبات (أخوات)',
        assignedHalqaTitle: 'حلقة قسم الطالبات (عصراً)',
        registeredAt: new Date().toISOString().split('T')[0],
      };

      setAdmissionSuccess({
        account: finalAccount,
        rawPassword: rawPass,
        studentInfo: savedStudent,
        assignedSupervisor: FEMALE_SUPERVISOR,
        supervisorPhone: FEMALE_DISPLAY,
      });
    } catch (err: any) {
      setFormError(err?.message || 'حدث خطأ أثناء حفظ التسجيل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Teacher Registration
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!teacherName.trim()) {
      setFormError('يرجى إدخال اسم المعلم/المعلمة كاملاً.');
      return;
    }

    if (!teacherPhone.trim() || teacherPhone.trim().length < 6) {
      setFormError('يرجى إدخال رقم الواتساب للتواصل.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedTeacher = saveRegisteredTeacher({
        name: teacherName.trim(),
        qualification: teacherQualification.trim() || 'مقرئ لكتاب الله تعالى',
        country: teacherCountry.trim() || 'اليمن',
        phone: teacherPhone.trim(),
        targetSection: teacherTargetSection,
        experience: teacherExperience.trim() || undefined,
        status: 'pending',
      });

      const cleanPhone = teacherPhone.trim().replace(/[\s+-]/g, '');
      const baseUsername = 'sheikh_' + Math.floor(100 + Math.random() * 900);
      const rawPass = teacherPassword.trim() || (Math.random().toString(36).slice(-8) + Math.floor(10 + Math.random() * 90));

      const authRes = registerNewAccount({
        name: teacherName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'teacher',
        section: teacherTargetSection,
      });

      const finalAccount: AuthAccount = authRes.account || {
        id: savedTeacher.id,
        name: teacherName.trim(),
        phone: cleanPhone,
        username: baseUsername,
        password: rawPass,
        role: 'teacher',
        section: teacherTargetSection,
        titleBadge: 'معلم مقرأة معتمد',
        assignedHalqaTitle: teacherTargetSection === 'male' ? 'حلقة قسم الطلاب' : 'حلقة قسم الطالبات',
        registeredAt: new Date().toISOString().split('T')[0],
      };

      setAdmissionSuccess({
        account: finalAccount,
        rawPassword: rawPass,
        teacherInfo: savedTeacher,
        assignedSupervisor: teacherTargetSection === 'female' ? FEMALE_SUPERVISOR : MALE_SUPERVISOR,
        supervisorPhone: teacherTargetSection === 'female' ? FEMALE_DISPLAY : MALE_DISPLAY,
      });
    } catch (err: any) {
      setFormError(err?.message || 'حدث خطأ أثناء حفظ طلب المعلم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit General Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginIdentifier.trim()) {
      setLoginError('يرجى إدخال اسم المستخدم أو رقم الهاتف المسجل.');
      return;
    }

    const res = authenticateUser(loginIdentifier, loginPassword);
    if (res.success && res.account) {
      setLoginSuccess(res.message);
      setTimeout(() => {
        onEnterApp(res.account!, res.account?.role === 'supervisor' ? 'supervisor_dashboard' : undefined);
      }, 400);
    } else {
      setLoginError(res.message);
    }
  };

  // Legacy supervisor login now fails closed; access is available only through Firebase Auth.
  const handleSupervisorSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupervisorError(null);
    setSupervisorSuccess(null);
    setIsSupervisorVerifying(true);

    setTimeout(() => {
      const cleanPass = supervisorSecretPassword.trim();
      const res = authenticateSupervisorPassword(cleanPass);

      if (res.success && res.account) {
        setSupervisorSuccess(res.message);
        setTimeout(() => {
          setIsSupervisorModalOpen(false);
          onEnterApp(res.account!, 'supervisor_dashboard');
        }, 500);
      } else {
        setSupervisorError(res.message || 'كلمة المرور غير صحيحة، الوصول مصرح به فقط للمشرف العام.');
      }
      setIsSupervisorVerifying(false);
    }, 350);
  };

  // Copy Admission Credentials
  const handleCopyAdmission = () => {
    if (!admissionSuccess || !admissionSuccess.account) return;
    const isStudent = !!admissionSuccess.studentInfo;
    const sec = admissionSuccess.account?.section || 'male';
    const text = `بيانات التسجيل في مقرأة رحاب القرآن الإلكترونية 📖
• الاسم: ${admissionSuccess.account?.name || ''}
• القسم: ${isStudent ? 'طالب مقرأة' : 'معلم مقرأة'} (${sec === 'male' ? 'قسم الطلاب - بنين' : 'قسم الطالبات - أخوات'})
• اسم الدخول: ${admissionSuccess.account?.username || admissionSuccess.account?.phone || ''}
• كلمة المرور: ${admissionSuccess.rawPassword}
• المشرف المسؤول: ${admissionSuccess.assignedSupervisor} (${admissionSuccess.supervisorPhone})
مقرأة رحاب القرآن الإلكترونية - نحو إتقان وحفظ كتاب الله تعالى بالسند المتصل`;

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  return (
    <div 
      className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between items-center relative overflow-x-hidden font-sans" 
      dir="rtl"
    >
      {/* Background Spiritual Ambient Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Official Announcement Bar */}
      <div className="w-full bg-[#046A38] text-white text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-[#C5A059]/40 flex items-center justify-center gap-2 select-none z-30">
        <span className="font-kufi font-bold text-[#F9F6F0] flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
          <span>مقرأة رحاب القرآن الإلكترونية</span>
          {showGlobalAssembly && (
            <>
              <span className="text-[#C5A059]">•</span>
              <span className="text-[#F9F6F0] bg-emerald-900/90 px-3 py-0.5 rounded-full border border-[#C5A059]/60 text-xs">
                عضو التجمع العالمي للقرآن الكريم
              </span>
            </>
          )}
          <span className="text-[#C5A059] hidden sm:inline">•</span>
          <span className="hidden sm:inline">إقراء وإجازة بالسند المتصل على يد الشيخ المجيز</span>
        </span>
      </div>

      {/* ==================================================================== */}
      {/* 1. TOP BRAND NAVIGATION HEADER (الهيدر المعتمد للمقرأة مع الشعار والروابط) */}
      {/* ==================================================================== */}
      <header className="w-full sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-[#C5A059]/30 shadow-xs transition-all overflow-x-hidden max-w-full box-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full flex items-center justify-between min-h-[72px] sm:min-h-[82px] gap-2 sm:gap-6 box-border">
          {/* Right / Start: Official Brand Logo with Emblem & Inscriptions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <OfficialLogo size="md" variant="horizontal" clickable={true} />
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-[20px] text-sm sm:text-base font-kufi font-bold text-[#2C3531]">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer relative ${
                activeView === 'home' ? 'text-[#046A38] bg-emerald-50' : 'hover:text-[#046A38] hover:bg-emerald-50/60'
              }`}
            >
              الرئيسية
              {activeView === 'home' && (
                <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-[#C5A059] rounded-full"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                const el = document.getElementById('courses-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setInfoModal('courses');
              }}
              className="px-3 py-2 rounded-xl hover:text-[#046A38] hover:bg-emerald-50/60 transition-colors cursor-pointer"
            >
              الدورات
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                const el = document.getElementById('about-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setInfoModal('about');
              }}
              className="px-3 py-2 rounded-xl hover:text-[#046A38] hover:bg-emerald-50/60 transition-colors cursor-pointer"
            >
              عن المقرأة
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('home');
                const el = document.getElementById('how-it-works-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-2 rounded-xl hover:text-[#046A38] hover:bg-emerald-50/60 transition-colors cursor-pointer"
            >
              كيف تبدأ؟
            </button>
            {onOpenAcademicPortal && (
              <button
                type="button"
                onClick={onOpenAcademicPortal}
                className="px-3 py-2 rounded-xl bg-[#046A38] text-white hover:bg-[#03542c] font-bold border border-[#C5A059] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="النظام الأكاديمي لتعليم القرآن الكريم: خطط الحفظ، خطط المراجعة، جلسات التسميع، ورصد الأخطاء"
              >
                <span>📖 النظام الأكاديمي</span>
              </button>
            )}
            {onOpenPublicPortal && (
              <button
                type="button"
                onClick={onOpenPublicPortal}
                className="px-3 py-2 rounded-xl bg-[#F9F6F0] hover:bg-emerald-100/70 text-[#046A38] font-bold border border-[#C5A059]/50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تصفح كافة صفحات المقرأة العامة (من نحن، البرامج، المعلمون، الأسئلة الشائعة...)"
              >
                <span>🌐 صفحات المنصة العامة</span>
              </button>
            )}
            {onOpenQuranAudio && (
              <button
                type="button"
                onClick={onOpenQuranAudio}
                className="px-3 py-2 rounded-xl text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50/80 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="الاستماع للمصحف المعلم والمجود"
              >
                <Headphones className="w-4 h-4 text-emerald-700" />
                <span>المصحف المعلم</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenGeneralWhatsApp}
              className="px-3 py-2 rounded-xl hover:text-[#046A38] hover:bg-emerald-50/60 transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-800"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>تواصل معنا</span>
            </button>
          </nav>

          {/* Left / End: Login Button & Mobile Menu Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Header Login Button */}
            <button
              type="button"
              onClick={() => {
                setActiveView('login');
                setLoginError(null);
                setLoginSuccess(null);
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs sm:text-sm font-bold font-kufi border border-[#C5A059] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#C5A059]" />
              <span>دخول</span>
            </button>

            {/* Prominent Large Mobile Menu Button (الهاتف) */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#F9F6F0] hover:bg-emerald-50 border-2 border-[#C5A059] text-[#046A38] flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
              aria-label="قائمة التنقل والروابط"
              title="قائمة المقرأة"
            >
              {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileNavOpen && (
          <div className="lg:hidden bg-[#F9F6F0] border-t border-[#C5A059]/40 px-4 py-4 space-y-2 text-[#2C3531] font-kufi animate-fade-in shadow-xl max-w-full overflow-x-hidden box-border">

            <div className="space-y-1 pt-1 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setActiveView('home');
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-100/60 text-[#046A38] flex items-center justify-between"
              >
                <span>الرئيسية</span>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setActiveView('home');
                  const el = document.getElementById('courses-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setInfoModal('courses');
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-100/60 text-[#2C3531] flex items-center justify-between"
              >
                <span>الدورات القرآنية</span>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setActiveView('home');
                  const el = document.getElementById('about-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setInfoModal('about');
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-100/60 text-[#2C3531] flex items-center justify-between"
              >
                <span>عن مقرأة رحاب القرآن</span>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setActiveView('home');
                  const el = document.getElementById('how-it-works-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-100/60 text-[#2C3531] flex items-center justify-between"
              >
                <span>كيف تبدأ التسجيل والحفظ؟</span>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
              {onOpenQuranAudio && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onOpenQuranAudio();
                  }}
                  className="w-full text-right px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] font-bold flex items-center justify-between border border-emerald-200"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#046A38]" />
                    <span>المصحف المعلم والمجود للاستماع</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-50" />
                </button>
              )}
              {onOpenAcademicPortal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onOpenAcademicPortal();
                  }}
                  className="w-full text-right px-3.5 py-2.5 rounded-xl bg-[#046A38] text-white font-bold flex items-center justify-between border border-[#C5A059] shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>📖</span>
                    <span>النظام الأكاديمي لتعليم القرآن الكريم</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-75" />
                </button>
              )}
              {onOpenPublicPortal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onOpenPublicPortal();
                  }}
                  className="w-full text-right px-3.5 py-2.5 rounded-xl bg-amber-50/70 hover:bg-emerald-100 text-[#046A38] font-bold flex items-center justify-between border border-[#C5A059]/60"
                >
                  <div className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>صفحات المنصة العامة (9 صفحات)</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-50" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleOpenGeneralWhatsApp();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-100/60 text-emerald-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>تواصل معنا (واتساب)</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setSupervisorSecretPassword('');
                  setIsSupervisorModalOpen(true);
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 flex items-center justify-between border border-amber-300/60"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>بوابة المشرف العام (مؤمنة)</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* CASE 1: CLEAN HOME SCREEN (الهوية البصرية المتكاملة للمقرأة) */}
      {/* ==================================================================== */}
      {activeView === 'home' && !admissionSuccess && (
        <div className="w-full max-w-5xl text-center space-y-12 z-10 animate-fade-in my-auto py-6 px-4">
          
          {/* 1. HERO SECTION (الواجهة الرئيسية المستوحاة من موقع المقرأة المعتمد) */}
          <div className="relative rounded-3xl bg-white border border-[#C5A059]/30 p-6 sm:p-10 shadow-lg overflow-hidden">
            
            {/* Background Decorative Rings */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Right Column: Official Academy Emblem Logo (الشعار الجديد الرسمي المعتمد للمقرأة) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center order-2 lg:order-1">
                <div className="relative group w-full max-w-[320px]">
                  {/* Subtle Golden Spiritual Glow */}
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#C5A059]/30 via-[#046A38]/20 to-[#C5A059]/30 blur-2xl opacity-80 group-hover:opacity-100 transition-all pointer-events-none" />
                  
                  {/* Official Emblem Frame */}
                  <div className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#FDFBF7] to-[#FAF6EE] border-2 border-[#C5A059] shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-[1.01]">
                    
                    {/* Top Accreditation Ribbon */}
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#C5A059]/30 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#046A38] text-white font-bold text-[11px] font-kufi">
                        ★ الشعار الرسمي المعتمد
                      </span>
                      <span className="text-[#C5A059] font-bold font-serif text-[11px] bg-[#C5A059]/15 px-2 py-0.5 rounded-full border border-[#C5A059]/30">
                        1447 هـ
                      </span>
                    </div>

                    {/* The Official Vector Emblem */}
                    <div className="w-full max-h-[300px] flex items-center justify-center py-1">
                      <OfficialLogo size="2xl" variant="emblem" clickable={true} />
                    </div>

                    {/* Bottom Accreditation Caption */}
                    <div className="mt-2 text-center">
                      <p className="font-amiri text-[#046A38] text-xs sm:text-sm font-bold">
                        صرحٌ قرآني رائد لتعليم وتدبر كتاب الله بالسند
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-pill: "نورٌ يتجدد مع كل آية" */}
                <div className="mt-3.5 px-4 py-1.5 rounded-full bg-white border border-[#C5A059]/50 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="font-amiri text-[#046A38] text-xs sm:text-sm font-bold tracking-wide">
                    ✨ نورٌ يتجدد مع كل آية
                  </span>
                </div>
              </div>

              {/* Left Column: Hero Text & Call to Action */}
              <div className="lg:col-span-7 text-center lg:text-right space-y-4 order-1 lg:order-2">
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300/80 text-[#046A38] text-xs font-kufi font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>إجازة بالسند المتصل</span>
                  {showGlobalAssembly && (
                    <>
                      <span className="text-[#C5A059]">•</span>
                      <span>عضو التجمع العالمي للقرآن الكريم</span>
                    </>
                  )}
                  <span className="text-[#C5A059]">•</span>
                  <span className="text-slate-600 font-medium">تعليم وتدبر</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-amiri text-[#046A38] tracking-tight leading-tight">
                  ابدأ رحلتك مع القرآن الكريم
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed font-kufi max-w-xl mx-auto lg:mx-0">
                  تعلم وتدبر بإشراف مشايخ ومقرئات مجازين، مع إمكانية عرض القراءة كاملة على يد <strong>فضيلة الشيخ المجيز</strong> لنيل الإجازة القرآنية بالسند المتصل إلى النبي ﷺ.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('portal-categories');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#046A38] hover:bg-[#068547] text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer font-kufi"
                  >
                    <span>سجّل الآن</span>
                  </button>

                  {/* Primary Login Button in Prominent Place */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('login');
                      setLoginError(null);
                      setLoginSuccess(null);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#046A38] border-2 border-[#046A38] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer font-kufi"
                    id="btn-hero-login"
                  >
                    <LogIn className="w-4 h-4 text-[#046A38]" />
                    <span>تسجيل الدخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('courses-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF8F5] hover:bg-amber-100 text-[#2C3531] border border-[#C5A059]/60 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer font-kufi"
                  >
                    <span>استكشف الدورات</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {onOpenQuranAudio && (
                    <button
                      type="button"
                      onClick={onOpenQuranAudio}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#046A38] border-2 border-[#C5A059] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer font-kufi"
                      title="المصحف المعلم والمجود للاستماع"
                    >
                      <Headphones className="w-4 h-4 text-[#C5A059]" />
                      <span>المصحف المعلم للاستماع</span>
                    </button>
                  )}
                </div>

                {/* 3 Proof Badges */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 text-center">
                  <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-[#046A38] text-xs sm:text-sm block font-amiri">عن بُعد</span>
                    <span className="text-[10px] text-slate-500 block font-kufi">تعلم بمرونة</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-[#046A38] text-xs sm:text-sm block font-amiri">متابعة</span>
                    <span className="text-[10px] text-slate-500 block font-kufi">توجيه مستمر</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-emerald-100 shadow-2xs">
                    <span className="font-bold text-[#046A38] text-xs sm:text-sm block font-amiri">بيئة</span>
                    <span className="text-[10px] text-slate-500 block font-kufi">قرآنية موثوقة</span>
                  </div>
                </div>

                {/* Quranic Ayah */}
                <div className="pt-2">
                  <p className="font-amiri text-[#C5A059] text-lg sm:text-xl font-bold">
                    ﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. SECTION: لماذا مقرأة رحاب؟ */}
          <div id="about-section" className="space-y-6 pt-4">
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#C5A059] font-kufi">
                <span>—◆—</span>
                <span className="text-sm font-bold text-[#046A38]">لماذا مقرأة رحاب؟</span>
                <span>—◆—</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-amiri text-slate-800">
                مسارٌ واضح وقلبٌ متصل بالقرآن
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-kufi max-w-xl mx-auto">
                نصمم تجربة تعليمية قرآنية تجمع بين وضوح المنهج، وحسن المتابعة، ومرونة التعلم عن بُعد.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">
              {/* Feature 1 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#046A38] border border-emerald-200 flex items-center justify-center font-amiri text-xl font-bold">
                  01
                </div>
                <h3 className="text-lg font-bold text-[#046A38] font-amiri">تعليم عن بُعد</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                  تعلم من المكان والوقت المناسبين لك، عبر تجربة رقمية هادئة وواضحة تناسب جدولك اليومي.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-amiri text-xl font-bold">
                  02
                </div>
                <h3 className="text-lg font-bold text-[#046A38] font-amiri">متابعة مستمرة</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                  توجيه يساعدك على معرفة تقدمك والمحافظة على الاستمرارية مع كادر تعليمي متخصص.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-amiri text-xl font-bold">
                  03
                </div>
                <h3 className="text-lg font-bold text-[#046A38] font-amiri">بيئة قرآنية</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                  مساحة تعليمية موثوقة تشجع على التلاوة والتدبر والارتقاء في حلقات منتظمة وهادفة.
                </p>
              </div>
            </div>
          </div>

          {/* 3. SECTION: الدورات المتاحة */}
          <div id="courses-section" className="space-y-6 pt-4">
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#C5A059] font-kufi">
                <span>—◆—</span>
                <span className="text-sm font-bold text-[#046A38]">اختر مسارك</span>
                <span>—◆—</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-amiri text-slate-800">
                الدورات المتاحة
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-kufi max-w-lg mx-auto">
                برامج تعليمية مرنة تساعدك على بناء علاقة متينة مع القرآن الكريم
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">
              {/* Course 1 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold font-kufi border border-amber-200">
                    الأكثر طلبًا
                  </div>
                  <h3 className="text-lg font-bold text-[#046A38] font-amiri">دورة التلاوة والتجويد</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                    تطوير النطق الصحيح، وضبط أحكام التلاوة ومخارج الحروف، وبناء قراءة واثقة بالسند المتصل.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('male_students');
                    setMaleMemorization('دورة التلاوة والتجويد');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-200 text-xs font-bold font-kufi cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>التحق بالدورة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Course 2 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[#046A38] text-[11px] font-bold font-kufi border border-emerald-200">
                    مسار متدرج
                  </div>
                  <h3 className="text-lg font-bold text-[#046A38] font-amiri">دورة الحفظ والمراجعة</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                    خطة عملية منظمة للحفظ والمراجعة الدورية مع متابعة مستمرة تساعدك على تثبيت المحفوظ وإتقانه.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('male_students');
                    setMaleMemorization('دورة الحفظ والمراجعة');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-200 text-xs font-bold font-kufi cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>التحق بالدورة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Course 3 */}
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold font-kufi border border-teal-200">
                    لجميع المستويات
                  </div>
                  <h3 className="text-lg font-bold text-[#046A38] font-amiri">دورة تصحيح التلاوة</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-kufi">
                    تدريب فردي يركز على تصحيح اللحن الجلي والخفي، مخارج الحروف وصفاتها، وتحسين الأداء الصوتي.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('male_students');
                    setMaleMemorization('دورة تصحيح التلاوة');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-200 text-xs font-bold font-kufi cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>التحق بالدورة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4. SECTION: كيف تبدأ؟ */}
          <div id="how-it-works-section" className="space-y-6 pt-4">
            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#C5A059] font-kufi">
                <span>—◆—</span>
                <span className="text-sm font-bold text-[#046A38]">خطوات سهلة</span>
                <span>—◆—</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-amiri text-slate-800">
                كيف تبدأ؟ ثلاث خطوات تفصلك عن البداية
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs space-y-2">
                <span className="text-3xl font-black text-[#C5A059] font-amiri block">01</span>
                <h4 className="text-base font-bold text-slate-800 font-kufi">اختر الدورة</h4>
                <p className="text-xs text-slate-600 font-kufi leading-relaxed">
                  تصفح المسارات القرآنية وحدد ما يناسب مستواك وهدفك.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs space-y-2">
                <span className="text-3xl font-black text-[#C5A059] font-amiri block">02</span>
                <h4 className="text-base font-bold text-slate-800 font-kufi">سجّل بياناتك</h4>
                <p className="text-xs text-slate-600 font-kufi leading-relaxed">
                  أكمل النموذج السريع لحفظ مقعدك في الحلقة المناسبة.
                </p>
              </div>
              <div className="p-6 rounded-3xl bg-white border border-[#C5A059]/30 shadow-xs space-y-2">
                <span className="text-3xl font-black text-[#C5A059] font-amiri block">03</span>
                <h4 className="text-base font-bold text-slate-800 font-kufi">ابدأ التعلم</h4>
                <p className="text-xs text-slate-600 font-kufi leading-relaxed">
                  انضم فورًا للحلقات المباشرة وتلقَّ التوجيه والإتقان.
                </p>
              </div>
            </div>
          </div>

          {/* 5. CALL TO ACTION BANNER (سجّل الآن وابدأ رحلتك مع القرآن) */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#046A38] via-[#057A42] to-[#046A38] text-white p-8 sm:p-10 shadow-xl overflow-hidden text-center space-y-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-2xl sm:text-3xl font-black font-amiri text-white">
              سجّل الآن وابدأ رحلتك مع القرآن
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 font-kufi max-w-lg mx-auto">
              خطوة واحدة تفصلك عن بيئة قرآنية محفزة ومعلمين مؤهلين يعينونك على تلاوة وتدبر كتاب الله.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('portal-categories');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white hover:bg-amber-50 text-[#046A38] font-black text-sm font-kufi shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>سجّل الآن في الحلقات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 6. PORTAL CATEGORY CARDS (أقسام المقرأة الرئيسية للتسجيل الفوري) */}
          <div id="portal-categories" className="space-y-4 pt-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#046A38] font-kufi">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>اختر الفئة للانضمام والتسجيل الفوري في الحلقات:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* قسم 1: (المعلمون) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('teachers');
                  setFormError(null);
                }}
                className="p-6 rounded-3xl bg-white hover:bg-amber-50/40 border-2 border-amber-500/70 hover:border-amber-500 text-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                id="btn-cat-teachers"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 group-hover:bg-amber-100 text-amber-800 flex items-center justify-center transition-colors border border-amber-200">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-[#046A38] font-amiri block">
                    (المعلمون)
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 font-kufi">
                    كادر التدريس والإقراء بالسند
                  </span>
                </div>
                <div className="mt-1 text-xs text-amber-800 font-bold font-kufi flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                  <span>طلب الانضمام</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* قسم 2: (قسم الطلاب - بنين) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('male_students');
                  setFormError(null);
                }}
                className="p-6 rounded-3xl bg-white hover:bg-emerald-50/40 border-2 border-emerald-600/80 hover:border-emerald-600 text-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                id="btn-cat-male-students"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-[#046A38] flex items-center justify-center transition-colors border border-emerald-200">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-[#046A38] font-amiri block">
                    (قسم الطلاب - بنين)
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 font-kufi">
                    حلقات البنين والفتيان المباشرة
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#046A38] font-bold font-kufi flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                  <span>تسجيل طالب جديد</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* قسم 3: (قسم الطالبات - أخوات) */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('female_students');
                  setFormError(null);
                }}
                className="p-6 rounded-3xl bg-white hover:bg-teal-50/40 border-2 border-teal-600/80 hover:border-teal-600 text-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                id="btn-cat-female-students"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-800 flex items-center justify-center transition-colors border border-teal-200">
                  <Heart className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-teal-800 font-amiri block">
                    (قسم الطالبات - أخوات)
                  </span>
                  <span className="text-xs text-slate-600 block mt-1 font-kufi">
                    حلقات الأخوات مع معلمات مجازات
                  </span>
                </div>
                <div className="mt-1 text-xs text-teal-800 font-bold font-kufi flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                  <span>تسجيل طالبة جديدة</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          </div>

          {/* 7. OFFICIAL WHATSAPP & DIRECT CALL BANNER (مراسلة الواتساب والاتصال الهاتفي المعتمد) */}
          <div className="pt-2 space-y-2.5">
            {/* زر مراسلة الواتساب المعتمد */}
            <a
              href={`https://wa.me/${MAIN_WHATSAPP_PHONE}?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، مراسلة مقرأة رحاب القرآن الإلكترونية لتعليم القرآن الكريم عن بعد عبر واتساب 📖✨')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 sm:px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs sm:text-sm flex items-center justify-between gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group font-kufi border border-emerald-400/40"
              id="btn-main-whatsapp"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-slate-950 fill-slate-950" />
                </div>
                <div className="text-right truncate">
                  <span className="block font-bold text-xs sm:text-sm leading-tight text-slate-950">مراسلة المقرأة لتعليم القرآن الكريم عن بعد عبر واتساب</span>
                  <span className="text-[10px] text-emerald-950 font-medium hidden sm:inline">خدمة الطلاب والطالبات والتسجيل المباشر</span>
                </div>
              </div>
              <span className="text-xs bg-black/20 px-2.5 py-1 rounded-full font-mono font-bold text-slate-950 shrink-0" dir="ltr">
                {MAIN_WHATSAPP_DISPLAY}
              </span>
            </a>

            {/* زر الاتصال الهاتفي المباشر */}
            <a
              href={`tel:${MAIN_CALL_PHONE}`}
              className="w-full py-3 px-4 sm:px-6 rounded-2xl bg-white hover:bg-emerald-50 text-slate-900 border-2 border-[#046A38] font-bold text-xs sm:text-sm flex items-center justify-between gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer group font-kufi"
              id="btn-main-call"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#046A38]" />
                </div>
                <div className="text-right truncate">
                  <span className="block font-bold text-xs sm:text-sm leading-tight text-emerald-900">الاتصال الهاتفي المباشر بإدارة المقرأة</span>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">للاستفسارات والمتابعة الصوتية الهاتفية</span>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-[#046A38] px-2.5 py-1 rounded-full font-mono font-bold shrink-0" dir="ltr">
                {MAIN_CALL_DISPLAY}
              </span>
            </a>

            {/* حساب إنستجرام الرسمي للمقرأة */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/10 hover:from-[#833ab4]/20 hover:via-[#fd1d1d]/20 hover:to-[#fcb045]/20 border border-pink-400/40 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-between gap-2 transition-all cursor-pointer group font-kufi"
              id="btn-instagram"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="text-right truncate">
                  <span className="block font-bold text-xs sm:text-sm text-pink-950">حساب إنستجرام الرسمي للمقرأة</span>
                  <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">تابع تلاوات الطلاب والفعاليات القرآنية اليومية</span>
                </div>
              </div>
              <span className="text-xs bg-pink-100 text-pink-900 px-2.5 py-0.5 rounded-full font-mono font-bold shrink-0" dir="ltr">
                {INSTAGRAM_HANDLE}
              </span>
            </a>
          </div>

          {/* 8. SECONDARY ACTIONS (تسجيل دخول + التصفح كزائر) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-kufi">
            <button
              type="button"
              onClick={() => {
                setActiveView('login');
                setLoginError(null);
                setLoginSuccess(null);
              }}
              className="text-[#046A38] hover:text-[#068547] font-bold flex items-center gap-1.5 cursor-pointer underline decoration-[#046A38]/40 underline-offset-4"
              id="btn-login-prompt"
            >
              <LogIn className="w-4 h-4" />
              <span>لديك حساب بالفعل في المقرأة؟ تسجيل الدخول هنا</span>
            </button>

            <span className="hidden sm:inline text-slate-400">•</span>

            <button
              type="button"
              onClick={onExploreAsGuest}
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5 cursor-pointer"
              id="btn-guest-prompt"
            >
              <span>تصفح محتوى وجدول المقرأة كزائر</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. INFORMATIONAL MODAL (عن المقرأة والدورات) */}
      {/* ==================================================================== */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#072014] border-2 border-[#C5A059] rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <OfficialLogo size="sm" variant="icon" />
                <h3 className="text-base font-bold text-white font-amiri">
                  {infoModal === 'about' ? 'عن مقرأة رحاب القرآن الإلكترونية' : 'الدورات والمسارات القرآنية'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-8 h-8 rounded-full bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white flex items-center justify-center border border-emerald-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {infoModal === 'about' ? (
              <div className="space-y-3 text-xs leading-relaxed text-slate-200 font-kufi">
                {showGlobalAssembly && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-900 text-amber-300 font-bold border border-amber-400/40 text-[11px]">
                      عضو التجمع العالمي للقرآن الكريم
                    </span>
                  </div>
                )}
                <p className="font-bold text-amber-300 font-amiri text-sm">
                  صرحٌ قرآني رائد لتعليم وتدبر كتاب الله تعالى عن بُعد
                </p>
                <p>
                  <strong>مقرأة رحاب القرآن الإلكترونية</strong> هي منصة تعليمية قرآنية مباركة{showGlobalAssembly ? '، وعضو التجمع العالمي للقرآن الكريم' : ''}، تجمع طلاب وطالبات كتاب الله تعالى من مختلف أنحاء العالم بكوكبة من المشايخ والمعلمات المجازات بالسند المتصل إلى رسول الله ﷺ.
                </p>
                <div className="p-3 rounded-xl bg-[#0b2b1b] border border-emerald-800 space-y-1.5">
                  <span className="font-bold text-amber-300 block font-amiri">أهداف المقرأة:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    <li>تيسير حفظ القرآن الكريم ومراجعته بمسارات مرنة تناسب أوقات الجميع.</li>
                    <li>تصحيح التلاوات وإتقان أحكام التجويد ومخارج الحروف وصفاتها.</li>
                    <li>منح الإجازات القرآنية بالسند المتصل بعد العرض المباشر على يد فضيلة الشيخ المجيز.</li>
                    <li>إتاحة بيئة قرآنية محفزة تشمل بنين وبنات في أقسام مستقلة تماماً.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed text-slate-200 font-kufi">
                <p className="font-bold text-amber-300 font-amiri text-sm">
                  المسارات التعليمية المتاحة للتسجيل الفوري:
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-[#0b2b1b] border border-emerald-800">
                    <span className="font-bold text-white block">1. دورة التلاوة والتجويد</span>
                    <p className="text-[11px] text-slate-300 mt-1">تطوير النطق الصحيح وضبط أحكام التجويد وبناء قراءة واثقة.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b2b1b] border border-emerald-800">
                    <span className="font-bold text-white block">2. دورة الحفظ والمراجعة</span>
                    <p className="text-[11px] text-slate-300 mt-1">خطة عملية للحفظ والمراجعة مع متابعة مستمرة لتثبيت المحفوظ.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b2b1b] border border-emerald-800">
                    <span className="font-bold text-white block">3. دورة تصحيح التلاوة</span>
                    <p className="text-[11px] text-slate-300 mt-1">تدريب فردي يركز على مخارج الحروف وصفاتها وتحسين الأداء.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#046A38] hover:bg-[#068547] text-white text-xs font-bold font-kufi cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CASE 2: CATEGORY SPECIFIC REGISTRATION FORM (خاص بكل فئة عند اختيارها فقط) */}
      {/* ==================================================================== */}
      {activeView !== 'home' && activeView !== 'login' && !admissionSuccess && (
        <div className="w-full max-w-xl z-10 animate-fade-in my-auto py-2">
          <div className="rounded-3xl bg-[#081e13]/95 border-2 border-emerald-600/80 shadow-2xl overflow-hidden backdrop-blur-md">
            
            {/* Header with Back Button */}
            <div className="p-4 sm:p-5 bg-[#05140d] border-b border-emerald-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center border border-emerald-800/80">
                  {activeView === 'teachers' && <GraduationCap className="w-5 h-5 text-amber-300" />}
                  {activeView === 'male_students' && <BookOpen className="w-5 h-5 text-emerald-400" />}
                  {activeView === 'female_students' && <Heart className="w-5 h-5 text-teal-400" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-serif">
                    {activeView === 'teachers' && 'تسجيل كمعلم (خاص بالمعلمين)'}
                    {activeView === 'male_students' && 'تسجيل كطالب (قسم الطلاب - بنين)'}
                    {activeView === 'female_students' && 'تسجيل كطالبة (قسم الطالبات - أخوات)'}
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    {activeView === 'teachers' && 'استمارة انضمام كادر التدريس والإقراء بالسند'}
                    {activeView === 'male_students' && 'استمارة انضمام حلقات البنين والتسميع المباشر'}
                    {activeView === 'female_students' && 'استمارة انضمام حلقات الأخوات الخاصة'}
                  </p>
                </div>
              </div>

              {/* Back to Home Button */}
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                id="btn-back-home"
              >
                <span>العودة</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="p-5 sm:p-6 space-y-4">

              {/* ------------------------------------------- */}
              {/* FORM 1: MALE STUDENTS (قسم الطلاب - بنين) */}
              {/* ------------------------------------------- */}
              {activeView === 'male_students' && (
                <form onSubmit={handleMaleStudentSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      اسم الطالب كاملاً: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={maleName}
                        onChange={(e) => setMaleName(e.target.value)}
                        placeholder="الاسم الثلاثي أو الرباعي"
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                      />
                      <User className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      رقم الهاتف / الواتساب: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={malePhone}
                        onChange={(e) => setMalePhone(e.target.value)}
                        placeholder="مثال: 777123456 أو 00967..."
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono pr-9"
                        dir="ltr"
                      />
                      <Phone className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">العمر:</label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={maleAge}
                        onChange={(e) => setMaleAge(e.target.value)}
                        placeholder="مثال: 18"
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">بلد الإقامة:</label>
                      <input
                        type="text"
                        value={maleCountry}
                        onChange={(e) => setMaleCountry(e.target.value)}
                        placeholder="اليمن"
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">مقدار الحفظ:</label>
                      <select
                        value={maleMemorization}
                        onChange={(e) => setMaleMemorization(e.target.value)}
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="مبتدئ (جزء عم)">مبتدئ (جزء عم)</option>
                        <option value="3 أجزاء">3 أجزاء</option>
                        <option value="5 أجزاء">5 أجزاء</option>
                        <option value="10 أجزاء">10 أجزاء</option>
                        <option value="15 جزء">15 جزء</option>
                        <option value="20 جزء">20 جزء</option>
                        <option value="القرآن كاملاً">القرآن كاملاً</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">الإجازة بالسند:</label>
                      <select
                        value={maleWantsSanad}
                        onChange={(e: any) => setMaleWantsSanad(e.target.value)}
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                      >
                        <option value="نعم">نعم، أرغب في السند</option>
                        <option value="لا">لا، حفظ وتصحيح فقط</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                      <span>الرواية القرآنية المراد دراستها: <span className="text-amber-400">*</span></span>
                      <span className="text-[10px] text-emerald-400 font-normal">ورش، حفص، قالون...</span>
                    </label>
                    <select
                      value={maleRiwayah}
                      onChange={(e) => setMaleRiwayah(e.target.value)}
                      className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
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

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">الوقت المفضل للتسميع:</label>
                    <select
                      value={malePreferredTime}
                      onChange={(e) => setMalePreferredTime(e.target.value)}
                      className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="فجراً بعد صلاة الفجر (5:00 ص - 6:30 ص)">فجراً بعد صلاة الفجر (5:00 ص - 6:30 ص)</option>
                      <option value="عصراً (4:00 م - 6:00 م)">عصراً (4:00 م - 6:00 م)</option>
                      <option value="مساءً بعد المغرب والعشاء (6:30 م - 9:30 م)">مساءً بعد المغرب والعشاء (6:30 م - 9:30 م)</option>
                    </select>
                  </div>

                  {/* الخيار قبل الأخير: رسوم المساهمة الشهرية */}
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-200 mb-1 leading-relaxed">
                      هل تستطيع دفع مساهمة شهرية مبلغ بسيط قدره 3000 ريال يمني قديم أو ما يعادلها من خارج اليمن؟ <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={maleMonthlyContribution}
                      onChange={(e) => setMaleMonthlyContribution(e.target.value)}
                      className="w-full bg-[#05130d] border border-amber-600/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    <p className="text-[10px] text-amber-300/80 leading-normal">
                      💡 المساهمة الرمزية تدعم كفالة الحلقات ورواتب المعلمين والمعلمات، ولا يُحرم أي راغب في تعلم كتاب الله لعدم القدرة.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">تعيين كلمة مرور لحسابك:</label>
                    <div className="relative">
                      <input
                        type={showMalePassword ? 'text' : 'password'}
                        value={malePassword}
                        onChange={(e) => setMalePassword(e.target.value)}
                        placeholder="أدخل كلمة مرور قوية"
                        className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 pr-9 pl-9 font-mono"
                      />
                      <Key className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowMalePassword(!showMalePassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showMalePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span>تأكيد التسجيل في قسم الطلاب (بنين)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = generateMaleStudentWhatsApp();
                        window.open(`https://wa.me/${MALE_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/50 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>إرسال طلب التسجيل مباشرة عبر الواتساب للمشرف</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------------------------------- */}
              {/* FORM 2: FEMALE STUDENTS (قسم الطالبات - أخوات) */}
              {/* ------------------------------------------- */}
              {activeView === 'female_students' && (
                <form onSubmit={handleFemaleStudentSubmit} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-800/80 text-[11px] text-teal-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
                    <span>حلقات نسائية خاصة ومشفرة بإشراف معلمات مجازات مع الحفاظ التام على الخصوصية.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      اسم الطالبة: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={femaleName}
                        onChange={(e) => setFemaleName(e.target.value)}
                        placeholder="الاسم الكريم للطالبة"
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                      />
                      <User className="w-4 h-4 text-teal-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      رقم الواتساب للتواصل: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={femalePhone}
                        onChange={(e) => setFemalePhone(e.target.value)}
                        placeholder="رقم الواتساب لاستلام رابط الحلقة"
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono pr-9"
                        dir="ltr"
                      />
                      <Phone className="w-4 h-4 text-teal-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">العمر:</label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={femaleAge}
                        onChange={(e) => setFemaleAge(e.target.value)}
                        placeholder="مثال: 20"
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">بلد الإقامة:</label>
                      <input
                        type="text"
                        value={femaleCountry}
                        onChange={(e) => setFemaleCountry(e.target.value)}
                        placeholder="اليمن"
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">مقدار الحفظ:</label>
                      <select
                        value={femaleMemorization}
                        onChange={(e) => setFemaleMemorization(e.target.value)}
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                      >
                        <option value="مبتدئة (جزء عم)">مبتدئة (جزء عم)</option>
                        <option value="3 أجزاء">3 أجزاء</option>
                        <option value="5 أجزاء">5 أجزاء</option>
                        <option value="10 أجزاء">10 أجزاء</option>
                        <option value="15 جزء">15 جزء</option>
                        <option value="20 جزء">20 جزء</option>
                        <option value="القرآن كاملاً">القرآن كاملاً</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-200 mb-1">الإجازة بالسند:</label>
                      <select
                        value={femaleWantsSanad}
                        onChange={(e: any) => setFemaleWantsSanad(e.target.value)}
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                      >
                        <option value="نعم">نعم، أرغب في السند</option>
                        <option value="لا">لا، حفظ وتصحيح فقط</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
                      <span>الرواية القرآنية المراد دراستها: <span className="text-amber-400">*</span></span>
                      <span className="text-[10px] text-teal-400 font-normal">ورش، حفص، قالون...</span>
                    </label>
                    <select
                      value={femaleRiwayah}
                      onChange={(e) => setFemaleRiwayah(e.target.value)}
                      className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
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

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">الوقت المفضل للتسميع:</label>
                    <select
                      value={femalePreferredTime}
                      onChange={(e) => setFemalePreferredTime(e.target.value)}
                      className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="عصراً (4:00 م - 6:00 م)">عصراً (4:00 م - 6:00 م)</option>
                      <option value="صباحاً (9:00 ص - 11:30 ص)">صباحاً (9:00 ص - 11:30 ص)</option>
                      <option value="مساءً بعد العشاء (8:00 م - 10:00 م)">مساءً بعد العشاء (8:00 م - 10:00 م)</option>
                    </select>
                  </div>

                  {/* الخيار قبل الأخير: رسوم المساهمة الشهرية */}
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-200 mb-1 leading-relaxed">
                      هل تستطيع دفع مساهمة شهرية مبلغ بسيط قدره 3000 ريال يمني قديم أو ما يعادلها من خارج اليمن؟ <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={femaleMonthlyContribution}
                      onChange={(e) => setFemaleMonthlyContribution(e.target.value)}
                      className="w-full bg-[#05130d] border border-amber-600/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
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
                    <p className="text-[10px] text-amber-300/80 leading-normal">
                      💡 المساهمة الرمزية تدعم كفالة الحلقات ومكافآت المعلمات، ولا تُحرم أي راغبة في حفظ القرآن لعدم الاستطاعة.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">تعيين كلمة مرور لحسابك:</label>
                    <div className="relative">
                      <input
                        type={showFemalePassword ? 'text' : 'password'}
                        value={femalePassword}
                        onChange={(e) => setFemalePassword(e.target.value)}
                        placeholder="أدخل كلمة مرور قوية"
                        className="w-full bg-[#05130d] border border-teal-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 pr-9 pl-9 font-mono"
                      />
                      <Key className="w-4 h-4 text-teal-400 absolute right-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowFemalePassword(!showFemalePassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showFemalePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span>تأكيد التسجيل في قسم الطالبات (أخوات)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = generateFemaleStudentWhatsApp();
                        window.open(`https://wa.me/${FEMALE_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/50 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>إرسال طلب التسجيل لمشرفة قسم الأخوات عبر الواتساب</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------------------------------- */}
              {/* FORM 3: TEACHERS (المعلمون)                 */}
              {/* ------------------------------------------- */}
              {activeView === 'teachers' && (
                <form onSubmit={handleTeacherSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      اسم المعلم / المعلمة كاملاً: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="الاسم الكريم مع اللقب العلمي إن وجد"
                        className="w-full bg-[#05130d] border border-amber-600/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                      />
                      <User className="w-4 h-4 text-amber-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      رقم الواتساب للتواصل: <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        placeholder="رقم الواتساب الشخصي"
                        className="w-full bg-[#05130d] border border-amber-600/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-left font-mono pr-9"
                        dir="ltr"
                      />
                      <Phone className="w-4 h-4 text-amber-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      القسم المراد التدريس فيه:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTeacherTargetSection('male')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          teacherTargetSection === 'male'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-[#05130d] border-emerald-900 text-slate-400'
                        }`}
                      >
                        👦 قسم الطلاب (بنين)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherTargetSection('female')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          teacherTargetSection === 'female'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-[#05130d] border-emerald-900 text-slate-400'
                        }`}
                      >
                        🧕 قسم الطالبات (أخوات)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      المؤهل القرآني والإجازات:
                    </label>
                    <input
                      type="text"
                      value={teacherQualification}
                      onChange={(e) => setTeacherQualification(e.target.value)}
                      placeholder="مثال: مجاز برواية حفص عن عاصم بالسند المتصل"
                      className="w-full bg-[#05130d] border border-amber-600/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">
                      الخبرات السابقة في التحفيظ والإقراء:
                    </label>
                    <textarea
                      rows={2}
                      value={teacherExperience}
                      onChange={(e) => setTeacherExperience(e.target.value)}
                      placeholder="سنوات الخبرة والمقارئ السابقة إن وجدت..."
                      className="w-full bg-[#05130d] border border-amber-600/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1">تعيين كلمة مرور لحساب المعلم:</label>
                    <div className="relative">
                      <input
                        type={showTeacherPassword ? 'text' : 'password'}
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="أدخل كلمة مرور قوية"
                        className="w-full bg-[#05130d] border border-amber-600/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 pr-9 pl-9 font-mono"
                      />
                      <Key className="w-4 h-4 text-amber-400 absolute right-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white"
                      >
                        {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : <CheckCircle2 className="w-5 h-5 text-slate-950" />}
                      <span>إرسال طلب الانضمام كمعلم 📜</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const msg = generateTeacherWhatsApp();
                        const targetPhone = teacherTargetSection === 'female' ? FEMALE_PHONE : MALE_PHONE;
                        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/50 text-[#25D366] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 text-[#25D366]" />
                      <span>إرسال طلب المعلم عبر الواتساب للإدارة</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CASE 3: LOGIN FORM (تسجيل الدخول للمسجلين مسبقاً)                     */}
      {/* ==================================================================== */}
      {activeView === 'login' && !admissionSuccess && (
        <div className="w-full max-w-md z-10 animate-fade-in my-auto py-2">
          <div className="rounded-3xl bg-[#081e13]/95 border-2 border-emerald-600/80 shadow-2xl overflow-hidden backdrop-blur-md">
            
            <div className="p-4 sm:p-5 bg-[#05140d] border-b border-emerald-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
                  <LogIn className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white font-serif">تسجيل الدخول للمقرأة</h2>
                  <p className="text-[11px] text-slate-300">للمسجلين مسبقاً (معلمين وطلاب)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span>العودة</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  اسم المستخدم أو رقم الهاتف المسجل:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="اسم المستخدم أو رقم هاتفك"
                    className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <User className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-200">كلمة المرور:</label>
                  <span className="text-[10px] text-slate-400">(الافتراضية: 123)</span>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="كلمة المرور الخاصة بحسابك"
                    className="w-full bg-[#05130d] border border-emerald-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9 pl-9 font-mono"
                  />
                  <Key className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>دخول إلى المقرأة</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  ليس لديك حساب بعد؟ اختر قسمك للانضمام فوراً ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CASE 4: POST-REGISTRATION SUCCESS CONFIRMATION                       */}
      {/* ==================================================================== */}
      {admissionSuccess && (
        <div className="w-full max-w-lg p-6 rounded-3xl bg-[#081e13] border-2 border-amber-400/80 shadow-2xl space-y-4 text-right animate-fade-in my-auto z-10">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg font-black">
              <CheckCircle2 className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-xl font-black text-amber-300 font-serif">
              تم تسجيل طلب انضمامك بنجاح! 🎉
            </h2>
            <p className="text-xs text-slate-200">
              أهلاً وسهلاً بك يا <strong>{admissionSuccess.account?.name || ''}</strong> في مقرأة رحاب القرآن المباركة
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#04120a] border border-amber-500/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/80">
              <span className="text-slate-400">الاسم:</span>
              <span className="text-white font-bold text-sm">{admissionSuccess.account?.name || ''}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/80">
              <span className="text-slate-400">القسم:</span>
              <span className="text-amber-300 font-bold">
                {admissionSuccess.account?.role === 'teacher' ? (
                  'كادر المعلمين والمقرئين'
                ) : admissionSuccess.account?.section === 'male' ? (
                  'قسم الطلاب (بنين)'
                ) : (
                  'قسم الطالبات (أخوات)'
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900/80">
              <span className="text-slate-400">اسم الدخول:</span>
              <span className="text-white font-mono font-bold">{admissionSuccess.account?.username || ''}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/50">
              <div>
                <span className="text-amber-300 block text-[10px] font-bold">كلمة المرور الخاصة بك:</span>
                <span className="text-white font-mono font-black text-base">{admissionSuccess.rawPassword}</span>
              </div>
              <span className="text-[10px] text-amber-300/80 bg-black/40 px-2 py-1 rounded-md">احفظها للدخول</span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyAdmission}
                className="py-2.5 px-3 rounded-xl bg-[#0a2719] hover:bg-[#0e3322] border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCredentials ? 'تم النسخ' : 'نسخ البيانات'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  let text = `السلام عليكم ورحمة الله وبركاته،\nأنا ${admissionSuccess.account?.name || ''} تم تسجيلي في مقرأة رحاب القرآن واسم المستخدم الخاص بي: ${admissionSuccess.account?.username || ''}`;
                  const phone = admissionSuccess.account?.section === 'female' ? FEMALE_PHONE : MALE_PHONE;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-slate-950" />
                <span>إشعار الإدارة بالواتساب</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onEnterApp(admissionSuccess.account)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-slate-950" />
              <span>المتابعة والدخول إلى المقرأة ←</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* Legacy supervisor login dialog; authentication is delegated to Firebase Auth. */}
      {/* ==================================================================== */}
      {isSupervisorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-[#081f14] border-2 border-amber-500/90 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
            
            <div className="text-center space-y-1.5 border-b border-emerald-900/80 pb-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 flex items-center justify-center shadow-lg font-black mb-1">
                <Shield className="w-7 h-7 text-slate-950" />
              </div>
              <h3 className="text-lg font-black text-amber-300 font-serif">
                بوابة المشرف العام - دخول الإدارة المؤمنة 🛡️
              </h3>
              <p className="text-xs text-slate-300">
                منطقة إدارية مخصصة ومؤمنة للمشرف العام للوصول إلى لوحة التحكم الشاملة.
              </p>
            </div>

            {supervisorError && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{supervisorError}</span>
              </div>
            )}

            {supervisorSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{supervisorSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSupervisorSecretSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5">
                  أدخل كلمة المرور الخاصة بالمشرف العام:
                </label>
                <div className="relative">
                  <input
                    type={showSupervisorPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={supervisorSecretPassword}
                    onChange={(e) => setSupervisorSecretPassword(e.target.value)}
                    placeholder="كلمة المرور الخاصة بالمشرف العام"
                    className="w-full bg-[#04130b] border-2 border-amber-500/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9 pl-9 font-mono tracking-wider"
                  />
                  <Key className="w-4 h-4 text-amber-400 absolute right-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showSupervisorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSupervisorVerifying}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer disabled:opacity-60"
                  id="btn-confirm-supervisor-login"
                >
                  {isSupervisorVerifying ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-950" />
                  )}
                  <span>التحقق والولوج للوحة التحكم الإدارية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(false)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
                >
                  إلغاء والعودة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. OFFICIAL RICH BRAND FOOTER (الهيدر والفوتر المعتمد للهوية الرسمية) */}
      {/* ==================================================================== */}
      <footer className="w-full bg-[#042918] text-white border-t-2 border-[#C5A059]/40 z-20 mt-12 pt-10 pb-6 px-4 sm:px-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-right">
            {/* Column 1: Brand Info & Logo */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <OfficialLogo size="sm" variant="icon" clickable={false} />
                <div>
                  <h3 className="text-base sm:text-lg font-black font-amiri text-white">
                    مقرأة رحاب القرآن الإلكترونية
                  </h3>
                  <p className="text-xs text-[#C5A059] font-bold font-kufi flex items-center gap-1.5">
                    <span>بناء جيل يتلو القرآن ويعمل به</span>
                    {showGlobalAssembly && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-300">عضو التجمع العالمي للقرآن الكريم</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-kufi max-w-sm">
                صرحٌ قرآني رائد لتعليم وتدبر كتاب الله تعالى عن بُعد{showGlobalAssembly ? '، وعضو التجمع العالمي للقرآن الكريم' : ''}، يمنح الإجازات بالسند المتصل على يد الشيخ المجيز وشيوخ المقرأة المعتمدين.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-2 space-y-3 font-kufi">
              <h4 className="text-sm font-bold text-[#C5A059] border-b border-emerald-800 pb-1 inline-block">
                روابط سريعة
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    الرئيسية
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('home');
                      const el = document.getElementById('courses-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    الدورات المعتمدة
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('home');
                      const el = document.getElementById('about-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    عن المقرأة
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('home');
                      const el = document.getElementById('how-it-works-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    كيف تبدأ؟
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Support & Policies */}
            <div className="md:col-span-3 space-y-3 font-kufi">
              <h4 className="text-sm font-bold text-[#C5A059] border-b border-emerald-800 pb-1 inline-block">
                الدعم والمساعدة
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={handleOpenGeneralWhatsApp}
                    className="hover:text-amber-300 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تواصل مع الإدارة عبر الواتساب</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setInfoModal('about')}
                    className="hover:text-amber-300 cursor-pointer transition-colors"
                  >
                    أهداف ومنهج المقرأة
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSupervisorSecretPassword('');
                      setSupervisorError(null);
                      setSupervisorSuccess(null);
                      setIsSupervisorModalOpen(true);
                    }}
                    className="hover:text-amber-300 cursor-pointer transition-colors flex items-center gap-1 text-amber-400/90"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>بوابة المشرف العام المؤمنة</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Follow & Social - القنوات الرسمية المعتمدة */}
            <div className="md:col-span-2 space-y-3 font-kufi">
              <h4 className="text-sm font-bold text-[#C5A059] border-b border-emerald-800 pb-1 inline-block">
                القنوات والمنصات الرسمية المعتمدة
              </h4>
              <p className="text-[11px] text-slate-300">
                جميع قنوات المقرأة الموثقة في مكان واحد دون تشتيت:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 1. قناة الواتساب */}
                <a
                  href="https://whatsapp.com/channel/0029Vb4RehabQuran"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#25D366]/20 text-[#25D366] flex items-center justify-center font-bold">W</span>
                    <span className="font-bold text-[11px]">قناة الواتساب</span>
                  </span>
                  <span className="text-[10px] text-emerald-300 group-hover:underline">انضمام ←</span>
                </a>

                {/* 2. قناة التيلجرام */}
                <a
                  href="https://t.me/rehabpa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-sky-950/60 hover:bg-sky-950 border border-sky-700/60 text-sky-200 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">T</span>
                    <span className="font-bold text-[11px]">قناة التيلجرام</span>
                  </span>
                  <span className="text-[10px] text-sky-300 group-hover:underline">انضمام ←</span>
                </a>

                {/* 3. الفيسبوك */}
                <a
                  href="https://www.facebook.com/profile.php?id=61594338165497"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-950 border border-blue-700/60 text-blue-200 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">F</span>
                    <span className="font-bold text-[11px]">صفحة الفيسبوك</span>
                  </span>
                  <span className="text-[10px] text-blue-300 group-hover:underline">متابعة ←</span>
                </a>

                {/* 4. الانستجرام */}
                <a
                  href="https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-pink-950/60 hover:bg-pink-950 border border-pink-700/60 text-pink-200 flex items-center justify-between gap-2 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">I</span>
                    <span className="font-bold text-[11px]">حساب الإنستجرام</span>
                  </span>
                  <span className="text-[10px] text-pink-300 group-hover:underline">متابعة ←</span>
                </a>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                جميع الخدمات والبرامج القرآنية مجانية لوجه الله تعالى.
              </p>
            </div>
          </div>

          {/* Bottom Bar: Quranic Verse & Copyright */}
          <div className="border-t border-emerald-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-kufi text-slate-400">
            <p className="font-amiri text-[#C5A059] text-sm sm:text-base font-bold">
              ﴿ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ ﴾
            </p>
            <p className="text-[11px]">
              جميع الحقوق محفوظة لمقرأة رحاب القرآن الإلكترونية © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {/* زر الواتساب العائم للتواصل السريع في شاشة الترحيب */}
      <aside aria-label="تواصل سريع عبر واتساب" className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-50 flex items-center gap-3 group" dir="ltr">
        <a
          href={`https://wa.me/967714371599?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أود الاستفسار والتواصل السريع مع إدارة مقرأة رحاب القرآن الإلكترونية 📖✨')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/60 hover:ring-[#25D366]/50 group"
          aria-label="تواصل سريع عبر واتساب"
          title="تواصل سريع عبر واتساب"
        >
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />
          <svg className="w-7 h-7 fill-white relative z-10 drop-shadow-xs" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-200 border-2 border-[#046A38] rounded-full z-20 shadow-xs" />
        </a>
        <div dir="rtl" className="hidden md:flex items-center gap-2 bg-[#051c11]/95 text-[#f7e8c6] border border-[#C5A059]/60 text-xs font-bold py-2 px-3.5 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap backdrop-blur-xs select-none">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>تواصل سريع مع المقرأة عبر واتساب</span>
        </div>
      </aside>
    </div>
  );
};
