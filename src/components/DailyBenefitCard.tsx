import React, { useState } from 'react';
import { 
  Sparkles, BookOpen, Quote, ChevronDown, ChevronUp, 
  Share2, Check, ExternalLink, Bookmark, MessageCircle
} from 'lucide-react';
import { DailyQuranBenefit, DAILY_BENEFITS, getTodayQuranBenefit } from '../data/dailyBenefitsData';

interface DailyBenefitCardProps {
  onNavigateToWird?: () => void;
  className?: string;
  variant?: 'banner' | 'card';
}

export const DailyBenefitCard: React.FC<DailyBenefitCardProps> = ({
  onNavigateToWird,
  className = '',
  variant = 'banner',
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const today = getTodayQuranBenefit();
    const foundIdx = DAILY_BENEFITS.findIndex((b) => b.id === today.id);
    return foundIdx >= 0 ? foundIdx : 0;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const benefit = DAILY_BENEFITS[currentIndex] || DAILY_BENEFITS[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DAILY_BENEFITS.length);
    setIsExpanded(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + DAILY_BENEFITS.length) % DAILY_BENEFITS.length);
    setIsExpanded(false);
  };

  const handleShareWhatsApp = () => {
    const message = `*فائدة اليوم من مقرأة رحاب القرآن الإلكترونية* 📖
━━━━━━━━━━━━━━━━━━━━
﴿ ${benefit.ayahText} ﴾
[${benefit.surahName} - آية ${benefit.ayahNumber} (الجزء ${benefit.juzNumber})]

📖 *التفسير المعين (${benefit.tafseerSource}):*
${benefit.tafseerSummary}

💡 *الفائدة والهداية الإيمانية:*
${benefit.keyTakeaway}
━━━━━━━━━━━━━━━━━━━━
مقرأة رحاب القرآن الإلكترونية - نحو إتقان كتاب الله تعالى بالسند المتصل`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopy = () => {
    const text = `﴿ ${benefit.ayahText} ﴾ [${benefit.surahName} : ${benefit.ayahNumber}]\nالتفسير: ${benefit.tafseerSummary}\nفائدة اليوم: ${benefit.keyTakeaway}\n(مقرأة رحاب القرآن الإلكترونية)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      id="daily-quran-benefit-banner"
      className={`rounded-2xl bg-gradient-to-r from-[#0d271c] via-[#123626] to-[#0a2016] border-2 border-amber-500/70 shadow-xl relative overflow-hidden transition-all duration-300 ${className}`}
      dir="rtl"
    >
      {/* Subtle background Islamic geometric accents */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Header Strip */}
      <div className="px-3.5 sm:px-4 py-2.5 bg-[#081811]/90 border-b border-amber-500/30 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
          <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs sm:text-sm font-serif">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>فائدة اليوم • آية وتفسير</span>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold hidden sm:inline-block">
            {benefit.categoryLabel}
          </span>
        </div>

        {/* Action Controls: Navigation & Share */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="px-2.5 py-1 rounded-lg bg-[#0c2419] hover:bg-[#123826] border border-emerald-700/60 text-xs font-bold text-emerald-200 transition-colors cursor-pointer"
            title="الفائدة السابقة"
          >
            ← السابق
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-2.5 py-1 rounded-lg bg-[#0c2419] hover:bg-[#123826] border border-emerald-700/60 text-xs font-bold text-emerald-200 transition-colors cursor-pointer"
            title="الفائدة التالية"
          >
            التالي →
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[#0c2419] hover:bg-[#153f2c] border border-emerald-700/50 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="نسخ نص الآية والفائدة"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4 text-amber-300" />}
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
            title="مشاركة الفائدة عبر الواتساب"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">واتساب</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Quranic Ayah Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#071710]/95 border border-emerald-800/80 relative text-center shadow-inner">
          <Quote className="w-5 h-5 text-amber-400/25 absolute top-2.5 right-2.5 rotate-180" />
          <Quote className="w-5 h-5 text-amber-400/25 absolute bottom-2.5 left-2.5" />

          <p className="font-quran text-lg sm:text-xl lg:text-2xl text-amber-200 leading-loose font-bold px-4 py-1 select-text">
            ﴿ {benefit.ayahText} ﴾
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2.5 text-xs sm:text-sm text-slate-300 flex-wrap font-medium">
            <span className="font-black text-white bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-700/60">
              {benefit.surahName}
            </span>
            <span className="text-emerald-300">الآية: <strong className="text-white font-bold">{benefit.ayahNumber}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-300">الجزء: <strong className="text-white font-bold">{benefit.juzNumber}</strong></span>
          </div>
        </div>

        {/* Tafseer & Benefit Content */}
        <div className="space-y-2.5">
          {/* Summary / Core Takeaway */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#0a1e15] border border-amber-500/30 flex items-start gap-3">
            <span className="text-amber-400 text-base mt-0.5 shrink-0">💡</span>
            <div className="flex-1 text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              <strong className="text-amber-300 font-black ml-1.5">الفائدة والهداية:</strong>
              <span>{benefit.keyTakeaway}</span>
            </div>
          </div>

          {/* Tafseer Details (Toggleable or Visible) */}
          {isExpanded ? (
            <div className="p-3.5 rounded-xl bg-[#06140e] border border-emerald-900/80 space-y-2 animate-fade-in text-xs sm:text-sm leading-relaxed">
              <div className="flex items-center justify-between text-slate-300 text-xs border-b border-emerald-900/60 pb-1.5">
                <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  بيان وتفسير الآية الكريمة:
                </span>
                <span className="text-amber-300 font-bold font-mono">
                  المصدر: {benefit.tafseerSource}
                </span>
              </div>
              <p className="text-slate-200 pt-1 text-xs sm:text-sm leading-relaxed font-medium">
                {benefit.tafseerSummary}
              </p>
            </div>
          ) : (
            <div className="px-1 flex items-center justify-between text-xs sm:text-sm text-slate-300">
              <p className="truncate max-w-[90%] text-xs sm:text-sm text-slate-300 font-medium">
                <strong className="text-emerald-300 font-bold">تفسير الآية ({benefit.tafseerSource}):</strong> {benefit.tafseerSummary}
              </p>
            </div>
          )}

          {/* Bottom Bar: Expand Tafseer & Go to Wird */}
          <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-amber-300 hover:text-amber-200 font-black flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>إخفاء التفسير التفصيلي</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>قراءة التفسير كاملاً ({benefit.tafseerSource})</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            {onNavigateToWird && (
              <button
                type="button"
                onClick={onNavigateToWird}
                className="text-emerald-300 hover:text-emerald-100 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>متابعة الورد القرآني</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
