import React, { useState, useEffect, useId, useRef } from 'react';
import { 
  GraduationCap, BookOpen, Volume2, Volume1, VolumeX, Sparkles, 
  ChevronDown, ChevronUp, Search, CheckCircle2, Bookmark,
  Play, Pause, Video, Award, ArrowLeft, ArrowRight, Mic,
  AlertCircle, Check, HelpCircle, RefreshCw, FileDown, FileText,
  Printer, Maximize2, Minimize2, ShieldCheck, Sun, Moon,
  FastForward, BarChart3, List, Share2, Layers, Clock, Lock, Unlock, RotateCcw,
  Eye, ExternalLink, WifiOff
} from 'lucide-react';
import { TAJWEED_CURRICULUM } from '../data/tajweedLessonsData';
import { TajweedChapter, TajweedLesson } from '../types';
import { generateLessonPdfDocument, printLessonPdf, downloadLessonPdfHtml, downloadLessonDirectPdf } from '../utils/pdfExport';
import { TajweedPdfPreviewModal } from './student/TajweedPdfPreviewModal';
import { 
  getActiveCurriculum,
  getLessonProgressMap, 
  isLessonCompleted, 
  isLessonUnlocked,
  getCurriculumSettings,
  markLessonCompleted, 
  resetLessonProgress,
  LessonProgressData,
  getAllLevelsStatus,
  getLevelStatus,
  LevelInfo
} from '../data/learningStore';
import { speechAudioEngine } from '../utils/speechAudioEngine';
import { InteractiveLessonQuiz } from './InteractiveLessonQuiz';
import { LazyVideoPlayer } from './common/LazyVideoPlayer';
import { useDataSaver } from '../utils/dataSaverStore';

interface TajweedGuideViewProps {
  onNavigateToDifficultWords?: () => void;
  onNavigateToTeacherLog?: () => void;
  initialChapterId?: string;
  initialLessonId?: string;
}

export const TajweedGuideView: React.FC<TajweedGuideViewProps> = ({
  onNavigateToDifficultWords,
  onNavigateToTeacherLog,
  initialChapterId,
  initialLessonId
}) => {
  const searchInputId = useId();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { isDataSaver, toggleDataSaver } = useDataSaver();

  // Active Chapter, Lesson, and Dynamic Curriculum Tree
  const [curriculumTree, setCurriculumTree] = useState<TajweedChapter[]>(() => getActiveCurriculum());
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    if (initialChapterId) return initialChapterId;
    const list = getActiveCurriculum();
    return list[0]?.id || 'chap-1-intro';
  });
  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    if (initialLessonId) return initialLessonId;
    const list = getActiveCurriculum();
    return list[0]?.lessons[0]?.id || 'les-1-1-intro';
  });

  useEffect(() => {
    if (initialChapterId) setSelectedChapterId(initialChapterId);
    if (initialLessonId) setActiveLessonId(initialLessonId);
  }, [initialChapterId, initialLessonId]);
  
  // Progress tracking
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressData>>({});
  
  // Practical Recitation Recording state
  const [isRecordingPractical, setIsRecordingPractical] = useState<boolean>(false);
  const [practicalCompleted, setPracticalCompleted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dedicated Lesson Audio Player State for 🔊 صوت
  const [isLessonAudioPlaying, setIsLessonAudioPlaying] = useState<boolean>(false);
  const [lessonAudioCurrentTime, setLessonAudioCurrentTime] = useState<number>(0);
  const [lessonAudioDuration, setLessonAudioDuration] = useState<number>(0);
  const [lessonAudioSpeed, setLessonAudioSpeed] = useState<number>(1.0);
  const [isLessonAudioLoop, setIsLessonAudioLoop] = useState<boolean>(false);
  const lessonAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Enhanced Video Player State (Coursera / YouTube Inspired)
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoProgressPercent, setVideoProgressPercent] = useState<number>(20);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false); // Unmuted by default per user specification
  const [audioVolume, setAudioVolume] = useState<number>(100); // 100% volume by default
  const [brightness, setBrightness] = useState<number>(100); // 100% standard brightness
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 1.0x normal speed
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Certified YouTube Video Mode vs Internal Interactive Player
  const [videoSourceMode, setVideoSourceMode] = useState<'youtube' | 'interactive'>('youtube');

  // Certified Practical Verse Audio Recitation State
  const practicalAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingPracticalVerseIndex, setPlayingPracticalVerseIndex] = useState<number | null>(null);
  const [practicalAudioLoadingIndex, setPracticalAudioLoadingIndex] = useState<number | null>(null);

  // Active Bottom Tab: 'text' | 'audio' | 'pdf' | 'quiz' | 'practice' | 'teacher_analytics' | 'playlist'
  const [activeContentTab, setActiveContentTab] = useState<'text' | 'audio' | 'pdf' | 'quiz' | 'practice' | 'teacher_analytics' | 'playlist'>('text');

  // Filter / Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize Audible Sound with Video Playback
  useEffect(() => {
    speechAudioEngine.setVideoPlaybackSound(
      isVideoPlaying, 
      audioVolume, 
      isAudioMuted, 
      playbackSpeed
    );
    return () => {
      speechAudioEngine.setVideoPlaybackSound(false, 0, true);
    };
  }, [isVideoPlaying, audioVolume, isAudioMuted, playbackSpeed]);

  // Video progress simulation timer
  useEffect(() => {
    let timer: any;
    if (isVideoPlaying) {
      timer = setInterval(() => {
        setVideoProgressPercent((prev) => {
          if (prev >= 100) {
            setIsVideoPlaying(false);
            showToast('اكتملت المحاضرة المرئية! يمكنك الآن أداء الاختبار القصير وتنزيل الملخص.');
            return 100;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVideoPlaying, playbackSpeed]);

  // Handle Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (videoContainerRef.current?.requestFullscreen) {
          await videoContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch {
      // Fallback
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    showToast(`جاري فتح وتنزيل ملف PDF المعتمد لدرس: ${activeLesson.title}...`);
    try {
      generateLessonPdfDocument(activeLesson, activeChapter);
      setTimeout(() => {
        setIsDownloadingPdf(false);
        showToast(`تم تجهيز ملف PDF المعتمد لدرس (${activeLesson.title}) بنجاح!`);
      }, 700);
    } catch (e) {
      setIsDownloadingPdf(false);
      showToast('تم إعداد وثيقة الدرس للطباعة أو الحفظ كملف PDF.');
    }
  };

  useEffect(() => {
    setProgressMap(getLessonProgressMap());
    const handleUpdate = () => {
      setProgressMap(getLessonProgressMap());
      setCurriculumTree(getActiveCurriculum());
    };
    window.addEventListener('rehab_learning_updated', handleUpdate);
    return () => {
      window.removeEventListener('rehab_learning_updated', handleUpdate);
      if (practicalAudioRef.current) {
        practicalAudioRef.current.pause();
        practicalAudioRef.current = null;
      }
      if (lessonAudioElementRef.current) {
        lessonAudioElementRef.current.pause();
        lessonAudioElementRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (practicalAudioRef.current) {
      practicalAudioRef.current.pause();
      practicalAudioRef.current = null;
    }
    setPlayingPracticalVerseIndex(null);
  }, [activeLessonId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3500);
  };

  const handlePlayPracticalAudio = (verse: any, index: number) => {
    if (!verse.audioUrl) {
      showToast('لا يوجد تسجيل صوتي معتمد مرتبط بهذا الموضع حالياً.');
      return;
    }

    if (playingPracticalVerseIndex === index) {
      if (practicalAudioRef.current) {
        practicalAudioRef.current.pause();
      }
      setPlayingPracticalVerseIndex(null);
      return;
    }

    // Stop previous practical audio
    if (practicalAudioRef.current) {
      practicalAudioRef.current.pause();
      practicalAudioRef.current = null;
    }

    setPracticalAudioLoadingIndex(index);
    const audio = new Audio(verse.audioUrl);
    audio.preload = 'none';
    practicalAudioRef.current = audio;

    audio.oncanplay = () => {
      setPracticalAudioLoadingIndex(null);
    };

    audio.onplay = () => {
      setPlayingPracticalVerseIndex(index);
      setPracticalAudioLoadingIndex(null);
    };

    audio.onended = () => {
      setPlayingPracticalVerseIndex(null);
    };

    audio.onerror = () => {
      setPlayingPracticalVerseIndex(null);
      setPracticalAudioLoadingIndex(null);
      showToast('تعذر تشغيل التلاوة المعتمدة عبر الإنترنت. يرجى التحقق من اتصال الشبكة.');
    };

    audio.play().catch(() => {
      setPlayingPracticalVerseIndex(null);
      setPracticalAudioLoadingIndex(null);
    });

    showToast(`استمع للتلاوة المعتمدة: ${verse.sheikhReciter || 'فضيلة الشيخ محمود خليل الحصري (المصحف المعلم)'}`);
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find active chapter and active lesson
  const activeChapter = curriculumTree.find((c) => c.id === selectedChapterId) || curriculumTree[0] || TAJWEED_CURRICULUM[0];
  const activeLesson = activeChapter.lessons.find((l) => l.id === activeLessonId) || activeChapter.lessons[0];

  // All lessons flat array for progress calculation
  const allLessons: TajweedLesson[] = curriculumTree.flatMap((c) => c.lessons);
  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = allLessons.filter((l) => progressMap[l.id]?.completed).length;
  const overallProgressPercentage = Math.round((completedLessonsCount / totalLessonsCount) * 100);

  // Check current lesson unlock state
  const activeLessonUnlock = isLessonUnlocked(activeLesson.id);
  const isCurrentLessonLocked = !activeLessonUnlock.unlocked;

  // Audio Player Handlers for 🔊 صوت
  const handleToggleLessonAudio = () => {
    const audioSrc = activeLesson.audioUrl || 'https://everyayah.com/data/Husary_128kbps/001001.mp3';
    if (!lessonAudioElementRef.current) {
      const audio = new Audio(audioSrc);
      audio.preload = 'none';
      audio.playbackRate = lessonAudioSpeed;
      audio.loop = isLessonAudioLoop;
      audio.ontimeupdate = () => setLessonAudioCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setLessonAudioDuration(audio.duration || 0);
      audio.onended = () => {
        if (!audio.loop) setIsLessonAudioPlaying(false);
      };
      audio.onerror = () => {
        setIsLessonAudioPlaying(false);
        showToast('تعذر تشغيل الملف الصوتي عبر الشبكة.');
      };
      lessonAudioElementRef.current = audio;
    }

    if (isLessonAudioPlaying) {
      lessonAudioElementRef.current.pause();
      setIsLessonAudioPlaying(false);
    } else {
      lessonAudioElementRef.current.play().catch(() => {
        setIsLessonAudioPlaying(false);
      });
      setIsLessonAudioPlaying(true);
      showToast(`جاري تشغيل التسجيل الصوتي المعتمد: ${activeLesson.title}`);
    }
  };

  const handleLessonAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLessonAudioCurrentTime(val);
    if (lessonAudioElementRef.current) {
      lessonAudioElementRef.current.currentTime = val;
    }
  };

  const handleLessonAudioSpeedChange = (speed: number) => {
    setLessonAudioSpeed(speed);
    if (lessonAudioElementRef.current) {
      lessonAudioElementRef.current.playbackRate = speed;
    }
  };

  // Switch lesson with gating check
  const handleSelectLesson = (lesson: TajweedLesson, chapterId: string) => {
    const unlockStatus = isLessonUnlocked(lesson.id);
    if (!unlockStatus.unlocked) {
      showToast(`🔒 هذا الدرس مقفل! يلزم اجتياز اختبار "${unlockStatus.prerequisiteTitle}" بنسبة ${unlockStatus.requiredScore}% أولاً.`);
      return;
    }
    // Stop lesson audio if playing
    if (lessonAudioElementRef.current) {
      lessonAudioElementRef.current.pause();
      lessonAudioElementRef.current = null;
      setIsLessonAudioPlaying(false);
      setLessonAudioCurrentTime(0);
    }
    setSelectedChapterId(chapterId);
    setActiveLessonId(lesson.id);
    setPracticalCompleted(false);
    setIsRecordingPractical(false);
    setVideoProgressPercent(0);
    setIsVideoPlaying(false);
    setActiveContentTab('text');
    // Scroll smoothly to video
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Jump to Next / Previous Lesson
  const currentLessonIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;
  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;

  const handleGoToNext = () => {
    if (nextLesson) {
      const unlockStatus = isLessonUnlocked(nextLesson.id);
      if (!unlockStatus.unlocked) {
        showToast(`🔒 لا يمكن الانتقال للدرس التالي حتى تجتاز اختبار هذا الدرس بنسبة لا تقل عن ${unlockStatus.requiredScore}%.`);
        return;
      }
      const parentChapter = curriculumTree.find((c) => c.lessons.some((l) => l.id === nextLesson.id));
      if (parentChapter) {
        handleSelectLesson(nextLesson, parentChapter.id);
      }
    }
  };

  const handleGoToPrev = () => {
    if (prevLesson) {
      const parentChapter = curriculumTree.find((c) => c.lessons.some((l) => l.id === prevLesson.id));
      if (parentChapter) {
        handleSelectLesson(prevLesson, parentChapter.id);
      }
    }
  };

  // Toggle Practical Recording
  const handleTogglePracticalRecording = () => {
    if (isRecordingPractical) {
      setIsRecordingPractical(false);
      setPracticalCompleted(true);
      showToast('تم تسجيل وإتمام التلاوة التطبيقية للدرس بنجاح!');
    } else {
      setIsRecordingPractical(true);
      showToast('جاري تسجيل تلاوتك للمتطلب التطبيقي... اقرأ بهدوء وترتيل.');
      setTimeout(() => {
        setIsRecordingPractical((curr) => {
          if (curr) {
            setPracticalCompleted(true);
            showToast('اكتمل تسجيل التلاوة التطبيقية بنجاح.');
            return false;
          }
          return curr;
        });
      }, 6000);
    }
  };

  // Complete active lesson
  const handleCompleteActiveLesson = () => {
    markLessonCompleted(activeLesson.id, 100);
    showToast(`مبارك! تم إتمام درس (${activeLesson.title}) بنجاح.`);
    if (nextLesson) {
      setTimeout(() => {
        handleGoToNext();
      }, 800);
    }
  };

  const isCurrentLessonDone = isLessonCompleted(activeLesson.id);

  // Level status calculation for all 7 chapters
  const levelsStatus = getAllLevelsStatus();
  const activeChapterStatus = getLevelStatus(selectedChapterId);

  // Handle Level Selection
  const handleSelectLevel = (level: LevelInfo) => {
    if (!level.isUnlocked) {
      if (!level.isVisible) {
        showToast('🔒 مستوى مخارج الحروف محجوب ومقفل تماماً حتى إتمام واجتياز كافة المستويات الأربعة السابقة بنجاح.');
      } else {
        showToast(`🔒 هذا المستوى مقفل! يلزم إتمام واجتياز كافة دروس "${level.prerequisiteTitle || 'المستوى السابق'}" بنسبة ${level.prerequisiteScore}% أولاً.`);
      }
      return;
    }

    setSelectedChapterId(level.id);
    const targetChap = curriculumTree.find((c) => c.id === level.id);
    if (targetChap && targetChap.lessons.length > 0) {
      const firstAvailable = targetChap.lessons.find((l) => isLessonUnlocked(l.id).unlocked) || targetChap.lessons[0];
      handleSelectLesson(firstAvailable, level.id);
    }
  };

  return (
    <div className={`space-y-6 pb-24 animate-fade-in ${isCinemaMode ? 'bg-[#030d07]' : ''}`} dir="rtl">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Academic Header - دروسي (My Lessons) */}
      {!isCinemaMode && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0d2a1c] via-[#103825] to-[#0b2116] border-2 border-emerald-700/60 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>دروسي • المسار التعليمي المتدرج لعلوم التجويد</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                منهج مقرأة رحاب القرآن المتدرج (دروسي)
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                مسار منهجي متسلسل يبدأ من الأساسيات وينتهي بالتدريبات التطبيقية. كل درس يشتمل على: 🎥 فيديو، 📖 شرح نصي، 📄 وثيقة PDF، 🔊 صوت تعليمي خفيف، ✏️ واختبار فهم ذاتي مشروط للاجتياز.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
              {/* زر وضع توفير البيانات الذكي */}
              <button
                type="button"
                onClick={() => {
                  const next = toggleDataSaver();
                  showToast(next ? '⚡ تم تفعيل وضع توفير البيانات: لن يتم تشغيل الوسائط إلا عند النقر المباشر.' : 'تم إيقاف وضع توفير البيانات.');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold border shadow-md transition-all cursor-pointer ${
                  isDataSaver
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-[#06180f] text-slate-300 border-emerald-700/80 hover:text-white'
                }`}
                title="تبديل وضع توفير البيانات لمنع تحميل الوسائط الثقيلة إلا عند النقر المباشر"
              >
                <WifiOff className={`w-3.5 h-3.5 ${isDataSaver ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>وضع توفير البيانات: {isDataSaver ? 'مفعّل ⚡' : 'معطّل'}</span>
              </button>

              {onNavigateToDifficultWords && (
                <button
                  onClick={onNavigateToDifficultWords}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold border border-amber-300 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>مكتبة الكلمات الصعبة والنطق الصوتي</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Course Overall Progress Bar */}
          <div className="mt-5 pt-4 border-t border-emerald-800/60 bg-[#071910]/70 -mx-5 sm:-mx-6 p-4 sm:p-5">
            <div className="flex items-center justify-between text-xs font-bold mb-2 text-slate-200">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>إجمالي التقدم في دروس المقرأة:</span>
              </span>
              <span className="bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700 text-emerald-300">
                {completedLessonsCount} من {totalLessonsCount} دروس مجتازة ({overallProgressPercentage}%)
              </span>
            </div>
            <div className="w-full h-3 bg-emerald-950/90 rounded-full overflow-hidden border border-emerald-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700 rounded-full"
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </div>

          {/* 7-Level Sequential Track (مسار المستويات السبعة مع الدلالات البصرية) */}
          <div className="pt-4 border-t border-emerald-800/60 bg-[#05140c]/90 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-300">مسار المستويات التعليمية:</span>
                <span className="text-[11px] text-slate-300">نظام فتح مشروط باجتياز الاختبارات</span>
              </div>
              {/* Visual Cues Legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-200 bg-[#0a2316] px-3 py-1 rounded-full border border-emerald-800/80">
                <span className="flex items-center gap-1 font-bold">🟢 <span>مفتوح</span></span>
                <span className="text-emerald-700">•</span>
                <span className="flex items-center gap-1 font-bold">✅ <span>مكتمل</span></span>
                <span className="text-emerald-700">•</span>
                <span className="flex items-center gap-1 font-bold">🔒 <span>مقفل</span></span>
              </div>
            </div>

            {/* 7 Level Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {levelsStatus.map((lvl) => {
                const isSelected = selectedChapterId === lvl.id;
                const isHiddenMakharaj = !lvl.isVisible;

                return (
                  <button
                    key={lvl.id}
                    onClick={() => handleSelectLevel(lvl)}
                    className={`relative p-2.5 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-[#0f3420] border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                        : lvl.status === 'completed'
                        ? 'bg-[#0a2717] border-emerald-600/80 hover:border-emerald-400'
                        : lvl.status === 'open'
                        ? 'bg-[#081e13] border-emerald-500/70 hover:border-amber-400/60'
                        : 'bg-[#040e08]/90 border-slate-800/80 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="text-base select-none" title={lvl.status === 'completed' ? 'مكتمل' : lvl.status === 'open' ? 'مفتوح' : 'مقفل'}>
                        {lvl.visualCue}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        lvl.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : lvl.status === 'open'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        المستوى {lvl.order}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] font-bold text-white line-clamp-1">
                        {isHiddenMakharaj ? 'مخارج الحروف (محجوب)' : lvl.title.replace(/^الباب.*?: /, '')}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{lvl.passedLessons}/{lvl.totalLessons} درس</span>
                        <span>{lvl.percentage}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Strict Locked Barrier if active chapter is locked or hidden */}
      {(!activeChapterStatus.isUnlocked || !activeChapterStatus.isVisible) && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1c0808] via-[#2a0e0e] to-[#120404] border-2 border-red-700/80 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-950/90 border-2 border-red-500 flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg font-black text-white">
              {!activeChapterStatus.isVisible 
                ? 'مستوى مخارج الحروف محجوب ومقفل' 
                : `مستوى (${activeChapterStatus.title}) مقفل حالياً`}
            </h3>
            <p className="text-xs text-red-200/90 leading-relaxed">
              {!activeChapterStatus.isVisible 
                ? 'وفق ضوابط المنهج، لا يُتاح فتح أو استعراض دروس مخارج الحروف إلا بعد إتمام واجتياز كافة المستويات الأربعة السابقة بنجاح (أساسيات التجويد، النون الساكنة والتنوين، الميم الساكنة، المدود).'
                : `لا يمكن الدخول لهذا المستوى حتى يتم إتمام واجتياز كافة دروس "${activeChapterStatus.prerequisiteTitle || 'المستوى السابق'}" بنسبة ${activeChapterStatus.prerequisiteScore}% أولاً.`}
            </p>
          </div>
          <button
            onClick={() => {
              const firstUnlocked = levelsStatus.find((l) => l.isUnlocked);
              if (firstUnlocked) handleSelectLevel(firstUnlocked);
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer"
          >
            العودة إلى المستوى المتاح لمتابعة التعلم 🟢
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CERTIFIED SOURCE BAR & PLAYER MODE SWITCHER                               */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0a2316] via-[#0d2a1b] to-[#071910] border-2 border-emerald-600/70 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-amber-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">المصدر التعليمي المعتمد:</span>
              <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30">
                {activeLesson.certifiedSource || 'برنامج التجويد المصور'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              المحاضر: <strong className="text-white">{activeLesson.videoSpeaker}</strong> • {activeLesson.durationMinutes} دقيقة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#05130b] p-1.5 rounded-xl border border-emerald-800 shrink-0 w-full md:w-auto justify-center">
          <button
            onClick={() => {
              setVideoSourceMode('youtube');
              setIsVideoPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              videoSourceMode === 'youtube'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>شرح الفيديو المعتمد (YouTube)</span>
          </button>

          <button
            onClick={() => setVideoSourceMode('interactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              videoSourceMode === 'interactive'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>المشغل التفاعلي الداخلي</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROMINENT FULL-WIDTH VIDEO THEATER PLAYER OR LOCKED PREREQUISITE NOTICE */}
      {/* ========================================================================= */}
      {isCurrentLessonLocked ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#180f07] via-[#110a05] to-[#0d0703] border-2 border-amber-600 shadow-2xl text-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-900/50">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>هذا الدرس مقفل وفق التدرج التعليمي الإلزامي</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white font-amiri">
              لا يمكن فتح درس ({activeLesson.title}) حالياً
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              وفقاً لضوابط المقرأة، لا يستطيع الطالب الانتقال للدرس التالي حتى يجتاز اختبار الدرس السابق:
              <br />
              <strong className="text-amber-300 font-bold text-sm inline-block my-1">
                « {activeLessonUnlock.prerequisiteTitle || 'الدرس السابق'} »
              </strong>
              <br />
              بنسبة نجاح محددة لا تقل عن <strong className="text-amber-300 font-bold">{activeLessonUnlock.requiredScore || 80}%</strong> المعتمدة من الإدارة.
            </p>
          </div>

          {prevLesson && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleGoToPrev}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-950/60 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>الانتقال لاختبار ({prevLesson.title}) لاجتيازه وفتح هذا الدرس</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
      <div 
        ref={videoContainerRef}
        className={`w-full rounded-3xl overflow-hidden bg-black border-2 border-emerald-600/80 shadow-2xl relative transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'aspect-[16/9] max-h-[580px]'
        }`}
      >
        {videoSourceMode === 'youtube' && activeLesson.youtubeVideoId ? (
          /* Certified YouTube Video Lecture Embed (Lazy Loaded on User Tap) */
          <div className="w-full h-full relative flex flex-col bg-black">
            <LazyVideoPlayer
              videoId={activeLesson.youtubeVideoId}
              title={`${activeChapter.title} • ${activeLesson.title}`}
              speaker={activeLesson.videoSpeaker}
              badgeText="درس مرئي معتمد"
              aspectRatio="w-full h-full"
            />
          </div>
        ) : (
          /* Video Canvas Stage with direct CSS brightness filter */
          <div 
            className="w-full h-full relative flex flex-col justify-between select-none overflow-hidden"
            style={{
              filter: `brightness(${brightness}%)`
            }}
          >
          {/* Visual Background Gradient & Graphic Animation */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#031309] via-[#072415] to-[#020d06] flex flex-col items-center justify-center p-6 text-center space-y-4">
            
            {/* Ambient Background Glow Effect */}
            <div className="absolute w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

            {/* Main Center Play / Pause Button */}
            <button
              onClick={() => {
                speechAudioEngine.unlockAudio();
                setIsVideoPlaying(!isVideoPlaying);
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
              title={isVideoPlaying ? "إيقاف مؤقت" : "تشغيل المحاضرة المرئية"}
            >
              {isVideoPlaying ? (
                <Pause className="w-9 h-9 sm:w-11 sm:h-11 fill-slate-950 text-slate-950" />
              ) : (
                <Play className="w-9 h-9 sm:w-11 sm:h-11 fill-slate-950 text-slate-950 mr-1.5" />
              )}
            </button>

            {/* Video Title and Lecturer Overlays */}
            <div className="space-y-2 max-w-2xl z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black shadow-md backdrop-blur-md">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>المحاضرة المرئية الشاملة • {activeLesson.durationMinutes} دقيقة</span>
              </div>
              
              <h2 className="font-black text-base sm:text-2xl md:text-3xl text-white tracking-wide drop-shadow-md">
                {activeLesson.title}
              </h2>
              
              <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
                فضيلة الشيخ المُحاضر: {activeLesson.videoSpeaker}
              </p>
            </div>

            {/* Animated Audio Equalizer Waveform when Video is Playing */}
            {isVideoPlaying && (
              <div className="flex items-end gap-1.5 h-8 z-10">
                {[30, 75, 95, 55, 80, 40, 88, 65, 35, 92, 50, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-emerald-400 to-amber-400 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.3}px`,
                      animationDelay: `${(i % 5) * 0.15}s`,
                      animationDuration: '0.75s'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Unmuted Audio Notice Badge */}
            {!isAudioMuted && isVideoPlaying && (
              <div className="absolute top-4 right-4 z-20 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>الصوت مفعل ({audioVolume}%)</span>
              </div>
            )}
          </div>

          {/* Top Bar inside Video: Lesson Badge & Cinema Mode */}
          <div className="relative z-20 p-4 flex items-center justify-between text-xs text-white bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/60 border border-emerald-500/50 text-emerald-300 font-bold backdrop-blur-sm">
                {activeChapter.title}
              </span>
              <span className="text-slate-300 hidden sm:inline text-[11px]">
                الدرس {activeLesson.order} من {activeChapter.lessons.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Cinema Mode Toggle */}
              <button
                onClick={() => {
                  setIsCinemaMode(!isCinemaMode);
                  showToast(isCinemaMode ? 'إيقاف نمط السينما.' : 'تفعيل نمط السينما المسرحي.');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer backdrop-blur-sm ${
                  isCinemaMode 
                    ? 'bg-amber-400 text-slate-950 border-amber-300' 
                    : 'bg-black/50 text-slate-300 border-white/20 hover:text-white'
                }`}
                title="نمط السينما المسرحي"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">نمط السينما</span>
              </button>
            </div>
          </div>

          {/* ========================================================== */}
          {/* COMPREHENSIVE BOTTOM VIDEO CONTROLS BAR (All user controls) */}
          {/* ========================================================== */}
          <div className="relative z-20 mt-auto bg-gradient-to-t from-black/95 via-black/85 to-transparent p-3 sm:p-5 space-y-3">
            
            {/* 1. Timeline & Scrubbing Slider */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[11px] sm:text-xs text-slate-200 font-mono font-bold shrink-0">
                {Math.floor((activeLesson.durationMinutes * 60 * (videoProgressPercent / 100)) / 60)}:
                {String(Math.floor((activeLesson.durationMinutes * 60 * (videoProgressPercent / 100)) % 60)).padStart(2, '0')}
              </span>

              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                  setVideoProgressPercent(pct);
                }}
                className="flex-1 h-2.5 bg-slate-700/80 hover:h-3.5 rounded-full overflow-hidden cursor-pointer relative transition-all group/timeline"
              >
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-300 transition-all rounded-full relative"
                  style={{ width: `${videoProgressPercent}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/timeline:opacity-100 transition-opacity" />
                </div>
              </div>

              <span className="text-[11px] sm:text-xs text-slate-400 font-mono shrink-0">
                {activeLesson.durationMinutes}:00
              </span>
            </div>

            {/* 2. Control Buttons Row */}
            <div className="flex items-center justify-between text-xs text-white flex-wrap gap-3">
              
              {/* Left Group: Play/Pause, Next/Prev, Volume Control */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {/* Play / Pause Toggle */}
                <button
                  onClick={() => {
                    speechAudioEngine.unlockAudio();
                    setIsVideoPlaying(!isVideoPlaying);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  {isVideoPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>تشغيل</span>
                    </>
                  )}
                </button>

                {/* Quick Prev / Next Lesson */}
                {prevLesson && (
                  <button
                    onClick={handleGoToPrev}
                    className="hover:text-amber-400 text-slate-300 transition-colors cursor-pointer"
                    title={`الدرس السابق: ${prevLesson.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {nextLesson && (
                  <button
                    onClick={handleGoToNext}
                    className="hover:text-amber-400 text-slate-300 transition-colors cursor-pointer"
                    title={`الدرس التالي: ${nextLesson.title}`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Functional Audio Volume Slider + Mute Button */}
                <div className="flex items-center gap-2 bg-black/50 px-2.5 py-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => {
                      speechAudioEngine.unlockAudio();
                      setIsAudioMuted(!isAudioMuted);
                    }}
                    className="hover:text-amber-400 transition-colors cursor-pointer"
                    title={isAudioMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                  >
                    {isAudioMuted || audioVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : audioVolume < 50 ? (
                      <Volume1 className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                  
                  {/* Volume Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isAudioMuted ? 0 : audioVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAudioVolume(val);
                      if (val > 0 && isAudioMuted) {
                        setIsAudioMuted(false);
                      }
                      speechAudioEngine.unlockAudio();
                    }}
                    className="w-16 sm:w-20 accent-emerald-400 h-1.5 cursor-pointer"
                    title={`مستوى الصوت: ${audioVolume}%`}
                  />
                  <span className="text-[10px] text-slate-300 font-mono w-7">
                    {isAudioMuted ? '0%' : `${audioVolume}%`}
                  </span>
                </div>
              </div>

              {/* Right Group: Brightness, Playback Speed, Fullscreen */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                
                {/* Brightness Control Slider */}
                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-white/10">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <input
                    type="range"
                    min="60"
                    max="140"
                    step="5"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-14 sm:w-16 accent-amber-400 h-1.5 cursor-pointer"
                    title={`مستوى الإضاءة: ${brightness}%`}
                  />
                  <span className="text-[10px] text-slate-300 font-mono">
                    {brightness}%
                  </span>
                </div>

                {/* Playback Speed Selector */}
                <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-xl border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-slate-300 ml-1" />
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        playbackSpeed === spd 
                          ? 'bg-amber-400 text-slate-950 font-black' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-black/50 hover:bg-emerald-800 text-white border border-white/10 transition-colors cursor-pointer"
                  title={isFullscreen ? "تصغير الشاشة" : "تكبير الشاشة ملء العرض"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

            </div>
          </div>

        </div>
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LESSON ACTION BAR & HEADER (Coursera / YouTube Course Mode)            */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0a2016] border-2 border-emerald-700/70 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
              {activeChapter.title}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">
              الدرس {activeLesson.order} من {activeChapter.lessons.length}
            </span>
            {isCurrentLessonDone && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>درس مكتمل</span>
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {activeLesson.title}
          </h2>
          <p className="text-xs text-slate-300">
            المُحاضر: <span className="text-amber-300 font-bold">{activeLesson.videoSpeaker}</span> • المدة: {activeLesson.durationMinutes} دقيقة
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 border border-amber-300 cursor-pointer"
            title="تحميل وثيقة الدرس بصيغة PDF"
          >
            <FileDown className={`w-4 h-4 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingPdf ? 'جاري التجهيز...' : 'تحميل ملخص PDF 📄'}</span>
          </button>

          {/* Mark Completed Button */}
          <button
            onClick={handleCompleteActiveLesson}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isCurrentLessonDone
                ? 'bg-emerald-700/70 text-emerald-200 border-emerald-500'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{isCurrentLessonDone ? 'مكتمل ✅' : 'إتمام الدرس 🎓'}</span>
          </button>

          {/* Next Lesson shortcut */}
          {nextLesson && (
            <button
              onClick={handleGoToNext}
              className="px-3.5 py-2.5 rounded-2xl bg-[#081d12] hover:bg-[#0c2a1b] text-slate-200 border border-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>التالي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LESSON FIVE CORE ELEMENTS NAVIGATION (فيديو، شرح نصي، PDF، صوت، اختبار ذاتي) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b-2 border-emerald-800/80 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveContentTab('text')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeContentTab === 'text'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-[#0a2216]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>📖 الشرح النصي والتأصيلي</span>
        </button>

        <button
          onClick={() => setActiveContentTab('audio')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeContentTab === 'audio'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-[#0a2216]'
          }`}
        >
          <Volume2 className="w-4 h-4 text-amber-300" />
          <span>🔊 الصوت والتسجيل المعتمد</span>
        </button>

        <button
          onClick={() => setActiveContentTab('pdf')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeContentTab === 'pdf'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-[#0a2216]'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>📄 ملخص الدرس (PDF)</span>
        </button>

        <button
          onClick={() => setActiveContentTab('quiz')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeContentTab === 'quiz'
              ? 'bg-amber-400 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-[#0a2216]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>✏️ الاختبار الذاتي (شرط الانتقال)</span>
          {activeLesson.quiz && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono">
              {activeLesson.quiz.length} أسئلة
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveContentTab('playlist')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeContentTab === 'playlist'
              ? 'bg-teal-700 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-[#0a2216]'
          }`}
        >
          <List className="w-4 h-4 text-amber-300" />
          <span>📚 فهرس المنهج المتدرج</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS                                                           */}
      {/* ========================================================================= */}

      {/* TAB 1: 📖 TEXTUAL EXPLANATION (الشرح النصي والتأصيلي) */}
      {activeContentTab === 'text' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Key Points & Principles */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091b12] border-2 border-emerald-800/80 space-y-4">
            <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الخلاصة والقواعد الجوهرية للدرس:</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeLesson.keyPoints.map((point, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#06150e] border border-emerald-900 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-900 text-amber-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Poetic Evidence from Matn (تحفة الأطفال أو الجزرية) */}
          {activeLesson.poeticVerse && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0a2316] via-[#0d2e1e] to-[#071910] border-2 border-amber-500/50 shadow-md space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>الشاهد من متون التجويد المعتمدة (تحفة الأطفال / المقدمة الجزرية):</span>
              </div>
              <p className="font-amiri text-base sm:text-lg text-emerald-100 text-center whitespace-pre-line leading-loose tracking-wider bg-[#06150e]/60 p-4 rounded-2xl border border-amber-500/20">
                {activeLesson.poeticVerse}
              </p>
            </div>
          )}

          {/* Detailed Study Description / Text Content */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091c13] border border-emerald-800/90 space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>الشرح المنهجي والتفصيلي المكتوب:</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed text-justify whitespace-pre-line">
              {activeLesson.textContent || activeLesson.description}
            </p>
          </div>

          {/* Quick jump to quiz button */}
          <div className="p-4 rounded-2xl bg-[#07170f] border border-emerald-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">هل استوعبت الشرح النصي؟</p>
              <p className="text-[11px] text-slate-400">انتقل لأداء الاختبار الذاتي لاجتياز الدرس وفتح الدرس التالي.</p>
            </div>
            <button
              onClick={() => setActiveContentTab('quiz')}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md"
            >
              الانتقال للاختبار الذاتي ✏️
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: 🔊 DEDICATED LESSON AUDIO (الصوت والتسجيل المعتمد) */}
      {activeContentTab === 'audio' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Main Lesson Audio Player Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d281a] via-[#103020] to-[#0a1e14] border-2 border-emerald-500/80 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    التسجيل الصوتي التعليمي المعتمد
                  </h3>
                  <p className="text-xs text-amber-300">
                    بصوت فضيلة الشيخ محمود خليل الحصري (المصحف المعلم)
                  </p>
                </div>
              </div>

              {/* Loop and Speed Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLessonAudioLoop(!isLessonAudioLoop)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                    isLessonAudioLoop
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                      : 'bg-[#06150e] text-slate-300 border-emerald-800 hover:text-white'
                  }`}
                  title="تكرار الصوت للضبط والترديد"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isLessonAudioLoop ? 'التكرار مفعل' : 'تكرار'}</span>
                </button>

                <div className="flex items-center gap-1 bg-[#06150e] p-1 rounded-xl border border-emerald-800 text-[11px]">
                  {[0.75, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleLessonAudioSpeedChange(speed)}
                      className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                        lessonAudioSpeed === speed
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Progress Scrubber */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={lessonAudioDuration || 100}
                value={lessonAudioCurrentTime}
                onChange={handleLessonAudioSeek}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-emerald-950 rounded-lg"
              />
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                <span>{formatAudioTime(lessonAudioCurrentTime)}</span>
                <span>{formatAudioTime(lessonAudioDuration)}</span>
              </div>
            </div>

            {/* Play/Pause Button */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleToggleLessonAudio}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 border border-amber-300 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {isLessonAudioPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>إيقاف مؤقت للتسجيل</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>تشغيل التسجيل الصوتي للدرس</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Practical Verses Recitation Clips */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#123020] via-[#0d2518] to-[#091d13] border-2 border-emerald-500/70 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base text-white">
                  نماذج التلاوة التطبيقية والأمثلة القرآنية
                </h3>
              </div>
              <span className="text-xs bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-full">
                استماع وتطبيق
              </span>
            </div>

            {/* Verses to Recite */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {activeLesson.practicalRequirement.versesToRecite.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#06160e] border border-emerald-800/80 space-y-2.5 shadow-inner flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-400">
                      <span className="font-bold">الموضع {idx + 1}</span>
                      <span className="text-slate-400 text-[11px]">{item.surah}</span>
                    </div>
                    <p className="font-quran text-lg text-emerald-100 text-center py-2 font-bold leading-relaxed">
                      ﴿ {item.text} ﴾
                    </p>
                    <div className="text-xs text-slate-300 border-t border-emerald-950 pt-2 leading-normal">
                      <span className="text-amber-300 font-bold block mb-0.5">الضابط المطلوب:</span>
                      <span>{item.ruleToApply}</span>
                    </div>
                  </div>

                  {/* Certified Recitation Audio Player Button */}
                  {item.audioUrl && (
                    <div className="pt-2 border-t border-emerald-900/80 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-emerald-300 flex items-center gap-1 min-w-0">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{item.sheikhReciter || 'الشيخ الحصري (المصحف المعلم)'}</span>
                      </div>
                      <button
                        onClick={() => handlePlayPracticalAudio(item, idx)}
                        disabled={practicalAudioLoadingIndex === idx}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${
                          playingPracticalVerseIndex === idx
                            ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
                            : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-600'
                        }`}
                        title="استمع لتلاوة الموضع بصوت الشيخ محمود خليل الحصري (المصحف المعلم)"
                      >
                        {practicalAudioLoadingIndex === idx ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>جارٍ التحميل...</span>
                          </>
                        ) : playingPracticalVerseIndex === idx ? (
                          <>
                            <Pause className="w-3 h-3 fill-current" />
                            <span>إيقاف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>استماع معتمد</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recording Controls */}
            <div className="p-4 rounded-2xl bg-[#071910] border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="space-y-0.5 text-center sm:text-right">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  تسجيل تلاوتك وتوثيق المتطلب الصوتي
                </h4>
                <p className="text-[11px] text-emerald-200/80">
                  اقرأ الآيات بأحكام التجويد الموضحة ليتم تقييمها واعتماد الدرس.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePracticalRecording}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    isRecordingPractical
                      ? 'bg-red-600 text-white border-red-400 animate-pulse'
                      : practicalCompleted
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-600 shadow-md'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecordingPractical 
                      ? 'جاري التسجيل الصوتي...' 
                      : practicalCompleted 
                      ? 'تم تسجيل التلاوة بنجاح ✅' 
                      : 'سجل تلاوتك للمتطلب'}
                  </span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: 📄 PDF SUMMARY & DOWNLOAD (ملخص الدرس PDF) */}
      {activeContentTab === 'pdf' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Prominent PDF Download Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#0d281a] via-[#103020] to-[#0a1e14] border-2 border-[#C5A059] shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A059] to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
                <FileText className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold">
                    وثيقة علمية معتمدة لهوية 2026 الرسمية
                  </span>
                  <span className="text-[11px] text-emerald-300 font-medium">جاهزة للطباعة والتنزيل A4 (RTL)</span>
                </div>
                <h3 className="font-black text-base sm:text-lg text-white font-amiri">
                  ملخص الدرس وقواعده التجويدية المعتمدة بصيغة PDF
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed max-w-xl">
                  وثيقة شاملة بتنسيق رسمي لمقرأة رحاب القرآن تضم الشرح العلمي، الشواهد المنظومة من متون التجويد، جدول التطبيقات القرآنية، الختم الإلكتروني، وبيانات التواصل المعتمدة.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 border border-amber-300 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة ملخص الدرس A4</span>
              </button>

              {/* تلميح حفظ كـ PDF واضح للمستخدم */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold font-sans">
                <span className="text-sm">💡</span>
                <span>يرجى اختيار <strong>(حفظ كـ PDF)</strong> من نافذة الطباعة</span>
              </div>

              {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    showToast('جاري تصيير درس PDF عبر jsPDF...');
                    await downloadLessonDirectPdf(activeLesson, activeChapter, undefined, (status) => showToast(status));
                    showToast('تم تنزيل ملف PDF بنجاح ✓');
                  } catch (e) {
                    console.error('Direct PDF error:', e);
                    showToast('جاري فتح الطباعة البديلة...');
                    printLessonPdf(activeLesson, activeChapter);
                  }
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#046A38] hover:bg-[#068547] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer border border-[#C5A059]/50"
                title="تنزيل ملخص الدرس مباشرة كملف PDF لجهازك دون نافذة الطباعة"
              >
                <FileDown className="w-4 h-4 text-[#C5A059]" />
                <span>تنزيل PDF مباشر (jsPDF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  printLessonPdf(activeLesson, activeChapter);
                  showToast('جاري فتح أمر الطباعة...');
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                title="طباعة ملخص الدرس من نافذة المتصفح"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المتصفح</span>
              </button>

              {activeLesson.pdfUrl && activeLesson.pdfUrl.startsWith('http') && (
                <a
                  href={activeLesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="تحميل الملخص الخارجي المرفق"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>المرفق الخارجي</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick PDF Highlights Table */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#081c12] border border-emerald-800/80 space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>محتويات وثيقة الملخص:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900">
                <span className="text-amber-300 font-bold block mb-1">١. التأصيل النظري</span>
                <span>تعريف الحكم، حروفه، وعلته الصوتية مع الأمثلة.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900">
                <span className="text-amber-300 font-bold block mb-1">٢. الشواهد المنظومة</span>
                <span>أبيات تحفة الأطفال والجزرية الخاصة بالباب.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#06150e] border border-emerald-900">
                <span className="text-amber-300 font-bold block mb-1">٣. جدول التطبيقات</span>
                <span>مواضع قرآنية محددة مع النطق الصوتي الصحيح.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: ✏️ INTERACTIVE QUIZ (الاختبار الذاتي وشرط الانتقال) */}
      {activeContentTab === 'quiz' && (
        <div className="animate-fade-in">
          <InteractiveLessonQuiz
            lesson={activeLesson}
            chapterTitle={activeChapter.title}
            onLessonComplete={() => {
              markLessonCompleted(activeLesson.id, 100);
            }}
            onNavigateToNextLesson={nextLesson ? handleGoToNext : undefined}
          />
        </div>
      )}

      {/* TAB 5: 📚 PLAYLIST & CURRICULUM BROWSER (فهرس المنهج المتدرج) */}
      {activeContentTab === 'playlist' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="p-4 rounded-2xl bg-[#091b12] border border-emerald-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>فهرس المنهج المتدرج ({totalLessonsCount} درس عبر ٧ أبواب رئيسية)</span>
            </h3>
            <span className="text-xs text-emerald-300">
              {completedLessonsCount} دروس مجتازة بنجاح
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curriculumTree.map((chapter) => {
              const isChapSelected = selectedChapterId === chapter.id;
              const chapCompleted = chapter.lessons.filter((l) => progressMap[l.id]?.completed).length;
              const chapStatus = getLevelStatus(chapter.id);
              const isHiddenMakharaj = !chapStatus.isVisible;

              if (isHiddenMakharaj) {
                return (
                  <div 
                    key={chapter.id}
                    className="p-5 rounded-2xl border border-red-900/50 bg-[#0c0404]/90 flex flex-col items-center justify-center text-center space-y-2 opacity-80"
                  >
                    <span className="text-2xl">🔒</span>
                    <h4 className="font-bold text-white text-xs sm:text-sm">
                      المستوى {chapter.order}: مخارج الحروف (محجوب ومقفل)
                    </h4>
                    <p className="text-[11px] text-red-200/80 max-w-xs leading-relaxed">
                      وفق اللائحة، لا يتاح فتح هذا المستوى أو استعراض دروسه إلا بعد إتمام واجتياز كافة المستويات الأربعة السابقة بنجاح (أساسيات التجويد، النون الساكنة والتنوين، الميم الساكنة، والمدود).
                    </p>
                  </div>
                );
              }

              return (
                <div 
                  key={chapter.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isChapSelected 
                      ? 'bg-[#0b2619] border-emerald-500 shadow-md ring-1 ring-emerald-500/50' 
                      : 'bg-[#07180f] border-emerald-900/80 hover:border-emerald-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-emerald-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm select-none">{chapStatus.visualCue}</span>
                      <span className="w-6 h-6 rounded-full bg-emerald-900 text-amber-300 text-xs font-black flex items-center justify-center">
                        {chapter.order}
                      </span>
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        {chapter.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        chapStatus.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : chapStatus.status === 'open'
                          ? 'bg-amber-950 text-amber-300 border border-amber-700'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {chapStatus.status === 'completed' ? 'مكتمل ✅' : chapStatus.status === 'open' ? 'مفتوح 🟢' : 'مقفل 🔒'}
                      </span>
                      <span className="text-[11px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                        {chapCompleted}/{chapter.lessons.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {chapter.lessons.map((l) => {
                      const isActive = activeLessonId === l.id;
                      const lessonProg = progressMap[l.id];
                      const isDone = !!lessonProg?.passed;
                      const unlockState = isLessonUnlocked(l.id);
                      const isLocked = !unlockState.unlocked;

                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            if (isLocked) {
                              showToast(`🔒 هذا الدرس مقفل! يتطلب اجتياز اختبار "${unlockState.prerequisiteTitle}" بنسبة ${unlockState.requiredScore}% أولاً.`);
                              return;
                            }
                            handleSelectLesson(l, chapter.id);
                            setActiveContentTab('text');
                          }}
                          className={`w-full p-2.5 rounded-xl text-right text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                              : isDone
                              ? 'bg-[#0d281a] text-emerald-200 hover:bg-[#113523]'
                              : isLocked
                              ? 'bg-[#040c07] text-slate-500 hover:bg-[#06120b] opacity-80'
                              : 'bg-[#05130b] text-slate-300 hover:bg-[#092215]'
                          }`}
                        >
                          <div className="flex items-center gap-2 line-clamp-1">
                            {isLocked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
                            ) : isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="line-clamp-1">{l.order}. {l.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isLocked && (
                              <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-800/80 px-1.5 py-0.2 rounded-full">
                                مقفل
                              </span>
                            )}
                            {isDone && lessonProg && (
                              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                                {lessonProg.percentage}%
                              </span>
                            )}
                            <span className="text-[10px] opacity-70">{l.durationMinutes} د</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* نافذة معاينة وطباعة وثيقة PDF لملخص الدرس A4 */}
      {isPdfModalOpen && (
        <TajweedPdfPreviewModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          lesson={activeLesson}
          chapter={activeChapter}
        />
      )}

    </div>
  );
};
