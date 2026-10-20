import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, PlusCircle, BarChart3, Bell, ChevronLeft,
  CheckCircle2, Clock, Star, ArrowRight, LogOut, Video, Search,
  Edit3, Save, X, Phone, MessageSquare, Headphones, BookOpen
} from 'lucide-react';
import { 
  DbStudent, 
  DbTeacher, 
  DbEvaluation, 
  getAcademyDatabase, 
  saveAcademyDatabase, 
  getTeacherStudents, 
  addStudentEvaluation,
  recordAttendance 
} from '../data/academyDb';
import { AuthAccount } from '../types';
import { getDesignAndCommunicationSettings } from '../services/designSettingsService';
import { DesignAndCommunicationSettings } from '../types/designAndCommunication';

interface TeacherDashboardProps {
  currentAccount: AuthAccount;
  onLogout: () => void;
  onOpenVirtualRoom?: (roomUrl: string) => void;
  onOpenQuranAudio?: () => void;
  onOpenTeacherPortal?: () => void;
  onOpenAcademicPortal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentAccount,
  onLogout,
  onOpenVirtualRoom,
  onOpenQuranAudio,
  onOpenTeacherPortal,
  onOpenAcademicPortal,
}) => {
  const [teacher, setTeacher] = useState<DbTeacher | null>(null);
  const [students, setStudents] = useState<DbStudent[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'schedule' | 'recitation_quick' | 'progress' | 'announcements'>('students');
  const [selectedStudent, setSelectedStudent] = useState<DbStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for "تسجيل تسميع جديد"
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evalDate, setEvalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [evalSurah, setEvalSurah] = useState('الكهف');
  const [evalFromAyah, setEvalFromAyah] = useState<number>(1);
  const [evalToAyah, setEvalToAyah] = useState<number>(31);
  const [evalType, setEvalType] = useState<'حفظ' | 'مراجعة' | 'تثبيت'>('حفظ');
  const [evalGrade, setEvalGrade] = useState<'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج متابعة'>('ممتاز');
  const [evalScore, setEvalScore] = useState<number>(95);
  const [evalNotes, setEvalNotes] = useState('');
  const [evalSuccessMessage, setEvalSuccessMessage] = useState('');

  // Announcement State
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  const [designSettings, setDesignSettings] = useState<DesignAndCommunicationSettings>(() => getDesignAndCommunicationSettings());

  useEffect(() => {
    const handleDesignUpdate = (e: any) => {
      if (e.detail) setDesignSettings(e.detail);
      else setDesignSettings(getDesignAndCommunicationSettings());
    };
    window.addEventListener('rehab_design_settings_updated', handleDesignUpdate);
    return () => window.removeEventListener('rehab_design_settings_updated', handleDesignUpdate);
  }, []);

  // Load teacher and teacher's students
  useEffect(() => {
    const db = getAcademyDatabase();
    let found = db.teachers.find((t) => t && (t.userId === currentAccount?.id || t.name === currentAccount?.name));
    if (!found && db.teachers.length > 0) {
      const isFemale = currentAccount?.section === 'female';
      found = isFemale
        ? db.teachers.find((t) => t && t.section === 'female') || db.teachers[0]
        : db.teachers.find((t) => t && t.section === 'male') || db.teachers[0];
    }
    if (found) {
      setTeacher(found);
      const myStudents = getTeacherStudents(found.id);
      setStudents(myStudents.length > 0 ? myStudents : db.students);
    } else {
      setStudents(db.students);
    }
  }, [currentAccount]);

  const handleOpenRecitationModal = (student: DbStudent) => {
    setSelectedStudent(student);
    setEvalSurah(student.currentSurah || 'الكهف');
    setEvalFromAyah(student.currentAyahStart || 1);
    setEvalToAyah(student.currentAyahEnd || 31);
    setEvalNotes('');
    setIsEvaluationModalOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !teacher) return;

    addStudentEvaluation({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      date: evalDate,
      surah: `سورة ${evalSurah}`,
      fromAyah: Number(evalFromAyah),
      toAyah: Number(evalToAyah),
      lessonType: evalType,
      grade: evalGrade,
      score: Number(evalScore),
      teacherNotes: evalNotes,
    });

    // Also automatically register attendance for today
    recordAttendance({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      teacherId: teacher.id,
      classId: selectedStudent.classId,
      date: evalDate,
      status: 'present',
      notes: `تسميع ${evalType}: ${evalSurah}`
    });

    // Refresh student in state
    const db = getAcademyDatabase();
    const updated = db.students.find((s) => s.id === selectedStudent.id);
    if (updated) {
      setSelectedStudent(updated);
    }
    const myStudents = getTeacherStudents(teacher.id);
    setStudents(myStudents.length > 0 ? myStudents : db.students);

    setEvalSuccessMessage('تم حفظ التقييم واعتماد الحضور بنجاح!');
    setTimeout(() => {
      setEvalSuccessMessage('');
      setIsEvaluationModalOpen(false);
    }, 1200);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim() || !teacher) return;
    const db = getAcademyDatabase();
    if (!Array.isArray(db.announcements)) {
      db.announcements = [];
    }
    db.announcements.unshift({
      id: `anc-${Date.now()}`,
      title: `توجيه من أستاذ الحلقة: ${teacher.name}`,
      content: newAnnouncementText.trim(),
      targetRole: 'students',
      authorName: teacher.name,
      date: 'اليوم',
      priority: 'normal'
    });
    saveAcademyDatabase(db);
    setNewAnnouncementText('');
    setAnnouncementSuccess('تم نشر الإعلان لطلاب الحلقة بنجاح.');
    setTimeout(() => setAnnouncementSuccess(''), 2000);
  };

  const filteredStudents = (students || []).filter((s) => {
    if (!s) return false;
    const nameMatch = s.name ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const idMatch = s.academicId ? s.academicId.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return nameMatch || idMatch;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] text-slate-800 font-sans pb-20 select-none" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 font-black text-lg">
              {teacher?.name ? teacher.name.charAt(0) : (currentAccount?.name ? currentAccount.name.charAt(0) : 'م')}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                السلام عليكم، أستاذ {teacher?.name || currentAccount?.name || 'المعلم'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{teacher?.qualification || 'معلم مقرأة معتمد'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAcademicPortal && (
              <button
                type="button"
                onClick={onOpenAcademicPortal}
                title="فتح النظام الأكاديمي لتعليم القرآن الكريم: خطط، تسميع مباشر، وتقييم إتقان"
                className="px-2.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03552d] text-white border border-[#C5A059] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>📖 النظام الأكاديمي</span>
              </button>
            )}

            {onOpenTeacherPortal && (
              <button
                type="button"
                onClick={onOpenTeacherPortal}
                title="فتح بوابة المعلم الشاملة (10 صفحات متكاملة مع Firestore)"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>📑 بوابة المعلم الشاملة (10 صفحات)</span>
              </button>
            )}

            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        {/* Navigation Tabs (طلابي، جدول اليوم، تسجيل التسميع، متابعة الطلاب، الإعلانات) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setActiveTab('students'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'students' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 font-bold'
            }`}
          >
            <Users className="w-4 h-4" />
            👨‍🎓 طلابي ({students.length})
          </button>

          <button
            onClick={() => { setActiveTab('schedule'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'schedule' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 font-bold'
            }`}
          >
            <Calendar className="w-4 h-4" />
            📅 جدول اليوم
          </button>

          <button
            onClick={() => {
              if (students.length > 0) {
                handleOpenRecitationModal(students[0]);
              }
            }}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            📝 تسجيل التسميع
          </button>

          <button
            onClick={() => { setActiveTab('progress'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'progress' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 font-bold'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            📊 متابعة الطلاب
          </button>

          <button
            onClick={() => { setActiveTab('announcements'); setSelectedStudent(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'announcements' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 font-bold'
            }`}
          >
            <Bell className="w-4 h-4" />
            📢 الإعلانات
          </button>

          {onOpenQuranAudio && (
            <button
              onClick={onOpenQuranAudio}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-[#046A38] border border-emerald-300"
              title="الاستماع للمصحف المعلم والمجود"
            >
              <Headphones className="w-4 h-4 text-[#046A38]" />
              🎧 المصحف المعلم
            </button>
          )}
        </div>

        {/* ================= VIEW: SELECTED STUDENT DETAIL ================= */}
        {selectedStudent ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 animate-fade-in text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-800 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                العودة لقائمة الطلاب
              </button>
              <span className="text-xs sm:text-sm font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {selectedStudent.academicId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">{selectedStudent.name}</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">{selectedStudent.className}</p>
              </div>
              <button
                onClick={() => handleOpenRecitationModal(selectedStudent)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                تسجيل تسميع جديد
              </button>
            </div>

            {/* Simple detail cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-1 font-medium">آخر حضور:</span>
                <span className="font-black text-slate-900">{selectedStudent.lastAttendanceDate || 'اليوم'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-1 font-medium">آخر تسميع:</span>
                <span className="font-black text-slate-900">{selectedStudent.lastRecitationDate || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-1 font-medium">آخر مقدار حفظ:</span>
                <span className="font-black text-slate-900">
                  {selectedStudent.currentSurah ? `سورة ${selectedStudent.currentSurah}` : 'سورة الكهف'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-1 font-medium">آخر مقدار مراجعة:</span>
                <span className="font-black text-slate-900">الجزء {selectedStudent.currentJuz || 1}</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 text-xs sm:text-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-black text-emerald-950">التقييم الأخير:</span>
                <span className="font-black text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-xs sm:text-sm">
                  {selectedStudent.lastGrade || 'ممتاز'} ({selectedStudent.lastScore || 98}%)
                </span>
              </div>
              <p className="text-slate-700 italic font-medium leading-relaxed">
                "{selectedStudent.notes || 'طالب متميز في تطبيق أحكام التجويد ومخارج الحروف.'}"
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ================= VIEW 1: STUDENTS LIST ================= */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن طالب بالاسم أو الرقم الأكاديمي..."
                    className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-transparent outline-hidden"
                  />
                </div>

                <div 
                  className={`grid gap-3 ${
                    designSettings.teacherDashboard.mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  } ${
                    designSettings.teacherDashboard.tabletColumns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
                  } ${
                    designSettings.teacherDashboard.desktopColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                  }`}
                >
                  {filteredStudents.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-2xl sm:rounded-3xl border-2 border-slate-200/90 hover:border-[#046A38] shadow-xs hover:shadow-md transition-all text-right flex flex-col justify-between min-h-[140px] group"
                    >
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="w-full text-right cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#046A38] transition-colors">{s.name}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/40 font-bold shrink-0">
                            {s.academicId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-1">
                          المقرر: {s.currentSurah ? `سورة ${s.currentSurah}` : 'سورة الكهف'} • الجزء {s.currentJuz || 1}
                        </p>
                        {designSettings.teacherDashboard.showDailyAttendanceCounter && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>نسبة الحضور: {s.attendanceRate}%</span>
                          </div>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 gap-2">
                        {designSettings.teacherDashboard.showQuickRecitationButtons && (
                          <button
                            onClick={() => handleOpenRecitationModal(s)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-[#046A38] hover:bg-emerald-800 text-white text-xs font-black transition-colors cursor-pointer shadow-xs text-center"
                          >
                            تسميع
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="p-1.5 text-slate-400 hover:text-[#046A38] cursor-pointer"
                          title="تفاصيل الطالب"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= VIEW 2: TODAY'S SCHEDULE ================= */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs text-right">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">جدول الحلقات المجدولة لليوم</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">حلقات التسميع المباشر والمتابعة مع الطلاب</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        حلقة الفجر
                      </span>
                      <h3 className="font-black text-base sm:text-lg text-slate-900 mt-1.5">
                        حلقة الإتقان والتحفيظ (بنين)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                        05:30 ص - بعد الفجر • الحضور: {students.length} طالباً
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenVirtualRoom) {
                          onOpenVirtualRoom('https://meet.google.com/quran-rehab');
                        }
                      }}
                      className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Video className="w-4 h-4" />
                      فتح الغرفة المباشرة
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= VIEW 3: PROGRESS TRACKING ================= */}
            {activeTab === 'progress' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs text-right">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">متابعة إنجاز وحضور الطلاب</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">معدلات الحفظ والمراجعة ونسب الحضور الأكاديمي</p>
                </div>

                <div className="space-y-2.5">
                  {students.map((s) => (
                    <div key={s.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs text-right">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm sm:text-base text-slate-900">{s.name}</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-800">حضور {s.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${s.attendanceRate}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                        <span>إجمالي الصفحات: <strong className="text-slate-900 font-black">{s.totalMemorizedPages}</strong> صفحة</span>
                        <span>آخر تقييم: <strong className="text-emerald-800 font-black">{s.lastGrade || 'ممتاز'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= VIEW 4: ANNOUNCEMENTS ================= */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs text-right">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">إرسال إعلان لطلاب الحلقة</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">نشر توجيهات أو مواعيد اختبارات لجميع طلابك</p>

                  {announcementSuccess && (
                    <div className="p-3 my-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold rounded-xl text-center">
                      {announcementSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateAnnouncement} className="mt-4 space-y-3">
                    <textarea
                      value={newAnnouncementText}
                      onChange={(e) => setNewAnnouncementText(e.target.value)}
                      placeholder="اكتب نص الإعلان أو التوجيه هنا..."
                      rows={3}
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white outline-hidden"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
                    >
                      نشر الإعلان للطلاب
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Recitation Recording Modal (نموذج تسجيل التسميع الفوري) */}
      {isEvaluationModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-xl text-right animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">تسجيل تسميع جديد</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">للطالب: <strong className="text-emerald-900 font-bold">{selectedStudent.name}</strong></p>
              </div>
              <button
                onClick={() => setIsEvaluationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {evalSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold text-center">
                {evalSuccessMessage}
              </div>
            )}

            <form onSubmit={handleSaveEvaluation} className="space-y-3.5 text-xs sm:text-sm">
              {/* التاريخ */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">التاريخ</label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white font-medium text-xs sm:text-sm"
                />
              </div>

              {/* السورة */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">السورة</label>
                <input
                  type="text"
                  value={evalSurah}
                  onChange={(e) => setEvalSurah(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white font-medium text-xs sm:text-sm"
                  placeholder="مثال: الكهف"
                />
              </div>

              {/* من الآية - إلى الآية */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">من الآية</label>
                  <input
                    type="number"
                    value={evalFromAyah}
                    onChange={(e) => setEvalFromAyah(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white font-medium text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">إلى الآية</label>
                  <input
                    type="number"
                    value={evalToAyah}
                    onChange={(e) => setEvalToAyah(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white font-medium text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* نوع الدرس (حفظ / مراجعة / تثبيت) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">نوع الدرس</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['حفظ', 'مراجعة', 'تثبيت'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEvalType(t)}
                      className={`py-2.5 rounded-xl border text-xs sm:text-sm font-black transition-colors cursor-pointer ${
                        evalType === t ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* التقييم (ممتاز / جيد جدًا / جيد / يحتاج متابعة) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">التقييم والتقدير</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ممتاز', 'جيد جداً', 'جيد', 'يحتاج متابعة'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setEvalGrade(g);
                        setEvalScore(g === 'ممتاز' ? 98 : g === 'جيد جداً' ? 88 : g === 'جيد' ? 78 : 65);
                      }}
                      className={`py-2.5 rounded-xl border text-xs sm:text-sm font-black transition-colors cursor-pointer ${
                        evalGrade === g ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* ملاحظات المعلم */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">ملاحظات المعلم والتوجيه التجويدي</label>
                <textarea
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="اكتب ملاحظاتك للطالب عن مخارج الحروف، والمدود، والوقف والابتداء..."
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-800 bg-white font-medium text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ التقييم
                </button>
                <button
                  type="button"
                  onClick={() => setIsEvaluationModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer"
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
