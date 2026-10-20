export interface RegisteredStudent {
  id: string;
  name: string;
  age?: string;
  country?: string;
  section: 'male' | 'female';
  memorization: string;
  wantsSanad: string;
  preferredTime: string;
  preferredTimeDetail?: string;
  riwayah?: string;
  studyType?: string;
  monthlyContribution?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  registeredAt: string;
  status: 'approved' | 'pending' | 'rejected' | 'accepted';
  assignedHalqaId?: string;
}

export interface RegisteredTeacher {
  id: string;
  name: string;
  qualification: string;
  country: string;
  phone: string;
  email?: string;
  targetSection: 'male' | 'female' | 'both';
  experience?: string;
  specialty?: string;
  requestNotes?: string;
  registeredAt: string;
  status: 'approved' | 'pending';
  assignedHalqaTitle?: string;
}

export interface SupervisorNotification {
  id: string;
  type: 'new_student_registration' | 'new_teacher_registration' | 'system_alert';
  title: string;
  message: string;
  studentId?: string;
  studentName?: string;
  section?: 'male' | 'female';
  phone?: string;
  memorization?: string;
  timestamp: string;
  createdAtMs: number;
  read: boolean;
}

const STUDENTS_STORAGE_KEY = 'rehab_quran_registered_students_prod_v1';
const TEACHERS_STORAGE_KEY = 'rehab_quran_registered_teachers_prod_v1';
const NOTIFICATIONS_STORAGE_KEY = 'rehab_supervisor_notifications_prod_v1';

// Clean Web Audio Notification Chime for Supervisor
export const playSupervisorChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // First high tone (D5 ~ 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second bell tone (A5 ~ 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.25, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Autoplay or restricted audio context safe catch
  }
};

// Notification store helpers
export const getSupervisorNotifications = (): SupervisorNotification[] => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse supervisor notifications', e);
  }
  return [];
};

export const addSupervisorNotification = (notif: SupervisorNotification): SupervisorNotification[] => {
  const current = getSupervisorNotifications();
  const updated = [notif, ...current].slice(0, 50); // keep latest 50
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_supervisor_notifications_updated', { detail: updated }));
    window.dispatchEvent(new CustomEvent('rehab_new_student_registration', { detail: notif }));
    playSupervisorChime();
  } catch (e) {
    console.error('Failed to save supervisor notification', e);
  }
  return updated;
};

export const markNotificationAsRead = (id: string): SupervisorNotification[] => {
  const current = getSupervisorNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_supervisor_notifications_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to mark notification as read', e);
  }
  return updated;
};

export const clearAllSupervisorNotifications = (): void => {
  try {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('rehab_supervisor_notifications_updated', { detail: [] }));
  } catch (e) {
    console.error('Failed to clear notifications', e);
  }
};

// Initial empty lists for real production use - only user-registered entries appear
export const OFFICIAL_REGISTERED_STUDENTS: RegisteredStudent[] = [];

// Initial empty lists for real production use - only user-registered entries appear
export const OFFICIAL_REGISTERED_TEACHERS: RegisteredTeacher[] = [];

export const getRegisteredStudents = (): RegisteredStudent[] => {
  try {
    const data = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((s): s is RegisteredStudent => Boolean(s && typeof s === 'object' && s.id && s.name))
          .map((s) => ({
            ...s,
            section: s?.section === 'female' ? 'female' : 'male',
          }));
      }
    }
  } catch (e) {
    console.error('Failed to read registered students from localStorage', e);
  }
  return [];
};

export const saveRegisteredStudent = (
  student: Omit<RegisteredStudent, 'id' | 'registeredAt' | 'status'> & { status?: 'approved' | 'pending' | 'rejected' }
): RegisteredStudent => {
  const current = getRegisteredStudents();
  const assignedStatus = student.status || 'pending'; // Default to 'pending' (قيد الانتظار) for review by supervisor
  
  const newStudent: RegisteredStudent = {
    ...student,
    id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    registeredAt: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: assignedStatus,
  };

  const updated = [newStudent, ...current];
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_students_updated', { detail: updated }));

    // Send direct supervisor notification for new registration
    if (assignedStatus === 'pending') {
      const sectionLabel = newStudent.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب';
      addSupervisorNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'new_student_registration',
        title: `طلب تسجيل جديد قيد الانتظار (${newStudent.name})`,
        message: `سجّل طالب جديد (${newStudent.name}) في ${sectionLabel} - مقدار الحفظ: ${newStudent.memorization || 'غير محدد'}. الطلب بانتظار الاعتماد.`,
        studentId: newStudent.id,
        studentName: newStudent.name,
        section: newStudent.section,
        phone: newStudent.phone,
        memorization: newStudent.memorization,
        timestamp: newStudent.registeredAt,
        createdAtMs: Date.now(),
        read: false,
      });
    }
    // Load Firebase only when a registration is saved; keep public-page startup lightweight.
    void import('./firebaseSync')
      .then(({ syncRegisteredStudentApplicationToFirestore }) => syncRegisteredStudentApplicationToFirestore(newStudent))
      .catch(() => {});
  } catch (e) {
    console.error('Failed to save student', e);
  }
  return newStudent;
};

export const updateStudentStatus = (id: string, status: 'approved' | 'pending' | 'rejected' | 'accepted'): RegisteredStudent[] => {
  const current = getRegisteredStudents();
  const updated = current.map((s) => (s.id === id ? { ...s, status } : s));
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_students_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to update student status', e);
  }
  return updated;
};

export const deleteRegisteredStudent = (id: string): RegisteredStudent[] => {
  const current = getRegisteredStudents();
  const updated = current.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_students_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete student', e);
  }
  return updated;
};

export const getRegisteredTeachers = (): RegisteredTeacher[] => {
  try {
    const data = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t): t is RegisteredTeacher => Boolean(t && typeof t === 'object' && t.id && t.name))
          .map((t) => ({
            ...t,
            targetSection: (t.targetSection || 'both') as 'male' | 'female' | 'both',
          }));
      }
    }
  } catch (e) {
    console.error('Failed to read registered teachers from localStorage', e);
  }
  return [];
};

export const saveRegisteredTeacher = (
  teacher: Omit<RegisteredTeacher, 'id' | 'registeredAt' | 'status'> & { status?: 'approved' | 'pending' }
): RegisteredTeacher => {
  const current = getRegisteredTeachers();
  const newTeacher: RegisteredTeacher = {
    ...teacher,
    id: `tch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    registeredAt: new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: teacher.status || 'approved',
  };

  const updated = [newTeacher, ...current];
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_teachers_updated', { detail: updated }));

    if (newTeacher.status === 'pending') {
      addSupervisorNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'new_teacher_registration',
        title: `طلب انضمام معلم جديد بانتظار الاعتماد (${newTeacher.name})`,
        message: `سجّل معلم جديد (${newTeacher.name}) - المؤهل: ${newTeacher.qualification} - التخصص: ${newTeacher.specialty || 'تعليم القرآن'}. الطلب قيد مراجعة المدير والموافقة.`,
        studentName: newTeacher.name,
        phone: newTeacher.phone,
        timestamp: newTeacher.registeredAt,
        createdAtMs: Date.now(),
        read: false,
      });
    }
  } catch (e) {
    console.error('Failed to save teacher', e);
  }
  return newTeacher;
};

export const updateTeacherStatus = (id: string, status: 'approved' | 'pending'): RegisteredTeacher[] => {
  const current = getRegisteredTeachers();
  const updated = current.map((t) => (t.id === id ? { ...t, status } : t));
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_teachers_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to update teacher status', e);
  }
  return updated;
};

export const deleteRegisteredTeacher = (id: string): RegisteredTeacher[] => {
  const current = getRegisteredTeachers();
  const updated = current.filter((t) => t.id !== id);
  try {
    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_teachers_updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to delete teacher', e);
  }
  return updated;
};
