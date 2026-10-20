import React, { useState, useEffect } from 'react';
import { 
  User, Shield, CalendarCheck, Clock, Award, CheckCircle2, 
  Settings, BookOpen, AlertCircle, Save, Check, RefreshCw,
  Sparkles, FileText, Share2, Star, ShieldCheck, LogIn, LogOut,
  Bell, MessageSquare, Volume2, ToggleLeft, ToggleRight, Info, Instagram, Youtube
} from 'lucide-react';
import { UserProfile, AttendanceRecord, DailyRecitationRecord, StudentCertificate } from '../types';
import { OfficialLogo } from './OfficialLogo';
import { BankAccountsCard } from './BankAccountsCard';
import { 
  getDailyRecitations, 
  getStudentCertificates, 
  getGradeLabel, 
  getAttendanceStatusInfo 
} from '../data/evaluationStore';
import { getMasteredWordIds, getLessonProgressMap } from '../data/learningStore';
import { DIFFICULT_QURAN_WORDS } from '../data/difficultWordsData';
import { TAJWEED_CURRICULUM } from '../data/tajweedLessonsData';
import { 
  getUserNotificationSettings, 
  saveUserNotificationSettings, 
  triggerSheikhMessageNotification, 
  triggerRecitationApprovedNotification,
  UserNotificationSettings 
} from '../data/userNotificationStore';

interface ProfileViewProps {
  user: UserProfile;
  attendance: AttendanceRecord[];
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onToggleRole: () => void;
  onOpenRegistration?: (type?: 'male' | 'female' | 'teacher') => void;
  onNavigateTab?: (tab: string) => void;
  onLogoutToWelcome?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  attendance,
  onUpdateUser,
  onToggleRole,
  onOpenRegistration,
  onNavigateTab,
  onLogoutToWelcome,
}) => {
  const [name, setName] = useState(user.name);
  const [riwayah, setRiwayah] = useState(user.riwayah);
  const [level, setLevel] = useState(user.level);
  const [dailyTarget, setDailyTarget] = useState(user.dailyTargetPages);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>(() => getUserNotificationSettings());
  const [testNotificationToast, setTestNotificationToast] = useState<string | null>(null);

  // Recitations & Certificates
  const [recitations, setRecitations] = useState<DailyRecitationRecord[]>(() => getDailyRecitations());
  const [certificates, setCertificates] = useState<StudentCertificate[]>(() => getStudentCertificates());
  const [masteredWordIds, setMasteredWordIds] = useState<string[]>(() => getMasteredWordIds());
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, any>>(() => getLessonProgressMap());

  useEffect(() => {
    const handleRecUpdate = () => setRecitations(getDailyRecitations());
    const handleCertUpdate = () => setCertificates(getStudentCertificates());
    const handleLearningUpdate = () => {
      setMasteredWordIds(getMasteredWordIds());
      setLessonProgressMap(getLessonProgressMap());
    };
    const handleSettingsUpdate = (e: Event) => {
      const custom = e as CustomEvent<UserNotificationSettings>;
      if (custom.detail) {
        setNotificationSettings(custom.detail);
      } else {
        setNotificationSettings(getUserNotificationSettings());
      }
    };

    window.addEventListener('rehab_evaluations_updated', handleRecUpdate);
    window.addEventListener('rehab_certificates_updated', handleCertUpdate);
    window.addEventListener('rehab_learning_updated', handleLearningUpdate);
    window.addEventListener('rehab_user_notification_settings_updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('rehab_evaluations_updated', handleRecUpdate);
      window.removeEventListener('rehab_certificates_updated', handleCertUpdate);
      window.removeEventListener('rehab_learning_updated', handleLearningUpdate);
      window.removeEventListener('rehab_user_notification_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const handleToggleNotificationSetting = (key: keyof UserNotificationSettings) => {
    const updated = saveUserNotificationSettings({
      [key]: !notificationSettings[key]
    });
    setNotificationSettings(updated);
  };

  const handleTestSheikhMessage = () => {
    const res = triggerSheikhMessageNotification({
      sheikhName: 'مشرف قسم التلاوة',
      message: 'أحسنت في إتقان المدود والتزام أحكام التجويد، داوم على ترتيل وردك بخشوع وتثبيت.',
      surahName: 'سورة الملك'
    });
    if (res) {
      setTestNotificationToast('تم إرسال شريط منبثق تجريبي لرسالة الشيخ أعلى الشاشة بنجاح!');
    } else {
      setTestNotificationToast('تنبيهات رسائل المشايخ معطلة في الإعدادات حالياً، قم بتفعيلها لرؤية الشريط.');
    }
    setTimeout(() => setTestNotificationToast(null), 4500);
  };

  const handleTestRecitationApproval = () => {
    const res = triggerRecitationApprovedNotification({
      sheikhName: 'مقرئ الحلقة المعتمد',
      studentName: user.name,
      surahName: 'سورة الكهف',
      ayahStart: 1,
      ayahEnd: 25,
      score: 98,
      grade: 'ممتاز',
      feedback: 'تلاوة ندية محكمة واستحضار متقن بالسند المتصل، بارك الله فيك.'
    });
    if (res) {
      setTestNotificationToast('تم إرسال شريط منبثق تجريبي لاعتماد التلاوة أعلى الشاشة بنجاح!');
    } else {
      setTestNotificationToast('تنبيهات قبول التلاوة معطلة في الإعدادات حالياً، قم بتفعيلها لرؤية الشريط.');
    }
    setTimeout(() => setTestNotificationToast(null), 4500);
  };

  // Filter for this user's name if applicable, or show recent
  const userRecitations = recitations.filter(
    (r) => r.studentName.toLowerCase().includes(user.name.toLowerCase()) || r.studentId === user.id
  );
  const displayRecitations = userRecitations.length > 0 ? userRecitations : recitations.slice(0, 3);

  const userCertificates = certificates.filter(
    (c) => c.studentName.toLowerCase().includes(user.name.toLowerCase()) || c.studentId === user.id
  );
  const displayCertificates = userCertificates.length > 0 ? userCertificates : certificates.slice(0, 2);


  const handleSave = () => {
    onUpdateUser({
      name,
      riwayah,
      level,
      dailyTargetPages: dailyTarget,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const riwayahOptions = [
    'حفص عن عاصم من طريق الشاطبية',
    'ورش عن نافع من طريق الأزرق',
    'قالون عن نافع من طريق الشاطبية',
    'الدوري عن أبي عمرو البصري',
    'شعبة عن عاصم الكوفي',
    'ابن كثير المكي بروايتي قنبل والبزي'
  ];

  const levelOptions = [
    'مبتدئ (تصحيح مخارج وتلاوة)',
    'متوسط (حفظ من 5 إلى 15 جزءاً)',
    'متقدم (حفظ أكثر من 20 جزءاً)',
    'خاتم لكتاب الله ومستعد للإجازة'
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Overview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0e271a] via-[#102d1e] to-[#0a1e15] border border-emerald-800/60 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700/60 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-xl shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{user.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                user.role === 'teacher'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              }`}>
                {user.role === 'teacher' ? 'مقرئ وشيخ الحلقة' : 'طالب المقرأة'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">{user.riwayah}</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">{user.level}</p>
          </div>
        </div>

        {/* Quick Role Switch & Account Switch */}
        <div className="mt-3 pt-3 border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={onToggleRole}
            className="px-3 py-1.5 rounded-xl bg-[#08170f] border border-emerald-800 text-xs font-semibold text-amber-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {user.role === 'teacher' ? 'التبديل إلى حساب الطالب' : 'التبديل إلى حساب الشيخ والمقرئ'}
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('login')}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-800/80 border border-emerald-700 text-xs font-bold text-emerald-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول أو حساب جديد</span>
            </button>
          )}

          {onLogoutToWelcome && (
            <button
              onClick={onLogoutToWelcome}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/80 text-xs font-bold text-red-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="تسجيل الخروج والعودة للشاشة الترحيبية"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Settings Form */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-emerald-400" />
            بيانات الحساب والرواية المفضلة
          </h3>
          {savedSuccess && (
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3" />
              تم حفظ التعديلات
            </span>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 block mb-1">اسم الطالب الرباعي:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-950 text-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">الرواية القرآنية المعتمدة للقراءة والتسميع:</label>
            <select
              value={riwayah}
              onChange={(e) => setRiwayah(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-950 text-white focus:outline-none focus:border-emerald-600 font-medium cursor-pointer"
            >
              {riwayahOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#091710] text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1">المستوى القرآني الحالي:</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#091710] border border-emerald-950 text-white focus:outline-none focus:border-emerald-600 font-medium cursor-pointer"
            >
              {levelOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#091710] text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1">الهدف اليومي للتلاوة (عدد الصفحات):</label>
            <input
              type="number"
              min={1}
              max={60}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className="w-24 p-2 rounded-xl bg-[#091710] border border-emerald-950 text-white focus:outline-none focus:border-emerald-600 font-bold"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              حفظ التعديلات
            </button>
          </div>
        </div>
      </div>

      {/* User Notification & Popup Alert Settings Card (نظام الإشعارات للرسائل وقبول تصحيح التلاوة) */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border-2 border-emerald-600/70 shadow-md space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white font-serif">
                إعدادات التنبيهات المنبثقة والإشعارات
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                تنبيهات فورية
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              تخصيص ظهور الشريط المنبثق أعلى الشاشة عند استلام رسائل جديدة من المشايخ أو عند قبول واعتماد تصحيح التلاوة.
            </p>
          </div>

          {testNotificationToast && (
            <span className="text-[11px] text-amber-300 font-bold bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/40 animate-fade-in">
              {testNotificationToast}
            </span>
          )}
        </div>

        {/* Notification Switches */}
        <div className="space-y-2.5 pt-1">
          
          {/* Main Popup Banner Switch */}
          <div className="p-3 rounded-xl bg-[#081810] border border-emerald-900/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">الشريط المنبثق العلوي (Popup Banner)</span>
                {notificationSettings.popupBannerEnabled ? (
                  <span className="text-[10px] text-emerald-400 font-bold">مُفعل</span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">مُعطل</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                إظهار شريط تنبيه أنيق أعلى الشاشة فورياً عند وصول رسالة جديدة أو تقييم تلاوة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleNotificationSetting('popupBannerEnabled')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                notificationSettings.popupBannerEnabled
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={notificationSettings.popupBannerEnabled ? 'تعطيل الشريط المنبثق' : 'تفعيل الشريط المنبثق'}
            >
              {notificationSettings.popupBannerEnabled ? (
                <ToggleRight className="w-6 h-6 text-white" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>

          {/* Sheikh Messages Alerts Switch */}
          <div className="p-3 rounded-xl bg-[#081810] border border-emerald-900/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-white text-xs">رسائل وتوجيهات المشايخ والمعلمات</span>
              </div>
              <p className="text-[11px] text-slate-400">
                تنبيهك فور قيام المقرئ بإرسال توجيه تجويدي أو نصيحة خاصة بك.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleNotificationSetting('sheikhMessagesEnabled')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                notificationSettings.sheikhMessagesEnabled
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={notificationSettings.sheikhMessagesEnabled ? 'تعطيل تنبيهات الرسائل' : 'تفعيل تنبيهات الرسائل'}
            >
              {notificationSettings.sheikhMessagesEnabled ? (
                <ToggleRight className="w-6 h-6 text-white" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>

          {/* Recitation Approval & Evaluation Alerts Switch */}
          <div className="p-3 rounded-xl bg-[#081810] border border-emerald-900/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white text-xs">قبول واعتماد تصحيح التلاوة والدرجات</span>
              </div>
              <p className="text-[11px] text-slate-400">
                تنبيهك فور اعتماد المعلم لتسجيل تلاوتك وتوثيق الدرجة في سجلك القرآني.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleNotificationSetting('recitationApprovalEnabled')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                notificationSettings.recitationApprovalEnabled
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={notificationSettings.recitationApprovalEnabled ? 'تعطيل تنبيهات التلاوة' : 'تفعيل تنبيهات التلاوة'}
            >
              {notificationSettings.recitationApprovalEnabled ? (
                <ToggleRight className="w-6 h-6 text-white" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>

          {/* Sound Alert Switch */}
          <div className="p-3 rounded-xl bg-[#081810] border border-emerald-900/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-bold text-white text-xs">النغمة الصوتية الهادئة عند التنبيه</span>
              </div>
              <p className="text-[11px] text-slate-400">
                رنين روحي نقي ومريح عند ظهور شريط التنبيه.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleNotificationSetting('soundEnabled')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                notificationSettings.soundEnabled
                  ? 'bg-teal-600 text-slate-950 border-teal-300 font-bold shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={notificationSettings.soundEnabled ? 'تعطيل الصوت' : 'تفعيل الصوت'}
            >
              {notificationSettings.soundEnabled ? (
                <ToggleRight className="w-6 h-6 text-slate-950" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Live Test Notification Buttons */}
        <div className="pt-2 border-t border-emerald-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              تجربة ومعاينة التنبيهات فوراً:
            </span>
            <span className="text-[10px] text-slate-400">اضغط للمعاينة الحية</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestSheikhMessage}
              className="py-2 px-3 rounded-xl bg-[#091f16] hover:bg-amber-950/40 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>تجربة إشعار رسالة الشيخ ✉️</span>
            </button>

            <button
              type="button"
              onClick={handleTestRecitationApproval}
              className="py-2 px-3 rounded-xl bg-[#091f16] hover:bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>تجربة إشعار قبول التلاوة ⭐</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Recitation Follow-up & Performance Evaluation (سجل متابعة التسميع ومقدار الحفظ والعلامات) */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border-2 border-emerald-600/70 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white font-serif">
                سجل متابعة التسميع اليومي ومقدار الحفظ والعلامات
              </h3>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              توثيق الآيات المسمَّعة، حالة الحضور، وتقييم المعلم المشرف المعتمد في المقرأة
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('teacher_log')}
              className="px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>سجل التسميع العام</span>
            </button>
          )}
        </div>

        {/* Recitation records list */}
        <div className="space-y-2.5 pt-1">
          {displayRecitations.map((rec) => {
            const gradeInfo = getGradeLabel(rec.grade);
            const statusInfo = getAttendanceStatusInfo(rec.attendanceStatus);

            return (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-[#081810] border border-emerald-900/80 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-serif text-xs">{rec.studentName}</span>
                      <span className="text-[10px] text-slate-400">({rec.date})</span>
                    </div>
                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                      {rec.surahName} • الجزء {rec.juzNumber}
                    </p>
                  </div>

                  <div className="text-left shrink-0 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${gradeInfo.badgeBg}`}>
                      {gradeInfo.label} ({rec.score}%)
                    </span>
                  </div>
                </div>

                {/* Ayat range */}
                <div className="p-2 rounded-lg bg-[#05130b] border border-emerald-950 flex items-center justify-between text-[11px] text-slate-300">
                  <span>المقدار المحفوظ:</span>
                  <span className="font-bold text-white font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    من الآية ({rec.ayahStart}) إلى الآية ({rec.ayahEnd})
                  </span>
                </div>

                {/* Evaluator & Feedback */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-950/80">
                  <span className="flex items-center gap-1 text-slate-300">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    المقيم: <strong className="text-emerald-300">{rec.evaluatorTeacher}</strong>
                  </span>
                  {rec.memorizationQuality && (
                    <span className="text-amber-300">جودة الحفظ: {rec.memorizationQuality}</span>
                  )}
                </div>

                {rec.teacherFeedback && (
                  <p className="text-[10px] text-emerald-200/90 italic bg-emerald-950/40 p-1.5 rounded border border-emerald-900/60">
                    « {rec.teacherFeedback} »
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Certificates Showcase Card (الشهادات والإنجازات الخاصة بالطالب) */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-amber-500/50 shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white font-serif">
                الشهادات وأوسمة الإتقان القرآنية
              </h3>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              شهادات حفظ وتثبيت معتمدة وموقعة من مشايخ ومقرئي المقرأة
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('certificates')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>عرض كل الشهادات</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {displayCertificates.map((cert) => (
            <div
              key={cert.id}
              className="p-3.5 rounded-xl bg-[#081810] border border-amber-500/30 space-y-2 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-300 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    {cert.certificateNumber}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    تقدير: {cert.grade} ({cert.score}%)
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs font-serif mt-1.5 leading-snug">
                  {cert.title}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  المقرر: <span className="text-amber-300 font-semibold">{cert.surahOrJuzDetail}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-emerald-950 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">إشراف: {cert.evaluatorTeacher}</span>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('certificates')}
                    className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    معاينة وطباعة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning & Tajweed Mastery Journey Card (رحلة التجويد وإتقان الكلمات الصعبة) */}
      {(() => {
        const totalWords = DIFFICULT_QURAN_WORDS.length;
        const masteredWords = masteredWordIds.length;
        const wordsPercentage = Math.round((masteredWords / totalWords) * 100);

        const allLessons = TAJWEED_CURRICULUM.flatMap((c) => c.lessons);
        const totalLessons = allLessons.length;
        const completedLessons = allLessons.filter((l) => lessonProgressMap[l.id]?.completed).length;
        const lessonsPercentage = Math.round((completedLessons / totalLessons) * 100);

        return (
          <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-500/50 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>إنجازات التدريب العملي والتجويد المتسلسل</span>
                </h3>
                <p className="text-[11px] text-slate-300">متابعة إتقان نطق الكلمات الصعبة ومسار دروس التجويد المنهجية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Difficult Words Card */}
              <div className="p-3.5 rounded-xl bg-[#081810] border border-emerald-900/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">مكتبة الكلمات الصعبة</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                    {masteredWords} / {totalWords} ({wordsPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${wordsPercentage}%` }}
                  />
                </div>
                <button
                  onClick={() => onNavigateTab?.('difficult_words')}
                  className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer text-center block"
                >
                  التدرب على نطق الكلمات القرآنية الصعبة ←
                </button>
              </div>

              {/* Tajweed Lessons Card */}
              <div className="p-3.5 rounded-xl bg-[#081810] border border-emerald-900/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">مسار دروس التجويد</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                    {completedLessons} / {totalLessons} ({lessonsPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${lessonsPercentage}%` }}
                  />
                </div>
                <button
                  onClick={() => onNavigateTab?.('tajweed')}
                  className="w-full py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-200 text-[11px] font-bold border border-emerald-600/40 transition-all cursor-pointer text-center block"
                >
                  متابعة مسار دروس التجويد المتسلسلة ←
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Attendance & Absence Record (سجل الحضور والغياب) */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              سجل الحضور والغياب بالحلقات
            </h3>
            <p className="text-[11px] text-slate-400">متابعة الالتزام والمواظبة في الجلسات اليومية</p>
          </div>
          <div className="text-left">
            <span className="text-base font-bold font-mono text-emerald-400">{user.attendanceRate}%</span>
            <span className="text-[10px] text-slate-400 block">نسبة الالتزام</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {attendance.map((rec) => {
            const isPresent = rec.status === 'present';
            const isExcused = rec.status === 'excused';

            return (
              <div
                key={rec.id}
                className="p-3 rounded-xl bg-[#081810] border border-emerald-950 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{rec.halqaTitle}</span>
                    <span className="text-[10px] text-slate-400">({rec.date})</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80">المشرف: {rec.sheikhName}</p>
                  {rec.evaluation && (
                    <p className="text-[10px] text-amber-300/90 mt-0.5">« {rec.evaluation} »</p>
                  )}
                </div>

                <div className="text-left shrink-0">
                  {isPresent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      حاضر ({rec.durationMinutes} د)
                    </span>
                  )}
                  {isExcused && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                      معذور مسبقاً
                    </span>
                  )}
                  {!isPresent && !isExcused && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                      غياب
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Academy Contacts & Direct WhatsApp Lines with Prominent Logo */}
      <div className="p-4 rounded-2xl bg-[#0e2219] border border-emerald-900/60 shadow-sm space-y-4">
        {/* Prominent Official Logo Showcase */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#0a1e15] via-[#0e271c] to-[#081810] border border-amber-500/40 shadow-md">
          <div className="shrink-0">
            <OfficialLogo size="sm" variant="icon" clickable={false} />
          </div>
          <div className="space-y-1.5 text-center sm:text-right flex-1">
            <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-bold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
              <Award className="w-3.5 h-3.5" />
              <span>الشعار والهوية المعتمدة رسمياً</span>
            </div>
            <h3 className="text-base font-bold text-white font-serif">
              مقرأة رحاب القرآن الإلكترونية
            </h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              عطاء مستمر في إقراء وتعليم كتاب الله تعالى عن بُعد لجميع الفئات والمستويات، بالسند المتصل إلى رسول الله صلى الله عليه وسلم.
            </p>
          </div>
        </div>

        {/* Official Bank Accounts Card for Kuraimi & Jeeb */}
        <BankAccountsCard />

        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            بيانات وقنوات التواصل الرسمية بالمقرأة
          </h3>
          <p className="text-[11px] text-slate-400">تواصل مباشر عبر الواتساب للاستفسار وتأكيد التسجيل</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Male Students Registration */}
          <div className="p-3 rounded-xl bg-[#081810] border border-emerald-900/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">تسجيل الطلاب (بنين)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800">
                حلقات الذكور
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              قناة التواصل والتسجيل المباشرة لحلقات الذكور عبر الواتساب.
            </p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/967714371599?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أرغب بالتسجيل في حلقات الطلاب بمقرأة رحاب القرآن الإلكترونية.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <span>واتساب الطلاب المباشر</span>
              </a>
              {onOpenRegistration && (
                <button
                  type="button"
                  onClick={() => onOpenRegistration('male')}
                  className="px-2.5 py-2 rounded-lg bg-[#0d271a] hover:bg-[#123624] text-emerald-300 border border-emerald-700/60 font-bold text-xs cursor-pointer"
                  title="تعبئة نموذج تسجيل الطالب"
                >
                  النموذج
                </button>
              )}
            </div>
          </div>

          {/* Female Students Registration */}
          <div className="p-3 rounded-xl bg-[#081810] border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">قسم الطالبات (بنات)</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                إشراف كادر معتمد
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              قناة التواصل والتسجيل المباشرة لحلقات الطالبات عبر الواتساب.
            </p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/967711607573?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أرغب بالتسجيل في حلقات قسم الطالبات بمقرأة رحاب القرآن الإلكترونية.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <span>واتساب الطالبات المباشر</span>
              </a>
              {onOpenRegistration && (
                <button
                  type="button"
                  onClick={() => onOpenRegistration('female')}
                  className="px-2.5 py-2 rounded-lg bg-[#241c0e] hover:bg-[#332714] text-amber-300 border border-amber-500/60 font-bold text-xs cursor-pointer"
                  title="تعبئة نموذج تسجيل الطالبة"
                >
                  النموذج
                </button>
              )}
            </div>
          </div>

          {/* Teacher Registration Card */}
          <div className="p-3 rounded-xl bg-[#081810] border border-teal-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">تسجيل المعلمين والمعلمات</span>
              <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/40">
                كادر الإقراء والتدريس
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              نموذج تسجيل خاص بالمعلمين (الاسم، التخصص أو القراءات المجاز بها، البلد، وسائل التواصل، وخبرة التدريس) مع إرسال عبر الواتساب.
            </p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/967714371599?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أرغب بالانضمام لكادر المعلمين بمقرأة رحاب القرآن الإلكترونية.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <span>واتساب إدارة المعلمين</span>
              </a>
              {onOpenRegistration && (
                <button
                  type="button"
                  onClick={() => onOpenRegistration('teacher')}
                  className="px-2.5 py-2 rounded-lg bg-[#0e241b] hover:bg-[#15382a] text-teal-300 border border-teal-600/60 font-bold text-xs cursor-pointer"
                  title="تعبئة نموذج تسجيل المعلم"
                >
                  النموذج
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Official Website, Instagram & Email */}
        <div className="pt-2 border-t border-emerald-950 space-y-1.5 text-xs text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>📍 العنوان: الجمهورية اليمنية</span>
            <span className="text-slate-400">📧 البريد: rehabquran383@gmail.com</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <a
              href="https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 hover:underline font-semibold flex items-center gap-1.5"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>إنستجرام المقرأة الرسمي (@rehabquran47884517) ↗</span>
            </a>
            <a
              href="https://www.youtube.com/@RehabQuran-s5m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 hover:underline font-semibold flex items-center gap-1.5"
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>قناة اليوتيوب الرسمية (@RehabQuran-s5m) ↗</span>
            </a>
            <a
              href="https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 hover:text-teal-200 hover:underline font-semibold flex items-center gap-1.5"
            >
              <span className="text-xs">🎵</span>
              <span>حساب التيك توك الرسمي ↗</span>
            </a>
            <a
              href="https://bucolic-mooncake-7af778.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:underline font-medium"
            >
              🌐 موقع المقرأة على الإنترنت (bucolic-mooncake-7af778.netlify.app) ↗
            </a>
            <a
              href="https://maps.app.goo.gl/ppYnj9WyjPiYAfcTA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-semibold"
            >
              عرض الموقع على Google Maps ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
