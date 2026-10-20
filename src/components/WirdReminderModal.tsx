import React, { useState, useEffect, useId } from 'react';
import { 
  Bell, BellRing, Clock, Sparkles, Volume2, Check, 
  X, CheckCircle2, BookmarkCheck, BookOpen, AlertCircle,
  VolumeX, Settings, Send, Calendar, Play
} from 'lucide-react';
import { 
  getWirdReminderSettings, 
  saveWirdReminderSettings, 
  WIRD_TIME_PRESETS, 
  playSpiritualReminderChime,
  getInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addInAppNotification
} from '../data/wirdNotificationStore';
import { WirdReminderSettings, InAppNotification } from '../types';

interface WirdReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWirdDashboard?: () => void;
}

export const WirdReminderModal: React.FC<WirdReminderModalProps> = ({
  isOpen,
  onClose,
  onOpenWirdDashboard
}) => {
  const customTimeId = useId();
  const pagesTargetId = useId();
  const [activeSubTab, setActiveSubTab] = useState<'settings' | 'notifications'>('settings');
  const [settings, setSettings] = useState<WirdReminderSettings>(() => getWirdReminderSettings());
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => getInAppNotifications());
  const [hasTestedChime, setHasTestedChime] = useState<boolean>(false);
  const [browserPermStatus, setBrowserPermStatus] = useState<string>('default');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getWirdReminderSettings());
      setNotifications(getInAppNotifications());
    };
    window.addEventListener('rehab_wird_settings_updated', handleUpdate);
    window.addEventListener('rehab_notifications_updated', handleUpdate);
    return () => {
      window.removeEventListener('rehab_wird_settings_updated', handleUpdate);
      window.removeEventListener('rehab_notifications_updated', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    const nextVal = !settings.enabled;
    const updated = saveWirdReminderSettings({ enabled: nextVal });
    setSettings(updated);
    showNotice(nextVal ? 'تم تفعيل منبه ورد القرآن اليومي بنجاح.' : 'تم إيقاف تفعيل التنبيه.');
  };

  const handleSelectPreset = (presetId: string, defaultTime: string, label: string) => {
    const updated = saveWirdReminderSettings({
      preset: presetId as any,
      time: defaultTime,
      presetLabel: label
    });
    setSettings(updated);
    showNotice(`تم ضبط موعد الورد على: ${label} (${defaultTime})`);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    const updated = saveWirdReminderSettings({
      time: newTime,
      preset: 'custom',
      presetLabel: `توقيت مخصص (${newTime})`
    });
    setSettings(updated);
  };

  const handleToggleSound = () => {
    const nextVal = !settings.soundEnabled;
    const updated = saveWirdReminderSettings({ soundEnabled: nextVal });
    setSettings(updated);
    if (nextVal) {
      playSpiritualReminderChime();
    }
  };

  const handleTestChime = () => {
    playSpiritualReminderChime();
    setHasTestedChime(true);
    setTimeout(() => setHasTestedChime(false), 2000);
  };

  const handleRequestBrowserPerm = async () => {
    if (!('Notification' in window)) {
      alert('متصفحك الحالي لا يدعم إشعارات النظام، سيتم التنبيه داخل التطبيق دائماً.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermStatus(perm);
      if (perm === 'granted') {
        saveWirdReminderSettings({ browserNotificationEnabled: true });
        new Notification('مقرأة رحاب القرآن الإلكترونية', {
          body: 'تم تفعيل التنبيه بنجاح! سنذكرك بموعد وردك اليومي المبارك.',
          icon: '/favicon.ico'
        });
        showNotice('تم منح إذن الإشعارات بنجاح!');
      } else {
        showNotice('لم يتم منح الإذن، سيستمر التنبيه داخل واجهة التطبيق.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateActiveReminderNow = () => {
    playSpiritualReminderChime();
    addInAppNotification({
      title: 'حان موعد وردك القرآني المبارك 📖',
      body: `تذكير: موعد قراءة ورد اليوم (${settings.targetPages} صفحات). «اقرأوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه».`,
      time: 'الآن',
      type: 'wird_reminder',
      isRead: false
    });
    // Also trigger system notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('مقرأة رحاب القرآن - حان موعد وردك اليومي 📖', {
          body: `تذكير بموعد قراءة ${settings.targetPages} صفحات من كتاب الله تعالى.`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        // ignore
      }
    }
    showNotice('تم إرسال تنبيه تجريبي وتشغيل النغمة الإيمانية بنجاح!');
  };

  const showNotice = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg((curr) => (curr === msg ? null : curr)), 3500);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a1e14] border-2 border-emerald-600/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d2a1c] via-[#103825] to-[#0b2116] border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تنبيهات ورد القرآن والذاكرين</span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                ضبط موعد تذكيرك اليومي بقراءة وردك المخصص من كتاب الله
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Toast */}
        {savedSuccessMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* Sub Navigation Tabs */}
        <div className="flex items-center px-4 pt-3 border-b border-emerald-900/80 gap-2">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'settings'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إعدادات التوقيت والتنبيه</span>
          </button>

          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'notifications'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>مركز الإشعارات</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {activeSubTab === 'settings' && (
            <div className="space-y-4">
              
              {/* Enable / Disable Master Toggle */}
              <div className="p-4 rounded-2xl bg-[#0e271a] border border-emerald-700/60 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>تفعيل المنبه اليومي لورد القرآن</span>
                  </span>
                  <p className="text-[11px] text-emerald-200/80">
                    تذكير يومي في التوقيت المناسب لك لعدم تفويت وردك
                  </p>
                </div>

                <button
                  onClick={handleToggleEnabled}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                    settings.enabled ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-800'
                  }`}
                  title={settings.enabled ? 'إيقاف التنبيه' : 'تشغيل التنبيه'}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-slate-950 transition-all ${
                      settings.enabled ? 'left-1 bg-slate-950' : 'right-1 bg-slate-400'
                    }`}
                  />
                </button>
              </div>

              {/* Recommended Time Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>اختر التوقيت الأنسب لوردك اليومي:</span>
                  <span className="text-amber-300 font-normal text-[11px]">
                    المحدد حالياً: {settings.time} ({settings.presetLabel})
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {WIRD_TIME_PRESETS.map((preset) => {
                    const isSelected = settings.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id, preset.time, preset.label)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-bold'
                            : 'bg-[#06160e] text-slate-300 border-emerald-900/80 hover:border-emerald-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{preset.icon}</span>
                          <span className={`text-xs font-mono font-bold ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                            {preset.time}
                          </span>
                        </div>
                        <p className="text-xs font-bold mt-1 line-clamp-1">{preset.label}</p>
                        <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Time Selector */}
              <div className="p-3.5 rounded-2xl bg-[#06160e] border border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label htmlFor={customTimeId} className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>تحديد وقت مخصص بالدقيقة:</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    اضبط الساعة والدقيقة بحسب فراغك وظروفك
                  </p>
                </div>

                <input
                  id={customTimeId}
                  type="time"
                  value={settings.time}
                  onChange={handleCustomTimeChange}
                  className="bg-[#0b2417] border border-emerald-700 text-amber-300 font-mono text-sm px-3 py-1.5 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Target Pages Setting */}
              <div className="p-3.5 rounded-2xl bg-[#06160e] border border-emerald-900 flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor={pagesTargetId} className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الهدف اليومي لعدد الصفحات:</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    يتم تذكيرك بالهدف المطلوب إتمامه
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id={pagesTargetId}
                    type="number"
                    min={1}
                    max={100}
                    value={settings.targetPages}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setSettings(saveWirdReminderSettings({ targetPages: val }));
                    }}
                    className="w-16 bg-[#0b2417] border border-emerald-700 text-white font-mono text-center text-sm py-1.5 rounded-xl"
                  />
                  <span className="text-xs text-slate-300">صفحات</span>
                </div>
              </div>

              {/* Sound and Test Chime Controls */}
              <div className="p-3.5 rounded-2xl bg-[#06160e] border border-emerald-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>نغمة التنبيه الإيمانية الهادئة</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      رنين هادئ سكينة ومريح ينبهك عند حلول الموعد
                    </p>
                  </div>

                  <button
                    onClick={handleToggleSound}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      settings.soundEnabled
                        ? 'bg-emerald-700 text-white border-emerald-500'
                        : 'bg-[#091f14] text-slate-400 border-emerald-950'
                    }`}
                    title={settings.soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
                  >
                    {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-950">
                  <button
                    onClick={handleTestChime}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0d2a1b] hover:bg-[#123825] border border-emerald-700 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{hasTestedChime ? 'تم تشغيل الرنين ✓' : 'استمع لتجربة نغمة التنبيه'}</span>
                  </button>

                  <button
                    onClick={handleSimulateActiveReminderNow}
                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>جرّب إشعار الورد الآن</span>
                  </button>
                </div>
              </div>

              {/* Browser / Device Notification Permission */}
              {'Notification' in window && (
                <div className="p-3.5 rounded-2xl bg-[#091b12] border border-emerald-800/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                      <span>إشعارات المتصفح والنظام المباشرة</span>
                    </span>
                    <p className="text-[11px] text-slate-300">
                      {browserPermStatus === 'granted'
                        ? 'إذن التنبيه مفعل بنجاح على جهازك ✅'
                        : 'فعّل الإذن لتصلك تنبيهات الورد حتى عندما يكون التطبيق في الخلفية.'}
                    </p>
                  </div>

                  {browserPermStatus !== 'granted' && (
                    <button
                      onClick={handleRequestBrowserPerm}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      تفعيل الإذن
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {activeSubTab === 'notifications' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-slate-300 font-bold">
                  سجل التنبيهات والرسائل الإيمانية ({notifications.length})
                </span>
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                  >
                    تمييز الكل كمقروء
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center bg-[#07170f] rounded-2xl border border-emerald-950 text-slate-400 text-xs">
                  لا توجد إشعارات حتى الآن.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markNotificationAsRead(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      item.isRead
                        ? 'bg-[#06150d] border-emerald-950 text-slate-300'
                        : 'bg-[#0d2719] border-emerald-600/70 text-white shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          <h4 className="font-bold text-xs text-amber-300">{item.title}</h4>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200">{item.body}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#07160e] border-t border-emerald-900 flex items-center justify-between gap-3">
          {onOpenWirdDashboard && (
            <button
              onClick={() => {
                onClose();
                onOpenWirdDashboard();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>الانتقال لمتابعة الورد اليومي ←</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all ml-auto cursor-pointer"
          >
            تم وحفظ الإعدادات
          </button>
        </div>

      </div>
    </div>
  );
};
