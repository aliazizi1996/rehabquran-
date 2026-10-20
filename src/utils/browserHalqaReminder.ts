import { Halqa } from '../types';
import { playSpiritualReminderChime, addInAppNotification } from '../data/wirdNotificationStore';

const REMINDER_STORAGE_KEY = 'rehab_quran_halqa_reminders_enabled_v1';
const NOTIFIED_CACHE_KEY = 'rehab_quran_halqas_notified_today_v1';

export type BrowserNotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Checks if the browser supports the Web Notification API
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission status safely
 */
export function getBrowserNotificationPermission(): BrowserNotificationStatus {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    return Notification.permission as BrowserNotificationStatus;
  } catch (e) {
    return 'unsupported';
  }
}

/**
 * Request notification permission from user
 */
export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationStatus> {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as BrowserNotificationStatus;
  } catch (e) {
    console.warn('Notification permission request error:', e);
    return getBrowserNotificationPermission();
  }
}

/**
 * Check if the user enabled halqa reminders preference
 */
export function isHalqaRemindersEnabled(): boolean {
  try {
    const val = localStorage.getItem(REMINDER_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Save user preference for halqa reminders
 */
export function setHalqaRemindersEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, String(enabled));
  } catch (e) {
    console.error('Failed to save reminder toggle:', e);
  }
}

/**
 * Arabic days mapping to JavaScript Day Index (0 = Sunday ... 6 = Saturday)
 */
const ARABIC_DAYS_MAP: Record<string, number> = {
  'الأحد': 0,
  'الاحد': 0,
  'الإثنين': 1,
  'الاثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3,
  'الاربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6,
};

/**
 * Checks if today matches the scheduled days of the Halqa
 */
export function isHalqaScheduledToday(days?: string[]): boolean {
  if (!days || days.length === 0) return true; // Daily if unspecified
  const todayIdx = new Date().getDay();
  return days.some((d) => {
    const cleanDay = d.trim();
    return ARABIC_DAYS_MAP[cleanDay] === todayIdx;
  });
}

/**
 * Extracts 24h hour and minute from a schedule time string.
 * Examples:
 * - "05:00 ص - 06:30 ص" -> { hour: 5, minute: 0 }
 * - "16:30 م - بعد العصر" -> { hour: 16, minute: 30 }
 * - "08:00 م" -> { hour: 20, minute: 0 }
 * - "20:30" -> { hour: 20, minute: 30 }
 */
export function parseHalqaStartTime(timeStr: string): { hour: number; minute: number } | null {
  if (!timeStr) return null;

  // Extract first time segment e.g. "05:00 ص" or "16:30"
  const firstSegment = timeStr.split('-')[0].trim();
  const match = firstSegment.match(/(\d{1,2}):(\d{2})\s*(ص|م|am|pm)?/i);

  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3] ? match[3].toLowerCase() : '';

  if (period === 'م' || period === 'pm') {
    if (hour < 12) hour += 12;
  } else if (period === 'ص' || period === 'am') {
    if (hour === 12) hour = 0;
  }

  return { hour, minute };
}

/**
 * Calculates remaining minutes until the halqa starts today.
 * Returns null if not scheduled today or already passed by more than 15 mins.
 */
export function getMinutesUntilHalqa(halqa: Halqa): number | null {
  if (!isHalqaScheduledToday(halqa.days)) return null;

  const parsed = parseHalqaStartTime(halqa.scheduleTime);
  if (!parsed) return null;

  const now = new Date();
  const sessionDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parsed.hour, parsed.minute, 0);

  const diffMs = sessionDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  return diffMinutes;
}

/**
 * Helper to record that a halqa was notified today
 */
function getTodayNotifiedMap(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markHalqaNotifiedToday(halqaId: string): void {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const map = getTodayNotifiedMap();
    map[halqaId] = todayStr;
    sessionStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to mark halqa as notified:', e);
  }
}

export function hasHalqaBeenNotifiedToday(halqaId: string): boolean {
  const todayStr = new Date().toISOString().split('T')[0];
  const map = getTodayNotifiedMap();
  return map[halqaId] === todayStr;
}

/**
 * Triggers both native Web Notification and in-app Notification Banner
 */
export function triggerHalqaReminder(
  halqa: Halqa, 
  minutesRemaining = 15,
  isTest = false
): void {
  const title = `تذكير بموعد حلقة القرآن 📖 (${minutesRemaining} دقيقة)`;
  const body = `تبدأ حلقة "${halqa.title}" بعد ${minutesRemaining} دقيقة بقيادة ${halqa.sheikhName}. استعد للحضور والتسميع!`;

  // 1. Native Web Notification (if permission granted and supported)
  if (isBrowserNotificationSupported() && getBrowserNotificationPermission() === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/brand/official-logo-small.png',
        badge: '/brand/official-seal.png',
        tag: `halqa-reminder-${halqa.id}`,
        dir: 'rtl',
        lang: 'ar',
      });

      notification.onclick = () => {
        window.focus();
        if (halqa.meetUrl || halqa.roomUrl) {
          window.open(halqa.meetUrl || halqa.roomUrl, '_blank');
        }
        notification.close();
      };
    } catch (err) {
      console.warn('Native notification failed (possibly sandboxed iframe):', err);
    }
  }

  // 2. Play gentle spiritual chime
  playSpiritualReminderChime();

  // 3. In-App Notification Banner event
  window.dispatchEvent(
    new CustomEvent('rehab_show_user_notification_banner', {
      detail: {
        id: `halqa-remind-${halqa.id}-${Date.now()}`,
        type: 'halqa_reminder',
        title: `تذكير بموعد الحلقة القادمة (خلال ${minutesRemaining} دقيقة) 🔔`,
        message: `حلقة: ${halqa.title} — التوقيت: ${halqa.scheduleTime}. استعد للتسميع مع الشيخ!`,
        sheikhName: halqa.sheikhName,
        timestamp: 'الآن',
        createdAtMs: Date.now(),
        halqaId: halqa.id,
        meetUrl: halqa.meetUrl || halqa.roomUrl,
        minutesRemaining,
      },
    })
  );

  // 4. Save to persistent in-app notifications store
  addInAppNotification({
    title,
    body,
    time: 'الآن',
    type: 'system',
    isRead: false,
  });

  if (!isTest) {
    markHalqaNotifiedToday(halqa.id);
  }
}

/**
 * Checks all enrolled halqas for an upcoming session in ~15 minutes (between 1 and 15 mins)
 */
export function checkEnrolledHalqaReminders(
  enrolledHalqaIds: string[], 
  allHalqas: Halqa[]
): Halqa | null {
  if (!isHalqaRemindersEnabled()) return null;
  if (!enrolledHalqaIds || enrolledHalqaIds.length === 0) return null;

  for (const halqaId of enrolledHalqaIds) {
    const halqa = allHalqas.find((h) => h.id === halqaId);
    if (!halqa) continue;

    // Check if already notified today
    if (hasHalqaBeenNotifiedToday(halqa.id)) continue;

    const minutes = getMinutesUntilHalqa(halqa);
    if (minutes !== null && minutes >= 1 && minutes <= 15) {
      triggerHalqaReminder(halqa, minutes, false);
      return halqa;
    }
  }

  return null;
}
