import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, CheckCircle2, XCircle, BookOpen, RotateCcw, 
  Sparkles, Check, ChevronLeft, ArrowRight, HelpCircle, 
  Trophy, ShieldCheck, Flame, Search, CheckSquare
} from 'lucide-react';
import { 
  SURAHS_LIST, 
  SurahMeta 
} from '../../data/quranData';
import { 
  SurahQuizQuestion, 
  StudentQuizResult, 
  getQuestionsForSurah, 
  recordStudentQuizResult, 
  getStudentQuizResults, 
  getStudentQuizPortfolioSummary 
} from '../../data/surahQuizData';
import { AuthAccount } from '../../types';

interface StudentSurahQuizViewProps {
  currentAccount: AuthAccount;
  reviewedSurahs?: string[]; // السور المنجزة في خطة المراجعة
  onViewReports?: () => void;
  onOpenQuranAudio?: () => void;
}

export const StudentSurahQuizView: React.FC<StudentSurahQuizViewProps> = ({
  currentAccount,
  reviewedSurahs = ['الفاتحة', 'الكهف', 'يس', 'الملك', 'النبأ', 'الأعلى', 'الضحى', 'الشرح', 'القدر', 'الإخلاص', 'الفلق', 'الناس'],
  onViewReports,
}) => {
  // حالة العرض: 'list' (اختيار السورة) | 'quiz' (جلسة الاختبار النشط) | 'result' (النتيجة والإنجاز)
  const [viewState, setViewState] = useState<'list' | 'quiz' | 'result'>('list');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'reviewed'>('reviewed');

  // حالة جلسة الاختبار
  const [questions, setQuestions] = useState<SurahQuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [lastResult, setLastResult] = useState<StudentQuizResult | null>(null);

  // سجل إنجازات الطالب في الاختبارات
  const [quizHistory, setQuizHistory] = useState<StudentQuizResult[]>(() => 
    getStudentQuizResults(currentAccount.id)
  );

  const portfolioSummary = useMemo(() => 
    getStudentQuizPortfolioSummary(currentAccount.id),
    [currentAccount.id, quizHistory]
  );

  // الاستماع لتحديثات الاختبارات
  useEffect(() => {
    const handleUpdate = () => {
      setQuizHistory(getStudentQuizResults(currentAccount.id));
    };
    window.addEventListener('rehab_student_quizzes_updated', handleUpdate);
    return () => window.removeEventListener('rehab_student_quizzes_updated', handleUpdate);
  }, [currentAccount.id]);

  // قائمة السور المعروضة حسب التصفية والبحث
  const filteredSurahs = useMemo(() => {
    let list = SURAHS_LIST;
    if (filterType === 'reviewed') {
      list = list.filter((s) => reviewedSurahs.includes(s.name));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.name.includes(q) || s.englishName.toLowerCase().includes(q));
    }
    return list;
  }, [filterType, searchQuery, reviewedSurahs]);

  // بدء اختبار سورة محددة
  const handleStartQuiz = (surah: SurahMeta) => {
    const qList = getQuestionsForSurah(surah.number, surah.name);
    setSelectedSurah(surah);
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setStartTime(Date.now());
    setViewState('quiz');
  };

  // اختيار إجابة للسؤال الحالي
  const handleSelectAnswer = (optionIndex: number) => {
    if (showExplanation) return; // تم تأكيد الإجابة
    const currentQ = questions[currentQuestionIndex];
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
    setShowExplanation(true);
  };

  // الانتقال للسؤال التالي أو إنهاء الاختبار
  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      // إنهاء الاختبار واحتساب النتيجة وحفظها في ملف الإنجاز
      setIsSubmittingResult(true);
      let correctCount = 0;
      questions.forEach((q) => {
        if (selectedAnswers[q.id] === q.correctIndex) {
          correctCount++;
        }
      });

      const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      try {
        const result = await recordStudentQuizResult({
          studentId: currentAccount.id,
          studentName: currentAccount.name,
          surahNumber: selectedSurah?.number || 1,
          surahName: selectedSurah?.name || 'الفاتحة',
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          answers: selectedAnswers,
          timeSpentSeconds: timeSpent,
        });

        setLastResult(result);
        setQuizHistory(getStudentQuizResults(currentAccount.id));
        setViewState('result');
      } catch (err) {
        console.error('Error saving quiz result:', err);
      } finally {
        setIsSubmittingResult(false);
      }
    }
  };

  // خريطة درجات آخر اختبار لكل سورة
  const surahScoreMap = useMemo(() => {
    const map: Record<string, StudentQuizResult> = {};
    quizHistory.forEach((r) => {
      if (!map[r.surahName] || r.score > map[r.surahName].score) {
        map[r.surahName] = r;
      }
    });
    return map;
  }, [quizHistory]);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ======================================================== */}
      {/* 1. رأس الصفحة والملخص الإنجازي الأكاديمي                */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#046A38]/10 text-[#046A38] rounded-full text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>منظومة اختبارات التثبيت والحفظ الرقمية 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif text-[#046A38]">
              اختبارات قصيرة لتثبيت الحفظ والمراجعة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              اختبر حفظك للسور والآيات التي أتممت مراجعتها مع التوثيق المباشر للنتائج والأوسمة في ملف إنجازك الأكاديمي.
            </p>
          </div>

          {viewState !== 'list' && (
            <button
              onClick={() => setViewState('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start cursor-pointer"
            >
              <span>العودة لقائمة السور</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* بطاقات الإحصاء السريع لملف الإنجاز */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
            <span className="text-[11px] text-slate-500 block">إجمالي الاختبارات المجتازة</span>
            <div className="text-xl sm:text-2xl font-black text-[#046A38] font-mono mt-0.5">
              {portfolioSummary.totalQuizzes}
            </div>
          </div>
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
            <span className="text-[11px] text-slate-500 block">متوسط نسبة التثبيت</span>
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-0.5">
              {portfolioSummary.averageScore}%
            </div>
          </div>
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
            <span className="text-[11px] text-slate-500 block">السور المختبرة</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono mt-0.5">
              {portfolioSummary.completedSurahsCount} سورة
            </div>
          </div>
          <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
            <span className="text-[11px] text-slate-500 block">أوسمة الإتقان المحققة</span>
            <div className="text-xl sm:text-2xl font-black text-[#C5A059] font-mono mt-0.5">
              {portfolioSummary.badges.length}
            </div>
          </div>
        </div>

        {/* أوسمة الطالب النشطة */}
        {portfolioSummary.badges.length > 0 && (
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>أوسمتك في ملف الإنجاز:</span>
            </span>
            {portfolioSummary.badges.map((b, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 bg-amber-50 text-amber-900 border border-[#C5A059]/40 rounded-full text-xs font-bold shadow-xs"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. وضع اختيار السورة (VIEW STATE: LIST)                  */}
      {/* ======================================================== */}
      {viewState === 'list' && (
        <div className="space-y-6">
          {/* شريط البحث والتصفية */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterType('reviewed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'reviewed'
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                سور خطة المراجعة ({reviewedSurahs.length})
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                جميع سور المصحف (114)
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ابحث باسم السورة (مثال: الكهف)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* شبكة بطاقات السور للاختبار */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSurahs.map((surah) => {
              const previousAttempt = surahScoreMap[surah.name];
              const isReviewedInPlan = reviewedSurahs.includes(surah.name);

              return (
                <div
                  key={surah.number}
                  className={`bg-white p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                    previousAttempt
                      ? 'border-[#C5A059]/60 bg-gradient-to-br from-white via-white to-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#046A38] text-white flex items-center justify-center font-serif font-bold text-xs">
                          {surah.number}
                        </span>
                        <div>
                          <h4 className="font-bold text-base text-slate-900 font-serif">سورة {surah.name}</h4>
                          <span className="text-[11px] text-slate-400 font-sans">{surah.englishName}</span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {surah.type} • {surah.totalAyahs} آية
                      </span>
                    </div>

                    {isReviewedInPlan && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-[#046A38] font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3 text-[#046A38]" />
                        <span>مقررة في خطة المراجعة</span>
                      </div>
                    )}

                    {previousAttempt ? (
                      <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">أعلى نتيجة:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-mono text-[#046A38] text-sm">{previousAttempt.score}%</span>
                          <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                            {previousAttempt.grade}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">لم يتم خوض اختبار التثبيت لهذه السورة بعد.</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartQuiz(surah)}
                    className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059]"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{previousAttempt ? 'إعادة الاختبار وتثبيت النتيجة' : 'بدء اختبار الحفظ والتثبيت'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* جدول سجل الاختبارات الأخيرة والتوثيق الأكاديمي */}
          {quizHistory.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#046A38]" />
                  <h3 className="font-bold font-serif text-slate-900 text-sm">
                    سجل اختباراتك الموثقة في ملف الإنجاز
                  </h3>
                </div>
                {onViewReports && (
                  <button
                    onClick={onViewReports}
                    className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>استعراض التقارير الشاملة</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F9F6F0] text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">السورة القرآنية</th>
                      <th className="py-2.5 px-3">التاريخ والوقت</th>
                      <th className="py-2.5 px-3 text-center">الدرجة</th>
                      <th className="py-2.5 px-3 text-center">التقدير</th>
                      <th className="py-2.5 px-3">الوسام المحقق</th>
                      <th className="py-2.5 px-3 text-center">التوثيق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {quizHistory.slice(0, 8).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-bold font-serif text-slate-900">
                          سورة {record.surahName}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {record.dateStr} • {record.timeStr}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-bold text-sm text-[#046A38]">
                            {record.score}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            record.score >= 85 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : record.score >= 70 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {record.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {record.badgeAwarded || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            موثق بملف الطالب ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. شاشة الاختبار التفاعلي النشط (VIEW STATE: QUIZ)      */}
      {/* ======================================================== */}
      {viewState === 'quiz' && selectedSurah && questions.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* بطاقة تقدم الاختبار */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">اختبار تثبيت الحفظ والمراجعة</span>
                <h3 className="text-lg font-bold font-serif text-[#046A38]">
                  سورة {selectedSurah.name} ({selectedSurah.type})
                </h3>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs text-slate-400 block">السؤال:</span>
                <span className="text-base font-bold text-slate-800">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-l from-[#046A38] to-[#C5A059] h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* بطاقة السؤال الحالي */}
          {(() => {
            const currentQ = questions[currentQuestionIndex];
            const isAnswered = selectedAnswers[currentQ.id] !== undefined;
            const studentSelectedOption = selectedAnswers[currentQ.id];

            return (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-[#C5A059]/30 rounded-full text-xs font-bold">
                    {currentQ.typeLabel}
                  </span>
                  {currentQ.ayahNumber && (
                    <span className="text-xs text-slate-400 font-mono">
                      موضع الآية: ({currentQ.ayahNumber})
                    </span>
                  )}
                </div>

                <div className="text-base sm:text-lg font-bold font-serif text-slate-900 leading-relaxed text-center py-2">
                  {currentQ.question}
                </div>

                {/* خيارات الإجابة */}
                <div className="space-y-3">
                  {currentQ.options.map((opt, optIdx) => {
                    let btnClass = 'bg-slate-50 border-slate-200 text-slate-800 hover:border-[#046A38] hover:bg-emerald-50/30';

                    if (showExplanation) {
                      if (optIdx === currentQ.correctIndex) {
                        btnClass = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                      } else if (optIdx === studentSelectedOption) {
                        btnClass = 'bg-rose-100 border-rose-300 text-rose-900 font-bold';
                      } else {
                        btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={showExplanation}
                        onClick={() => handleSelectAnswer(optIdx)}
                        className={`w-full p-4 rounded-2xl border text-right font-serif text-sm transition-all flex items-center justify-between cursor-pointer ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {showExplanation && optIdx === currentQ.correctIndex && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mr-2" />
                        )}
                        {showExplanation && optIdx === studentSelectedOption && optIdx !== currentQ.correctIndex && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mr-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* التفسير والتوجيه القرآني عند الإجابة */}
                {showExplanation && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 animate-fadeIn ${
                    studentSelectedOption === currentQ.correctIndex
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      {studentSelectedOption === currentQ.correctIndex ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>إجابة صحيحة ومتقنة، بارك الله فيك!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>تنبيه للمراجعة والتثبيت:</span>
                        </>
                      )}
                    </div>
                    <p>{currentQ.explanation}</p>
                  </div>
                )}

                {/* زر المتابعة للسؤال التالي */}
                {showExplanation && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuestion}
                      disabled={isSubmittingResult}
                      className="px-6 py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer border border-[#C5A059]"
                    >
                      <span>
                        {currentQuestionIndex < questions.length - 1 ? 'السؤال التالي' : 'إنهاء وتوثيق النتيجة'}
                      </span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. شاشة النتيجة وربط الإنجاز (VIEW STATE: RESULT)         */}
      {/* ======================================================== */}
      {viewState === 'result' && lastResult && (
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059] shadow-xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#046A38] flex items-center justify-center mx-auto border-2 border-[#C5A059] shadow-sm">
            <Trophy className="w-8 h-8 text-[#C5A059]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#C5A059] block">نتيجة اختبار التثبيت والمراجعة</span>
            <h3 className="text-2xl font-black font-serif text-[#046A38]">
              سورة {lastResult.surahName}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              الطالب: {lastResult.studentName} • التاريخ: {lastResult.dateStr}
            </p>
          </div>

          {/* الدرجة والنسبة */}
          <div className="p-6 bg-[#F9F6F0] rounded-3xl border border-[#C5A059]/40 space-y-3">
            <div className="text-4xl font-black font-mono text-[#046A38]">
              {lastResult.score}%
            </div>
            <div className="text-sm font-bold text-slate-800">
              التقدير: <span className="text-[#046A38] font-serif">{lastResult.grade}</span>
            </div>
            <p className="text-xs text-slate-600">
              أجبت إجابة صحيحة عن <strong>{lastResult.correctAnswers}</strong> من أصل <strong>{lastResult.totalQuestions}</strong> أسئلة.
            </p>

            {lastResult.badgeAwarded && (
              <div className="pt-2">
                <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-900 border border-[#C5A059] rounded-full text-xs font-black shadow-xs">
                  {lastResult.badgeAwarded}
                </span>
              </div>
            )}
          </div>

          {/* شارة التوثيق بملف الإنجاز */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-slate-700 leading-relaxed space-y-1 text-right">
            <div className="flex items-center gap-1.5 font-bold text-[#046A38]">
              <CheckSquare className="w-4 h-4 text-[#046A38]" />
              <span>تم توثيق النتيجة وربطها رسمياً بملف إنجازك الأكاديمي</span>
            </div>
            <p className="text-[11px] text-slate-600">
              تم تحديث سجل التقييمات وسجل التسميع ومعدل الحفظ لحسابك، وأصبحت النتيجة مرئية لمعلم الحلقة والمشرف العام.
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (selectedSurah) handleStartQuiz(selectedSurah);
              }}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة الاختبار لتثبيت الحفظ</span>
            </button>
            <button
              onClick={() => setViewState('list')}
              className="flex-1 py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059] shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>اختبار سورة أخرى</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
