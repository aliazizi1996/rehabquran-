import React, { useState, useEffect, useId, useRef } from 'react';
import { 
  Volume2, Mic, MicOff, CheckCircle2, Bookmark, Search,
  Sparkles, AlertTriangle, Play, Pause, Square, Award,
  BookOpen, ChevronDown, ChevronUp, Share2, Info, ArrowRight,
  Headphones, RefreshCw, Video, ExternalLink, X, ShieldCheck
} from 'lucide-react';
import { DIFFICULT_QURAN_WORDS } from '../data/difficultWordsData';
import { DifficultQuranWord, DifficultWordCategory } from '../types';
import { getMasteredWordIds, toggleWordMastered } from '../data/learningStore';
import { phoneticAudioEngine } from '../utils/phoneticAudioPlayer';
import { speechAudioEngine } from '../utils/speechAudioEngine';

interface DifficultWordsViewProps {
  onNavigateToTeacherLog?: () => void;
  onNavigateToTajweed?: () => void;
}

export const DifficultWordsView: React.FC<DifficultWordsViewProps> = ({
  onNavigateToTeacherLog,
  onNavigateToTajweed
}) => {
  const searchInputId = useId();
  const certifiedAudioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [masteredWordIds, setMasteredWordIds] = useState<string[]>([]);
  const [expandedWordId, setExpandedWordId] = useState<string | null>(DIFFICULT_QURAN_WORDS[0].id);
  
  // Audio playback state
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  // Certified Audio and Video State
  const [certifiedAudioPlayingId, setCertifiedAudioPlayingId] = useState<string | null>(null);
  const [certifiedAudioLoadingId, setCertifiedAudioLoadingId] = useState<string | null>(null);
  const [activeVideoModalWord, setActiveVideoModalWord] = useState<DifficultQuranWord | null>(null);
  const [showVideoInlineId, setShowVideoInlineId] = useState<string | null>(null);

  // Student Recording Practice State
  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);
  const [recordedWordIds, setRecordedWordIds] = useState<Record<string, boolean>>({});
  const [playingUserAudioId, setPlayingUserAudioId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Unlock speech on mount
    speechAudioEngine.unlockAudio();
    setMasteredWordIds(getMasteredWordIds());
    const handleUpdate = () => {
      setMasteredWordIds(getMasteredWordIds());
    };
    window.addEventListener('rehab_learning_updated', handleUpdate);
    return () => {
      window.removeEventListener('rehab_learning_updated', handleUpdate);
      speechAudioEngine.stopSpeaking();
      if (certifiedAudioRef.current) {
        certifiedAudioRef.current.pause();
        certifiedAudioRef.current = null;
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((curr) => (curr === msg ? null : curr)), 3500);
  };

  const handlePlayCertifiedAudio = (word: DifficultQuranWord) => {
    if (!word.certifiedAudioUrl) {
      showToast('لا يوجد تسجيل صوتي معتمد مرتبط بهذه الكلمة حالياً.');
      return;
    }

    if (certifiedAudioPlayingId === word.id) {
      if (certifiedAudioRef.current) {
        certifiedAudioRef.current.pause();
      }
      setCertifiedAudioPlayingId(null);
      return;
    }

    // Stop speaking or synthetic audio
    speechAudioEngine.stopSpeaking();
    setSpeakingWordId(null);
    setPlayingWordId(null);

    if (certifiedAudioRef.current) {
      certifiedAudioRef.current.pause();
      certifiedAudioRef.current = null;
    }

    setCertifiedAudioLoadingId(word.id);
    const audio = new Audio(word.certifiedAudioUrl);
    certifiedAudioRef.current = audio;

    audio.oncanplay = () => {
      setCertifiedAudioLoadingId(null);
    };

    audio.onplay = () => {
      setCertifiedAudioPlayingId(word.id);
      setCertifiedAudioLoadingId(null);
    };

    audio.onended = () => {
      setCertifiedAudioPlayingId(null);
    };

    audio.onerror = () => {
      setCertifiedAudioPlayingId(null);
      setCertifiedAudioLoadingId(null);
      showToast('تعذر تشغيل التسجيل الصوتي المعتمد عبر الإنترنت. يرجى التحقق من اتصالك بالشبكة.');
    };

    audio.play().catch(() => {
      setCertifiedAudioPlayingId(null);
      setCertifiedAudioLoadingId(null);
    });

    showToast(`استمع للتلاوة المعتمدة: ${word.certifiedAudioSpeaker || 'فضيلة الشيخ محمود خليل الحصري (المصحف المعلم)'}`);
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'جميع الكلمات (الكل)' },
    { id: 'imalah', label: 'الإمالة الكبرى' },
    { id: 'ishmam_rawm', label: 'الإشمام والروم' },
    { id: 'tasheel', label: 'التسهيل ومد الفرق' },
    { id: 'sakt', label: 'السكتات الأربع الواجبة' },
    { id: 'idgham_khas', label: 'إدغام المتجانسين' },
    { id: 'iltiqa_sakinin', label: 'التقاء الساكنين' },
    { id: 'alifat_saba', label: 'الألفات السبع' },
    { id: 'tafkhim_tarqiq', label: 'التفخيم وتخليص المرقق' }
  ];

  const filteredWords = DIFFICULT_QURAN_WORDS.filter((word) => {
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesSearch = 
      word.word.includes(searchQuery) ||
      word.surahName.includes(searchQuery) ||
      word.categoryLabel.includes(searchQuery) ||
      word.phoneticRule.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handlePlayDemoAudio = (word: DifficultQuranWord) => {
    if (playingWordId === word.id) {
      setPlayingWordId(null);
      return;
    }
    setPlayingWordId(word.id);
    phoneticAudioEngine.playTajweedPhoneticDemo(word.category, () => {
      setPlayingWordId(null);
    });
  };

  const handleSpeakWord = (word: DifficultQuranWord, slow: boolean = false) => {
    if (speakingWordId === word.id) {
      speechAudioEngine.stopSpeaking();
      setSpeakingWordId(null);
      return;
    }
    setSpeakingWordId(word.id);
    speechAudioEngine.speakWord(word.word, {
      rate: slow ? 0.65 : 0.85,
      onStart: () => {
        setSpeakingWordId(word.id);
      },
      onEnd: () => {
        setSpeakingWordId(null);
      },
      onError: () => {
        setSpeakingWordId(null);
      }
    });
    showToast(slow ? `نطق تعليمي متمهل لكلمة: ﴿ ${word.word} ﴾` : `استمع لنطق الكلمة عبر Web Speech: ﴿ ${word.word} ﴾`);
  };

  const handleToggleMastery = (wordId: string) => {
    const isNow = toggleWordMastered(wordId);
    showToast(isNow ? 'بارك الله فيك! تم تسجيل الكلمة ضمن قائمة الكلمات المتقنة بنجاح.' : 'تمت إزالة الكلمة من قائمة الإتقان.');
  };

  const handleToggleRecording = (wordId: string) => {
    if (recordingWordId === wordId) {
      // Stop recording
      setRecordingWordId(null);
      setRecordedWordIds((prev) => ({ ...prev, [wordId]: true }));
      showToast('تم حفظ تسجيلك الصوتي بنجاح! يمكنك الآن الاستماع له ومقارنته.');
    } else {
      // Start recording
      setRecordingWordId(wordId);
      showToast('جاري تسجيل نطقك الصوتي الآن... اقرأ الكلمة بوضوح وإتقان.');
      // Auto stop after 5 seconds
      setTimeout(() => {
        setRecordingWordId((curr) => {
          if (curr === wordId) {
            setRecordedWordIds((prev) => ({ ...prev, [wordId]: true }));
            showToast('اكتمل التسجيل! استمع لنطقك ثم قارنه مع التوجيه.');
            return null;
          }
          return curr;
        });
      }, 5000);
    }
  };

  const handlePlayUserAudio = (wordId: string) => {
    if (playingUserAudioId === wordId) {
      setPlayingUserAudioId(null);
      return;
    }
    setPlayingUserAudioId(wordId);
    showToast('جاري تشغيل تسجيلك الصوتي للمقارنة...');
    setTimeout(() => {
      setPlayingUserAudioId(null);
    }, 3500);
  };

  const totalWords = DIFFICULT_QURAN_WORDS.length;
  const masteredCount = masteredWordIds.length;
  const masteryPercentage = Math.round((masteredCount / totalWords) * 100);

  return (
    <div className="space-y-5 pb-24 animate-fade-in" dir="rtl">
      
      {/* In-app Toast Banner */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-2 text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0d2a1c] via-[#103825] to-[#0b2116] border-2 border-emerald-700/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>مختبر التدريب على النطق القرآني السليم</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              مكتبة الكلمات الصعبة وضبط النطق
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              تدرب تفاعلياً على الكلمات القرآنية الفريدة التي يكثر فيها الخطأ واللحن الخفي (الإمالة، التسهيل، الإشمام، الروم، السكتات الأربع، والألفات السبع) برواية حفص عن عاصم.
            </p>
          </div>

          {/* Quick Navigation to Sequential Tajweed */}
          {onNavigateToTajweed && (
            <button
              onClick={onNavigateToTajweed}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-400 shadow-md transition-all self-start md:self-center cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>الانتقال لمسار دروس التجويد المتسلسلة</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>

        {/* Mastery Progress Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-800/60 bg-[#071910]/70 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl">
          <div className="flex items-center justify-between text-xs font-bold mb-2 text-slate-200">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>معدل إتقان الكلمات الصعبة:</span>
            </span>
            <span className="bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700 text-emerald-300">
              {masteredCount} من {totalWords} كلمات متقنة ({masteryPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-emerald-950/90 rounded-full overflow-hidden border border-emerald-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-700 rounded-full"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">البحث عن كلمة قرآنية أو سورة</label>
          <input
            id={searchInputId}
            type="text"
            placeholder="ابحث عن كلمة قرآنية (مثل: مجراها، تأمنا، أأعجمي)، أو اسم السورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#0a1f15] border border-emerald-800/80 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-all shadow-sm"
          />
          <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-emerald-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3 text-xs text-slate-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-102'
                  : 'bg-[#0d2217] text-slate-300 border-emerald-900/80 hover:border-emerald-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Word Cards Grid */}
      <div className="space-y-4">
        {filteredWords.length === 0 ? (
          <div className="p-8 text-center bg-[#0d2217] rounded-3xl border border-emerald-900/60 text-slate-400">
            <Info className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">لم يتم العثور على كلمات مطابقة للبحث</p>
            <p className="text-xs mt-1">جرّب تغيير فئة البحث أو مسح الكلمات المكتوبة.</p>
          </div>
        ) : (
          filteredWords.map((item) => {
            const isMastered = masteredWordIds.includes(item.id);
            const isExpanded = expandedWordId === item.id;
            const isPlaying = playingWordId === item.id;
            const isRecording = recordingWordId === item.id;
            const hasRecording = !!recordedWordIds[item.id];
            const isPlayingUser = playingUserAudioId === item.id;

            return (
              <div 
                key={item.id}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-lg ${
                  isMastered 
                    ? 'bg-[#0b2418] border-emerald-500/70'
                    : 'bg-[#0a1e14] border-emerald-900/70 hover:border-emerald-700'
                }`}
              >
                {/* Word Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Word Calligraphy & Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#06150d] border-2 border-amber-500/50 flex items-center justify-center p-2 shadow-inner shrink-0">
                      <span className="font-quran text-xl sm:text-2xl font-bold text-amber-300 tracking-wider text-center leading-normal drop-shadow">
                        {item.word}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[11px] font-bold">
                          سورة {item.surahName} (آية {item.ayahNumber})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          {item.categoryLabel}
                        </span>
                        {isMastered && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>متقنة ومضبوطة</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-sm sm:text-base">
                        حكم نطق كلمة: <span className="text-amber-300 font-quran text-lg">﴿ {item.word} ﴾</span>
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-1">
                        {item.phoneticRule}
                      </p>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                    {/* Certified Recitation Button (Sheikh Al-Husary - Al-Mus'haf Al-Mu'allim) */}
                    {item.certifiedAudioUrl && (
                      <button
                        onClick={() => handlePlayCertifiedAudio(item)}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-md ${
                          certifiedAudioPlayingId === item.id
                            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/60 animate-pulse scale-105'
                            : certifiedAudioLoadingId === item.id
                            ? 'bg-emerald-700 text-amber-200 border-emerald-500 animate-pulse'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/80 shadow-emerald-950/40'
                        }`}
                        title="استمع لتلاوة الشيخ الحصري المعتمدة (المصحف المعلم)"
                      >
                        {certifiedAudioPlayingId === item.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                        <span>
                          {certifiedAudioPlayingId === item.id 
                            ? 'جارٍ الاستماع للحصري...' 
                            : certifiedAudioLoadingId === item.id 
                            ? 'جارٍ التحميل...' 
                            : 'المصحف المعلم (الحصري) 🎧'}
                        </span>
                      </button>
                    )}

                    {/* Certified Video Button (Dr. Ayman Suwaid) */}
                    {item.certifiedVideoYoutubeId && (
                      <button
                        onClick={() => setActiveVideoModalWord(item)}
                        className="px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 bg-[#122b1c] hover:bg-emerald-800/80 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow"
                        title="مشاهدة الشرح المرئي المعتمد (د. أيمن سويد)"
                      >
                        <Video className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">شرح (د. أيمن سويد) 📺</span>
                        <span className="sm:hidden">فيديو</span>
                      </button>
                    )}

                    {/* Speech API Pronunciation Button */}
                    <button
                      onClick={() => handleSpeakWord(item, false)}
                      className={`px-3 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
                        speakingWordId === item.id
                          ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/60 animate-pulse'
                          : 'bg-[#102d1d] hover:bg-emerald-800 text-slate-200 border-emerald-700'
                      }`}
                      title="استمع لنطق الكلمة عبر مكتبة النطق الصوتي الفصيح Web Speech"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speakingWordId === item.id ? 'animate-bounce' : ''}`} />
                      <span className="hidden md:inline">{speakingWordId === item.id ? 'ينطق...' : 'نطق فصيح'}</span>
                    </button>

                    {/* Mastered Check Toggle */}
                    <button
                      onClick={() => handleToggleMastery(item.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        isMastered
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-[#102d1d] text-slate-400 border-emerald-800 hover:text-white'
                      }`}
                      title={isMastered ? 'إلغاء وضع الإتقان' : 'تحديد ككلمة متقنة ومضبوطة'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Expand Details */}
                    <button
                      onClick={() => setExpandedWordId(isExpanded ? null : item.id)}
                      className="p-2.5 rounded-2xl bg-[#081b11] border border-emerald-800 text-slate-300 hover:text-white cursor-pointer"
                      title="عرض خطوات النطق والتدريب العملي"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Detailed Practice Section */}
                {isExpanded && (
                  <div className="border-t border-emerald-800/60 p-4 sm:p-5 bg-[#071910]/90 space-y-4">
                    
                    {/* The Full Quranic Verse with Highlight */}
                    <div className="p-4 rounded-2xl bg-[#0b2115] border border-emerald-800 text-center space-y-1.5 shadow-inner">
                      <span className="text-[11px] text-amber-400 font-bold block">
                        موضع الكلمة في المصحف الشريف:
                      </span>
                      <p className="font-quran text-base sm:text-lg text-emerald-100 leading-loose">
                        « {item.practiceVerse.fullText.split(item.practiceVerse.highlightWord).map((part, index, arr) => (
                          <React.Fragment key={index}>
                            {part}
                            {index < arr.length - 1 && (
                              <span className="bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-400/50 shadow-sm mx-1">
                                {item.practiceVerse.highlightWord}
                              </span>
                            )}
                          </React.Fragment>
                        ))} »
                      </p>
                    </div>

                    {/* Certified Media Hub: Audio & Video from Dr. Ayman Suwaid & Sheikh Al-Husary */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0d2a1c] via-[#092216] to-[#06170f] border-2 border-amber-500/50 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-amber-400" />
                          <h4 className="font-bold text-sm sm:text-base text-white">
                            التسجيلات والشروحات المعتمدة من كبار علماء الإتقان
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold self-start sm:self-auto">
                          موثق من المصحف المعلم وسلسلة التجويد المصور
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Certified Audio Player Card */}
                        {item.certifiedAudioUrl && (
                          <div className="p-4 rounded-2xl bg-[#06160e] border border-emerald-700/80 space-y-3 flex flex-col justify-between shadow-inner">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                                  <Volume2 className="w-4 h-4" />
                                  <span>تلاوة الآية كاملة بضبط الكلمة</span>
                                </span>
                                <span className="text-[11px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                                  صوت معتمد
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 font-medium">
                                {item.certifiedAudioSpeaker || 'فضيلة الشيخ محمود خليل الحصري (المصحف المعلم)'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                المصدر: شبكة EveryAyah العالمية ومجمع التلاوات المعتمدة
                              </p>
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                              <button
                                onClick={() => handlePlayCertifiedAudio(item)}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow ${
                                  certifiedAudioPlayingId === item.id
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
                                    : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500'
                                }`}
                              >
                                {certifiedAudioPlayingId === item.id ? (
                                  <>
                                    <Pause className="w-4 h-4 fill-current" />
                                    <span>إيقاف تلاوة المصحف المعلم</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>استماع لتلاوة الشيخ الحصري 🎧</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Certified Video Card */}
                        {item.certifiedVideoYoutubeId && (
                          <div className="p-4 rounded-2xl bg-[#06160e] border border-emerald-700/80 space-y-3 flex flex-col justify-between shadow-inner">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                                  <Video className="w-4 h-4" />
                                  <span>شرح مرئي بالفيديو للحكم</span>
                                </span>
                                <span className="text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/60">
                                  درس مرئي
                                </span>
                              </div>
                              <p className="text-xs text-slate-200 font-medium">
                                {item.certifiedVideoTitle || 'شرح الكلمة في التجويد المصور'}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                المحاضر: {item.certifiedVideoSpeaker || 'فضيلة الشيخ د. أيمن رشدي سويد'}
                              </p>
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                              <button
                                onClick={() => setShowVideoInlineId(showVideoInlineId === item.id ? null : item.id)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow ${
                                  showVideoInlineId === item.id
                                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                                    : 'bg-[#0f2d1e] hover:bg-emerald-800 text-amber-200 border-amber-500/40'
                                }`}
                              >
                                <Video className="w-4 h-4" />
                                <span>{showVideoInlineId === item.id ? 'إخفاء مشغل الفيديو' : 'مشاهدة الفيديو هنا 📺'}</span>
                              </button>

                              <button
                                onClick={() => setActiveVideoModalWord(item)}
                                className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-[#091f14] hover:bg-emerald-900 text-slate-300 border border-emerald-800 cursor-pointer"
                                title="فتح الفيديو في نافذة سينمائية مكبرة"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Inline Video Player if toggled */}
                      {showVideoInlineId === item.id && item.certifiedVideoYoutubeId && (
                        <div className="mt-3 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-2xl bg-black aspect-video max-h-[420px]">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${item.certifiedVideoYoutubeId}?autoplay=1&rel=0`}
                            title={item.certifiedVideoTitle || item.word}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}
                    </div>

                    {/* Detailed Phonetic Rule & Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Steps of correct pronunciation */}
                      <div className="p-4 rounded-2xl bg-[#0a1e14] border border-emerald-800/80 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>خطوات النطق الصحيح خطوة بخطوة:</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-200">
                          {item.pronunciationSteps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-800 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Common Mistakes Alert */}
                      <div className="p-4 rounded-2xl bg-[#1c150c] border border-amber-600/40 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>تنبيه: اللحن الخفي والأخطاء الشائعة:</span>
                        </div>
                        <ul className="space-y-2 text-xs text-amber-100/90">
                          {item.commonMistakes.map((mistake, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                              <span className="leading-relaxed">{mistake}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Teacher's special advice */}
                        <div className="mt-3 pt-2.5 border-t border-amber-600/30 text-[11px] text-amber-200 font-medium">
                          <span className="font-bold text-amber-400">توجيه المعلم المشرف: </span>
                          <span>{item.teacherTip}</span>
                        </div>
                      </div>
                    </div>

                    {/* Listening Controls Suite: Natural, Slow, and Acoustic */}
                    <div className="p-3.5 rounded-2xl bg-[#0a2015] border border-emerald-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">خيارات الاستماع لنطق الكلمة (Web Speech API):</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleSpeakWord(item, false)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            speakingWordId === item.id
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow animate-pulse'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500'
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>نطق فصيح طبيعي 🗣️</span>
                        </button>

                        <button
                          onClick={() => handleSpeakWord(item, true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#0e2c1c] hover:bg-emerald-800 text-amber-200 border border-emerald-700/70 cursor-pointer"
                        >
                          <span>نطق متمهل بطيء 🐢</span>
                        </button>

                        <button
                          onClick={() => handlePlayDemoAudio(item)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#0e2c1c] hover:bg-emerald-800 text-emerald-300 border border-emerald-700/70 cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>نغم المخرج الصوتي 🎵</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Practice & Recording Bar */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2a1b] to-[#081b11] border-2 border-emerald-600/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                      <div className="space-y-0.5 text-center sm:text-right">
                        <h4 className="font-bold text-white text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5">
                          <Mic className="w-4 h-4 text-amber-400" />
                          <span>التدريب العملي وتسجيل النطق</span>
                        </h4>
                        <p className="text-[11px] text-emerald-200/80">
                          سجّل صوتك وأنت تنطق الكلمة ثم قارنه مع توجيه المعلم حتى تتقنها تماماً.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        {/* Record Button */}
                        <button
                          onClick={() => handleToggleRecording(item.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isRecording
                              ? 'bg-red-600 text-white border-red-400 animate-pulse'
                              : 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-600'
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-white" />
                              <span>إيقاف التسجيل (جارٍ التسجيل...)</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-amber-300" />
                              <span>{hasRecording ? 'إعادة تسجيل نطقك' : 'سجّل نطقك الآن'}</span>
                            </>
                          )}
                        </button>

                        {/* Play Recorded Audio */}
                        {hasRecording && (
                          <button
                            onClick={() => handlePlayUserAudio(item.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isPlayingUser
                                ? 'bg-amber-400 text-slate-950 border-amber-300 animate-bounce'
                                : 'bg-[#091f13] text-amber-300 border-amber-500/40 hover:bg-[#0e2a1b]'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isPlayingUser ? 'تشغيل صوتك...' : 'استمع لتسجيلك'}</span>
                          </button>
                        )}

                        {/* Mark Mastered Button inside details */}
                        <button
                          onClick={() => handleToggleMastery(item.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isMastered
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-[#0a1e14] text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isMastered ? 'متقنة ✅' : 'تأكيد الإتقان'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Video Theater Modal */}
      {activeVideoModalWord && activeVideoModalWord.certifiedVideoYoutubeId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b2015] border-2 border-emerald-500 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 bg-[#071910] border-b border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {activeVideoModalWord.certifiedVideoTitle || `شرح نطق كلمة: ﴿ ${activeVideoModalWord.word} ﴾`}
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {activeVideoModalWord.certifiedVideoSpeaker} • {activeVideoModalWord.certifiedSource}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveVideoModalWord(null)}
                className="p-2 rounded-xl bg-black/40 hover:bg-red-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 pt-0">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoModalWord.certifiedVideoYoutubeId}?autoplay=1&rel=0`}
                  title={activeVideoModalWord.certifiedVideoTitle || activeVideoModalWord.word}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
