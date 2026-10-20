/**
 * صفحة التفسير الميسّر للقرآن الكريم
 * مقرأة رحاب القرآن الإلكترونية
 * المصدر المعتمد: كتاب التفسير الميسّر الصادر عن مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, Search, ChevronRight, ChevronLeft, ArrowRight, 
  Copy, Check, Volume2, VolumeX, Sparkles, Filter, 
  RotateCcw, Share2, Info, BookMarked, Layers, ExternalLink,
  ChevronDown, Compass, Sun, Moon, Type
} from 'lucide-react';
import { QURAN_SURAHS_114, SurahSummary } from '../../data/quranSurahs114';
import { 
  getSurahWithTafsir, 
  searchQuranAyahs, 
  SurahDetailWithTafsir, 
  AyahWithTafsir, 
  QuranSearchResultItem,
  TAFSIR_SOURCE_METADATA 
} from '../../services/tafsirService';
import { normalizeArabicForSearch } from '../../utils/arabicSearchUtils';

interface TafsirMuyassarPageProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const TafsirMuyassarPage: React.FC<TafsirMuyassarPageProps> = ({
  onBackToHome,
  onNavigate
}) => {
  // الحالة العامة للتنقل
  const [activeView, setActiveView] = useState<'reader' | 'search' | 'index'>('reader');

  // السورة والآية الحالية
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number>(1); // الافتراضي: الفاتحة
  const [currentAyahNumber, setCurrentAyahNumber] = useState<number>(1);
  
  // بيانات السورة المحملة
  const [surahData, setSurahData] = useState<SurahDetailWithTafsir | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState<boolean>(true);
  const [surahError, setSurahError] = useState<string | null>(null);

  // حالة البحث
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<QuranSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [expandedTafsirAyah, setExpandedTafsirAyah] = useState<{ s: number; a: number; text?: string } | null>(null);

  // تصفية الفهرس
  const [indexFilterType, setIndexFilterType] = useState<'all' | 'مكية' | 'مدنية'>('all');
  const [indexSearchTerm, setIndexSearchTerm] = useState<string>('');

  // أدوات التفاعل (نسخ، صوت، تنبيهات)
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // وضع القراءة (نهاري / سيبيا / ليلي) ومستوى حجم الخط لتقليل إجهاد العين أثناء المراجعة
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rihab_quran_reading_mode');
      if (saved === 'dark' || saved === 'sepia' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rihab_quran_font_size');
      if (saved === 'normal' || saved === 'large' || saved === 'xlarge') return saved;
    }
    return 'large';
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

  const handleSetFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSizeLevel(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rihab_quran_font_size', size);
    }
  };

  // قاموس ألوان وتصميم وضع القراءة المختار (نهاري / سيبيا / ليلي) لتقليل إجهاد العين
  const theme = {
    light: {
      wrapper: 'bg-[#F9F6F0] text-[#2C3531]',
      card: 'bg-white border-[#C5A059]/40 text-slate-900 shadow-xs',
      cardSubtle: 'bg-slate-50 border-slate-200 text-slate-800',
      ayahCard: 'bg-white border-2 border-[#C5A059]/60 shadow-sm text-slate-900',
      ayahText: 'text-slate-900',
      brackets: 'text-[#C5A059]',
      tafsirBox: 'bg-[#F9F6F0] border border-[#C5A059]/50 text-slate-800',
      tafsirTitle: 'text-[#046A38]',
      tafsirMeta: 'text-slate-500',
      numBadge: 'bg-[#F9F6F0] text-[#046A38] border border-[#C5A059]/50',
      navButton: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200',
      navNextButton: 'bg-[#046A38] hover:bg-[#03542c] text-white border border-[#C5A059]',
      actionButton: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200',
      quickAyahActive: 'bg-[#046A38] text-white border border-[#C5A059] shadow-xs',
      quickAyahInactive: 'bg-[#F9F6F0] hover:bg-emerald-50 text-slate-700 border border-slate-200',
      selectInput: 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#046A38]',
      label: 'text-slate-700',
      muted: 'text-slate-400',
      togglePill: 'bg-slate-100 border border-slate-200'
    },
    sepia: {
      wrapper: 'bg-[#F4ECD8] text-[#3B2D1D]',
      card: 'bg-[#FAF4E6] border-[#D2B98B] text-[#3B2D1D] shadow-xs',
      cardSubtle: 'bg-[#EDE3CB] border-[#D2B98B] text-[#3B2D1D]',
      ayahCard: 'bg-[#FAF4E6] border-2 border-[#C5A876] shadow-sm text-[#3B2D1D]',
      ayahText: 'text-[#2B1F11]',
      brackets: 'text-[#A87B28]',
      tafsirBox: 'bg-[#EDE3CB] border border-[#C5A876] text-[#42311E]',
      tafsirTitle: 'text-[#7A5416]',
      tafsirMeta: 'text-[#846E56]',
      numBadge: 'bg-[#E5D7B7] text-[#553C1B] border border-[#C5A876]',
      navButton: 'bg-[#FAF4E6] hover:bg-[#F2E6CD] text-[#3B2D1D] border border-[#D2B98B]',
      navNextButton: 'bg-[#7A5416] hover:bg-[#664612] text-[#FAF4E6] border border-[#D2B98B]',
      actionButton: 'bg-[#EDE3CB] hover:bg-[#E2D4B6] text-[#3B2D1D] border border-[#D2B98B]',
      quickAyahActive: 'bg-[#7A5416] text-[#FAF4E6] border border-[#C5A876] shadow-xs',
      quickAyahInactive: 'bg-[#EDE3CB] hover:bg-[#E2D4B6] text-[#553C1B] border border-[#D2B98B]',
      selectInput: 'bg-[#EDE3CB] border-[#D2B98B] text-[#3B2D1D] focus:border-[#7A5416]',
      label: 'text-[#553C1B]',
      muted: 'text-[#8A755D]',
      togglePill: 'bg-[#EDE3CB] border border-[#D2B98B]'
    },
    dark: {
      wrapper: 'bg-[#0D120F] text-[#EDE6DA]',
      card: 'bg-[#161F1A] border-[#C5A059]/35 text-[#EDE6DA] shadow-md',
      cardSubtle: 'bg-[#1C2721] border-emerald-900/60 text-[#D5DFD8]',
      ayahCard: 'bg-[#161F1A] border-2 border-[#C5A059]/40 shadow-lg text-[#EDE6DA]',
      ayahText: 'text-[#F9F5EC]',
      brackets: 'text-[#E0B967]',
      tafsirBox: 'bg-[#101713] border border-[#C5A059]/30 text-[#D4DDD6]',
      tafsirTitle: 'text-[#E0B967]',
      tafsirMeta: 'text-[#8EA094]',
      numBadge: 'bg-[#222E27] text-[#34D399] border border-[#C5A059]/40',
      navButton: 'bg-[#1C2721] hover:bg-[#25332B] text-[#EDE6DA] border border-emerald-900/70',
      navNextButton: 'bg-[#046A38] hover:bg-[#068045] text-white border border-[#C5A059]',
      actionButton: 'bg-[#1C2721] hover:bg-[#25332B] text-[#D5DFD8] border border-emerald-900/70',
      quickAyahActive: 'bg-[#046A38] text-white border border-[#C5A059] shadow-xs',
      quickAyahInactive: 'bg-[#161F1A] hover:bg-[#222E27] text-[#A6B7AC] border border-emerald-900/60',
      selectInput: 'bg-[#1C2721] border-emerald-900/70 text-[#EDE6DA] focus:border-[#34D399]',
      label: 'text-[#D5DFD8]',
      muted: 'text-[#7D9084]',
      togglePill: 'bg-[#161F1A] border border-emerald-900/60'
    }
  }[readingMode];

  const ayahFontClass = {
    normal: 'text-xl sm:text-2xl lg:text-3xl leading-[2.2] sm:leading-[2.4]',
    large: 'text-2xl sm:text-3xl lg:text-4xl leading-[2.3] sm:leading-[2.6]',
    xlarge: 'text-3xl sm:text-4xl lg:text-5xl leading-[2.5] sm:leading-[2.9]'
  }[fontSizeLevel];

  // مرجع التمرير إلى أعلى عند تغيير الآية
  const readerTopRef = useRef<HTMLDivElement | null>(null);

  // تحميل السورة عند تغير رقمها
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSurah(true);
    setSurahError(null);

    getSurahWithTafsir(currentSurahNumber)
      .then((data) => {
        if (isMounted) {
          setSurahData(data);
          setIsLoadingSurah(false);
          // تأكد من أن رقم الآية ضمن نطاق السورة
          if (currentAyahNumber > data.totalAyahs) {
            setCurrentAyahNumber(1);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSurahError(err?.message || 'تعذر تحميل بيانات السورة والتفسير');
          setIsLoadingSurah(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentSurahNumber]);

  // إيقاف الصوت عند تبديل الآية
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [currentSurahNumber, currentAyahNumber]);

  // الآية الحالية المختارة
  const currentAyah: AyahWithTafsir | null = useMemo(() => {
    if (!surahData || !surahData.ayahs) return null;
    return surahData.ayahs.find(a => a.numberInSurah === currentAyahNumber) || surahData.ayahs[0] || null;
  }, [surahData, currentAyahNumber]);

  // السورة الحالية في الفهرس
  const currentSurahMeta: SurahSummary = useMemo(() => {
    return QURAN_SURAHS_114.find(s => s.number === currentSurahNumber) || QURAN_SURAHS_114[0];
  }, [currentSurahNumber]);

  // تنفيذ البحث في القرآن الكريم
  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchQuranAyahs(query, 60);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // نسخ الآية مع التفسير الميسّر
  const handleCopyAyahAndTafsir = async () => {
    if (!currentAyah || !surahData) return;

    const copyText = `﴿ ${currentAyah.textUthmani} ﴾
[سورة ${surahData.name} - الآية ${currentAyah.numberInSurah}]

التفسير الميسّر (مجمع الملك فهد لطباعة المصحف الشريف):
${currentAyah.tafsirText}

— مقرأة رحاب القرآن الإلكترونية`;

    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(copyText);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = copyText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopiedKey(`ayah-${currentSurahNumber}-${currentAyahNumber}`);
      setToastMessage(`تم نسخ الآية (${currentAyahNumber}) من سورة ${surahData.name} مع تفسيرها بنجاح`);
      setTimeout(() => setCopiedKey(null), 2500);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // تشغيل تلاوة الآية بصوت الشيخ مشاري العفاسي
  const togglePlayVerseAudio = () => {
    if (!currentAyah) return;

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // رابط الآية من CDN الموثوق بصوت مشاري العفاسي
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${currentAyah.number}.mp3`;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }

    audioRef.current.onended = () => setIsPlayingAudio(false);
    audioRef.current.onerror = () => {
      setIsPlayingAudio(false);
      setToastMessage('تعذر تشغيل الصوت مؤقتاً، يرجى التحقق من الاتصال');
      setTimeout(() => setToastMessage(null), 3000);
    };

    audioRef.current.play().then(() => {
      setIsPlayingAudio(true);
    }).catch(() => {
      setIsPlayingAudio(false);
    });
  };

  // الانتقال إلى الآية التالية
  const handleNextAyah = () => {
    if (!surahData) return;

    if (currentAyahNumber < surahData.totalAyahs) {
      setCurrentAyahNumber(prev => prev + 1);
    } else if (currentSurahNumber < 114) {
      // الانتقال إلى أول آية من السورة التالية
      setCurrentSurahNumber(prev => prev + 1);
      setCurrentAyahNumber(1);
    }

    if (readerTopRef.current) {
      readerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // الانتقال إلى الآية السابقة
  const handlePrevAyah = () => {
    if (!surahData) return;

    if (currentAyahNumber > 1) {
      setCurrentAyahNumber(prev => prev - 1);
    } else if (currentSurahNumber > 1) {
      // الانتقال إلى آخر آية من السورة السابقة
      const prevSurahMeta = QURAN_SURAHS_114.find(s => s.number === currentSurahNumber - 1);
      if (prevSurahMeta) {
        setCurrentSurahNumber(prevSurahMeta.number);
        setCurrentAyahNumber(prevSurahMeta.totalAyahs);
      }
    }

    if (readerTopRef.current) {
      readerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // فتح آية من نتائج البحث
  const handleOpenSearchResult = (surahNum: number, ayahNum: number) => {
    setCurrentSurahNumber(surahNum);
    setCurrentAyahNumber(ayahNum);
    setActiveView('reader');
    if (readerTopRef.current) {
      readerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // فتح التفسير المباشر داخل بطاقة البحث
  const handleToggleInlineTafsir = async (s: number, a: number) => {
    if (expandedTafsirAyah && expandedTafsirAyah.s === s && expandedTafsirAyah.a === a) {
      setExpandedTafsirAyah(null);
      return;
    }

    try {
      const surah = await getSurahWithTafsir(s);
      const target = surah.ayahs.find(item => item.numberInSurah === a);
      setExpandedTafsirAyah({
        s,
        a,
        text: target?.tafsirText || 'التفسير غير متوفر حالياً'
      });
    } catch {
      setExpandedTafsirAyah({
        s,
        a,
        text: 'تعذر تحميل التفسير الميسّر، يرجى المحاولة لاحقاً'
      });
    }
  };

  // تصفية السور في الفهرس
  const filteredSurahs = useMemo(() => {
    return QURAN_SURAHS_114.filter(s => {
      const matchType = indexFilterType === 'all' || s.type === indexFilterType;
      const matchSearch = !indexSearchTerm.trim() || 
        normalizeArabicForSearch(s.name).includes(normalizeArabicForSearch(indexSearchTerm)) ||
        s.number.toString() === indexSearchTerm.trim() ||
        s.englishName.toLowerCase().includes(indexSearchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [indexFilterType, indexSearchTerm]);

  return (
    <div className={`min-h-screen py-6 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 ${theme.wrapper}`} dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 p-3.5 rounded-2xl bg-emerald-950 border border-emerald-400 text-white text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6" ref={readerTopRef}>
        
        {/* ======================================================== */}
        {/* 1. رأس الصفحة والمسار (Header & Breadcrumbs)             */}
        {/* ======================================================== */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl border transition-colors duration-300 ${theme.card}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer group ${theme.actionButton}`}
              title="العودة إلى الصفحة الرئيسية"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#C5A059]">المكتبة القرآنية المعتمدة</span>
                <span className="text-[10px] bg-emerald-100 text-[#046A38] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  مجمع الملك فهد
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black font-serif text-[#046A38]">
                التفسير الميسّر للقرآن الكريم
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* أزرار التبديل السريع بين العرض / البحث / الفهرس */}
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl ${theme.togglePill}`}>
              <button
                onClick={() => setActiveView('reader')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'reader'
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : `${theme.muted} hover:text-[#046A38]`
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>قراءة وتفسير الآيات</span>
              </button>

              <button
                onClick={() => setActiveView('search')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'search'
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : `${theme.muted} hover:text-[#046A38]`
                }`}
              >
                <Search className="w-4 h-4" />
                <span>البحث في القرآن</span>
              </button>

              <button
                onClick={() => setActiveView('index')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'index'
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : `${theme.muted} hover:text-[#046A38]`
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>فهرس السور (114)</span>
              </button>
            </div>

            {/* زر التبديل إلى وضع القراءة الليلي (Dark/Sepia Mode) */}
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-bold transition-colors ${theme.togglePill}`}>
              <button
                type="button"
                onClick={() => handleSetReadingMode('light')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'light' ? 'bg-white text-[#046A38] shadow-xs font-black' : `${theme.muted} hover:text-slate-800`
                }`}
                title="الوضع النهاري المعتمد"
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">نهاري</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReadingMode('sepia')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'sepia' ? 'bg-[#FAF4E6] text-[#7A5416] shadow-xs font-black' : `${theme.muted} hover:text-[#3B2D1D]`
                }`}
                title="وضع السيبيا (ورق المصحف الدافئ لتقليل إجهاد العين)"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#A87B28]" />
                <span>سيبيا</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetReadingMode('dark')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  readingMode === 'dark' ? 'bg-[#046A38] text-white shadow-xs font-black' : `${theme.muted} hover:text-white`
                }`}
                title="الوضع الليلي (قراءة مريحة معتمة في الظلام)"
              >
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                <span>ليلي</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. شريط اختيار السورة ورقم الآية السريع وحجم الخط         */}
        {/* ======================================================== */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-colors duration-300 flex flex-wrap items-center justify-between gap-4 ${theme.card}`}>
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* اختيار السورة */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold whitespace-nowrap ${theme.label}`}>السورة:</span>
              <div className="relative">
                <select
                  value={currentSurahNumber}
                  onChange={(e) => {
                    setCurrentSurahNumber(Number(e.target.value));
                    setCurrentAyahNumber(1);
                    setActiveView('reader');
                  }}
                  className={`border text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-none cursor-pointer transition-colors ${theme.selectInput}`}
                >
                  {QURAN_SURAHS_114.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. سورة {s.name} ({s.type} - {s.totalAyahs} آية)
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`} />
              </div>
            </div>

            {/* اختيار الآية */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold whitespace-nowrap ${theme.label}`}>الآية:</span>
              <div className="relative">
                <select
                  value={currentAyahNumber}
                  onChange={(e) => {
                    setCurrentAyahNumber(Number(e.target.value));
                    setActiveView('reader');
                  }}
                  className={`border text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-none cursor-pointer transition-colors ${theme.selectInput}`}
                >
                  {Array.from({ length: currentSurahMeta.totalAyahs }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      الآية {num}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${theme.muted}`} />
              </div>
              <span className={`text-xs font-mono ${theme.muted}`}>
                من {currentSurahMeta.totalAyahs}
              </span>
            </div>
          </div>

          {/* شارات سريعة لمعلومات السورة ومستوى حجم الخط */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-bold">
              {currentSurahMeta.type}
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-[#046A38] rounded-xl border border-emerald-200 font-bold">
              {currentSurahMeta.totalAyahs} آية
            </span>
            {currentAyah && (
              <span className={`px-3 py-1 rounded-xl font-mono text-[11px] border ${theme.cardSubtle}`}>
                الجزء {currentAyah.juz} • صفحة {currentAyah.page}
              </span>
            )}

            {/* تحكم حجم خط الآية */}
            <div className={`flex items-center p-1 rounded-xl border font-mono font-bold text-xs ${theme.togglePill}`}>
              <span className={`px-1.5 text-[10px] font-sans ${theme.muted} hidden sm:inline`}>الخط:</span>
              <button
                type="button"
                onClick={() => handleSetFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  fontSizeLevel === 'normal' ? 'bg-[#046A38] text-white shadow-2xs' : `${theme.muted} hover:text-slate-800`
                }`}
                title="خط عادي"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('large')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  fontSizeLevel === 'large' ? 'bg-[#046A38] text-white shadow-2xs' : `${theme.muted} hover:text-slate-800`
                }`}
                title="خط كبير"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('xlarge')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  fontSizeLevel === 'xlarge' ? 'bg-[#046A38] text-white shadow-2xs' : `${theme.muted} hover:text-slate-800`
                }`}
                title="خط كبير جداً"
              >
                A++
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. شاشة البحث المتقدم بدون تشكيل (SEARCH VIEW)           */}
        {/* ======================================================== */}
        {activeView === 'search' && (
          <div className="space-y-5 animate-fade-in">
            {/* بطاقة إدخال البحث */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#C5A059]" />
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                  ابحث عن كلمة أو آية في القرآن الكريم
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                البحث ذكي وسريع، يدعم البحث بدون تشكيل، ويعالج تلقائياً فروق الهمزات (أ، إ، آ)، والألف اللينة والمقصورة (ى / ي)، والتاء المربوطة والهاء (ة / ه).
              </p>

              <form onSubmit={handlePerformSearch} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اكتب كلمة أو جملة من الآية، مثال: الحمد، نور السماوات، الكرسي، الجنة..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 pr-11 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#046A38] focus:bg-white shadow-inner font-sans"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setHasSearched(false); }}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#046A38] hover:bg-[#03542c] disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer border border-[#C5A059] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? 'جاري البحث في 6236 آية...' : 'بحث في الآيات'}</span>
                </button>
              </form>

              {/* اقتراحات كلمات شائعة للبحث */}
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400 text-[11px]">كلمات مقترحة:</span>
                {['الرحمن', 'الجنة', 'الصبر', 'التقوى', 'الهدى', 'الفرقان', 'الكوثر', 'الملك'].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      setSearchQuery(word);
                      searchQuranAyahs(word, 50).then(res => {
                        setSearchResults(res);
                        setHasSearched(true);
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-[#046A38] rounded-xl text-[11px] text-slate-600 transition-colors cursor-pointer border border-slate-200"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>

            {/* نتائج البحث */}
            {hasSearched && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-sm text-[#046A38] flex items-center gap-2">
                    <span>نتائج البحث عن «{searchQuery}»:</span>
                    <span className="text-xs bg-emerald-100 text-[#046A38] px-2 py-0.5 rounded-full font-mono">
                      {searchResults.length} آية
                    </span>
                  </h3>
                </div>

                {searchResults.length === 0 ? (
                  <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
                      🔍
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">لم يتم العثور على آيات مطابقة</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      تأكد من كتابة الكلمة بشكل صحيح، أو جرّب كلمة أخرى من سياق الآية.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((item, idx) => {
                      const isExpanded = expandedTafsirAyah?.s === item.surahNumber && expandedTafsirAyah?.a === item.ayahNumber;

                      return (
                        <div
                          key={`${item.surahNumber}-${item.ayahNumber}-${idx}`}
                          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#C5A059] shadow-2xs space-y-3 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#046A38] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                                {idx + 1}
                              </span>
                              <h4 className="font-bold text-sm font-serif text-[#046A38]">
                                سورة {item.surahName}
                              </h4>
                              <span className="text-xs text-slate-500 font-mono">
                                [الآية {item.ayahNumber}]
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleInlineTafsir(item.surahNumber, item.ayahNumber)}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Info className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>{isExpanded ? 'إخفاء التفسير' : 'عرض التفسير الميسّر'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenSearchResult(item.surahNumber, item.ayahNumber)}
                                className="px-3 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <span>فتح في المصحف والتفسير ←</span>
                              </button>
                            </div>
                          </div>

                          {/* نص الآية */}
                          <p className="text-sm sm:text-base font-serif text-slate-900 leading-loose">
                            ﴿ {item.textClean} ﴾
                          </p>

                          {/* التفسير المنسدل السريع */}
                          {isExpanded && (
                            <div className="p-4 rounded-xl bg-[#F9F6F0] border border-[#C5A059]/40 space-y-2 animate-fade-in text-xs leading-relaxed text-slate-800">
                              <div className="flex items-center gap-1.5 text-[#046A38] font-bold">
                                <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>التفسير الميسّر (مجمع الملك فهد):</span>
                              </div>
                              <p className="text-slate-700">
                                {expandedTafsirAyah?.text}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. فهرس سور القرآن الكريم كاملة (INDEX VIEW)             */}
        {/* ======================================================== */}
        {activeView === 'index' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 shadow-xs space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">الفهرس العثماني المعتمد</span>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[#046A38]">
                  فهرس سور القرآن الكريم كاملة (114 سورة)
                </h2>
              </div>

              {/* أزرار التصفية والبحث في الفهرس */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setIndexFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      indexFilterType === 'all' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    الكل (114)
                  </button>
                  <button
                    onClick={() => setIndexFilterType('مكية')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      indexFilterType === 'مكية' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    مكية
                  </button>
                  <button
                    onClick={() => setIndexFilterType('مدنية')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      indexFilterType === 'مدنية' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    مدنية
                  </button>
                </div>

                <input
                  type="text"
                  value={indexSearchTerm}
                  onChange={(e) => setIndexSearchTerm(e.target.value)}
                  placeholder="ابحث باسم السورة أو رقمها..."
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#046A38]"
                />
              </div>
            </div>

            {/* شبكة السور الـ 114 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredSurahs.map((surah) => {
                const isSelected = surah.number === currentSurahNumber;

                return (
                  <button
                    key={surah.number}
                    onClick={() => {
                      setCurrentSurahNumber(surah.number);
                      setCurrentAyahNumber(1);
                      setActiveView('reader');
                      if (readerTopRef.current) {
                        readerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-[#046A38] text-white border-[#C5A059] shadow-md scale-102'
                        : 'bg-[#F9F6F0] hover:bg-emerald-50 text-slate-900 border-slate-200 hover:border-[#C5A059]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#046A38] border border-slate-200'
                      }`}>
                        {surah.number}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected 
                          ? 'bg-[#C5A059] text-slate-950' 
                          : surah.type === 'مكية' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-[#046A38]'
                      }`}>
                        {surah.type}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold font-serif text-sm truncate">
                        سورة {surah.name}
                      </h4>
                      <span className={`text-[10px] block font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {surah.totalAyahs} آية
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. شاشة قراءة الآية والتفسير الميسّر (READER VIEW)       */}
        {/* ======================================================== */}
        {activeView === 'reader' && (
          <div className="space-y-6 animate-fade-in">
            {isLoadingSurah ? (
              <div className={`p-12 rounded-3xl border text-center space-y-4 shadow-xs transition-colors duration-300 ${theme.card}`}>
                <div className="w-12 h-12 border-3 border-[#046A38] border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-bold text-sm text-[#046A38]">جاري تحميل السورة والتفسير الميسّر المعتمد...</h3>
                <p className={`text-xs ${theme.muted}`}>مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة</p>
              </div>
            ) : surahError ? (
              <div className={`p-8 rounded-3xl border border-rose-200 text-center space-y-3 transition-colors duration-300 ${theme.card}`}>
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                  !
                </div>
                <h3 className="font-bold text-sm">{surahError}</h3>
                <button
                  onClick={() => setCurrentSurahNumber(currentSurahNumber)}
                  className="px-4 py-2 bg-[#046A38] text-white rounded-xl text-xs font-bold"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : currentAyah && surahData ? (
              <div className="space-y-6">
                
                {/* بطاقة الآية المعروضة بنصها المضبوط بالرسم العثماني */}
                <div className={`rounded-3xl border-2 p-6 sm:p-10 shadow-sm space-y-6 relative overflow-hidden transition-colors duration-300 ${theme.ayahCard}`}>
                  {/* زخرفة خفيفة في الخلفية */}
                  <div className="absolute top-0 left-0 w-48 h-48 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />

                  {/* شريط رأس الآية ومعلوماتها */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm font-mono shadow-xs ${theme.numBadge}`}>
                        {currentAyah.numberInSurah}
                      </div>
                      <div>
                        <h2 className={`text-base sm:text-xl font-bold font-serif ${theme.tafsirTitle}`}>
                          سورة {surahData.name} — الآية {currentAyah.numberInSurah}
                        </h2>
                        <span className={`text-xs ${theme.muted}`}>
                          {surahData.type} • الجزء {currentAyah.juz} • صفحة {currentAyah.page}
                        </span>
                      </div>
                    </div>

                    {/* أدوات الآية: نسخ واستماع */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayVerseAudio}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isPlayingAudio
                            ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                            : theme.actionButton
                        }`}
                        title="استماع إلى تلاوة الآية (القارئ مشاري العفاسي)"
                      >
                        {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#046A38]" />}
                        <span className="hidden sm:inline">{isPlayingAudio ? 'إيقاف التلاوة' : 'استماع للآية'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyAyahAndTafsir}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${theme.actionButton}`}
                        title="نسخ نص الآية مع التفسير الميسّر"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#C5A059]" />}
                        <span className="hidden sm:inline">{copiedKey ? 'تم النسخ' : 'نسخ الآية والتفسير'}</span>
                      </button>
                    </div>
                  </div>

                  {/* نص الآية بالرسم العثماني المضبوط بحسب حجم الخط ووضع القراءة */}
                  <div className="py-4 text-center">
                    <p className={`font-serif tracking-wide select-all px-2 sm:px-6 transition-all duration-300 ${ayahFontClass} ${theme.ayahText}`}>
                      <span className={`font-bold ml-2 ${theme.brackets}`}>﴿</span>
                      {currentAyah.textUthmani}
                      <span className={`font-bold mr-2 ${theme.brackets}`}>﴾</span>
                      <span className={`inline-block mr-3 px-2.5 py-0.5 rounded-full font-mono text-sm sm:text-base font-bold align-middle border ${theme.numBadge}`}>
                        {currentAyah.numberInSurah}
                      </span>
                    </p>
                  </div>

                  {/* قسم التفسير الميسّر المعتمد المتوافق مع وضع القراءة المختار */}
                  <div className={`p-6 sm:p-8 rounded-3xl space-y-3 transition-colors duration-300 ${theme.tafsirBox}`}>
                    <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#046A38]" />
                        <h3 className={`font-bold text-sm sm:text-base font-serif ${theme.tafsirTitle}`}>
                          التفسير الميسّر
                        </h3>
                      </div>
                      <span className={`text-[11px] font-bold ${theme.tafsirMeta}`}>
                        مجمع الملك فهد لطباعة المصحف الشريف
                      </span>
                    </div>

                    <p className="text-sm sm:text-base leading-relaxed font-sans pt-1 opacity-90">
                      {currentAyah.tafsirText}
                    </p>
                  </div>

                  {/* شريط التنقل بين الآية السابقة والتالية */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrevAyah}
                      disabled={currentSurahNumber === 1 && currentAyahNumber === 1}
                      className={`px-4 sm:px-6 py-3 rounded-2xl disabled:opacity-40 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${theme.navButton}`}
                    >
                      <ChevronRight className="w-4 h-4 text-[#046A38]" />
                      <span>الآية السابقة</span>
                    </button>

                    <div className={`text-xs font-mono hidden sm:block ${theme.muted}`}>
                      آية {currentAyahNumber} من {surahData.totalAyahs}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextAyah}
                      disabled={currentSurahNumber === 114 && currentAyahNumber === surahData.totalAyahs}
                      className={`px-4 sm:px-6 py-3 rounded-2xl disabled:opacity-40 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${theme.navNextButton}`}
                    >
                      <span>الآية التالية</span>
                      <ChevronLeft className="w-4 h-4 text-[#C5A059]" />
                    </button>
                  </div>
                </div>

                {/* شريط سريع لعرض آيات السورة واختيار أي آية بالضغط عليها */}
                <div className={`p-5 rounded-3xl border shadow-xs space-y-3 transition-colors duration-300 ${theme.card}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold text-xs sm:text-sm flex items-center gap-2 ${theme.tafsirTitle}`}>
                      <Compass className="w-4 h-4 text-[#C5A059]" />
                      <span>الانتقال السريع لآيات سورة {surahData.name} ({surahData.totalAyahs} آية):</span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap max-h-40 overflow-y-auto p-1">
                    {surahData.ayahs.map((ayah) => {
                      const isCur = ayah.numberInSurah === currentAyahNumber;
                      return (
                        <button
                          key={ayah.numberInSurah}
                          onClick={() => {
                            setCurrentAyahNumber(ayah.numberInSurah);
                            if (readerTopRef.current) {
                              readerTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isCur
                              ? theme.quickAyahActive
                              : theme.quickAyahInactive
                          }`}
                          title={`الآية ${ayah.numberInSurah}`}
                        >
                          {ayah.numberInSurah}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. توثيق وحقوق المصدر المعتمد (مجمع الملك فهد)           */}
        {/* ======================================================== */}
        <div className={`p-6 rounded-3xl border shadow-xs space-y-3 text-xs leading-relaxed transition-colors duration-300 ${theme.card}`}>
          <div className="flex items-center gap-2 text-[#046A38] font-bold">
            <Info className="w-4 h-4 text-[#C5A059]" />
            <h4 className="font-serif text-sm">بيان المصدر الرسمي والأمانة العلمية:</h4>
          </div>
          <p className={theme.label}>
            تعتمد <strong>مقرأة رحاب القرآن الإلكترونية</strong> نص كتاب <strong>«التفسير الميسّر»</strong> الصادر عن <strong>{TAFSIR_SOURCE_METADATA.publisher}</strong> بالمدينة المنورة بالمملكة العربية السعودية، بإشراف نخبة من كبار العلماء والمتخصصين في التفسير وعلوم القرآن.
          </p>
          <p className={`text-[11px] ${theme.muted}`}>
            {TAFSIR_SOURCE_METADATA.accreditationNote} — {TAFSIR_SOURCE_METADATA.copyrightNotice}.
          </p>
        </div>

      </div>

      {/* زر التبديل العائم السريع لوضع القراءة الليلي أثناء المراجعة الطويلة */}
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
