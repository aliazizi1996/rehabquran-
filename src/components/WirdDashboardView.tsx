import React, { useState, useEffect, useId } from 'react';
import { 
  BookmarkCheck, Flame, Plus, Minus, Check, Sparkles, 
  BookOpen, Award, CheckCircle2, ChevronRight, PenLine, Heart,
  Bell, BellRing, Clock, Volume2, Play
} from 'lucide-react';
import { UserProfile, WirdRecord, WirdReminderSettings } from '../types';
import { 
  getWirdReminderSettings, 
  saveWirdReminderSettings, 
  WIRD_TIME_PRESETS, 
  playSpiritualReminderChime 
} from '../data/wirdNotificationStore';

interface WirdDashboardViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenReminderModal?: () => void;
}

export const WirdDashboardView: React.FC<WirdDashboardViewProps> = ({
  user,
  onUpdateUser,
  onOpenReminderModal,
}) => {
  const customWirdTimeId = useId();
  const [todayPages, setTodayPages] = useState<number>(3);
  const [targetPages, setTargetPages] = useState<number>(user.dailyTargetPages || 4);
  const [reflectionNote, setReflectionNote] = useState<string>('تأملت اليوم في سورة النبأ قوله تعالى: ﴿وَجَعَلْنَا نَوْمَكُمْ سُبَاتاً﴾ ونعمة السكينة والراحة.');
  const [showNoteSaved, setShowNoteSaved] = useState<boolean>(false);
  
  // Reminder settings state
  const [reminderSettings, setReminderSettings] = useState<WirdReminderSettings>(() => getWirdReminderSettings());
  const [reminderSavedMsg, setReminderSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => setReminderSettings(getWirdReminderSettings());
    window.addEventListener('rehab_wird_settings_updated', handleUpdate);
    return () => window.removeEventListener('rehab_wird_settings_updated', handleUpdate);
  }, []);

  const isCompleted = todayPages >= targetPages;
  const completionPercentage = Math.min(100, Math.round((todayPages / targetPages) * 100));

  // Estimated letters in 1 page ~ 5,000 letters * 10 = 50,000 Hasanat per page
  const estimatedHasanat = todayPages * 50000;

  const showReminderNotice = (msg: string) => {
    setReminderSavedMsg(msg);
    setTimeout(() => setReminderSavedMsg((curr) => (curr === msg ? null : curr)), 3000);
  };

  const handleToggleReminder = () => {
    const nextVal = !reminderSettings.enabled;
    const updated = saveWirdReminderSettings({ enabled: nextVal });
    setReminderSettings(updated);
    showReminderNotice(nextVal ? 'تم تفعيل التذكير اليومي بموعد الورد' : 'تم إيقاف التذكير اليومي');
  };

  const handleSelectPreset = (presetId: string, defaultTime: string, label: string) => {
    const updated = saveWirdReminderSettings({
      preset: presetId as any,
      time: defaultTime,
      presetLabel: label
    });
    setReminderSettings(updated);
    showReminderNotice(`تم ضبط موعد التذكير: ${label} (${defaultTime})`);
  };

  const handleCustomTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeVal = e.target.value;
    const updated = saveWirdReminderSettings({
      time: timeVal,
      preset: 'custom',
      presetLabel: `توقيت مخصص (${timeVal})`
    });
    setReminderSettings(updated);
  };

  const handleTestChime = () => {
    playSpiritualReminderChime();
    showReminderNotice('تم تشغيل رنين التذكير الإيماني 🔔');
  };

  // Toggle a Juz in the 30 Juz tree
  const toggleJuz = (juzNumber: number) => {
    const currentMemorized = [...user.memorizedJuzs];
    const index = currentMemorized.indexOf(juzNumber);
    if (index >= 0) {
      currentMemorized.splice(index, 1);
    } else {
      currentMemorized.push(juzNumber);
      currentMemorized.sort((a, b) => a - b);
    }
    onUpdateUser({ memorizedJuzs: currentMemorized });
  };

  const handleIncrement = () => setTodayPages((p) => p + 1);
  const handleDecrement = () => setTodayPages((p) => Math.max(0, p - 1));

  const handleSaveNote = () => {
    setShowNoteSaved(true);
    setTimeout(() => setShowNoteSaved(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Wird Header Overview */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-[#0e271a] to-[#123121] border border-emerald-800/60 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4" />
            لوحة ورد القرآن الكريم اليومي
          </span>
          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{user.streakDays} يوماً متواصلاً</span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-1">
          {isCompleted ? 'هنيئاً لك! أتممت وردك اليومي بنجاح' : 'واصل تلاوة كتاب الله ونور قلبك'}
        </h2>
        <p className="text-xs text-emerald-200/80 leading-relaxed">
          «خيركم من تعلم القرآن وعلمه» • لا تدع يومك يمضي دون نصيب من كلام رب العالمين.
        </p>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-300">{todayPages} من أصل {targetPages} صفحات</span>
            <span className="text-amber-300">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-900">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Increment Counter */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-900/60">
          <span className="text-xs text-slate-300">تسجيل الصفحات المقروءة:</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 rounded-lg bg-[#08170f] border border-emerald-900 text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="إنقاص صفحة"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-white min-w-[24px] text-center font-mono">
              {todayPages}
            </span>
            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-950"
              title="زيادة صفحة"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Wird In-App Reminder Config Card (نظام إشعارات وتذكير الورد اليومي) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2719] via-[#0f2d1d] to-[#0a1e14] border-2 border-amber-500/50 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>تذكير موعد ورد القرآن اليومي المخصص</span>
              </h3>
              <p className="text-[11px] text-emerald-200/80">
                إشعار داخلي ينبهك في الوقت الذي تحدده لعدم فوات الورد
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleReminder}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              reminderSettings.enabled ? 'bg-amber-400' : 'bg-emerald-950 border border-emerald-800'
            }`}
            title={reminderSettings.enabled ? 'إيقاف التنبيه' : 'تشغيل التنبيه'}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-slate-950 transition-all ${
                reminderSettings.enabled ? 'left-0.5' : 'right-0.5 bg-slate-400'
              }`}
            />
          </button>
        </div>

        {/* Notice feedback */}
        {reminderSavedMsg && (
          <div className="p-2 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{reminderSavedMsg}</span>
          </div>
        )}

        {/* Reminder Options */}
        {reminderSettings.enabled && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>اختر التوقيت المفضل لوردك:</span>
              <span className="text-amber-300 font-bold">
                المعتمد: {reminderSettings.time} ({reminderSettings.presetLabel})
              </span>
            </div>

            {/* Presets Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {WIRD_TIME_PRESETS.map((p) => {
                const isSelected = reminderSettings.preset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id, p.time, p.label)}
                    className={`py-1.5 px-2 rounded-xl text-right text-[11px] border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-[#06150d] text-slate-300 border-emerald-900 hover:border-emerald-700'
                    }`}
                  >
                    <span className="truncate">{p.label.split(' ')[0]} {p.label.split(' ')[1] || ''}</span>
                    <span className="font-mono text-[10px] ml-1">{p.time}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Time and Sound Test */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-900/60">
              <div className="flex items-center gap-2">
                <label htmlFor={customWirdTimeId} className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>توقيت دقيق:</span>
                </label>
                <input
                  id={customWirdTimeId}
                  type="time"
                  value={reminderSettings.time}
                  onChange={handleCustomTime}
                  className="bg-[#06150d] border border-emerald-700 text-amber-300 font-mono text-xs px-2 py-1 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleTestChime}
                  className="px-2.5 py-1 rounded-lg bg-[#0a2015] hover:bg-[#0e2c1c] border border-emerald-700 text-[11px] font-bold text-amber-300 flex items-center gap-1 transition-all cursor-pointer"
                  title="تجربة رنين التنبيه"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>تجربة الصوت</span>
                </button>

                {onOpenReminderModal && (
                  <button
                    onClick={onOpenReminderModal}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    المزيد من الإعدادات
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Row: Estimated Hasanat & Memorization Ratio */}
      <div className="grid grid-cols-2 gap-3">
        {/* Hasanat Metric */}
        <div className="p-3.5 rounded-2xl bg-[#0e2118] border border-emerald-900/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>الحسنات التقديرية</span>
          </div>
          <div className="text-xl font-bold font-mono text-white tracking-tight my-1">
            +{estimatedHasanat.toLocaleString('ar-SA')}
          </div>
          <p className="text-[10px] text-slate-400">
            «الحرف بحسنة، والحسنة بعشر أمثالها»
          </p>
        </div>

        {/* Memorization Progress */}
        <div className="p-3.5 rounded-2xl bg-[#0e2118] border border-emerald-900/60 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold mb-1">
            <Award className="w-4 h-4" />
            <span>إجمالي الحفظ</span>
          </div>
          <div className="text-xl font-bold font-mono text-white tracking-tight my-1">
            {user.memorizedJuzs.length} <span className="text-xs text-slate-400 font-normal">/ 30 جزءاً</span>
          </div>
          <p className="text-[10px] text-emerald-400 font-semibold">
            {Math.round((user.memorizedJuzs.length / 30) * 100)}% من المصحف الشريف
          </p>
        </div>
      </div>

      {/* 30 Juz Quran Tree (شجرة حفظ القرآن الكريم) */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              شجرة حفظ أجزاء القرآن الكريم (30 جزءاً)
            </h3>
            <p className="text-[11px] text-slate-400">انقر على رقم الجزء لتبديل حالة حفظه وتثبيته</p>
          </div>
          <span className="text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {user.memorizedJuzs.length} أجزاء متقنة
          </span>
        </div>

        {/* 30-Juz Interactive Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const isMemorized = user.memorizedJuzs.includes(juzNum);

            return (
              <button
                key={juzNum}
                onClick={() => toggleJuz(juzNum)}
                className={`py-2.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isMemorized
                    ? 'bg-gradient-to-b from-emerald-600 to-teal-700 text-white border-emerald-400/60 shadow-sm shadow-emerald-950 font-bold'
                    : 'bg-[#091710] text-slate-400 border-emerald-950 hover:border-emerald-800/80 hover:text-slate-200'
                }`}
                title={`الجزء ${juzNum}: ${isMemorized ? 'تم حفظه وتثبيته' : 'انقر لتحديد الحفظ'}`}
              >
                <span className="text-xs font-mono">{juzNum}</span>
                <span className="text-[9px] mt-0.5 truncate max-w-[50px]">
                  {isMemorized ? 'متقن ✓' : 'جزء'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400 border-t border-emerald-950">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 border border-emerald-400 inline-block"></span>
            <span>أجزاء محفوظة ومثبتة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#091710] border border-emerald-950 inline-block"></span>
            <span>أجزاء قيد الحفظ</span>
          </div>
        </div>
      </div>

      {/* Daily Quran Reflection Notes */}
      <div className="p-4 rounded-2xl bg-[#0e2118] border border-emerald-900/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <PenLine className="w-3.5 h-3.5 text-amber-400" />
            تدبرات وفوائد ورد اليوم
          </h4>
          {showNoteSaved && (
            <span className="text-[10px] text-emerald-400 font-bold animate-fade-in flex items-center gap-1">
              <Check className="w-3 h-3" />
              تم حفظ التدبر
            </span>
          )}
        </div>

        <textarea
          rows={2}
          value={reflectionNote}
          onChange={(e) => setReflectionNote(e.target.value)}
          placeholder="سجّل آية استوقفتك أو فائدة إيمانية تدبرتها أثناء وردك اليوم..."
          className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-950 text-xs text-white focus:outline-none focus:border-emerald-600 font-amiri text-sm leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            onClick={handleSaveNote}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            حفظ الفائدة
          </button>
        </div>
      </div>
    </div>
  );
};
