import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Square, Play, Pause, RotateCcw, Send, Sparkles, 
  CheckCircle2, Clock, Award, AlertCircle, Volume2, 
  FileText, UserCheck, MessageSquare, ChevronDown
} from 'lucide-react';
import { AudioSubmission, UserProfile } from '../types';
import { SURAHS_LIST } from '../data/quranData';

interface AudioRecorderViewProps {
  user: UserProfile;
  submissions: AudioSubmission[];
  onSubmitRecitation: (submission: Omit<AudioSubmission, 'id' | 'recordedAt' | 'status'>) => void;
  onSheikhReview?: (submissionId: string, score: number, feedback: string, notes: string[]) => void;
}

export const AudioRecorderView: React.FC<AudioRecorderViewProps> = ({
  user,
  submissions,
  onSubmitRecitation,
  onSheikhReview,
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  
  // Selection
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(78);
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(10);
  const [studentNotes, setStudentNotes] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // AI Guidance State
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    keyRules?: string[];
    frequentMistakes?: string[];
    makharajFocus?: string;
    sheikhTip?: string;
  } | null>(null);

  // Teacher Review mode inputs (for reviewing submissions)
  const [reviewingSubId, setReviewingSubId] = useState<string | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(95);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');

  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentSurah = SURAHS_LIST.find((s) => s.number === selectedSurahNumber) || SURAHS_LIST[0];

  // Visualizer Animation Loop
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / (bufferLength / 2)) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength / 2; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      
      // Gradient from emerald to amber
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#10b981');
      gradient.addColorStop(1, '#f59e0b');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start Real Browser Microphone Recording
  const startRecording = async () => {
    setAudioError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك الحالي لا يدعم الوصول المباشر للميكروفون.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Web Audio API for visualizer
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      drawWaveform();

      // التفاوض على أفضل ترميز صوتي مضغوط وخفيف (WebM/Opus أولاً ثم MP4/AAC/MP3)
      // وتجنب ملفات WAV غير المضغوطة لتوفير البيانات وسرعة الرفع
      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
        'audio/mpeg'
      ];

      let selectedMimeType = '';
      for (const mime of preferredMimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported(mime)) {
            selectedMimeType = mime;
            break;
          }
        }
      }

      // ضبط معدل البت على 48 kbps: جودة صوتية ممتازة لتلاوة القرآن مع حجم ملف خفيف جداً
      const recorderOptions: MediaRecorderOptions = selectedMimeType 
        ? { mimeType: selectedMimeType, audioBitsPerSecond: 48000 }
        : { audioBitsPerSecond: 48000 };

      // MediaRecorder setup
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || selectedMimeType || 'audio/webm;codecs=opus';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to release mic hardware
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      console.error('Error starting audio recording:', err);
      const msg = err instanceof Error ? err.message : 'تعذر تشغيل الميكروفون';
      setAudioError(`تعذر فتح الميكروفون: ${msg}. يُرجى منح إذن الميكروفون من إعدادات المتصفح.`);
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Reset Recording
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlaying(false);
    setAudioError(null);
  };

  // Toggle Audio Playback
  const togglePlay = () => {
    if (!audioElementRef.current || !audioUrl) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Playback failed', e);
        setIsPlaying(false);
      });
    }
  };

  // Fetch AI Tajweed Guidance
  const handleRequestAiTajweed = async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/analyze-tajweed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahName: currentSurah.name,
          ayahStart,
          ayahEnd,
          textSnippet: studentNotes,
        }),
      });

      if (!response.ok) throw new Error('فشل جلب التحليل');
      const data = await response.json();
      setAiAnalysis(data.analysis || data.fallback);
    } catch (err) {
      console.error('Tajweed analysis fetch error:', err);
      setAiAnalysis({
        keyRules: [
          'مراعاة إتمام الحركات (الكسر والضم والفتح)',
          'تحقيق أحكام النون الساكنة والتنوين',
          'ضبط مقادير المدود في الآيات المقروءة'
        ],
        frequentMistakes: [
          'عدم تصفية نبرات القلقلة',
          'خلط صوت الغنة بحروف المد'
        ],
        sheikhTip: 'بارك الله في تلاوتك! اقرأ بتؤدة وتأنٍ وأعطِ الحروف حقها من المخارج والصفات.'
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Submit Recitation
  const handleSubmit = () => {
    if (!audioBlob && recordingSeconds === 0) {
      setAudioError('يرجى تسجيل التلاوة أولاً قبل الإرسال.');
      return;
    }

    onSubmitRecitation({
      studentId: user.id,
      studentName: user.name,
      surahName: currentSurah.name,
      surahNumber: currentSurah.number,
      ayahStart,
      ayahEnd,
      audioBlobUrl: audioUrl || undefined,
      durationSeconds: recordingSeconds || 45,
      aiGuidance: aiAnalysis || undefined,
    });

    // Reset and switch to history
    resetRecording();
    setStudentNotes('');
    setAiAnalysis(null);
    setActiveTab('history');
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Sub-Tabs: Record vs History */}
      <div className="flex bg-[#0b1c14] p-1 rounded-2xl border border-emerald-900/60 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'record'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          تسجيل تلاوة جديدة
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          سجل التلاوات والتصحيحات
          {submissions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold">
              {submissions.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'record' ? (
        <div className="space-y-4">
          {/* Surah and Ayah Selection Card */}
          <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                تحديد المقطع القرآني المراد تسميعه
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">
                {currentSurah.type} • {currentSurah.totalAyahs} آية
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Surah Dropdown */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">السورة الكريمة</label>
                <div className="relative">
                  <select
                    value={selectedSurahNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setSelectedSurahNumber(num);
                      setAyahStart(1);
                      const targetSurah = SURAHS_LIST.find((s) => s.number === num);
                      setAyahEnd(Math.min(10, targetSurah?.totalAyahs || 7));
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#091710] border border-emerald-900 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    {SURAHS_LIST.map((s) => (
                      <option key={s.number} value={s.number} className="bg-[#091710] text-white">
                        {s.number}. سورة {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Ayah Start */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">من الآية</label>
                <input
                  type="number"
                  min={1}
                  max={currentSurah.totalAyahs}
                  value={ayahStart}
                  onChange={(e) => setAyahStart(Math.max(1, Math.min(currentSurah.totalAyahs, Number(e.target.value))))}
                  className="w-full py-2 px-3 rounded-xl bg-[#091710] border border-emerald-900 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Ayah End */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">إلى الآية</label>
                <input
                  type="number"
                  min={ayahStart}
                  max={currentSurah.totalAyahs}
                  value={ayahEnd}
                  onChange={(e) => setAyahEnd(Math.max(ayahStart, Math.min(currentSurah.totalAyahs, Number(e.target.value))))}
                  className="w-full py-2 px-3 rounded-xl bg-[#091710] border border-emerald-900 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            {/* Note input */}
            <div>
              <input
                type="text"
                placeholder="ملاحظات للشيخ (مثل: أرجو التدقيق على مد العارض للسكون أو غنة الإخفاء)..."
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-[#091710] border border-emerald-900/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Interactive Microphone Recorder Studio */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0e251a] via-[#0b1c14] to-[#07130e] border-2 border-emerald-800/60 shadow-xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-sm mx-auto space-y-4">
              
              {/* Header Status */}
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-1">
                  سورة {currentSurah.name} • الآيات ({ayahStart} - {ayahEnd})
                </p>
                <div className="text-3xl font-mono font-bold text-white tracking-wider">
                  {formatTime(recordingSeconds)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isRecording ? 'جارٍ التسجيل المباشر بجودة استوديو...' : audioUrl ? 'تم الانتهاء من التسجيل. يمكنك الاستماع أو الإرسال' : 'اضغط على زر الميكروفون لبدء التسجيل'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] text-emerald-300 font-sans">
                  <span>🎙️ ترميز مضغوط خفيف (WebM/Opus • 48 kbps - بدون WAV)</span>
                </div>
              </div>

              {/* Real-time Waveform Canvas */}
              <div className="h-14 w-full bg-[#050f0a] rounded-xl border border-emerald-950 flex items-center justify-center overflow-hidden p-1">
                {isRecording ? (
                  <canvas ref={canvasRef} width={280} height={50} className="w-full h-full" />
                ) : (
                  <div className="flex items-center gap-1 opacity-40">
                    {[12, 24, 40, 20, 32, 16, 48, 28, 14, 38, 22, 18, 30, 42].map((h, idx) => (
                      <div key={idx} className="w-1.5 bg-emerald-400 rounded-full" style={{ height: `${h}px` }} />
                    ))}
                  </div>
                )}
              </div>

              {/* Main Recording Action Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {!isRecording && !audioUrl && (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950 transition-all transform hover:scale-105 cursor-pointer"
                    title="بدء التسجيل الصوتي"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950 animate-pulse transition-all cursor-pointer"
                    title="إيقاف التسجيل"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                )}

                {audioUrl && !isRecording && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title={isPlaying ? "إيقاف مؤقت" : "استماع للتسجيل"}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-slate-950 ml-0.5" />}
                    </button>

                    <button
                      onClick={resetRecording}
                      className="w-12 h-12 rounded-full bg-[#0d2217] border border-emerald-800 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                      title="إعادة التسجيل"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden audio element for playback */}
              {audioUrl && (
                <audio
                  ref={audioElementRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              {/* Audio error alert */}
              {audioError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 text-right">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{audioError}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Pre-Recitation / Post-Recitation Tajweed Advisor */}
          <div className="p-4 rounded-2xl bg-[#0a1e15] border border-emerald-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">
                  المساعد القرآني الذكي لأحكام التجويد (Gemini)
                </h4>
              </div>
              <button
                onClick={handleRequestAiTajweed}
                disabled={isLoadingAi}
                className="px-3 py-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/60 border border-emerald-600/50 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingAi ? (
                  <>
                    <span className="w-3 h-3 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></span>
                    جارٍ التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    استخراج أحكام المقطع
                  </>
                )}
              </button>
            </div>

            {aiAnalysis ? (
              <div className="space-y-2.5 pt-1 text-xs">
                {aiAnalysis.keyRules && aiAnalysis.keyRules.length > 0 && (
                  <div className="bg-[#06120c] p-3 rounded-xl border border-emerald-950">
                    <p className="font-bold text-emerald-300 mb-1.5">أهم الأحكام التجويدية في هذا المقطع:</p>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {aiAnalysis.keyRules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.frequentMistakes && aiAnalysis.frequentMistakes.length > 0 && (
                  <div className="bg-[#120f07] p-3 rounded-xl border border-amber-950/70">
                    <p className="font-bold text-amber-300 mb-1.5">أخطاء شائعة ينبغي تجنبها:</p>
                    <ul className="space-y-1 list-disc list-inside text-slate-300">
                      {aiAnalysis.frequentMistakes.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.sheikhTip && (
                  <div className="bg-[#081810] p-3 rounded-xl border border-emerald-900/60 text-emerald-200/90 italic">
                    « {aiAnalysis.sheikhTip} »
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                اضغط على زر استخراج أحكام المقطع لتزويدك تلقائياً بأهم مواضع الإدغام والإخفاء والمدود والأخطاء الشائعة المتوقعة قبل إرسال التلاوة للشيخ.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={!audioUrl && recordingSeconds === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              إرسال التلاوة إلى مشايخ المقرأة للتصحيح
            </button>
          </div>
        </div>
      ) : (
        /* Submissions History Tab */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              التلاوات المرسلة والملاحظات التجويدية
            </h3>
            <span className="text-[11px] text-slate-400">
              {submissions.length} تلاوات مسجلة
            </span>
          </div>

          {submissions.map((sub) => {
            const isReviewed = sub.status === 'reviewed';

            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      سورة {sub.surahName} • الآيات ({sub.ayahStart} - {sub.ayahEnd})
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {sub.recordedAt} • المدة: {sub.durationSeconds} ثانية
                    </p>
                  </div>

                  {/* Status / Score */}
                  <div>
                    {isReviewed && sub.score ? (
                      <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-xl text-xs font-bold">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sub.score} / 100</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-sky-400 bg-sky-950/60 border border-sky-800 px-2.5 py-0.5 rounded-full font-medium">
                        قيد الاستماع والمراجعة
                      </span>
                    )}
                  </div>
                </div>

                {/* Recitation Audio Player if present */}
                {sub.audioBlobUrl && (
                  <div className="p-2.5 rounded-xl bg-[#091710] border border-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-slate-300">تسجيل التلاوة الصوتي</span>
                    </div>
                    <audio controls src={sub.audioBlobUrl} className="h-8 max-w-[200px]" />
                  </div>
                )}

                {/* Sheikh Feedback if reviewed */}
                {isReviewed && sub.sheikhFeedback && (
                  <div className="p-3 rounded-xl bg-[#081810] border border-emerald-800/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تقييم وتوجيه {sub.sheikhName || 'الشيخ المشرف'}:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-amiri text-sm">
                      « {sub.sheikhFeedback} »
                    </p>

                    {sub.tajweedNotes && sub.tajweedNotes.length > 0 && (
                      <div className="pt-2 border-t border-emerald-900/60">
                        <span className="text-[11px] font-bold text-amber-300 block mb-1">
                          الملاحظات التجويدية المرصودة:
                        </span>
                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                          {sub.tajweedNotes.map((note, nIdx) => (
                            <li key={nIdx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Mode Interactive Review Button (when user switches role to teacher) */}
                {user.role === 'teacher' && onSheikhReview && (
                  <div className="pt-2 border-t border-emerald-900/40">
                    {reviewingSubId === sub.id ? (
                      <div className="bg-[#08170f] p-3 rounded-xl border border-amber-500/40 space-y-2.5">
                        <p className="text-xs font-bold text-amber-300">نموذج تصحيح الشيخ للتلاوة:</p>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-300">الدرجة (من 100):</label>
                          <input
                            type="number"
                            value={reviewScore}
                            onChange={(e) => setReviewScore(Number(e.target.value))}
                            className="w-20 p-1.5 rounded-lg bg-[#050e09] border border-emerald-900 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">ملاحظات التوجيه والتصحيح:</label>
                          <textarea
                            rows={2}
                            value={reviewFeedback}
                            onChange={(e) => setReviewFeedback(e.target.value)}
                            placeholder="اكتب ملاحظاتك للطالب عن مخارج الحروف، أحكام النون، المدود..."
                            className="w-full p-2 rounded-lg bg-[#050e09] border border-emerald-900 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-300 block mb-1">أحكام محددة تم تصحيحها:</label>
                          <input
                            type="text"
                            value={reviewNoteInput}
                            onChange={(e) => setReviewNoteInput(e.target.value)}
                            placeholder="مثال: ترقيق الراء، إتمام غنة الإخفاء"
                            className="w-full p-2 rounded-lg bg-[#050e09] border border-emerald-900 text-xs text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const notes = reviewNoteInput ? [reviewNoteInput] : ['إتقان مخارج الحروف'];
                              onSheikhReview(sub.id, reviewScore, reviewFeedback || 'ما شاء الله تلاوة طيبة مع مراعاة التوجيهات.', notes);
                              setReviewingSubId(null);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                          >
                            حفظ واعتماد التقييم
                          </button>
                          <button
                            onClick={() => setReviewingSubId(null)}
                            className="px-3 py-1.5 rounded-lg bg-[#050e09] text-slate-400 text-xs cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReviewingSubId(sub.id);
                          setReviewScore(sub.score || 95);
                          setReviewFeedback(sub.sheikhFeedback || '');
                        }}
                        className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {isReviewed ? 'تعديل تقييم الشيخ لهذه التلاوة' : 'كتابة تقييم وتصحيح بصفتك الشيخ'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {submissions.length === 0 && (
            <div className="text-center py-10 px-4 rounded-2xl bg-[#0e2219]/60 border border-emerald-900/40">
              <Mic className="w-10 h-10 text-emerald-600/60 mx-auto mb-2" />
              <h4 className="font-semibold text-white text-sm mb-1">لا توجد تلاوات مسجلة بعد</h4>
              <p className="text-xs text-slate-400">سجل أول تلاوة لك الآن وأرسلها لمشايخ المقرأة للحصول على تقييم فوري.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
