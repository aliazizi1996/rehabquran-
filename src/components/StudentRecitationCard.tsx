import React, { useState } from 'react';
import { 
  BookOpen, Award, CheckCircle2, Share2, Sparkles, 
  MessageSquare, Clock, Save, Phone, Trash2, 
  MessageCircle, Check, FileText, AlertTriangle, 
  Printer, X, ShieldCheck
} from 'lucide-react';
import { 
  DailyRecitationRecord, 
  PerformanceGrade, 
  RecitationAttendanceStatus 
} from '../types';
import { 
  updateDailyRecitation, 
  getGradeLabel, 
  getAttendanceStatusInfo,
  QURAN_SURAHS,
  issueCertificate
} from '../data/evaluationStore';
import { getWhatsAppAbsenteeMessage } from '../data/attendanceStore';
import { OfficialLogo } from './OfficialLogo';
import { 
  triggerRecitationApprovedNotification, 
  triggerSheikhMessageNotification 
} from '../data/userNotificationStore';
import { 
  cleanWhatsAppNumber, 
  validateAndCleanWhatsAppNumber 
} from '../services/whatsappService';

interface StudentRecitationCardProps {
  record: DailyRecitationRecord;
  onDelete: (id: string, name: string) => void;
  onToast: (msg: string) => void;
  onNavigateToCertificatesTab?: (studentName: string, section: 'male' | 'female', teacher: string) => void;
}

// Utility to normalize WhatsApp phone numbers internationally E.164
export const formatWhatsAppPhone = (phone?: string): string => {
  return cleanWhatsAppNumber(phone);
};

export const StudentRecitationCard: React.FC<StudentRecitationCardProps> = ({
  record,
  onDelete,
  onToast,
  onNavigateToCertificatesTab,
}) => {
  // Local card state for live editing
  const [surahName, setSurahName] = useState(record.surahName || 'سورة البقرة');
  const [juzNumber, setJuzNumber] = useState(record.juzNumber || 1);
  const [ayahStart, setAyahStart] = useState(record.ayahStart || 1);
  const [ayahEnd, setAyahEnd] = useState(record.ayahEnd || 25);
  const [attendanceStatus, setAttendanceStatus] = useState<RecitationAttendanceStatus>(record.attendanceStatus || 'present');
  const [grade, setGrade] = useState<PerformanceGrade>(record.grade || 'excellent');
  const [score, setScore] = useState(record.score || 95);
  const [memorizationQuality, setMemorizationQuality] = useState<'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج مراجعة وتكرار'>(
    record.memorizationQuality || 'ممتاز'
  );
  const [tajweedNotes, setTajweedNotes] = useState(record.tajweedNotes || '');
  const [teacherFeedback, setTeacherFeedback] = useState(record.teacherFeedback || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [issuedCertNumber, setIssuedCertNumber] = useState<string | null>(null);

  const isMale = record.studentSection === 'male';
  const cleanPhone = formatWhatsAppPhone(record.studentPhone);
  const gradeInfo = getGradeLabel(grade);
  const statusInfo = getAttendanceStatusInfo(attendanceStatus);
  const ayahCount = Math.max(1, (Number(ayahEnd) || 1) - (Number(ayahStart) || 1) + 1);

  // When Surah changes, auto-update the Juz number
  const handleSurahChange = (selectedName: string) => {
    setSurahName(selectedName);
    const match = QURAN_SURAHS.find((s) => s.name === selectedName);
    if (match) {
      setJuzNumber(match.juz);
    }
  };

  // Quick save function
  const handleSaveCard = () => {
    updateDailyRecitation(record.id, {
      surahName,
      juzNumber: Number(juzNumber) || 1,
      ayahStart: Number(ayahStart) || 1,
      ayahEnd: Number(ayahEnd) || 1,
      attendanceStatus,
      grade,
      score: Number(score) || 90,
      memorizationQuality,
      tajweedNotes: tajweedNotes.trim() || undefined,
      teacherFeedback: teacherFeedback.trim() || undefined,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onToast(`تم حفظ وتحديث بيانات سجل التسميع للطالب (${record.studentName}) بنجاح.`);

    // Trigger instant user notification popup
    triggerRecitationApprovedNotification({
      sheikhName: record.evaluatorTeacher || 'المعلم المشرف',
      studentName: record.studentName,
      surahName,
      ayahStart: Number(ayahStart) || 1,
      ayahEnd: Number(ayahEnd) || 1,
      score: Number(score) || 90,
      grade: gradeInfo.label,
      feedback: teacherFeedback.trim() || undefined,
    });
  };

  // WhatsApp Share Function with formatted message
  const handleWhatsAppShare = () => {
    const message = `*تقرير متابعة التسميع اليومي بمقرأة رحاب القرآن الإلكترونية* 📖
━━━━━━━━━━━━━━━━━━━━
👤 *اسم الطالب:* ${record.studentName}
📌 *القسم:* ${isMale ? 'قسم الطلاب (بنين)' : 'قسم الطالبات (بنات)'}
📅 *تاريخ التسميع:* ${record.date}
🎙️ *المعلم المشرف:* ${record.evaluatorTeacher}
━━━━━━━━━━━━━━━━━━━━
📖 *السورة ورقم الجزء:* ${surahName} (الجزء ${juzNumber})
📌 *مقدار الحفظ:* من الآية (${ayahStart}) إلى الآية (${ayahEnd}) [إجمالي: ${ayahCount} آية]
🕒 *حالة الحضور:* ${statusInfo.label}
⭐ *التقدير والأداء:* ${gradeInfo.label} (الدرجة: ${score}/100)
✨ *جودة الحفظ والاستظهار:* ${memorizationQuality}
${tajweedNotes.trim() ? `📝 *ملاحظات التجويد ومخارج الحروف:*\n${tajweedNotes.trim()}\n` : ''}
${teacherFeedback.trim() ? `💬 *الملاحظات العامة وتوجيه المعلم:*\n${teacherFeedback.trim()}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
مقرأة رحاب القرآن الإلكترونية - نحو إتقان كتاب الله تعالى بالسند المتصل`;

    const validation = validateAndCleanWhatsAppNumber(record.studentPhone);
    if (!validation.isValid) {
      onToast(`تعذر فتح واتساب: رقم هاتف الطالب (${record.studentName}) غير صالح (${validation.error || 'يرجى مراجعة الرقم المسجل'}).`);
      return;
    }

    const targetUrl = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(targetUrl, '_blank');
    onToast(`تم فتح الواتساب لمشاركة تقرير التسميع للطالب (${record.studentName})`);
  };

  // WhatsApp Absence Notification if student is marked absent
  const handleSendAbsentWhatsApp = () => {
    const validation = validateAndCleanWhatsAppNumber(record.studentPhone);
    if (!validation.isValid) {
      onToast(`تعذر فتح واتساب: رقم هاتف الطالب (${record.studentName}) غير صالح (${validation.error || 'يرجى مراجعة الرقم المسجل'}).`);
      return;
    }

    const text = getWhatsAppAbsenteeMessage(record.studentName, `${surahName} - الجزء ${juzNumber}`, record.date);
    const url = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onToast(`تم إرسال إشعار الغياب عبر الواتساب للطالب (${record.studentName})`);
  };

  // Issue Certificate directly
  const handleQuickIssueCertificate = () => {
    const newCert = issueCertificate({
      studentId: record.studentId,
      studentName: record.studentName,
      studentSection: record.studentSection,
      title: `شهادة إتقان وتثبيت ${surahName}`,
      achievementType: 'surah_completion',
      description: `تمنح إدارة مقرأة رحاب القرآن الإلكترونية هذه الشهادة تقديراً لاجتياز اختبار إتقان وتثبيت ${surahName} (من الآية ${ayahStart} إلى الآية ${ayahEnd}) من الجزء ${juzNumber} برواية حفص عن عاصم بالسند المتصل وبتقدير ${gradeInfo.label}.`,
      surahOrJuzDetail: `${surahName} (من الآية ${ayahStart} إلى الآية ${ayahEnd}) - الجزء ${juzNumber}`,
      grade: grade === 'excellent' ? 'ممتاز' : grade === 'very_good' ? 'جيد جداً' : 'جيد',
      score: Number(score) || 95,
      evaluatorTeacher: record.evaluatorTeacher,
    });

    setIssuedCertNumber(newCert.certificateNumber);
    setIsCertificateModalOpen(true);
    onToast(`تم إصدار شهادة إتقان رسمية للطالب (${record.studentName}) برقم: ${newCert.certificateNumber}`);
  };

  return (
    <div className="rounded-2xl bg-[#0a1e15] border-2 border-emerald-700/70 hover:border-emerald-500/90 transition-all p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden">
      
      {/* Top Accent Strip */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isMale ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-rose-400'}`} />

      {/* Card Header: Student Identity & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-emerald-800/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full ${isMale ? 'bg-emerald-400 ring-2 ring-emerald-950' : 'bg-amber-400 ring-2 ring-amber-950'}`}></span>
            <h3 className="text-base font-bold text-white font-serif tracking-tight">
              {record.studentName}
            </h3>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${
              isMale 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}>
              {isMale ? 'قسم الطلاب' : 'قسم الطالبات'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              تاريخ الجلسة: {record.date}
            </span>
            <span className="text-emerald-700">•</span>
            <span className="flex items-center gap-1 text-emerald-200">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              المشرف: <strong>{record.evaluatorTeacher}</strong>
            </span>
          </div>
        </div>

        {/* Current Grade Badge & Quick Save indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 shadow-sm ${gradeInfo.badgeBg}`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{gradeInfo.label}</span>
            <span className="font-mono font-bold">({score}%)</span>
          </span>

          {isSaved && (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-600 flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3 text-emerald-400" />
              تم الحفظ
            </span>
          )}
        </div>
      </div>

      {/* Grid: 1. تحديد السورة ورقم الجزء + 2. مقدار الحفظ من الآية إلى الآية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Box 1: تحديد السورة ورقم الجزء */}
        <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              تحديد السورة ورقم الجزء:
            </span>
            <span className="text-[11px] text-emerald-300 font-mono">
              الجزء: {juzNumber}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-slate-400 block mb-0.5">اسم السورة المقررة:</label>
              <select
                value={surahName}
                onChange={(e) => handleSurahChange(e.target.value)}
                className="w-full py-1.5 px-2 rounded-lg bg-[#0b2418] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-400 font-medium"
              >
                {QURAN_SURAHS.map((s) => (
                  <option key={s.number} value={s.name}>
                    {s.number}. {s.name} (جزء {s.juz})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">رقم الجزء:</label>
              <input
                type="number"
                min={1}
                max={30}
                value={juzNumber}
                onChange={(e) => setJuzNumber(Number(e.target.value) || 1)}
                className="w-full py-1.5 px-2 rounded-lg bg-[#0b2418] border border-emerald-800 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Box 2: مقدار الحفظ (من الآية إلى الآية) */}
        <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              مقدار الحفظ والتسميع:
            </span>
            <span className="text-[11px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/70">
              إجمالي {ayahCount} آية
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">من الآية رقم:</label>
              <input
                type="number"
                min={1}
                value={ayahStart}
                onChange={(e) => setAyahStart(Number(e.target.value) || 1)}
                className="w-full py-1.5 px-2 rounded-lg bg-[#0b2418] border border-emerald-800 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">إلى الآية رقم:</label>
              <input
                type="number"
                min={1}
                value={ayahEnd}
                onChange={(e) => setAyahEnd(Number(e.target.value) || 1)}
                className="w-full py-1.5 px-2 rounded-lg bg-[#0b2418] border border-emerald-800 text-xs text-white font-mono text-center focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row: حالة الحضور والغياب (Attendance Status Selector) */}
      <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900/80 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            حالة حضور الطالب في الجلسة:
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.badgeBg}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'present', label: 'حاضر', color: 'bg-emerald-600 text-white' },
            { id: 'absent', label: 'غائب', color: 'bg-red-600 text-white' },
            { id: 'late', label: 'متأخر', color: 'bg-amber-600 text-white' },
            { id: 'excused', label: 'معذور', color: 'bg-indigo-600 text-white' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setAttendanceStatus(item.id as RecitationAttendanceStatus);
              }}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                attendanceStatus === item.id
                  ? `${item.color} shadow-md scale-[1.02]`
                  : 'bg-[#0b2418] text-slate-300 border border-emerald-900 hover:border-emerald-700'
              }`}
            >
              {attendanceStatus === item.id && <Check className="w-3 h-3" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* If Absent -> Show direct WhatsApp Absence Alert & Button */}
        {attendanceStatus === 'absent' && (
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>الطالب مسجل غائباً اليوم. أرسل استفساراً لمعرفة سبب الغياب والاطمئنان عليه:</span>
            </div>
            <button
              type="button"
              onClick={handleSendAbsentWhatsApp}
              className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>إرسال إشعار الغياب عبر الواتساب</span>
            </button>
          </div>
        )}
      </div>

      {/* Row: التقييم والدرجة وجودة الحفظ */}
      <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900/80 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-bold text-amber-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            تقييم مستوى التلاوة والحفظ:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">الدرجة الرقمية:</span>
            <input
              type="number"
              min={50}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value) || 90)}
              className="w-16 py-0.5 px-1.5 rounded bg-[#0b2418] border border-emerald-800 text-xs font-mono font-bold text-white text-center"
            />
            <span className="text-slate-400 text-xs">/ 100</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'excellent', label: 'ممتاز (95-100)', defaultScore: 98, color: 'bg-emerald-600 text-white' },
            { id: 'very_good', label: 'جيد جداً (85-94)', defaultScore: 88, color: 'bg-sky-600 text-white' },
            { id: 'good', label: 'جيد (75-84)', defaultScore: 78, color: 'bg-amber-600 text-white' },
            { id: 'weak', label: 'ضعيف (يحتاج إعادة)', defaultScore: 60, color: 'bg-red-600 text-white' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setGrade(item.id as PerformanceGrade);
                setScore(item.defaultScore);
              }}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                grade === item.id
                  ? `${item.color} shadow-md scale-[1.02]`
                  : 'bg-[#0b2418] text-slate-300 border border-emerald-900 hover:border-emerald-700'
              }`}
            >
              {grade === item.id && <Check className="w-3 h-3" />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dedicated Field: ملاحظات التجويد ومخارج الحروف */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            حقل مخصص لكتابة ملاحظات التجويد ومخارج الحروف:
          </label>
          <span className="text-[10px] text-slate-400">تظهر في تقرير التسميع والواتساب</span>
        </div>
        <textarea
          rows={2}
          value={tajweedNotes}
          onChange={(e) => setTajweedNotes(e.target.value)}
          placeholder="مثال: تمكين المد المنفصل بمقدار 4 حركات، ترقيق الراء المكسورة، ضبط قلقلة القاف، إتمام حركات الضم..."
          className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed font-sans"
        />

        {/* Quick Tajweed Tags for fast teacher insertion */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-slate-400">إضافة سريعة:</span>
          {[
            'إتقان المدود',
            'ترقيق الراء',
            'تفخيم الاستعلاء',
            'ضبط القلقلة',
            'أحكام النون والتنوين',
            'الإخفاء الشفوي',
            'الوقف والابتداء',
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const updated = tajweedNotes ? `${tajweedNotes}، ${tag}` : tag;
                setTajweedNotes(updated);
              }}
              className="text-[10px] bg-[#0b2418] hover:bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Dedicated Field: الملاحظات العامة للمعلم */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            الملاحظات العامة للمعلم وتوجيه المشرف:
          </label>
          <span className="text-[10px] text-slate-400">توجيه وتشجيع الطالب</span>
        </div>
        <textarea
          rows={2}
          value={teacherFeedback}
          onChange={(e) => setTeacherFeedback(e.target.value)}
          placeholder="مثال: ما شاء الله، تلاوة خاشعة وحفظ متين بالسند المتصل، نرجو الاستمرار في التكرار اليومي وتثبيت أوجه المتشابهات..."
          className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 leading-relaxed font-sans"
        />

        {/* Quick Encouragement Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-slate-400">ثناء وتوجيه سريع:</span>
          {[
            'ما شاء الله حفظ متقن',
            'أداء مبارك وخاشع',
            'استمر في تكرار الورد',
            'تثبيت أوائل الآيات',
          ].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const updated = teacherFeedback ? `${teacherFeedback} - ${tag}` : tag;
                setTeacherFeedback(updated);
              }}
              className="text-[10px] bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Actions Footer (أزرار تفاعلية لإصدار الشهادة والمشاركة المباشرة عبر الواتساب) */}
      <div className="pt-3 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left Side: Save & WhatsApp & Certificate buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveCard}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/80 cursor-pointer transition-all"
            title="حفظ التعديلات في ملف الطالب"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ التعديلات</span>
          </button>

          {/* WhatsApp Direct Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/60 border border-emerald-400/40 cursor-pointer transition-all"
            title="المشاركة المباشرة عبر الواتساب لرقم الطالب"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-100" />
            <span>المشاركة المباشرة عبر الواتساب</span>
          </button>

          {/* Issue Certificate Button */}
          <button
            type="button"
            onClick={handleQuickIssueCertificate}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/60 cursor-pointer transition-all"
            title="إصدار شهادة إتقان لهذا الطالب"
          >
            <Award className="w-3.5 h-3.5 text-slate-950" />
            <span>إصدار الشهادة</span>
          </button>
        </div>

        {/* Right Side: Delete record */}
        <button
          type="button"
          onClick={() => onDelete(record.id, record.studentName)}
          className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/60 transition-colors cursor-pointer"
          title="حذف هذا السجل"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Certificate Preview Modal */}
      {isCertificateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0c261b] to-[#06150e] rounded-3xl border-2 border-amber-500/80 p-5 sm:p-6 shadow-2xl space-y-4 my-8 text-white">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCertificateModalOpen(false)}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Canvas Box */}
            <div className="rounded-2xl border-4 border-double border-amber-400/80 bg-gradient-to-b from-[#0e2c1f] via-[#091f15] to-[#071710] p-6 text-center space-y-4 shadow-inner relative overflow-hidden">
              
              {/* Official Stamp Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-amber-500/10 pointer-events-none flex items-center justify-center">
                <span className="text-amber-500/10 font-serif text-2xl font-bold -rotate-12 select-none">
                  مقرأة رحاب القرآن
                </span>
              </div>

              {/* Logo & Heading */}
              <div className="flex flex-col items-center space-y-1">
                <OfficialLogo size="md" />
                <h4 className="text-amber-300 font-serif text-xs font-bold tracking-widest uppercase mt-2">
                  مقرأة رحاب القرآن الإلكترونية
                </h4>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-white text-shadow-gold">
                  شهادة إتقان وتثبيت في كتاب الله تعالى
                </h3>
                {issuedCertNumber && (
                  <span className="text-[10px] text-amber-200/80 font-mono">
                    رقم الوثيقة: {issuedCertNumber}
                  </span>
                )}
              </div>

              {/* Certificate Body Text */}
              <div className="space-y-2 py-2 border-y border-amber-500/30 text-xs sm:text-sm leading-relaxed text-slate-200">
                <p>تشهد إدارة مقرأة رحاب القرآن الإلكترونية بأن الطالب/ة:</p>
                <p className="text-lg sm:text-xl font-bold text-amber-300 font-serif">
                  {record.studentName}
                </p>
                <p className="text-xs text-slate-300">
                  قد أتمّ بنجاح وتوفيق من الله جلسة تسميع وإتقان:
                </p>
                <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/40 inline-block font-bold text-emerald-300 text-xs sm:text-sm">
                  {surahName} (من الآية {ayahStart} إلى الآية {ayahEnd}) - الجزء {juzNumber}
                </div>
                <p className="text-xs text-slate-300">
                  بتقدير: <strong className="text-amber-300 font-bold">{gradeInfo.label}</strong> بنسبة إتقان: <strong className="text-emerald-400 font-mono font-bold">({score}%)</strong>
                </p>
              </div>

              {/* Signatures and Official Stamp */}
              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-300 px-2">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400">المعلم المشرف:</span>
                  <strong className="text-white">{record.evaluatorTeacher}</strong>
                  <span className="block text-[9px] text-emerald-400">معتمد ومجاز بالسند المتصل</span>
                </div>

                <div className="w-16 h-16 rounded-full border-2 border-amber-400/70 bg-amber-950/40 flex flex-col items-center justify-center text-[9px] text-amber-300 font-bold shadow-md">
                  <span>ختم المقرأة</span>
                  <span>الرسمي ✓</span>
                </div>

                <div className="text-left">
                  <span className="block text-[10px] text-slate-400">تاريخ الإصدار:</span>
                  <strong className="text-white">{new Date().toLocaleDateString('ar-SA')}</strong>
                  <span className="block text-[9px] text-amber-300">موثقة إلكترونياً</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  <span>طباعة / حفظ PDF</span>
                </button>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[10px] font-bold font-sans">
                  <span>💡</span>
                  <span>يرجى اختيار <strong>(حفظ كـ PDF)</strong> من نافذة الطباعة</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const certMsg = `*مقرأة رحاب القرآن الإلكترونية* 📜
نهنئ الطالب/ة الفاضل/ة: *${record.studentName}*
بحصوله على *شهادة إتقان وتثبيت ${surahName}* (من الآية ${ayahStart} إلى الآية ${ayahEnd}) - الجزء ${juzNumber}
التقدير: ${gradeInfo.label} (${score}%)
المشرف المعتمد: ${record.evaluatorTeacher}
رقم الوثيقة: ${issuedCertNumber || 'RQ-2026'}
ألف مبارك هذا الإنجاز القرآني المبارك! 🌟`;

                    const validation = validateAndCleanWhatsAppNumber(record.studentPhone);
                    if (!validation.isValid) {
                      onToast(`تعذر فتح واتساب: رقم هاتف الطالب غير صالح (${validation.error || 'يرجى مراجعة الرقم'}).`);
                      return;
                    }
                    const url = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(certMsg)}`;
                    window.open(url, '_blank');
                  }}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>إرسال الشهادة عبر الواتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCertificateModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
