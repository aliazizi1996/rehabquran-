/**
 * pointsMedalsService.ts
 * نظام النقاط والميداليات والرتب القرآنية للطلاب
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MedalItem {
  id: string;
  title: string;
  description: string;
  category: 'tajweed' | 'surah' | 'attendance' | 'excellence' | 'sanad';
  icon: string; // e.g. 'Award', 'BookOpen', 'Sparkles', 'ShieldCheck', 'Trophy', 'Crown'
  pointsValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressCurrent: number;
  progressTarget: number;
  requirementText: string;
}

export interface PointActivityItem {
  id: string;
  title: string;
  points: number;
  type: 'tajweed_lesson' | 'surah_memorized' | 'recitation_attended' | 'assignment_completed' | 'medal_unlocked' | 'bonus';
  date: string;
  timestamp: number;
}

export interface StudentRankTier {
  tierNumber: number;
  title: string;
  badge: string;
  minPoints: number;
  maxPoints: number;
  colorHex: string;
}

export const STUDENT_RANKS: StudentRankTier[] = [
  {
    tierNumber: 1,
    title: 'طالب منضم ومثابر',
    badge: '🌱 مبتدئ متقن',
    minPoints: 0,
    maxPoints: 499,
    colorHex: '#046A38'
  },
  {
    tierNumber: 2,
    title: 'حافظ مجتهد',
    badge: '🌿 حافظ متدرج',
    minPoints: 500,
    maxPoints: 1199,
    colorHex: '#046A38'
  },
  {
    tierNumber: 3,
    title: 'متقن التلاوة والتجويد',
    badge: '⭐ متقن الأحكام',
    minPoints: 1200,
    maxPoints: 2499,
    colorHex: '#C5A059'
  },
  {
    tierNumber: 4,
    title: 'فارس المقرأة المتميز',
    badge: '🏆 فارس المقرأة',
    minPoints: 2500,
    maxPoints: 4999,
    colorHex: '#C5A059'
  },
  {
    tierNumber: 5,
    title: 'قارئ مسند وخاتم لكتاب الله',
    badge: '👑 قارئ مسند',
    minPoints: 5000,
    maxPoints: 10000,
    colorHex: '#C5A059'
  }
];

export interface StudentPointsProfile {
  studentId: string;
  studentName: string;
  totalPoints: number;
  currentRank: StudentRankTier;
  nextRank: StudentRankTier | null;
  progressToNextRankPercent: number;
  pointsToNextRank: number;
  streakDays: number;
  surahsMemorizedCount: number;
  tajweedLessonsCompletedCount: number;
  medals: MedalItem[];
  recentActivities: PointActivityItem[];
}

const LOCAL_STORAGE_POINTS_PREFIX = 'rehab_quran_points_profile_';

export const INITIAL_MEDALS_TEMPLATE: MedalItem[] = [
  {
    id: 'medal-first-tajweed',
    title: 'وسام البداية التجويدية',
    description: 'إتمام أول درس تجويدي بنجاح مع اجتياز الاختبار القصير.',
    category: 'tajweed',
    icon: 'Sparkles',
    pointsValue: 100,
    isUnlocked: true,
    unlockedAt: '2026-09-20',
    progressCurrent: 1,
    progressTarget: 1,
    requirementText: 'إتمام درس واحد من أحكام التجويد'
  },
  {
    id: 'medal-tajweed-knight',
    title: 'وسام فارس التجويد الذهبي',
    description: 'إتقان 3 دروس تجويدية بدرجة تفوق 90% مع ضبط المخارج.',
    category: 'tajweed',
    icon: 'Award',
    pointsValue: 200,
    isUnlocked: true,
    unlockedAt: '2026-09-28',
    progressCurrent: 3,
    progressTarget: 3,
    requirementText: 'إتمام 3 دروس تجويد بنسبة 90%+'
  },
  {
    id: 'medal-short-surahs',
    title: 'ميدالية قصار السور',
    description: 'إتمام حفظ 5 سور من قصار السور بإتقان ورواية صحيحة.',
    category: 'surah',
    icon: 'BookOpen',
    pointsValue: 250,
    isUnlocked: true,
    unlockedAt: '2026-09-25',
    progressCurrent: 5,
    progressTarget: 5,
    requirementText: 'حفظ 5 سور من القرآن الكريم'
  },
  {
    id: 'medal-attendance-star',
    title: 'ميدالية المواظبة والحضور',
    description: 'المواظبة على حضور 5 جلسات تسميع متتالية دون انقطاع.',
    category: 'attendance',
    icon: 'ShieldCheck',
    pointsValue: 200,
    isUnlocked: true,
    unlockedAt: '2026-10-01',
    progressCurrent: 5,
    progressTarget: 5,
    requirementText: 'حضور 5 جلسات تسميع متتابعة'
  },
  {
    id: 'medal-long-surahs',
    title: 'وسام السور العظيمة',
    description: 'إتمام حفظ سورة من السور المتوسطة أو الطوال (كالكهف، الرحمن، الملك، يس).',
    category: 'surah',
    icon: 'Trophy',
    pointsValue: 350,
    isUnlocked: false,
    progressCurrent: 2,
    progressTarget: 3,
    requirementText: 'حفظ 3 سور من السور المتوسطة أو الطوال'
  },
  {
    id: 'medal-sanad-honor',
    title: 'وسام السند القرآني العالي',
    description: 'إتمام حفظ 10 أجزاء أو ختم القرآن الكريم بالسند المتصل برواية حفص عن عاصم.',
    category: 'sanad',
    icon: 'Crown',
    pointsValue: 1000,
    isUnlocked: false,
    progressCurrent: 5,
    progressTarget: 10,
    requirementText: 'حفظ 10 أجزاء من كتاب الله تعالى'
  }
];

export const INITIAL_ACTIVITIES: PointActivityItem[] = [
  {
    id: 'act-1',
    title: 'إتمام درس التجويد: مقدمة علم التجويد وغايته',
    points: 100,
    type: 'tajweed_lesson',
    date: '2026-09-20',
    timestamp: Date.now() - 86400000 * 12
  },
  {
    id: 'act-2',
    title: 'حفظ سورة الملك بالتجويد بالسند',
    points: 300,
    type: 'surah_memorized',
    date: '2026-09-25',
    timestamp: Date.now() - 86400000 * 7
  },
  {
    id: 'act-3',
    title: 'إتمام درس: اللحن في القرآن ومراتب القراءة',
    points: 100,
    type: 'tajweed_lesson',
    date: '2026-09-28',
    timestamp: Date.now() - 86400000 * 4
  },
  {
    id: 'act-4',
    title: 'الحصول على وسام فارس التجويد الذهبي',
    points: 200,
    type: 'medal_unlocked',
    date: '2026-09-28',
    timestamp: Date.now() - 86400000 * 4
  },
  {
    id: 'act-5',
    title: 'حضور جلسة تسميع الفجر مع الشيخ المعيّن',
    points: 50,
    type: 'recitation_attended',
    date: '2026-10-01',
    timestamp: Date.now() - 86400000 * 1
  }
];

export function getRankForPoints(points: number): { currentRank: StudentRankTier; nextRank: StudentRankTier | null; progressPercent: number; pointsRemaining: number } {
  let currentRank = STUDENT_RANKS[0];
  let nextRank: StudentRankTier | null = STUDENT_RANKS[1];

  for (let i = 0; i < STUDENT_RANKS.length; i++) {
    if (points >= STUDENT_RANKS[i].minPoints) {
      currentRank = STUDENT_RANKS[i];
      nextRank = i < STUDENT_RANKS.length - 1 ? STUDENT_RANKS[i + 1] : null;
    }
  }

  let progressPercent = 100;
  let pointsRemaining = 0;

  if (nextRank) {
    const range = nextRank.minPoints - currentRank.minPoints;
    const gained = points - currentRank.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    pointsRemaining = Math.max(0, nextRank.minPoints - points);
  }

  return { currentRank, nextRank, progressPercent, pointsRemaining };
}

export function getStudentPointsProfile(studentId: string, studentName: string): StudentPointsProfile {
  const localKey = `${LOCAL_STORAGE_POINTS_PREFIX}${studentId}`;
  
  try {
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      const { currentRank, nextRank, progressPercent, pointsRemaining } = getRankForPoints(parsed.totalPoints || 750);
      return {
        ...parsed,
        currentRank,
        nextRank,
        progressToNextRankPercent: progressPercent,
        pointsToNextRank: pointsRemaining
      };
    }
  } catch (err) {
    console.error('Error loading points profile:', err);
  }

  // Default initial profile for student
  const initialPoints = 750;
  const { currentRank, nextRank, progressPercent, pointsRemaining } = getRankForPoints(initialPoints);

  const profile: StudentPointsProfile = {
    studentId,
    studentName,
    totalPoints: initialPoints,
    currentRank,
    nextRank,
    progressToNextRankPercent: progressPercent,
    pointsToNextRank: pointsRemaining,
    streakDays: 6,
    surahsMemorizedCount: 5,
    tajweedLessonsCompletedCount: 3,
    medals: INITIAL_MEDALS_TEMPLATE,
    recentActivities: INITIAL_ACTIVITIES
  };

  try {
    localStorage.setItem(localKey, JSON.stringify(profile));
  } catch {}

  return profile;
}

export async function addStudentPoints(
  studentId: string,
  studentName: string,
  params: {
    points: number;
    title: string;
    type: PointActivityItem['type'];
    surahName?: string;
  }
): Promise<{ profile: StudentPointsProfile; unlockedMedal?: MedalItem }> {
  const current = getStudentPointsProfile(studentId, studentName);
  
  const newTotal = current.totalPoints + params.points;
  const newActivity: PointActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: params.title,
    points: params.points,
    type: params.type,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  let surahsCount = current.surahsMemorizedCount;
  if (params.type === 'surah_memorized') {
    surahsCount += 1;
  }

  let tajweedCount = current.tajweedLessonsCompletedCount;
  if (params.type === 'tajweed_lesson') {
    tajweedCount += 1;
  }

  // Check for unlocked medals
  let newlyUnlockedMedal: MedalItem | undefined;
  const updatedMedals = current.medals.map(m => {
    const medal = { ...m };
    if (!medal.isUnlocked) {
      if (medal.category === 'surah') {
        medal.progressCurrent = Math.min(medal.progressTarget, surahsCount);
        if (medal.progressCurrent >= medal.progressTarget) {
          medal.isUnlocked = true;
          medal.unlockedAt = new Date().toISOString().split('T')[0];
          newlyUnlockedMedal = medal;
        }
      } else if (medal.category === 'tajweed') {
        medal.progressCurrent = Math.min(medal.progressTarget, tajweedCount);
        if (medal.progressCurrent >= medal.progressTarget) {
          medal.isUnlocked = true;
          medal.unlockedAt = new Date().toISOString().split('T')[0];
          newlyUnlockedMedal = medal;
        }
      }
    }
    return medal;
  });

  const { currentRank, nextRank, progressPercent, pointsRemaining } = getRankForPoints(newTotal);

  const updatedProfile: StudentPointsProfile = {
    ...current,
    totalPoints: newTotal,
    currentRank,
    nextRank,
    progressToNextRankPercent: progressPercent,
    pointsToNextRank: pointsRemaining,
    surahsMemorizedCount: surahsCount,
    tajweedLessonsCompletedCount: tajweedCount,
    medals: updatedMedals,
    recentActivities: [newActivity, ...current.recentActivities].slice(0, 15)
  };

  // Save in localStorage
  try {
    const localKey = `${LOCAL_STORAGE_POINTS_PREFIX}${studentId}`;
    localStorage.setItem(localKey, JSON.stringify(updatedProfile));
    window.dispatchEvent(new CustomEvent('rehab_points_updated', { detail: updatedProfile }));
  } catch (err) {
    console.error('Failed to save points locally:', err);
  }

  // Persist to Firestore asynchronously
  try {
    const studentDocRef = doc(db, 'students', studentId);
    await setDoc(studentDocRef, {
      totalPoints: newTotal,
      currentRankTitle: currentRank.title,
      surahsMemorizedCount: surahsCount,
      tajweedLessonsCompletedCount: tajweedCount,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Async save of student points:', err);
  }

  return { profile: updatedProfile, unlockedMedal: newlyUnlockedMedal };
}
