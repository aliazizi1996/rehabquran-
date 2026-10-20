import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, CheckCircle2, XCircle, Award, RotateCcw, 
  BarChart3, Users, TrendingUp, AlertTriangle, ShieldCheck, 
  Check, ChevronRight, BookOpen, Sparkles
} from 'lucide-react';
import { TajweedLesson, TajweedLessonQuiz } from '../types';
import { 
  saveQuizAttempt, 
  getTeacherComprehensionStats, 
  getQuizAttemptsForLesson,
  LessonComprehensionAnalytics,
  QuizAttempt
} from '../data/quizStore';
import { getCurrentAuthUser } from '../data/authStore';
import { 
  recordLessonQuizAttempt, 
  getCurriculumSettings, 
  getLessonProgress, 
  LessonProgressData 
} from '../data/learningStore';

interface InteractiveLessonQuizProps {
  lesson: TajweedLesson;
  chapterTitle: string;
  onLessonComplete?: () => void;
  onNavigateToNextLesson?: () => void;
}

export const InteractiveLessonQuiz: React.FC<InteractiveLessonQuizProps> = ({
  lesson,
  chapterTitle,
  onLessonComplete,
  onNavigateToNextLesson
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isGraded, setIsGraded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'student_quiz' | 'teacher_analytics'>('student_quiz');
  const [analytics, setAnalytics] = useState<LessonComprehensionAnalytics>(() => 
    getTeacherComprehensionStats(lesson.id, lesson.quiz.length)
  );
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [currentProgress, setCurrentProgress] = useState<LessonProgressData | null>(() => getLessonProgress(lesson.id));
  const [currentUser, setCurrentUser] = useState(() => getCurrentAuthUser());
  const curriculumSettings = getCurriculumSettings();
  const minPassingPercent = lesson.minPassingScore || curriculumSettings.minPassingScorePercent;

  useEffect(() => {
    // Reset answers when lesson changes
    setSelectedAnswers({});
    setIsGraded(false);
    setLatestAttempt(null);
    setCurrentProgress(getLessonProgress(lesson.id));
    setAnalytics(getTeacherComprehensionStats(lesson.id, lesson.quiz.length));
    setCurrentUser(getCurrentAuthUser());
  }, [lesson.id]);

  const refreshAnalytics = () => {
    setAnalytics(getTeacherComprehensionStats(lesson.id, lesson.quiz.length));
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isGraded) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleGradeQuiz = async () => {
    if (Object.keys(selectedAnswers).length < lesson.quiz.length) {
      alert('يرجى الإجابة عن جميع أسئلة الاختبار أولاً.');
      return;
    }

    let correctCount = 0;
    lesson.quiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / lesson.quiz.length) * 100);
    const passed = percentage >= minPassingPercent;

    // 1. Record in official Curriculum Learning Store & auto-save to student profile & Firestore
    const savedProgress = await recordLessonQuizAttempt(
      lesson.id,
      correctCount,
      lesson.quiz.length,
      currentUser?.id,
      currentUser?.name
    );
    setCurrentProgress(savedProgress);

    // 2. Also register in quizStore for teacher analytics
    const attempt = saveQuizAttempt({
      lessonId: lesson.id,
      chapterId: lesson.chapterId,
      lessonTitle: lesson.title,
      studentName: currentUser.name || 'طالب مقرأة رحاب القرآن',
      studentRole: (currentUser.role as 'student' | 'teacher' | 'guest') || 'student',
      score: correctCount,
      totalQuestions: lesson.quiz.length,
      percentage,
      answers: selectedAnswers,
      evaluationNote: percentage === 100 
        ? 'إتقان تام وإجابة نموذجية 🌟' 
        : passed 
        ? 'استيعاب طيب واجتياز للحد الأدنى المقرر من الإدارة ✨' 
        : `أقل من نسبة النجاح المقررة (${minPassingPercent}%) - يلزم إعادة المحاولة`
    });

    setLatestAttempt(attempt);
    setIsGraded(true);
    refreshAnalytics();

    if (passed && onLessonComplete) {
      onLessonComplete();
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setIsGraded(false);
    setLatestAttempt(null);
  };

  const isAllAnswered = Object.keys(selectedAnswers).length === lesson.quiz.length;

  return (
    <div className="space-y-5 rounded-3xl bg-[#081b12] border-2 border-emerald-700/80 p-5 sm:p-6 shadow-xl" dir="rtl">
      
      {/* Quiz Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              اختبار قياس الاستيعاب الفوري (MCQ)
            </span>
            <span className="text-xs text-emerald-300">
              {lesson.quiz.length} أسئلة منهجية
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            اختبار درس: {lesson.title}
          </h3>
        </div>

        {/* View Tabs: Student Quiz vs Teacher Analytics */}
        <div className="flex items-center p-1 rounded-2xl bg-[#05140d] border border-emerald-800 shrink-0">
          <button
            onClick={() => setActiveTab('student_quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'student_quiz'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>أسئلة الاختبار للطلاب</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('teacher_analytics');
              refreshAnalytics();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'teacher_analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
            <span>إحصائيات المعلم والاستيعاب</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* VIEW 1: STUDENT INTERACTIVE QUIZ */}
      {activeTab === 'student_quiz' && (
        <div className="space-y-5">
          
          {/* Result Alert when graded */}
          {isGraded && latestAttempt && (
            <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-xl ${
              latestAttempt.percentage >= minPassingPercent 
                ? 'bg-gradient-to-r from-emerald-950 via-[#0a2618] to-emerald-950 border-emerald-400 text-emerald-100'
                : 'bg-gradient-to-r from-amber-950 via-[#261f0a] to-amber-950 border-amber-500 text-amber-100'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shrink-0 ${
                    latestAttempt.percentage >= minPassingPercent 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-amber-400 text-slate-950'
                  }`}>
                    <span className="text-xl leading-none">{latestAttempt.percentage}%</span>
                    <span className="text-[10px] font-bold opacity-80 mt-0.5">
                      {latestAttempt.percentage >= minPassingPercent ? 'ناجح' : 'لم يجتز'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base sm:text-lg text-white">
                        {latestAttempt.percentage === 100 
                          ? 'ما شاء الله! إتقان تام واستيعاب كامل للدرس 🌟' 
                          : latestAttempt.percentage >= minPassingPercent 
                          ? 'مبارك! اجتزت الاختبار بنجاح وتم فتح الدرس التالي ✨' 
                          : `لم تبلغ نسبة الاجتياز المقررة (${minPassingPercent}%) 💡`}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 text-[11px] font-bold border border-amber-400/40">
                        المحاولة رقم: {currentProgress?.attemptsCount || 1}
                      </span>
                    </div>
                    <p className="text-xs opacity-90 leading-relaxed">
                      أجبت إجابة صحيحة على {latestAttempt.score} من أصل {latestAttempt.totalQuestions} أسئلة. 
                      {latestAttempt.percentage >= minPassingPercent 
                        ? ` تم حفظ النتيجة (${latestAttempt.percentage}%) وحالة الدرس (مكتمل) تلقائياً داخل ملفك الأكاديمي.` 
                        : ` الحد الأدنى المطلوب للانتقال للدرس التالي هو ${minPassingPercent}%. يمكنك مراجعة الشرح وإعادة المحاولة الآن.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={handleResetQuiz}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>

                  {onNavigateToNextLesson && latestAttempt.percentage >= minPassingPercent && (
                    <button
                      onClick={onNavigateToNextLesson}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <span>الانتقال للدرس التالي</span>
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {lesson.quiz.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;
              const isCorrectQuestion = isGraded && selectedOpt === q.correctIndex;

              return (
                <div 
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isGraded
                      ? isCorrectQuestion
                        ? 'bg-[#092215] border-emerald-500/80 shadow-md'
                        : 'bg-[#220d0d] border-red-500/80 shadow-md'
                      : 'bg-[#06160e] border-emerald-900/80'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-xs sm:text-sm font-bold text-white flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs font-black flex items-center justify-center shrink-0 shadow-inner">
                        {qIndex + 1}
                      </span>
                      <span className="leading-relaxed mt-0.5">{q.question}</span>
                    </p>

                    {isGraded && (
                      <span className="shrink-0">
                        {isCorrectQuestion ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>صحيحة</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500 text-[11px] font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>خاطئة</span>
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {q.options.map((optText, optIdx) => {
                      const isThisSelected = selectedOpt === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let btnStyle = 'bg-[#0b2417] text-slate-200 border-emerald-900 hover:border-emerald-600 hover:bg-[#0f2e1e]';

                      if (isGraded) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-700 text-white font-black border-emerald-400 shadow-md ring-2 ring-emerald-400/40';
                        } else if (isThisSelected && !isCorrect) {
                          btnStyle = 'bg-red-800 text-white font-bold border-red-400 ring-2 ring-red-400/30 line-through';
                        } else {
                          btnStyle = 'bg-[#06140d] text-slate-500 border-emerald-950 opacity-60';
                        }
                      } else if (isThisSelected) {
                        btnStyle = 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md ring-2 ring-amber-300/50 scale-[1.01]';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          disabled={isGraded}
                          className={`p-3 rounded-xl text-right border transition-all cursor-pointer flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span className="leading-normal">{optText}</span>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border ${
                            isThisSelected 
                              ? isGraded 
                                ? isCorrect ? 'bg-emerald-500 text-slate-950 border-white' : 'bg-red-500 text-white border-white'
                                : 'bg-slate-950 text-amber-300 border-slate-950'
                              : 'bg-emerald-950/70 text-slate-400 border-emerald-800'
                          }`}>
                            {isGraded && isCorrect ? '✓' : ['أ', 'ب', 'ج', 'د'][optIdx] || optIdx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Scientific pedagogical explanation when graded */}
                  {isGraded && (
                    <div className="mt-3 p-3 rounded-xl bg-[#081a10] border border-emerald-800 text-xs text-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>التعليل العلمي والتوجيه التجويدي:</span>
                      </div>
                      <p className="leading-relaxed pr-5">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Action Submit Button */}
          {!isGraded ? (
            <div className="pt-2">
              <button
                onClick={handleGradeQuiz}
                disabled={!isAllAnswered}
                className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isAllAnswered
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-950/50 scale-[1.01]'
                    : 'bg-[#0f2c1c] text-slate-400 border border-emerald-900 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAllAnswered
                    ? 'تصحيح إجابات الاختبار فورياً وإظهار النتيجة 🎯'
                    : `يرجى الإجابة على بقية الأسئلة (${Object.keys(selectedAnswers).length} من ${lesson.quiz.length})`}
                </span>
              </button>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-300 flex-wrap gap-2">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إدراج نتيجتك ضمن مؤشرات استيعاب طلاب المقرأة.</span>
              </span>
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1 text-slate-300 hover:text-white underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الاختبار للتثبيت</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: TEACHER COMPREHENSION ANALYTICS DASHBOARD */}
      {activeTab === 'teacher_analytics' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Top Analytics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            
            <div className="p-3.5 rounded-2xl bg-[#0a2417] border border-emerald-800 space-y-1">
              <span className="text-[11px] text-emerald-300 font-medium block">معدل استيعاب الطلاب</span>
              <div className="text-xl sm:text-2xl font-black text-amber-300">
                {analytics.averageScorePercentage}%
              </div>
              <span className="text-[10px] text-slate-400">متوسط الدرجات</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a2417] border border-emerald-800 space-y-1">
              <span className="text-[11px] text-emerald-300 font-medium block">نسبة الاجتياز المتقن</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {analytics.passRatePercentage}%
              </div>
              <span className="text-[10px] text-slate-400">فوق 60%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a2417] border border-emerald-800 space-y-1">
              <span className="text-[11px] text-emerald-300 font-medium block">إجمالي محاولات الاختبار</span>
              <div className="text-xl sm:text-2xl font-black text-white">
                {analytics.totalAttempts}
              </div>
              <span className="text-[10px] text-slate-400">طالب/طالبة</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a2417] border border-emerald-800 space-y-1">
              <span className="text-[11px] text-emerald-300 font-medium block">طلاب بحاجة لدعم</span>
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                {analytics.needsFollowupCount}
              </div>
              <span className="text-[10px] text-slate-400">أقل من 50%</span>
            </div>

          </div>

          {/* Distribution Bars */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#06150e] border border-emerald-900 space-y-3">
            <h4 className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>توزيع مستويات الاستيعاب لدى الطلاب في هذا الدرس:</span>
              </span>
              <span className="text-[11px] text-emerald-300 font-normal">
                {analytics.totalAttempts} طالب شاركوا
              </span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Excellent */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-200 font-medium">
                  <span className="text-emerald-300">درجة ممتازة (90% - 100%)</span>
                  <span>{analytics.excellentCount} طلاب ({analytics.totalAttempts > 0 ? Math.round((analytics.excellentCount / analytics.totalAttempts) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${analytics.totalAttempts > 0 ? (analytics.excellentCount / analytics.totalAttempts) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Very Good */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-200 font-medium">
                  <span className="text-teal-300">درجة جيدة جداً (75% - 89%)</span>
                  <span>{analytics.veryGoodCount} طلاب ({analytics.totalAttempts > 0 ? Math.round((analytics.veryGoodCount / analytics.totalAttempts) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                    style={{ width: `${analytics.totalAttempts > 0 ? (analytics.veryGoodCount / analytics.totalAttempts) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Needs Review */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-200 font-medium">
                  <span className="text-amber-300">بحاجة لمراجعة الشرح (&lt; 50%)</span>
                  <span>{analytics.needsFollowupCount} طلاب ({analytics.totalAttempts > 0 ? Math.round((analytics.needsFollowupCount / analytics.totalAttempts) * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${analytics.totalAttempts > 0 ? (analytics.needsFollowupCount / analytics.totalAttempts) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Student Submissions Table */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#06150e] border border-emerald-900 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
              <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>سجل نتائج الطلاب وملاحظات المعلم:</span>
              </h4>
              <button
                onClick={refreshAnalytics}
                className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>تحديث البيانات</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-emerald-800/80 text-emerald-300">
                    <th className="py-2.5 px-3 font-bold">اسم الطالب</th>
                    <th className="py-2.5 px-2 font-bold">الدرجة</th>
                    <th className="py-2.5 px-2 font-bold">النسبة</th>
                    <th className="py-2.5 px-3 font-bold">التاريخ والتوقيت</th>
                    <th className="py-2.5 px-3 font-bold">توجيه وملاحظة المعلم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/60">
                  {analytics.recentAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-[#0a2316] transition-colors">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{att.studentName}</span>
                      </td>
                      <td className="py-3 px-2 font-mono text-amber-300">
                        {att.score}/{att.totalQuestions}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          att.percentage >= 90
                            ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600'
                            : att.percentage >= 60
                            ? 'bg-teal-900/80 text-teal-300 border border-teal-600'
                            : 'bg-red-950/80 text-red-300 border border-red-600'
                        }`}>
                          {att.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-400">
                        {att.dateStr} • {att.timeStr}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-300">
                        {att.evaluationNote || 'استيعاب طيب'}
                      </td>
                    </tr>
                  ))}
                  {analytics.recentAttempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        لا توجد محاولات سابقة مسجلة لهذا الدرس بعد. يمكن للطلاب أداء الاختبار في التبويب السابق.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
