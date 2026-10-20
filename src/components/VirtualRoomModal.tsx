import React, { useState, useEffect } from 'react';
import { 
  X, Mic, MicOff, Hand, Volume2, Users, Radio, 
  BookOpen, Sparkles, Check, Video, ExternalLink,
  ShieldCheck, UserCheck, UserPlus, Play, Square,
  SkipForward, Crown, VolumeX, Trash2, AlertCircle,
  Plus, MessageCircle, ChevronDown
} from 'lucide-react';
import { Halqa, DailySession, UserProfile } from '../types';
import { getRegisteredStudents, RegisteredStudent } from '../data/registrationStore';

export interface RoomParticipant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  isHost: boolean;
  isSpeaking: boolean;
  isMicMuted: boolean;
  hasRaisedHand: boolean;
  handRaisedAt?: number;
  isAdmitted: boolean; // true = in room, false = in admission waiting queue
  surahTarget?: string;
  isCurrentUser?: boolean;
}

interface VirtualRoomModalProps {
  halqa?: Halqa;
  session?: DailySession;
  user: UserProfile;
  onClose: () => void;
}

export const VirtualRoomModal: React.FC<VirtualRoomModalProps> = ({
  halqa,
  session,
  user,
  onClose,
}) => {
  const isFemale = halqa?.isFemaleSection || halqa?.id?.includes('f') || session?.halqaId?.includes('f');
  const isMale = halqa?.isMaleSection || halqa?.id === 'h-m1' || session?.halqaId === 'h-m1';
  const title = halqa?.title || session?.title || (isFemale ? 'حلقة قسم الطالبات (حفظ وتلاوة بالسند)' : 'حلقة قسم الطلاب (حفظ وتلاوة بالسند)');
  const teacherName = isFemale ? 'مشرفة قسم الطالبات' : (halqa?.sheikhName || session?.sheikhName || 'مشرف قسم الطلاب');
  const meetUrl = halqa?.meetUrl || session?.meetUrl || (isFemale ? 'https://meet.google.com/zdz-zcmn-ium' : 'https://meet.google.com/fid-iqwm-zxm');

  // Determine if current viewer is Supervisor / Host
  // User can also toggle supervisor mode to test & control
  const [isSupervisorMode, setIsSupervisorMode] = useState<boolean>(() => {
    return user.role === 'teacher';
  });

  // Master Room State: Completely empty of any mock names on start
  const [participants, setParticipants] = useState<RoomParticipant[]>(() => {
    // When starting, NO mock names ("عمر الفاروق", "فاطمة الزهراء", etc. are deleted)
    // Only the teacher (as host) and the current logged-in user (if not the teacher) are included.
    const initialList: RoomParticipant[] = [];

    // The Teacher / Supervisor
    initialList.push({
      id: 'teacher-host',
      name: teacherName,
      role: 'teacher',
      isHost: true,
      isSpeaking: true,
      isMicMuted: false,
      hasRaisedHand: false,
      isAdmitted: true,
      isCurrentUser: isSupervisorMode,
    });

    // If viewer is a student (not the teacher itself), add them as an admitted or waiting student
    if (!isSupervisorMode && user.name !== teacherName) {
      initialList.push({
        id: `user-${user.id}`,
        name: user.name,
        role: 'student',
        isHost: false,
        isSpeaking: false,
        isMicMuted: true,
        hasRaisedHand: false,
        isAdmitted: true,
        isCurrentUser: true,
      });
    }

    return initialList;
  });

  // Currently Active Reciter (null when nobody is reciting)
  const [activeReciterId, setActiveReciterId] = useState<string | null>(null);

  // Mic state for current user
  const [isMyMicOn, setIsMyMicOn] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [selectedAyahIndex, setSelectedAyahIndex] = useState(0);
  const [reactions, setReactions] = useState<{ id: number; text: string }[]>([]);
  const [roomNotification, setRoomNotification] = useState<string | null>(null);

  const showRoomToast = (msg: string) => {
    setRoomNotification(msg);
    setTimeout(() => {
      setRoomNotification((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Registered students pool to allow the supervisor to admit real students
  const [registeredStudentsPool, setRegisteredStudentsPool] = useState<RegisteredStudent[]>([]);
  const [isAdmitSelectorOpen, setIsAdmitSelectorOpen] = useState(false);

  useEffect(() => {
    setRegisteredStudentsPool(getRegisteredStudents());
    const handleUpdate = () => setRegisteredStudentsPool(getRegisteredStudents());
    window.addEventListener('rehab_students_updated', handleUpdate);
    return () => window.removeEventListener('rehab_students_updated', handleUpdate);
  }, []);

  const ayahs = [
    { num: 142, text: "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ مَا وَلَّاهُمْ عَن قِبْلَتِهِمُ الَّتِي كَانُوا عَلَيْهَا ۚ قُل لِّلَّهِ الْمَشْرِقُ وَالْمَغْرِبُ ۚ يَهْدِي مَن يَشَاءُ إِلَىٰ صِرَاطٍ مُّسْتَقِيمٍ" },
    { num: 143, text: "وَكَذَٰلِكَ جَعَلْنَاكُمْ أُمَّةً وَسَطًا لِّتَكُونُوا شُهَدَاءَ عَلَى النَّاسِ وَيَكُونَ الرَّسُولُ عَلَيْكُمْ شَهِيدًا ۗ" },
    { num: 144, text: "قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ" }
  ];

  // Admitted participants (excluding host if counting students)
  const admittedParticipants = participants.filter((p) => p.isAdmitted);
  const admittedStudents = admittedParticipants.filter((p) => !p.isHost);
  
  // Pending admission requests
  const pendingRequests = participants.filter((p) => !p.isAdmitted);

  // Students who raised hands waiting for recitation
  const waitingQueue = admittedStudents
    .filter((p) => p.hasRaisedHand)
    .sort((a, b) => (a.handRaisedAt || 0) - (b.handRaisedAt || 0));

  // Current reciter object
  const activeReciter = participants.find((p) => p.id === activeReciterId);

  // Floating reactions
  const addReaction = (text: string) => {
    const id = Date.now();
    setReactions((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2500);
  };

  // ==================== SUPERVISOR / HOST CONTROLS ====================

  // 1. Accept student into room
  const handleAdmitStudent = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, isAdmitted: true } : p))
    );
  };

  // Reject / Remove from room
  const handleRejectOrRemove = (participantId: string) => {
    if (activeReciterId === participantId) {
      setActiveReciterId(null);
    }
    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  // Admit a student directly from registered database
  const handleAdmitFromRegistered = (student: RegisteredStudent) => {
    // Check if already in participants
    const exists = participants.some((p) => p.name === student.name);
    if (exists) {
      showRoomToast(`الطالب (${student.name}) موجود بالفعل في القاعة.`);
      return;
    }

    const newParticipant: RoomParticipant = {
      id: `p-${student.id}`,
      name: student.name,
      role: 'student',
      isHost: false,
      isSpeaking: false,
      isMicMuted: true,
      hasRaisedHand: true,
      handRaisedAt: Date.now(),
      isAdmitted: true,
      surahTarget: student.memorization,
    };

    setParticipants((prev) => [...prev, newParticipant]);
    setIsAdmitSelectorOpen(false);
    showRoomToast(`تم إدخال الطالب (${student.name}) إلى حلقة التسميع.`);
  };

  // 2. Control Recitation Turn
  const handleGrantRecitationTurn = (participantId: string) => {
    setActiveReciterId(participantId);
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          return {
            ...p,
            isSpeaking: true,
            isMicMuted: false,
            hasRaisedHand: false,
          };
        }
        return {
          ...p,
          isSpeaking: p.isHost, // only host and active reciter speak
          isMicMuted: p.isHost ? false : true,
        };
      })
    );
  };

  const handleFinishRecitationTurn = () => {
    if (activeReciterId) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === activeReciterId
            ? { ...p, isSpeaking: false, isMicMuted: true }
            : p
        )
      );
      setActiveReciterId(null);
    }
  };

  const handlePassToNextInQueue = () => {
    if (waitingQueue.length > 0) {
      const nextStudent = waitingQueue[0];
      handleGrantRecitationTurn(nextStudent.id);
    } else {
      handleFinishRecitationTurn();
    }
  };

  // 3. Mute / Unmute controls
  const handleMuteAll = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.isHost ? p : { ...p, isMicMuted: true, isSpeaking: false }))
    );
    if (activeReciterId) {
      setActiveReciterId(null);
    }
  };

  const handleToggleStudentMic = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const nextMuted = !p.isMicMuted;
          return {
            ...p,
            isMicMuted: nextMuted,
            isSpeaking: !nextMuted,
          };
        }
        return p;
      })
    );
  };

  // 4. Waitlist management
  const handleRemoveFromQueue = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, hasRaisedHand: false } : p
      )
    );
  };

  // Student action: Raise / Lower Hand
  const handleToggleRaiseHand = () => {
    const nextState = !hasRaisedHand;
    setHasRaisedHand(nextState);

    // Update the participant in list
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.isCurrentUser) {
          return {
            ...p,
            hasRaisedHand: nextState,
            handRaisedAt: nextState ? Date.now() : undefined,
          };
        }
        return p;
      })
    );
  };

  // Student action: Mic toggle (only if granted permission)
  const handleStudentToggleMic = () => {
    const isMeActiveReciter = activeReciter?.isCurrentUser;
    if (!isMeActiveReciter && !isSupervisorMode) {
      showRoomToast('الميكروفون مغلق بواسطة المشرفة. يمكنك رفع اليد لطلب دور التسميع.');
      return;
    }
    setIsMyMicOn(!isMyMicOn);
    setParticipants((prev) =>
      prev.map((p) => (p.isCurrentUser ? { ...p, isMicMuted: isMyMicOn } : p))
    );
  };

  // Switch supervisor mode
  const toggleSupervisorRole = () => {
    const nextMode = !isSupervisorMode;
    setIsSupervisorMode(nextMode);

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === 'teacher-host') {
          return { ...p, isCurrentUser: nextMode };
        }
        if (p.id.startsWith('user-')) {
          return { ...p, isCurrentUser: !nextMode };
        }
        return p;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-[#0b1c14] border-2 border-emerald-600/80 rounded-3xl max-w-3xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Floating live reactions */}
        <div className="absolute top-16 left-4 z-40 space-y-2 pointer-events-none">
          {reactions.map((r) => (
            <div key={r.id} className="bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-lg animate-bounce">
              {r.text}
            </div>
          ))}
        </div>

        {/* Modal Top Bar */}
        <div className="px-4 py-3 bg-[#081710] border-b border-emerald-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{title}</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.2 rounded-full font-bold">
                  قاعة مباشرة
                </span>
              </div>
              <p className="text-[11px] text-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>مشرفة الحلقة: {teacherName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Supervisor Mode Switcher */}
            <button
              onClick={toggleSupervisorRole}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSupervisorMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-[#081b12] text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
              }`}
              title="تبديل صلاحية المشرف للتحكم بالقاعة"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isSupervisorMode ? 'وضع المشرف (نشط) 👑' : 'تفعيل صلاحية المشرف'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-emerald-950 border border-emerald-900 text-slate-300 hover:text-white cursor-pointer"
              title="مغادرة قاعة المقرأة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-app Toast Banner */}
        {roomNotification && (
          <div className="bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md transition-all">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-slate-900 shrink-0" />
              <span>{roomNotification}</span>
            </span>
            <button
              onClick={() => setRoomNotification(null)}
              className="text-slate-900 hover:text-black font-bold text-sm cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* SUPERVISOR CONTROL PANEL (لوحة تحكم المشرف والمتحكم) */}
          {isSupervisorMode && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#173826] via-[#102c1e] to-[#0d2116] border-2 border-amber-400/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>لوحة تحكم المشرفة الكاملة ({teacherName})</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  صلاحيات التحكم الكامل
                </span>
              </div>

              {/* Quick Controller Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* 1. Mute All */}
                <button
                  onClick={handleMuteAll}
                  className="p-2 rounded-xl bg-[#081810] hover:bg-red-950/60 border border-red-800/60 text-red-300 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>كتم جميع الطلاب</span>
                </button>

                {/* 2. Next in queue */}
                <button
                  onClick={handlePassToNextInQueue}
                  disabled={waitingQueue.length === 0 && !activeReciterId}
                  className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>الطالب التالي</span>
                </button>

                {/* 3. Finish Recitation */}
                <button
                  onClick={handleFinishRecitationTurn}
                  disabled={!activeReciterId}
                  className="p-2 rounded-xl bg-[#081810] hover:bg-amber-950/60 border border-amber-700/60 text-amber-300 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>إنهاء دور التسميع</span>
                </button>

                {/* 4. Admit Real Registered Student */}
                <button
                  onClick={() => setIsAdmitSelectorOpen(!isAdmitSelectorOpen)}
                  className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>إدخال طالب مسجل</span>
                </button>
              </div>

              {/* Selector Dropdown to admit from registered students */}
              {isAdmitSelectorOpen && (
                <div className="p-3 bg-[#07160f] border border-amber-400/50 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                    <span>اختر طالباً مسجلاً لإدخاله إلى القاعة:</span>
                    <button
                      onClick={() => setIsAdmitSelectorOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {registeredStudentsPool.length === 0 ? (
                    <p className="text-xs text-slate-400 py-1">
                      لا يوجد طلاب مسجلون في قاعدة البيانات حتى الآن. يمكنك تسجيل طالب أولاً عبر نموذج التسجيل.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {registeredStudentsPool.filter((std) => Boolean(std && std.name)).map((std) => (
                        <div
                          key={std.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0b2216] border border-emerald-900 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{std.name}</span>
                            <span className="text-[10px] text-emerald-400">
                              {std?.section === 'female' ? 'طالبة' : 'طالب'} • {std?.memorization || 'حفظ عام'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAdmitFromRegistered(std)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            قبول ودخول القاعة
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pending Admission Requests List */}
              {pendingRequests.length > 0 && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>طلبات الانضمام بانتظار موافقة المشرفة ({pendingRequests.length}):</span>
                  </div>
                  <div className="space-y-1.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#07160e] border border-amber-900 text-xs"
                      >
                        <span className="font-semibold text-white">{req.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdmitStudent(req.id)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => handleRejectOrRemove(req.id)}
                            className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 text-[10px] border border-red-800 cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Reciter Stage (منصة التلاوة المباشرة) */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#122e20] to-[#0a1b13] border border-emerald-700/60 text-center relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 mb-2">
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>منصة التسميع والتلاوة الحية</span>
            </div>

            {activeReciter ? (
              <div className="space-y-2 animate-fade-in">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-amber-400/90 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {activeReciter.name.charAt(0)}
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center justify-center gap-1.5">
                    <span>{activeReciter.name}</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                      يتلو الآن أمام المشرفة
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-300/90">
                    {activeReciter.surahTarget || 'سورة البقرة برواية حفص عن عاصم'}
                  </p>
                </div>

                {/* Supervisor quick control for this active reciter */}
                {isSupervisorMode && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={handleFinishRecitationTurn}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      إنهاء دور الطالب
                    </button>
                    <button
                      onClick={() => handleToggleStudentMic(activeReciter.id)}
                      className="px-2.5 py-1 bg-[#091710] border border-emerald-800 text-slate-300 rounded-lg text-xs font-semibold hover:text-white cursor-pointer"
                    >
                      {activeReciter.isMicMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}
                    </button>
                  </div>
                )}

                {/* Speaking Audio Waveform Animation */}
                <div className="flex items-center justify-center gap-1 mt-2 h-8">
                  {[8, 16, 28, 14, 32, 22, 12, 26, 18, 30, 16, 24, 10, 20].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-emerald-500 to-amber-400 rounded-full animate-pulse"
                      style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* CLEAN EMPTY STAGE STATE: Zero fake names */
              <div className="py-4 px-2 space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-6 h-6 text-emerald-400/80" />
                </div>
                <h4 className="font-bold text-white text-sm">
                  المنصة شاغرة وبانتظار بدء التسميع
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isSupervisorMode
                    ? 'يمكنكِ بصفتك المشرفة اختيار طالب من طابور الانتظار أو من قائمة الطلاب المسجلين لبدء دور التسميع.'
                    : 'اضغطي على زر "طلب التسميع (رفع اليد)" بالأسفل ليتم إدراجك في طابور التسميع وتمنحكِ المعلمة الميكروفون.'}
                </p>
                {isSupervisorMode && waitingQueue.length > 0 && (
                  <button
                    onClick={handlePassToNextInQueue}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>البدء مع أول طالب في الطابور ({waitingQueue[0].name})</span>
                  </button>
                )}
              </div>
            )}

            {/* Direct Google Meet Link */}
            {meetUrl && (
              <div className="mt-3 pt-2 border-t border-emerald-900/60">
                <a
                  href={meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-slate-950" />
                  <span>فتح الجلسة الصوتية المباشرة عبر Google Meet</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>
            )}
          </div>

          {/* Interactive Mushaf Viewer (مصحف الحلقة التفاعلي) */}
          <div className="p-3.5 rounded-2xl bg-[#07150f] border border-emerald-900/80 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-emerald-950">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <BookOpen className="w-4 h-4" />
                <span>مصحف المقرأة الشريف (سورة البقرة - الحزب الثالث)</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-slate-300 px-2 py-0.5 rounded border border-emerald-900">
                الآية {ayahs[selectedAyahIndex].num}
              </span>
            </div>

            <div className="text-center py-3 px-2 bg-[#0a1e15] rounded-xl border border-emerald-950/60">
              <p className="font-quran text-lg sm:text-xl text-amber-100 leading-loose">
                {ayahs[selectedAyahIndex].text}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2.5 text-xs">
              <button
                disabled={selectedAyahIndex === 0}
                onClick={() => setSelectedAyahIndex((i) => Math.max(0, i - 1))}
                className="px-2.5 py-1 rounded-lg bg-[#0a1811] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                الآية السابقة
              </button>
              <span className="text-emerald-400 font-mono text-[11px]">
                آية رقم {ayahs[selectedAyahIndex].num}
              </span>
              <button
                disabled={selectedAyahIndex === ayahs.length - 1}
                onClick={() => setSelectedAyahIndex((i) => Math.min(ayahs.length - 1, i + 1))}
                className="px-2.5 py-1 rounded-lg bg-[#0a1811] text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                الآية التالية
              </button>
            </div>
          </div>

          {/* Attendees List & Queued Reciters: Fully realistic, zero dummy names */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                المشاركون والحضور الفعليون في القاعة ({admittedParticipants.length})
              </span>
              {waitingQueue.length > 0 && (
                <span className="text-amber-400 text-[11px] font-semibold">
                  طابور التسميع: {waitingQueue.length} طالب/طالبة
                </span>
              )}
            </div>

            {/* If no students exist, show clear notice */}
            {admittedStudents.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#07160f] border border-emerald-900/60 text-center text-xs text-slate-400 space-y-1">
                <p className="text-slate-300 font-semibold">
                  لا توجد أسماء إضافية في القاعة حتى الآن
                </p>
                <p className="text-[11px] text-slate-500">
                  قائمة الحضور فارغة تماماً من أي أسماء وهمية، وتُدرج أسماء الطلاب فقط فور تسجيلهم الحقيقي أو انضمامهم للمقرأة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {admittedParticipants.map((att) => {
                  const isReciting = activeReciterId === att.id;

                  return (
                    <div
                      key={att.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        att.isHost
                          ? 'bg-[#0f2c1f] border-amber-500/70 shadow-xs'
                          : isReciting
                            ? 'bg-[#103022] border-emerald-400 shadow-xs'
                            : 'bg-[#091710] border-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          att.isHost
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-800 text-emerald-200'
                        }`}>
                          {att.isHost ? '👑' : att.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-white leading-tight">{att.name}</p>
                            {att.isCurrentUser && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded">
                                أنت
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {att.isHost
                              ? 'مشرفة ومتحكم الحلقة'
                              : isReciting
                                ? 'يتلو الآن على المعلمة'
                                : att.hasRaisedHand
                                  ? 'في طابور التسميع ✋'
                                  : 'مستمع في القاعة'}
                          </p>
                        </div>
                      </div>

                      {/* Right controls per attendee */}
                      <div className="flex items-center gap-1.5">
                        {/* Status Tags */}
                        {att.hasRaisedHand && !isReciting && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                            طالب للتسميع ✋
                          </span>
                        )}

                        {/* Supervisor Actions on this student */}
                        {isSupervisorMode && !att.isHost && (
                          <div className="flex items-center gap-1">
                            {/* Grant Recitation */}
                            {!isReciting ? (
                              <button
                                onClick={() => handleGrantRecitationTurn(att.id)}
                                className="p-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-semibold cursor-pointer"
                                title="منح دور التسميع"
                              >
                                تسميع
                              </button>
                            ) : (
                              <button
                                onClick={handleFinishRecitationTurn}
                                className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold cursor-pointer"
                                title="إنهاء التسميع"
                              >
                                إنهاء
                              </button>
                            )}

                            {/* Mute/Unmute toggle */}
                            <button
                              onClick={() => handleToggleStudentMic(att.id)}
                              className={`p-1 rounded text-[10px] cursor-pointer ${
                                att.isMicMuted
                                  ? 'bg-red-950 text-red-300 border border-red-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                              title={att.isMicMuted ? "فتح المايك للطالب" : "كتم مايك الطالب"}
                            >
                              {att.isMicMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                            </button>

                            {/* Remove from room */}
                            <button
                              onClick={() => handleRejectOrRemove(att.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                              title="إخراج من القاعة"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Speaking Animation */}
                        {att.isSpeaking && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-3 bg-[#081710] border-t border-emerald-900/80 flex flex-wrap items-center justify-between gap-2">
          {/* Reaction Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => addReaction('ما شاء الله تبارك الله ✨')}
              className="px-2 py-1.5 rounded-lg bg-[#0e241b] hover:bg-emerald-900/60 border border-emerald-900 text-[11px] text-emerald-300 cursor-pointer"
            >
              ما شاء الله ✨
            </button>
            <button
              onClick={() => addReaction('فتح الله عليك يا معلمة 🌿')}
              className="px-2 py-1.5 rounded-lg bg-[#0e241b] hover:bg-emerald-900/60 border border-emerald-900 text-[11px] text-emerald-300 cursor-pointer"
            >
              فتح الله عليك 🌿
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Raise Hand Toggle (for student role) */}
            {!isSupervisorMode && (
              <button
                onClick={handleToggleRaiseHand}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  hasRaisedHand
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-[#0e241b] text-amber-300 border-amber-500/40 hover:bg-amber-950/40'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>{hasRaisedHand ? 'تم طلب التسميع (أنتِ في الطابور)' : 'طلب التسميع (رفع اليد)'}</span>
              </button>
            )}

            {/* Mic Toggle */}
            <button
              onClick={isSupervisorMode ? () => setIsMyMicOn(!isMyMicOn) : handleStudentToggleMic}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMyMicOn
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                  : 'bg-red-950/60 text-red-400 border-red-800 hover:bg-red-900/60'
              }`}
              title={isMyMicOn ? "كتم صوتي" : "تشغيل صوتي"}
            >
              {isMyMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
