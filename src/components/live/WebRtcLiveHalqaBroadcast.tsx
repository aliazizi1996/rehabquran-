/**
 * مكون بث الحلقات القرآنية المباشرة عبر WebRTC (WebRtcLiveHalqaBroadcast)
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 * بث صوتي ومرئي مشفر وعالي الوضوح، مع المصحف المتزامن وإدارة أدوار التسميع
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, Shield, Sparkles, 
  Hand, Users, MessageSquare, BookOpen, Volume2, Maximize2, 
  Minimize2, PhoneOff, Award, CheckCircle2, AlertCircle, 
  Clock, Share2, Star, Send, X, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { WebRtcHalqaSession } from '../../services/webrtcService';
import { WebRtcParticipant, WebRtcChatMessage, QuranSyncState } from '../../types/webrtc';
import { OfficialLogo } from '../OfficialLogo';

// عينة من سور القرآن الكريم للعرض والمزامنة الحية أثناء الجلسة
const POPULAR_SURAHS = [
  { number: 1, name: 'سورة الفاتحة', ayahsCount: 7, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (1) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (2) الرَّحْمَٰنِ الرَّحِيمِ (3) مَالِكِ يَوْمِ الدِّينِ (4) إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (5) اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (6) صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (7)' },
  { number: 2, name: 'سورة البقرة (أول السورة)', ayahsCount: 5, text: 'الم (1) ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ (2) الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنْفِقُونَ (3) وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنْزِلَ إِلَيْكَ وَمَا أُنْزِلَ مِنْ قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ (4) أُولَٰئِكَ عَلَىٰ هُدًى مِنْ رَبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ (5)' },
  { number: 18, name: 'سورة الكهف (أول السورة)', ayahsCount: 5, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنْزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَلْ لَهُ عِوَجًا ۜ (1) قَيِّمًا لِيُنْذِرَ بَأْسًا شَدِيدًا مِنْ لَدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا (2) مَاكِثِينَ فِيهِ أَبَدًا (3) وَيُنْذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا (4) مَا لَهُمْ بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِنْ يَقُولُونَ إِلَّا كَذِبًا (5)' },
  { number: 36, name: 'سورة يس (أول السورة)', ayahsCount: 6, text: 'يس (1) وَالْقُرْآنِ الْحَكِيمِ (2) إِنَّكَ لَمِنَ الْمُرْسَلِينَ (3) عَلَىٰ صِرَاطٍ مُسْتَقِيمٍ (4) تَنْزِيلَ الْعَزِيزِ الرَّحِيمِ (5) لِتُنْذِرَ قَوْمًا مَا أُنْذِرَ آبَاؤُهُمْ فَهُمْ غَافِلُونَ (6)' },
  { number: 67, name: 'سورة الملك', ayahsCount: 4, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ (1) الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ (2) الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِنْ تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِنْ فُطُورٍ (3)' },
  { number: 112, name: 'سورة الإخلاص والمعوذتين', ayahsCount: 4, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ (1) اللَّهُ الصَّمَدُ (2) لَمْ يَلِدْ وَلَمْ يُولَدْ (3) وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ (4)' }
];

interface WebRtcLiveHalqaBroadcastProps {
  roomId: string;
  halqaTitle: string;
  halqaId?: string;
  userRole: 'teacher' | 'student' | 'supervisor';
  userId: string;
  userName: string;
  section?: 'male' | 'female' | 'both';
  teacherName?: string;
  riwayah?: string;
  onClose: () => void;
  onSaveRecitationScore?: (studentId: string, score: number, notes: string) => Promise<void>;
}

export const WebRtcLiveHalqaBroadcast: React.FC<WebRtcLiveHalqaBroadcastProps> = ({
  roomId,
  halqaTitle,
  halqaId,
  userRole,
  userId,
  userName,
  section = 'male',
  teacherName = 'فضيلة الشيخ المجيز',
  riwayah = 'حفص عن عاصم',
  onClose,
  onSaveRecitationScore,
}) => {
  // حالة التحكم بالوسائط
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // افتراضياً الكاميرا مغلقة حفظاً للخصوصية ووقار الحلقة
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // حالة المشاركين
  const [participants, setParticipants] = useState<WebRtcParticipant[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [activeReciterId, setActiveReciterId] = useState<string | null>(null);
  const [activeReciterName, setActiveReciterName] = useState<string | null>(null);

  // واجهة المصحف الشريف المتزامن
  const [isQuranViewOpen, setIsQuranViewOpen] = useState(true);
  const [selectedSurahIdx, setSelectedSurahIdx] = useState(0);
  const [quranSyncState, setQuranSyncState] = useState<QuranSyncState>({
    surahNumber: POPULAR_SURAHS[0].number,
    surahName: POPULAR_SURAHS[0].name,
    ayahStart: 1,
    ayahEnd: POPULAR_SURAHS[0].ayahsCount,
    juzNumber: 1,
    sampleAyahText: POPULAR_SURAHS[0].text,
    updatedBy: userName,
  });

  // الشات والملاحظات
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'participants' | 'tajweed'>('chat');
  const [chatMessages, setChatMessages] = useState<WebRtcChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // تقييم التسميع السريع من المعلم
  const [ratingScore, setRatingScore] = useState<number>(10);
  const [ratingNotes, setRatingNotes] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // مراجع الفيديو والعناصر
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<WebRtcHalqaSession | null>(null);

  // مدة البث المباشر
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

  // تحديث مدة الجلسة
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(sessionDurationSeconds / 3600);
    const minutes = Math.floor((sessionDurationSeconds % 3600) / 60);
    const seconds = sessionDurationSeconds % 60;
    return `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [sessionDurationSeconds]);

  // تهيئة جلسة WebRTC
  useEffect(() => {
    const currentParticipant: WebRtcParticipant = {
      id: userId,
      name: userName,
      role: userRole,
      section,
      isAudioOnly: isVideoOff,
      isMuted: isAudioMuted,
      isVideoOff: isVideoOff,
      isHandRaised: false,
      isCurrentReciter: userRole === 'teacher',
      joinedAt: new Date().toISOString(),
      avatarText: userName.slice(0, 1),
    };

    const session = new WebRtcHalqaSession(roomId, currentParticipant, {
      onParticipantsChange: (updated) => {
        setParticipants(updated);
        // التحقق من القارئ الحالي
        const current = updated.find(p => p.isCurrentReciter);
        if (current) {
          setActiveReciterId(current.id);
          setActiveReciterName(current.name);
        }
      },
      onRemoteStream: (peerId, stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onRemoteStreamRemoved: () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      },
      onChatMessage: (message) => {
        setChatMessages(prev => [...prev, message]);
      },
      onQuranSync: (sync) => {
        setQuranSyncState(sync);
        const idx = POPULAR_SURAHS.findIndex(s => s.number === sync.surahNumber);
        if (idx !== -1) setSelectedSurahIdx(idx);
      },
      onTurnGranted: (studentId, studentName) => {
        setActiveReciterId(studentId);
        setActiveReciterName(studentName);
        if (studentId === userId) {
          setStatusMessage('أحسن الله إليك! مُنحتَ دور التسميع الآن. تفضل بالقراءة وترتيل الآيات.');
          // فتح الميكروفون تلقائياً للطالب إذا كان مكتوماً
          if (sessionRef.current && isAudioMuted) {
            setIsAudioMuted(sessionRef.current.toggleMute());
          }
        }
      },
      onTurnRevoked: () => {
        setActiveReciterId(null);
        setActiveReciterName(null);
        if (userId === activeReciterId) {
          setStatusMessage('انتهى وقت التسميع، بارك الله فيك ونفع بك.');
        }
      },
      onHandRaised: (_stdId, stdName) => {
        if (userRole === 'teacher') {
          setStatusMessage(`طلب جديد: الطالب (${stdName}) يرفع يده لطلب التسميع.`);
        }
      },
      onAudioLevel: (lvl) => {
        setAudioLevel(lvl);
      },
      onConnectionStatus: (status) => {
        setConnectionStatus(status);
      },
      onError: (errMsg) => {
        setStatusMessage(errMsg);
      },
    });

    sessionRef.current = session;

    // بدء البث الصوتي (مع فيديو إذا تم اختياره)
    void session.start({ enableAudio: true, enableVideo: !isVideoOff }).then((localStream) => {
      if (localStream && localVideoRef.current && !isVideoOff) {
        localVideoRef.current.srcObject = localStream;
      }
    });

    // رسالة ترحيبية في الشات
    setChatMessages([
      {
        id: 'msg-welcome',
        senderId: 'system',
        senderName: 'إدارة المقرأة',
        senderRole: 'supervisor',
        text: `مرحباً بكم في البث القرآني المباشر لحلقة «${halqaTitle}». الاتصال مشفر P2P بتقنية WebRTC، نسأل الله أن يبارك في هذا المجلس القرآني المبارك.`,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isTajweedNote: false,
      }
    ]);

    return () => {
      session.destroy();
      sessionRef.current = null;
    };
  }, [roomId, userId, userName, userRole, section, halqaTitle]);

  // التمرير التلقائي لأسفل الشات
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // تبديل الميكروفون
  const handleToggleMute = () => {
    if (sessionRef.current) {
      const isMuted = sessionRef.current.toggleMute();
      setIsAudioMuted(isMuted);
    }
  };

  // تبديل الكاميرا
  const handleToggleVideo = async () => {
    if (sessionRef.current) {
      const isVideoOn = await sessionRef.current.toggleVideo();
      setIsVideoOff(!isVideoOn);
      if (isVideoOn && localVideoRef.current) {
        // تحديث بث الكاميرا
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
        if (stream && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    }
  };

  // تبديل مشاركة الشاشة (المصحف أو المتن)
  const handleToggleScreenShare = async () => {
    if (sessionRef.current) {
      const stream = await sessionRef.current.toggleScreenShare();
      setIsScreenSharing(Boolean(stream));
      if (stream && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }
  };

  // رفع أو خفض اليد للطالب
  const handleToggleRaiseHand = () => {
    if (!sessionRef.current) return;
    if (handRaised) {
      sessionRef.current.lowerHand();
      setHandRaised(false);
    } else {
      sessionRef.current.raiseHand();
      setHandRaised(true);
      setStatusMessage('تم رفع يدك لطلب التسميع، بانتظار إذن فضيلة الشيخ.');
    }
  };

  // المعلم يعطي الدور للطالب
  const handleGrantTurn = (participant: WebRtcParticipant) => {
    if (sessionRef.current && userRole === 'teacher') {
      sessionRef.current.grantTurn(participant.id, participant.name);
      setActiveReciterId(participant.id);
      setActiveReciterName(participant.name);
      setStatusMessage(`أعطيتَ دور التسميع للطالب: ${participant.name}`);
    }
  };

  // المعلم يسحب الدور
  const handleRevokeTurn = (studentId: string) => {
    if (sessionRef.current && userRole === 'teacher') {
      sessionRef.current.revokeTurn(studentId);
      setActiveReciterId(null);
      setActiveReciterName(null);
      setStatusMessage('تم إنهاء دور التسميع.');
    }
  };

  // مزامنة السورة من المعلم
  const handleSelectSurah = (idx: number) => {
    setSelectedSurahIdx(idx);
    const surah = POPULAR_SURAHS[idx];
    if (surah && sessionRef.current && userRole === 'teacher') {
      const newSync: QuranSyncState = {
        surahNumber: surah.number,
        surahName: surah.name,
        ayahStart: 1,
        ayahEnd: surah.ayahsCount,
        juzNumber: surah.number >= 78 ? 30 : 1,
        sampleAyahText: surah.text,
        updatedBy: userName,
      };
      setQuranSyncState(newSync);
      sessionRef.current.syncQuran(newSync);
      setStatusMessage(`تمت مزامنة عرض «${surah.name}» لجميع طلاب الحلقة.`);
    }
  };

  // إرسال رسالة في الشات أو ملاحظة تجويدية
  const handleSendChat = (e: React.FormEvent, isTajweed: boolean = false) => {
    e.preventDefault();
    if (!chatInput.trim() || !sessionRef.current) return;
    sessionRef.current.sendChatMessage(chatInput.trim(), isTajweed);
    setChatInput('');
  };

  // حفظ تقييم التسميع
  const handleConfirmRating = async () => {
    if (!activeReciterId || !onSaveRecitationScore) return;
    setIsSubmittingRating(true);
    try {
      await onSaveRecitationScore(activeReciterId, ratingScore, ratingNotes);
      setStatusMessage(`تم رصد تقييم الطالب (${activeReciterName}) بدرجة ${ratingScore}/10 بنجاح.`);
      setShowRatingModal(false);
      setRatingNotes('');
    } catch {
      setStatusMessage('حدث خطأ أثناء رصد التقييم.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // تبديل ملء الشاشة
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // قائمة الطلاب الذين رفعوا يدهم
  const handRaisedStudents = useMemo(() => {
    return participants.filter(p => p.role === 'student' && p.isHandRaised);
  }, [participants]);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-[#071E13] text-slate-100 flex flex-col font-sans select-none overflow-hidden ${
        isFullscreen ? 'w-screen h-screen' : ''
      }`}
      dir="rtl"
    >
      {/* ======================================================== */}
      {/* 1. الترويسة العلوية الفاخرة (Header)                      */}
      {/* ======================================================== */}
      <header className="bg-[#03150C] border-b-2 border-[#C5A059]/40 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        {/* معلومات الحلقة وهوية المقرأة */}
        <div className="flex items-center gap-3 min-w-0">
          <OfficialLogo size="sm" clickable={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[11px] animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>بث مباشر (WebRTC)</span>
              </span>
              <span className="text-[11px] font-bold text-[#C5A059] bg-[#C5A059]/15 px-2 py-0.5 rounded-full border border-[#C5A059]/30 hidden sm:inline">
                {riwayah}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-white truncate mt-0.5">
              {halqaTitle} • <span className="text-emerald-300 font-sans font-normal text-xs">{teacherName}</span>
            </h1>
          </div>
        </div>

        {/* مؤشرات الأمان والوقت */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* مؤشر تشفير WebRTC P2P */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold" title="اتصال مشفر بتقنية WebRTC DTLS/SRTP لضمان الخصوصية التامة">
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>مشفر وخاص (P2P)</span>
          </div>

          {/* عداد مدة البث */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-[#C5A059]/30 text-amber-300 font-mono text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formattedDuration}</span>
          </div>

          {/* عدد المشاركين */}
          <button
            onClick={() => setActiveSideTab('participants')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-600/50 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{participants.length}</span>
          </button>

          {/* ملء الشاشة */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="تبديل ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* زر مغادرة البث */}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>مغادرة</span>
          </button>
        </div>
      </header>

      {/* شريط الإشعارات اللحظية في البث */}
      {statusMessage && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-amber-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. منطقة العرض الرئيسية (Main Stage Layout)              */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* المنصة الرئيسية (فيديو الشيخ + القارئ الحالي + المصحف المتزامن) */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
          
          {/* شريط الشيخ والقارئ الحالي */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
            
            {/* بطاقة الشيخ المقرئ (المعلم) */}
            <div className={`lg:col-span-6 rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between relative overflow-hidden shadow-lg ${
              userRole === 'teacher' 
                ? 'bg-gradient-to-br from-[#042918] via-[#053720] to-[#032415] border-[#C5A059]' 
                : 'bg-[#031d11] border-[#C5A059]/60'
            }`}>
              {/* شارة التوثيق */}
              <div className="flex items-center justify-between gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38] text-white text-xs font-bold border border-[#C5A059]/60 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>فضيلة الشيخ المقرئ المجيز</span>
                </span>
                
                {/* مؤشر الصوت المباشر للشيخ */}
                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="w-16 h-2 bg-emerald-950 rounded-full overflow-hidden flex items-center">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
                      style={{ width: `${userRole === 'teacher' ? audioLevel : (participants.find(p => p.role === 'teacher')?.isMuted ? 0 : 65)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* منتصف البطاقة: كاميرا الشيخ أو الشعار الوقور مع التردد الصوتي */}
              <div className="py-6 flex flex-col items-center justify-center text-center relative z-10">
                {userRole === 'teacher' && !isVideoOff ? (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full max-h-48 object-cover rounded-2xl border border-[#C5A059]/40 shadow-md"
                  />
                ) : (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="relative">
                      {/* موجات صوتية نابضة حول الختم */}
                      <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-md animate-pulse"></div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#046A38] to-[#065A31] border-2 border-[#C5A059] flex items-center justify-center text-white shadow-xl relative">
                        <OfficialLogo size="md" clickable={false} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold font-serif text-lg text-white">
                        {teacherName}
                      </h3>
                      <p className="text-xs text-emerald-200 mt-0.5">
                        إشراف وإقراء مباشر بالسند المتصل
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* أسفل البطاقة */}
              <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-emerald-800/40 z-10">
                <span className="flex items-center gap-1 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>البث الصوتي عالي النقاء HD</span>
                </span>
                <span className="text-[11px] text-[#C5A059] font-mono">
                  {userRole === 'teacher' ? 'أنت المضيف والمقرئ' : 'استماع وإقراء'}
                </span>
              </div>
            </div>

            {/* بطاقة القارئ الحالي (الطالب المستلم لدور التسميع) */}
            <div className={`lg:col-span-6 rounded-3xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between relative overflow-hidden shadow-lg ${
              activeReciterId 
                ? 'bg-gradient-to-br from-[#1A180E] via-[#241F10] to-[#121008] border-amber-400 ring-2 ring-amber-400/20' 
                : 'bg-[#04160D] border-slate-700/60'
            }`}>
              {/* رأس بطاقة القارئ */}
              <div className="flex items-center justify-between gap-2 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                  activeReciterId
                    ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activeReciterId ? 'منصة التسميع والعرض (القارئ الحالي)' : 'منصة التسميع بانتظار الدور'}</span>
                </span>

                {userRole === 'teacher' && activeReciterId && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>رصد الدرجة</span>
                  </button>
                )}
              </div>

              {/* وسط البطاقة: القارئ الحالي */}
              <div className="py-6 flex flex-col items-center justify-center text-center z-10">
                {activeReciterId ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute -inset-2 rounded-full bg-amber-400/30 blur-md animate-pulse"></div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 border-2 border-amber-300 flex items-center justify-center text-white text-2xl font-bold font-serif shadow-2xl relative">
                        {activeReciterName ? activeReciterName.slice(0, 1) : 'ط'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold font-serif text-lg text-amber-200">
                        {activeReciterName}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        جاري التلاوة والعرض المباشر على يد الشيخ
                      </p>
                    </div>

                    {/* أزرار إنهاء التسميع للمعلم */}
                    {userRole === 'teacher' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleRevokeTurn(activeReciterId)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          إنهاء دور الطالب
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 py-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <Hand className="w-8 h-8 text-amber-500/70" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm font-serif">
                        لا يوجد طالب يسرد حالياً
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        {userRole === 'student' 
                          ? 'اضغط على زر «رفع اليد» بالأسفل لطلب دورك في التسميع والعرض على الشيخ.' 
                          : 'يمكنك اختيار أحد الطلاب من قائمة رافعي الأيدي لمنحه دور التسميع.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* أسفل بطاقة القارئ: رافعو الأيدي بالانتظار */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 z-10">
                <span className="flex items-center gap-1.5">
                  <Hand className="w-3.5 h-3.5 text-amber-400" />
                  <span>رافعو الأيدي: <strong>{handRaisedStudents.length}</strong></span>
                </span>
                
                {userRole === 'teacher' && handRaisedStudents.length > 0 && !activeReciterId && (
                  <button
                    onClick={() => handleGrantTurn(handRaisedStudents[0])}
                    className="text-amber-300 hover:text-white font-bold cursor-pointer underline text-[11px]"
                  >
                    منح الدور لـ ({handRaisedStudents[0].name}) ←
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* المصحف الشريف المتزامن للحلقة (Synchronized Quran Stage) */}
          {/* ======================================================== */}
          <div className="bg-[#03180E] rounded-3xl border-2 border-[#C5A059]/50 p-4 sm:p-6 shadow-xl space-y-4 flex-1 flex flex-col">
            {/* ترويسة المصحف وقائمة اختيار السور */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8C6B2D] text-slate-950 flex items-center justify-center font-bold shadow-sm">
                  <BookOpen className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-white flex items-center gap-2">
                    <span>المصحف الشريف المتزامن</span>
                    <span className="text-[10px] font-bold bg-[#C5A059]/20 text-[#f7e8c6] px-2 py-0.5 rounded-full border border-[#C5A059]/40 font-sans">
                      عرض موحد لجميع الطلاب
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    متابعة قراءة الآيات وتطبيق أحكام التجويد لحظة بلحظة مع الشيخ
                  </p>
                </div>
              </div>

              {/* محدد السورة للمعلم (المزامنة) */}
              {userRole === 'teacher' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-300 font-bold">مزامنة السورة:</span>
                  <select
                    value={selectedSurahIdx}
                    onChange={(e) => handleSelectSurah(Number(e.target.value))}
                    className="bg-[#052917] border border-[#C5A059]/70 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-serif"
                  >
                    {POPULAR_SURAHS.map((s, idx) => (
                      <option key={s.number} value={idx}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#052917] border border-[#C5A059]/40 text-xs text-amber-200 font-serif">
                  <span>السورة المقرأة:</span>
                  <strong className="text-white font-bold">{quranSyncState.surahName}</strong>
                </div>
              )}
            </div>

            {/* بطاقة عرض الآيات القرآنية بالخط العثماني الأنيق */}
            <div className="flex-1 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2E6] text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-[#C5A059] shadow-inner flex flex-col justify-center text-center space-y-4 min-h-[160px]">
              <div className="flex items-center justify-center gap-3 text-xs font-bold text-[#046A38]">
                <span>❖</span>
                <span className="font-serif text-sm text-[#C5A059]">{quranSyncState.surahName}</span>
                <span>❖</span>
              </div>

              <div className="max-w-3xl mx-auto py-2">
                <p className="font-amiri text-lg sm:text-2xl md:text-3xl text-slate-900 leading-loose text-center font-bold tracking-wide">
                  {quranSyncState.sampleAyahText || POPULAR_SURAHS[selectedSurahIdx].text}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-900/10 font-serif">
                <span>الجزء: {quranSyncState.juzNumber}</span>
                <span className="text-[#046A38] font-bold">رواية {riwayah}</span>
                <span>الآيات: {quranSyncState.ayahStart} - {quranSyncState.ayahEnd}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 3. الشريط الجانبي (Side Drawer: Chat, Students, Tajweed) */}
        {/* ======================================================== */}
        <aside className="w-80 sm:w-96 bg-[#03150C] border-r border-[#C5A059]/30 flex flex-col shrink-0">
          {/* تبويبات الشريط الجانبي */}
          <div className="flex border-b border-emerald-900/60 bg-[#021009] text-xs font-bold">
            <button
              onClick={() => setActiveSideTab('chat')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeSideTab === 'chat'
                  ? 'border-b-2 border-amber-400 text-amber-300 bg-[#031c10]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>الشات والأسئلة</span>
            </button>
            <button
              onClick={() => setActiveSideTab('participants')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeSideTab === 'participants'
                  ? 'border-b-2 border-amber-400 text-amber-300 bg-[#031c10]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>الطلاب ({participants.length})</span>
            </button>
            <button
              onClick={() => setActiveSideTab('tajweed')}
              className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeSideTab === 'tajweed'
                  ? 'border-b-2 border-amber-400 text-amber-300 bg-[#031c10]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ملاحظات التجويد</span>
            </button>
          </div>

          {/* محتوى تبويب الشات والأسئلة */}
          {activeSideTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div 
                ref={chatScrollRef}
                className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto text-xs"
              >
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-2xl space-y-1 ${
                      msg.isTajweedNote 
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200' 
                        : msg.senderId === userId 
                          ? 'bg-[#046A38]/30 border border-emerald-500/30 mr-4' 
                          : 'bg-slate-900/80 border border-slate-800 ml-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${msg.senderRole === 'teacher' ? 'text-amber-400' : 'text-emerald-300'}`}>
                        {msg.senderName} {msg.senderRole === 'teacher' && '(الشيخ المقرئ)'}
                      </span>
                      <span className="text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* صندوق إرسال الشات */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-emerald-900/60 bg-[#021009] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب سؤالاً أو استفساراً تجويدياً..."
                  className="flex-1 bg-[#042012] border border-emerald-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* محتوى تبويب الطلاب والحضور */}
          {activeSideTab === 'participants' && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 text-xs">
              <div className="text-[11px] text-slate-400 pb-2 border-b border-emerald-900/60 flex justify-between">
                <span>المشاركون في الحلقة</span>
                <span className="font-bold text-emerald-400">{participants.length} متصل</span>
              </div>

              {participants.map((p) => (
                <div 
                  key={p.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
                    p.isCurrentReciter
                      ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                      : 'bg-[#042012] border-emerald-900/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0 font-serif">
                      {p.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 truncate">
                      <span className="font-bold block truncate text-xs">
                        {p.name} {p.id === userId && '(أنت)'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {p.role === 'teacher' ? 'الشيخ المقرئ' : 'طالب في الحلقة'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.isHandRaised && (
                      <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300" title="رفع اليد لطلب التسميع">
                        <Hand className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {userRole === 'teacher' && p.role === 'student' && !p.isCurrentReciter && (
                      <button
                        onClick={() => handleGrantTurn(p)}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                      >
                        إعطاء الدور
                      </button>
                    )}
                    {userRole === 'teacher' && p.isCurrentReciter && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-lg animate-pulse">
                        يسرد الآن
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* محتوى تبويب ملاحظات التجويد */}
          {activeSideTab === 'tajweed' && (
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 text-xs">
              <div className="bg-[#042012] p-3 rounded-2xl border border-emerald-800/60 space-y-1">
                <strong className="text-amber-300 font-bold block text-xs">توجيهات الشيخ التجويدية للحلقة:</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يُرجى من الطلاب الأفاضل تحقيق مخارج الحروف، وضبط مقدار الغنن حركتين، والالتزام بمراتب القلقلة في الوقف والوصل.
                </p>
              </div>

              {userRole === 'teacher' && (
                <div className="space-y-2 pt-2 border-t border-emerald-900/60">
                  <span className="text-[11px] font-bold text-amber-300 block">إرسال تنبيه تجويدي سريع للشات:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'انتبه لزمن الغنة حركتين',
                      'تحقيق مخرج الضاد والظاء',
                      'ترقيق الراء المكسورة',
                      'مد متصل 4 إلى 5 حركات',
                      'إظهار حلقي بدون غنة',
                      'قلقلة كبرى عند الوقف',
                    ].map((note, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (sessionRef.current) {
                            sessionRef.current.sendChatMessage(note, true);
                            setStatusMessage(`تم إرسال تنبيه: «${note}»`);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-[#046A38] text-[11px] text-slate-300 hover:text-white border border-slate-800 text-right transition-colors cursor-pointer"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 4. شريط أدوات التحكم السفلي (Bottom Controls Bar)        */}
      {/* ======================================================== */}
      <footer className="bg-[#021008] border-t-2 border-[#C5A059]/40 p-3 sm:p-4 flex items-center justify-between gap-3 shrink-0 shadow-2xl">
        {/* الأدوات الصوتية والمرئية الأساسية */}
        <div className="flex items-center gap-2">
          {/* كتم / فتح الميكروفون */}
          <button
            onClick={handleToggleMute}
            className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059]'
            }`}
            title={isAudioMuted ? 'إلغاء كتم الميكروفون' : 'كتم الميكروفون'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-amber-300" />}
            <span className="hidden sm:inline">{isAudioMuted ? 'مكتوم' : 'تحدث'}</span>
          </button>

          {/* تشغيل / إيقاف الكاميرا */}
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isVideoOff
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-400'
            }`}
            title={isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span className="hidden sm:inline">{isVideoOff ? 'صوت فقط' : 'فيديو مفعّل'}</span>
          </button>

          {/* مشاركة الشاشة للمعلم أو الطالب المجاز */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isScreenSharing
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="مشاركة الشاشة / عرض المصحف الشريف"
          >
            <Monitor className="w-5 h-5" />
            <span className="hidden md:inline">مشاركة المصحف</span>
          </button>
        </div>

        {/* أدوات التسميع المركزية (رفع اليد للطالب / إدارة الأدوار للمعلم) */}
        <div className="flex items-center gap-2">
          {userRole === 'student' ? (
            <button
              onClick={handleToggleRaiseHand}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                handRaised
                  ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                  : 'bg-gradient-to-r from-[#C5A059] to-[#9E7B35] text-slate-950 hover:opacity-90'
              }`}
            >
              <Hand className="w-5 h-5" />
              <span>{handRaised ? 'اليد مرفوعة (بانتظار الإذن)' : '✋ طلب الإذن بالتسميع'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {handRaisedStudents.length > 0 && (
                <button
                  onClick={() => handleGrantTurn(handRaisedStudents[0])}
                  className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer animate-pulse"
                >
                  <Hand className="w-4 h-4" />
                  <span>منح الدور لـ ({handRaisedStudents[0].name})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* إنهاء أو مغادرة الجلسة */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-3 rounded-2xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">إنهاء ومغادرة</span>
          </button>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 5. نافذة رصد درجة التسميع الفورية للمعلم (Rating Modal)   */}
      {/* ======================================================== */}
      {showRatingModal && activeReciterId && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#052917] border-2 border-[#C5A059] rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold font-serif text-base text-white">
                  رصد تقييم تلاوة ({activeReciterName})
                </h3>
              </div>
              <button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  درجة الإتقان والتجويد (من 10):
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[6, 7, 8, 9, 10].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setRatingScore(score)}
                      className={`py-2 rounded-xl font-bold cursor-pointer transition-all ${
                        ratingScore === score
                          ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {score} / 10
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  ملاحظات وتوجيهات الشيخ للطالب:
                </label>
                <textarea
                  value={ratingNotes}
                  onChange={(e) => setRatingNotes(e.target.value)}
                  placeholder="سرد متقن، مراعاة المدود ومخارج الحروف، واصل الحفظ والتثبيت..."
                  rows={3}
                  className="w-full bg-[#031c10] border border-emerald-700/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRating}
                disabled={isSubmittingRating}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs shadow-md hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRating ? 'جاري الحفظ...' : 'اعتماد التقييم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
