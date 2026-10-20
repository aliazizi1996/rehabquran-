// Quiz Storage and Teacher Analytics Engine for Quranic Lessons

export interface QuizAttempt {
  id: string;
  lessonId: string;
  chapterId: string;
  lessonTitle: string;
  studentName: string;
  studentRole: 'student' | 'teacher' | 'guest';
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: Record<string, number>;
  submittedAt: string;
  dateStr: string;
  timeStr: string;
  evaluationNote?: string;
}

export interface LessonComprehensionAnalytics {
  lessonId: string;
  totalAttempts: number;
  averageScorePercentage: number;
  passRatePercentage: number;
  excellentCount: number; // >= 90%
  veryGoodCount: number; // 75% - 89%
  goodCount: number; // 50% - 74%
  needsFollowupCount: number; // < 50%
  highRiskQuestionId?: string;
  highRiskQuestionText?: string;
  recentAttempts: QuizAttempt[];
}

const STORAGE_KEY = 'rehab_quran_quiz_attempts_v2';

// Pre-seeded authentic student comprehension data for Tajweed lessons
const DEFAULT_PRESEEDED_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'quiz-att-1',
    lessonId: 'les-1-1-intro',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مقدمة علم التجويد والمخارج الخمسة العامة',
    studentName: 'أسامة الحضرمي',
    studentRole: 'student',
    score: 2,
    totalQuestions: 2,
    percentage: 100,
    answers: { 'q-1-1': 2, 'q-1-2': 1 },
    submittedAt: '2026-09-12T10:30:00Z',
    dateStr: 'اليوم',
    timeStr: '10:30 ص',
    evaluationNote: 'استيعاب ممتاز وفهم دقيق لعدد المخارج'
  },
  {
    id: 'quiz-att-2',
    lessonId: 'les-1-1-intro',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مقدمة علم التجويد والمخارج الخمسة العامة',
    studentName: 'حمزة السعيدي',
    studentRole: 'student',
    score: 2,
    totalQuestions: 2,
    percentage: 100,
    answers: { 'q-1-1': 2, 'q-1-2': 1 },
    submittedAt: '2026-09-12T09:15:00Z',
    dateStr: 'اليوم',
    timeStr: '09:15 ص',
    evaluationNote: 'إجابة نموذجية وسرعة في الحل'
  },
  {
    id: 'quiz-att-3',
    lessonId: 'les-1-1-intro',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مقدمة علم التجويد والمخارج الخمسة العامة',
    studentName: 'ريان الغامدي',
    studentRole: 'student',
    score: 1,
    totalQuestions: 2,
    percentage: 50,
    answers: { 'q-1-1': 1, 'q-1-2': 1 },
    submittedAt: '2026-09-11T16:20:00Z',
    dateStr: 'أمس',
    timeStr: '04:20 م',
    evaluationNote: 'أخطأ في مذهب ابن الجزري في عدد المخارج (اختار 16 مخرجاً)'
  },
  {
    id: 'quiz-att-4',
    lessonId: 'les-1-1-intro',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مقدمة علم التجويد والمخارج الخمسة العامة',
    studentName: 'خديجة الأهدل',
    studentRole: 'student',
    score: 2,
    totalQuestions: 2,
    percentage: 100,
    answers: { 'q-1-1': 2, 'q-1-2': 1 },
    submittedAt: '2026-09-11T14:10:00Z',
    dateStr: 'أمس',
    timeStr: '02:10 م',
    evaluationNote: 'فهم متقن لحروف الجوف الهوائية'
  },
  {
    id: 'quiz-att-5',
    lessonId: 'les-1-1-intro',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مقدمة علم التجويد والمخارج الخمسة العامة',
    studentName: 'مريم العولقي',
    studentRole: 'student',
    score: 2,
    totalQuestions: 2,
    percentage: 100,
    answers: { 'q-1-1': 2, 'q-1-2': 1 },
    submittedAt: '2026-09-10T18:45:00Z',
    dateStr: 'منذ يومين',
    timeStr: '06:45 م',
    evaluationNote: 'ممتازة وشاركت الشاهد من الجزرية'
  },
  {
    id: 'quiz-att-6',
    lessonId: 'les-1-2-halq-lisan',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مخارج الحلق ومخارج اللسان العميقة (القاف والكاف والضاد)',
    studentName: 'أسامة الحضرمي',
    studentRole: 'student',
    score: 2,
    totalQuestions: 2,
    percentage: 100,
    answers: { 'q-1-3': 1, 'q-1-4': 1 },
    submittedAt: '2026-09-12T11:00:00Z',
    dateStr: 'اليوم',
    timeStr: '11:00 ص',
    evaluationNote: 'استيعاب دقيق لاستطالة الضاد ورخاوتها'
  },
  {
    id: 'quiz-att-7',
    lessonId: 'les-1-2-halq-lisan',
    chapterId: 'chap-1-makharaj',
    lessonTitle: 'مخارج الحلق ومخارج اللسان العميقة (القاف والكاف والضاد)',
    studentName: 'عبدالرحمن باحارثة',
    studentRole: 'student',
    score: 1,
    totalQuestions: 2,
    percentage: 50,
    answers: { 'q-1-3': 1, 'q-1-4': 0 },
    submittedAt: '2026-09-11T12:00:00Z',
    dateStr: 'أمس',
    timeStr: '12:00 م',
    evaluationNote: 'التبس عليه مخرج الضاد مع الدال'
  }
];

export function getAllQuizAttempts(): QuizAttempt[] {
  if (typeof window === 'undefined') return DEFAULT_PRESEEDED_ATTEMPTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRESEEDED_ATTEMPTS));
      return DEFAULT_PRESEEDED_ATTEMPTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PRESEEDED_ATTEMPTS;
  } catch {
    return DEFAULT_PRESEEDED_ATTEMPTS;
  }
}

export function saveQuizAttempt(
  data: Omit<QuizAttempt, 'id' | 'submittedAt' | 'dateStr' | 'timeStr'>
): QuizAttempt {
  const current = getAllQuizAttempts();
  const now = new Date();
  
  const dateStr = now.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const newAttempt: QuizAttempt = {
    ...data,
    id: `quiz-att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submittedAt: now.toISOString(),
    dateStr,
    timeStr,
  };

  const updated = [newAttempt, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('rehab_quiz_updated'));
    } catch (e) {
      console.warn('Failed to save quiz attempt to localStorage:', e);
    }
  }

  return newAttempt;
}

export function getQuizAttemptsForLesson(lessonId: string): QuizAttempt[] {
  const all = getAllQuizAttempts();
  return all.filter((a) => a.lessonId === lessonId);
}

export function getTeacherComprehensionStats(
  lessonId: string,
  totalQuestionsCount: number = 2
): LessonComprehensionAnalytics {
  const attempts = getQuizAttemptsForLesson(lessonId);

  if (attempts.length === 0) {
    return {
      lessonId,
      totalAttempts: 0,
      averageScorePercentage: 0,
      passRatePercentage: 0,
      excellentCount: 0,
      veryGoodCount: 0,
      goodCount: 0,
      needsFollowupCount: 0,
      recentAttempts: []
    };
  }

  const totalScores = attempts.reduce((acc, a) => acc + a.percentage, 0);
  const avg = Math.round(totalScores / attempts.length);

  const passed = attempts.filter((a) => a.percentage >= 60).length;
  const passRate = Math.round((passed / attempts.length) * 100);

  const excellentCount = attempts.filter((a) => a.percentage >= 90).length;
  const veryGoodCount = attempts.filter((a) => a.percentage >= 75 && a.percentage < 90).length;
  const goodCount = attempts.filter((a) => a.percentage >= 50 && a.percentage < 75).length;
  const needsFollowupCount = attempts.filter((a) => a.percentage < 50).length;

  return {
    lessonId,
    totalAttempts: attempts.length,
    averageScorePercentage: avg,
    passRatePercentage: passRate,
    excellentCount,
    veryGoodCount,
    goodCount,
    needsFollowupCount,
    recentAttempts: attempts.slice(0, 10)
  };
}
