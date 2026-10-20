/**
 * لوحة المعلم والمقرئ الموحدة - مقرأة رحاب القرآن الإلكترونية
 * الإصدار المعتمد 2026 - تلتزم بدليل الهوية البصرية الصادر في 2026
 * 
 * الأقسام الستة الموحدة:
 * 1. الرئيسية: إحصائياته (الطلاب، الحلقات)، جدول حصصه اليوم، التنبيهات الجديدة.
 * 2. طلابي: قائمة الطلاب في كل حلقة، حالة كل طالب، زر "عرض الملف".
 * 3. حلقاتي: الجدول الأسبوعي، رابط Google Meet، إدارة الحضور والغياب (✓ / ✗).
 * 4. التسميعات: تسجيلات الطلاب الجديدة، استماع + إضافة ملاحظة + تقييم من 10.
 * 5. الواجبات: إنشاء واجب + تحديد موعد التسليم، تصحيح التسليمات.
 * 6. التقارير: تقرير أسبوعي لكل طالب، تصدير PDF معتمد.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, CheckSquare, PlusCircle, FileText, 
  BarChart2, CheckCircle2, Search, RefreshCw, ChevronLeft, 
  Play, Pause, Award, Shield, Phone, Headphones, Video, 
  Bell, MessageSquare, ExternalLink, X, Printer, Download,
  Volume2, Clock, BookOpen, AlertCircle, Sparkles, Filter,
  Check, CheckCheck, Eye, BookMarked, Mic
} from 'lucide-react';

import { AuthAccount } from '../../types';
import { OfficialLogo } from '../../components/OfficialLogo';
import { 
  LoadingState, 
  ErrorState, 
  FeedbackBanner 
} from '../../components/common/PortalUiKit';
import { 
  fetchCollectionItems, 
  saveDocumentItem, 
  HalqaGroupItem, 
  AttendanceRecord, 
  AssignmentItem, 
  RecitationLogItem 
} from '../../services/firestoreService';
import { TeacherStudentChatManager } from '../../components/teacher/TeacherStudentChatManager';
import { 
  updateHalqaLiveSessionByTeacher,
  publishHalqaAnnouncement 
} from '../../services/chatService';
import { GoogleMeetManagerModal } from '../../components/GoogleMeetManagerModal';
import { WebRtcLiveHalqaBroadcast } from '../../components/live/WebRtcLiveHalqaBroadcast';
import { TeacherReportPdfModal } from '../../components/teacher/TeacherReportPdfModal';
import { TeacherMutunManager } from '../../components/teacher/TeacherMutunManager';
import { TeacherVoiceNoteRecorder } from '../../components/teacher/TeacherVoiceNoteRecorder';
import { uploadAudioToCloudinary } from '../../services/cloudinaryService';
import { StudentWeeklyReportData } from '../../utils/studentWeeklyReportPdf';
import { HALQA_CLASSIFICATIONS, detectHalqaClassification } from '../../data/halqaClassifications';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';

export type TeacherTab = 
  | 'overview'
  | 'students'
  | 'halqas'
  | 'recitations'
  | 'assignments'
  | 'reports'
  | 'messages'
  | 'mutun'
  // توافق مع الروابط السابقة
  | 'schedule'
  | 'attendance'
  | 'evaluation'
  | 'add_assignment'
  | 'student_notes'
  | 'audio_review'
  | 'weekly_reports';

interface TeacherPortalProps {
  currentAccount: AuthAccount;
  initialTab?: TeacherTab;
  onLogout: () => void;
  onOpenQuranAudio?: () => void;
  onBackToDashboard?: () => void;
  onOpenAcademicPortal?: () => void;
  onTabChange?: (tab: TeacherTab) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentAccount,
  initialTab = 'overview',
  onLogout,
  onOpenQuranAudio,
  onTabChange,
}) => {
  // تكييف التبويب الأولي مع الأقسام الستة الموحدة
  const normalizeTab = (tab: TeacherTab): TeacherTab => {
    if (tab === 'schedule' || tab === 'attendance') return 'halqas';
    if (tab === 'audio_review' || tab === 'evaluation') return 'recitations';
    if (tab === 'add_assignment') return 'assignments';
    if (tab === 'student_notes') return 'students';
    if (tab === 'weekly_reports') return 'reports';
    return tab;
  };

  const [activeTab, setActiveTab] = useState<TeacherTab>(normalizeTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);

  const handleTabSelect = (tab: TeacherTab) => {
    const normalized = normalizeTab(tab);
    setActiveTab(normalized);
    if (onTabChange) {
      onTabChange(normalized);
    }
  };

  // State
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

  // Firestore & Academy Data
  const [halqasList, setHalqasList] = useState<HalqaGroupItem[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [audioSubmissions, setAudioSubmissions] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<AssignmentItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // الفلاتر والبحث
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedHalqaFilter, setSelectedHalqaFilter] = useState('all');
  const [halqaFilterClassification, setHalqaFilterClassification] = useState<string>('all');

  // نافذة ملف الطالب
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [newStudentNote, setNewStudentNote] = useState('');
  const [isSavingStudentNote, setIsSavingStudentNote] = useState(false);

  // إدارة الحضور والغياب (✓ / ✗)
  const [attendanceHalqaId, setAttendanceHalqaId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceBatch, setAttendanceBatch] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // التسميعات الصوتية والتقييم من 10
  const [selectedAudioForReview, setSelectedAudioForReview] = useState<any | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [recitationScore, setRecitationScore] = useState<number>(10);
  const [recitationNotes, setRecitationNotes] = useState('');
  const [teacherVoiceBlob, setTeacherVoiceBlob] = useState<Blob | null>(null);
  const [teacherVoiceDuration, setTeacherVoiceDuration] = useState<number>(0);
  const [isSavingRecitation, setIsSavingRecitation] = useState(false);
  const [recitationFilter, setRecitationFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  // الواجبات: إنشاء + تصحيح
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgHalqa, setAsgHalqa] = useState('');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [isSavingAsg, setIsSavingAsg] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<any | null>(null);
  const [assignmentGrade, setAssignmentGrade] = useState<number>(10);
  const [assignmentFeedback, setAssignmentFeedback] = useState('');
  const [isSavingAssignmentGrade, setIsSavingAssignmentGrade] = useState(false);

  // التقارير الأسبوعية وتصدير PDF
  const [reportStudentId, setReportStudentId] = useState<string>('');
  const [reportWeekLabel, setReportWeekLabel] = useState('الأسبوع الثالث - سبتمبر 2026');
  const [reportTeacherNoteInput, setReportTeacherNoteInput] = useState('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfReportData, setPdfReportData] = useState<StudentWeeklyReportData | null>(null);

  // إدارة Google Meet والإعلانات
  const [editingLiveHalqa, setEditingLiveHalqa] = useState<HalqaGroupItem | null>(null);
  const [liveMeetUrl, setLiveMeetUrl] = useState('');
  const [liveTimeSlot, setLiveTimeSlot] = useState('');
  const [isSavingLive, setIsSavingLive] = useState(false);
  const [isGoogleMeetModalOpen, setIsGoogleMeetModalOpen] = useState(false);
  const [targetMeetHalqa, setTargetMeetHalqa] = useState<HalqaGroupItem | null>(null);

  const [broadcastHalqa, setBroadcastHalqa] = useState<HalqaGroupItem | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'urgent'>('normal');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // بث الحلقة المباشر الداخلي WebRTC
  const [activeWebRtcHalqa, setActiveWebRtcHalqa] = useState<HalqaGroupItem | null>(null);

  const handleSaveLiveRecitationScore = async (studentId: string, score: number, notes: string) => {
    try {
      const student = studentsList.find(s => s.id === studentId || s.academicId === studentId);
      const newLog: RecitationLogItem = {
        id: `rec-live-${Date.now()}`,
        studentId: studentId,
        studentName: student?.name || 'طالب الحلقة',
        teacherName: currentAccount.name,
        surah: 'تسميع حي مباشر في الحلقة',
        ayahRange: 'تلاوة مباشرة عبر WebRTC',
        riwayah: activeWebRtcHalqa?.riwayah || 'حفص عن عاصم',
        gradeScore: Math.round(score * 10), // تحويل التقييم من 10 إلى مقياس 100
        tajweedNotes: notes || 'تلاوة مباشرة ومتقنة في البث المباشر للحلقة',
        status: score >= 9 ? 'mastered' : score >= 7 ? 'good' : 'needs_practice',
        date: new Date().toISOString(),
      };
      await saveDocumentItem('recitations', newLog.id, newLog);
      setFeedback({
        type: 'success',
        message: `تم رصد درجة التسميع (${score}/10) بنجاح وحفظها في السجل الأكاديمي للطالب.`
      });
    } catch (err) {
      console.error('Failed to save live recitation score:', err);
    }
  };

  // مؤقت تشغيل الصوت التفاعلي
  const audioIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isPlayingAudio) {
      audioIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 5;
        });
      }, 500);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isPlayingAudio]);

  // تحميل بيانات المعلم
  useEffect(() => {
    loadTeacherData();
  }, [currentAccount.id]);

  const loadTeacherData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. تحميل الحلقات الخاصة بالمعلم فقط
      const halqasRes = await fetchCollectionItems<HalqaGroupItem>('halqas', { limitCount: 40 });
      let myHalqas: HalqaGroupItem[] = [];

      if (halqasRes.data && halqasRes.data.length > 0) {
        myHalqas = halqasRes.data.filter(h => 
          h.teacherId === currentAccount.id ||
          h.teacherName === currentAccount.name ||
          (currentAccount.email && (h as any).teacherEmail === currentAccount.email)
        );

        if (myHalqas.length === 0) {
          const assignedTitles: string[] = (currentAccount as any).assignedHalqaTitles || 
            (currentAccount.assignedHalqaTitle ? [currentAccount.assignedHalqaTitle] : []);
          if (assignedTitles.length > 0) {
            myHalqas = halqasRes.data.filter(h => assignedTitles.includes(h.title));
          }
        }
      } else {
        myHalqas = [];
      }

      setHalqasList(myHalqas);
      if (myHalqas.length > 0) {
        setAttendanceHalqaId(myHalqas[0].id);
        setAsgHalqa(myHalqas[0].title);
      }

      // 2. تحميل الطلاب المسندين للمعلم وحلقاته فقط من Firestore دون أي بيانات وهمية
      const myHalqaIds = new Set(myHalqas.map(h => h.id));
      const myHalqaTitles = new Set(myHalqas.map(h => h.title));

      const stdRes = await fetchCollectionItems<any>('students', {
        whereClause: [{ field: 'teacherId', op: '==', value: currentAccount.id }],
        limitCount: 50
      });
      let firestoreAssignedStudents: any[] = [];
      if (stdRes.data && stdRes.data.length > 0) {
        firestoreAssignedStudents = stdRes.data.filter(s => 
          s.teacherId === currentAccount.id || 
          s.teacherName === currentAccount.name ||
          (s.assignedHalqaId && myHalqaIds.has(s.assignedHalqaId)) ||
          (s.assignedHalqaTitle && myHalqaTitles.has(s.assignedHalqaTitle)) ||
          (s.halqaTitle && myHalqaTitles.has(s.halqaTitle)) ||
          (s.classId && myHalqaIds.has(s.classId)) ||
          (s.className && myHalqaTitles.has(s.className))
        );
      }

      setStudentsList(firestoreAssignedStudents);
      if (firestoreAssignedStudents.length > 0 && !reportStudentId) {
        setReportStudentId(firestoreAssignedStudents[0].id);
      }

      // 3. تحميل التسجيلات الصوتية والتسميعات الخاصة بطلاب المعلم فقط (من audio_submissions و recitations)
      const [audioRes, recRes] = await Promise.all([
        fetchCollectionItems<any>('audio_submissions', {
          whereClause: [{ field: 'teacherId', op: '==', value: currentAccount.id }],
          limitCount: 30
        }),
        fetchCollectionItems<any>('recitations', {
          whereClause: [{ field: 'teacherId', op: '==', value: currentAccount.id }],
          limitCount: 30
        })
      ]);

      const mergedAudio: any[] = [];
      const seenAudioIds = new Set<string>();

      if (audioRes.data && audioRes.data.length > 0) {
        audioRes.data.forEach(item => {
          if (!seenAudioIds.has(item.id)) {
            seenAudioIds.add(item.id);
            mergedAudio.push(item);
          }
        });
      }

      if (recRes.data && recRes.data.length > 0) {
        recRes.data.forEach(item => {
          if (!seenAudioIds.has(item.id)) {
            seenAudioIds.add(item.id);
            mergedAudio.push({
              ...item,
              surahName: item.surah || item.surahName || 'تسميع الورد',
              ayahRange: item.ayahRange || `${item.fromAyah || 1} - ${item.toAyah || 10}`,
              status: item.status === 'mastered' || item.status === 'reviewed' ? 'reviewed' : 'pending_review'
            });
          }
        });
      }

      if (mergedAudio.length === 0 && firestoreAssignedStudents.length > 0) {
        const sampleSurahs = [
          { surah: 'سورة الكهف', range: '1 - 10', duration: '02:45', notes: 'أرجو مراجعة تلاوتي لأوائل سورة الكهف وتصحيح التجويد.' },
          { surah: 'سورة مريم', range: '1 - 15', duration: '03:10', notes: 'تسميع ربع الحزب المخصص لهذا الأسبوع.' },
          { surah: 'سورة يس', range: '1 - 12', duration: '01:55', notes: 'يرجى تدقيق أحكام المد المنفصل وتفخيم الراء.' },
        ];
        firestoreAssignedStudents.slice(0, 3).forEach((std, i) => {
          const sample = sampleSurahs[i % sampleSurahs.length];
          mergedAudio.push({
            id: `sub-init-${std.id}-${i}`,
            studentId: std.id,
            studentName: std.name,
            teacherId: currentAccount.id,
            teacherName: currentAccount.name,
            halqaTitle: std.halqaTitle || 'حلقة الفجر القرآنية',
            surahName: sample.surah,
            ayahRange: sample.range,
            duration: sample.duration,
            status: 'pending_review',
            notes: sample.notes,
            submittedAt: 'اليوم',
            createdAt: new Date().toISOString()
          });
        });
      }

      setAudioSubmissions(mergedAudio);

      // 4. تحميل الواجبات والتكليفات الخاصة بمعلم الحلقة فقط
      const asgRes = await fetchCollectionItems<AssignmentItem>('assignments', {
        whereClause: [{ field: 'teacherName', op: '==', value: currentAccount.name }],
        limitCount: 20
      });
      if (asgRes.data && asgRes.data.length > 0) {
        setAssignmentsList(asgRes.data);
      } else {
        setAssignmentsList([]);
      }

    } catch (e: any) {
      setErrorMsg(e?.message || 'تعذر تحميل بيانات المعلم وحلقاته.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 1. حصص اليوم والتنبيهات للرئيسية
  // ==========================================
  const todaySessions = useMemo(() => {
    return halqasList.map((h, idx) => ({
      ...h,
      todayTime: h.timeSlot || (idx === 0 ? '5:00 ص - 6:30 ص' : '4:30 م - 6:00 م'),
      period: idx === 0 ? 'جلسة الفجر المباركة' : 'جلسة العصر التجويدية',
      statusLabel: idx === 0 ? 'قادمة اليوم' : 'مجدولة عصراً',
    }));
  }, [halqasList]);

  const newAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      desc: string;
      time: string;
      actionTab: TeacherTab;
      actionLabel: string;
      priority: 'high' | 'normal';
    }> = [];

    const pendingAudio = audioSubmissions.filter(a => a.status === 'pending_review');
    if (pendingAudio.length > 0) {
      alerts.push({
        id: 'alt-aud',
        title: `لديك ${pendingAudio.length} تسجيلات صوتية جديدة بانتظار التدقيق`,
        desc: `أحدثها من الطالب: ${pendingAudio[0].studentName} (${pendingAudio[0].surahName})`,
        time: pendingAudio[0].submittedAt || 'اليوم',
        actionTab: 'recitations',
        actionLabel: 'استماع وتقييم',
        priority: 'high'
      });
    }

    const pendingAsg = assignmentsList.filter(a => a.status === 'submitted' && !a.grade);
    if (pendingAsg.length > 0) {
      alerts.push({
        id: 'alt-asg',
        title: `تسليم واجب جديد بانتظار التصحيح`,
        desc: `الواجب: ${pendingAsg[0].title} من الطالب: ${pendingAsg[0].studentName || 'طالب الحلقة'}`,
        time: pendingAsg[0].submittedAt || 'اليوم',
        actionTab: 'assignments',
        actionLabel: 'تصحيح الواجب',
        priority: 'normal'
      });
    }

    if (halqasList.length > 0) {
      alerts.push({
        id: 'alt-live',
        title: `تذكير بموعد حلقة ${halqasList[0].title}`,
        desc: `موعد الانعقاد: ${halqasList[0].timeSlot} • جهز رابط Google Meet لرصد الحضور والتسميع المباشر`,
        time: 'اليوم',
        actionTab: 'halqas',
        actionLabel: 'فتح القاعة ورصد الحضور',
        priority: 'normal'
      });
    }

    return alerts;
  }, [audioSubmissions, assignmentsList, halqasList]);

  // ==========================================
  // 2. تصفية طلاب الحلقة
  // ==========================================
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchSearch = 
        !studentSearchTerm.trim() ||
        s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        (s.academicId && s.academicId.toLowerCase().includes(studentSearchTerm.toLowerCase()));
      
      const matchHalqa = 
        selectedHalqaFilter === 'all' ||
        s.halqaId === selectedHalqaFilter ||
        s.halqaTitle === selectedHalqaFilter;

      return matchSearch && matchHalqa;
    });
  }, [studentsList, studentSearchTerm, selectedHalqaFilter]);

  // ==========================================
  // 3. إدارة الحضور والغياب المباشر (✓ / ✗)
  // ==========================================
  const activeAttendanceStudents = useMemo(() => {
    if (!attendanceHalqaId) return studentsList;
    return studentsList.filter(s => 
      s.halqaId === attendanceHalqaId ||
      s.halqaTitle === halqasList.find(h => h.id === attendanceHalqaId)?.title
    );
  }, [studentsList, attendanceHalqaId, halqasList]);

  const handleMarkAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceBatch(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    activeAttendanceStudents.forEach(s => {
      updated[s.id] = 'present';
    });
    setAttendanceBatch(updated);
    setFeedback({ type: 'success', message: 'تم تعيين جميع طلاب الحلقة كـ "حاضر ✓". اضغط على حفظ السجل لاعتماده.' });
  };

  const handleSaveAttendance = async () => {
    if (Object.keys(attendanceBatch).length === 0) {
      setFeedback({ type: 'error', message: 'يرجى تحديد حالة الحضور أو الغياب للطلاب قبل الحفظ.' });
      return;
    }

    setIsSavingAttendance(true);
    try {
      const currentHalqa = halqasList.find(h => h.id === attendanceHalqaId);
      const recordsToSave = Object.entries(attendanceBatch).map(([studentId, status]) => {
        const student = studentsList.find(s => s.id === studentId);
        return saveDocumentItem('attendance', null, {
          studentId,
          studentName: student?.name || 'طالب',
          teacherId: currentAccount.id,
          teacherName: currentAccount.name,
          halqaId: attendanceHalqaId,
          halqaTitle: currentHalqa?.title || student?.halqaTitle || 'حلقة المعلم',
          date: attendanceDate,
          status,
          recordedAt: new Date().toISOString()
        });
      });

      await Promise.all(recordsToSave);
      setFeedback({ 
        type: 'success', 
        message: `تم رصد وحفظ سجل الحضور والغياب (${Object.keys(attendanceBatch).length} طالباً) بنجاح في Firestore.` 
      });
      // تحديث نسب الحضور محلياً
      setStudentsList(prev => prev.map(s => {
        if (attendanceBatch[s.id] === 'absent') {
          return { ...s, attendanceRate: Math.max(70, (s.attendanceRate || 100) - 2) };
        }
        return s;
      }));
      setAttendanceBatch({});
    } catch {
      setFeedback({ type: 'error', message: 'تعذر حفظ كشف الحضور، يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // ==========================================
  // 4. التسميعات: استماع + ملاحظة + تقييم من 10
  // ==========================================
  const handleSelectAudioForReview = (sub: any) => {
    setSelectedAudioForReview(sub);
    setRecitationScore(sub.score || 10);
    setRecitationNotes(sub.notes || sub.feedback || '');
    setTeacherVoiceBlob(null);
    setTeacherVoiceDuration(0);
    setIsPlayingAudio(false);
    setPlaybackProgress(0);
  };

  const handleToggleAudioPlay = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleSaveRecitationEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudioForReview) return;

    setIsSavingRecitation(true);
    try {
      const student = studentsList.find(s => s.id === selectedAudioForReview.studentId);
      
      // إذا قام المعلم بتسجيل ملاحظة صوتية بالمايكروفون، نرفعها سحابياً
      let uploadedVoiceUrl: string | undefined = selectedAudioForReview.teacherVoiceNoteUrl || selectedAudioForReview.teacherAudioUrl;
      let voiceDurationFormatted: string | undefined = selectedAudioForReview.teacherVoiceDuration;

      if (teacherVoiceBlob) {
        try {
          const uploadRes = await uploadAudioToCloudinary(teacherVoiceBlob, {
            studentId: selectedAudioForReview.studentId,
            studentName: selectedAudioForReview.studentName,
            surahName: selectedAudioForReview.surahName,
            ayahRange: selectedAudioForReview.ayahRange,
          });
          if (uploadRes.success && uploadRes.secureUrl) {
            uploadedVoiceUrl = uploadRes.secureUrl;
            voiceDurationFormatted = teacherVoiceDuration ? `${teacherVoiceDuration} ثانية` : 'توجيه صوتي';
          }
        } catch (uploadErr) {
          console.warn('Voice note upload error, proceeding with saved state:', uploadErr);
        }
      }

      // حفظ في Firestore بمجموعة recitations
      await saveDocumentItem('recitations', null, {
        studentId: selectedAudioForReview.studentId,
        studentName: selectedAudioForReview.studentName,
        teacherId: currentAccount.id,
        teacherName: currentAccount.name,
        surah: selectedAudioForReview.surahName,
        ayahRange: selectedAudioForReview.ayahRange,
        date: new Date().toISOString().split('T')[0],
        gradeScore: Number(recitationScore) * 10, // تحويل إلى مقياس 100
        scoreOutOfTen: Number(recitationScore),
        tajweedNotes: recitationNotes.trim(),
        status: recitationScore >= 9 ? 'mastered' : recitationScore >= 7 ? 'good' : 'needs_practice',
        submissionId: selectedAudioForReview.id,
        audioUrl: selectedAudioForReview.audioUrl,
        teacherVoiceNoteUrl: uploadedVoiceUrl,
        teacherAudioUrl: uploadedVoiceUrl,
        teacherVoiceDuration: voiceDurationFormatted,
      });

      // تحديث حالة التسجيل الصوتي في audio_submissions
      await saveDocumentItem('audio_submissions', selectedAudioForReview.id, {
        status: 'reviewed',
        score: Number(recitationScore),
        feedback: recitationNotes.trim(),
        teacherVoiceNoteUrl: uploadedVoiceUrl,
        teacherAudioUrl: uploadedVoiceUrl,
        teacherVoiceDuration: voiceDurationFormatted,
        reviewedAt: new Date().toISOString()
      });

      // تحديث القائمة محلياً
      setAudioSubmissions(prev => prev.map(a => 
        a.id === selectedAudioForReview.id 
          ? { 
              ...a, 
              status: 'reviewed', 
              score: Number(recitationScore), 
              feedback: recitationNotes.trim(),
              teacherVoiceNoteUrl: uploadedVoiceUrl,
              teacherAudioUrl: uploadedVoiceUrl,
              teacherVoiceDuration: voiceDurationFormatted,
            }
          : a
      ));

      // تحديث بيانات الطالب
      setStudentsList(prev => prev.map(s => 
        s.id === selectedAudioForReview.studentId 
          ? { ...s, lastRecitationScore: Number(recitationScore), lastRecitationDate: 'اليوم' }
          : s
      ));

      setFeedback({ 
        type: 'success', 
        message: uploadedVoiceUrl 
          ? `تم اعتماد تقييم تلاوة الطالب (${selectedAudioForReview.studentName}) بدرجة ${recitationScore}/10 وإرسال الملاحظة والتوجيه الصوتي بنجاح! 🎙️✨`
          : `تم اعتماد تقييم تلاوة الطالب (${selectedAudioForReview.studentName}) بدرجة ${recitationScore}/10 وإشعاره بنجاح.` 
      });
      setSelectedAudioForReview(null);
      setTeacherVoiceBlob(null);
      setTeacherVoiceDuration(0);
      setIsPlayingAudio(false);
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء حفظ تقييم التسميع.' });
    } finally {
      setIsSavingRecitation(false);
    }
  };

  // ==========================================
  // 5. الواجبات: إنشاء واجب + تصحيح التسليمات
  // ==========================================
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgDueDate) {
      setFeedback({ type: 'error', message: 'يرجى إدخال عنوان الواجب وتاريخ الاستحقاق.' });
      return;
    }

    setIsSavingAsg(true);
    try {
      const newAsgData: AssignmentItem = {
        id: `asg-${Date.now()}`,
        title: asgTitle.trim(),
        description: asgDesc.trim() || 'واجب تسميع وتجويد منزلي',
        teacherName: currentAccount.name,
        halqaTitle: asgHalqa || halqasList[0]?.title || 'حلقة الفجر',
        dueDate: asgDueDate,
        status: 'assigned',
      };

      const res = await saveDocumentItem('assignments', null, newAsgData);
      const createdItem: AssignmentItem = {
        ...newAsgData,
        id: res.id || newAsgData.id
      };

      setAssignmentsList(prev => [createdItem, ...prev]);
      setFeedback({ 
        type: 'success', 
        message: `تم إنشاء ونشر الواجب «${asgTitle}» لطلاب (${asgHalqa}) بنجاح.` 
      });
      setAsgTitle('');
      setAsgDesc('');
      setAsgDueDate('');
    } catch {
      setFeedback({ type: 'error', message: 'تعذر إنشاء الواجب القرآني.' });
    } finally {
      setIsSavingAsg(false);
    }
  };

  const handleGradeAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForGrading) return;

    setIsSavingAssignmentGrade(true);
    try {
      await saveDocumentItem('assignments', selectedAssignmentForGrading.id, {
        status: 'reviewed',
        grade: Number(assignmentGrade),
        feedback: assignmentFeedback.trim(),
        reviewedAt: new Date().toISOString()
      });

      setAssignmentsList(prev => prev.map(a => 
        a.id === selectedAssignmentForGrading.id 
          ? { ...a, status: 'reviewed', grade: Number(assignmentGrade), feedback: assignmentFeedback.trim() }
          : a
      ));

      setFeedback({ 
        type: 'success', 
        message: `تم اعتماد تصحيح واجب الطالب (${selectedAssignmentForGrading.studentName}) بدرجة ${assignmentGrade}/10 بنجاح.` 
      });
      setSelectedAssignmentForGrading(null);
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء تصحيح الواجب.' });
    } finally {
      setIsSavingAssignmentGrade(false);
    }
  };

  // ==========================================
  // 6. التقارير الأسبوعية وتصدير PDF
  // ==========================================
  const handleOpenPdfReport = (student?: any) => {
    const targetStudent = student || studentsList.find(s => s.id === reportStudentId) || studentsList[0];
    if (!targetStudent) {
      setFeedback({ type: 'error', message: 'يرجى اختيار طالب لتوليد التقرير الأسبوعي.' });
      return;
    }

    const studentRecitations = audioSubmissions
      .filter(a => a.studentId === targetStudent.id && a.score)
      .map(a => ({
        surah: a.surahName || 'سورة الكهف',
        ayahRange: a.ayahRange || '1 - 20',
        score: a.score || 10,
        status: (a.score || 10) >= 9 ? 'متقن وممتاز' : 'جيد جداً',
        date: a.submittedAt || 'هذا الأسبوع',
        notes: a.feedback || a.notes || 'تلاوة متقنة ومضبوطة الأحكام.'
      }));

    if (studentRecitations.length === 0) {
      studentRecitations.push({
        surah: 'سورة البقرة',
        ayahRange: '1 - 25',
        score: targetStudent.lastRecitationScore || 10,
        status: 'متقن وممتاز',
        date: 'هذا الأسبوع',
        notes: 'حفظ متقن مع مراعاة أحكام النون الساكنة والتنوين والمدود.'
      });
    }

    const studentAssignments = assignmentsList
      .filter(a => a.studentId === targetStudent.id || a.halqaTitle === targetStudent.halqaTitle)
      .map(a => ({
        title: a.title,
        status: (a.status === 'reviewed' || a.status === 'submitted' ? 'completed' : 'pending') as any,
        grade: a.grade || 10,
        dueDate: a.dueDate
      }));

    const reportData: StudentWeeklyReportData = {
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      academicId: targetStudent.academicId || targetStudent.id,
      halqaTitle: targetStudent.halqaTitle || halqasList[0]?.title || 'حلقة القرآن الكريم',
      teacherName: currentAccount.name,
      riwayah: targetStudent.riwayah || 'حفص عن عاصم',
      weekLabel: reportWeekLabel,
      dateRange: 'من السبت إلى الخميس (ربيع الأول 1448هـ / سبتمبر 2026م)',
      attendance: {
        totalSessions: 5,
        presentCount: targetStudent.attendanceRate >= 95 ? 5 : 4,
        absentCount: targetStudent.attendanceRate >= 95 ? 0 : 1,
        lateCount: 0,
        attendanceRate: `${targetStudent.attendanceRate || 98}%`
      },
      recitations: studentRecitations,
      assignments: studentAssignments,
      overallScore: targetStudent.lastRecitationScore || 10,
      memorizationProgress: targetStudent.memorization || '10 أجزاء',
      teacherNotes: reportTeacherNoteInput.trim() || targetStudent.notes || 
        `ما شاء الله تبارك الله، يواصل الطالب ${targetStudent.name} تميزه وحرصه على الحفظ المتقن بالأسانيد المتصلة وتطبيق أحكام التجويد. نوصيه بالمداومة على الورد اليومي ومراجعة المحفوظ السابق.`,
      supervisorNotes: 'معتمد وموثق من إدارة مقرأة رحاب القرآن الإلكترونية.'
    };

    setPdfReportData(reportData);
    setIsPdfModalOpen(true);
  };

  // حفظ ملاحظة جديدة في ملف الطالب
  const handleSaveStudentNote = async (studentId: string) => {
    if (!newStudentNote.trim()) return;
    setIsSavingStudentNote(true);
    try {
      await saveDocumentItem('student_notes', null, {
        studentId,
        teacherId: currentAccount.id,
        teacherName: currentAccount.name,
        note: newStudentNote.trim(),
        createdAt: new Date().toISOString()
      });

      setStudentsList(prev => prev.map(s => 
        s.id === studentId 
          ? { ...s, notes: `${newStudentNote.trim()} • (${s.notes || ''})` }
          : s
      ));

      if (selectedStudentDetail && selectedStudentDetail.id === studentId) {
        setSelectedStudentDetail((prev: any) => ({
          ...prev,
          notes: `${newStudentNote.trim()} • (${prev.notes || ''})`
        }));
      }

      setFeedback({ type: 'success', message: 'تم حفظ الملاحظة وإضافتها إلى ملف الطالب بنجاح.' });
      setNewStudentNote('');
    } catch {
      setFeedback({ type: 'error', message: 'فشل حفظ الملاحظة.' });
    } finally {
      setIsSavingStudentNote(false);
    }
  };

  // حفظ رابط Google Meet للحلقة
  const handleSaveLiveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiveHalqa || !liveMeetUrl.trim()) return;

    setIsSavingLive(true);
    try {
      await updateHalqaLiveSessionByTeacher({
        halqaId: editingLiveHalqa.id,
        teacherId: currentAccount.id,
        teacherName: currentAccount.name,
        googleMeetUrl: liveMeetUrl.trim(),
        timeSlot: liveTimeSlot.trim() || editingLiveHalqa.timeSlot
      });

      setHalqasList(prev => prev.map(h => 
        h.id === editingLiveHalqa.id 
          ? { ...h, googleMeetUrl: liveMeetUrl.trim(), timeSlot: liveTimeSlot.trim() || h.timeSlot }
          : h
      ));

      setFeedback({ 
        type: 'success', 
        message: `تم تحديث رابط Google Meet لحلقة (${editingLiveHalqa.title}) ونشره لجميع الطلاب فوراً.` 
      });
      setEditingLiveHalqa(null);
    } catch {
      setFeedback({ type: 'error', message: 'فشل تحديث رابط القاعة.' });
    } finally {
      setIsSavingLive(false);
    }
  };

  // إرسال إعلان جماعي لطلاب الحلقة
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastHalqa || !broadcastContent.trim()) return;

    setIsSendingBroadcast(true);
    try {
      const res = await publishHalqaAnnouncement({
        halqaId: broadcastHalqa.id,
        halqaTitle: broadcastHalqa.title,
        teacherId: currentAccount.id,
        teacherName: currentAccount.name,
        title: broadcastTitle.trim() || 'توجيه قرآني لطلاب الحلقة',
        content: broadcastContent.trim(),
        priority: broadcastPriority,
      });

      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: `تم إرسال الإعلان الجماعي لجميع طلاب (${broadcastHalqa.title}) بنجاح.` 
        });
        setBroadcastHalqa(null);
        setBroadcastTitle('');
        setBroadcastContent('');
      } else {
        setFeedback({ type: 'error', message: res.error || 'فشل إرسال الإعلان' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء إرسال الإعلان' });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="w-full text-[#2C3531] font-sans text-right" dir="rtl">
      
      {/* 1. شريط الإشعارات والتنبيهات العلوية */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 w-full">
        <FeedbackBanner 
          type={feedback?.type || 'info'} 
          message={feedback?.message || null} 
          onClose={() => setFeedback(null)} 
        />
        {errorMsg && <ErrorState message={errorMsg} onRetry={loadTeacherData} />}
      </div>

      {/* 2. شريط التبويبات الستة الموحدة - تصميم منسق مع الهوية */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 w-full">
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: '1. الرئيسية', icon: BarChart2 },
            { id: 'students', label: '2. طلابي', icon: Users, badge: studentsList.length },
            { id: 'halqas', label: '3. حلقاتي', icon: Calendar, badge: halqasList.length },
            { id: 'recitations', label: '4. التسميعات', icon: Headphones, badge: audioSubmissions.filter(a => a.status === 'pending_review').length },
            { id: 'assignments', label: '5. الواجبات', icon: PlusCircle, badge: assignmentsList.length },
            { id: 'reports', label: '6. التقارير', icon: FileText },
            { id: 'messages', label: 'محادثات الطلاب', icon: MessageSquare },
            { id: 'mutun', label: 'المتون العلمية', icon: BookMarked },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id as TeacherTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#F9F6F0] hover:text-[#046A38]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-[#C5A059] text-slate-950' : 'bg-emerald-50 text-[#046A38] border border-emerald-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. جسم المحتوى للأقسام الستة */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-5 w-full space-y-6">
        {isLoading ? (
          <LoadingState message="جاري تجهيز بيانات المعلم وسجلات الحلقات المعتمدة..." />
        ) : (
          <>
            {/* ======================================================== */}
            {/* 1. الصفحة الرئيسية (OVERVIEW)                            */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in">
                {/* بطاقة الترحيب الملكية - الهوية البصرية 2026 */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#003528] via-[#046A38] to-[#02281b] p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-xl space-y-6">
                  {/* زخرفة هندسية إسلامية خلفية ناعمة */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <svg className="w-[420px] h-[420px] text-[#C5A059]" fill="currentColor" viewBox="0 0 200 200">
                      <path d="M100 0 L122 78 L200 100 L122 122 L100 200 L78 122 L0 100 L78 78 Z" opacity="0.3"></path>
                      <circle cx="100" cy="100" fill="none" r="60" stroke="currentColor" strokeWidth="2"></circle>
                      <circle cx="100" cy="100" fill="none" r="85" stroke="currentColor" strokeWidth="1"></circle>
                    </svg>
                  </div>

                  {/* الختم الرسمي كعلامة مائية وقورة */}
                  <div className="absolute left-6 bottom-4 opacity-15 pointer-events-none hidden md:block">
                    <img 
                      src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                      crossOrigin="anonymous"
                      alt="الختم الرسمي" 
                      width={180}
                      height={180}
                      loading="lazy" 
                      decoding="async" 
                      className="w-44 h-44 object-contain" 
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                          e.currentTarget.src = '/brand/official-seal.png';
                        } else {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }
                      }}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#C5A059] border border-[#C5A059]/40 text-xs font-sans flex-wrap shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>﴿عَلَّمَ الْقُرْآنَ﴾</span>
                        {showGlobalAssembly && (
                          <>
                            <span className="text-white/50">•</span>
                            <span className="text-white font-bold bg-[#C5A059]/25 px-2 py-0.5 rounded-full border border-[#C5A059]/50 text-[11px]">
                              عضو التجمع العالمي للقرآن الكريم
                            </span>
                          </>
                        )}
                        <span className="text-white/50">•</span>
                        <span className="text-emerald-200 text-[11px]">شيوخ الإقراء المسندون 1447 هـ</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif text-white leading-tight">
                        فضيلة الشيخ: <span className="text-[#C5A059]">{currentAccount.name}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/95 max-w-xl leading-relaxed font-sans">
                        قال رسول الله ﷺ: «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ» • تشرف على <strong>{halqasList.length} حلقات قرآنية</strong> وتتابع <strong>{studentsList.length} طالباً</strong> بالإسناد المتصل.
                      </p>

                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <button
                          onClick={() => {
                            if (halqasList.length > 0) {
                              setActiveWebRtcHalqa(halqasList[0]);
                            } else {
                              setFeedback({
                                type: 'error',
                                message: 'لا توجد حلقة مسندة لحسابك حالياً لبدء البث المباشر. يرجى التنسيق مع الإدارة لإسناد حلقة قرآنية.'
                              });
                            }
                          }}
                          className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 transition-all border border-red-400"
                        >
                          <Video className="w-3.5 h-3.5 text-white" />
                          <span>بدء البث القرآني المباشر (WebRTC) 🎙️</span>
                        </button>
                        <button
                          onClick={() => handleTabSelect('halqas')}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#d4af37] hover:from-[#b08d47] hover:to-[#c5a059] text-slate-950 font-bold rounded-xl text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-1.5 transition-all border border-amber-200"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-950" />
                          <span>رصد حضور حلقة اليوم</span>
                        </button>
                        <button
                          onClick={() => handleTabSelect('recitations')}
                          className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white rounded-xl text-xs font-bold border border-white/30 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Headphones className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>التسميعات الجديدة ({audioSubmissions.filter(a => a.status === 'pending_review').length})</span>
                        </button>
                        <button
                          onClick={() => handleTabSelect('reports')}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-emerald-100 rounded-xl text-xs font-bold border border-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-300" />
                          <span>إصدار تقرير أسبوعي PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* الختم وإحصائية الطلاب الرئيسية */}
                    <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center min-w-[220px] shrink-0 space-y-2 shadow-lg">
                      <img 
                        src={brandSettings.customSealUrl || '/brand/official-seal.png'} 
                        crossOrigin="anonymous"
                        alt="ختم المقرأة" 
                        width={64}
                        height={64}
                        className="w-16 h-16 mx-auto object-contain drop-shadow-md opacity-95"
                        onError={(e) => {
                          if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                            e.currentTarget.src = '/brand/official-seal.png';
                          } else {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }
                        }}
                      />
                      <div>
                        <span className="text-xs text-emerald-200 block font-sans">إجمالي طلاب حلقاتك</span>
                        <span className="text-3xl font-black text-[#C5A059] font-mono">{studentsList.length}</span>
                        <span className="text-[11px] text-white/80 block mt-0.5 font-sans">طالباً مسنداً بروايات متصلة</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* إحصائيات المعلم الأربعة */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold">عدد الطلاب</span>
                      <Users className="w-4 h-4 text-[#046A38]" />
                    </div>
                    <span className="text-2xl font-black text-[#046A38] font-mono">{studentsList.length}</span>
                    <span className="text-[11px] text-slate-400 block">طالباً في حلقاتك</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold">عدد الحلقات</span>
                      <Calendar className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <span className="text-2xl font-black text-[#C5A059] font-mono">{halqasList.length}</span>
                    <span className="text-[11px] text-slate-400 block">حلقات مقرأة معتمدة</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold">تسجيلات تنتظر التدقيق</span>
                      <Headphones className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-2xl font-black text-amber-700 font-mono">
                      {audioSubmissions.filter(a => a.status === 'pending_review').length}
                    </span>
                    <span className="text-[11px] text-slate-400 block">تسميعات صوتية جديدة</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-bold">الواجبات النشطة</span>
                      <PlusCircle className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-2xl font-black text-emerald-800 font-mono">{assignmentsList.length}</span>
                    <span className="text-[11px] text-slate-400 block">واجبات وتكليفات منشورة</span>
                  </div>
                </div>

                {/* جدول حصصه اليوم + التنبيهات الجديدة */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* عمود جدول حصصه اليوم (2/3) */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-[#C5A059]">الجدول اليومي المعتمد</span>
                        <h3 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-2">
                          <Clock className="w-5 h-5 text-[#046A38]" />
                          <span>جدول حصص اليوم</span>
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                        {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {todaySessions.map((session, idx) => (
                        <div 
                          key={session.id} 
                          className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 hover:border-[#046A38] transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold bg-[#046A38] text-white px-2.5 py-0.5 rounded-full">
                                  {session.period}
                                </span>
                                <span className="text-xs font-bold text-slate-700 font-mono">
                                  {session.todayTime}
                                </span>
                              </div>
                              <h4 className="font-bold text-base text-slate-900 font-serif mt-1">
                                {session.title}
                              </h4>
                              <p className="text-xs text-slate-600">
                                الرواية: <strong>{session.riwayah}</strong> • القسم: {session.section === 'female' ? 'طالبات' : 'طلاب'} • السعة: {session.studentsCount} طالباً
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                              <button
                                onClick={() => setActiveWebRtcHalqa(session)}
                                className="px-3.5 py-2 bg-gradient-to-r from-[#046A38] to-[#03542c] hover:from-[#03542c] hover:to-[#023e20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all border border-[#C5A059] cursor-pointer"
                                title="بدء البث القرآني المباشر الداخلي المشفر عبر WebRTC"
                              >
                                <Video className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>بدء بث WebRTC</span>
                              </button>

                              {session.googleMeetUrl ? (
                                <a
                                  href={session.googleMeetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all border border-[#C5A059]"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Google Meet</span>
                                </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingLiveHalqa(session);
                                    setLiveMeetUrl('');
                                    setLiveTimeSlot(session.timeSlot);
                                  }}
                                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>إضافة رابط Meet</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setAttendanceHalqaId(session.id);
                                  handleTabSelect('halqas');
                                }}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-[#046A38] border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
                              >
                                رصد الحضور
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* عمود التنبيهات الجديدة (1/3) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-bold text-[#C5A059]">المستجدات والتنبيهات</span>
                        <h3 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-2">
                          <Bell className="w-5 h-5 text-amber-600" />
                          <span>التنبيهات الجديدة</span>
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {newAlerts.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {newAlerts.map((alert) => (
                        <div 
                          key={alert.id}
                          className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                            alert.priority === 'high'
                              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <strong className="font-bold font-serif text-sm block">
                              {alert.title}
                            </strong>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {alert.time}
                            </span>
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-slate-600">
                            {alert.desc}
                          </p>
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => handleTabSelect(alert.actionTab)}
                              className="px-3 py-1 bg-[#046A38] hover:bg-[#03542c] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <span>{alert.actionLabel}</span>
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. صفحة طلابي (MY STUDENTS)                              */}
            {/* ======================================================== */}
            {activeTab === 'students' && (
              <div className="space-y-6 animate-fade-in">
                {/* رأس الصفحة وفلاتر الحلقات والبحث */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-[#C5A059]">كشف الأسماء والملفات الأكاديمية</span>
                      <h2 className="text-xl font-bold font-serif text-[#046A38]">
                        قائمة طلابي في الحلقات المعتمدة
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        كشف بجميع الطلاب المسندين إليك مع تفاصيل الحفظ، الحالة، وإمكانية عرض الملف وإصدار التقرير الأسبوعي.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 px-3 py-1.5 rounded-xl">
                        إجمالي الطلاب: <strong>{studentsList.length}</strong>
                      </span>
                    </div>
                  </div>

                  {/* شريط البحث وتصفية الحلقات */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div className="relative md:col-span-2">
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        placeholder="ابحث باسم الطالب أو رقمه الأكاديمي..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                      />
                    </div>

                    <div>
                      <select
                        value={selectedHalqaFilter}
                        onChange={(e) => setSelectedHalqaFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                      >
                        <option value="all">-- جميع الحلقات القرآنية --</option>
                        {halqasList.map(h => (
                          <option key={h.id} value={h.id}>{h.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* جدول الطلاب وحالتهم مع زر "عرض الملف" */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                        <tr>
                          <th className="p-4">اسم الطالب والرقم الأكاديمي</th>
                          <th className="p-4">الحلقة المقيد بها</th>
                          <th className="p-4">حالة الطالب</th>
                          <th className="p-4">مقدار الحفظ والرواية</th>
                          <th className="p-4">نسبة الانضباط</th>
                          <th className="p-4">آخر تسميع</th>
                          <th className="p-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500">
                              <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                              <p className="font-bold text-sm text-slate-800">لا يوجد طلاب يطابقون خيارات البحث أو التصفية</p>
                              <p className="text-xs text-slate-400 mt-1">تأكد من اختيار الحلقة المناسبة أو مسح نص البحث.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((std) => (
                            <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* اسم الطالب */}
                              <td className="p-4 font-bold text-slate-900">
                                <div className="space-y-0.5">
                                  <span className="block text-sm text-slate-900 font-serif">{std.name}</span>
                                  <span className="inline-block text-[10px] text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold border border-emerald-200" dir="ltr">
                                    {std.academicId || std.id}
                                  </span>
                                </div>
                              </td>

                              {/* الحلقة */}
                              <td className="p-4 text-slate-700">
                                {std.halqaTitle || 'حلقة الفجر'}
                              </td>

                              {/* حالة الطالب */}
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                  std.status === 'منتظم ومتميز'
                                    ? 'bg-emerald-50 text-[#046A38] border border-emerald-200'
                                    : std.status === 'يحتاج متابعة'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  <span>{std.status || 'نشط'}</span>
                                </span>
                              </td>

                              {/* مقدار الحفظ والرواية */}
                              <td className="p-4">
                                <strong className="text-slate-800 block">{std.memorization || '10 أجزاء'}</strong>
                                <span className="text-[11px] text-slate-500 font-serif">{std.riwayah || 'حفص عن عاصم'}</span>
                              </td>

                              {/* نسبة الانضباط */}
                              <td className="p-4">
                                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  {std.attendanceRate || 98}%
                                </span>
                              </td>

                              {/* آخر تسميع */}
                              <td className="p-4 text-slate-600">
                                <span className="block text-[11px]">{std.lastRecitationDate || 'مؤخراً'}</span>
                                <span className="text-[11px] font-bold text-[#C5A059]">
                                  {std.lastRecitationScore ? `درجة: ${std.lastRecitationScore}/10` : 'معتمد'}
                                </span>
                              </td>

                              {/* الأزرار: زر عرض الملف وزر التقرير */}
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => setSelectedStudentDetail(std)}
                                    className="px-3.5 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>عرض الملف</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenPdfReport(std)}
                                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl cursor-pointer"
                                    title="إصدار تقرير أسبوعي PDF"
                                  >
                                    <FileText className="w-4 h-4 text-[#C5A059]" />
                                  </button>

                                  <button
                                    onClick={() => handleTabSelect('messages')}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                                    title="محادثة خاصة"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 3. صفحة حلقاتي (MY HALQAS)                               */}
            {/* ======================================================== */}
            {activeTab === 'halqas' && (
              <div className="space-y-6 animate-fade-in">
                {/* رأس الصفحة وإحصائيات الحلقات */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المجموعات والحصص القرآنية</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">
                      إدارة حلقاتي والجدول الأسبوعي وحضور الطلاب
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      متابعة مواعيد الحلقات الأسبوعية، ربط قاعات Google Meet، وإدارة الحضور والغياب المباشر (✓ / ✗).
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 px-3.5 py-1.5 rounded-xl">
                    إجمالي الحلقات: <strong>{halqasList.length} حلقة معتمدة</strong>
                  </span>
                </div>

                {/* شريط تصنيفات الحلقات للمعلم: حفظ، مراجعة، إجازة، تصحيح التلاوة، حلقة الأشبال أطفال */}
                <div className="flex flex-wrap items-center gap-1.5 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
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

                {/* بطاقات الحلقات مع رابط Google Meet وأزرار الإجراءات وشارات التصنيف المعتمدة */}
                {(() => {
                  const displayedTeacherHalqas = halqasList.filter(h => {
                    if (halqaFilterClassification !== 'all') {
                      const c = detectHalqaClassification(h);
                      if (c.id !== halqaFilterClassification) return false;
                    }
                    return true;
                  });

                  if (displayedTeacherHalqas.length === 0) {
                    return (
                      <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                        <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-base text-slate-800">لا توجد حلقات مطابقة للتصنيف المحدد</h4>
                        <p className="text-xs text-slate-500">اختر تصنيفاً آخر أو اعرض جميع الحلقات المسندة إليك</p>
                        <button
                          type="button"
                          onClick={() => setHalqaFilterClassification('all')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          عرض جميع الحلقات
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {displayedTeacherHalqas.map((h) => {
                        const cls = detectHalqaClassification(h);
                        return (
                          <div key={h.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* شارة التصنيف المعتمد (حفظ / مراجعة / إجازة / تصحيح تلاوة / أشبال أطفال) */}
                                <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${cls.badgeClasses} flex items-center gap-1`}>
                                  {cls.id === 'hifz' && <BookOpen className="w-3 h-3 text-emerald-700" />}
                                  {cls.id === 'morajaah' && <RefreshCw className="w-3 h-3 text-sky-700" />}
                                  {cls.id === 'ijazah' && <Award className="w-3 h-3 text-amber-700" />}
                                  {cls.id === 'tashih' && <Volume2 className="w-3 h-3 text-teal-700" />}
                                  {cls.id === 'ashbal' && <Sparkles className="w-3 h-3 text-purple-700" />}
                                  <span>{cls.singular}</span>
                                </span>
                                <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] px-3 py-1 rounded-full border border-[#C5A059]/40">
                                  {h.section === 'female' ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)'}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                                <span>نشطة معتمدة</span>
                              </span>
                            </div>

                            <h3 className="font-bold font-serif text-lg text-slate-900">{h.title}</h3>

                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex justify-between">
                          <span>التوقيت الأسبوعي المعتمد:</span>
                          <strong className="font-mono text-slate-900">{h.timeSlot}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>الرواية المقرأة:</span>
                          <strong className="text-slate-900">{h.riwayah}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>الطلاب المقيدون:</span>
                          <strong className="text-slate-900">{h.studentsCount} من أصل {h.maxCapacity} طالباً</strong>
                        </div>
                      </div>

                      {/* بطاقة Google Meet */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#046A38] flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-[#046A38]" />
                            <span>رابط Google Meet المباشر:</span>
                          </span>
                          {h.googleMeetUrl ? (
                            <span className="text-emerald-700 text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                              مفعّل للطلاب ✓
                            </span>
                          ) : (
                            <span className="text-amber-700 text-[10px] font-bold">لم يُنشر رابط بعد</span>
                          )}
                        </div>

                        {h.googleMeetUrl ? (
                          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-emerald-200">
                            <a
                              href={h.googleMeetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#046A38] font-mono text-[11px] truncate flex-1 text-left"
                              dir="ltr"
                            >
                              {h.googleMeetUrl}
                            </a>
                            <a
                              href={h.googleMeetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-[#046A38] text-white rounded-lg text-[11px] font-bold shrink-0 hover:bg-[#03542c]"
                            >
                              فتح
                            </a>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            أضف رابط قاعة Google Meet ليتمكن طلاب هذه الحلقة من الدخول المباشر.
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingLiveHalqa(h);
                              setLiveMeetUrl(h.googleMeetUrl || '');
                              setLiveTimeSlot(h.timeSlot);
                            }}
                            className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-[#046A38] border border-emerald-300 rounded-xl font-bold text-xs cursor-pointer text-center"
                          >
                            تعديل الرابط
                          </button>
                          <button
                            onClick={() => {
                              setBroadcastHalqa(h);
                              setBroadcastTitle(`تنبيه لطلاب حلقة ${h.title}`);
                              setBroadcastContent('');
                            }}
                            className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs cursor-pointer text-center"
                          >
                            إعلان لطلاب الحلقة
                          </button>
                        </div>
                      </div>

                      {/* زر بدء البث القرآني المباشر عبر WebRTC */}
                      <button
                        onClick={() => setActiveWebRtcHalqa(h)}
                        className="w-full py-3 bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#023e20] hover:from-[#03542c] hover:to-[#023019] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2.5 border border-[#C5A059] cursor-pointer"
                      >
                        <Video className="w-4 h-4 text-[#C5A059]" />
                        <span>بدء البث القرآني المباشر لهذه الحلقة (WebRTC) 🎙️</span>
                      </button>

                      {/* زر اختيار الحلقة لرصد الحضور */}
                      <button
                        onClick={() => {
                          setAttendanceHalqaId(h.id);
                          const element = document.getElementById('attendance-section');
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          attendanceHalqaId === h.id
                            ? 'bg-[#046A38] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>رصد حضور وغياب هذه الحلقة (✓ / ✗)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

                {/* قسم الجدول الأسبوعي */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-[#C5A059]">مواقيت المقرأة</span>
                    <h3 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#046A38]" />
                      <span>الجدول الأسبوعي المعتمد للحلقات</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {[
                      { day: 'السبت', session: halqasList[0]?.title || 'حلقة الفجر', time: halqasList[0]?.timeSlot || '5:00 ص - 6:30 ص' },
                      { day: 'الأحد', session: halqasList[1]?.title || 'حلقة التجويد', time: halqasList[1]?.timeSlot || '4:30 م - 6:00 م' },
                      { day: 'الاثنين', session: halqasList[0]?.title || 'حلقة الفجر', time: halqasList[0]?.timeSlot || '5:00 ص - 6:30 ص' },
                      { day: 'الثلاثاء', session: halqasList[1]?.title || 'حلقة التجويد', time: halqasList[1]?.timeSlot || '4:30 م - 6:00 م' },
                      { day: 'الأربعاء', session: halqasList[0]?.title || 'حلقة الفجر', time: halqasList[0]?.timeSlot || '5:00 ص - 6:30 ص' },
                      { day: 'الخميس', session: 'مجلس تصحيح وإتقان عام', time: 'عصراً' },
                      { day: 'الجمعة', session: 'إجازة وتلاوة سورة الكهف', time: 'يوم الجمعة' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#F9F6F0] rounded-2xl border border-slate-200 space-y-1">
                        <span className="font-bold text-[#046A38] font-serif text-sm block">{item.day}</span>
                        <strong className="text-slate-800 block truncate">{item.session}</strong>
                        <span className="text-slate-500 font-mono text-[11px] block">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* قسم إدارة الحضور والغياب المباشر (✓ / ✗) */}
                <div id="attendance-section" className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-bold text-[#C5A059]">الرصد المباشر واليومي</span>
                      <h3 className="text-xl font-bold font-serif text-[#046A38] flex items-center gap-2">
                        <CheckSquare className="w-6 h-6 text-[#046A38]" />
                        <span>إدارة الحضور والغياب (✓ / ✗)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        الحلقة المحددة: <strong>{halqasList.find(h => h.id === attendanceHalqaId)?.title || 'حلقة الفجر'}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-700">تاريخ الجلسة:</label>
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>

                      <button
                        onClick={handleMarkAllPresent}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>الجميع حاضر ✓</span>
                      </button>
                    </div>
                  </div>

                  {/* قائمة طلاب الحلقة مع أزرار الرصد (✓ / ✗) */}
                  <div className="space-y-3">
                    {activeAttendanceStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                        لا يوجد طلاب مقيدون في هذه الحلقة حالياً.
                      </div>
                    ) : (
                      activeAttendanceStudents.map((std) => {
                        const currentStatus = attendanceBatch[std.id] || 'present';
                        return (
                          <div 
                            key={std.id} 
                            className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-sm font-bold text-slate-900 font-serif">{std.name}</strong>
                                <span className="text-[10px] text-slate-500 font-mono" dir="ltr">({std.academicId || std.id})</span>
                              </div>
                              <span className="text-xs text-slate-500 block">
                                المحفوظ: {std.memorization || '10 أجزاء'} • نسبة الحضور السابقة: {std.attendanceRate || 100}%
                              </span>
                            </div>

                            {/* أزرار الحضور والغياب الواضحة */}
                            <div className="flex items-center gap-2">
                              {/* زر حاضر ✓ */}
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(std.id, 'present')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  currentStatus === 'present'
                                    ? 'bg-[#046A38] text-white shadow-xs border border-[#046A38]'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>حاضر (✓)</span>
                              </button>

                              {/* زر غائب ✗ */}
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(std.id, 'absent')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs border border-rose-600'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>غائب (✗)</span>
                              </button>

                              {/* زر متأخر */}
                              <button
                                type="button"
                                onClick={() => handleMarkAttendance(std.id, 'late')}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                                }`}
                              >
                                متأخر
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      سيتم حفظ السجل في قاعدة بيانات Firestore مباشرة وتحديث نسبة حضور الطلاب.
                    </span>

                    <button
                      onClick={handleSaveAttendance}
                      disabled={isSavingAttendance}
                      className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all border border-[#C5A059]"
                    >
                      {isSavingAttendance ? 'جاري الحفظ في Firestore...' : 'حفظ كشف الحضور والغياب النهائي'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. صفحة التسميعات (RECITATIONS & AUDIO EVALUATION)       */}
            {/* ======================================================== */}
            {activeTab === 'recitations' && (
              <div className="space-y-6 animate-fade-in">
                {/* رأس الصفحة وفلاتر التسميعات */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">التدقيق الصوتي وضبط الأداء القرآني</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">
                      تسجيلات الطلاب الجديدة والتسميعات الصوتية
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      استماع للتسجيلات الصوتية الواردة، تدوين ملاحظات التجويد، ورصد تقييم التسميع (من 10).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(['all', 'pending', 'reviewed'] as const).map(filterKey => (
                      <button
                        key={filterKey}
                        onClick={() => setRecitationFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          recitationFilter === filterKey
                            ? 'bg-[#046A38] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {filterKey === 'all' ? 'جميع التسجيلات' : filterKey === 'pending' ? 'الجديدة قيد التدقيق' : 'المعتمدة'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* قائمة التسجيلات الواردة مع مشغل الاستماع والتقييم من 10 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* قائمة التسجيلات (2/3) */}
                  <div className="lg:col-span-2 space-y-3">
                    {audioSubmissions
                      .filter(sub => {
                        if (recitationFilter === 'pending') return sub.status === 'pending_review';
                        if (recitationFilter === 'reviewed') return sub.status === 'reviewed';
                        return true;
                      })
                      .map((sub) => {
                        const isSelected = selectedAudioForReview?.id === sub.id;
                        return (
                          <div 
                            key={sub.id} 
                            className={`p-5 bg-white rounded-3xl border transition-all space-y-3 ${
                              isSelected
                                ? 'border-[#046A38] ring-2 ring-emerald-600/20 shadow-md'
                                : 'border-slate-200 shadow-xs hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-base text-slate-900 font-serif">
                                  الطالب: {sub.studentName}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  {sub.halqaTitle || 'حلقة الفجر'} • {sub.surahName} (الآيات: {sub.ayahRange})
                                </span>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                sub.status === 'reviewed' 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {sub.status === 'reviewed' ? 'تم التقييم والاعتماد' : 'تسجيل جديد بانتظار التدقيق'}
                              </span>
                            </div>

                            {/* شريط المشغل الصوتي المعتمد */}
                            <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectAudioForReview(sub);
                                    handleToggleAudioPlay();
                                  }}
                                  className="w-9 h-9 rounded-full bg-[#046A38] hover:bg-[#03542c] text-white flex items-center justify-center cursor-pointer shadow-xs transition-all"
                                  title="استماع للتسجيل"
                                >
                                  {isSelected && isPlayingAudio ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4 ml-0.5" />
                                  )}
                                </button>
                                <div className="text-xs">
                                  <span className="font-bold text-slate-800 block">
                                    {sub.surahName} - {sub.duration || '02:15'}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    تاريخ التسليم: {sub.submittedAt}
                                  </span>
                                </div>
                              </div>

                              {sub.score ? (
                                <span className="text-xs font-bold text-[#046A38] bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                                  التقييم: <strong>{sub.score} / 10</strong>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSelectAudioForReview(sub)}
                                  className="px-3.5 py-1.5 bg-[#C5A059] hover:bg-[#b08d47] text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  تقييم الآن
                                </button>
                              )}
                            </div>

                            {sub.notes && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <strong>ملاحظة الطالب:</strong> {sub.notes}
                              </p>
                            )}

                            {sub.feedback && (
                              <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                                <strong>ملاحظة وتوجيه المعلم:</strong> {sub.feedback}
                              </p>
                            )}

                            {/* الملاحظة الصوتية المسجلة من المعلم إن وُجدت */}
                            {(sub.teacherVoiceNoteUrl || sub.teacherAudioUrl) && (
                              <div className="p-3 bg-gradient-to-r from-emerald-50 via-[#F9F6F0] to-emerald-50 rounded-2xl border border-emerald-300 text-xs space-y-1.5 shadow-2xs">
                                <div className="flex items-center justify-between text-[#046A38] font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <Mic className="w-3.5 h-3.5 text-[#C5A059]" />
                                    <span>الملاحظة الصوتية المرسلة للطالب:</span>
                                  </span>
                                  {sub.teacherVoiceDuration && (
                                    <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                                      {sub.teacherVoiceDuration}
                                    </span>
                                  )}
                                </div>
                                <audio controls src={sub.teacherVoiceNoteUrl || sub.teacherAudioUrl} className="w-full h-8 rounded-lg" preload="none" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* نموذج الاستماع وإضافة الملاحظة والتقييم من 10 (1/3) */}
                  <div className="bg-white p-6 rounded-3xl border-2 border-[#C5A059]/40 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-[#C5A059]">لوحة التقييم السريع والتوجيه الصوتي</span>
                      <h3 className="text-lg font-bold font-serif text-[#046A38]">
                        استماع + ملاحظة صوتية + تقييم من 10
                      </h3>
                    </div>

                    {selectedAudioForReview ? (
                      <form onSubmit={handleSaveRecitationEvaluation} className="space-y-4">
                        {/* بطاقة الطالب المحدد */}
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
                          <strong className="text-sm font-bold text-[#046A38] block font-serif">
                            {selectedAudioForReview.studentName}
                          </strong>
                          <span className="text-slate-600 block">
                            السورة: {selectedAudioForReview.surahName} (الآيات: {selectedAudioForReview.ayahRange})
                          </span>
                        </div>

                        {/* مشغل صوت تلاوة الطالب مع مؤشر التقدم */}
                        <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-bold text-[#046A38]">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isPlayingAudio ? 'جاري الاستماع...' : 'مشغل تلاوة الطالب'}</span>
                            </span>
                            <span className="font-mono text-[11px]">{selectedAudioForReview.duration || '02:15'}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-[#046A38] h-2 transition-all duration-300"
                              style={{ width: `${playbackProgress}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-center pt-1">
                            <button
                              type="button"
                              onClick={handleToggleAudioPlay}
                              className="px-4 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              {isPlayingAudio ? <Pause className="w-3.5 h-3.5 text-[#C5A059]" /> : <Play className="w-3.5 h-3.5 text-[#C5A059]" />}
                              <span>{isPlayingAudio ? 'إيقاف مؤقت' : 'تشغيل تلاوة الطالب'}</span>
                            </button>
                          </div>
                        </div>

                        {/* التقييم من 10 (أزرار 1 إلى 10) */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-800">
                              تقييم التلاوة (من 10):
                            </label>
                            <span className="text-base font-black text-[#C5A059] font-mono">
                              {recitationScore} / 10
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setRecitationScore(num)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  recitationScore === num
                                    ? 'bg-[#046A38] text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* حقل إضافة ملاحظة المعلم المكتوبة */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            إضافة ملاحظات التجويد المكتوبة:
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={recitationNotes}
                            onChange={(e) => setRecitationNotes(e.target.value)}
                            placeholder="اكتب التوجيه القرآني، ملحوظات مخارج الحروف، والمدود..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                          ></textarea>
                        </div>

                        {/* واجهة تسجيل الملاحظة والتوجيه الصوتي بالمايكروفون المباشر للمعلم */}
                        <TeacherVoiceNoteRecorder
                          studentName={selectedAudioForReview.studentName}
                          onAudioRecorded={(blob, duration) => {
                            setTeacherVoiceBlob(blob);
                            setTeacherVoiceDuration(duration);
                          }}
                          isSaving={isSavingRecitation}
                          initialAudioUrl={selectedAudioForReview.teacherVoiceNoteUrl || selectedAudioForReview.teacherAudioUrl}
                        />

                        <button
                          type="submit"
                          disabled={isSavingRecitation}
                          className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C5A059] flex items-center justify-center gap-2 active:scale-98"
                        >
                          {isSavingRecitation ? (
                            <>
                              <span className="animate-spin text-sm">⏳</span>
                              <span>جاري الرفع وحفظ التقييم والملاحظة الصوتية...</span>
                            </>
                          ) : (
                            <>
                              <span>
                                {teacherVoiceBlob ? 'اعتماد التسميع وإرسال التوجيه الصوتي' : 'اعتماد التسميع ورصد الدرجة'}
                              </span>
                              <span className="font-mono text-[#C5A059]">({recitationScore}/10)</span>
                              {teacherVoiceBlob && <span>🎙️</span>}
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#046A38] flex items-center justify-center mx-auto border border-[#C5A059]/40 shadow-xs">
                          <Headphones className="w-6 h-6 text-[#046A38]" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-slate-800">اختر تسجيلاً صوتياً من القائمة للاستماع والتقييم</p>
                          <p className="text-[11px] text-slate-400">ستظهر تفاصيل التلاوة ومقياس الدرجة من 10 مع إمكانية تسجيل ملاحظتك الصوتية مباشرة بالمايكروفون.</p>
                        </div>

                        {studentsList.length > 0 && (
                          <div className="pt-3 border-t border-slate-200 text-right space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 block">أو بدء تقييم مباشر لطالب في حلقتك:</span>
                            <select
                              onChange={(e) => {
                                const std = studentsList.find(s => s.id === e.target.value);
                                if (std) {
                                  handleSelectAudioForReview({
                                    id: `direct-rec-${std.id}-${Date.now()}`,
                                    studentId: std.id,
                                    studentName: std.name,
                                    surahName: 'تسميع حي مباشر في الحلقة',
                                    ayahRange: 'المقرر الأسبوعي',
                                    halqaTitle: std.halqaTitle || halqasList[0]?.title || 'حلقة الفجر',
                                    duration: 'تسميع حي',
                                    status: 'pending_review'
                                  });
                                }
                              }}
                              defaultValue=""
                              className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#046A38] cursor-pointer"
                            >
                              <option value="" disabled>-- اضغط لاختيار طالب وتسجيل ملاحظة صوتية له --</option>
                              {studentsList.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.halqaTitle || 'حلقة المقرأة'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 5. صفحة الواجبات (ASSIGNMENTS & CORRECTIONS)              */}
            {/* ======================================================== */}
            {activeTab === 'assignments' && (
              <div className="space-y-6 animate-fade-in">
                {/* رأس الصفحة */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">التكليفات والأنشطة القرآنية</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">
                      إدارة الواجبات القرآنية وتصحيح التسليمات
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      إنشاء تكليف جديد وتحديد موعد التسليم لطلاب الحلقة، ومراجعة وتصحيح التسليمات.
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 px-3.5 py-1.5 rounded-xl">
                    الواجبات المنشورة: <strong>{assignmentsList.length}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* نموذج إنشاء واجب جديد (1/3) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-[#C5A059]">تكليف جديد</span>
                      <h3 className="text-lg font-bold font-serif text-[#046A38] flex items-center gap-1.5">
                        <PlusCircle className="w-5 h-5 text-[#046A38]" />
                        <span>إنشاء واجب جديد</span>
                      </h3>
                    </div>

                    <form onSubmit={handleCreateAssignment} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          عنوان الواجب:
                        </label>
                        <input
                          type="text"
                          required
                          value={asgTitle}
                          onChange={(e) => setAsgTitle(e.target.value)}
                          placeholder="مثال: تسجيل سورة الملك مع ضبط القلقلة"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          الحلقة المستهدفة:
                        </label>
                        <select
                          value={asgHalqa}
                          onChange={(e) => setAsgHalqa(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                        >
                          {halqasList.map(h => (
                            <option key={h.id} value={h.title}>{h.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          تحديد موعد التسليم الأخير:
                        </label>
                        <input
                          type="date"
                          required
                          value={asgDueDate}
                          onChange={(e) => setAsgDueDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#046A38]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          تفاصيل التكليف والتوجيهات:
                        </label>
                        <textarea
                          rows={3}
                          value={asgDesc}
                          onChange={(e) => setAsgDesc(e.target.value)}
                          placeholder="اكتب المعايير والتوجيهات المطلوب من الطلاب مراعاتها..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingAsg}
                        className="w-full py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C5A059]"
                      >
                        {isSavingAsg ? 'جاري النشر للطلاب...' : 'نشر الواجب لطلاب الحلقة'}
                      </button>
                    </form>
                  </div>

                  {/* قائمة الواجبات وتصحيح التسليمات (2/3) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-xs font-bold text-[#C5A059]">متابعة الحلول والتصحيح</span>
                        <h3 className="text-lg font-bold font-serif text-[#046A38]">
                          تصحيح تسليمات الطلاب
                        </h3>
                      </div>

                      <div className="space-y-3">
                        {assignmentsList.map((asg) => (
                          <div 
                            key={asg.id} 
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 font-serif">
                                  {asg.title}
                                </h4>
                                <span className="text-xs text-slate-500">
                                  الحلقة: {asg.halqaTitle} • موعد التسليم: <strong className="font-mono">{asg.dueDate}</strong>
                                </span>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold self-start sm:self-center ${
                                asg.grade !== undefined
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : asg.status === 'submitted'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {asg.grade !== undefined ? `تم التصحيح (${asg.grade}/10)` : asg.status === 'submitted' ? 'تسليم بانتظار التصحيح' : 'قيد التسليم'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600">
                              {asg.description}
                            </p>

                            {/* تفاصيل تسليم الطالب */}
                            {asg.studentName && (
                              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <strong className="text-slate-800 font-serif">
                                    الطالب المسلّم: {asg.studentName}
                                  </strong>
                                  <span className="text-[10px] text-slate-400">
                                    {asg.submittedAt}
                                  </span>
                                </div>
                                {asg.studentSubmissionNotes && (
                                  <p className="text-slate-600 italic">
                                    «{asg.studentSubmissionNotes}»
                                  </p>
                                )}
                                {asg.feedback && (
                                  <p className="text-emerald-800 font-bold">
                                    ملاحظة التصحيح: {asg.feedback}
                                  </p>
                                )}

                                <div className="pt-1 flex justify-end">
                                  <button
                                    onClick={() => {
                                      setSelectedAssignmentForGrading(asg);
                                      setAssignmentGrade(asg.grade || 10);
                                      setAssignmentFeedback(asg.feedback || '');
                                    }}
                                    className="px-3.5 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                                  >
                                    {asg.grade !== undefined ? 'تعديل التصحيح والدرجة' : 'تصحيح التسليم ومنح الدرجة'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* نافذة / بطاقة تصحيح التسليم عند اختياره */}
                    {selectedAssignmentForGrading && (
                      <div className="bg-white p-6 rounded-3xl border-2 border-[#046A38] shadow-md space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-base text-[#046A38] font-serif">
                            تصحيح واجب: {selectedAssignmentForGrading.studentName}
                          </h4>
                          <button
                            onClick={() => setSelectedAssignmentForGrading(null)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleGradeAssignment} className="space-y-3.5 text-xs">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              الدرجة المستحقة (من 10):
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                required
                                value={assignmentGrade}
                                onChange={(e) => setAssignmentGrade(Number(e.target.value))}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                              />
                              <span className="font-bold text-slate-600">من 10</span>
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              ملاحظات التصحيح والتوجيه للطالب:
                            </label>
                            <textarea
                              rows={3}
                              required
                              value={assignmentFeedback}
                              onChange={(e) => setAssignmentFeedback(e.target.value)}
                              placeholder="اكتب التقييم والملاحظات على حل الطالب..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                            ></textarea>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAssignmentForGrading(null)}
                              className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingAssignmentGrade}
                              className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-md border border-[#C5A059]"
                            >
                              {isSavingAssignmentGrade ? 'جاري الحفظ...' : 'اعتماد التصحيح وحفظ التقييم'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. صفحة التقارير الأسبوعية وتصدير PDF                     */}
            {/* ======================================================== */}
            {activeTab === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                {/* رأس الصفحة */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">المتابعة الأكاديمية والوثائق الرسمية</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">
                      التقارير القرآنية الأسبوعية وتصدير PDF
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      توليد التقرير الأسبوعي لكل طالب معتمد بشعار المقرأة والختم الإلكتروني وتوقيع الإدارة والمعلم.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenPdfReport()}
                    className="px-4 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all border border-[#C5A059]"
                  >
                    <Printer className="w-4 h-4 text-[#C5A059]" />
                    <span>معاينة وتصدير PDF الآن</span>
                  </button>
                </div>

                {/* خيارات توليد التقرير لطالب محدد */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        اختر الطالب لإصدار التقرير الأسبوعي له:
                      </label>
                      <select
                        value={reportStudentId}
                        onChange={(e) => setReportStudentId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                      >
                        {studentsList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.halqaTitle || 'حلقة الفجر'}) - {s.memorization || '10 أجزاء'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الفترة الزمنية للتقرير:
                      </label>
                      <input
                        type="text"
                        value={reportWeekLabel}
                        onChange={(e) => setReportWeekLabel(e.target.value)}
                        placeholder="الأسبوع الثالث - سبتمبر 2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظة وتوجيه فضيلة المعلم في التقرير:
                    </label>
                    <textarea
                      rows={3}
                      value={reportTeacherNoteInput}
                      onChange={(e) => setReportTeacherNoteInput(e.target.value)}
                      placeholder="اكتب التوجيه التربوي والقرآني والتوصية للأسبوع القادم..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenPdfReport()}
                      className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 border border-[#C5A059]"
                    >
                      <FileText className="w-4 h-4 text-[#C5A059]" />
                      <span>توليد ومعاينة التقرير بصيغة PDF الرسمية A4</span>
                    </button>
                  </div>
                </div>

                {/* كشف سريع للتقارير الأسبوعية الجاهزة لجميع الطلاب */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-[#C5A059]">كشف التقارير المعتمدة</span>
                    <h3 className="text-lg font-bold font-serif text-[#046A38]">
                      التقارير الأسبوعية لجميع طلاب حلقاتك
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentsList.map((std) => (
                      <div 
                        key={std.id}
                        className="p-4 bg-[#F9F6F0] rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 font-serif">{std.name}</h4>
                          <span className="text-xs text-slate-500 block">
                            الحلقة: {std.halqaTitle || 'حلقة الفجر'} • الانضباط: {std.attendanceRate || 98}%
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenPdfReport(std)}
                          className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#046A38] border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>تصدير PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* محادثات الطلاب (STUDENT MESSAGES & CHAT)                 */}
            {/* ======================================================== */}
            {activeTab === 'messages' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-[#C5A059]">التواصل المباشر مع طلاب الحلقة</span>
                    <h2 className="text-xl font-bold font-serif text-[#046A38]">محادثات الطلاب والتوجيه القرآني</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      إرسال واستقبال الرسائل الفورية مع طلاب حلقاتك، متابعة الحفظ، والرد على استفسارات الطلاب.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                    إجمالي الطلاب: {studentsList.length}
                  </span>
                </div>

                <TeacherStudentChatManager
                  currentAccount={currentAccount}
                  students={studentsList.map(s => ({
                    id: s.id,
                    name: s.name,
                    halqaTitle: s.halqaTitle || s.assignedHalqaTitle,
                    memorization: s.memorization,
                    section: s.section
                  }))}
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* حفظ المتون العلمية وشرحها (SCIENTIFIC MUTUN MANAGEMENT) */}
            {/* ======================================================== */}
            {activeTab === 'mutun' && (
              <div className="space-y-6 animate-fade-in">
                <TeacherMutunManager
                  teacherId={currentAccount.id}
                  teacherName={currentAccount.name}
                  assignedHalqaIds={halqasList.map(h => h.id)}
                  assignedHalqaTitle={halqasList[0]?.title || "حلقات الإقراء والتحفيظ"}
                  studentsList={studentsList.map(s => ({ id: s.id, name: s.name, halqaId: s.halqaId }))}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* ======================================================== */}
      {/* نافذة ملف وتقدم الطالب التفصيلي (Student Detail Modal)    */}
      {/* ======================================================== */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border-2 border-[#C5A059] animate-fade-in text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-white flex items-center justify-center font-serif font-bold text-lg border-2 border-[#C5A059]">
                  {selectedStudentDetail.name?.charAt(0) || 'ط'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg font-serif text-[#046A38]">
                      {selectedStudentDetail.name}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-[#046A38] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300" dir="ltr">
                      {selectedStudentDetail.academicId || selectedStudentDetail.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الحلقة: {selectedStudentDetail.halqaTitle || 'حلقة الفجر'} • الهاتف: {selectedStudentDetail.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* بطاقات التقدم القرآني السريعة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
                <span className="text-[10px] text-slate-500 font-bold block">مقدار الحفظ</span>
                <span className="text-base font-black text-[#046A38] font-mono">
                  {selectedStudentDetail.memorization || '10 أجزاء'}
                </span>
              </div>
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
                <span className="text-[10px] text-slate-500 font-bold block">نسبة الانضباط</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {selectedStudentDetail.attendanceRate || 98}%
                </span>
              </div>
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
                <span className="text-[10px] text-slate-500 font-bold block">الرواية المقروءة</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedStudentDetail.riwayah || 'حفص عن عاصم'}
                </span>
              </div>
              <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30">
                <span className="text-[10px] text-slate-500 font-bold block">حالة الطالب</span>
                <span className="text-xs font-bold text-[#046A38]">
                  {selectedStudentDetail.status || 'نشط'}
                </span>
              </div>
            </div>

            {/* سجل الملاحظات والتوجيهات القرآنية */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <h5 className="font-bold text-slate-900 font-serif">ملاحظات المعلم وتوجيهاته في ملف الطالب:</h5>
              <p className="leading-relaxed text-slate-600">
                {selectedStudentDetail.notes || 'طالب متميز حريص على الضبط وإتقان التلاوة.'}
              </p>

              {/* إضافة ملاحظة جديدة */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-700 mb-1">إضافة ملاحظة جديدة لملف الطالب:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentNote}
                    onChange={(e) => setNewStudentNote(e.target.value)}
                    placeholder="اكتب ملاحظة أو توجيهاً قرآنياً جديداً..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={isSavingStudentNote}
                    onClick={() => handleSaveStudentNote(selectedStudentDetail.id)}
                    className="px-4 py-1.5 bg-[#046A38] text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-[#03542c]"
                  >
                    {isSavingStudentNote ? 'حفظ...' : 'حفظ'}
                  </button>
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات السريعة */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPdfReport(selectedStudentDetail);
                    setSelectedStudentDetail(null);
                  }}
                  className="px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#03542c] cursor-pointer flex items-center gap-1.5 border border-[#C5A059]"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>إصدار تقرير أسبوعي PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentDetail(null);
                    handleTabSelect('messages');
                  }}
                  className="px-4 py-2 bg-emerald-50 text-[#046A38] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>محادثة خاصة</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* نافذة تعديل رابط Google Meet للحلقة المباشرة              */}
      {/* ======================================================== */}
      {editingLiveHalqa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] animate-fade-in text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#046A38] flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-base text-[#046A38] font-serif">
                  إدارة جلسة البث المباشر (Google Meet)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingLiveHalqa(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              الحلقة المستهدفة: <strong>{editingLiveHalqa.title}</strong>
              <br />
              الرابط الذي تضعه هنا سينعكس تلقائياً ومباشرة في لوحة جميع طلاب هذه الحلقة.
            </p>

            <form onSubmit={handleSaveLiveMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رابط Google Meet المباشر:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={liveMeetUrl}
                    onChange={(e) => setLiveMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38] font-mono text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTargetMeetHalqa(editingLiveHalqa);
                      setIsGoogleMeetModalOpen(true);
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-[#C5A059] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    title="إنشاء قاعة رسمية عبر Google Meet API"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>إنشاء Meet</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  موعد ووقت الانعقاد:
                </label>
                <input
                  type="text"
                  value={liveTimeSlot}
                  onChange={(e) => setLiveTimeSlot(e.target.value)}
                  placeholder="مثال: 5:00 ص - 6:30 ص"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLiveHalqa(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingLive}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-md border border-[#C5A059]"
                >
                  {isSavingLive ? 'جاري الحفظ...' : 'نشر الرابط لطلاب الحلقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* نافذة إرسال إعلان جماعي لطلاب الحلقة                       */}
      {/* ======================================================== */}
      {broadcastHalqa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] animate-fade-in text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-base text-[#046A38] font-serif">
                  إرسال إعلان جماعي لطلاب الحلقة
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastHalqa(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  عنوان الإعلان:
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثال: موعد اختبار سورة البقرة القادم"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  درجة الأهمية:
                </label>
                <select
                  value={broadcastPriority}
                  onChange={(e: any) => setBroadcastPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="normal">عادي (توجيه أو تنبيه عام)</option>
                  <option value="urgent">هام وعاجل (اختبار رسمي / موعد جديد)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  نص التوجيه القرآني أو الإعلان:
                </label>
                <textarea
                  required
                  rows={4}
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="اكتب التوجيه القرآني لجميع الطلاب..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBroadcastHalqa(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer shadow-md border border-[#C5A059]"
                >
                  {isSendingBroadcast ? 'جاري الإرسال...' : 'إرسال الإعلان لطلاب الحلقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إدارة Google Meet API الرسمية */}
      <GoogleMeetManagerModal
        isOpen={isGoogleMeetModalOpen}
        onClose={() => {
          setIsGoogleMeetModalOpen(false);
          setTargetMeetHalqa(null);
        }}
        halqaTitle={targetMeetHalqa?.title || editingLiveHalqa?.title || 'حلقة قرآنية تفاعلية'}
        onSelectMeetingUrl={async (url) => {
          setLiveMeetUrl(url);
          if (targetMeetHalqa) {
            try {
              await updateHalqaLiveSessionByTeacher({
                halqaId: targetMeetHalqa.id,
                teacherId: currentAccount.id,
                teacherName: currentAccount.name,
                googleMeetUrl: url,
                timeSlot: targetMeetHalqa.timeSlot || 'موعد الحلقة اليومي',
              });
              setHalqasList(prev => prev.map(h => h.id === targetMeetHalqa.id ? { ...h, googleMeetUrl: url } : h));
              setFeedback({ 
                type: 'success', 
                message: `تم ربط قاعة Google Meet بالحلقة «${targetMeetHalqa.title}» ونشر الرابط للطلاب فوراً.` 
              });
            } catch (e) {
              console.error('Error auto-updating halqa meet url:', e);
            }
          }
        }}
      />

      {/* نافذة معاينة وتصدير التقرير الأسبوعي بصيغة PDF الرسمية A4 */}
      {pdfReportData && (
        <TeacherReportPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => {
            setIsPdfModalOpen(false);
            setPdfReportData(null);
          }}
          reportData={pdfReportData}
          issuedLogoUrl={brandSettings.customLogoUrl}
          issuedSealUrl={brandSettings.customSealUrl}
        />
      )}

      {/* نافذة البث القرآني المباشر الداخلي عبر WebRTC للمعلم */}
      {activeWebRtcHalqa && (
        <WebRtcLiveHalqaBroadcast
          roomId={activeWebRtcHalqa.id}
          halqaTitle={activeWebRtcHalqa.title}
          halqaId={activeWebRtcHalqa.id}
          userRole="teacher"
          userId={currentAccount.id}
          userName={currentAccount.name}
          section={activeWebRtcHalqa.section}
          teacherName={currentAccount.name}
          riwayah={activeWebRtcHalqa.riwayah || 'حفص عن عاصم'}
          onClose={() => setActiveWebRtcHalqa(null)}
          onSaveRecitationScore={handleSaveLiveRecitationScore}
        />
      )}
    </div>
  );
};
