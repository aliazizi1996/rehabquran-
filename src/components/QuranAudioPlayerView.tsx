import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Search, BookOpen, 
  Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Download, 
  Share2, ArrowRight, Heart, Award, Headphones, Shield, Disc3, 
  Repeat, ListMusic, Music, Radio, Check, Sun, Moon
} from 'lucide-react';
import { ALL_114_SURAHS, TEACHER_RECITERS, QuranSurahInfo, TeacherReciter } from '../data/quranAudioData';
import { OfficialLogo } from './OfficialLogo';

interface QuranAudioPlayerViewProps {
  onBack?: () => void;
  initialSurahNumber?: number;
}

export const QuranAudioPlayerView: React.FC<QuranAudioPlayerViewProps> = ({
  onBack,
  initialSurahNumber = 1
}) => {
  // Active selection
  const [selectedReciterId, setSelectedReciterId] = useState<string>('husary_muallim');
  const [selectedSurah, setSelectedSurah] = useState<QuranSurahInfo>(() => {
    return ALL_114_SURAHS.find((s) => s.number === initialSurahNumber) || ALL_114_SURAHS[0];
  });

  // Filter / Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState<number | 'all'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'مكية' | 'مدنية'>('all');
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<'all' | 'muallim' | 'mujawwad' | 'murattal'>('all');

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isAutoPlayNext, setIsAutoPlayNext] = useState<boolean>(true);
  const [isRepeatCurrent, setIsRepeatCurrent] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [useBackupSource, setUseBackupSource] = useState<boolean>(false);

  // وضع القراءة (نهاري / سيبيا / ليلي) لتقليل إجهاد العين أثناء الاستماع والمراجعة الطويلة
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rihab_quran_reading_mode');
      if (saved === 'dark' || saved === 'sepia' || saved === 'light') return saved;
    }
    return 'light';
  });

  const handleSetReadingMode = (mode: 'light' | 'sepia' | 'dark') => {
    setReadingMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rihab_quran_reading_mode', mode);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('quran_reading_mode_changed', { detail: mode }));
    }
  };

  useEffect(() => {
    const handleSync = (e?: Event) => {
      if (typeof window !== 'undefined') {
        const customMode = (e as CustomEvent)?.detail;
        if (customMode === 'dark' || customMode === 'sepia' || customMode === 'light') {
          setReadingMode(customMode);
          return;
        }
        const saved = localStorage.getItem('rihab_quran_reading_mode');
        if (saved === 'dark' || saved === 'sepia' || saved === 'light') {
          setReadingMode(saved);
        }
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('quran_reading_mode_changed', handleSync as EventListener);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('quran_reading_mode_changed', handleSync as EventListener);
    };
  }, []);

  const theme = {
    light: {
      wrapper: 'text-[#2C3531]',
      card: 'bg-white border-slate-200/90 text-slate-900 shadow-xs',
      cardSubtle: 'bg-[#F9F6F0] border-[#C5A059]/40 text-slate-800',
      pedagogicalItem: 'bg-white border-slate-200 text-slate-700',
      title: 'text-slate-900',
      subText: 'text-slate-500',
      accentTitle: 'text-[#046A38]',
      border: 'border-slate-100',
      filterActive: 'bg-[#046A38] text-white shadow-xs',
      filterInactive: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      filterPill: 'bg-slate-100 text-slate-600',
      input: 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#046A38] focus:ring-[#046A38]',
      surahDefault: 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 text-slate-900',
      surahActive: 'bg-emerald-50 border-[#046A38] shadow-md ring-2 ring-emerald-500/20 text-[#046A38]',
      surahNumDefault: 'bg-slate-100 text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-800',
      surahNumActive: 'bg-[#046A38] text-white',
      reciterDefault: 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-700',
      reciterActive: 'bg-emerald-50/90 border-[#046A38] shadow-md ring-2 ring-emerald-500/20 text-[#046A38]',
      reciterTitle: 'text-slate-900',
      reciterDesc: 'text-slate-500',
      divider: 'border-slate-200/60'
    },
    sepia: {
      wrapper: 'text-[#3B2D1D]',
      card: 'bg-[#FAF4E6] border-[#D2B98B] text-[#3B2D1D] shadow-xs',
      cardSubtle: 'bg-[#EDE3CB] border-[#D2B98B] text-[#3B2D1D]',
      pedagogicalItem: 'bg-[#FAF4E6] border-[#D2B98B] text-[#3B2D1D]',
      title: 'text-[#2B1F11]',
      subText: 'text-[#846E56]',
      accentTitle: 'text-[#7A5416]',
      border: 'border-[#D2B98B]/50',
      filterActive: 'bg-[#7A5416] text-[#FAF4E6] shadow-xs',
      filterInactive: 'bg-[#EDE3CB] hover:bg-[#E2D4B6] text-[#553C1B]',
      filterPill: 'bg-[#EDE3CB] text-[#553C1B]',
      input: 'bg-[#EDE3CB] border-[#D2B98B] text-[#3B2D1D] placeholder-[#8A755D] focus:border-[#7A5416] focus:ring-[#7A5416]',
      surahDefault: 'bg-[#FAF4E6] hover:bg-[#F2E6CD] border-[#D2B98B] hover:border-[#A87B28] text-[#2B1F11]',
      surahActive: 'bg-[#E5D7B7] border-[#7A5416] shadow-md ring-2 ring-amber-700/20 text-[#553C1B]',
      surahNumDefault: 'bg-[#EDE3CB] text-[#553C1B] group-hover:bg-[#E2D4B6] group-hover:text-[#7A5416]',
      surahNumActive: 'bg-[#7A5416] text-[#FAF4E6]',
      reciterDefault: 'bg-[#EDE3CB]/80 hover:bg-[#E2D4B6] border-[#D2B98B] text-[#3B2D1D]',
      reciterActive: 'bg-[#E5D7B7] border-[#7A5416] shadow-md ring-2 ring-amber-700/20 text-[#553C1B]',
      reciterTitle: 'text-[#2B1F11]',
      reciterDesc: 'text-[#846E56]',
      divider: 'border-[#D2B98B]/60'
    },
    dark: {
      wrapper: 'text-[#EDE6DA]',
      card: 'bg-[#161F1A] border-[#C5A059]/35 text-[#EDE6DA] shadow-md',
      cardSubtle: 'bg-[#101713] border-emerald-900/60 text-[#D5DFD8]',
      pedagogicalItem: 'bg-[#1C2721] border-emerald-900/70 text-[#EDE6DA]',
      title: 'text-[#F9F5EC]',
      subText: 'text-[#8EA094]',
      accentTitle: 'text-[#E0B967]',
      border: 'border-emerald-900/60',
      filterActive: 'bg-[#046A38] text-white shadow-xs',
      filterInactive: 'bg-[#1C2721] hover:bg-[#25332B] text-[#A6B7AC]',
      filterPill: 'bg-[#1C2721] text-[#A6B7AC]',
      input: 'bg-[#1C2721] border-emerald-900/70 text-[#EDE6DA] placeholder-[#7D9084] focus:border-[#34D399] focus:ring-[#34D399]',
      surahDefault: 'bg-[#161F1A] hover:bg-[#1C2721] border-emerald-900/70 hover:border-[#C5A059]/60 text-[#EDE6DA]',
      surahActive: 'bg-[#1C2721] border-[#C5A059] shadow-md ring-2 ring-amber-400/20 text-[#E0B967]',
      surahNumDefault: 'bg-[#101713] text-[#A6B7AC] group-hover:bg-[#1C2721] group-hover:text-[#EDE6DA]',
      surahNumActive: 'bg-[#046A38] text-white',
      reciterDefault: 'bg-[#161F1A]/80 hover:bg-[#1C2721] border-emerald-900/60 text-[#D5DFD8]',
      reciterActive: 'bg-[#1C2721] border-[#C5A059] shadow-md ring-2 ring-emerald-500/20 text-[#E0B967]',
      reciterTitle: 'text-[#F9F5EC]',
      reciterDesc: 'text-[#8EA094]',
      divider: 'border-emerald-900/70'
    }
  }[readingMode];

  // Audio Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentReciter = TEACHER_RECITERS.find((r) => r.id === selectedReciterId) || TEACHER_RECITERS[0];

  // Reset fallback and position when surah or reciter changes
  useEffect(() => {
    setUseBackupSource(false);
    setAudioError(null);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedSurah.number, selectedReciterId]);

  const audioSourceUrl = useBackupSource && currentReciter.getBackupAudioUrl
    ? currentReciter.getBackupAudioUrl(selectedSurah.number)
    : currentReciter.getSurahAudioUrl(selectedSurah.number);

  // Set up audio when source changes or playback triggered (prevents network preloading when paused)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      setIsLoadingAudio(true);
      setAudioError(null);

      if (audio.src !== audioSourceUrl) {
        audio.src = audioSourceUrl;
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoadingAudio(false);
            setAudioError(null);
          })
          .catch((err) => {
            if (err?.name === 'AbortError') return;
            console.warn('Audio auto-play or source issue:', err?.message || err);
            if (!useBackupSource && currentReciter.getBackupAudioUrl) {
              setUseBackupSource(true);
            } else {
              setIsLoadingAudio(false);
              setIsPlaying(false);
              setAudioError('تعذر تشغيل هذا التسجيل مؤقتاً، يرجى اختيار قارئ آخر أو التحقق من الاتصال.');
            }
          });
      }
    } else {
      setIsLoadingAudio(false);
    }
  }, [audioSourceUrl, isPlaying]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoadingAudio(true);
      setAudioError(null);

      if (!audio.src || !audio.src.includes('.mp3')) {
        audio.src = audioSourceUrl;
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
            setAudioError(null);
          })
          .catch((err) => {
            if (err?.name === 'AbortError') return;
            console.warn('Audio play request error:', err?.message || err);
            if (!useBackupSource && currentReciter.getBackupAudioUrl) {
              setUseBackupSource(true);
              setIsPlaying(true);
            } else {
              setIsLoadingAudio(false);
              setIsPlaying(false);
              setAudioError('تعذر تشغيل التسجيل الصوتي مؤقتاً، يرجى التحقق من اتصال الإنترنت أو اختيار قارئ بديل.');
            }
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration || isNaN(duration)) {
        setDuration(audioRef.current.duration || 0);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoadingAudio(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleSkipTime = (seconds: number) => {
    if (audioRef.current) {
      const nextTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration || 3600);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleAudioEnded = () => {
    if (isRepeatCurrent) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    if (isAutoPlayNext) {
      handleNextSurah();
    } else {
      setIsPlaying(false);
    }
  };

  const handleNextSurah = () => {
    const currentIndex = ALL_114_SURAHS.findIndex((s) => s.number === selectedSurah.number);
    if (currentIndex < ALL_114_SURAHS.length - 1) {
      setSelectedSurah(ALL_114_SURAHS[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePrevSurah = () => {
    const currentIndex = ALL_114_SURAHS.findIndex((s) => s.number === selectedSurah.number);
    if (currentIndex > 0) {
      setSelectedSurah(ALL_114_SURAHS[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

  const handleSelectSurah = (surah: QuranSurahInfo) => {
    setSelectedSurah(surah);
    setIsPlaying(true);
  };

  const handleCopyShareLink = () => {
    const shareText = `استمع إلى المصحف المعلم والمجود (${selectedSurah.name}) بصوت ${currentReciter.name} عبر مقرأة رحاب القرآن الإلكترونية: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter surahs
  const filteredSurahs = ALL_114_SURAHS.filter((surah) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = surah.name.includes(q);
      const matchNum = surah.number.toString().includes(q);
      const matchEng = surah.englishName.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchEng) return false;
    }
    if (selectedJuzFilter !== 'all' && surah.startJuz !== selectedJuzFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && surah.type !== selectedTypeFilter) {
      return false;
    }
    return true;
  });

  const filteredReciters = TEACHER_RECITERS.filter((reciter) => {
    if (selectedStyleFilter === 'all') return true;
    return reciter.style === selectedStyleFilter;
  });

  return (
    <div className={`space-y-6 pb-20 select-none font-kufi transition-colors duration-300 ${theme.wrapper}`} dir="rtl">
      {/* Hidden Audio Tag (no preload until user clicks play) */}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => {
          setIsLoadingAudio(false);
          setAudioError(null);
        }}
        onWaiting={() => setIsLoadingAudio(true)}
        onPlaying={() => {
          setIsLoadingAudio(false);
          setIsPlaying(true);
          setAudioError(null);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={handleAudioEnded}
        onError={() => {
          if (!useBackupSource && currentReciter.getBackupAudioUrl) {
            setUseBackupSource(true);
          } else {
            setIsLoadingAudio(false);
            setIsPlaying(false);
            setAudioError('تعذر جلب ملف السورة من الخادم الصوتي، يرجى اختيار قارئ آخر أو المحاولة ثانية.');
          }
        }}
      />

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#064e29] to-[#046A38] rounded-3xl p-5 sm:p-7 text-white shadow-xl border-2 border-[#C5A059]/40 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#C5A059]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-2xl bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40">
                    <Headphones className="w-5 h-5 animate-pulse" />
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-amber-400/30">
                    المكتبة الصوتية المعتمدة لتعليم القرآن وتجويده
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black font-amiri text-white tracking-wide">
                  المصحف المعلم والمجود للاستماع والترديد
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              استمع إلى السور كاملة برواية حفص عن عاصم، بأصوات كبار أئمة الإقراء (المصحف المعلم لترديد الآيات، والمصحف المجود لإتقان الأحكام والأنغام القرآنية وضبط المقامات ومخارج الحروف).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end flex-wrap">
            {/* Reading Mode Switcher (نهاري / سيبيا / ليلي) */}
            <div className="flex items-center p-1 rounded-2xl bg-black/30 backdrop-blur-xs border border-white/20 text-xs font-bold transition-colors">
              <button
                type="button"
                onClick={() => handleSetReadingMode('light')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'light' ? 'bg-white text-[#046A38] shadow-xs font-black' : 'text-emerald-100 hover:text-white'
                }`}
                title="الوضع النهاري المعتمد"
              >
                <Sun className={`w-3.5 h-3.5 ${readingMode === 'light' ? 'text-amber-500' : 'text-amber-300'}`} />
                <span className="hidden sm:inline">نهاري</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReadingMode('sepia')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'sepia' ? 'bg-[#FAF4E6] text-[#7A5416] shadow-xs font-black' : 'text-emerald-100 hover:text-white'
                }`}
                title="وضع السيبيا (ورق المصحف الدافئ لتقليل إجهاد العين)"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#E0B967]" />
                <span>سيبيا</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReadingMode('dark')}
                className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'dark' ? 'bg-[#046A38] text-white shadow-xs font-black' : 'text-emerald-100 hover:text-white'
                }`}
                title="الوضع الليلي (قراءة مريحة معتمة لتقليل إجهاد العين أثناء المراجعة الطويلة)"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>ليلي</span>
              </button>
            </div>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2 rounded-2xl bg-[#C5A059] hover:bg-[#b08e4d] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-900" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة السورة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reciter Selector Bar (كبار القراء والمصاحف) */}
      <div className={`rounded-3xl p-5 border shadow-sm space-y-3 transition-colors duration-300 ${theme.card}`}>
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 ${theme.border}`}>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#046A38]" />
            <h2 className={`text-sm font-bold ${theme.title}`}>
              اختر المصحف والقارئ المعلم:
            </h2>
          </div>

          <div className={`flex items-center gap-1.5 p-1 rounded-2xl text-xs flex-wrap ${theme.filterPill}`}>
            <button
              type="button"
              onClick={() => setSelectedStyleFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStyleFilter === 'all' ? theme.filterActive : theme.filterInactive
              }`}
            >
              الكل ({TEACHER_RECITERS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStyleFilter('muallim')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStyleFilter === 'muallim' ? theme.filterActive : theme.filterInactive
              }`}
            >
              المصحف المعلم (ترديد)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStyleFilter('mujawwad')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStyleFilter === 'mujawwad' ? theme.filterActive : theme.filterInactive
              }`}
            >
              المصحف المجود (إتقان)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStyleFilter('murattal')}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedStyleFilter === 'murattal' ? theme.filterActive : theme.filterInactive
              }`}
            >
              المصحف المرتل (ضبط)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredReciters.map((reciter) => {
            const isSelected = selectedReciterId === reciter.id;
            return (
              <button
                key={reciter.id}
                type="button"
                onClick={() => setSelectedReciterId(reciter.id)}
                className={`p-3.5 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between border-2 ${
                  isSelected
                    ? theme.reciterActive
                    : theme.reciterDefault
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`font-bold text-xs sm:text-sm line-clamp-1 font-amiri ${theme.reciterTitle}`}>
                      {reciter.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        reciter.style === 'muallim'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : reciter.style === 'mujawwad'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-teal-100 text-teal-900 border border-teal-300'
                      }`}
                    >
                      {reciter.styleLabel}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug line-clamp-2 ${theme.reciterDesc}`}>
                    {reciter.description}
                  </p>
                </div>

                <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[11px] font-semibold text-[#046A38] ${theme.divider}`}>
                  <span>{isSelected ? '✓ المصحف المختار للتشغيل' : 'اختر هذا المصحف'}</span>
                  <Disc3 className={`w-3.5 h-3.5 ${isSelected && isPlaying ? 'animate-spin text-[#046A38]' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Active Player Deck (المشغل الصوتي الرئيسي) */}
      <div className="bg-gradient-to-b from-[#072014] to-[#04140c] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#C5A059]/60 shadow-2xl relative overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Currently Playing Information */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right border-b border-emerald-800/80 pb-5">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#046A38] to-[#01351b] border-2 border-[#C5A059] flex items-center justify-center text-white shadow-lg shrink-0">
                <Disc3 className={`w-9 h-9 text-[#C5A059] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-mono">
                  {selectedSurah.number}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
                    سورة {selectedSurah.name}
                  </h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700">
                    {selectedSurah.type}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-amber-300 font-semibold mt-1">
                  بصوت: {currentReciter.name} • ({currentReciter.styleLabel})
                </p>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  عدد الآيات: {selectedSurah.totalAyahs} آية • بداية السورة: الجزء {selectedSurah.startJuz}
                </p>
              </div>
            </div>

            {/* Quick Actions (السابق / التالي) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevSurah}
                disabled={selectedSurah.number === 1}
                className="p-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                title="السورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-[#C5A059] hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل السورة'}
              >
                {isLoadingAudio ? (
                  <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-7 h-7 fill-slate-950" />
                ) : (
                  <Play className="w-7 h-7 fill-slate-950 mr-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNextSurah}
                disabled={selectedSurah.number === 114}
                className="p-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 hover:text-white disabled:opacity-40 transition-all cursor-pointer"
                title="السورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Timeline Slider */}
          <div className="space-y-2">
            <div className="relative group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2.5 bg-emerald-950 rounded-lg appearance-none cursor-pointer accent-[#C5A059] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[11px] font-sans text-slate-400">
                {isLoadingAudio ? 'جارٍ تحميل تلاوة السورة...' : isPlaying ? 'التشغيل جارٍ' : 'متوقف'}
              </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Bar: Skip 10s, Repeat, Speed, Volume */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {/* Left Controls: Skips & Mode */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSkipTime(-10)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-xs text-slate-200 flex items-center gap-1 cursor-pointer"
                title="رجوع 10 ثوانٍ"
              >
                <span>-10 ث</span>
              </button>

              <button
                type="button"
                onClick={() => handleSkipTime(10)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-xs text-slate-200 flex items-center gap-1 cursor-pointer"
                title="تقديم 10 ثوانٍ"
              >
                <span>+10 ث</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRepeatCurrent(!isRepeatCurrent)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRepeatCurrent
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-emerald-950/80 text-emerald-200 border-emerald-800 hover:bg-emerald-900'
                }`}
                title="تكرار السورة الحالية باستمرار للتدريب والتثبيت"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>تكرار السورة</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoPlayNext(!isAutoPlayNext)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAutoPlayNext
                    ? 'bg-[#046A38] text-white border-emerald-500 shadow-xs'
                    : 'bg-emerald-950/80 text-slate-400 border-emerald-800 hover:bg-emerald-900'
                }`}
                title="تشغيل السورة التالية تلقائياً عند انتهاء الحالية"
              >
                <span>تشغيل متتالي</span>
              </button>
            </div>

            {/* Right Controls: Playback Speed & Volume */}
            <div className="flex items-center gap-3">
              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-emerald-950/90 p-1 rounded-xl border border-emerald-800 text-[11px] font-bold">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      playbackRate === rate ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 bg-emerald-950/90 px-2.5 py-1.5 rounded-xl border border-emerald-800">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-emerald-300 hover:text-white cursor-pointer"
                  title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Direct Download Button */}
              <a
                href={audioSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={`سورة_${selectedSurah.name}.mp3`}
                className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="تحميل الملف الصوتي للسورة MP3"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Feedback or Error Notification */}
          {audioError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 flex items-center justify-between gap-2 animate-shake">
              <span>{audioError}</span>
              <button
                type="button"
                onClick={() => {
                  setAudioError(null);
                  handleTogglePlay();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold cursor-pointer shrink-0"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Surahs Catalog (فهرس السور الـ 114 كاملة مع أدوات البحث والفرز) */}
      <div className={`rounded-3xl p-5 sm:p-6 border shadow-sm space-y-4 transition-colors duration-300 ${theme.card}`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#046A38]" />
            <div>
              <h2 className={`text-base font-bold font-amiri ${theme.title}`}>
                فهرس سور القرآن الكريم (114 سورة كاملة)
              </h2>
              <span className={`text-xs ${theme.subText}`}>
                اختر أي سورة للبدء بالاستماع والترديد فوراً
              </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم السورة أو رقمها (مثال: البقرة، الكهف، 67)..."
              className={`w-full pr-10 pl-4 py-2 rounded-2xl border text-xs focus:outline-none transition-colors ${theme.input}`}
            />
          </div>
        </div>

        {/* Quick Filter Badges (النوع / الأجزاء) */}
        <div className={`flex flex-wrap items-center gap-2 pt-1 border-t text-xs ${theme.border}`}>
          <span className={`font-medium ${theme.subText}`}>تصنيف السور:</span>

          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'all'
                ? theme.filterActive
                : theme.filterInactive
            }`}
          >
            جميع السور ({ALL_114_SURAHS.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedTypeFilter('مكية')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'مكية'
                ? theme.filterActive
                : theme.filterInactive
            }`}
          >
            مكية (86 سورة)
          </button>

          <button
            type="button"
            onClick={() => setSelectedTypeFilter('مدنية')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              selectedTypeFilter === 'مدنية'
                ? theme.filterActive
                : theme.filterInactive
            }`}
          >
            مدنية (28 سورة)
          </button>

          <div className={`mr-auto flex items-center gap-1.5 text-xs ${theme.subText}`}>
            <span>تصفية بالجزء:</span>
            <select
              value={selectedJuzFilter}
              onChange={(e) => setSelectedJuzFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              aria-label="تصفية السور حسب الجزء القرآني"
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none transition-colors ${theme.input}`}
            >
              <option value="all">كل الأجزاء (1 - 30)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <option key={juz} value={juz}>
                  الجزء {juz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Surahs Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
          {filteredSurahs.map((surah) => {
            const isCurrentlySelected = selectedSurah.number === surah.number;
            return (
              <button
                key={surah.number}
                type="button"
                onClick={() => handleSelectSurah(surah)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between min-h-[92px] group relative overflow-hidden ${
                  isCurrentlySelected
                    ? theme.surahActive
                    : theme.surahDefault
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                      isCurrentlySelected
                        ? theme.surahNumActive
                        : theme.surahNumDefault
                    }`}
                  >
                    {surah.number}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      surah.type === 'مكية'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {surah.type}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm sm:text-base font-bold font-amiri block ${
                        isCurrentlySelected ? 'text-[#046A38] font-black' : theme.title
                      }`}
                    >
                      سورة {surah.name}
                    </span>
                    {isCurrentlySelected && isPlaying && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#046A38]"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] block ${theme.subText}`}>
                    {surah.totalAyahs} آية • جزء {surah.startJuz}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredSurahs.length === 0 && (
          <div className={`py-12 text-center space-y-2 ${theme.subText}`}>
            <p className={`text-sm font-bold ${theme.title}`}>لم يتم العثور على أي سورة مطابقة للبحث</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedJuzFilter('all');
                setSelectedTypeFilter('all');
              }}
              className="text-xs text-[#046A38] font-bold underline cursor-pointer"
            >
              إعادة ضبط الفلاتر والبحث
            </button>
          </div>
        )}
      </div>

      {/* Instructional Pedagogical Card (فوائد وتوجيهات المقرأة للاستماع) */}
      <div className={`rounded-3xl p-5 sm:p-6 border space-y-3 transition-colors duration-300 ${theme.cardSubtle}`}>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#C5A059]" />
          <h3 className={`text-sm sm:text-base font-bold font-amiri ${theme.accentTitle}`}>
            منهجية الاستماع والترديد بمقرأة رحاب القرآن الإلكترونية
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
          <div className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${theme.pedagogicalItem}`}>
            <span className={`font-bold block font-amiri text-sm ${theme.accentTitle}`}>
              1. الاستماع المركز (المصحف المعلم)
            </span>
            <p>
              استمع للآية بصوت الشيخ أولاً، ثم استغل فترة السكتة وترديد الطلاب لتعيد التلاوة بنبرة واضحة ومطابقة لحركات الفم ومخارج الحروف.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${theme.pedagogicalItem}`}>
            <span className={`font-bold block font-amiri text-sm ${theme.accentTitle}`}>
              2. التكرار لتثبيت الحفظ والمراجعة
            </span>
            <p>
              استخدم ميزة (تكرار السورة) للاستماع إليها أكثر من مرة أثناء يومك، فإن الأذن تحفظ كما يحفظ اللسان، ويعينك ذلك على ثبات الحفظ.
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 transition-colors ${theme.pedagogicalItem}`}>
            <span className={`font-bold block font-amiri text-sm ${theme.accentTitle}`}>
              3. ضبط التجويد مع المصحف المجود
            </span>
            <p>
              استمع للمصحف المجود للشيخ الحصري أو المنشاوي لضبط دقائق مقادير المدود (المتصل، المنفصل، اللازم) والإظهار والإخفاء بغناته المفخمة والمرققة.
            </p>
          </div>
        </div>
      </div>

      {/* زر التبديل العائم السريع لوضع القراءة الليلي أثناء الاستماع والمراجعة الطويلة */}
      <aside
        aria-label="التبديل السريع لوضع القراءة الليلي لتقليل إجهاد العين"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl transition-all border"
        style={{
          backgroundColor: readingMode === 'dark' ? 'rgba(22, 31, 26, 0.95)' : readingMode === 'sepia' ? 'rgba(250, 244, 230, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: readingMode === 'dark' ? 'rgba(197, 160, 89, 0.4)' : readingMode === 'sepia' ? '#D2B98B' : '#C5A059'
        }}
      >
        <button
          type="button"
          onClick={() => handleSetReadingMode('light')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            readingMode === 'light'
              ? 'bg-[#046A38] text-white shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="الوضع النهاري المعتمد"
        >
          <Sun className={`w-3.5 h-3.5 ${readingMode === 'light' ? 'text-amber-300' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">نهاري</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetReadingMode('sepia')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            readingMode === 'sepia'
              ? 'bg-[#7A5416] text-white shadow-xs font-black'
              : 'text-[#846E56] hover:text-[#3B2D1D]'
          }`}
          title="وضع السيبيا (ورق المصحف الدافئ لتقليل إجهاد العين)"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C5A876]" />
          <span>سيبيا</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetReadingMode('dark')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            readingMode === 'dark'
              ? 'bg-[#046A38] text-white shadow-xs font-black'
              : 'text-slate-400 hover:text-white'
          }`}
          title="الوضع الليلي (قراءة مريحة معتمة لتقليل إجهاد العين أثناء المراجعة الطويلة)"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-300" />
          <span>ليلي</span>
        </button>
      </aside>
    </div>
  );
};
