/**
 * خدمة التحفيظ الذكي بالذكاء الاصطناعي (Gemini) لمقرأة رحاب القرآن الإلكترونية
 * تقسم السور القرآنية إلى مقاطع تسميع يومية قصيرة محكمة بناءً على مستوى حفظ الطالب الحالي
 */

export type StudentMemorizationLevel = 'beginner' | 'intermediate' | 'advanced' | 'hafiz' | 'kids';

export interface SmartDailySegment {
  dayNumber: number;
  title: string;
  fromAyah: number;
  toAyah: number;
  ayahCount: number;
  textSnippet: string;
  meaningSummary: string;
  recommendedListenReps: number;
  recommendedReciteReps: number;
  estimatedMinutes: number;
  dailyCumulativeReview: string;
  tajweedTip: string;
  sheikhEncouragement: string;
  completed?: boolean;
  completedAt?: string;
}

export interface SmartMemorizationPlan {
  id: string;
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  fromAyah: number;
  toAyah: number;
  studentLevel: StudentMemorizationLevel;
  studentLevelLabel: string;
  totalDays: number;
  dailyAvailableMinutes: number;
  riwayah: string;
  overviewSummary: string;
  generatedAt: string;
  dailySegments: SmartDailySegment[];
}

export interface GenerateSmartPlanParams {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  fromAyah?: number;
  toAyah?: number;
  studentLevel: StudentMemorizationLevel;
  dailyAvailableMinutes?: number;
  targetDays?: number;
  riwayah?: string;
  studentName?: string;
}

const STORAGE_KEY = 'rehab_smart_memorization_plans_v1';
const ACTIVE_PLAN_KEY = 'rehab_active_smart_plan_id';

/**
 * جلب جميع خطط التحفيظ الذكية المحفوظة للطالب
 */
export function getSavedSmartPlans(): SmartMemorizationPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load saved smart plans:', err);
    return [];
  }
}

/**
 * حفظ خطة جديدة أو تحديث خطة قائمة
 */
export function saveSmartPlan(plan: SmartMemorizationPlan): void {
  try {
    const plans = getSavedSmartPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.unshift(plan);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    localStorage.setItem(ACTIVE_PLAN_KEY, plan.id);
    window.dispatchEvent(new CustomEvent('smart_memorization_updated', { detail: plan }));
  } catch (err) {
    console.error('Failed to save smart plan:', err);
  }
}

/**
 * حذف خطة تحفيظ ذكية
 */
export function deleteSmartPlan(planId: string): void {
  try {
    const plans = getSavedSmartPlans().filter(p => p.id !== planId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    const active = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (active === planId) {
      if (plans.length > 0) {
        localStorage.setItem(ACTIVE_PLAN_KEY, plans[0].id);
      } else {
        localStorage.removeItem(ACTIVE_PLAN_KEY);
      }
    }
    window.dispatchEvent(new CustomEvent('smart_memorization_updated'));
  } catch (err) {
    console.error('Failed to delete smart plan:', err);
  }
}

/**
 * جلب الخطة النشطة حالياً
 */
export function getActiveSmartPlan(): SmartMemorizationPlan | null {
  const plans = getSavedSmartPlans();
  if (plans.length === 0) return null;
  const activeId = localStorage.getItem(ACTIVE_PLAN_KEY);
  if (activeId) {
    const found = plans.find(p => p.id === activeId);
    if (found) return found;
  }
  return plans[0];
}

/**
 * تعيين خطة كخطة نشطة
 */
export function setActiveSmartPlanId(planId: string): void {
  localStorage.setItem(ACTIVE_PLAN_KEY, planId);
  window.dispatchEvent(new CustomEvent('smart_memorization_updated'));
}

/**
 * تبديل حالة إنجاز مقطع يومي (تم الحفظ والتسميع)
 */
export function toggleDailySegmentCompletion(planId: string, dayNumber: number): SmartMemorizationPlan | null {
  const plans = getSavedSmartPlans();
  const plan = plans.find(p => p.id === planId);
  if (!plan) return null;

  const segment = plan.dailySegments.find(s => s.dayNumber === dayNumber);
  if (!segment) return null;

  segment.completed = !segment.completed;
  segment.completedAt = segment.completed ? new Date().toISOString() : undefined;

  saveSmartPlan(plan);
  return plan;
}

/**
 * حساب نسبة إنجاز الخطة
 */
export function calculatePlanProgress(plan: SmartMemorizationPlan): {
  completedDays: number;
  totalDays: number;
  percentage: number;
  isAllCompleted: boolean;
} {
  if (!plan.dailySegments || plan.dailySegments.length === 0) {
    return { completedDays: 0, totalDays: 0, percentage: 0, isAllCompleted: false };
  }
  const completedDays = plan.dailySegments.filter(s => !!s.completed).length;
  const totalDays = plan.dailySegments.length;
  const percentage = Math.round((completedDays / totalDays) * 100);
  return {
    completedDays,
    totalDays,
    percentage,
    isAllCompleted: completedDays === totalDays && totalDays > 0,
  };
}

/**
 * إرسال طلب الذكاء الاصطناعي (Gemini) إلى الخادم لتقسيم السورة وبناء الخطة
 */
export async function requestSmartMemorizationPlan(
  params: GenerateSmartPlanParams
): Promise<{ status: string; source?: string; plan: SmartMemorizationPlan }> {
  const response = await fetch('/api/smart-memorization/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'فشل في توليد الخطة الذكية من الخادم');
  }

  const data = await response.json();
  if (data.plan) {
    saveSmartPlan(data.plan);
  }
  return data;
}
