import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  ScientificMatn, 
  MatnStudentProgress, 
  MatnRecitationSubmission, 
  MatnWeeklyExam, 
  MatnExamAttempt,
  MasteryLevel 
} from "../types/mutun";
import { 
  INITIAL_SCIENTIFIC_MUTUN, 
  createInitialStudentProgress, 
  getMatnById 
} from "../data/mutunData";

const MUTUN_COLLECTION = "scientific_mutun";
const PROGRESS_COLLECTION = "matn_student_progress";
const SUBMISSIONS_COLLECTION = "matn_recitation_submissions";
const EXAMS_COLLECTION = "matn_weekly_exams";
const EXAM_RESULTS_COLLECTION = "matn_exam_results";

// In-memory / localStorage cache for ultra-fast and lightweight loading
const LOCAL_STORAGE_MUTUN_KEY = "rihab_cached_scientific_mutun";
const LOCAL_STORAGE_PROGRESS_KEY = "rihab_cached_matn_progress_";

// =========================================================================
// 1. إدارة واسترجاع المتون العلمية
// =========================================================================

export async function fetchScientificMutun(): Promise<ScientificMatn[]> {
  try {
    // 1. فحص الكاش المحلي أولاً للتحميل الفوري فائق السرعة
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_MUTUN_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // تحديث في الخلفية دون تعطيل الواجهة
            fetchAndCacheMutunFromFirestore().catch(() => {});
            return parsed;
          }
        } catch {}
      }
    }

    return await fetchAndCacheMutunFromFirestore();
  } catch (err) {
    console.warn("[MutunService] Fallback to verified local mutun:", err);
    return INITIAL_SCIENTIFIC_MUTUN;
  }
}

async function fetchAndCacheMutunFromFirestore(): Promise<ScientificMatn[]> {
  try {
    const snap = await getDocs(collection(db, MUTUN_COLLECTION));
    if (!snap.empty) {
      const list: ScientificMatn[] = [];
      snap.forEach(d => {
        list.push({ ...d.data(), id: d.id } as ScientificMatn);
      });
      if (list.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_MUTUN_KEY, JSON.stringify(list));
        }
        return list;
      }
    }
  } catch (err) {
    console.warn("[MutunService] Could not reach Firestore for mutun:", err);
  }

  // إذا كانت المجموعة خالية أو في وضع عدم الاتصال، نستخدم المتون المعتمدة
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_MUTUN_KEY, JSON.stringify(INITIAL_SCIENTIFIC_MUTUN));
  }
  return INITIAL_SCIENTIFIC_MUTUN;
}

/**
 * حفظ أو تحديث متن علمي جديد من لوحة المشرف (دون تعديل الكود)
 */
export async function saveScientificMatn(matn: ScientificMatn): Promise<void> {
  const docRef = doc(db, MUTUN_COLLECTION, matn.id);
  const data = {
    ...matn,
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, data, { merge: true });

  // تحديث الكاش المحلي
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(LOCAL_STORAGE_MUTUN_KEY);
    let list: ScientificMatn[] = cached ? JSON.parse(cached) : [...INITIAL_SCIENTIFIC_MUTUN];
    const index = list.findIndex(m => m.id === matn.id);
    if (index >= 0) {
      list[index] = data;
    } else {
      list.push(data);
    }
    localStorage.setItem(LOCAL_STORAGE_MUTUN_KEY, JSON.stringify(list));
  }
}

// =========================================================================
// 2. إدارة وتتبع تقدم الطالب في الحفظ والمراجعة
// =========================================================================

export async function getStudentMatnProgress(
  studentId: string,
  matnId: string,
  studentName?: string,
  halqaId?: string,
  teacherId?: string
): Promise<MatnStudentProgress> {
  const progressDocId = `${studentId}_${matnId}`;
  const localKey = `${LOCAL_STORAGE_PROGRESS_KEY}${progressDocId}`;

  // 1. محاولة القراءة من الكاش المحلي
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // مزامنة غير متزامنة في الخلفية
        syncProgressFromFirestore(progressDocId, localKey).catch(() => {});
        return parsed;
      } catch {}
    }
  }

  // 2. محاولة القراءة من Firestore
  try {
    const snap = await getDoc(doc(db, PROGRESS_COLLECTION, progressDocId));
    if (snap.exists()) {
      const data = snap.data() as MatnStudentProgress;
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("[MutunService] Progress fetch warning:", err);
  }

  // 3. إنشاء سجل افتراضي للبدء إذا لم يوجد
  const matn = getMatnById(matnId) || INITIAL_SCIENTIFIC_MUTUN[0];
  const initial = createInitialStudentProgress(studentId, matn, studentName, halqaId, teacherId);

  // محاولة حفظه في Firestore
  setDoc(doc(db, PROGRESS_COLLECTION, progressDocId), initial, { merge: true }).catch(() => {});
  if (typeof window !== "undefined") {
    localStorage.setItem(localKey, JSON.stringify(initial));
  }

  return initial;
}

async function syncProgressFromFirestore(progressDocId: string, localKey: string): Promise<void> {
  try {
    const snap = await getDoc(doc(db, PROGRESS_COLLECTION, progressDocId));
    if (snap.exists()) {
      localStorage.setItem(localKey, JSON.stringify(snap.data()));
    }
  } catch {}
}

/**
 * حفظ نتائج المدارسة الذاتية والاختبار الذاتي من قِبل الطالب
 * (لا يستطيع الطالب تعديل اعتماد المعلم أو فتح المجموعة التالية)
 */
export async function recordStudentSelfStudy(
  studentId: string,
  matnId: string,
  groupId: string,
  quizScore: number,
  reviewIncrement: boolean = false
): Promise<MatnStudentProgress> {
  const progressDocId = `${studentId}_${matnId}`;
  const current = await getStudentMatnProgress(studentId, matnId);

  const existingGroup = current.groupProgress[groupId] || {
    groupId,
    groupNumber: current.currentGroupNumber,
    reviewCount: 0,
    selfQuizAttempts: 0,
    isTeacherApproved: false
  };

  const updatedAttempts = (existingGroup.selfQuizAttempts || 0) + 1;
  const bestScore = Math.max(existingGroup.selfQuizBestScore || 0, quizScore);
  const reviewCount = reviewIncrement ? (existingGroup.reviewCount || 0) + 1 : (existingGroup.reviewCount || 0);

  const updatedGroup = {
    ...existingGroup,
    selfQuizAttempts: updatedAttempts,
    selfQuizBestScore: bestScore,
    reviewCount,
    lastReviewedAt: new Date().toISOString()
  };

  const updatedProgress: MatnStudentProgress = {
    ...current,
    lastStudiedAt: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    groupProgress: {
      ...current.groupProgress,
      [groupId]: updatedGroup
    },
    updatedAt: new Date().toISOString()
  };

  // حفظ في Firestore
  const docRef = doc(db, PROGRESS_COLLECTION, progressDocId);
  await setDoc(docRef, updatedProgress, { merge: true }).catch(err => {
    console.warn("[MutunService] Firestore save error:", err);
  });

  // تحديث الكاش المحلي
  if (typeof window !== "undefined") {
    localStorage.setItem(`${LOCAL_STORAGE_PROGRESS_KEY}${progressDocId}`, JSON.stringify(updatedProgress));
  }

  return updatedProgress;
}

// =========================================================================
// 3. إرسال التسميع واعتماد المعلم
// =========================================================================

export async function submitMatnRecitation(submission: Omit<MatnRecitationSubmission, "id" | "status" | "submittedAt">): Promise<string> {
  const subData: Omit<MatnRecitationSubmission, "id"> = {
    ...submission,
    status: "pending",
    submittedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), subData);
  return docRef.id;
}

export async function getTeacherMatnSubmissions(teacherId: string, halqaId?: string): Promise<MatnRecitationSubmission[]> {
  try {
    let q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("teacherId", "==", teacherId),
      limit(50)
    );
    if (halqaId) {
      q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("halqaId", "==", halqaId),
        limit(50)
      );
    }
    const snap = await getDocs(q);
    const list: MatnRecitationSubmission[] = [];
    snap.forEach(d => {
      list.push({ ...d.data(), id: d.id } as MatnRecitationSubmission);
    });
    // ترتيب تنازلي حسب تاريخ الإرسال
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (err) {
    console.warn("[MutunService] getTeacherMatnSubmissions error:", err);
    return [];
  }
}

/**
 * اعتماد المعلم للتسميع وفتح المجموعة التالية للطالب
 */
export async function reviewMatnSubmissionByTeacher(
  submissionId: string,
  studentId: string,
  matnId: string,
  groupId: string,
  nextGroupId: string,
  nextGroupNumber: number,
  isApproved: boolean,
  teacherFeedback: string,
  masteryScore: number,
  masteryLevel: MasteryLevel,
  teacherName: string
): Promise<void> {
  const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
  const status = isApproved ? "approved" : "needs_revision";

  await updateDoc(submissionRef, {
    status,
    masteryScore,
    masteryLevel,
    teacherFeedback,
    reviewedAt: new Date().toISOString(),
    reviewedByTeacherName: teacherName
  });

  // إذا تم الاعتماد، نحدث تقدم الطالب ونفتح المجموعة التالية
  if (isApproved) {
    const progressDocId = `${studentId}_${matnId}`;
    const current = await getStudentMatnProgress(studentId, matnId);

    const existingGroup = current.groupProgress[groupId] || {
      groupId,
      groupNumber: current.currentGroupNumber,
      reviewCount: 1,
      selfQuizAttempts: 1,
      isTeacherApproved: false
    };

    const updatedGroupProgress = {
      ...current.groupProgress,
      [groupId]: {
        ...existingGroup,
        isTeacherApproved: true,
        teacherApprovalDate: new Date().toISOString(),
        teacherNotes: teacherFeedback,
        masteryLevel
      }
    };

    // حساب نسبة الإنجاز الجديدة
    const completedCount = Object.values(updatedGroupProgress).filter((g: any) => Boolean(g.isTeacherApproved)).length;
    const percentage = Math.min(100, Math.round((completedCount / current.totalGroupsCount) * 100));

    const updatedStudentProgress: MatnStudentProgress = {
      ...current,
      currentGroupId: nextGroupId || current.currentGroupId,
      currentGroupNumber: nextGroupNumber || current.currentGroupNumber,
      completedGroupsCount: completedCount,
      percentageCompleted: percentage,
      overallMasteryLevel: masteryLevel,
      nextGroupUnlocked: true, // اعتماد المعلم يفتح المجموعة التالية
      groupProgress: updatedGroupProgress,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, PROGRESS_COLLECTION, progressDocId), updatedStudentProgress, { merge: true });

    if (typeof window !== "undefined") {
      localStorage.setItem(`${LOCAL_STORAGE_PROGRESS_KEY}${progressDocId}`, JSON.stringify(updatedStudentProgress));
    }
  }
}

// =========================================================================
// 4. إدارة الاختبارات الأسبوعية
// =========================================================================

export async function createWeeklyExam(exam: Omit<MatnWeeklyExam, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, EXAMS_COLLECTION), {
    ...exam,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getWeeklyExamsForHalqa(halqaId: string): Promise<MatnWeeklyExam[]> {
  try {
    const q = query(
      collection(db, EXAMS_COLLECTION),
      where("halqaId", "==", halqaId),
      limit(20)
    );
    const snap = await getDocs(q);
    const list: MatnWeeklyExam[] = [];
    snap.forEach(d => {
      list.push({ ...d.data(), id: d.id } as MatnWeeklyExam);
    });
    return list;
  } catch (err) {
    console.warn("[MutunService] getWeeklyExams error:", err);
    return [];
  }
}

export async function submitExamAttempt(attempt: Omit<MatnExamAttempt, "id" | "submittedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, EXAM_RESULTS_COLLECTION), {
    ...attempt,
    submittedAt: new Date().toISOString()
  });
  return docRef.id;
}