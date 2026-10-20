/**
 * FavoriteSheikhDashboardWidget - ويدجت حلقة الشيخ المفضل في لوحة التحكم الرئيسية للطالب
 * تظهر في أعلى لوحة الطالب لتنبيهه فوراً عندما تبدأ حلقة شيخه المفضل مع زر التسميع الفوري
 */

import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, Video, ExternalLink, Volume2, 
  Play, Radio, Bell, ArrowLeft, ChevronLeft 
} from 'lucide-react';
import { 
  AVAILABLE_SHUYOOKH, 
  getFavoriteSheikh, 
  getUserNotificationSettings, 
  triggerFavoriteSheikhHalqaNotification 
} from '../data/userNotificationStore';

interface FavoriteSheikhDashboardWidgetProps {
  onJoinHalqa: (halqaId?: string, meetUrl?: string) => void;
  onOpenNotifications: () => void;
}

export const FavoriteSheikhDashboardWidget: React.FC<FavoriteSheikhDashboardWidgetProps> = ({
  onJoinHalqa,
  onOpenNotifications,
}) => {
  const [favoriteSheikh, setFavSheikhState] = useState<string>(() => getFavoriteSheikh());
  const [isAlerting, setIsAlerting] = useState(false);

  useEffect(() => {
    const handleFavChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ sheikhName: string }>;
      if (customEvent.detail?.sheikhName) {
        setFavSheikhState(customEvent.detail.sheikhName);
      } else {
        setFavSheikhState(getFavoriteSheikh());
      }
    };

    window.addEventListener('rehab_favorite_sheikh_changed', handleFavChanged);
    return () => {
      window.removeEventListener('rehab_favorite_sheikh_changed', handleFavChanged);
    };
  }, []);

  const sheikhObj = AVAILABLE_SHUYOOKH.find(s => s.name === favoriteSheikh) || AVAILABLE_SHUYOOKH[0];

  const handleSimulateAlert = () => {
    setIsAlerting(true);
    triggerFavoriteSheikhHalqaNotification({
      sheikhName: favoriteSheikh,
      halqaTitle: sheikhObj.defaultHalqa,
      meetUrl: 'https://meet.google.com/rq-quran-live',
      halqaId: sheikhObj.id
    });
    setTimeout(() => setIsAlerting(false), 800);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#C5A059] bg-gradient-to-r from-[#032313] via-[#05371e] to-[#021f10] text-white p-5 sm:p-6 shadow-md shadow-amber-950/20 font-sans" dir="rtl">
      {/* Golden halo background */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-[#C5A059]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left / Info side */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE082] via-[#C5A059] to-[#8C6D23] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/60 ring-2 ring-amber-300 shrink-0">
            <Crown className="w-6 h-6 text-slate-950 fill-amber-950/20" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#C5A059] text-slate-950 border border-amber-300 shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                تنبيه حلقة الشيخ المفضل 🌟
              </span>
              <span className="text-[11px] text-emerald-200/90 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                حلقة التسميع المباشرة جاهزة
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold font-serif text-white">
              {favoriteSheikh}
            </h3>

            <p className="text-xs text-amber-200/80">
              {sheikhObj.title} • {sheikhObj.defaultHalqa}
            </p>
          </div>
        </div>

        {/* Right / Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Test alert chime */}
          <button
            type="button"
            onClick={handleSimulateAlert}
            disabled={isAlerting}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs active:scale-95"
            title="تجربة النغمة الذهبية والشريط المنبثق"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>تجربة التنبيه الذهبي</span>
          </button>

          {/* Join Halqa button */}
          <button
            type="button"
            onClick={() => onJoinHalqa(sheikhObj.id, 'https://meet.google.com/rq-quran-live')}
            className="px-4 py-2 bg-gradient-to-r from-[#C5A059] via-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 ring-1 ring-amber-300 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
          >
            <Video className="w-4 h-4 text-slate-950" />
            <span>دخول حلقة التسميع الآن 📖</span>
          </button>

          {/* Notification center settings link */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
            title="إعدادات التنبيهات واختيار الشيخ"
          >
            <Bell className="w-4 h-4 text-amber-300" />
          </button>
        </div>

      </div>
    </div>
  );
};
