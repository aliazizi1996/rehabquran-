import React, { useState } from 'react';
import { X, Printer, Download, ZoomIn, ZoomOut, RotateCcw, FileText, CheckCircle2, ShieldCheck, Eye, FileDown } from 'lucide-react';
import { TajweedLesson, TajweedChapter } from '../../types';
import { generateLessonPdfHtml, printLessonPdf, downloadLessonPdfHtml, downloadLessonDirectPdf } from '../../utils/pdfExport';
import { getTajweedPdfSettings, resetTajweedPdfSettingsToDefault, DEFAULT_TAJWEED_PDF_SETTINGS, TajweedPdfSettings } from '../../services/pdfSettingsService';
import { toAbsoluteUrl, preloadImages } from '../../utils/imagePreloader';

interface TajweedPdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: TajweedLesson;
  chapter?: TajweedChapter;
  customSettings?: TajweedPdfSettings;
}

export const TajweedPdfPreviewModal: React.FC<TajweedPdfPreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
  chapter,
  customSettings,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [directDownloadStatus, setDirectDownloadStatus] = useState<string | null>(null);
  const [activeSettings, setActiveSettings] = useState<TajweedPdfSettings>(() => {
    return customSettings || getTajweedPdfSettings();
  });

  if (!isOpen || !lesson) return null;

  const chapterTitle = chapter?.title || 'منهج علوم التجويد والإتقان القرآني';
  const pdfHtml = generateLessonPdfHtml(lesson, chapter, activeSettings);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await preloadImages([
        toAbsoluteUrl(activeSettings.logoUrl || '/brand/official-logo.png'),
        toAbsoluteUrl(activeSettings.sealUrl || '/brand/official-seal.png')
      ]);
      await printLessonPdf(lesson, chapter, activeSettings);
    } finally {
      setTimeout(() => setIsPrinting(false), 1500);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDirectDownloadStatus('جاري إعداد درس PDF...');
    try {
      await preloadImages([
        toAbsoluteUrl(activeSettings.logoUrl || '/brand/official-logo.png'),
        toAbsoluteUrl(activeSettings.sealUrl || '/brand/official-seal.png')
      ]);
      await downloadLessonDirectPdf(lesson, chapter, activeSettings, (msg) => setDirectDownloadStatus(msg));
      setDirectDownloadStatus('تم تنزيل الدرس PDF بنجاح ✓');
      setTimeout(() => setDirectDownloadStatus(null), 3000);
    } catch (e) {
      console.error('Direct PDF export error:', e);
      setDirectDownloadStatus('جاري التنزيل كملف...');
      downloadLessonPdfHtml(lesson, chapter, activeSettings);
      setTimeout(() => setDirectDownloadStatus(null), 2500);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreDefault = () => {
    const def = resetTajweedPdfSettingsToDefault();
    setActiveSettings(def);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111f18] border-2 border-[#C5A059] rounded-2xl w-full max-w-5xl h-[95vh] sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#044223] via-[#046A38] to-[#022e17] border-b border-[#C5A059]/40 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-[#111f18] flex items-center justify-center font-bold shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  معاينة وثيقة PDF الرسمية A4
                </span>
                <span className="text-[11px] text-emerald-200">الدرس رقم ({lesson.order})</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-amiri">
                {lesson.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-black/30 rounded-xl border border-white/10 p-1 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-amber-300 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white ml-1 border-r border-white/10 pr-2"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleRestoreDefault}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#fce8bd] border border-[#C5A059]/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="إعادة وثيقة الدرس فوراً إلى الوضع الافتراضي الرسمي (الترويسة وعنوان الدرس والشعار وتذييل الحسابات)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">الوضع الافتراضي</span>
            </button>

            {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#068547] text-white border border-[#C5A059]/60 font-bold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
              title="تنزيل ملخص الدرس مباشرة كملف PDF لجهازك دون نافذة الطباعة"
            >
              <FileDown className="w-4 h-4 text-[#C5A059]" />
              <span>{isDownloading ? (directDownloadStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
            </button>

            {/* تلميح حفظ كـ PDF واضح للمستخدم */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold font-sans">
              <span className="text-sm">💡</span>
              <span>أو <strong>(حفظ كـ PDF)</strong> بالطباعة</span>
            </div>

            {/* زر طباعة المتصفح */}
            <button
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition disabled:opacity-50 cursor-pointer active:scale-95 ring-1 ring-amber-300/40"
              title="طباعة الدرس من نافذة المتصفح"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المتصفح'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Preview Stage */}
        <div className="flex-1 bg-[#1a2b22] p-2 sm:p-6 overflow-auto flex justify-center items-start">
          <div 
            style={{ 
              transform: `scale(${zoomLevel / 100})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full max-w-[850px] shadow-2xl rounded-xl overflow-hidden border border-[#C5A059]/30 bg-white"
          >
            <iframe
              srcDoc={pdfHtml}
              title={`ملخص درس ${lesson.title}`}
              className="w-full h-[65vh] sm:h-[760px] border-none bg-white"
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[#0a1610] border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>معتمدة بالهوية الرسمية لمقرأة رحاب القرآن (شعار رسمي + ختم موثق + علامة مائية)</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>الهاتف: {activeSettings.contactPhone}</span>
            <span>•</span>
            <span>المرجع: {chapterTitle}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
