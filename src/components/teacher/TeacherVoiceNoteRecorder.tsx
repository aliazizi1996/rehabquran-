import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Sparkles
} from 'lucide-react';

interface TeacherVoiceNoteRecorderProps {
  onAudioRecorded: (blob: Blob | null, durationSeconds: number) => void;
  isSaving?: boolean;
  studentName?: string;
  initialAudioUrl?: string;
}

export const TeacherVoiceNoteRecorder: React.FC<TeacherVoiceNoteRecorderProps> = ({
  onAudioRecorded,
  isSaving = false,
  studentName,
  initialAudioUrl,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Update initialAudioUrl if changed
  useEffect(() => {
    if (initialAudioUrl && !audioBlob) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  // Start voice recording
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك الحالي لا يدعم إمكانية التقاط الصوت من الميكروفون مباشرة.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Detect supported audio mime types
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
        mediaStreamRef.current = null;

        // Notify parent
        onAudioRecorded(fullBlob, recordingSeconds);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(200); // 200ms chunks
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          // Automatic safety limit: 5 minutes (300 seconds)
          if (prev >= 300) {
            handleStopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      let msg = 'تعذر الوصول إلى الميكروفون. يرجى التأكد من منح الإذن للمتصفح.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'تم رفض إذن استخدام الميكروفون. يرجى تفعيل الميكروفون في إعدادات المتصفح.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'لم يتم العثور على ميكروفون متصل بجهازك.';
      }
      setErrorMessage(msg);
      setIsRecording(false);
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

  // Cancel/Discard recording
  const handleDiscardRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioBlob(null);
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    onAudioRecorded(null, 0);
  };

  // Audio player toggle
  const handleTogglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-[#F9F6F0] rounded-2xl border-2 border-[#C5A059]/40 p-4 space-y-3">
      {/* رأس القسم مع الأيقونة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#046A38] text-white flex items-center justify-center shadow-xs">
            <Mic className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#046A38] font-serif">
              الملاحظة والتوجيه الصوتي للشيخ المعلم
            </h4>
            <span className="text-[10px] text-slate-500 block">
              تسجيل حي بصوتك لتصحيح الأحكام ومخارج الحروف للطالب {studentName ? `(${studentName})` : ''}
            </span>
          </div>
        </div>

        {audioBlob && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#046A38] border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-[#046A38]" />
            <span>مسجل وجاهز للإرسال</span>
          </span>
        )}
      </div>

      {/* رسالة الخطأ إن وُجدت */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{errorMessage}</p>
            <button
              type="button"
              onClick={handleStartRecording}
              className="text-rose-900 underline font-bold cursor-pointer hover:text-rose-950"
            >
              إعادة المحاولة بعد تفعيل إذن الميكروفون
            </button>
          </div>
        </div>
      )}

      {/* الحالة 1: جاري التسجيل المباشر عبر الميكروفون */}
      {isRecording && (
        <div className="p-4 bg-white rounded-xl border-2 border-rose-400 shadow-sm space-y-3 animate-pulse-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <span>جاري تسجيل توجيهك الصوتي... تحدّث الآن</span>
            </div>
            <div className="font-mono font-bold text-sm text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {formatTime(recordingSeconds)}
            </div>
          </div>

          {/* موجات صوتية بصرية ديناميكية */}
          <div className="flex items-center justify-center gap-1.5 h-8 py-1">
            {[40, 75, 95, 60, 85, 100, 70, 90, 50, 80, 65, 95, 45].map((height, idx) => (
              <span
                key={idx}
                className="w-1 bg-gradient-to-t from-rose-600 to-[#C5A059] rounded-full transition-all duration-150 animate-pulse"
                style={{
                  height: `${Math.max(20, (height * (1 + (recordingSeconds % 3) * 0.2)) % 100)}%`,
                  animationDelay: `${idx * 80}ms`,
                }}
              />
            ))}
          </div>

          {/* أزرار التحكم أثناء التسجيل */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleStopRecording}
              className="flex-1 py-2 px-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current text-[#C5A059]" />
              <span>إيقاف وحفظ التسجيل ({formatTime(recordingSeconds)})</span>
            </button>

            <button
              type="button"
              onClick={handleDiscardRecording}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="إلغاء التسجيل"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>إلغاء</span>
            </button>
          </div>
        </div>
      )}

      {/* الحالة 2: تم تسجيل الصوت وجاهز للمعاينة والاستماع */}
      {!isRecording && audioUrl && (
        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs space-y-2.5">
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || recordingSeconds)}
            onEnded={() => {
              setIsPlaying(false);
              setPlaybackTime(0);
            }}
            preload="auto"
            className="hidden"
          />

          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="flex items-center gap-1.5 font-bold text-[#046A38]">
              <Volume2 className="w-4 h-4 text-[#C5A059]" />
              <span>معاينة التسجيل الصوتي المسجل</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {formatTime(playbackTime)} / {formatTime(audioDuration || recordingSeconds)}
            </span>
          </div>

          {/* شريط تقدم الاستماع */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden cursor-pointer"
            onClick={(e) => {
              if (!audioPlayerRef.current || !audioDuration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              audioPlayerRef.current.currentTime = percentage * audioDuration;
            }}
          >
            <div
              className="bg-[#046A38] h-2 transition-all duration-150"
              style={{
                width: `${audioDuration > 0 ? (playbackTime / audioDuration) * 100 : 0}%`,
              }}
            />
          </div>

          {/* أزرار المشغل والإعادة */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={isSaving}
                className="px-3.5 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#C5A059]" /> : <Play className="w-3.5 h-3.5 text-[#C5A059]" />}
                <span>{isPlaying ? 'إيقاف مؤقت' : 'استماع للتوجيه'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isSaving}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="تسجيل توجيه صوتي جديد بديل"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>إعادة التسجيل</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDiscardRecording}
              disabled={isSaving}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
              title="حذف الملاحظة الصوتية"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* الحالة 3: لم يتم التسجيل بعد (زر البدء الرئيسي) */}
      {!isRecording && !audioUrl && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isSaving}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] hover:from-[#03542c] hover:to-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059]/60 active:scale-98 group"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-3.5 h-3.5 text-[#C5A059]" />
            </div>
            <span>تسجيل ملاحظة وتوجيه صوتي مباشر (بالمايكروفون) 🎙️</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center leading-normal">
            اضغط على الزر أعلاه ثم تحدّث لتوجيه الطالب وتصحيح مخارج الحروف. سيتم إرفاق التسجيل مع التقييم.
          </p>
        </div>
      )}
    </div>
  );
};
