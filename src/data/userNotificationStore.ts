import { addInAppNotification } from './wirdNotificationStore';

export interface UserNotificationSettings {
  popupBannerEnabled: boolean;       // شريط منبثق علوي عند وصول التنبيهات
  sheikhMessagesEnabled: boolean;    // تنبيهات الرسائل وتوجيهات المشايخ
  recitationApprovalEnabled: boolean;// تنبيهات قبول واعتماد تصحيح التلاوة
  favoriteSheikhAlertsEnabled: boolean; // تنبيهات بدء حلقة الشيخ المفضل الذهبية
  soundEnabled: boolean;             // نغمة صوتية عند وصول تنبيه جديد
}

export interface UserAlertNotification {
  id: string;
  type: 'sheikh_message' | 'recitation_approved' | 'halqa_reminder' | 'favorite_sheikh_halqa_started';
  title: string;
  message: string;
  sheikhName: string;
  surahName?: string;
  score?: number;
  grade?: string;
  timestamp: string;
  createdAtMs: number;
  halqaId?: string;
  halqaTitle?: string;
  meetUrl?: string;
  minutesRemaining?: number;
  isFavoriteSheikh?: boolean;
}

const SETTINGS_STORAGE_KEY = 'rehab_user_notification_settings_v2';
const FAVORITE_SHEIKH_KEY = 'rehab_student_favorite_sheikh_v1';
export const DEFAULT_FAVORITE_SHEIKH = 'فضيلة الشيخ د. علي عزيزي';

export const AVAILABLE_SHUYOOKH = [
  { id: 'sheikh-ali', name: 'فضيلة الشيخ د. علي عزيزي', title: 'المشرف العام • مجاز بالقراءات العشر', defaultHalqa: 'حلقة الإتقان والروايات بالسند', icon: 'Crown' },
  { id: 'sheikh-abdulrahman', name: 'الشيخ عبد الرحمن السقاف', title: 'أستاذ القراءات والتجويد', defaultHalqa: 'حلقة الفجر لتصحيح التلاوة والتثبيت', icon: 'BookOpen' },
  { id: 'sheikha-om-moath', name: 'الشيخة أم معاذ القرشية', title: 'مجازة بالقراءات السبع (قسم الأخوات)', defaultHalqa: 'حلقة ترتيل الخاتمات بالسند', icon: 'Sparkles' },
  { id: 'sheikh-alhabishi', name: 'الشيخ محمد سعيد الحبيشي', title: 'عالية القراءات وأستاذ المخارج', defaultHalqa: 'حلقة التأسيس والأحكام العملية', icon: 'Award' },
];

export const getFavoriteSheikh = (): string => {
  if (typeof window === 'undefined') return DEFAULT_FAVORITE_SHEIKH;
  try {
    return localStorage.getItem(FAVORITE_SHEIKH_KEY) || DEFAULT_FAVORITE_SHEIKH;
  } catch {
    return DEFAULT_FAVORITE_SHEIKH;
  }
};

export const setFavoriteSheikh = (sheikhName: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITE_SHEIKH_KEY, sheikhName);
    window.dispatchEvent(new CustomEvent('rehab_favorite_sheikh_changed', { detail: { sheikhName } }));
  } catch (e) {
    console.error('Failed to set favorite sheikh', e);
  }
};

export const DEFAULT_USER_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  popupBannerEnabled: true,
  sheikhMessagesEnabled: true,
  recitationApprovalEnabled: true,
  favoriteSheikhAlertsEnabled: true,
  soundEnabled: true,
};

export const getUserNotificationSettings = (): UserNotificationSettings => {
  try {
    if (typeof window === 'undefined') return DEFAULT_USER_NOTIFICATION_SETTINGS;
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_USER_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse user notification settings', e);
  }
  return DEFAULT_USER_NOTIFICATION_SETTINGS;
};

export const saveUserNotificationSettings = (
  updates: Partial<UserNotificationSettings>
): UserNotificationSettings => {
  const current = getUserNotificationSettings();
  const next = { ...current, ...updates };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('rehab_user_notification_settings_updated', { detail: next }));
  } catch (e) {
    console.error('Failed to save user notification settings', e);
  }
  return next;
};

// Gentle spiritual chime for user notifications using Web Audio API
export const playNotificationChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // First bell note: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second sweet note: B5 (987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Third harmonizing resolve: E6 (1318.51 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.26);
    gain3.gain.setValueAtTime(0.18, now + 0.26);
    gain3.gain.exponentialRampToValueAtTime(0.0005, now + 0.95);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.26);
    osc3.stop(now + 0.95);
  } catch (e) {
    // Graceful fallback if autoplay restrictions apply
  }
};

/**
 * Triggers a notification popup when a sheikh sends a new message or note to the student
 */
export const triggerSheikhMessageNotification = (params: {
  sheikhName: string;
  studentName?: string;
  message: string;
  surahName?: string;
}): UserAlertNotification | null => {
  const settings = getUserNotificationSettings();

  const alert: UserAlertNotification = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'sheikh_message',
    title: `رسالة جديدة من الشيخ (${params.sheikhName}) ✉️`,
    message: params.message,
    sheikhName: params.sheikhName,
    surahName: params.surahName,
    timestamp: 'الآن',
    createdAtMs: Date.now(),
  };

  // Always log into in-app notification center
  addInAppNotification({
    title: alert.title,
    body: `${params.surahName ? `[${params.surahName}] ` : ''}${params.message}`,
    time: 'الآن',
    type: 'system',
    isRead: false,
  });

  // Check if user disabled sheikh messages or popup banner
  if (!settings.popupBannerEnabled || !settings.sheikhMessagesEnabled) {
    return null;
  }

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  window.dispatchEvent(
    new CustomEvent('rehab_show_user_notification_banner', { detail: alert })
  );

  return alert;
};

/**
 * Triggers a notification popup when recitation correction is approved and evaluated
 */
export const triggerRecitationApprovedNotification = (params: {
  sheikhName: string;
  studentName?: string;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  score: number;
  grade: string;
  feedback?: string;
}): UserAlertNotification | null => {
  const settings = getUserNotificationSettings();

  const feedbackSnippet = params.feedback ? ` • توجيه المعلم: "${params.feedback}"` : '';
  const message = `تم قبول واعتماد تلاوتك في ${params.surahName} (الآيات ${params.ayahStart}-${params.ayahEnd}) بنتيجة ${params.score}/100 [${params.grade}]${feedbackSnippet}`;

  const alert: UserAlertNotification = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'recitation_approved',
    title: `تم قبول تصحيح تلاوتك! ⭐ (${params.surahName})`,
    message,
    sheikhName: params.sheikhName,
    surahName: params.surahName,
    score: params.score,
    grade: params.grade,
    timestamp: 'الآن',
    createdAtMs: Date.now(),
  };

  // Always log into in-app notification center
  addInAppNotification({
    title: alert.title,
    body: message,
    time: 'الآن',
    type: 'evaluation',
    isRead: false,
  });

  // Check if user disabled recitation approvals or popup banner
  if (!settings.popupBannerEnabled || !settings.recitationApprovalEnabled) {
    return null;
  }

  if (settings.soundEnabled) {
    playNotificationChime();
  }

  window.dispatchEvent(
    new CustomEvent('rehab_show_user_notification_banner', { detail: alert })
  );

  return alert;
};

/**
 * Royal golden bell chime for favorite sheikh halqa notifications using Web Audio API
 */
export const playGoldenNotificationChime = (): void => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Harmonic Gold Chime: D5 (587.33), A5 (880.00), D6 (1174.66), F#6 (1479.98)
    const freqs = [587.33, 880.00, 1174.66, 1479.98];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18 / (idx + 1), now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });
  } catch (e) {
    // Autoplay policy fallback
  }
};

/**
 * Triggers the Royal Golden Notification when a recitation circle (حلقة التسميع) of the student's favorite sheikh starts
 */
export const triggerFavoriteSheikhHalqaNotification = (params?: {
  sheikhName?: string;
  halqaTitle?: string;
  meetUrl?: string;
  halqaId?: string;
  timeSlot?: string;
}): UserAlertNotification | null => {
  const settings = getUserNotificationSettings();
  const sheikh = params?.sheikhName || getFavoriteSheikh();
  const title = params?.halqaTitle || 'حلقة التسميع وتصحيح التلاوة بالسند';

  const alert: UserAlertNotification = {
    id: `golden-halqa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    type: 'favorite_sheikh_halqa_started',
    title: `بدأت حلقة شيخك المفضل الآن! 🌟 (${sheikh})`,
    message: `فضيلة ${sheikh} متاح الآن في [${title}]. انضم فوراً لتسميع وردك وتصحيح التلاوة بالسند.`,
    sheikhName: sheikh,
    halqaTitle: title,
    halqaId: params?.halqaId || 'live-halqa-fav',
    meetUrl: params?.meetUrl || 'https://meet.google.com/rq-quran-live',
    timestamp: 'الآن • مباشر',
    createdAtMs: Date.now(),
    isFavoriteSheikh: true,
  };

  // 1. Log into in-app notification center for persistent history
  addInAppNotification({
    title: alert.title,
    body: alert.message,
    time: 'الآن',
    type: 'favorite_sheikh',
    isRead: false,
    sheikhName: sheikh,
    halqaId: alert.halqaId,
    halqaTitle: title,
    meetUrl: alert.meetUrl,
    isFavoriteSheikh: true,
  });

  // 2. Play Golden Chime if sound enabled
  if (settings.soundEnabled) {
    playGoldenNotificationChime();
  }

  // 3. Dispatch Event for Golden Toast Banner
  if (settings.popupBannerEnabled && settings.favoriteSheikhAlertsEnabled) {
    window.dispatchEvent(
      new CustomEvent('rehab_show_user_notification_banner', { detail: alert })
    );
  }

  return alert;
};

/**
 * Checks if an upcoming or active halqa belongs to the favorite sheikh, and alerts once per session
 */
const notifiedHalqaSessionSet = new Set<string>();

export const notifyIfFavoriteSheikhHalqaLive = (params: {
  sheikhName: string;
  halqaTitle: string;
  halqaId: string;
  meetUrl?: string;
}): boolean => {
  const favSheikh = getFavoriteSheikh().trim().toLowerCase();
  const inputSheikh = params.sheikhName.trim().toLowerCase();

  const isMatch = favSheikh.includes(inputSheikh) || inputSheikh.includes(favSheikh);
  if (!isMatch) return false;

  const sessionKey = `${params.halqaId}-${new Date().toDateString()}`;
  if (notifiedHalqaSessionSet.has(sessionKey)) {
    return false; // Already notified in this session
  }

  notifiedHalqaSessionSet.add(sessionKey);
  triggerFavoriteSheikhHalqaNotification({
    sheikhName: params.sheikhName,
    halqaTitle: params.halqaTitle,
    halqaId: params.halqaId,
    meetUrl: params.meetUrl,
  });
  return true;
};

