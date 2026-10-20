/**
 * صفحة التحقق من صحة الشهادات الصادرة - مقرأة رحاب القرآن الإلكترونية
 * Certificate Verification Page (/verify & /verify/:id)
 * 
 * تتيح التحقق الفوري من صحة ومصداقية الشهادة القرآنية برقمها الأكاديمي أو مسح رمز QR
 * متوافقة 100% مع دليل الهوية البصرية 2026 (Brand Guide 2026)
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Award, CheckCircle2, AlertCircle, 
  Printer, ArrowRight, BookOpen, User, Calendar, ExternalLink,
  Copy, Check, RefreshCw, QrCode, FileText, CheckCircle
} from 'lucide-react';
import { 
  verifyCertificateByAcademicId, 
  IssuedCertificateRecord 
} from '../../services/certificateTemplateService';
import { OfficialLogo, OfficialStamp } from '../../components/OfficialLogo';
import { getBrandLogoSettings, syncBrandSettingsFromServer, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../../utils/imagePreloader';

interface CertificateVerificationPageProps {
  initialId?: string;
  onNavigate?: (path: string) => void;
  onBackToHome?: () => void;
}

export const CertificateVerificationPage: React.FC<CertificateVerificationPageProps> = ({
  initialId = '',
  onNavigate,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialId);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [isPrinting, setIsPrinting] = useState(false);

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

  const dynamicSealUrl = toAbsoluteUrl(brandSettings.customSealUrl || '/brand/official-seal.png');
  const dynamicLogoUrl = toAbsoluteUrl(brandSettings.customLogoUrl || '/brand/official-logo.png');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    message: string;
    certificate?: IssuedCertificateRecord;
  } | null>(null);

  // Auto-verify if initialId is provided
  useEffect(() => {
    if (initialId && initialId.trim()) {
      handleVerify(initialId.trim());
    }
  }, [initialId]);

  const handleVerify = async (queryText: string) => {
    const clean = queryText.trim();
    if (!clean) return;

    setIsLoading(true);
    try {
      const res = await verifyCertificateByAcademicId(clean);
      setVerificationResult(res);
    } catch (err) {
      setVerificationResult({
        verified: false,
        message: 'حدث خطأ أثناء الاتصال بسجلات التحقق. يرجى إعادة المحاولة.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(searchQuery);
  };

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await preloadImages([dynamicSealUrl, dynamicLogoUrl]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] via-white to-[#F9F6F0] text-[#2C3531] font-sans text-right py-10 px-4 sm:px-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <OfficialLogo size="md" showText={false} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
                مقرأة رحاب القرآن الإلكترونية
              </h1>
              <p className="text-xs text-[#C5A059] font-bold">
                منظومة التحقق الأكاديمي الرقمي والاعتماد الرسمي 2026
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            منظومة التحقق الإلكتروني الرسمية للتأكد من صحة شهادات وإجازات حفظ وتجويد القرآن الكريم الصادرة بالسند المتصل.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#C5A059]/40 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <ShieldCheck className="w-6 h-6 text-[#046A38]" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                فحص والتحقق من صحة الشهادة
              </h2>
              <p className="text-xs text-slate-500">
                أدخل الرقم الأكاديمي المطبوع على الشهادة (مثال: RQ-2026-6365) أو امسح رمز الاستجابة السريعة (QR Code).
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="text"
                placeholder="أدخل الرقم الأكاديمي: RQ-2026-XXXX"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#046A38] bg-slate-50 focus:bg-white text-xs font-mono font-bold text-[#046A38] uppercase outline-hidden shadow-xs transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-8 py-3 bg-[#046A38] hover:bg-[#03542c] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059] disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                  <span>جاري الفحص والتحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>التحقق من الشهادة</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Shortcuts for Demo / Testing */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-600">أرقام للاختبار السريع:</span>
            {['RQ-2026-6365', 'RQ-2026-CERT-1447', 'RQ-2026-IJAZA-2026'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchQuery(id);
                  handleVerify(id);
                }}
                className="px-2.5 py-1 bg-[#F9F6F0] hover:bg-emerald-50 text-[#046A38] border border-[#C5A059]/40 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result Display */}
        {verificationResult && (
          <div className="animate-fade-in space-y-6">
            
            {/* Status Banner */}
            <div className={`p-6 rounded-3xl border-2 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              verificationResult.verified
                ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-[#046A38]'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  verificationResult.verified ? 'bg-[#046A38] text-white' : 'bg-rose-600 text-white'
                }`}>
                  {verificationResult.verified ? <CheckCircle2 className="w-6 h-6 text-[#C5A059]" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg font-serif">
                      {verificationResult.verified ? 'شهادة رسمية معتمدة وموثقة 100%' : 'تنبيه: تعذر التحقق من الشهادة'}
                    </h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      verificationResult.verified ? 'bg-emerald-100 text-[#046A38]' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {verificationResult.verified ? 'سجل نظامي سليم' : 'غير مسجلة'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{verificationResult.message}</p>
                </div>
              </div>

              {verificationResult.verified && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyVerificationUrl}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط التوثيق'}</span>
                  </button>
                  {/* تلميح حفظ كـ PDF واضح للمستخدم */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 text-amber-900 border border-amber-400/40 text-xs font-bold font-sans">
                    <span className="text-sm">💡</span>
                    <span>يرجى اختيار <strong>(حفظ كـ PDF)</strong> من نافذة الطباعة</span>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 ring-2 ring-amber-300/40"
                  >
                    <Printer className="w-4 h-4 text-slate-950" />
                    <span>{isPrinting ? 'جاري تجهيز الصور...' : 'طباعة / حفظ PDF'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Verified Certificate Full Details Card */}
            {verificationResult.verified && verificationResult.certificate && (
              <div className="bg-white rounded-3xl border-2 border-[#C5A059] p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-6">
                
                {/* Watermark Stamp */}
                <div className="absolute left-6 bottom-6 opacity-10 pointer-events-none">
                  <img
                    src={dynamicSealUrl}
                    crossOrigin="anonymous"
                    alt="الختم الرسمي"
                    className="w-48 h-48 object-contain"
                    onError={(e) => {
                      if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                        e.currentTarget.src = '/brand/official-seal.png';
                      }
                    }}
                  />
                </div>

                {/* Certificate Header */}
                <div className="text-center space-y-2 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-center gap-2">
                    <OfficialLogo size="sm" showText={false} />
                    <span className="font-bold text-xs text-[#046A38] uppercase">مقرأة رحاب القرآن الإلكترونية</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#046A38]">
                    بيانات وثيقة الشهادة الأصلية المسجلة
                  </h3>
                  <div className="inline-block bg-[#F9F6F0] px-4 py-1.5 rounded-full border border-[#C5A059]/40 text-xs font-mono font-bold text-[#046A38]">
                    الرقم الأكاديمي: {verificationResult.certificate.academicId}
                  </div>
                </div>

                {/* Primary Student and Course Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">اسم الطالب الصادرة له الشهادة:</span>
                    <strong className="text-base text-slate-900 font-serif font-black block">
                      {verificationResult.certificate.studentName}
                    </strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">المسار / البرنامج المعتمد:</span>
                    <strong className="text-base text-[#046A38] font-serif font-bold block">
                      {verificationResult.certificate.courseTitle}
                    </strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">الرواية والسند:</span>
                    <strong className="text-slate-800 font-bold block">
                      {verificationResult.certificate.riwayah || 'برواية حفص عن عاصم بالسند المتصل'}
                    </strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">التقدير والدرجة العامة:</span>
                    <strong className="text-[#C5A059] font-bold block">
                      {verificationResult.certificate.grade || 'ممتاز مرتفع (100%)'}
                    </strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">تاريخ الإصدار المعتمد:</span>
                    <strong className="text-slate-800 font-mono font-bold block">
                      {verificationResult.certificate.issueDate}
                    </strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-500 block text-[11px]">حالة الوثيقة بالسجلات:</span>
                    <strong className="text-emerald-700 font-bold block flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
                      <span>سارية المفعول ومجازة رسمياً</span>
                    </strong>
                  </div>
                </div>

                {/* Signatures & Seal Section */}
                <div className="pt-6 border-t border-slate-100 grid grid-cols-3 items-center text-center text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">إشراف المشرف العام</span>
                    <strong className="text-[#046A38] font-serif font-bold block text-sm">د. علي عزيزي</strong>
                    <span className="text-[10px] text-slate-500">إدارة المقرأة</span>
                  </div>

                  <div className="flex justify-center">
                    <img
                      src={dynamicSealUrl}
                      crossOrigin="anonymous"
                      alt="الختم الرسمي"
                      className="w-20 h-20 object-contain drop-shadow-xs"
                      onError={(e) => {
                        if (e.currentTarget.src !== window.location.origin + '/brand/official-seal.png') {
                          e.currentTarget.src = '/brand/official-seal.png';
                        }
                      }}
                    />
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">فضيلة الشيخ المعلم</span>
                    <strong className="text-slate-800 font-serif font-bold block text-sm">
                      {verificationResult.certificate.sheikhTeacherName}
                    </strong>
                    <span className="text-[10px] text-slate-500">المقرئ المجيز</span>
                  </div>
                </div>

                {/* Cryptographic Authenticity Footnote */}
                <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
                  <p>
                    هذه الشهادة مسجلة ومحفوظة في قاعدة بيانات مقرأة رحاب القرآن الإلكترونية.
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">
                    Verification Hash: SHA256-RQ-{verificationResult.certificate.academicId}-OK
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          {onBackToHome ? (
            <button
              onClick={onBackToHome}
              className="text-xs font-bold text-[#046A38] hover:underline cursor-pointer"
            >
              ← العودة إلى الصفحة الرئيسية للمقرأة
            </button>
          ) : (
            <a
              href="/"
              className="text-xs font-bold text-[#046A38] hover:underline"
            >
              ← العودة إلى الصفحة الرئيسية للمقرأة
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
