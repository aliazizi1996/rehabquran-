// Learning store for tracking student progress in Difficult Words and Sequential Tajweed Curriculum
import { TAJWEED_CURRICULUM, ALL_CURRICULUM_LESSONS } from './tajweedLessonsData';
import { TajweedChapter, TajweedLesson, CurriculumGlobalSettings } from '../types';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAcademyDatabase, saveAcademyDatabase } from './academyDb';
import { addStudentPoints } from '../services/pointsMedalsService';

const MASTERED_WORDS_KEY = 'rehab_quran_mastered_words';
const LESSON_PROGRESS_KEY = 'rehab_quran_curriculum_progress_v2';
const CURRICULUM_SETTINGS_KEY = 'rehab_quran_curriculum_settings_v2';
const CUSTOM_CURRICULUM_KEY = 'rehab_quran_custom_curriculum_v2';

export interface LessonProgressData {
  lessonId: string;
  studentId?: string;
  completed: boolean; // true if passed
  passed: boolean;
  quizScore: number;
  totalQuestions: number;
  percentage: number;
  attemptsCount: number;
  completedAt?: string;
  lastAttemptAt?: string;
}

const DEFAULT_SETTINGS: CurriculumGlobalSettings = {
  minPassingScorePercent: 80, // 80% passing grade requirement as requested by academy management
  allowRetakes: true,
  lockNextUntilPassed: true,
  updatedAt: new Date().toISOString(),
};

// =======================
// Difficult Words Store
// =======================
export const getMasteredWordIds = (): string[] => {
  try {
    const raw = localStorage.getItem(MASTERED_WORDS_KEY);
    return raw ? JSON.parse(raw) : ['word-imalah-majraha', 'word-ishmam-tamanna'];
  } catch {
    return [];
  }
};

export const isWordMastered = (wordId: string): boolean => {
  const list = getMasteredWordIds();
  return list.includes(wordId);
};

export const toggleWordMastered = (wordId: string): boolean => {
  const current = getMasteredWordIds();
  let next: string[];
  let isNowMastered = false;
  if (current.includes(wordId)) {
    next = current.filter((id) => id !== wordId);
    isNowMastered = false;
  } else {
    next = [...current, wordId];
    isNowMastered = true;
  }
  try {
    localStorage.setItem(MASTERED_WORDS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to save mastered words', e);
  }
  return isNowMastered;
};

// =======================
// Curriculum Settings
// =======================
export const getCurriculumSettings = (): CurriculumGlobalSettings => {
  try {
    const raw = localStorage.getItem(CURRICULUM_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
};

export const saveCurriculumSettings = async (settings: Partial<CurriculumGlobalSettings>): Promise<CurriculumGlobalSettings> => {
  const current = getCurriculumSettings();
  const updated: CurriculumGlobalSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(CURRICULUM_SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to write settings to local storage:', e);
  }

  // Also sync to Firestore asynchronously
  try {
    const settingsDoc = doc(db, 'curriculum_settings', 'global_config');
    await setDoc(settingsDoc, updated, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to sync curriculum settings:', err);
  }

  return updated;
};

// =======================
// Curriculum Dynamic Tree
// =======================
export const getActiveCurriculum = (): TajweedChapter[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_CURRICULUM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return TAJWEED_CURRICULUM;
};

export const saveActiveCurriculum = async (chapters: TajweedChapter[]): Promise<void> => {
  try {
    localStorage.setItem(CUSTOM_CURRICULUM_KEY, JSON.stringify(chapters));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to save active curriculum locally:', e);
  }

  // Sync lessons to Firestore
  try {
    for (const chap of chapters) {
      for (const les of chap.lessons) {
        const lesDoc = doc(db, 'curriculum_lessons', les.id);
        await setDoc(lesDoc, {
          id: les.id,
          chapterId: les.chapterId,
          order: les.order,
          title: les.title,
          description: les.description,
          textContent: les.textContent || '',
          videoUrl: les.videoUrl || '',
          youtubeVideoId: les.youtubeVideoId || '',
          audioUrl: les.audioUrl || '',
          pdfUrl: les.pdfUrl || '',
          pdfTitle: les.pdfTitle || '',
          minPassingScore: les.minPassingScore || 80,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('[Firestore] Failed to sync curriculum lessons:', err);
  }
};

// Reorder lessons in a chapter
export const moveLessonInChapter = (chapterId: string, lessonId: string, direction: 'up' | 'down'): TajweedChapter[] => {
  const chapters = getActiveCurriculum();
  const chapIndex = chapters.findIndex((c) => c.id === chapterId);
  if (chapIndex === -1) return chapters;

  const chap = { ...chapters[chapIndex] };
  const lessons = [...chap.lessons];
  const lesIndex = lessons.findIndex((l) => l.id === lessonId);
  if (lesIndex === -1) return chapters;

  const targetIndex = direction === 'up' ? lesIndex - 1 : lesIndex + 1;
  if (targetIndex < 0 || targetIndex >= lessons.length) return chapters;

  // Swap
  const temp = lessons[lesIndex];
  lessons[lesIndex] = lessons[targetIndex];
  lessons[targetIndex] = temp;

  // Re-index orders
  lessons.forEach((l, idx) => {
    l.order = idx + 1;
  });

  chap.lessons = lessons;
  chapters[chapIndex] = chap;

  saveActiveCurriculum(chapters);
  return chapters;
};

// =======================
// Student Lesson Progress & Gating
// =======================
export const getLessonProgressMap = (): Record<string, LessonProgressData> => {
  try {
    const raw = localStorage.getItem(LESSON_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {
      'les-1-1-intro': {
        lessonId: 'les-1-1-intro',
        completed: true,
        passed: true,
        quizScore: 3,
        totalQuestions: 3,
        percentage: 100,
        attemptsCount: 1,
        completedAt: '2026-09-15',
        lastAttemptAt: '2026-09-15',
      }
    };
  } catch {
    return {};
  }
};

export const getLessonProgress = (lessonId: string): LessonProgressData | null => {
  const map = getLessonProgressMap();
  return map[lessonId] || null;
};

export const isLessonCompleted = (lessonId: string): boolean => {
  const progress = getLessonProgress(lessonId);
  return !!progress?.passed;
};

export type LevelVisualStatus = 'open' | 'completed' | 'locked';

export interface LevelInfo {
  id: string;
  order: number;
  title: string;
  status: LevelVisualStatus;
  visualCue: '🟢' | '✅' | '🔒';
  isUnlocked: boolean;
  isVisible: boolean; // Constraint: "مخارج الحروف" is hidden until preceding levels are cleared
  totalLessons: number;
  passedLessons: number;
  percentage: number;
  prerequisiteTitle?: string;
  prerequisiteScore?: number;
}

/**
 * Calculates the lock/unlock and completion status of a level (chapter).
 * - Initial State: Level 1 is unlocked (🟢). All other levels are locked (🔒).
 * - Unlock Condition: Level [N] remains locked until ALL lessons in Level [N-1] are completed and passed.
 * - Completion State: Once a level is fully completed and passed, it marks as (✅).
 * - Constraint: "مخارج الحروف" (Level 5) must never be visible or accessible until ALL preceding levels are cleared.
 */
export const getLevelStatus = (chapterId: string): LevelInfo => {
  const chapters = getActiveCurriculum();
  const chapIndex = chapters.findIndex((c) => c.id === chapterId);
  const settings = getCurriculumSettings();
  const progressMap = getLessonProgressMap();

  if (chapIndex === -1) {
    return {
      id: chapterId,
      order: 1,
      title: '',
      status: 'locked',
      visualCue: '🔒',
      isUnlocked: false,
      isVisible: true,
      totalLessons: 0,
      passedLessons: 0,
      percentage: 0,
    };
  }

  const chapter = chapters[chapIndex];
  const totalLessons = chapter.lessons.length;
  const passedLessons = chapter.lessons.filter((l) => {
    const p = progressMap[l.id];
    const req = l.minPassingScore || settings.minPassingScorePercent;
    return p && p.passed && p.percentage >= req;
  }).length;

  const isLevelFullyCompleted = totalLessons > 0 && passedLessons === totalLessons;
  const percentage = totalLessons > 0 ? Math.round((passedLessons / totalLessons) * 100) : 0;

  // Check preceding levels (all chapters 0 .. chapIndex - 1 must be fully completed)
  let arePrecedingLevelsCompleted = true;
  let prerequisiteChapter: TajweedChapter | undefined = undefined;

  for (let i = 0; i < chapIndex; i++) {
    const prevChap = chapters[i];
    const prevCompleted = prevChap.lessons.length > 0 && prevChap.lessons.every((l) => {
      const p = progressMap[l.id];
      const req = l.minPassingScore || settings.minPassingScorePercent;
      return p && p.passed && p.percentage >= req;
    });
    if (!prevCompleted) {
      arePrecedingLevelsCompleted = false;
      prerequisiteChapter = prevChap;
      break;
    }
  }

  // Initial State: Only Level 1 (chapIndex === 0) is unlocked initially.
  const isUnlocked = chapIndex === 0 || arePrecedingLevelsCompleted;

  // Constraint: "مخارج الحروف" must never be visible or accessible until ALL preceding levels are cleared.
  const isMakharajLevel = chapter.title.includes('مخارج') || chapter.id === 'chap-5-makharaj' || chapter.order === 5;
  const isVisible = isMakharajLevel ? arePrecedingLevelsCompleted : true;

  let status: LevelVisualStatus = 'locked';
  let visualCue: '🟢' | '✅' | '🔒' = '🔒';

  if (isLevelFullyCompleted) {
    status = 'completed';
    visualCue = '✅';
  } else if (isUnlocked) {
    status = 'open';
    visualCue = '🟢';
  } else {
    status = 'locked';
    visualCue = '🔒';
  }

  return {
    id: chapter.id,
    order: chapter.order,
    title: chapter.title,
    status,
    visualCue,
    isUnlocked,
    isVisible,
    totalLessons,
    passedLessons,
    percentage,
    prerequisiteTitle: prerequisiteChapter?.title,
    prerequisiteScore: settings.minPassingScorePercent,
  };
};

export const getAllLevelsStatus = (): LevelInfo[] => {
  const chapters = getActiveCurriculum();
  return chapters.map((c) => getLevelStatus(c.id));
};

/**
 * Checks whether a given lesson is unlocked for the student.
 * 1. The level (chapter) must be unlocked.
 * 2. If it is the first lesson of an unlocked level, it is unlocked.
 * 3. Otherwise, the immediate previous lesson must be passed with >= requiredScore.
 */
export const isLessonUnlocked = (lessonId: string): { 
  unlocked: boolean; 
  prerequisiteTitle?: string; 
  requiredScore?: number;
  reason?: 'level_locked' | 'previous_lesson_locked' | 'makharaj_hidden';
} => {
  const chapters = getActiveCurriculum();
  const settings = getCurriculumSettings();
  if (!settings.lockNextUntilPassed) {
    return { unlocked: true };
  }

  // Find which chapter contains this lesson
  let foundChapter: TajweedChapter | undefined;
  let lessonIndexInChapter = -1;

  for (const chap of chapters) {
    const idx = chap.lessons.findIndex((l) => l.id === lessonId);
    if (idx !== -1) {
      foundChapter = chap;
      lessonIndexInChapter = idx;
      break;
    }
  }

  if (!foundChapter) {
    return { unlocked: true };
  }

  // 1. Check if the Level (Chapter) itself is unlocked
  const levelStatus = getLevelStatus(foundChapter.id);
  if (!levelStatus.isUnlocked) {
    if (!levelStatus.isVisible) {
      return {
        unlocked: false,
        prerequisiteTitle: 'إتمام المستويات الأربعة السابقة بالكامل بنجاح',
        requiredScore: settings.minPassingScorePercent,
        reason: 'makharaj_hidden',
      };
    }
    return {
      unlocked: false,
      prerequisiteTitle: levelStatus.prerequisiteTitle || 'المستوى السابق',
      requiredScore: settings.minPassingScorePercent,
      reason: 'level_locked',
    };
  }

  // 2. First lesson in an unlocked level is open
  if (lessonIndexInChapter === 0) {
    return { unlocked: true };
  }

  // 3. Subsequent lesson requires immediate previous lesson in the chapter to be passed
  const prevLesson = foundChapter.lessons[lessonIndexInChapter - 1];
  const prevProgress = getLessonProgress(prevLesson.id);
  const requiredScore = prevLesson.minPassingScore || settings.minPassingScorePercent;

  if (prevProgress && prevProgress.passed && prevProgress.percentage >= requiredScore) {
    return { unlocked: true };
  }

  return {
    unlocked: false,
    prerequisiteTitle: prevLesson.title,
    requiredScore,
    reason: 'previous_lesson_locked',
  };
};

/**
 * Saves a student's quiz attempt:
 * - Increments attempt count
 * - Computes percentage
 * - Checks if passed according to management threshold
 * - Automatically saves in student's profile & Firestore
 */
export const recordLessonQuizAttempt = async (
  lessonId: string,
  score: number,
  totalQuestions: number,
  studentId?: string,
  studentName?: string
): Promise<LessonProgressData> => {
  const map = getLessonProgressMap();
  const previous = map[lessonId];
  const settings = getCurriculumSettings();

  const chapters = getActiveCurriculum();
  const allLessons = chapters.flatMap((c) => c.lessons);
  const currentLesson = allLessons.find((l) => l.id === lessonId);
  const minPassingPercent = currentLesson?.minPassingScore || settings.minPassingScorePercent;

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const isPassed = percentage >= minPassingPercent;
  const attemptsCount = (previous?.attemptsCount || 0) + 1;
  const nowStr = new Date().toISOString().split('T')[0];

  const updatedProgress: LessonProgressData = {
    lessonId,
    studentId: studentId || previous?.studentId || 'current_student',
    completed: isPassed || !!previous?.completed,
    passed: isPassed || !!previous?.passed,
    quizScore: score,
    totalQuestions,
    percentage,
    attemptsCount,
    completedAt: isPassed ? (previous?.completedAt || nowStr) : previous?.completedAt,
    lastAttemptAt: nowStr,
  };

  map[lessonId] = updatedProgress;

  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to save lesson progress locally:', e);
  }

  // 1. Save in Student Profile in Local DB (DbStudent)
  try {
    const academyDb = getAcademyDatabase();
    const resolvedStudent = studentId
      ? academyDb.students.find((s) => s.id === studentId || s.userId === studentId)
      : academyDb.students[0];

    if (resolvedStudent) {
      if (!resolvedStudent.notes) {
        resolvedStudent.notes = '';
      }
      // Add or update summary in student's notes / record
      resolvedStudent.notes = `[المنهج المتدرج: ${currentLesson?.title || lessonId} - نسبة ${percentage}% (${score}/${totalQuestions}) - المحاولات: ${attemptsCount} - ${nowStr}] ${resolvedStudent.notes.slice(0, 300)}`;
      saveAcademyDatabase(academyDb);
    }
  } catch (err) {
    console.warn('Failed to update student in local academyDb:', err);
  }

  // 2. Save in Firestore: student_lesson_progress
  try {
    const progressDocId = `${studentId || 'student'}_${lessonId}`;
    const progressDoc = doc(db, 'student_lesson_progress', progressDocId);
    await setDoc(progressDoc, {
      ...updatedProgress,
      studentName: studentName || 'طالب المقرأة',
      lessonTitle: currentLesson?.title || lessonId,
      minPassingPercent,
      savedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to sync student_lesson_progress:', err);
  }

  return updatedProgress;
};

export const resetLessonProgress = (lessonId: string): void => {
  const map = getLessonProgressMap();
  delete map[lessonId];
  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to reset lesson progress', e);
  }
};

export const markLessonCompleted = (lessonId: string, percentage: number = 100): LessonProgressData => {
  const map = getLessonProgressMap();
  const previous = map[lessonId];
  const nowStr = new Date().toISOString().split('T')[0];
  
  const updatedProgress: LessonProgressData = {
    lessonId,
    studentId: previous?.studentId || 'current_student',
    completed: true,
    passed: true,
    quizScore: previous?.quizScore || 10,
    totalQuestions: previous?.totalQuestions || 10,
    percentage: Math.max(previous?.percentage || 0, percentage),
    attemptsCount: (previous?.attemptsCount || 0) + 1,
    completedAt: previous?.completedAt || nowStr,
    lastAttemptAt: nowStr,
  };

  map[lessonId] = updatedProgress;
  try {
    localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('rehab_learning_updated'));
  } catch (e) {
    console.error('Failed to mark lesson completed locally:', e);
  }

  // Award points if the lesson was not previously passed
  if (!previous?.passed) {
    try {
      addStudentPoints(updatedProgress.studentId || 'current_student', 'طالب المقرأة', {
        points: 100,
        title: `إتمام درس التجويد بنجاح (${updatedProgress.percentage}%)`,
        type: 'tajweed_lesson'
      });
    } catch (e) {
      console.warn('Failed to add points on lesson completion:', e);
    }
  }

  return updatedProgress;
};
