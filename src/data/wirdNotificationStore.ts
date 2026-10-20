import { WirdReminderSettings, InAppNotification } from '../types';

const WIRD_REMINDER_KEY = 'rehab_quran_wird_reminder_settings_v1';
const IN_APP_NOTIFICATIONS_KEY = 'rehab_quran_in_app_notifications_v1';
const CONGRATULATIONS_STORAGE_KEY = 'rehab_quran_honor_congratulations_v1';

export const WIRD_TIME_PRESETS = [
  { id: 'fajr', time: '05:30', label: 'بعد صلاة الفجر (وقت البركة)', icon: '🌅', description: '«وقرآن الفجر إن قرآن الفجر كان مشهوداً»' },
  { id: 'duha', time: '09:30', label: 'وقت الضحى', icon: '☀️', description: 'ساعة صفاء وهدوء قبل مشاغل اليوم' },
  { id: 'asr', time: '16:30', label: 'بعد صلاة العصر', icon: '🌤️', description: 'استراحة إيمانية مباركة في المساء' },
  { id: 'maghrib', time: '18:45', label: 'بعد صلاة المغرب', icon: '🌆', description: 'بين المغرب والعشاء موعد التدبر' },
  { id: 'isha', time: '20:30', label: 'بعد صلاة العشاء', icon: '🌙', description: 'ختام اليوم بآيات الذكر الحكيم' },
  { id: 'custom', time: '06:00', label: 'توقيت مخصص', icon: '⏰', description: 'اضبط الساعة والدقيقة حسب جدولك' }
] as const;

export const DEFAULT_WIRD_SETTINGS: WirdReminderSettings = {
  enabled: true,
  time: '05:30',
  preset: 'fajr',
  presetLabel: 'بعد صلاة الفجر (وقت البركة)',
  soundEnabled: true,
  browserNotificationEnabled: false,
  targetPages: 4,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  lastNotifiedDate: ''
};

export const getWirdReminderSettings = (): WirdReminderSettings => {
  try {
    const raw = localStorage.getItem(WIRD_REMINDER_KEY);
    if (raw) {
      return { ...DEFAULT_WIRD_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to read wird reminder settings', e);
  }
  return DEFAULT_WIRD_SETTINGS;
};

export const saveWirdReminderSettings = (settings: Partial<WirdReminderSettings>): WirdReminderSettings => {
  const current = getWirdReminderSettings();
  const updated: WirdReminderSettings = { ...current, ...settings };
  try {
    localStorage.setItem(WIRD_REMINDER_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_wird_settings_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save wird reminder settings', e);
  }
  return updated;
};

// In-app notifications list
const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-welcome',
    title: 'مرحباً بك في مقرأة رحاب القرآن',
    body: 'تم تفعيل منبه ورد القرآن اليومي بنجاح، يمكنك تعديل التوقيت المناسب لك في أي وقت.',
    time: 'اليوم',
    type: 'system',
    isRead: false,
    timestamp: Date.now() - 3600000
  },
  {
    id: 'notif-honor',
    title: 'تحديث لوحة الشرف الأسبوعية 🏆',
    body: 'أُعلنت قائمة الطلاب المتفوقين الحاصلين على تقدير ممتاز هذا الأسبوع. تفقد لوحة الشرف وشاركهم التهنئة!',
    time: 'أمس',
    type: 'honor_board',
    isRead: false,
    timestamp: Date.now() - 86400000
  }
];

export const getInAppNotifications = (): InAppNotification[] => {
  try {
    const raw = localStorage.getItem(IN_APP_NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    }
  } catch (e) {
    console.error('Failed to load in-app notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
};

export const addInAppNotification = (notif: Omit<InAppNotification, 'id' | 'timestamp'>): InAppNotification => {
  const current = getInAppNotifications();
  const newNotif: InAppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now()
  };
  const updated = [newNotif, ...current].slice(0, 30); // Keep last 30
  try {
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_notifications_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save in-app notification', e);
  }
  return newNotif;
};

export const markNotificationAsRead = (id: string): void => {
  const current = getInAppNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  try {
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_notifications_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to update notification status', e);
  }
};

export const markAllNotificationsAsRead = (): void => {
  const current = getInAppNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  try {
    localStorage.setItem(IN_APP_NOTIFICATIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_notifications_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to mark all as read', e);
  }
};

// Play gentle spiritual chime using Web Audio API
export const playSpiritualReminderChime = (): void => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Peaceful arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.5Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      // Bell-like envelope
      const startTime = now + idx * 0.18;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
  } catch (e) {
    console.warn('Audio chime playback was blocked or unavailable', e);
  }
};

// Congratulations / Kudos store for the Honor Board
export const getHonorCongratulations = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(CONGRATULATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get congratulations', e);
  }
  return {
    'std-demo-1': 14,
    'std-demo-2': 19,
    'std-demo-3': 8,
    'std-demo-4': 12,
    'std-demo-5': 5
  };
};

export const addHonorCongratulation = (studentId: string): number => {
  const current = getHonorCongratulations();
  const nextVal = (current[studentId] || 0) + 1;
  const updated = { ...current, [studentId]: nextVal };
  try {
    localStorage.setItem(CONGRATULATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_honor_congrats_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save honor congratulation', e);
  }
  return nextVal;
};
