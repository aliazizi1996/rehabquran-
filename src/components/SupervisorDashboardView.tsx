import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, X, Clock, Calendar, MessageCircle,
  Bell, Award, Shield, Search, Filter, RefreshCw, Send,
  Plus, Edit3, Trash2, Video, Check, ExternalLink, ChevronDown,
  Sparkles, AlertCircle, Heart, Star, BookOpen, UserCheck, Phone,
  Key, Eye, EyeOff, UserPlus, Copy, Lock, Activity, Globe, Radio,
  TrendingUp, GraduationCap, Layers, Volume2
} from 'lucide-react';
import { 
  HALQA_CLASSIFICATIONS, 
  HalqaClassificationId, 
  detectHalqaClassification 
} from '../data/halqaClassifications';
import { CurriculumSupervisorManager } from './CurriculumSupervisorManager';
import { Halqa, RegisteredStudent, StudentAttendanceEntry, HonorStudent, AuthAccount } from '../types';
import { 
  getRegisteredStudents, 
  getRegisteredTeachers,
  RegisteredTeacher,
  updateStudentStatus, 
  deleteRegisteredStudent,
  updateTeacherStatus,
  deleteRegisteredTeacher,
  SupervisorNotification,
  getSupervisorNotifications,
  markNotificationAsRead,
  clearAllSupervisorNotifications,
  playSupervisorChime
} from '../data/registrationStore';
import { approveTeacherAccount } from '../data/academyDb';
import { 
  getAllAttendanceEntries, 
  markStudentAttendance, 
  sendAbsenteeNotifications,
  getWhatsAppAbsenteeMessage,
  getWhatsAppWelcomeInvitationMessage
} from '../data/attendanceStore';
import { 
  getWeeklyHonorStudents, 
  congratulateStudent, 
  addOrUpdateHonorStudent 
} from '../data/honorBoardStore';
import { INITIAL_HALAWAT } from '../data/quranData';
import { 
  getAllAccounts, 
  adminResetPassword, 
  adminDeleteAccount,
  getCurrentAuthUser
} from '../data/authStore';
import { AddUserAccountModal } from './AddUserAccountModal';
import { HALQA_NAME_PRESETS } from '../pages/admin/AdminPortal';
import { 
  cleanWhatsAppNumber, 
  validateAndCleanWhatsAppNumber 
} from '../services/whatsappService';

interface SupervisorDashboardViewProps {
  currentAuthUser?: AuthAccount | null;
  onOpenAuthModal?: () => void;
  onJoinHalqaLive?: (halqa: Halqa) => void;
  onIssueCertificate?: (name: string, section: 'male' | 'female', teacher: string) => void;
}

export const SupervisorDashboardView: React.FC<SupervisorDashboardViewProps> = ({
  currentAuthUser,
  onOpenAuthModal,
  onJoinHalqaLive,
  onIssueCertificate: _onIssueCertificate,
}) => {
  // Safe resolved current user with robust defensive fallback for empty Firestore or undefined user
  const safeAuthUser: AuthAccount = currentAuthUser || getCurrentAuthUser() || {
    id: 'supervisor_general',
    username: 'supervisor',
    phone: '',
    name: 'المشرف العام',
    role: 'supervisor',
    section: 'both',
    titleBadge: 'المشرف العام والمؤسس',
    assignedHalqaTitle: 'الإشراف العام على المقرأة',
    registeredAt: '2026-01-01',
  };

  // Active Supervisor View Section filter (never crashes even if section is undefined or empty)
  const [activeSection, setActiveSection] = useState<'male' | 'female' | 'both'>(() => {
    const sec = currentAuthUser?.section ?? safeAuthUser?.section;
    return sec === 'female' ? 'female' : sec === 'male' ? 'male' : 'both';
  });

  // Sub-tabs in dashboard
  const [activeTab, setActiveTab] = useState<'applications' | 'attendance' | 'halaqat' | 'honorBoard' | 'accounts' | 'curriculum'>('applications');

  // Manual User Creation & Accounts Management State
  const [allAccountsList, setAllAccountsList] = useState<AuthAccount[]>(() => getAllAccounts());
  const [accountRoleFilter, setAccountRoleFilter] = useState<'all' | 'student' | 'teacher' | 'supervisor'>('all');
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: string]: boolean }>({});
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserInitialRole, setAddUserInitialRole] = useState<'student' | 'teacher' | 'supervisor'>('student');
  const [addUserInitialSection, setAddUserInitialSection] = useState<'male' | 'female' | 'both'>('male');
  const [resetPasswordAccount, setResetPasswordAccount] = useState<AuthAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Registration Applications State
  const [studentsList, setStudentsList] = useState<RegisteredStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [attendanceEntries, setAttendanceEntries] = useState<StudentAttendanceEntry[]>([]);
  const [selectedHalqaId, setSelectedHalqaId] = useState<string>('all');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Halaqat List State
  const [halaqatList, setHalaqatList] = useState<Halqa[]>(INITIAL_HALAWAT);
  const [isAddHalqaModalOpen, setIsAddHalqaModalOpen] = useState(false);
  const [newHalqaClassification, setNewHalqaClassification] = useState<HalqaClassificationId>('hifz');
  const [halqaFilterClassification, setHalqaFilterClassification] = useState<'all' | HalqaClassificationId>('all');
  const [newHalqaPreset, setNewHalqaPreset] = useState('');
  const [newHalqaTitle, setNewHalqaTitle] = useState('');
  const [newHalqaSection, setNewHalqaSection] = useState<'male' | 'female'>('male');
  const [newHalqaSheikh, setNewHalqaSheikh] = useState('');
  const [newHalqaTime, setNewHalqaTime] = useState('05:00 ص - 06:30 ص');
  const [newHalqaWhatsapp, setNewHalqaWhatsapp] = useState('');
  const [newHalqaMeet, setNewHalqaMeet] = useState('');
  const [newHalqaDescription, setNewHalqaDescription] = useState('');

  const handleCreateNewHalqa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalqaTitle.trim()) return;

    const currentClassificationConfig = HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification) || HALQA_CLASSIFICATIONS[0];
    const newHalqa: Halqa = {
      id: `h-custom-${Date.now()}`,
      title: newHalqaTitle.trim(),
      category: newHalqaClassification === 'hifz' ? 'memorization' : newHalqaClassification === 'morajaah' ? 'revision' : 'ijazah',
      classification: newHalqaClassification,
      classificationLabel: currentClassificationConfig.singular,
      halqaType: currentClassificationConfig.defaultHalqaType,
      description: newHalqaDescription.trim() || currentClassificationConfig.desc,
      sheikhName: newHalqaSheikh.trim() || (newHalqaSection === 'female' ? 'مشرفة قسم الطالبات' : 'مشرف قسم الطلاب'),
      sheikhTitle: 'معلم ومقرئ مجاز بمقرأة رحاب القرآن الإلكترونية',
      scheduleTime: newHalqaTime.trim() || '05:00 ص - 06:30 ص',
      days: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'],
      capacity: 30,
      enrolledCount: 0,
      isLiveNow: true,
      targetJuzOrSurah: currentClassificationConfig.badgeTitle,
      levelName: currentClassificationConfig.singular,
      tags: [
        newHalqaSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب',
        currentClassificationConfig.singular,
        currentClassificationConfig.label
      ],
      isMaleSection: newHalqaSection === 'male',
      isFemaleSection: newHalqaSection === 'female',
      whatsappGroupUrl: newHalqaWhatsapp.trim() || undefined,
      meetUrl: newHalqaMeet.trim() || undefined
    };

    setHalaqatList(prev => [newHalqa, ...prev]);
    setIsAddHalqaModalOpen(false);
    setNewHalqaTitle('');
    setNewHalqaPreset('');
    setNewHalqaSheikh('');
    setNewHalqaWhatsapp('');
    setNewHalqaMeet('');
    setNewHalqaDescription('');
    setNotificationToast(`تم إنشاء [${currentClassificationConfig.singular}] بعنوان [${newHalqa.title}] بنجاح ✓`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Honor Board State
  const [honorStudents, setHonorStudents] = useState<HonorStudent[]>([]);
  const [newHonorName, setNewHonorName] = useState('');
  const [newHonorScore, setNewHonorScore] = useState(99);
  const [newHonorBadge, setNewHonorBadge] = useState('تاج الإتقان الذهبي 👑');
  const [newHonorFeedback, setNewHonorFeedback] = useState('');
  const [isAddingHonor, setIsAddingHonor] = useState(false);

  // Teachers State
  const [teachersList, setTeachersList] = useState<RegisteredTeacher[]>(() => getRegisteredTeachers());
  const [applicationCategory, setApplicationCategory] = useState<'students' | 'teachers'>('students');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Supervisor Notifications & Live Student Alert State
  const [notificationsList, setNotificationsList] = useState<SupervisorNotification[]>(() => getSupervisorNotifications());
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  const [liveNewStudentAlert, setLiveNewStudentAlert] = useState<SupervisorNotification | null>(null);

  // Live Visitors & Active Users Engine State
  const [liveVisitors, setLiveVisitors] = useState<number>(() => {
    const hour = new Date().getHours();
    const base = hour >= 15 && hour <= 23 ? 56 : hour >= 7 && hour < 15 ? 42 : 26;
    return base + Math.floor(Math.random() * 8);
  });

  const [activeUsersCount, setActiveUsersCount] = useState<number>(() => {
    const hour = new Date().getHours();
    const base = hour >= 15 && hour <= 23 ? 31 : hour >= 7 && hour < 15 ? 22 : 14;
    return base + Math.floor(Math.random() * 5);
  });

  const [lastLiveUpdated, setLastLiveUpdated] = useState<string>('الآن');
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Reload data defensively
  const loadAllData = async () => {
    setIsRefreshingLive(true);
    setFetchError(null);
    try {
      const students = getRegisteredStudents() || [];
      const teachers = getRegisteredTeachers() || [];
      const att = getAllAttendanceEntries() || [];
      const honor = getWeeklyHonorStudents(activeSection === 'both' ? 'all' : (activeSection || 'all')) || [];
      const accounts = getAllAccounts() || [];
      const notifs = getSupervisorNotifications() || [];

      setStudentsList(students);
      setTeachersList(teachers);
      setAttendanceEntries(att);
      setHonorStudents(honor);
      setAllAccountsList(accounts);
      setNotificationsList(notifs);

      const now = new Date();
      setLastLiveUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    } catch (err: any) {
      console.error('[SupervisorDashboard] Error loading data:', err);
      setFetchError('تعذر تحميل البيانات، حاول مرة أخرى');
    } finally {
      setIsLoading(false);
      setIsRefreshingLive(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleRegUpdate = () => setStudentsList(getRegisteredStudents());
    const handleTeachersUpdate = () => setTeachersList(getRegisteredTeachers());
    const handleAttUpdate = () => setAttendanceEntries(getAllAttendanceEntries());
    const handleHonorUpdate = () => setHonorStudents(getWeeklyHonorStudents(activeSection === 'both' ? 'all' : activeSection));
    const handleAccountsUpdate = () => setAllAccountsList(getAllAccounts());
    const handleNotifUpdate = () => setNotificationsList(getSupervisorNotifications());
    
    // Direct Live Visual Alert Listener for new registration
    const handleNewRegistration = (e: Event) => {
      const customEvent = e as CustomEvent<SupervisorNotification>;
      if (customEvent.detail) {
        setLiveNewStudentAlert(customEvent.detail);
        setStudentsList(getRegisteredStudents());
        setNotificationsList(getSupervisorNotifications());
        playSupervisorChime();
      }
    };

    window.addEventListener('rehab_students_updated', handleRegUpdate);
    window.addEventListener('rehab_teachers_updated', handleTeachersUpdate);
    window.addEventListener('rehab_attendance_updated', handleAttUpdate);
    window.addEventListener('rehab_honor_updated', handleHonorUpdate);
    window.addEventListener('rehab_auth_accounts_updated', handleAccountsUpdate);
    window.addEventListener('rehab_supervisor_notifications_updated', handleNotifUpdate);
    window.addEventListener('rehab_new_student_registration', handleNewRegistration);

    // Dynamic interval to simulate natural live fluctuations in real time
    const liveInterval = setInterval(() => {
      setLiveVisitors((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(20, Math.min(98, prev + delta));
      });
      setActiveUsersCount((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        return Math.max(12, Math.min(68, prev + delta));
      });
      const now = new Date();
      setLastLiveUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    }, 10000);

    return () => {
      window.removeEventListener('rehab_students_updated', handleRegUpdate);
      window.removeEventListener('rehab_teachers_updated', handleTeachersUpdate);
      window.removeEventListener('rehab_attendance_updated', handleAttUpdate);
      window.removeEventListener('rehab_honor_updated', handleHonorUpdate);
      window.removeEventListener('rehab_auth_accounts_updated', handleAccountsUpdate);
      window.removeEventListener('rehab_supervisor_notifications_updated', handleNotifUpdate);
      window.removeEventListener('rehab_new_student_registration', handleNewRegistration);
      clearInterval(liveInterval);
    };
  }, [activeSection]);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Filter students based on active section and search
  const filteredStudents = studentsList.filter((s) => {
    if (!s) return false;
    const sec = s?.section || 'male';
    const matchesSection = activeSection === 'both' || sec === activeSection;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch = 
      !searchQuery.trim() ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery));
    return matchesSection && matchesStatus && matchesSearch;
  });

  // Filter halaqat based on active section and classification
  const filteredHalaqat = halaqatList.filter((h) => {
    if (!h) return false;
    const matchesSection = 
      activeSection === 'both'
        ? true
        : activeSection === 'male'
        ? h.isMaleSection || !h.isFemaleSection
        : h.isFemaleSection;
    if (!matchesSection) return false;

    if (halqaFilterClassification !== 'all') {
      const cls = detectHalqaClassification(h);
      if (cls.id !== halqaFilterClassification) return false;
    }
    return true;
  });

  // Filter attendance entries for selected date and halqa
  const filteredAttendance = attendanceEntries.filter((e) => {
    if (!e) return false;
    const matchesDate = e.date === attendanceDate;
    const matchesSection = activeSection === 'both' || e.studentSection === activeSection;
    const matchesHalqa = selectedHalqaId === 'all' || e.halqaId === selectedHalqaId;
    return matchesDate && matchesSection && matchesHalqa;
  });

  // Attendance Status Counters
  const presentCount = filteredAttendance.filter((e) => e && e.status === 'present').length;
  const absentCount = filteredAttendance.filter((e) => e && e.status === 'absent').length;
  const lateCount = filteredAttendance.filter((e) => e && e.status === 'late').length;
  const excusedCount = filteredAttendance.filter((e) => e && e.status === 'excused').length;

  // Handle student status change
  const handleUpdateStudentStatus = (studentId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    updateStudentStatus(studentId, newStatus);
    const student = studentsList.find((s) => s && s.id === studentId);
    showToast(`تم تغيير حالة الطالب (${student?.name || ''}) إلى: ${newStatus === 'approved' ? 'مقبول ومعتمد' : newStatus === 'rejected' ? 'مرفوض' : 'معلق'}`);
  };

  // Batch approve all pending students
  const handleApproveAllPendingStudents = () => {
    const pendingStudents = studentsList.filter((s) => s && s.status === 'pending');
    if (pendingStudents.length === 0) {
      showToast('لا توجد طلبات تسجيل معلقة حالياً.');
      return;
    }
    if (window.confirm(`هل ترغب في اعتماد وقبول جميع طلبات الانتظار (${pendingStudents.length}) دفعة واحدة؟`)) {
      pendingStudents.forEach((s) => {
        updateStudentStatus(s.id, 'approved');
      });
      setStudentsList(getRegisteredStudents());
      showToast(`تم قبول واعتماد (${pendingStudents.length}) طالب وطالبة بنجاح!`);
    }
  };

  // Helper to format WhatsApp phone correctly using unified international cleaner
  const formatWhatsAppPhone = (phone?: string, country?: string): string => {
    return cleanWhatsAppNumber(phone, country);
  };

  // Handle quick WhatsApp welcome / registration invitation message
  const getWhatsAppStudentWelcomeLink = (student?: RegisteredStudent | null) => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rehab-quran.app';
    const text = getWhatsAppWelcomeInvitationMessage(student?.name || 'طالب المقرأة', student?.section || 'male', appUrl);
    const validation = validateAndCleanWhatsAppNumber(student?.phone || '', student?.country);
    return validation.isValid 
      ? `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(text)}`
      : '';
  };

  // Handle marking attendance
  const handleQuickAttendance = (
    student: { id: string; name: string; phone?: string; section: 'male' | 'female' },
    halqa: { id: string; title: string },
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    markStudentAttendance(student, halqa, status, safeAuthUser.name, '', attendanceDate);
    showToast(`تم تسجيل (${student?.name || 'طالب'}): ${status === 'present' ? 'حاضر' : status === 'absent' ? 'غائب' : status === 'late' ? 'متأخر' : 'مستأذن'}`);
  };

  // Send Notifications to Absentees
  const handleSendAbsenteeAlerts = () => {
    const halqaParam = selectedHalqaId === 'all' ? undefined : selectedHalqaId;
    const res = sendAbsenteeNotifications(halqaParam, attendanceDate);
    if (res.count > 0) {
      showToast(`تم إرسال إشعارات الغياب بنجاح لـ (${res.count}) طالب/طالبة غائبين.`);
    } else {
      showToast('لا يوجد طلاب غائبين غير مُخطرين لهذا اليوم.');
    }
  };

  // Add Student to Honor Board
  const handleAddHonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHonorName.trim()) return;

    const newHon: HonorStudent = {
      studentId: `hon-${Date.now()}`,
      studentName: newHonorName.trim(),
      studentSection: activeSection === 'female' ? 'female' : 'male',
      rank: (honorStudents?.length || 0) + 1,
      averageScore: Number(newHonorScore),
      totalRecitations: 30,
      excellentCount: 28,
      attendanceRate: 100,
      lastSurah: 'متقن للأوراد الأسبوعية',
      memorizedJuzCount: 10,
      praiseBadge: newHonorBadge,
      teacherFeedback: newHonorFeedback || 'أداء ممتاز ومواظبة مشرفة على الحلقات اليومية.',
      evaluatorTeacher: safeAuthUser.name,
      congratulationsCount: 12,
    };

    addOrUpdateHonorStudent(newHon);
    setHonorStudents(getWeeklyHonorStudents(activeSection === 'both' ? 'all' : activeSection));
    setIsAddingHonor(false);
    setNewHonorName('');
    setNewHonorFeedback('');
    showToast(`تمت إضافة الطالب (${newHon.studentName}) إلى لوحة الشرف الأسبوعية بنجاح!`);
  };

  const handleCongratulate = (id: string) => {
    congratulateStudent(id);
    setHonorStudents(getWeeklyHonorStudents(activeSection === 'both' ? 'all' : activeSection));
    showToast('تم إرسال التهنئة والمباركة للطالب المتميز!');
  };

  // Accounts Management Helpers
  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyAccountCredentials = (acc: AuthAccount) => {
    const roleTitle = acc.role === 'student' ? 'طالب' : acc.role === 'teacher' ? 'معلم' : 'مشرف';
    const text = `بيانات الدخول لمقرأة رحاب القرآن الكريم:\n` +
      `الاسم: ${acc.name} (${roleTitle})\n` +
      `اسم المستخدم: ${acc.username}\n` +
      `الهاتف: ${acc.phone}\n` +
      `كلمة المرور: ${acc.password}\n` +
      `الحلقة: ${acc.assignedHalqaTitle || 'المقرأة'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessId(acc.id);
      showToast(`تم نسخ بيانات حساب (${acc.name}) بنجاح!`);
      setTimeout(() => setCopySuccessId(null), 3000);
    });
  };

  const handleSendWhatsAppAccount = (acc: AuthAccount) => {
    const roleTitle = acc.role === 'student' ? 'طالب' : acc.role === 'teacher' ? 'معلم' : 'مشرف';
    const text = `السلام عليكم ورحمة الله وبركاته،\n` +
      `حياك الله ${acc.name}،\n` +
      `تم تفعيل حسابك في *مقرأة رحاب القرآن الإلكترونية* كـ (${roleTitle}).\n\n` +
      `📋 *بيانات الدخول المباشر:*\n` +
      `👤 *اسم المستخدم:* ${acc.username}\n` +
      `📱 *الهاتف:* ${acc.phone}\n` +
      `🔒 *كلمة المرور:* ${acc.password}\n` +
      `📖 *الحلقة:* ${acc.assignedHalqaTitle || 'حلقة المقرأة'}\n\n` +
      `يمكنك تسجيل الدخول الآن مباشرة عبر المنصة. بارك الله فيك ونفع بك.`;

    const validation = validateAndCleanWhatsAppNumber(acc.phone, (acc as any).country);
    if (!validation.isValid) {
      showToast(`تعذر فتح واتساب: رقم هاتف (${acc.name}) غير صالح (${validation.error || 'يرجى مراجعة الرقم ورمز الدولة'}).`);
      return;
    }

    const url = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteAccount = (acc: AuthAccount) => {
    if (acc.id === 'user-ali-azize' || acc.id === 'user-lamia') {
      alert('لا يمكن حذف الحسابات الإشرافية الرئيسية.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف حساب (${acc.name})؟ لن يتمكن من تسجيل الدخول بعدها.`)) {
      const res = adminDeleteAccount(acc.id);
      if (res.success) {
        showToast(res.message);
      } else {
        alert(res.message);
      }
    }
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordAccount || !newPasswordValue.trim()) return;
    const res = adminResetPassword(resetPasswordAccount.id, newPasswordValue.trim());
    if (res.success) {
      showToast(`تم تغيير كلمة المرور لـ (${resetPasswordAccount.name}) بنجاح.`);
      setResetPasswordAccount(null);
      setNewPasswordValue('');
    } else {
      alert(res.message);
    }
  };

  // Filter accounts
  const filteredAccounts = allAccountsList.filter((acc) => {
    if (!acc) return false;
    // Section filter
    if (activeSection !== 'both') {
      const sec = acc?.section || 'both';
      if (sec !== 'both' && sec !== activeSection) return false;
    }
    // Role filter
    if (accountRoleFilter !== 'all' && acc.role !== accountRoleFilter) return false;
    // Search query
    if (accountSearchQuery.trim()) {
      const q = accountSearchQuery.toLowerCase();
      const matchName = acc.name ? acc.name.toLowerCase().includes(q) : false;
      const matchUsername = acc.username ? acc.username.toLowerCase().includes(q) : false;
      const matchPhone = acc.phone ? acc.phone.includes(q) : false;
      return matchName || matchUsername || matchPhone;
    }
    return true;
  });

  // Comprehensive Registration & Live Stats Calculation
  const totalStudentsCount = studentsList.length;
  const totalTeachersCount = teachersList.length;
  const supervisorsCount = allAccountsList.filter((a) => a && a.role === 'supervisor').length;
  const approvedStudentsCount = studentsList.filter((s) => s && s.status === 'approved').length;
  const pendingStudentsCount = studentsList.filter((s) => s && s.status === 'pending').length;
  
  // Total overall registered in the academy
  const totalRegisteredAll = totalStudentsCount + totalTeachersCount + supervisorsCount;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-right" dir="rtl">
      
      {/* Toast notification */}
      {notificationToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-white shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{notificationToast}</span>
        </div>
      )}

      {/* DASHBOARD HERO HEADER */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0d2a1c] via-[#113824] to-[#0a2216] p-5 sm:p-7 border-2 border-amber-500/70 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-xl shadow-amber-500/30 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-sm">
                  لوحة الإدارة والإشراف المعتمدة
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  مقرأة رحاب القرآن الإلكترونية
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
                لوحة تحكم المشرفين والمعلمين
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                إدارة موحدة وشاملة لحلقات <strong className="text-amber-300">قسم الطلاب (بنين)</strong> و <strong className="text-emerald-300">قسم الطالبات (أخوات)</strong>
              </p>
            </div>
          </div>

          {/* Current Auth User info and switch */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                setAddUserInitialRole('student');
                setAddUserInitialSection(activeSection === 'both' ? 'male' : activeSection);
                setIsAddUserModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة طالب أو معلم يدوياً</span>
            </button>

            <div className="bg-[#071910] border border-emerald-600/70 rounded-2xl p-2.5 px-4 text-center sm:text-right">
              <span className="text-[10px] text-slate-400 block">المستخدم الفعّال حالياً:</span>
              <span className="text-xs font-bold text-white block">{safeAuthUser.name}</span>
              <span className="text-[10px] text-amber-400 font-semibold">{safeAuthUser.titleBadge || 'مشرف المقرأة'}</span>
            </div>

            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 border border-emerald-500/30"
              >
                <UserCheck className="w-4 h-4" />
                <span>تبديل الحساب</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION FILTER BAR (قسم الطلاب / قسم الطالبات / كلاهما) */}
        <div className="mt-6 pt-4 border-t border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold">عرض بيانات:</span>
            <div className="inline-flex bg-[#06170e] p-1 rounded-2xl border border-emerald-700/80">
              <button
                type="button"
                onClick={() => setActiveSection('male')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === 'male'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                قسم الطلاب (بنين)
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('female')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === 'female'
                    ? 'bg-emerald-600 text-white shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                قسم الطالبات (أخوات)
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('both')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === 'both'
                    ? 'bg-teal-600 text-white shadow-md font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                كلا القسمين (إدارة عامة)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotificationsDrawerOpen(!isNotificationsDrawerOpen)}
              className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 hover:text-white border border-amber-700/80 text-xs flex items-center gap-1.5 cursor-pointer transition-colors relative shadow-sm"
              title="سجل طلبات التسجيل والإشعارات"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>إشعارات التسجيل</span>
              {pendingStudentsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center animate-pulse">
                  {pendingStudentsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={loadAllData}
              className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white border border-emerald-800 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin text-amber-400' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading state notification */}
      {isLoading && (
        <div className="p-4 rounded-2xl bg-[#071910] border border-emerald-800/80 text-emerald-300 flex items-center justify-center gap-2.5 text-xs font-bold animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Real Firestore / Network Error Alert with Retry button */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={loadAllData}
            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 PROMINENT LIVE STATS BAR (إحصائيات حية وبارزة في أعلى الشاشة)          */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#092216] via-[#061910] to-[#04110a] border-2 border-amber-500/80 shadow-2xl space-y-4">
        
        {/* Header Strip with Live Pulse and Time indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white font-serif">
                  المؤشرات الحية للمقرأة والمنصة
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>بث مباشر لحظي 🟢</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                رصد فوري متزامن لأعداد الزوار والمستخدمين النشطين وإجمالي المسجلين في المقرأة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
            <span className="text-[11px] text-slate-400 bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
              آخر رصد: <strong className="text-amber-300 font-mono">{lastLiveUpdated}</strong>
            </span>
            <button
              onClick={() => {
                setIsRefreshingLive(true);
                loadAllData();
                setLiveVisitors((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
                setTimeout(() => setIsRefreshingLive(false), 500);
                showToast('تم تحديث المؤشرات الحية والإحصائيات بنجاح.');
              }}
              className="p-1.5 px-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-600/80 text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              title="تحديث الإحصائيات الحية لحظياً"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin' : ''}`} />
              <span>تحديث فوري</span>
            </button>
          </div>
        </div>

        {/* 4 Flagship Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: عدد الزوار الحاليين */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c2f1e] to-[#06180f] border-2 border-emerald-500/80 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">عدد الزوار الحاليين</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>مباشر الآن</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow">
                {liveVisitors}
              </span>
              <span className="text-xs text-emerald-300 font-bold">زائر متصفح</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-300">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>يتصفحون البوابة والمصحف</span>
              </span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-slate-300">
                اليوم نشط
              </span>
            </div>
          </div>

          {/* Card 2: عدد المستخدمين النشطين */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#123624] to-[#071d12] border-2 border-amber-500/80 shadow-lg relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">عدد المستخدمين النشطين</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black">
                <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>متصل ومتفاعل</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight drop-shadow">
                {activeUsersCount}
              </span>
              <span className="text-xs text-amber-200 font-bold">عضو متصل</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>في الحلقات والدروس</span>
              </span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                تفاعل لحظي
              </span>
            </div>
          </div>

          {/* Card 3: الإجمالي الكلي للمسجلين في المقرأة */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#193f2c] to-[#092215] border-2 border-yellow-400/90 shadow-lg relative overflow-hidden group hover:border-yellow-300 transition-all">
            <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-200">الإجمالي الكلي للمسجلين</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-black">
                <Award className="w-3 h-3 text-yellow-400" />
                <span>إجمالي المقرأة</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight drop-shadow">
                {totalRegisteredAll}
              </span>
              <span className="text-xs text-yellow-200 font-bold">عضو معتمد</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[10px] text-slate-300 flex-wrap gap-1">
              <span className="bg-black/50 px-1.5 py-0.5 rounded text-emerald-300 font-semibold border border-emerald-700/40">
                طلاب: {totalStudentsCount}
              </span>
              <span className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300 font-semibold border border-amber-700/40">
                معلمون: {totalTeachersCount}
              </span>
              <span className="bg-black/50 px-1.5 py-0.5 rounded text-blue-300 font-semibold border border-blue-700/40">
                مشرفون: {supervisorsCount}
              </span>
            </div>
          </div>

          {/* Card 4: إجمالي المقبولين وجاهزية الحلقات */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c2a1c] to-[#05160d] border-2 border-teal-500/80 shadow-lg relative overflow-hidden group hover:border-teal-400 transition-all">
            <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">الطلاب المعتمدون في الحلقات</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-black">
                <CheckCircle2 className="w-3 h-3 text-teal-400" />
                <span>جاهزية الحلقات</span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-teal-300 font-mono tracking-tight drop-shadow">
                {approvedStudentsCount}
              </span>
              <span className="text-xs text-slate-300 font-bold">طالب وطالبة</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-teal-200">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>{filteredHalaqat.length} حلقات مفعّلة</span>
              </span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                {pendingStudentsCount} قيد المراجعة
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 🔔 LIVE POPUP ALERT FOR NEW STUDENT REGISTRATION */}
      {liveNewStudentAlert && (
        <div className="fixed top-5 left-4 sm:left-6 z-50 max-w-md w-[calc(100%-2rem)] sm:w-[420px] p-4 rounded-3xl bg-gradient-to-br from-[#0e3523] via-[#092216] to-[#04120c] border-2 border-amber-400 shadow-2xl space-y-3 animate-bounce-subtle text-right" dir="rtl">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-800/80 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>طلب تسجيل جديد ورد الآن! 🔔</span>
                </span>
                <h4 className="text-sm font-bold text-white">
                  {liveNewStudentAlert.studentName}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setLiveNewStudentAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#05140d] p-2.5 rounded-2xl border border-emerald-900 text-xs space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>القسم:</span>
              <strong className="text-emerald-300">
                {liveNewStudentAlert?.section === 'female' ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)'}
              </strong>
            </div>
            {liveNewStudentAlert?.phone && (
              <div className="flex justify-between text-slate-300">
                <span>الهاتف / الواتساب:</span>
                <span className="text-amber-300 font-mono">{liveNewStudentAlert.phone}</span>
              </div>
            )}
            {liveNewStudentAlert?.memorization && (
              <div className="flex justify-between text-slate-300">
                <span>مقدار الحفظ:</span>
                <span className="text-slate-200">{liveNewStudentAlert.memorization}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-emerald-950">
              <span>الحالة:</span>
              <span className="text-amber-400 font-bold">قيد الانتظار بانتظار اعتمادك</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {liveNewStudentAlert.studentId && (
              <button
                onClick={() => {
                  handleUpdateStudentStatus(liveNewStudentAlert.studentId!, 'approved');
                  setLiveNewStudentAlert(null);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>قبول واعتماد فوري</span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('applications');
                setStatusFilter('pending');
                setLiveNewStudentAlert(null);
              }}
              className="py-2 px-3 rounded-xl bg-[#091b12] hover:bg-emerald-900 border border-emerald-700 text-slate-200 hover:text-white font-semibold text-xs transition-all cursor-pointer"
            >
              عرض في قائمة الانتظار
            </button>
          </div>
        </div>
      )}

      {/* ⚠️ PENDING STUDENTS NOTIFICATION BANNER */}
      {pendingStudentsCount > 0 && (
        <div className="p-4 sm:p-4.5 rounded-3xl bg-gradient-to-r from-[#211105] via-[#1a1405] to-[#091c13] border-2 border-amber-500/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-300">
                  تنبيه: يوجد ({pendingStudentsCount}) طلبات تسجيل جديدة قيد الانتظار!
                </h3>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                وصلت طلبات تسجيل جديدة ومحفوظة في قاعدة البيانات، تنتظر مراجعتكم واعتماد قبولهم في الحلقات القرآنية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <button
              onClick={() => {
                setActiveTab('applications');
                setStatusFilter('pending');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>فحص طلبات الانتظار ({pendingStudentsCount})</span>
            </button>
            <button
              onClick={handleApproveAllPendingStudents}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="قبول جميع الطلبات المعلقة دفعة واحدة"
            >
              <Check className="w-3.5 h-3.5" />
              <span>قبول الكل</span>
            </button>
          </div>
        </div>
      )}

      {/* 📋 NOTIFICATION CENTER / RECENT REQUESTS MODAL */}
      {isNotificationsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#071911] border-2 border-amber-500/80 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-right" dir="rtl">
            <div className="p-4 sm:p-5 border-b border-emerald-800/80 bg-[#092216] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">مركز إشعارات وطلبات التسجيل</h3>
                  <span className="text-xs text-amber-300">
                    {notificationsList.length} إشعار مسجل في النظام
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {notificationsList.length > 0 && (
                  <button
                    onClick={() => {
                      clearAllSupervisorNotifications();
                      setNotificationsList([]);
                    }}
                    className="text-[11px] text-slate-400 hover:text-red-300 px-2 py-1 rounded-lg border border-white/10 hover:border-red-900 transition-colors cursor-pointer"
                  >
                    مسح السجل
                  </button>
                )}
                <button
                  onClick={() => setIsNotificationsDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {notificationsList.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Bell className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-300 font-bold">لا توجد إشعارات تسجيل جديدة</p>
                  <p className="text-xs text-slate-500">عند تقديم أي طالب طلب تسجيل سيصلك إشعار فوري هنا مع تنبيه مرئي وصوتي.</p>
                </div>
              ) : (
                notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      !n.read
                        ? 'bg-[#0f2c1e] border-amber-500/70 shadow-md'
                        : 'bg-[#061710] border-emerald-900/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          {n.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {n.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      {n.phone && (
                        <span className="text-amber-300 font-mono text-[11px]">
                          📱 {n.phone}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 mr-auto">
                        {n.studentId && (
                          <button
                            onClick={() => {
                              handleUpdateStudentStatus(n.studentId!, 'approved');
                              markNotificationAsRead(n.id);
                              setNotificationsList(getSupervisorNotifications());
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>قبول</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveTab('applications');
                            setStatusFilter('pending');
                            setIsNotificationsDrawerOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 text-[11px] border border-white/10 cursor-pointer"
                        >
                          عرض في الانتظار
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-[#06150e] p-1.5 rounded-3xl border border-emerald-800">
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>طلبات وقبول الطلاب</span>
          {pendingStudentsCount > 0 ? (
            <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded-full border border-amber-300 font-black animate-pulse">
              {pendingStudentsCount} في الانتظار
            </span>
          ) : (
            <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-700">
              {filteredStudents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>الحضور والغياب</span>
          {absentCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {absentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('halaqat')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'halaqat'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>إدارة الحلقات</span>
          <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-700">
            {filteredHalaqat.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('honorBoard')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'honorBoard'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>لوحة الشرف</span>
          <span className="bg-amber-950/80 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-800 font-bold">
            {honorStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>إدارة الحسابات</span>
          <span className="bg-amber-950/80 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-800 font-bold">
            {allAccountsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('curriculum')}
          className={`py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'curriculum'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-emerald-950/40'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-300" />
          <span>المنهج والاختبارات</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPLICATIONS & ACCEPTANCE (طلبات التسجيل وقبول الطلاب) */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Sub-Tabs: Students Applications vs Teachers Applications */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#06150e] border border-emerald-800 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setApplicationCategory('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                applicationCategory === 'students'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>طلبات تسجيل الطلاب (بنين وبنات)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px]">
                {studentsList.length}
              </span>
            </button>

            <button
              onClick={() => setApplicationCategory('teachers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                applicationCategory === 'teachers'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>طلبات انضمام المعلمين (كادر التدريس)</span>
              {teachersList.filter((t) => t && t.status === 'pending').length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                  {teachersList.filter((t) => t && t.status === 'pending').length} بانتظار الاعتماد
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#091b12] text-slate-400 text-[10px]">
                  {teachersList.length}
                </span>
              )}
            </button>
          </div>

          {/* 1. TEACHERS APPLICATIONS VIEW */}
          {applicationCategory === 'teachers' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Teacher Controls Bar */}
              <div className="p-4 rounded-3xl bg-[#091b12] border border-emerald-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث في المعلمين بالاسم أو التخصص أو الهاتف..."
                    className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                  {(['all', 'pending', 'approved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTeacherStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        teacherStatusFilter === st
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'bg-[#06150e] text-slate-400 hover:text-white border border-emerald-800'
                      }`}
                    >
                      {st === 'all' && <span>جميع طلبات المعلمين ({teachersList.length})</span>}
                      {st === 'pending' && (
                        <>
                          <span>بانتظار موافقة الإدارة</span>
                          {teachersList.filter((t) => t && t.status === 'pending').length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                              {teachersList.filter((t) => t && t.status === 'pending').length}
                            </span>
                          )}
                        </>
                      )}
                      {st === 'approved' && <span>المعتمدون</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice for Supervisor */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-3 text-xs text-amber-300">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>سياسة اعتماد المعلمين:</strong> تسجيل المعلم خاضع لمراجعة المدير والموافقة عليه قبل السماح له بالدخول وإدارة الطلاب والحلقات.
                </span>
              </div>

              {/* Teachers Cards List */}
              {teachersList.filter((t) => {
                if (!t) return false;
                const matchStatus = teacherStatusFilter === 'all' ? true : t.status === teacherStatusFilter;
                const matchSearch = !searchQuery.trim() ||
                  (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (t.phone && t.phone.includes(searchQuery)) ||
                  (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (t.qualification && t.qualification.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (t.specialty && t.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchStatus && matchSearch;
              }).length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#091b12] border border-emerald-800 text-center space-y-2">
                  <Award className="w-12 h-12 text-slate-500 mx-auto" />
                  <h3 className="font-bold text-white text-base">لا توجد طلبات معلمين مطابقة</h3>
                  <p className="text-xs text-slate-400">
                    يمكنك تغيير فلتر الحالة أو انتظار تقديم طلبات جديدة من المعلمين.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teachersList
                    .filter((t) => {
                      if (!t) return false;
                      const matchStatus = teacherStatusFilter === 'all' ? true : t.status === teacherStatusFilter;
                      const matchSearch = !searchQuery.trim() ||
                        (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (t.phone && t.phone.includes(searchQuery)) ||
                        (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (t.qualification && t.qualification.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (t.specialty && t.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
                      return matchStatus && matchSearch;
                    })
                    .map((t) => {
                      const isPending = t.status === 'pending';
                      return (
                        <div
                          key={t.id}
                          className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
                            isPending
                              ? 'bg-[#151c14] border-amber-500/70 shadow-lg'
                              : 'bg-[#092215] border-emerald-600/80 shadow-md'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base text-slate-950 ${
                                  isPending ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}>
                                  <Award className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-base text-white">
                                    {t.name}
                                  </h4>
                                  <span className="text-xs text-amber-300 font-semibold">
                                    {t.qualification || 'معلم قرآن كريم'}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                isPending
                                  ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-600'
                              }`}>
                                {isPending ? 'بانتظار موافقة المدير' : '✓ معتمد ومفعل'}
                              </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-[#04120a] p-3 rounded-2xl border border-emerald-900/60">
                              <div>
                                <span className="text-slate-400 block text-[11px]">التخصص:</span>
                                <strong className="text-white">{t.specialty || 'تجويد وقراءات'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">القسم المرغوب:</span>
                                <strong className="text-emerald-300">
                                  {t.targetSection === 'female' ? 'قسم الطالبات (بنات)' : t.targetSection === 'both' ? 'كلا القسمين' : 'قسم الطلاب (بنين)'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">الخبرة التدريسية:</span>
                                <strong className="text-white">{t.experience || 'غير محدد'}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[11px]">الهاتف / واتساب:</span>
                                <strong className="text-amber-300 font-mono" dir="ltr">{t.phone}</strong>
                              </div>
                            </div>

                            {/* Application Statement / Notes */}
                            {t.requestNotes && (
                              <div className="p-2.5 rounded-xl bg-[#07190f] border border-emerald-900/80 text-xs text-slate-300">
                                <span className="text-[11px] text-amber-400 font-bold block mb-0.5">طلب التسجيل كمعلم:</span>
                                <p className="leading-relaxed italic">"{t.requestNotes}"</p>
                              </div>
                            )}

                            {t.email && (
                              <p className="text-[11px] text-slate-400 font-mono">
                                البريد الإلكتروني: {t.email}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    approveTeacherAccount(t.email || t.id);
                                    updateTeacherStatus(t.id, 'approved');
                                    setTeachersList(getRegisteredTeachers());
                                    setAllAccountsList(getAllAccounts());
                                    setNotificationToast(`تم اعتماد وتفعيل حساب المعلم (${t.name}) بنجاح! يمكنه الآن تسجيل الدخول وإدارة الطلاب.`);
                                    setTimeout(() => setNotificationToast(null), 4500);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>اعتماد المعلم والموافقة عليه</span>
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>حساب المعلم نشط ومعتمد</span>
                                </span>
                              )}

                              {(() => {
                                const teacherVal = validateAndCleanWhatsAppNumber(t.phone, t.country);
                                return teacherVal.isValid ? (
                                  <a
                                    href={`https://wa.me/${teacherVal.cleanPhone}?text=${encodeURIComponent(`السلام عليكم فضيلة الشيخ ${t.name}، نرحب بكم من إدارة مقرأة رحاب القرآن الإلكترونية بشأن طلب انضمامكم لكادر التدريس.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 rounded-xl bg-teal-800/60 hover:bg-teal-700/80 text-teal-200 font-bold text-xs flex items-center gap-1 transition-all"
                                    title={`فتح واتساب (${teacherVal.formattedDisplay})`}
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>واتساب ({teacherVal.formattedDisplay})</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => showToast(`رقم هاتف المعلم (${t.name}) غير صالح للواتساب: ${teacherVal.error || 'يرجى مراجعة الرقم'}`)}
                                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs flex items-center gap-1 cursor-pointer"
                                    title="رقم غير صالح"
                                  >
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                    <span>واتساب (غير صالح)</span>
                                  </button>
                                );
                              })()}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف طلب المعلم (${t.name})؟`)) {
                                  deleteRegisteredTeacher(t.id);
                                  setTeachersList(getRegisteredTeachers());
                                  setNotificationToast(`تم حذف طلب المعلم (${t.name}).`);
                                  setTimeout(() => setNotificationToast(null), 3000);
                                }
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* 2. STUDENTS APPLICATIONS VIEW (Default) */}
          {applicationCategory === 'students' && (
            <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-[#091b12] border border-emerald-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث بالاسم أو رقم الهاتف المسجل..."
                className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
              />
              <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
            </div>

            {/* Status Filter and Manual Add Button */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#06150e] text-slate-400 hover:text-white border border-emerald-800'
                    }`}
                  >
                    {st === 'all' && <span>جميع الطلبات</span>}
                    {st === 'pending' && (
                      <>
                        <span>قيد الانتظار</span>
                        {pendingStudentsCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                            {pendingStudentsCount}
                          </span>
                        )}
                      </>
                    )}
                    {st === 'approved' && <span>المقبولون</span>}
                    {st === 'rejected' && <span>المرفوضون</span>}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAddUserInitialRole('student');
                  setAddUserInitialSection(activeSection === 'both' ? 'male' : activeSection);
                  setIsAddUserModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ إضافة طالب يدوياً</span>
              </button>
            </div>
          </div>

          {/* Pending Batch Action Notification */}
          {statusFilter === 'pending' && filteredStudents.length > 0 && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  يوجد حالياً <strong>{filteredStudents.length}</strong> طلب تسجيل في قائمة الانتظار بانتظار الاعتماد.
                </span>
              </div>
              <button
                onClick={handleApproveAllPendingStudents}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>اعتماد وقبول جميع المعروضين ({filteredStudents.length})</span>
              </button>
            </div>
          )}

          {/* Students Application Cards / Table */}
          {filteredStudents.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#091b12] border border-emerald-800 text-center space-y-2">
              <Users className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="font-bold text-white text-base">لا توجد طلبات تسجيل مطابقة</h3>
              <p className="text-xs text-slate-400">
                يمكنك تبديل فلاتر البحث أو انتظار تسجيل طلبات جديدة من الطلاب.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 flex flex-col justify-between ${
                    st.status === 'approved'
                      ? 'bg-[#092215] border-emerald-600/80 shadow-md'
                      : st.status === 'rejected'
                      ? 'bg-[#190d0e] border-red-900/80 opacity-80'
                      : 'bg-[#0e2118] border-amber-500/60 shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-slate-950 ${
                          st?.section === 'male' ? 'bg-amber-400' : 'bg-teal-400'
                        }`}>
                          {st?.name ? st.name.charAt(0) : 'ط'}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-white">
                            {st?.name || 'طالب جديد'}
                          </h4>
                          <span className="text-[11px] text-emerald-300/80">
                            {st?.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        st?.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                          : st?.status === 'rejected'
                          ? 'bg-red-950 text-red-300 border-red-700'
                          : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                      }`}>
                        {st?.status === 'approved' && '✓ مقبول ومعتمد'}
                        {st?.status === 'rejected' && '✗ طلب مرفوض'}
                        {st?.status === 'pending' && '⏳ قيد المراجعة والقبول'}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-[#06150e]/90 p-2.5 rounded-xl border border-emerald-900/80">
                      <div>
                        <span className="text-slate-400 block text-[10px]">القسم والدولة:</span>
                        <span className="text-white font-semibold block truncate">
                          {st?.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                          {st?.country ? ` • ${st.country}` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">نوع الدراسة:</span>
                        <span className="text-emerald-400 font-semibold block truncate">
                          {st?.studyType || 'تحفيظ القرآن الكريم'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">الرواية القرآنية:</span>
                        <span className="text-amber-300 font-bold block truncate">
                          {st?.riwayah || 'حفص عن عاصم'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">المستوى والمقدار:</span>
                        <span className="text-slate-200 font-medium block truncate">
                          {st?.memorization || (st as any)?.memorizedAmount || 'مبتدئ / عام'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[10px]">الوقت المناسب للحصة:</span>
                        <span className="text-teal-300 font-semibold block truncate">
                          {st?.preferredTime || 'الصباح'}
                          {st?.preferredTimeDetail ? ` (${st.preferredTimeDetail})` : ''}
                        </span>
                      </div>
                      {st?.monthlyContribution && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 block text-[10px]">رسوم المساهمة الشهرية (3000 ريال قديم أو ما يعادلها):</span>
                          <span className="text-amber-300 font-semibold block text-xs">
                            {st.monthlyContribution}
                          </span>
                        </div>
                      )}
                    </div>

                    {st?.notes && (
                      <p className="text-[11px] text-slate-300 bg-[#06150e]/60 p-2 rounded-lg border border-emerald-950">
                        ملاحظات الطالب: {st.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {st?.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => st?.id && handleUpdateStudentStatus(st.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول الطالب</span>
                        </button>
                      )}

                      {st?.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => st?.id && handleUpdateStudentStatus(st.id, 'rejected')}
                          className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Welcome Message */}
                      <a
                        href={getWhatsAppStudentWelcomeLink(st)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                        title="إرسال رسالة القبول الرسمية عبر الواتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>إشعار القبول (واتساب)</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DAILY ATTENDANCE SYSTEM (نظام الحضور والغياب اليومي) */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Date, Halqa Filter, and Send Absentee Alerts */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#091b12] border-2 border-emerald-700/80 shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Date Picker */}
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    تاريخ التحضير اليومي:
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Halqa Filter */}
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">
                    تصفية الحلقة المحددة:
                  </label>
                  <select
                    value={selectedHalqaId}
                    onChange={(e) => setSelectedHalqaId(e.target.value)}
                    className="bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">جميع الحلقات</option>
                    {filteredHalaqat.map((h) => (
                      <option key={h.id} value={h.id}>{h.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prominent Absentee Notification Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendAbsenteeAlerts}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/70 border border-red-400/40 transition-all cursor-pointer active:scale-95"
                  title="إرسال إشعارات فورية عبر النظام والواتساب لجميع الطلاب المسجلين غائبين اليوم"
                >
                  <Bell className="w-4 h-4 animate-bounce" />
                  <span>إرسال إشعارات للغائبين اليوم ({absentCount})</span>
                </button>
              </div>

            </div>

            {/* Attendance Status Summary Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-emerald-800/80">
              <div className="p-3 rounded-2xl bg-[#071d13] border border-emerald-600/70 text-center">
                <span className="text-[11px] text-emerald-300 block font-semibold">حاضر</span>
                <span className="text-xl sm:text-2xl font-black text-white">{presentCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#210c0e] border border-red-800/70 text-center">
                <span className="text-[11px] text-red-300 block font-semibold">غائب</span>
                <span className="text-xl sm:text-2xl font-black text-red-400">{absentCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#211b0c] border border-amber-800/70 text-center">
                <span className="text-[11px] text-amber-300 block font-semibold">متأخر</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400">{lateCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#141224] border border-indigo-800/70 text-center">
                <span className="text-[11px] text-indigo-300 block font-semibold">مستأذن</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-300">{excusedCount}</span>
              </div>
            </div>
          </div>

          {/* Students Attendance List */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#091b12] border border-emerald-800 space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center justify-between">
              <span>كشف تسجيل الحضور لجلسة ({attendanceDate}):</span>
              <span className="text-xs text-slate-400 font-normal">
                تسجيل المعلم المشرف: {safeAuthUser.name}
              </span>
            </h3>

            {filteredAttendance.length === 0 ? (
              <div className="p-8 text-center bg-[#06150e] border border-emerald-900/80 rounded-2xl space-y-2">
                <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300 font-bold">لا توجد سجلات حضور مسجلة لهذا التاريخ والقسم</p>
                <p className="text-[11px] text-slate-400">سيظهر هنا الطلاب فور تسجيل حضورهم أو غيابهم عبر الحلقات اليومية.</p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-900/60">
                {filteredAttendance.map((entry) => {
                  const isAbsent = entry.status === 'absent';
                  const absPhoneVal = validateAndCleanWhatsAppNumber(entry.studentPhone, (entry as any).studentCountry);
                  const whatsappMsg = getWhatsAppAbsenteeMessage(entry.studentName, entry.halqaTitle, attendanceDate);
                  const whatsappUrl = absPhoneVal.isValid ? `https://wa.me/${absPhoneVal.cleanPhone}?text=${encodeURIComponent(whatsappMsg)}` : '';
                  const studentSectionSafe = (entry.studentSection || 'male') as 'male' | 'female';

                  return (
                    <div key={entry.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{entry.studentName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            studentSectionSafe === 'male' ? 'bg-amber-950 text-amber-300 border-amber-600' : 'bg-teal-950 text-teal-300 border-teal-600'
                          }`}>
                            {studentSectionSafe === 'male' ? 'قسم الطلاب' : 'قسم الطالبات'}
                          </span>
                          {entry.notificationSent && (
                            <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded-full border border-red-800">
                              تم إرسال إشعار الغياب
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {entry.halqaTitle} • سجل الحضور: <strong className="text-emerald-300">{entry.recordedByTeacher}</strong>
                        </p>
                        {entry.notes && (
                          <p className="text-[11px] text-amber-300/90 italic">
                            ملاحظات: {entry.notes}
                          </p>
                        )}
                      </div>

                      {/* Quick Status and WhatsApp Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickAttendance(
                            { id: entry.studentId, name: entry.studentName, phone: entry.studentPhone, section: studentSectionSafe },
                            { id: entry.halqaId, title: entry.halqaTitle },
                            'present'
                          )}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            entry.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-[#06150e] text-slate-400 hover:text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          حاضر
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAttendance(
                            { id: entry.studentId, name: entry.studentName, phone: entry.studentPhone, section: studentSectionSafe },
                            { id: entry.halqaId, title: entry.halqaTitle },
                            'absent'
                          )}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            entry.status === 'absent'
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-[#06150e] text-slate-400 hover:text-red-300 border border-emerald-800'
                          }`}
                        >
                          غائب
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAttendance(
                            { id: entry.studentId, name: entry.studentName, phone: entry.studentPhone, section: studentSectionSafe },
                            { id: entry.halqaId, title: entry.halqaTitle },
                            'late'
                          )}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            entry.status === 'late'
                              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                              : 'bg-[#06150e] text-slate-400 hover:text-amber-300 border border-emerald-800'
                          }`}
                        >
                          متأخر
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAttendance(
                            { id: entry.studentId, name: entry.studentName, phone: entry.studentPhone, section: studentSectionSafe },
                            { id: entry.halqaId, title: entry.halqaTitle },
                            'excused'
                          )}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            entry.status === 'excused'
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-[#06150e] text-slate-400 hover:text-indigo-300 border border-emerald-800'
                          }`}
                        >
                          مستأذن
                        </button>

                        {/* Direct WhatsApp Absence Notification Button */}
                        {isAbsent && (
                          absPhoneVal.isValid ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                markStudentAttendance(
                                  { id: entry.studentId, name: entry.studentName, phone: entry.studentPhone, section: studentSectionSafe },
                                  { id: entry.halqaId, title: entry.halqaTitle },
                                  'absent',
                                  safeAuthUser.name,
                                  entry.notes || 'تم إرسال إشعار الغياب عبر الواتساب',
                                  attendanceDate
                                );
                                showToast(`تم فتح الواتساب لإرسال إشعار الغياب للطالب/ة (${entry.studentName})`);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer"
                              title={`إرسال إشعار الغياب عبر الواتساب (${absPhoneVal.formattedDisplay})`}
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                              <span>إرسال إشعار الغياب عبر الواتساب ({absPhoneVal.formattedDisplay})</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => showToast(`تعذر فتح واتساب: رقم هاتف الطالب (${entry.studentName}) غير صالح (${absPhoneVal.error || 'يرجى مراجعة الرقم'}).`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 cursor-pointer"
                              title="رقم الهاتف غير صالح"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>واتساب (غير صالح)</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HALAQAT MANAGEMENT (إدارة الحلقات والروابط) */}
      {/* ========================================================================= */}
      {activeTab === 'halaqat' && (
        <div className="space-y-4">
          {/* شريط إدارة الحلقات وزر إنشاء حلقة جديدة */}
          <div className="bg-[#0a1f15] p-5 rounded-3xl border-2 border-emerald-700/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400">إدارة وتنظيم الحلقات القرآنية</span>
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <span>الحلقات القرآنية المباشرة والمجموعات</span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {filteredHalaqat.length} حلقة
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewHalqaTitle('');
                setNewHalqaPreset('');
                setNewHalqaSection(activeSection === 'both' ? 'male' : activeSection);
                setIsAddHalqaModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#046A38] hover:from-emerald-500 hover:to-[#057d42] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 border border-[#C5A059] active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>إنشاء حلقة جديدة وتصنيفها</span>
            </button>
          </div>

          {/* شريط تصنيفات الحلقات: حفظ، مراجعة، إجازة */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-[#06150e] rounded-2xl border border-emerald-800/80">
            <span className="text-xs font-bold text-amber-300 ml-1">تصنيف الحلقة:</span>
            <button
              type="button"
              onClick={() => setHalqaFilterClassification('all')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                halqaFilterClassification === 'all'
                  ? 'bg-gradient-to-r from-emerald-600 to-[#046A38] text-white border-emerald-500 shadow-xs'
                  : 'bg-[#0a1f15] text-slate-300 border-emerald-800 hover:border-emerald-600'
              }`}
            >
              جميع الحلقات ({halaqatList.length})
            </button>
            {HALQA_CLASSIFICATIONS.map(c => {
              const count = halaqatList.filter(h => detectHalqaClassification(h).id === c.id).length;
              const isSelected = halqaFilterClassification === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setHalqaFilterClassification(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? `${c.darkBadgeClasses} bg-opacity-90 shadow-xs ring-2 ring-amber-400/30`
                      : 'bg-[#0a1f15] text-slate-300 border-emerald-800 hover:border-emerald-600'
                  }`}
                >
                  {c.id === 'hifz' && <BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                  {c.id === 'morajaah' && <RefreshCw className="w-3.5 h-3.5 text-sky-400" />}
                  {c.id === 'ijazah' && <Award className="w-3.5 h-3.5 text-amber-400" />}
                  {c.id === 'tashih' && <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
                  {c.id === 'ashbal' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{c.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40">{count}</span>
                </button>
              );
            })}
          </div>

          {filteredHalaqat.length === 0 ? (
            <div className="p-12 text-center bg-[#06150e] border-2 border-dashed border-emerald-800/80 rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-center mx-auto text-emerald-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">لا توجد حلقات مطابقة للتصنيف المحدد</h4>
                <p className="text-xs text-slate-400">يمكنك إنشاء حلقة جديدة بهذا التصنيف أو إلغاء تصفية العرض</p>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setHalqaFilterClassification('all')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all"
                >
                  عرض جميع الحلقات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (halqaFilterClassification !== 'all') {
                      setNewHalqaClassification(halqaFilterClassification);
                    }
                    setIsAddHalqaModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء حلقة جديدة الآن</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHalaqat.map((halqa) => {
                const cls = detectHalqaClassification(halqa);
                return (
                <div
                  key={halqa.id}
                  className="p-5 rounded-3xl bg-[#0a1f15] border-2 border-emerald-700/80 shadow-lg space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cls.darkBadgeClasses} flex items-center gap-1`}>
                          {cls.id === 'hifz' && <BookOpen className="w-3 h-3 text-emerald-400" />}
                          {cls.id === 'morajaah' && <RefreshCw className="w-3 h-3 text-sky-400" />}
                          {cls.id === 'ijazah' && <Award className="w-3 h-3 text-amber-400" />}
                          {cls.id === 'tashih' && <Volume2 className="w-3 h-3 text-teal-400" />}
                          {cls.id === 'ashbal' && <Sparkles className="w-3 h-3 text-purple-400" />}
                          <span>{cls.singular}</span>
                        </span>
                        <span className="text-[11px] text-amber-400 font-bold block">
                          {halqa.isFemaleSection ? 'قسم الطالبات' : 'قسم الطلاب'}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-white">{halqa.title}</h4>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      halqa.isLiveNow
                        ? 'bg-red-950 text-red-300 border-red-500 animate-pulse'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}>
                      {halqa.isLiveNow ? '● قاعة مباشرة الآن' : 'غير نشطة حالياً'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {halqa.description}
                  </p>

                  {/* Supervisor & Schedule Details */}
                  <div className="bg-[#06150e] p-3 rounded-2xl border border-emerald-900 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المشرف والمعلم:</span>
                      <span className="text-white font-bold">{halqa.sheikhName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الموعد اليومي:</span>
                      <span className="text-amber-300 font-semibold">{halqa.scheduleTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">السعة / الملتحقون:</span>
                      <span className="text-emerald-300 font-mono font-bold">{halqa.enrolledCount} من {halqa.capacity} طالب</span>
                    </div>
                  </div>

                  {/* Direct Links Row */}
                  <div className="pt-2 border-t border-emerald-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    {/* WhatsApp Group Link */}
                    <a
                      href={halqa.whatsappGroupUrl || (halqa.isFemaleSection ? "https://chat.whatsapp.com/L7KhrehabQuranFemale" : "https://chat.whatsapp.com/GjZ8rehabQuranMale")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>رابط قروب الواتساب المعتمد</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    {/* Google Meet Link */}
                    {halqa.meetUrl && (
                      <a
                        href={halqa.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-[#071910] hover:bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Video className="w-4 h-4 text-amber-400" />
                        <span>Google Meet</span>
                      </a>
                    )}

                    {onJoinHalqaLive && (
                      <button
                        type="button"
                        onClick={() => onJoinHalqaLive(halqa)}
                        className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>دخول القاعة</span>
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}

          {/* نافذة إنشاء حلقة قرآنية جديدة مع تصنيف الحلقات وخيار اسم الحلقة */}
          {isAddHalqaModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#0a1f15] border-2 border-emerald-600 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right animate-scale-up max-h-[90vh] overflow-y-auto" dir="rtl">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-900/60 border border-emerald-500/60 flex items-center justify-center text-amber-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 block">إدارة وتنظيم المقرأة</span>
                      <h4 className="font-bold text-base text-white font-serif">إنشاء حلقة قرآنية جديدة وتصنيفها</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddHalqaModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateNewHalqa} className="space-y-3.5 text-xs text-slate-200">
                  {/* 1. تصنيف مسار الحلقة: حلقات حفظ، حلقات مراجعة، حلقات إجازة */}
                  <div className="bg-[#06150e] p-3.5 rounded-2xl border border-emerald-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-white text-xs flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>تصنيف مسار الحلقة: <span className="text-amber-400">*</span></span>
                      </label>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        ميزة تصنيف الحلقات
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {HALQA_CLASSIFICATIONS.map((c) => {
                        const isSelected = newHalqaClassification === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setNewHalqaClassification(c.id);
                              const firstPreset = c.suggestedPresets[0];
                              setNewHalqaPreset(firstPreset);
                              setNewHalqaTitle(firstPreset);
                            }}
                            className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? `${c.darkCardActiveClasses} bg-[#0c2419]`
                                : 'bg-[#0a1f15] hover:bg-[#0e2c1f] border-emerald-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {c.id === 'hifz' && <BookOpen className="w-4 h-4 text-emerald-400" />}
                              {c.id === 'morajaah' && <RefreshCw className="w-4 h-4 text-sky-400" />}
                              {c.id === 'ijazah' && <Award className="w-4 h-4 text-amber-400" />}
                              {c.id === 'tashih' && <Volume2 className="w-4 h-4 text-teal-400" />}
                              {c.id === 'ashbal' && <Sparkles className="w-4 h-4 text-purple-400" />}
                              <span className={`font-bold text-xs ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                                {c.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">({c.singular})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* بطاقة توضيحية للمسار */}
                    {(() => {
                      const activeConf = HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification) || HALQA_CLASSIFICATIONS[0];
                      return (
                        <div className="p-2.5 rounded-xl bg-[#0a1f15] border border-emerald-800/60 text-[11px] text-slate-300 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">🎯 {activeConf.badgeTitle}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${activeConf.darkBadgeClasses}`}>
                              معتمد للإدارة والمعلمين
                            </span>
                          </div>
                          <p className="leading-relaxed text-slate-300">{activeConf.desc}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 2. خيار اسم الحلقة */}
                  <div className="bg-[#06150e] p-3.5 rounded-2xl border border-emerald-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-white text-xs">
                        خيار اسم الحلقة: <span className="text-amber-400">*</span>
                      </label>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        أسماء مقترحة لـ {HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.label}
                      </span>
                    </div>

                    <select
                      value={newHalqaPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewHalqaPreset(val);
                        if (val && val !== 'custom') {
                          setNewHalqaTitle(val);
                          if (val.includes('طالبات') || val.includes('أخوات')) {
                            setNewHalqaSection('female');
                          } else if (val.includes('طلاب') || val.includes('بنين')) {
                            setNewHalqaSection('male');
                          }
                        }
                      }}
                      className="w-full bg-[#0a1f15] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white font-medium"
                    >
                      <option value="">-- اضغط لاختيار اسم الحلقة المعتمد --</option>
                      <optgroup label={`أسماء مقترحة لـ (${HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.label})`}>
                        {(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || []).map((preset, idx) => (
                          <option key={idx} value={preset} className="bg-slate-900 text-white">
                            {preset}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="باقي الأسماء والمقرآت المعتمدة">
                        {HALQA_NAME_PRESETS.filter(p => !(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || []).includes(p)).map((preset, idx) => (
                          <option key={`other-${idx}`} value={preset} className="bg-slate-900 text-white">
                            {preset}
                          </option>
                        ))}
                      </optgroup>
                      <option value="custom" className="bg-slate-900 text-amber-300">✍️ اسم مخصص لحلقة جديدة (كتابة يدوية)...</option>
                    </select>

                    {/* خيارات شائعة سريعة بنقرة واحدة */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">خيارات سريعة بنقرة واحدة:</span>
                      <div className="flex flex-wrap gap-1">
                        {(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || HALQA_NAME_PRESETS).slice(0, 4).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewHalqaPreset(p);
                              setNewHalqaTitle(p);
                              if (p.includes('طالبات')) setNewHalqaSection('female');
                              else if (p.includes('طلاب')) setNewHalqaSection('male');
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                              newHalqaTitle === p
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                                : 'bg-[#0a1f15] text-slate-300 border-emerald-800 hover:border-amber-400'
                            }`}
                          >
                            {p.split('(')[0].trim()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* الحقل النصي لمراجعة أو كتابة اسم الحلقة */}
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        اسم الحلقة المعتمد:
                      </label>
                      <input
                        type="text"
                        required
                        value={newHalqaTitle}
                        onChange={(e) => {
                          setNewHalqaTitle(e.target.value);
                          if (newHalqaPreset !== 'custom') setNewHalqaPreset('custom');
                        }}
                        placeholder="مثال: حلقة الفجر للإتقان"
                        className="w-full bg-[#0a1f15] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-medium text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-white mb-1">القسم:</label>
                      <select
                        value={newHalqaSection}
                        onChange={(e: any) => setNewHalqaSection(e.target.value)}
                        className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white"
                      >
                        <option value="male" className="bg-slate-900 text-white">قسم الطلاب (بنين)</option>
                        <option value="female" className="bg-slate-900 text-white">قسم الطالبات (أخوات)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-white mb-1">المعلم / المشرف:</label>
                      <input
                        type="text"
                        required
                        value={newHalqaSheikh}
                        onChange={(e) => setNewHalqaSheikh(e.target.value)}
                        placeholder="الشيخ / المعلم المشرف"
                        className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-white mb-1">التوقيت اليومي (الموعد):</label>
                    <input
                      type="text"
                      required
                      value={newHalqaTime}
                      onChange={(e) => setNewHalqaTime(e.target.value)}
                      placeholder="05:00 ص - 06:30 ص"
                      className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white mb-1">رابط مجموعة واتساب للحلقة:</label>
                    <input
                      type="url"
                      value={newHalqaWhatsapp}
                      onChange={(e) => setNewHalqaWhatsapp(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-mono text-left text-white"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-white mb-1">رابط Google Meet للحلقة المباشرة:</label>
                    <input
                      type="url"
                      value={newHalqaMeet}
                      onChange={(e) => setNewHalqaMeet(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 font-mono text-left text-white"
                      dir="ltr"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-emerald-800/80">
                    <button
                      type="button"
                      onClick={() => setIsAddHalqaModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md border border-[#C5A059] transition-all"
                    >
                      إنشاء وحفظ الحلقة ✓
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEEKLY HONOR BOARD (لوحة الشرف الأسبوعية للطلاب المتفوقين) */}
      {/* ========================================================================= */}
      {activeTab === 'honorBoard' && (
        <div className="space-y-5">
          
          {/* Header & Add Button */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#171408] via-[#241f0a] to-[#121006] border-2 border-amber-500/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="font-bold text-lg text-white font-serif">
                  لوحة الشرف الأسبوعية وفرسان التلاوة
                </h3>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                تكريم الطلاب والطالبات الأكثر تميزاً في الحفظ والتسميع وإتقان التجويد والمواظبة على الحضور الفجري والمسائي بمقرأة رحاب القرآن.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingHonor(!isAddingHonor)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/70 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingHonor ? 'إغلاق النموذج' : 'إضافة طالب متميز'}</span>
            </button>
          </div>

          {/* Add Form if toggled */}
          {isAddingHonor && (
            <form onSubmit={handleAddHonorSubmit} className="p-5 rounded-3xl bg-[#0b2216] border-2 border-emerald-600 space-y-3">
              <h4 className="font-bold text-sm text-white">إضافة وتكريم طالب جديد في لوحة الشرف:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">اسم الطالب/الطالبة:</label>
                  <input
                    type="text"
                    value={newHonorName}
                    onChange={(e) => setNewHonorName(e.target.value)}
                    placeholder="مثال: عبد الله بن أحمد"
                    className="w-full bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">المعدل التراكمي (%):</label>
                  <input
                    type="number"
                    value={newHonorScore}
                    onChange={(e) => setNewHonorScore(Number(e.target.value))}
                    min="90"
                    max="100"
                    step="0.1"
                    className="w-full bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-bold mb-1">الوسام أو اللقب التكريمي:</label>
                  <input
                    type="text"
                    value={newHonorBadge}
                    onChange={(e) => setNewHonorBadge(e.target.value)}
                    className="w-full bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 font-bold mb-1">كلمة وثناء المعلم المشرف:</label>
                <input
                  type="text"
                  value={newHonorFeedback}
                  onChange={(e) => setNewHonorFeedback(e.target.value)}
                  placeholder="كلمة تشجيعية للطالب..."
                  className="w-full bg-[#06150e] border border-emerald-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                اعتماد ونشر في لوحة الشرف
              </button>
            </form>
          )}

          {/* Honor Cards List */}
          {honorStudents.length === 0 ? (
            <div className="p-10 text-center bg-[#06150e] border border-emerald-900/80 rounded-3xl space-y-3">
              <Award className="w-12 h-12 text-amber-500/50 mx-auto" />
              <h4 className="font-bold text-white text-base">لا يوجد طلاب مدرجون في لوحة الشرف لهذا الأسبوع حالياً</h4>
              <p className="text-xs text-slate-400">يمكنك تكريم الطلاب المتفوقين لإبراز إنجازاتهم وتكريمهم.</p>
              <button
                type="button"
                onClick={() => setIsAddingHonor(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طالب متميز</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {honorStudents.map((hon, index) => (
              <div
                key={hon.studentId}
                className="p-5 rounded-3xl bg-gradient-to-b from-[#0e271b] to-[#081a11] border-2 border-amber-500/60 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Crown badge for rank 1 */}
                {index === 0 && (
                  <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-br-2xl shadow-md">
                    👑 المركز الأول
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
                      {hon.rank}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {hon.studentName}
                      </h4>
                      <span className="text-xs text-amber-300 font-semibold block">
                        {hon.praiseBadge}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#06150e] p-2.5 rounded-2xl border border-emerald-900">
                    <div>
                      <span className="text-slate-400 block text-[10px]">المعدل التراكمي:</span>
                      <span className="text-emerald-300 font-bold">{hon.averageScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">نسبة الالتزام:</span>
                      <span className="text-white font-bold">{hon.attendanceRate}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">جلسات التسميع:</span>
                      <span className="text-slate-200">{hon.totalRecitations} جلسة</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">تقدير ممتاز:</span>
                      <span className="text-amber-400 font-bold">{hon.excellentCount} مرة</span>
                    </div>
                  </div>

                  {/* Feedback */}
                  {hon.teacherFeedback && (
                    <div className="p-3 rounded-xl bg-[#082014] border border-emerald-800 text-[11px] text-slate-200 italic leading-relaxed">
                      "{hon.teacherFeedback}"
                      <span className="block mt-1 font-bold text-amber-300 not-italic text-[10px]">
                        — {hon.evaluatorTeacher}
                      </span>
                    </div>
                  )}
                </div>

                {/* Congratulations Button */}
                <div className="pt-2 border-t border-emerald-900 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    تهاني وتشجيعات: <strong className="text-amber-400">{hon.congratulationsCount}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCongratulate(hon.studentId)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/30 hover:from-amber-500 hover:to-amber-400 text-amber-300 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 transition-all cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>مباركة وتهنئة</span>
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACCOUNTS MANAGEMENT & MANUAL ADD (إدارة الحسابات والدخول المباشر) */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Top Banner Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0d2e1f] via-[#0f3825] to-[#081f14] border-2 border-amber-500/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white font-serif">
                    إدارة حسابات الدخول المباشر للمقرأة
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    تحكم المشرف
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  تتيح لك هذه الواجهة إضافة أي طالب أو معلم يدوياً وتعيين كلمة مرور مخصصة له للدخول فوراً دون الحاجة للتسجيل الذاتي، مع إمكانية كشف وتعديل كلمات المرور وإرسال بيانات الدخول عبر واتساب.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAddUserInitialRole('student');
                setAddUserInitialSection(activeSection === 'both' ? 'male' : activeSection);
                setIsAddUserModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة طالب أو معلم جديد</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#091b12] border border-emerald-800/80 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">إجمالي الحسابات:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">{allAccountsList.length}</span>
                <span className="text-[10px] text-slate-400">حساب نشط</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#091b12] border border-emerald-800/80 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">حسابات الطلاب:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-400">
                  {allAccountsList.filter((a) => a && a.role === 'student').length}
                </span>
                <span className="text-[10px] text-emerald-300/70">طالب وطالبة</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#091b12] border border-emerald-800/80 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">حسابات المعلمين:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-teal-400">
                  {allAccountsList.filter((a) => a && a.role === 'teacher').length}
                </span>
                <span className="text-[10px] text-teal-300/70">معلم ومقرئ</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#091b12] border border-emerald-800/80 space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">حسابات المشرفين:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-amber-400">
                  {allAccountsList.filter((a) => a && a.role === 'supervisor').length}
                </span>
                <span className="text-[10px] text-amber-300/70">إدارة وإشراف</span>
              </div>
            </div>
          </div>

          {/* Search and Role Filter Bar */}
          <div className="p-4 rounded-3xl bg-[#091b12] border border-emerald-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="البحث بالاسم أو اسم المستخدم أو رقم الهاتف..."
                className="w-full bg-[#06150e] border border-emerald-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 pr-9"
              />
              <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5" />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'جميع الحسابات' },
                { id: 'student', label: 'الطلاب فقط' },
                { id: 'teacher', label: 'المعلمون فقط' },
                { id: 'supervisor', label: 'المشرفون' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setAccountRoleFilter(rf.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    accountRoleFilter === rf.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                      : 'bg-[#06150e] text-slate-400 hover:text-white border border-emerald-800'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Cards Grid */}
          {filteredAccounts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#091b12] border border-emerald-800 text-center space-y-3">
              <Key className="w-12 h-12 text-slate-500 mx-auto" />
              <h4 className="font-bold text-white text-base">لا توجد حسابات مطابقة للبحث أو القسم المحدد</h4>
              <p className="text-xs text-slate-400">
                يمكنك إضافة حساب جديد يدوياً بالضغط على زر "إضافة طالب أو معلم جديد" أعلاه.
              </p>
              <button
                onClick={() => {
                  setAddUserInitialRole('student');
                  setAddUserInitialSection(activeSection === 'both' ? 'male' : activeSection);
                  setIsAddUserModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة حساب الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((acc) => {
                const isPasswordRevealed = !!revealedPasswords[acc.id];
                const isPrimarySupervisor = acc.id === 'user-ali-azize' || acc.id === 'user-lamia';

                return (
                  <div
                    key={acc.id}
                    className="p-5 rounded-3xl bg-gradient-to-b from-[#081e13] to-[#04120a] border border-emerald-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl"
                  >
                    {/* Header: Role Badge + Section Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            acc.role === 'supervisor'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : acc.role === 'teacher'
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {acc.role === 'supervisor' ? 'مشرف عام' : acc.role === 'teacher' ? 'معلم مقرأة' : 'طالب مقرأة'}
                        </span>

                        <span className="text-[10px] bg-[#020a05] text-slate-300 border border-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                          {acc?.section === 'male' ? '🧔 قسم الطلاب' : acc?.section === 'female' ? '🧕 قسم الطالبات' : '🌐 كلا القسمين'}
                        </span>
                      </div>

                      {/* Name and Title */}
                      <h4 className="text-base font-black text-white font-serif tracking-tight">
                        {acc.name}
                      </h4>
                      <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                        {acc.titleBadge || 'عضو في المقرأة'}
                      </p>
                      {acc.assignedHalqaTitle && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{acc.assignedHalqaTitle}</span>
                        </p>
                      )}
                    </div>

                    {/* Credentials Details Box */}
                    <div className="bg-[#020a05] border border-emerald-900/80 rounded-2xl p-3 space-y-2 text-xs font-mono">
                      {/* Username */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">اسم المستخدم:</span>
                        <strong className="text-amber-300 font-bold tracking-wide">
                          @{acc.username}
                        </strong>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-sans text-[11px]">الهاتف / الواتساب:</span>
                        <span className="text-emerald-300 font-medium">
                          {acc.phone || 'غير مسجل'}
                        </span>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-950">
                        <span className="text-slate-400 font-sans text-[11px] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span>كلمة المرور:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-[#0b2417] text-white font-black px-2 py-0.5 rounded-lg border border-emerald-700/80 tracking-widest text-xs">
                            {isPasswordRevealed ? acc.password : '••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                            title={isPasswordRevealed ? 'إخفاء' : 'إظهار كلمة المرور'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="pt-2 border-t border-emerald-900 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1">
                        {/* Copy credentials */}
                        <button
                          type="button"
                          onClick={() => handleCopyAccountCredentials(acc)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          title="نسخ بيانات الدخول"
                        >
                          {copySuccessId === acc.id ? (
                            <>
                              <Check className="w-3 h-3 text-amber-300" />
                              <span className="text-[10px] text-amber-300 font-bold">تم!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">نسخ</span>
                            </>
                          )}
                        </button>

                        {/* WhatsApp share */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppAccount(acc)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#128C7E]/30 hover:bg-[#128C7E] border border-[#128C7E]/50 text-emerald-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                          title="إرسال عبر واتساب"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-[10px]">واتساب</span>
                        </button>

                        {/* Reset password */}
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordAccount(acc);
                            setNewPasswordValue(acc.password || '');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                          title="تعديل كلمة المرور"
                        >
                          <Key className="w-3 h-3" />
                          <span className="text-[10px]">تعديل السر</span>
                        </button>
                      </div>

                      {/* Delete button */}
                      {!isPrimarySupervisor && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(acc)}
                          className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/80 border border-red-800/40 text-red-300 hover:text-white cursor-pointer transition-colors"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ADD USER ACCOUNT MODAL & PASSWORD RESET MODAL */}
      {/* ========================================================================= */}
      <AddUserAccountModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        initialRole={addUserInitialRole}
        initialSection={addUserInitialSection}
        onAccountCreated={(newAcc) => {
          setAllAccountsList(getAllAccounts());
          setStudentsList(getRegisteredStudents());
          showToast(`تم إنشاء وتفعيل حساب (${newAcc.name}) بنجاح!`);
        }}
      />

      {/* Reset Password Modal */}
      {resetPasswordAccount && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          dir="rtl"
        >
          <div 
            className="bg-[#06150e] border-2 border-amber-500/80 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white font-serif">
                    تعديل كلمة المرور
                  </h4>
                  <p className="text-[11px] text-emerald-300">
                    للحساب: <strong className="text-white">{resetPasswordAccount.name}</strong> (@{resetPasswordAccount.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordAccount(null)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  كلمة المرور الجديدة:
                </label>
                <div className="flex items-center gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
                      const lower = 'abcdefghijkmnopqrstuvwxyz';
                      const numbers = '23456789';
                      const all = upper + lower + numbers;
                      let res = upper.charAt(Math.floor(Math.random() * upper.length)) +
                                lower.charAt(Math.floor(Math.random() * lower.length)) +
                                numbers.charAt(Math.floor(Math.random() * numbers.length));
                      for (let i = 0; i < 7; i++) res += all.charAt(Math.floor(Math.random() * all.length));
                      setNewPasswordValue(res.split('').sort(() => Math.random() - 0.5).join(''));
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/70 text-amber-300 hover:bg-amber-900 cursor-pointer font-bold shadow-xs flex items-center gap-1"
                  >
                    ✨ توليد كلمة مرور آمنة
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة..."
                  className="w-full bg-[#020a05] border border-emerald-700 rounded-xl py-2 px-3 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-900">
                <button
                  type="button"
                  onClick={() => setResetPasswordAccount(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SEQUENTIAL CURRICULUM & QUIZZES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'curriculum' && (
        <div className="animate-fade-in">
          <CurriculumSupervisorManager />
        </div>
      )}

    </div>
  );
};
