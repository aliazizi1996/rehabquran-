/**
 * StudentTajweedProgressCard.tsx
 * قسم «دروس التجويد والمستوى الأكاديمي مع ميزة التصنيف والفلترة» في لوحة الطالب
 * يتيح تصفية الدروس حسب:
 * 1. المستوى (المستويات 1 إلى 7)
 * 2. المادة / الموضوع (النون والتنوين، الميم، المدود، المخارج، الصفات، مبادئ التجويد، التطبيق العملي)
 * 3. الحالة (تم الإنجاز / قيد التنفيذ / مغلق)
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Unlock, 
  ChevronLeft, 
  Award, 
  Volume2, 
  ArrowRight,
  Bookmark,
  Layers,
  Check,
  Filter,
  Search,
  RotateCcw,
  Play,
  Pause,
  FileText,
  HelpCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react';
import { 
  getActiveCurriculum, 
  getAllLevelsStatus, 
  getLessonProgressMap, 
  isLessonUnlocked,
  LevelInfo,
  LessonProgressData 
} from '../../data/learningStore';
import { TajweedChapter, TajweedLesson } from '../../types';
import { TajweedPdfPreviewModal } from './TajweedPdfPreviewModal';

interface StudentTajweedProgressCardProps {
  studentName: string;
  studentTajweedScore?: number;
  studentTajweedNotes?: string;
  onOpenFullTajweedCurriculum?: () => void;
  onSelectLesson?: (lessonId: string, chapterId: string) => void;
}

// Function to map each lesson/chapter to a distinct Tajweed Subject/Material
export const getTajweedSubjectName = (chapterId: string, lessonTitle: string): string => {
  if (chapterId.includes('noon') || lessonTitle.includes('النون') || lessonTitle.includes('التنوين') || lessonTitle.includes('الإظهار') || lessonTitle.includes('الإدغام') || lessonTitle.includes('الإقلاب') || lessonTitle.includes('الإخفاء')) {
    return 'أحكام النون الساكنة والتنوين';
  }
  if (chapterId.includes('meem') || lessonTitle.includes('الميم') || lessonTitle.includes('المشددة') || lessonTitle.includes('المتماثلين')) {
    return 'أحكام الميم الساكنة والنون المشددة';
  }
  if (chapterId.includes('madd') || lessonTitle.includes('المد') || lessonTitle.includes('المدود')) {
    return 'أحكام المدود ومقاديرها';
  }
  if (chapterId.includes('makharaj') || lessonTitle.includes('مخارج') || lessonTitle.includes('مخرج')) {
    return 'مخارج الحروف العربية';
  }
  if (chapterId.includes('sifat') || lessonTitle.includes('صفات') || lessonTitle.includes('صفة') || lessonTitle.includes('القلقلة') || lessonTitle.includes('الهمس')) {
    return 'صفات الحروف العربية';
  }
  if (chapterId.includes('intro') || lessonTitle.includes('مقدمة') || lessonTitle.includes('أساسيات') || lessonTitle.includes('اللحن') || lessonTitle.includes('مراتب القراءة')) {
    return 'مبادئ التجويد ومراتب القراءة';
  }
  if (chapterId.includes('practice') || lessonTitle.includes('تطبيق') || lessonTitle.includes('ورشة') || lessonTitle.includes('الوقف') || lessonTitle.includes('ختام')) {
    return 'التطبيق العملي والوقف والابتداء';
  }
  return 'أحكام التجويد العامة';
};

export const ALL_TAJWEED_SUBJECTS = [
  'جميع المواد والموضوعات',
  'مبادئ التجويد ومراتب القراءة',
  'أحكام النون الساكنة والتنوين',
  'أحكام الميم الساكنة والنون المشددة',
  'أحكام المدود ومقاديرها',
  'مخارج الحروف العربية',
  'صفات الحروف العربية',
  'التطبيق العملي والوقف والابتداء'
];

export const StudentTajweedProgressCard: React.FC<StudentTajweedProgressCardProps> = ({
  studentName,
  studentTajweedScore = 96,
  studentTajweedNotes = 'إتقان تام لأحكام النون والمدود، مع العناية بترقيق الراء المكسورة وهمس الكاف والتاء.',
  onOpenFullTajweedCurriculum,
  onSelectLesson
}) => {
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [chapters, setChapters] = useState<TajweedChapter[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressData>>({});

  // Classification & Filter States
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all'); // 'all' or level order (1..7)
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all'); // 'all' or subject name
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterSectionExpanded, setIsFilterSectionExpanded] = useState<boolean>(true);

  // Lesson Quick Preview Modal State
  const [previewingLesson, setPreviewingLesson] = useState<{ lesson: TajweedLesson; chapter: TajweedChapter } | null>(null);
  const [pdfPreviewLesson, setPdfPreviewLesson] = useState<{ lesson: TajweedLesson; chapter: TajweedChapter } | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadTajweedData();

    const handleUpdate = () => loadTajweedData();
    window.addEventListener('rehab_learning_updated', handleUpdate);
    return () => window.removeEventListener('rehab_learning_updated', handleUpdate);
  }, []);

  const loadTajweedData = () => {
    try {
      const curLevels = getAllLevelsStatus();
      setLevels(curLevels);

      const curChapters = getActiveCurriculum();
      setChapters(curChapters);

      const curProgress = getLessonProgressMap();
      setProgressMap(curProgress);
    } catch (err) {
      console.error('Error loading tajweed levels:', err);
    }
  };

  // Determine current active level the student reached
  const activeLevel = levels.find(l => l.status === 'open') || 
                      levels.filter(l => l.status === 'completed').pop() || 
                      levels[0];

  const activeChapter = chapters.find(c => c.id === activeLevel?.id) || chapters[0];

  // Calculate overall stats
  const totalLessonsCount = chapters.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
  const completedLessonsCount = Object.values(progressMap).filter(p => p.passed).length;
  const overallPercentage = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  // Flatten all lessons with enriched metadata for filtering
  const allEnrichedLessons = useMemo(() => {
    const list: Array<{
      lesson: TajweedLesson;
      chapter: TajweedChapter;
      levelOrder: number;
      levelTitle: string;
      subject: string;
      status: 'completed' | 'in_progress' | 'locked';
      passed: boolean;
      score?: number;
      unlocked: boolean;
    }> = [];

    chapters.forEach((chap) => {
      const lvlInfo = levels.find(l => l.id === chap.id);
      const levelOrder = lvlInfo?.order || chap.order;
      const isLevelUnlocked = lvlInfo?.isUnlocked ?? (levelOrder === 1);

      chap.lessons.forEach((les, idx) => {
        const prog = progressMap[les.id];
        const isPassed = !!prog?.passed;

        let status: 'completed' | 'in_progress' | 'locked' = 'locked';
        let unlocked = false;

        if (isPassed) {
          status = 'completed';
          unlocked = true;
        } else if (isLevelUnlocked) {
          // Check if first lesson or previous lesson in chapter is passed
          const prevLesson = idx > 0 ? chap.lessons[idx - 1] : null;
          if (!prevLesson || progressMap[prevLesson.id]?.passed) {
            status = 'in_progress';
            unlocked = true;
          } else {
            status = 'locked';
            unlocked = false;
          }
        } else {
          status = 'locked';
          unlocked = false;
        }

        const subject = getTajweedSubjectName(chap.id, les.title);

        list.push({
          lesson: les,
          chapter: chap,
          levelOrder,
          levelTitle: chap.title,
          subject,
          status,
          passed: isPassed,
          score: prog?.percentage,
          unlocked
        });
      });
    });

    return list;
  }, [chapters, levels, progressMap]);

  // Apply Triple Filters (المستوى، المادة، الحالة) + Search Query
  const filteredLessons = useMemo(() => {
    return allEnrichedLessons.filter((item) => {
      // 1. تصفية حسب المستوى
      if (selectedLevelFilter !== 'all') {
        if (item.levelOrder.toString() !== selectedLevelFilter) {
          return false;
        }
      }

      // 2. تصفية حسب المادة
      if (selectedSubjectFilter !== 'all') {
        if (item.subject !== selectedSubjectFilter) {
          return false;
        }
      }

      // 3. تصفية حسب الحالة (تم الإنجاز / قيد التنفيذ / مغلق)
      if (selectedStatusFilter !== 'all') {
        if (item.status !== selectedStatusFilter) {
          return false;
        }
      }

      // 4. البحث النصي
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.lesson.title.toLowerCase().includes(q);
        const inDesc = item.lesson.description?.toLowerCase().includes(q);
        const inSubject = item.subject.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSubject) {
          return false;
        }
      }

      return true;
    });
  }, [allEnrichedLessons, selectedLevelFilter, selectedSubjectFilter, selectedStatusFilter, searchQuery]);

  const hasActiveFilters = selectedLevelFilter !== 'all' || 
                           selectedSubjectFilter !== 'all' || 
                           selectedStatusFilter !== 'all' || 
                           searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedLevelFilter('all');
    setSelectedSubjectFilter('all');
    setSelectedStatusFilter('all');
    setSearchQuery('');
  };

  const handleOpenLesson = (les: TajweedLesson, chap: TajweedChapter) => {
    if (onSelectLesson) {
      onSelectLesson(les.id, chap.id);
    }
    setPreviewingLesson({ lesson: les, chapter: chap });
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.error(err));
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-sm overflow-hidden animate-fade-in text-right space-y-0" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] p-5 sm:p-6 text-white relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#C5A059] text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>المنهج التجويدي المتسلسل</span>
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1 font-mono">
                <span>المستوى الحالي للطالب: {activeLevel?.order || 1} من 7</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
              دروس التجويد ومستويات الإتقان الأكاديمية
            </h3>

            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-2xl font-sans">
              تصنيف شامل لدروس التجويد وأحكام التلاوة، مع إمكانية التصفية حسب المستوى، المادة التعليمية، أو حالة الإنجاز.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {onOpenFullTajweedCurriculum && (
              <button
                type="button"
                onClick={onOpenFullTajweedCurriculum}
                className="px-4 py-2.5 bg-white text-[#046A38] hover:bg-emerald-50 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 border border-[#C5A059]"
              >
                <BookOpen className="w-4 h-4 text-[#046A38]" />
                <span>المنهج التفاعلي الكامل ←</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Summary: Active Level & Overall Progress */}
      <div className="p-5 sm:p-6 border-b border-slate-100 space-y-5 bg-[#FAF8F5]/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Active Level Card */}
          <div className="md:col-span-2 p-4 sm:p-5 bg-white rounded-2xl border border-[#C5A059]/40 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block">
                  المستوى الذي وصلت إليه حالياً:
                </span>
                <h4 className="text-base font-bold text-[#046A38] font-serif flex items-center gap-2 mt-0.5">
                  <span className="w-6 h-6 rounded-lg bg-[#046A38] text-white flex items-center justify-center font-mono text-xs">
                    {activeLevel?.order || 1}
                  </span>
                  <span>{activeLevel?.title || 'الباب الأول: أساسيات علم التجويد'}</span>
                </h4>
              </div>

              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs self-start sm:self-center flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>قيد الدراسة والتنفيذ</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>إنجاز دروس هذا المستوى:</span>
                <span className="font-mono text-[#046A38]">
                  {activeLevel?.passedLessons || 0} من {activeLevel?.totalLessons || 0} دروس منجزة ({activeLevel?.percentage || 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-gradient-to-r from-[#046A38] to-[#C5A059] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activeLevel?.percentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stats & Teacher Notes */}
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#C5A059]/40 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-600">درجة التجويد المعتمدة</span>
                <span className="text-base font-black text-[#046A38] font-mono">{studentTajweedScore}%</span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed italic">
                "{studentTajweedNotes}"
              </p>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
              <span>إجمالي الدروس المتقنة:</span>
              <span className="font-bold font-mono text-[#046A38]">
                {completedLessonsCount} من {totalLessonsCount} درس ({overallPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. شريط الفلترة والتصنيف الثلاثي (المستوى، المادة، الحالة) */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="bg-[#F9F6F0] rounded-2xl p-4 sm:p-5 border border-[#C5A059]/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C5A059]/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#046A38] text-white flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
                  تصفية وتصنيف دروس التجويد
                </h4>
                <p className="text-[11px] text-slate-500">
                  صنّف الدروس حسب المستوى الدراسي، المادة والموضوع، أو حالة الإنجاز (تم الإنجاز / قيد التنفيذ)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3 text-[#C5A059]" />
                  <span>إعادة تعيين الفلاتر</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setIsFilterSectionExpanded(!isFilterSectionExpanded)}
                className="p-1.5 rounded-xl hover:bg-white text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={isFilterSectionExpanded ? 'طي الفلاتر' : 'توسيع الفلاتر'}
              >
                {isFilterSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isFilterSectionExpanded && (
            <div className="space-y-4 animate-fade-in">
              {/* الفلاتر الثلاثة الرئيسية */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. فلتر المستوى (Level) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    1. تصفية حسب المستوى:
                  </label>
                  <select
                    value={selectedLevelFilter}
                    onChange={(e) => setSelectedLevelFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#046A38] shadow-2xs cursor-pointer"
                  >
                    <option value="all">جميع المستويات (1 - 7)</option>
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.order.toString()}>
                        المستوى {lvl.order}: {lvl.title.replace(/^الباب\s+[^\:]+:\s*/, '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. فلتر المادة (Subject / Topic) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    2. تصفية حسب المادة / الموضوع:
                  </label>
                  <select
                    value={selectedSubjectFilter}
                    onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#046A38] shadow-2xs cursor-pointer"
                  >
                    <option value="all">جميع المواد والموضوعات</option>
                    {ALL_TAJWEED_SUBJECTS.slice(1).map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. فلتر الحالة (Status: تم الإنجاز / قيد التنفيذ) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    3. تصفية حسب الحالة:
                  </label>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#046A38] shadow-2xs cursor-pointer"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">تم الإنجاز ومجاز ✅</option>
                    <option value="in_progress">قيد التنفيذ ومتاح للدراسة 🟢</option>
                    <option value="locked">مغلق (المستويات اللاحقة) 🔒</option>
                  </select>
                </div>
              </div>

              {/* أزرار سريعة للحالة (Status Pills) + حقل البحث السريع */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#C5A059]/20">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 ml-1">اختيار سريع للحالة:</span>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStatusFilter === 'all'
                        ? 'bg-[#046A38] text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    الكل ({allEnrichedLessons.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>تم الإنجاز ({allEnrichedLessons.filter(l => l.status === 'completed').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('in_progress')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === 'in_progress'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>قيد التنفيذ ({allEnrichedLessons.filter(l => l.status === 'in_progress').length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter('locked')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedStatusFilter === 'locked'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>مغلق ({allEnrichedLessons.filter(l => l.status === 'locked').length})</span>
                  </button>
                </div>

                {/* حقل البحث السريع بالاسم */}
                <div className="relative min-w-[200px] sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الدرس أو الحكم..."
                    className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38] shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. إحصائية النتائج المطابقة */}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              عدد الدروس المطابقة: <strong className="text-[#046A38] font-mono text-sm">{filteredLessons.length}</strong> من أصل {allEnrichedLessons.length} درس
            </span>

            {/* Badges of active filters */}
            {selectedLevelFilter !== 'all' && (
              <span className="px-2 py-0.5 bg-[#C5A059]/20 text-[#046A38] rounded-md font-bold text-[10px]">
                المستوى: {selectedLevelFilter}
              </span>
            )}
            {selectedSubjectFilter !== 'all' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-bold text-[10px]">
                المادة: {selectedSubjectFilter}
              </span>
            )}
            {selectedStatusFilter !== 'all' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md font-bold text-[10px]">
                الحالة: {selectedStatusFilter === 'completed' ? 'تم الإنجاز' : selectedStatusFilter === 'in_progress' ? 'قيد التنفيذ' : 'مغلق'}
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            انقر على أي درس لمطالعته وحل الاختبار
          </span>
        </div>

        {/* 5. شبكة بطاقات الدروس المفلترة */}
        {filteredLessons.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
            <h5 className="font-bold text-sm text-slate-800 font-serif">لا توجد دروس تطابق هذه المعايير</h5>
            <p className="text-xs text-slate-500">جرب تغيير المستوى أو المادة أو إعادة ضبط الفلاتر لاستعراض جميع الدروس.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-1.5 bg-[#046A38] text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredLessons.map((item) => {
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';

              return (
                <div
                  key={item.lesson.id}
                  className={`p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between space-y-3 ${
                    isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                      : isInProgress
                      ? 'bg-white border-2 border-[#046A38] shadow-xs hover:shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header: Level & Subject & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#F9F6F0] text-[#046A38] font-bold text-[10px] border border-[#C5A059]/30">
                          المستوى {item.levelOrder}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                          {item.subject}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم الإنجاز {item.score ? `(${item.score}%)` : '✓'}</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] shrink-0">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>قيد التنفيذ (متاح)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 font-medium text-[10px] shrink-0">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>مغلق</span>
                        </span>
                      )}
                    </div>

                    {/* Lesson Title */}
                    <div>
                      <h5 className="font-bold text-sm text-slate-900 font-serif leading-snug">
                        {item.lesson.title}
                      </h5>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                        {item.lesson.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.lesson.durationMinutes || 12} دقيقة</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenLesson(item.lesson, item.chapter)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                          isInProgress
                            ? 'bg-[#046A38] hover:bg-[#03542c] text-white shadow-xs border border-[#C5A059]'
                            : isCompleted
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isInProgress ? 'متابعة الدرس' : isCompleted ? 'مراجعة الدرس' : 'معاينة الدرس'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 6. نافذة معاينة الدرس والمذاكرة السريعة (Lesson Quick Study Modal) */}
      {previewingLesson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in max-h-[90vh] overflow-y-auto text-right" dir="rtl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold bg-[#C5A059] text-white px-2.5 py-0.5 rounded-md">
                    المستوى {previewingLesson.chapter.order}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {getTajweedSubjectName(previewingLesson.chapter.id, previewingLesson.lesson.title)}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-[#046A38] font-serif">
                  {previewingLesson.lesson.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setIsPlayingAudio(false);
                  setPreviewingLesson(null);
                }}
                className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio player if audio exists */}
            {previewingLesson.lesson.audioUrl && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#046A38] text-white flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block">المثال الصوتي المعتمد للدرس</span>
                    <span className="text-[11px] text-emerald-800">{previewingLesson.lesson.audioTitle || 'تلاوة تعليمية بصوت الشيخ'}</span>
                  </div>
                </div>

                <audio 
                  ref={audioRef} 
                  src={previewingLesson.lesson.audioUrl} 
                  onEnded={() => setIsPlayingAudio(false)} 
                />

                <button
                  type="button"
                  onClick={toggleAudio}
                  className="px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'إيقاف' : 'استماع للمثال'}</span>
                </button>
              </div>
            )}

            {/* Text Content */}
            {previewingLesson.lesson.textContent && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-800 font-serif">شرح الدرس والقاعدة التجويدية:</h5>
                <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {previewingLesson.lesson.textContent}
                </div>
              </div>
            )}

            {/* Key Points */}
            {previewingLesson.lesson.keyPoints && previewingLesson.lesson.keyPoints.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-800 font-serif">النقاط الجوهرية للضبط والإتقان:</h5>
                <ul className="space-y-1.5 pr-2">
                  {previewingLesson.lesson.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] mt-1.5 shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Poetic verse */}
            {previewingLesson.lesson.poeticVerse && (
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-center font-serif text-xs text-amber-950 italic">
                <span className="text-[10px] text-amber-700 block font-sans font-bold mb-1">من المتون التجويدية المعتمدة:</span>
                <p className="whitespace-pre-line leading-relaxed font-bold">{previewingLesson.lesson.poeticVerse}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlayingAudio(false);
                    setPreviewingLesson(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق المعاينة
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPdfPreviewLesson(previewingLesson);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  title="معاينة وطباعة ملخص الدرس الرسمي A4"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>ملخص الدرس PDF</span>
                </button>
              </div>

              {onOpenFullTajweedCurriculum && (
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setIsPlayingAudio(false);
                    setPreviewingLesson(null);
                    if (onSelectLesson) {
                      onSelectLesson(previewingLesson.lesson.id, previewingLesson.chapter.id);
                    }
                    onOpenFullTajweedCurriculum();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#C5A059]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>فتح الدرس في المنهج التفاعلي الكامل (فيديو واختبارات) ←</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* نافذة معاينة وطباعة ملخص الدرس A4 */}
      {pdfPreviewLesson && (
        <TajweedPdfPreviewModal
          isOpen={!!pdfPreviewLesson}
          onClose={() => setPdfPreviewLesson(null)}
          lesson={pdfPreviewLesson.lesson}
          chapter={pdfPreviewLesson.chapter}
        />
      )}

    </div>
  );
};
