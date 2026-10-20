import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Award, User, Bell, ChevronLeft, 
  Video, CheckCircle2, Clock, Star, ArrowRight, LogOut,
  Sparkles, MessageCircle, FileText, Bookmark, Compass,
  Volume2, Shield, Settings, Edit3, Check, GraduationCap,
  Mic, Scroll, UserCheck, Library, CalendarDays, ExternalLink,
  BarChart3, TrendingUp, Activity, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  DbStudent, 
  DbEvaluation, 
  DbAnnouncement, 
  getAcademyDatabase, 
  saveAcademyDatabase, 
  getStudentEvaluations, 
  getStudentAttendance, 
  getStudentById 
} from '../data/academyDb';
import { AuthAccount, DailyRecitationRecord } from '../types';
import { getDailyRecitations } from '../data/evaluationStore';
import { getDesignAndCommunicationSettings } from '../services/designSettingsService';
import { DesignAndCommunicationSettings } from '../types/designAndCommunication';

const StudentAnalyticsDashboard = React.lazy(() => 
  import('./StudentAnalyticsDashboard').then(m => ({ default: m.StudentAnalyticsDashboard }))
);

interface StudentDashboardProps {
  currentAccount: AuthAccount;
  onLogout: () => void;
  onOpenVirtualRoom?: (roomUrl: string) => void;
  onOpenQuranReader?: () => void;
  onOpenAudioRecorder?: () => void;
  onOpenTajweedGuide?: () => void;
  onOpenCertificates?: () => void;
  onOpenQuranAudio?: () => void;
  onOpenLessonQuiz?: (lesson?: any) => void;
  onTestReminder?: () => void;
  onOpenStudentPortal?: () => void;
  onOpenAcademicPortal?: () => void;
  notificationPermission?: string;
  onRequestNotificationPermission?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentAccount,
  onLogout,
  onOpenVirtualRoom,
  onOpenQuranReader,
  onOpenAudioRecorder,
  onOpenTajweedGuide,
  onOpenCertificates,
  onOpenQuranAudio,
  onOpenLessonQuiz,
  onTestReminder,
  onOpenStudentPortal,
  onOpenAcademicPortal,
  notificationPermission,
  onRequestNotificationPermission,
}) => {
  // Mobile bottom tab: 'home' | 'lessons' | 'analytics' | 'records' | 'account'
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'lessons' | 'analytics' | 'records' | 'account'>('home');
  const [student, setStudent] = useState<DbStudent | null>(null);
  const [evaluations, setEvaluations] = useState<DbEvaluation[]>([]);
  const [dailyRecitations, setDailyRecitations] = useState<DailyRecitationRecord[]>(() => getDailyRecitations());
  const [announcements, setAnnouncements] = useState<DbAnnouncement[]>([]);
  const [activeDetailModal, setActiveDetailModal] = useState<'hifz' | 'murajaah' | 'schedule' | 'teacher' | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaveMessage, setProfileSaveMessage] = useState('');

  const [designSettings, setDesignSettings] = useState<DesignAndCommunicationSettings>(() => getDesignAndCommunicationSettings());

  // Listen to design & communication settings updates
  useEffect(() => {
    const handleDesignUpdate = (e: any) => {
      if (e.detail) setDesignSettings(e.detail);
      else setDesignSettings(getDesignAndCommunicationSettings());
    };
    window.addEventListener('rehab_design_settings_updated', handleDesignUpdate);
    return () => window.removeEventListener('rehab_design_settings_updated', handleDesignUpdate);
  }, []);

  // Load student data matching current logged-in user
  useEffect(() => {
    const refreshData = () => {
      const db = getAcademyDatabase();
      // Match by academicId, userId or name
      let found = db.students.find(
        (s) => s && (s.userId === currentAccount?.id || s.academicId === currentAccount?.username || s.name === currentAccount?.name)
      );
      if (!found && db.students.length > 0) {
        // Fallback to first student matching section or first student
        const isFemale = currentAccount?.section === 'female';
        found = isFemale
          ? db.students.find((s) => s && s.gender === 'female') || db.students[0]
          : db.students.find((s) => s && s.gender === 'male') || db.students[0];
      }
      if (found) {
        setStudent(found);
        setEditCity(found.cityCountry || '');
        setEditPhone(found.phone || '');
        setEvaluations(getStudentEvaluations(found.id));
      }
      setAnnouncements((db.announcements || []).filter((a) => a && (a.targetRole === 'all' || a.targetRole === 'students')));
      setDailyRecitations(getDailyRecitations());
    };

    refreshData();

    window.addEventListener('rehab_evaluations_updated', refreshData);
    window.addEventListener('rehab_db_updated', refreshData);
    return () => {
      window.removeEventListener('rehab_evaluations_updated', refreshData);
      window.removeEventListener('rehab_db_updated', refreshData);
    };
  }, [currentAccount]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const db = getAcademyDatabase();
    const idx = db.students.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      db.students[idx] = {
        ...db.students[idx],
        cityCountry: editCity,
        phone: editPhone,
      };
      saveAcademyDatabase(db);
      setStudent(db.students[idx]);
      setProfileSaveMessage('تم حفظ بياناتك بنجاح');
      setTimeout(() => {
        setProfileSaveMessage('');
        setIsEditingProfile(false);
      }, 1800);
    }
  };

  const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-slate-800 font-sans pb-24 select-none" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-emerald-900/10 sticky top-0 z-20 px-4 py-3 sm:px-6 shadow-xs backdrop-blur-md bg-white/95">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {student?.name ? student.name.charAt(0) : currentAccount?.name ? currentAccount.name.charAt(0) : 'ط'}
              </div>
              <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  السلام عليكم، {student?.name || currentAccount?.name || 'طالب المقرأة'}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <span className="text-emerald-700 font-bold">{student?.className || 'حلقة القرآن الكريم'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-mono text-xs font-semibold">{student?.academicId || 'STU-2026'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenAcademicPortal && (
              <button
                type="button"
                onClick={onOpenAcademicPortal}
                title="فتح النظام الأكاديمي لتعليم القرآن الكريم: خطط الحفظ، المراجعة، والتسميع"
                className="px-2.5 py-1.5 rounded-xl bg-[#046A38] text-white hover:bg-[#03542c] border border-[#C5A059] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📖 النظام الأكاديمي</span>
              </button>
            )}
            {onOpenStudentPortal && (
              <button
                type="button"
                onClick={onOpenStudentPortal}
                title="فتح البوابة الشاملة للطالب (12 صفحة متكاملة مع Firestore)"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📑 البوابة الشاملة (12 صفحة)</span>
              </button>
            )}
            {onTestReminder && (
              <button
                type="button"
                onClick={onTestReminder}
                title="تنبيهات مواعيد الحلقات (قبل 15 دقيقة) - تجربة الإشعار الآن"
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-350 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                <span className="hidden sm:inline">تنبيه الحلقة (15 دقيقة)</span>
              </button>
            )}
            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-5 space-y-4 sm:space-y-5">

        {/* ================= TAB 1: HOME (الرئيسية) ================= */}
        {activeBottomTab === 'home' && (
          <>
            {/* Motivational Quranic Bar */}
            <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/90 border border-emerald-100 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-quran text-base sm:text-lg font-bold text-emerald-950">
                  ﴿وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ﴾
                </span>
              </div>
              <span className="hidden sm:inline-block text-xs font-bold text-emerald-800 bg-white/90 px-3 py-1 rounded-full border border-emerald-200">
                مقرأة رحاب القرآن
              </span>
            </div>

            {/* ================= THE 6 MAIN EDUCATIONAL CARDS ================= */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  لوحة المتابعة والتعليم القرآني
                </h2>
                <span className="text-xs text-slate-500 font-medium">اختر أي بطاقة للاطلاع على التفاصيل</span>
              </div>

              {/* Grid class derived from designSettings with smooth responsiveness across mobile, tablet, and desktop */}
              <div 
                className={`grid gap-2.5 sm:gap-3.5 ${
                  designSettings.studentDashboard.mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'
                } ${
                  designSettings.studentDashboard.tabletColumns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
                } ${
                  designSettings.studentDashboard.desktopColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                }`}
              >
                {/* 1. 📖 حفظي */}
                <button
                  type="button"
                  onClick={() => setActiveDetailModal('hifz')}
                  className={`group relative rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xs hover:shadow-lg active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden ${
                    designSettings.studentDashboard.cardBorderHighlight
                      ? 'border-2 border-[#C5A059]/40 hover:border-[#046A38] hover:shadow-emerald-500/10 hover:-translate-y-1.5'
                      : 'border border-slate-200/80 hover:border-emerald-400 hover:-translate-y-1'
                  } ${
                    designSettings.studentDashboard.visualTheme === 'heritage'
                      ? 'bg-gradient-to-b from-[#F9F6F0]/90 to-white'
                      : designSettings.studentDashboard.visualTheme === 'emerald_classic'
                      ? 'bg-gradient-to-b from-emerald-50/40 to-white'
                      : 'bg-white'
                  } before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-emerald-100/90 transition-all duration-300">
                        📖
                      </div>
                      <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50/95 border border-emerald-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        الجزء {student?.currentJuz || 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                        حفظي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        تابع تقدمك في حفظ القرآن
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-emerald-700">
                    <span className="truncate">{student?.currentSurah ? `سورة ${student.currentSurah}` : 'سورة الكهف'}</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>

                {/* 2. 📚 مراجعتي */}
                <button
                  type="button"
                  onClick={() => setActiveDetailModal('murajaah')}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-400 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-amber-100/90 transition-all duration-300">
                        📚
                      </div>
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-50/95 border border-amber-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        تثبيت يومي
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                        مراجعتي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        راجع ما حفظت وثبّت محفوظك
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-amber-700">
                    <span className="truncate">خطة التثبيت والمراجعة</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-amber-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>

                {/* 3. 📅 جدولي */}
                <button
                  type="button"
                  onClick={() => setActiveDetailModal('schedule')}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-400 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-sky-100/90 transition-all duration-300">
                        📅
                      </div>
                      <span className="text-xs font-extrabold text-sky-800 bg-sky-50/95 border border-sky-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        حضور {student?.attendanceRate || 98}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-sky-800 transition-colors">
                        جدولي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        اعرف مواعيد حلقاتك القادمة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-sky-700">
                    <span className="truncate">{student?.nextLessonDate ? 'موعد التسميع القادم' : '3 أيام بالأسبوع'}</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-sky-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>

                {/* 4. 👨‍🏫 معلمي */}
                <button
                  type="button"
                  onClick={() => setActiveDetailModal('teacher')}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-400 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-purple-100/90 transition-all duration-300">
                        👨‍🏫
                      </div>
                      <span className="text-xs font-extrabold text-purple-800 bg-purple-50/95 border border-purple-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        مجاز بالسند
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-purple-800 transition-colors">
                        معلمي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        بيانات معلمك والتواصل معه
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-purple-700">
                    <span className="truncate">{student?.teacherName || 'الشيخ إبراهيم الوصابي'}</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-purple-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>

                {/* 5. 🎓 دروسي (بطاقة أساسية تنقل الطالب لصفحة الدروس) */}
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('lessons')}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-teal-200/90 shadow-xs hover:shadow-lg hover:shadow-teal-500/10 hover:border-teal-400 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden bg-gradient-to-br from-white to-teal-50/30 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-teal-100/90 transition-all duration-300">
                        🎓
                      </div>
                      <span className="text-xs font-extrabold text-teal-800 bg-teal-50/95 border border-teal-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        الحصص والمقرر
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-teal-800 transition-colors">
                        دروسي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        دروسك وحصصك التعليمية
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-teal-700">
                    <span className="truncate">عرض الدروس والحصص</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-teal-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>

                {/* 6. 👤 حسابي */}
                <button
                  type="button"
                  onClick={() => setActiveBottomTab('account')}
                  className="group relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex flex-col justify-between min-h-[148px] sm:min-h-[160px] cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-emerald-100/90 transition-all duration-300">
                        👤
                      </div>
                      <span className="text-xs font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full group-hover:animate-soft-pulse transition-all">
                        الملف الشخصي
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                        حسابي
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1 mt-0.5">
                        بياناتك وإعدادات حسابك
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs sm:text-sm font-bold text-emerald-700">
                    <span className="truncate">البيانات والإعدادات</span>
                    <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-emerald-700 group-hover:-translate-x-1 transition-all duration-300 shrink-0" />
                  </div>
                </button>
              </div>
            </section>

            {/* Next Class Hero Banner (الحصة القادمة - بطاقة الحلقة المباشرة) */}
            <section className="group relative bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white border border-emerald-700/50 hover:border-emerald-400/80 shadow-md hover:shadow-2xl hover:shadow-emerald-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden transition-all duration-300 hover:-translate-y-1">
              {/* Background Ambient Glow & Soft Pulse Aurora */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/15 rounded-full blur-2xl pointer-events-none animate-ambient-glow" style={{ animationDelay: '2s' }} />

              <div className="space-y-1.5 z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-xs font-black text-emerald-200 tracking-wide bg-emerald-950/70 border border-emerald-500/40 px-3 py-0.5 rounded-full shadow-xs animate-soft-pulse">
                    الحلقة المباشرة القادمة • بث حي
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-100 transition-colors">
                  {student?.className || 'حلقة الإتقان والتلاوة'}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/95 flex items-center gap-2 flex-wrap pt-0.5 font-medium">
                  <span className="flex items-center gap-1.5 font-semibold bg-emerald-900/50 px-3 py-1 rounded-xl border border-emerald-700/50">
                    <Clock className="w-4 h-4 text-emerald-300" />
                    {student?.nextLessonDate || 'غداً بعد صلاة الفجر (05:30 ص)'}
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 font-black">المقرر: {student?.nextLessonSurah ? `سورة ${student.nextLessonSurah}` : 'سورة الكهف'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onOpenVirtualRoom) {
                    onOpenVirtualRoom('https://meet.google.com/quran-rehab');
                  }
                }}
                className="relative group/btn w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-400/40 hover:scale-[1.03] z-10 shrink-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/25 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                <Video className="w-5 h-5 text-slate-950 group-hover/btn:rotate-12 transition-transform duration-300" />
                <span>دخول الحلقة الآن</span>
              </button>
            </section>

            {/* Analytics Dashboard Teaser Card (لوحة بيانات تحليلية لمستوى الحفظ والتجويد) */}
            <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-800/80 shadow-md relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
              <div className="relative z-10 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xs shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-white text-base sm:text-lg">
                          لوحة تحليلات الحفظ والتجويد
                        </h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                          بيانات تفاعلية
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                        رسم بياني يوضح مسار تطور الحفظ والتجويد بناءً على تقييمات المشايخ
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveBottomTab('analytics')}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>عرض الرسوم البيانية والرادار</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick stats mini-row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[11px] text-emerald-200/90 block mb-0.5 font-medium">معدل الحفظ والضبط</span>
                    <strong className="text-base sm:text-lg font-black text-white">
                      {latestEvaluation?.hifzScore || latestEvaluation?.score || 98}%
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[11px] text-amber-200/90 block mb-0.5 font-medium">معدل التجويد والمخارج</span>
                    <strong className="text-base sm:text-lg font-black text-amber-300">
                      {latestEvaluation?.tajweedScore || Math.max(70, (latestEvaluation?.score || 95) - 2)}%
                    </strong>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[11px] text-teal-200/90 block mb-0.5 font-medium">معدل التطور</span>
                    <strong className="text-base sm:text-lg font-black text-emerald-400 flex items-center justify-center gap-0.5">
                      <span>+5.2%</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Latest Evaluation (آخر تقييم معتمد) */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-base font-bold">
                    ⭐
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">آخر تقييم معتمد</h3>
                    <p className="text-xs text-slate-500 font-medium">نتيجة وملاحظات شيخ الحلقة</p>
                  </div>
                </div>
                {latestEvaluation && (
                  <span className="text-xs sm:text-sm font-black px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                    {latestEvaluation.grade} ({latestEvaluation.score}%)
                  </span>
                )}
              </div>

              {latestEvaluation ? (
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>السورة: <strong className="text-slate-950 font-black text-sm sm:text-base">{latestEvaluation.surah}</strong> (الآيات {latestEvaluation.fromAyah} - {latestEvaluation.toAyah})</span>
                    <span className="text-slate-400 text-xs font-semibold">{latestEvaluation.date}</span>
                  </div>
                  <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed text-xs sm:text-sm">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ملاحظات المعلم ({latestEvaluation.teacherName}):</span>
                    </p>
                    <p className="italic text-slate-700 leading-relaxed font-sans pr-5 font-medium">"{latestEvaluation.teacherNotes}"</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1">
                  <Award className="w-9 h-9 text-slate-300 mx-auto mb-1" />
                  <p className="text-sm text-slate-600 font-bold">لا توجد تقييمات مسجلة بعد</p>
                  <p className="text-xs text-slate-500 font-medium">فور استماع الشيخ لتسميعك سيتم رصد الدرجة وملاحظات التجويد هنا.</p>
                </div>
              )}
            </section>

            {/* Announcements (إعلانات المقرأة) */}
            <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Bell className="w-5 h-5 text-emerald-700" />
                <h3 className="font-black text-slate-900 text-base sm:text-lg">تنبيهات وإعلانات المقرأة</h3>
              </div>

              <div className="space-y-2.5">
                {announcements.slice(0, 2).map((ann) => (
                  <div key={ann.id} className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 text-right">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-sm sm:text-base text-slate-900">{ann.title}</h4>
                      <span className="text-xs text-slate-500 font-medium">{ann.date}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{ann.content}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ================= TAB 2: LESSONS (دروسي - صفحة الحصص والدروس) ================= */}
        {activeBottomTab === 'lessons' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Lessons Page Header */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl">
                    🎓
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">دروسي وحصصي التعليمية</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">منهجك القرآني والأدوات التفاعلية للحفظ والإتقان</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveBottomTab('home')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>الرئيسية</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current Lesson & Assignment Banner */}
            <div className="group relative bg-gradient-to-br from-[#0c2417] to-[#123824] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white border border-emerald-800/80 hover:border-emerald-500/80 shadow-md hover:shadow-xl hover:shadow-emerald-950/40 space-y-3 overflow-hidden transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none animate-ambient-glow" />
              <div className="flex items-center justify-between relative z-10">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-soft-pulse">
                  المقرر الحالي للحلقة
                </span>
                <span className="text-xs sm:text-sm text-emerald-200 font-semibold">
                  {student?.className || 'حلقة الحفظ والتثبيت'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-emerald-800/60 text-xs sm:text-sm relative z-10">
                <div>
                  <span className="text-emerald-300/90 block text-xs font-medium">السورة الحالية:</span>
                  <strong className="text-white text-sm sm:text-base font-black group-hover:text-amber-200 transition-colors">
                    {student?.currentSurah ? `سورة ${student.currentSurah}` : 'سورة الكهف'}
                  </strong>
                </div>
                <div>
                  <span className="text-emerald-300/90 block text-xs font-medium">الآيات المطلوبة:</span>
                  <strong className="text-amber-300 text-sm sm:text-base font-black">
                    من آية {student?.currentAyahStart || 1} إلى {student?.currentAyahEnd || 31}
                  </strong>
                </div>
                <div>
                  <span className="text-emerald-300/90 block text-xs font-medium">الجزء المستهدف:</span>
                  <strong className="text-white font-bold">الجزء {student?.currentJuz || 1}</strong>
                </div>
                <div>
                  <span className="text-emerald-300/90 block text-xs font-medium">معلم التسميع:</span>
                  <strong className="text-emerald-200 font-bold">{student?.teacherName || 'الشيخ إبراهيم الوصابي'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 relative z-10">
                <p className="text-xs text-emerald-200/90 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>موعد التسميع: {student?.nextLessonDate || 'الحصة القادمة بعد الفجر'}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenVirtualRoom) {
                      onOpenVirtualRoom('https://meet.google.com/quran-rehab');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md hover:shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Video className="w-4 h-4" />
                  <span>دخول الحلقة</span>
                </button>
              </div>
            </div>

            {/* The 4 Educational Class Modules */}
            <div className="space-y-2.5">
              <h3 className="text-sm sm:text-base font-black text-slate-800 px-1">الأدوات والمصادر التعليمية لحصصك:</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Module 1: المصحف الشريف والتفسير */}
                <button
                  type="button"
                  onClick={onOpenQuranReader}
                  className="group relative bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-emerald-100/90 transition-all duration-300">
                      📖
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-emerald-800 transition-colors">
                        المصحف الشريف والتفسير
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                        تصفح الآيات برسم المصحف، قراءة الورد اليومي ومطالعة معاني الكلمات والتفاسير المعتمدة.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-emerald-700 group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>

                {/* Module 2: تسجيل التسميع الصوتي */}
                <button
                  type="button"
                  onClick={onOpenAudioRecorder}
                  className="group relative bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-teal-100/90 transition-all duration-300">
                      🎙️
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-teal-800 transition-colors">
                        تسجيل التسميع الصوتي
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                        تسجيل المقرّر الصوتي بصوتك وإرساله للشيخ للاستماع إليه وتصحيح التلاوة بدقة.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-teal-700 group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>

                {/* Module 3: دليل أحكام التجويد */}
                <button
                  type="button"
                  onClick={onOpenTajweedGuide}
                  className="group relative bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-amber-100/90 transition-all duration-300">
                      📜
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-amber-800 transition-colors">
                        دليل أحكام التجويد والكلمات
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                        مرجع القواعد والمخارج والصفات وأحكام النون والميم والمدود مع تطبيقات عملية.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-amber-700 group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>

                {/* Module 4: الغرفة الافتراضية المباشرة (لحضور جلسات الحلقات المباشرة والتسميع الحي) */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenVirtualRoom) {
                      onOpenVirtualRoom('https://meet.google.com/quran-rehab');
                    }
                  }}
                  className="group relative bg-white p-4 rounded-2xl sm:rounded-3xl border border-sky-200/80 shadow-xs hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/15 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-sky-100/90 transition-all duration-300">
                      🎥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-sky-800 transition-colors">
                          الغرفة الافتراضية المباشرة
                        </h4>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full animate-soft-pulse">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-500"></span>
                          </span>
                          حلقة مباشرة
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                        حضور الجلسة الصوتية والمرئية المباشرة مع المعلم وزملائك في الحلقة للتسميع الحي.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-sky-700 group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>

                {/* Module 5: المصحف المعلم والمجود (جديد للاستماع والترديد) */}
                <button
                  type="button"
                  onClick={onOpenQuranAudio}
                  className="group relative bg-white p-4 rounded-2xl sm:rounded-3xl border-2 border-emerald-500/70 shadow-xs hover:border-[#046A38] hover:shadow-lg hover:shadow-emerald-500/15 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden sm:col-span-2 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-amber-300 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 group-hover:-rotate-3 shadow-md transition-all duration-300">
                      🎧
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#046A38] transition-colors">
                          المصحف المعلم والمجود للاستماع
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          ⭐ السور 114 كاملة
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                        الاستماع لجميع سور القرآن الكريم بأصوات كبار الأئمة (الحصري، المنشاوي، عبد الباسط، أيمن سويد) بترديد تعليمي وإتقان تجويدي متكامل.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-[#046A38] group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>

                {/* Module 6: اختبار قياس الاستيعاب الذاتي ورصد الدرجات لفتح المستويات */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLessonQuiz) {
                      onOpenLessonQuiz();
                    } else if (onOpenTajweedGuide) {
                      onOpenTajweedGuide();
                    }
                  }}
                  className="group relative bg-[#F9F6F0] p-4 rounded-2xl sm:rounded-3xl border-2 border-[#C5A059] shadow-xs hover:border-[#046A38] hover:shadow-lg hover:shadow-emerald-500/15 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out text-right flex items-start justify-between gap-3 cursor-pointer overflow-hidden sm:col-span-2 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full group-hover:before:translate-x-full before:transition-transform before:duration-700 before:pointer-events-none"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#046A38] text-[#C5A059] flex items-center justify-center text-xl shrink-0 group-hover:scale-110 shadow-md transition-all duration-300 font-bold">
                      ✏️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#046A38] transition-colors font-serif">
                          اختبار قياس الاستيعاب ورصد الدرجات (فتح المستوى التالي)
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#046A38] bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          🟢 نظام القفل والفتح
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed font-medium">
                        إجراء اختبار قصير لكل درس، وحساب الدرجة والنسبة المئوية وحفظها في Firestore لفتح المستوى التالي تلقائياً.
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#046A38] group-hover:-translate-x-1.5 transition-all duration-300 shrink-0 mt-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: ANALYTICS (لوحة البيانات التحليلية) ================= */}
        {activeBottomTab === 'analytics' && (
          <div className="space-y-4 animate-fadeIn">
            <React.Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-xs text-slate-500 font-bold">جاري تجهيز التحليلات والرسوم البيانية...</div>}>
              <StudentAnalyticsDashboard
                student={student}
                evaluations={evaluations}
                dailyRecitations={dailyRecitations}
                onOpenRecitationRecorder={onOpenAudioRecorder}
                onOpenCertificates={onOpenCertificates}
              />
            </React.Suspense>
          </div>
        )}

        {/* ================= TAB 3: RECORDS (سجلي - التقييمات والشهادات) ================= */}
        {activeBottomTab === 'records' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mb-0.5">سجل التسميع والتقييمات</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">سجل الإنجاز والدرجات المعتمدة من المشايخ</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveBottomTab('home')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>الرئيسية</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded Analytics Dashboard */}
            <React.Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-xs text-slate-500 font-bold">جاري تجهيز التحليلات والرسوم البيانية...</div>}>
              <StudentAnalyticsDashboard
                student={student}
                evaluations={evaluations}
                dailyRecitations={dailyRecitations}
                onOpenRecitationRecorder={onOpenAudioRecorder}
                onOpenCertificates={onOpenCertificates}
              />
            </React.Suspense>

            {/* Action for Certificates */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="font-black text-sm sm:text-base text-emerald-950">الشهادات والإجازات القرآنية</h4>
                <p className="text-xs sm:text-sm text-emerald-700 mt-0.5 font-medium">شهادات إتمام الأجزاء وإتقان التلاوة والرواية</p>
              </div>
              <button
                type="button"
                onClick={onOpenCertificates}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-black cursor-pointer transition-colors shadow-xs"
              >
                عرض الشهادات
              </button>
            </div>

            {/* List of evaluations */}
            <div className="space-y-3">
              {evaluations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm font-medium">
                  لا توجد تقييمات محفوظة حتى الآن
                </div>
              ) : (
                evaluations.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-200/80 shadow-xs text-right space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm sm:text-base text-slate-900">{ev.surah} (الآيات {ev.fromAyah} - {ev.toAyah})</span>
                      <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {ev.grade} ({ev.score}%)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap font-medium">
                      <span>المعلم: <strong className="text-slate-800 font-bold">{ev.teacherName}</strong></span>
                      <span>•</span>
                      <span>النوع: {ev.lessonType}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-semibold">{ev.date}</span>
                    </p>
                    {ev.teacherNotes && (
                      <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic leading-relaxed font-medium">
                        "{ev.teacherNotes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ACCOUNT (حسابي - الملف والإعدادات) ================= */}
        {activeBottomTab === 'account' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mb-0.5">حسابي وإعدادات الملف</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">بياناتك المسجلة في أكاديمية مقرأة رحاب القرآن</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveBottomTab('home')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>الرئيسية</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 shadow-xs text-right">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white font-black text-xl flex items-center justify-center shadow-xs">
                  {student?.name ? student.name.charAt(0) : 'ط'}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">{student?.name || currentAccount.name}</h2>
                  <p className="text-xs sm:text-sm text-emerald-800 font-black mt-0.5">{student?.className || 'حلقة القرآن الكريم'}</p>
                  <p className="text-xs text-slate-500 font-mono font-semibold mt-0.5">الرقم الأكاديمي: {student?.academicId || 'STU-2026'}</p>
                </div>
              </div>

              {profileSaveMessage && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold text-center">
                  {profileSaveMessage}
                </div>
              )}

              {/* Student info list */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">البريد الإلكتروني / الحساب:</span>
                  <span className="font-bold text-slate-900 font-mono" dir="ltr">{student?.email || currentAccount.username}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">رقم الهاتف / الواتساب:</span>
                  <span className="font-bold text-slate-900 font-mono" dir="ltr">{student?.phone || 'غير مسجل'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">الدولة / المدينة:</span>
                  <span className="font-bold text-slate-900">{student?.cityCountry || 'اليمن'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">نوع الدراسة:</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {student?.studyType === 'memorization' ? 'تحفيظ القرآن' :
                     student?.studyType === 'review' ? 'مراجعة' :
                     student?.studyType === 'consolidation' ? 'تثبيت حفظ' :
                     student?.studyType === 'sanad' ? 'إجازة بالسند' :
                     student?.studyType === 'foundation' ? 'تأسيس' : (student?.studyType || 'تحفيظ القرآن الكريم')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">الرواية القرآنية:</span>
                  <span className="font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                    {student?.riwayah || 'حفص عن عاصم'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">الوقت المناسب للحصة:</span>
                  <span className="font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    {student?.preferredTime || 'الصباح'} {student?.preferredTimeDetail ? `(${student.preferredTimeDetail})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">المعلم المشرف:</span>
                  <span className="font-black text-slate-900">{student?.teacherName || 'الشيخ إبراهيم الوصابي'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-medium">إجمالي الصفحات المنجزة:</span>
                  <span className="font-black text-emerald-800 text-sm sm:text-base">{student?.totalMemorizedPages || 360} صفحة</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs sm:text-sm text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  {isEditingProfile ? 'إلغاء التعديل' : 'تعديل البيانات الأساسية'}
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </div>

              {isEditingProfile && (
                <form onSubmit={handleUpdateProfile} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">المدينة / الدولة</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
                      placeholder="مثال: صنعاء / اليمن"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
                      placeholder="مثال: 096777123456"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-black cursor-pointer transition-colors shadow-xs"
                  >
                    حفظ التغييرات
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= DETAIL MODALS (حفظي، مراجعتي، جدولي، معلمي) ================= */}
      {activeDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4 text-right animate-scale-up">
            {/* Modal: حفظي */}
            {activeDetailModal === 'hifz' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg">
                      📖
                    </span>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">تفاصيل الحفظ والمقرر</h3>
                  </div>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    الجزء {student?.currentJuz || 1}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 font-medium">
                    <p className="flex justify-between">
                      <span className="text-slate-500">السورة الحالية:</span>
                      <strong className="text-slate-950 font-black">{student?.currentSurah || 'الكهف'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">الآيات المقررة:</span>
                      <strong className="text-emerald-800 font-black">من آية {student?.currentAyahStart || 1} إلى {student?.currentAyahEnd || 31}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">الصفحات المتقنة:</span>
                      <strong className="text-slate-950 font-black">{student?.totalMemorizedPages || 360} صفحة</strong>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    يتم تحديث تقدم الحفظ ومستوى الإتقان تلقائياً بعد كل جلسة تسميع يعتمدها شيخ الحلقة.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailModal(null);
                      if (onOpenQuranReader) onOpenQuranReader();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm cursor-pointer transition-colors shadow-xs"
                  >
                    فتح المصحف للورد
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDetailModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </>
            )}

            {/* Modal: مراجعتي */}
            {activeDetailModal === 'murajaah' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center text-lg">
                      📚
                    </span>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">خطة المراجعة والتثبيت</h3>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    تثبيت مستمر
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-2 font-medium">
                    <p className="font-black text-amber-950">نظام المراجعة المعتمد:</p>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      • مراجعة صغرى يومية: نصف جزء من المحفوظ الحديث.
                      <br />
                      • مراجعة كبرى أسبوعية: جزأين من المحفوظ القديم لتثبيت المتشابهات.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium">
                    <strong className="text-slate-900 block mb-0.5 font-bold">توصية المشايخ:</strong>
                    تكرار الورد القرآني في صلوات النوافل وقيام الليل لترسيخ الآيات ومنع النسيان.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailModal(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </>
            )}

            {/* Modal: جدولي */}
            {activeDetailModal === 'schedule' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center text-lg">
                      📅
                    </span>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">جدول ومواعيد الحلقات</h3>
                  </div>
                  <span className="text-xs font-black text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                    حضور {student?.attendanceRate || 98}%
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2 font-medium">
                    <p className="flex justify-between">
                      <span className="text-slate-500">الحلقة:</span>
                      <strong className="text-slate-900 font-bold">{student?.className || 'حلقة القرآن الكريم'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">الأيام الأسبوعية:</span>
                      <strong className="text-sky-950 font-black">السبت - الإثنين - الأربعاء</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">التوقيت:</span>
                      <strong className="text-slate-900 font-bold">بعد صلاة الفجر (05:30 ص بتوقيت مكة)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">الرواية القرآنية:</span>
                      <strong className="text-amber-900 font-bold">{student?.riwayah || 'حفص عن عاصم'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">فترة الدراسة المفضلة:</span>
                      <strong className="text-teal-900 font-bold">{student?.preferredTime || 'الصباح'} {student?.preferredTimeDetail ? `(${student.preferredTimeDetail})` : ''}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">الانتظام والالتزام:</span>
                      <strong className="text-emerald-800 font-black">ممتاز (حضور منتظم)</strong>
                    </p>
                  </div>

                  {/* Browser Halqa 15-Minute Reminder Card */}
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-amber-950">
                        <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
                        تذكير المتصفح بموعد الحلقة
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        قبل 15 دقيقة ⏰
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                      يرسل لك النظام إشعار متصفح مع نغمة هادئة قبل بداية حلقتك بـ 15 دقيقة، مع زر دخول فوري لحلقتك.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {onTestReminder && (
                        <button
                          type="button"
                          onClick={onTestReminder}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          تجربة التنبيه الآن (15 دقيقة) 🔔
                        </button>
                      )}
                      {onRequestNotificationPermission && notificationPermission !== 'granted' && (
                        <button
                          type="button"
                          onClick={onRequestNotificationPermission}
                          className="py-1.5 px-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          إذن المتصفح
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDetailModal(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </>
            )}

            {/* Modal: معلمي */}
            {activeDetailModal === 'teacher' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center text-lg">
                      👨‍🏫
                    </span>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">معلم الحلقة والتواصل</h3>
                  </div>
                  <span className="text-xs font-black text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    مجاز بالسند
                  </span>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1.5 font-medium">
                    <p className="text-sm sm:text-base font-black text-purple-950">{student?.teacherName || 'الشيخ إبراهيم الوصابي'}</p>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      مجاز بالقراءات العشر ومدرس القرآن الكريم والتجويد بالسند المتصل إلى رسول الله ﷺ.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium">
                    <span className="text-slate-500 block mb-0.5 font-bold">الإشراف الأكاديمي:</span>
                    إدارة مقرأة رحاب القرآن الإلكترونية - المتابعة المباشرة للحلقات.
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`السلام عليكم فضيلة الشيخ ${student?.teacherName || 'إبراهيم'}، أنا الطالب ${student?.name || ''} من حلقة ${student?.className || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة الشيخ عبر واتساب</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveDetailModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-30 px-2 sm:px-3 py-2 sm:py-2.5 shadow-lg">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
          {/* 1. الرئيسية */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('home')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'home'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeBottomTab === 'home' ? 'bg-emerald-50 text-emerald-800 scale-105' : ''}`}>
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">الرئيسية</span>
          </button>

          {/* 2. دروسي */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('lessons')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'lessons'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeBottomTab === 'lessons' ? 'bg-emerald-50 text-emerald-800 scale-105' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">دروسي</span>
          </button>

          {/* 3. التحليلات */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('analytics')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer relative ${
              activeBottomTab === 'analytics'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeBottomTab === 'analytics' ? 'bg-amber-100/80 text-amber-900 scale-105 shadow-2xs' : ''}`}>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">التحليلات</span>
          </button>

          {/* 4. سجلي */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('records')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'records'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeBottomTab === 'records' ? 'bg-emerald-50 text-emerald-800 scale-105' : ''}`}>
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">سجلي</span>
          </button>

          {/* 5. حسابي */}
          <button
            type="button"
            onClick={() => setActiveBottomTab('account')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
              activeBottomTab === 'account'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-bold'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeBottomTab === 'account' ? 'bg-emerald-50 text-emerald-800 scale-105' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5">حسابي</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
