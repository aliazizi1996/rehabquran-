/**
 * نظام التنبيهات والتذكيرات الذكية لبوابة الطالب (Student Reminders & Alerts System)
 * مقرأة رحاب القرآن الإلكترونية
 * 
 * يذكّر الطالب آلياً وبشكل بسيط وتفاعلي بـ:
 * 1. مواعيد الحلقات القادمة (اليوم أو خلال الساعات القادمة) مع عد تنازلي ورابط الدخول المباشر.
 * 2. المهام والواجبات والتسميعات المعلقة مع مواعيد الاستحقاق وزر إنجاز أو تسليم فوري.
 * 3. إمكانية إضافة تذكير شخصي للورد القرآني أو المراجعة.
 * 4. دعم تأجيل التنبيه (Snooze)، وكتم/تفعيل نغمة التنبيه الوقورة، وحفظ الإنجاز محلياً.
 * 
 * مطابقة تامة لدليل الهوية البصرية 2026:
 * الأخضر الزمردي: #046A38 | الذهبي الملكي: #C5A059 | العاجي الدافئ: #F9F6F0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, Clock, Calendar, CheckCircle2, AlertCircle, Video, 
  Mic, BookOpen, ChevronDown, ChevronUp, X, Sparkles, Plus, 
  Trash2, Volume2, VolumeX, ArrowLeft, ExternalLink, Check,
  AlertTriangle, BookmarkCheck, RotateCcw
} from 'lucide-react';
import { AuthAccount } from '../../types';
import { StudentHalqaAssignment } from '../../services/chatService';
import { AssignmentItem, UpcomingLessonItem } from '../../services/firestoreService';
import { HalqaNextTimeInfo } from '../../utils/halqaCountdown';
import { playNotificationChime } from '../../data/userNotificationStore';

export interface CustomStudentReminder {
  id: string;
  title: string;
  category: 'memorization' | 'revision' | 'tajweed' | 'custom';
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  createdAt: number;
}

interface StudentRemindersAlertsProps {
  currentAccount: AuthAccount;
  effectiveAssignment: StudentHalqaAssignment;
  countdown: HalqaNextTimeInfo;
  assignments: AssignmentItem[];
  upcomingLessons?: UpcomingLessonItem[];
  onNavigateTab: (tab: any) => void;
  onOpenRecitationRecorder: () => void;
  onOpenMeet?: (url?: string) => void;
}

const STORAGE_CUSTOM_REMINDERS_KEY = 'rehab_student_custom_reminders_v2';
const STORAGE_COMPLETED_ASSIGNMENTS_KEY = 'rehab_student_completed_assignment_ids_v1';
const STORAGE_SNOOZED_ALERTS_KEY = 'rehab_student_snoozed_alerts_v1';
const STORAGE_SOUND_PREF_KEY = 'rehab_student_alerts_sound_pref_v1';

export const StudentRemindersAlerts: React.FC<StudentRemindersAlertsProps> = ({
  currentAccount,
  effectiveAssignment,
  countdown,
  assignments,
  upcomingLessons = [],
  onNavigateTab,
  onOpenRecitationRecorder,
  onOpenMeet,
}) => {
  // 1. Local state for custom student reminders & persistent completed state
  const [customReminders, setCustomReminders] = useState<CustomStudentReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_REMINDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load custom reminders', e);
    }
    return [];
  });

  const [locallyCompletedAssignmentIds, setLocallyCompletedAssignmentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COMPLETED_ASSIGNMENTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [isSnoozed, setIsSnoozed] = useState<boolean>(() => {
    try {
      const snoozedUntil = localStorage.getItem(STORAGE_SNOOZED_ALERTS_KEY);
      if (snoozedUntil && Number(snoozedUntil) > Date.now()) {
        return true;
      }
    } catch {}
    return false;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const pref = localStorage.getItem(STORAGE_SOUND_PREF_KEY);
      return pref !== 'false';
    } catch {
      return true;
    }
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'halqa' | 'tasks'>('all');
  const [isAddReminderOpen, setIsAddReminderOpen] = useState<boolean>(false);
  const [newReminderTitle, setNewReminderTitle] = useState<string>('');
  const [newReminderCategory, setNewReminderCategory] = useState<'memorization' | 'revision' | 'tajweed' | 'custom'>('memorization');
  const [newReminderDue, setNewReminderDue] = useState<string>('اليوم مساءً');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Save custom reminders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_REMINDERS_KEY, JSON.stringify(customReminders));
    } catch (e) {
      console.error('Failed to save custom reminders', e);
    }
  }, [customReminders]);

  // Save completed assignment IDs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COMPLETED_ASSIGNMENTS_KEY, JSON.stringify(locallyCompletedAssignmentIds));
    } catch (e) {
      console.error('Failed to save completed assignments', e);
    }
  }, [locallyCompletedAssignmentIds]);

  // Save sound preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SOUND_PREF_KEY, String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Play chime once if halqa is within 10 minutes or live
  useEffect(() => {
    if (countdown.isWithin10Minutes && soundEnabled && !isSnoozed) {
      const hasChimedKey = `rehab_halqa_chimed_${effectiveAssignment.halqaId}_${new Date().toDateString()}`;
      if (!sessionStorage.getItem(hasChimedKey)) {
        playNotificationChime();
        sessionStorage.setItem(hasChimedKey, 'true');
      }
    }
  }, [countdown.isWithin10Minutes, soundEnabled, isSnoozed, effectiveAssignment.halqaId]);

  // Handle Snooze for 1 hour
  const handleSnooze = () => {
    const snoozeUntil = Date.now() + 60 * 60 * 1000; // 1 hour
    localStorage.setItem(STORAGE_SNOOZED_ALERTS_KEY, String(snoozeUntil));
    setIsSnoozed(true);
    setActionFeedback('تم تأجيل التنبيهات لمدة ساعة واحدة ⏳');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleWakeUp = () => {
    localStorage.removeItem(STORAGE_SNOOZED_ALERTS_KEY);
    setIsSnoozed(false);
    setActionFeedback('تم استئناف تشغيل التنبيهات النشطة بنجاح ✨');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // 2. Compute pending assignments
  const pendingAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.status === 'assigned' && !locallyCompletedAssignmentIds.includes(a.id)
    );
  }, [assignments, locallyCompletedAssignmentIds]);

  const pendingCustomReminders = useMemo(() => {
    return customReminders.filter((r) => !r.isCompleted);
  }, [customReminders]);

  const totalPendingTasksCount = pendingAssignments.length + pendingCustomReminders.length;

  // Toggle custom reminder completion
  const handleToggleCustomReminder = (id: string) => {
    setCustomReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextState = !r.isCompleted;
          if (nextState && soundEnabled) {
            playNotificationChime();
          }
          return { ...r, isCompleted: nextState };
        }
        return r;
      })
    );
    setActionFeedback('تم تحديث حالة المهمة بنجاح ✅');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Toggle assignment completion (local override)
  const handleToggleAssignmentCompletion = (assignmentId: string) => {
    if (locallyCompletedAssignmentIds.includes(assignmentId)) {
      setLocallyCompletedAssignmentIds((prev) => prev.filter((id) => id !== assignmentId));
      setActionFeedback('تمت إعادة فتح الواجب في قائمة المهام المعلقة.');
    } else {
      setLocallyCompletedAssignmentIds((prev) => [...prev, assignmentId]);
      if (soundEnabled) playNotificationChime();
      setActionFeedback('بارك الله فيك! تم تحديد الواجب كـ منجز بنجاح 🎉');
    }
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Delete custom reminder
  const handleDeleteCustomReminder = (id: string) => {
    setCustomReminders((prev) => prev.filter((r) => r.id !== id));
    setActionFeedback('تم حذف التذكير.');
    setTimeout(() => setActionFeedback(null), 2500);
  };

  // Add new custom reminder
  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    const newRem: CustomStudentReminder = {
      id: `custom-rem-${Date.now()}`,
      title: newReminderTitle.trim(),
      category: newReminderCategory,
      dueDate: newReminderDue.trim() || 'اليوم',
      isCompleted: false,
      createdAt: Date.now(),
    };

    setCustomReminders((prev) => [newRem, ...prev]);
    setNewReminderTitle('');
    setIsAddReminderOpen(false);
    if (soundEnabled) playNotificationChime();
    setActionFeedback('تمت إضافة التذكير الشخصي بنجاح 📌');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Join Halqa Click
  const handleJoinHalqa = () => {
    const meetUrl = effectiveAssignment.googleMeetUrl || 'https://meet.google.com/new';
    if (onOpenMeet) {
      onOpenMeet(meetUrl);
    } else {
      window.open(meetUrl, '_blank');
    }
  };

  // If snoozed, show simple gentle pill
  if (isSnoozed) {
    return (
      <div className="w-full bg-amber-50 border border-amber-200/90 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs font-sans transition-all">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>
            تنبيهات بوابة الطالب مؤجلة حالياً لمدة ساعة • <strong>{totalPendingTasksCount} مهام معلقة</strong>
          </span>
        </div>
        <button
          onClick={handleWakeUp}
          className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer hover:scale-102 transition-transform"
        >
          إلغاء التأجيل وعرض التنبيهات الآن ←
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2.5 font-sans">
      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="w-full bg-[#046A38] text-white text-xs py-2 px-4 rounded-xl shadow-md flex items-center justify-between border border-[#C5A059] animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium font-sans">{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border-2 border-[#C5A059]/40 shadow-xs overflow-hidden transition-all duration-200">
        
        {/* Header / Command Ribbon */}
        <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] px-3.5 sm:px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          
          {/* Right Section: Title and Status Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs border border-[#C5A059]/50 flex items-center justify-center text-[#C5A059] shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              {(countdown.isWithin10Minutes || totalPendingTasksCount > 0) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#046A38] animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold font-serif text-white flex items-center gap-1.5">
                  <span>تنبيهات المقرأة الذكية</span>
                  <span className="text-[#C5A059] font-sans text-xs">«الحلقات والمهام»</span>
                </h3>

                {countdown.isLiveNow ? (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>الحلقة مباشرة الآن!</span>
                  </span>
                ) : countdown.isWithin10Minutes ? (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3 text-slate-950" />
                    <span>تبدأ خلال دقائق</span>
                  </span>
                ) : (
                  <span className="bg-white/15 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                    {totalPendingTasksCount > 0 ? `${totalPendingTasksCount} مهام وتكليفات معلقة` : 'لا توجد مهام متأخرة ✨'}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-emerald-100/90 leading-tight mt-0.5">
                تذكير دوري بحلقاتك القرآنية وتكليفات الحفظ والتسميع لتيسير تنظيم أوقاتك
              </p>
            </div>
          </div>

          {/* Left Section: Controls (Sound, Snooze, Collapse) */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center">
            {/* Toggle Sound */}
            <button
              type="button"
              onClick={() => {
                const nextSound = !soundEnabled;
                setSoundEnabled(nextSound);
                if (nextSound) playNotificationChime();
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                soundEnabled 
                  ? 'bg-white/15 border-white/30 text-amber-200 hover:bg-white/25' 
                  : 'bg-black/20 border-white/10 text-white/60 hover:text-white'
              }`}
              title={soundEnabled ? 'صوت التنبيه مفعّل (انقر للكتم)' : 'صوت التنبيه مكتوم (انقر للتفعيل)'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] hidden md:inline">{soundEnabled ? 'صوت' : 'مكتوم'}</span>
            </button>

            {/* Snooze 1h */}
            <button
              type="button"
              onClick={handleSnooze}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="تأجيل التنبيهات لمدة ساعة واحدة"
            >
              <Clock className="w-3 h-3 text-[#C5A059]" />
              <span>تأجيل ساعة</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-colors cursor-pointer"
              title={isExpanded ? 'طي تفاصيل التنبيهات' : 'توسيع تفاصيل التنبيهات'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 space-y-3.5 bg-[#F9F6F0]/60">
            
            {/* Sub-Tabs Filter & Add Custom Task Button */}
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveTabFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTabFilter === 'all'
                      ? 'bg-[#046A38] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  جميع التنبيهات ({1 + totalPendingTasksCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('halqa')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTabFilter === 'halqa'
                      ? 'bg-[#046A38] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>موعد الحلقة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabFilter('tasks')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTabFilter === 'tasks'
                      ? 'bg-[#046A38] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>المهام المعلقة ({totalPendingTasksCount})</span>
                </button>
              </div>

              {/* Add Custom Personal Reminder */}
              <button
                type="button"
                onClick={() => setIsAddReminderOpen(!isAddReminderOpen)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#046A38] border border-[#C5A059]/60 hover:border-[#046A38] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>إضافة تذكير ورد شخصي</span>
              </button>
            </div>

            {/* Quick Add Custom Reminder Form */}
            {isAddReminderOpen && (
              <form 
                onSubmit={handleAddCustomReminder}
                className="bg-white p-3.5 rounded-xl border border-[#C5A059] shadow-xs space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold font-serif text-[#046A38] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>تذكير شخصي بورد الحفظ أو المراجعة</span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddReminderOpen(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">نص التذكير / الورد:</label>
                    <input
                      type="text"
                      placeholder="مثلاً: مراجعة الربع الأول من سورة البقرة وتكراره 5 مرات..."
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-[#046A38] focus:ring-1 focus:ring-[#046A38] outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">وقت التذكير المستهدف:</label>
                    <input
                      type="text"
                      placeholder="مثلاً: اليوم قبل صلاة العصر"
                      value={newReminderDue}
                      onChange={(e) => setNewReminderDue(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-[#046A38] focus:ring-1 focus:ring-[#046A38] outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] text-slate-500">التصنيف:</span>
                    {(['memorization', 'revision', 'tajweed', 'custom'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewReminderCategory(cat)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          newReminderCategory === cat
                            ? 'bg-[#046A38] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat === 'memorization' && 'حفظ جديد'}
                        {cat === 'revision' && 'مراجعة وتثبيت'}
                        {cat === 'tajweed' && 'تجويد'}
                        {cat === 'custom' && 'عام'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddReminderOpen(false)}
                      className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer border border-[#C5A059]"
                    >
                      حفظ التذكير
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Grid of Alert Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              
              {/* =================================================== */}
              {/* 1. بطاقة تذكير الحلقة القادمة (Upcoming Halqa Alert) */}
              {/* =================================================== */}
              {(activeTabFilter === 'all' || activeTabFilter === 'halqa') && (
                <div className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  countdown.isLiveNow 
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/40' 
                    : countdown.isWithin10Minutes 
                    ? 'bg-amber-50/80 border-[#C5A059] ring-2 ring-[#C5A059]/40' 
                    : 'bg-white border-slate-200/90 hover:border-[#046A38]'
                } shadow-2xs space-y-2.5 flex flex-col justify-between`}>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          countdown.isLiveNow 
                            ? 'bg-rose-500 text-white animate-pulse' 
                            : countdown.isWithin10Minutes 
                            ? 'bg-[#C5A059] text-white' 
                            : 'bg-emerald-50 text-[#046A38]'
                        }`}>
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            تذكير بموعد الحلقة القادمة
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm font-serif text-slate-900 leading-tight">
                            {effectiveAssignment.halqaTitle}
                          </h4>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        countdown.isLiveNow 
                          ? 'bg-rose-100 text-rose-800 font-black' 
                          : countdown.days === 0 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {countdown.isLiveNow 
                          ? 'جارية الآن 🔴' 
                          : countdown.days === 0 
                          ? 'موعدك اليوم ⏳' 
                          : 'الموعد القادم'}
                      </span>
                    </div>

                    {/* Box with details */}
                    <div className="bg-[#F9F6F0] p-2.5 rounded-xl border border-[#C5A059]/25 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">فضيلة المعلم:</span>
                        <strong className="text-slate-800 font-serif">{effectiveAssignment.teacherName}</strong>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">التوقيت المعتمد:</span>
                        <span className="font-bold text-[#046A38]" dir="rtl">
                          {countdown.formattedTarget || effectiveAssignment.halqaSchedule}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-[#C5A059]/15">
                        <span className="text-slate-400">الوقت المتبقي:</span>
                        <strong className="font-mono text-xs text-[#046A38] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {countdown.isLiveNow 
                            ? 'الحلقة مفتوحة للمشاركة الآن' 
                            : `${countdown.days > 0 ? `${countdown.days} يوم و ` : ''}${countdown.hours} ساعة و ${countdown.minutes} دقيقة`}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {countdown.isWithin10Minutes || countdown.isLiveNow ? (
                        <button
                          type="button"
                          onClick={handleJoinHalqa}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>دخول Google Meet المباشر ↗</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('halqa')}
                          className="px-3 py-1.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer border border-[#C5A059]"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>عرض تفاصيل الحلقة</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={onOpenRecitationRecorder}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="تحضير التسميع الصوتي مسبقاً قبل موعد الحلقة"
                      >
                        <Mic className="w-3 h-3 text-[#C5A059]" />
                        <span>تحضير التسميع</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400">﴿اقْرَأْ وَرَبُّكَ الْأَكْرَمُ﴾</span>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* 2. بطاقة المهام والواجبات المعلقة (Pending Tasks)    */}
              {/* =================================================== */}
              {(activeTabFilter === 'all' || activeTabFilter === 'tasks') && (
                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white hover:border-[#C5A059] shadow-2xs space-y-2.5 flex flex-col justify-between">
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center shrink-0">
                          <BookmarkCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                            تكليفات وواجبات الحفظ
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm font-serif text-slate-900 leading-tight">
                            المهام المعلقة المطلوب تسليمها
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                        {totalPendingTasksCount} مهام متبقية
                      </span>
                    </div>

                    {/* Task list container */}
                    <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-0.5">
                      
                      {/* Official Assignments */}
                      {pendingAssignments.map((asg) => (
                        <div 
                          key={asg.id}
                          className="p-2 bg-[#F9F6F0] rounded-lg border border-[#C5A059]/30 flex items-start justify-between gap-2 hover:bg-amber-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleAssignmentCompletion(asg.id)}
                              className="mt-0.5 w-4 h-4 rounded-md border border-slate-300 hover:border-[#046A38] bg-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                              title="تحديد كـ منجز"
                            >
                              <span className="opacity-0 hover:opacity-100 text-[#046A38] text-[10px]">✓</span>
                            </button>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate leading-snug">{asg.title}</p>
                              <span className="text-[10px] text-rose-700 block mt-0.5 font-medium">
                                موعد الاستحقاق: <strong>{asg.dueDate}</strong>
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigateTab('assignments')}
                            className="text-[10px] font-bold text-[#046A38] hover:underline shrink-0 cursor-pointer pt-0.5"
                          >
                            تسليم الواجب ←
                          </button>
                        </div>
                      ))}

                      {/* Custom Personal Reminders */}
                      {pendingCustomReminders.map((rem) => (
                        <div 
                          key={rem.id}
                          className="p-2 bg-emerald-50/40 rounded-lg border border-emerald-200/80 flex items-start justify-between gap-2 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomReminder(rem.id)}
                              className="mt-0.5 w-4 h-4 rounded-md border border-emerald-400 hover:border-emerald-700 bg-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                              title="تحديد كـ منجز"
                            >
                              <span className="opacity-0 hover:opacity-100 text-emerald-700 text-[10px]">✓</span>
                            </button>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-slate-800 truncate leading-snug">{rem.title}</p>
                              <span className="text-[10px] text-emerald-800 block mt-0.5">
                                ورد شخصي • <strong>{rem.dueDate}</strong> {rem.dueTime && `(${rem.dueTime})`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomReminder(rem.id)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                              title="إتمام"
                            >
                              إنجاز ✅
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomReminder(rem.id)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {totalPendingTasksCount === 0 && (
                        <div className="p-4 text-center bg-[#F9F6F0] rounded-xl border border-dashed border-[#C5A059]/40 space-y-1">
                          <CheckCircle2 className="w-5 h-5 text-[#046A38] mx-auto" />
                          <p className="text-xs font-bold text-[#046A38] font-serif">ما شاء الله! أنجزت كافة الواجبات والتكليفات</p>
                          <p className="text-[11px] text-slate-500">لا توجد مهام معلقة في الوقت الحالي.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer actions for tasks */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('assignments')}
                      className="text-[#046A38] hover:underline font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <span>فتح صفحة الواجبات والتكاليف</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddReminderOpen(true)}
                      className="text-slate-500 hover:text-[#046A38] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة مهمة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
