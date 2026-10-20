import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, UserCheck, Calendar, BookOpen, Award, CheckCircle2, 
  Search, Plus, Trash2, Filter, Share2, Sparkles, AlertCircle, 
  Check, ChevronDown, User, ShieldCheck, Clock, MessageSquare, 
  ExternalLink, FileText, ArrowRight
} from 'lucide-react';
import { 
  DailyRecitationRecord, 
  PerformanceGrade, 
  RecitationAttendanceStatus, 
  UserProfile 
} from '../types';
import { 
  getDailyRecitations, 
  saveDailyRecitation, 
  deleteDailyRecitation, 
  getGradeLabel, 
  getAttendanceStatusInfo,
  QURAN_SURAHS 
} from '../data/evaluationStore';
import { getRegisteredStudents, RegisteredStudent } from '../data/registrationStore';
import { addStudentEvaluation } from '../data/academyDb';
import { StudentRecitationCard } from './StudentRecitationCard';
import { 
  triggerRecitationApprovedNotification, 
  triggerSheikhMessageNotification 
} from '../data/userNotificationStore';

interface TeacherRecitationLogViewProps {
  user: UserProfile;
  onOpenCertificates?: () => void;
  onIssueCertificateForStudent?: (studentName: string, section: 'male' | 'female', teacher: string) => void;
}

export const TeacherRecitationLogView: React.FC<TeacherRecitationLogViewProps> = ({
  user,
  onOpenCertificates,
  onIssueCertificateForStudent,
}) => {
  const [recitations, setRecitations] = useState<DailyRecitationRecord[]>(() => getDailyRecitations());
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(() => getRegisteredStudents());
  
  // Evaluator selection (defaults based on user name)
  const defaultEvaluator = user.name || 'مشرف قسم الطلاب';
  const [currentEvaluator, setCurrentEvaluator] = useState(defaultEvaluator);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [studentSection, setStudentSection] = useState<'male' | 'female'>('male');
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedSurah, setSelectedSurah] = useState<string>('سورة البقرة');
  const [juzNumber, setJuzNumber] = useState<number>(1);
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(25);
  const [attendanceStatus, setAttendanceStatus] = useState<RecitationAttendanceStatus>('present');
  const [performanceGrade, setPerformanceGrade] = useState<PerformanceGrade>('excellent');
  const [scoreNumber, setScoreNumber] = useState<number>(95);
  const [hifzScore, setHifzScore] = useState<number>(96);
  const [tajweedScore, setTajweedScore] = useState<number>(94);
  const [memorizationQuality, setMemorizationQuality] = useState<'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج مراجعة وتكرار'>('ممتاز');
  const [tajweedNotes, setTajweedNotes] = useState<string>('');
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [filterSection, setFilterSection] = useState<'all' | 'male' | 'female'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleRecitationsUpdate = () => {
      setRecitations(getDailyRecitations());
    };
    const handleStudentsUpdate = () => {
      setRegisteredStudents(getRegisteredStudents());
    };

    window.addEventListener('rehab_evaluations_updated', handleRecitationsUpdate);
    window.addEventListener('rehab_students_updated', handleStudentsUpdate);
    return () => {
      window.removeEventListener('rehab_evaluations_updated', handleRecitationsUpdate);
      window.removeEventListener('rehab_students_updated', handleStudentsUpdate);
    };
  }, []);

  // When picking a registered student from dropdown
  const handleSelectRegisteredStudent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedStudentId(id);
    if (id) {
      const std = registeredStudents.find((s) => s && s.id === id);
      if (std) {
        setCustomStudentName(std.name || '');
        setStudentSection(std?.section || 'male');
      }
    }
  };

  // When picking a Surah
  const handleSelectSurah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const surahName = e.target.value;
    setSelectedSurah(surahName);
    const match = QURAN_SURAHS.find((s) => s.name === surahName);
    if (match) {
      setJuzNumber(match.juz);
    }
  };

  // Submit new recitation record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customStudentName.trim() || 'طالب مقرأة';
    const studentObj = registeredStudents.find(s => s.id === selectedStudentId || s.name === finalName);

    saveDailyRecitation({
      studentId: selectedStudentId || `custom-${Date.now()}`,
      studentName: finalName,
      studentPhone: studentObj?.phone,
      studentSection,
      date: recordDate,
      surahName: selectedSurah,
      juzNumber,
      ayahStart: Number(ayahStart) || 1,
      ayahEnd: Number(ayahEnd) || 1,
      attendanceStatus,
      grade: performanceGrade,
      score: Number(scoreNumber) || 90,
      hifzScore: Number(hifzScore) || Number(scoreNumber) || 90,
      tajweedScore: Number(tajweedScore) || Number(scoreNumber) || 90,
      evaluatorTeacher: currentEvaluator,
      memorizationQuality,
      tajweedNotes: tajweedNotes.trim() || undefined,
      teacherFeedback: teacherFeedback.trim() || undefined,
    });

    // Also sync to academyDb evaluation store if student has an ID
    if (selectedStudentId) {
      addStudentEvaluation({
        studentId: selectedStudentId,
        studentName: finalName,
        teacherId: 'tch-1',
        teacherName: currentEvaluator,
        date: recordDate,
        surah: selectedSurah,
        fromAyah: Number(ayahStart) || 1,
        toAyah: Number(ayahEnd) || 1,
        lessonType: 'حفظ',
        grade: performanceGrade === 'excellent' ? 'ممتاز' : performanceGrade === 'very_good' ? 'جيد جداً' : 'جيد',
        score: Number(scoreNumber) || 90,
        hifzScore: Number(hifzScore) || Number(scoreNumber) || 90,
        tajweedScore: Number(tajweedScore) || Number(scoreNumber) || 90,
        tajweedNotes: tajweedNotes.trim() || undefined,
        teacherNotes: teacherFeedback.trim() || 'تسميع طيب وتلاوة خاشعة ومتقنة.',
      });
    }

    // Trigger instant notification popup for student
    const gradeLabel = getGradeLabel(performanceGrade).label;
    triggerRecitationApprovedNotification({
      sheikhName: currentEvaluator,
      studentName: finalName,
      surahName: selectedSurah,
      ayahStart: Number(ayahStart) || 1,
      ayahEnd: Number(ayahEnd) || 1,
      score: Number(scoreNumber) || 90,
      grade: gradeLabel,
      feedback: teacherFeedback.trim() || undefined,
    });

    setSuccessMessage(`تم حفظ سجل تسميع ومتابعة الطالب (${finalName}) بنجاح.`);
    setTimeout(() => setSuccessMessage(null), 3500);

    // Reset fields
    setTajweedNotes('');
    setTeacherFeedback('');
    setIsFormOpen(false);
  };

  // Delete record
  const handleDelete = (id: string, name: string) => {
    deleteDailyRecitation(id);
    setSuccessMessage(`تم حذف سجل التسميع للطالب (${name}).`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Share via WhatsApp
  const handleShareRecord = (rec: DailyRecitationRecord) => {
    const gradeInfo = getGradeLabel(rec.grade);
    const statusInfo = getAttendanceStatusInfo(rec.attendanceStatus);
    const message = `*تقرير متابعة التسميع اليومي بمقرأة رحاب القرآن الإلكترونية* 📖
━━━━━━━━━━━━━━━━━━━━
👤 *اسم الطالب:* ${rec.studentName}
📅 *التاريخ:* ${rec.date}
🎙️ *المعلم المشرف:* ${rec.evaluatorTeacher}
📌 *مقدار الحفظ:* ${rec.surahName} (من الآية ${rec.ayahStart} إلى الآية ${rec.ayahEnd}) - الجزء ${rec.juzNumber}
🕒 *حالة الحضور:* ${statusInfo.label}
⭐ *التقدير والأداء:* ${gradeInfo.label} (الدرجة: ${rec.score}/100)
✨ *جودة الحفظ:* ${rec.memorizationQuality || 'ممتاز'}
${rec.tajweedNotes ? `📝 *ملاحظات التجويد:* ${rec.tajweedNotes}\n` : ''}
${rec.teacherFeedback ? `💬 *توجيه المعلم:* ${rec.teacherFeedback}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
مقرأة رحاب القرآن الإلكترونية - نحو إتقان كتاب الله تعالى بالسند المتصل`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filtered Recitations
  const filteredRecitations = recitations.filter((r) => {
    const matchesSection = filterSection === 'all' || r.studentSection === filterSection;
    const matchesStatus = filterStatus === 'all' || r.attendanceStatus === filterStatus;
    const matchesGrade = filterGrade === 'all' || r.grade === filterGrade;
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.surahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.evaluatorTeacher.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesStatus && matchesGrade && matchesSearch;
  });

  // Calculate statistics
  const totalCount = recitations.length;
  const presentCount = recitations.filter((r) => r.attendanceStatus === 'present').length;
  const excellentCount = recitations.filter((r) => r.grade === 'excellent').length;
  const lateOrAbsentCount = recitations.filter((r) => r.attendanceStatus === 'absent' || r.attendanceStatus === 'late').length;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner & Evaluator Control */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0b2418] via-[#103021] to-[#071911] p-5 sm:p-6 border-2 border-emerald-600/70 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3 text-amber-400" />
                  لوحة المعلم والمشرف المباشر
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-block">
                  سجل التسميع والمتابعة اليومية
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif mt-1">
                سجل متابعة تسميع الطلاب وتقييم الأداء
              </h1>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal mt-0.5 max-w-2xl">
                توثيق فوري لمقدار الحفظ من الآية إلى الآية، تسجيل حالات الحضور والغياب بدقة، وتقييم مستوى الحفظ والتلاوة بالسند وحفظها في ملف الطالب.
              </p>
            </div>

            {/* Quick Switch Teacher Evaluator */}
            <div className="bg-[#081a11]/90 border border-emerald-500/50 rounded-2xl p-3 flex flex-col gap-1.5 shadow-md">
              <span className="text-[10px] text-slate-300 block font-semibold">المعلم المسجِّل حالياً:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentEvaluator('مشرف قسم الطلاب')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    currentEvaluator === 'مشرف قسم الطلاب'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900/60'
                  }`}
                >
                  مشرف قسم الطلاب
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentEvaluator('مشرفة قسم الطالبات')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    currentEvaluator === 'مشرفة قسم الطالبات'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-amber-950 text-amber-300 hover:bg-amber-900/60'
                  }`}
                >
                  مشرفة قسم الطالبات
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/80 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل جلسة تسميع ومتابعة جديدة</span>
              </button>

              {onOpenCertificates && (
                <button
                  type="button"
                  onClick={onOpenCertificates}
                  className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>لوحة الشهادات والإنجازات</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-3">
              <span>إجمالي السجلات: <strong className="text-white font-bold">{totalCount}</strong></span>
              <span>حضور تام: <strong className="text-emerald-400 font-bold">{presentCount}</strong></span>
              <span>تقدير ممتاز: <strong className="text-amber-300 font-bold">{excellentCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-900/90 border border-emerald-500 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-slate-300 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* New Recitation Record Form Modal/Card */}
      {isFormOpen && (
        <div className="rounded-3xl bg-[#0a1e15] border-2 border-emerald-500/80 p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✍️
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                  تسجيل جلسة تسميع ومتابعة يومية للطالب
                </h3>
                <span className="text-[11px] text-emerald-300 font-medium">
                  بإشراف: {currentEvaluator}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-400 hover:text-white bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800 cursor-pointer"
            >
              إلغاء وإغلاق
            </button>
          </div>

          <form onSubmit={handleSaveRecord} className="space-y-4">
            {/* Student Picker & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  اختر من الطلاب المسجلين (إن وجد):
                </label>
                <select
                  value={selectedStudentId}
                  onChange={handleSelectRegisteredStudent}
                  className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- أو اكتب اسم الطالب يدوياً --</option>
                  {registeredStudents.filter((std) => Boolean(std && std.id)).map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std?.section === 'male' ? 'قسم الطلاب' : 'قسم الطالبات'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  اسم الطالب الكامل: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد اليماني"
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  القسم:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentSection('male')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      studentSection === 'male'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#06150e] text-slate-400 border border-emerald-900'
                    }`}
                  >
                    قسم الطلاب (بنين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSection('female')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      studentSection === 'female'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-[#06150e] text-slate-400 border border-emerald-900'
                    }`}
                  >
                    قسم الطالبات (بنات)
                  </button>
                </div>
              </div>
            </div>

            {/* Quran Memorization Range: Surah, Juz, From Ayah X to Y */}
            <div className="p-3.5 rounded-2xl bg-[#06160e] border border-emerald-800/80 space-y-3">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                تحديد مقدار الحفظ والمقرر للتسميع بدقة (من الآية إلى الآية)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    السورة الكريمة:
                  </label>
                  <select
                    value={selectedSurah}
                    onChange={handleSelectSurah}
                    className="w-full p-2.5 rounded-xl bg-[#091f14] border border-emerald-700/80 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    {QURAN_SURAHS.map((s) => (
                      <option key={s.number} value={s.name}>
                        {s.name} (الجزء {s.juz} • {s.totalAyahs} آية)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    رقم الجزء (1 - 30):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={juzNumber}
                    onChange={(e) => setJuzNumber(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#091f14] border border-emerald-700/80 text-xs text-white font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                    تاريخ الجلسة:
                  </label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#091f14] border border-emerald-700/80 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Ayah From -> Ayah To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-emerald-300 font-bold block mb-1">
                    من الآية رقم:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={ayahStart}
                    onChange={(e) => setAyahStart(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#091f14] border border-emerald-700/80 text-sm text-white font-bold focus:outline-none"
                    placeholder="مثال: 1"
                  />
                </div>

                <div>
                  <label className="text-xs text-emerald-300 font-bold block mb-1">
                    إلى الآية رقم:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#091f14] border border-emerald-700/80 text-sm text-white font-bold focus:outline-none"
                    placeholder="مثال: 25"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Status (حاضر، غائب، متأخر، معذور) */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold block">
                حالة الحضور والغياب للجلسة: <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'present', label: 'حاضر في الموعد', color: 'bg-emerald-600 text-white' },
                  { id: 'late', label: 'متأخر عن الحلقة', color: 'bg-amber-600 text-white' },
                  { id: 'excused', label: 'معذور مسبقاً', color: 'bg-indigo-600 text-white' },
                  { id: 'absent', label: 'غائب دون عذر', color: 'bg-red-600 text-white' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAttendanceStatus(item.id as RecitationAttendanceStatus)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      attendanceStatus === item.id
                        ? `${item.color} shadow-md scale-[1.02]`
                        : 'bg-[#06150e] text-slate-300 border border-emerald-900 hover:border-emerald-700'
                    }`}
                  >
                    {attendanceStatus === item.id && <Check className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Grading & Rating (ممتاز، جيد جداً، جيد، ضعيف) + Score Number */}
            <div className="p-3.5 rounded-2xl bg-[#06160e] border border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  نظام التقييم وعلامات الأداء
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                  الدرجة: {scoreNumber} / 100
                </span>
              </div>

              {/* Grade Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'excellent', label: 'ممتاز (95 - 100)', color: 'bg-emerald-600 text-white' },
                  { id: 'very_good', label: 'جيد جداً (85 - 94)', color: 'bg-sky-600 text-white' },
                  { id: 'good', label: 'جيد (75 - 84)', color: 'bg-amber-600 text-white' },
                  { id: 'weak', label: 'ضعيف (يحتاج إعادة)', color: 'bg-red-600 text-white' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setPerformanceGrade(g.id as PerformanceGrade);
                      if (g.id === 'excellent') setScoreNumber(98);
                      if (g.id === 'very_good') setScoreNumber(88);
                      if (g.id === 'good') setScoreNumber(78);
                      if (g.id === 'weak') setScoreNumber(60);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      performanceGrade === g.id
                        ? `${g.color} shadow-md scale-[1.02]`
                        : 'bg-[#091f14] text-slate-300 border border-emerald-900 hover:border-emerald-700'
                    }`}
                  >
                    {performanceGrade === g.id && <Check className="w-3.5 h-3.5" />}
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Score slider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-slate-400">الدرجة العامة:</span>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={scoreNumber}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setScoreNumber(val);
                    setHifzScore(val);
                    setTajweedScore(Math.max(60, val - 2));
                  }}
                  className="flex-1 accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-white bg-[#091f14] px-2 py-0.5 rounded border border-emerald-800">
                  {scoreNumber}%
                </span>
              </div>

              {/* Detailed Breakdown for Student Analytics Charts */}
              <div className="pt-2 border-t border-emerald-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#091f14]/80 p-2.5 rounded-xl border border-emerald-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300">درجة الحفظ والضبط:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                      {hifzScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={hifzScore}
                    onChange={(e) => setHifzScore(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">تنعكس في مؤشر الرادار والرسم البياني للطالب</span>
                </div>

                <div className="bg-[#091f14]/80 p-2.5 rounded-xl border border-amber-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">درجة التجويد والمخارج:</span>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                      {tajweedScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={tajweedScore}
                    onChange={(e) => setTajweedScore(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">تنعكس في تحليل التجويد وأعمدة الأداء</span>
                </div>
              </div>
            </div>

            {/* Quality of Memorization & Tajweed Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  ملاحظات التجويد ومخارج الحروف:
                </label>
                <textarea
                  rows={2}
                  value={tajweedNotes}
                  onChange={(e) => setTajweedNotes(e.target.value)}
                  placeholder="مثال: تمكين المد المنفصل، ضبط قلقلة حرف القاف، الانتباه لترقيق الراء المكسورة..."
                  className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  توجيه وثناء المعلم المشرف ({currentEvaluator}):
                </label>
                <textarea
                  rows={2}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="مثال: بارك الله في همتك، استظهار رائع مع نبر متقن، استمر في التكرار..."
                  className="w-full p-2.5 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-[#06150e] text-slate-400 hover:text-white border border-emerald-900 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/80 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ في ملف وسجل الطالب</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0a1e15] border border-emerald-900/60 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، السورة، أو المعلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Section Filter */}
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value as any)}
              className="py-2 px-3 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-emerald-300 focus:outline-none"
            >
              <option value="all">جميع الأقسام (بنين وبنات)</option>
              <option value="male">قسم الطلاب (بنين)</option>
              <option value="female">قسم الطالبات (بنات)</option>
            </select>

            {/* Attendance Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-2 px-3 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">كل حالات الحضور</option>
              <option value="present">حاضر</option>
              <option value="late">متأخر</option>
              <option value="excused">معذور</option>
              <option value="absent">غائب</option>
            </select>

            {/* Grade Filter */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="py-2 px-3 rounded-xl bg-[#06150e] border border-emerald-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">كل التقديرات</option>
              <option value="excellent">ممتاز</option>
              <option value="very_good">جيد جداً</option>
              <option value="good">جيد</option>
              <option value="weak">ضعيف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recitation Records List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>سجلات التسميع الموثقة ({filteredRecitations.length} جلسة)</span>
          </h3>
          <span className="text-[11px] text-slate-400">تحديث فوري محفوظ تلقائياً</span>
        </div>

        {filteredRecitations.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0a1e15] border border-emerald-900/60 text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-emerald-500/40" />
            <p className="text-xs font-semibold text-white">لا توجد سجلات مطابقة للبحث أو التصفية</p>
            <p className="text-[11px]">يمكنك إضافة جلسة تسميع ومتابعة جديدة بالضغط على زر التسجيل بالأعلى.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRecitations.map((rec) => (
              <StudentRecitationCard
                key={rec.id}
                record={rec}
                onDelete={handleDelete}
                onToast={(msg) => {
                  setSuccessMessage(msg);
                  setTimeout(() => setSuccessMessage(null), 3500);
                }}
                onNavigateToCertificatesTab={onIssueCertificateForStudent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
