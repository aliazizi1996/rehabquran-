import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, BookOpen, Brain, CheckCircle2, Circle, Clock, 
  RotateCcw, Printer, Share2, Award, ChevronLeft, ChevronDown, 
  ChevronUp, Search, Volume2, ShieldCheck, Flame, Calendar,
  ArrowRight, Trash2, Plus, AlertCircle, HelpCircle, Star,
  Compass, Lightbulb, UserCheck, Layers, Eye
} from 'lucide-react';
import { ALL_114_SURAHS, QuranSurahInfo } from '../../data/quranAudioData';
import { 
  SmartMemorizationPlan, 
  SmartDailySegment,
  StudentMemorizationLevel,
  requestSmartMemorizationPlan,
  getSavedSmartPlans,
  saveSmartPlan,
  deleteSmartPlan,
  getActiveSmartPlan,
  setActiveSmartPlanId,
  toggleDailySegmentCompletion,
  calculatePlanProgress
} from '../../services/smartMemorizationService';

interface SmartMemorizationToolProps {
  studentName?: string;
  onNavigateToAudioPlayer?: (surahNumber: number) => void;
  onBackToDashboard?: () => void;
}

const POPULAR_SURAHS = [
  { number: 1, name: 'الفاتحة' },
  { number: 67, name: 'الملك' },
  { number: 78, name: 'النبأ' },
  { number: 36, name: 'يس' },
  { number: 18, name: 'الكهف' },
  { number: 55, name: 'الرحمن' },
  { number: 56, name: 'الواقعة' },
  { number: 2, name: 'البقرة' },
];

const LEVEL_CARDS: Array<{
  id: StudentMemorizationLevel;
  title: string;
  sub: string;
  badge: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  desc: string;
}> = [
  {
    id: 'beginner',
    title: 'مبتدئ',
    sub: 'خطوة بخطوة',
    badge: '٢ - ٤ آيات يومياً',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-300',
    desc: 'مقاطع قصيرة ميسرة مع تكرار سماعي مكثف (٧ مرات) وترديد مطمئن لضبط المخارج.'
  },
  {
    id: 'intermediate',
    title: 'متوسط',
    sub: 'المستوى المتزن',
    badge: '٥ - ٨ آيات يومياً',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    desc: 'مقاطع متوازنة تراعي تمام المعنى القرآني، مع ورد مراجعة تراكمي للمقاطع السابقة.'
  },
  {
    id: 'advanced',
    title: 'متقدم',
    sub: 'همة عالية',
    badge: '١٠ - ١٥ آية / وجه',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-300',
    desc: 'مقاطع واسعة تركز على ضبط المتشابهات اللفظية والوقف التام وأحكام التجويد الدقيقة.'
  },
  {
    id: 'hafiz',
    title: 'مراجعة وتثبيت',
    sub: 'للحفاظ والمتقنين',
    badge: 'ربع أو نصف حزب',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-300',
    desc: 'مراجعة تثبيتية سريعة ومتقنة تركز على ربط السور والأرباع وتمكين الحفظ بالسند.'
  },
  {
    id: 'kids',
    title: 'أشبال وبراعم',
    sub: 'للصغار والناشئة',
    badge: 'آيات قصيرة ميسرة',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    desc: 'أسلوب تفاعلي تشجيعي مع تبسيط المعاني وعبارات تحفيزية محببة لكتاب الله.'
  },
];

export const SmartMemorizationTool: React.FC<SmartMemorizationToolProps> = ({
  studentName = 'طالب المقرأة',
  onNavigateToAudioPlayer,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'current_plan' | 'create_new' | 'saved_plans'>('current_plan');
  const [savedPlans, setSavedPlans] = useState<SmartMemorizationPlan[]>(() => getSavedSmartPlans());
  const [currentPlan, setCurrentPlan] = useState<SmartMemorizationPlan | null>(() => getActiveSmartPlan());

  // Form State for creating a new plan
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(67); // Default: سورة الملك
  const [customFromAyah, setCustomFromAyah] = useState<number>(1);
  const [customToAyah, setCustomToAyah] = useState<number>(30);
  const [selectedLevel, setSelectedLevel] = useState<StudentMemorizationLevel>('intermediate');
  const [dailyMinutes, setDailyMinutes] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('');
  const [riwayah, setRiwayah] = useState<string>('حفص عن عاصم');
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');

  // Generation Loading State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

  // Synchronize state when custom event fires
  useEffect(() => {
    const handleUpdate = () => {
      const all = getSavedSmartPlans();
      setSavedPlans(all);
      setCurrentPlan(getActiveSmartPlan());
    };
    window.addEventListener('smart_memorization_updated', handleUpdate);
    return () => window.removeEventListener('smart_memorization_updated', handleUpdate);
  }, []);

  // Update ToAyah when surah changes
  const selectedSurahInfo = useMemo(() => {
    return ALL_114_SURAHS.find(s => s.number === selectedSurahNumber) || ALL_114_SURAHS[0];
  }, [selectedSurahNumber]);

  useEffect(() => {
    setCustomFromAyah(1);
    setCustomToAyah(selectedSurahInfo.totalAyahs);
  }, [selectedSurahInfo]);

  // Filtered Surahs
  const filteredSurahs = useMemo(() => {
    if (!surahSearchQuery.trim()) return ALL_114_SURAHS;
    const q = surahSearchQuery.trim();
    return ALL_114_SURAHS.filter(s => 
      s.name.includes(q) || 
      s.number.toString() === q ||
      s.englishName?.toLowerCase().includes(q.toLowerCase())
    );
  }, [surahSearchQuery]);

  // Progress metrics for current plan
  const planProgress = useMemo(() => {
    if (!currentPlan) return { completedDays: 0, totalDays: 0, percentage: 0, isAllCompleted: false };
    return calculatePlanProgress(currentPlan);
  }, [currentPlan]);

  // Handle plan generation via server-side Gemini
  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await requestSmartMemorizationPlan({
        surahNumber: selectedSurahInfo.number,
        surahName: selectedSurahInfo.name,
        totalAyahs: selectedSurahInfo.totalAyahs,
        fromAyah: Number(customFromAyah) || 1,
        toAyah: Number(customToAyah) || selectedSurahInfo.totalAyahs,
        studentLevel: selectedLevel,
        dailyAvailableMinutes: dailyMinutes,
        targetDays: customDays ? Number(customDays) : undefined,
        riwayah,
        studentName,
      });

      if (result.plan) {
        setCurrentPlan(result.plan);
        setSavedPlans(getSavedSmartPlans());
        setActiveTab('current_plan');
        setExpandedDay(1);
        setCelebrationToast(`تم بحمد الله إعداد خطة التحفيظ الذكية لسورة ${result.plan.surahName} مقسمة على ${result.plan.totalDays} يوماً!`);
        setTimeout(() => setCelebrationToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setGenerationError(err?.message || 'تعذر الاتصال بخدمة التحفيظ الذكي. يرجى إعادة المحاولة.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Day completion
  const handleToggleDay = (dayNumber: number) => {
    if (!currentPlan) return;
    const updated = toggleDailySegmentCompletion(currentPlan.id, dayNumber);
    if (updated) {
      setCurrentPlan({ ...updated });
      const completed = updated.dailySegments.find(s => s.dayNumber === dayNumber)?.completed;
      if (completed) {
        setCelebrationToast(`أحسنت بارك الله فيك! تم إنجاز وتسميع مقطع اليوم ${dayNumber} بنجاح 🎉`);
        setTimeout(() => setCelebrationToast(null), 3000);
      }
    }
  };

  // Handle Printing
  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#044223] via-[#046A38] to-[#022e17] rounded-3xl p-5 sm:p-7 text-white shadow-xl border-b-4 border-[#C5A059] relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <img src="/brand/official-seal.png" alt="" className="w-80 h-80 object-contain" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#fce8bd] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#dfbe75]" />
              <span>مساعد التحفيظ الذكي بالذكاء الاصطناعي (Gemini)</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-[#C5A059]" />
              <span>أداة التحفيظ الذكي وتجزئة السور القرآنية</span>
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              تقسيم علمي رصين للسور إلى مقاطع تسميع يومية قصيرة ومحكمة تراعي الوقف والابتداء التام والتناسب الدقيق مع مستوى حفظك الحالي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {currentPlan && (
              <button
                type="button"
                onClick={handlePrintPlan}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-xs"
                title="طباعة خطة الحفظ اليومية"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span className="hidden sm:inline">طباعة الخطة</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3.5 py-2 bg-[#F9F6F0] hover:bg-slate-100 text-[#046A38] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>العودة للرئيسية ←</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Navigation Tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-emerald-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('current_plan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'current_plan'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'bg-black/30 text-emerald-100 hover:bg-black/50 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الخطة الحالية للمقاطع</span>
            {currentPlan && (
              <span className="bg-emerald-950 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                {planProgress.percentage}%
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create_new')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create_new'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'bg-black/30 text-emerald-100 hover:bg-black/50 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء خطة سورة جديدة ⚡</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved_plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'saved_plans'
                ? 'bg-[#C5A059] text-slate-950 shadow-md font-black'
                : 'bg-black/30 text-emerald-100 hover:bg-black/50 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>خططي المحفوظة ({savedPlans.length})</span>
          </button>
        </div>
      </div>

      {/* Celebration Notification Toast */}
      {celebrationToast && (
        <div className="bg-emerald-800 text-white p-3.5 rounded-2xl border border-[#C5A059] shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{celebrationToast}</span>
          </div>
          <button 
            onClick={() => setCelebrationToast(null)}
            className="text-xs text-emerald-200 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: CURRENT ACTIVE PLAN                               */}
      {/* ======================================================== */}
      {activeTab === 'current_plan' && (
        <div className="space-y-6">
          {!currentPlan ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#046A38] mx-auto flex items-center justify-center border border-emerald-200">
                <Brain className="w-8 h-8 text-[#046A38]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg font-serif text-slate-800">
                  لم تقم بإنشاء خطة تحفيظ ذكية بعد
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  اختر السورة التي تود حفظها أو تثبيتها، وحدد مستواك، وسيقوم الذكاء الاصطناعي بتقسيمها فورياً إلى مقاطع تسميع يومية قصيرة ومحكمة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('create_new')}
                className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer border border-[#C5A059]"
              >
                <Plus className="w-4 h-4 text-[#C5A059]" />
                <span>ابدأ الآن بإنشاء أول خطة لسورة</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Plan Metadata & Metrics Card */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#046A38] text-white font-mono">
                        سورة {currentPlan.surahName} ({currentPlan.surahNumber})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A059]/20 text-[#046A38] border border-[#C5A059]/40">
                        الآيات: {currentPlan.fromAyah} - {currentPlan.toAyah}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        المستوى: {currentPlan.studentLevelLabel}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
                      خطة التحفيظ الذكية: سورة {currentPlan.surahName}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {currentPlan.overviewSummary}
                    </p>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onNavigateToAudioPlayer && (
                      <button
                        type="button"
                        onClick={() => onNavigateToAudioPlayer(currentPlan.surahNumber)}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="الاستماع لسورة بصوت مشايخ المقرأة"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="hidden sm:inline">استماع للسورة</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('create_new')}
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-700" />
                      <span>سورة أخرى</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar & KPI Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">إجمالي أيام الخطة</span>
                    <span className="text-xl font-bold font-serif text-[#046A38]">{currentPlan.totalDays} أيام</span>
                  </div>
                  <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">المقاطع المنجزة</span>
                    <span className="text-xl font-bold font-serif text-[#046A38]">
                      {planProgress.completedDays} من {planProgress.totalDays}
                    </span>
                  </div>
                  <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">الوقت اليومي المخصص</span>
                    <span className="text-xl font-bold font-serif text-slate-800">{currentPlan.dailyAvailableMinutes} دقيقة</span>
                  </div>
                  <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-bold block">نسبة الإنجاز الكلية</span>
                    <span className="text-xl font-black font-mono text-[#C5A059]">{planProgress.percentage}%</span>
                  </div>
                </div>

                {/* Overall Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>مؤشر تقدم التسميع والحفظ اليومي:</span>
                    <span className="font-mono text-[#046A38]">{planProgress.completedDays} / {planProgress.totalDays} مقطع</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-l from-[#046A38] to-[#068f4d] transition-all duration-500 rounded-full"
                      style={{ width: `${planProgress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Daily Segments Accordion Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-base font-serif text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C5A059]" />
                    <span>جدول المقاطع اليومية المفصلة (اضغط على المقطع للتفاصيل):</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    حدد المكتمل لحفظ تقدمك اليومي
                  </span>
                </div>

                {currentPlan.dailySegments.map((segment) => {
                  const isExpanded = expandedDay === segment.dayNumber;
                  const isCompleted = !!segment.completed;

                  return (
                    <div 
                      key={segment.dayNumber}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isCompleted 
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs' 
                          : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                      }`}
                    >
                      {/* Segment Header Row */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Completion Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleDay(segment.dayNumber)}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                              isCompleted
                                ? 'bg-[#046A38] text-white shadow-xs'
                                : 'border-2 border-slate-300 text-transparent hover:border-[#046A38]'
                            }`}
                            title={isCompleted ? 'إلغاء تحديد الإنجاز' : 'تحديد هذا المقطع كمكتمل وحفظ اليوم'}
                          >
                            <CheckCircle2 className="w-5 h-5 fill-current" />
                          </button>

                          <div 
                            onClick={() => setExpandedDay(isExpanded ? null : segment.dayNumber)}
                            className="cursor-pointer flex-1 min-w-0"
                          >
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
                                isCompleted ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-700'
                              }`}>
                                اليوم {segment.dayNumber}
                              </span>
                              <span className="text-xs font-bold text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                الآيات: {segment.fromAyah} إلى {segment.toAyah} ({segment.ayahCount} آيات)
                              </span>
                              <span className="text-[11px] text-slate-500">
                                ⏱️ {segment.estimatedMinutes} دقيقة
                              </span>
                            </div>

                            <h4 className={`text-sm sm:text-base font-bold font-serif truncate ${
                              isCompleted ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'
                            }`}>
                              {segment.title}
                            </h4>
                          </div>
                        </div>

                        {/* Chevron expand */}
                        <button
                          type="button"
                          onClick={() => setExpandedDay(isExpanded ? null : segment.dayNumber)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Expanded Details Body */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-100/80 space-y-4 animate-fade-in text-xs sm:text-sm">
                          {/* Snippet / Context */}
                          {segment.textSnippet && (
                            <div className="p-3 bg-[#F9F6F0] rounded-xl border border-[#C5A059]/40 font-serif text-slate-800 leading-relaxed text-center sm:text-right">
                              <span className="text-[11px] font-bold text-[#046A38] block mb-1">مطلع الآيات الكريمة:</span>
                              <p className="text-sm sm:text-base font-amiri font-bold text-[#046A38]">
                                « {segment.textSnippet} »
                              </p>
                            </div>
                          )}

                          {/* Meaning Summary */}
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>الهداية الإيمانية وموضوع المقطع:</span>
                            </span>
                            <p className="text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                              {segment.meaningSummary}
                            </p>
                          </div>

                          {/* 3-Column Recommendations */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Listening Repetitions */}
                            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-center">
                              <span className="text-[10px] text-emerald-800 font-bold block">سماع المقرئ المتقن</span>
                              <span className="text-base font-black text-[#046A38] font-mono">
                                {segment.recommendedListenReps} مرات
                              </span>
                              <span className="text-[10px] text-emerald-700 block mt-0.5">قبل البدء بالحفظ</span>
                            </div>

                            {/* Recitation Repetitions */}
                            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
                              <span className="text-[10px] text-amber-800 font-bold block">التكرار والتسميع غيباً</span>
                              <span className="text-base font-black text-amber-800 font-mono">
                                {segment.recommendedReciteReps} مرة
                              </span>
                              <span className="text-[10px] text-amber-700 block mt-0.5">لتثبيت المقطع في الذاكرة</span>
                            </div>

                            {/* Daily Cumulative Review */}
                            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 text-center">
                              <span className="text-[10px] text-blue-800 font-bold block">ورد المراجعة التراكمي</span>
                              <span className="text-xs font-bold text-blue-900 block mt-1 line-clamp-2">
                                {segment.dailyCumulativeReview}
                              </span>
                            </div>
                          </div>

                          {/* Tajweed Tip Box */}
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-start gap-2.5">
                            <Compass className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] font-bold text-purple-900 block">تنبيه تجويدي خاص بهذا المقطع:</span>
                              <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                                {segment.tajweedTip}
                              </p>
                            </div>
                          </div>

                          {/* Sheikh Encouragement Box */}
                          <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-300 flex items-start gap-2.5">
                            <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[11px] font-bold text-amber-900 block">وصية فضيلة الشيخ المعلم لليوم:</span>
                              <p className="text-xs text-amber-950 mt-0.5 leading-relaxed font-serif italic">
                                "{segment.sheikhEncouragement}"
                              </p>
                            </div>
                          </div>

                          {/* Mark Complete Action Button */}
                          <div className="pt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleDay(segment.dayNumber)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                isCompleted
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                                  : 'bg-[#046A38] hover:bg-[#03542c] text-white shadow-md border border-[#C5A059]'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isCompleted ? 'إلغاء التحديد' : 'تم الحفظ والتسميع اليوم ✓'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATE NEW SMART PLAN (AI GEMINI BUILDER)         */}
      {/* ======================================================== */}
      {activeTab === 'create_new' && (
        <form onSubmit={handleGeneratePlan} className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#046A38]" />
                <h3 className="font-bold text-lg font-serif text-[#046A38]">
                  إعداد خطة تحفيظ جديدة بواسطة Gemini
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                حدد السورة ومستواك الحالي والوقت اليومي المتاح، وسيقوم النموذج الذكي بتقسيم الآيات وفق الوقف التام وتحديد أوراد المراجعة.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-[#046A38] border border-emerald-200">
              مدعوم بنموذج gemini-3.8-flash
            </span>
          </div>

          {/* 1. Surah Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              1. اختر السورة الكريمة المراد حفظها أو تجزئتها:
            </label>

            {/* Quick Popular Surahs Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[11px] text-slate-400 font-bold ml-1">اقتراحات سريعة:</span>
              {POPULAR_SURAHS.map((ps) => (
                <button
                  type="button"
                  key={ps.number}
                  onClick={() => setSelectedSurahNumber(ps.number)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    selectedSurahNumber === ps.number
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'bg-[#F9F6F0] text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  سورة {ps.name}
                </button>
              ))}
            </div>

            {/* Searchable Select dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ابحث باسم السورة أو رقمها (مثال: الملك أو 67)..."
                  value={surahSearchQuery}
                  onChange={(e) => setSurahSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden"
                />
              </div>

              <div>
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => setSelectedSurahNumber(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-[#046A38] outline-hidden cursor-pointer"
                >
                  {filteredSurahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      ({s.number}) سورة {s.name} • {s.totalAyahs} آية • {s.type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ayah Range Customization */}
            <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#046A38]" />
                <span className="font-bold text-slate-800">نطاق الآيات المستهدف:</span>
              </div>
              <div className="flex items-center gap-2">
                <span>من الآية:</span>
                <input
                  type="number"
                  min={1}
                  max={selectedSurahInfo.totalAyahs}
                  value={customFromAyah}
                  onChange={(e) => setCustomFromAyah(Math.max(1, Number(e.target.value)))}
                  className="w-16 p-1.5 rounded-lg border border-slate-300 text-center font-bold font-mono bg-white"
                />
                <span>إلى الآية:</span>
                <input
                  type="number"
                  min={customFromAyah}
                  max={selectedSurahInfo.totalAyahs}
                  value={customToAyah}
                  onChange={(e) => setCustomToAyah(Math.min(selectedSurahInfo.totalAyahs, Number(e.target.value)))}
                  className="w-16 p-1.5 rounded-lg border border-slate-300 text-center font-bold font-mono bg-white"
                />
                <span className="text-slate-400 font-mono text-[11px]">
                  (إجمالي السورة: {selectedSurahInfo.totalAyahs} آية)
                </span>
              </div>
            </div>
          </div>

          {/* 2. Level Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              2. حدد مستوى حفظك الحالي (يقوم الذكاء الاصطناعي بضبط حجم المقطع وفق هذا الخيار):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LEVEL_CARDS.map((lvl) => {
                const isSelected = selectedLevel === lvl.id;
                return (
                  <div
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#046A38] bg-emerald-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${isSelected ? 'bg-[#046A38]' : 'bg-slate-300'}`} />
                        <h4 className="font-bold text-sm text-slate-900 font-serif">{lvl.title}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lvl.bgClass} ${lvl.colorClass}`}>
                        {lvl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {lvl.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Daily Available Time & Riwayah */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                الوقت اليومي المتاح للتسميع:
              </label>
              <select
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-[#046A38] outline-hidden cursor-pointer"
              >
                <option value={15}>15 دقيقة يومياً (تسميع سريع)</option>
                <option value={30}>30 دقيقة يومياً (المعدل الموصى به)</option>
                <option value={45}>45 دقيقة يومياً (تركيز وتثبيت)</option>
                <option value={60}>60 دقيقة يومياً (مكثف وإتقان)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                الرواية القرآنية المعتمدة:
              </label>
              <select
                value={riwayah}
                onChange={(e) => setRiwayah(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-[#046A38] outline-hidden cursor-pointer"
              >
                <option value="حفص عن عاصم">رواية حفص عن عاصم (بالسند)</option>
                <option value="ورش عن نافع">رواية ورش عن نافع (طريق الأزرق)</option>
                <option value="قالون عن نافع">رواية قالون عن نافع</option>
                <option value="شعبة عن عاصم">رواية شعبة عن عاصم</option>
                <option value="الدوري عن أبي عمرو">رواية الدوري عن أبي عمرو</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                مدة إتمام الخطة (اختياري بالـ أيام):
              </label>
              <input
                type="number"
                placeholder="تلقائي حسب الذكاء الاصطناعي"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#046A38] outline-hidden font-bold"
              />
            </div>
          </div>

          {/* Error notice if any */}
          {generationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{generationError}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-right">
              سيتم حفظ الخطة تلقائياً في حسابك مع إمكانية متابعة الإنجاز يومياً ومراجعتها مع الشيخ.
            </span>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#046A38] to-[#068f4d] hover:from-[#03542c] hover:to-[#046A38] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 cursor-pointer border border-[#C5A059]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري تجزئة السورة وضبط المقاطع بواسطة Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#dfbe75]" />
                  <span>توليد خطة التحفيظ الذكية الآن ⚡</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SAVED PLANS HISTORY                               */}
      {/* ======================================================== */}
      {activeTab === 'saved_plans' && (
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base font-serif text-[#046A38] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C5A059]" />
              <span>سجل خطط التحفيظ الذكية المحفوظة للطالب:</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              إجمالي الخطط: {savedPlans.length}
            </span>
          </div>

          {savedPlans.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              لا توجد خطط محفوظة حالياً. أنشئ أول خطة لسورة من تبويب «إنشاء خطة جديدة».
            </div>
          ) : (
            <div className="space-y-3">
              {savedPlans.map((plan) => {
                const prog = calculatePlanProgress(plan);
                const isActive = currentPlan?.id === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'border-[#046A38] bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 font-serif">
                          سورة {plan.surahName} ({plan.surahNumber})
                        </span>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-700">
                          {plan.totalDays} أيام • {plan.totalAyahs} آية
                        </span>
                        <span className="text-xs bg-[#C5A059]/20 text-[#046A38] px-2 py-0.5 rounded-full font-bold">
                          {plan.studentLevelLabel}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold bg-[#046A38] text-white px-2 py-0.5 rounded-full">
                            الخطة النشطة حالياً
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{plan.overviewSummary}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="text-center pl-3 border-l border-slate-200">
                        <span className="text-xs font-mono font-bold text-[#046A38] block">{prog.percentage}%</span>
                        <span className="text-[10px] text-slate-400">{prog.completedDays}/{prog.totalDays} مقطع</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveSmartPlanId(plan.id);
                          setCurrentPlan(plan);
                          setActiveTab('current_plan');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition cursor-pointer"
                      >
                        عرض ومتابعة
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف خطة سورة ${plan.surahName}؟`)) {
                            deleteSmartPlan(plan.id);
                            const updated = getSavedSmartPlans();
                            setSavedPlans(updated);
                            setCurrentPlan(getActiveSmartPlan());
                          }
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="حذف الخطة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
