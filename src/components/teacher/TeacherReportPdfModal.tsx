import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Download, ZoomIn, ZoomOut, RotateCcw, FileText, CheckCircle2, ShieldCheck, FileDown } from 'lucide-react';
import { 
  generateStudentWeeklyReportPdfHtml, 
  printStudentWeeklyReport, 
  downloadStudentWeeklyReportDirectPdf,
  StudentWeeklyReportData 
} from '../../utils/studentWeeklyReportPdf';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../../utils/imagePreloader';

interface TeacherReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: StudentWeeklyReportData;
  issuedLogoUrl?: string;
  issuedSealUrl?: string;
}

export const TeacherReportPdfModal: React.FC<TeacherReportPdfModalProps> = ({
  isOpen,
  onClose,
  reportData,
  issuedLogoUrl,
  issuedSealUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    syncBrandSettingsFromServer().then(s => {
      if (s) setBrandSettings(s);
    }).catch(() => {});
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  const dynamicLogoUrl = toAbsoluteUrl(issuedLogoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png');
  const dynamicSealUrl = toAbsoluteUrl(issuedSealUrl || brandSettings.customSealUrl || '/brand/official-seal.png');

  if (!isOpen || !reportData) return null;

  const pdfHtml = generateStudentWeeklyReportPdfHtml(reportData, {
    logoUrl: dynamicLogoUrl,
    sealUrl: dynamicSealUrl,
  });

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // تحميل مسبق للصور بروابط مطلقة
      await preloadImages([dynamicLogoUrl, dynamicSealUrl]);

      if (iframeRef.current && iframeRef.current.contentDocument) {
        // انتظار تحميل وفك ترميز جميع الصور داخل مستند الـ iframe قبل فتح الطباعة عبر Promise.all
        await waitForImagesToLoad(iframeRef.current.contentDocument);
        await new Promise(r => setTimeout(r, 250));
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
      } else {
        await printStudentWeeklyReport(reportData, {
          logoUrl: dynamicLogoUrl,
          sealUrl: dynamicSealUrl,
        });
      }
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 1500);
    }
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    setDownloadStatus('جاري إعداد تقرير PDF...');
    try {
      await preloadImages([dynamicLogoUrl, dynamicSealUrl]);
      await downloadStudentWeeklyReportDirectPdf(
        reportData,
        {
          logoUrl: dynamicLogoUrl,
          sealUrl: dynamicSealUrl,
        },
        (msg) => setDownloadStatus(msg)
      );
      setDownloadStatus('تم التنزيل بنجاح ✓');
      setTimeout(() => setDownloadStatus(null), 3000);
    } catch (e) {
      console.error('Direct PDF export error:', e);
      setDownloadStatus('تعذر التصدير المباشر، جاري فتح الطباعة...');
      setTimeout(() => {
        setDownloadStatus(null);
        handlePrint();
      }, 1000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/75 backdrop-blur-xs animate-fade-in text-right" dir="rtl">
      <div className="bg-[#111f18] border-2 border-[#C5A059] rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#044223] via-[#046A38] to-[#022e17] border-b border-[#C5A059]/40 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 p-1 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
              <img
                src={dynamicLogoUrl}
                crossOrigin="anonymous"
                alt="شعار المقرأة"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                    e.currentTarget.src = toAbsoluteUrl('/brand/official-logo.png');
                  }
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  وثيقة التقرير الأسبوعي A4 المعتمدة
                </span>
                <span className="text-[11px] text-emerald-200">{reportData.weekLabel}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-serif">
                تقرير الطالب: {reportData.studentName}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-black/30 rounded-xl border border-white/10 p-1 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-amber-300 min-w-[45px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white ml-1 border-r border-white/10 pr-2 cursor-pointer"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
            <button
              onClick={handleDirectDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#068547] text-white border border-[#C5A059]/60 font-bold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
              title="تنزيل التقرير مباشرة كملف PDF لجهازك دون نافذة الطباعة"
            >
              <FileDown className="w-4 h-4 text-[#C5A059]" />
              <span>{isDownloading ? (downloadStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
            </button>

            {/* تلميح حفظ كـ PDF واضح للمستخدم */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold font-sans">
              <span className="text-sm">💡</span>
              <span>أو <strong>(حفظ كـ PDF)</strong> بالطباعة</span>
            </div>

            <button
              onClick={handlePrint}
              disabled={isPrinting || isDownloading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition disabled:opacity-50 cursor-pointer active:scale-95 ring-1 ring-amber-300/40"
              title="طباعة التقرير من نافذة المتصفح"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المتصفح'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-300 transition cursor-pointer"
              title="إغلاق النافذة"
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
            className="w-full max-w-[850px] shadow-2xl rounded-2xl overflow-hidden border border-[#C5A059]/40 bg-white"
          >
            <iframe
              ref={iframeRef}
              srcDoc={pdfHtml}
              title={`التقرير الأسبوعي للطالب ${reportData.studentName}`}
              className="w-full h-[65vh] sm:h-[780px] border-none bg-white"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[#0a1610] border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            <span>معتمد وموثق بالهوية البصرية الرسمية 2026 • ختم المقرأة وتوقيع الإدارة والمعلم</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>الحلقة: {reportData.halqaTitle}</span>
            <span>•</span>
            <span>المعلم: {reportData.teacherName}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
