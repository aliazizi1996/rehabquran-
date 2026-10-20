import { StudentAttendanceEntry } from '../types';
import { addInAppNotification } from './wirdNotificationStore';
import { getRegisteredStudents } from './registrationStore';

const ATTENDANCE_STORAGE_KEY = 'rehab_quran_attendance_prod_v1';

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_STUDENT_ENTRIES: StudentAttendanceEntry[] = [];

export const getAllAttendanceEntries = (): StudentAttendanceEntry[] => {
  const today = getTodayDateString();
  let entries: StudentAttendanceEntry[] = [];
  try {
    const data = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        entries = parsed.filter((e): e is StudentAttendanceEntry => Boolean(e && typeof e === 'object' && e.studentId));
      }
    } else {
      entries = [];
    }
  } catch (e) {
    console.error('Failed to read attendance entries', e);
    entries = [];
  }

  // Ensure all registered students have an entry for today so teachers can mark attendance
  const registered = getRegisteredStudents();
  let hasNew = false;
  registered.forEach((student) => {
    if (!student || !student.id) return;
    const exists = entries.some(
      (e) => e && (e.studentId === student.id || e.studentName === student.name) && e.date === today
    );
    if (!exists) {
      const sec = student?.section || 'male';
      const defaultHalqaId = sec === 'male' ? 'h-m1' : 'h-f1';
      const defaultHalqaTitle =
        sec === 'male'
          ? 'حلقة قسم الطلاب'
          : 'حلقة قسم الطالبات';
      const teacher = sec === 'male' ? 'إدارة قسم الطلاب' : 'إدارة قسم الطالبات';

      entries.push({
        id: `att-${student.id}-${today}`,
        studentId: student.id,
        studentName: student.name || 'طالب',
        studentPhone: student.phone || '',
        studentSection: sec,
        halqaId: student.assignedHalqaId || defaultHalqaId,
        halqaTitle: defaultHalqaTitle,
        date: today,
        status: 'present',
        recordedByTeacher: teacher,
        notes: '',
        notificationSent: false,
      });
      hasNew = true;
    }
  });

  if (hasNew) {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }

  return entries;
};

export const saveAttendanceEntries = (entries: StudentAttendanceEntry[]) => {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('rehab_attendance_updated', { detail: entries }));
  } catch (e) {
    console.error('Failed to save attendance entries', e);
  }
};

export const markStudentAttendance = (
  student: {
    id: string;
    name: string;
    phone?: string;
    section: 'male' | 'female';
  },
  halqa: {
    id: string;
    title: string;
  },
  status: 'present' | 'absent' | 'late' | 'excused',
  recordedByTeacher: string,
  notes?: string,
  targetDate?: string
): StudentAttendanceEntry => {
  const date = targetDate || getTodayDateString();
  const entries = getAllAttendanceEntries();

  const existingIndex = entries.findIndex(
    (e) => e.studentId === student.id && e.date === date && e.halqaId === halqa.id
  );

  let updatedEntry: StudentAttendanceEntry;

  if (existingIndex >= 0) {
    updatedEntry = {
      ...entries[existingIndex],
      status,
      notes: notes || entries[existingIndex].notes,
      recordedByTeacher,
    };
    entries[existingIndex] = updatedEntry;
  } else {
    updatedEntry = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: student?.id || `stu-${Date.now()}`,
      studentName: student?.name || 'طالب',
      studentPhone: student?.phone || '',
      studentSection: student?.section || 'male',
      halqaId: halqa.id,
      halqaTitle: halqa.title,
      date,
      status,
      recordedByTeacher,
      notes: notes || '',
      notificationSent: false,
    };
    entries.unshift(updatedEntry);
  }

  saveAttendanceEntries(entries);
  return updatedEntry;
};

export const sendAbsenteeNotifications = (
  halqaId?: string,
  date?: string
): { count: number; notifiedStudents: string[] } => {
  const targetDate = date || getTodayDateString();
  const entries = getAllAttendanceEntries();
  const notifiedStudents: string[] = [];

  const updatedEntries = entries.map((entry) => {
    const matchesHalqa = !halqaId || entry.halqaId === halqaId;
    const matchesDate = entry.date === targetDate;
    const isAbsent = entry.status === 'absent';

    if (matchesHalqa && matchesDate && isAbsent && !entry.notificationSent) {
      notifiedStudents.push(entry.studentName);

      // Trigger In-App Notification
      addInAppNotification({
        title: `تنبيه غياب: ${entry.studentName}`,
        body: `تم تسجيلك غائباً اليوم في ${entry.halqaTitle}. يرجى تعويض ورد الحفظ والتواصل مع المعلم المشرف.`,
        type: 'system',
        time: 'الآن',
        isRead: false,
      });

      return {
        ...entry,
        notificationSent: true,
        notifiedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return entry;
  });

  saveAttendanceEntries(updatedEntries);
  return { count: notifiedStudents.length, notifiedStudents };
};

export const getWhatsAppAbsenteeMessage = (studentName?: string, halqaTitle?: string, date?: string): string => {
  const nameStr = studentName ? `الطالب/ة: *${studentName}*` : 'أخي الكريم / أختي الكريمة';
  const halqaStr = halqaTitle ? `• الحلقة: *${halqaTitle}*\n` : '';
  const dateStr = date ? `• التاريخ: ${date}\n` : '';
  return `السلام عليكم ورحمة الله وبركاته،
حياكم الله في *مقرأة رحاب القرآن الإلكترونية* 📖

نحيطكم علماً بأنه تم تسجيل ${nameStr} غائباً عن جلسة التسميع والتحفيظ اليوم:
${halqaStr}${dateStr}
نرجو منكم التكرم بإفادتنا بسبب الغياب والاطمئنان على سلامتكم، والحرص على تعويض الورد القرآني المقرر مع المعلم المشرف.

نسأل الله لكم التوفيق والتيسير في حفظ كتابه العزيز.`;
};

export const getWhatsAppWelcomeInvitationMessage = (
  studentName: string,
  section: 'male' | 'female' = 'female',
  appUrl?: string
): string => {
  const url = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://rehab-quran.app');
  if (section === 'female') {
    return `السلام عليكم أختي ${studentName}، نرحب بكِ في مقرأة رحاب القرآن الإلكترونية. يسعدنا انضمامك معنا، يمكنك التسجيل عبر الرابط التالي: ${url}`;
  }
  return `السلام عليكم أخي ${studentName}، نرحب بك في مقرأة رحاب القرآن الإلكترونية. يسعدنا انضمامك معنا، يمكنك التسجيل عبر الرابط التالي: ${url}`;
};
