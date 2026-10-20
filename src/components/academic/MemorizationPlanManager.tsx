/**
 * واجهة إدارة خطة الحفظ (Memorization Plan Manager)
 * تدعم: خطة يومية وأسبوعية وشهرية، السور (114)، الأجزاء (30)، الأحزاب (60)، الأرباع (240)، الصفحات (604)
 * حساب نسبة الإنجاز وتنبيهات التأخر التلقائية
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, AlertTriangle, Plus, 
  CheckCircle2, XCircle, Search, Filter, RefreshCw, 
  Trash2, Edit, ArrowRight, ShieldCheck, Sparkles, Check 
} from 'lucide-react';
import { 
  ALL_114_SURAHS, 
  ALL_30_JUZ, 
  ACADEMIC_RIWAYAHS, 
  ACADEMIC_CURRICULA,
  AcademicSurahMeta 
} from '../../data/quranAcademicData';
import { 
  AcademicPlanGoal, 
  checkIsPlanOverdue, 
  fetchAcademicPlans, 
  saveAcademicPlan, 
  deleteAcademicPlan,
  PlanPeriodType 
} from '../../services/academicService';
import { AuthAccount } from '../../types';

interface MemorizationPlanManagerProps {
  currentAccount: AuthAccount;
  targetStudentId?: string;
  targetStudentName?: string;
  onOpenRecitationSession?: (plan: AcademicPlanGoal) => void;
}

export const MemorizationPlanManager: React.FC<MemorizationPlanManagerProps> = ({
  currentAccount,
  targetStudentId,
  targetStudentName,
  onOpenRecitationSession
}) => {
  const isTeacherOrAdmin = currentAccount.role === 'teacher' || currentAccount.role === 'system_admin' || currentAccount.role === 'supervisor';
  const effectiveStudentId = targetStudentId || (currentAccount.role === 'student' ? currentAccount.id : undefined);

  const [plans, setPlans] = useState<AcademicPlanGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | PlanPeriodType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Plan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form Fields
  const [period, setPeriod] = useState<PlanPeriodType>('daily');
  const [surahNumber, setSurahNumber] = useState<number>(2);
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(20);
  const [pageStart, setPageStart] = useState<number>(2);
  const [pageEnd, setPageEnd] = useState<number>(4);
  const [juzNumber, setJuzNumber] = useState<number>(1);
  const [hizbNumber, setHizbNumber] = useState<number>(1);
  const [rubNumber, setRubNumber] = useState<number>(1);
  const [riwayahId, setRiwayahId] = useState<string>('hafs');
  const [curriculumId, setCurriculumId] = useState<string>('regular');
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [planNotes, setPlanNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [effectiveStudentId]);

  const loadPlans = async () => {
    setIsLoading(true);
    const res = await fetchAcademicPlans(effectiveStudentId, 'new_memorization');
    if (res.data) {
      setPlans(res.data);
    }
    setIsLoading(false);
  };

  // Synchronize surah change with pages & juz
  const handleSurahChange = (sNum: number) => {
    setSurahNumber(sNum);
    const s = ALL_114_SURAHS.find(item => item.number === sNum);
    if (s) {
      setAyahStart(1);
      setAyahEnd(Math.min(20, s.totalAyahs));
      setPageStart(s.startPage);
      setPageEnd(s.endPage);
      setJuzNumber(s.startJuz);
      setHizbNumber(s.startHizb);
      setRubNumber(s.startRub);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlanId(null);
    setPeriod('daily');
    handleSurahChange(2);
    setTargetDate(new Date().toISOString().split('T')[0]);
    setPlanNotes('');
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: AcademicPlanGoal) => {
    setEditingPlanId(plan.id);
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
    setCurriculumId(plan.curriculumId);
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
    const curriculum = ACADEMIC_CURRICULA.find(c => c.id === curriculumId) || ACADEMIC_CURRICULA[0];

    const planPayload: Partial<AcademicPlanGoal> = {
      id: editingPlanId || undefined,
      studentId: effectiveStudentId || currentAccount.id,
      studentName: targetStudentName || (currentAccount.role === 'student' ? currentAccount.name : 'طالب المقرأة'),
      teacherId: currentAccount.role === 'teacher' ? currentAccount.id : undefined,
      teacherName: currentAccount.role === 'teacher' ? currentAccount.name : 'مشرف الحلقة الأكاديمي',
      planCategory: 'new_memorization',
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
      curriculumId: curriculum.id,
      curriculumTitle: curriculum.title,
      targetDate,
      status: 'pending',
      completionPercentage: 0,
      notes: planNotes.trim()
    };

    const res = await saveAcademicPlan(planPayload);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'تم حفظ وتحديث هدف خطة الحفظ بنجاح في السجلات السحابية!' });
      setIsModalOpen(false);
      loadPlans();
    } else {
      setFeedback({ type: 'error', message: res.error || 'تعذر حفظ الخطة' });
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الهدف من خطة الحفظ؟')) return;
    const res = await deleteAcademicPlan(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'تم حذف الهدف بنجاح.' });
      loadPlans();
    } else {
      setFeedback({ type: 'error', message: 'تعذر حذف الهدف' });
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
      loadPlans();
    }
  };

  // Filter plans
  const filteredPlans = plans.filter(p => {
    const matchesSearch = 
      p.surahName.includes(searchTerm) || 
      p.studentName.includes(searchTerm) || 
      p.riwayahName.includes(searchTerm);
    const matchesPeriod = periodFilter === 'all' || p.period === periodFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const overdueInfo = checkIsPlanOverdue(p.targetDate, p.status);
      if (statusFilter === 'overdue') matchesStatus = overdueInfo.isOverdue;
      else if (statusFilter === 'completed') matchesStatus = p.status === 'completed';
      else if (statusFilter === 'in_progress') matchesStatus = p.status === 'in_progress' || p.status === 'pending';
    }

    return matchesSearch && matchesPeriod && matchesStatus;
  });

  // Calculate totals
  const totalCompleted = plans.filter(p => p.status === 'completed').length;
  const overdueCount = plans.filter(p => checkIsPlanOverdue(p.targetDate, p.status).isOverdue).length;
  const averageCompletion = plans.length > 0 
    ? Math.round(plans.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / plans.length) 
    : 0;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#046A38] to-[#064e2b] rounded-3xl p-6 text-white shadow-md border-b-4 border-[#C5A059] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A059] text-slate-950 font-sans">
              النظام الأكاديمي المعتمد 2026
            </span>
            <span className="text-xs text-emerald-200">الروايات والمناهج الرسمية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#C5A059]" />
            <span>إدارة خطة الحفظ القرآني الجديد</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            تخطيط يومي، أسبوعي، وشهري مع دعم كامل للسور، الأجزاء، الأحزاب، الأرباع، والصفحات وحساب دقيق لنسب الإنجاز وتنبيهات التأخر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#C5A059] hover:bg-[#b58f47] text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة هدف حفظ جديد</span>
            </button>
          )}
          <button
            onClick={loadPlans}
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

      {/* 2. Overdue Alerts & Academic KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">إجمالي أهداف الحفظ</span>
          <p className="text-2xl font-black text-[#046A38] mt-1 font-serif">{plans.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">المكتمل بنجاح</span>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-serif">{totalCompleted}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-bold">متوسط نسبة الإنجاز</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-[#C5A059] font-serif">{averageCompletion}%</span>
            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#C5A059]" style={{ width: `${averageCompletion}%` }}></div>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
          overdueCount > 0 ? 'bg-rose-50/90 border-rose-300 animate-soft-pulse' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${overdueCount > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
              تنبيهات التأخر عن الخطة
            </span>
            {overdueCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />}
          </div>
          <p className={`text-2xl font-black mt-1 font-serif ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {overdueCount} {overdueCount > 0 ? 'أهداف متأخرة' : 'لا يوجد تأخر'}
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث باسم السورة، الطالب، أو الرواية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-medium focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">كافة الفترات</option>
            <option value="daily">خطة يومية</option>
            <option value="weekly">خطة أسبوعية</option>
            <option value="monthly">خطة شهرية</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">كافة الحالات</option>
            <option value="in_progress">قيد الحفظ</option>
            <option value="completed">تم الحفظ والإتقان</option>
            <option value="overdue">متأخر عن الموعد</option>
          </select>
        </div>
      </div>

      {/* 4. Plans List Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-[#F9F6F0] p-12 text-center rounded-3xl border border-[#C5A059]/30 space-y-3">
          <BookOpen className="w-12 h-12 text-[#046A38]/50 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 font-serif">لا توجد أهداف حفظ مطابقة للبحث</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            يمكنك إضافة هدف حفظ يومي أو أسبوعي لتحديد السورة ومقدار الآيات والصفحات للبدء فوراً.
          </p>
          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border border-[#C5A059]"
            >
              إضافة هدف حفظ الآن
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const overdueInfo = checkIsPlanOverdue(plan.targetDate, plan.status);
            const isCompleted = plan.status === 'completed';

            return (
              <div 
                key={plan.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs relative flex flex-col justify-between ${
                  overdueInfo.isOverdue
                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : 'border-slate-200 hover:border-[#046A38]/40'
                }`}
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          plan.period === 'daily'
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : plan.period === 'weekly'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {plan.period === 'daily' ? 'يومي' : plan.period === 'weekly' ? 'أسبوعي' : 'شهري'}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          {plan.studentName}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-serif text-[#046A38] mt-1 flex items-center gap-1.5">
                        <span>سورة {plan.surahName}</span>
                        <span className="text-xs text-slate-600 font-sans font-medium">
                          (الآيات {plan.ayahStart} - {plan.ayahEnd})
                        </span>
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>مكتمل</span>
                        </span>
                      ) : overdueInfo.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>متأخر {overdueInfo.daysLate} يوم</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>قيد الحفظ</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quran Divisions Details: Surah, Juz, Hizb, Rub, Page */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/20 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">الجزء</span>
                      <strong className="text-slate-800 font-serif">{plan.juzNumber || 1}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الحزب</span>
                      <strong className="text-slate-800 font-serif">{plan.hizbNumber || 1}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">الربع</span>
                      <strong className="text-slate-800 font-serif">{plan.rubNumber || 1}</strong>
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

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>نسبة الإنجاز المحققة:</span>
                      <span className="font-serif text-[#046A38]">{plan.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-emerald-600' : overdueInfo.isOverdue ? 'bg-rose-500' : 'bg-[#C5A059]'
                        }`}
                        style={{ width: `${plan.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                      💡 <strong>ملاحظة الخطة:</strong> {plan.notes}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    الموعد المستهدف: <span className="font-bold text-slate-700">{plan.targetDate}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenRecitationSession && (
                      <button
                        onClick={() => onOpenRecitationSession(plan)}
                        className="px-3 py-1.5 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        title="بدء جلسة تسميع فورية لهذا المقرر"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>تسميع الآن</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleComplete(plan)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-600'
                      }`}
                      title={isCompleted ? 'إلغاء الإكمال' : 'تعليم كمكتمل ومتقن'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {isTeacherOrAdmin && (
                      <>
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-600 cursor-pointer"
                          title="تعديل الهدف"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-600 cursor-pointer"
                          title="حذف الهدف"
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

      {/* 5. Add / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border-2 border-[#C5A059] shadow-2xl space-y-4 my-auto animate-scale-up text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#046A38]" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                  {editingPlanId ? 'تعديل هدف الحفظ الجديد' : 'إضافة هدف حفظ جديد للمقرأة'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Period */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نوع الخطة الزمنية *</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PlanPeriodType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  >
                    <option value="daily">خطة يومية (وجه أو آيات محددة)</option>
                    <option value="weekly">خطة أسبوعية (ربع أو حزب)</option>
                    <option value="monthly">خطة شهرية (جزء أو عدة أجزاء)</option>
                  </select>
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الاستحقاق والتسميع *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>

              {/* Surah Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">السورة الكريمة المستهدفة *</label>
                <select
                  value={surahNumber}
                  onChange={(e) => handleSurahChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                >
                  {ALL_114_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.name} ({s.type} • {s.totalAyahs} آية • جزء {s.startJuz} • صفحة {s.startPage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayah Range */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">من الآية</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahStart}
                    onChange={(e) => setAyahStart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">إلى الآية</label>
                  <input
                    type="number"
                    min="1"
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  />
                </div>
              </div>

              {/* Quran Division: Juz, Hizb, Rub */}
              <div className="grid grid-cols-3 gap-2 bg-[#F9F6F0] p-3 rounded-xl border border-[#C5A059]/30">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الجزء (1-30)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={juzNumber}
                    onChange={(e) => setJuzNumber(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الحزب (1-60)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={hizbNumber}
                    onChange={(e) => setHizbNumber(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم الربع (1-240)</label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={rubNumber}
                    onChange={(e) => setRubNumber(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Riwayah & Curriculum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الرواية القرآنية المعتمدة *</label>
                  <select
                    value={riwayahId}
                    onChange={(e) => setRiwayahId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  >
                    {ACADEMIC_RIWAYAHS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">المنهج التعليمي *</label>
                  <select
                    value={curriculumId}
                    onChange={(e) => setCurriculumId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none"
                  >
                    {ACADEMIC_CURRICULA.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">توجيهات وملاحظات الشيخ للطالب</label>
                <textarea
                  rows={2}
                  placeholder="مثال: التركيز على ضبط مخارج حروف القلقلة، ومراعاة مراتب التفخيم في الصاد والضاد."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none resize-none"
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
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl font-bold shadow-md cursor-pointer border border-[#C5A059] flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingPlanId ? 'تحديث الهدف' : 'اعتماد الهدف وحفظه'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
