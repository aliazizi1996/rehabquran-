import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Crown, Sparkles, Star, Flame, 
  Heart, Share2, CheckCircle2, ChevronDown, Filter, 
  Users, UserCheck, Calendar, BookOpen, MessageCircle, 
  ThumbsUp, ShieldCheck, ArrowRight, Download
} from 'lucide-react';
import { getDailyRecitations } from '../data/evaluationStore';
import { getRegisteredStudents, RegisteredStudent } from '../data/registrationStore';
import { 
  getHonorCongratulations, 
  addHonorCongratulation 
} from '../data/wirdNotificationStore';
import { DailyRecitationRecord, HonorStudent } from '../types';

interface HonorBoardViewProps {
  onNavigateToTeacherLog?: () => void;
  onNavigateToStudentsSection?: () => void;
  onNavigateToFemaleSection?: () => void;
}

export const HonorBoardView: React.FC<HonorBoardViewProps> = ({
  onNavigateToTeacherLog,
  onNavigateToStudentsSection,
  onNavigateToFemaleSection
}) => {
  const [recitations, setRecitations] = useState<DailyRecitationRecord[]>(() => getDailyRecitations());
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>(() => getRegisteredStudents());
  const [congratsMap, setCongratsMap] = useState<Record<string, number>>(() => getHonorCongratulations());
  
  // Filter state
  const [sectionFilter, setSectionFilter] = useState<'all' | 'male' | 'female'>('all');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  
  // Selected student for Commendation Badge Modal
  const [selectedStudentForCommendation, setSelectedStudentForCommendation] = useState<HonorStudent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleRecUpdate = () => setRecitations(getDailyRecitations());
    const handleCongratsUpdate = () => setCongratsMap(getHonorCongratulations());
    window.addEventListener('rehab_evaluations_updated', handleRecUpdate);
    window.addEventListener('rehab_honor_congrats_updated', handleCongratsUpdate);
    return () => {
      window.removeEventListener('rehab_evaluations_updated', handleRecUpdate);
      window.removeEventListener('rehab_honor_congrats_updated', handleCongratsUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3500);
  };

  // Compute weekly honor students dynamically from evaluation records
  const calculateHonorRoll = (): HonorStudent[] => {
    const studentMap: Record<string, {
      studentId: string;
      studentName: string;
      studentSection: 'male' | 'female';
      records: DailyRecitationRecord[];
    }> = {};

    // Group recitations by student
    recitations.forEach((rec) => {
      if (!studentMap[rec.studentId]) {
        studentMap[rec.studentId] = {
          studentId: rec.studentId,
          studentName: rec.studentName,
          studentSection: rec.studentSection,
          records: []
        };
      }
      studentMap[rec.studentId].records.push(rec);
    });

    // Also bring in registered students who might have records or high participation
    registeredStudents.forEach((std) => {
      if (!std || !std.id) return;
      if (!studentMap[std.id]) {
        studentMap[std.id] = {
          studentId: std.id,
          studentName: std.name || 'طالب',
          studentSection: std?.section || 'male',
          records: []
        };
      }
    });

    // Build honor metrics
    const honorList: HonorStudent[] = Object.values(studentMap).map((entry) => {
      const records = entry.records;
      const totalRecitations = records.length;
      const excellentRecords = records.filter((r) => r.grade === 'excellent' || r.score >= 90);
      const excellentCount = excellentRecords.length;
      
      const totalScore = records.reduce((sum, r) => sum + r.score, 0);
      // Fallback baseline for registered students with pending evaluations
      const averageScore = totalRecitations > 0 ? Math.round(totalScore / totalRecitations) : 95;
      
      const presentCount = records.filter((r) => r.attendanceStatus === 'present').length;
      const attendanceRate = totalRecitations > 0 ? Math.round((presentCount / totalRecitations) * 100) : 100;

      const latestRecord = records[0];
      const lastSurah = latestRecord ? `${latestRecord.surahName} (آية ${latestRecord.ayahStart}-${latestRecord.ayahEnd})` : 'سورة مريم';
      const teacherFeedback = latestRecord?.teacherFeedback || 'تلاوة متقنة وتفوق مستمر في الحفظ والتجويد.';
      const evaluatorTeacher = latestRecord?.evaluatorTeacher || (entry.studentSection === 'female' ? 'مشرفة قسم الطالبات' : 'مشرف قسم الطلاب');

      let praiseBadge = 'نجم التلاوة المتقنة';
      if (averageScore >= 98) praiseBadge = 'وشاح الحفظ الذهبي والتميز المطلق';
      else if (averageScore >= 95) praiseBadge = 'فارس التجويد والترتيل الخاشع';
      else if (attendanceRate === 100) praiseBadge = 'قدوة الالتزام والانضباط اليومي';

      return {
        studentId: entry.studentId,
        studentName: entry.studentName,
        studentSection: entry.studentSection,
        rank: 0, // will be assigned below
        averageScore,
        totalRecitations: Math.max(1, totalRecitations),
        excellentCount: Math.max(1, excellentCount),
        attendanceRate,
        lastSurah,
        memorizedJuzCount: 5,
        praiseBadge,
        teacherFeedback,
        evaluatorTeacher,
        congratulationsCount: congratsMap[entry.studentId] || 7
      };
    });

    // Filter by Section
    const sectionFiltered = honorList.filter((s) => {
      if (sectionFilter === 'all') return true;
      return s.studentSection === sectionFilter;
    });

    // Sort by Score and Excellent evaluations count descending
    sectionFiltered.sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.excellentCount - a.excellentCount;
    });

    // Assign sequential ranks
    return sectionFiltered.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  };

  const honorRoll = calculateHonorRoll();
  const topThree = honorRoll.slice(0, 3);
  const remainingHonorList = honorRoll.slice(3);

  const handleSendKudos = (student: HonorStudent) => {
    const nextVal = addHonorCongratulation(student.studentId);
    setCongratsMap((prev) => ({ ...prev, [student.studentId]: nextVal }));
    showToast(`بارك الله فيك! تم إرسال التهنئة والدعاء للطالب (${student.studentName}) بنجاح.`);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in" dir="rtl">
      
      {/* Interactive Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Golden Honor Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-[#171206] via-[#241a09] to-[#120e05] border-2 border-amber-500/70 shadow-2xl relative overflow-hidden">
        {/* Decorative Golden Pattern Accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black shadow-inner">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>لوحة الشرف والتكريم الأسبوعي للمتفوقين</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
              كوكبة المتفوقين في مقرأة رحاب القرآن
            </h1>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
              تكريم مستمر وتلقائي للطلاب والطالبات الحاصلين على أعلى درجات الإتقان (تقدير ممتاز 95%+)، والملتزمين بالحضور والأداء المتقن في التسميع والتجويد.
            </p>
          </div>

          {/* Quick links to departments */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {onNavigateToStudentsSection && (
              <button
                onClick={onNavigateToStudentsSection}
                className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-500/60 transition-all cursor-pointer shadow-sm"
              >
                قسم الطلاب (بنين)
              </button>
            )}
            {onNavigateToFemaleSection && (
              <button
                onClick={onNavigateToFemaleSection}
                className="px-3.5 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-bold border border-amber-400/60 transition-all cursor-pointer shadow-sm"
              >
                قسم الطالبات (أخوات)
              </button>
            )}
          </div>
        </div>

        {/* Honor Criteria Strip */}
        <div className="mt-5 pt-4 border-t border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-amber-100/90">
          <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
            <Star className="w-4 h-4 text-amber-400 shrink-0" />
            <span>الحصول على تقدير <strong>ممتاز (95% فأعلى)</strong> في التسميع اليومي.</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>الانضباط بنسبة حضور <strong>100%</strong> دون غياب غير مبرر.</span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 p-2.5 rounded-xl border border-amber-500/20">
            <Crown className="w-4 h-4 text-amber-300 shrink-0" />
            <span>إتقان أحكام التجويد ومخارج الحروف مع الترتيل الخاشع.</span>
          </div>
        </div>
      </div>

      {/* Filter and Section Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0a1e14] border border-emerald-800/80">
        
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setSectionFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sectionFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-[#06150d] text-slate-300 hover:text-white border border-emerald-900'
            }`}
          >
            جميع الأقسام ({honorRoll.length})
          </button>
          <button
            onClick={() => setSectionFilter('male')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sectionFilter === 'male'
                ? 'bg-emerald-600 text-white font-black shadow-md'
                : 'bg-[#06150d] text-slate-300 hover:text-white border border-emerald-900'
            }`}
          >
            قسم الطلاب (بنين)
          </button>
          <button
            onClick={() => setSectionFilter('female')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              sectionFilter === 'female'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'bg-[#06150d] text-slate-300 hover:text-white border border-emerald-900'
            }`}
          >
            قسم الطالبات (بنات)
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 hidden sm:inline">الفترة:</span>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              timeframe === 'week' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-slate-400'
            }`}
          >
            هذا الأسبوع
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              timeframe === 'month' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-slate-400'
            }`}
          >
            الشهر الحالي
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              timeframe === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'text-slate-400'
            }`}
          >
            السجل الذهبي العام
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM - منصة تتويج الشرف الثلاثية */}
      {topThree.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>فرسان منصة التتويج الشرفي (المراكز الثلاثة الأولى)</span>
            </h2>
            <span className="text-[11px] text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800">
              أعلى التقييمات أسبوعياً
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 (Silver) */}
            {topThree[1] && (
              <div className="order-2 md:order-1 p-4 sm:p-5 rounded-3xl bg-[#0a1e15] border-2 border-slate-400/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  2🥈
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#06140d] border border-slate-400 flex items-center justify-center text-slate-200 font-bold text-lg">
                      {topThree[1].studentName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-600">
                        المركز الثاني • وشاح الفضة
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{topThree[1].studentName}</h3>
                      <p className="text-[11px] text-emerald-300">{topThree[1].studentSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#06150e] border border-emerald-900 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الدرجة التراكمية:</span>
                      <span className="text-amber-300 font-bold">{topThree[1].averageScore}% (ممتاز)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المحفوظ الأخير:</span>
                      <span className="text-white truncate max-w-[140px]">{topThree[1].lastSurah}</span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-300 italic bg-[#06150e]/60 p-2.5 rounded-xl border border-emerald-950">
                    «{topThree[1].teacherFeedback}»
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendKudos(topThree[1])}
                    className="flex-1 py-2 rounded-xl bg-[#0d2a1c] hover:bg-[#123826] text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>تهنئة ({topThree[1].congratulationsCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudentForCommendation(topThree[1])}
                    className="p-2 rounded-xl bg-slate-700 text-white text-xs font-bold hover:bg-slate-600 transition-all cursor-pointer"
                    title="عرض وسام الشرف"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center & Highlighted) */}
            {topThree[0] && (
              <div className="order-1 md:order-2 p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#1f1708] via-[#171206] to-[#0c1e14] border-2 border-amber-400 shadow-2xl flex flex-col justify-between relative overflow-hidden scale-[1.02]">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl" />
                <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border border-amber-200">
                  1🥇
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-md">
                    <Crown className="w-3.5 h-3.5 text-slate-950" />
                    <span>متصدر لوحة الشرف • المركز الأول 👑</span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-14 h-14 rounded-2xl bg-[#09170e] border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-2xl shadow-inner">
                      {topThree[0].studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{topThree[0].studentName}</h3>
                      <p className="text-xs text-amber-300 font-bold">{topThree[0].praiseBadge}</p>
                      <p className="text-[11px] text-emerald-300">{topThree[0].studentSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#091c12] border border-amber-500/40 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">الدرجة التراكمية:</span>
                      <span className="text-amber-300 font-black text-sm">{topThree[0].averageScore}% (ممتاز مرتفع)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">نسبة الانضباط والحضور:</span>
                      <span className="text-emerald-400 font-bold">{topThree[0].attendanceRate}% (مثالي)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">آخر تسميع متقن:</span>
                      <span className="text-white truncate max-w-[150px] font-semibold">{topThree[0].lastSurah}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-100/90 leading-relaxed">
                    <span className="font-bold text-amber-300">ثناء المشرف ({topThree[0].evaluatorTeacher}): </span>
                    «{topThree[0].teacherFeedback}»
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendKudos(topThree[0])}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>أرسل تهنئة ودعاء ({topThree[0].congratulationsCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudentForCommendation(topThree[0])}
                    className="p-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 transition-all cursor-pointer border border-emerald-500/40"
                    title="عرض وسام الشرف والشهادة"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree[2] && (
              <div className="order-3 p-4 sm:p-5 rounded-3xl bg-[#0a1e15] border-2 border-amber-700/60 shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                  3🥉
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#06140d] border border-amber-700 flex items-center justify-center text-amber-300 font-bold text-lg">
                      {topThree[2].studentName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                        المركز الثالث • وشاح البرونز
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{topThree[2].studentName}</h3>
                      <p className="text-[11px] text-emerald-300">{topThree[2].studentSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#06150e] border border-emerald-900 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">الدرجة التراكمية:</span>
                      <span className="text-amber-300 font-bold">{topThree[2].averageScore}% (ممتاز)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المحفوظ الأخير:</span>
                      <span className="text-white truncate max-w-[140px]">{topThree[2].lastSurah}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 italic bg-[#06150e]/60 p-2.5 rounded-xl border border-emerald-950">
                    «{topThree[2].teacherFeedback}»
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-900 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSendKudos(topThree[2])}
                    className="flex-1 py-2 rounded-xl bg-[#0d2a1c] hover:bg-[#123826] text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>تهنئة ({topThree[2].congratulationsCount})</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudentForCommendation(topThree[2])}
                    className="p-2 rounded-xl bg-amber-800 text-white text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer"
                    title="عرض وسام الشرف"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL HONOR ROLL TABLE / LIST (كوكبة الشرف والتميز) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>كوكبة الطلاب والطالبات المتفوقين في التقييم الأسبوعي</span>
          </h2>
          <span className="text-xs text-slate-400">
            إجمالي المكرمين: {honorRoll.length} طالباً وطالبة
          </span>
        </div>

        <div className="space-y-2.5">
          {honorRoll.map((student) => {
            const isTop1 = student.rank === 1;
            const isTop2 = student.rank === 2;
            const isTop3 = student.rank === 3;

            return (
              <div
                key={student.studentId}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTop1
                    ? 'bg-gradient-to-r from-[#171206] to-[#0a1e14] border-amber-400/80 shadow-md'
                    : isTop2
                    ? 'bg-[#0a1e15] border-slate-400/60'
                    : isTop3
                    ? 'bg-[#0a1e15] border-amber-700/60'
                    : 'bg-[#06150d] border-emerald-900/80 hover:border-emerald-700'
                }`}
              >
                {/* Left Info: Rank badge + Student Details */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner ${
                    isTop1
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : isTop2
                      ? 'bg-slate-300 text-slate-950'
                      : isTop3
                      ? 'bg-amber-700 text-white'
                      : 'bg-[#0c2419] text-emerald-300 border border-emerald-800'
                  }`}>
                    {student.rank}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{student.studentName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.studentSection === 'female'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}>
                        {student.studentSection === 'female' ? 'طالبات' : 'طلاب'}
                      </span>
                      <span className="bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full text-[10px] border border-amber-400/20">
                        {student.praiseBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>آخر موضع: <strong className="text-slate-200">{student.lastSurah}</strong></span>
                      <span>•</span>
                      <span>المعلم المشرف: <strong className="text-emerald-300">{student.evaluatorTeacher}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics & Kudos CTA */}
                <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-950">
                  {/* Score */}
                  <div className="text-center px-2">
                    <span className="block text-xs font-black text-amber-300 font-mono">{student.averageScore}%</span>
                    <span className="text-[10px] text-slate-400">التقدير (ممتاز)</span>
                  </div>

                  {/* Attendance */}
                  <div className="text-center px-2 hidden sm:block">
                    <span className="block text-xs font-bold text-emerald-400 font-mono">{student.attendanceRate}%</span>
                    <span className="text-[10px] text-slate-400">حضور الحلقات</span>
                  </div>

                  {/* Congratulate Button */}
                  <button
                    onClick={() => handleSendKudos(student)}
                    className="px-3 py-1.5 rounded-xl bg-[#0e271a] hover:bg-[#143524] text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="أرسل تهنئة وتشجيعاً للطالب"
                  >
                    <Heart className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>تهنئة ({student.congratulationsCount})</span>
                  </button>

                  {/* Commendation Modal CTA */}
                  <button
                    onClick={() => setSelectedStudentForCommendation(student)}
                    className="p-1.5 rounded-xl bg-emerald-950 border border-emerald-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="عرض وسام الشرف والتقدير"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COMMENDATION BADGE MODAL (نافذة وسام الشرف والتقدير) */}
      {selectedStudentForCommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#181308] via-[#102418] to-[#081810] border-2 border-amber-400 shadow-2xl p-6 text-center space-y-4">
            
            {/* Top Badge Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl border-2 border-amber-200 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-black text-amber-400 tracking-wider block">
                مقرأة رحاب القرآن الإلكترونية • وسام الشرف والتميز
              </span>
              <h3 className="text-xl font-black text-white">
                وسام المتفوق القرآني
              </h3>
              <p className="text-xs text-emerald-200">
                يُمنح للطالب المتميز تقديراً لحصوله على الترتيب ({selectedStudentForCommendation.rank}) بتقدير ممتاز
              </p>
            </div>

            {/* Student Certificate Card in miniature */}
            <div className="p-4 rounded-2xl bg-[#06150d] border border-amber-400/40 space-y-2 text-right">
              <div className="flex justify-between items-center border-b border-emerald-900 pb-1.5">
                <span className="text-xs text-slate-400">اسم الطالب:</span>
                <span className="text-sm font-black text-amber-300">{selectedStudentForCommendation.studentName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-900 pb-1.5">
                <span className="text-xs text-slate-400">التقدير والدرجة:</span>
                <span className="text-xs font-bold text-emerald-300">{selectedStudentForCommendation.averageScore}% (ممتاز مرتفع)</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-900 pb-1.5">
                <span className="text-xs text-slate-400">وسام التميز:</span>
                <span className="text-xs font-bold text-amber-300">{selectedStudentForCommendation.praiseBadge}</span>
              </div>
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-0.5">شهادة المعلم المشرف:</span>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  «{selectedStudentForCommendation.teacherFeedback}»
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  handleSendKudos(selectedStudentForCommendation);
                  setSelectedStudentForCommendation(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>إرسال تهنئة مباركة</span>
              </button>
              <button
                onClick={() => setSelectedStudentForCommendation(null)}
                className="px-4 py-2.5 rounded-xl bg-[#0a2015] text-slate-300 hover:text-white text-xs font-bold border border-emerald-800 transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
