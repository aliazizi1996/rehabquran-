/**
 * بوابة الطالب المتكاملة - مقرأة رحاب القرآن الإلكترونية
 * تشمل الصفحات الـ 12 المحددة للطالب:
 * 1. لوحة التحكم (Dashboard)
 * 2. خطة الحفظ (Memorization Plan)
 * 3. خطة المراجعة (Revision Plan)
 * 4. دروسي القادمة (Upcoming Lessons)
 * 5. الحضور والغياب (Attendance)
 * 6. الواجبات (Assignments)
 * 7. سجل التسميع (Recitation Log)
 * 8. التقارير والتقييمات (Reports & Evaluations)
 * 9. الشهادات (Certificates)
 * 10. الرسائل (Messages)
 * 11. الإشعارات (Notifications)
 * 12. الملف الشخصي (Profile)
 */

import React, { useState, useEffect } from 'react';
import { useDataSaver } from '../../utils/dataSaverStore';
import { MonthlyContributionView } from '../../components/student/MonthlyContributionView';
import { MyHalqaCard } from '../../components/student/MyHalqaCard';
import { StudentTeacherChatView } from '../../components/student/StudentTeacherChatView';
import { StudentTajweedProgressCard } from '../../components/student/StudentTajweedProgressCard';
import { StudentPointsMedalsCard } from '../../components/student/StudentPointsMedalsCard';
import { StudentResourcesLibrary } from '../../components/student/StudentResourcesLibrary';
import { 
  getStudentHalqaDetails, 
  StudentHalqaAssignment,
  subscribeToHalqaAnnouncements,
  HalqaAnnouncement
} from '../../services/chatService';
import { FavoriteSheikhNotificationCenter } from '../../components/FavoriteSheikhNotificationCenter';
import { FavoriteSheikhDashboardWidget } from '../../components/FavoriteSheikhDashboardWidget';
import { StudentPendingReviewView } from '../../components/StudentPendingReviewView';
import { ScientificMutunCard } from '../../components/student/ScientificMutunCard';
import { StudentMutunStudyModal } from '../../components/student/StudentMutunStudyModal';
const WeeklyHonorBoard = React.lazy(() => import('../../components/WeeklyHonorBoard').then(m => ({ default: m.WeeklyHonorBoard })));

const MonthlyProgressChart = React.lazy(() => import('../../components/MonthlyProgressChart').then(m => ({ default: m.MonthlyProgressChart })));

const QuranInteractiveCalendar = React.lazy(() => import('../../components/QuranInteractiveCalendar').then(m => ({ default: m.QuranInteractiveCalendar })));

const TajweedGuideView = React.lazy(() => import('../../components/TajweedGuideView').then(m => ({ default: m.TajweedGuideView })));

import { PageSkeleton } from '../../components/common/PortalUiKit';
import { 
  BookOpen, Calendar, Clock, CheckCircle2, Award, 
  FileText, MessageSquare, Bell, User, Star, Search, 
  Plus, RefreshCw, AlertCircle, Headphones, ArrowRight, 
  ChevronLeft, Send, Check, Eye, Download, LogOut, Shield, Sparkles, Video,
  Trophy, HeartHandshake, ChevronDown, ChevronUp, ExternalLink, X, TrendingUp,
  Mic, Volume2, ClipboardList, CheckSquare, ArrowLeft, Bookmark, Layers, Brain
} from 'lucide-react';
import { getActiveCurriculum, getAllLevelsStatus, getLessonProgressMap } from '../../data/learningStore';
import { AuthAccount } from '../../types';
import { OfficialLogo } from '../../components/OfficialLogo';
import { 
  SearchFilterBar, 
  PaginationControls, 
  LoadingState, 
  ErrorState, 
  EmptyState, 
  FeedbackBanner 
} from '../../components/common/PortalUiKit';
import { 
  fetchCollectionItems, 
  saveDocumentItem, 
  MemorizationPlanItem, 
  UpcomingLessonItem, 
  AttendanceRecord, 
  AssignmentItem, 
  RecitationLogItem, 
  ReportEvaluationItem, 
  CertificateItem, 
  MessageItem, 
  NotificationItem 
} from '../../services/firestoreService';

import { StudentHalqaView } from '../../components/student/StudentHalqaView';
import { StudentRecitationRecorder } from '../../components/student/StudentRecitationRecorder';
import { StudentCertificateModal } from '../../components/student/StudentCertificateModal';
import { StudentProfileEditor } from '../../components/student/StudentProfileEditor';
import { StudentHonorBoardView } from '../../components/student/StudentHonorBoardView';
import { calculateNextHalqaTime, HalqaNextTimeInfo } from '../../utils/halqaCountdown';
import { StudentRemindersAlerts } from '../../components/student/StudentRemindersAlerts';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { SmartMemorizationTool } from '../../components/student/SmartMemorizationTool';
import { DigitalQuranLibrary } from '../../components/student/DigitalQuranLibrary';

export type StudentTab = 
  | 'dashboard'
  | 'halqa'
  | 'mushaf'
  | 'recitation_log'
  | 'assignments'
  | 'honor_board'
  | 'certificates'
  | 'profile'
  | 'resources'
  | 'smart_memorization'
  | 'tajweed'
  | 'memorization_plan'
  | 'revision_plan'
  | 'upcoming_lessons'
  | 'attendance'
  | 'reports'
  | 'messages'
  | 'notifications'
  | 'support';

interface StudentPortalProps {
  currentAccount: AuthAccount;
  initialTab?: StudentTab;
  onLogout: () => void;
  onOpenQuranAudio?: () => void;
  onBackToDashboard?: () => void;
  onOpenAcademicPortal?: () => void;
  onTabChange?: (tab: StudentTab) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentAccount,
  initialTab = 'dashboard',
  onLogout,
  onOpenQuranAudio,
  onBackToDashboard,
  onOpenAcademicPortal,
  onTabChange,
}) => {
  if (currentAccount.status === 'pending') {
    return (
      <StudentPendingReviewView
        studentName={currentAccount.name}
        studentPhone={currentAccount.phone}
        studentEmail={currentAccount.email}
        onLogout={onLogout}
        onBackToHome={onBackToDashboard}
      />
    );
  }

  const { isDataSaver } = useDataSaver();
  const [activeTab, setActiveTab] = useState<StudentTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State for Brand Settings & showGlobalAssemblyMembership (controlled by Supervisor)
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const showGlobalAssembly = brandSettings.showGlobalAssemblyMembership;

  useEffect(() => {
    const handleBrandUpdated = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdated);
    syncBrandSettingsFromServer().then(s => {
      if (s) setBrandSettings(s);
    }).catch(() => {});
    return () => window.removeEventListener('brand_logo_updated', handleBrandUpdated);
  }, []);

  // Data states from Firestore
  const [memorizationPlans, setMemorizationPlans] = useState<MemorizationPlanItem[]>([]);
  const [revisionPlans, setRevisionPlans] = useState<MemorizationPlanItem[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLessonItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [recitationLogs, setRecitationLogs] = useState<RecitationLogItem[]>([]);
  const [reports, setReports] = useState<ReportEvaluationItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [halqaAssignment, setHalqaAssignment] = useState<StudentHalqaAssignment | null>(null);

  // Tajweed selected lesson for deep-linking
  const [selectedTajweedChapterId, setSelectedTajweedChapterId] = useState<string | undefined>(undefined);
  const [selectedTajweedLessonId, setSelectedTajweedLessonId] = useState<string | undefined>(undefined);

  // New message state
  const [newMessageRecipient, setNewMessageRecipient] = useState('المشرف العام');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageBody, setNewMessageBody] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // New assignment submission modal state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Modals and expanded sections for concise dashboard cards
  const [isHalqaDetailsModalOpen, setIsHalqaDetailsModalOpen] = useState(false);
  const [isHonorBoardModalOpen, setIsHonorBoardModalOpen] = useState(false);
  const [isHonorRibbonExpanded, setIsHonorRibbonExpanded] = useState(false);
  const [isLiveMeetModalOpen, setIsLiveMeetModalOpen] = useState(false);
  const [isContributionExpanded, setIsContributionExpanded] = useState(false);
  const [isMutunStudyModalOpen, setIsMutunStudyModalOpen] = useState(false);
  const [selectedMutunId, setSelectedMutunId] = useState<string | undefined>(undefined);
  const [activeDetailModal, setActiveDetailModal] = useState<'halqa' | 'tajweed' | 'revision' | 'assignments' | 'teacher_notes' | 'notifications' | 'profile' | 'honor' | null>(null);
  const [isRevisionCompletedToday, setIsRevisionCompletedToday] = useState(false);

  const getTabLabel = (tab: StudentTab): string => {
    switch (tab) {
      case 'halqa': return 'صفحة «حلقتي والشيخ»';
      case 'mushaf': return 'صفحة «المصاحف والمكتبة القرآنية الرقمية»';
      case 'recitation_log': return 'صفحة «التسميع المباشر والصوتي»';
      case 'assignments': return 'صفحة «الواجبات والتكاليف»';
      case 'honor_board': return 'صفحة «لوحة الشرف الأسبوعية»';
      case 'certificates': return 'صفحة «شهاداتي المعتمدة»';
      case 'profile': return 'صفحة «الملف الشخصي والحساب»';
      case 'tajweed': return 'صفحة «دروس التجويد والمستويات»';
      case 'resources': return 'صفحة «مكتبة المصادر والتسجيلات»';
      case 'smart_memorization': return 'أداة «التحفيظ الذكي» بالذكاء الاصطناعي (Gemini)';
      case 'memorization_plan': return 'صفحة «خطة الحفظ الجديد»';
      case 'revision_plan': return 'صفحة «خطة المراجعة والتثبيت»';
      case 'upcoming_lessons': return 'صفحة «الدروس والجلسات القادمة»';
      case 'attendance': return 'صفحة «سجل الحضور والغياب»';
      case 'reports': return 'صفحة «التقارير والتقييم الأكاديمي»';
      case 'messages': return 'صفحة «الرسائل مع الشيخ»';
      case 'notifications': return 'صفحة «مركز التنبيهات والإشعارات»';
      case 'support': return 'صفحة «المساهمة لدعم المقرأة»';
      default: return 'لوحة الطالب';
    }
  };

  // Tajweed progress stats for dashboard card (shows percentage only)
  const [tajweedProgress, setTajweedProgress] = useState<{
    percentage: number;
    currentLevelTitle: string;
    completedCount: number;
    totalCount: number;
  }>({
    percentage: 75,
    currentLevelTitle: 'المستوى 3: أحكام النون الساكنة والتنوين',
    completedCount: 6,
    totalCount: 8
  });

  useEffect(() => {
    try {
      const chapters = getActiveCurriculum();
      const progressMap = getLessonProgressMap();
      const levels = getAllLevelsStatus();
      const total = chapters.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
      const completed = Object.values(progressMap).filter(p => p.passed).length;
      const activeLevel = levels.find(l => l.status === 'open') || levels.filter(l => l.status === 'completed').pop() || levels[0];
      const pct = total > 0 ? Math.round((completed / total) * 100) : 75;
      setTajweedProgress({
        percentage: pct || 75,
        currentLevelTitle: activeLevel?.title || 'المستوى 3: أحكام النون الساكنة والتنوين',
        completedCount: completed || 6,
        totalCount: total || 8
      });
    } catch (e) {
      console.error('Error calculating tajweed progress stats:', e);
    }
  }, [activeTab]);

  // تحميل بيانات الطالب مرة واحدة عند فتح البوابة بدلاً من إعادة جلب 10 مجموعات عند كل تبويب
  useEffect(() => {
    loadStudentData();
  }, [currentAccount.id]);

  // إعادة ضبط الترقيم والبحث فقط عند تبديل التبويبات دون استهلاك قراءات Firestore
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeTab]);

  const loadStudentData = async (forceRefresh = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentPage(1);

    try {
      // 0. Fetch assigned Halqa & Sheikh details (including supervisor WhatsApp group link)
      try {
        const assignmentRes = await getStudentHalqaDetails(currentAccount);
        setHalqaAssignment(assignmentRes);
      } catch (err) {
        console.warn('Error loading student halqa assignment:', err);
      }
      // 1. Memorization & Revision Plans
      const plansRes = await fetchCollectionItems<MemorizationPlanItem>('plans', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }]
      });

      if (plansRes.data) {
        setMemorizationPlans(plansRes.data.filter(p => p.type === 'memorization'));
        setRevisionPlans(plansRes.data.filter(p => p.type === 'revision'));
      } else {
        setMemorizationPlans([]);
        setRevisionPlans([]);
      }

      // 2. Upcoming Lessons (scoped to student's assigned halqa or student's own ID)
      const studentHalqaId = effectiveAssignment.halqaId || (currentAccount as any).assignedHalqaId;
      const lessonsRes = await fetchCollectionItems<UpcomingLessonItem>('lessons', {
        whereClause: studentHalqaId 
          ? [{ field: 'halqaId', op: '==', value: studentHalqaId }]
          : [{ field: 'studentId', op: '==', value: currentAccount.id }],
        limitCount: 10
      });
      if (lessonsRes.data) {
        setUpcomingLessons(lessonsRes.data);
      } else {
        setUpcomingLessons([]);
      }

      // 3. Attendance Records (scoped to student)
      const attRes = await fetchCollectionItems<AttendanceRecord>('attendance', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }]
      });
      if (attRes.data) {
        setAttendanceRecords(attRes.data);
      } else {
        setAttendanceRecords([]);
      }

      // 4. Assignments (scoped to student)
      const assignRes = await fetchCollectionItems<AssignmentItem>('assignments', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }],
        limitCount: 20
      });
      if (assignRes.data) {
        setAssignments(assignRes.data);
      } else {
        setAssignments([]);
      }

      // 5. Recitation Log (scoped to student)
      const recRes = await fetchCollectionItems<RecitationLogItem>('recitations', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }]
      });
      if (recRes.data) {
        setRecitationLogs(recRes.data);
      } else {
        setRecitationLogs([]);
      }

      // 6. Reports & Evaluations (scoped to student)
      const repRes = await fetchCollectionItems<ReportEvaluationItem>('evaluations', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }]
      });
      if (repRes.data) {
        setReports(repRes.data);
      } else {
        setReports([]);
      }

      // 7. Certificates (scoped to student)
      const certRes = await fetchCollectionItems<CertificateItem>('certificates', {
        whereClause: [{ field: 'studentId', op: '==', value: currentAccount.id }],
        limitCount: 10
      });
      if (certRes.data) {
        setCertificates(certRes.data);
      } else {
        setCertificates([]);
      }

      // 8. Messages
      const msgRes = await fetchCollectionItems<MessageItem>('messages', {
        whereClause: [{ field: 'recipientId', op: '==', value: currentAccount.id }]
      });
      if (msgRes.data) {
        setMessages(msgRes.data);
      } else {
        setMessages([]);
      }

      // 9. Notifications
      const notifRes = await fetchCollectionItems<NotificationItem>('notifications', {
        whereClause: [{ field: 'userId', op: '==', value: currentAccount.id }]
      });
      if (notifRes.data) {
        setNotifications(notifRes.data);
      } else {
        setNotifications([]);
      }
    } catch (e: any) {
      setErrorMsg('تعذر تحميل البيانات، حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit assignment action
  const handleAssignmentSubmit = async () => {
    if (!selectedAssignment || !submissionNotes.trim()) return;

    setIsSubmittingAssignment(true);
    try {
      await saveDocumentItem('assignments', selectedAssignment.id, {
        status: 'submitted',
        studentSubmissionNotes: submissionNotes.trim(),
        submittedAt: new Date().toISOString()
      });

      setAssignments(prev => prev.map(a => 
        a.id === selectedAssignment.id 
          ? { ...a, status: 'submitted', studentSubmissionNotes: submissionNotes.trim() } 
          : a
      ));

      setFeedback({ type: 'success', message: 'تم تسليم الواجب بنجاح وإرساله للمعلم للمراجعة.' });
      setSelectedAssignment(null);
      setSubmissionNotes('');
    } catch {
      setFeedback({ type: 'error', message: 'فشل إرسال الواجب، يرجى إعادة المحاولة.' });
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // Send message action
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageSubject.trim() || !newMessageBody.trim()) {
      setFeedback({ type: 'error', message: 'يرجى كتابة عنوان الرسالة ونصها كاملاً.' });
      return;
    }

    setIsSendingMessage(true);
    try {
      await saveDocumentItem('messages', null, {
        senderId: currentAccount.id,
        senderName: currentAccount.name,
        senderRole: 'student',
        recipientId: 'admin_root',
        recipientName: newMessageRecipient,
        subject: newMessageSubject.trim(),
        body: newMessageBody.trim(),
        sentAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        read: false
      });

      setFeedback({ type: 'success', message: 'تم إرسال الرسالة بنجاح إلى المعلم/الإدارة.' });
      setNewMessageSubject('');
      setNewMessageBody('');
    } catch {
      setFeedback({ type: 'error', message: 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً.' });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const [halqaAnnouncements, setHalqaAnnouncements] = useState<HalqaAnnouncement[]>([]);

  const isFemale = currentAccount.section === 'female' || currentAccount.gender === 'female';
  const effectiveAssignment: StudentHalqaAssignment = halqaAssignment || {
    studentId: currentAccount.id,
    studentName: currentAccount.name,
    teacherId: isFemale ? 'tch-2' : 'tch-1',
    teacherName: isFemale ? 'الشيخة أم أنس الزبيدي' : 'الشيخ إبراهيم الوصابي',
    halqaId: isFemale ? 'cls-f1' : 'cls-m1',
    halqaTitle: currentAccount.assignedHalqaTitle || (isFemale ? 'حلقة الزهراوان لتثبيت الحفظ (عصراً)' : 'حلقة الإتقان والتحفيظ (الفجر)'),
    halqaSchedule: isFemale ? 'الأحد والثلاثاء والخميس (4:00 م - 5:30 م)' : 'السبت والإثنين والأربعاء (5:30 ص - 7:00 ص)',
    whatsappGroupUrl: undefined,
  };

  useEffect(() => {
    if (!effectiveAssignment.halqaId) return;
    const unsub = subscribeToHalqaAnnouncements(effectiveAssignment.halqaId, (announcements) => {
      setHalqaAnnouncements(announcements);
    });
    return () => unsub();
  }, [effectiveAssignment.halqaId]);

  const [selectedCertForPdf, setSelectedCertForPdf] = useState<CertificateItem | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [countdown, setCountdown] = useState<HalqaNextTimeInfo>(() => calculateNextHalqaTime(effectiveAssignment.halqaSchedule));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateNextHalqaTime(effectiveAssignment.halqaSchedule));
    }, 1000);
    return () => clearInterval(timer);
  }, [effectiveAssignment.halqaSchedule]);

  const handleTabSwitch = (tab: StudentTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const attendanceRate = attendanceRecords.length > 0
    ? Math.round((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100)
    : 0;
  const presentDaysCount = attendanceRecords.filter(a => a.status === 'present').length;
  const averageGrade = recitationLogs.length > 0
    ? Math.round(recitationLogs.reduce((acc, r) => acc + (r.gradeScore || 0), 0) / recitationLogs.length)
    : 0;

  return (
    <div className="w-full text-[#2C3531] font-sans text-right" dir="rtl">

      {/* 2. شريط التنبيهات والرسائل */}
      <div className="w-full pt-1 pb-2">
        <FeedbackBanner 
          type={feedback?.type || 'info'} 
          message={feedback?.message || null} 
          onClose={() => setFeedback(null)} 
        />
        {errorMsg && <ErrorState message={errorMsg} onRetry={loadStudentData} />}
      </div>

      {/* 3. جسم المحتوى لصفحات الطالب الـ 12 */}
      <main className="flex-1 w-full space-y-6">
        {isLoading ? (
          <LoadingState message="جاري مزامنة بيانات حسابك القرآني من خوادم المقرأة..." />
        ) : (
          <>
            {/* ======================================================== */}
            {/* 1. الصفحة الرئيسية (الرئيسية / DASHBOARD)                   */}
            {/* ======================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-3.5 animate-fade-in">
                {/* 1.1 شريط الترحيب واللقاء المباشر المدمج (Slim Command Bar) - الهوية الملكية 2026 */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#003528] via-[#046A38] to-[#02281b] p-3 sm:p-4 text-white border border-[#C5A059] shadow-md">
                  {/* خلفية صورة قرآنية خفيفة جداً مع معالجة بصرية */}
                  {!isDataSaver && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
                      <img 
                        src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80" 
                        alt="القرآن الكريم" 
                        loading="lazy" 
                        decoding="async" 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* بيانات الترحيب والتعريف */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-[#C5A059]/40 flex items-center justify-center shrink-0">
                        <img 
                          src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                          crossOrigin="anonymous"
                          alt="الختم" 
                          className="w-7 h-7 object-contain brightness-0 invert opacity-90"
                          onError={(e) => { 
                            if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                              e.currentTarget.src = '/brand/official-seal.png';
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base sm:text-lg font-bold font-serif text-white">
                            أهلاً بك يا <span className="text-[#C5A059]">{currentAccount.name}</span> تقبل الله طاعاتكم ✨
                          </h2>
                          <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full border border-[#C5A059]/40 text-amber-200 font-sans">
                            ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-100/90 font-sans flex items-center gap-1.5 flex-wrap">
                          {showGlobalAssembly && (
                            <>
                              <span>عضو التجمع العالمي</span>
                              <span className="text-[#C5A059]">•</span>
                            </>
                          )}
                          <span>الحفظ: <strong>{(currentAccount as any).memorization || '5 أجزاء'}</strong></span>
                          <span className="text-[#C5A059]">•</span>
                          <span>الرواية: <strong>{(currentAccount as any).riwayah || 'حفص عن عاصم بالسند'}</strong></span>
                          {((currentAccount as any).academicId || currentAccount.username) && (
                            <>
                              <span className="text-[#C5A059]">•</span>
                              <span className="font-mono text-amber-200" dir="ltr">ID: {(currentAccount as any).academicId || currentAccount.username}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* عداد الجلسة وزر الدخول المباشر */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between lg:justify-end border-t lg:border-t-0 border-white/10 pt-2 lg:pt-0">
                      <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-xl border border-white/15 text-xs font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span className="text-[11px] text-emerald-100 font-sans hidden sm:inline">الجلسة:</span>
                        <strong className="text-amber-200 text-xs font-bold font-mono">
                          {countdown.days > 0 ? `${countdown.days}ي ` : ''}
                          {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}
                        </strong>
                      </div>

                      {countdown.isWithin10Minutes ? (
                        <a
                          href={effectiveAssignment.googleMeetUrl || 'https://meet.google.com/new'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 animate-pulse"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Google Meet الآن ↗</span>
                        </a>
                      ) : effectiveAssignment.googleMeetUrl ? (
                        <a
                          href={effectiveAssignment.googleMeetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 border border-amber-200"
                        >
                          <Video className="w-3.5 h-3.5 text-slate-950" />
                          <span>رابط Google Meet ↗</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTabSwitch('halqa')}
                          className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20 flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>قسم «حلقتي»</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTabSwitch('mushaf')}
                        className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#d8b46e] text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        title="فتح مكتبة المصاحف الرقمية وتصفح صفحات المصحف الشريف عالية الدقة"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                        <span>المصاحف</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTabSwitch('recitation_log')}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20 flex items-center gap-1"
                      >
                        <Mic className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>التسميع المباشر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTabSwitch('notifications')}
                        className="px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-amber-300/40 flex items-center gap-1"
                        title="تنبيهات الحلقات والمهام المعلقة"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden sm:inline">التنبيهات</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1.2 شريط الإحصاءات السريعة (4 مؤشرات مدمجة بأبعاد متوازنة) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* 1. نسبة الحضور */}
                  <div 
                    onClick={() => setActiveDetailModal('profile')}
                    className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200/90 hover:border-[#046A38] transition-all flex items-center gap-2.5 shadow-2xs cursor-pointer group"
                    title="انقر لعرض تفاصيل الحضور"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#046A38] flex items-center justify-center shrink-0 group-hover:bg-[#046A38] group-hover:text-white transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="text-[10px] text-slate-500 block leading-tight">نسبة الحضور</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-sm font-black font-mono text-[#046A38]">
                          {attendanceRecords.length > 0 ? `${attendanceRate}%` : '-'}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-bold truncate">
                          {attendanceRecords.length > 0 ? `(${presentDaysCount} أيام)` : '(لا توجد سجلات)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. التسميعات */}
                  <div 
                    onClick={() => handleTabSwitch('recitation_log')}
                    className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200/90 hover:border-[#C5A059] transition-all flex items-center gap-2.5 shadow-2xs cursor-pointer group"
                    title="انقر لفتح سجل التسميع"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center shrink-0 group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="text-[10px] text-slate-500 block leading-tight">سجل التسميع</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-sm font-black font-mono text-slate-900">{recitationLogs.length}</strong>
                        <span className="text-[10px] text-slate-400 font-bold truncate">تلاوة مسجلة</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. التقييم */}
                  <div 
                    onClick={() => setActiveDetailModal('teacher_notes')}
                    className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200/90 hover:border-[#046A38] transition-all flex items-center gap-2.5 shadow-2xs cursor-pointer group"
                    title="انقر لقراءة تقييم وتوجيهات الشيخ"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#046A38] flex items-center justify-center shrink-0 group-hover:bg-[#046A38] group-hover:text-white transition-colors">
                      <Star className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="text-[10px] text-slate-500 block leading-tight">التقييم العام</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-sm font-black font-mono text-[#046A38]">
                          {averageGrade > 0 ? `${averageGrade}/100` : '-'}
                        </strong>
                        <span className="text-[10px] text-[#C5A059] font-bold truncate">
                          {averageGrade >= 90 ? 'ممتاز ⭐' : averageGrade >= 80 ? 'جيد جداً' : averageGrade > 0 ? 'نشط' : 'قيد التقييم'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. لوحة الشرف */}
                  <div 
                    onClick={() => setActiveDetailModal('honor')}
                    className="p-2.5 sm:p-3 bg-white rounded-xl border border-[#C5A059]/60 hover:border-[#C5A059] transition-all flex items-center gap-2.5 shadow-2xs cursor-pointer group"
                    title="انقر لعرض ترتيبك في لوحة الشرف"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center shrink-0 group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="text-[10px] text-slate-500 block leading-tight">لوحة الشرف</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <strong className="text-xs font-bold font-serif text-[#C5A059] truncate">المركز الثاني 🥈</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.25 نظام التنبيهات والتذكيرات الذكية لبوابة الطالب (Upcoming Halqa & Pending Tasks) */}
                <StudentRemindersAlerts
                  currentAccount={currentAccount}
                  effectiveAssignment={effectiveAssignment}
                  countdown={countdown}
                  assignments={assignments}
                  upcomingLessons={upcomingLessons}
                  onNavigateTab={handleTabSwitch}
                  onOpenRecitationRecorder={() => setIsRecorderOpen(true)}
                  onOpenMeet={(url) => {
                    if (url) window.open(url, '_blank');
                    else setIsLiveMeetModalOpen(true);
                  }}
                />

                {/* 1.3 الشبكة المتوازنة الرئيسية ببطاقات متناسقة وصغيرة (Bento Grid: 4 أعمدة على الحاسوب، 2-3 على التابلت، 1-2 على الجوال) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
                  {/* البطاقة 1: «حلقتي والشيخ» */}
                  <div 
                    onClick={() => setActiveDetailModal('halqa')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#046A38] hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      {/* رأس البطاقة: صورة مصغرة وعنوان وشارة */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-50 border border-[#C5A059]/40 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=200&q=80"
                                alt="المصحف"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#046A38]"><BookOpen className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-[#046A38] transition-colors leading-tight">
                              «حلقتي والشيخ»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{effectiveAssignment.halqaTitle}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-50 text-[#046A38] px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          مباشر
                        </span>
                      </div>

                      {/* صندوق البيانات المقتضب */}
                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الشيخ المعلم:</span>
                          <strong className="text-slate-800 font-serif truncate max-w-[120px]">{effectiveAssignment.teacherName}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الموعد:</span>
                          <span className="font-bold text-[#046A38] truncate max-w-[130px]">{countdown.formattedTarget || effectiveAssignment.halqaSchedule}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">المقرر:</span>
                          <span className="font-bold text-[#C5A059] truncate max-w-[120px]">
                            {memorizationPlans[0]?.surahName || 'سورة البقرة'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* أزرار الإجراءات السريعة */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      {effectiveAssignment.googleMeetUrl ? (
                        <a
                          href={effectiveAssignment.googleMeetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" />
                          <span>Meet ↗</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleTabSwitch('halqa'); }}
                          className="px-2 py-1 bg-[#046A38] hover:bg-[#03542c] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          دخول الحلقة
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('halqa'); }}
                        className="text-[#046A38] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        التفاصيل
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('halqa'); }}
                        className="text-slate-500 hover:text-[#046A38] text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>القسم</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 2: «دروس التجويد» */}
                  <div 
                    onClick={() => setActiveDetailModal('tajweed')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#C5A059] hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-amber-50 border border-[#C5A059]/40 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=200&q=80"
                                alt="التجويد"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#C5A059]"><Sparkles className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-[#C5A059] transition-colors leading-tight">
                              «دروس التجويد»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">المنهج والإتقان</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          {tajweedProgress.percentage}% إنجاز
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">المستوى:</span>
                          <span className="font-bold text-[#046A38] truncate max-w-[130px]">{tajweedProgress.currentLevelTitle}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-[#046A38] to-[#C5A059] h-full rounded-full" 
                            style={{ width: `${tajweedProgress.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          <span className="text-slate-400">تقييم الشيخ:</span>
                          <strong className="text-emerald-700 font-bold font-serif">{reports[0]?.tajweedScore || 96}% (ممتاز)</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('tajweed'); }}
                        className="px-2.5 py-1 bg-[#046A38] hover:bg-[#03542c] text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-[#C5A059]"
                      >
                        متابعة الدروس
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('tajweed'); }}
                        className="text-[#C5A059] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        عرض المنهج
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 2.5: «متوني العلمية» */}
                  <ScientificMutunCard
                    studentId={currentAccount.id}
                    studentName={currentAccount.name}
                    halqaId={halqaAssignment?.halqaId}
                    teacherId={halqaAssignment?.teacherId}
                    onOpenStudyHub={(matnId) => {
                      setSelectedMutunId(matnId);
                      setIsMutunStudyModalOpen(true);
                    }}
                  />

                  {/* البطاقة 3: «الورد والمراجعة» */}
                  <div 
                    onClick={() => setActiveDetailModal('revision')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-50 border border-[#C5A059]/40 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=200&q=80"
                                alt="المراجعة"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#046A38]"><Bookmark className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-[#046A38] transition-colors leading-tight">
                              «الورد والمراجعة»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">التثبيت اليومي</span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isRevisionCompletedToday || revisionPlans[0]?.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isRevisionCompletedToday || revisionPlans[0]?.status === 'completed' ? 'منجز ✅' : 'متبقي ⏳'}
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">ورد اليوم:</span>
                          <strong className="text-slate-800 font-serif truncate max-w-[130px]">
                            {revisionPlans[0]?.surahName ? `${revisionPlans[0].surahName} (${revisionPlans[0].fromAyah}-${revisionPlans[0].toAyah})` : 'سورة النبأ إلى الناس'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الحالة:</span>
                          <span className="font-bold text-[#046A38] truncate max-w-[130px]">
                            {isRevisionCompletedToday || revisionPlans[0]?.status === 'completed' ? 'تم التثبيت بنجاح' : 'مطلوب مراجعة اليوم'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRevisionCompletedToday(!isRevisionCompletedToday);
                          setFeedback({
                            type: 'success',
                            message: !isRevisionCompletedToday ? 'تم تسجيل إنجاز ورد المراجعة اليومي بنجاح.' : 'تم تعديل حالة الورد.'
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          isRevisionCompletedToday || revisionPlans[0]?.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-[#046A38] text-white hover:bg-[#03542c] border-[#C5A059]'
                        }`}
                      >
                        {isRevisionCompletedToday || revisionPlans[0]?.status === 'completed' ? 'منجز بنجاح ✅' : 'تحديد كـ منجز'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('revision'); }}
                        className="text-[#046A38] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        التفاصيل
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('revision_plan'); }}
                        className="text-slate-500 hover:text-[#046A38] text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>الجدول</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 4: «الواجبات والتكاليف» */}
                  <div 
                    onClick={() => setActiveDetailModal('assignments')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-purple-50 border border-purple-200 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=200&q=80"
                                alt="الواجبات"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-700"><ClipboardList className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-purple-700 transition-colors leading-tight">
                              «الواجبات والتكاليف»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">المهام المقررة</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-purple-50 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200 shrink-0">
                          {assignments.length} مهام
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الحالة:</span>
                          <span className="font-bold text-slate-800 truncate">
                            {assignments.filter(a => a.status === 'assigned').length} مطلوبة • {assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length} مسلّمة
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">أقرب واجب:</span>
                          <span className="font-bold text-purple-900 truncate max-w-[130px]">
                            {assignments[0]?.title || 'تسجيل تلاوة سورة الملك'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الموعد:</span>
                          <span className="font-mono text-rose-700 font-bold text-[10px] truncate max-w-[120px]">
                            {assignments[0]?.dueDate || 'اليوم 8:00 مساءً'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('assignments'); }}
                        className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      >
                        تسليم الواجب
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('assignments'); }}
                        className="text-purple-700 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        التفاصيل
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 5: «ملاحظات المعلم» */}
                  <div 
                    onClick={() => setActiveDetailModal('teacher_notes')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#046A38] hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-200 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=200&q=80"
                                alt="المعلم"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#046A38]"><Star className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-[#046A38] transition-colors leading-tight">
                              «ملاحظات المعلم»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">توجيهات الشيخ</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-50 text-[#046A38] px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          إرشاد
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الشيخ:</span>
                          <strong className="text-[#046A38] font-serif truncate max-w-[120px]">{effectiveAssignment.teacherName}</strong>
                        </div>
                        <p className="text-slate-700 text-[11px] italic leading-relaxed line-clamp-2">
                          "{reports[0]?.sheikhRecommendation || recitationLogs.find(r => r.tajweedNotes)?.tajweedNotes || 'قراءة خاشعة مع مراعاة أحكام المدود، بارك الله فيكم.'}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('teacher_notes'); }}
                        className="text-[#046A38] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        قراءة الملاحظة كاملة
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('recitation_log'); }}
                        className="text-slate-500 hover:text-[#046A38] text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>السجل</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 6: «التنبيهات» */}
                  <div 
                    onClick={() => setActiveDetailModal('notifications')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-amber-50 border border-amber-200 shrink-0">
                            {!isDataSaver ? (
                              <img
                                src="https://images.unsplash.com/photo-1597935258735-e254c183921e?auto=format&fit=crop&w=200&q=80"
                                alt="التنبيهات"
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-600"><Bell className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
                              «التنبيهات»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">الإدارة والمقرأة</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          {notifications.length || 2} إشعارات
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <span className="text-slate-400 text-[10px] block">آخر تنبيه:</span>
                        <p className="font-bold text-slate-800 line-clamp-1 text-[11px]">
                          {notifications[0]?.title || 'تنبيه: حلقة المراجعة الأسبوعية قائمة في موعدها'}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {notifications[0]?.createdAt ? new Date(notifications[0].createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('notifications'); }}
                        className="text-amber-700 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        عرض الإشعار
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('notifications'); }}
                        className="text-slate-500 hover:text-amber-700 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>المركز</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 7: «الملف الشخصي» */}
                  <div 
                    onClick={() => setActiveDetailModal('profile')}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-50 border border-blue-200 shrink-0 flex items-center justify-center">
                            <img 
                              src="/brand/official-seal.png" 
                              alt="الختم" 
                              className="w-6 h-6 object-contain" 
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                              «الملف الشخصي»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">السجل الأكاديمي</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                          أكاديمي
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الرقم:</span>
                          <strong className="text-[#046A38] font-mono font-bold text-[10px]" dir="ltr">
                            {(currentAccount as any).academicNumber || currentAccount.username || ('RQ-2026-' + (currentAccount.id?.slice(-4) || '6365'))}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الحفظ:</span>
                          <span className="font-bold text-slate-800">{(currentAccount as any).memorization || '5 أجزاء'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الرواية:</span>
                          <span className="font-bold text-[#046A38] truncate max-w-[110px]">{(currentAccount as any).riwayah || 'حفص بالسند'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveDetailModal('profile'); }}
                        className="text-blue-600 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        عرض البيانات
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('profile'); }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-0.5"
                      >
                        <span>تعديل</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* البطاقة 8: «لوحة الشرف والشهادات» */}
                  <div 
                    onClick={() => setActiveDetailModal('honor')}
                    className="p-3.5 rounded-2xl bg-white border border-[#C5A059] hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-2xs group cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-amber-50 border border-[#C5A059]/40 shrink-0 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-[#C5A059]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm font-serif text-slate-900 group-hover:text-[#C5A059] transition-colors leading-tight">
                              «الشرف والشهادات»
                            </h3>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">التتويج والشهادات</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          الترتيب
                        </span>
                      </div>

                      <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الترتيب:</span>
                          <strong className="text-[#C5A059] font-serif font-bold text-xs">المركز الثاني 🥈</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">الشهادات:</span>
                          <strong className="text-[#046A38] font-bold">{certificates.length} بالختم الرسمي</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('certificates'); }}
                        className="text-[#046A38] hover:underline font-bold text-[11px] cursor-pointer flex items-center gap-0.5"
                      >
                        <Award className="w-3 h-3 text-[#C5A059]" />
                        <span>شهاداتي</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTabSwitch('honor_board'); }}
                        className="px-2 py-1 bg-[#C5A059] hover:bg-[#b08d47] text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>لوحة الشرف</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1.4 شريط لوحة الشرف التفاعلي المدمج القابل للسحب (Horizontal Scrollable Ribbon) */}
                <div className="bg-white rounded-2xl border border-[#C5A059]/35 p-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#C5A059]" />
                      <span className="font-bold text-xs font-serif text-slate-900">لوحة الشرف الأسبوعية للفرسان 🌟</span>
                      <span className="text-[10px] text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">شريط أفقي</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setIsHonorRibbonExpanded(!isHonorRibbonExpanded)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#046A38] bg-[#F9F6F0] hover:bg-emerald-50 rounded-lg border border-[#C5A059]/30 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{isHonorRibbonExpanded ? 'إخفاء الشريط' : 'عرض الشريط الأفقي ↔'}</span>
                        {isHonorRibbonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsHonorBoardModalOpen(true)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#046A38] hover:bg-[#03542c] rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Trophy className="w-3 h-3 text-[#C5A059]" />
                        <span>فتح النافذة الكاملة</span>
                      </button>
                    </div>
                  </div>

                  {isHonorRibbonExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">
                      <React.Suspense fallback={<div className="text-center py-4 text-xs text-slate-400">جاري تحميل لوحة الشرف...</div>}>
                        <WeeklyHonorBoard currentStudentId={currentAccount.id} onViewAll={() => handleTabSwitch('honor_board')} />
                      </React.Suspense>
                    </div>
                  )}
                </div>

                {/* 1.5 شريط خدمات ومسارات المقرأة السريعة المقتضب (Utility Bar) */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>مرافق المقرأة:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleTabSwitch('smart_memorization')}
                      className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-amber-50 hover:from-emerald-100 hover:to-amber-100 text-[#046A38] rounded-lg border border-[#C5A059]/40 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Brain className="w-3.5 h-3.5 text-[#046A38]" />
                      <span>التحفيظ الذكي</span>
                      <span className="bg-[#C5A059] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Gemini</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('resources')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Video className="w-3 h-3 text-indigo-600" />
                      <span>المصادر</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('memorization_plan')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-emerald-600" />
                      <span>خطة الحفظ</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('messages')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3 text-[#046A38]" />
                      <span>محادثة الشيخ</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('attendance')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3 text-blue-600" />
                      <span>الحضور والغياب</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('reports')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-rose-600" />
                      <span>التقارير الأكاديمية</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('upcoming_lessons')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3 text-purple-600" />
                      <span>الدروس القادمة</span>
                    </button>
                    <button
                      onClick={() => handleTabSwitch('support')}
                      className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-amber-50 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <HeartHandshake className="w-3 h-3 text-[#C5A059]" />
                      <span>دعم المقرأة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* شريط الرجوع الموحد لكافة الأقسام الفرعية (اسهم للرجوع)       */}
            {/* ======================================================== */}
            {activeTab !== 'dashboard' && (
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 mb-6 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('dashboard')}
                  className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-[#C5A059] group"
                  title="الرجوع إلى لوحة الطالب الرئيسية"
                >
                  <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                  <span>العودة إلى لوحة الطالب الرئيسية</span>
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-bold hidden sm:inline">القسم الحالي:</span>
                  <span className="px-3 py-1 bg-[#F4F7F6] text-[#046A38] font-bold rounded-lg border border-[#C5A059]/40 font-serif text-xs">
                    {getTabLabel(activeTab)}
                  </span>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. صفحة «حلقتي» (HALQA PAGE)                               */}
            {/* ======================================================== */}
            {activeTab === 'halqa' && (
              <StudentHalqaView
                assignment={effectiveAssignment}
                announcements={halqaAnnouncements}
                onOpenChat={() => handleTabSwitch('messages')}
                studentId={currentAccount.id}
                studentName={currentAccount.name}
                studentSection={currentAccount.gender === 'female' ? 'female' : 'male'}
              />
            )}

            {/* ======================================================== */}
            {/* 5. صفحة «لوحة الشرف» (HONOR BOARD PAGE)                   */}
            {/* ======================================================== */}
            {activeTab === 'honor_board' && (
              <StudentHonorBoardView currentAccount={currentAccount} />
            )}

            {/* ======================================================== */}
            {/* 2. خطة الحفظ (MEMORIZATION PLAN)                          */}
            {/* ======================================================== */}
            {activeTab === 'memorization_plan' && (
              <div className="space-y-6 animate-fade-in">
                {/* بطاقة التوجيه لأداة التحفيظ الذكي */}
                <div className="bg-gradient-to-r from-[#044223] via-[#046A38] to-[#032e18] rounded-3xl p-5 text-white border-2 border-[#C5A059] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/50 flex items-center justify-center shrink-0 text-[#f5dfa9]">
                      <Brain className="w-6 h-6 text-[#f5dfa9]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                          ميزة ذكاء اصطناعي (Gemini)
                        </span>
                        <span className="text-xs text-emerald-200">مخصصة لمستواك</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold font-serif text-white mt-0.5">
                        أداة التحفيظ الذكي وتقسيم السور اليومي
                      </h3>
                      <p className="text-xs text-emerald-100/80 max-w-xl mt-1">
                        قسّم أي سورة من القرآن الكريم إلى مقاطع تسميع يومية قصيرة ومحكمة تراعي مستوى حفظك الحالي وأوقات فراغك اليومية.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTabSwitch('smart_memorization')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-400 hover:from-amber-400 hover:to-[#C5A059] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <span>فتح أداة التحفيظ الذكي</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المسار المنهجي</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">خطة الحفظ الجديد المعتمدة</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    إجمالي مقاطع الخطة: {memorizationPlans.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {memorizationPlans.map((plan) => (
                    <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 font-serif">{plan.surahName}</span>
                          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            الآيات: {plan.fromAyah} - {plan.toAyah}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">تاريخ الإنجاز المستهدف: {plan.targetDate}</p>
                        {plan.notes && <p className="text-xs text-slate-700 italic">ملاحظة المعلم: {plan.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {plan.grade && (
                          <span className="text-xs font-mono font-bold text-[#046A38] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            الدرجة: {plan.grade}%
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          plan.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {plan.status === 'completed' ? 'تم التسميع بنجاح' : 'قيد الحفظ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* أداة التحفيظ الذكي (SMART MEMORIZATION TOOL)              */}
            {/* ======================================================== */}
            {activeTab === 'smart_memorization' && (
              <SmartMemorizationTool
                studentName={currentAccount.name}
                onNavigateToAudioPlayer={onOpenQuranAudio}
                onBackToDashboard={() => handleTabSwitch('dashboard')}
              />
            )}

            {/* ======================================================== */}
            {/* 3. خطة المراجعة (REVISION PLAN)                           */}
            {/* ======================================================== */}
            {activeTab === 'revision_plan' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">تثبيت المحفوظات</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">خطة المراجعة والتثبيت</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    مقاطع المراجعة: {revisionPlans.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {revisionPlans.map((plan) => (
                    <div key={plan.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-slate-900 font-serif">{plan.surahName}</span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mr-2">
                          الآيات: {plan.fromAyah} - {plan.toAyah}
                        </span>
                        <p className="text-xs text-slate-500">موعد المراجعة: {plan.targetDate}</p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
                        مراجعة صغرى مجدولة
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. التقويم التفاعلي وجدول المواعيد والمهام (CALENDAR & TASKS) */}
            {/* ======================================================== */}
            {activeTab === 'upcoming_lessons' && (
              <React.Suspense fallback={<PageSkeleton title="جاري التحميل..." />}>
                <QuranInteractiveCalendar
                  currentAccount={currentAccount}
                  userRole="student"
                  onJoinSession={(session) => {
                    if (session.meetingUrl) window.open(session.meetingUrl, '_blank');
                    else alert('جاري توجيهك إلى القاعة الافتراضية للحلقة...');
                  }}
                  onOpenQuranAudio={onOpenQuranAudio}
                />
              </React.Suspense>
            )}

            {/* ======================================================== */}
            {/* 5. الحضور والغياب (ATTENDANCE)                            */}
            {/* ======================================================== */}
            {activeTab === 'attendance' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">سجل الانضباط الأكاديمي</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">سجل الحضور والغياب</h2>
                  </div>
                  <div className="text-xs text-slate-600 font-bold bg-emerald-50 text-[#046A38] px-3 py-1.5 rounded-xl border border-emerald-200">
                    نسبة الانضباط الإجمالية: 100%
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                      <tr>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">الحلقة</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800">{rec.date}</td>
                          <td className="p-4 text-slate-700">{rec.halqaTitle}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              rec.status === 'present'
                                ? 'bg-emerald-100 text-emerald-900'
                                : rec.status === 'late'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-rose-100 text-rose-900'
                            }`}>
                              {rec.status === 'present' ? 'حاضر' : rec.status === 'late' ? 'متأخر' : 'غائب'}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{rec.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. الواجبات (ASSIGNMENTS)                                 */}
            {/* ======================================================== */}
            {activeTab === 'assignments' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المهام والتكليفات</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">واجبات الحفظ والتجويد</h2>
                  </div>
                  <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
                    الواجبات المفتوحة: {assignments.filter(a => a.status === 'assigned').length}
                  </span>
                </div>

                <div className="space-y-4">
                  {assignments.map((asg) => (
                    <div key={asg.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 font-serif">{asg.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          asg.status === 'submitted'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {asg.status === 'submitted' ? 'تم التسليم' : 'مطلوب التسليم'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>المعلم: <strong>{asg.teacherName}</strong> • تاريخ الاستحقاق: <strong>{asg.dueDate}</strong></span>
                        {asg.grade && <span className="font-bold text-[#046A38]">الدرجة: {asg.grade}/100</span>}
                      </div>

                      {asg.status === 'assigned' && (
                        <div className="pt-2">
                          <button
                            onClick={() => setSelectedAssignment(asg)}
                            className="px-4 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                          >
                            تسليم الواجب الآن
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* نافذة تسليم الواجب */}
                {selectedAssignment && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-bold text-sm text-[#046A38] font-serif">تسليم واجب: {selectedAssignment.title}</h4>
                        <button onClick={() => setSelectedAssignment(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                          إلغاء
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <label className="block font-bold text-slate-700">ملاحظاتك أو نص الإجابة للمعلم:</label>
                        <textarea
                          rows={4}
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          placeholder="اكتب ملاحظاتك أو رابط التسجيل الصوتي..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                        ></textarea>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setSelectedAssignment(null)}
                          className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleAssignmentSubmit}
                          disabled={isSubmittingAssignment || !submissionNotes.trim()}
                          className="px-5 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingAssignment ? 'جاري التسليم...' : 'تأكيد التسليم'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 7. سجل التسميع (RECITATION LOG)                           */}
            {/* ======================================================== */}
            {activeTab === 'recitation_log' && (
              <div className="space-y-6 animate-fade-in">
                {/* ترويسة التسميع وزر التسجيل */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">سجل التلاوات والجلسات الصوتية</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">التسميع الصوتي المباشر</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      سجّل تلاوتك بصوتك، وارفعها سحابياً لفضيلة الشيخ للاستماع والتقييم وتصحيح التجويد.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsRecorderOpen(!isRecorderOpen)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer border ${
                        isRecorderOpen
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-[#046A38] hover:bg-[#03542c] text-white border-[#C5A059]'
                      }`}
                    >
                      <Mic className="w-4 h-4 text-[#C5A059]" />
                      <span>{isRecorderOpen ? 'إغلاق مسجل الصوت ▲' : 'تسجيل صوتي جديد (MediaRecorder) ▼'}</span>
                    </button>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                      التسميعات: {recitationLogs.length}
                    </span>
                  </div>
                </div>

                {/* مسجل الصوت المباشر والرفع إلى Cloudinary */}
                {isRecorderOpen && (
                  <StudentRecitationRecorder
                    currentAccount={currentAccount}
                    teacherName={effectiveAssignment.teacherName}
                    onRecitationSaved={(newRec) => {
                      setRecitationLogs((prev) => [newRec, ...prev]);
                      setIsRecorderOpen(false);
                      setFeedback({
                        type: 'success',
                        message: 'تم إرسال تلاوتك المسجلة وحفظها بنجاح في قاعدة بيانات المقرأة!',
                      });
                    }}
                    onCancel={() => setIsRecorderOpen(false)}
                  />
                )}

                {/* قائمة التسميعات السابقة وملاحظات الشيخ والمشغل الصوتي */}
                <div className="space-y-4">
                  {recitationLogs.length === 0 ? (
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#C5A059] flex items-center justify-center mx-auto">
                        <Mic className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-base text-slate-900 font-serif">لا توجد تسجيلات تسميع سابقة بعد</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        اضغط على زر «تسجيل صوتي جديد» أعلاه لتسجيل مقطع التلاوة بصوتك ورفعه إلى Cloudinary ليقوم الشيخ بمراجعته.
                      </p>
                      <button
                        onClick={() => setIsRecorderOpen(true)}
                        className="px-5 py-2.5 bg-[#046A38] text-white rounded-xl text-xs font-bold hover:bg-[#03542c] transition-colors cursor-pointer border border-[#C5A059]"
                      >
                        بدء أول تسجيل صوتي الآن
                      </button>
                    </div>
                  ) : (
                    recitationLogs.map((rec) => (
                      <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                              <BookOpen className="w-5 h-5 text-[#046A38]" />
                            </div>
                            <div>
                              <span className="font-bold text-base text-slate-900 font-serif">{rec.surah}</span>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  الآيات: {rec.ayahRange}
                                </span>
                                <span>• الرواية: {rec.riwayah || 'حفص عن عاصم'}</span>
                                <span>• التاريخ: {rec.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {rec.gradeScore > 0 ? (
                              <span className="font-mono font-bold text-[#046A38] text-sm bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                                الدرجة: {rec.gradeScore} / 100
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                                قيد استماع ومراجعة الشيخ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* مشغل الصوت السحابي إن وجد */}
                        {rec.audioUrl && (
                          <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-600 block flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-[#046A38]" />
                              <span>التسجيل الصوتي المرفوع إلى Cloudinary:</span>
                            </span>
                            <audio controls src={rec.audioUrl} className="w-full h-10 rounded-xl" preload="none" />
                          </div>
                        )}

                        {/* ملاحظات الشيخ وتوجيهات التجويد المكتوبة */}
                        <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 text-xs text-slate-700 space-y-1">
                          <strong className="text-[#046A38] block flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>ملاحظات فضيلة الشيخ وتوجيهات التجويد ({rec.teacherName}):</span>
                          </strong>
                          <p className="leading-relaxed text-slate-800">
                            {rec.tajweedNotes || 'بانتظار مراجعة الشيخ لجلسة التسميع وإضافة التقييم والتوجيهات.'}
                          </p>
                        </div>

                        {/* الملاحظة والتوجيه الصوتي المباشر للشيخ المعلم */}
                        {(rec.teacherVoiceNoteUrl || (rec as any).teacherAudioUrl) && (
                          <div className="p-4 bg-gradient-to-r from-emerald-50 via-[#F9F6F0] to-emerald-50 rounded-2xl border-2 border-[#C5A059] space-y-2 shadow-xs">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#046A38] flex items-center gap-2 font-serif">
                                <div className="w-6 h-6 rounded-full bg-[#046A38] text-white flex items-center justify-center">
                                  <Mic className="w-3.5 h-3.5 text-[#C5A059]" />
                                </div>
                                <span>توجيه صوتي مسجل من فضيلة الشيخ ({rec.teacherName}):</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A059] text-slate-950 font-sans shadow-2xs">
                                تسجيل صوتي حي 🎙️
                              </span>
                            </div>
                            <audio 
                              controls 
                              src={rec.teacherVoiceNoteUrl || (rec as any).teacherAudioUrl} 
                              className="w-full h-10 rounded-xl" 
                              preload="none" 
                            />
                            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                              استمع إلى التوجيه الصوتي المباشر من الشيخ لتصحيح مواضع المدود والغنن ومخارج الحروف في تلاوتك.
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 8. التقارير والتقييمات (REPORTS & EVALUATIONS)             */}
            {/* ======================================================== */}
            {activeTab === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-[#C5A059]">التقييم الدوري الشامل</span>
                  <h2 className="text-xl font-bold font-serif text-[#046A38] mt-1">تقارير التقييم والمستوى</h2>
                </div>

                <div className="space-y-4">
                  {reports.map((rep) => (
                    <div key={rep.id} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 font-serif">{rep.period}</h3>
                          <span className="text-xs text-slate-400">إشراف: {rep.teacherName}</span>
                        </div>
                        <span className="px-3.5 py-1.5 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-xs">
                          {rep.overallGrade}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-xs text-slate-500 block">درجة الحفظ</span>
                          <span className="text-lg font-black text-[#046A38] font-mono">{rep.memorizationScore}%</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-xs text-slate-500 block">درجة التجويد</span>
                          <span className="text-lg font-black text-amber-700 font-mono">{rep.tajweedScore}%</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-xs text-slate-500 block">درجة الحضور</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">{rep.attendanceScore}%</span>
                        </div>
                      </div>

                      <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 text-xs text-slate-800 space-y-1">
                        <strong className="text-[#046A38] block font-bold">توصية الشيخ والمشرف:</strong>
                        <p className="leading-relaxed">{rep.sheikhRecommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 9. الشهادات (CERTIFICATES)                                */}
            {/* ======================================================== */}
            {activeTab === 'certificates' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">الإنجازات المعتمدة بالختم</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">الشهادات القرآنية الصادرة</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    إجمالي الشهادات: {certificates.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.length === 0 ? (
                    <div className="col-span-full bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#C5A059] flex items-center justify-center mx-auto">
                        <Award className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-base text-slate-900 font-serif">بانتظار اعتماد أول شهادة إنجاز</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        عند إتمام حفظ الأجزاء أو منظومة التجويد مع الشيخ، ستصدر شهادتك المعتمدة بالختم الرسمي وتوقيع المشرف العام د. علي عزيزي هنا مع إمكانية تحميلها PDF.
                      </p>
                    </div>
                  ) : (
                    certificates.map((cert) => (
                      <div 
                        key={cert.id} 
                        className="bg-white rounded-3xl border-2 border-[#C5A059] p-6 sm:p-8 space-y-4 shadow-md relative overflow-hidden flex flex-col justify-between"
                      >
                        {/* علامة مائية للختم */}
                        <div className="absolute left-4 bottom-4 opacity-15 pointer-events-none">
                          <img
                            src={brandSettings.customSealUrl || '/brand/official-seal.png'}
                            crossOrigin="anonymous"
                            alt="ختم"
                            className="w-28 h-28 object-contain"
                            onError={(e) => {
                              if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                                e.currentTarget.src = '/brand/official-seal.png';
                              }
                            }}
                          />
                        </div>

                        <div className="text-center space-y-2 border-b border-slate-100 pb-4">
                          <div className="flex items-center justify-center gap-2">
                            <OfficialLogo size="sm" showText={false} />
                            <span className="font-bold text-xs text-[#046A38] uppercase">مقرأة رحاب القرآن الإلكترونية</span>
                          </div>
                          <h4 className="text-lg font-bold font-serif text-[#046A38]">شهادة إتمام واجتياز رسمي</h4>
                          <p className="text-xs text-slate-500">تشهد إدارة المقرأة بأن الطالب/ـة:</p>
                          <div className="text-base font-black text-slate-900 font-serif bg-[#F9F6F0] py-1.5 px-4 rounded-xl border border-[#C5A059]/40 inline-block">
                            {cert.studentName}
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 space-y-2">
                          <p>قد أتم بنجاح متطلبات: <strong>{cert.courseTitle}</strong></p>
                          <p>الرواية: <strong>{cert.riwayah}</strong></p>
                          <p>التقدير العام: <strong className="text-[#046A38]">{cert.grade}</strong></p>
                          <p className="font-mono text-[11px] text-slate-400">الرقم التسلسلي: {cert.serialNumber}</p>
                        </div>

                        {/* زر تحميل وطباعة PDF */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCertForPdf(cert)}
                            className="w-full py-2.5 px-4 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059]"
                          >
                            <Download className="w-4 h-4 text-[#C5A059]" />
                            <span>تحميل وطباعة الشهادة (PDF A4)</span>
                          </button>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">إشراف المشرف العام</span>
                            <strong className="text-[#046A38] font-bold">د. علي عزيزي</strong>
                          </div>
                          <img
                            src={brandSettings.customSealUrl || '/brand/official-seal.png'}
                            crossOrigin="anonymous"
                            alt="الختم الرسمي"
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                                e.currentTarget.src = '/brand/official-seal.png';
                              }
                            }}
                          />
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">معلم الحلقة</span>
                            <strong className="text-slate-800 font-bold">{cert.sheikhTeacherName}</strong>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 10. محادثة الطالب والمعلم (STUDENT-TEACHER CHAT)          */}
            {/* ======================================================== */}
            {activeTab === 'messages' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المحادثة الفورية المباشرة</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">محادثة فضيلة الشيخ المعيّن</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تواصل مباشر ومحفوظ مع معلّم حلقتك ({effectiveAssignment.teacherName}) لتوجيهات التلاوة والاستفسارات وحفظ الورد.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      الحلقة: {effectiveAssignment.halqaTitle}
                    </span>
                  </div>
                </div>

                <StudentTeacherChatView
                  currentAccount={currentAccount}
                  assignment={effectiveAssignment}
                  onRefreshAssignment={loadStudentData}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 11. الإشعارات (NOTIFICATIONS)                             */}
            {/* ======================================================== */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                {/* نظام التنبيهات المباشر للحلقات والمهام */}
                <StudentRemindersAlerts
                  currentAccount={currentAccount}
                  effectiveAssignment={effectiveAssignment}
                  countdown={countdown}
                  assignments={assignments}
                  upcomingLessons={upcomingLessons}
                  onNavigateTab={handleTabSwitch}
                  onOpenRecitationRecorder={() => setIsRecorderOpen(true)}
                  onOpenMeet={(url) => {
                    if (url) window.open(url, '_blank');
                    else setIsLiveMeetModalOpen(true);
                  }}
                />

                <FavoriteSheikhNotificationCenter
                  currentStudentName={currentAccount.name}
                  onJoinHalqa={(halqaId, meetUrl) => {
                    if (meetUrl) {
                      window.open(meetUrl, '_blank');
                    } else {
                      setIsLiveMeetModalOpen(true);
                    }
                  }}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 7. الملف الشخصي (PROFILE: تعديل البيانات، كلمة المرور، الصورة) */}
            {/* ======================================================== */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <StudentProfileEditor
                  currentAccount={currentAccount}
                  onProfileUpdated={() => {
                    loadStudentData();
                    setFeedback({
                      type: 'success',
                      message: 'تم تحديث بيانات ملفك الشخصي بنجاح!',
                    });
                  }}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 13. المساهمة الشهرية لدعم المقرأة                        */}
            {/* ======================================================== */}
            {activeTab === 'support' && (
              <div className="space-y-6 animate-fade-in">
                <MonthlyContributionView currentAccount={currentAccount} />
              </div>
            )}

            {/* ======================================================== */}
            {/* 14. دروس التجويد والمستويات (Tajweed Curriculum)         */}
            {/* ======================================================== */}
            {activeTab === 'tajweed' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
                      المنهج التجويدي المتسلسل ودروس الإتقان
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      دروس التجويد النظرية والتطبيقية، مقاطع الفيديو التعليمية، ملفات الـ PDF، واختبارات الإتقان المعتمدة
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-[#F9F6F0] hover:bg-slate-100 text-[#046A38] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>العودة للوحة الرئيسية ←</span>
                  </button>
                </div>

                <React.Suspense fallback={<PageSkeleton title="جاري تحميل دروس ومنهج التجويد..." />}>
                  <TajweedGuideView 
                    initialChapterId={selectedTajweedChapterId}
                    initialLessonId={selectedTajweedLessonId}
                  />
                </React.Suspense>
              </div>
            )}

            {/* ======================================================== */}
            {/* 15. مكتبة المصادر والتسجيلات التعليمية وقواعد التجويد   */}
            {/* ======================================================== */}
            {activeTab === 'resources' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38] flex items-center gap-2">
                      <Video className="w-6 h-6 text-[#C5A059]" />
                      <span>مكتبة المصادر والتسجيلات التعليمية</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      وصول سريع لمقاطع فيديو توضيحية مختارة وقواعد تجويد مسجلة مسبقاً بجانب الدروس والحلقات المباشرة
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-[#F9F6F0] hover:bg-slate-100 text-[#046A38] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>العودة للوحة الرئيسية ←</span>
                  </button>
                </div>

                <StudentResourcesLibrary
                  googleMeetUrl={effectiveAssignment.googleMeetUrl}
                  halqaSchedule={effectiveAssignment.halqaSchedule}
                  teacherName={effectiveAssignment.teacherName}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 16. مكتبة المصاحف الرقمية وتصفح صفحات المصحف عالي الدقة  */}
            {/* ======================================================== */}
            {activeTab === 'mushaf' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38] flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-[#C5A059]" />
                      <span>مكتبة المصاحف الرقمية عالية الدقة</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      عرض صفحات مصحف المدينة النبوية الشريف بدقة فائقة مع إمكانية التكبير والتصغير وفهرس السور والأجزاء ووضع التحفيظ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabSwitch('dashboard')}
                    className="px-4 py-2 bg-[#F9F6F0] hover:bg-slate-100 text-[#046A38] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>العودة للوحة الرئيسية ←</span>
                  </button>
                </div>

                <DigitalQuranLibrary
                  studentName={currentAccount.name}
                  onOpenAudioPlayer={onOpenQuranAudio ? () => onOpenQuranAudio() : undefined}
                  onOpenTafsir={(_surahNum, _pageNum) => {
                    if (typeof window !== 'undefined') {
                      window.location.href = `/tafsir?surah=${_surahNum}&page=${_pageNum}`;
                    }
                  }}
                />
              </div>
            )}

            {/* شريط الرجوع السفلي المساعد (اسهم للرجوع) */}
            {activeTab !== 'dashboard' && (
              <div className="mt-8 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('dashboard')}
                  className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-[#C5A059] group"
                >
                  <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                  <span>العودة إلى لوحة الطالب الرئيسية</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                >
                  الصعود لأعلى الصفحة ↑
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ======================================================== */}
      {/* 1. نافذة تفاصيل حلقتي والإعلانات المنظمة (Halqa Modal)    */}
      {/* ======================================================== */}
      {isHalqaDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-serif text-[#046A38]">بيانات حلقتي وإعلانات الشيخ</h3>
                  <p className="text-xs text-slate-500">{effectiveAssignment.halqaTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHalqaDetailsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MyHalqaCard 
              assignment={effectiveAssignment} 
              onOpenChat={() => {
                setIsHalqaDetailsModalOpen(false);
                setActiveTab('messages');
              }}
              onOpenSchedule={() => {
                setIsHalqaDetailsModalOpen(false);
                setActiveTab('upcoming_lessons');
              }}
            />

            {halqaAnnouncements.length > 0 && (
              <div className="bg-[#F9F6F0] p-5 rounded-2xl border border-[#C5A059]/40 space-y-3">
                <h4 className="font-bold text-sm text-[#046A38] font-serif flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C5A059]" />
                  <span>إعلانات وتوجيهات الشيخ للحلقة ({halqaAnnouncements.length})</span>
                </h4>
                <div className="space-y-2">
                  {halqaAnnouncements.map((ann) => (
                    <div key={ann.id} className="p-3 bg-white rounded-xl border border-amber-200/60 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ann.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{ann.createdAt}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHalqaDetailsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. نافذة لوحة الشرف الكاملة المنظمة (Honor Board Modal)    */}
      {/* ======================================================== */}
      {isHonorBoardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#C5A059] flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-serif text-[#046A38]">لوحة الشرف وتكريم الفرسان</h3>
                  <p className="text-xs text-slate-500">الترتيب الأسبوعي للطلاب المتميزين في التسميع والإتقان</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHonorBoardModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <React.Suspense fallback={<PageSkeleton title="جاري تجهيز لوحة الشرف..." />}>
              <WeeklyHonorBoard currentStudentId={currentAccount.id} />
            </React.Suspense>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHonorBoardModalOpen(false)}
                className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                إغلاق والعودة للوحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. نافذة تفاصيل الحلقة المباشرة (Live Meet Modal)         */}
      {/* ======================================================== */}
      {isLiveMeetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-[#C5A059] space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-serif text-[#046A38]">الحلقة المباشرة (Google Meet)</h3>
                  <p className="text-xs text-slate-500">{effectiveAssignment.halqaTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveMeetModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">موعد الحلقة المعتمد:</span>
                  <span className="font-bold text-[#046A38] bg-white px-2.5 py-1 rounded-lg border border-slate-200">{effectiveAssignment.halqaSchedule}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-800">فضيلة الشيخ المعلم:</span>
                  <span className="text-slate-700">{effectiveAssignment.teacherName}</span>
                </div>
              </div>

              {effectiveAssignment.googleMeetUrl ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>رابط الجلسة المباشرة متاح الآن</span>
                  </div>
                  <a
                    href={effectiveAssignment.googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#046A38] hover:bg-[#03552d] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm"
                  >
                    <span>انضمام للجلسة المباشرة الآن</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                  <p className="font-bold text-amber-900">لم يتم نشر رابط البث المباشر لهذه الجلسة بعد</p>
                  <p className="text-[11px] text-amber-800">يقوم فضيلة الشيخ بتفعيل رابط Google Meet عند موعد الحلقة المعتمد.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLiveMeetModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة مركز مدارسة وحفظ المتون العلمية التفاعلي */}
      <StudentMutunStudyModal
        isOpen={isMutunStudyModalOpen}
        onClose={() => setIsMutunStudyModalOpen(false)}
        studentId={currentAccount.id}
        studentName={currentAccount.name}
        halqaId={halqaAssignment?.halqaId}
        teacherId={halqaAssignment?.teacherId}
        initialMatnId={selectedMutunId}
      />

      {/* ======================================================== */}
      {/* 3. نافذة التفاصيل الإضافية التفاعلية للبطاقات             */}
      {/* ======================================================== */}
      {activeDetailModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setActiveDetailModal(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 border-2 border-[#C5A059] shadow-2xl space-y-5 text-right relative"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#046A38] text-white flex items-center justify-center shadow-xs">
                  {activeDetailModal === 'halqa' && <BookOpen className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'tajweed' && <Sparkles className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'revision' && <Bookmark className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'assignments' && <ClipboardList className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'teacher_notes' && <Star className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'notifications' && <Bell className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'profile' && <User className="w-5 h-5 text-[#C5A059]" />}
                  {activeDetailModal === 'honor' && <Trophy className="w-5 h-5 text-[#C5A059]" />}
                </div>
                <div>
                  <h3 className="font-bold text-base font-serif text-[#046A38]">
                    {activeDetailModal === 'halqa' && 'تفاصيل «حلقتي والشيخ»'}
                    {activeDetailModal === 'tajweed' && 'تفاصيل «دروس التجويد والمستوى»'}
                    {activeDetailModal === 'revision' && 'تفاصيل «ورد المراجعة والتثبيت»'}
                    {activeDetailModal === 'assignments' && 'تفاصيل «الواجبات والتكاليف»'}
                    {activeDetailModal === 'teacher_notes' && 'تفاصيل «ملاحظات وتوجيهات الشيخ»'}
                    {activeDetailModal === 'notifications' && 'تفاصيل «التنبيهات والإشعارات»'}
                    {activeDetailModal === 'profile' && 'بيانات «الملف الشخصي والحساب»'}
                    {activeDetailModal === 'honor' && 'منصة «لوحة الشرف والشهادات»'}
                  </h3>
                  <span className="text-[11px] text-slate-400">مقرأة رحاب القرآن الإلكترونية</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 text-xs">
              {/* 1. Halqa Detail */}
              {activeDetailModal === 'halqa' && (
                <div className="space-y-3">
                  <div className="bg-[#F4F7F6] p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">اسم الحلقة:</span>
                      <strong className="text-slate-900 font-serif text-sm">{effectiveAssignment.halqaTitle}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">فضيلة الشيخ المعلم:</span>
                      <strong className="text-[#046A38] font-bold">{effectiveAssignment.teacherName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الجدول الأسبوعي:</span>
                      <span className="font-bold text-slate-800">{effectiveAssignment.halqaSchedule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">مقدار الحفظ المستهدف:</span>
                      <span className="font-bold text-[#C5A059]">
                        {memorizationPlans[0]?.surahName 
                          ? `${memorizationPlans[0].surahName} (${memorizationPlans[0].fromAyah}-${memorizationPlans[0].toAyah})`
                          : ((currentAccount as any).memorization || 'سورة البقرة • الجزء الأول')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    {effectiveAssignment.googleMeetUrl && (
                      <a
                        href={effectiveAssignment.googleMeetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>فتح رابط Google Meet المعتمد ↗</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDetailModal(null);
                        handleTabSwitch('halqa');
                      }}
                      className="py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-[#C5A059]" />
                      <span>الانتقال لصفحة «حلقتي» كاملة ←</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Tajweed Detail */}
              {activeDetailModal === 'tajweed' && (
                <div className="space-y-3">
                  <div className="bg-[#F4F7F6] p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المستوى المعتمد:</span>
                      <strong className="text-[#046A38] font-bold">{tajweedProgress.currentLevelTitle}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">نسبة التقدم:</span>
                      <strong className="text-slate-900 font-mono font-bold text-sm">{tajweedProgress.percentage}%</strong>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#046A38] to-[#C5A059] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${tajweedProgress.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500">الدروس المنجزة:</span>
                      <span className="font-bold text-slate-800">{tajweedProgress.completedCount} من {tajweedProgress.totalCount} دروس</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">تقييم الشيخ في التجويد:</span>
                      <span className="text-[#046A38] font-bold">ممتاز مرتفع • إتقان تام للمخارج والصفات</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('tajweed');
                    }}
                    className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>متابعة منهج التجويد والتمارين ←</span>
                  </button>
                </div>
              )}

              {/* 3. Revision Detail */}
              {activeDetailModal === 'revision' && (
                <div className="space-y-3">
                  <div className="bg-[#F4F7F6] p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الورد اليومي:</span>
                      <strong className="text-slate-900 font-serif text-sm">
                        {revisionPlans[0]?.surahName 
                          ? `${revisionPlans[0].surahName} (${revisionPlans[0].fromAyah} - ${revisionPlans[0].toAyah})` 
                          : 'سورة النبأ إلى الناس (الجزء الثلاثون)'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">حالة إنجاز اليوم:</span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                        isRevisionCompletedToday || revisionPlans[0]?.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {isRevisionCompletedToday || revisionPlans[0]?.status === 'completed' ? 'تم التثبيت بنجاح ✅' : 'متبقي مراجعة اليوم ⏳'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                      قال رسول الله ﷺ: «تعاهدوا هذا القرآن، فوالذي نفسي بيده لهو أشد تفصياً من الإبل في عقلها».
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRevisionCompletedToday(!isRevisionCompletedToday);
                      setFeedback({
                        type: 'success',
                        message: !isRevisionCompletedToday ? 'ما شاء الله! تم تسجيل إنجاز ورد المراجعة اليومي بنجاح.' : 'تم تعديل حالة الورد اليومي.'
                      });
                    }}
                    className="w-full py-2.5 bg-[#046A38] text-white hover:bg-[#03542c] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-[#C5A059]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                    <span>{isRevisionCompletedToday || revisionPlans[0]?.status === 'completed' ? 'تم تسجيل إنجاز ورد اليوم ✅' : 'تحديد الورد كمنجز اليوم'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('revision_plan');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    فتح جدول المراجعة الأسبوعي كامل ←
                  </button>
                </div>
              )}

              {/* 4. Assignments Detail */}
              {activeDetailModal === 'assignments' && (
                <div className="space-y-3">
                  <div className="bg-[#F4F7F6] p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">إجمالي الواجبات:</span>
                      <strong className="text-slate-900 font-bold">{assignments.length} مهام</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المهام قيد الإنجاز:</span>
                      <span className="font-bold text-amber-800">{assignments.filter(a => a.status === 'assigned').length} مهام</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">المهام المسلّمة:</span>
                      <span className="font-bold text-emerald-700">{assignments.filter(a => a.status === 'submitted' || a.status === 'reviewed').length} مهام</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">أقرب واجب مستحق:</span>
                      <p className="font-bold text-slate-800">{assignments[0]?.title || 'تسجيل تلاوة سورة الملك مع ضبط الإدغام'}</p>
                      <span className="text-rose-700 font-mono text-[11px] block mt-0.5">موعد التسليم: {assignments[0]?.dueDate || 'اليوم 8:00 مساءً'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('assignments');
                    }}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>الانتقال لصفحة الواجبات وتسليم التكاليف ←</span>
                  </button>
                </div>
              )}

              {/* 5. Teacher Notes Detail */}
              {activeDetailModal === 'teacher_notes' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الشيخ المعلم:</span>
                      <strong className="text-[#046A38] font-serif text-sm">{effectiveAssignment.teacherName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">التقييم التراكمي:</span>
                      <span className="font-bold text-[#046A38] font-mono">{averageGrade}/100 (ممتاز مرتفع ⭐)</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 block">نص التوجيه الأخير:</span>
                      <p className="text-slate-800 leading-relaxed italic text-xs">
                        "{reports[0]?.sheikhRecommendation || recitationLogs.find(r => r.tajweedNotes)?.tajweedNotes || 'ما شاء الله، قراءة خاشعة مع مراعاة أحكام المدود، يُرجى التركيز على تفخيم الراء المفتوحة والتدرب على مخرج الضاد.'}"
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('recitation_log');
                    }}
                    className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-[#C5A059]" />
                    <span>فتح سجل التسميع والملاحظات الصوتية ←</span>
                  </button>
                </div>
              )}

              {/* 6. Notifications Detail */}
              {activeDetailModal === 'notifications' && (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(notifications.length > 0 ? notifications : [
                      { id: '1', title: 'تنبيه: حلقة المراجعة الأسبوعية قائمة في موعدها المحدد', createdAt: 'اليوم', type: 'general' },
                      { id: '2', title: 'إشعار: تم اعتماد تقييم التسميع الصوتي الأخير', createdAt: 'أمس', type: 'evaluation' }
                    ]).map((n, idx) => (
                      <div key={n.id || idx} className="p-3 bg-[#F4F7F6] rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold text-xs">{n.title}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('ar-SA') : 'اليوم'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('notifications');
                    }}
                    className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-[#C5A059]" />
                    <span>الانتقال لمركز التنبيهات الكامل ←</span>
                  </button>
                </div>
              )}

              {/* 7. Profile Detail */}
              {activeDetailModal === 'profile' && (
                <div className="space-y-3">
                  <div className="bg-[#F4F7F6] p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">اسم الطالب:</span>
                      <strong className="text-slate-900 font-serif text-sm">{currentAccount.name}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الرقم الأكاديمي:</span>
                      <strong className="text-[#046A38] font-mono font-bold text-xs" dir="ltr">
                        {(currentAccount as any).academicNumber || currentAccount.username || ('RQ-2026-' + (currentAccount.id?.slice(-4) || '6365'))}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">نسبة الحضور المعتمدة:</span>
                      <span className="font-bold text-slate-800">{attendanceRate}% ({presentDaysCount} أيام حضور)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الحلقة المسجل بها:</span>
                      <span className="font-bold text-slate-800">{effectiveAssignment.halqaTitle}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">الرواية:</span>
                      <span className="text-slate-700">{(currentAccount as any).riwayah || 'حفص عن عاصم بالسند المتصل'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      handleTabSwitch('profile');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>تعديل بيانات الملف الشخصي وكلمة المرور ←</span>
                  </button>
                </div>
              )}

              {/* 8. Honor Detail */}
              {activeDetailModal === 'honor' && (
                <div className="space-y-3">
                  <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2 text-center">
                    <span className="text-xs text-slate-500 font-bold block">ترتيبك الأسبوعي في لوحة الشرف</span>
                    <strong className="text-xl font-serif text-[#C5A059] block">المركز الثاني 🥈</strong>
                    <p className="text-xs text-[#046A38] font-bold">وسام الالتزام والمواظبة على الحلقات 👑</p>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">الشهادات المعتمدة:</span>
                      <span className="font-bold text-[#046A38]">{certificates.length} شهادات بالختم الرسمي</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDetailModal(null);
                        handleTabSwitch('honor_board');
                      }}
                      className="py-2.5 bg-[#C5A059] hover:bg-[#b08d47] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" />
                      <span>لوحة الشرف</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDetailModal(null);
                        handleTabSwitch('certificates');
                      }}
                      className="py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-[#C5A059]" />
                      <span>شهاداتي (PDF)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. نافذة معاينة وتحميل شهادات الطالب (PDF Modal)           */}
      {/* ======================================================== */}
      <StudentCertificateModal
        certificate={selectedCertForPdf}
        onClose={() => setSelectedCertForPdf(null)}
        issuedLogoUrl={brandSettings.customLogoUrl}
        issuedSealUrl={brandSettings.customSealUrl}
      />
    </div>
  );
};
