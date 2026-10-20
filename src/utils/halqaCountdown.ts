/**
 * حاسبة موعد الحلقة القادمة والعداد التنازلي المباشر
 * تحسب الوقت المتبقي لحلقة الطالب وتتحقق من شرط تفعيل رابط Google Meet (قبل 10 دقائق)
 */

export interface HalqaNextTimeInfo {
  nextDate: Date;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isWithin10Minutes: boolean; // متاح قبل 10 دقائق أو أثناء وقت الحلقة
  isLiveNow: boolean;
  formattedTarget: string;
}

/**
 * حساب موعد الحلقة القادمة بناءً على النص أو الأيام
 */
export function calculateNextHalqaTime(scheduleStr?: string): HalqaNextTimeInfo {
  const now = new Date();
  
  // افتراضياً حلقة الفجر الساعة 05:30 صباحاً أو العصر 16:00
  let targetHour = 5;
  let targetMinute = 30;

  if (scheduleStr) {
    if (scheduleStr.includes('م') || scheduleStr.includes('عصر') || scheduleStr.includes('4:00') || scheduleStr.includes('16:00')) {
      targetHour = 16;
      targetMinute = 0;
    } else if (scheduleStr.includes('عشاء') || scheduleStr.includes('8:00') || scheduleStr.includes('20:00')) {
      targetHour = 20;
      targetMinute = 0;
    } else if (scheduleStr.includes('ص') || scheduleStr.includes('فجر') || scheduleStr.includes('5:30')) {
      targetHour = 5;
      targetMinute = 30;
    }
  }

  // البحث عن أقرب موعد قادم
  let nextSession = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMinute, 0);

  // إذا انقضت جلسة اليوم، ننتقل للغد
  if (now.getTime() > nextSession.getTime() + 90 * 60 * 1000) { // 90 mins session length
    nextSession.setDate(nextSession.getDate() + 1);
  }

  const diffMs = nextSession.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // شرط التفعيل: قبل 10 دقائق (600 ثانية) أو إذا بدأت الجلسة ولم تنته بعد
  const isWithin10Minutes = totalSeconds <= 600 && totalSeconds >= 0;
  const isLiveNow = now.getTime() >= nextSession.getTime() && now.getTime() <= nextSession.getTime() + 90 * 60 * 1000;

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const formattedTarget = `${dayNames[nextSession.getDay()]} الساعة ${targetHour > 12 ? targetHour - 12 : targetHour}:${targetMinute.toString().padStart(2, '0')} ${targetHour >= 12 ? 'مساءً' : 'صباحاً'}`;

  return {
    nextDate: nextSession,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isWithin10Minutes: isWithin10Minutes || isLiveNow,
    isLiveNow,
    formattedTarget,
  };
}
