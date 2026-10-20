import React, { useMemo, useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  MessageSquare, 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  Building2, 
  ShieldCheck,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { 
  SupervisorSupportReportData, 
  generateSupervisorSupportReportHtml,
  createReportWhatsAppShareUrl,
  generateReportShareLink,
  printSupervisorSupportReport,
  downloadSupervisorSupportReportHtml,
  downloadSupervisorSupportReportDirectPdf,
  DEFAULT_SUPPORT_ITEMS
} from '../../utils/supervisorSupportReportPdf';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';

interface PublicReportViewerPageProps {
  onBackToHome?: () => void;
  onNavigate?: (path: string) => void;
}

export const PublicReportViewerPage: React.FC<PublicReportViewerPageProps> = ({
  onBackToHome,
  onNavigate,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isExportingDirectPdf, setIsExportingDirectPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());

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

  const dynamicLogoUrl = brandSettings.customLogoUrl || '/brand/official-logo.png';
  const dynamicSealUrl = brandSettings.customSealUrl || '/brand/official-seal.png';

  // استخراج معلمات الرابط إن وُجدت
  const reportData = useMemo<SupervisorSupportReportData>(() => {
    let cachedData: Partial<SupervisorSupportReportData> = {};
    try {
      const raw = localStorage.getItem('rehab_active_support_report');
      if (raw) cachedData = JSON.parse(raw);
    } catch {}

    const searchParams = typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search) 
      : new URLSearchParams();

    const orgFromUrl = searchParams.get('org');
    const toFromUrl = searchParams.get('to');
    const periodFromUrl = searchParams.get('period');

    return {
      organizationName: orgFromUrl || cachedData.organizationName || 'جمعية البر والتقوى الخيرية',
      targetedOfficial: toFromUrl || cachedData.targetedOfficial || 'سعادة رئيس مجلس الإدارة المحترم',
      reportPeriod: periodFromUrl || cachedData.reportPeriod || 'العام الأكاديمي 1447 هـ / 2026 م',
      supportPurpose: cachedData.supportPurpose || 'كفالة الحلقات القرآنية ورعاية حفاظ كتاب الله وتغطية النفقات التشغيلية للمقرأة',
      additionalNotes: cachedData.additionalNotes || 'نوصي بتخصيص الدعم لكفالة حلقات الإسناد العالي وتأمين خوادم الغرف الصوتية السحابية لاستيعاب الطلاب الجدد.',
      customRequestIntro: cachedData.customRequestIntro,
      customThanksOutro: cachedData.customThanksOutro,
      totalStudents: cachedData.totalStudents || 185,
      totalTeachers: cachedData.totalTeachers || 12,
      totalHalqas: cachedData.totalHalqas || 12,
      totalRecitationSessions: cachedData.totalRecitationSessions || 1480,
      totalTajweedLessons: cachedData.totalTajweedLessons || 14,
      completionRate: cachedData.completionRate || '96%',
      teachers: cachedData.teachers && cachedData.teachers.length > 0 ? cachedData.teachers : [
        { name: 'الشيخة أم أنس الزبيدي', riwayah: 'حفص عن عاصم من طريق الشاطبية', section: 'female', studentsCount: 15, specialization: 'إجازة بالسند المتصل' },
        { name: 'الشيخ إبراهيم الوصابي', riwayah: 'ورش عن نافع من طريق الأزرق', section: 'male', studentsCount: 17, specialization: 'حفظ مكثف وتثبيت' },
        { name: 'علي عزيزي', riwayah: 'قالون عن نافع المدني', section: 'male', studentsCount: 19, specialization: 'تصحيح تلاوة وأشبال' },
      ],
      memorizationStats: cachedData.memorizationStats || {
        totalMemorizedPages: 3330,
        averageScore: 96,
        outstandingStudents: [
          { name: 'عبدالله محمد المنصوري', halqa: 'حلقة الفجر', level: 'الجزء 10', score: 98 },
          { name: 'فاطمة الزهراء الشامي', halqa: 'حلقة الزهراوان', level: 'الجزء 25', score: 99 },
        ]
      },
      studentsList: cachedData.studentsList && cachedData.studentsList.length > 0 ? cachedData.studentsList : [
        { name: 'عبدالله محمد المنصوري', halqa: 'حلقة الفجر لحفظ القرآن الكريم (الماهر بالقرآن)', track: 'حفظ مكثف وتثبيت', level: 'الجزء 10', sessionsCount: 14, score: 95 },
        { name: 'علي', halqa: 'حلقة الإتقان والتحفيظ (الفجر - بنين)', track: 'مراجعة وتسميع يومي', level: 'الجزء 11', sessionsCount: 16, score: 96 },
        { name: 'علي محمد', halqa: 'حلقة الإتقان والتحفيظ (الفجر - بنين)', track: 'إجازة بالسند المتصل', level: '1', sessionsCount: 18, score: 97 },
        { name: 'عبدالرحمن باجعفر', halqa: 'حلقة الإتقان والتحفيظ (الفجر - بنين)', track: 'مراجعة وتسميع يومي', level: '18', sessionsCount: 22, score: 99 },
        { name: 'فاطمة الزهراء الشامي', halqa: 'حلقة الفجر لحفظ القرآن الكريم (الماهر بالقرآن)', track: 'حفظ مكثف وتثبيت', level: '25', sessionsCount: 26, score: 96 },
      ],
      tajweedStats: cachedData.tajweedStats || {
        chaptersCount: 3,
        lessonsCount: 14,
        averageTajweedGrade: 96
      },
      supportItems: cachedData.supportItems && cachedData.supportItems.length > 0 ? cachedData.supportItems : DEFAULT_SUPPORT_ITEMS,
      issuedLogoUrl: cachedData.issuedLogoUrl || dynamicLogoUrl,
      issuedSealUrl: cachedData.issuedSealUrl || dynamicSealUrl,
    };
  }, [dynamicLogoUrl, dynamicSealUrl]);

  const reportHtml = useMemo(() => {
    return generateSupervisorSupportReportHtml(reportData);
  }, [reportData]);

  const handleShareWhatsApp = () => {
    const link = typeof window !== 'undefined' ? window.location.href : generateReportShareLink(reportData);
    const waUrl = createReportWhatsAppShareUrl(reportData, link);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 4000);
      }).catch(() => {});
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
    window.open(waUrl, '_blank');
  };

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined' ? window.location.href : generateReportShareLink(reportData);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#112217] text-[#2C3531] flex flex-col items-center py-4 px-2 sm:px-4" dir="rtl">
      
      {/* 1. الشريط العلوي التفاعلي للتقرير */}
      <div className="w-full max-w-5xl mb-4 bg-gradient-to-r from-[#044223] via-[#046A38] to-[#022e17] border-2 border-[#C5A059] rounded-2xl p-3 sm:p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-[#C5A059]/40 flex items-center justify-center shrink-0">
            <img
              src={dynamicLogoUrl}
              crossOrigin="anonymous"
              alt="شعار المقرأة"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                  e.currentTarget.src = '/brand/official-logo.png';
                }
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                وثيقة رسمية معتمدة A4
              </span>
              <span className="text-[11px] text-emerald-200 hidden sm:inline">مقرأة رحاب القرآن الإلكترونية</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white font-serif mt-0.5">
              تقرير سير عمل المقرأة الشامل وطلب دعم تشغيلي
            </h1>
          </div>
        </div>

        {/* أزرار الإجراءات السريعة */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* زر مشاركة التقرير عبر واتساب */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            title="إنشاء رابط مختصر ومشاركة التقرير عبر واتساب للداعمين"
          >
            <MessageSquare className="w-4 h-4 text-slate-950" />
            <span>مشاركة التقرير عبر واتساب</span>
          </button>

          {/* زر نسخ الرابط */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/20 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="نسخ رابط التقرير المباشر"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCopied ? 'تم النسخ ✓' : 'نسخ الرابط'}</span>
          </button>

          {/* زر التصدير المباشر كـ PDF عبر jsPDF + html2canvas */}
          <button
            type="button"
            onClick={async () => {
              setIsExportingDirectPdf(true);
              setExportStatus('جاري إعداد تقرير PDF...');
              try {
                await downloadSupervisorSupportReportDirectPdf(reportData, (msg) => setExportStatus(msg));
                setExportStatus('تم تنزيل ملف PDF بنجاح ✓');
                setTimeout(() => setExportStatus(null), 3000);
              } catch (e) {
                console.error('Direct PDF export error:', e);
                setExportStatus('تعذر التصدير المباشر، جاري فتح الطباعة...');
                setTimeout(() => {
                  setExportStatus(null);
                  printSupervisorSupportReport(reportData);
                }, 1000);
              } finally {
                setIsExportingDirectPdf(false);
              }
            }}
            disabled={isExportingDirectPdf}
            className="px-4 py-2 rounded-xl bg-[#046A38] hover:bg-[#068547] text-white border border-[#C5A059]/60 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
            title="تنزيل التقرير مباشرة كملف PDF لجهازك دون نافذة الطباعة"
          >
            <FileDown className="w-4 h-4 text-[#C5A059]" />
            <span>{isExportingDirectPdf ? (exportStatus || 'جاري التوليد...') : 'تنزيل PDF مباشر (jsPDF)'}</span>
          </button>

          {/* تلميح حفظ كـ PDF واضح للمستخدم */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold font-sans">
            <span className="text-sm">💡</span>
            <span>أو <strong>(حفظ كـ PDF)</strong> بالطباعة</span>
          </div>

          {/* زر الطباعة */}
          <button
            type="button"
            onClick={() => printSupervisorSupportReport(reportData)}
            disabled={isExportingDirectPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition cursor-pointer active:scale-95 ring-1 ring-amber-300/40"
            title="طباعة التقرير من نافذة المتصفح"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>طباعة المتصفح</span>
          </button>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>الرئيسية</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* إشعار نجاح النسخ والتوجيه */}
      {showToast && (
        <div className="w-full max-w-5xl mb-3 bg-emerald-950 border border-emerald-500/50 rounded-xl p-3 text-white text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
            <span className="font-bold text-emerald-200">
              تم نسخ الرابط المباشر للتقرير بنجاح وجاري فتح واتساب لإرساله للمانحين والداعمين!
            </span>
          </div>
          <span className="text-[11px] text-slate-300 font-mono dir-ltr truncate max-w-xs">
            {typeof window !== 'undefined' ? window.location.href : ''}
          </span>
        </div>
      )}

      {/* 2. حاوية عرض وثيقة التقرير الرسمية داخل iframe تفاعلي */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#C5A059]">
        <iframe
          srcDoc={reportHtml}
          title="وثيقة تقرير سير عمل المقرأة والدعم التشغيلي"
          className="w-full h-[85vh] sm:h-[900px] border-none bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>

    </div>
  );
};
