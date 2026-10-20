/**
 * واجهة جلسة التسميع الحية والمباشرة (Live Recitation Session)
 * تتيح للمعلم رصد الأخطاء الستة لحظياً أثناء استماع تلاوة الطالب:
 * [نسيان] [لحن جلي] [لحن خفي] [خطأ تجويدي] [وقف وابتداء] [تردد]
 * مع تكامل مساعد الذكاء الاصطناعي الاسترشادي والضابط الشرعي الإلزامي لاعتماد المعلم
 */

import React, { useState, useEffect } from 'react';
import { 
  Mic, Play, Square, Pause, AlertTriangle, CheckCircle2, 
  RotateCcw, Sparkles, BookOpen, Volume2, ShieldCheck, 
  Save, User, Award, Clock, ArrowRight, MessageSquare 
} from 'lucide-react';
import { 
  ALL_114_SURAHS, 
  ACADEMIC_RIWAYAHS, 
  ACADEMIC_CURRICULA, 
  QURAN_ERROR_CATEGORIES, 
  QuranErrorType,
  calculateMastery 
} from '../../data/quranAcademicData';
import { 
  AcademicPlanGoal, 
  AcademicRecitationSession, 
  calculateSessionScore, 
  saveRecitationSession, 
  SessionErrorCount, 
  requestAiTajweedAdvisory,
  AI_ADVISORY_DISCLAIMER 
} from '../../services/academicService';
import { AuthAccount } from '../../types';

interface LiveRecitationSessionProps {
  currentAccount: AuthAccount;
  initialPlan?: AcademicPlanGoal | null;
  onSessionSaved?: (session: AcademicRecitationSession) => void;
  onClose?: () => void;
}

export const LiveRecitationSession: React.FC<LiveRecitationSessionProps> = ({
  currentAccount,
  initialPlan,
  onSessionSaved,
  onClose
}) => {
  // Session Configuration
  const [studentName, setStudentName] = useState<string>(initialPlan?.studentName || 'عبد الله صالح');
  const [sessionType, setSessionType] = useState<'new_memorization' | 'minor_revision' | 'major_revision'>(
    initialPlan?.planCategory || 'new_memorization'
  );
  const [surahNumber, setSurahNumber] = useState<number>(initialPlan?.surahNumber || 2);
  const [ayahStart, setAyahStart] = useState<number>(initialPlan?.ayahStart || 1);
  const [ayahEnd, setAyahEnd] = useState<number>(initialPlan?.ayahEnd || 20);
  const [pageStart, setPageStart] = useState<number>(initialPlan?.pageStart || 2);
  const [pageEnd, setPageEnd] = useState<number>(initialPlan?.pageEnd || 4);
  const [riwayahName, setRiwayahName] = useState<string>(initialPlan?.riwayahName || 'حفص عن عاصم (طريق الشاطبية)');
  const [halqaTitle, setHalqaTitle] = useState<string>('حلقة فجر الإتقان - قسم الطلاب');

  // Live Timer
  const [isRecordingLive, setIsRecordingLive] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Errors Counter (الأخطاء الستة)
  const [errors, setErrors] = useState<SessionErrorCount>({
    forgetting: 0,
    clear_mistake: 0,
    hidden_mistake: 0,
    tajweed_mistake: 0,
    waqf_ibtida_mistake: 0,
    hesitation: 0
  });

  // Teacher Evaluation & Mandatory Human Approval
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [homeworkAssigned, setHomeworkAssigned] = useState<string>('');
  const [isTeacherConfirmed, setIsTeacherConfirmed] = useState<boolean>(false);
  const [teacherCustomScore, setTeacherCustomScore] = useState<number | null>(null);

  // AI Advisory Assistant State
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<{
    keyRulesSuggested?: string[];
    frequentMistakesTips?: string[];
    makharajFocus?: string;
    sheikhEncouragement?: string;
    disclaimer: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isRecordingLive) {
      interval = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingLive]);

  // Handle Surah change
  const handleSurahChange = (sNum: number) => {
    setSurahNumber(sNum);
    const found = ALL_114_SURAHS.find(s => s.number === sNum);
    if (found) {
      setAyahStart(1);
      setAyahEnd(Math.min(20, found.totalAyahs));
      setPageStart(found.startPage);
      setPageEnd(found.endPage);
    }
  };

  // Error Counter Increment/Decrement
  const modifyError = (type: QuranErrorType, delta: number) => {
    setErrors((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const resetErrors = () => {
    if (window.confirm('هل تريد تصفير جميع عدادات الأخطاء للجلسة الحالية؟')) {
      setErrors({
        forgetting: 0,
        clear_mistake: 0,
        hidden_mistake: 0,
        tajweed_mistake: 0,
        waqf_ibtida_mistake: 0,
        hesitation: 0
      });
      setTeacherCustomScore(null);
    }
  };

  // Calculate live score
  const scoreResult = calculateSessionScore(errors);
  const activeFinalScore = teacherCustomScore !== null ? teacherCustomScore : scoreResult.calculatedScore;
  const activeMastery = calculateMastery(activeFinalScore);

  // Request AI Advisory Notes (Gemini)
  const handleRequestAiTips = async () => {
    setIsLoadingAi(true);
    const surah = ALL_114_SURAHS.find(s => s.number === surahNumber) || ALL_114_SURAHS[0];
    const res = await requestAiTajweedAdvisory(surah.name, ayahStart, ayahEnd);
    setIsLoadingAi(false);
    if (res.feedback) {
      setAiFeedback(res.feedback);
    }
  };

  // Format Timer
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit and Save Session
  const handleSaveSession = async () => {
    setErrorMessage(null);

    // الضابط الشرعي 13: التحقق الصارم من موافقة واعتماد المعلم البشري
    if (!isTeacherConfirmed) {
      setErrorMessage('ضابط شرعي وأكاديمي مُلزم: يجب على المعلم مراجعة التقييم واعتماده رسمياً بتفعيل خانة الإقرار قبل الحفظ.');
      return;
    }

    setIsSaving(true);
    const surah = ALL_114_SURAHS.find(s => s.number === surahNumber) || ALL_114_SURAHS[0];

    const sessionPayload: Partial<AcademicRecitationSession> = {
      studentId: initialPlan?.studentId || 'student-1',
      studentName,
      teacherId: currentAccount.id,
      teacherName: currentAccount.name || 'الشيخ المقرئ المعتمد',
      halqaTitle,
      sessionType,
      surahName: surah.name,
      ayahStart,
      ayahEnd,
      pageStart,
      pageEnd,
      juzNumber: surah.startJuz,
      riwayah: riwayahName,
      curriculum: initialPlan?.curriculumTitle || 'منهج الحفظ العام المنتظم',
      sessionDate: new Date().toISOString().split('T')[0],
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      errors,
      totalErrorsCount: scoreResult.totalErrors,
      deductedPoints: scoreResult.deduction,
      rawScore: scoreResult.calculatedScore,
      finalScore: activeFinalScore,
      masteryLevel: activeMastery.label,
      passed: activeMastery.passed,
      teacherNotes: teacherNotes.trim(),
      homeworkAssigned: homeworkAssigned.trim() || undefined,
      isTeacherApproved: true,
      approvedByTeacherName: currentAccount.name || 'المعلم المعتمد',
      approvedAt: new Date().toISOString(),
      aiAdvisoryFeedback: aiFeedback || undefined
    };

    const res = await saveRecitationSession(sessionPayload);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (onSessionSaved) {
        onSessionSaved(sessionPayload as AcademicRecitationSession);
      }
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } else {
      setErrorMessage(res.error || 'تعذر حفظ الجلسة في Firestore');
    }
  };

  const surahObj = ALL_114_SURAHS.find(s => s.number === surahNumber) || ALL_114_SURAHS[0];

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C5A059] shadow-xl overflow-hidden text-right font-sans" dir="rtl">
      {/* 1. Header Bar */}
      <div className="bg-[#046A38] text-white px-5 py-4 border-b-2 border-[#C5A059] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#C5A059] flex items-center justify-center border border-white/20">
            <Mic className={`w-5 h-5 ${isRecordingLive ? 'animate-pulse text-rose-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#C5A059] text-slate-950 px-2.5 py-0.5 rounded-full">
                جلسة تسميع حية مباشرة
              </span>
              <span className="text-xs text-emerald-200">{riwayahName.split(' ')[0]}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-serif mt-0.5">
              تسميع: {studentName} • سورة {surahObj.name} ({ayahStart} - {ayahEnd})
            </h2>
          </div>
        </div>

        {/* Live Timer Controls */}
        <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-2xl border border-white/10">
          <Clock className="w-4 h-4 text-[#C5A059]" />
          <span className="font-mono text-base font-bold text-white tracking-widest">{formatTime(durationSeconds)}</span>
          <button
            onClick={() => setIsRecordingLive(!isRecordingLive)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isRecordingLive ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
            }`}
          >
            {isRecordingLive ? 'إيقاف مؤقت' : 'بدء التسميع'}
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>تم اعتماد وحفظ تقييم جلسة التسميع بنجاح في قاعدة بيانات المقرأة!</span>
          </div>
        )}

        {/* 2. Top Info Row: Type, Surah, Ayahs, Pages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/30 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px] mb-1 font-bold">نوع الجلسة</span>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as any)}
              className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800"
            >
              <option value="new_memorization">حفظ جديد</option>
              <option value="minor_revision">مراجعة صغرى</option>
              <option value="major_revision">مراجعة كبرى</option>
            </select>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] mb-1 font-bold">السورة الكريمة</span>
            <select
              value={surahNumber}
              onChange={(e) => handleSurahChange(Number(e.target.value))}
              className="w-full bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800"
            >
              {ALL_114_SURAHS.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.name} ({s.totalAyahs} آية)
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] mb-1 font-bold">نطاق الآيات</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                value={ayahStart}
                onChange={(e) => setAyahStart(Number(e.target.value))}
                className="w-full bg-white px-2 py-1 rounded-xl border border-slate-300 text-center font-bold"
                placeholder="من"
              />
              <span>-</span>
              <input
                type="number"
                min="1"
                value={ayahEnd}
                onChange={(e) => setAyahEnd(Number(e.target.value))}
                className="w-full bg-white px-2 py-1 rounded-xl border border-slate-300 text-center font-bold"
                placeholder="إلى"
              />
            </div>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px] mb-1 font-bold">الصفحة / الجزء</span>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-center">
              ص {pageStart} • جزء {surahObj.startJuz}
            </div>
          </div>
        </div>

        {/* 3. The 6 Quran Error Counters (لوحة عدادات الأخطاء الستة التفاعلية) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-serif text-[#046A38] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#C5A059]" />
              <span>لوحة رصد الأخطاء الفورية (حسم آلي للدرجات)</span>
            </h3>

            <button
              onClick={resetErrors}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير العدادات</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {QURAN_ERROR_CATEGORIES.map((cat) => {
              const count = errors[cat.id] || 0;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-[#C5A059] transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{cat.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (-{cat.deductionPoints} د)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => modifyError(cat.id, -1)}
                      disabled={count === 0}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>

                    <div className="flex items-center gap-1">
                      <span className={`text-xl font-black font-serif ${count > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400">مرة</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => modifyError(cat.id, 1)}
                      className="w-9 h-9 rounded-xl bg-[#046A38] hover:bg-[#03522b] text-white font-bold text-base flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
                      title={`إضافة خطأ: ${cat.label}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Live Score & Mastery Level Banner */}
        <div className="bg-gradient-to-r from-[#F9F6F0] via-white to-[#F9F6F0] p-5 rounded-3xl border-2 border-[#C5A059]/40 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <span className="text-xs text-slate-500 font-bold">الدرجة المحسوبة ودرجة الإتقان:</span>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span className="text-3xl sm:text-4xl font-black font-serif text-[#046A38]">
                {activeFinalScore}%
              </span>
              <span className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border ${activeMastery.badgeClass}`}>
                {activeMastery.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              إجمالي الأخطاء المرصودة: <strong>{scoreResult.totalErrors}</strong> • الحسم التراكمي: <strong>-{scoreResult.deduction} درجة</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-center">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">تعديل الدرجة يدوياً (للمعلم)</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder={String(scoreResult.calculatedScore)}
                value={teacherCustomScore !== null ? teacherCustomScore : ''}
                onChange={(e) => setTeacherCustomScore(e.target.value ? Number(e.target.value) : null)}
                className="w-24 px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-center font-bold text-slate-800 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 5. AI Advisory Assistant Section (مساعد الذكاء الاصطناعي الاسترشادي) */}
        <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <h4 className="text-xs sm:text-sm font-bold text-[#046A38]">
                مساعد التجويد الاسترشادي الذكي (Gemini)
              </h4>
            </div>

            <button
              type="button"
              onClick={handleRequestAiTips}
              disabled={isLoadingAi}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-[#046A38] rounded-xl text-xs font-bold border border-emerald-300 shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              {isLoadingAi ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />}
              <span>استدعاء توجيهات الآيات</span>
            </button>
          </div>

          {/* Strict Mandatory Disclaimer - الشرط 14 */}
          <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-300/80 text-[11px] text-amber-950 font-medium leading-relaxed">
            {AI_ADVISORY_DISCLAIMER}
          </div>

          {aiFeedback && (
            <div className="space-y-2 text-xs pt-1 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="font-bold text-[#046A38] block mb-1">أهم الأحكام المتكررة في هذا المقطع:</span>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                    {aiFeedback.keyRulesSuggested?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <span className="font-bold text-amber-900 block mb-1">أخطاء يكثر وقوع القراء فيها هنا:</span>
                  <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                    {aiFeedback.frequentMistakesTips?.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              </div>

              {aiFeedback.sheikhEncouragement && (
                <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 font-serif text-center">
                  🌸 <em>"{aiFeedback.sheikhEncouragement}"</em>
                </p>
              )}
            </div>
          )}
        </div>

        {/* 6. Teacher Notes & Next Homework */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ملاحظات وتوجيهات المعلم المباشرة للطالب *
            </label>
            <textarea
              rows={3}
              placeholder="مثال: أحسنت في إتقان المدود، مع ضرورة الانتباه لمخرج حرف الضاد في قوله تعالى ﴿وَلَا الضَّالِّينَ﴾ وعدم خلطه بالظاء."
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              الواجب والمقرر القادم للجلسة القادمة
            </label>
            <textarea
              rows={3}
              placeholder="مثال: حفظ الآيات من 21 إلى 35 من سورة البقرة + مراجعة الوجهين الأولين 3 مرات على المصحف المرتل."
              value={homeworkAssigned}
              onChange={(e) => setHomeworkAssigned(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#046A38] outline-none resize-none"
            />
          </div>
        </div>

        {/* 7. Mandatory Human Teacher Approval Checkbox - الشرط الشرعي 13 */}
        <div className="bg-[#F9F6F0] p-4 rounded-2xl border-2 border-[#C5A059] flex items-start gap-3">
          <input
            type="checkbox"
            id="chk-teacher-approval"
            checked={isTeacherConfirmed}
            onChange={(e) => setIsTeacherConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 text-[#046A38] rounded border-slate-300 focus:ring-[#046A38] cursor-pointer"
          />
          <label htmlFor="chk-teacher-approval" className="text-xs text-slate-800 leading-relaxed cursor-pointer font-medium">
            <strong>إقرار واعتماد المعلم البشري (الضابط الشرعي):</strong> أقر أنا المعلم/المقرئ ({currentAccount.name || 'المعلم المعتمد'}) بأنني استمعت لتلاوة الطالب شخصياً، ورصدت الأخطاء بدقة، واعتمدت النتيجة النهائية وفق معايير الإتقان الشرعية بالسند المتصل دون الاعتماد على أي تصحيح آلي مغلق.
          </label>
        </div>

        {/* 8. Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              إلغاء الجلسة
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveSession}
            disabled={isSaving || !isTeacherConfirmed}
            className="mr-auto px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer border border-[#C5A059] flex items-center gap-2 transition-all"
          >
            {isSaving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>اعتماد وحفظ تقييم الجلسة في السجل الأكاديمي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
