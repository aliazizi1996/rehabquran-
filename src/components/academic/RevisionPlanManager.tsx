/**
 * واجهة إدارة خطة المراجعة المنفصلة (Revision Plan Manager)
 * تدعم: المراجعة الصغرى والمراجعة الكبرى، دورات التثبيت، ونسب الإنجاز والتنبيهات
 */

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, BookOpen, Calendar, Clock, AlertTriangle, Plus, 
  CheckCircle2, Search, Check, Trash2, Edit, RotateCcw, 
  Layers, Shield, Award 
} from 'lucide-react';
import { ALL_114_SURAHS, ALL_30_JUZ, ACADEMIC_RIWAYAHS } from '../../data/quranAcademicData';
import { 
  AcademicPlanGoal, 
  checkIsPlanOverdue, 
  fetchAcademicPlans, 
  saveAcademicPlan, 
  deleteAcademicPlan,
  PlanPeriodType,
  PlanCategoryType
} from '../../services/academicService';
import { AuthAccount } from '../../types';

interface RevisionPlanManagerProps {
  currentAccount: AuthAccount;
  targetStudentId?: string;
  targetStudentName?: string;
  onOpenRecitationSession?: (plan: AcademicPlanGoal) => void;
}

export const RevisionPlanManager: React.FC<RevisionPlanManagerProps> = ({
  currentAccount,
  targetStudentId,
  targetStudentName,
  onOpenRecitationSession
}) => {
  const isTeacherOrAdmin = currentAccount.role === 'teacher' || currentAccount.role === 'system_admin' || currentAccount.role === 'supervisor';
  const effectiveStudentId = targetStudentId || (currentAccount.role === 'student' ? currentAccount.id : undefined);

  const [revisionCategory, setRevisionCategory] = useState<'all' | 'minor_revision' | 'major_revision'>('all');
  const [plans, setPlans] = useState<AcademicPlanGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form Fields
  const [planCategory, setPlanCategory] = useState<'minor_revision' | 'major_revision'>('minor_revision');
  const [period, setPeriod] = useState<PlanPeriodType>('daily');
  const [surahNumber, setSurahNumber] = useState<number>(18);
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(110);
  const [pageStart, setPageStart] = useState<number>(293);
  const [pageEnd, setPageEnd] = useState<number>(304);
  const [juzNumber, setJuzNumber] = useState<number>(15);
  const [hizbNumber, setHizbNumber] = useState<number>(30);
  const [rubNumber, setRubNumber] = useState<number>(118);
  const [riwayahId, setRiwayahId] = useState<string>('hafs');
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [planNotes, setPlanNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRevisionPlans();
  }, [effectiveStudentId]);

  const loadRevisionPlans = async () => {
    setIsLoading(true);
    const res = await fetchAcademicPlans(effectiveStudentId);
    if (res.data) {
      // Filter out new_memorization
      const revisions = res.data.filter(p => p.planCategory === 'minor_revision' || p.planCategory === 'major_revision');
      setPlans(revisions);
    }
    setIsLoading(false);
  };

  const handleSurahChange = (sNum: number) => {
    setSurahNumber(sNum);
    const s = ALL_114_SURAHS.find(item => item.number === sNum);
    if (s) {
      setAyahStart(1);
      setAyahEnd(s.totalAyahs);
      setPageStart(s.startPage);
      setPageEnd(s.endPage);
      setJuzNumber(s.startJuz);
      setHizbNumber(s.startHizb);
      setRubNumber(s.startRub);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlanId(null);
    setPlanCategory('minor_revision');
    setPeriod('daily');
    handleSurahChange(18);
    setTargetDate(new Date().toISOString().split('T')[0]);
    setPlanNotes('');
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: AcademicPlanGoal) => {
    setEditingPlanId(plan.id);
    setPlanCategory(plan.planCategory as 'minor_revision' | 'major_revision');
    setPeriod(plan.period);
    setSurahNumber(plan.surahNumber);
    setAyahStart(plan.ayahStart);
    setAyahEnd(plan.ayahEnd);
    setPageStart(plan.pageStart || 1);
    setPageEnd(plan.pageEnd || 1);
    setJuzNumber(plan.juzNumber || 1);
    setHizbNumber(plan.hizbNumber || 1);
    setRubNumber(plan.rubNumber || 1);
    setRiwayahId(plan.riwayahId);
    setTargetDate(plan.targetDate);
    setPlanNotes(plan.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const surah = ALL_114_SURAHS.find(s => s.number === Number(surahNumber)) || ALL_114_SURAHS[0];
    const riwayah = ACADEMIC_RIWAYAHS.find(r => r.id === riwayahId) || ACADEMIC_RIWAYAHS[0];

    const planPayload: Partial<AcademicPlanGoal> = {
      id: editingPlanId || undefined,
      studentId: effectiveStudentId || currentAccount.id,
      studentName: targetStudentName || (currentAccount.role === 'student' ? currentAccount.name : 'طالب المقرأة'),
      teacherId: currentAccount.role === 'teacher' ? currentAccount.id : undefined,
      teacherName: currentAccount.role === 'teacher' ? currentAccount.name : 'مشرف الحلقة الأكاديمي',
      planCategory,
      period,
      surahNumber: surah.number,
      surahName: surah.name,
      ayahStart: Number(ayahStart),
      ayahEnd: Number(ayahEnd),
      pageStart: Number(pageStart),
      pageEnd: Number(pageEnd),
      juzNumber: Number(juzNumber),
      hizbNumber: Number(hizbNumber),
      rubNumber: Number(rubNumber),
      riwayahId: riwayah.id,
      riwayahName: riwayah.name,
      curriculumId: 'mastery_murajaah',
      curriculumTitle: 'منهج الإتقان والتثبيت الراسخ',
      targetDate,
      status: 'pending',
      completionPercentage: 0,
      notes: planNotes.trim()
    };

    const res = await saveAcademicPlan(planPayload);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'تم حفظ وتحديث هدف المراجعة بنجاح في السجلات السحابية!' });
      setIsModalOpen(false);
      loadRevisionPlans();
    } else {
      setFeedback({ type: 'error', message: res.error || 'تعذر حفظ الهدف' });
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الهدف من خطة المراجعة؟')) return;
    const res = await deleteAcademicPlan(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'تم حذف الهدف بنجاح.' });
      loadRevisionPlans();
    }
  };

  const handleToggleComplete = async (plan: AcademicPlanGoal) => {
    const nextStatus = plan.status === 'completed' ? 'in_progress' : 'completed';
    const nextPercentage = nextStatus === 'completed' ? 100 : 50;
    const res = await saveAcademicPlan({
      ...plan,
      status: nextStatus,
      completionPercentage: nextPercentage,
      completedDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    });
    if (res.success) {
      loadRevisionPlans();
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.surahName.includes(searchTerm) || p.studentName.includes(searchTerm);
    const matchesCategory = revisionCategory === 'all' || p.planCategory === revisionCategory;
    return matchesSearch && matchesCategory;
  });

  const overdueCount = plans.filter(p => checkIsPlanOverdue(p.targetDate, p.status).isOverdue).length;
  const minorCount = plans.filter(p => p.planCategory === 'minor_revision').length;
  const majorCount = plans.filter(p => p.planCategory === 'major_revision').length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#C5A059] to-[#99732b] rounded-3xl p-6 text-white shadow-md border-b-4 border-[#046A38] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#046A38] text-white font-sans">
              خطة المراجعة المنفصلة
            </span>
            <span className="text-xs text-amber-100">التثبيت الراسخ والدورات الدورية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-2 text-white">
            <RefreshCw className="w-6 h-6 text-emerald-200" />
            <span>خطة المراجعة والتثبيت القرآني</span>
          </h2>
          <p className="text-xs sm:text-sm text-amber-50 max-w-2xl leading-relaxed">
            مسار مراجعة مستقل تماماً: يفرّق بين المراجعة الصغرى (الحفظ الحديث وآخر 5 أجزاء) والمراجعة الكبرى (ختمات التثبيت القديمة) لصون كتاب الله من النسيان.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all border border-amber-200"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مقرر مراجعة</span>
            </button>
          )}
          <button
            onClick={loadRevisionPlans}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 2. Revision Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">إجمالي مقررات المراجعة</span>
          <p className="text-2xl font-black text-[#C5A059] mt-1 font-serif">{plans.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">مراجعة صغرى (حفظ حديث)</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-serif">{minorCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">مراجعة كبرى (تثبيت دوري)</span>
          <p className="text-2xl font-black text-purple-700 mt-1 font-serif">{majorCount}</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          overdueCount > 0 ? 'bg-rose-50/90 border-rose-300' : 'bg-white border-slate-200/80'
        }`}>
          <span className={`text-xs font-bold ${overdueCount > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
            المتأخر عن التثبيت
          </span>
          <p className={`text-2xl font-black mt-1 font-serif ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {overdueCount} {overdueCount > 0 ? 'متأخر' : 'منضبط'}
          </p>
        </div>
      </div>

      {/* 3. Category Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setRevisionCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              revisionCategory === 'all' ? 'bg-[#046A38] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({plans.length})
          </button>
          <button
            onClick={() => setRevisionCategory('minor_revision')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              revisionCategory === 'minor_revision' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المراجعة الصغرى (آخر 5 أجزاء)
          </button>
          <button
            onClick={() => setRevisionCategory('major_revision')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              revisionCategory === 'major_revision' ? 'bg-purple-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            المراجعة الكبرى (الختمة الدورية)
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm mr-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث بالسورة أو الطالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Revision Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-[#F9F6F0] p-12 text-center rounded-3xl border border-[#C5A059]/30 space-y-3">
          <RotateCcw className="w-12 h-12 text-[#C5A059]/60 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 font-serif">لا توجد أهداف مراجعة مسجلة حالياً</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            المراجعة هي روح الحفظ؛ أضف مقررات المراجعة الصغرى والكبرى لضمان رسوخ القرآن كالفاتحة.
          </p>
          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border border-[#C5A059]"
            >
              إضافة مقرر مراجعة الآن
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const overdueInfo = checkIsPlanOverdue(plan.targetDate, plan.status);
            const isCompleted = plan.status === 'completed';
            const isMinor = plan.planCategory === 'minor_revision';

            return (
              <div 
                key={plan.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs relative flex flex-col justify-between ${
                  overdueInfo.isOverdue
                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : 'border-slate-200 hover:border-[#C5A059]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isMinor
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-purple-100 text-purple-900 border border-purple-300'
                        }`}>
                          {isMinor ? 'مراجعة صغرى (حديثة)' : 'مراجعة كبرى (ختمة تثبيت)'}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          {plan.studentName}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-serif text-[#046A38] mt-1 flex items-center gap-1.5">
                        <span>سورة {plan.surahName}</span>
                        <span className="text-xs text-slate-600 font-sans font-medium">
                          ({plan.ayahStart === 1 && plan.ayahEnd >= 10 ? 'كامل السورة' : `الآيات ${plan.ayahStart} - ${plan.ayahEnd}`})
                        </span>
                      </h3>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تمت المراجعة</span>
                        </span>
                      ) : overdueInfo.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>تأخر {overdueInfo.daysLate} يوم</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>مقرر اليوم</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divisions */}
                  <div className="grid grid-cols-4 gap-2 bg-[#F9F6F0] p-2 rounded-xl border border-[#C5A059]/20 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">الجزء</span>
                      <strong className="text-slate-800 font-serif">{plan.juzNumber || 1}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الحزب</span>
                      <strong className="text-slate-800 font-serif">{plan.hizbNumber || 1}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الصفحات</span>
                      <strong className="text-slate-800 font-serif">
                        {plan.pageStart === plan.pageEnd ? `ص ${plan.pageStart}` : `ص ${plan.pageStart} - ${plan.pageEnd}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الرواية</span>
                      <strong className="text-[#046A38] text-[11px] truncate block">{plan.riwayahName.split(' ')[0]}</strong>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
                      🔁 <strong>توجيه التثبيت:</strong> {plan.notes}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    موعد التسميع: <span className="font-bold text-slate-700">{plan.targetDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenRecitationSession && (
                      <button
                        onClick={() => onOpenRecitationSession(plan)}
                        className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08e48] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        title="تسميع مراجعة الآن"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تسميع المراجعة</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleComplete(plan)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                      title={isCompleted ? 'إلغاء الإكمال' : 'تعليم كمكتمل'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {isTeacherOrAdmin && (
                      <>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-600 cursor-pointer"
                          title="تعديل المقرر"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 cursor-pointer"
                          title="حذف المقرر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border-2 border-[#C5A059] shadow-2xl space-y-4 my-auto animate-scale-up text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                  {editingPlanId ? 'تعديل مقرر المراجعة' : 'إضافة مقرر مراجعة وتثبيت'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category: Minor vs Major */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تصنيف المراجعة *</label>
                  <select
                    value={planCategory}
                    onChange={(e) => setPlanCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  >
                    <option value="minor_revision">مراجعة صغرى (الحفظ الحديث - آخر 5 أجزاء)</option>
                    <option value="major_revision">مراجعة كبرى (ختمة التثبيت الشاملة)</option>
                  </select>
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ المراجعة *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>

              {/* Surah */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">السورة الكريمة للمراجعة *</label>
                <select
                  value={surahNumber}
                  onChange={(e) => handleSurahChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                >
                  {ALL_114_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.name} ({s.totalAyahs} آية • جزء {s.startJuz} • صفحة {s.startPage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayah Range */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">من آية</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahStart}
                    onChange={(e) => setAyahStart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">إلى آية</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">من صفحة</label>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={pageStart}
                    onChange={(e) => setPageStart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">إلى صفحة</label>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={pageEnd}
                    onChange={(e) => setPageEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Riwayah */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">الرواية المقروء بها *</label>
                <select
                  value={riwayahId}
                  onChange={(e) => setRiwayahId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  {ACADEMIC_RIWAYAHS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">توجيه المعلم للمراجعة</label>
                <textarea
                  rows={2}
                  placeholder="مثال: التدرب على سكون الوقف ومراعاة مد الصلة الصغرى والكبرى."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl font-bold shadow-md cursor-pointer border border-[#C5A059]"
                >
                  {editingPlanId ? 'تحديث المقرر' : 'حفظ المقرر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
