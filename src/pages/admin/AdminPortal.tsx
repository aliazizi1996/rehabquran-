/**
 * بوابة الإدارة والمشرف العام المتكاملة - مقرأة رحاب القرآن الإلكترونية
 * تشمل الصفحات الإدارية الـ 11 المحددة:
 * 1. لوحة الإحصاءات (Analytics Dashboard)
 * 2. إدارة المستخدمين (User Management)
 * 3. إدارة المعلمين (Teacher Management)
 * 4. إدارة الطلاب (Student Management)
 * 5. إدارة الحلقات (Halqa Management)
 * 6. إدارة الخطط (Plans Management)
 * 7. إدارة المحتوى (Content Management)
 * 8. إدارة الشهادات (Certificate Management)
 * 9. إدارة الاشتراكات والمساهمات (Subscriptions)
 * 10. إدارة البلاغات والشكاوى (Complaints)
 * 11. سجل العمليات Audit Log (Security & Audit Log)
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, GraduationCap, BookOpen, Layers, 
  Settings, Award, DollarSign, AlertTriangle, ShieldCheck, 
  Search, Plus, RefreshCw, CheckCircle2, XCircle, Trash2, 
  Edit, Eye, EyeOff, FileText, Check, Shield, Download, LogOut, ChevronLeft, ArrowRight, Sliders,
  MessageCircle, Phone, Clock, ExternalLink, Copy, Send, UserCheck, UserX, AlertCircle, ArrowLeft, X,
  Menu, ChevronDown, Palette, CreditCard, UserPlus, Video, KeyRound, Sparkles, Volume2,
  Building2
} from 'lucide-react';
import { AuthAccount, UserRole } from '../../types';
import { SupervisorMutunManager } from '../../components/admin/SupervisorMutunManager';
import { BookMarked } from 'lucide-react';
import { AddUserAccountModal } from '../../components/AddUserAccountModal';
import { GoogleMeetManagerModal } from '../../components/GoogleMeetManagerModal';
import { StudentAcceptanceSetupModal } from '../../components/StudentAcceptanceSetupModal';
import { TeacherAcceptanceSetupModal } from '../../components/TeacherAcceptanceSetupModal';
import { 
  TeacherApplication, 
  rejectTeacherApplicationInFirestore,
  fetchTeacherApplicationsFromFirestore,
  buildTeacherAdmissionWhatsAppInstructions
} from '../../services/teacherApplicationService';
import { StudentAuthSyncDashboard } from '../../components/StudentAuthSyncDashboard';
import { AdminDesignAndCommunicationManager } from '../../components/admin/AdminDesignAndCommunicationManager';

const ManualLogoEditorModal = React.lazy(() => 
  import('../../components/ManualLogoEditorModal').then(m => ({ default: m.ManualLogoEditorModal }))
);
import { CertificateStudioEditor } from '../../components/admin/certificate/CertificateStudioEditor';
import { 
  SearchFilterBar, 
  PaginationControls, 
  LoadingState, 
  ErrorState, 
  EmptyState, 
  FeedbackBanner 
} from '../../components/common/PortalUiKit';
import { AccessControlTester } from '../../components/common/AccessControlTester';
import { SystemAuditDiagnosticsWidget } from '../../components/admin/SystemAuditDiagnosticsWidget';
import { AdminBrandAssetsManager } from '../../components/admin/AdminBrandAssetsManager';
import { AdminAnalyticsDashboard } from '../../components/admin/AdminAnalyticsDashboard';
import { SupervisorSupportReportModal } from '../../components/admin/SupervisorSupportReportModal';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { 
  fetchCollectionItems, 
  saveDocumentItem, 
  deleteDocumentItem, 
  HalqaGroupItem, 
  CertificateItem, 
  ComplaintTicketItem, 
  AuditLogItem, 
  SubscriptionItem,
  MemorizationPlanItem,
  MonthlyContributionItem,
  GlobalContributionSettings,
  fetchMonthlyContributionsForAdmin,
  confirmMonthlyContributionByAdmin,
  getGlobalContributionSettings,
  saveGlobalContributionSettings,
  updateMonthlyContributionAmount,
  updateSubscriptionAmount
} from '../../services/firestoreService';
import {
  StudentApplicationItem,
  fetchAllStudentApplications,
  approveStudentApplication,
  rejectStudentApplication
} from '../../services/studentApplicationService';
import { 
  WhatsAppMessageResult, 
  validateAndCleanWhatsAppNumber, 
  cleanWhatsAppNumber, 
  openWhatsAppSafely,
  buildStudentAdmissionWhatsAppInstructions
} from '../../services/whatsappService';
import { 
  assignStudentHalqaBySupervisor, 
  updateHalqaDetailsBySupervisor,
  transferStudentToHalqa,
  toggleUserAccountStatus
} from '../../services/chatService';
import { UserStatusConfirmationModal, TargetAccountUser } from '../../components/UserStatusConfirmationModal';
import {
  ContentFeatureItem,
  AuditLogEntry,
  fetchContentFeatures,
  toggleFeatureVisibility,
  updateFeatureContent,
  fetchAuditLogs,
  recordAuditLog
} from '../../services/contentManagementService';

export type AdminTab = 
  | 'brand_assets'
  | 'design_and_communication'
  | 'analytics'
  | 'users'
  | 'teachers'
  | 'students'
  | 'halqas'
  | 'plans'
  | 'content'
  | 'certificates'
  | 'certificate_editor'
  | 'subscriptions'
  | 'complaints'
  | 'audit_logs'
  | 'mutun';

export const ADMIN_PORTAL_TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'analytics', label: 'لوحة الإحصاءات', icon: BarChart3 },
  { id: 'design_and_communication', label: 'إعدادات التصميم والتواصل', icon: Sliders },
  { id: 'users', label: 'المستخدمون والصلاحيات', icon: Users },
  { id: 'teachers', label: 'شؤون المعلمين', icon: GraduationCap },
  { id: 'students', label: 'شؤون الطلاب', icon: Users },
  { id: 'halqas', label: 'إدارة الحلقات', icon: Layers },
  { id: 'plans', label: 'الخطط والبرامج', icon: BookOpen },
  { id: 'mutun', label: 'المتون العلمية', icon: BookMarked },
  { id: 'content', label: 'المحتوى والإعلانات', icon: BookOpen },
  { id: 'certificates', label: 'الشهادات والمحرر التفاعلي', icon: Award },
  { id: 'brand_assets', label: 'الهوية البصرية', icon: Palette },
  { id: 'subscriptions', label: 'الاشتراكات والمساهمات', icon: CreditCard },
  { id: 'complaints', label: 'إدارة البلاغات', icon: AlertTriangle },
  { id: 'audit_logs', label: 'سجل الرقابة والتدقيق', icon: ShieldCheck },
];

import {
  HALQA_CLASSIFICATIONS,
  HalqaClassificationId,
  detectHalqaClassification,
  ALL_APPROVED_HALQA_PRESETS
} from '../../data/halqaClassifications';

export const HALQA_NAME_PRESETS = ALL_APPROVED_HALQA_PRESETS;

interface AdminPortalProps {
  currentAccount: AuthAccount;
  initialTab?: AdminTab;
  onLogout: () => void;
  onOpenSystemDiagnostics?: () => void;
  onBackToDashboard?: () => void;
  onOpenAcademicPortal?: () => void;
  onTabChange?: (tab: AdminTab) => void;
  onImpersonate?: (targetRole: 'student' | 'teacher') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAccount,
  initialTab = 'analytics',
  onLogout,
  onOpenSystemDiagnostics,
  onBackToDashboard,
  onOpenAcademicPortal,
  onTabChange,
  onImpersonate,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [certViewSubTab, setCertViewSubTab] = useState<'editor' | 'records'>('editor');
  const [isBrandEditorOpen, setIsBrandEditorOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
      if (initialTab === 'certificate_editor') {
        setCertViewSubTab('editor');
      }
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Firestore collections state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [teacherSubTab, setTeacherSubTab] = useState<'applications' | 'registered'>('applications');
  const [teacherForAcceptanceModal, setTeacherForAcceptanceModal] = useState<TeacherApplication | null>(null);
  const [isRejectingTeacherId, setIsRejectingTeacherId] = useState<string | null>(null);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [halqasList, setHalqasList] = useState<HalqaGroupItem[]>([]);
  const [plansList, setPlansList] = useState<MemorizationPlanItem[]>([]);
  const [certificatesList, setCertificatesList] = useState<CertificateItem[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionItem[]>([]);
  const [monthlyContributions, setMonthlyContributions] = useState<MonthlyContributionItem[]>([]);
  const [complaintsList, setComplaintsList] = useState<ComplaintTicketItem[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);

  // User Status Confirmation Modal State
  const [statusModalUser, setStatusModalUser] = useState<TargetAccountUser | null>(null);
  const [statusModalTargetStatus, setStatusModalTargetStatus] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);

  // Manual User Creation Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserRole, setAddUserRole] = useState<'student' | 'teacher'>('student');

  // Content & Features Management State
  const [contentFeatures, setContentFeatures] = useState<ContentFeatureItem[]>([]);
  const [contentFilterCategory, setContentFilterCategory] = useState<string>('all');
  const [editingFeature, setEditingFeature] = useState<ContentFeatureItem | null>(null);
  const [editFeatureTitle, setEditFeatureTitle] = useState('');
  const [editFeatureDescription, setEditFeatureDescription] = useState('');
  const [editFeatureNotes, setEditFeatureNotes] = useState('');
  const [isTogglingFeatureId, setIsTogglingFeatureId] = useState<string | null>(null);
  const [isSavingFeatureEdit, setIsSavingFeatureEdit] = useState(false);

  // Impersonation Modal State
  const [impersonateTargetModal, setImpersonateTargetModal] = useState<'student' | 'teacher' | null>(null);

  // Real Audit Logs State
  const [realAuditLogs, setRealAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // Modals state
  const [isAddHalqaOpen, setIsAddHalqaOpen] = useState(false);
  const [selectedHalqaPreset, setSelectedHalqaPreset] = useState<string>('');
  const [newHalqaClassification, setNewHalqaClassification] = useState<HalqaClassificationId>('hifz');
  const [newHalqaTitle, setNewHalqaTitle] = useState('');
  const [newHalqaType, setNewHalqaType] = useState('حلقة حفظ القرآن الكريم');
  const [newHalqaTeacher, setNewHalqaTeacher] = useState('');
  const [newHalqaTeacherId, setNewHalqaTeacherId] = useState('');
  const [newHalqaTime, setNewHalqaTime] = useState('5:00 ص - 6:30 ص');
  const [newHalqaSection, setNewHalqaSection] = useState<'male' | 'female'>('male');
  const [newHalqaWhatsappUrl, setNewHalqaWhatsappUrl] = useState('');
  const [newHalqaMeetUrl, setNewHalqaMeetUrl] = useState('');
  const [newHalqaMaxCapacity, setNewHalqaMaxCapacity] = useState(20);

  // Editing Halqa State
  const [editingHalqa, setEditingHalqa] = useState<HalqaGroupItem | null>(null);
  const [selectedEditHalqaPreset, setSelectedEditHalqaPreset] = useState<string>('');
  const [editHalqaClassification, setEditHalqaClassification] = useState<HalqaClassificationId>('hifz');
  const [editHalqaTitle, setEditHalqaTitle] = useState('');
  const [editHalqaType, setEditHalqaType] = useState('حلقة حفظ القرآن الكريم');
  const [editHalqaTeacher, setEditHalqaTeacher] = useState('');
  const [editHalqaTime, setEditHalqaTime] = useState('');
  const [editHalqaWhatsappUrl, setEditHalqaWhatsappUrl] = useState('');
  const [editHalqaMeetUrl, setEditHalqaMeetUrl] = useState('');
  const [isSavingHalqaEdit, setIsSavingHalqaEdit] = useState(false);

  // Halqa Classification Filter State (لتنظيم الحلقات للمعلمين والمشرفين)
  const [halqaFilterClassification, setHalqaFilterClassification] = useState<'all' | HalqaClassificationId>('all');
  const [halqaFilterSection, setHalqaFilterSection] = useState<'all' | 'male' | 'female'>('all');

  // Global Contribution Settings State (صلاحيات المشرف العام)
  const [globalContributionSettings, setGlobalContributionSettings] = useState<GlobalContributionSettings>({
    defaultMonthlyAmount: 3000,
    currency: 'ريال يمني',
    allowCustomAmount: true,
    minAmount: 1000,
    notes: 'المساهمة الشهرية المقترحة لدعم حلقات التحفيظ ورواتب المعلمين والمعلمات'
  });
  const [isEditingGlobalAmount, setIsEditingGlobalAmount] = useState(false);
  const [newGlobalAmount, setNewGlobalAmount] = useState<number>(3000);
  const [newGlobalCurrency, setNewGlobalCurrency] = useState<string>('ريال يمني');
  const [newGlobalNotes, setNewGlobalNotes] = useState<string>('');
  const [isSavingGlobalAmount, setIsSavingGlobalAmount] = useState(false);

  // Edit Student Contribution Amount Modal State (تعديل مساهمة طالب معين)
  const [editingContributionRecord, setEditingContributionRecord] = useState<MonthlyContributionItem | null>(null);
  const [editContributionAmount, setEditContributionAmount] = useState<number>(3000);
  const [editContributionNotes, setEditContributionNotes] = useState<string>('');
  const [isSavingRecordAmount, setIsSavingRecordAmount] = useState(false);

  // Edit Subscription Amount State
  const [editingSubscriptionItem, setEditingSubscriptionItem] = useState<SubscriptionItem | null>(null);
  const [editSubscriptionAmount, setEditSubscriptionAmount] = useState<number>(3000);
  const [isSavingSubAmount, setIsSavingSubAmount] = useState(false);

  // Google Meet modal state
  const [isGoogleMeetModalOpen, setIsGoogleMeetModalOpen] = useState(false);
  const [targetMeetHalqa, setTargetMeetHalqa] = useState<HalqaGroupItem | null>(null);
  const [meetModalMode, setMeetModalMode] = useState<'create' | 'edit' | 'standalone'>('standalone');

  // نافذة تقرير سير عمل المقرأة وطلب الدعم التشغيلي (PDF)
  const [isSupportReportModalOpen, setIsSupportReportModalOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    syncBrandSettingsFromServer().then(s => {
      if (s) setBrandSettings(s);
    }).catch(() => {});
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  // Assign Student to Halqa & Teacher State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningStudent, setAssigningStudent] = useState<any | null>(null);
  const [assignHalqaId, setAssignHalqaId] = useState('');
  const [assignHalqaTitle, setAssignHalqaTitle] = useState('');
  const [assignTeacherName, setAssignTeacherName] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignHalqaSchedule, setAssignHalqaSchedule] = useState('');
  const [assignWhatsappUrl, setAssignWhatsappUrl] = useState('');
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  // Transfer Student to another Halqa State
  const [transferringStudent, setTransferringStudent] = useState<any | null>(null);
  const [transferTargetHalqaId, setTransferTargetHalqaId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const [isIssueCertOpen, setIsIssueCertOpen] = useState(false);
  const [certStudentName, setCertStudentName] = useState('');
  const [certCourseTitle, setCertCourseTitle] = useState('إتقان أحكام التجويد والرواية بالسند');
  const [certTeacherName, setCertTeacherName] = useState('د. علي عزيزي');
  const [certRiwayah, setCertRiwayah] = useState('حفص عن عاصم');

  // Student Applications & Registration Review State
  const [studentApplications, setStudentApplications] = useState<StudentApplicationItem[]>([]);
  const [studentSubTab, setStudentSubTab] = useState<'applications' | 'registered' | 'auth_sync'>('applications');
  const [appForSetupModal, setAppForSetupModal] = useState<StudentApplicationItem | null>(null);
  const [selectedAppForApproval, setSelectedAppForApproval] = useState<{
    app: StudentApplicationItem;
    result?: WhatsAppMessageResult;
    academicId?: string;
  } | null>(null);
  const [selectedAppForRejection, setSelectedAppForRejection] = useState<StudentApplicationItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isApprovingAppId, setIsApprovingAppId] = useState<string | null>(null);
  const [isRejectingAppId, setIsRejectingAppId] = useState<string | null>(null);
  const [copiedWaMsg, setCopiedWaMsg] = useState(false);
  const [appFilterStatus, setAppFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [appFilterSection, setAppFilterSection] = useState<'all' | 'male' | 'female'>('all');
  const [appViewMode, setAppViewMode] = useState<'table' | 'cards'>('table');

  // إرسال تعليمات الدخول المعتمدة عبر WhatsApp للطالب المقبول
  const handleSendWhatsAppAdmissionInstructions = (app: StudentApplicationItem) => {
    const loginIdentifier = (app.email && !app.email.includes('@student.rehabquran.com'))
      ? app.email
      : (app.phone || app.whatsapp || app.email || app.academicId || '');

    const loginUrl = `${window.location.origin}/login`;
    const msg = buildStudentAdmissionWhatsAppInstructions({
      username: loginIdentifier,
      halqaTitle: (app as any).assignedHalqaTitle || app.studyType || 'حلقة القرآن الكريم وتجويده',
      teacherName: (app as any).teacherName || 'الشيخ المكلف بالحلقة',
      halqaDays: (app as any).halqaDays || 'الأيام المعتمدة للحلقة',
      halqaTime: (app as any).halqaTime || app.preferredTime || 'الموعد المعتمد',
      loginUrl,
      googleMeetUrl: app.googleMeetUrl,
      whatsappGroupUrl: app.whatsappGroupUrl,
    });

    const v = validateAndCleanWhatsAppNumber(app.whatsapp || app.phone, app.country);
    if (v.isValid) {
      window.open(`https://wa.me/${v.cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedAppForApproval({
        app,
        academicId: app.academicId,
        result: {
          sentViaApi: false,
          whatsappUrl: '',
          messageText: msg,
          cleanPhone: v.cleanPhone,
          formattedDisplay: v.formattedDisplay,
          isValid: false,
          error: v.error,
        }
      });
    }
  };

  // تحميل بيانات لوحة الإدارة مرة واحدة عند فتح البوابة بدلاً من إعادة جلب 12 مجموعة عند كل تبويب
  useEffect(() => {
    loadAdminData();
  }, [currentAccount.id]);

  // الاستماع لحدث تحديث البيانات الإدارية عند إضافة طالب أو معلم من أي مكان
  useEffect(() => {
    const handleAdminRefresh = () => {
      loadAdminData(true);
    };
    window.addEventListener('rehab_admin_data_refresh', handleAdminRefresh);
    return () => {
      window.removeEventListener('rehab_admin_data_refresh', handleAdminRefresh);
    };
  }, []);

  // إعادة ضبط الترقيم والبحث فقط عند تبديل التبويبات دون استهلاك قراءات Firestore
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeTab]);

  const loadAdminData = async (forceRefresh = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentPage(1);

    try {
      // 1. Users
      const usersRes = await fetchCollectionItems<any>('users', { limitCount: 30 });
      if (usersRes.data) {
        setUsersList(usersRes.data);
      } else {
        setUsersList([]);
      }

      // 2. Teachers & Teacher Applications
      try {
        const teachersData = await fetchTeacherApplicationsFromFirestore();
        if (teachersData && teachersData.length > 0) {
          setTeachersList(teachersData);
        } else {
          const teachersRes = await fetchCollectionItems<any>('teachers', { limitCount: 50 });
          setTeachersList(teachersRes.data || []);
        }
      } catch {
        const teachersRes = await fetchCollectionItems<any>('teachers', { limitCount: 50 });
        setTeachersList(teachersRes.data || []);
      }

      // 3. Students
      const stdRes = await fetchCollectionItems<any>('students', { limitCount: 30 });
      if (stdRes.data) {
        setStudentsList(stdRes.data);
      } else {
        setStudentsList([]);
      }

      // 3.1 Student Applications (استمارات التسجيل وقيد المراجعة)
      try {
        const apps = await fetchAllStudentApplications();
        setStudentApplications(apps);
      } catch (err) {
        console.warn('Failed to fetch student applications:', err);
      }

      // 4. Halqas
      const halqasRes = await fetchCollectionItems<HalqaGroupItem>('halqas', { limitCount: 20 });
      if (halqasRes.data) {
        setHalqasList(halqasRes.data);
      } else {
        setHalqasList([]);
      }

      // 5. Plans
      const plansRes = await fetchCollectionItems<MemorizationPlanItem>('plans', { limitCount: 20 });
      if (plansRes.data) {
        setPlansList(plansRes.data);
      } else {
        setPlansList([]);
      }

      // 6. Certificates
      const certRes = await fetchCollectionItems<CertificateItem>('certificates', { limitCount: 20 });
      if (certRes.data) {
        setCertificatesList(certRes.data);
      } else {
        setCertificatesList([]);
      }

      // 7. Subscriptions
      const subRes = await fetchCollectionItems<SubscriptionItem>('financialContributions', { limitCount: 20 });
      if (subRes.data) {
        setSubscriptionsList(subRes.data);
      } else {
        setSubscriptionsList([]);
      }

      // 8. Complaints
      const compRes = await fetchCollectionItems<ComplaintTicketItem>('complaints', { limitCount: 20 });
      if (compRes.data) {
        setComplaintsList(compRes.data);
      } else {
        setComplaintsList([]);
      }

      // 9. Audit Logs
      const auditRes = await fetchCollectionItems<AuditLogItem>('audit_logs', { limitCount: 25 });
      if (auditRes.data) {
        setAuditLogsList(auditRes.data);
      } else {
        setAuditLogsList([]);
      }

      // 10. Student Monthly Contributions & Global Contribution Settings
      const [monthlyRes, globalSettings] = await Promise.all([
        fetchMonthlyContributionsForAdmin(),
        getGlobalContributionSettings()
      ]);
      setMonthlyContributions(monthlyRes);
      if (globalSettings) {
        setGlobalContributionSettings(globalSettings);
        setNewGlobalAmount(globalSettings.defaultMonthlyAmount || 3000);
        setNewGlobalCurrency(globalSettings.currency || 'ريال يمني');
        setNewGlobalNotes(globalSettings.notes || '');
      }

      // 11. Content Features (إدارة المحتوى والميزات)
      const features = await fetchContentFeatures();
      setContentFeatures(features);

      // 12. Real Audit Trail
      const logs = await fetchAuditLogs();
      setRealAuditLogs(logs);
    } catch (e: any) {
      setErrorMsg('تعذر تحميل البيانات، حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Halqa Action
  const handleCreateHalqa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHalqaTitle.trim() || !newHalqaTeacher.trim()) return;

    try {
      const cleanWaUrl = newHalqaWhatsappUrl.trim() || undefined;
      const cleanMeetUrl = newHalqaMeetUrl.trim() || undefined;
      const currentClassificationConfig = HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification) || HALQA_CLASSIFICATIONS[0];
      const finalHalqaType = newHalqaType.trim() || currentClassificationConfig.defaultHalqaType;

      const res = await saveDocumentItem('halqas', null, {
        title: newHalqaTitle.trim(),
        halqaType: finalHalqaType,
        classification: newHalqaClassification,
        classificationLabel: currentClassificationConfig.singular,
        section: newHalqaSection,
        teacherName: newHalqaTeacher.trim(),
        teacherId: newHalqaTeacherId || 'tch-1',
        timeSlot: newHalqaTime,
        whatsappGroupUrl: cleanWaUrl || null,
        googleMeetUrl: cleanMeetUrl || null,
        studentsCount: 0,
        maxCapacity: newHalqaMaxCapacity,
        riwayah: 'حفص عن عاصم',
        status: 'active'
      });

      if (res.success) {
        setHalqasList(prev => [
          {
            id: res.id || 'hlq_' + Date.now(),
            title: newHalqaTitle.trim(),
            halqaType: finalHalqaType,
            classification: newHalqaClassification,
            classificationLabel: currentClassificationConfig.singular,
            section: newHalqaSection,
            teacherName: newHalqaTeacher.trim(),
            teacherId: newHalqaTeacherId || 'tch-1',
            timeSlot: newHalqaTime,
            whatsappGroupUrl: cleanWaUrl,
            googleMeetUrl: cleanMeetUrl,
            studentsCount: 0,
            maxCapacity: newHalqaMaxCapacity,
            riwayah: 'حفص عن عاصم',
            status: 'active'
          },
          ...prev
        ]);

        // Audit Trail Logging
        await recordAuditLog({
          operatorName: currentAccount.name,
          operatorEmail: currentAccount.email,
          operatorRole: 'supervisor',
          action: 'إنشاء حلقة قرآنية جديدة',
          targetItem: newHalqaTitle.trim(),
          details: `قام المشرف العام بإنشاء [${currentClassificationConfig.singular}] بعنوان [${newHalqaTitle.trim()}] (${finalHalqaType}) وتعيين المعلم [${newHalqaTeacher.trim()}].`,
          status: 'SUCCESS',
          timestamp: new Date().toLocaleTimeString('ar-SA'),
        });

        setFeedback({ type: 'success', message: `تم إنشاء [${currentClassificationConfig.singular}] وحفظها بنجاح في نظام المقرأة.` });
        setIsAddHalqaOpen(false);
        setNewHalqaTitle('');
        setNewHalqaTeacher('');
        setNewHalqaTeacherId('');
        setNewHalqaWhatsappUrl('');
        setNewHalqaMeetUrl('');
      }
    } catch {
      setFeedback({ type: 'error', message: 'فشل حفظ الحلقة الجديدة في Firestore.' });
    }
  };

  // Open Edit Halqa Modal
  const handleOpenEditHalqa = (h: HalqaGroupItem) => {
    setEditingHalqa(h);
    setEditHalqaTitle(h.title);
    const detected = detectHalqaClassification(h);
    setEditHalqaClassification(detected.id);
    setEditHalqaType(h.halqaType || detected.defaultHalqaType);
    setEditHalqaTeacher(h.teacherName);
    setEditHalqaTime(h.timeSlot);
    setEditHalqaWhatsappUrl(h.whatsappGroupUrl || '');
    setEditHalqaMeetUrl(h.googleMeetUrl || '');
  };

  // Save Edit Halqa
  const handleSaveHalqaEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHalqa || !editHalqaTitle.trim()) return;

    setIsSavingHalqaEdit(true);
    try {
      const cleanUrl = editHalqaWhatsappUrl.trim() || undefined;
      const cleanMeetUrl = editHalqaMeetUrl.trim() || undefined;
      const currentClassificationConfig = HALQA_CLASSIFICATIONS.find(c => c.id === editHalqaClassification) || HALQA_CLASSIFICATIONS[0];
      const finalType = editHalqaType.trim() || currentClassificationConfig.defaultHalqaType;

      await updateHalqaDetailsBySupervisor({
        halqaId: editingHalqa.id,
        title: editHalqaTitle.trim(),
        halqaType: finalType,
        classification: editHalqaClassification,
        teacherName: editHalqaTeacher.trim(),
        timeSlot: editHalqaTime.trim(),
        whatsappGroupUrl: cleanUrl,
        googleMeetUrl: cleanMeetUrl,
      });

      setHalqasList(prev => prev.map(h => {
        if (h.id === editingHalqa.id) {
          return {
            ...h,
            title: editHalqaTitle.trim(),
            halqaType: finalType,
            classification: editHalqaClassification,
            classificationLabel: currentClassificationConfig.singular,
            teacherName: editHalqaTeacher.trim(),
            timeSlot: editHalqaTime.trim(),
            whatsappGroupUrl: cleanUrl,
            googleMeetUrl: cleanMeetUrl,
          };
        }
        return h;
      }));

      setFeedback({ type: 'success', message: 'تم تحديث بيانات الحلقة وتصنيفها ورابط Google Meet والواتساب بنجاح.' });
      setEditingHalqa(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'فشل تحديث بيانات الحلقة.' });
    } finally {
      setIsSavingHalqaEdit(false);
    }
  };

  // Open Assign Student Modal
  const handleOpenAssignModal = (student: any) => {
    setAssigningStudent(student);
    const matchedHalqa = halqasList.find(h => h.id === student.assignedHalqaId || h.title === student.halqaTitle) || halqasList[0];
    setAssignHalqaId(matchedHalqa?.id || 'cls-m1');
    setAssignHalqaTitle(matchedHalqa?.title || student.halqaTitle || 'حلقة الفجر');
    setAssignTeacherName(matchedHalqa?.teacherName || student.teacherName || 'الشيخ إبراهيم الوصابي');
    setAssignTeacherId(matchedHalqa?.teacherId || student.teacherId || 'tch-1');
    setAssignHalqaSchedule(matchedHalqa?.timeSlot || '5:30 ص - 7:00 ص');
    setAssignWhatsappUrl(matchedHalqa?.whatsappGroupUrl || student.whatsappGroupUrl || '');
    setIsAssignModalOpen(true);
  };

  // Save Student Assignment
  const handleSaveStudentAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudent) return;

    setIsSavingAssignment(true);
    try {
      const cleanWaUrl = assignWhatsappUrl.trim() || undefined;
      const res = await assignStudentHalqaBySupervisor({
        studentId: assigningStudent.id,
        studentName: assigningStudent.name,
        teacherId: assignTeacherId || 'tch-1',
        teacherName: assignTeacherName.trim(),
        halqaId: assignHalqaId,
        halqaTitle: assignHalqaTitle.trim(),
        halqaSchedule: assignHalqaSchedule.trim(),
        whatsappGroupUrl: cleanWaUrl,
      });

      if (res.success) {
        setStudentsList(prev => prev.map(s => {
          if (s.id === assigningStudent.id) {
            return {
              ...s,
              assignedHalqaId: assignHalqaId,
              halqaTitle: assignHalqaTitle.trim(),
              teacherName: assignTeacherName.trim(),
              teacherId: assignTeacherId,
              whatsappGroupUrl: cleanWaUrl,
            };
          }
          return s;
        }));

        setFeedback({ 
          type: 'success', 
          message: `تم إسناد الطالب (${assigningStudent.name}) إلى الشيخ (${assignTeacherName}) وحلقة (${assignHalqaTitle}) بنجاح، وستنعكس في لوحة الطالب مباشرة.` 
        });
        setIsAssignModalOpen(false);
        setAssigningStudent(null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'فشل إسناد الطالب' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء حفظ الإسناد' });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  // Open Transfer Student Modal
  const handleOpenTransferModal = (student: any) => {
    setTransferringStudent(student);
    const otherHalqas = halqasList.filter(h => h.id !== student.assignedHalqaId && h.title !== student.halqaTitle);
    setTransferTargetHalqaId(otherHalqas[0]?.id || halqasList[0]?.id || '');
  };

  // Execute Student Transfer Action
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !transferTargetHalqaId) return;

    setIsTransferring(true);
    try {
      const targetHalqa = halqasList.find(h => h.id === transferTargetHalqaId);
      if (!targetHalqa) return;

      const res = await transferStudentToHalqa({
        studentId: transferringStudent.id,
        studentName: transferringStudent.name,
        newHalqaId: targetHalqa.id,
        newHalqaTitle: targetHalqa.title,
        newTeacherId: targetHalqa.teacherId || 'tch-1',
        newTeacherName: targetHalqa.teacherName,
        newSchedule: targetHalqa.timeSlot,
        whatsappGroupUrl: targetHalqa.whatsappGroupUrl || undefined,
        supervisorAdmin: { name: currentAccount.name, email: currentAccount.email },
      });

      if (res.success) {
        setStudentsList(prev => prev.map(s => {
          if (s.id === transferringStudent.id) {
            return {
              ...s,
              assignedHalqaId: targetHalqa.id,
              halqaTitle: targetHalqa.title,
              teacherName: targetHalqa.teacherName,
              teacherId: targetHalqa.teacherId,
              whatsappGroupUrl: targetHalqa.whatsappGroupUrl,
            };
          }
          return s;
        }));

        setFeedback({
          type: 'success',
          message: `تم نقل الطالب (${transferringStudent.name}) إلى حلقة (${targetHalqa.title}) وتعيين فضيلة الشيخ (${targetHalqa.teacherName}) له بنجاح، وستتحدث لوحة الطالب تلقائياً.`
        });
        setTransferringStudent(null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'فشل نقل الطالب' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء نقل الطالب' });
    } finally {
      setIsTransferring(false);
    }
  };

  // Open Confirmation Modal before toggling user status (Student, Teacher, or User)
  const handleOpenStatusModal = (user: any, role: 'student' | 'teacher' | string) => {
    const isCurrentlyActive = user.status !== 'disabled' && user.isActive !== false;
    const newStatus = !isCurrentlyActive;
    setStatusModalUser({
      id: user.id,
      name: user.name || user.fullName,
      fullName: user.fullName || user.name,
      email: user.email,
      role: (role === 'teacher' ? 'teacher' : 'student'),
      status: user.status,
      isActive: user.isActive,
    });
    setStatusModalTargetStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  // Confirm toggling account status with entered reason
  const handleConfirmToggleStatus = async (reason: string) => {
    if (!statusModalUser) return;
    setIsTogglingStatus(true);
    const user = statusModalUser;
    const role = (user.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
    const newStatus = statusModalTargetStatus;

    try {
      const res = await toggleUserAccountStatus({
        userId: user.id,
        userName: user.name || user.fullName || user.id,
        role,
        newStatus,
        supervisorAdmin: { name: currentAccount.name, email: currentAccount.email },
        reason,
      });

      if (res.success) {
        if (role === 'student') {
          setStudentsList(prev => prev.map(s => s.id === user.id ? { ...s, status: newStatus ? 'active' : 'disabled', isActive: newStatus } : s));
        } else {
          setTeachersList(prev => prev.map(t => t.id === user.id ? { ...t, status: newStatus ? 'active' : 'disabled', isActive: newStatus } : t));
        }
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus ? 'active' : 'disabled', isActive: newStatus } : u));

        setFeedback({
          type: 'success',
          message: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب (${user.name || user.fullName}) بنجاح وتوثيق السبب في السجل الأمني للرقابة.`
        });
        setIsStatusModalOpen(false);
        setStatusModalUser(null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'فشل تغيير حالة الحساب' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ أثناء تعديل حالة الحساب' });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Toggle Account Status (wraps modal opener for backward compatibility)
  const handleToggleAccount = (user: any, role: 'student' | 'teacher') => {
    handleOpenStatusModal(user, role);
  };

  // Issue Certificate Action
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certStudentName.trim()) return;

    const serial = `RQ-2026-CERT-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    try {
      const res = await saveDocumentItem('certificates', null, {
        studentName: certStudentName.trim(),
        courseTitle: certCourseTitle,
        riwayah: certRiwayah,
        sheikhTeacherName: certTeacherName,
        serialNumber: serial,
        issueDate: dateStr,
        grade: 'امتياز (100%)',
        status: 'issued'
      });

      if (res.success) {
        setCertificatesList(prev => [
          {
            id: res.id || 'cert_' + Date.now(),
            studentName: certStudentName.trim(),
            courseTitle: certCourseTitle,
            riwayah: certRiwayah,
            sheikhTeacherName: certTeacherName,
            serialNumber: serial,
            issueDate: dateStr,
            grade: 'امتياز (100%)',
            status: 'issued'
          },
          ...prev
        ]);
        setFeedback({ type: 'success', message: `تم إصدار الشهادة بالختم الرسمي بنجاح للطالب (${certStudentName}).` });
        setIsIssueCertOpen(false);
        setCertStudentName('');
      }
    } catch {
      setFeedback({ type: 'error', message: 'فشل إصدار الشهادة في قاعدة البيانات.' });
    }
  };

  // Confirm monthly payment by admin
  const handleConfirmMonthlyPayment = async (id: string, studentName: string, monthLabel: string) => {
    try {
      const res = await confirmMonthlyContributionByAdmin(id, currentAccount.id, currentAccount.name);
      if (res.success) {
        setMonthlyContributions(prev => prev.map(m => m.id === id ? { 
          ...m, 
          status: 'paid', 
          confirmedByAdminId: currentAccount.id,
          confirmedByAdminName: currentAccount.name, 
          confirmedAt: new Date().toISOString(),
          paidAt: new Date().toISOString()
        } : m));
        setFeedback({ 
          type: 'success', 
          message: `تم اعتماد وتأكيد سداد المساهمة الشهرية بنجاح للطالب (${studentName}) لشهر (${monthLabel}).` 
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'تعذر تأكيد السداد' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'خطأ أثناء تأكيد السداد' });
    }
  };

  // دوال صلاحيات المشرف العام لتعديل مبلغ المساهمة
  const handleSaveGlobalContributionAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGlobalAmount(true);
    const res = await saveGlobalContributionSettings({
      defaultMonthlyAmount: Number(newGlobalAmount),
      currency: newGlobalCurrency,
      notes: newGlobalNotes.trim()
    }, currentAccount.name || 'المشرف العام');

    setIsSavingGlobalAmount(false);
    if (res.success && res.data) {
      setGlobalContributionSettings(res.data);
      setIsEditingGlobalAmount(false);
      setFeedback({
        type: 'success',
        message: `تم تحديث مبلغ المساهمة الشهرية المعتمد إلى (${Number(newGlobalAmount).toLocaleString()} ${newGlobalCurrency}) بنجاح.`
      });
      await recordAuditLog({
        operatorName: currentAccount.name,
        operatorEmail: currentAccount.email,
        operatorRole: 'supervisor',
        action: 'تعديل مبلغ المساهمة الشهرية المعتمد',
        targetItem: `${newGlobalAmount} ${newGlobalCurrency}`,
        details: `قام المشرف العام بتعديل المبلغ المعتمد للمساهمة إلى [${newGlobalAmount} ${newGlobalCurrency}].`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'تعذر حفظ تعديل مبلغ المساهمة'
      });
    }
  };

  const handleOpenEditRecordAmount = (item: MonthlyContributionItem) => {
    setEditingContributionRecord(item);
    setEditContributionAmount(item.amount || globalContributionSettings.defaultMonthlyAmount || 3000);
    setEditContributionNotes(item.adminNotes || '');
  };

  const handleSaveRecordAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContributionRecord) return;
    setIsSavingRecordAmount(true);

    const res = await updateMonthlyContributionAmount(
      editingContributionRecord.id,
      Number(editContributionAmount),
      currentAccount.name || 'المشرف العام',
      editContributionNotes.trim()
    );

    setIsSavingRecordAmount(false);
    if (res.success) {
      setMonthlyContributions(prev => prev.map(item => 
        item.id === editingContributionRecord.id 
          ? { 
              ...item, 
              amount: Number(editContributionAmount), 
              amountModifiedByAdminName: currentAccount.name || 'المشرف العام',
              amountModifiedAt: new Date().toISOString(),
              adminNotes: editContributionNotes.trim() || undefined
            } 
          : item
      ));
      const targetStudent = editingContributionRecord.studentName;
      const targetMonth = editingContributionRecord.monthLabel || editingContributionRecord.month;
      setEditingContributionRecord(null);
      setFeedback({
        type: 'success',
        message: `تم تعديل مبلغ المساهمة للطالب (${targetStudent}) بنجاح إلى (${Number(editContributionAmount).toLocaleString()} ${editingContributionRecord.currency || 'ريال يمني'}).`
      });
      await recordAuditLog({
        operatorName: currentAccount.name,
        operatorEmail: currentAccount.email,
        operatorRole: 'supervisor',
        action: 'تعديل مبلغ مساهمة طالب',
        targetItem: targetStudent,
        details: `قام المشرف العام بتعديل مبلغ مساهمة الطالب [${targetStudent}] لشهر [${targetMonth}] إلى [${editContributionAmount}].`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString('ar-SA'),
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'تعذر تعديل مبلغ مساهمة الطالب'
      });
    }
  };

  const handleOpenEditSubscriptionAmount = (sub: SubscriptionItem) => {
    setEditingSubscriptionItem(sub);
    setEditSubscriptionAmount(sub.amount || 3000);
  };

  const handleSaveSubscriptionAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscriptionItem) return;
    setIsSavingSubAmount(true);

    const res = await updateSubscriptionAmount(
      editingSubscriptionItem.id,
      Number(editSubscriptionAmount),
      currentAccount.name || 'المشرف العام'
    );

    setIsSavingSubAmount(false);
    if (res.success) {
      setSubscriptionsList(prev => prev.map(item =>
        item.id === editingSubscriptionItem.id
          ? { ...item, amount: Number(editSubscriptionAmount) }
          : item
      ));
      setEditingSubscriptionItem(null);
      setFeedback({
        type: 'success',
        message: `تم تعديل مبلغ الاشتراك للمساهم (${editingSubscriptionItem.subscriberName}) بنجاح إلى (${Number(editSubscriptionAmount).toLocaleString()} ${editingSubscriptionItem.currency}).`
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'تعذر تعديل مبلغ الاشتراك'
      });
    }
  };

  // Toggle user active status (wraps modal opener)
  const handleToggleUserStatus = (user: any) => {
    handleOpenStatusModal(user, user.role || 'student');
  };

  // 1. معالجة قبول طلب تسجيل الطالب وإنشاء الرقم الأكاديمي وحساب Firebase وتجهيز رسالة واتساب
  const handleApproveApplication = async (app: StudentApplicationItem) => {
    setIsApprovingAppId(app.id);
    try {
      const res = await approveStudentApplication({
        applicationId: app.id,
        adminName: currentAccount.name || 'إدارة المقرأة',
        application: app,
      });

      if (res.success) {
        // تحديث القائمة المحلية فوراً
        setStudentApplications(prev => prev.map(a => a.id === app.id ? {
          ...a,
          status: 'approved',
          academicId: res.academicId,
          approvedAt: new Date().toISOString(),
          approvedBy: currentAccount.name,
        } : a));

        // إضافة الطالب إلى قائمة الطلاب المعتمدين النشطين
        setStudentsList(prev => [
          {
            id: `std-${app.id.replace(/^app-/, '')}`,
            name: app.fullName,
            section: app.gender,
            memorization: app.memorization,
            halqaTitle: app.gender === 'female' ? 'حلقة قسم الطالبات (الفجر)' : 'حلقة قسم الطلاب (الفجر)',
            status: 'active',
            registeredAt: app.registeredAt || new Date().toLocaleDateString('ar-SA'),
          },
          ...prev,
        ]);

        setSelectedAppForApproval({
          app,
          result: res.whatsAppResult,
          academicId: res.academicId,
        });

        setFeedback({
          type: 'success',
          message: `تم قبول الطالب (${app.fullName}) بنجاح! تم إنشاء الرقم الأكاديمي (${res.academicId}) وتجهيز رسالة واتساب.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'تعذر إتمام قبول الطلب' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ غير متوقع أثناء القبول' });
    } finally {
      setIsApprovingAppId(null);
    }
  };

  // 2. فتح نافذة الرفض وإدخال سبب الرفض
  const handleOpenRejectModal = (app: StudentApplicationItem) => {
    setSelectedAppForRejection(app);
    setRejectionReasonInput('نعتذر لعدم توفر شواغر في الفترة الزمنية المحددة حالياً');
  };

  // 3. تأكيد الرفض وحفظ السبب وتجهيز رسالة واتساب
  const handleConfirmRejection = async () => {
    if (!selectedAppForRejection) return;
    const app = selectedAppForRejection;
    const reason = rejectionReasonInput.trim() || 'نعتذر لعدم استيفاء شروط القبول بالوقت الراهن';

    setIsRejectingAppId(app.id);
    try {
      const res = await rejectStudentApplication({
        applicationId: app.id,
        adminName: currentAccount.name || 'إدارة المقرأة',
        reason,
        application: app,
      });

      if (res.success) {
        setStudentApplications(prev => prev.map(a => a.id === app.id ? {
          ...a,
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: currentAccount.name,
        } : a));

        setSelectedAppForRejection(null);
        setSelectedAppForApproval({
          app: { ...app, rejectionReason: reason },
          result: res.whatsAppResult,
        });

        setFeedback({
          type: 'success',
          message: `تم تسجيل رفض طلب الطالب (${app.fullName}) وحفظ السبب وتجهيز رسالة واتساب.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'تعذر تسجيل الرفض' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'حدث خطأ أثناء تسجيل الرفض' });
    } finally {
      setIsRejectingAppId(null);
    }
  };

  // 4. نسخ رسالة الواتساب إلى الحافظة
  const handleCopyWhatsAppMessage = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedWaMsg(true);
      setTimeout(() => setCopiedWaMsg(false), 2500);
    }
  };

  // 4.b رفض طلب المعلم
  const handleRejectTeacher = async (teacher: any) => {
    const teacherId = teacher.uid || teacher.id;
    const teacherName = teacher.name || teacher.fullName || 'المعلم';
    if (!window.confirm(`هل أنت متأكد من رفض طلب المعلم (${teacherName})؟`)) {
      return;
    }
    setIsRejectingTeacherId(teacherId);
    try {
      const res = await rejectTeacherApplicationInFirestore(
        teacherId,
        teacherName,
        currentAccount.name || 'المشرف العام',
        'عدم توفر شواغر في الوقت الحالي'
      );
      if (res.success) {
        setTeachersList(prev => prev.map(t => (t.id === teacherId || t.uid === teacherId) ? { ...t, status: 'rejected' } : t));
        setFeedback({
          type: 'success',
          message: `تم رفض طلب المعلم (${teacherName}) وتحديث حالته في النظام.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'فشل رفض الطلب.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'حدث خطأ أثناء رفض الطلب.'
      });
    } finally {
      setIsRejectingTeacherId(null);
    }
  };

  // 5. تبديل حالة الميزة (إخفاء / إظهار دون حذف)
  const handleToggleFeature = async (feature: ContentFeatureItem) => {
    setIsTogglingFeatureId(feature.id);
    const newStatus = feature.status === 'visible' ? 'hidden' : 'visible';
    try {
      await toggleFeatureVisibility(feature.id, newStatus, {
        name: currentAccount.name || 'المشرف الرئيسي',
        email: currentAccount.email || 'aliazize101@gmail.com',
      });
      setContentFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, status: newStatus } : f));
      setFeedback({
        type: 'success',
        message: `تم ${newStatus === 'hidden' ? 'إخفاء' : 'إظهار'} [${feature.title}] وتوثيق العملية في سجل الرقابة سحابياً.`,
      });
      const updatedLogs = await fetchAuditLogs();
      setRealAuditLogs(updatedLogs);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'تعذر تغيير حالة ظهور الميزة' });
    } finally {
      setIsTogglingFeatureId(null);
    }
  };

  // 6. فتح نافذة تعديل الميزة
  const handleOpenEditFeature = (feature: ContentFeatureItem) => {
    setEditingFeature(feature);
    setEditFeatureTitle(feature.title);
    setEditFeatureDescription(feature.description);
    setEditFeatureNotes(feature.notes || '');
  };

  // 7. حفظ تعديلات الميزة
  const handleSaveFeatureContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;

    setIsSavingFeatureEdit(true);
    try {
      await updateFeatureContent(editingFeature.id, {
        title: editFeatureTitle.trim(),
        description: editFeatureDescription.trim(),
        notes: editFeatureNotes.trim(),
      }, {
        name: currentAccount.name || 'المشرف الرئيسي',
        email: currentAccount.email || 'aliazize101@gmail.com',
      });

      setContentFeatures(prev => prev.map(f => f.id === editingFeature.id ? {
        ...f,
        title: editFeatureTitle.trim(),
        description: editFeatureDescription.trim(),
        notes: editFeatureNotes.trim(),
      } : f));

      setEditingFeature(null);
      setFeedback({
        type: 'success',
        message: `تم حفظ تعديلات [${editFeatureTitle}] وتوثيقها في سجل الرقابة بنجاح.`,
      });

      const updatedLogs = await fetchAuditLogs();
      setRealAuditLogs(updatedLogs);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'تعذر حفظ تعديلات المحتوى' });
    } finally {
      setIsSavingFeatureEdit(false);
    }
  };

  // 8. المعاينة الإدارية (Impersonation)
  const handleStartImpersonate = (role: 'student' | 'teacher') => {
    setImpersonateTargetModal(role);
  };

  const handleConfirmImpersonate = () => {
    if (!impersonateTargetModal) return;
    const target = impersonateTargetModal;
    setImpersonateTargetModal(null);
    if (onImpersonate) {
      onImpersonate(target);
    }
  };

  return (
    <div className="w-full text-[#2C3531] font-sans text-right" dir="rtl">
      {/* 1. شريط التنبيهات والأخطاء */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 w-full">
        <FeedbackBanner 
          type={feedback?.type || 'info'} 
          message={feedback?.message || null} 
          onClose={() => setFeedback(null)} 
        />
        {errorMsg && <ErrorState message={errorMsg} onRetry={loadAdminData} />}
      </div>

      {/* 2. شريط التنقل السريع وزر الخطوط الثلاثة (القائمة الإدارية) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1 w-full">
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 justify-between">
          {/* زر الخطوط الذي يفتح القائمة الإدارية المنسدلة */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                isMenuDropdownOpen
                  ? 'bg-[#046A38] text-white border-[#046A38]'
                  : 'bg-[#F9F6F0] text-[#046A38] border-[#C5A059] hover:bg-[#C5A059]/20'
              }`}
              title="عرض قائمة الأقسام واللوحات الإدارية وخيارات الإضافة"
              aria-label="القائمة الإدارية"
            >
              <Menu className={`w-5 h-5 ${isMenuDropdownOpen ? 'text-white' : 'text-[#046A38]'}`} />
              <span className="font-serif font-bold text-xs sm:text-sm">القائمة الإدارية</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* القائمة المنسدلة عند الضغط على الخطوط */}
            {isMenuDropdownOpen && (
              <>
                {/* خلفية معتمة للنقر خارج القائمة لإغلاقها بسلاسة */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs" 
                  onClick={() => setIsMenuDropdownOpen(false)} 
                />
                <div 
                  className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-white rounded-2xl border-2 border-[#C5A059] shadow-2xl z-50 p-2.5 space-y-1.5 animate-scale-up"
                  dir="rtl"
                >
                  <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#046A38]/10 text-[#046A38] flex items-center justify-center font-bold">
                        <Menu className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-[#046A38] font-serif">أقسام ولوحات المشرف العام</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsMenuDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="إغلاق القائمة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* خيارات الإضافة اليدوية في القائمة المنسدلة */}
                  <div className="p-2.5 bg-gradient-to-r from-emerald-50 via-[#F9F6F0] to-amber-50 rounded-xl border border-[#C5A059]/40 mb-1 space-y-2">
                    <span className="text-[11px] font-bold text-[#046A38] block px-0.5 font-serif">✨ خيارات الإضافة اليدوية المباشرة:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAddUserRole('student');
                          setIsAddUserModalOpen(true);
                          setIsMenuDropdownOpen(false);
                        }}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 hover:border-[#046A38] text-[#046A38] font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="إضافة حساب طالب جديد يدويًا"
                      >
                        <UserPlus className="w-4 h-4 text-[#046A38]" />
                        <span>إضافة طالب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddUserRole('teacher');
                          setIsAddUserModalOpen(true);
                          setIsMenuDropdownOpen(false);
                        }}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-[#C5A059] hover:bg-amber-50 hover:border-[#046A38] text-amber-950 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="إضافة حساب معلم جديد يدويًا"
                      >
                        <GraduationCap className="w-4 h-4 text-[#046A38]" />
                        <span>إضافة معلم</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMeetModalMode('standalone');
                        setTargetMeetHalqa(null);
                        setIsGoogleMeetModalOpen(true);
                        setIsMenuDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#046A38] text-white font-bold text-xs shadow-xs hover:from-emerald-700 hover:to-[#03542c] transition-all cursor-pointer border border-[#C5A059] active:scale-95"
                      title="فتح نافذة إنشاء وإدارة قاعات Google Meet الرسمية"
                    >
                      <Video className="w-4 h-4 text-amber-300" />
                      <span>قاعات Google Meet المباشرة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSupportReportModalOpen(true);
                        setIsMenuDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:from-[#d5b069] hover:to-amber-400 transition-all cursor-pointer border border-[#C5A059] active:scale-95"
                      title="تنزيل تقرير سير عمل المقرأة وجلسات التسميع وطلب دعم تشغيلي من الجمعيات والمؤسسات"
                    >
                      <FileText className="w-4 h-4 text-slate-950" />
                      <span>تقرير سير العمل والدعم التشغيلي PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('brand_assets');
                        setIsMenuDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-200 active:scale-95"
                      title="التحكم في إظهار أو إخفاء صفة عضو التجمع العالمي للقرآن الكريم من الواجهات"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#046A38]" />
                        <span>شارة عضوية التجمع العالمي</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                        إظهار / إخفاء
                      </span>
                    </button>
                  </div>

                <div className="max-h-80 overflow-y-auto space-y-1 p-1">
                  {ADMIN_PORTAL_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          onTabChange?.(tab.id);
                          setIsMenuDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#046A38] text-white shadow-2xs'
                            : 'text-slate-700 hover:bg-[#F9F6F0] hover:text-[#046A38]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

          {/* شريط الألسنة الأفقي للتنقل السريع بين الأقسام */}
          <div className="flex-1 overflow-x-auto flex items-center gap-1.5 scrollbar-thin py-0.5 px-1">
            {ADMIN_PORTAL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    onTabChange?.(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#046A38] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#F9F6F0] hover:text-[#046A38]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* زر تنزيل تقرير سير عمل المقرأة وطلب الدعم التشغيلي PDF */}
          <button
            type="button"
            onClick={() => setIsSupportReportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-[#dfbe75] text-slate-950 font-bold text-xs font-serif shadow-xs cursor-pointer transition-all flex items-center gap-1.5 border border-[#C5A059] active:scale-95 shrink-0"
            title="تنزيل تقرير سير عمل المقرأة وجلسات التسميع وطلب دعم تشغيلي من الجمعيات والمؤسسات"
          >
            <FileText className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">تقرير سير العمل ودعم تشغيلي PDF</span>
            <span className="sm:hidden">تقرير PDF</span>
          </button>
        </div>
      </div>

      {/* 3. جسم المحتوى لصفحات الإدارة الـ 11 */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full space-y-6">
        {isLoading ? (
          <LoadingState message="جاري استدعاء البيانات الإدارية وسجلات Firestore..." />
        ) : (
          <>
            {/* ======================================================== */}
            {/* 1. لوحة الإحصاءات (ANALYTICS)                             */}
            {/* ======================================================== */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-[#046A38] to-[#065A31] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#C5A059]">لوحة المؤشرات التشغيلية</span>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif">
                      إحصاءات منظومة مقرأة رحاب القرآن الإلكترونية 2026
                    </h2>
                    <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                      نظام سحابي لحظي مربوط بـ Cloud Firestore لمتابعة حضور الحلقات ومعدلات الختم والمساهمات.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsSupportReportModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-[#dfbe75] text-slate-950 font-bold text-xs font-serif shadow-sm cursor-pointer transition-all flex items-center gap-2 border border-white/20 active:scale-95"
                      title="فتح نافذة وتنزيل تقرير سير عمل المقرأة والدعم التشغيلي بصيغة PDF"
                    >
                      <FileText className="w-4 h-4 text-slate-950" />
                      <span>تنزيل تقرير سير العمل والدعم التشغيلي PDF</span>
                    </button>
                    <img
                      src={brandSettings.customSealUrl || '/brand/official-seal.png'}
                      crossOrigin="anonymous"
                      alt="الختم الرسمي"
                      className="w-16 h-16 object-contain shrink-0"
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                          e.currentTarget.src = '/brand/official-seal.png';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* بطاقة المعاينة والاختبار الإداري (الدخول كطالب / كمعلم) */}
                <div className="bg-gradient-to-l from-slate-900 via-[#046A38] to-slate-900 rounded-3xl p-6 text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="space-y-1.5 text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-300" />
                      <h3 className="font-bold font-serif text-base text-[#f7e8c6]">
                        المعاينة والاختبار الإداري (الدخول كطالب / كمعلم)
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                      تتيح للمشرف الرئيسي فتح لوحة الطالب أو لوحة المعلم كمعاينة إدارية للاختبار والرقابة والتأكد من سير الحلقات دون المساس ببيانات المستخدم أو تعديل كلمة مروره، مع إمكانية العودة للوحة المشرف في أي وقت.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartImpersonate('student')}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm cursor-pointer transition-all flex items-center gap-2 border border-amber-200 active:scale-95"
                      title="فتح لوحة الطالب كجلسة معاينة واختبار إداري"
                    >
                      <GraduationCap className="w-4 h-4 text-slate-900" />
                      <span>دخول كطالب (معاينة إدارية)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartImpersonate('teacher')}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#046A38] font-bold text-xs shadow-sm cursor-pointer transition-all flex items-center gap-2 border border-[#C5A059] active:scale-95"
                      title="فتح لوحة المعلم كجلسة معاينة واختبار إداري"
                    >
                      <BookOpen className="w-4 h-4 text-[#046A38]" />
                      <span>دخول كمعلم (معاينة إدارية)</span>
                    </button>
                  </div>
                </div>

                {/* بطاقة الوصول السريع لإدارة الأصول والهوية والشهادات */}
                <div className="bg-gradient-to-l from-emerald-950 via-[#046A38] to-emerald-900 rounded-3xl p-6 text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#C5A059]" />
                      <h3 className="font-bold font-serif text-base text-[#f7e8c6]">
                        إدارة الأصول والهوية والشهادات (Firebase Storage)
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-100 max-w-xl">
                      رفع صور PNG للشعار الرسمي، الأيقونة المصغرة، الختم المعتمد، وقوالب الشهادات وتخزينها في Firebase Storage مع تحديث مسارات النظام تلقائياً.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('brand_assets')}
                      className="px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#dfbe75] text-slate-950 font-bold text-xs font-serif shadow-sm cursor-pointer transition-all flex items-center gap-2 border border-white/20"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>فتح واجهة إدارة الأصول والرفع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBrandEditorOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer border border-white/20"
                      title="فتح نافذة التعديل السريع المنبثقة"
                    >
                      <span>تعديل سريع</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-bold">إجمالي المستخدمين</span>
                    <div className="text-2xl font-black text-[#046A38] font-mono">{usersList.length}</div>
                    <span className="text-[10px] text-emerald-600 font-bold">● متصلون سحابياً</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-bold">الحلقات النشطة</span>
                    <div className="text-2xl font-black text-amber-700 font-mono">{halqasList.length}</div>
                    <span className="text-[10px] text-slate-400">بنين وبنات</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-bold">الشهادات الصادرة</span>
                    <div className="text-2xl font-black text-purple-700 font-mono">{certificatesList.length}</div>
                    <span className="text-[10px] text-purple-600 font-bold">معتمدة بالختم</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-xs text-slate-500 font-bold">البلاغات المفتوحة</span>
                    <div className="text-2xl font-black text-rose-700 font-mono">{complaintsList.filter(c => c.status === 'open').length}</div>
                    <span className="text-[10px] text-rose-600 font-bold">تتطلب معالجة</span>
                  </div>
                </div>

                {/* لوحة تحكم Recharts لإحصائيات نمو الطلاب والنشاط الأسبوعي للحلقات المباشرة */}
                <AdminAnalyticsDashboard
                  users={usersList}
                  students={studentsList}
                  studentApplications={studentApplications}
                  halqas={halqasList}
                  teachers={teachersList}
                  certificates={certificatesList}
                  onRefresh={() => loadAdminData(true)}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. إدارة المستخدمين (USERS)                               */}
            {/* ======================================================== */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">إدارة الحسابات والأدوار</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">مستخدمو النظام والصلاحيات</h2>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setAddUserRole('student');
                        setIsAddUserModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#C5A059]"
                      title="إضافة حساب طالب جديد يدويًا"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>إضافة طالب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddUserRole('teacher');
                        setIsAddUserModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="إضافة حساب معلم جديد يدويًا"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-[#046A38]" />
                      <span>إضافة معلم</span>
                    </button>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                      المستخدمون: {usersList.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                      <tr>
                        <th className="p-4">الاسم الكامل</th>
                        <th className="p-4">البريد الإلكتروني</th>
                        <th className="p-4">الدور الوظيفي</th>
                        <th className="p-4">حالة الحساب</th>
                        <th className="p-4 text-center">الإجراء الإداري</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">{u.fullName || u.name}</td>
                          <td className="p-4 font-mono text-slate-600">{u.email || '—'}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.isActive !== false ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              {u.isActive !== false ? 'نشط' : 'معطل'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {u.role === 'student' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartImpersonate('student')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
                                  title="فتح لوحة الطالب كعرض واختبار إداري دون تغيير كلمة مرور المستخدم أو بياناته"
                                >
                                  <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                                  <span>دخول كطالب</span>
                                </button>
                              )}
                              {u.role === 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartImpersonate('teacher')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-[#C5A059] transition-all cursor-pointer flex items-center gap-1"
                                  title="فتح لوحة المعلم كعرض واختبار إداري دون تغيير كلمة مرور المستخدم أو بياناته"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-[#046A38]" />
                                  <span>دخول كمعلم</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                  u.isActive !== false
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {u.isActive !== false ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. إدارة المعلمين (TEACHERS)                               */}
            {/* ======================================================== */}
            {activeTab === 'teachers' && (() => {
              const pendingTeachers = teachersList.filter(t => t.status === 'pending' || t.status === 'pending_review');
              const activeTeachers = teachersList.filter(t => t.status !== 'pending' && t.status !== 'pending_review');

              return (
                <div className="space-y-6 animate-fade-in">
                  {/* شريط رأس إدارة المعلمين */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#C5A059]">الكادر التعليمي</span>
                      <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة المعلمين وطلبات الانضمام</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        مراجعة طلبات انضمام المعلمين الجدد، اعتمادهم وتعيين الحلقات والأوقات، وإرسال تعليمات الدخول عبر الواتساب.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setAddUserRole('teacher');
                          setIsAddUserModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="إضافة حساب معلم جديد يدويًا"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>إضافة معلم يدويًا</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartImpersonate('teacher')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-[#C5A059] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="فتح لوحة المعلم كمعاينة إدارية للاختبار والرقابة دون تغيير كلمة المرور"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#046A38]" />
                        <span>دخول كمعلم (معاينة إدارية)</span>
                      </button>

                      {/* شريط التبديل بين التبويبات الفرعية للمعلمين */}
                      <div className="flex items-center gap-1 bg-[#F9F6F0] p-1.5 rounded-2xl border border-[#C5A059]/30">
                        <button
                          type="button"
                          onClick={() => setTeacherSubTab('applications')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            teacherSubTab === 'applications'
                              ? 'bg-[#046A38] text-white shadow-xs'
                              : 'text-slate-600 hover:text-[#046A38]'
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>طلبات المعلمين المعلقة</span>
                          {pendingTeachers.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                              {pendingTeachers.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeacherSubTab('registered')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            teacherSubTab === 'registered'
                              ? 'bg-[#046A38] text-white shadow-xs'
                              : 'text-slate-600 hover:text-[#046A38]'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>المعلمون المعتمدون ({activeTeachers.length})</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 1. قسم طلبات المعلمين المعلقة */}
                  {teacherSubTab === 'applications' && (
                    <div className="space-y-4">
                      {pendingTeachers.length === 0 ? (
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                            <Clock className="w-8 h-8 text-amber-600" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 font-serif">لا توجد طلبات معلمين معلقة حالياً</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                            أي طلب انضمام جديد يُقدم عبر بوابة تسجيل المعلمين (/register/teacher) سيظهر هنا مباشرة لمراجعته واعتماده وتعيين الحلقات له.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
                            <span>يوجد <strong>{pendingTeachers.length}</strong> طلب معلم بانتظار الاعتماد وتعيين الحلقات:</span>
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            {pendingTeachers.map((t) => {
                              const tId = t.uid || t.id;
                              const isRejecting = isRejectingTeacherId === tId;
                              const hasSanad = t.qualifications?.hasConnectedSanad;
                              const specialtyText = t.specialty || 'تجويد وحفظ';
                              const qualText = t.qualificationSummary || t.qualifications?.ijazat || t.qualification || 'إجازة في القرآن الكريم';
                              const expText = t.experienceYears || t.experience || 'غير محدد';

                              return (
                                <div
                                  key={tId}
                                  className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-amber-200/80 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
                                >
                                  {/* شريط حالة كهرماني جانبي */}
                                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-amber-500" />

                                  <div className="flex-1 space-y-3 pr-2">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      <div className="w-11 h-11 rounded-2xl bg-[#046A38]/10 text-[#046A38] border border-[#C5A059]/40 flex items-center justify-center font-bold text-base shrink-0">
                                        <GraduationCap className="w-6 h-6 text-[#046A38]" />
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-base text-slate-900 font-serif flex items-center gap-2">
                                          <span>{t.name || t.fullName}</span>
                                          <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                            طلب معلق
                                          </span>
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                                          <span className="font-mono text-slate-700" dir="ltr">{t.email}</span>
                                          {(t.phone || t.whatsapp) && (
                                            <>
                                              <span>•</span>
                                              <a
                                                href={`https://wa.me/${(t.phone || t.whatsapp).replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-emerald-700 font-mono font-bold hover:underline flex items-center gap-1"
                                                dir="ltr"
                                              >
                                                <Phone className="w-3 h-3" />
                                                <span>{t.phone || t.whatsapp}</span>
                                              </a>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* بطاقة تفاصيل المؤهلات والتخصص والخبرة */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                                      {/* المؤهلات والإجازات */}
                                      <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/30 space-y-1">
                                        <span className="text-[11px] font-bold text-[#046A38] block flex items-center gap-1">
                                          <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                                          <span>المؤهلات والإجازات:</span>
                                        </span>
                                        <p className="text-slate-800 font-medium leading-relaxed">
                                          {qualText}
                                        </p>
                                        {hasSanad && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
                                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                            <span>سند متصل معتمد</span>
                                          </span>
                                        )}
                                      </div>

                                      {/* التخصص الإقرائي */}
                                      <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/30 space-y-1">
                                        <span className="text-[11px] font-bold text-[#046A38] block flex items-center gap-1">
                                          <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                                          <span>التخصص القرآني:</span>
                                        </span>
                                        <p className="text-slate-800 font-bold leading-relaxed">
                                          {specialtyText}
                                        </p>
                                        <span className="text-[11px] text-slate-500 block">
                                          القسم: {t.targetSection === 'female' ? 'قسم الطالبات' : t.targetSection === 'male' ? 'قسم الطلاب' : 'كلا القسمين'}
                                        </span>
                                      </div>

                                      {/* سنوات وخبرة التدريس */}
                                      <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/30 space-y-1">
                                        <span className="text-[11px] font-bold text-[#046A38] block flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                                          <span>الخبرة التدريسية:</span>
                                        </span>
                                        <p className="text-slate-800 font-medium">
                                          <strong>{expText}</strong> سنوات
                                        </p>
                                        {t.experienceDetails && (
                                          <p className="text-[11px] text-slate-500 truncate" title={t.experienceDetails}>
                                            {t.experienceDetails}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* نبذة تعريفية إذا وجدت */}
                                    {t.bio && (
                                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                                        <strong>نبذة:</strong> {t.bio}
                                      </p>
                                    )}
                                  </div>

                                  {/* أزرار الإجراءات: قبول / رفض */}
                                  <div className="flex md:flex-col items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => setTeacherForAcceptanceModal(t)}
                                      className="flex-1 md:flex-none w-full px-5 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
                                      title="قبول المعلم وتعيين الحلقات والأوقات"
                                    >
                                      <Check className="w-4 h-4 text-[#C5A059]" />
                                      <span>قبول وتعيين الحلقات</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isRejecting}
                                      onClick={() => handleRejectTeacher(t)}
                                      className="flex-1 md:flex-none w-full px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                      title="رفض الطلب"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>{isRejecting ? 'جاري الرفض...' : 'رفض الطلب'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. قسم المعلمين المعتمدين النشطين */}
                  {teacherSubTab === 'registered' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {activeTeachers.map((t) => {
                        const tId = t.uid || t.id;
                        const halqasAssigned = t.assignedHalqaTitles && t.assignedHalqaTitles.length > 0 
                          ? t.assignedHalqaTitles.join('، ') 
                          : (t.halqaTitle || t.assignedHalqaTitle || 'حلقة القرآن الكريم');
                        const timesAssigned = t.timeSlot || (t.assignedTimes && t.assignedTimes.length > 0 ? t.assignedTimes.join(' • ') : 'بحسب الجدول المعتمد');

                        return (
                          <div key={tId} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center font-bold text-lg border border-[#C5A059]/40 shrink-0">
                                  {t.name?.charAt(0) || 'ش'}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-slate-900 font-serif truncate">{t.name || t.fullName}</h4>
                                  <span className="text-xs text-slate-500 block">
                                    {t.section === 'female' || t.targetSection === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                                {t.qualificationSummary || t.qualification || t.specialty || 'مقرئ لكتاب الله تعالى'}
                              </p>

                              {/* الحلقات والأوقات المعينة */}
                              <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/20 text-xs space-y-1">
                                <div className="text-slate-700">
                                  <strong className="text-[#046A38]">الحلقات:</strong> {halqasAssigned}
                                </div>
                                <div className="text-slate-600 text-[11px]">
                                  <strong>الأوقات:</strong> {timesAssigned}
                                </div>
                              </div>

                              <div className="text-xs text-slate-500 pt-1 flex items-center justify-between">
                                <span>البريد: <strong className="font-mono" dir="ltr">{t.email}</strong></span>
                              </div>
                            </div>

                            {/* أزرار الإجراءات والواتساب */}
                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              {/* زر إرسال رسالة واتساب بتعليمات الدخول */}
                              {(t.phone || t.whatsapp) && (
                                <a
                                  href={`https://wa.me/${(t.phone || t.whatsapp).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    buildTeacherAdmissionWhatsAppInstructions({
                                      teacherName: t.name || t.fullName,
                                      email: t.email,
                                      assignedHalqas: t.assignedHalqaTitles || [halqasAssigned],
                                      assignedTimes: timesAssigned,
                                    })
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="إرسال رسالة واتساب بتعليمات الدخول"
                                >
                                  <Send className="w-3.5 h-3.5 rotate-180 text-emerald-700" />
                                  <span>إرسال تعليمات الدخول عبر WhatsApp</span>
                                </a>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  t.status === 'disabled' || t.isActive === false || t.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-[#046A38]'
                                }`}>
                                  {t.status === 'disabled' || t.isActive === false ? 'معطل' : t.status === 'rejected' ? 'مرفوض' : 'نشط ومعتمد'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStatusModal(t, 'teacher')}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                    t.status === 'disabled' || t.isActive === false
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                >
                                  {t.status === 'disabled' || t.isActive === false ? 'تفعيل الحساب' : 'تعطيل الحساب'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* 4. إدارة الطلاب (STUDENTS)                                 */}
            {/* ======================================================== */}
            {activeTab === 'students' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header Banner */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">سجلات الانتساب واستمارات التسجيل</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة شؤون الطلاب والطلبات الجديدة</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      مراجعة استمارات التسجيل الواردة، اعتماد الطلاب وإصدار الأرقام الأكاديمية الفريدة وتجهيز رسائل واتساب.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setAddUserRole('student');
                        setIsAddUserModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title="إضافة حساب طالب جديد يدويًا"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>إضافة طالب يدويًا</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartImpersonate('student')}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="فتح لوحة الطالب كمعاينة إدارية للاختبار والرقابة دون تغيير كلمة المرور"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                      <span>دخول كطالب (معاينة إدارية)</span>
                    </button>

                    {/* Sub-tab switcher */}
                    <div className="flex items-center gap-2 bg-[#F9F6F0] p-1.5 rounded-2xl border border-[#C5A059]/30">
                      <button
                        type="button"
                        onClick={() => setStudentSubTab('applications')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          studentSubTab === 'applications'
                            ? 'bg-[#046A38] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#046A38]'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>طلبات التسجيل الجديدة</span>
                        {studentApplications.filter(a => a.status === 'pending_review' || a.status === 'pending').length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950">
                            {studentApplications.filter(a => a.status === 'pending_review' || a.status === 'pending').length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentSubTab('registered')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          studentSubTab === 'registered'
                            ? 'bg-[#046A38] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#046A38]'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>الطلاب المعتمدون ({studentsList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentSubTab('auth_sync')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          studentSubTab === 'auth_sync'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-700'
                        }`}
                        title="فحص ورقابة الطلاب المقبولين الذين لم يتم إنشاء حساب Firebase Auth لهم"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>رقابة حسابات Firebase Auth</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SubTab 1: طلبات التسجيل واستمارات المراجعة */}
                {studentSubTab === 'applications' && (
                  <div className="space-y-4">
                    {/* Filters & View Mode */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-600 ml-1">حالة الطلب:</span>
                        {[
                          { id: 'all', label: 'الكل' },
                          { id: 'pending', label: 'قيد المراجعة' },
                          { id: 'approved', label: 'المقبولون' },
                          { id: 'rejected', label: 'المرفوضون' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setAppFilterStatus(st.id as any)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                              appFilterStatus === st.id
                                ? 'bg-[#046A38] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600 ml-1">القسم:</span>
                          {[
                            { id: 'all', label: 'كلا القسمين' },
                            { id: 'male', label: 'بنين (طلاب)' },
                            { id: 'female', label: 'بنات (طالبات)' },
                          ].map((sec) => (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => setAppFilterSection(sec.id as any)}
                              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                appFilterSection === sec.id
                                  ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {sec.label}
                            </button>
                          ))}
                        </div>

                        {/* مفتاح التبديل بين الجدول والبطاقات */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setAppViewMode('table')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              appViewMode === 'table'
                                ? 'bg-white text-[#046A38] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="عرض كجدول"
                          >
                            جدول تفصيلي 📋
                          </button>
                          <button
                            type="button"
                            onClick={() => setAppViewMode('cards')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              appViewMode === 'cards'
                                ? 'bg-white text-[#046A38] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="عرض كبطاقات"
                          >
                            بطاقات 🗂️
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Applications List (Table or Cards) */}
                    {(() => {
                      const filteredApps = studentApplications.filter((app) => {
                        if (appFilterStatus === 'pending' && !(app.status === 'pending_review' || app.status === 'pending')) return false;
                        if (appFilterStatus === 'approved' && app.status !== 'approved' && app.status !== 'accepted') return false;
                        if (appFilterStatus === 'rejected' && app.status !== 'rejected') return false;
                        if (appFilterSection !== 'all' && app.gender !== appFilterSection) return false;
                        return true;
                      });

                      if (filteredApps.length === 0) {
                        return (
                          <div className="p-10 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#046A38]">
                              <UserCheck className="w-7 h-7" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 font-serif">لا توجد طلبات تسجيل مطابقة لهذا الفلتر</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              عندما يقوم الطلاب بملء استمارة التسجيل في المقرأة ستظهر طلباتهم هنا فوراً بحالة «قيد المراجعة» لاعتمادهم وإرسال بيانات الدخول عبر واتساب.
                            </p>
                          </div>
                        );
                      }

                      if (appViewMode === 'table') {
                        return (
                          <div className="overflow-x-auto bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-[#F9F6F0] border-b border-[#C5A059]/30 text-slate-700 font-bold">
                                <tr>
                                  <th className="p-3.5 pr-5">اسم الطالب</th>
                                  <th className="p-3.5">الهاتف</th>
                                  <th className="p-3.5">البريد الإلكتروني</th>
                                  <th className="p-3.5">نوع الحلقة المطلوبة</th>
                                  <th className="p-3.5">تاريخ التسجيل</th>
                                  <th className="p-3.5">الحالة</th>
                                  <th className="p-3.5 pl-5 text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredApps.map((app) => {
                                  const isPending = app.status === 'pending_review' || app.status === 'pending';
                                  const isAccepted = app.status === 'accepted' || app.status === 'approved';
                                  const isRejected = app.status === 'rejected';
                                  const phoneVal = validateAndCleanWhatsAppNumber(app.whatsapp || app.phone, app.country);

                                  return (
                                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                                      {/* 1. الاسم */}
                                      <td className="p-3.5 pr-5">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                            app.gender === 'female'
                                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                          }`}>
                                            {app.fullName.charAt(0) || 'ط'}
                                          </div>
                                          <div>
                                            <div className="font-bold text-slate-900 font-serif text-sm">{app.fullName}</div>
                                            <div className="text-[10px] text-slate-400">
                                              {app.gender === 'female' ? 'طالبة' : 'طالب'} • {app.country || 'اليمن'}
                                              {app.academicId && <span className="font-mono text-[#046A38] font-bold mr-1">({app.academicId})</span>}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* 2. الهاتف */}
                                      <td className="p-3.5">
                                        {phoneVal.isValid ? (
                                          <a
                                            href={`https://wa.me/${phoneVal.cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono font-bold text-emerald-850 hover:underline inline-flex items-center gap-1 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-200"
                                            dir="ltr"
                                            title="فتح محادثة واتساب"
                                          >
                                            <Phone className="w-3 h-3 text-emerald-700" />
                                            <span>{phoneVal.formattedDisplay}</span>
                                          </a>
                                        ) : (
                                          <span className="font-mono text-slate-600 text-xs" dir="ltr">
                                            {app.whatsapp || app.phone || '—'}
                                          </span>
                                        )}
                                      </td>

                                      {/* 3. البريد الإلكتروني */}
                                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                                        {app.email && !app.email.includes('@student.rehabquran.com') ? (
                                          <span>{app.email}</span>
                                        ) : (
                                          <span className="text-slate-400 text-[10px]">— (تسجيل برقم هاتف)</span>
                                        )}
                                      </td>

                                      {/* 4. نوع الحلقة المطلوبة */}
                                      <td className="p-3.5">
                                        <div className="font-medium text-slate-800">{app.studyType || 'تحفيظ القرآن'}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {app.riwayah || 'حفص عن عاصم'} {app.memorization ? `• ${app.memorization}` : ''}
                                        </div>
                                      </td>

                                      {/* 5. تاريخ التسجيل */}
                                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                                        {app.registeredAt || app.createdAt?.split('T')[0] || '2026-10-01'}
                                      </td>

                                      {/* 6. الحالة */}
                                      <td className="p-3.5">
                                        {isPending && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                            <Clock className="w-3 h-3 text-amber-700" />
                                            <span>قيد المراجعة</span>
                                          </span>
                                        )}
                                        {isAccepted && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                            <span>مقبول ومعتمد</span>
                                          </span>
                                        )}
                                        {isRejected && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                            <XCircle className="w-3 h-3 text-rose-700" />
                                            <span>مرفوض</span>
                                          </span>
                                        )}
                                      </td>

                                      {/* 7. الإجراءات */}
                                      <td className="p-3.5 pl-5">
                                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                          {isPending && (
                                            <>
                                              <button
                                                type="button"
                                                disabled={isRejectingAppId === app.id}
                                                onClick={() => setAppForSetupModal(app)}
                                                className="px-3 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs shadow-xs border border-[#C5A059] flex items-center gap-1 cursor-pointer transition-all"
                                                title="قبول الطالب وتعيين الحلقة والمعلم والرقم الأكاديمي"
                                              >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                                <span>قبول</span>
                                              </button>

                                              <button
                                                type="button"
                                                disabled={isApprovingAppId === app.id || isRejectingAppId === app.id}
                                                onClick={() => handleOpenRejectModal(app)}
                                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                                                title="رفض الطلب مع ذكر السبب"
                                              >
                                                <XCircle className="w-3.5 h-3.5" />
                                                <span>رفض</span>
                                              </button>
                                            </>
                                          )}

                                          {isAccepted && (
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleSendWhatsAppAdmissionInstructions(app)}
                                                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-[#20bd5a]"
                                                title="📱 إرسال تعليمات الدخول عبر WhatsApp"
                                              >
                                                <span>📱 إرسال تعليمات الدخول عبر WhatsApp</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() => setAppForSetupModal(app)}
                                                className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                                title="تعديل تعيين الحلقة والمعلم"
                                              >
                                                <Edit className="w-3 h-3 text-slate-600" />
                                                <span>تعديل</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // نمط عرض البطاقات (Cards Grid)
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredApps.map((app) => {
                            const isPending = app.status === 'pending_review' || app.status === 'pending';
                            const isApproved = app.status === 'approved' || app.status === 'accepted';
                            const isRejected = app.status === 'rejected';

                          return (
                            <div
                              key={app.id}
                              className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 bg-white shadow-xs ${
                                isPending
                                  ? 'border-amber-300 hover:border-amber-400'
                                  : isApproved
                                  ? 'border-emerald-300 hover:border-emerald-500'
                                  : 'border-rose-200 hover:border-rose-300'
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                                      app.gender === 'female'
                                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {app.fullName.charAt(0) || 'ط'}
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-sm sm:text-base text-slate-900 font-serif">
                                        {app.fullName}
                                      </h3>
                                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                                        <span>{app.country || 'اليمن'}</span>
                                        <span>•</span>
                                        <span>{app.age} سنة</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Badges */}
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                      app.gender === 'female'
                                        ? 'bg-teal-50 text-teal-900 border-teal-200'
                                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    }`}>
                                      {app.gender === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                                    </span>

                                    {isPending && (
                                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-700" />
                                        <span>قيد المراجعة</span>
                                      </span>
                                    )}
                                    {isApproved && (
                                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                        <span>مقبول ومعتمد</span>
                                      </span>
                                    )}
                                    {isRejected && (
                                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                                        <XCircle className="w-3 h-3 text-rose-700" />
                                        <span>مرفوض</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Application Data Details */}
                                <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/20 space-y-2 text-xs text-slate-700">
                                  {/* رقم واتساب الطالب (مع زر محادثة مباشر) */}
                                  {(() => {
                                    const phoneVal = validateAndCleanWhatsAppNumber(app.whatsapp || app.phone, app.country);
                                    return (
                                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                                        <span className="text-slate-500 font-bold flex items-center gap-1">
                                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>رقم واتساب الطالب:</span>
                                        </span>
                                        {phoneVal.isValid ? (
                                          <a
                                            href={`https://wa.me/${phoneVal.cleanPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono font-bold text-emerald-850 hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs"
                                            dir="ltr"
                                            title={`فتح محادثة واتساب (${phoneVal.formattedDisplay})`}
                                          >
                                            <span>{phoneVal.formattedDisplay}</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setFeedback({
                                              type: 'error',
                                              message: `رقم هاتف الطالب (${app.fullName}) غير صالح للواتساب: ${phoneVal.error || 'يرجى مراجعة الرقم ورمز الدولة'}`
                                            })}
                                            className="font-mono text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer"
                                            title="رقم غير صالح - اضغط للتفاصيل"
                                          >
                                            <AlertCircle className="w-3 h-3 text-rose-600" />
                                            <span>{app.whatsapp || app.phone || 'غير مسجل'} (غير صالح)</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-200/60">
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">المسار القرآني:</span>
                                      <strong className="text-slate-900">{app.studyType || 'تحفيظ القرآن'}</strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">الرواية:</span>
                                      <strong className="text-amber-900">{app.riwayah || 'حفص عن عاصم'}</strong>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-200/60">
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">مقدار الحفظ:</span>
                                      <span className="font-semibold text-slate-800">{app.memorization}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">الوقت المناسب:</span>
                                      <span className="font-semibold text-slate-800">
                                        {app.preferredTime} {app.preferredTimeDetail ? `(${app.preferredTimeDetail})` : ''}
                                      </span>
                                    </div>
                                  </div>

                                  {/* المساهمة الشهرية */}
                                  {app.monthlyContribution && (
                                    <div className="text-[11px] text-slate-600">
                                      <span className="text-slate-400">المساهمة الشهرية: </span>
                                      <strong>{app.monthlyContribution}</strong>
                                    </div>
                                  )}

                                  {/* في حال القبول: عرض الرقم الأكاديمي */}
                                  {app.academicId && (
                                    <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-950">
                                      <span>الرقم الأكاديمي المعتمد:</span>
                                      <span className="font-mono text-sm bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 text-[#046A38]">
                                        {app.academicId}
                                      </span>
                                    </div>
                                  )}

                                  {/* في حال الرفض: عرض سبب الرفض */}
                                  {app.rejectionReason && (
                                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                                      <span className="font-bold block mb-0.5">سبب الرفض المسجل:</span>
                                      <span>{app.rejectionReason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Actions: القبول والرفض وتجهيز رسائل الواتساب */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {app.registeredAt || app.createdAt?.split('T')[0] || '2026-09-30'}
                                </span>

                                <div className="flex items-center gap-2">
                                  {isPending && (
                                    <>
                                      {/* زر الرفض */}
                                      <button
                                        type="button"
                                        disabled={isApprovingAppId === app.id || isRejectingAppId === app.id}
                                        onClick={() => handleOpenRejectModal(app)}
                                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                        title="رفض طلب التسجيل مع توضيح السبب"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        <span>رفض</span>
                                      </button>

                                      {/* زر القبول: يفتح نافذة إعداد حساب الطالب وتعيينه */}
                                      <button
                                        type="button"
                                        disabled={isRejectingAppId === app.id}
                                        onClick={() => setAppForSetupModal(app)}
                                        className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-[#C5A059]"
                                        title="إعداد حساب الطالب وتعيين الحلقة والمعلم"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                        <span>قبول وتعيين الحساب ✓</span>
                                      </button>
                                    </>
                                  )}

                                  {isApproved && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setAppForSetupModal(app)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                        title="تعديل تعيين الحلقة والمعلم أو بيانات الحساب"
                                      >
                                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                                        <span>تعديل التعيين</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSendWhatsAppAdmissionInstructions(app)}
                                        className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 border border-[#20bd5a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                        title="إرسال تعليمات الدخول وبيانات الحلقة عبر WhatsApp للطالب"
                                      >
                                        <span>📱 إرسال تعليمات الدخول عبر WhatsApp</span>
                                      </button>
                                    </div>
                                  )}

                                  {isRejected && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const msg = `السلام عليكم ورحمة الله وبركاته، الأخ/الأخت ${app.fullName}، بخصوص طلب تسجيلكم في مقرأة رحاب القرآن: نعتذر عن قبول الطلب في الوقت الحالي نظراً لـ: ${app.rejectionReason || 'عدم توفر شواغر'}. شاكرين اهتمامكم.`;
                                        const v = validateAndCleanWhatsAppNumber(app.whatsapp || app.phone, app.country);
                                        setSelectedAppForApproval({
                                          app,
                                          result: {
                                            sentViaApi: false,
                                            whatsappUrl: v.isValid ? `https://wa.me/${v.cleanPhone}?text=${encodeURIComponent(msg)}` : '',
                                            messageText: msg,
                                            cleanPhone: v.cleanPhone,
                                            formattedDisplay: v.formattedDisplay,
                                            isValid: v.isValid,
                                            error: v.error,
                                          }
                                        });
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
                                      <span>عرض رسالة الاعتذار</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  </div>
                )}

                {/* SubTab 2: الطلاب المقيدون والمعتمدون نشطاً في الحلقات */}
                {studentSubTab === 'registered' && (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                        <tr>
                          <th className="p-4">اسم الطالب</th>
                          <th className="p-4">القسم</th>
                          <th className="p-4">مقدار الحفظ</th>
                          <th className="p-4">الحلقة والمعلم المسند</th>
                          <th className="p-4">تاريخ التسجيل</th>
                          <th className="p-4 text-center">الحالة</th>
                          <th className="p-4 text-center">الإسناد والتوجيه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentsList.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-900">{s.name}</td>
                            <td className="p-4">{s.section === 'female' ? 'طالبات (أخوات)' : 'طلاب (بنين)'}</td>
                            <td className="p-4 text-slate-700">{s.memorization}</td>
                            <td className="p-4">
                              <span className="text-[#046A38] font-bold block">{s.halqaTitle || 'حلقة الفجر'}</span>
                              <span className="text-[11px] text-slate-500 block">{s.teacherName ? `الشيخ: ${s.teacherName}` : 'المعلم: الشيخ إبراهيم'}</span>
                            </td>
                            <td className="p-4 font-mono text-slate-500">{s.registeredAt || '2026-01-01'}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                s.status === 'disabled' || s.isActive === false
                                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}>
                                {s.status === 'disabled' || s.isActive === false ? 'معطل' : 'نشط ومعتمد'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(s)}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="إسناد أو تعديل المعلم والحلقة ومجموعة الواتساب للطالب"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>إسناد</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTransferModal(s)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="نقل الطالب إلى حلقة أخرى وتغيير معلمه"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>نقل لحلقة</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAccount(s, 'student')}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                                    s.status === 'disabled' || s.isActive === false
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title={s.status === 'disabled' || s.isActive === false ? 'إعادة تفعيل الحساب' : 'تعطيل الحساب'}
                                >
                                  {s.status === 'disabled' || s.isActive === false ? 'تفعيل' : 'تعطيل'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* SubTab 3: رقابة ومزامنة حسابات Firebase Auth للطلاب المقبولين */}
                {studentSubTab === 'auth_sync' && (
                  <StudentAuthSyncDashboard
                    adminName={currentAccount.name || 'إدارة المقرأة'}
                    onRefreshParentList={loadAdminData}
                  />
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 5. إدارة الحلقات (HALQAS)                                 */}
            {/* ======================================================== */}
            {activeTab === 'halqas' && (
              <div className="space-y-6 animate-fade-in">
                {/* شريط الإدارة والفلترة المتقدمة لتنظيم الحلقات للمعلمين والمشرفين */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C5A059]">المجموعات والحلقات القرآنية</span>
                        <span className="text-[10px] font-bold bg-[#F9F6F0] text-[#046A38] px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                          نظام تصنيف الحلقات (حفظ - مراجعة - إجازة - تصحيح تلاوة - أشبال أطفال)
                        </span>
                      </div>
                      <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة وتصنيف الحلقات القرآنية</h2>
                    </div>
                    <button
                      onClick={() => setIsAddHalqaOpen(true)}
                      className="px-4 py-2.5 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 border border-[#C5A059] active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4 text-[#C5A059]" />
                      <span>إنشاء حلقة جديدة وتصنيفها</span>
                    </button>
                  </div>

                  {/* أشرطة التصنيف والفلترة السريعة */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* فلتر تصنيف الحلقات: حفظ، مراجعة، إجازة */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 ml-1">تصنيف الحلقة:</span>
                      <button
                        type="button"
                        onClick={() => setHalqaFilterClassification('all')}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                          halqaFilterClassification === 'all'
                            ? 'bg-[#046A38] text-white border-[#046A38] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        جميع الحلقات ({halqasList.length})
                      </button>

                      {HALQA_CLASSIFICATIONS.map(c => {
                        const count = halqasList.filter(h => detectHalqaClassification(h).id === c.id).length;
                        const isSelected = halqaFilterClassification === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setHalqaFilterClassification(c.id)}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                              isSelected
                                ? `${c.badgeClasses} shadow-xs ring-2 ring-current/20`
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {c.id === 'hifz' && <BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
                            {c.id === 'morajaah' && <RefreshCw className="w-3.5 h-3.5 text-sky-600" />}
                            {c.id === 'ijazah' && <Award className="w-3.5 h-3.5 text-amber-600" />}
                            {c.id === 'tashih' && <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
                            {c.id === 'ashbal' && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                            <span>{c.label}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* فلتر القسم (بنين / بنات) */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-slate-500 ml-1">القسم:</span>
                      {(['all', 'male', 'female'] as const).map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setHalqaFilterSection(sec)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border ${
                            halqaFilterSection === sec
                              ? 'bg-[#C5A059] text-white border-[#C5A059]'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sec === 'all' ? 'الكل' : sec === 'male' ? 'قسم الطلاب' : 'قسم الطالبات'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {(() => {
                  const displayedHalqas = halqasList.filter(h => {
                    if (halqaFilterSection !== 'all' && h.section !== halqaFilterSection) return false;
                    if (halqaFilterClassification !== 'all') {
                      const c = detectHalqaClassification(h);
                      if (c.id !== halqaFilterClassification) return false;
                    }
                    return true;
                  });

                  if (displayedHalqas.length === 0) {
                    return (
                      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-800">لا توجد حلقات مطابقة للتصنيف المحدد</h4>
                          <p className="text-xs text-slate-500 mt-1">يمكنك إنشاء حلقة جديدة بهذا التصنيف أو إعادة ضبط الفلترة</p>
                        </div>
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setHalqaFilterClassification('all');
                              setHalqaFilterSection('all');
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            عرض جميع الحلقات
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (halqaFilterClassification !== 'all') {
                                setNewHalqaClassification(halqaFilterClassification);
                              }
                              setIsAddHalqaOpen(true);
                            }}
                            className="px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            + إنشاء حلقة الآن
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {displayedHalqas.map((h) => {
                        const cls = detectHalqaClassification(h);
                        return (
                          <div key={h.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 relative hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* شارة التصنيف (حفظ / مراجعة / إجازة / تصحيح تلاوة / أشبال أطفال) */}
                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${cls.badgeClasses} flex items-center gap-1`}>
                                  {cls.id === 'hifz' && <BookOpen className="w-3 h-3 text-emerald-700" />}
                                  {cls.id === 'morajaah' && <RefreshCw className="w-3 h-3 text-sky-700" />}
                                  {cls.id === 'ijazah' && <Award className="w-3 h-3 text-amber-700" />}
                                  {cls.id === 'tashih' && <Volume2 className="w-3 h-3 text-teal-700" />}
                                  {cls.id === 'ashbal' && <Sparkles className="w-3 h-3 text-purple-700" />}
                                  <span>{cls.singular}</span>
                                </span>

                                <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                                  {h.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-700">● {h.status}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditHalqa(h)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                  title="تعديل بيانات وتصنيف الحلقة وموعدها أو رابط مجموعة واتساب"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 font-serif">{h.title}</h4>
                            <p className="text-xs text-slate-600">المعلم: <strong>{h.teacherName}</strong></p>
                            <p className="text-xs text-slate-500">التوقيت: <strong className="font-mono">{h.timeSlot}</strong></p>

                            {/* حالة رابط مجموعة واتساب */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between">
                              <span className="text-slate-600 font-medium">مجموعة واتساب:</span>
                              {h.whatsappGroupUrl ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[10px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>مفعلة ومعتمدة ✓</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 text-[10px] font-bold">لم يُضف رابط بعد</span>
                              )}
                            </div>

                            {/* حالة رابط Google Meet */}
                            <div className="p-2.5 rounded-xl bg-[#F9F6F0] border border-[#C5A059]/40 text-[11px] flex items-center justify-between">
                              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-[#046A38]" />
                                <span>Google Meet:</span>
                              </span>
                              {h.googleMeetUrl ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-700 font-bold text-[10px]">مفعلة ✓</span>
                                  <a
                                    href={h.googleMeetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    دخول ↗
                                  </a>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetMeetHalqa(h);
                                    setMeetModalMode('standalone');
                                    setIsGoogleMeetModalOpen(true);
                                  }}
                                  className="text-[#046A38] hover:text-[#03542c] hover:underline text-[10px] font-bold cursor-pointer"
                                >
                                  + إنشاء قاعة
                                </button>
                              )}
                            </div>

                            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span>الطلاب: {h.studentsCount}/{h.maxCapacity}</span>
                              <span className="text-[#046A38] font-bold">{h.riwayah}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* نافذة إضافة حلقة جديدة */}
                {isAddHalqaOpen && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#046A38]">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#C5A059] block">إدارة وتنظيم المقرأة</span>
                            <h4 className="font-bold text-base text-[#046A38] font-serif">
                              إنشاء حلقة قرآنية جديدة وتصنيفها
                            </h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddHalqaOpen(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleCreateHalqa} className="space-y-3.5 text-xs">
                        {/* 1. تصنيف مسار الحلقة: حلقات حفظ، حلقات مراجعة، حلقات إجازة */}
                        <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-[#C5A059]/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#046A38]" />
                              <span>تصنيف مسار الحلقة: <span className="text-red-500">*</span></span>
                            </label>
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                              ميزة تصنيف الحلقات
                            </span>
                          </div>

                          {/* أزرار تصنيف المسار التفاعلية البارزة */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {HALQA_CLASSIFICATIONS.map((c) => {
                              const isSelected = newHalqaClassification === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setNewHalqaClassification(c.id);
                                    setNewHalqaType(c.defaultHalqaType);
                                    const firstPreset = c.suggestedPresets[0];
                                    setSelectedHalqaPreset(firstPreset);
                                    setNewHalqaTitle(firstPreset);
                                  }}
                                  className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                    isSelected
                                      ? `${c.cardActiveClasses} bg-white`
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {c.id === 'hifz' && <BookOpen className="w-4 h-4 text-emerald-600" />}
                                    {c.id === 'morajaah' && <RefreshCw className="w-4 h-4 text-sky-600" />}
                                    {c.id === 'ijazah' && <Award className="w-4 h-4 text-amber-600" />}
                                    {c.id === 'tashih' && <Volume2 className="w-4 h-4 text-teal-600" />}
                                    {c.id === 'ashbal' && <Sparkles className="w-4 h-4 text-purple-600" />}
                                    <span className={`font-bold text-xs ${isSelected ? 'text-[#046A38]' : 'text-slate-800'}`}>
                                      {c.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium">({c.singular})</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* بطاقة توضيحية للمسار المختار */}
                          {(() => {
                            const activeConf = HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification) || HALQA_CLASSIFICATIONS[0];
                            return (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 flex items-center gap-1">
                                    <span>🎯 {activeConf.badgeTitle}</span>
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${activeConf.badgeClasses}`}>
                                    معتمد للإدارة والمعلمين
                                  </span>
                                </div>
                                <p className="leading-relaxed text-slate-600">{activeConf.desc}</p>
                              </div>
                            );
                          })()}
                        </div>

                        {/* 2. خيار اسم الحلقة */}
                        <div className="bg-[#F9F6F0] p-3.5 rounded-2xl border border-[#C5A059]/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block font-bold text-slate-800 text-xs">
                              خيار اسم الحلقة: <span className="text-red-500">*</span>
                            </label>
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                              أسماء مقترحة لـ {HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.label}
                            </span>
                          </div>

                          <select
                            value={selectedHalqaPreset}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedHalqaPreset(val);
                              if (val && val !== 'custom') {
                                setNewHalqaTitle(val);
                                if (val.includes('طالبات') || val.includes('أخوات')) {
                                  setNewHalqaSection('female');
                                } else if (val.includes('طلاب') || val.includes('بنين')) {
                                  setNewHalqaSection('male');
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] text-slate-800 font-medium"
                          >
                            <option value="">-- اضغط لاختيار اسم الحلقة المعتمد --</option>
                            <optgroup label={`أسماء مقترحة لـ (${HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.label})`}>
                              {(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || []).map((preset, idx) => (
                                <option key={idx} value={preset}>
                                  {preset}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="باقي الأسماء والمقرآت المعتمدة">
                              {HALQA_NAME_PRESETS.filter(p => !(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || []).includes(p)).map((preset, idx) => (
                                <option key={`other-${idx}`} value={preset}>
                                  {preset}
                                </option>
                              ))}
                            </optgroup>
                            <option value="custom">✍️ خيار اسم مخصص لحلقة جديدة (كتابة يدوية)...</option>
                          </select>

                          {/* خيارات شائعة سريعة بنقرة واحدة */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-semibold block">خيارات شائعة سريعة:</span>
                            <div className="flex flex-wrap gap-1">
                              {(HALQA_CLASSIFICATIONS.find(c => c.id === newHalqaClassification)?.suggestedPresets || HALQA_NAME_PRESETS).slice(0, 4).map((p, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedHalqaPreset(p);
                                    setNewHalqaTitle(p);
                                    if (p.includes('طالبات')) setNewHalqaSection('female');
                                    else if (p.includes('طلاب')) setNewHalqaSection('male');
                                  }}
                                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                    newHalqaTitle === p
                                      ? 'bg-[#046A38] text-white border-[#046A38] font-bold shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#046A38]'
                                  }`}
                                >
                                  {p.split('(')[0].trim()}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* الحقل النصي لمراجعة أو كتابة اسم الحلقة */}
                          <div className="pt-1">
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              اسم الحلقة النهائي:
                            </label>
                            <input
                              type="text"
                              required
                              value={newHalqaTitle}
                              onChange={(e) => {
                                setNewHalqaTitle(e.target.value);
                                if (selectedHalqaPreset !== 'custom') {
                                  setSelectedHalqaPreset('custom');
                                }
                              }}
                              placeholder="مثال: حلقة الفجر للإتقان"
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-medium text-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">القسم:</label>
                          <select
                            value={newHalqaSection}
                            onChange={(e: any) => setNewHalqaSection(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          >
                            <option value="male">قسم الطلاب (بنين)</option>
                            <option value="female">قسم الطالبات (أخوات)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الشيخ / المعلم المشرف:</label>
                          <input
                            type="text"
                            required
                            value={newHalqaTeacher}
                            onChange={(e) => setNewHalqaTeacher(e.target.value)}
                            placeholder="الشيخ عبد الرحمن"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">التوقيت اليومي (موعد الحلقة):</label>
                          <input
                            type="text"
                            required
                            value={newHalqaTime}
                            onChange={(e) => setNewHalqaTime(e.target.value)}
                            placeholder="مثال: 5:00 ص - 6:30 ص"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">رابط مجموعة واتساب للحلقة (المعتمد):</label>
                          <input
                            type="url"
                            value={newHalqaWhatsappUrl}
                            onChange={(e) => setNewHalqaWhatsappUrl(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                            dir="ltr"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">يظهر للطلاب كزر رسمي للانضمام للمجموعة، ولا يعرض رابطاً وهمياً إذا تُرِك فارغاً.</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">رابط Google Meet للحلقة المباشرة:</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={newHalqaMeetUrl}
                              onChange={(e) => setNewHalqaMeetUrl(e.target.value)}
                              placeholder="https://meet.google.com/abc-defg-hij"
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMeetModalMode('create');
                                setIsGoogleMeetModalOpen(true);
                              }}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>إنشاء عبر Meet</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">يمكن توليد الرابط مباشرة عبر Google Meet API أو إدخاله يدوياً.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsAddHalqaOpen(false)}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#046A38] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059]"
                          >
                            حفظ الحلقة وتصنيفها
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* نافذة تعديل بيانات وموعد وتصنيف الحلقة */}
                {editingHalqa && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="font-bold text-base text-[#046A38] font-serif">
                          تعديل بيانات وتصنيف الحلقة
                        </h4>
                        <button 
                          type="button"
                          onClick={() => setEditingHalqa(null)} 
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveHalqaEdit} className="space-y-3.5 text-xs">
                        {/* تعديل تصنيف مسار الحلقة */}
                        <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/40 space-y-2">
                          <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#046A38]" />
                            <span>تصنيف مسار الحلقة:</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {HALQA_CLASSIFICATIONS.map((c) => {
                              const isSelected = editHalqaClassification === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setEditHalqaClassification(c.id);
                                    setEditHalqaType(c.defaultHalqaType);
                                  }}
                                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                    isSelected
                                      ? `${c.cardActiveClasses} bg-white`
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-1">
                                    {c.id === 'hifz' && <BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
                                    {c.id === 'morajaah' && <RefreshCw className="w-3.5 h-3.5 text-sky-600" />}
                                    {c.id === 'ijazah' && <Award className="w-3.5 h-3.5 text-amber-600" />}
                                    {c.id === 'tashih' && <Volume2 className="w-3.5 h-3.5 text-teal-600" />}
                                    {c.id === 'ashbal' && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                                    <span className={`font-bold text-xs ${isSelected ? 'text-[#046A38]' : 'text-slate-800'}`}>
                                      {c.label}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-500">({c.singular})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* خيار اسم الحلقة */}
                        <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-[#C5A059]/40 space-y-2">
                          <label className="block font-bold text-slate-800 text-xs">خيار اسم الحلقة:</label>
                          <select
                            value={selectedEditHalqaPreset}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedEditHalqaPreset(val);
                              if (val && val !== 'custom') {
                                setEditHalqaTitle(val);
                              }
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] text-slate-800 font-medium"
                          >
                            <option value="">-- تغيير اسم الحلقة من القائمة المعتمدة --</option>
                            {HALQA_NAME_PRESETS.map((preset, idx) => (
                              <option key={idx} value={preset}>
                                {preset}
                              </option>
                            ))}
                            <option value="custom">✍️ اسم مخصص آخر (كتابة يدوية)...</option>
                          </select>
                          <input
                            type="text"
                            required
                            value={editHalqaTitle}
                            onChange={(e) => {
                              setEditHalqaTitle(e.target.value);
                              setSelectedEditHalqaPreset('custom');
                            }}
                            placeholder="اسم الحلقة..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-medium text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الشيخ / المعلم المشرف:</label>
                          <input
                            type="text"
                            required
                            value={editHalqaTeacher}
                            onChange={(e) => setEditHalqaTeacher(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">موعد وتوقيت الحلقة اليومي:</label>
                          <input
                            type="text"
                            required
                            value={editHalqaTime}
                            onChange={(e) => setEditHalqaTime(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">رابط مجموعة واتساب للحلقة:</label>
                          <input
                            type="url"
                            value={editHalqaWhatsappUrl}
                            onChange={(e) => setEditHalqaWhatsappUrl(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                            dir="ltr"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">تحديث هذا الرابط ينعكس فوراً وتلقائياً في لوحة جميع طلاب هذه الحلقة.</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">رابط Google Meet للحلقة المباشرة:</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={editHalqaMeetUrl}
                              onChange={(e) => setEditHalqaMeetUrl(e.target.value)}
                              placeholder="https://meet.google.com/abc-defg-hij"
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMeetModalMode('edit');
                                setIsGoogleMeetModalOpen(true);
                              }}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>إنشاء عبر Meet</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">يظهر للطلاب كزر لدخول الحلقة المباشرة عبر Google Meet.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditingHalqa(null)}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingHalqaEdit}
                            className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059] flex items-center gap-1.5"
                          >
                            {isSavingHalqaEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>حفظ التعديلات</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* نافذة إسناد وتعيين المعلم والحلقة للطالب */}
                {isAssignModalOpen && assigningStudent && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[11px] font-bold text-[#C5A059] block">إعدادات المشرف الأكاديمي</span>
                          <h4 className="font-bold text-base text-[#046A38] font-serif">
                            إسناد المعلم والحلقة للطالب
                          </h4>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setIsAssignModalOpen(false);
                            setAssigningStudent(null);
                          }} 
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 text-xs">
                        <span className="text-slate-500 block">الطالب:</span>
                        <strong className="text-slate-900 text-sm font-serif block">{assigningStudent.name}</strong>
                        <span className="text-slate-500 text-[11px] mt-0.5 block">
                          القسم: {assigningStudent.section === 'female' ? 'طالبات' : 'طلاب'} • مقدار الحفظ: {assigningStudent.memorization || 'غير محدد'}
                        </span>
                      </div>

                      <form onSubmit={handleSaveStudentAssignment} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">اختر الحلقة:</label>
                          <select
                            value={assignHalqaId}
                            onChange={(e) => {
                              const chosenId = e.target.value;
                              setAssignHalqaId(chosenId);
                              const found = halqasList.find(h => h.id === chosenId);
                              if (found) {
                                setAssignHalqaTitle(found.title);
                                setAssignTeacherName(found.teacherName);
                                setAssignTeacherId(found.teacherId || 'tch-1');
                                setAssignHalqaSchedule(found.timeSlot);
                                if (found.whatsappGroupUrl) {
                                  setAssignWhatsappUrl(found.whatsappGroupUrl);
                                }
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          >
                            {halqasList.map(h => (
                              <option key={h.id} value={h.id}>
                                {h.title} ({h.teacherName})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">اسم المعلم / الشيخ المشرف:</label>
                          <input
                            type="text"
                            required
                            value={assignTeacherName}
                            onChange={(e) => setAssignTeacherName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">موعد الحلقة:</label>
                          <input
                            type="text"
                            required
                            value={assignHalqaSchedule}
                            onChange={(e) => setAssignHalqaSchedule(e.target.value)}
                            placeholder="مثال: يومياً 5:30 ص - 7:00 ص"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">رابط مجموعة واتساب للحلقة (اختياري):</label>
                          <input
                            type="url"
                            value={assignWhatsappUrl}
                            onChange={(e) => setAssignWhatsappUrl(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                            dir="ltr"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">يظهر للطالب زر مباشر للانضمام لمجموعة واتساب الخاصة بحلقته.</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAssignModalOpen(false);
                              setAssigningStudent(null);
                            }}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingAssignment}
                            className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059] flex items-center gap-1.5"
                          >
                            {isSavingAssignment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            <span>تثبيت الإسناد وحفظ التغييرات</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* إدارة المتون العلمية وشرحها (SCIENTIFIC MUTUN MANAGEMENT) */}
            {/* ======================================================== */}
            {activeTab === 'mutun' && (
              <div className="space-y-6 animate-fade-in">
                <SupervisorMutunManager />
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. إدارة الخطط (PLANS)                                     */}
            {/* ======================================================== */}
            {activeTab === 'plans' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المناهج والمسارات</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة خطط الحفظ والمراجعة</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    إجمالي الخطط النشطة: {plansList.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {plansList.map((p) => (
                    <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <strong className="text-sm font-bold text-slate-900 block">{p.studentName}</strong>
                        <span className="text-xs text-slate-500">
                          {p.surahName} (الآيات: {p.fromAyah} - {p.toAyah}) • النوع: {p.type === 'memorization' ? 'حفظ جديد' : 'مراجعة تثبيت'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">الاستحقاق: {p.targetDate}</span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-[#046A38] border border-emerald-200 rounded-lg text-xs font-bold">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 7. إدارة المحتوى (CONTENT)                                 */}
            {/* ======================================================== */}
            {/* 7. إدارة المحتوى والميزات (CONTENT & FEATURE TOGGLES) */}
            {activeTab === 'content' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">التحكم في الظهور والمناهج</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة المحتوى والميزات (إخفاء / إظهار / تعديل)</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      التحكم الكامل في ظهور ميزات المقرأة للطلاب والزوار من لوحة المشرف فقط. الإخفاء لا يحذف المحتوى بل يجعله مخفياً (hidden) ويمكن إعادته في أي لحظة مع التوثيق في سجل الرقابة.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 px-3 py-1.5 rounded-xl">
                      إجمالي الميزات: {contentFeatures.length}
                    </span>
                  </div>
                </div>

                {/* Categories Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'جميع الميزات والمحتويات' },
                    { id: 'tools', label: 'الأدوات الصوتية' },
                    { id: 'curriculum', label: 'المناهج والمتون والتفسير' },
                    { id: 'pages', label: 'الصفحات والبوابات' },
                    { id: 'programs', label: 'المسارات التخصصية' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setContentFilterCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        contentFilterCategory === cat.id
                          ? 'bg-[#046A38] text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contentFeatures
                    .filter(f => contentFilterCategory === 'all' || f.category === contentFilterCategory)
                    .map((feature) => {
                      const isVisible = feature.status === 'visible';
                      const isToggling = isTogglingFeatureId === feature.id;

                      return (
                        <div
                          key={feature.id}
                          className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between space-y-4 bg-white shadow-xs ${
                            isVisible 
                              ? 'border-emerald-200 hover:border-emerald-300' 
                              : 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40">
                                  {feature.categoryLabel}
                                </span>
                                <h3 className="font-bold text-base text-slate-900 font-serif mt-1.5">
                                  {feature.title}
                                </h3>
                              </div>

                              <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                                isVisible 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {isVisible ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>معروض للجميع</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                                    <span>مخفي مؤقتاً</span>
                                  </>
                                )}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {feature.description}
                            </p>

                            {feature.notes && (
                              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <strong>ملاحظات الإدارة:</strong> {feature.notes}
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                              <span>المعدل: <strong>{feature.lastModifiedBy}</strong></span>
                              <span className="font-mono">{feature.lastModifiedAt}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFeature(feature)}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-600" />
                              <span>تعديل النصوص</span>
                            </button>

                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleFeature(feature)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                                isVisible
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059]'
                              }`}
                            >
                              {isToggling ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isVisible ? (
                                <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-emerald-200" />
                              )}
                              <span>{isVisible ? 'إخفاء عن الطلاب والزوار' : 'إظهار الميزة للجميع'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 8. إدارة وتعديل الشهادات ومحرر الاستوديو                 */}
            {/* ======================================================== */}
            {(activeTab === 'certificates' || activeTab === 'certificate_editor') && (
              <div className="space-y-6 animate-fade-in">
                {/* Sub-tab Navigation */}
                <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCertViewSubTab('editor')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        certViewSubTab === 'editor'
                          ? 'bg-[#046A38] text-white shadow-md border border-[#C5A059]'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>محرر ومصمم الشهادات التفاعلي (المحرر الكامل)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertViewSubTab('records')}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        certViewSubTab === 'records'
                          ? 'bg-[#046A38] text-white shadow-md border border-[#C5A059]'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Award className="w-4 h-4 text-[#C5A059]" />
                      <span>سجل الشهادات الصادرة المعتمدة ({certificatesList.length})</span>
                    </button>
                  </div>

                  {certViewSubTab === 'records' && (
                    <button
                      onClick={() => setIsIssueCertOpen(true)}
                      className="px-4 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 border border-[#C5A059]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إصدار شهادة يدوياً</span>
                    </button>
                  )}
                </div>

                {certViewSubTab === 'editor' ? (
                  <CertificateStudioEditor
                    onCertificateIssued={(newCert) => {
                      setCertificatesList((prev) => [newCert, ...prev]);
                      setCertViewSubTab('records');
                    }}
                  />
                ) : (
                  <>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-[#C5A059]">الاعتماد والختم الرسمي</span>
                        <h2 className="text-xl font-bold font-serif text-[#046A38]">سجل الشهادات القرآنية المعتمدة</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCertViewSubTab('editor')}
                          className="px-4 py-2 bg-[#C5A059] text-slate-950 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>فتح محرر الشهادات</span>
                        </button>
                        <button
                          onClick={() => setIsIssueCertOpen(true)}
                          className="px-4 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 border border-[#C5A059]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إصدار شهادة سريعة</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificatesList.map((c) => (
                        <div key={c.id} className="bg-white p-6 rounded-3xl border-2 border-[#C5A059]/40 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-400 font-bold">{c.serialNumber}</span>
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-[#046A38] rounded-full text-xs font-bold">
                              معتمدة بالختم
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 font-serif">الطالب: {c.studentName}</h4>
                          <p className="text-xs text-slate-600">{c.courseTitle}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>إشراف: <strong>{c.sheikhTeacherName}</strong></span>
                            <span className="font-mono">{c.issueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* نافذة إصدار شهادة */}
                    {isIssueCertOpen && (
                      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059]">
                          <h4 className="font-bold text-base text-[#046A38] font-serif border-b border-slate-100 pb-2">
                            إصدار شهادة معتمدة بالختم الرسمي 2026
                          </h4>

                          <form onSubmit={handleIssueCertificate} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">اسم الطالب كاملاً:</label>
                              <input
                                type="text"
                                required
                                value={certStudentName}
                                onChange={(e) => setCertStudentName(e.target.value)}
                                placeholder="مثال: بلال يحيى الضالعي"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">عنوان المسار أو الدورة:</label>
                              <input
                                type="text"
                                required
                                value={certCourseTitle}
                                onChange={(e) => setCertCourseTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">الرواية القرآنية:</label>
                              <input
                                type="text"
                                required
                                value={certRiwayah}
                                onChange={(e) => setCertRiwayah(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsIssueCertOpen(false)}
                                className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                type="submit"
                                className="px-5 py-2 bg-[#046A38] text-white rounded-xl font-bold cursor-pointer"
                              >
                                إصدار الشهادة فوراً
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 9. إدارة الاشتراكات والمساهمات (SUBSCRIPTIONS)            */}
            {/* ======================================================== */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. بطاقة صلاحية المشرف العام: تعديل مبلغ المساهمة الشهرية المعتمد */}
                <div className="bg-gradient-to-l from-[#046A38] via-[#05572e] to-[#0a351f] text-white p-6 rounded-3xl border-2 border-[#C5A059] shadow-lg relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#C5A059]/20 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 bg-[#C5A059]/25 border border-[#C5A059]/80 px-3 py-1 rounded-full text-xs font-bold text-amber-200 shadow-2xs">
                        <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>صلاحية حصرية للمشرف العام</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
                        <span>إعداد وتعديل مبلغ المساهمة الشهرية المعتمد للمقرأة</span>
                      </h2>
                      <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed font-sans">
                        يمتلك المشرف العام الصلاحية المباشرة لتحديد وتعديل مبلغ المساهمة الشهرية الرمزية لطلاب المقرأة، وتعديل المبالغ المستحقة على الطلاب أو المساهمين وفقاً لظروف كل طالب، واعتمادها فوراً.
                      </p>
                      {globalContributionSettings.lastUpdatedBy && (
                        <div className="text-[11px] text-amber-200/80 font-mono pt-1">
                          آخر تعديل للمبلغ بواسطة: <strong className="text-white">{globalContributionSettings.lastUpdatedBy}</strong>
                          {globalContributionSettings.lastUpdatedAt && ` • ${new Date(globalContributionSettings.lastUpdatedAt).toLocaleDateString('ar-SA')}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                      <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-5 py-3.5 rounded-2xl text-center">
                        <div className="text-[11px] text-emerald-200 font-medium">المبلغ المعتمد حالياً</div>
                        <div className="text-2xl sm:text-3xl font-bold font-mono text-[#C5A059]">
                          {Number(globalContributionSettings.defaultMonthlyAmount || 3000).toLocaleString()}{' '}
                          <span className="text-xs text-white font-sans">{globalContributionSettings.currency || 'ريال يمني'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewGlobalAmount(globalContributionSettings.defaultMonthlyAmount || 3000);
                          setNewGlobalCurrency(globalContributionSettings.currency || 'ريال يمني');
                          setNewGlobalNotes(globalContributionSettings.notes || '');
                          setIsEditingGlobalAmount(true);
                        }}
                        className="px-5 py-3.5 bg-[#C5A059] hover:bg-[#b59048] text-slate-950 rounded-2xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border border-white/40 active:scale-95 hover:shadow-lg"
                      >
                        <Edit className="w-4 h-4 text-slate-950" />
                        <span>تعديل مبلغ المساهمة (المشرف العام)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. جدول سجل الاشتراكات والمساهمات العامة */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-[#C5A059]">الدعم الوقفي والشهري</span>
                      <h3 className="text-base font-bold font-serif text-[#046A38]">سجل المساهمات والاشتراكات المالية</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                      السجلات: {subscriptionsList.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                        <tr>
                          <th className="p-3.5">المساهم / الطالب</th>
                          <th className="p-3.5">القسم</th>
                          <th className="p-3.5">المبلغ المسدد</th>
                          <th className="p-3.5">طريقة التحويل</th>
                          <th className="p-3.5">رقم الإيصال</th>
                          <th className="p-3.5">الحالة</th>
                          <th className="p-3.5 text-center">إجراء المشرف العام</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscriptionsList.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900">{sub.subscriberName}</td>
                            <td className="p-3.5">{sub.section === 'female' ? 'طالبات' : 'طلاب'}</td>
                            <td className="p-3.5 font-mono font-bold text-[#046A38]">
                              {sub.amount.toLocaleString()} {sub.currency}
                            </td>
                            <td className="p-3.5 text-slate-600">{sub.paymentMethod}</td>
                            <td className="p-3.5 font-mono text-slate-400">{sub.receiptNumber || '—'}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900">
                                {sub.status === 'active' ? 'ساري' : 'بانتظار التجديد'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSubscriptionAmount(sub)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="تعديل مبلغ المساهمة (صلاحية المشرف العام)"
                              >
                                <Edit className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>تعديل المبلغ</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. قسم إشعارات المساهمات الشهرية للطلاب والاعتماد الإداري وتعديل المبالغ */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold font-serif text-[#046A38]">
                        إشعارات المساهمات الشهرية للطلاب (المطلوب مراجعتها واعتمادها)
                      </h3>
                      <p className="text-xs text-slate-500 font-sans">
                        متابعة إشعارات السداد وتأكيدها، مع صلاحية كاملة للمشرف العام لتعديل مبلغ المساهمة لأي طالب عند الحاجة.
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 px-3 py-1.5 rounded-xl">
                      إجمالي الإشعارات: {monthlyContributions.length}
                    </span>
                  </div>

                  {monthlyContributions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      لا توجد إشعارات مساهمة شهرية مسجلة حالياً.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#F9F6F0] text-[#046A38] font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">اسم الطالب</th>
                            <th className="p-3">الشهر المستحق</th>
                            <th className="p-3">مبلغ المساهمة</th>
                            <th className="p-3">طريقة التحويل</th>
                            <th className="p-3">رقم العملية / الملاحظات</th>
                            <th className="p-3">الحالة الحالية</th>
                            <th className="p-3 text-center">إجراء الإدارة والمشرف العام</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {monthlyContributions.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-900">{item.studentName}</td>
                              <td className="p-3 font-serif text-[#046A38] font-bold">{item.monthLabel || item.month}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-[#046A38] text-xs">
                                    {Number(item.amount || globalContributionSettings.defaultMonthlyAmount || 3000).toLocaleString()}{' '}
                                    <span className="text-[10px] text-slate-500">{item.currency || globalContributionSettings.currency || 'ريال يمني'}</span>
                                  </span>
                                  {item.amountModifiedByAdminName && (
                                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-sans font-bold border border-amber-300" title={`عدّله المشرف العام: ${item.amountModifiedByAdminName}`}>
                                      مُعدّل
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-slate-700">{item.paymentMethod || '—'}</td>
                              <td className="p-3">
                                {item.transferReference && (
                                  <span className="font-mono text-xs block text-slate-800">
                                    سند: {item.transferReference}
                                  </span>
                                )}
                                {item.studentNotes && (
                                  <span className="text-[11px] text-slate-500 italic block">
                                    {item.studentNotes}
                                  </span>
                                )}
                                {item.adminNotes && (
                                  <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
                                    ملاحظة المشرف: {item.adminNotes}
                                  </span>
                                )}
                                {!item.transferReference && !item.studentNotes && !item.adminNotes && '—'}
                              </td>
                              <td className="p-3">
                                {item.status === 'paid' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                    تم السداد ✓
                                  </span>
                                ) : item.status === 'pending_confirmation' ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[11px]">
                                    بانتظار التأكيد
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                                    مستحقة
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {item.status !== 'paid' && (
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmMonthlyPayment(item.id, item.studentName, item.monthLabel || item.month)}
                                      className="px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 border border-[#C5A059]"
                                      title="اعتماد وتأكيد السداد"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>اعتماد ✓</span>
                                    </button>
                                  )}
                                  {item.status === 'paid' && (
                                    <span className="text-[11px] text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                      معتمد ({item.confirmedByAdminName || 'الإدارة'})
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditRecordAmount(item)}
                                    className="px-2.5 py-1.5 bg-[#F9F6F0] hover:bg-amber-100 text-[#046A38] hover:text-amber-900 border border-[#C5A059]/60 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="تعديل مبلغ مساهمة هذا الطالب (صلاحية المشرف العام)"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-[#C5A059]" />
                                    <span>تعديل المبلغ</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* 4. نوافذ المشرف العام: تعديل مبالغ المساهمة                               */}
                {/* ========================================================================= */}

                {/* نافذة تعديل مبلغ المساهمة العام (صلاحية المشرف العام) */}
                {isEditingGlobalAmount && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] animate-scale-up">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#046A38] shadow-xs">
                            <Shield className="w-5 h-5 text-[#C5A059]" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#C5A059] block">صلاحية المشرف العام</span>
                            <h4 className="font-bold text-base text-[#046A38] font-serif">
                              تعديل مبلغ المساهمة الشهرية المعتمد
                            </h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingGlobalAmount(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 text-xs text-slate-700 leading-relaxed font-sans">
                        💡 هذا التعديل خاص بالمشرف العام وينعكس مباشرة على قيمة المساهمة الشهرية الرمزية لطلاب المقرأة وإشعارات السداد الجديدة.
                      </div>

                      <form onSubmit={handleSaveGlobalContributionAmount} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            مبلغ المساهمة الشهرية المعتمد: <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              required
                              min={0}
                              step={100}
                              value={newGlobalAmount}
                              onChange={(e) => setNewGlobalAmount(Number(e.target.value))}
                              placeholder="3000"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-[#046A38] text-slate-900"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">المبلغ المقترح لجميع الطلاب (مثل: 3000 ريال يمني أو ما يعادله).</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">العملة المعتمدة:</label>
                          <select
                            value={newGlobalCurrency}
                            onChange={(e) => setNewGlobalCurrency(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#046A38] text-slate-800"
                          >
                            <option value="ريال يمني">ريال يمني (قديم / معتمد)</option>
                            <option value="ريال سعودي">ريال سعودي</option>
                            <option value="دولار أمريكي">دولار أمريكي (USD)</option>
                            <option value="درهم إماراتي">درهم إماراتي</option>
                            <option value="دينار كويتي">دينار كويتي</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">ملاحظات وبيان مصرف المساهمة:</label>
                          <textarea
                            rows={2}
                            value={newGlobalNotes}
                            onChange={(e) => setNewGlobalNotes(e.target.value)}
                            placeholder="ملاحظات توضيحية حول مصرف المساهمة وتيسيرها..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#046A38] text-slate-800 font-sans"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsEditingGlobalAmount(false)}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingGlobalAmount}
                            className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059] flex items-center gap-1.5 transition-all"
                          >
                            {isSavingGlobalAmount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>حفظ واعتماد المبلغ الجديد</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* نافذة تعديل مبلغ مساهمة طالب معين (صلاحية المشرف العام) */}
                {editingContributionRecord && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] animate-scale-up">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#C5A059] shadow-xs">
                            <Edit className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#C5A059] block">صلاحية المشرف العام</span>
                            <h4 className="font-bold text-base text-[#046A38] font-serif">
                              تعديل مبلغ مساهمة الطالب
                            </h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingContributionRecord(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-500">اسم الطالب:</span>
                          <span className="font-bold text-slate-900">{editingContributionRecord.studentName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">الشهر المستحق:</span>
                          <span className="font-bold text-[#046A38]">{editingContributionRecord.monthLabel || editingContributionRecord.month}</span>
                        </div>
                      </div>

                      <form onSubmit={handleSaveRecordAmount} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            مبلغ المساهمة المعدّل للطالب: <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              required
                              min={0}
                              step={100}
                              value={editContributionAmount}
                              onChange={(e) => setEditContributionAmount(Number(e.target.value))}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-[#046A38] text-slate-900"
                            />
                            <span className="text-xs font-bold text-slate-700 font-mono px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">
                              {editingContributionRecord.currency || 'ريال يمني'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">يمكن تعديل المبلغ أو تخفيضه لصفر في حالات الإعفاء.</p>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">ملاحظات المشرف العام على التعديل (اختياري):</label>
                          <textarea
                            rows={2}
                            value={editContributionNotes}
                            onChange={(e) => setEditContributionNotes(e.target.value)}
                            placeholder="مثال: تم التخفيض مراعاة لظروف الطالب وظروف الأسرة..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#046A38] text-slate-800"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditingContributionRecord(null)}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingRecordAmount}
                            className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059] flex items-center gap-1.5 transition-all"
                          >
                            {isSavingRecordAmount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>حفظ تعديل المبلغ</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* نافذة تعديل مبلغ مساهمة المشترك (صلاحية المشرف العام) */}
                {editingSubscriptionItem && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] animate-scale-up">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#C5A059] shadow-xs">
                            <Edit className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#C5A059] block">صلاحية المشرف العام</span>
                            <h4 className="font-bold text-base text-[#046A38] font-serif">
                              تعديل مبلغ مساهمة المشترك
                            </h4>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingSubscriptionItem(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="bg-[#F9F6F0] p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-500">اسم المساهم / المشترك:</span>
                          <span className="font-bold text-slate-900">{editingSubscriptionItem.subscriberName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">القسم:</span>
                          <span className="font-bold text-slate-700">{editingSubscriptionItem.section === 'female' ? 'طالبات' : 'طلاب'}</span>
                        </div>
                      </div>

                      <form onSubmit={handleSaveSubscriptionAmount} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            مبلغ المساهمة المعدّل: <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              required
                              min={0}
                              step={100}
                              value={editSubscriptionAmount}
                              onChange={(e) => setEditSubscriptionAmount(Number(e.target.value))}
                              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-[#046A38] text-slate-900"
                            />
                            <span className="text-xs font-bold text-slate-700 font-mono px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">
                              {editingSubscriptionItem.currency}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditingSubscriptionItem(null)}
                            className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                          >
                            إلغاء
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingSubAmount}
                            className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-sm border border-[#C5A059] flex items-center gap-1.5 transition-all"
                          >
                            {isSavingSubAmount ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>حفظ تعديل المبلغ</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* 10. إدارة البلاغات (COMPLAINTS)                            */}
            {/* ======================================================== */}
            {activeTab === 'complaints' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">خدمة الطلاب والشكاوى</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">إدارة البلاغات والتذاكر الواردة</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    إجمالي التذاكر: {complaintsList.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {complaintsList.map((cmp) => (
                    <div key={cmp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 font-serif">{cmp.subject}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          cmp.status === 'resolved' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {cmp.status === 'resolved' ? 'تمت المعالجة' : 'قيد المتابعة'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{cmp.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>المرسل: <strong>{cmp.reporterName}</strong> ({cmp.reporterRole})</span>
                        <span className="font-mono">{cmp.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 11. سجل العمليات Audit Log                                */}
            {/* ======================================================== */}
            {/* 11. سجل العمليات Audit Log */}
            {activeTab === 'audit_logs' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">الرقابة والنزاهة</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">سجل العمليات الإدارية والأمنية الموثقة (Audit Trail)</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      توثيق آلي غير قابل للتعديل يوضح: المشرف + العملية + العنصر + التاريخ والوقت، محفوظ سحابياً في Firestore.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-mono">
                    العمليات المسجلة: {realAuditLogs.length > 0 ? realAuditLogs.length : auditLogsList.length}
                  </span>
                </div>

                <SystemAuditDiagnosticsWidget
                  currentAccount={currentAccount}
                  onRefreshAuditLogs={async () => {
                    const logs = await fetchAuditLogs();
                    setRealAuditLogs(logs);
                  }}
                />

                <AccessControlTester />

                {/* Audit Search & Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      placeholder="بحث في سجل العمليات باسم المشرف، العملية، أو العنصر..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#046A38]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const logs = await fetchAuditLogs();
                        setRealAuditLogs(logs);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تحديث السجل</span>
                    </button>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                      <tr>
                        <th className="p-4">نوع العملية</th>
                        <th className="p-4">المشرف / المنفذ</th>
                        <th className="p-4">العنصر المستهدف</th>
                        <th className="p-4">تفاصيل الإجراء</th>
                        <th className="p-4">التاريخ والوقت</th>
                        <th className="p-4 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(realAuditLogs.length > 0 ? realAuditLogs : auditLogsList.map(a => ({
                        id: a.id,
                        operatorName: a.operatorName,
                        operatorEmail: '',
                        operatorRole: a.operatorRole,
                        action: a.action,
                        targetItem: 'النظام العام',
                        details: a.details,
                        timestamp: a.timestamp,
                        status: a.status as any,
                        createdAtMs: 0
                      })))
                      .filter(log => {
                        if (!auditSearchQuery.trim()) return true;
                        const q = auditSearchQuery.toLowerCase();
                        return (
                          log.operatorName.toLowerCase().includes(q) ||
                          log.action.toLowerCase().includes(q) ||
                          (log.targetItem && log.targetItem.toLowerCase().includes(q)) ||
                          log.details.toLowerCase().includes(q)
                        );
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-[#046A38]">{log.action}</td>
                          <td className="p-4 font-bold text-slate-900">
                            <div>{log.operatorName}</div>
                            {log.operatorEmail && (
                              <div className="text-[10px] text-slate-400 font-normal">{log.operatorEmail}</div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-amber-900">{log.targetItem || '—'}</td>
                          <td className="p-4 text-slate-600 max-w-xs">{log.details}</td>
                          <td className="p-4 font-mono text-slate-400">{log.timestamp}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : log.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-rose-100 text-rose-900 border border-rose-200'
                            }`}>
                              {log.status === 'SUCCESS' ? 'ناجحة ✓' : log.status === 'WARNING' ? 'تنبيه' : 'فشلت'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* ======================================================== */}
            {/* 12. إدارة الأصول والهوية والشهادات (BRAND ASSETS & FIREBASE STORAGE) */}
            {/* ======================================================== */}
            {activeTab === 'brand_assets' && (
              <div className="space-y-6 animate-fade-in">
                <AdminBrandAssetsManager onBack={() => setActiveTab('analytics')} />
              </div>
            )}

            {/* ======================================================== */}
            {/* 13. إعدادات التصميم والتواصل (DESIGN & COMMUNICATION SETTINGS) */}
            {/* ======================================================== */}
            {activeTab === 'design_and_communication' && (
              <div className="space-y-6 animate-fade-in">
                <AdminDesignAndCommunicationManager 
                  onBack={() => setActiveTab('analytics')}
                  adminName={currentAccount.name || 'المشرف العام'}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Manual Brand, Certificate & Seal Customizer Modal */}
      {isBrandEditorOpen && (
        <React.Suspense fallback={null}>
          <ManualLogoEditorModal
            isOpen={isBrandEditorOpen}
            onClose={() => setIsBrandEditorOpen(false)}
          />
        </React.Suspense>
      )}

      {/* نافذة إعداد حساب الطالب وتعيين الحلقة والمعلم المعتمدة للمشرف */}
      {appForSetupModal && (
        <StudentAcceptanceSetupModal
          isOpen={Boolean(appForSetupModal)}
          onClose={() => setAppForSetupModal(null)}
          application={appForSetupModal}
          adminName={currentAccount.name || 'إدارة المقرأة'}
          onApprovedSuccess={(result) => {
            // تحديث قائمة طلبات التسجيل فوراً إلى accepted
            setStudentApplications(prev => prev.map(a => a.id === appForSetupModal.id ? {
              ...a,
              status: 'accepted',
              academicId: result.academicId,
              assignedHalqaTitle: result.halqaTitle,
              teacherName: result.teacherName,
              halqaDays: (result as any).halqaDays,
              halqaTime: (result as any).halqaTime,
              googleMeetUrl: result.googleMeetUrl,
              whatsappGroupUrl: result.whatsappGroupUrl,
              approvedAt: new Date().toISOString(),
              approvedBy: currentAccount.name,
            } : a));

            // تحديث قائمة الطلاب المعتمدين النشطين
            setStudentsList(prev => [
              {
                id: `std-${appForSetupModal.id.replace(/^app-/, '')}`,
                name: appForSetupModal.fullName,
                academicId: result.academicId,
                section: appForSetupModal.gender,
                memorization: appForSetupModal.memorization,
                halqaTitle: result.halqaTitle,
                teacherName: result.teacherName,
                status: 'active',
                registeredAt: new Date().toLocaleDateString('ar-SA'),
              },
              ...prev.filter(s => s.id !== `std-${appForSetupModal.id.replace(/^app-/, '')}`),
            ]);

            setFeedback({
              type: 'success',
              message: `تم قبول الطالب (${appForSetupModal.fullName}) بنجاح! تم إنشاء الرقم الأكاديمي (${result.academicId}) وتعيين الحلقة (${result.halqaTitle}) وفضيلة الشيخ (${result.teacherName}).`,
            });
          }}
        />
      )}

      {/* نافذة اعتماد وتعيين المعلم المعتمدة للمشرف */}
      {teacherForAcceptanceModal && (
        <TeacherAcceptanceSetupModal
          isOpen={Boolean(teacherForAcceptanceModal)}
          onClose={() => setTeacherForAcceptanceModal(null)}
          teacher={teacherForAcceptanceModal}
          adminName={currentAccount.name || 'المشرف العام'}
          onApprovedSuccess={() => {
            const tId = teacherForAcceptanceModal.uid || teacherForAcceptanceModal.id;
            const tName = teacherForAcceptanceModal.name || teacherForAcceptanceModal.fullName;
            setTeachersList(prev => prev.map(t => (t.id === tId || t.uid === tId) ? {
              ...t,
              status: 'active',
              isActive: true,
              isApproved: true,
            } : t));
            setFeedback({
              type: 'success',
              message: `تم اعتماد المعلم (${tName}) وتعيين الحلقات بنجاح!`,
            });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* نافذة تجهيز وإرسال رسالة واتساب للطالب (القبول أو الاعتذار) */}
      {/* ======================================================== */}
      {selectedAppForApproval && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border-2 border-[#C5A059] shadow-2xl space-y-4 animate-scale-up text-right">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                  selectedAppForApproval.academicId || selectedAppForApproval.app.status === 'approved'
                    ? 'bg-[#046A38]'
                    : 'bg-rose-600'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    {selectedAppForApproval.academicId || selectedAppForApproval.app.status === 'approved'
                      ? 'رسالة قبول الطالب عبر واتساب'
                      : 'رسالة الاعتذار والرفض عبر واتساب'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    الطالب: <strong>{selectedAppForApproval.app.fullName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppForApproval(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Academic ID Badge if approved */}
            {/* Academic ID Badge if approved */}
            {(selectedAppForApproval.academicId || selectedAppForApproval.app.academicId) && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950">الرقم الأكاديمي الفريد المعتمد:</span>
                <span className="font-mono text-sm font-bold bg-white px-3 py-1 rounded-xl border border-emerald-300 text-[#046A38]">
                  {selectedAppForApproval.academicId || selectedAppForApproval.app.academicId}
                </span>
              </div>
            )}

            {/* Recipient Phone Info Box */}
            {(() => {
              const appPhoneValidation = validateAndCleanWhatsAppNumber(
                selectedAppForApproval.app.whatsapp || selectedAppForApproval.app.phone,
                selectedAppForApproval.app.country
              );
              const cleanPhone = selectedAppForApproval.result?.cleanPhone || appPhoneValidation.cleanPhone;
              const formattedDisplay = selectedAppForApproval.result?.formattedDisplay || appPhoneValidation.formattedDisplay;
              const isValid = selectedAppForApproval.result?.isValid !== false && appPhoneValidation.isValid && Boolean(cleanPhone);

              return (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700" />
                      <span className="font-bold text-slate-700">رقم واتساب المستلم (دولي E.164):</span>
                    </div>
                    <div className="flex items-center gap-2" dir="ltr">
                      {isValid ? (
                        <span className="font-mono text-sm font-bold bg-white px-3 py-1 rounded-xl border border-emerald-300 text-[#046A38]">
                          {formattedDisplay}
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-300 text-rose-700">
                          غير صالح: {selectedAppForApproval.app.whatsapp || selectedAppForApproval.app.phone || 'غير مسجل'}
                        </span>
                      )}
                    </div>
                  </div>

                  {!isValid && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">تنبيه: رقم هاتف الطالب غير صالح لواتساب</strong>
                        <span>{appPhoneValidation.error || 'الرقم غير مكتمل أو رمز الدولة غير صحيح. يرجى تعديل رقم الطالب.'}</span>
                      </div>
                    </div>
                  )}

                  {/* Message Preview Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                      <span>نص الرسالة المجهزة للإرسال:</span>
                      {isValid && (
                        <span className="text-[11px] font-mono text-emerald-800" dir="ltr">
                          {formattedDisplay}
                        </span>
                      )}
                    </div>
                    <textarea
                      readOnly
                      rows={7}
                      value={selectedAppForApproval.result?.messageText || ''}
                      className="w-full bg-[#F9F6F0] border border-[#C5A059]/40 rounded-2xl p-3.5 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none resize-none select-text"
                    />
                  </div>

                  {/* WhatsApp Integration Status Notice */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      {selectedAppForApproval.result?.sentViaApi ? (
                        <span className="text-emerald-800 font-bold">
                          ✓ تم إرسال هذه الرسالة تلقائياً للطالب عبر WhatsApp Cloud API المربوط.
                        </span>
                      ) : (
                        <span>
                          <strong>إرسال مباشر:</strong> اضغط على زر «إرسال عبر واتساب» أدناه لفتح المحادثة جاهزة بنص الرسالة مباشرة للمشرف والضغط على إرسال يدوياً.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppMessage(selectedAppForApproval.result?.messageText || '')}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedWaMsg ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span className="text-emerald-700 font-bold">تم نسخ الرسالة!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>نسخ نص الرسالة</span>
                        </>
                      )}
                    </button>

                    {isValid ? (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(selectedAppForApproval.result?.messageText || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                        <span>إرسال عبر واتساب ↗</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFeedback({
                          type: 'error',
                          message: `تعذر فتح واتساب: ${appPhoneValidation.error || 'رقم هاتف الطالب غير صالح'}. يرجى التحقق من الرقم المسجل.`
                        })}
                        className="px-4 py-2.5 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                        title="رقم غير صالح"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>الرقم غير صالح للإرسال</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedAppForApproval(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* نافذة سبب الرفض وتأكيد إرسال رسالة الاعتذار             */}
      {/* ======================================================== */}
      {selectedAppForRejection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border-2 border-rose-300 shadow-2xl space-y-4 animate-scale-up text-right">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    رفض طلب التسجيل
                  </h3>
                  <p className="text-xs text-slate-500">
                    الطالب: <strong>{selectedAppForRejection.fullName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppForRejection(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                اختر أو اكتب سبب الرفض (سيُحفظ في السجل ويُرسل للطالب):
              </label>

              {/* Quick Preset Reasons */}
              <div className="flex flex-col gap-1.5">
                {[
                  'نعتذر لعدم توفر شواغر في الفترة الزمنية المحددة حالياً',
                  'البيانات غير مكتملة أو غير مطابقة لشروط وضوابط التسجيل',
                  'العمر دون الحد الأدنى المسموح به لحلقات المقرأة',
                  'اعتذار مؤقت مع الترحيب بالتقديم في الدورة القرآنية القادمة',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setRejectionReasonInput(reason)}
                    className={`p-2 rounded-xl text-right text-xs transition-all cursor-pointer border ${
                      rejectionReasonInput === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    • {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="اكتب سبب الرفض المخصص هنا..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none mt-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAppForRejection(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={!rejectionReasonInput.trim() || isRejectingAppId === selectedAppForRejection.id}
                onClick={handleConfirmRejection}
                className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isRejectingAppId === selectedAppForRejection.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>تأكيد الرفض وتجهيز رسالة واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد المعاينة والاختبار الإداري (دخول كطالب / كمعلم) */}
      {impersonateTargetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] text-right font-sans" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                  {impersonateTargetModal === 'student' ? (
                    <GraduationCap className="w-6 h-6 text-amber-700" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-[#046A38]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 font-serif">
                    جلسة معاينة واختبار إداري ({impersonateTargetModal === 'student' ? 'لوحة الطالب' : 'لوحة المعلم'})
                  </h3>
                  <span className="text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    وضع الرقابة والاختبار الإداري للمشرف
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImpersonateTargetModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center gap-2 text-[#046A38] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#046A38] shrink-0" />
                <span>ضوابط الجلسة الإدارية للأمان والخصوصية:</span>
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-600 pr-1">
                <li>هذه جلسة إدارية مخصصة للمشرف العام للاختبار والمتابعة والتحقق من تجربة المستخدم وسير الحلقات.</li>
                <li><strong>لا يتم تعديل أو كشف كلمة مرور أي مستخدم</strong> أو المساس ببياناته الشخصية أو حسابه بأي شكل من الأشكال.</li>
                <li>يتم توثيق بدء جلسة المعاينة وتوقيتها في سجل العمليات والرقابة (Audit Log) فوراً.</li>
                <li><strong>يمكنك العودة إلى حساب المشرف ولوحة الإدارة في أي لحظة</strong> عبر زر «العودة إلى لوحة المشرف» الثابت دائماً أعلى الشاشة.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImpersonateTargetModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmImpersonate}
                className="px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-[#C5A059] shadow-sm active:scale-95"
              >
                <span>تأكيد الدخول كـ {impersonateTargetModal === 'student' ? 'طالب' : 'معلم'}</span>
                <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد تغيير حالة الحساب وتوثيق السبب الأمني */}
      <UserStatusConfirmationModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          if (!isTogglingStatus) {
            setIsStatusModalOpen(false);
            setStatusModalUser(null);
          }
        }}
        onConfirm={handleConfirmToggleStatus}
        user={statusModalUser}
        targetStatus={statusModalTargetStatus}
        isProcessing={isTogglingStatus}
      />

      {/* نافذة إضافة حساب طالب أو معلم يدويًا للمشرف العام */}
      <AddUserAccountModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        initialRole={addUserRole}
        initialSection="male"
        onAccountCreated={async (account) => {
          setIsAddUserModalOpen(false);
          setFeedback({
            type: 'success',
            message: `تم إنشاء حساب ${account.role === 'student' ? 'الطالب' : 'المعلم'} [${account.name}] بنجاح، وتحديث البيانات فورياً في النظام وسجل التدقيق.`,
          });
          await loadAdminData(true);
        }}
      />

      {/* نافذة إدارة وإنشاء قاعات Google Meet الرسمية للمشرف العام */}
      <GoogleMeetManagerModal
        isOpen={isGoogleMeetModalOpen}
        onClose={() => {
          setIsGoogleMeetModalOpen(false);
          setTargetMeetHalqa(null);
        }}
        halqaTitle={targetMeetHalqa?.title || (meetModalMode === 'edit' ? editHalqaTitle : newHalqaTitle) || 'حلقة قرآنية تفاعلية'}
        onSelectMeetingUrl={async (url) => {
          if (meetModalMode === 'create') {
            setNewHalqaMeetUrl(url);
            setFeedback({ type: 'success', message: 'تم إدراج رابط قاعة Google Meet في نموذج إنشاء الحلقة.' });
          } else if (meetModalMode === 'edit') {
            setEditHalqaMeetUrl(url);
            setFeedback({ type: 'success', message: 'تم إدراج رابط قاعة Google Meet في نموذج تعديل الحلقة.' });
          } else if (targetMeetHalqa) {
            try {
              await updateHalqaDetailsBySupervisor({
                halqaId: targetMeetHalqa.id,
                googleMeetUrl: url,
              });
              setHalqasList(prev => prev.map(h => h.id === targetMeetHalqa.id ? { ...h, googleMeetUrl: url } : h));
              setFeedback({ 
                type: 'success', 
                message: `تم ربط قاعة Google Meet بالحلقة «${targetMeetHalqa.title}» بنجاح وتحديثها للطلاب فوراً.` 
              });
            } catch (err) {
              console.error('Error linking meet url to halqa:', err);
            }
          }
        }}
      />

      {/* نافذة تنزيل وتخصيص تقرير سير عمل المقرأة وطلب الدعم التشغيلي */}
      <SupervisorSupportReportModal
        isOpen={isSupportReportModalOpen}
        onClose={() => setIsSupportReportModalOpen(false)}
        users={usersList}
        students={studentsList}
        teachers={teachersList}
        halqas={halqasList}
        plans={plansList}
        certificates={certificatesList}
        studentApplications={studentApplications}
        issuedLogoUrl={brandSettings.customLogoUrl}
        issuedSealUrl={brandSettings.customSealUrl}
      />
    </div>
  );
};
