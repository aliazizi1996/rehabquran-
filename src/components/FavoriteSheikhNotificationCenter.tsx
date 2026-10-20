/**
 * FavoriteSheikhNotificationCenter - مركز إشعارات الطالب والتنبيه الذهبي للشيخ المفضل
 * مقرأة رحاب القرآن الإلكترونية
 * مطابقة تامة لدليل الهوية البصرية 2026: الأخضر الزمردي (#046A38)، الذهبي الملكي (#C5A059)
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, Crown, Sparkles, CheckCheck, Play, Volume2, VolumeX, 
  ExternalLink, Video, CheckCircle2, Award, MessageSquare, 
  Settings2, Clock, ChevronDown, RefreshCw, AlertCircle, Radio
} from 'lucide-react';
import { InAppNotification } from '../types';
import { 
  getInAppNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../data/wirdNotificationStore';
import { 
  AVAILABLE_SHUYOOKH, 
  getFavoriteSheikh, 
  setFavoriteSheikh, 
  getUserNotificationSettings, 
  saveUserNotificationSettings, 
  triggerFavoriteSheikhHalqaNotification,
  playGoldenNotificationChime
} from '../data/userNotificationStore';

interface FavoriteSheikhNotificationCenterProps {
  onJoinHalqa?: (halqaId?: string, meetUrl?: string) => void;
  currentStudentName?: string;
}

export const FavoriteSheikhNotificationCenter: React.FC<FavoriteSheikhNotificationCenterProps> = ({
  onJoinHalqa,
  currentStudentName
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => getInAppNotifications());
  const [favoriteSheikh, setFavSheikhState] = useState<string>(() => getFavoriteSheikh());
  const [settings, setSettings] = useState(() => getUserNotificationSettings());
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorite_sheikh' | 'evaluations' | 'system'>('all');
  const [isChangingSheikh, setIsChangingSheikh] = useState(false);
  const [isSimulatingAlert, setIsSimulatingAlert] = useState(false);
  const [audioFeedbackSuccess, setAudioFeedbackSuccess] = useState(false);

  // Sync state on custom events
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      setNotifications(getInAppNotifications());
    };

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getUserNotificationSettings());
      }
    };

    const handleFavoriteSheikhChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ sheikhName: string }>;
      if (customEvent.detail?.sheikhName) {
        setFavSheikhState(customEvent.detail.sheikhName);
      } else {
        setFavSheikhState(getFavoriteSheikh());
      }
    };

    window.addEventListener('rehab_notifications_updated', handleNotificationsUpdated);
    window.addEventListener('rehab_user_notification_settings_updated', handleSettingsUpdated);
    window.addEventListener('rehab_favorite_sheikh_changed', handleFavoriteSheikhChanged);

    return () => {
      window.removeEventListener('rehab_notifications_updated', handleNotificationsUpdated);
      window.removeEventListener('rehab_user_notification_settings_updated', handleSettingsUpdated);
      window.removeEventListener('rehab_favorite_sheikh_changed', handleFavoriteSheikhChanged);
    };
  }, []);

  const handleSelectFavoriteSheikh = (sheikhName: string) => {
    setFavoriteSheikh(sheikhName);
    setFavSheikhState(sheikhName);
    setIsChangingSheikh(false);
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    const updated = saveUserNotificationSettings({
      [key]: !settings[key]
    });
    setSettings(updated);
  };

  const handleTriggerTestGoldenAlert = () => {
    setIsSimulatingAlert(true);
    setAudioFeedbackSuccess(true);
    setTimeout(() => setAudioFeedbackSuccess(false), 3000);

    const activeObj = AVAILABLE_SHUYOOKH.find(s => s.name === favoriteSheikh) || AVAILABLE_SHUYOOKH[0];

    triggerFavoriteSheikhHalqaNotification({
      sheikhName: favoriteSheikh,
      halqaTitle: activeObj.defaultHalqa || 'حلقة التسميع والإجازة بالسند المتصل',
      meetUrl: 'https://meet.google.com/rq-quran-live',
      halqaId: activeObj.id
    });

    setTimeout(() => {
      setIsSimulatingAlert(false);
    }, 600);
  };

  const currentSheikhObj = AVAILABLE_SHUYOOKH.find(s => s.name === favoriteSheikh) || {
    id: 'custom',
    name: favoriteSheikh,
    title: 'شيخ معتمد بمقرأة رحاب القرآن',
    defaultHalqa: 'حلقة التسميع وتصحيح التلاوة',
    icon: 'Crown'
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'favorite_sheikh') {
      return item.type === 'favorite_sheikh' || Boolean(item.isFavoriteSheikh);
    }
    if (activeFilter === 'evaluations') {
      return item.type === 'evaluation';
    }
    if (activeFilter === 'system') {
      return item.type === 'system' || item.type === 'wird_reminder' || item.type === 'honor_board';
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const favoriteHalqaNotificationsCount = notifications.filter(
    n => n.type === 'favorite_sheikh' || Boolean(n.isFavoriteSheikh)
  ).length;

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* 1. Header with stats & actions */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#C5A059] bg-[#C5A059]/10 px-3 py-1 rounded-full border border-[#C5A059]/20 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              نظام الإشعارات والتنبيهات المباشرة
            </span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} غير مقروء
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
            مركز إشعارات الطالب والتنبيه الذهبي
          </h2>
          <p className="text-xs text-slate-500">
            تابع مواعيد حلقات التسميع فور بدئها مع فضيلة شيخك المفضل وتلقَّ التوجيهات الأكاديمية لحظة بلحظة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>تحديد الكل كمقروء</span>
            </button>
          )}

          <button
            onClick={() => setNotifications(getInAppNotifications())}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
            title="تحديث الإشعارات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Royal Golden Hub: Favorite Sheikh Live Alert Card (البطاقة الذهبية الملكية) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#C5A059] bg-gradient-to-br from-[#032313] via-[#06381f] to-[#021f10] text-white p-6 sm:p-7 shadow-[0_10px_35px_-5px_rgba(197,160,89,0.35)]">
        {/* Subtle decorative Islamic / Golden aura overlay */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top row: Sheikh Badge & Change Sheikh dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#FFE082] via-[#C5A059] to-[#8C6D23] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/60 ring-2 ring-amber-300 shrink-0">
                <Crown className="w-7 h-7 text-slate-950 fill-amber-950/20" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#C5A059] to-amber-500 text-slate-950 border border-amber-300 shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    الشيخ المفضل للتسميع
                  </span>
                  <span className="text-[11px] text-amber-200/90 font-medium">
                    تنبيه ذهبي فوري عند بدء الحلقة
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-1 flex items-center gap-2">
                  <span>{currentSheikhObj.name}</span>
                </h3>
                <p className="text-xs text-emerald-200/80">
                  {currentSheikhObj.title} • {currentSheikhObj.defaultHalqa}
                </p>
              </div>
            </div>

            {/* Change Favorite Sheikh Button & Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsChangingSheikh(!isChangingSheikh)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-[#C5A059]/60 text-[#FFE082] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
              >
                <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>تغيير الشيخ المفضل</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChangingSheikh ? 'rotate-180' : ''}`} />
              </button>

              {/* Sheikh Selection Dropdown */}
              {isChangingSheikh && (
                <div className="absolute left-0 sm:left-auto right-0 mt-2 w-72 sm:w-80 bg-[#072416] border-2 border-[#C5A059] rounded-2xl shadow-2xl p-2 z-30 space-y-1 backdrop-blur-md animate-in fade-in duration-200">
                  <div className="px-3 py-2 text-[11px] font-bold text-amber-300 border-b border-white/10">
                    اختر شيخك المفضل لتلقي التنبيه الذهبي عند بدء حلقته:
                  </div>
                  {AVAILABLE_SHUYOOKH.map((sheikh) => {
                    const isSelected = sheikh.name === favoriteSheikh;
                    return (
                      <button
                        key={sheikh.id}
                        type="button"
                        onClick={() => handleSelectFavoriteSheikh(sheikh.name)}
                        className={`w-full p-2.5 rounded-xl text-right text-xs transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#C5A059] text-slate-950 font-bold shadow-sm'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <Crown className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-slate-950' : 'text-[#C5A059]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{sheikh.name}</p>
                          <p className={`text-[10px] truncate ${isSelected ? 'text-slate-800' : 'text-slate-300'}`}>
                            {sheikh.title}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Interactive controls & Test simulation bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Toggle 1: Golden Alert Banner */}
            <div 
              onClick={() => handleToggleSetting('favoriteSheikhAlertsEnabled')}
              className="bg-black/25 hover:bg-black/35 p-3.5 rounded-2xl border border-white/10 cursor-pointer transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  settings.favoriteSheikhAlertsEnabled ? 'bg-[#C5A059] text-slate-950' : 'bg-white/10 text-slate-400'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">التنبيه الذهبي المباشر</h4>
                  <p className="text-[10px] text-slate-300">ظهور الشريط المنبثق الذهبي</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                settings.favoriteSheikhAlertsEnabled ? 'bg-[#C5A059]' : 'bg-slate-700'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.favoriteSheikhAlertsEnabled ? '-translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>

            {/* Toggle 2: Golden Spiritual Chime */}
            <div 
              onClick={() => handleToggleSetting('soundEnabled')}
              className="bg-black/25 hover:bg-black/35 p-3.5 rounded-2xl border border-white/10 cursor-pointer transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  settings.soundEnabled ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-400'
                }`}>
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">نغمة التنبيه الذهبي</h4>
                  <p className="text-[10px] text-slate-300">أصوات روحية هارمونية</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                settings.soundEnabled ? 'bg-[#C5A059]' : 'bg-slate-700'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? '-translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </div>

            {/* Action 3: Live Test Trigger Button */}
            <button
              type="button"
              onClick={handleTriggerTestGoldenAlert}
              disabled={isSimulatingAlert}
              className="bg-gradient-to-r from-[#C5A059] via-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black p-3.5 rounded-2xl shadow-lg shadow-amber-950/50 ring-1 ring-amber-300 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95"
            >
              <Play className={`w-4 h-4 fill-slate-950 ${isSimulatingAlert ? 'animate-spin' : ''}`} />
              <span className="text-xs">
                {isSimulatingAlert ? 'جاري إطلاق التنبيه...' : 'تجربة التنبيه الذهبي الآن 🌟'}
              </span>
            </button>
          </div>

          {/* Info pill about golden alert */}
          <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#C5A059] animate-pulse shrink-0" />
              <span>
                عند بدء جلسة التسميع المباشرة لفضيلة <strong>{favoriteSheikh}</strong>، سيظهر التنبيه الذهبي فوراً مع إمكانية الدخول للحلقة بضغطة واحدة.
              </span>
            </div>
            {audioFeedbackSuccess && (
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-400/40 shrink-0">
                تم تشغيل النغمة وظهور التنبيه بنجاح! ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs (فلاتر الإشعارات) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          جميع الإشعارات ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('favorite_sheikh')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'favorite_sheikh'
              ? 'bg-[#C5A059] text-slate-950 shadow-xs ring-1 ring-amber-300'
              : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-300'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>حلقات الشيخ المفضل 🌟 ({favoriteHalqaNotificationsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('evaluations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'evaluations'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>اعتماد التلاوات والتقييمات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeFilter === 'system'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-slate-500" />
          <span>تنبيهات المقرأة والورد</span>
        </button>
      </div>

      {/* 4. Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Crown className="w-7 h-7 text-[#C5A059]" />
            </div>
            <h4 className="text-base font-bold font-serif text-slate-800">لا توجد إشعارات في هذا التصنيف</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يمكنك الضغط على زر "تجربة التنبيه الذهبي الآن" بالأعلى لمعاينة إشعار بدء حلقة شيخك المفضل مع النغمة الروحية.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isFav = notif.type === 'favorite_sheikh' || Boolean(notif.isFavoriteSheikh);
            const isEvaluation = notif.type === 'evaluation';

            return (
              <div
                key={notif.id}
                onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
                className={`p-5 rounded-2xl border transition-all ${
                  isFav
                    ? 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 border-2 border-[#C5A059] shadow-md shadow-amber-900/5'
                    : notif.isRead
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isFav
                      ? 'bg-gradient-to-br from-[#FFE082] via-[#C5A059] to-[#8C6D23] text-slate-950 font-bold shadow-md shadow-amber-950/20'
                      : isEvaluation
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#046A38]/10 text-[#046A38]'
                  }`}>
                    {isFav ? (
                      <Crown className="w-5 h-5 text-slate-950 fill-amber-950/20" />
                    ) : isEvaluation ? (
                      <Award className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isFav && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C5A059] text-slate-950 border border-amber-300 flex items-center gap-1 shadow-2xs">
                            <Crown className="w-3 h-3" />
                            حلقة الشيخ المفضل 🌟
                          </span>
                        )}
                        <h4 className={`text-sm font-bold ${isFav ? 'text-amber-950 font-serif' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" title="غير مقروء" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{notif.time}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.body}
                    </p>

                    {/* Quick action if halqa/meet link */}
                    {isFav && (
                      <div className="pt-2.5 mt-2 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                          <span>المقرئ المجاز:</span>
                          <strong className="text-[#046A38]">{notif.sheikhName || favoriteSheikh}</strong>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notif.id);
                            if (notif.meetUrl) {
                              window.open(notif.meetUrl, '_blank');
                            } else if (onJoinHalqa) {
                              onJoinHalqa(notif.halqaId, notif.meetUrl);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#C5A059] via-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-slate-950" />
                          <span>دخول حلقة التسميع الآن 📖</span>
                          <ExternalLink className="w-3 h-3 text-slate-950" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
