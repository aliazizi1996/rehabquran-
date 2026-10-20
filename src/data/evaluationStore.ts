import { DailyRecitationRecord, StudentCertificate, PerformanceGrade, RecitationAttendanceStatus } from '../types';
import { getRegisteredStudents } from './registrationStore';

const RECITATIONS_STORAGE_KEY = 'rehab_quran_daily_recitations_prod_v1';
const CERTIFICATES_STORAGE_KEY = 'rehab_quran_student_certificates_prod_v1';

// Initial empty records for production - only user-submitted or teacher-evaluated records appear
export const INITIAL_RECITATIONS: DailyRecitationRecord[] = [];

// Initial empty certificates for production - only officially issued certificates appear
export const INITIAL_CERTIFICATES: StudentCertificate[] = [];

// Read Recitations
export const getDailyRecitations = (studentId?: string): DailyRecitationRecord[] => {
  let records: DailyRecitationRecord[] = [];
  try {
    const raw = localStorage.getItem(RECITATIONS_STORAGE_KEY);
    if (raw) {
      records = JSON.parse(raw);
    } else {
      records = [];
    }
  } catch (e) {
    console.error('Failed to load recitations', e);
    records = [];
  }

  // Ensure any existing recitations keep synced phone number and section
  const registered = getRegisteredStudents();
  let hasChanges = false;

  if (Array.isArray(records)) {
    registered.forEach((std) => {
      if (!std || !std.id) return;
      const existingIndex = records.findIndex(
        (r) => r && (r.studentId === std.id || r.studentName === std.name)
      );

      if (existingIndex >= 0 && records[existingIndex]) {
        if (!records[existingIndex]?.studentPhone && std?.phone) {
          records[existingIndex].studentPhone = std.phone;
          hasChanges = true;
        }
        if (!records[existingIndex]?.studentSection && std?.section) {
          records[existingIndex].studentSection = std.section;
          hasChanges = true;
        }
      }
    });
  } else {
    records = [];
  }

  if (hasChanges) {
    try {
      localStorage.setItem(RECITATIONS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      // ignore
    }
  }

  if (studentId) {
    return records.filter((r) => r && r.studentId === studentId);
  }
  return records.filter(Boolean);
};

// Save new Recitation Record
export const saveDailyRecitation = (
  record: Omit<DailyRecitationRecord, 'id' | 'recordedAt'>
): DailyRecitationRecord => {
  const current = getDailyRecitations();
  const newRec: DailyRecitationRecord = {
    ...record,
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    recordedAt: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const updated = [newRec, ...current];
  try {
    localStorage.setItem(RECITATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_evaluations_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save recitation record', e);
  }
  return newRec;
};

// Update existing Recitation Record
export const updateDailyRecitation = (
  id: string,
  updates: Partial<DailyRecitationRecord>
): DailyRecitationRecord | null => {
  const current = getDailyRecitations();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updatedRecord: DailyRecitationRecord = {
    ...current[index],
    ...updates,
    recordedAt: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  current[index] = updatedRecord;
  try {
    localStorage.setItem(RECITATIONS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('rehab_evaluations_updated', { detail: current }));
  } catch (e) {
    console.error('Failed to update recitation record', e);
  }
  return updatedRecord;
};

// Delete Recitation Record
export const deleteDailyRecitation = (id: string): DailyRecitationRecord[] => {
  const current = getDailyRecitations();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(RECITATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_evaluations_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete recitation record', e);
  }
  return updated;
};

// Read Certificates
export const getStudentCertificates = (studentId?: string): StudentCertificate[] => {
  try {
    const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : INITIAL_CERTIFICATES;
    const certs: StudentCertificate[] = Array.isArray(parsed) ? parsed.filter(Boolean) : INITIAL_CERTIFICATES;
    if (studentId) {
      return certs.filter((c) => c && c.studentId === studentId);
    }
    return certs;
  } catch (e) {
    console.error('Failed to load certificates', e);
    return INITIAL_CERTIFICATES;
  }
};

// Issue New Certificate
export const issueCertificate = (
  cert: Omit<StudentCertificate, 'id' | 'certificateNumber' | 'issueDate' | 'isOfficialStampApplied'>
): StudentCertificate => {
  const current = getStudentCertificates();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newCert: StudentCertificate = {
    ...cert,
    id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    certificateNumber: `RQ-2026-${randomNum}`,
    issueDate: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    isOfficialStampApplied: true,
  };

  const updated = [newCert, ...current];
  try {
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_certificates_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to issue certificate', e);
  }
  return newCert;
};

// Delete Certificate
export const deleteCertificate = (id: string): StudentCertificate[] => {
  const current = getStudentCertificates();
  const updated = current.filter((c) => c.id !== id);
  try {
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_certificates_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete certificate', e);
  }
  return updated;
};

// Performance Grade Helpers
export const getGradeLabel = (grade: PerformanceGrade): { label: string; color: string; badgeBg: string } => {
  switch (grade) {
    case 'excellent':
      return {
        label: 'ممتاز',
        color: 'text-emerald-300',
        badgeBg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
      };
    case 'very_good':
      return {
        label: 'جيد جداً',
        color: 'text-sky-300',
        badgeBg: 'bg-sky-950/80 border-sky-500/60 text-sky-300',
      };
    case 'good':
      return {
        label: 'جيد',
        color: 'text-amber-300',
        badgeBg: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
      };
    case 'weak':
      return {
        label: 'ضعيف (يحتاج إعادة)',
        color: 'text-red-300',
        badgeBg: 'bg-red-950/80 border-red-500/60 text-red-300',
      };
  }
};

// Attendance Status Helpers
export const getAttendanceStatusInfo = (status: RecitationAttendanceStatus): { label: string; color: string; badgeBg: string } => {
  switch (status) {
    case 'present':
      return {
        label: 'حاضر',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-600/70',
      };
    case 'absent':
      return {
        label: 'غائب',
        color: 'text-red-400',
        badgeBg: 'bg-red-950 text-red-300 border-red-700/60',
      };
    case 'late':
      return {
        label: 'متأخر',
        color: 'text-amber-400',
        badgeBg: 'bg-amber-950 text-amber-300 border-amber-700/60',
      };
    case 'excused':
      return {
        label: 'معذور',
        color: 'text-indigo-300',
        badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-700/60',
      };
  }
};

// Common Quran Surahs for fast dropdown selection
export const QURAN_SURAHS: { number: number; name: string; juz: number; totalAyahs: number }[] = [
  { number: 1, name: 'سورة الفاتحة', juz: 1, totalAyahs: 7 },
  { number: 2, name: 'سورة البقرة', juz: 1, totalAyahs: 286 },
  { number: 3, name: 'سورة آل عمران', juz: 3, totalAyahs: 200 },
  { number: 4, name: 'سورة النساء', juz: 4, totalAyahs: 176 },
  { number: 5, name: 'سورة المائدة', juz: 6, totalAyahs: 120 },
  { number: 6, name: 'سورة الأنعام', juz: 7, totalAyahs: 165 },
  { number: 7, name: 'سورة الأعراف', juz: 8, totalAyahs: 206 },
  { number: 8, name: 'سورة الأنفال', juz: 9, totalAyahs: 75 },
  { number: 9, name: 'سورة التوبة', juz: 10, totalAyahs: 129 },
  { number: 10, name: 'سورة يونس', juz: 11, totalAyahs: 109 },
  { number: 11, name: 'سورة هود', juz: 11, totalAyahs: 123 },
  { number: 12, name: 'سورة يوسف', juz: 12, totalAyahs: 111 },
  { number: 13, name: 'سورة الرعد', juz: 13, totalAyahs: 43 },
  { number: 14, name: 'سورة إبراهيم', juz: 13, totalAyahs: 52 },
  { number: 15, name: 'سورة الحجر', juz: 14, totalAyahs: 99 },
  { number: 16, name: 'سورة النحل', juz: 14, totalAyahs: 128 },
  { number: 17, name: 'سورة الإسراء', juz: 15, totalAyahs: 111 },
  { number: 18, name: 'سورة الكهف', juz: 15, totalAyahs: 110 },
  { number: 19, name: 'سورة مريم', juz: 16, totalAyahs: 98 },
  { number: 20, name: 'سورة طه', juz: 16, totalAyahs: 135 },
  { number: 21, name: 'سورة الأنبياء', juz: 17, totalAyahs: 112 },
  { number: 22, name: 'سورة الحج', juz: 17, totalAyahs: 78 },
  { number: 23, name: 'سورة المؤمنون', juz: 18, totalAyahs: 118 },
  { number: 24, name: 'سورة النور', juz: 18, totalAyahs: 64 },
  { number: 25, name: 'سورة الفرقان', juz: 18, totalAyahs: 77 },
  { number: 26, name: 'سورة الشعراء', juz: 19, totalAyahs: 227 },
  { number: 27, name: 'سورة النمل', juz: 19, totalAyahs: 93 },
  { number: 28, name: 'سورة القصص', juz: 20, totalAyahs: 88 },
  { number: 29, name: 'سورة العنكبوت', juz: 20, totalAyahs: 69 },
  { number: 30, name: 'سورة الروم', juz: 21, totalAyahs: 60 },
  { number: 36, name: 'سورة يس', juz: 22, totalAyahs: 83 },
  { number: 49, name: 'سورة الحجرات', juz: 26, totalAyahs: 18 },
  { number: 55, name: 'سورة الرحمن', juz: 27, totalAyahs: 78 },
  { number: 56, name: 'سورة الواقعة', juz: 27, totalAyahs: 96 },
  { number: 67, name: 'سورة الملك', juz: 29, totalAyahs: 30 },
  { number: 78, name: 'سورة النبأ', juz: 30, totalAyahs: 40 },
  { number: 79, name: 'سورة النازعات', juz: 30, totalAyahs: 46 },
  { number: 80, name: 'سورة عبس', juz: 30, totalAyahs: 42 },
  { number: 81, name: 'سورة التكوير', juz: 30, totalAyahs: 29 },
  { number: 87, name: 'سورة الأعلى', juz: 30, totalAyahs: 19 },
  { number: 93, name: 'سورة الضحى', juz: 30, totalAyahs: 11 },
  { number: 94, name: 'سورة الشرح', juz: 30, totalAyahs: 8 },
  { number: 97, name: 'سورة القدر', juz: 30, totalAyahs: 5 },
  { number: 112, name: 'سورة الإخلاص', juz: 30, totalAyahs: 4 },
  { number: 113, name: 'سورة الفلق', juz: 30, totalAyahs: 5 },
  { number: 114, name: 'سورة الناس', juz: 30, totalAyahs: 6 },
];
