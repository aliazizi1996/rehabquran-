export type UserRole = 
  | 'student' 
  | 'teacher' 
  | 'academic_supervisor' 
  | 'system_admin' 
  | 'parent' 
  | 'quality_auditor'
  | 'guest';

export interface UserNotificationPreferences {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  halqaReminders: boolean;
}

export interface User {
  id: string; // Firebase Auth UID
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  gender: 'male' | 'female';
  country: string;
  timezone: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  notificationPreferences: UserNotificationPreferences;
  customClaims?: {
    role: UserRole;
    admin?: boolean;
    supervisor?: boolean;
    auditor?: boolean;
  };
  childStudentIds?: string[];
  assignedHalqaIds?: string[];
  assignedHalqaTitle?: string;
  parentUserId?: string;
  academicId?: string;
  qualification?: string;
  certificationDetails?: string;
}

export interface SecurityActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole?: UserRole;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'LOGOUT_ALL' | 'ROLE_UPDATED' | 'ACCOUNT_TOGGLED' | 'PROFILE_UPDATED';
  details?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  riwayah: string; // e.g. "حفص عن عاصم", "ورش عن نافع", "قالون عن نافع"
  level: string; // e.g. "مبتدئ", "متوسط", "متقدم", "خاتم ومجاز"
  enrolledHalqaIds: string[];
  memorizedJuzs: number[]; // 1 to 30
  dailyTargetPages: number;
  streakDays: number;
  totalSubmissions: number;
  attendanceRate: number; // percentage e.g. 96
}

export type HalqaCategory = 'all' | 'memorization' | 'recitation' | 'correction' | 'female_section' | 'revision' | 'ijazah' | 'tashih' | 'ashbal';
export type HalqaClassificationId = 'hifz' | 'morajaah' | 'ijazah' | 'tashih' | 'ashbal';

export interface Halqa {
  id: string;
  title: string;
  category: 'memorization' | 'recitation' | 'correction' | 'revision' | 'ijazah' | 'tashih' | 'ashbal';
  classification?: HalqaClassificationId | string;
  classificationLabel?: string;
  halqaType?: string;
  description: string;
  sheikhName: string;
  sheikhTitle: string;
  scheduleTime: string; // e.g. "05:30 ص - بعد الفجر"
  days: string[];
  capacity: number;
  enrolledCount: number;
  isLiveNow: boolean;
  targetJuzOrSurah: string;
  levelName: string;
  roomUrl?: string;
  tags: string[];
  isFemaleSection?: boolean;
  isMaleSection?: boolean;
  supervisorWhatsapp?: string;
  meetUrl?: string;
  whatsappGroupUrl?: string;
  whatsappGroupTitle?: string;
}

export interface DailySession {
  id: string;
  halqaId: string;
  title: string;
  sheikhName: string;
  timeSlot: string; // e.g. "05:30 ص"
  period: 'fajr' | 'duha' | 'asr' | 'maghrib' | 'isha';
  category: 'memorization' | 'recitation' | 'correction';
  status: 'live' | 'upcoming' | 'completed';
  attendeesCount: number;
  currentReader?: string;
  meetUrl?: string;
  days?: string[];
}

export interface AudioSubmission {
  id: string;
  studentId: string;
  studentName: string;
  surahName: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  audioBlobUrl?: string;
  durationSeconds: number;
  recordedAt: string;
  status: 'pending' | 'reviewed';
  score?: number; // e.g. 95 / 100
  sheikhFeedback?: string;
  sheikhName?: string;
  tajweedNotes?: string[];
  aiGuidance?: {
    keyRules?: string[];
    frequentMistakes?: string[];
    makharajFocus?: string;
    sheikhTip?: string;
  };
}

export interface WirdRecord {
  date: string;
  pagesRead: number;
  targetPages: number;
  juzNumber: number;
  completed: boolean;
  notes?: string;
}

export interface TajweedRuleExample {
  text: string;
  rule: string;
  surah: string;
  explanation: string;
}

export interface TajweedTopic {
  id: string;
  title: string;
  category: 'noon' | 'meem' | 'madd' | 'qalqalah' | 'makharaj';
  summary: string;
  explanation: string;
  poesyRule?: string; // بيت شعري من تحفة الأطفال أو الجزرية
  examples: TajweedRuleExample[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  halqaTitle: string;
  sheikhName: string;
  status: 'present' | 'excused' | 'absent';
  durationMinutes: number;
  evaluation?: string;
}

export type RecitationAttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type PerformanceGrade = 'excellent' | 'very_good' | 'good' | 'weak';

export interface DailyRecitationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentSection: 'male' | 'female';
  date: string;
  surahName: string;
  juzNumber: number;
  ayahStart: number;
  ayahEnd: number;
  attendanceStatus: RecitationAttendanceStatus; // حاضر، غائب، متأخر، معذور
  grade: PerformanceGrade; // ممتاز، جيد جداً، جيد، ضعيف
  score: number; // 0 to 100
  hifzScore?: number; // درجة الحفظ والضبط 0 - 100
  tajweedScore?: number; // درجة التجويد والمخارج 0 - 100
  evaluatorTeacher: string; // المعلم المقيم / مشرف القسم
  memorizationQuality?: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج مراجعة وتكرار';
  tajweedNotes?: string;
  teacherFeedback?: string;
  recordedAt: string;
}

export interface StudentCertificate {
  id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  studentSection: 'male' | 'female';
  title: string;
  achievementType: 'juz_completion' | 'surah_completion' | 'khatm_sanad' | 'tajweed_mastery' | 'attendance_excellence';
  description: string;
  surahOrJuzDetail: string;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد';
  score: number;
  evaluatorTeacher: string; // المعلم المعتمد بالمقرأة
  issueDate: string;
  isOfficialStampApplied: boolean;
}

export type DifficultWordCategory = 
  | 'imalah' 
  | 'tasheel' 
  | 'ishmam_rawm' 
  | 'idgham_khas' 
  | 'sakt' 
  | 'iltiqa_sakinin' 
  | 'alifat_saba' 
  | 'tafkhim_tarqiq';

export interface DifficultQuranWord {
  id: string;
  word: string; // الرسم العثماني المشكول
  surahName: string;
  surahNumber: number;
  ayahNumber: number | string;
  juzNumber: number;
  category: DifficultWordCategory;
  categoryLabel: string;
  phoneticRule: string; // القاعدة الصوتية
  pronunciationSteps: string[]; // خطوات النطق السليم
  commonMistakes: string[]; // اللحن الخفي والأخطاء الشائعة
  practiceVerse: {
    fullText: string;
    highlightWord: string;
  };
  teacherTip: string;
  riwayah: string; // رواية حفص عن عاصم من طريق الشاطبية
  certifiedAudioUrl?: string; // رابط تلاوة معتمدة من المصحف المعلم (الشيخ الحصري)
  certifiedAudioSpeaker?: string; // اسم القارئ المعتمد
  certifiedVideoYoutubeId?: string; // معرف يوتيوب لشرح الشيخ المعتمد (مثل د. أيمن سويد)
  certifiedVideoTitle?: string; // عنوان الشرح المرئي المعتمد
  certifiedVideoSpeaker?: string; // اسم المحاضر / الشيخ
  certifiedSource?: string; // المصدر المعتمد
}

export interface TajweedLessonQuiz {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TajweedPracticeItem {
  text: string;
  surah: string;
  ruleToApply: string;
  audioUrl?: string; // تسجيل صوتي حقيقي معتمد للمثال (المصحف المعلم)
  sheikhReciter?: string; // اسم الشيخ المقرئ
}

export interface TajweedLesson {
  id: string;
  chapterId: string;
  order: number;
  title: string;
  durationMinutes: number;
  description: string;
  textContent?: string; // الشرح النصي الشامل والمنسق للدرس
  videoUrl: string; // 🎥 رابط الفيديو الخفيف (يوتيوب أو مسار Storage)
  youtubeVideoId?: string; // معرف يوتيوب الحقيقي للدرس
  videoSpeaker: string;
  audioUrl?: string; // 🔊 المقطع الصوتي التعليمي للدرس
  audioTitle?: string;
  pdfUrl?: string; // 📄 رابط ملف التلخيص بصيغة PDF
  pdfTitle?: string;
  certifiedSource?: string; // e.g. "برنامج التجويد المصور - د. أيمن سويد"
  poeticVerse?: string; // بيت من تحفة الأطفال أو المقدمة الجزرية
  keyPoints: string[];
  quiz: TajweedLessonQuiz[]; // ✏️ الاختبار الذاتي للدرس
  minPassingScore?: number; // نسبة النجاح المخصصة للدرس أو تركها للنسبة العامة
  practicalRequirement: {
    title: string;
    instruction: string;
    versesToRecite: TajweedPracticeItem[];
  };
}

export interface StudentCurriculumProgress {
  lessonId: string;
  studentId: string;
  status: 'locked' | 'available' | 'in_progress' | 'passed' | 'failed';
  score: number; // درجة الاختبار المحرزة
  totalQuestions: number; // إجمالي الأسئلة
  percentage: number; // النسبة المئوية %
  attemptsCount: number; // عدد المحاولات
  completedAt?: string; // تاريخ الإنجاز واجتياز الاختبار
  lastAttemptAt?: string; // تاريخ آخر محاولة
}

export interface CurriculumGlobalSettings {
  minPassingScorePercent: number; // نسبة الاجتياز المقررة من الإدارة (افتراضي 80%)
  allowRetakes: boolean;
  lockNextUntilPassed: boolean;
  updatedAt?: string;
}

export interface TajweedChapter {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  badgeName: string;
  iconName: string;
  description: string;
  lessons: TajweedLesson[];
}

export interface WirdReminderSettings {
  enabled: boolean;
  time: string; // e.g. "05:30"
  preset: 'fajr' | 'duha' | 'asr' | 'maghrib' | 'isha' | 'custom';
  presetLabel: string;
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  targetPages: number;
  lastNotifiedDate?: string;
  daysOfWeek: number[]; // [0,1,2,3,4,5,6]
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'wird_reminder' | 'honor_board' | 'evaluation' | 'system' | 'halqa' | 'favorite_sheikh';
  isRead: boolean;
  timestamp: number;
  sheikhName?: string;
  halqaId?: string;
  halqaTitle?: string;
  meetUrl?: string;
  isFavoriteSheikh?: boolean;
}

export interface HonorStudent {
  studentId: string;
  studentName: string;
  studentSection: 'male' | 'female';
  rank: number;
  averageScore: number;
  totalRecitations: number;
  excellentCount: number;
  attendanceRate: number;
  lastSurah: string;
  memorizedJuzCount: number;
  praiseBadge: string;
  teacherFeedback?: string;
  evaluatorTeacher: string;
  congratulationsCount: number;
}

export interface AuthAccount {
  id: string;
  academicId?: string;
  username: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole | 'supervisor';
  isActive?: boolean;
  emailVerified?: boolean;
  section?: 'male' | 'female' | 'both';
  gender?: 'male' | 'female';
  password?: string;
  avatarUrl?: string;
  titleBadge?: string;
  assignedHalqaTitle?: string;
  assignedHalqaId?: string;
  registeredAt?: string;
  status?: 'approved' | 'pending' | 'rejected';
  age?: number;
  cityCountry?: string;
  country?: string;
  memorizationLevel?: string;
  studyType?: 'foundation' | 'memorization' | 'review' | 'consolidation' | 'sanad' | string;
  riwayah?: string;
  preferredTime?: string;
  preferredTimeDetail?: string;
  qualification?: string;
  experience?: string;
  specialization?: string;
  requestNotes?: string;
}

export interface StudentAttendanceEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentSection: 'male' | 'female';
  halqaId: string;
  halqaTitle: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused';
  recordedByTeacher: string;
  notes?: string;
  notificationSent?: boolean;
  notifiedAt?: string;
}

export type { RegisteredStudent, RegisteredTeacher } from './data/registrationStore';




export interface TaskItem {
  id: string;
  title: string;
  type: 'memorization' | 'revision' | 'halqa' | 'recitation' | 'exam' | 'general';
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  halqaId?: string;
  halqaTitle?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  surahName?: string;
  fromAyah?: number;
  toAyah?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  halqaId?: string;
  halqaTitle: string;
  teacherId?: string;
  teacherName: string;
  studentId?: string;
  studentName?: string;
  section?: 'male' | 'female' | 'both';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  timeDisplay: string;
  durationMinutes: number;
  meetingUrl?: string;
  type: 'halqa' | 'individual' | 'exam' | 'lecture';
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  notes?: string;
}
