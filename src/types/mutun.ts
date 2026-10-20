/**
 * Types & Data Models for حفظ المتون العلمية وشرحها
 * مقرأة رحاب القرآن الإلكترونية
 */

export interface MatnVerse {
  number: number;
  sadr: string;       // الصدر (الشطر الأول)
  ajuz: string;       // العجز (الشطر الثاني)
  explanation?: string; // الشرح المبسط المعتمد
  tajweedRule?: string; // الحكم التجويدي المرتبط بالبيت
  practicalExamples?: string[]; // أمثلة قرآنية تطبيقية
}

export interface MatnChapter {
  id: string;
  title: string;
  fromVerse: number;
  toVerse: number;
  description?: string;
}

export type QuizQuestionType = 'fill_blank' | 'reorder' | 'multiple_choice' | 'practical_tajweed';

export interface MatnSelfQuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];           // للاختيار من متعدد
  correctAnswer: string;        // الإجابة الصحيحة أو النص المطلوب
  versesToOrder?: { id: number; text: string }[]; // لأسئلة ترتيب الأبيات
  correctOrderIds?: number[];   // الترتيب الصحيح للأبيات
  blankVerseNumber?: number;    // رقم البيت المطلوب إكماله
  explanation: string;          // التفسير التعليمي الفوري بعد الحل
}

export interface MatnGroup {
  id: string;
  groupNumber: number;
  title: string;
  fromVerse: number;
  toVerse: number;
  verses: MatnVerse[];
  audioUrl?: string;            // تسجيل صوتي إنشادي للأبيات
  teacherAudioUrl?: string;     // تسجيل صوتي للمعلم
  pdfGuideUrl?: string;         // مذكرة أو ملف PDF
  videoLessonUrl?: string;      // رابط درس فيديو
  teacherNotes?: string;        // ملاحظات وتوجيهات الشيخ
  explanationSummary: string;   // الشرح الإجمالي المعتمد
  quizQuestions: MatnSelfQuizQuestion[];
}

export interface ScientificMatn {
  id: string;
  title: string;                 // اسم المتن (مثال: تحفة الأطفال)
  author: string;                // الناظم (الشيخ سليمان الجمزوري)
  category: 'tajweed' | 'qiraat' | 'rasm' | 'mutashabih';
  totalVerses: number;
  defaultGroupSize: number;      // افتراضياً 5 أبيات
  audioUrl?: string;             // التسجيل الكامل المعتمد
  description: string;
  sourceEdition?: string;        // النسخة المحققة المعتمدة
  chapters: MatnChapter[];
  groups: MatnGroup[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type MasteryLevel = 'excellent' | 'very_good' | 'good' | 'needs_revision';

export interface MatnGroupProgress {
  groupId: string;
  groupNumber: number;
  completedAt?: string;
  masteryLevel?: MasteryLevel;
  lastReviewedAt?: string;
  reviewCount: number;
  selfQuizBestScore?: number;
  selfQuizAttempts: number;
  isTeacherApproved: boolean;
  teacherApprovalDate?: string;
  teacherNotes?: string;
  recitationSubmissionId?: string;
}

export interface MatnStudentProgress {
  id: string;                    // studentId + '_' + matnId
  studentId: string;
  studentName?: string;
  halqaId?: string;
  teacherId?: string;
  matnId: string;
  matnTitle: string;
  currentGroupId: string;
  currentGroupNumber: number;
  completedGroupsCount: number;
  totalGroupsCount: number;
  percentageCompleted: number;
  lastStudiedAt: string;
  lastReviewedAt?: string;
  overallMasteryLevel: MasteryLevel;
  groupProgress: Record<string, MatnGroupProgress>;
  nextGroupUnlocked: boolean;    // لا تُفتح المجموعة التالية إلا باعتماد المعلم أو سياسة المشرف
  updatedAt: string;
}

export type MatnSubmissionStatus = 'pending' | 'approved' | 'needs_revision';

export interface MatnRecitationSubmission {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  halqaId: string;
  halqaName?: string;
  matnId: string;
  matnTitle: string;
  groupId: string;
  groupNumber: number;
  verseRange: string;            // مثال: الأبيات 1 - 5
  audioUrl?: string;
  audioBase64?: string;
  submissionType: 'audio' | 'live_session'; // تسجيل صوتي أو تسميع مباشر في الحلقة
  status: MatnSubmissionStatus;
  masteryScore?: number;         // درجة من 100
  masteryLevel?: MasteryLevel;
  teacherFeedback?: string;
  tajweedNotes?: string[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedByTeacherName?: string;
}

export interface MatnWeeklyExamQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation: string;
}

export interface MatnWeeklyExam {
  id: string;
  title: string;
  matnId: string;
  matnTitle: string;
  teacherId: string;
  teacherName: string;
  halqaId: string;
  halqaName?: string;
  assignedStudentIds?: string[]; // إذا كان الاختبار لطلاب محددين أو للحلقة كلها
  fromGroup: number;
  toGroup: number;
  verseRange: string;
  scheduledAt: string;           // موعد بدء الاختبار
  expiresAt: string;             // موعد انتهاء صلاحية الاختبار
  durationMinutes: number;       // مدة الاختبار بالدقائق
  passingScore: number;          // درجة الاجتياز (مثال: 80%)
  maxAttempts: number;           // أقصى عدد للمحاولات
  isActive: boolean;             // مفعّل للطلاب
  questions: MatnWeeklyExamQuestion[];
  createdAt: string;
}

export interface MatnExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  matnId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string;
  answers: Record<string, string>;
  teacherFeedback?: string;
}
