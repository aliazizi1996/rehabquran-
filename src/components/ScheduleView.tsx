import React from 'react';
import { 
  Calendar, Clock, Radio, Users, Volume2, ArrowLeft, 
  CheckCircle2, Bell, Sparkles, Video, PlayCircle, ExternalLink
} from 'lucide-react';
import { DailySession, Halqa } from '../types';

interface ScheduleViewProps {
  sessions: DailySession[];
  halawat: Halqa[];
  onJoinLiveSession: (session: DailySession) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  sessions,
  halawat,
  onJoinLiveSession,
}) => {
  const getPeriodLabel = (period: DailySession['period']) => {
    switch (period) {
      case 'fajr':
        return { label: 'فترة الفجر', color: 'text-amber-300 bg-amber-950/40 border-amber-900/50' };
      case 'duha':
        return { label: 'فترة الضحى', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-900/50' };
      case 'asr':
        return { label: 'فترة العصر', color: 'text-sky-300 bg-sky-950/40 border-sky-900/50' };
      case 'maghrib':
        return { label: 'فترة المغرب', color: 'text-orange-300 bg-orange-950/40 border-orange-900/50' };
      case 'isha':
        return { label: 'فترة العشاء', color: 'text-indigo-300 bg-indigo-950/40 border-indigo-900/50' };
    }
  };

  const liveSession = sessions.find((s) => s.status === 'live');
  const [reminderNotif, setReminderNotif] = React.useState<string | null>(null);

  const handleSetReminder = (sessionTitle: string) => {
    setReminderNotif(`تم ضبط تذكير بحلقة: ${sessionTitle} قبل موعدها بـ 15 دقيقة بنجاح.`);
    setTimeout(() => setReminderNotif(null), 3500);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Reminder Alert */}
      {reminderNotif && (
        <div className="p-3 rounded-xl bg-emerald-900/90 border border-emerald-500 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reminderNotif}</span>
          </div>
          <button 
            onClick={() => setReminderNotif(null)}
            className="text-slate-300 hover:text-white text-xs cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Schedule Top Header */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>جدول حلقات اليوم</span>
          </div>
          <h2 className="text-base font-bold text-white">مواعيد الحلقات والمقارئ اليومية</h2>
          <p className="text-xs text-slate-400">توقيت مكة المكرمة • جلسات تفاعلية حية عبر الميكروفون</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-800 flex items-center justify-center text-emerald-400">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Featured Live Halqa Card */}
      {liveSession && (
        <div className="group relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950 via-[#10291d] to-[#173827] border-2 border-emerald-500/80 hover:border-emerald-400 shadow-xl shadow-emerald-950/60 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
          <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
            <span className="flex items-center gap-2 text-xs font-bold text-red-300 bg-red-950/90 px-3 py-1 rounded-full border border-red-800/80 shadow-xs animate-soft-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Radio className="w-3.5 h-3.5" />
              حلقة منعقدة الآن ومباشرة
            </span>
            <span className="text-xs text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-lg border border-emerald-800">
              {liveSession.attendeesCount} طالب متواجد
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white mb-1.5 group-hover:text-emerald-200 transition-colors relative z-10">
            {liveSession.title}
          </h3>

          <p className="text-xs text-emerald-300/90 font-medium mb-3 relative z-10">
            المشرف: {liveSession.sheikhName}
          </p>

          {liveSession.currentReader && (
            <div className="bg-[#091710]/90 p-2.5 rounded-xl border border-emerald-800/50 flex items-center gap-2 mb-3 text-xs relative z-10">
              <Volume2 className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
              <div className="overflow-hidden">
                <span className="text-slate-400 text-[11px]">يتلو الآن: </span>
                <span className="text-amber-200 font-semibold">{liveSession.currentReader}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 relative z-10">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {liveSession.timeSlot}
            </span>

            <div className="flex items-center gap-2">
              {liveSession.meetUrl && (
                <a
                  href={liveSession.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Video className="w-4 h-4 text-slate-950" />
                  <span>Google Meet مباشر</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              )}

              <button
                onClick={() => onJoinLiveSession(liveSession)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                دخول قاعة المقرأة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Timeline List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 px-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          جلسات المقرأة على مدار اليوم
        </h3>

        {sessions.map((session) => {
          const periodInfo = getPeriodLabel(session.period);
          const isLive = session.status === 'live';

          return (
            <div
              key={session.id}
              className={`p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 hover:-translate-y-1 hover:shadow-md cursor-pointer ${
                isLive
                  ? 'bg-[#0f2a1d] border-emerald-500/80 shadow-md shadow-emerald-950/40 hover:border-emerald-400'
                  : 'bg-[#0e2118]/80 border-emerald-950 hover:border-emerald-800/80 hover:bg-[#11271d]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Time Slot column */}
                <div className="text-center min-w-[65px] border-l border-emerald-900/60 pl-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border block mb-1 ${periodInfo.color}`}>
                    {periodInfo.label}
                  </span>
                  <span className="text-xs font-bold text-white block">{session.timeSlot.split(' - ')[0]}</span>
                </div>

                {/* Session Details */}
                <div>
                  <h4 className="font-bold text-xs text-white mb-0.5 line-clamp-1">{session.title}</h4>
                  <p className="text-[11px] text-slate-300">{session.sheikhName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {session.attendeesCount} طالب
                    </span>
                    {isLive && (
                      <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                        جارية الآن
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2">
                {session.meetUrl && (
                  <a
                    href={session.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-[#091e14] hover:bg-[#103322] border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    title="انضمام فوري عبر Google Meet"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Google Meet</span>
                  </a>
                )}

                {isLive ? (
                  <button
                    onClick={() => onJoinLiveSession(session)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    دخول
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetReminder(session.title)}
                    className="p-2 rounded-lg bg-[#091710] border border-emerald-950 text-slate-400 hover:text-amber-300 hover:border-emerald-800 transition-all cursor-pointer"
                    title="تفعيل التنبيه لهذه الجلسة"
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card regarding real microphone and Android native feature note */}
      <div className="p-3.5 rounded-xl bg-[#0a1811] border border-emerald-900/40 text-xs text-slate-300 flex items-start gap-2.5">
        <Video className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">تعليمات الغرفة الصوتية: </strong>
          تستخدم قاعة المقرأة ميكروفون الهاتف المدمج عالي الدقة. يُرجى استخدام سماعة الأذن لضمان نقاء الصوت وتجنب الصدى أثناء التسميع للشيخ.
        </p>
      </div>
    </div>
  );
};
