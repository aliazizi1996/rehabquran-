/**
 * DigitalQuranLibrary - مكتبة المصاحف الرقمية عالية الدقة
 * مقرأة رحاب القرآن الإلكترونية
 * 
 * المزايا:
 * 1. عرض صفحات مصحف المدينة النبوية الشريف (مجمع الملك فهد) بدقة فائقة تصل إلى 1920px.
 * 2. إمكانية التكبير والتصغير المتدرج (Zoom 50% - 250%) مع دعم السحب والتحريك (Pan/Drag).
 * 3. فهرس شامل لـ 114 سورة و 30 جزءاً مع الانتقال المباشر.
 * 4. نظام الفواصل الذكية (Bookmarks) وحفظ آخر موضع قراءة تلقائياً للطالب.
 * 5. أوضاع القراءة المتعددة: الكلاسيكي، الليلي المريح، والدافئ (Sepia).
 * 6. وضع التحفيظ والاستذكار الذاتي (إخفاء الصفحة للتحقق من الحفظ).
 * 7. ملء الشاشة (Fullscreen) والتنقل السريع بأسهم لوحة المفاتيح.
 * 8. التحميل المسبق التلقائي للصفحات المجاورة لتصفح فوري وسلس.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, 
  ChevronRight, ChevronLeft, Bookmark, BookmarkCheck, Search, 
  Moon, Sun, Eye, EyeOff, Layers, Download, Share2, Sparkles, 
  Volume2, Compass, Check, X, Sliders, ArrowRight
} from 'lucide-react';
import { ALL_114_SURAHS, ALL_30_JUZ, AcademicSurahMeta, AcademicJuzMeta } from '../../data/quranAcademicData';

export interface QuranBookmark {
  id: string;
  page: number;
  surahName: string;
  juzNumber: number;
  note: string;
  createdAt: string;
}

interface DigitalQuranLibraryProps {
  initialPage?: number;
  onOpenAudioPlayer?: (surahNumber: number) => void;
  onOpenTafsir?: (surahNumber: number, page: number) => void;
  studentName?: string;
}

const LOCAL_STORAGE_LAST_PAGE_KEY = 'rehab_quran_last_read_page_v1';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'rehab_quran_mushaf_bookmarks_v1';

export const DigitalQuranLibrary: React.FC<DigitalQuranLibraryProps> = ({
  initialPage,
  onOpenAudioPlayer,
  onOpenTafsir,
  studentName
}) => {
  // Page number state (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialPage && initialPage >= 1 && initialPage <= 604) return initialPage;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_LAST_PAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 604) return parsed;
      }
    }
    return 1;
  });

  // Zoom level (0.6 to 2.5)
  const [zoom, setZoom] = useState<number>(1.0);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Reading modes & UI toggles
  const [themeMode, setThemeMode] = useState<'classic' | 'night' | 'sepia'>('classic');
  const [isMemorizationCoverActive, setIsMemorizationCoverActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageResolution, setImageResolution] = useState<'1920' | '1260'>('1920');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Modals & Panels
  const [isIndexModalOpen, setIsIndexModalOpen] = useState(false);
  const [indexTab, setIndexTab] = useState<'surahs' | 'juzs' | 'bookmarks'>('surahs');
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  const [jumpPageInput, setJumpPageInput] = useState(String(currentPage));

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [newBookmarkNote, setNewBookmarkNote] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save last read page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_LAST_PAGE_KEY, String(currentPage));
    }
    setJumpPageInput(String(currentPage));
    setImageError(false);
    setIsPageLoading(true);
  }, [currentPage]);

  // Current page metadata
  const currentSurahs = ALL_114_SURAHS.filter(
    (s) => currentPage >= s.startPage && currentPage <= s.endPage
  );
  const primarySurah = currentSurahs[0] || ALL_114_SURAHS[0];

  const currentJuz = ALL_30_JUZ.find(
    (j) => currentPage >= j.startPage && currentPage <= j.endPage
  ) || ALL_30_JUZ[0];

  // Calculate Hizb and Rub (Approx 8 quarters per Juz)
  const currentHizb = (currentJuz.number - 1) * 2 + (currentPage > (currentJuz.startPage + 10) ? 2 : 1);

  // Generate CDN URL for Quran Page
  const getQuranPageUrl = (page: number, res: '1920' | '1260' = '1920'): string => {
    const pad = String(page).padStart(3, '0');
    return `https://files.quran.app/hafs/madani/width_${res}/page${pad}.png`;
  };

  // Preload adjacent pages for seamless reading
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentPage < 604) {
      const nextImg = new Image();
      nextImg.src = getQuranPageUrl(currentPage + 1, imageResolution);
    }
    if (currentPage > 1) {
      const prevImg = new Image();
      prevImg.src = getQuranPageUrl(currentPage - 1, imageResolution);
    }
  }, [currentPage, imageResolution]);

  // Navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < 604) {
      setCurrentPage((prev) => prev + 1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      showToast('أنت في خاتمة المصحف الشريف (صفحة 604)');
    }
  }, [currentPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setPanPosition({ x: 0, y: 0 });
    } else {
      showToast('أنت في فاتحة المصحف الشريف (صفحة 1)');
    }
  }, [currentPage]);

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(604, page));
    setCurrentPage(clamped);
    setPanPosition({ x: 0, y: 0 });
    setIsIndexModalOpen(false);
  };

  // Keyboard navigation (ArrowLeft = Next page in Arabic RTL Mushaf, ArrowRight = Previous page)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        goToNextPage();
      } else if (e.key === 'ArrowRight') {
        goToPrevPage();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)));
      } else if (e.key === '0') {
        setZoom(1.0);
        setPanPosition({ x: 0, y: 0 });
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(0.6, +(z - 0.15).toFixed(2));
      if (next <= 1.0) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleFitWidth = () => {
    setZoom(1.4);
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan / Drag handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1.0) return;
    setPanPosition({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Bookmarks management
  const isCurrentPageBookmarked = bookmarks.some((b) => b.page === currentPage);

  const handleToggleBookmark = () => {
    if (isCurrentPageBookmarked) {
      const updated = bookmarks.filter((b) => b.page !== currentPage);
      setBookmarks(updated);
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
      showToast(`تم حذف الفاصل من الصفحة ${currentPage}`);
    } else {
      setIsAddingBookmark(true);
    }
  };

  const handleSaveNewBookmark = () => {
    const newB: QuranBookmark = {
      id: 'bm_' + Date.now(),
      page: currentPage,
      surahName: primarySurah.name,
      juzNumber: currentJuz.number,
      note: newBookmarkNote.trim() || `موضع قراءة سورة ${primarySurah.name}`,
      createdAt: new Date().toLocaleDateString('ar-SA')
    };
    const updated = [newB, ...bookmarks.filter((b) => b.page !== currentPage)];
    setBookmarks(updated);
    localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
    setNewBookmarkNote('');
    setIsAddingBookmark(false);
    showToast(`تم حفظ الفاصل في الصفحة ${currentPage} بنجاح ✓`);
  };

  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
    showToast('تمت إزالة الفاصل');
  };

  // Filtered Surahs for Index
  const filteredSurahs = ALL_114_SURAHS.filter((s) => {
    if (!surahSearchQuery.trim()) return true;
    const q = surahSearchQuery.trim().toLowerCase();
    return s.name.includes(q) || String(s.number) === q;
  });

  return (
    <div 
      ref={containerRef}
      className={`rounded-3xl shadow-xl border-2 transition-colors relative flex flex-col overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'w-full'
      } ${
        themeMode === 'night' 
          ? 'bg-slate-950 border-emerald-900/60 text-slate-100' 
          : themeMode === 'sepia'
            ? 'bg-[#f5ebd7] border-[#C5A059] text-stone-900'
            : 'bg-white border-[#C5A059]/40 text-[#2C3531]'
      }`}
      dir="rtl"
    >
      {/* 1. Header Toolbar (الهوية والعناوين الرسمية وأدوات المصحف) */}
      <div className={`p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        themeMode === 'night'
          ? 'bg-slate-900/90 border-emerald-950'
          : themeMode === 'sepia'
            ? 'bg-[#ede2c8] border-[#C5A059]/60'
            : 'bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] text-white border-[#C5A059]'
      }`}>
        {/* Left / Start Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-[#C5A059]/40 flex items-center justify-center shrink-0 shadow-inner">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#C5A059]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C5A059] text-slate-950 font-kufi">
                مصحف المدينة النبوية الشريف
              </span>
              <span className={`text-xs font-semibold ${themeMode === 'night' ? 'text-emerald-400' : 'text-emerald-100'}`}>
                برواية حفص عن عاصم
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold font-amiri flex items-center gap-2 mt-0.5">
              <span>سُورَةُ {primarySurah.name}</span>
              <span className="text-xs font-sans text-amber-300 font-normal">
                ({primarySurah.type} • {primarySurah.totalAyahs} آية)
              </span>
            </h2>
          </div>
        </div>

        {/* Center / Navigation Pill */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/10 text-xs font-kufi">
          <button
            onClick={() => {
              setIsIndexModalOpen(true);
              setIndexTab('surahs');
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold cursor-pointer flex items-center gap-1.5"
            title="فهرس السور والأجزاء"
          >
            <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>الفهرس والأجزاء</span>
          </button>

          <span className="text-white/40">•</span>

          <span className="px-2 font-bold text-amber-300 font-sans">
            الجزء {currentJuz.number} • الحزب {currentHizb}
          </span>
        </div>

        {/* Right / Quick Action Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Controls */}
          <div className="flex items-center bg-black/30 rounded-xl p-1 border border-white/15">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer text-white"
              title="تكبير الصفحة (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-sans font-bold px-1.5 min-w-[36px] text-center text-amber-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer text-white"
              title="تصغير الصفحة (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer text-white border-r border-white/15 pr-1.5 mr-0.5"
              title="إعادة ضبط الحجم (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Toggle (Classic / Night / Sepia) */}
          <button
            onClick={() => {
              setThemeMode(prev => prev === 'classic' ? 'night' : prev === 'night' ? 'sepia' : 'classic');
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white border border-white/15"
            title={`تبديل مظهر القراءة: ${themeMode === 'classic' ? 'كلاسيكي' : themeMode === 'night' ? 'ليلي' : 'دافئ'}`}
          >
            {themeMode === 'night' ? (
              <Moon className="w-4 h-4 text-indigo-300" />
            ) : themeMode === 'sepia' ? (
              <Layers className="w-4 h-4 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>

          {/* Memorization Cover Tool (إخفاء الصفحة للاختبار) */}
          <button
            onClick={() => setIsMemorizationCoverActive(!isMemorizationCoverActive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-kufi flex items-center gap-1.5 transition cursor-pointer border ${
              isMemorizationCoverActive
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="وضع التحفيظ والاستذكار: تغطية الصفحة لاختبار الحفظ الذاتي"
          >
            {isMemorizationCoverActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isMemorizationCoverActive ? 'كشف الوجه' : 'وضع التحفيظ'}
            </span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl transition cursor-pointer border ${
              isCurrentPageBookmarked
                ? 'bg-[#C5A059] text-slate-950 border-amber-300 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title={isCurrentPageBookmarked ? 'الصفحة محفوظة بفاصل (انقر للحذف)' : 'إضافة فاصل قراءة لهذه الصفحة'}
          >
            {isCurrentPageBookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Resolution Selector (1920 Ultra-HD / 1260 Standard) */}
          <button
            onClick={() => setImageResolution(r => r === '1920' ? '1260' : '1920')}
            className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-sans font-bold text-white border border-white/15 cursor-pointer"
            title="تبديل دقة وضوح الصفحة"
          >
            {imageResolution === '1920' ? 'UHD 1920' : 'HD 1260'}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white border border-white/15"
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة للتلاوة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Navigation Bar (التنقل بين الصفحات والقفز السريع) */}
      <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-kufi ${
        themeMode === 'night' 
          ? 'bg-slate-900 border-slate-800' 
          : themeMode === 'sepia' 
            ? 'bg-[#eee1c4] border-[#C5A059]/40' 
            : 'bg-[#F9F6F0] border-amber-200/80'
      }`}>
        {/* Previous Page (يمين في العربية) */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#058043] disabled:opacity-40 disabled:hover:bg-[#046A38] text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="الصفحة السابقة (سهم يمين)"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابقة</span>
          </button>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= 604}
            className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#058043] disabled:opacity-40 disabled:hover:bg-[#046A38] text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
            title="الصفحة التالية (سهم يسار)"
          >
            <span>التالية</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Page Slider & Direct Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md justify-center">
          <span className="text-[11px] font-bold text-slate-500 font-sans hidden sm:inline">1</span>
          <input
            type="range"
            min="1"
            max="604"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value, 10))}
            className="w-full accent-[#046A38] cursor-pointer h-2 bg-slate-300 dark:bg-slate-700 rounded-lg"
          />
          <span className="text-[11px] font-bold text-slate-500 font-sans hidden sm:inline">604</span>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const p = parseInt(jumpPageInput, 10);
              if (!isNaN(p)) goToPage(p);
            }}
            className="flex items-center gap-1 shrink-0"
          >
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">صفحة:</span>
            <input
              type="number"
              min="1"
              max="604"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-14 px-1.5 py-1 text-center font-bold font-sans rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:border-[#046A38]"
            />
          </form>
        </div>

        {/* Auxiliary Links (Audio / Tafsir) */}
        <div className="flex items-center gap-2">
          {onOpenAudioPlayer && (
            <button
              onClick={() => onOpenAudioPlayer(primarySurah.number)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-[#916b1e] hover:bg-amber-500/25 border border-amber-500/30 font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="الاستماع لتلاوة السورة"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">استمع للسورة</span>
            </button>
          )}

          {onOpenTafsir && (
            <button
              onClick={() => onOpenTafsir(primarySurah.number, currentPage)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-[#046A38] hover:bg-emerald-500/25 border border-emerald-500/30 font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="تفسير آيات الصفحة"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#046A38]" />
              <span className="hidden sm:inline">التفسير الميسر</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Mushaf Page Display Canvas (شاشة عرض صفحة المصحف عالية الدقة) */}
      <div 
        className={`relative flex-1 overflow-auto flex items-center justify-center min-h-[550px] sm:min-h-[720px] p-2 sm:p-6 ${
          themeMode === 'night' 
            ? 'bg-slate-950' 
            : themeMode === 'sepia' 
              ? 'bg-[#f4ebd6]' 
              : 'bg-[#EDE8DE]'
        } ${zoom > 1.0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Decorative Mushaf Frame Borders */}
        <div 
          className="transition-transform duration-100 ease-out flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${panPosition.x / zoom}px, ${panPosition.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          <div className={`relative rounded-2xl shadow-2xl overflow-hidden border-4 sm:border-8 transition-colors ${
            themeMode === 'night'
              ? 'border-emerald-950 bg-slate-900 shadow-emerald-950/50'
              : themeMode === 'sepia'
                ? 'border-[#C5A059] bg-[#faf4e6] shadow-amber-950/30'
                : 'border-[#C5A059] bg-white shadow-stone-900/40 ring-1 ring-[#C5A059]/40'
          }`}>
            {/* Loading Indicator */}
            {isPageLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-white">
                <div className="w-12 h-12 rounded-full border-4 border-[#C5A059] border-t-transparent animate-spin mb-3"></div>
                <p className="text-xs font-bold font-kufi">جاري تصيير صفحة المصحف عالي الدقة...</p>
                <span className="text-[11px] text-amber-200 mt-1 font-sans">صفحة {currentPage} من 604</span>
              </div>
            )}

            {/* Error Fallback */}
            {imageError && (
              <div className="p-12 text-center max-w-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <X className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">تعذر تحميل صفحة المصحف</h3>
                <p className="text-xs text-slate-500">
                  يرجى التحقق من اتصال الإنترنت، أو الانتقال لدقة العرض العادية HD.
                </p>
                <button
                  onClick={() => {
                    setImageError(false);
                    setImageResolution('1260');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#046A38] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  إعادة المحاولة بدقة 1260px
                </button>
              </div>
            )}

            {/* High-Resolution Quran Page Image */}
            <img
              ref={imageRef}
              src={getQuranPageUrl(currentPage, imageResolution)}
              alt={`صفحة المصحف الشريف رقم ${currentPage} - سورة ${primarySurah.name}`}
              className={`max-w-[90vw] sm:max-w-[680px] max-h-[82vh] object-contain block transition-opacity duration-200 pointer-events-none select-none ${
                isPageLoading ? 'opacity-40' : 'opacity-100'
              } ${
                themeMode === 'night' 
                  ? 'filter invert hue-rotate-180 brightness-90 contrast-125' 
                  : themeMode === 'sepia' 
                    ? 'filter sepia-[0.35] contrast-105' 
                    : ''
              }`}
              onLoad={() => setIsPageLoading(false)}
              onError={() => {
                if (imageResolution === '1920') {
                  setImageResolution('1260');
                } else {
                  setIsPageLoading(false);
                  setImageError(true);
                }
              }}
            />

            {/* Memorization Cover Layer (قناع الحفظ الذاتي) */}
            {isMemorizationCoverActive && (
              <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-[#046A38] border-2 border-[#C5A059] flex items-center justify-center text-[#C5A059] shadow-xl">
                  <EyeOff className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    وضع الاستذكار والتسميع الغيبي
                  </span>
                  <h3 className="text-xl font-bold font-amiri text-white mt-1">
                    صفحة {currentPage} مستورة للاختبار
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-kufi">
                    اتلُ الآيات غيباً من صدرك، وعند الانتهاء انقر على الزر أدناه للتحقق من سلامة الحفظ والضبط.
                  </p>
                </div>
                <button
                  onClick={() => setIsMemorizationCoverActive(false)}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs font-kufi shadow-xl cursor-pointer active:scale-95 transition-all"
                >
                  كشف الصفحة والتأكد من الحفظ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Info Bar (رقم الصفحة والورد اليومي) */}
      <div className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-kufi ${
        themeMode === 'night'
          ? 'bg-slate-900 border-slate-800 text-slate-300'
          : themeMode === 'sepia'
            ? 'bg-[#ede2c8] border-[#C5A059]/40 text-stone-800'
            : 'bg-white border-[#C5A059]/30 text-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#046A38] dark:text-emerald-400 font-sans">
            الصفحة {currentPage} من 604
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {currentSurahs.map(s => s.name).join(' / ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            استخدم أسهم لوحة المفاتيح (⟵ / ⟶) للتنقل السريع بين الأوجه
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-950/90 text-[#F9F6F0] border-2 border-[#C5A059] text-xs font-bold font-kufi shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5. Index & Bookmarks Modal (نافذة الفهرس الشامل والأجزاء والفواصل) */}
      {isIndexModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#C5A059] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] text-white flex items-center justify-between border-b border-[#C5A059]">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#C5A059]" />
                <h3 className="font-bold text-base font-amiri">فهرس المصحف الشريف والفواصل</h3>
              </div>
              <button
                onClick={() => setIsIndexModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold font-kufi">
              <button
                onClick={() => setIndexTab('surahs')}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  indexTab === 'surahs'
                    ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                فهرس السور (114 سورة)
              </button>
              <button
                onClick={() => setIndexTab('juzs')}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  indexTab === 'juzs'
                    ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                الأجزاء والأحزاب (30 جزء)
              </button>
              <button
                onClick={() => setIndexTab('bookmarks')}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  indexTab === 'bookmarks'
                    ? 'border-[#046A38] text-[#046A38] dark:text-emerald-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                فواصل القراءة ({bookmarks.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* SURAHS TAB */}
              {indexTab === 'surahs' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث باسم السورة (مثلاً: الكهف، البقرة) أو رقمها..."
                      value={surahSearchQuery}
                      onChange={(e) => setSurahSearchQuery(e.target.value)}
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#046A38]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredSurahs.map((surah) => (
                      <button
                        key={surah.number}
                        onClick={() => goToPage(surah.startPage)}
                        className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                          currentPage >= surah.startPage && currentPage <= surah.endPage
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#046A38] text-[#046A38] dark:text-emerald-300 shadow-sm'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-[#C5A059]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-sans text-xs flex items-center justify-center shrink-0">
                            {surah.number}
                          </span>
                          <div>
                            <div className="font-bold text-sm font-amiri">سورة {surah.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                              {surah.type} • {surah.totalAyahs} آية
                            </div>
                          </div>
                        </div>

                        <div className="text-left font-sans">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                            ص {surah.startPage}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            جزء {surah.startJuz}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* JUZS TAB */}
              {indexTab === 'juzs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
                  {ALL_30_JUZ.map((juz) => (
                    <button
                      key={juz.number}
                      onClick={() => goToPage(juz.startPage)}
                      className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                        currentJuz.number === juz.number
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#046A38] text-[#046A38] dark:text-emerald-300 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-[#C5A059]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-[#046A38] text-white font-bold font-sans text-xs flex items-center justify-center shrink-0">
                          {juz.number}
                        </span>
                        <div>
                          <div className="font-bold text-sm font-kufi">الجزء {juz.number}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            يبدأ من: {juz.startSurahName}
                          </div>
                        </div>
                      </div>

                      <div className="text-left font-sans">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          الصفحات {juz.startPage} - {juz.endPage}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* BOOKMARKS TAB */}
              {indexTab === 'bookmarks' && (
                <div className="space-y-3">
                  {bookmarks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                      <Bookmark className="w-10 h-10 mx-auto text-amber-400/40" />
                      <p className="font-bold text-sm">لا توجد فواصل قراءة محفوظة حالياً</p>
                      <p className="text-xs">
                        اضغط على أيقونة (الفاصل) في شريط الأدوات العلوي لحفظ أي صفحة والرجوع إليها مباشرة.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                      {bookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          onClick={() => goToPage(bm.page)}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#C5A059]/40 hover:border-[#C5A059] transition flex items-center justify-between cursor-pointer group shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0">
                              <BookmarkCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white font-amiri">
                                سورة {bm.surahName} (صفحة {bm.page})
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-kufi">
                                {bm.note} • الجزء {bm.juzNumber} • {bm.createdAt}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteBookmark(bm.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="حذف هذا الفاصل"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Bookmark Modal */}
      {isAddingBookmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#C5A059] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#C5A059]" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white font-amiri">
                إضافة فاصل قراءة للصفحة {currentPage}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-kufi">
              سورة {primarySurah.name} • الجزء {currentJuz.number}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 font-kufi">
                ملاحظة الفاصل (اختياري):
              </label>
              <input
                type="text"
                placeholder="مثلاً: ورد المراجعة اليومي، مقرر التسميع القادم..."
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#046A38]"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSaveNewBookmark}
                className="flex-1 py-2 rounded-xl bg-[#046A38] hover:bg-[#058043] text-white font-bold text-xs font-kufi shadow-md transition cursor-pointer"
              >
                تأكيد حفظ الفاصل
              </button>
              <button
                onClick={() => setIsAddingBookmark(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs font-kufi hover:bg-slate-200 transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
