/**
 * خدمة النظام الأكاديمي لتعليم القرآن الكريم
 * مقرأة رحاب القرآن الإلكترونية
 * تدير: خطط الحفظ، خطط المراجعة، جلسات التسميع، رصد الأخطاء الستة، والتقارير الأكاديمية
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AcademicSurahMeta, 
  ALL_114_SURAHS, 
  calculateMastery, 
  MasteryLevel, 
  QuranErrorType, 
  QURAN_ERROR_CATEGORIES 
} from '../data/quranAcademicData';

export const AI_ADVISORY_DISCLAIMER = 
  '⚠️ تنبيه شرعي وأكاديمي مُلزم: جميع ملاحظات الذكاء الاصطناعي هي توجيهات استرشادية مساعدة فقط صوناً لكتاب الله؛ ولا يُعتمد أي حكم شرعي أو تصحيح نهائي أو درجة إتقان إلا باعتماد المعلم البشري المختص المجاز بالسند المتصل.';

// ==========================================
// 1. نماذج بيانات النظام الأكاديمي (Interfaces)
// ==========================================

export type PlanPeriodType = 'daily' | 'weekly' | 'monthly';
export type PlanCategoryType = 'new_memorization' | 'minor_revision' | 'major_revision';

export interface AcademicPlanGoal {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  teacherName?: string;
  planCategory: PlanCategoryType;
  period: PlanPeriodType;
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  pageStart?: number;
  pageEnd?: number;
  juzNumber?: number;
  hizbNumber?: number;
  rubNumber?: number;
  riwayahId: string;
  riwayahName: string;
  curriculumId: string;
  curriculumTitle: string;
  targetDate: string; // ISO date YYYY-MM-DD
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completionPercentage: number; // 0 - 100
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionErrorCount {
  forgetting: number;          // نسيان وتوقف
  clear_mistake: number;       // لحن جلي
  hidden_mistake: number;      // لحن خفي
  tajweed_mistake: number;     // خطأ تجويدي
  waqf_ibtida_mistake: number; // وقف وابتداء
  hesitation: number;          // تردد / تلعثم
}

export interface AcademicRecitationSession {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  halqaTitle: string;
  sessionType: 'new_memorization' | 'minor_revision' | 'major_revision';
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  pageStart?: number;
  pageEnd?: number;
  juzNumber?: number;
  riwayah: string;
  curriculum: string;
  sessionDate: string; // YYYY-MM-DD
  durationMinutes: number;
  errors: SessionErrorCount;
  totalErrorsCount: number;
  deductedPoints: number;
  rawScore: number; // 0 - 100
  finalScore: number; // Approved score by teacher
  masteryLevel: string; // e.g. "ممتاز مرتفع"
  passed: boolean;
  teacherNotes: string;
  homeworkAssigned?: string;
  isTeacherApproved: boolean; // الضابط الشرعي: اعتماد المعلم البشري
  approvedByTeacherName: string;
  approvedAt: string;
  // AI Advisory Section:
  aiAdvisoryFeedback?: {
    keyRulesSuggested?: string[];
    frequentMistakesTips?: string[];
    makharajFocus?: string;
    sheikhEncouragement?: string;
    disclaimer: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AcademicSettingsConfig {
  defaultRiwayah: string;
  defaultCurriculum: string;
  totalQuranPages: number; // 604
  minPassingScore: number; // 60%
  overdueGraceDays: number; // days before showing overdue alert (e.g. 2)
  allowAiAdvisoryNotes: boolean;
  mandatoryHumanTeacherApproval: boolean;
}

export const DEFAULT_ACADEMIC_SETTINGS: AcademicSettingsConfig = {
  defaultRiwayah: 'hafs',
  defaultCurriculum: 'regular',
  totalQuranPages: 604,
  minPassingScore: 60,
  overdueGraceDays: 1,
  allowAiAdvisoryNotes: true,
  mandatoryHumanTeacherApproval: true
};

// ==========================================
// 2. دوال معالجة الخطط الأكاديمية (Plans)
// ==========================================

export function checkIsPlanOverdue(targetDate: string, status: string): { isOverdue: boolean; daysLate: number } {
  if (status === 'completed') return { isOverdue: false, daysLate: 0 };
  const target = new Date(targetDate).setHours(23, 59, 59, 999);
  const now = new Date().getTime();
  const diffDays = Math.floor((now - target) / (1000 * 60 * 60 * 24));
  return {
    isOverdue: diffDays > 0,
    daysLate: Math.max(0, diffDays)
  };
}

export async function fetchAcademicPlans(
  studentId?: string,
  category?: PlanCategoryType
): Promise<{ data: AcademicPlanGoal[]; error?: string }> {
  try {
    const plansRef = collection(db, 'academic_plans');
    let q = query(plansRef, orderBy('targetDate', 'asc'));

    if (studentId) {
      q = query(plansRef, where('studentId', '==', studentId), orderBy('targetDate', 'asc'));
    }

    const snapshot = await getDocs(q);
    const plans: AcademicPlanGoal[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AcademicPlanGoal));

    // Filter category if specified
    const filtered = category ? plans.filter(p => p.planCategory === category) : plans;
    return { data: filtered };
  } catch (err: any) {
    console.warn('Firestore fetchAcademicPlans error:', err);
    // Provide sensible initial data for offline / preview
    return {
      data: [
        {
          id: 'plan-demo-1',
          studentId: studentId || 'student-1',
          studentName: 'عبد الله صالح',
          teacherName: 'الشيخ د. علي عزيزي',
          planCategory: 'new_memorization',
          period: 'daily',
          surahNumber: 2,
          surahName: 'البقرة',
          ayahStart: 1,
          ayahEnd: 25,
          pageStart: 2,
          pageEnd: 4,
          juzNumber: 1,
          hizbNumber: 1,
          rubNumber: 1,
          riwayahId: 'hafs',
          riwayahName: 'حفص عن عاصم',
          curriculumId: 'regular',
          curriculumTitle: 'منهج الحفظ العام المنتظم',
          targetDate: new Date().toISOString().split('T')[0],
          status: 'in_progress',
          completionPercentage: 80,
          notes: 'تثبيت أحكام المد المتصل والمنفصل ومراعاة الوقف التام عند رؤوس الآي.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'plan-demo-2',
          studentId: studentId || 'student-1',
          studentName: 'عبد الله صالح',
          teacherName: 'الشيخ د. علي عزيزي',
          planCategory: 'minor_revision',
          period: 'weekly',
          surahNumber: 18,
          surahName: 'الكهف',
          ayahStart: 1,
          ayahEnd: 110,
          pageStart: 293,
          pageEnd: 304,
          juzNumber: 15,
          hizbNumber: 30,
          rubNumber: 118,
          riwayahId: 'hafs',
          riwayahName: 'حفص عن عاصم',
          curriculumId: 'mastery_murajaah',
          curriculumTitle: 'منهج الإتقان والتثبيت الراسخ',
          targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          completionPercentage: 35,
          notes: 'مراجعة أسبوعية سريعة قبل درس الجمعة.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
}

export async function saveAcademicPlan(
  plan: Partial<AcademicPlanGoal>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const plansRef = collection(db, 'academic_plans');
    const nowIso = new Date().toISOString();
    const payload = {
      ...plan,
      updatedAt: nowIso
    };

    if (plan.id && !plan.id.startsWith('plan-demo-')) {
      const docRef = doc(db, 'academic_plans', plan.id);
      await setDoc(docRef, payload, { merge: true });
      return { success: true, id: plan.id };
    } else {
      payload.createdAt = nowIso;
      const docRef = await addDoc(plansRef, payload);
      return { success: true, id: docRef.id };
    }
  } catch (err: any) {
    console.error('Error saving academic plan:', err);
    return { success: false, error: err?.message || 'تعذر حفظ الخطة' };
  }
}

export async function deleteAcademicPlan(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'academic_plans', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// ==========================================
// 3. احتساب درجات جلسة التسميع (Evaluation)
// ==========================================

export function calculateSessionScore(errors: SessionErrorCount): {
  totalErrors: number;
  deduction: number;
  calculatedScore: number;
  mastery: MasteryLevel;
} {
  let deduction = 0;
  let totalErrors = 0;

  QURAN_ERROR_CATEGORIES.forEach((cat) => {
    const count = errors[cat.id] || 0;
    totalErrors += count;
    deduction += count * cat.deductionPoints;
  });

  const calculatedScore = Math.max(0, Math.min(100, Math.round(100 - deduction)));
  const mastery = calculateMastery(calculatedScore);

  return {
    totalErrors,
    deduction: Number(deduction.toFixed(1)),
    calculatedScore,
    mastery
  };
}

export async function saveRecitationSession(
  session: Partial<AcademicRecitationSession>
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const sessionsRef = collection(db, 'academic_recitations');
    const nowIso = new Date().toISOString();
    const payload = {
      ...session,
      updatedAt: nowIso
    };

    if (session.id && !session.id.startsWith('rec-demo-')) {
      const docRef = doc(db, 'academic_recitations', session.id);
      await setDoc(docRef, payload, { merge: true });
      return { success: true, id: session.id };
    } else {
      payload.createdAt = nowIso;
      const docRef = await addDoc(sessionsRef, payload);
      return { success: true, id: docRef.id };
    }
  } catch (err: any) {
    console.error('Error saving recitation session:', err);
    return { success: false, error: err?.message || 'تعذر حفظ الجلسة' };
  }
}

export async function fetchRecitationSessions(
  studentId?: string,
  teacherId?: string
): Promise<{ data: AcademicRecitationSession[]; error?: string }> {
  try {
    const colRef = collection(db, 'academic_recitations');
    let q = query(colRef, orderBy('sessionDate', 'desc'), limit(50));

    if (studentId) {
      q = query(colRef, where('studentId', '==', studentId), orderBy('sessionDate', 'desc'), limit(50));
    } else if (teacherId) {
      q = query(colRef, where('teacherId', '==', teacherId), orderBy('sessionDate', 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    const list: AcademicRecitationSession[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AcademicRecitationSession));

    return { data: list };
  } catch (err: any) {
    console.warn('Firestore fetchRecitationSessions error:', err);
    return {
      data: [
        {
          id: 'rec-demo-1',
          studentId: studentId || 'student-1',
          studentName: 'عبد الله صالح',
          teacherId: 'teacher-1',
          teacherName: 'فضيلة الشيخ د. علي عزيزي',
          halqaTitle: 'حلقة فجر الإتقان - قسم الطلاب',
          sessionType: 'new_memorization',
          surahName: 'البقرة',
          ayahStart: 1,
          ayahEnd: 20,
          pageStart: 2,
          pageEnd: 4,
          juzNumber: 1,
          riwayah: 'حفص عن عاصم (طريق الشاطبية)',
          curriculum: 'منهج الحفظ العام المنتظم',
          sessionDate: new Date().toISOString().split('T')[0],
          durationMinutes: 18,
          errors: {
            forgetting: 0,
            clear_mistake: 0,
            hidden_mistake: 1,
            tajweed_mistake: 1,
            waqf_ibtida_mistake: 0,
            hesitation: 1
          },
          totalErrorsCount: 3,
          deductedPoints: 2.5,
          rawScore: 97.5,
          finalScore: 98,
          masteryLevel: 'ممتاز مرتفع (إتقان تام)',
          passed: true,
          teacherNotes: 'تلاوة طيبة جداً وصوت خاشع ومخارج فصيحة، مع لفت الانتباه لترقيق راء (الرَّحْمَنِ) عند الوصل.',
          homeworkAssigned: 'حفظ الآيات 21 إلى 35 من سورة البقرة + مراجعة الوجهين الأولين.',
          isTeacherApproved: true,
          approvedByTeacherName: 'الشيخ د. علي عزيزي',
          approvedAt: new Date().toISOString(),
          aiAdvisoryFeedback: {
            keyRulesSuggested: ['أحكام النون والميم المشددتين', 'المد المنفصل في ﴿بِمَا أُنزِلَ﴾', 'تفخيم لام اسم الجلالة'],
            frequentMistakesTips: ['تجنب تمطيط حركة الفتحة في ﴿الَّذِينَ﴾', 'الاعتناء ببيان قلقلة الدال في ﴿هُدًى﴾'],
            sheikhEncouragement: 'ما شاء الله تبارك الله، تلاوة متقنة وثابتة، داوم على المراجعة قبل النوم.',
            disclaimer: AI_ADVISORY_DISCLAIMER
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
}

// ==========================================
// 4. استدعاء مساعد الذكاء الاصطناعي الاسترشادي
// ==========================================

export async function requestAiTajweedAdvisory(
  surahName: string,
  ayahStart: number,
  ayahEnd: number,
  textSnippet?: string
): Promise<{
  success: boolean;
  feedback?: {
    keyRulesSuggested: string[];
    frequentMistakesTips: string[];
    makharajFocus: string;
    sheikhEncouragement: string;
    disclaimer: string;
  };
  error?: string;
}> {
  try {
    const res = await fetch('/api/tajweed/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surahName,
        ayahStart,
        ayahEnd,
        textSnippet
      })
    });

    const data = await res.json();
    if (data.status === 'success' && data.analysis) {
      return {
        success: true,
        feedback: {
          keyRulesSuggested: data.analysis.keyRules || ['أحكام النون الساكنة', 'المدود والغنن'],
          frequentMistakesTips: data.analysis.frequentMistakes || ['عدم مد الحروف الطبيعية', 'الإسراع'],
          makharajFocus: data.analysis.makharajFocus || 'مخرج اللسان وحروف الحلق',
          sheikhEncouragement: data.analysis.sheikhTip || 'اقرأ وارتق ورتل كما كنت ترتل.',
          disclaimer: AI_ADVISORY_DISCLAIMER
        }
      };
    } else {
      return {
        success: false,
        error: data?.message || 'تعذر تحميل البيانات، حاول مرة أخرى.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: 'تعذر تحميل البيانات، حاول مرة أخرى.'
    };
  }
}

// ==========================================
// 5. إعدادات الإدارة الأكاديمية (Settings)
// ==========================================

export async function fetchAcademicSettings(): Promise<AcademicSettingsConfig> {
  try {
    const docRef = doc(db, 'system_settings', 'academic_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_ACADEMIC_SETTINGS, ...snap.data() };
    }
  } catch (e) {
    console.warn('Could not fetch academic settings from Firestore, using default config:', e);
  }
  return DEFAULT_ACADEMIC_SETTINGS;
}

export async function saveAcademicSettings(config: Partial<AcademicSettingsConfig>): Promise<{ success: boolean }> {
  try {
    const docRef = doc(db, 'system_settings', 'academic_config');
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (e) {
    console.error('Could not save academic settings:', e);
    return { success: false };
  }
}
