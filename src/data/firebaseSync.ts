import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../lib/firebase';
import { DbStudent, DbTeacher, DbAttendance, getAcademyDatabase, saveAcademyDatabase } from './academyDb';

export interface DbFinancialContribution {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  type: 'kefala_sheikh' | 'student_support' | 'waqf' | 'general';
  bankAccount: string;
  transferReference: string;
  status: 'confirmed' | 'pending' | 'verified';
  date: string;
  notes?: string;
  createdAt?: string;
}

// Initial mock financial contributions for Quran Academy support
const INITIAL_FINANCIAL_CONTRIBUTIONS: DbFinancialContribution[] = [
  {
    id: 'fin-01',
    donorName: 'فاعل خير - جزاه الله خيراً',
    amount: 50000,
    currency: 'ريال يمني',
    type: 'kefala_sheikh',
    bankAccount: 'بنك الكريمي للتمويل الأصغر (حساب: 300123456)',
    transferReference: 'TRX-998241',
    status: 'confirmed',
    date: '2026-09-15',
    notes: 'كفالة حلقة الفجر لتعليم التجويد',
  },
  {
    id: 'fin-02',
    donorName: 'أم عبد الرحمن',
    amount: 500,
    currency: 'ريال سعودي',
    type: 'student_support',
    bankAccount: 'حساب بنك التضامن الإسلامي',
    transferReference: 'SA-78214',
    status: 'confirmed',
    date: '2026-09-12',
    notes: 'دعم جوائز مسابقة حفظ القرآن الكريم للبنين والبنات',
  },
  {
    id: 'fin-03',
    donorName: 'فاعل خير من أهل الإحسان',
    amount: 25000,
    currency: 'ريال يمني',
    type: 'waqf',
    bankAccount: 'محفظة جيب / كاش',
    transferReference: 'M-66219',
    status: 'confirmed',
    date: '2026-09-08',
    notes: 'مساهمة في السيرفرات والتقنية للمقرأة الإلكترونية',
  },
];

// Helper to save User Account to Firestore
export async function syncUserToFirestore(user: any): Promise<void> {
  try {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, user, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync user ${user.id}:`, error);
  }
}

// Helper to save Student to Firestore
export async function syncStudentToFirestore(student: DbStudent): Promise<void> {
  try {
    const ref = doc(db, 'students', student.id);
    await setDoc(ref, student, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync student ${student.id}:`, error);
  }
}

// Helper to save Teacher to Firestore
export async function syncTeacherToFirestore(teacher: DbTeacher): Promise<void> {
  try {
    const ref = doc(db, 'teachers', teacher.id);
    await setDoc(ref, teacher, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync teacher ${teacher.id}:`, error);
  }
}

// Helper to save Attendance to Firestore
export async function syncAttendanceToFirestore(attendance: DbAttendance): Promise<void> {
  try {
    const ref = doc(db, 'attendance', attendance.id);
    await setDoc(ref, attendance, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync attendance ${attendance.id}:`, error);
  }
}

// Helper to save Registered Student Application to Firestore
export async function syncRegisteredStudentApplicationToFirestore(application: any): Promise<void> {
  try {
    const ref = doc(db, 'student_applications', application.id);
    await setDoc(ref, application, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync student application ${application.id}:`, error);
  }
}

// Helper to save Financial Contribution to Firestore
export async function syncFinancialContributionToFirestore(item: DbFinancialContribution): Promise<void> {
  try {
    const ref = doc(db, 'financialContributions', item.id);
    await setDoc(ref, item, { merge: true });
  } catch (error) {
    console.warn(`[Firestore] Failed to sync financial contribution ${item.id}:`, error);
  }
}

// Fetch all Financial Contributions (Firestore with LocalStorage fallback)
const FINANCIAL_STORAGE_KEY = 'rehab_quran_financial_contributions';

export function getLocalFinancialContributions(): DbFinancialContribution[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FINANCIAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveLocalFinancialContributions(items: DbFinancialContribution[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export async function fetchAllFinancialContributions(): Promise<DbFinancialContribution[]> {
  try {
    const snapshot = await getDocs(collection(db, 'financialContributions'));
    if (!snapshot.empty) {
      const remoteItems: DbFinancialContribution[] = [];
      snapshot.forEach((docSnap) => {
        remoteItems.push(docSnap.data() as DbFinancialContribution);
      });
      saveLocalFinancialContributions(remoteItems);
      return remoteItems;
    }
  } catch (err) {
    console.warn('[Firestore] fetchAllFinancialContributions note:', err);
  }
  return getLocalFinancialContributions();
}

// Add a new Financial Contribution
export async function addFinancialContribution(item: Omit<DbFinancialContribution, 'id'>): Promise<DbFinancialContribution> {
  const newItem: DbFinancialContribution = {
    ...item,
    id: `fin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  const local = getLocalFinancialContributions();
  const updated = [newItem, ...local];
  saveLocalFinancialContributions(updated);

  // Sync to Firestore in background
  syncFinancialContributionToFirestore(newItem).catch((err) => {
    console.warn('[Firestore] Could not sync financial item:', err);
  });

  return newItem;
}

// Master bidirectional sync on app startup
export async function initializeFirestoreSync(): Promise<void> {
  try {
    const isOnline = await testFirestoreConnection();
    if (!isOnline) {
      console.info('[Firestore] Operating in offline-first mode with cached local database.');
      return;
    }

    const currentDb = getAcademyDatabase();

    // 1. Check students in Firestore
    const stuSnap = await getDocs(collection(db, 'students'));
    if (!stuSnap.empty) {
      const firestoreStudents: DbStudent[] = [];
      stuSnap.forEach((d) => firestoreStudents.push(d.data() as DbStudent));
      
      // Merge with local students (Firestore takes precedence for existing, add missing local ones)
      const mergedStudents = [...firestoreStudents];
      currentDb.students.forEach((localStu) => {
        if (!mergedStudents.some((s) => s.id === localStu.id)) {
          mergedStudents.push(localStu);
          syncStudentToFirestore(localStu);
        }
      });
      currentDb.students = mergedStudents;
    } else {
      // Seed Firestore with initial students
      currentDb.students.forEach((s) => syncStudentToFirestore(s));
    }

    // 2. Check teachers in Firestore
    const tchSnap = await getDocs(collection(db, 'teachers'));
    if (!tchSnap.empty) {
      const firestoreTeachers: DbTeacher[] = [];
      tchSnap.forEach((d) => firestoreTeachers.push(d.data() as DbTeacher));
      const mergedTeachers = [...firestoreTeachers];
      currentDb.teachers.forEach((localTch) => {
        if (!mergedTeachers.some((t) => t.id === localTch.id)) {
          mergedTeachers.push(localTch);
          syncTeacherToFirestore(localTch);
        }
      });
      currentDb.teachers = mergedTeachers;
    } else {
      currentDb.teachers.forEach((t) => syncTeacherToFirestore(t));
    }

    // 3. Seed initial financial contributions if empty in Firestore
    const finSnap = await getDocs(collection(db, 'financialContributions'));
    if (finSnap.empty) {
      INITIAL_FINANCIAL_CONTRIBUTIONS.forEach((f) => syncFinancialContributionToFirestore(f));
    }

    saveAcademyDatabase(currentDb);
  } catch (err) {
    console.warn('[Firestore] Initialization sync running in offline-first mode:', err);
  }
}
