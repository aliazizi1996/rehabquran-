/**
 * مكون تسجيل وتسميع التلاوة للطالب - مقرأة رحاب القرآن الإلكترونية
 * - تسجيل صوتي حقيقي عبر متصفح الويب (MediaRecorder API)
 * - مؤقت زمني وتأثيرات بصرية نابضة
 * - معاينة واستماع للتسجيل قبل الإرسال
 * - رفع التسجيل الصوتي مباشرة إلى Cloudinary
 * - حفظ سجل التسميع في Firestore مع إشعار المعلم
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Square, Play, Pause, RotateCcw, UploadCloud, 
  CheckCircle2, AlertCircle, Volume2, Sparkles, Loader2,
  BookOpen, Clock
} from 'lucide-react';
import { QURAN_SURAHS } from '../../data/evaluationStore';
import { uploadAudioToCloudinary } from '../../services/cloudinaryService';
import { saveDocumentItem, RecitationLogItem } from '../../services/firestoreService';
import { AuthAccount } from '../../types';

interface StudentRecitationRecorderProps {
  currentAccount: AuthAccount;
  teacherName?: string;
  onRecitationSaved: (newRec: RecitationLogItem) => void;
  onCancel?: () => void;
}

export const StudentRecitationRecorder: React.FC<StudentRecitationRecorderProps> = ({
  currentAccount,
  teacherName = 'الشيخ المعلم',
  onRecitationSaved,
  onCancel,
}) => {
  // Surah & Ayah selection
  const [selectedSurah, setSelectedSurah] = useState<string>('سورة الفاتحة');
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(7);
  const [studentNotes, setStudentNotes] = useState<string>('');

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Update total ayahs when surah changes
  const handleSurahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedSurah(name);
    const found = QURAN_SURAHS.find((s) => s.name === name);
    if (found) {
      setAyahStart(1);
      setAyahEnd(Math.min(10, found.totalAyahs));
    }
  };

  // Visualizer loop
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / (bufferLength / 2)) * 2.2;
    let x = 0;

    for (let i = 0; i < bufferLength / 2; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#046A38');
      gradient.addColorStop(1, '#C5A059');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start browser MediaRecorder
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك الحالي لا يتيح الوصول المباشر إلى ميكروفون الجهاز.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Visualizer setup
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const analyser = ctx.createAnalyser();
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 64;
          audioContextRef.current = ctx;
          analyserRef.current = analyser;
          drawWaveform();
        }
      } catch (vizErr) {
        console.warn('Audio Visualizer note:', vizErr);
      }

      // Check mime types
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر بدء التسجيل. يرجى السماح بالإذن للميكروفون والمحاولة ثانية.');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Toggle playback preview
  const handleTogglePlay = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback notice:', e);
      });
    }
  };

  // Reset recording
  const handleResetRecording = () => {
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Upload to Cloudinary & Save to Firestore
  const handleUploadAndSubmit = async () => {
    if (!audioBlob) {
      setErrorMessage('يرجى تسجيل التلاوة أولاً قبل الإرسال.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. الرفع إلى Cloudinary
      const uploadRes = await uploadAudioToCloudinary(audioBlob, {
        studentId: currentAccount.id,
        studentName: currentAccount.name,
        surahName: selectedSurah,
        ayahRange: `${ayahStart} - ${ayahEnd}`,
      });

      if (!uploadRes.success || !uploadRes.secureUrl) {
        throw new Error(uploadRes.error || 'فشل رفع التسجيل إلى Cloudinary، يرجى إعادة المحاولة.');
      }

      // 2. الحفظ في Firestore في مجموعة recitations
      const ayahRangeText = `${ayahStart} - ${ayahEnd}`;
      const todayDate = new Date().toISOString().split('T')[0];

      const newRecitationData = {
        studentId: currentAccount.id,
        studentName: currentAccount.name,
        teacherName: teacherName || 'الشيخ المعلم',
        surah: selectedSurah,
        ayahRange: ayahRangeText,
        riwayah: (currentAccount as any).riwayah || 'حفص عن عاصم',
        date: todayDate,
        gradeScore: 0, // ينتظر تقييم المعلم
        tajweedNotes: studentNotes.trim() ? `ملاحظة الطالب: ${studentNotes.trim()}` : 'بانتظار مراجعة الشيخ واستماع التلاوة',
        status: 'needs_practice' as const,
        audioUrl: uploadRes.secureUrl,
        recordedAt: new Date().toISOString(),
      };

      const savedDoc = await saveDocumentItem('recitations', null, newRecitationData);
      
      const savedRecitation: RecitationLogItem = {
        id: (savedDoc as any)?.id || `rec-${Date.now()}`,
        ...newRecitationData,
      };

      setSuccessMessage('تم رفع التسجيل الصوتي بنجاح إلى Cloudinary وإرساله لفضيلة الشيخ للمراجعة والتصحيح! ✨');
      onRecitationSaved(savedRecitation);

      // Clean up local blob
      setTimeout(() => {
        handleResetRecording();
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إرسال التسميع الصوتي. يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#C5A059]/40 shadow-sm space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-[#C5A059] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span>التسميع الصوتي المباشر والرفع السحابي</span>
          </span>
          <h3 className="text-lg font-bold font-serif text-[#046A38] mt-0.5">
            تسجيل مقطع التلاوة بصوتك وإرساله للشيخ
          </h3>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
          >
            إلغاء وإغلاق
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Surah & Ayah Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">السورة الكريمة المراد تسميعها:</label>
          <select
            value={selectedSurah}
            onChange={handleSurahChange}
            disabled={isRecording || isUploading}
            className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-[#C5A059]/40 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#046A38]"
          >
            {QURAN_SURAHS.map((s) => (
              <option key={s.number} value={s.name}>
                {s.name} (الجزء {s.juz} - {s.totalAyahs} آية)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">من الآية:</label>
          <input
            type="number"
            min={1}
            value={ayahStart}
            onChange={(e) => setAyahStart(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isRecording || isUploading}
            className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-[#046A38]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">إلى الآية:</label>
          <input
            type="number"
            min={ayahStart}
            value={ayahEnd}
            onChange={(e) => setAyahEnd(Math.max(ayahStart, parseInt(e.target.value) || ayahStart))}
            disabled={isRecording || isUploading}
            className="w-full p-2.5 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-[#046A38]"
          />
        </div>
      </div>

      {/* Recording Visual Stage */}
      <div className="p-6 bg-gradient-to-br from-[#046A38]/5 via-[#F9F6F0] to-[#C5A059]/10 rounded-3xl border-2 border-[#C5A059]/30 text-center space-y-4">
        
        {/* Canvas Visualizer */}
        <div className="h-14 flex items-center justify-center">
          {isRecording ? (
            <canvas ref={canvasRef} width={280} height={50} className="rounded-lg" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-serif">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
              <span>اضغط على زر التسجيل أدناه وابدأ تلاوة الآيات بترتيل وتؤدة</span>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-slate-200 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono font-bold text-sm text-[#046A38]">
            {formatTimer(recordingSeconds)}
          </span>
          {isRecording && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
          )}
        </div>

        {/* Action Recording Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isRecording && !audioBlob && (
            <button
              onClick={handleStartRecording}
              className="px-6 py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:scale-105 flex items-center gap-2 cursor-pointer border border-[#C5A059]"
            >
              <Mic className="w-4 h-4 text-[#C5A059]" />
              <span>بدء تسجيل التلاوة (ميكروفون)</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={handleStopRecording}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4" />
              <span>إيقاف وإنهاء التسجيل</span>
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={handleTogglePlay}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-[#C5A059]" />}
                <span>{isPlaying ? 'إيقاف الاستماع' : 'استماع للتسجيل'}</span>
              </button>

              <button
                onClick={handleResetRecording}
                disabled={isUploading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة التسجيل</span>
              </button>

              <button
                onClick={handleUploadAndSubmit}
                disabled={isUploading}
                className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#C5A059] disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                    <span>جاري الرفع إلى Cloudinary...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#C5A059]" />
                    <span>رفع التسجيل إلى Cloudinary وإرساله للشيخ</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Student Notes */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-1.5">
          ملاحظة أو سؤال ترغب بتوجيهه للشيخ مع هذا التسجيل (اختياري):
        </label>
        <textarea
          rows={2}
          value={studentNotes}
          onChange={(e) => setStudentNotes(e.target.value)}
          placeholder="مثال: يرجى التدقيق على مخرج حرف الضاد في الآية الثالثة..."
          className="w-full p-3 rounded-xl bg-[#F9F6F0] border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
        />
      </div>
    </div>
  );
};
