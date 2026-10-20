/**
 * نافذة «إعداد حساب الطالب وتعيينه»
 * مقرأة رحاب القرآن الإلكترونية - الإصدار المعتمد 2026
 * 
 * الميزات:
 * 1. إنشاء الرقم الأكاديمي تلقائياً بصيغة فريدة (RQ-2026-XXXX).
 * 2. اسم المستخدم = الرقم الأكاديمي نفسه.
 * 3. كلمة مرور مؤقتة آمنة (لا تُخزن كنص مكشوف في Firestore، ولا تظهر للمعلم).
 * 4. اختيار يدوي للحلقة من قِبل المشرف فقط.
 * 5. اختيار المعلم المسؤول عن الحلقة/الطالب.
 * 6. تحديد أيام ووقت الحلقة والمنطقة الزمنية.
 * 7. ربط مستوى الطالب أو الخطة التعليمية.
 * 8. رابط Google Meet ورابط مجموعة WhatsApp للحلقة.
 * 9. ربط العلاقة: student -> assignedHalqa -> assignedTeacher.
 * 10. زر «إرسال بيانات الدخول عبر WhatsApp» برابط مباشر ونص الرسالة الشامل.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, Sparkles, ShieldCheck, UserCheck, BookOpen, Clock, 
  ExternalLink, MessageCircle, Copy, AlertTriangle, RefreshCw, 
  Eye, EyeOff, Calendar, Globe, Send, User, ChevronDown
} from 'lucide-react';
import { StudentApplicationItem, approveStudentApplicationWithAssignment, ApproveWithAssignmentResult, generateUniqueAcademicId } from '../services/studentApplicationService';
import { getAcademyDatabase } from '../data/academyDb';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';
import { COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';

interface StudentAcceptanceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: StudentApplicationItem;
  adminName: string;
  onApprovedSuccess: (result: ApproveWithAssignmentResult) => void;
}

// دالة توليد كلمة مرور مؤقتة آمنة وسهلة القراءة للطالب
function generateSecurePassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `RQ@${digits}${randomStr}`;
}

export const StudentAcceptanceSetupModal: React.FC<StudentAcceptanceSetupModalProps> = ({
  isOpen,
  onClose,
  application,
  adminName,
  onApprovedSuccess,
}) => {
  // 1. استخراج الحلقات والمعلمين من قاعدة البيانات
  const academyDb = useMemo(() => getAcademyDatabase(), []);
  const isFemale = application.gender === 'female';

  // 2. الحلقات المتاحة
  const availableHalqas = useMemo(() => {
    const list = academyDb.classes || [];
    // ترتيب الحلقات المناسبة لقسم الطالب أولاً
    return [...list].sort((a, b) => {
      const aMatches = isFemale ? a.section === 'female' : a.section === 'male';
      const bMatches = isFemale ? b.section === 'female' : b.section === 'male';
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [academyDb, isFemale]);

  // 3. المعلمون المتاحون
  const availableTeachers = useMemo(() => {
    const list = academyDb.teachers || [];
    return [...list].sort((a, b) => {
      const aMatches = isFemale ? a.section === 'female' : a.section === 'male';
      const bMatches = isFemale ? b.section === 'female' : b.section === 'male';
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [academyDb, isFemale]);

  // 4. حالة الحقول
  const [academicId, setAcademicId] = useState<string>('');
  const [temporaryPassword, setTemporaryPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const [selectedHalqaId, setSelectedHalqaId] = useState<string>('');
  const [halqaTitle, setHalqaTitle] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [halqaDays, setHalqaDays] = useState<string>('');
  const [halqaTime, setHalqaTime] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('توقيت مكة المكرمة / صنعاء (GMT+3)');
  const [studentLevelOrPlan, setStudentLevelOrPlan] = useState<string>('');
  const [googleMeetUrl, setGoogleMeetUrl] = useState<string>('');
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState<string>('');

  // 5. حالة الواجهة والنتيجة
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [approvalResult, setApprovalResult] = useState<ApproveWithAssignmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // تهيئة القيم التلقائية عند فتح النافذة
  useEffect(() => {
    if (!isOpen) return;

    // توليد الرقم الأكاديمي الفريد
    const existingIds = academyDb.students.map(s => s.academicId).filter(Boolean);
    const newAcademicId = generateUniqueAcademicId(existingIds);
    setAcademicId(newAcademicId);

    // توليد كلمة المرور
    setTemporaryPassword(generateSecurePassword());

    // اختيار الحلقة الافتراضية المناسبة
    const defaultHalqa = availableHalqas[0];
    if (defaultHalqa) {
      setSelectedHalqaId(defaultHalqa.id);
      setHalqaTitle(defaultHalqa.name);
      setSelectedTeacherId(defaultHalqa.teacherId);
      setTeacherName(defaultHalqa.teacherName);
      setHalqaDays(defaultHalqa.days?.join('، ') || (isFemale ? 'الأحد، الثلاثاء، الخميس' : 'السبت، الإثنين، الأربعاء'));
      setHalqaTime(defaultHalqa.scheduleTime || (isFemale ? '4:00 م - 5:30 م' : '5:30 ص - 7:00 ص'));
      setGoogleMeetUrl(defaultHalqa.meetUrl || '');
    } else {
      setSelectedHalqaId(isFemale ? 'cls-f1' : 'cls-m1');
      setHalqaTitle(isFemale ? 'حلقة الزهراوان لتثبيت الحفظ (عصراً)' : 'حلقة الإتقان والتحفيظ (الفجر)');
      setSelectedTeacherId(isFemale ? 'tch-2' : 'tch-1');
      setTeacherName(isFemale ? 'الشيخة أم أنس الزبيدي' : 'الشيخ إبراهيم الوصابي');
      setHalqaDays(isFemale ? 'الأحد، الثلاثاء، الخميس' : 'السبت، الإثنين، الأربعاء');
      setHalqaTime(isFemale ? '4:00 م - 5:30 م' : '5:30 ص - 7:00 ص');
      setGoogleMeetUrl(isFemale ? 'https://meet.google.com/quran-rehab-female' : 'https://meet.google.com/quran-rehab-male');
    }

    // مستوى الطالب أو الخطة
    const levelPlan = [
      application.studyType,
      application.memorization ? `مقدار الحفظ: ${application.memorization}` : '',
      application.riwayah ? `برواية ${application.riwayah}` : ''
    ].filter(Boolean).join(' - ') || 'حفظ القرآن الكريم وتجويده';
    setStudentLevelOrPlan(levelPlan);

    // إعادة ضبط الحالات
    setStep('form');
    setApprovalResult(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [isOpen, application, academyDb, availableHalqas, isFemale]);

  // تحديث بيانات الحلقة والمعلم عند تغيير الحلقة
  const handleHalqaSelectChange = (halqaId: string) => {
    setSelectedHalqaId(halqaId);
    const found = availableHalqas.find(h => h.id === halqaId);
    if (found) {
      setHalqaTitle(found.name);
      setSelectedTeacherId(found.teacherId);
      setTeacherName(found.teacherName);
      if (found.days && found.days.length > 0) {
        setHalqaDays(found.days.join('، '));
      }
      if (found.scheduleTime) {
        setHalqaTime(found.scheduleTime);
      }
      if (found.meetUrl) {
        setGoogleMeetUrl(found.meetUrl);
      }
    }
  };

  // تحديث المعلم
  const handleTeacherSelectChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const found = availableTeachers.find(t => t.id === teacherId);
    if (found) {
      setTeacherName(found.name);
    }
  };

  // إعادة توليد الرقم الأكاديمي يدوياً
  const handleRegenerateAcademicId = () => {
    const existingIds = academyDb.students.map(s => s.academicId).filter(Boolean);
    const newAcademicId = generateUniqueAcademicId(existingIds);
    setAcademicId(newAcademicId);
  };

  // إعادة توليد كلمة المرور
  const handleRegeneratePassword = () => {
    setTemporaryPassword(generateSecurePassword());
  };

  // إرسال وقبول الطلب وتعيين الحساب
  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await approveStudentApplicationWithAssignment({
        applicationId: application.id,
        adminName: adminName || 'إدارة المقرأة',
        application,
        academicId: academicId.trim(),
        username: academicId.trim(), // اسم المستخدم = الرقم الأكاديمي
        temporaryPassword: temporaryPassword.trim(),
        halqaId: selectedHalqaId || (isFemale ? 'cls-f1' : 'cls-m1'),
        halqaTitle: halqaTitle.trim() || (isFemale ? 'حلقة الزهراوان' : 'حلقة الإتقان'),
        teacherId: selectedTeacherId || (isFemale ? 'tch-2' : 'tch-1'),
        teacherName: teacherName.trim() || (isFemale ? 'الشيخة أم أنس الزبيدي' : 'الشيخ إبراهيم الوصابي'),
        halqaDays: halqaDays.trim() || 'السبت، الإثنين، الأربعاء',
        halqaTime: halqaTime.trim() || '5:30 ص - 7:00 ص',
        timezone,
        studentLevelOrPlan: studentLevelOrPlan.trim() || 'حفظ القرآن الكريم',
        googleMeetUrl: googleMeetUrl.trim() || undefined,
        whatsappGroupUrl: whatsappGroupUrl.trim() || undefined,
      });

      if (res.success) {
        setApprovalResult(res);
        setStep('success');
        onApprovedSuccess(res);
      } else {
        setErrorMessage(res.error || 'تعذر إتمام قبول الطالب وتعيين الحساب');
      }
    } catch (err: any) {
      console.error('Error during approval submit:', err);
      setErrorMessage(err?.message || 'حدث خطأ غير متوقع أثناء إعداد وتعيين الحساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // نسخ نص رسالة واتساب
  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // نسخ كلمة المرور
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (!isOpen) return null;

  // التحقق من رقم الهاتف الدولي
  const phoneValidation = validateAndCleanWhatsAppNumber(
    application.whatsapp || application.phone,
    application.country
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full border-2 border-[#C5A059] shadow-2xl overflow-hidden animate-scale-up my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] p-5 text-white flex items-center justify-between border-b-2 border-[#C5A059]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059] text-white flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-serif text-white">
                {step === 'form' ? 'إعداد حساب الطالب وتعيين الحلقة والمعلم' : 'تم قبول الطالب وإنشاء الحساب بنجاح!'}
              </h3>
              <p className="text-xs text-emerald-100">
                الطالب: <strong className="text-amber-200">{application.fullName}</strong> ({isFemale ? 'قسم الطالبات' : 'قسم الطلاب'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEP 1: FORM (إعداد وتعيين الحساب) ================= */}
        {step === 'form' && (
          <form onSubmit={handleSubmitApproval} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-800 flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* بطاقة التنبيه الأمني */}
            <div className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>أمان النظام:</strong> لا يتم تخزين كلمة المرور كنص مكشوف في Firestore، ولا تظهر للمعلم أو لأي مستخدم آخر.
              </span>
            </div>

            {/* الحقل 1 & 2: الرقم الأكاديمي واسم المستخدم */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    1. الرقم الأكاديمي:
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateAcademicId}
                    className="text-[11px] text-[#046A38] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    title="توليد رقم فريد جديد"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>توليد جديد</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={academicId}
                    onChange={(e) => setAcademicId(e.target.value.toUpperCase())}
                    className="w-full bg-[#F9F6F0] border border-[#C5A059]/60 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#046A38] tracking-wider focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                    placeholder="RQ-2026-6365"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-2.5 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    فريد
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  يُنشأ بصيغة RQ-2026-XXXX ولا يتكرر
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  2. اسم المستخدم:
                </label>
                <input
                  type="text"
                  readOnly
                  value={academicId}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-700 select-all focus:outline-none"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  اسم المستخدم هو الرقم الأكاديمي نفسه تلقائياً
                </span>
              </div>
            </div>

            {/* الحقل 3: كلمة المرور المؤقتة الآمنة */}
            <div className="p-3.5 bg-[#F9F6F0] border border-[#C5A059]/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>3. كلمة المرور المؤقتة:</span>
                  <span className="text-[10px] bg-emerald-100 text-[#046A38] px-2 py-0.5 rounded-full font-bold">
                    توليد آمن
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="text-[11px] text-[#046A38] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>كلمة مرور أخرى</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPass ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPass ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 pl-10 focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">
                تُرسل للطالب عبر واتساب عند القبول، ويطلب منه تغييرها عند أول تسجيل دخول.
              </span>
            </div>

            {/* الحقل 4 & 5: اختيار الحلقة والمعلم (يدوي من المشرف فقط) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  4. الحلقة القرآنية (اختيار يدوي من المشرف):
                </label>
                <div className="relative">
                  <select
                    value={selectedHalqaId}
                    onChange={(e) => handleHalqaSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#046A38] appearance-none"
                  >
                    {availableHalqas.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.section === 'female' ? 'طالبات' : 'طلاب'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={halqaTitle}
                  onChange={(e) => setHalqaTitle(e.target.value)}
                  placeholder="أو اكتب مسمى الحلقة يدوياً..."
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  5. المعلم المسؤول عن الحلقة/الطالب:
                </label>
                <div className="relative">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => handleTeacherSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#046A38] appearance-none"
                  >
                    {availableTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.section === 'female' ? 'معلمة' : 'معلم'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="اسم المعلم المعتمد..."
                  className="mt-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* الحقل 6 & 7 & 8: أيام ووقت الحلقة والمنطقة الزمنية */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  6. أيام الحلقة:
                </label>
                <input
                  type="text"
                  required
                  value={halqaDays}
                  onChange={(e) => setHalqaDays(e.target.value)}
                  placeholder="السبت، الإثنين، الأربعاء"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  7. وقت الحلقة:
                </label>
                <input
                  type="text"
                  required
                  value={halqaTime}
                  onChange={(e) => setHalqaTime(e.target.value)}
                  placeholder="5:30 ص - 7:00 ص"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  8. المنطقة الزمنية:
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                >
                  <option value="توقيت مكة المكرمة / صنعاء (GMT+3)">مكة / صنعاء (GMT+3)</option>
                  <option value="توقيت القاهرة (GMT+2)">القاهرة (GMT+2)</option>
                  <option value="توقيت الإمارات (GMT+4)">الإمارات (GMT+4)</option>
                  <option value="توقيت غرينتش (GMT+0)">غرينتش (GMT+0)</option>
                  <option value="توقيت وسط أوروبا (GMT+1)">أوروبا (GMT+1)</option>
                  <option value="توقيت شرق أمريكا (GMT-5)">شرق أمريكا (GMT-5)</option>
                </select>
              </div>
            </div>

            {/* الحقل 9: مستوى الطالب أو الخطة التعليمية */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                9. مستوى الطالب أو الخطة التعليمية:
              </label>
              <input
                type="text"
                required
                value={studentLevelOrPlan}
                onChange={(e) => setStudentLevelOrPlan(e.target.value)}
                placeholder="حفظ القرآن الكريم وتجويده - خطة 3 أجزاء"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#046A38]"
              />
            </div>

            {/* الحقل 10 & 11: روابط Google Meet ومجموعة WhatsApp للحلقة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  10. رابط Google Meet للحلقة (إن وجد):
                </label>
                <input
                  type="url"
                  value={googleMeetUrl}
                  onChange={(e) => setGoogleMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  11. رابط مجموعة WhatsApp للحلقة (إن وجد):
                </label>
                <input
                  type="url"
                  value={whatsappGroupUrl}
                  onChange={(e) => setWhatsappGroupUrl(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#046A38]"
                  dir="ltr"
                />
              </div>
            </div>

            {/* رقم واتساب الطالب المعتمد للإرسال */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">رقم هاتف الطالب المعتمد للإرسال:</span>
              <span className="font-mono font-bold text-[#046A38] bg-white px-2.5 py-1 rounded-xl border border-slate-200" dir="ltr">
                {phoneValidation.formattedDisplay || application.whatsapp || application.phone}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 border border-[#C5A059] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جاري إنشاء الحساب وتعيين الحلقة...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>قبول وإنشاء الحساب وتعيين الحلقة</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: SUCCESS & WHATSAPP (المرحلة السابعة) ================= */}
        {step === 'success' && approvalResult && (
          <div className="p-5 sm:p-7 space-y-5 max-h-[85vh] overflow-y-auto">
            
            {/* النجاح والتأكيد */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm sm:text-base text-emerald-950 font-serif">
                  تم قبول الطالب وإنشاء الحساب الأكاديمي بنجاح! ✨
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  تم ربط الطالب ({application.fullName}) بالحلقة (<strong className="text-emerald-950">{approvalResult.halqaTitle}</strong>) والمعلم (<strong className="text-emerald-950">{approvalResult.teacherName}</strong>).
                </p>
              </div>
            </div>

            {/* بطاقة ملخص الحساب */}
            <div className="bg-[#F9F6F0] border-2 border-[#C5A059]/50 rounded-2xl p-4 space-y-2.5 text-xs text-slate-800">
              <h5 className="font-bold text-xs text-[#046A38] border-b border-[#C5A059]/30 pb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#046A38]" />
                <span>بيانات الحساب الأكاديمي المعتمدة:</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">اسم الطالب:</span>
                  <strong className="text-slate-900">{application.fullName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">الرقم الأكاديمي:</span>
                  <strong className="font-mono text-[#046A38]" dir="ltr">{approvalResult.academicId}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">اسم المستخدم:</span>
                  <strong className="font-mono text-slate-900" dir="ltr">{approvalResult.username}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">كلمة المرور المؤقتة:</span>
                  <strong className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md" dir="ltr">{approvalResult.temporaryPassword}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">الحلقة القرآنية:</span>
                  <strong className="text-slate-900">{approvalResult.halqaTitle}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">فضيلة الشيخ:</span>
                  <strong className="text-slate-900">{approvalResult.teacherName}</strong>
                </div>
                <div className="col-span-full flex justify-between py-1">
                  <span className="text-slate-500">الموعد والمنطقة:</span>
                  <span className="font-mono text-slate-800">{approvalResult.halqaSchedule}</span>
                </div>
              </div>
            </div>

            {/* معاينة نص رسالة واتساب المجهزة */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>نص رسالة واتساب الجاهزة للإرسال:</span>
                </span>
                <span className="font-mono text-[11px] text-[#046A38]" dir="ltr">
                  {approvalResult.whatsAppResult.formattedDisplay || approvalResult.whatsAppResult.cleanPhone}
                </span>
              </div>

              <textarea
                readOnly
                rows={8}
                value={approvalResult.whatsAppResult.messageText}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3.5 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none select-text"
              />
            </div>

            {/* أزرار الإجراءات الرئيسية */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleCopyMessage(approvalResult.whatsAppResult.messageText)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-700">تم نسخ نص الرسالة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ نص الرسالة</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer flex-1 sm:flex-none text-center"
                >
                  إغلاق
                </button>

                {/* زر إرسال بيانات الدخول عبر WhatsApp المباشر */}
                {approvalResult.whatsAppResult.isValid ? (
                  <a
                    href={approvalResult.whatsAppResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                    <span>📱 إرسال تعليمات الدخول عبر WhatsApp</span>
                  </a>
                ) : (
                  <div className="p-2 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                    رقم الهاتف غير صالح لواتساب
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
