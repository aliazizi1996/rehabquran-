/**
 * نموذج تقييم جلسة التسميع الرسمي والمفصل (Session Evaluation Modal)
 * يعرض تفصيل الأخطاء الستة، درجة الإتقان، توقيع واعتماد المعلم، وإمكانية الطباعة
 */

import React, { useState, useRef } from 'react';
import { 
  Award, CheckCircle2, AlertTriangle, Printer, Download, 
  X, ShieldCheck, User, Calendar, BookOpen, Clock, FileText, FileDown 
} from 'lucide-react';
import { 
  AcademicRecitationSession, 
  AI_ADVISORY_DISCLAIMER 
} from '../../services/academicService';
import { QURAN_ERROR_CATEGORIES, calculateMastery } from '../../data/quranAcademicData';
import { OfficialLogo } from '../OfficialLogo';
import { getBrandLogoSettings } from '../../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../../utils/imagePreloader';
import { exportElementToDirectPdf } from '../../utils/directPdfExporter';

interface SessionEvaluationModalProps {
  session: AcademicRecitationSession;
  onClose: () => void;
  onPrint?: () => void;
}

export const SessionEvaluationModal: React.FC<SessionEvaluationModalProps> = ({
  session,
  onClose,
  onPrint
}) => {
  const brandSettings = getBrandLogoSettings();
  const dynamicSealUrl = toAbsoluteUrl(brandSettings.customSealUrl || '/brand/official-seal.png');
  const mastery = calculateMastery(session.finalScore);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExportingDirectPdf, setIsExportingDirectPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (onPrint) {
      onPrint();
      return;
    }
    setIsPrinting(true);
    try {
      await preloadImages([dynamicSealUrl]);
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
    if (!sheetRef.current) return;
    setIsExportingDirectPdf(true);
    setExportStatus('جاري إعداد الاستمارة...');
    try {
      await preloadImages([dynamicSealUrl]);
      await exportElementToDirectPdf(sheetRef.current, {
        fileName: `استمارة_تقييم_تسميع_${session.studentName.replace(/\s+/g, '_')}.pdf`,
        orientation: 'portrait',
        format: 'a4',
        fitToOnePage: true,
        scale: 2.2,
        quality: 0.98,
        title: `استمارة تقييم جلسة تلاوة - ${session.studentName}`,
        onProgress: (status) => setExportStatus(status)
      });
      setExportStatus('تم تنزيل ملف PDF بنجاح ✓');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (e) {
      console.error('Direct PDF export error:', e);
      setExportStatus('تعذر التصدير المباشر، جاري فتح الطباعة...');
      setTimeout(() => {
        setExportStatus(null);
        handlePrint();
      }, 1000);
    } finally {
      setIsExportingDirectPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div ref={sheetRef} className="bg-white rounded-3xl max-w-2xl w-full p-6 border-2 border-[#C5A059] shadow-2xl space-y-5 my-auto animate-scale-up text-right font-sans">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="flex items-center gap-2.5">
            <OfficialLogo size="sm" showText={false} />
            <div>
              <span className="text-[11px] font-bold text-[#C5A059] block">استمارة التقييم الأكاديمي الرسمية</span>
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                تقرير تقييم جلسة التلاوة والتسميع
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
            <button
              onClick={handleDirectPdfDownload}
              disabled={isExportingDirectPdf}
              className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#068547] text-white border border-[#C5A059]/60 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
              title="تنزيل استمارة التقييم مباشرة كملف PDF دون نافذة الطباعة"
            >
              <FileDown className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isExportingDirectPdf ? (exportStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
            </button>

            {/* زر طباعة المتصفح */}
            <button
              onClick={handlePrint}
              disabled={isPrinting || isExportingDirectPdf}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95 ring-1 ring-amber-300/40"
              title="طباعة الاستمارة من نافذة المتصفح"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المتصفح'}</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student & Session Summary Banner */}
        <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">اسم الطالب</span>
            <strong className="text-slate-900 font-serif text-sm">{session.studentName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">المعلم المجاز</span>
            <strong className="text-slate-900 font-serif text-sm">{session.teacherName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">السورة والمقرر</span>
            <strong className="text-[#046A38] font-bold">
              سورة {session.surahName} ({session.ayahStart} - {session.ayahEnd})
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">نوع الجلسة</span>
            <strong className="text-purple-900 font-bold">
              {session.sessionType === 'new_memorization' ? 'حفظ جديد' : session.sessionType === 'minor_revision' ? 'مراجعة صغرى' : 'مراجعة كبرى'}
            </strong>
          </div>
        </div>

        {/* Score & Mastery Level */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-500 font-bold">الدرجة النهائية المعتمدة:</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black font-serif text-[#046A38]">
                {session.finalScore}%
              </span>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${mastery.badgeClass}`}>
                {mastery.label}
              </span>
            </div>
          </div>

          <div className="text-left text-xs text-slate-500">
            <div>التاريخ: <strong className="text-slate-800">{session.sessionDate}</strong></div>
            <div>مدة الجلسة: <strong className="text-slate-800">{session.durationMinutes} دقيقة</strong></div>
          </div>
        </div>

        {/* Errors Breakdown (الأخطاء الستة) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#C5A059]" />
            <span>بيان تفصيل الأخطاء المرصودة:</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {QURAN_ERROR_CATEGORIES.map((cat) => {
              const count = (session.errors as any)?.[cat.id] || 0;
              return (
                <div key={cat.id} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{cat.label}:</span>
                  <span className={`font-black font-serif px-2 py-0.5 rounded-lg text-xs ${
                    count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher Notes & Homework */}
        <div className="space-y-2 text-xs">
          {session.teacherNotes && (
            <div className="bg-[#F9F6F0] p-3 rounded-xl border border-[#C5A059]/30">
              <strong className="text-[#046A38] block mb-1">ملاحظات وتوجيهات الشيخ المباشرة:</strong>
              <p className="text-slate-700 leading-relaxed">{session.teacherNotes}</p>
            </div>
          )}

          {session.homeworkAssigned && (
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
              <strong className="text-amber-900 block mb-1">المقرر والتكليف للجلسة القادمة:</strong>
              <p className="text-slate-700 leading-relaxed">{session.homeworkAssigned}</p>
            </div>
          )}
        </div>

        {/* AI Advisory Note Disclaimer if present */}
        {session.aiAdvisoryFeedback && (
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-slate-600 space-y-1">
            <strong className="text-[#046A38] block">توجيهات الذكاء الاصطناعي الاسترشادية:</strong>
            <p className="text-slate-600">
              {session.aiAdvisoryFeedback.keyRulesSuggested?.join(' • ')}
            </p>
            <p className="text-[10px] text-amber-900 font-medium pt-1 border-t border-emerald-100">
              {AI_ADVISORY_DISCLAIMER}
            </p>
          </div>
        )}

        {/* Official Certification Seal & Teacher Signature */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <img
              src={dynamicSealUrl}
              crossOrigin="anonymous"
              alt="ختم المقرأة"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                  e.currentTarget.src = toAbsoluteUrl('/brand/official-seal.png');
                }
              }}
            />
            <div>
              <span className="font-bold text-[#046A38] block text-[11px]">مقرأة رحاب القرآن الإلكترونية</span>
              <span className="text-[10px] text-slate-400">الاعتماد الأكاديمي الرسمي بالسند المتصل</span>
            </div>
          </div>

          <div className="text-left space-y-0.5">
            <span className="text-[10px] text-slate-400 block">اعتماد وتوقيع المعلم:</span>
            <div className="font-serif font-black text-slate-900 text-sm flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{session.approvedByTeacherName}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">معتمد شرعياً وأكاديمياً</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            إغلاق النموذج
          </button>
        </div>
      </div>
    </div>
  );
};
