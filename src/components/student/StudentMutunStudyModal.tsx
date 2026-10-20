import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  BookOpen, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  Volume2, 
  Mic, 
  HelpCircle, 
  Send, 
  Bookmark, 
  Award, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  RefreshCw,
  Repeat
} from "lucide-react";
import { 
  ScientificMatn, 
  MatnGroup, 
  MatnVerse, 
  MatnStudentProgress, 
  MatnSelfQuizQuestion,
  MasteryLevel 
} from "../../types/mutun";
import { 
  fetchScientificMutun, 
  getStudentMatnProgress, 
  recordStudentSelfStudy, 
  submitMatnRecitation 
} from "../../services/mutunService";

interface StudentMutunStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
  halqaId?: string;
  teacherId?: string;
  initialMatnId?: string;
}

export const StudentMutunStudyModal: React.FC<StudentMutunStudyModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName = "طالب المقرأة",
  halqaId = "",
  teacherId = "",
  initialMatnId
}) => {
  const [mutun, setMutun] = useState<ScientificMatn[]>([]);
  const [activeMatn, setActiveMatn] = useState<ScientificMatn | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [progress, setProgress] = useState<MatnStudentProgress | null>(null);
  const [activeTab, setActiveTab] = useState<"verses" | "explanation" | "quiz" | "recitation">("verses");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [repeatCount, setRepeatCount] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // حالة الاختبار الذاتي
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // حالة إرسال التسميع
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function init() {
      const list = await fetchScientificMutun();
      if (!isMounted) return;
      setMutun(list);
      const chosen = (initialMatnId ? list.find(m => m.id === initialMatnId) : list[0]) || list[0];
      if (chosen) {
        setActiveMatn(chosen);
        const prog = await getStudentMatnProgress(studentId, chosen.id, studentName, halqaId, teacherId);
        if (!isMounted) return;
        setProgress(prog);
        const currentGrpIdx = chosen.groups.findIndex(g => g.groupNumber === prog.currentGroupNumber);
        setActiveGroupIndex(currentGrpIdx >= 0 ? currentGrpIdx : 0);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [isOpen, studentId, initialMatnId, halqaId, teacherId, studentName]);

  if (!isOpen || !activeMatn) return null;

  const currentGroup = activeMatn.groups[activeGroupIndex] || activeMatn.groups[0];
  const groupProgress = progress?.groupProgress[currentGroup.id];
  const isApproved = Boolean(groupProgress?.isTeacherApproved);

  // هل المجموعة مقفلة؟ المجموعة مقفلة إذا كانت بعد المجموعة الحالية ولم يُعتمد السابق
  const isGroupLocked = activeGroupIndex > 0 && 
    (activeGroupIndex + 1 > (progress?.currentGroupNumber || 1)) && 
    !Boolean(progress?.nextGroupUnlocked && (activeGroupIndex + 1 <= (progress?.currentGroupNumber || 1) + 1));

  // التحكم بالصوت
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  // تسجيل المراجعة
  const handleMarkReviewed = async () => {
    if (!activeMatn || !currentGroup) return;
    const updated = await recordStudentSelfStudy(studentId, activeMatn.id, currentGroup.id, 100, true);
    setProgress(updated);
    alert("تم تسجيل جلسة المراجعة وحفظها بنجاح!");
  };

  // تسليم الاختبار الذاتي
  const handleQuizSubmit = async () => {
    if (!currentGroup) return;
    let correctCount = 0;
    currentGroup.quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    const calculatedScore = currentGroup.quizQuestions.length > 0 
      ? Math.round((correctCount / currentGroup.quizQuestions.length) * 100) 
      : 100;
    
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    if (activeMatn) {
      const updated = await recordStudentSelfStudy(studentId, activeMatn.id, currentGroup.id, calculatedScore, false);
      setProgress(updated);
    }
  };

  // تسجيل الصوت
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
          setHasRecordedAudio(true);
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("تعذر الوصول إلى الميكروفون. يرجى السماح بالصلاحيات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // إرسال التسميع للمعلم
  const handleSendRecitation = async () => {
    if (!activeMatn || !currentGroup) return;
    setIsSubmitting(true);
    try {
      await submitMatnRecitation({
        studentId,
        studentName,
        teacherId,
        halqaId,
        matnId: activeMatn.id,
        matnTitle: activeMatn.title,
        groupId: currentGroup.id,
        groupNumber: currentGroup.groupNumber,
        verseRange: `الأبيات ${currentGroup.fromVerse} - ${currentGroup.toVerse}`,
        audioBase64: audioUrl,
        submissionType: hasRecordedAudio ? "audio" : "live_session"
      });
      setSubmissionSuccess(true);
    } catch (err) {
      alert("حدث خطأ أثناء إرسال التسميع. يرجى إعادة المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#C5A059]/40 overflow-hidden my-auto">
        
        {/* شريط الرأس واختيار المتن */}
        <div className="bg-[#046A38] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#C5A059] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-[#C5A059] flex items-center justify-center shrink-0 border border-[#C5A059]/40">
              <BookOpen className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#F9F6F0]">
                  {activeMatn.title}
                </h2>
                <span className="text-[10px] font-sans font-bold bg-[#C5A059] text-[#2C3531] px-2 py-0.5 rounded-full">
                  معتمد
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-sans mt-0.5">
                الناظم: {activeMatn.author} ({activeMatn.totalVerses} بيتاً)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* اختيار متن آخر إذا وجد */}
            {mutun.length > 1 && (
              <select
                value={activeMatn.id}
                onChange={async (e) => {
                  const m = mutun.find(item => item.id === e.target.value);
                  if (m) {
                    setActiveMatn(m);
                    setActiveGroupIndex(0);
                    const p = await getStudentMatnProgress(studentId, m.id, studentName, halqaId, teacherId);
                    setProgress(p);
                  }
                }}
                className="bg-white/10 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 border border-[#C5A059]/40 outline-none cursor-pointer hidden sm:block"
              >
                {mutun.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-900 bg-white">
                    {m.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* شريط اختيار المجموعات الأفقي السريع */}
        <div className="bg-[#F9F6F0] p-3 border-b border-stone-200 shrink-0 overflow-x-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 shrink-0 ml-1">المجموعات:</span>
          {activeMatn.groups.map((grp, idx) => {
            const isCurrent = idx === activeGroupIndex;
            const grpProg = progress?.groupProgress[grp.id];
            const grpApproved = Boolean(grpProg?.isTeacherApproved);
            const locked = idx > 0 && (idx + 1 > (progress?.currentGroupNumber || 1)) && !Boolean(progress?.nextGroupUnlocked && (idx + 1 <= (progress?.currentGroupNumber || 1) + 1));

            return (
              <button
                key={grp.id}
                onClick={() => {
                  setActiveGroupIndex(idx);
                  setActiveTab("verses");
                  setQuizSubmitted(false);
                  setSubmissionSuccess(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                  isCurrent
                    ? "bg-[#046A38] text-white border-[#C5A059] shadow-xs"
                    : grpApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : locked
                    ? "bg-stone-100 text-stone-600 border-stone-300 opacity-80"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {locked ? (
                  <Lock className="w-3 h-3 text-stone-500" />
                ) : grpApproved ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                )}
                <span>المجموعة {grp.groupNumber}</span>
              </button>
            );
          })}
        </div>

        {/* أزرار التبويبات الداخلية */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("verses")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "verses" ? "bg-[#046A38] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الأبيات والمطلوب
            </button>
            <button
              onClick={() => setActiveTab("explanation")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "explanation" ? "bg-[#046A38] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              الشرح والتطبيق
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "quiz" ? "bg-[#046A38] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              اختبر حفظك
            </button>
            <button
              onClick={() => setActiveTab("recitation")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "recitation" ? "bg-[#046A38] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              أرسل التسميع
            </button>
          </div>

          {/* زر تشغيل الصوت السريع */}
          {currentGroup.audioUrl && (
            <button
              onClick={togglePlayAudio}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isPlayingAudio 
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-emerald-50 text-[#046A38] border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? "إيقاف الصوت" : "استمع للأبيات"}</span>
            </button>
          )}

          {currentGroup.audioUrl && (
            <audio 
              ref={audioRef} 
              src={currentGroup.audioUrl} 
              onEnded={() => {
                if (repeatMode && repeatCount > 1) {
                  setRepeatCount(prev => prev - 1);
                  audioRef.current?.play();
                } else {
                  setIsPlayingAudio(false);
                }
              }} 
            />
          )}
        </div>

        {/* محتوى الشاشة التفصيلية */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* تنبيه إذا كانت المجموعة مقفلة */}
          {isGroupLocked && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-4 text-xs text-amber-900 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">هذه المجموعة مقفلة حالياً</p>
                <p className="text-amber-800 leading-relaxed">
                  تُفتح هذه المجموعة تلقائياً بعد إتمام متطلبات المجموعة السابقة واعتماد المعلم لتسميعك، أو وفق خطة المشرف الأكاديمي.
                </p>
              </div>
            </div>
          )}

          {/* تبويب 1: الأبيات الحالية */}
          {activeTab === "verses" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="text-sm font-bold font-serif text-[#046A38]">
                    {currentGroup.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    الأبيات ({currentGroup.fromVerse} - {currentGroup.toVerse})
                  </span>
                </div>

                {/* قائمة الأبيات المنسقة بنمط شعري عريق */}
                <div className="space-y-3 font-serif">
                  {currentGroup.verses.map((verse) => (
                    <div 
                      key={verse.number}
                      className="p-3.5 rounded-2xl bg-[#F9F6F0] hover:bg-emerald-50/40 border border-[#C5A059]/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold bg-[#046A38] text-white w-6 h-6 rounded-full flex items-center justify-center">
                          {verse.number}
                        </span>
                        {verse.tajweedRule && (
                          <span className="text-[10px] font-sans font-bold bg-[#C5A059]/20 text-[#046A38] px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                            {verse.tajweedRule}
                          </span>
                        )}
                      </div>

                      {/* شطرا البيت */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm sm:text-base text-slate-800 leading-loose">
                        <div className="text-right pr-2 font-bold text-[#046A38]">
                          {verse.sadr}
                        </div>
                        <div className="text-left pl-2 font-bold text-slate-700">
                          {verse.ajuz}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* أزرار الإجراءات الخمسة في أسفل الأبيات */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => {
                    setRepeatMode(true);
                    togglePlayAudio();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Repeat className="w-3.5 h-3.5 text-[#046A38]" />
                  <span>تكرار للحفظ</span>
                </button>

                <button
                  onClick={handleMarkReviewed}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>راجع الأبيات</span>
                </button>

                <button
                  onClick={() => setActiveTab("quiz")}
                  className="py-2.5 px-3 rounded-xl bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#046A38] border border-[#C5A059]/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#046A38]" />
                  <span>اختبر حفظك</span>
                </button>

                <button
                  onClick={() => setActiveTab("recitation")}
                  className="py-2.5 px-3 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>أرسل التسميع</span>
                </button>
              </div>
            </div>
          )}

          {/* تبويب 2: الشرح المعتمد والتطبيقات */}
          {activeTab === "explanation" && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold font-serif text-[#046A38] mb-1">
                    الشرح الميسر المعتمد لمجموعة {currentGroup.groupNumber}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {currentGroup.explanationSummary}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 font-sans">بيان الأبيات بالتفصيل:</h4>
                  {currentGroup.verses.map((v) => (
                    <div key={v.number} className="p-3.5 rounded-xl bg-[#F9F6F0] border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#046A38] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                          {v.number}
                        </span>
                        <span className="font-bold font-serif text-sm text-[#046A38]">
                          {v.sadr} ... {v.ajuz}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pr-7">
                        {v.explanation}
                      </p>
                      {v.practicalExamples && v.practicalExamples.length > 0 && (
                        <div className="pr-7 pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500">أمثلة تطبيقية:</span>
                          {v.practicalExamples.map((ex, i) => (
                            <span key={i} className="text-xs font-serif bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[#046A38] font-bold">
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* تبويب 3: الاختبار الذاتي */}
          {activeTab === "quiz" && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#046A38]">
                    الاختبار الذاتي للمجموعة {currentGroup.groupNumber}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    أجب عن الأسئلة للتأكد من رسوخ الأبيات وفهم أحكام التجويد
                  </p>
                </div>
                {quizSubmitted && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">النتيجة:</span>
                    <span className={`text-sm font-bold font-mono px-3 py-1 rounded-xl ${
                      quizScore >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {quizScore}%
                    </span>
                  </div>
                )}
              </div>

              {/* أسئلة الاختبار الذاتي */}
              <div className="space-y-4">
                {currentGroup.quizQuestions.map((q, idx) => {
                  const selectedAnswer = quizAnswers[q.id];
                  const isCorrect = selectedAnswer === q.correctAnswer;

                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-[#F9F6F0] border border-slate-200 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#C5A059] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed font-sans">
                          {q.question}
                        </p>
                      </div>

                      {/* خيارات الإجابة */}
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pr-7">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                              className={`p-2.5 rounded-xl text-xs font-medium text-right border transition-all cursor-pointer ${
                                selectedAnswer === opt
                                  ? "bg-[#046A38] text-white border-[#046A38]"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* إظهار التفسير التعليمي بعد التسليم */}
                      {quizSubmitted && (
                        <div className={`mt-2 p-2.5 rounded-xl text-xs leading-relaxed pr-3 border ${
                          isCorrect ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"
                        }`}>
                          <p className="font-bold mb-0.5">
                            {isCorrect ? "إجابة صحيحة! أحسنت." : `الإجابة الصحيحة هي: ${q.correctAnswer}`}
                          </p>
                          <p className="text-[11px] opacity-90">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* زر التسليم */}
              <div className="pt-2 flex justify-end">
                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    className="px-5 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs shadow-xs border border-[#C5A059] transition-all cursor-pointer"
                  >
                    تسليم الإجابات وعرض النتيجة
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                )}
              </div>
            </div>
          )}

          {/* تبويب 4: أرسل التسميع للمعلم */}
          {activeTab === "recitation" && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold font-serif text-[#046A38]">
                  إرسال التسميع للمجموعة {currentGroup.groupNumber}
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  سجل صوتك أو أكد جاهزيتك للتسميع المباشر في الحلقة ليعتمد الشيخ تقدمك
                </p>
              </div>

              {submissionSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">تم إرسال التسميع للشيخ بنجاح!</h4>
                  <p className="text-xs text-emerald-700">
                    ستظهر النتيجة وملاحظات الشيخ هنا فور مراجعتها واعتماد الانتقال للمجموعة التالية.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* مسجل الصوت التفاعلي */}
                  <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-slate-200 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">التسجيل الصوتي للأبيات:</p>
                    
                    <div className="flex items-center justify-center gap-3">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <Mic className="w-4 h-4" />
                          <span>ابدأ التسجيل الصوتي</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-black text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer animate-pulse"
                        >
                          <Pause className="w-4 h-4" />
                          <span>إيقاف التسجيل</span>
                        </button>
                      )}
                    </div>

                    {hasRecordedAudio && audioUrl && (
                      <div className="pt-2">
                        <audio src={audioUrl} controls className="w-full max-w-sm mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* زر الإرسال النهائي */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSendRecitation}
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs shadow-md border border-[#C5A059] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#C5A059]" />
                      <span>{isSubmitting ? "جاري الإرسال..." : "تأكيد إرسال التسميع للمعلم"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};