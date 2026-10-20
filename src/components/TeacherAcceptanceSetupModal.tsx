/**
 * نافذة «اعتماد المعلم وتعيين الحلقات والأوقات»
 * مقرأة رحاب القرآن الإلكترونية - الإصدار المعتمد 2026
 *
 * عند نقر المشرف على "قبول":
 * 1. تعيين الحلقات (اختيار أو إنشاء).
 * 2. تعيين أوقات الحصص والإقراء.
 * 3. حفظ البيانات في Firestore (teachers & users & halqas).
 * 4. توليد رسالة WhatsApp رسمية بتعليمات الدخول مع زر مباشر للإرسال.
 */

import React, { useState, useMemo } from 'react';
import { 
  X, Check, Sparkles, ShieldCheck, GraduationCap, Clock, 
  Send, ExternalLink, Copy, BookOpen, AlertCircle, Plus, Calendar
} from 'lucide-react';
import { 
  TeacherApplication, 
  approveTeacherApplicationWithAssignment, 
  buildTeacherAdmissionWhatsAppInstructions 
} from '../services/teacherApplicationService';
import { getAcademyDatabase } from '../data/academyDb';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';

interface TeacherAcceptanceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherApplication;
  adminName: string;
  onApprovedSuccess: () => void;
}

export const TeacherAcceptanceSetupModal: React.FC<TeacherAcceptanceSetupModalProps> = ({
  isOpen,
  onClose,
  teacher,
  adminName,
  onApprovedSuccess,
}) => {
  const academyDb = useMemo(() => getAcademyDatabase(), []);

  // الحلقات المقترحة من النظام
  const existingHalqaTitles = useMemo(() => {
    const set = new Set<string>();
    (academyDb.classes || []).forEach(c => {
      const halqaName = (c as any).title || c.name;
      if (halqaName) set.add(halqaName);
    });
    // حلقات افتراضية إضافية معتمدة للتصنيفات
    set.add('حلقة الإتقان وتصحيح التلاوة (الفجر)');
    set.add('حلقة تصحيح التلاوة وأحكام التجويد');
    set.add('حلقة حفظ وتثبيت القرآن الكريم (عصراً)');
    set.add('حلقة الأشبال أطفال (تعليم وبراعم)');
    set.add('حلقة المتون الجزرية والقراءات (مساءً)');
    set.add('حلقة طالبات التحفيظ والإتقان');
    return Array.from(set);
  }, [academyDb]);

  // حالة الاختيارات
  const [selectedHalqas, setSelectedHalqas] = useState<string[]>([
    existingHalqaTitles[0] || 'حلقة القرآن الكريم والإتقان'
  ]);
  const [customHalqaInput, setCustomHalqaInput] = useState('');
  const [targetSection, setTargetSection] = useState<'male' | 'female' | 'both'>(
    teacher.targetSection || 'both'
  );

  // الأوقات
  const commonTimeSlots = [
    'الفجر: 5:00 ص - 6:30 ص',
    'الضحى: 9:00 ص - 10:30 ص',
    'العصر: 4:30 م - 6:00 م',
    'المغرب: 6:30 م - 7:45 م',
    'العشاء: 8:00 م - 9:30 م',
  ];
  const [selectedTimes, setSelectedTimes] = useState<string[]>([commonTimeSlots[0]]);
  const [customTimeSlot, setCustomTimeSlot] = useState(teacher.preferredTimes || '');

  // حالة التنفيذ
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApprovedDone, setIsApprovedDone] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen) return null;

  const toggleHalqa = (title: string) => {
    if (selectedHalqas.includes(title)) {
      if (selectedHalqas.length === 1) return; // يجب اختيار حلقة واحدة على الأقل
      setSelectedHalqas(selectedHalqas.filter(h => h !== title));
    } else {
      setSelectedHalqas([...selectedHalqas, title]);
    }
  };

  const handleAddCustomHalqa = () => {
    const trimmed = customHalqaInput.trim();
    if (trimmed && !selectedHalqas.includes(trimmed)) {
      setSelectedHalqas([...selectedHalqas, trimmed]);
      setCustomHalqaInput('');
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleConfirmApproval = async () => {
    setError(null);
    if (selectedHalqas.length === 0) {
      setError('يرجى تحديد حلقة واحدة على الأقل لإسنادها للمعلم.');
      return;
    }

    const finalTimes = selectedTimes.length > 0 ? selectedTimes : (customTimeSlot ? [customTimeSlot] : ['بحسب التنسيق المعتمد']);
    const effectiveTimeSlot = customTimeSlot.trim() || finalTimes.join(' • ');

    setIsSubmitting(true);
    try {
      const res = await approveTeacherApplicationWithAssignment({
        teacherId: teacher.uid || teacher.id,
        teacherName: teacher.name || teacher.fullName,
        teacherEmail: teacher.email,
        teacherPhone: teacher.phone || teacher.whatsapp,
        assignedHalqaTitles: selectedHalqas,
        assignedTimes: finalTimes,
        timeSlot: effectiveTimeSlot,
        targetSection,
        adminName,
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل اعتماد المعلم');
      }

      // بناء رسالة الواتساب
      const msg = buildTeacherAdmissionWhatsAppInstructions({
        teacherName: teacher.name || teacher.fullName,
        email: teacher.email,
        assignedHalqas: selectedHalqas,
        assignedTimes: effectiveTimeSlot,
      });
      setWhatsappMessage(msg);

      // تنظيف رقم الهاتف للواتساب
      const cleanPhoneObj = validateAndCleanWhatsAppNumber(teacher.phone || teacher.whatsapp, '967');
      const waPhone = cleanPhoneObj.cleanPhone || teacher.phone || teacher.whatsapp;
      const waUrl = `https://wa.me/${waPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
      setWhatsappUrl(waUrl);

      setIsApprovedDone(true);
      setIsSubmitting(false);
      onApprovedSuccess();
    } catch (err: any) {
      console.error('[handleConfirmApproval] error:', err);
      setError(err?.message || 'حدث خطأ أثناء حفظ التعيين، يرجى المحاولة ثانية.');
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    if (!whatsappMessage) return;
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans" dir="rtl">
      <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-[#046A38] via-[#057d42] to-[#046A38] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                  {isApprovedDone ? 'تم اعتماد المعلم بنجاح 🎉' : 'اعتماد المعلم وتعيين الحلقات والأوقات'}
                </h3>
              </div>
              <p className="text-xs text-emerald-100">
                {teacher.name || teacher.fullName} • {teacher.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوى النافذة */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* إذا تم الاعتماد بنجاح -> إظهار بطاقة رسالة الواتساب */}
          {isApprovedDone ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#046A38] font-bold text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>تم تفعيل حساب المعلم وتعيين الحلقات والأوقات في النظام بنجاح!</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  يمكن للمعلم الآن تسجيل الدخول مباشرة إلى لوحة المعلم واستعراض حلقاته وطلابه. يرجى إرسال تعليمات الدخول عبر الواتساب لإشعاره بالقبول.
                </p>
              </div>

              {/* معاينة رسالة الواتساب */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#046A38]" />
                    <span>نص رسالة الواتساب الجاهزة للإرسال:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedMsg ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMsg ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-sans text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {whatsappMessage}
                </div>
              </div>

              {/* زر إرسال واتساب المباشر المعتمد */}
              <div className="space-y-2 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-[#046A38] hover:from-emerald-500 hover:to-[#03542c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 text-[#C5A059] rotate-180" />
                  <span>📱 إرسال تعليمات الدخول عبر WhatsApp للمعلم الآن</span>
                  <ExternalLink className="w-4 h-4 text-emerald-200" />
                </a>
                <p className="text-[11px] text-center text-slate-500">
                  سيتم فتح محادثة WhatsApp مباشرة مع المعلم برقم ({teacher.phone || teacher.whatsapp})
                </p>
              </div>
            </div>
          ) : (
            /* نموذج إعداد وتعيين المعلم قبل الاعتماد */
            <div className="space-y-5">
              {/* ملخص بيانات المعلم ومؤهلاته */}
              <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#046A38] text-sm font-serif">{teacher.name || teacher.fullName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                    التخصص: {teacher.specialty || 'قرآن وتجويد'}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>المؤهلات والإجازات:</strong> {teacher.qualificationSummary || teacher.qualifications?.ijazat || 'غير محدد'}
                </p>
                <div className="flex items-center gap-4 text-slate-600 text-[11px]">
                  <span><strong>الخبرة:</strong> {teacher.experienceYears || '3-5'} سنوات</span>
                  <span><strong>الهاتف / واتساب:</strong> <span dir="ltr" className="font-mono">{teacher.phone || teacher.whatsapp}</span></span>
                </div>
              </div>

              {/* قسم 1: تعيين الحلقات */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#046A38]" />
                    <span>1. تعيين الحلقات القرآنية المسندة للمعلم: <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-slate-500">اختر حلقة أو أكثر</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingHalqaTitles.map((title) => {
                    const isSelected = selectedHalqas.includes(title);
                    return (
                      <button
                        type="button"
                        key={title}
                        onClick={() => toggleHalqa(title)}
                        className={`p-2.5 rounded-xl border text-xs text-right transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-[#046A38] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <span>{title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* إضافة اسم حلقة مخصصة */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customHalqaInput}
                    onChange={(e) => setCustomHalqaInput(e.target.value)}
                    placeholder="أو اكتب اسم حلقة مخصصة جديدة..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomHalqa}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#046A38]" />
                    <span>إضافة</span>
                  </button>
                </div>
              </div>

              {/* قسم 2: تعيين القسم المستهدف */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  2. القسم الإقرائي المعين فيه:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'قسم الطلاب (بنين)' },
                    { id: 'female', label: 'قسم الطالبات (بنات)' },
                    { id: 'both', label: 'كلا القسمين' },
                  ].map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setTargetSection(s.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        targetSection === s.id
                          ? 'bg-[#046A38] text-white border-[#046A38] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* قسم 3: تعيين الأوقات */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#046A38]" />
                    <span>3. تعيين أوقات الحصص والإقراء: <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-slate-500">حدد الفترات المناسبة</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {commonTimeSlots.map((ts) => {
                    const isSelected = selectedTimes.includes(ts);
                    return (
                      <button
                        type="button"
                        key={ts}
                        onClick={() => toggleTime(ts)}
                        className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                        }`}
                      >
                        {isSelected && <span className="ml-1 text-amber-800 font-bold">✓</span>}
                        {ts}
                      </button>
                    );
                  })}
                </div>

                {/* وقت مخصص إضافي */}
                <div>
                  <input
                    type="text"
                    value={customTimeSlot}
                    onChange={(e) => setCustomTimeSlot(e.target.value)}
                    placeholder="أو وقت مخصص (مثال: السبت والإثنين والأربعاء 5:00 ص - 6:30 ص توقيت مكة)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* أسفل النافذة والأزرار */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {isApprovedDone ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
            >
              إغلاق النافذة
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmApproval}
                className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري حفظ الاعتماد...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#C5A059]" />
                    <span>تأكيد قبول المعلم وتعيين الحلقات</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
