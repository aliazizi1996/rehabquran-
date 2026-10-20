import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, CheckCircle2, Award, X, ChevronLeft, 
  Sparkles, Bell, Volume2, ArrowLeft, Crown, Video
} from 'lucide-react';
import { UserAlertNotification } from '../data/userNotificationStore';

interface NotificationBannerProps {
  onOpenRecitations?: () => void;
  onOpenProfile?: () => void;
  onJoinHalqa?: (halqaId?: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onOpenRecitations,
  onOpenProfile,
  onJoinHalqa,
}) => {
  const [activeNotification, setActiveNotification] = useState<UserAlertNotification | null>(null);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const DURATION_MS = 14000; // 14 seconds auto-dismiss for golden halqa

  useEffect(() => {
    const handleNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<UserAlertNotification>;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
        setProgress(100);
      }
    };

    window.addEventListener('rehab_show_user_notification_banner', handleNotificationEvent);
    return () => {
      window.removeEventListener('rehab_show_user_notification_banner', handleNotificationEvent);
    };
  }, []);

  // Timer & countdown bar
  useEffect(() => {
    if (!activeNotification) return;

    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const decrement = (stepMs / DURATION_MS) * 100;

    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 0;
        }
        return next;
      });
    }, stepMs);

    timerRef.current = window.setTimeout(() => {
      setActiveNotification(null);
    }, DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeNotification, isPaused]);

  if (!activeNotification) return null;

  const isFavoriteSheikhHalqa = 
    activeNotification.type === 'favorite_sheikh_halqa_started' || 
    Boolean(activeNotification.isFavoriteSheikh);
  const isMessage = activeNotification.type === 'sheikh_message';
  const isHalqaReminder = activeNotification.type === 'halqa_reminder';

  const handleActionClick = () => {
    if (isFavoriteSheikhHalqa || isHalqaReminder) {
      if (activeNotification.meetUrl) {
        window.open(activeNotification.meetUrl, '_blank');
      } else if (onJoinHalqa) {
        onJoinHalqa(activeNotification.halqaId);
      }
    } else if (activeNotification.type === 'recitation_approved' && onOpenRecitations) {
      onOpenRecitations();
    } else if (onOpenProfile) {
      onOpenProfile();
    }
    setActiveNotification(null);
  };

  return (
    <div 
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-xl animate-in slide-in-from-top-6 duration-300 font-sans"
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
    >
      <div className={`relative overflow-hidden rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${
        isFavoriteSheikhHalqa
          ? 'bg-gradient-to-br from-[#022513] via-[#05361c] to-[#022111] border-[#C5A059] text-white shadow-[0_12px_45px_-5px_rgba(197,160,89,0.55)] ring-2 ring-[#C5A059]/40'
          : isHalqaReminder
            ? 'bg-[#051a0e]/95 border-amber-400 text-white shadow-amber-950/60 ring-2 ring-amber-500/20'
            : isMessage
              ? 'bg-[#0a2016]/95 border-amber-500/80 text-white shadow-amber-950/40'
              : 'bg-[#091f15]/95 border-emerald-400/90 text-white shadow-emerald-950/40'
      }`}>
        {/* Top Progress countdown line */}
        <div className="w-full h-1 bg-black/40">
          <div 
            className={`h-full transition-all ease-linear ${
              isFavoriteSheikhHalqa
                ? 'bg-gradient-to-r from-[#C5A059] via-amber-200 to-[#C5A059]'
                : isHalqaReminder 
                  ? 'bg-amber-300' 
                  : isMessage 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 flex items-start gap-3">
          
          {/* Visual Icon Badge */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            isFavoriteSheikhHalqa
              ? 'bg-gradient-to-br from-[#FFE082] via-[#C5A059] to-[#8C6D23] text-slate-950 font-black shadow-lg shadow-amber-900/50 ring-2 ring-amber-300 animate-pulse'
              : isHalqaReminder
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold animate-bounce'
                : isMessage
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-emerald-500 text-slate-950 font-bold'
          }`}>
            {isFavoriteSheikhHalqa ? (
              <Crown className="w-6 h-6 text-slate-950 fill-amber-950/20" />
            ) : isHalqaReminder ? (
              <Bell className="w-5 h-5 animate-pulse" />
            ) : isMessage ? (
              <MessageSquare className="w-5 h-5" />
            ) : (
              <Award className="w-5 h-5" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isFavoriteSheikhHalqa
                    ? 'bg-gradient-to-r from-[#C5A059] to-amber-500 text-slate-950 border-amber-300 font-extrabold shadow-xs flex items-center gap-1'
                    : isHalqaReminder
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                      : isMessage
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                }`}>
                  {isFavoriteSheikhHalqa && <Sparkles className="w-2.5 h-2.5 inline" />}
                  {isFavoriteSheikhHalqa
                    ? 'حلقة الشيخ المفضل بدأت الآن 🌟'
                    : isHalqaReminder
                      ? `تنبيه حلقة القرآن (قبل ${activeNotification.minutesRemaining || 15} دقيقة) ⏰`
                      : isMessage
                        ? 'توجيه شيخ المقرأة'
                        : 'اعتماد التلاوة'}
                </span>
                
                {activeNotification.score !== undefined && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    الدرجة: {activeNotification.score}/100
                  </span>
                )}

                <span className="text-[10px] text-amber-200/80 font-mono">
                  {activeNotification.timestamp}
                </span>
              </div>

              {/* Close (X) button */}
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-white font-serif tracking-wide flex items-center gap-1.5">
              {activeNotification.title}
            </h4>

            <p className="text-xs text-emerald-100/90 leading-relaxed mt-1 line-clamp-2">
              {activeNotification.message}
            </p>

            {/* Quick action bar */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="text-slate-400">فضيلة الشيخ:</span>
                <span className="font-bold text-[#FFE082] flex items-center gap-1">
                  {activeNotification.sheikhName}
                  {isFavoriteSheikhHalqa && <Crown className="w-3 h-3 text-[#C5A059]" />}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleActionClick}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md ${
                    isFavoriteSheikhHalqa
                      ? 'bg-gradient-to-r from-[#C5A059] via-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold ring-1 ring-amber-300 shadow-amber-950/60 scale-[1.02] hover:scale-[1.04]'
                      : isHalqaReminder
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold ring-1 ring-amber-300'
                        : isMessage
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <span>
                    {isFavoriteSheikhHalqa
                      ? 'دخول حلقة التسميع الآن 📖'
                      : isHalqaReminder
                        ? 'دخول حلقة القرآن الآن 📖'
                        : isMessage
                          ? 'الاطلاع على التوجيه'
                          : 'عرض النتيجة بالسجل'}
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
