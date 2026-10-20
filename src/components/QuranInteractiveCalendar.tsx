import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, 
  CheckCircle2, Circle, AlertCircle, Plus, BookOpen, 
  Video, User, Sparkles, Filter, Trash2, Edit3, 
  CalendarDays, CheckSquare, ListTodo, Award, Bookmark, ArrowRight
} from 'lucide-react';
import { AuthAccount, TaskItem, ScheduleEvent } from '../types';
import { 
  fetchUserTasks, 
  fetchUserScheduleEvents, 
  saveTask, 
  updateTaskStatus, 
  deleteTask,
  saveScheduleSession,
  deleteScheduleSession 
} from '../services/firestoreService';

interface QuranInteractiveCalendarProps {
  currentAccount: AuthAccount;
  userRole: 'student' | 'teacher' | 'supervisor' | 'parent' | 'admin' | string;
  onJoinSession?: (session: ScheduleEvent) => void;
  onOpenQuranAudio?: () => void;
  className?: string;
}

export const QuranInteractiveCalendar: React.FC<QuranInteractiveCalendarProps> = ({
  currentAccount,
  userRole,
  onJoinSession,
  onOpenQuranAudio,
  className = ''
}) => {
  // 1. التاريخ المحدد وحالة التنقل
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // 2. حالة التبويب داخل التقويم (الكل / الجلسات / المهام)
  const [viewFilter, setViewFilter] = useState<'all' | 'sessions' | 'tasks'>('all');

  // 3. البيانات المحملة
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // 4. حالة النوافذ المنبثقة لإضافة مهمة أو جلسة جديدة
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);

  // حقول إضافة مهمة جديدة
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskItem['type']>('memorization');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('medium');
  const [newTaskSurah, setNewTaskSurah] = useState('النبأ');
  const [newTaskFromAyah, setNewTaskFromAyah] = useState<number>(1);
  const [newTaskToAyah, setNewTaskToAyah] = useState<number>(20);
  const [newTaskTime, setNewTaskTime] = useState('17:00');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // حقول إضافة جلسة جديدة (خاصة بالمعلم والمشرف)
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionHalqa, setNewSessionHalqa] = useState('حلقة الفجر المباشرة');
  const [newSessionTime, setNewSessionTime] = useState('05:30');
  const [newSessionDuration, setNewSessionDuration] = useState<number>(60);
  const [newSessionMeetingUrl, setNewSessionMeetingUrl] = useState('https://meet.google.com/quran-rahab-live');
  const [newSessionType, setNewSessionType] = useState<ScheduleEvent['type']>('halqa');

  // تحميل البيانات عند فتح التقويم وتغيير المستخدم
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedTasks, fetchedEvents] = await Promise.all([
          fetchUserTasks(currentAccount.id, userRole),
          fetchUserScheduleEvents(currentAccount.id, userRole)
        ]);
        if (isMounted) {
          setTasks(fetchedTasks);
          setScheduleEvents(fetchedEvents);
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [currentAccount.id, userRole]);

  // إشعار سريع للمستخدم
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // تفاصيل الشهر الحالي
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // حساب أيام الشهر وتقسيمها
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // الأيام السابقة المكملة للأسبوع
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // أيام الشهر الحالي
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
    }

    // الأيام اللاحقة المكملة للأسبوع
    const remainingDays = 42 - days.length; // شبكة من 6 أسابيع
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // التنقل بين الشهور
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // المهام والجلسات الخاصة باليوم المحدد
  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === selectedDateStr);
  }, [tasks, selectedDateStr]);

  const selectedDaySessions = useMemo(() => {
    return scheduleEvents.filter(e => e.date === selectedDateStr);
  }, [scheduleEvents, selectedDateStr]);

  // إحصاءات المهام للشهر أو لليوم
  const todayTasksCount = selectedDayTasks.length;
  const completedTodayTasksCount = selectedDayTasks.filter(t => t.status === 'completed').length;
  const completionPercentage = todayTasksCount > 0 
    ? Math.round((completedTodayTasksCount / todayTasksCount) * 100) 
    : 0;

  // خريطة سريعة للأيام التي تحتوي على أحداث
  const dayIndicators = useMemo(() => {
    const map = new Map<string, { hasSession: boolean; hasTask: boolean; hasUrgent: boolean }>();
    scheduleEvents.forEach(e => {
      const existing = map.get(e.date) || { hasSession: false, hasTask: false, hasUrgent: false };
      existing.hasSession = true;
      map.set(e.date, existing);
    });
    tasks.forEach(t => {
      const existing = map.get(t.dueDate) || { hasSession: false, hasTask: false, hasUrgent: false };
      existing.hasTask = true;
      if (t.priority === 'high' && t.status !== 'completed') {
        existing.hasUrgent = true;
      }
      map.set(t.dueDate, existing);
    });
    return map;
  }, [scheduleEvents, tasks]);

  // تغيير حالة المهمة (إنجاز / غير منجز)
  const handleToggleTaskStatus = async (taskId: string, currentStatus: TaskItem['status']) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));

    try {
      await updateTaskStatus(taskId, nextStatus);
      showToast(nextStatus === 'completed' ? 'بارك الله فيك! تم تسجيل إنجاز المهمة بنجاح.' : 'تمت إعادة فتح المهمة للمراجعة.');
    } catch {
      showToast('تعذر حفظ الحالة في الخادم، يرجى المحاولة لاحقاً.');
    }
  };

  // حذف مهمة
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة من جدولك؟')) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTask(taskId);
      showToast('تم حذف المهمة بنجاح.');
    } catch {
      showToast('فشل حذف المهمة من قاعدة البيانات.');
    }
  };

  // حذف جلسة
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('هل تريد إلغاء موعد هذه الحلقة أو الجلسة؟')) return;
    setScheduleEvents(prev => prev.filter(s => s.id !== sessionId));
    try {
      await deleteScheduleSession(sessionId);
      showToast('تم إلغاء موعد الحلقة بنجاح.');
    } catch {
      showToast('فشل حذف الموعد.');
    }
  };

  // حفظ مهمة جديدة
  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      alert('يرجى كتابة عنوان المهمة أو اسم السورة.');
      return;
    }

    const newTask: Partial<TaskItem> & { title: string; dueDate: string } = {
      title: newTaskTitle,
      type: newTaskType,
      priority: newTaskPriority,
      dueDate: selectedDateStr,
      dueTime: newTaskTime,
      surahName: newTaskType === 'memorization' || newTaskType === 'revision' ? newTaskSurah : undefined,
      fromAyah: newTaskType === 'memorization' || newTaskType === 'revision' ? newTaskFromAyah : undefined,
      toAyah: newTaskType === 'memorization' || newTaskType === 'revision' ? newTaskToAyah : undefined,
      notes: newTaskNotes,
      status: 'pending',
      studentId: currentAccount.id,
      studentName: currentAccount.name,
      teacherName: userRole === 'teacher' ? currentAccount.name : 'المعلم المشرف'
    };

    try {
      const res = await saveTask(newTask);
      const createdItem: TaskItem = {
        ...newTask,
        id: res.id || `task-${Date.now()}`
      } as TaskItem;
      setTasks(prev => [createdItem, ...prev]);
      setIsAddTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskNotes('');
      showToast('تمت جدولة المهمة القرآنية بنجاح.');
    } catch {
      showToast('حدث خطأ أثناء حفظ المهمة.');
    }
  };

  // حفظ موعد جلسة جديدة
  const handleCreateNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) {
      alert('يرجى تحديد عنوان الجلسة أو اسم الحلقة.');
      return;
    }

    const newSession: Partial<ScheduleEvent> & { title: string; date: string; startTime: string } = {
      title: newSessionTitle,
      halqaTitle: newSessionHalqa,
      teacherName: currentAccount.name,
      teacherId: currentAccount.id,
      date: selectedDateStr,
      startTime: newSessionTime,
      durationMinutes: newSessionDuration,
      timeDisplay: `${newSessionTime} (${newSessionDuration} دقيقة)`,
      meetingUrl: newSessionMeetingUrl,
      type: newSessionType,
      status: 'upcoming'
    };

    try {
      const res = await saveScheduleSession(newSession);
      const createdEvent: ScheduleEvent = {
        ...newSession,
        id: res.id || `sched-${Date.now()}`
      } as ScheduleEvent;
      setScheduleEvents(prev => [...prev, createdEvent]);
      setIsAddSessionModalOpen(false);
      setNewSessionTitle('');
      showToast('تمت جدولة موعد الحلقة بنجاح.');
    } catch {
      showToast('حدث خطأ أثناء حفظ موعد الحلقة.');
    }
  };

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isSelected = (dateStr: string) => {
    return dateStr === selectedDateStr;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-3.5 bg-[#046A38] text-white text-xs font-bold rounded-2xl shadow-xl border border-emerald-400/30 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center shrink-0 border border-[#046A38]/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#C5A059] block">
              نظام التقويم التفاعلي وجدولة المهام
            </span>
            <h2 className="text-xl font-bold font-serif text-[#046A38]">
              جدول المواعيد والمهام القرآنية المجدولة
            </h2>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-bold bg-[#F9F6F0] hover:bg-[#F0ECE1] text-[#046A38] border border-[#C5A059]/40 rounded-xl transition-all cursor-pointer"
          >
            اليوم الحالي
          </button>
          
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة مهمة جديدة</span>
          </button>

          {(userRole === 'teacher' || userRole === 'supervisor' || userRole === 'admin') && (
            <button
              onClick={() => setIsAddSessionModalOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-[#C5A059] hover:bg-[#b08e4c] text-white rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>إضافة موعد حلقة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Calendar Month on Right (RTL), Details on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Month Calendar (7 Cols on LG) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-serif text-slate-800">
                {monthNames[month]} {year} م
              </span>
              <span className="text-[11px] font-mono bg-emerald-50 text-[#046A38] px-2 py-0.5 rounded-full font-bold">
                {tasks.length} مهمة مجدولة
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                title="الشهر السابق"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                title="الشهر التالي"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 py-1 border-b border-slate-100">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((d, index) => {
              const indicator = dayIndicators.get(d.dateStr);
              const selected = isSelected(d.dateStr);
              const today = isToday(d.dateStr);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDateStr(d.dateStr)}
                  className={`min-h-[64px] sm:min-h-[74px] p-1.5 rounded-2xl flex flex-col justify-between items-center transition-all text-center relative cursor-pointer border ${
                    selected
                      ? 'bg-[#046A38] text-white border-[#046A38] shadow-md shadow-emerald-900/10 scale-[1.02]'
                      : today
                      ? 'bg-amber-50/60 text-amber-900 border-amber-300 font-bold'
                      : d.isCurrentMonth
                      ? 'bg-white hover:bg-slate-50/80 text-slate-800 border-slate-100'
                      : 'bg-slate-50/50 text-slate-300 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-1">
                    <span className={`text-xs font-mono font-bold ${
                      selected ? 'text-white' : today ? 'text-amber-700' : ''
                    }`}>
                      {d.dayNumber}
                    </span>
                    {today && (
                      <span className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                    )}
                  </div>

                  {/* Indicator Dots */}
                  <div className="flex items-center gap-1 mt-auto pb-0.5">
                    {indicator?.hasSession && (
                      <span 
                        title="حلقة أو موعد مباشر"
                        className={`w-2 h-2 rounded-full ${selected ? 'bg-amber-300' : 'bg-[#C5A059]'}`} 
                      />
                    )}
                    {indicator?.hasTask && (
                      <span 
                        title="مهام واجبة"
                        className={`w-2 h-2 rounded-full ${
                          selected 
                            ? 'bg-white' 
                            : indicator.hasUrgent 
                            ? 'bg-rose-500' 
                            : 'bg-emerald-600'
                        }`} 
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#046A38]" />
                <span>اليوم المحدد</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                <span>حلقة مباشرة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>مهمة حفظ/مراجعة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>مهمة عاجلة</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              اضغط على أي يوم لعرض وتخصيص تفاصيله
            </span>
          </div>
        </div>

        {/* Selected Day View: Schedule & Tasks Management (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Day Status Header Card */}
          <div className="bg-gradient-to-br from-[#046A38] to-[#034d28] p-5 sm:p-6 rounded-3xl text-white shadow-sm space-y-3 relative overflow-hidden">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-200">
                  {selectedDateStr === new Date().toISOString().split('T')[0] ? 'جدول ومواعيد اليوم' : 'التاريخ المختار'}
                </span>
                <h3 className="text-lg font-bold font-serif text-white mt-0.5">
                  {selectedDateStr}
                </h3>
              </div>

              {/* Progress Circle Badge */}
              <div className="text-left bg-white/10 px-3 py-1.5 rounded-2xl border border-white/15 backdrop-blur-xs">
                <span className="text-[10px] text-emerald-100 block">إنجاز المهام</span>
                <span className="text-sm font-black font-mono text-[#C5A059]">
                  {completedTodayTasksCount} / {todayTasksCount} ({completionPercentage}%)
                </span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="relative z-10 flex items-center gap-1.5 bg-black/20 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewFilter('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  viewFilter === 'all' ? 'bg-white text-[#046A38] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                الكل ({selectedDaySessions.length + selectedDayTasks.length})
              </button>
              <button
                onClick={() => setViewFilter('sessions')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  viewFilter === 'sessions' ? 'bg-white text-[#046A38] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                الحلقات ({selectedDaySessions.length})
              </button>
              <button
                onClick={() => setViewFilter('tasks')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  viewFilter === 'tasks' ? 'bg-white text-[#046A38] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                المهام ({selectedDayTasks.length})
              </button>
            </div>
          </div>

          {/* Daily Schedule Sessions Section */}
          {(viewFilter === 'all' || viewFilter === 'sessions') && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold font-serif text-[#046A38] text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#C5A059]" />
                  <span>الحلقات والمواعيد المباشرة</span>
                </h4>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {selectedDaySessions.length} موعد
                </span>
              </div>

              {selectedDaySessions.length === 0 ? (
                <div className="p-5 text-center bg-[#F9F6F0] rounded-2xl border border-dashed border-[#C5A059]/40 space-y-2">
                  <Clock className="w-7 h-7 text-[#C5A059] mx-auto opacity-70" />
                  <p className="text-xs text-slate-600 font-medium">
                    لا توجد حلقات مباشرة مجدولة في هذا اليوم
                  </p>
                  {(userRole === 'teacher' || userRole === 'supervisor' || userRole === 'admin') && (
                    <button
                      onClick={() => setIsAddSessionModalOpen(true)}
                      className="text-xs text-[#046A38] font-bold hover:underline cursor-pointer"
                    >
                      + جدولة موعد حلقة لهذا اليوم
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDaySessions.map(session => (
                    <div 
                      key={session.id} 
                      className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-[#C5A059]/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-[#046A38] px-2 py-0.5 rounded-md">
                            {session.halqaTitle}
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 mt-1">
                            {session.title}
                          </h5>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-600 shrink-0 bg-white px-2 py-1 rounded-md border border-slate-200">
                          {session.timeDisplay}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>المشرف: {session.teacherName}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {session.meetingUrl && (
                            <a
                              href={session.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-[#046A38] hover:bg-[#03552d] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                            >
                              <Video className="w-3 h-3" />
                              <span>دخول القاعة</span>
                            </a>
                          )}

                          {(userRole === 'teacher' || userRole === 'supervisor' || userRole === 'admin') && (
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              title="إلغاء الموعد"
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks & Quran Goals Section */}
          {(viewFilter === 'all' || viewFilter === 'tasks') && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold font-serif text-[#046A38] text-sm flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-[#046A38]" />
                  <span>مهام الحفظ والمراجعة (Tasks)</span>
                </h4>
                <button
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="p-5 text-center bg-[#F9F6F0] rounded-2xl border border-dashed border-[#C5A059]/40 space-y-2">
                  <BookOpen className="w-7 h-7 text-[#046A38] mx-auto opacity-70" />
                  <p className="text-xs text-slate-600 font-medium">
                    لا توجد مهام مجدولة لليوم المحدد
                  </p>
                  <button
                    onClick={() => setIsAddTaskModalOpen(true)}
                    className="text-xs text-[#046A38] font-bold hover:underline cursor-pointer"
                  >
                    + جدولة خطة حفظ أو مراجعة لليوم
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    return (
                      <div 
                        key={task.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isCompleted 
                            ? 'bg-slate-50/70 border-slate-200 opacity-75' 
                            : task.priority === 'high'
                            ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                            : 'bg-white border-slate-200 hover:border-[#046A38]/50'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Toggle Checkbox Button */}
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="mt-0.5 text-slate-400 hover:text-[#046A38] transition-colors cursor-pointer shrink-0"
                            title={isCompleted ? 'إعادة المهمة لقيد التنفيذ' : 'تحديد كمكتملة'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className={`font-bold text-xs ${
                                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}>
                                {task.title}
                              </h5>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {task.dueTime || '17:00'}
                              </span>
                            </div>

                            {/* Details (Surah, Ayahs, Notes) */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.type === 'memorization'
                                  ? 'bg-emerald-100 text-[#046A38]'
                                  : task.type === 'revision'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {task.type === 'memorization' ? 'حفظ جديد' : task.type === 'revision' ? 'مراجعة' : 'حلقة'}
                              </span>

                              {task.surahName && (
                                <span className="font-serif font-bold text-slate-700">
                                  سورة {task.surahName} {task.fromAyah ? `(${task.fromAyah} - ${task.toAyah})` : ''}
                                </span>
                              )}
                            </div>

                            {task.notes && (
                              <p className="text-[11px] text-slate-500 leading-relaxed pt-0.5">
                                {task.notes}
                              </p>
                            )}
                          </div>

                          {/* Delete Task Button */}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            title="حذف المهمة"
                            className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Add New Task */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">جدولة مهمة جديدة</span>
                <h3 className="text-lg font-bold font-serif text-[#046A38]">إضافة مهمة حفظ أو مراجعة</h3>
              </div>
              <button
                onClick={() => setIsAddTaskModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع المهمة القرآنية</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTaskType('memorization')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      newTaskType === 'memorization' ? 'bg-[#046A38] text-white border-[#046A38]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    حفظ جديد
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTaskType('revision')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      newTaskType === 'revision' ? 'bg-[#046A38] text-white border-[#046A38]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    مراجعة وتثبيت
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTaskType('halqa')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      newTaskType === 'halqa' ? 'bg-[#046A38] text-white border-[#046A38]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    واجب حلقة
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المهمة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حفظ سورة النبأ من 1 إلى 20"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              {(newTaskType === 'memorization' || newTaskType === 'revision') && (
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">السورة</label>
                    <input
                      type="text"
                      placeholder="اسم السورة"
                      value={newTaskSurah}
                      onChange={e => setNewTaskSurah(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">من آية</label>
                    <input
                      type="number"
                      min={1}
                      value={newTaskFromAyah}
                      onChange={e => setNewTaskFromAyah(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">إلى آية</label>
                    <input
                      type="number"
                      min={1}
                      value={newTaskToAyah}
                      onChange={e => setNewTaskToAyah(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">وقت الإنجاز المتوقع</label>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={e => setNewTaskTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الأولوية</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38] bg-white"
                  >
                    <option value="high">عالية (مهم جداً)</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">عادية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ملاحظات وتوجيهات التجويد</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات المعلم أو الطالب للتركيز على أحكام معينة..."
                  value={newTaskNotes}
                  onChange={e => setNewTaskNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs"
                >
                  حفظ وجدولة المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add New Session (Teacher / Supervisor) */}
      {isAddSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">إدارة الحلقات والمواعيد</span>
                <h3 className="text-lg font-bold font-serif text-[#046A38]">جدولة حلقة أو لقاء مباشر</h3>
              </div>
              <button
                onClick={() => setIsAddSessionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewSession} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان اللقاء أو الدرس</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حلقة الفجر - تصحيح التلاوة وسرد الأحقاف"
                  value={newSessionTitle}
                  onChange={e => setNewSessionTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الحلقة / المسار</label>
                  <input
                    type="text"
                    required
                    value={newSessionHalqa}
                    onChange={e => setNewSessionHalqa(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الجلسة</label>
                  <select
                    value={newSessionType}
                    onChange={e => setNewSessionType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38] bg-white"
                  >
                    <option value="halqa">حلقة جماعية</option>
                    <option value="individual">تسميع فردي</option>
                    <option value="exam">اختبار إتقان / إجازة</option>
                    <option value="lecture">محاضرة تجويد</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">وقت البدء</label>
                  <input
                    type="time"
                    value={newSessionTime}
                    onChange={e => setNewSessionTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المدة (بالدقائق)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={newSessionDuration}
                    onChange={e => setNewSessionDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط القاعة الافتراضية (Google Meet / Zoom)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newSessionMeetingUrl}
                  onChange={e => setNewSessionMeetingUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C5A059] hover:bg-[#b08e4c] text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs"
                >
                  تأكيد موعد الحلقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
