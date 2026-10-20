/**
 * Academy Database Store for 'مقرأة رحاب القرآن الإلكترونية'
 * Handles all 11 core collections:
 * users, students, teachers, classes, lessons, attendance,
 * memorization, reviews, evaluations, announcements, schedules.
 *
 * Implements persistent server synchronization + robust client fallback.
 */

import { syncStudentToFirestore, syncTeacherToFirestore, syncAttendanceToFirestore, syncUserToFirestore } from './firebaseSync';
import { getFirebaseAuthHeaders } from '../lib/firebase';
import { AuthAccount } from '../types';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'supervisor';
  section: 'male' | 'female' | 'both';
  academicId: string;
  avatarUrl?: string;
  status?: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export interface DbTeacher {
  id: string;
  userId: string;
  academicId?: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  section: 'male' | 'female' | 'both';
  experienceYears: number;
  activeStudentsCount: number;
  classesCount: number;
  specialty: string;
  status: 'active' | 'on_leave' | 'pending';
  isApproved?: boolean;
  teachingExperience?: string;
  requestNotes?: string;
  registeredAt?: string;
}

export interface DbClass {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  section: 'male' | 'female';
  scheduleTime: string; // e.g. "05:30 ص - بعد صلاة الفجر"
  days: string[]; // ["السبت", "الإثنين", "الأربعاء"]
  meetUrl: string;
  targetLevel: string;
  maxStudents: number;
  enrolledCount: number;
  active: boolean;
}

export interface DbStudent {
  id: string;
  userId: string;
  academicId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  cityCountry: string;
  studyType: 'foundation' | 'memorization' | 'review' | 'consolidation' | 'sanad';
  riwayah?: string;
  preferredTime?: string;
  preferredTimeDetail?: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  currentJuz: number;
  currentSurah: string;
  currentAyahStart: number;
  currentAyahEnd: number;
  totalMemorizedPages: number;
  attendanceRate: number; // e.g. 96
  lastAttendanceDate: string;
  lastRecitationDate: string;
  lastScore: number;
  lastGrade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج متابعة';
  nextLessonDate: string;
  nextLessonSurah: string;
  notes: string;
  registeredAt: string;
}

export interface DbLesson {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  date: string;
  timeSlot: string;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  type: 'memorization' | 'review' | 'consolidation';
  roomUrl?: string;
}

export interface DbAttendance {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface DbMemorization {
  id: string;
  studentId: string;
  surahName: string;
  juzNumber: number;
  fromAyah: number;
  toAyah: number;
  pagesCount: number;
  date: string;
  status: 'completed' | 'in_progress';
  score?: number;
  notes?: string;
}

export interface DbReview {
  id: string;
  studentId: string;
  surahName: string;
  juzNumber: number;
  fromAyah: number;
  toAyah: number;
  quality: 'ممتاز' | 'جيد جداً' | 'متوسط';
  teacherId: string;
  date: string;
  notes?: string;
}

export interface DbEvaluation {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  surah: string;
  fromAyah: number;
  toAyah: number;
  lessonType: 'حفظ' | 'مراجعة' | 'تثبيت';
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج متابعة';
  score: number; // 0 - 100
  hifzScore?: number; // درجة الحفظ والضبط 0 - 100
  tajweedScore?: number; // درجة التجويد والمخارج 0 - 100
  tajweedNotes?: string;
  tajweedRulesMastered?: string[];
  teacherNotes: string;
  createdAt: string;
}

export interface DbAnnouncement {
  id: string;
  title: string;
  content: string;
  targetRole: 'all' | 'students' | 'teachers';
  authorName: string;
  date: string;
  priority: 'normal' | 'urgent';
}

export interface DbSchedule {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  studentId?: string;
  dayName: string;
  timeSlot: string;
  period: 'fajr' | 'duha' | 'asr' | 'maghrib' | 'isha';
  roomUrl: string;
}

export interface AcademyDatabase {
  users: DbUser[];
  students: DbStudent[];
  teachers: DbTeacher[];
  classes: DbClass[];
  lessons: DbLesson[];
  attendance: DbAttendance[];
  memorization: DbMemorization[];
  reviews: DbReview[];
  evaluations: DbEvaluation[];
  announcements: DbAnnouncement[];
  schedules: DbSchedule[];
}

const STORAGE_KEY = 'rehab_quran_academy_db_v2';

// Initial Seed Data with connected relationships (teacherId, classId)
export const INITIAL_ACADEMY_DATA: AcademyDatabase = {
  users: [
    {
      id: 'usr-supervisor',
      name: 'المشرف العام على المقرأة',
      email: 'supervisor@rehabquran.org',
      phone: '0967713801916',
      academicId: 'ADM-1996',
      role: 'supervisor',
      section: 'both',
      createdAt: '2026-01-01',
    },
    {
      id: 'usr-t1',
      name: 'الشيخ إبراهيم الوصابي',
      email: 'ibrahim@rehabquran.org',
      phone: '0967711223344',
      academicId: 'TCH-101',
      role: 'teacher',
      section: 'male',
      createdAt: '2026-01-05',
    },
    {
      id: 'usr-t2',
      name: 'الشيخة أم أنس الزبيدي',
      email: 'um.anas@rehabquran.org',
      phone: '0967711607573',
      academicId: 'TCH-102',
      role: 'teacher',
      section: 'female',
      createdAt: '2026-01-06',
    },
    {
      id: 'usr-s1',
      name: 'عبدالرحمن باجعفر',
      email: 'abdulrahman@example.com',
      phone: '0967771234567',
      academicId: 'STU-2026-01',
      role: 'student',
      section: 'male',
      createdAt: '2026-01-10',
    },
    {
      id: 'usr-s2',
      name: 'فاطمة الزهراء الشامي',
      email: 'fatimah@example.com',
      phone: '0967733445566',
      academicId: 'STU-2026-02',
      role: 'student',
      section: 'female',
      createdAt: '2026-01-12',
    },
    {
      id: '3LlkSUg5DlRtTVArWVQrWNAE5mN2',
      name: 'عبدالله محمد المنصوري',
      email: 'user_rq_2026_6365@rehab-quran.com',
      phone: '0967771636500',
      academicId: 'RQ-2026-6365',
      role: 'student',
      section: 'male',
      status: 'approved',
      createdAt: '2026-02-01',
    }
  ],
  teachers: [
    {
      id: 'tch-1',
      userId: 'usr-t1',
      name: 'الشيخ إبراهيم الوصابي',
      email: 'ibrahim@rehabquran.org',
      phone: '0967711223344',
      qualification: 'مجاز بالقراءات العشر الصغرى والكبرى بسند متصل',
      section: 'male',
      experienceYears: 14,
      activeStudentsCount: 28,
      classesCount: 2,
      specialty: 'الإتقان والتجويد وإقراء السند',
      status: 'active',
    },
    {
      id: 'tch-2',
      userId: 'usr-t2',
      name: 'الشيخة أم أنس الزبيدي',
      email: 'um.anas@rehabquran.org',
      phone: '0967711607573',
      qualification: 'مجازة برواية حفص وشعبة ومدرّسة التحفة والجزرية',
      section: 'female',
      experienceYears: 10,
      activeStudentsCount: 32,
      classesCount: 2,
      specialty: 'حفظ وتثبيت القرآن للأخوات',
      status: 'active',
    }
  ],
  classes: [
    {
      id: 'cls-m1',
      name: 'حلقة الإتقان والتحفيظ (الفجر - بنين)',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      section: 'male',
      scheduleTime: '05:30 ص - بعد الفجر',
      days: ['السبت', 'الإثنين', 'الأربعاء'],
      meetUrl: 'https://meet.google.com/quran-rehab-male',
      targetLevel: 'الحفظ والمراجعة المكثفة',
      maxStudents: 25,
      enrolledCount: 18,
      active: true,
    },
    {
      id: 'cls-f1',
      name: 'حلقة الزهراوان لتثبيت الحفظ (عصراً - أخوات)',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      section: 'female',
      scheduleTime: '04:00 م - عصراً',
      days: ['الأحد', 'الثلاثاء', 'الخميس'],
      meetUrl: 'https://meet.google.com/quran-rehab-female',
      targetLevel: 'تثبيت الأجزاء وضبط المتشابهات',
      maxStudents: 25,
      enrolledCount: 21,
      active: true,
    }
  ],
  students: [
    {
      id: 'stu-1',
      userId: 'usr-s1',
      academicId: 'STU-2026-01',
      name: 'عبدالرحمن باجعفر',
      email: 'abdulrahman@example.com',
      phone: '0967771234567',
      age: 21,
      gender: 'male',
      cityCountry: 'صنعاء / اليمن',
      studyType: 'memorization',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      classId: 'cls-m1',
      className: 'حلقة الإتقان والتحفيظ (الفجر - بنين)',
      currentJuz: 18,
      currentSurah: 'الكهف',
      currentAyahStart: 1,
      currentAyahEnd: 31,
      totalMemorizedPages: 360,
      attendanceRate: 98,
      lastAttendanceDate: 'اليوم',
      lastRecitationDate: 'أمس',
      lastScore: 98,
      lastGrade: 'ممتاز',
      nextLessonDate: 'غداً 05:30 ص',
      nextLessonSurah: 'سورة الكهف (32 - 60)',
      notes: 'طالب مجتهد متميز في إخراج الحروف وتطبيق أحكام المد',
      registeredAt: '2026-01-10',
    },
    {
      id: 'stu-2',
      userId: 'usr-s2',
      academicId: 'STU-2026-02',
      name: 'فاطمة الزهراء الشامي',
      email: 'fatimah@example.com',
      phone: '0967733445566',
      age: 23,
      gender: 'female',
      cityCountry: 'عدن / اليمن',
      studyType: 'consolidation',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      classId: 'cls-f1',
      className: 'حلقة الزهراوان لتثبيت الحفظ (عصراً - أخوات)',
      currentJuz: 25,
      currentSurah: 'الجاثية',
      currentAyahStart: 1,
      currentAyahEnd: 20,
      totalMemorizedPages: 500,
      attendanceRate: 95,
      lastAttendanceDate: 'أمس',
      lastRecitationDate: 'أمس',
      lastScore: 96,
      lastGrade: 'ممتاز',
      nextLessonDate: 'الثلاثاء 04:00 م',
      nextLessonSurah: 'سورة الجاثية (21 - 37)',
      notes: 'تثبيت ممتاز ومتقن لأحكام الوقف والابتداء',
      registeredAt: '2026-01-12',
    },
    {
      id: 'stu-6365',
      userId: '3LlkSUg5DlRtTVArWVQrWNAE5mN2',
      academicId: 'RQ-2026-6365',
      name: 'عبدالله محمد المنصوري',
      email: 'user_rq_2026_6365@rehab-quran.com',
      phone: '0967771636500',
      age: 20,
      gender: 'male',
      cityCountry: 'صنعاء / اليمن',
      studyType: 'memorization',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      classId: 'cls-m1',
      className: 'حلقة الإتقان والتحفيظ (الفجر - بنين)',
      currentJuz: 10,
      currentSurah: 'يونس',
      currentAyahStart: 1,
      currentAyahEnd: 20,
      totalMemorizedPages: 200,
      attendanceRate: 100,
      lastAttendanceDate: 'اليوم',
      lastRecitationDate: 'اليوم',
      lastScore: 100,
      lastGrade: 'ممتاز',
      nextLessonDate: 'غداً 05:30 ص',
      nextLessonSurah: 'سورة يونس (21 - 40)',
      notes: 'طالب معتمد بالرقم الأكاديمي RQ-2026-6365',
      registeredAt: '2026-02-01',
    }
  ],
  lessons: [
    {
      id: 'lsn-1',
      classId: 'cls-m1',
      teacherId: 'tch-1',
      title: 'تسميع الربع الأول من سورة الكهف',
      date: '2026-09-17',
      timeSlot: '05:30 ص',
      surahName: 'الكهف',
      fromAyah: 1,
      toAyah: 31,
      type: 'memorization',
      roomUrl: 'https://meet.google.com/quran-rehab-male'
    },
    {
      id: 'lsn-2',
      classId: 'cls-f1',
      teacherId: 'tch-2',
      title: 'مراجعة وتثبيت صدر سورة الجاثية',
      date: '2026-09-17',
      timeSlot: '04:00 م',
      surahName: 'الجاثية',
      fromAyah: 1,
      toAyah: 20,
      type: 'review',
      roomUrl: 'https://meet.google.com/quran-rehab-female'
    }
  ],
  attendance: [
    {
      id: 'att-1',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      classId: 'cls-m1',
      date: '2026-09-16',
      status: 'present',
      notes: 'حضور باكر في موعد الحلقة'
    },
    {
      id: 'att-2',
      studentId: 'stu-2',
      studentName: 'فاطمة الزهراء الشامي',
      teacherId: 'tch-2',
      classId: 'cls-f1',
      date: '2026-09-15',
      status: 'present',
      notes: 'حاضرة ومنضبطة'
    }
  ],
  memorization: [
    {
      id: 'mem-1',
      studentId: 'stu-1',
      surahName: 'الكهف',
      juzNumber: 15,
      fromAyah: 1,
      toAyah: 31,
      pagesCount: 5,
      date: '2026-09-15',
      status: 'completed',
      score: 98,
      notes: 'إتقان تام للآيات مع مخارج ممتازة'
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      studentId: 'stu-1',
      surahName: 'الإسراء',
      juzNumber: 15,
      fromAyah: 1,
      toAyah: 50,
      quality: 'ممتاز',
      teacherId: 'tch-1',
      date: '2026-09-14',
      notes: 'سرد متواصل بدون تردد'
    }
  ],
  evaluations: [
    {
      id: 'eval-1',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      date: '2026-09-15',
      surah: 'سورة الكهف',
      fromAyah: 1,
      toAyah: 31,
      lessonType: 'حفظ',
      grade: 'ممتاز',
      score: 98,
      hifzScore: 99,
      tajweedScore: 97,
      tajweedNotes: 'إتقان تام لأحكام المد المتصل والمنفصل، مع تفخيم حروف الاستعلاء بشكل ممتاز.',
      tajweedRulesMastered: ['المد المتصل والمنفصل', 'حروف الاستعلاء', 'القلقلة الصغرى'],
      teacherNotes: 'ما شاء الله تبارك الله، تلاوة خاشعة وإتقان تام للمد المتصل والمنفصل، بارك الله فيك ونفع بك.',
      createdAt: '2026-09-15 06:15'
    },
    {
      id: 'eval-1b',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      date: '2026-09-12',
      surah: 'سورة الإسراء',
      fromAyah: 80,
      toAyah: 111,
      lessonType: 'تثبيت',
      grade: 'ممتاز',
      score: 96,
      hifzScore: 97,
      tajweedScore: 95,
      tajweedNotes: 'مراعاة دقيقة للوقف والابتداء والهمس في حرف الكاف والتاء.',
      tajweedRulesMastered: ['الوقف والابتداء', 'صفة الهمس'],
      teacherNotes: 'تثبيت متين وسرد سلس وسريع مع الالتزام بمخارج الحروف.',
      createdAt: '2026-09-12 06:10'
    },
    {
      id: 'eval-1c',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      date: '2026-09-08',
      surah: 'سورة الإسراء',
      fromAyah: 40,
      toAyah: 79,
      lessonType: 'حفظ',
      grade: 'ممتاز',
      score: 94,
      hifzScore: 95,
      tajweedScore: 93,
      tajweedNotes: 'ضبط غنة الإخفاء الحقيقي عند القاف والكاف.',
      tajweedRulesMastered: ['الإخفاء الحقيقي', 'الغنة بمقدار حركتين'],
      teacherNotes: 'حفظ طيب، مع تحسن ملحوظ في ضبط أزمنة الغنن.',
      createdAt: '2026-09-08 06:20'
    },
    {
      id: 'eval-1d',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      date: '2026-09-04',
      surah: 'سورة الإسراء',
      fromAyah: 1,
      toAyah: 39,
      lessonType: 'حفظ',
      grade: 'جيد جداً',
      score: 92,
      hifzScore: 93,
      tajweedScore: 90,
      tajweedNotes: 'تنبيه على عدم تكرار الراء في الرحمن والرحيم.',
      tajweedRulesMastered: ['أحكام الراء', 'صفة التكرير'],
      teacherNotes: 'بداية موفقة في الحزب، تكرار الآيات سيثبت الحفظ أكثر.',
      createdAt: '2026-09-04 06:30'
    },
    {
      id: 'eval-1e',
      studentId: 'stu-1',
      studentName: 'عبدالرحمن باجعفر',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      date: '2026-08-30',
      surah: 'سورة النحل',
      fromAyah: 90,
      toAyah: 128,
      lessonType: 'تثبيت',
      grade: 'جيد جداً',
      score: 90,
      hifzScore: 91,
      tajweedScore: 88,
      tajweedNotes: 'التركيز على إتمام الحركات والكسر الخالص.',
      tajweedRulesMastered: ['إتمام الحركات'],
      teacherNotes: 'جهد مبارك وتقدم متصاعد، استمر في الاستماع للمقرئ المتقن.',
      createdAt: '2026-08-30 06:15'
    },
    {
      id: 'eval-2',
      studentId: 'stu-2',
      studentName: 'فاطمة الزهراء الشامي',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      date: '2026-09-14',
      surah: 'سورة الدخان',
      fromAyah: 1,
      toAyah: 59,
      lessonType: 'تثبيت',
      grade: 'ممتاز',
      score: 97,
      hifzScore: 98,
      tajweedScore: 96,
      tajweedNotes: 'تثبيت متين ومراعاة دقيقة للغنن والقلقلة، حفظكِ الله ووفقكِ لختم كتابه.',
      tajweedRulesMastered: ['الإدغام بغنة', 'مراتب القلقلة', 'مخارج الحلق'],
      teacherNotes: 'تثبيت متين ومراعاة دقيقة للغنن والقلقلة، حفظكِ الله ووفقكِ لختم كتابه.',
      createdAt: '2026-09-14 17:00'
    },
    {
      id: 'eval-2b',
      studentId: 'stu-2',
      studentName: 'فاطمة الزهراء الشامي',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      date: '2026-09-10',
      surah: 'سورة الجاثية',
      fromAyah: 1,
      toAyah: 20,
      lessonType: 'حفظ',
      grade: 'ممتاز',
      score: 95,
      hifzScore: 96,
      tajweedScore: 94,
      tajweedNotes: 'أداء متميز في المد اللازم الحرفي والكلمي.',
      tajweedRulesMastered: ['المد اللازم الكلمي', 'المد اللازم الحرفي'],
      teacherNotes: 'تلاوة ندية ومتقنة، مع التزام تام بأحكام الوقف.',
      createdAt: '2026-09-10 16:45'
    },
    {
      id: 'eval-2c',
      studentId: 'stu-2',
      studentName: 'فاطمة الزهراء الشامي',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      date: '2026-09-05',
      surah: 'سورة الأحقاف',
      fromAyah: 21,
      toAyah: 35,
      lessonType: 'تثبيت',
      grade: 'ممتاز',
      score: 94,
      hifzScore: 95,
      tajweedScore: 93,
      tajweedNotes: 'إتقان صفات الصفير والتفشي في السين والشين.',
      tajweedRulesMastered: ['صفة الصفير', 'صفة التفشي'],
      teacherNotes: 'حفظ راسخ وترتيل متقن وفق الضوابط المعتمدة.',
      createdAt: '2026-09-05 17:15'
    }
  ],
  announcements: [
    {
      id: 'anc-1',
      title: 'انطلاق دورة إتقان التجويد وتصحيح التلاوات',
      content: 'تعلن إدارة مقرأة رحاب القرآن الإلكترونية عن استمرار الحلقات الصباحية والمسائية لكافة الفئات وفق الخطة الأكاديمية المعتمدة.',
      targetRole: 'all',
      authorName: 'إدارة المقرأة',
      date: 'اليوم',
      priority: 'normal'
    },
    {
      id: 'anc-2',
      title: 'تنبيه بشأن اختبارات نهاية الربع الشهري',
      content: 'نحث جميع الطلاب والطالبات على استكمال مراجعة الأجزاء المقررة استعداداً للاختبارات الدورية ومنح شهادات الإنجاز المعتمدة.',
      targetRole: 'students',
      authorName: 'المشرف العام',
      date: 'أمس',
      priority: 'urgent'
    }
  ],
  schedules: [
    {
      id: 'sch-1',
      classId: 'cls-m1',
      className: 'حلقة الإتقان والتحفيظ (الفجر - بنين)',
      teacherId: 'tch-1',
      teacherName: 'الشيخ إبراهيم الوصابي',
      dayName: 'السبت - الإثنين - الأربعاء',
      timeSlot: '05:30 ص',
      period: 'fajr',
      roomUrl: 'https://meet.google.com/quran-rehab-male'
    },
    {
      id: 'sch-2',
      classId: 'cls-f1',
      className: 'حلقة الزهراوان لتثبيت الحفظ (عصراً - أخوات)',
      teacherId: 'tch-2',
      teacherName: 'الشيخة أم أنس الزبيدي',
      dayName: 'الأحد - الثلاثاء - الخميس',
      timeSlot: '04:00 م',
      period: 'asr',
      roomUrl: 'https://meet.google.com/quran-rehab-female'
    }
  ]
};

// Client cache and sync manager
export const getAcademyDatabase = (): AcademyDatabase => {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        const cachedUsers = Array.isArray(parsed.users) ? parsed.users.filter(Boolean).map((user: any) => {
          const safeUser = { ...user };
          delete safeUser.password;
          return safeUser;
        }) : INITIAL_ACADEMY_DATA.users;
        if (Array.isArray(parsed.users)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, users: cachedUsers }));
        }
        const mergedUsers = [...cachedUsers];
        INITIAL_ACADEMY_DATA.users.forEach((u) => {
          if (!mergedUsers.some((ex: any) => ex && (ex.id === u.id || (ex.academicId && ex.academicId === u.academicId) || (ex.email && ex.email === u.email)))) {
            mergedUsers.push(u);
          }
        });

        const cachedStudents = Array.isArray(parsed.students) ? parsed.students.filter(Boolean) : [...INITIAL_ACADEMY_DATA.students];
        INITIAL_ACADEMY_DATA.students.forEach((s) => {
          if (!cachedStudents.some((ex: any) => ex && ((ex.academicId && ex.academicId === s.academicId) || ex.id === s.id))) {
            cachedStudents.push(s);
          }
        });

        return {
          users: mergedUsers,
          students: cachedStudents,
          teachers: Array.isArray(parsed.teachers) ? parsed.teachers.filter(Boolean) : INITIAL_ACADEMY_DATA.teachers,
          classes: Array.isArray(parsed.classes) ? parsed.classes.filter(Boolean) : INITIAL_ACADEMY_DATA.classes,
          lessons: Array.isArray(parsed.lessons) ? parsed.lessons.filter(Boolean) : INITIAL_ACADEMY_DATA.lessons,
          attendance: Array.isArray(parsed.attendance) ? parsed.attendance.filter(Boolean) : INITIAL_ACADEMY_DATA.attendance,
          memorization: Array.isArray(parsed.memorization) ? parsed.memorization.filter(Boolean) : INITIAL_ACADEMY_DATA.memorization,
          reviews: Array.isArray(parsed.reviews) ? parsed.reviews.filter(Boolean) : INITIAL_ACADEMY_DATA.reviews,
          evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations.filter(Boolean) : INITIAL_ACADEMY_DATA.evaluations,
          announcements: Array.isArray(parsed.announcements) ? parsed.announcements.filter(Boolean) : INITIAL_ACADEMY_DATA.announcements,
          schedules: Array.isArray(parsed.schedules) ? parsed.schedules.filter(Boolean) : INITIAL_ACADEMY_DATA.schedules,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached database, falling back to initial data', e);
  }
  return INITIAL_ACADEMY_DATA;
};

export const saveAcademyDatabase = (data: AcademyDatabase) => {
  try {
    const safeData = {
      ...data,
      users: data.users.map((user) => {
        const safeUser = { ...user } as typeof user & { password?: string };
        delete safeUser.password;
        return safeUser;
      }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
    window.dispatchEvent(new CustomEvent('rehab_db_updated', { detail: safeData }));
    
    // Background sync to server if available
    getFirebaseAuthHeaders().then((authHeaders) => fetch('/api/db/sync', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(safeData)
    })).catch(() => {
      // offline or server quiet, local copy is primary and safe
    });
  } catch (e) {
    console.error('Failed to save academy database', e);
  }
};

// Initial background sync from server
export const syncWithServerDatabase = async () => {
  try {
    const authHeaders = await getFirebaseAuthHeaders();
    const res = await fetch('/api/db/all', { headers: authHeaders });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.users && serverData.students) {
        saveAcademyDatabase(serverData);
      }
    }
  } catch {
    // offline safe
  }
};

// Helper queries
export const getStudentByUserId = (userId: string): DbStudent | undefined => {
  const db = getAcademyDatabase();
  return db.students.find((s) => s.userId === userId);
};

export const getStudentById = (studentId: string): DbStudent | undefined => {
  const db = getAcademyDatabase();
  return db.students.find((s) => s.id === studentId);
};

export const getTeacherByUserId = (userId: string): DbTeacher | undefined => {
  const db = getAcademyDatabase();
  return db.teachers.find((t) => t.userId === userId);
};

export const getTeacherStudents = (teacherId: string): DbStudent[] => {
  const db = getAcademyDatabase();
  return db.students.filter((s) => s.teacherId === teacherId);
};

export const getStudentEvaluations = (studentId: string): DbEvaluation[] => {
  const db = getAcademyDatabase();
  return db.evaluations.filter((e) => e.studentId === studentId);
};

export const getStudentAttendance = (studentId: string): DbAttendance[] => {
  const db = getAcademyDatabase();
  return db.attendance.filter((a) => a.studentId === studentId);
};

export const addStudentEvaluation = (evaluation: Omit<DbEvaluation, 'id' | 'createdAt'>): DbEvaluation => {
  const db = getAcademyDatabase();
  const newEval: DbEvaluation = {
    ...evaluation,
    id: `eval-${Date.now()}`,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  db.evaluations.unshift(newEval);

  // Update student's last evaluation stats in students collection
  const studentIndex = db.students.findIndex((s) => s.id === evaluation.studentId);
  if (studentIndex >= 0) {
    const s = db.students[studentIndex];
    db.students[studentIndex] = {
      ...s,
      lastScore: evaluation.score,
      lastGrade: evaluation.grade,
      lastRecitationDate: evaluation.date,
      currentSurah: evaluation.surah,
      currentAyahStart: evaluation.fromAyah,
      currentAyahEnd: evaluation.toAyah,
      notes: evaluation.teacherNotes || s.notes
    };
  }

  saveAcademyDatabase(db);
  return newEval;
};

export const recordAttendance = (record: Omit<DbAttendance, 'id'>) => {
  const db = getAcademyDatabase();
  const newAtt: DbAttendance = {
    ...record,
    id: `att-${Date.now()}`
  };
  db.attendance.unshift(newAtt);
  
  // Update student attendance rate
  const studentRecords = db.attendance.filter((a) => a.studentId === record.studentId);
  const presentCount = studentRecords.filter((a) => a.status === 'present').length;
  const rate = Math.round((presentCount / Math.max(1, studentRecords.length)) * 100);

  const studentIndex = db.students.findIndex((s) => s.id === record.studentId);
  if (studentIndex >= 0) {
    db.students[studentIndex] = {
      ...db.students[studentIndex],
      lastAttendanceDate: record.date,
      attendanceRate: rate
    };
  }

  saveAcademyDatabase(db);
  // Sync to Firebase Firestore in background
  syncAttendanceToFirestore(newAtt).catch(() => {});
  return newAtt;
};

export const createNewStudentAccount = (data: {
  id?: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'male' | 'female';
  cityCountry: string;
  studyType: 'foundation' | 'memorization' | 'review' | 'consolidation' | 'sanad';
  riwayah?: string;
  preferredTime?: string;
  preferredTimeDetail?: string;
  memorizationLevel?: string;
}): { user: DbUser; student: DbStudent } => {
  const db = getAcademyDatabase();
  const timestamp = Date.now();
  const academicId = `STU-2026-${Math.floor(100 + Math.random() * 900)}`;
  const userId = data.id || `usr-${timestamp}`;
  const studentId = `stu-${timestamp}`;

  // Automatically assign appropriate teacher and class based on gender
  const assignedTeacher = data.gender === 'female' 
    ? (db.teachers.find((t) => t && t.section === 'female') || db.teachers[0])
    : (db.teachers.find((t) => t && t.section === 'male') || db.teachers[0]);

  const assignedClass = data.gender === 'female'
    ? (db.classes.find((c) => c && c.section === 'female') || db.classes[0])
    : (db.classes.find((c) => c && c.section === 'male') || db.classes[0]);

  const newUser: DbUser = {
    id: userId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    academicId,
    role: 'student',
    section: data.gender,
    status: 'approved',
    createdAt: new Date().toISOString().split('T')[0]
  };

  const studyTypeTitles: Record<string, string> = {
    foundation: 'تأسيس في القرآن الكريم',
    memorization: 'تحفيظ القرآن الكريم',
    review: 'مراجعة الحفظ',
    consolidation: 'تثبيت الحفظ',
    sanad: 'إجازة بالسند'
  };

  const formattedNotes = [
    `نوع الدراسة: ${studyTypeTitles[data.studyType] || data.studyType}`,
    `الرواية: ${data.riwayah || 'حفص عن عاصم'}`,
    `الوقت المناسب للحصة: ${data.preferredTime || 'الصباح'}${data.preferredTimeDetail ? ` (${data.preferredTimeDetail})` : ''}`,
    data.memorizationLevel ? `مستوى الحفظ: ${data.memorizationLevel}` : ''
  ].filter(Boolean).join(' | ');

  const newStudent: DbStudent = {
    id: studentId,
    userId,
    academicId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    age: data.age || 18,
    gender: data.gender,
    cityCountry: data.cityCountry.trim() || 'اليمن',
    studyType: data.studyType,
    riwayah: data.riwayah?.trim() || 'حفص عن عاصم',
    preferredTime: data.preferredTime?.trim() || 'الصباح',
    preferredTimeDetail: data.preferredTimeDetail?.trim() || '',
    teacherId: assignedTeacher?.id || (data.gender === 'female' ? 'tch-2' : 'tch-1'),
    teacherName: assignedTeacher?.name || (data.gender === 'female' ? 'الشيخة أم أنس الزبيدي' : 'الشيخ إبراهيم الوصابي'),
    classId: assignedClass?.id || (data.gender === 'female' ? 'cls-f1' : 'cls-m1'),
    className: assignedClass?.name || (data.gender === 'female' ? 'حلقة الزهراوان' : 'حلقة الإتقان'),
    currentJuz: 1,
    currentSurah: 'الفاتحة',
    currentAyahStart: 1,
    currentAyahEnd: 7,
    totalMemorizedPages: 0,
    attendanceRate: 100,
    lastAttendanceDate: 'اليوم (تسجيل جديد)',
    lastRecitationDate: '-',
    lastScore: 100,
    lastGrade: 'ممتاز',
    nextLessonDate: assignedClass?.scheduleTime || '05:30 ص - بعد صلاة الفجر',
    nextLessonSurah: 'سورة البقرة (1 - 25)',
    notes: formattedNotes,
    registeredAt: new Date().toISOString().split('T')[0]
  };

  // Add to collections
  db.users.push(newUser);
  db.students.push(newStudent);

  // Also increment class enrollment
  const classIdx = db.classes.findIndex((c) => c.id === assignedClass?.id);
  if (classIdx >= 0) {
    db.classes[classIdx].enrolledCount += 1;
  }

  saveAcademyDatabase(db);
  // Sync to Firebase Firestore in background
  syncStudentToFirestore(newStudent).catch(() => {});
  syncUserToFirestore(newUser).catch(() => {});
  return { user: newUser, student: newStudent };
};

export const createNewTeacherAccount = (data: {
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experienceYears?: number | string;
  teachingExperience?: string;
  specialty: string;
  requestNotes?: string;
  section?: 'male' | 'female' | 'both';
}): { user: DbUser; teacher: DbTeacher; isPending: boolean } => {
  const db = getAcademyDatabase();
  const timestamp = Date.now();
  const academicId = `TCH-2026-${Math.floor(100 + Math.random() * 900)}`;
  const userId = `usr-tch-${timestamp}`;
  const teacherId = `tch-${timestamp}`;

  const newUser: DbUser = {
    id: userId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    academicId,
    role: 'teacher',
    section: data.section || 'male',
    status: 'pending', // Requires supervisor review and approval
    createdAt: new Date().toISOString().split('T')[0]
  };

  const newTeacher: DbTeacher = {
    id: teacherId,
    userId,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    qualification: data.qualification.trim(),
    section: data.section || 'male',
    experienceYears: typeof data.experienceYears === 'number' ? data.experienceYears : parseInt(String(data.experienceYears || '3'), 10) || 3,
    activeStudentsCount: 0,
    classesCount: 0,
    specialty: data.specialty.trim() || 'تعليم القرآن الكريم والتجويد',
    status: 'pending',
    isApproved: false,
    teachingExperience: data.teachingExperience || '',
    requestNotes: data.requestNotes || '',
    registeredAt: new Date().toISOString().split('T')[0]
  };

  db.users.push(newUser);
  db.teachers.push(newTeacher);

  saveAcademyDatabase(db);

  // Sync to Firebase Firestore in background
  syncUserToFirestore(newUser).catch(() => {});
  syncTeacherToFirestore(newTeacher).catch(() => {});

  return { user: newUser, teacher: newTeacher, isPending: true };
};

export const approveTeacherAccount = (teacherIdentifier: string): boolean => {
  const db = getAcademyDatabase();
  const cleanId = teacherIdentifier.trim().toLowerCase();
  const teacherIdx = db.teachers.findIndex((t) => 
    (t.id && t.id.toLowerCase() === cleanId) || 
    (t.academicId && t.academicId.toLowerCase() === cleanId) ||
    (t.email && t.email.toLowerCase() === cleanId)
  );

  if (teacherIdx >= 0) {
    db.teachers[teacherIdx].status = 'active';
    db.teachers[teacherIdx].isApproved = true;

    // Update corresponding user in db.users
    const userId = db.teachers[teacherIdx].userId;
    const teacherEmail = db.teachers[teacherIdx].email;
    const userIdx = db.users.findIndex((u) => 
      u.id === userId || 
      (u.email && u.email.toLowerCase() === (teacherEmail || '').toLowerCase())
    );

    if (userIdx >= 0) {
      db.users[userIdx].status = 'approved';
      syncUserToFirestore(db.users[userIdx]).catch(() => {});
    }

    saveAcademyDatabase(db);
    syncTeacherToFirestore(db.teachers[teacherIdx]).catch(() => {});

    // Also update any authStore accounts matching this teacher
    try {
      const storedAccounts = localStorage.getItem('rehab_auth_accounts');
      if (storedAccounts) {
        const accounts: AuthAccount[] = JSON.parse(storedAccounts);
        let updated = false;
        accounts.forEach((acc) => {
          if (
            acc.id === userId || 
            (acc.email && acc.email.toLowerCase() === (teacherEmail || '').toLowerCase()) ||
            acc.name === db.teachers[teacherIdx].name
          ) {
            acc.status = 'approved';
            acc.titleBadge = 'معلم مقرأة معتمد';
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem('rehab_auth_accounts', JSON.stringify(accounts));
        }
      }
    } catch {}

    return true;
  }
  return false;
};
