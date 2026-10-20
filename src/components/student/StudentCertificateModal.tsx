/**
 * نافذة معاينة وتحميل شهادات الطالب الرسمية بصيغة PDF
 * متوافقة 100% مع دليل الهوية البصرية 2026 (Brand Guide 2026)
 * - الأخضر الزمردي: #046A38
 * - الذهبي الملكي: #C5A059
 * - العاجي الدافئ: #F9F6F0
 * - خطوط أميري ونوتو كوفي
 * - توقيع د. علي عزيزي يميناً، الختم المعتمد في الأسفل، والمعلم يساراً
 */

import React, { useState, useEffect, useRef } from 'react';
import { Award, Download, Printer, X, ShieldCheck, CheckCircle2, FileDown } from 'lucide-react';
import { CertificateItem } from '../../services/firestoreService';
import { OfficialLogo, OfficialStamp } from '../OfficialLogo';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../../utils/imagePreloader';
import { exportCertificateDirectPdf } from '../../utils/directPdfExporter';

interface StudentCertificateModalProps {
  certificate: CertificateItem | null;
  onClose: () => void;
  issuedLogoUrl?: string;
  issuedSealUrl?: string;
}

export const StudentCertificateModal: React.FC<StudentCertificateModalProps> = ({
  certificate,
  onClose,
  issuedLogoUrl,
  issuedSealUrl,
}) => {
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingDirectPdf, setIsExportingDirectPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const certSheetRef = useRef<HTMLDivElement>(null);

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

  if (!certificate) return null;

  const dynamicLogo = toAbsoluteUrl(issuedLogoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png');
  const dynamicSeal = toAbsoluteUrl(issuedSealUrl || brandSettings.customSealUrl || '/brand/official-seal.png');

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await preloadImages([dynamicLogo, dynamicSeal]);
      await waitForImagesToLoad(document);
      await new Promise(r => setTimeout(r, 250));
      window.print();
    } catch (e) {
      console.error('Print error:', e);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 1200);
    }
  };

  const handleDirectPdfDownload = async () => {
    if (!certSheetRef.current) return;
    setIsExportingDirectPdf(true);
    setExportStatus('جاري تهيئة الشهادة...');
    try {
      await preloadImages([dynamicLogo, dynamicSeal]);
      await exportCertificateDirectPdf(certSheetRef.current, {
        studentName: certificate.studentName,
        certificateNumber: certificate.serialNumber || (certificate as any).certificateNumber || 'CERT-2026',
        onProgress: (status) => setExportStatus(status)
      });
      setExportStatus('تم تنزيل ملف PDF بنجاح ✓');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error('Direct PDF export error:', e);
      setExportStatus('تعذر التصدير المباشر، جاري فتح نافذة الطباعة...');
      setTimeout(() => {
        setExportStatus(null);
        handlePrint();
      }, 1000);
    } finally {
      setIsExportingDirectPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" dir="rtl">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-2 border-[#C5A059] my-auto">
        
        {/* Action Header (Hidden during Print) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C5A059]" />
            <div>
              <h3 className="font-bold text-xs sm:text-sm font-serif">معاينة الشهادة المعتمدة والتحميل (A4)</h3>
              {exportStatus && (
                <span className="text-[11px] text-amber-300 animate-pulse font-medium block">
                  {exportStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* زر التصدير المباشر كملف PDF عبر jsPDF + html2canvas */}
            <button
              onClick={handleDirectPdfDownload}
              disabled={isExportingDirectPdf}
              className="px-4 py-2 bg-[#046A38] hover:bg-[#068547] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#C5A059]/60 disabled:opacity-50 active:scale-95"
              title="تصدير وتنزيل ملف PDF حقيقي ومباشر لجهازك دون نافذة الطباعة"
            >
              <FileDown className="w-4 h-4 text-[#C5A059]" />
              <span>{isExportingDirectPdf ? (exportStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
            </button>

            {/* تلميح حفظ كـ PDF في الطباعة */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold font-sans">
              <span className="text-sm">💡</span>
              <span>أو <strong>(حفظ كـ PDF)</strong> بالطباعة</span>
            </div>

            <button
              onClick={handlePrint}
              disabled={isPrinting || isExportingDirectPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center gap-2 cursor-pointer border border-[#C5A059] disabled:opacity-50 active:scale-95 ring-1 ring-amber-300/40"
              title="فتح أمر الطباعة الاعتيادي للمتصفح"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المتصفح'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Sheet (Printable A4 Target) */}
        <div ref={certSheetRef} className="certificate-print-root p-3 sm:p-10 bg-[#F9F6F0] text-[#2C3531] relative select-none print:m-0 print:p-8 print:w-full">
          {/* Ornate Gold Outer Border */}
          <div className="border-2 sm:border-4 border-[#C5A059] p-2 sm:p-4 rounded-xl sm:rounded-2xl relative">
            <div className="border border-[#046A38]/30 p-4 sm:p-8 rounded-lg sm:rounded-xl bg-white/95 text-center space-y-4 sm:space-y-6 relative overflow-hidden">
              
              {/* Watermark Seal */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <img
                  src={dynamicSeal}
                  crossOrigin="anonymous"
                  alt="ختم مائي"
                  className="w-72 sm:w-96 h-72 sm:h-96 object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                      e.currentTarget.src = '/brand/official-seal.png';
                    }
                  }}
                />
              </div>

              {/* 1. Header (Logo + Academy Name) */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-[#C5A059]/40 pb-3 sm:pb-5">
                <div className="flex items-center gap-3 text-right">
                  <img
                    src={dynamicLogo}
                    crossOrigin="anonymous"
                    alt="مقرأة رحاب القرآن"
                    className="w-12 sm:w-16 h-auto object-contain filter drop-shadow-md select-none shrink-0"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                        e.currentTarget.src = '/brand/official-logo.png';
                      }
                    }}
                  />
                  <div>
                    <h2 className="font-bold font-serif text-base sm:text-xl text-[#046A38]">
                      مقرأة رحاب القرآن الإلكترونية
                    </h2>
                    <p className="text-[10px] sm:text-xs text-[#C5A059] font-bold">
                      ـ لتعليم القرآن الكريم والقراءات العشر بالسند المتصل ـ
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-left font-mono text-xs">
                  <span className="inline-block bg-[#046A38]/10 text-[#046A38] font-bold px-3 py-1 rounded-full border border-[#046A38]/30">
                    رقم الاعتماد: {certificate.serialNumber}
                  </span>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    التاريخ: {certificate.issueDate || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              {/* 2. Certificate Title Badge */}
              <div className="relative z-10 space-y-3 pt-2">
                <div className="inline-block bg-gradient-to-r from-[#046A38] to-[#065A31] text-[#F9F6F0] px-8 py-2.5 rounded-2xl border-2 border-[#C5A059] shadow-md">
                  <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-wider text-[#F9F6F0]">
                    شَهَادَةُ إِتْمَامٍ وَإِجَازَةٍ قُرْآنِيَّةٍ
                  </h1>
                </div>

                <p className="text-sm font-bold text-[#046A38]">
                  تَشْهَدُ إِدَارَةُ مَقْرَأَةِ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ الطَّالِبَ/ـةَ:
                </p>

                {/* Student Name */}
                <div className="py-2.5 px-8 rounded-2xl bg-[#F9F6F0] border-2 border-dashed border-[#C5A059] inline-block shadow-xs">
                  <span className="text-2xl sm:text-3xl font-black font-serif text-[#046A38]">
                    {certificate.studentName}
                  </span>
                </div>

                <p className="text-sm text-[#2C3531] leading-relaxed max-w-2xl mx-auto pt-1">
                  قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ حِفْظَ وَإِتْقَانَ مُتَطَلَّبَاتِ:
                </p>

                <div className="p-3.5 rounded-2xl bg-[#046A38]/5 border border-[#046A38]/20 max-w-xl mx-auto">
                  <h3 className="font-bold text-base sm:text-lg text-[#046A38] font-serif">
                    « {certificate.courseTitle} »
                  </h3>
                  <p className="text-xs text-slate-700 mt-1">
                    {certificate.riwayah || 'بِرِوَايَةِ حَفْصٍ عَنْ عَاصِمٍ بِالسَّنَدِ الْمُتَّصِلِ إِلَى رَسُولِ اللَّهِ ﷺ'}
                  </p>
                </div>

                {certificate.grade && (
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#046A38] text-white text-xs font-bold">
                    <span className="text-[#C5A059]">التقدير العام:</span>
                    <span>{certificate.grade}</span>
                  </div>
                )}
              </div>

              {/* 3. Bottom Signatures & Seal */}
              <div className="relative z-10 pt-4 sm:pt-8 border-t-2 border-[#C5A059]/40 grid grid-cols-3 gap-1 sm:gap-4 items-center">
                {/* Right: Administration Signature (د. علي عزيزي) */}
                <div className="text-right space-y-1">
                  <span className="text-[9px] sm:text-[11px] font-bold text-[#046A38] block">إدارة المقرأة العامة:</span>
                  <p className="font-bold text-xs sm:text-base font-serif text-slate-900 truncate">
                    فضيلة المقرئ د. علي عزيزي
                  </p>
                  <div className="w-14 sm:w-24 h-0.5 bg-[#C5A059] opacity-70 mt-1 mr-auto"></div>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 block">المشرف العام المعتمد</span>
                </div>

                {/* Center: Official Seal */}
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={dynamicSeal}
                    crossOrigin="anonymous"
                    alt="الختم الرسمي"
                    className="w-14 h-14 sm:w-24 sm:h-24 object-contain drop-shadow-md select-none pointer-events-none"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                        e.currentTarget.src = '/brand/official-seal.png';
                      }
                    }}
                  />
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#046A38] mt-1 font-mono">
                    ختم الاعتماد الرقمي
                  </span>
                </div>

                {/* Left: Teacher Signature */}
                <div className="text-left space-y-1">
                  <span className="text-[9px] sm:text-[11px] font-bold text-[#046A38] block">معلم الحلقة المجيز:</span>
                  <p className="font-bold text-xs sm:text-base font-serif text-slate-900 truncate">
                    {certificate.sheikhTeacherName || 'الشيخ المجيز'}
                  </p>
                  <div className="w-14 sm:w-24 h-0.5 bg-[#C5A059] opacity-70 ml-auto mt-1"></div>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 block">المعلم المعتمد</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
