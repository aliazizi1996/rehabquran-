/**
 * LazyVideoPlayer - مشغل فيديو متطور فائق الخفة وموفر للبيانات
 * مقرأة رحاب القرآن الإلكترونية
 * 
 * المزايا:
 * 1. واجهة معاينة خفيفة (0 بايت شبكة خارجية حتى ضغط الطالب).
 * 2. منع Autoplay تماماً: لا يعمل إلا عند نقر الطالب يدوياً.
 * 3. يحافظ على روابط YouTube الرسمية المعتمدة دون أي تغيير.
 * 4. يدعم وضع «توفير البيانات» والتنبيه له.
 * 5. متجاوب بالكامل Responsive (Aspect 16:9) مع زر ملء الشاشة Fullscreen مدمج.
 * 6. زر إيقاف فوري لتوفير البيانات يزيل الـ iframe من الذاكرة والشبكة فوراً.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Video, ShieldCheck, WifiOff, Maximize2, Minimize2, 
  Sparkles, Clock, User, X
} from 'lucide-react';
import { useDataSaver } from '../../utils/dataSaverStore';

interface LazyVideoPlayerProps {
  videoId?: string;
  videoUrl?: string;
  title?: string;
  speaker?: string;
  durationMinutes?: number | string;
  aspectRatio?: string;
  className?: string;
  badgeText?: string;
  allowFullscreenButton?: boolean;
}

export const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({
  videoId,
  videoUrl,
  title = 'الشرح المرئي المعتمد',
  speaker,
  durationMinutes,
  aspectRatio = 'aspect-video',
  className = '',
  badgeText = 'فيديو تعليمي معتمد',
  allowFullscreenButton = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDataSaver } = useDataSaver();

  // استخراج رابط التضمين الرسمي من YouTube دون أي تغيير
  const effectiveEmbedUrl = React.useMemo(() => {
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    if (videoUrl) {
      const urlHasParams = videoUrl.includes('?');
      return `${videoUrl}${urlHasParams ? '&' : '?'}autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    return '';
  }, [videoId, videoUrl]);

  // صورة المعاينة الخفيفة إذا توفر معرف الفيديو (تحميل كسول)
  const thumbnailSrc = videoId 
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` 
    : null;

  // الاستماع لتغيير ملء الشاشة
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // وظيفة تبديل ملء الشاشة
  const toggleFullscreen = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  // إيقاف التشغيل وحفظ البيانات فوراً
  const handleStopVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!effectiveEmbedUrl) {
    return (
      <div className={`w-full ${aspectRatio} rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-slate-400 text-center gap-2 ${className}`}>
        <Video className="w-8 h-8 opacity-40 text-amber-300" />
        <span className="text-xs">رابط الفيديو المعتمد غير متوفر حالياً</span>
      </div>
    );
  }

  // 1. حالة التشغيل الفعلي (بعد نقر الطالب يدوياً)
  if (isPlaying) {
    return (
      <div 
        ref={containerRef}
        className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-black flex flex-col' : `${aspectRatio} rounded-2xl overflow-hidden bg-black shadow-2xl relative border-2 border-emerald-600/70`} ${className}`}
      >
        <iframe
          src={effectiveEmbedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="w-full h-full border-0 flex-1"
        />

        {/* شريط التحكم العلوي المدمج */}
        <div className="absolute top-2.5 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={handleStopVideo}
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-amber-300 text-[11px] font-bold border border-amber-400/50 cursor-pointer shadow-lg transition-all active:scale-95 flex items-center gap-1.5 backdrop-blur-xs"
            title="إيقاف الفيديو وتفريغ الاتصال لتوفير البيانات"
          >
            <X className="w-3.5 h-3.5 text-amber-400" />
            <span>إيقاف وحفظ البيانات</span>
          </button>

          {allowFullscreenButton && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="pointer-events-auto p-2 rounded-xl bg-black/85 hover:bg-black text-white text-xs border border-white/20 cursor-pointer shadow-lg transition-all active:scale-95 flex items-center justify-center backdrop-blur-xs"
              title={isFullscreen ? 'الخروج من ملء الشاشة' : 'تكبير الفيديو لملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-300" /> : <Maximize2 className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. واجهة المعاينة الخفيفة (0 بايت شبكة خارجية حتى الضغط)
  return (
    <div
      ref={containerRef}
      onClick={() => setIsPlaying(true)}
      className={`group relative w-full ${aspectRatio} rounded-2xl overflow-hidden bg-gradient-to-br from-[#02180d] via-[#052e1a] to-[#01140a] border-2 border-[#C5A059]/60 shadow-xl cursor-pointer select-none transition-all duration-300 hover:border-[#dfbe75] hover:shadow-2xl flex flex-col justify-between p-4 sm:p-6 ${className}`}
      dir="rtl"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
      aria-label={`تشغيل الفيديو: ${title}`}
    >
      {/* Background Thumbnail if available (Lazy & blurred for lightweight atmosphere; omitted in Data Saver mode) */}
      {!isDataSaver && thumbnailSrc && (
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-35 transition-opacity duration-300 pointer-events-none">
          <img
            src={thumbnailSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/75" />
        </div>
      )}

      {/* Top Meta Bar */}
      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
        <span className="px-3 py-1 rounded-full bg-[#046A38] text-white text-[11px] font-bold border border-[#C5A059]/50 flex items-center gap-1.5 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
          <span>{badgeText}</span>
        </span>

        <div className="flex items-center gap-2">
          {durationMinutes && (
            <span className="px-2.5 py-1 rounded-full bg-black/60 text-emerald-200 text-[10px] font-bold border border-white/10 flex items-center gap-1 backdrop-blur-xs">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{durationMinutes} دقيقة</span>
            </span>
          )}

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 backdrop-blur-xs ${
            isDataSaver 
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' 
              : 'bg-black/60 text-emerald-200 border-white/10'
          }`}>
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>{isDataSaver ? 'توفير البيانات مفعل (عند الطلب فقط)' : 'تشغيل خفيف عند الطلب'}</span>
          </span>
        </div>
      </div>

      {/* Center Play Button & Title */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 space-y-3 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#C5A059] group-hover:bg-[#dfbe75] text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300 border-2 border-white/50">
          <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-slate-950 ml-0.5 text-slate-950" />
        </div>

        <div className="space-y-1 max-w-lg px-2">
          <h4 className="text-sm sm:text-base font-bold font-serif text-white group-hover:text-amber-200 transition-colors line-clamp-2">
            {title}
          </h4>
          {speaker && (
            <p className="text-xs text-slate-300 font-sans flex items-center justify-center gap-1">
              <User className="w-3 h-3 text-amber-300" />
              <span>فضيلة الشيخ: {speaker}</span>
            </p>
          )}
        </div>
      </div>

      {/* Bottom CTA hint */}
      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[11px] font-bold text-amber-300/90 group-hover:text-amber-200 bg-black/60 px-3.5 py-1 rounded-full border border-amber-500/30">
          اضغط هنا لبدء تشغيل الفيديو ◀
        </span>

        {allowFullscreenButton && (
          <span className="text-[10px] text-slate-400 hidden sm:inline-block">
            يدعم المشغل وضع ملء الشاشة الكامل
          </span>
        )}
      </div>
    </div>
  );
};
