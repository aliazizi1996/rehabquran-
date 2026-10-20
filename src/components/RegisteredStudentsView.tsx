import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Search, Plus, Trash2, CheckCircle2, Clock, 
  ShieldCheck, GraduationCap, Phone, MapPin, BookOpen, 
  Sparkles, Filter, AlertCircle, X, ChevronDown, UserPlus, Heart,
  ClipboardCheck, Award
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { 
  RegisteredStudent, 
  RegisteredTeacher, 
  getRegisteredStudents, 
  getRegisteredTeachers, 
  saveRegisteredStudent, 
  updateStudentStatus, 
  deleteRegisteredStudent, 
  deleteRegisteredTeacher 
} from '../data/registrationStore';
import { Halqa, UserProfile } from '../types';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_DIAL_CODE } from '../data/countryPhoneCodes';

interface RegisteredStudentsViewProps {
  user: UserProfile;
  halawat: Halqa[];
  onOpenLiveRoom?: (halqa: Halqa) => void;
  onOpenRegistrationModal?: (type?: 'male' | 'female' | 'teacher') => void;
  onNavigateToRecitationLog?: () => void;
  onNavigateToCertificates?: (student?: { name: string; section: 'male' | 'female'; teacher: string }) => void;
}

export const RegisteredStudentsView: React.FC<RegisteredStudentsViewProps> = ({
  user,
  halawat,
  onOpenLiveRoom,
  onOpenRegistrationModal,
  onNavigateToRecitationLog,
  onNavigateToCertificates,
}) => {
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [teachers, setTeachers] = useState<RegisteredTeacher[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'teachers'>('students');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'female' | 'male'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };
  
  // Manual Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSection, setNewSection] = useState<'male' | 'female'>('female');
  const [newAge, setNewAge] = useState('');
  const [newCountry, setNewCountry] = useState('اليمن');
  const [newCountryCode, setNewCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE);
  const [newStudyType, setNewStudyType] = useState('تحفيظ القرآن الكريم');
  const [newRiwayah, setNewRiwayah] = useState('حفص عن عاصم');
  const [newMemorization, setNewMemorization] = useState('5 أجزاء');
  const [newPreferredTime, setNewPreferredTime] = useState('الصباح');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Load from store
  const refreshData = () => {
    setStudents(getRegisteredStudents());
    setTeachers(getRegisteredTeachers());
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('rehab_students_updated', handleUpdate);
    window.addEventListener('rehab_teachers_updated', handleUpdate);
    return () => {
      window.removeEventListener('rehab_students_updated', handleUpdate);
      window.removeEventListener('rehab_teachers_updated', handleUpdate);
    };
  }, []);

  // Filtered list
  const filteredStudents = students.filter((s) => {
    if (!s) return false;
    const sec = s?.section || 'male';
    if (sectionFilter !== 'all' && sec !== sectionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.country && s.country.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }
    return true;
  });

  const filteredTeachers = teachers.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.country.toLowerCase().includes(q) ||
        t.phone.includes(q)
      );
    }
    return true;
  });

  const handleToggleStatus = (id: string, currentStatus: 'approved' | 'pending' | 'rejected' | 'accepted') => {
    const nextStatus: 'approved' | 'pending' = (currentStatus === 'approved' || currentStatus === 'accepted') ? 'pending' : 'approved';
    updateStudentStatus(id, nextStatus);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطالب (${name}) من القائمة؟`)) {
      deleteRegisteredStudent(id);
    }
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المعلم (${name}) من القائمة؟`)) {
      deleteRegisteredTeacher(id);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    saveRegisteredStudent({
      name: newName.trim(),
      age: newAge.trim() || undefined,
      country: newCountry.trim() || undefined,
      section: newSection,
      studyType: newStudyType,
      riwayah: newRiwayah,
      memorization: newMemorization,
      wantsSanad: newStudyType === 'إجازة بالسند' ? 'نعم' : 'لا',
      preferredTime: newPreferredTime,
      phone: newPhone.trim() || undefined,
      notes: newNotes.trim() || undefined,
      status: 'approved',
    });

    setNewName('');
    setNewAge('');
    setNewPhone('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  const femaleCount = students.filter((s) => s && s.section === 'female').length;
  const maleCount = students.filter((s) => s && s.section === 'male').length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0b2418] via-[#0f3120] to-[#071810] p-5 border-2 border-emerald-600/70 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OfficialLogo size="md" variant="icon" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif">
                  سجل الطلاب والمعلمين وإدارة الحلقات
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  لوحة المشرف
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 pt-0.5">
                حفظ وإدارة بيانات الملتحقين الفعليين بالمقرأة دون أي أسماء وهمية
              </p>
            </div>
          </div>

          {/* Quick Action to Add Student and Navigate */}
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToRecitationLog && (
              <button
                onClick={onNavigateToRecitationLog}
                className="py-2 px-3 rounded-xl bg-[#092216] hover:bg-[#0e2e1e] border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="فتح سجل متابعة التسميع اليومي"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>سجل التسميع</span>
              </button>
            )}

            {onNavigateToCertificates && (
              <button
                onClick={() => onNavigateToCertificates()}
                className="py-2 px-3 rounded-xl bg-[#1b190a] hover:bg-[#28230e] border border-amber-500/60 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="فتح قسم الشهادات والإنجازات"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>الشهادات</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طالب يدوياً</span>
            </button>
            {onOpenRegistrationModal && (
              <button
                onClick={() => onOpenRegistrationModal('female')}
                className="py-2 px-3 rounded-xl bg-[#071710] hover:bg-[#0c261b] border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                title="فتح نموذج التسجيل الرسمي"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نموذج التسجيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-emerald-900/60">
          <div className="p-2.5 rounded-xl bg-[#06150e]/80 border border-emerald-900 flex items-center justify-between">
            <span className="text-xs text-slate-300">إجمالي الطلاب:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{students.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#06150e]/80 border border-amber-900/60 flex items-center justify-between">
            <span className="text-xs text-amber-200/90">قسم الطالبات:</span>
            <span className="text-sm font-bold text-amber-300 font-mono">{femaleCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#06150e]/80 border border-emerald-900 flex items-center justify-between">
            <span className="text-xs text-slate-300">قسم الطلاب:</span>
            <span className="text-sm font-bold text-teal-300 font-mono">{maleCount}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#06150e]/80 border border-emerald-900 flex items-center justify-between">
            <span className="text-xs text-slate-300">المعلمون المسجلون:</span>
            <span className="text-sm font-bold text-white font-mono">{teachers.length}</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold border ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-800 text-rose-200'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs (Students vs Teachers) & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1b13] p-3 rounded-2xl border border-emerald-900/70">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#06160e] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>قائمة الطلاب ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'teachers'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-[#06160e] text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>قائمة المعلمين ({teachers.length})</span>
          </button>
        </div>

        {/* Section Filters (if on students tab) */}
        {activeSubTab === 'students' && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 text-[11px] ml-1">القسم:</span>
            <button
              onClick={() => setSectionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                sectionFilter === 'all' ? 'bg-emerald-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSectionFilter('female')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                sectionFilter === 'female' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              طالبات ({femaleCount})
            </button>
            <button
              onClick={() => setSectionFilter('male')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                sectionFilter === 'male' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              طلاب ({maleCount})
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-emerald-400 absolute right-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeSubTab === 'students' ? 'ابحث بالاسم أو الدولة أو رقم الهاتف...' : 'ابحث باسم المعلم...'}
          className="w-full bg-[#081810] border border-emerald-900/80 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STUDENTS LIST CONTENT */}
      {activeSubTab === 'students' && (
        <div className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-[#071710] border border-emerald-900/60 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Users className="w-7 h-7 text-emerald-400/80" />
              </div>
              <h3 className="text-sm font-bold text-white">لا يوجد طلاب مسجلون حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                القائمة خالية من أي أسماء وهمية. بمجرد ملء الطلاب لنموذج التسجيل بالمقرأة سيتم إدراجهم تلقائياً هنا، أو يمكنك إضافتهم يدوياً بصفتك المشرف.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول طالب الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStudents.map((std) => (
                <div
                  key={std.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    std?.section === 'female'
                      ? 'bg-gradient-to-br from-[#0c2217] to-[#081710] border-amber-500/40 shadow-sm'
                      : 'bg-gradient-to-br from-[#091f15] to-[#071710] border-emerald-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        std?.section === 'female'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}>
                        {std?.name ? std.name.charAt(0) : 'ط'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white">{std?.name || 'طالب'}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            std?.section === 'female'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {std?.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {std.country || 'اليمن'} {std.age ? `• ${std.age} سنة` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggleStatus(std.id, std.status)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                        std.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      }`}
                      title="انقر لتبديل حالة القبول"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{std.status === 'approved' ? 'مقبول ونشط' : 'قيد المراجعة'}</span>
                    </button>
                  </div>

                  {/* Student Details */}
                  <div className="space-y-1.5 text-[11px] text-slate-300 bg-[#06140e] p-2.5 rounded-xl border border-emerald-950 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">نوع الدراسة:</span>
                      <span className="font-semibold text-emerald-300">{std.studyType || 'تحفيظ القرآن الكريم'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الرواية القرآنية:</span>
                      <span className="font-bold text-amber-300">{std.riwayah || 'حفص عن عاصم'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">مستوى الحفظ:</span>
                      <span className="text-slate-200">{std.memorization}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الوقت المناسب:</span>
                      <span className="text-teal-300 font-medium">
                        {std.preferredTime || 'الصباح'}
                        {std.preferredTimeDetail ? ` (${std.preferredTimeDetail})` : ''}
                      </span>
                    </div>
                    {std.monthlyContribution && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">المساهمة الشهرية:</span>
                        <span className="text-amber-300 font-medium text-[10px] truncate max-w-[190px]" title={std.monthlyContribution}>
                          {std.monthlyContribution}
                        </span>
                      </div>
                    )}
                    {std.notes && (
                      <div className="pt-1 border-t border-emerald-950/80 text-[10px] text-slate-400">
                        ملاحظة: {std.notes}
                      </div>
                    )}
                  </div>

                  {/* Quick Teacher Actions: Recitation & Certificate */}
                  <div className="pt-2 border-t border-emerald-950/80 flex items-center gap-1.5 flex-wrap">
                    {onNavigateToRecitationLog && (
                      <button
                        type="button"
                        onClick={onNavigateToRecitationLog}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="تسجيل تسميع ومتابعة يومية لهذا الطالب"
                      >
                        <ClipboardCheck className="w-3 h-3 text-emerald-400" />
                        <span>تسجيل تسميع</span>
                      </button>
                    )}

                    {onNavigateToCertificates && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCertificates({
                          name: std.name,
                          section: std?.section || 'male',
                          teacher: std?.section === 'female' ? 'مشرفة قسم الطالبات' : 'مشرف قسم الطلاب',
                        })}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="إصدار شهادة أو وسام لهذا الطالب"
                      >
                        <Award className="w-3 h-3 text-amber-400" />
                        <span>إصدار شهادة</span>
                      </button>
                    )}
                  </div>

                  {/* Accept / Reject actions for pending registrations */}
                  {std.status === 'pending' && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-emerald-950/80">
                      <button
                        onClick={() => {
                          const academicId = `RQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                          updateStudentStatus(std.id, 'approved');
                          const msg = `السلام عليكم ورحمة الله وبركاته،\nأهلاً بك في مقرأة رحاب القرآن الإلكترونية 🌿\nنبارك لكم قبول طلب التسجيل في ${std.section === 'female' ? 'قسم الطالبات' : 'قسم الطلاب'}.\n• الرقم الأكاديمي: ${academicId}\n• المسار: ${std.studyType || 'تحفيظ القرآن'}\n• رابط الدخول: ${window.location.origin}/login`;
                          const phoneVal = validateAndCleanWhatsAppNumber(std.whatsapp || std.phone, std.country);
                          if (phoneVal.isValid) {
                            window.open(`https://wa.me/${phoneVal.cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                          } else {
                            showToast(`رقم هاتف الطالب (${std.name}) غير صالح للإرسال عبر واتساب: ${phoneVal.error || 'يرجى مراجعة الرقم ورمز الدولة'}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        title="قبول الطالب وتجهيز رسالة واتساب"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>قبول وإرسال واتساب ✓</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = window.prompt('يرجى كتابة سبب رفض الطلب ليتم إرساله للطالب عبر واتساب:', 'نعتذر لعدم توفر شواغر في الفترة الزمنية المحددة حالياً');
                          if (reason !== null) {
                            updateStudentStatus(std.id, 'rejected');
                            const msg = `السلام عليكم ورحمة الله وبركاته، الأخ/الأخت ${std.name}، بخصوص طلب تسجيلكم في مقرأة رحاب القرآن الإلكترونية: نعتذر عن قبول الطلب في الوقت الحالي نظراً لـ: ${reason}. نسأل الله لكم التوفيق.`;
                            const phoneVal = validateAndCleanWhatsAppNumber(std.whatsapp || std.phone, std.country);
                            if (phoneVal.isValid) {
                              window.open(`https://wa.me/${phoneVal.cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            } else {
                              showToast(`رقم هاتف الطالب (${std.name}) غير صالح للإرسال عبر واتساب: ${phoneVal.error || 'يرجى مراجعة الرقم ورمز الدولة'}`);
                            }
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="رفض الطلب مع توضيح السبب وإرسال واتساب"
                      >
                        <X className="w-3 h-3" />
                        <span>رفض ✕</span>
                      </button>
                    </div>
                  )}

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[10px] text-slate-500">
                      سُجل في: {std.registeredAt}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {std.phone && (() => {
                        const phoneVal = validateAndCleanWhatsAppNumber(std.phone, std.country);
                        return phoneVal.isValid ? (
                          <a
                            href={`https://wa.me/${phoneVal.cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors"
                            title={`محادثة واتساب (${phoneVal.formattedDisplay})`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => showToast(`رقم هاتف الطالب (${std.name}) غير صالح للواتساب: ${phoneVal.error || 'يرجى مراجعة الرقم'}`)}
                            className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-900 text-rose-400 cursor-pointer"
                            title="رقم غير صالح"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => handleDelete(std.id, std.name)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-900 text-red-300 transition-colors cursor-pointer"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEACHERS LIST CONTENT */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-3">
          {filteredTeachers.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-[#071710] border border-emerald-900/60 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-teal-400">
                <GraduationCap className="w-7 h-7 text-teal-400/80" />
              </div>
              <h3 className="text-sm font-bold text-white">لا يوجد معلمين مسجلين جدد حالياً</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                أي معلم يقوم بملء استمارة تسجيل المعلمين ستُدرج بياناته تلقائياً هنا لاعتماده وتوزيع الحلقات القرآنية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTeachers.map((tch) => (
                <div
                  key={tch.id}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#0a2318] to-[#071710] border border-teal-500/40 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/40 flex items-center justify-center font-bold text-xs">
                        {tch.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white">{tch.name}</h4>
                        <p className="text-[11px] text-teal-300/80">
                          {tch.qualification}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold">
                      {tch.targetSection === 'female' ? 'قسم الطالبات' : tch.targetSection === 'male' ? 'قسم الطلاب' : 'كلا القسمين'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-300 bg-[#06140e] p-2.5 rounded-xl border border-emerald-950 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الدولة:</span>
                      <span className="text-white font-semibold">{tch.country}</span>
                    </div>
                    {tch.experience && (
                      <div className="pt-1 border-t border-emerald-950 text-[10px] text-slate-400">
                        الخبرات: {tch.experience}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[10px] text-slate-500">
                      سُجل في: {tch.registeredAt}
                    </span>
                    <button
                      onClick={() => handleDeleteTeacher(tch.id, tch.name)}
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-900 text-red-300 transition-colors cursor-pointer"
                      title="حذف المعلم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Direct Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#0b1c14] border-2 border-emerald-600/70 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/80 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">إضافة طالب مسجل يدوياً (المشرف)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الطالب / الطالبة *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="الاسم الثلاثي..."
                  className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">القسم</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value as 'male' | 'female')}
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="female">قسم الطالبات (أخوات)</option>
                    <option value="male">قسم الطلاب</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">العمر (سنة)</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    placeholder="مثال: 22"
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">بلد الإقامة</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="اليمن، السعودية..."
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مقدار الحفظ</label>
                  <select
                    value={newMemorization}
                    onChange={(e) => setNewMemorization(e.target.value)}
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="مبتدئ (قصار السور)">مبتدئ (قصار السور)</option>
                    <option value="3 أجزاء">3 أجزاء</option>
                    <option value="5 أجزاء">5 أجزاء</option>
                    <option value="10 أجزاء">10 أجزاء</option>
                    <option value="15 جزءاً">15 جزءاً</option>
                    <option value="خاتم لكتاب الله">خاتم لكتاب الله</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نوع الدراسة المطلوب</label>
                  <select
                    value={newStudyType}
                    onChange={(e) => setNewStudyType(e.target.value)}
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="تأسيس في القرآن الكريم">تأسيس في القرآن الكريم</option>
                    <option value="تحفيظ القرآن الكريم">تحفيظ القرآن الكريم</option>
                    <option value="مراجعة الحفظ">مراجعة الحفظ</option>
                    <option value="تثبيت الحفظ">تثبيت الحفظ</option>
                    <option value="إجازة بالسند">إجازة بالسند</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الرواية القرآنية</label>
                  <select
                    value={newRiwayah}
                    onChange={(e) => setNewRiwayah(e.target.value)}
                    className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="حفص عن عاصم">حفص عن عاصم</option>
                    <option value="ورش عن نافع">ورش عن نافع</option>
                    <option value="قالون عن نافع">قالون عن نافع</option>
                    <option value="شعبة عن عاصم">شعبة عن عاصم</option>
                    <option value="رواية أخرى">رواية أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الوقت المناسب للحصة</label>
                <select
                  value={newPreferredTime}
                  onChange={(e) => setNewPreferredTime(e.target.value)}
                  className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="الصباح">الصباح</option>
                  <option value="الظهر">الظهر</option>
                  <option value="العصر">العصر</option>
                  <option value="المغرب">المغرب</option>
                  <option value="العشاء">العشاء</option>
                  <option value="وقت آخر">وقت آخر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الواتساب للتواصل</label>
                <div className="flex gap-2">
                  <div className="w-28 sm:w-36 shrink-0">
                    <select
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value)}
                      className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-2 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                      title="اختر رمز الدولة (اليمن +967 افتراضياً)"
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={c.iso} value={c.dialCode} className="bg-[#07160f] text-white">
                          {c.flag} {c.dialCode ? `+${c.dialCode}` : c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="مثال: 713801916 أو 0713801916"
                      className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
                {newPhone.trim() && (() => {
                  const preview = validateAndCleanWhatsAppNumber(newPhone, newCountryCode);
                  return (
                    <div className="mt-1 flex items-center justify-between text-[11px] px-1">
                      <span className="text-slate-400">الصيغة الدولية المعتمدة:</span>
                      <span className={`font-mono font-bold ${preview.isValid ? 'text-emerald-400' : 'text-amber-400'}`} dir="ltr">
                        {preview.isValid ? preview.formattedDisplay : 'يرجى مراجعة الرقم'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ملاحظات المشرف</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="أي ملاحظات حول المستوى أو حلقة التسكين..."
                  className="w-full bg-[#07160f] border border-emerald-900 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  حفظ وتسجيل الطالب فوراً
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-[#07150f] text-slate-400 hover:text-white border border-emerald-950 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
