/**
 * StudentResourcesLibrary.tsx
 * قسم «مكتبة المصادر» في بوابة الطالب
 * يوفر وصولاً سريعاً لمقاطع فيديو توضيحية مختارة وقواعد تجويد مسجلة مسبقاً بجانب الدروس المباشرة
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Video, 
  Volume2, 
  FileText, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  ExternalLink, 
  Download, 
  Sparkles, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle2, 
  X, 
  RotateCcw,
  Headphones,
  Calendar,
  Layers,
  HelpCircle,
  Bookmark
} from 'lucide-react';
import { 
  STUDENT_RESOURCES_DATA, 
  StudentResourceItem, 
  RESOURCE_CATEGORIES, 
  RESOURCE_SUBJECTS 
} from '../../data/studentResourcesData';
import { LazyVideoPlayer } from '../common/LazyVideoPlayer';

interface StudentResourcesLibraryProps {
  googleMeetUrl?: string | null;
  halqaSchedule?: string | null;
  teacherName?: string | null;
  onOpenLiveMeet?: () => void;
  isCompactDashboardWidget?: boolean;
  onOpenFullLibrary?: () => void;
}

export const StudentResourcesLibrary: React.FC<StudentResourcesLibraryProps> = ({
  googleMeetUrl,
  halqaSchedule,
  teacherName,
  onOpenLiveMeet,
  isCompactDashboardWidget = false,
  onOpenFullLibrary
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('جميع الموضوعات');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Media Modal State
  const [activeResource, setActiveResource] = useState<StudentResourceItem | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return STUDENT_RESOURCES_DATA.filter((item) => {
      // Filter by category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Filter by subject
      if (selectedSubject !== 'جميع الموضوعات' && item.subject !== selectedSubject) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = item.title.toLowerCase().includes(q);
        const inSubtitle = item.subtitle?.toLowerCase().includes(q);
        const inDesc = item.description?.toLowerCase().includes(q);
        const inSpeaker = item.speaker?.toLowerCase().includes(q);
        if (!inTitle && !inSubtitle && !inDesc && !inSpeaker) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, selectedSubject, searchQuery]);

  const recommendedForLive = useMemo(() => {
    return STUDENT_RESOURCES_DATA.filter(item => item.isRecommendedBeforeLive);
  }, []);

  const handleOpenResource = (res: StudentResourceItem) => {
    setActiveResource(res);
    setIsPlayingAudio(false);
  };

  const toggleModalAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.error(err));
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubject('جميع الموضوعات');
    setSearchQuery('');
  };

  // ========================================================
  // 1. الويدجت المدمج للوحة التحكم الرئيسية (Compact Widget)
  // ========================================================
  if (isCompactDashboardWidget) {
    return (
      <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-sm overflow-hidden animate-fade-in text-right" dir="rtl">
        <div className="bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-[#C5A059] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                مكتبة المصادر
              </span>
              <span className="text-xs text-emerald-200">تحضير سريع قبل الحلقة المباشرة</span>
            </div>
            <h4 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-[#C5A059]" />
              <span>فيديوهات توضيحية وقواعد تجويد مسجلة</span>
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {googleMeetUrl && (
              <a
                href={googleMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>الحلقة المباشرة ↗</span>
              </a>
            )}

            {onOpenFullLibrary && (
              <button
                type="button"
                onClick={onOpenFullLibrary}
                className="px-3.5 py-2 bg-white text-[#046A38] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 border border-[#C5A059]"
              >
                <span>المكتبة الكاملة ←</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Featured Quick Cards */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendedForLive.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenResource(item)}
                className="p-3.5 bg-[#F9F6F0] hover:bg-[#f2ece2] rounded-2xl border border-[#C5A059]/30 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 hover:shadow-xs group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#046A38] bg-white px-2 py-0.5 rounded-md border border-[#C5A059]/30 flex items-center gap-1">
                      {item.category === 'video' ? <Video className="w-3 h-3 text-rose-600" /> : <Volume2 className="w-3 h-3 text-[#046A38]" />}
                      <span>{item.categoryLabel}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.durationLabel}</span>
                  </div>

                  <h5 className="font-bold text-xs text-slate-900 font-serif line-clamp-2 group-hover:text-[#046A38] transition-colors leading-snug">
                    {item.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{item.speaker}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/20 text-[11px] text-[#046A38] font-bold">
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" />
                    <span>{item.category === 'video' ? 'مشاهدة المقطع' : 'استماع للقاعدة'}</span>
                  </span>
                  <span className="text-slate-400">←</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal if clicked from compact widget */}
        {activeResource && renderModal()}
      </div>
    );
  }

  // ========================================================
  // 2. العرض الكامل لمكتبة المصادر (Full Library View)
  // ========================================================
  function renderModal() {
    if (!activeResource) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in max-h-[92vh] overflow-y-auto text-right" dir="rtl">
          
          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-[#C5A059] text-white px-2.5 py-0.5 rounded-md">
                  {activeResource.categoryLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  المادة: {activeResource.subject}
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-[#046A38] font-serif leading-snug">
                {activeResource.title}
              </h3>
              <p className="text-xs text-slate-500">
                إشراف وتقديم: {activeResource.speaker} • المدة: {activeResource.durationLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (audioPlayerRef.current) audioPlayerRef.current.pause();
                setIsPlayingAudio(false);
                setActiveResource(null);
              }}
              className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Player (Lazy Loaded on User Tap) */}
          {activeResource.category === 'video' && (activeResource.videoUrl || activeResource.youtubeVideoId) && (
            <div className="space-y-2">
              <LazyVideoPlayer
                videoId={activeResource.youtubeVideoId}
                videoUrl={activeResource.videoUrl}
                title={activeResource.title}
                speaker={activeResource.speaker}
                badgeText="سلسلة التجويد المصور"
              />
            </div>
          )}

          {/* Audio Player */}
          {activeResource.audioUrl && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Volume2 className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block text-sm">
                    {activeResource.audioTitle || 'التسجيل الصوتي للقاعدة التجويدية'}
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    بصوت: {activeResource.speaker} (تلاوة محققة بالرواية المعتمدة)
                  </span>
                </div>
              </div>

              <audio 
                ref={audioPlayerRef} 
                src={activeResource.audioUrl} 
                onEnded={() => setIsPlayingAudio(false)} 
              />

              <button
                type="button"
                onClick={toggleModalAudio}
                className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingAudio ? 'إيقاف التشغيل' : 'تشغيل التسجيل الصوتي'}</span>
              </button>
            </div>
          )}

          {/* Description & Key Takeaways */}
          <div className="space-y-3 text-xs text-slate-700">
            <div>
              <h5 className="font-bold text-slate-900 font-serif mb-1">بيان القاعدة والشرح:</h5>
              <p className="leading-relaxed bg-[#F9F6F0] p-3.5 rounded-2xl border border-[#C5A059]/30 font-sans">
                {activeResource.description}
              </p>
            </div>

            {activeResource.keyPoints && activeResource.keyPoints.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 font-serif">النقاط الجوهرية للضبط قبل التسميع المباشر:</h5>
                <ul className="space-y-1 pr-2">
                  {activeResource.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#046A38] mt-1.5 shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions: PDF Download + Live Meet Link */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeResource.pdfUrl && (
                <a
                  href={activeResource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#046A38]" />
                  <span>تنزيل ملخص PDF</span>
                </a>
              )}

              {googleMeetUrl && (
                <a
                  href={googleMeetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-[#C5A059]"
                >
                  <span>الانتقال للحلقة المباشرة ↗</span>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (audioPlayerRef.current) audioPlayerRef.current.pause();
                setIsPlayingAudio(false);
                setActiveResource(null);
              }}
              className="w-full sm:w-auto px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Header Banner with Live Halqa Integration */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] rounded-3xl p-6 sm:p-7 text-white border-2 border-[#C5A059] shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-[#C5A059] font-bold border border-[#C5A059]/40 backdrop-blur-xs">
              <BookOpen className="w-4 h-4 text-[#C5A059]" />
              <span>مكتبة المصادر والوسائط التعليمية</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-white">
              مكتبة المصادر وقواعد التجويد المسجلة
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed font-sans">
              مقاطع فيديو توضيحية مختارة، شروحات مسجلة لمخارج الحروف وأحكام التلاوة، وملخصات PDF جاهزة للمطالعة الذاتية بجانب جلسات التسميع المباشرة مع شيوخ المقرأة.
            </p>
          </div>

          {/* Live Halqa Companion Box */}
          <div className="p-4 rounded-2xl bg-black/30 border border-[#C5A059]/50 backdrop-blur-xs text-center min-w-[220px] shrink-0 space-y-2.5">
            <span className="text-[11px] text-emerald-200 block font-bold">
              جلسة الحلقة المباشرة (Google Meet)
            </span>

            {googleMeetUrl ? (
              <a
                href={googleMeetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-[#C5A059]"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>دخول حلقة Google Meet ↗</span>
              </a>
            ) : (
              <div className="p-2 bg-white/10 rounded-xl text-center text-xs text-white/80">
                <span className="block font-bold">الموعد: {halqaSchedule || 'توقيت الحلقة'}</span>
                <span className="text-[10px] text-emerald-200">الشيخ: {teacherName || 'الشيخ المعيّن'}</span>
              </div>
            )}

            <p className="text-[10px] text-emerald-200/80 font-sans">
              راجع قواعد التجويد قبل بدء جلستك المباشرة
            </p>
          </div>
        </div>
      </div>

      {/* 2. Strip: Recommended Quick Prep Before Live Lesson */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
              مصادر موصى بمطالعتها قبل الجلسة المباشرة
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">تحضير سريع (5 - 15 دقيقة)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recommendedForLive.slice(0, 3).map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenResource(item)}
              className="p-3.5 bg-[#F9F6F0] hover:bg-[#f3ece0] rounded-2xl border border-[#C5A059]/40 transition-all cursor-pointer flex flex-col justify-between space-y-2 group"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#046A38] bg-white px-2 py-0.5 rounded-md border border-[#C5A059]/30">
                    {item.categoryLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{item.durationLabel}</span>
                </div>
                <h5 className="font-bold text-xs text-slate-900 font-serif line-clamp-2 group-hover:text-[#046A38] transition-colors">
                  {item.title}
                </h5>
                <span className="text-[10px] text-slate-500 block">{item.speaker}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#C5A059]/20 text-[11px] text-[#046A38] font-bold">
                <span>فتح ومطالعة</span>
                <span>←</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#046A38]" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
              تصفية مكتبة المصادر
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {(selectedCategory !== 'all' || selectedSubject !== 'جميع الموضوعات' || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-[#C5A059]" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Tabs / Select */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">نوع المصدر:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#046A38] cursor-pointer"
            >
              {RESOURCE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">المادة / الموضوع:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#046A38] cursor-pointer"
            >
              {RESOURCE_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">بحث سريع:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان أو الشيخ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Resources Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold">
            عدد المصادر المتاحة: <strong className="text-[#046A38] font-mono">{filteredResources.length}</strong> من أصل {STUDENT_RESOURCES_DATA.length} مصدر
          </span>
          <span className="text-[11px] text-slate-400">
            انقر على أي بطاقة لعرض الفيديو أو الاستماع للتسجيل
          </span>
        </div>

        {filteredResources.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <h5 className="font-bold text-sm text-slate-800">لا توجد مصادر تطابق هذا البحث</h5>
            <p className="text-xs text-slate-500">جرب اختيار فئة أخرى أو إعادة ضبط الفلاتر.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((item) => {
              const isVideo = item.category === 'video';
              const isAudio = item.category === 'audio_rule';

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenResource(item)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-[#C5A059] transition-all p-4 flex flex-col justify-between space-y-3 cursor-pointer shadow-2xs hover:shadow-xs group"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isVideo 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                          : isAudio 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {isVideo && <Video className="w-3 h-3 text-rose-600" />}
                        {isAudio && <Volume2 className="w-3 h-3 text-emerald-600" />}
                        <span>{item.categoryLabel}</span>
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.durationLabel}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 font-serif leading-snug group-hover:text-[#046A38] transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.speaker}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#046A38]">
                    <span className="flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isVideo ? 'مشاهدة الفيديو' : isAudio ? 'استماع للقاعدة' : 'فتح الملف'}</span>
                    </span>
                    <span className="text-slate-400 group-hover:translate-x-[-2px] transition-transform">←</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render Active Modal */}
      {renderModal()}
    </div>
  );
};
