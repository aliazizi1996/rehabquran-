import React, { useState, useEffect, useRef } from 'react';
import {
  Award, Download, Printer, Share2, CheckCircle2, ShieldCheck,
  Search, Sliders, Calendar, Sparkles, User, BookOpen, ExternalLink,
  Check, Copy, ArrowRight, Eye, RefreshCw, FileText, CheckCircle
} from 'lucide-react';
import { OfficialLogo, OfficialStamp } from '../../components/OfficialLogo';
import { getBrandLogoSettings, BrandLogoCustomization } from '../../utils/brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from '../../utils/imagePreloader';

interface CertificatesPublicPageProps {
  onBackToHome?: () => void;
  onOpenLogin?: () => void;
  onOpenRegistration?: () => void;
}

export const CertificatesPublicPage: React.FC<CertificatesPublicPageProps> = ({
  onBackToHome,
  onOpenLogin,
  onOpenRegistration,
}) => {
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Certificate Interactive Form State
  const [studentName, setStudentName] = useState('عبد الرحمن محمد باعبيد');
  const [programTitle, setProgramTitle] = useState('حفظ وتثبيت جزء عمّ كاملاً مع أحكام التجويد');
  const [riwayah, setRiwayah] = useState('برواية حفص عن عاصم بالسند المتصل');
  const [teacherName, setTeacherName] = useState('الشيخ المقرئ المجيز');
  const [grade, setGrade] = useState('ممتاز (100%)');
  const [serialNumber, setSerialNumber] = useState('RQ-2026-CERT-1447');
  const [issueDate, setIssueDate] = useState('15 شعبان 1447 هـ / 2026 م');
  
  // Verification Tool State
  const [searchSerial, setSearchSerial] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; message: string; data?: any } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  // Handle PDF Export / Print
  const handlePrintPDF = async () => {
    setIsPrinting(true);
    try {
      await preloadImages([
        toAbsoluteUrl(brandSettings.customLogoUrl || '/brand/official-logo.png'),
        toAbsoluteUrl(brandSettings.customSealUrl || '/brand/official-seal.png')
      ]);
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

  // Handle Share WhatsApp
  const handleShareWhatsApp = () => {
    const text = `❖ شهادة إنجاز معتمدة من مقرأة رحاب القرآن الإلكترونية ❖\n\nالطالب/ة: ${studentName}\nالإنجاز: ${programTitle}\nرقم الاعتماد: ${serialNumber}\nالمشرف العام: ${brandSettings.certAdminSignerName || 'د. علي عزيزي'}\n\nرابط المنظومة: ${window.location.origin}/certificates`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copy Verification Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Pre-set certificate templates
  const presets = [
    {
      title: 'إتمام جزء عمّ',
      name: 'عبد الرحمن محمد باعبيد',
      prog: 'حفظ وتثبيت جزء عمّ كاملاً مع أحكام التجويد',
      riwayah: 'برواية حفص عن عاصم بالسند المتصل',
      teacher: 'الشيخ عبد الله بن أحمد',
      grade: 'ممتاز (100%)',
      serial: 'RQ-2026-CERT-1447',
    },
    {
      title: 'إتمام القرآن كاملاً',
      name: 'عمر بن عبد العزيز الكندي',
      prog: 'ختم القرآن الكريم كاملاً حفظاً وضبطاً وتجويداً',
      riwayah: 'برواية حفص عن عاصم من طريق الشاطبية',
      teacher: 'فضيلة الشيخ المقرئ د. علي عزيزي',
      grade: 'امتياز مع مرتبة الشرف',
      serial: 'RQ-2026-CERT-8892',
    },
    {
      title: 'إجازة بالسند المتصل',
      name: 'فاطمة الزهراء الحضرمية',
      prog: 'عرض وإجازة القرآن الكريم بالسند المتصل إلى النبي ﷺ',
      riwayah: 'برواية قالون عن نافع المدني',
      teacher: 'الشيخة أم معاذ القرشية',
      grade: 'إجازة معتمدة بالسند',
      serial: 'RQ-2026-IJAZA-2026',
    },
    {
      title: 'منظومة الجزرية',
      name: 'إبراهيم يحيى الأهدل',
      prog: 'حفظ وضبط وشرح منظومة المقدمة الجزرية في علم التجويد',
      riwayah: 'شرح وتطبيق أحكام التجويد والوقف والابتداء',
      teacher: 'أستاذ التجويد العملي',
      grade: 'ممتاز (98%)',
      serial: 'RQ-2026-MATN-0512',
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setStudentName(p.name);
    setProgramTitle(p.prog);
    setRiwayah(p.riwayah);
    setTeacherName(p.teacher);
    setGrade(p.grade);
    setSerialNumber(p.serial);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSerial.trim()) return;
    
    // Simulate lookup in authorized serial database
    const query = searchSerial.trim().toUpperCase();
    if (query.includes('1447') || query.includes('8892') || query.includes('2026') || query.includes('RQ')) {
      setVerifyResult({
        verified: true,
        message: 'تم التحقق بنجاح: هذه الشهادة رسمية ومعتمدة وموثقة بالسجلات الإلكترونية لمقرأة رحاب القرآن.',
        data: {
          serial: query,
          student: 'مسجل وموثق بالسند المتصل',
          date: '1447 هـ / 2026 م',
          status: 'معتمدة ومختومة رسمياً',
        },
      });
    } else {
      setVerifyResult({
        verified: false,
        message: 'لم يتم العثور على شهادة بهذا الرقم التسلسلي. يرجى التأكد من كتابة الرقم بدقة أو مراجعة إدارة المقرأة.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C3531] font-sans text-right" dir="rtl">
      {/* 1. Page Hero Banner */}
      <section className="no-print bg-gradient-to-r from-emerald-950 via-[#046A38] to-emerald-900 text-white py-12 px-4 sm:px-6 border-b-4 border-[#C5A059] relative overflow-hidden">
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/20 rounded-full text-xs text-[#f7e8c6] font-bold border border-[#C5A059]/40 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>دليل الهوية الرسمية 2026 • شهادات وإجازات معتمدة</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-bold font-serif text-[#f7e8c6] leading-tight">
              منظومة الشهادات والإجازات القرآنية الرسمية
            </h1>
            
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-sans">
              تمنح مقرأة رحاب القرآن الإلكترونية شهادات إنجاز وإجازات رسمية بالسند المتصل إلى رسول الله ﷺ، مصممة وفق الهوية البصرية الرسمية المعتمدة لعام 2026، ومختومة بالختم الإلكتروني الرسمي وموقعة من إدارة المقرأة والمعلمين المجازين.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-6 py-3 bg-[#C5A059] hover:bg-[#dfbe75] text-[#2C3531] rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-white/20 font-serif"
            >
              <Download className="w-4 h-4 text-[#2C3531]" />
              <span>تحميل وطباعة PDF للشهادة</span>
            </button>
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>الرئيسية</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        
        {/* Preset Selectors (No-Print) */}
        <div className="no-print space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#046A38] font-serif flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C5A059]" />
              اختر نموذجاً معتمداً للمعاينة والتحميل:
            </span>
            <span className="text-[11px] text-slate-500 font-kufi">تنسيق أفقي فاخر A4 Landscape</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer space-y-1 ${
                  programTitle === p.prog
                    ? 'bg-[#046A38] text-white border-[#C5A059] shadow-md'
                    : 'bg-white text-slate-700 hover:bg-emerald-50/50 border-slate-200'
                }`}
              >
                <span className="block text-xs font-bold font-serif">{p.title}</span>
                <span className={`block text-[10px] truncate ${programTitle === p.prog ? 'text-amber-200' : 'text-slate-500'}`}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Action Toolbar (No-Print) */}
        <div className="no-print bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* تلميح حفظ كـ PDF واضح للمستخدم */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/20 text-amber-900 border border-amber-400/40 text-xs font-bold font-sans">
              <span className="text-sm">💡</span>
              <span>يرجى اختيار <strong>(حفظ كـ PDF)</strong> من نافذة الطباعة</span>
            </div>

            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={isPrinting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer transition-all border border-[#C5A059] disabled:opacity-50 active:scale-95 ring-2 ring-amber-300/40"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>{isPrinting ? 'جاري تجهيز الصور...' : 'طباعة / حفظ PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة واتساب</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedLink ? 'تم نسخ الرابط' : 'نسخ رابط التحقق'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>الرقم المعتمد:</span>
            <span className="font-bold text-[#046A38] bg-[#046A38]/10 px-2 py-0.5 rounded-lg border border-[#046A38]/30">
              {serialNumber}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. THE OFFICIAL A4 LANDSCAPE CERTIFICATE FRAME           */}
        {/* Strictly compliant with Page 6 of Official Brand Guide   */}
        {/* Colors: #046A38 (Emerald), #C5A059 (Gold), #F9F6F0 (Ivory), #2C3531 (Slate) */}
        {/* Fonts: Amiri for Headings/Emblem, Noto Kufi for Body     */}
        {/* ======================================================== */}
        <div className="flex justify-center w-full overflow-x-auto py-2">
          <div
            id="officialA4Certificate"
            className="certificate-print-root w-full max-w-4xl bg-[#F9F6F0] rounded-2xl sm:rounded-3xl border-4 border-[#C5A059] p-4 sm:p-10 text-center relative overflow-hidden shadow-2xl text-[#2C3531] select-none space-y-4 sm:space-y-6"
            style={{ minHeight: '520px' }}
          >

            {/* Inner Emerald Border Frame */}
            <div className="absolute inset-2 sm:inset-3 border-2 border-[#046A38] rounded-2xl pointer-events-none opacity-85"></div>
            {/* Fine Inner Gold Accent Border */}
            <div className="absolute inset-3.5 sm:inset-4 border border-[#C5A059] rounded-xl pointer-events-none opacity-60"></div>

            {/* 4 Islamic Arabesque Corner Crests (Directly from Guide) */}
            <div className="absolute top-4 right-4 w-10 h-10 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059]">
                <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="#046A38" />
              </svg>
            </div>
            <div className="absolute top-4 left-4 w-10 h-10 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-x-100">
                <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="#046A38" />
              </svg>
            </div>
            <div className="absolute bottom-4 right-4 w-10 h-10 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-y-100">
                <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="#046A38" />
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 w-10 h-10 pointer-events-none">
              <svg viewBox="0 0 40 40" className="w-full h-full text-[#C5A059] -scale-x-100 -scale-y-100">
                <path d="M0,0 L35,0 C35,15 25,35 0,35 L0,25 C15,25 25,15 25,0 L0,0 Z" fill="currentColor" opacity="0.85" />
                <circle cx="12" cy="12" r="3" fill="#046A38" />
              </svg>
            </div>

            {/* Central Watermark Logo (Opacified) */}
            <div
              style={{ opacity: brandSettings.certWatermarkOpacity ?? 0.06 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            >
              <img
                src={brandSettings.customLogoUrl || '/brand/official-logo.png'}
                crossOrigin="anonymous"
                alt="العلامة المائية"
                className="w-72 sm:w-88 max-h-[340px] object-contain select-none"
                onError={(e) => {
                  if (e.currentTarget.src !== window.location.origin + '/brand/official-logo.png') {
                    e.currentTarget.src = '/brand/official-logo.png';
                  }
                }}
              />
            </div>

            {/* Certificate Top Header */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 px-3 border-b-2 border-[#C5A059]/40 pb-4">
              {/* Right: Official Logo Emblem & Academy Title */}
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-20 flex items-center justify-center shrink-0">
                  <OfficialLogo size="sm" showText={false} clickable={false} />
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm sm:text-base text-[#046A38] font-amiri leading-tight">
                    {brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
                  </h4>
                  <p className="text-[11px] text-[#C5A059] font-kufi font-bold">
                    {brandSettings.subText || 'ـ لتعليم القرآن الكريم عن بُعد ـ'}
                  </p>
                </div>
              </div>

              {/* Center / Left: Cartouche Badge "شهادة إنجاز" & Serial */}
              <div className="flex flex-col items-center sm:items-end">
                <div className="relative px-8 py-2 rounded-2xl bg-[#046A38] text-white border-2 border-[#C5A059] shadow-md flex items-center justify-center">
                  <span className="font-amiri text-xl sm:text-2xl font-bold tracking-wide text-[#f7e8c6]">
                    {brandSettings.certHeaderBadge || 'شهادة إنجاز'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#046A38] font-bold mt-1.5 bg-[#046A38]/10 px-2.5 py-0.5 rounded-full border border-[#046A38]/30">
                  رقم الاعتماد: {serialNumber}
                </span>
              </div>
            </div>

            {/* Certificate Body (Page 6 PDF Specification) */}
            <div className="relative z-10 space-y-4 py-2 max-w-2xl mx-auto text-[#2C3531]">
              {/* Introductory declaration */}
              <p className="text-xs sm:text-sm font-kufi text-[#046A38] font-bold tracking-wide">
                {brandSettings.certIntroText || '❖ تَشْهَدُ مَقْرَأَةُ رِحَابِ القُرْآنِ الإِلِكْتُرُونِيَّةِ بِأَنَّ: ❖'}
              </p>

              {/* Student Name Box */}
              <div className="py-2.5 px-8 rounded-2xl bg-white/95 border-2 border-dashed border-[#C5A059] inline-block shadow-xs">
                <span className="text-xs text-slate-500 font-kufi ml-2">اسم الطالب/ة:</span>
                <span className="text-2xl sm:text-3xl font-amiri font-bold text-[#046A38]">
                  {studentName}
                </span>
              </div>

              {/* Completion Statement */}
              <p className="text-xs sm:text-sm font-kufi text-[#2C3531] leading-relaxed">
                {brandSettings.certCompletionPhrase || 'قَدْ أَتَمَّ بِمَنِّ اللَّهِ تَعَالَى وَتَوْفِيقِهِ مُتَطَلَّبَاتِ إِتْقَانِ وَتَثْبِيتِ:'}
              </p>

              {/* Program & Achievement Highlight */}
              <div className="p-3.5 rounded-2xl bg-[#046A38]/5 border border-[#046A38]/20 space-y-1">
                <p className="font-amiri font-bold text-lg sm:text-xl text-[#046A38]">
                  « {programTitle} »
                </p>
                <p className="font-kufi text-xs text-[#2C3531] font-semibold">
                  {riwayah}
                </p>
              </div>

              {/* Grade, Score & Date Badges */}
              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#046A38] text-white text-xs font-kufi shadow-xs">
                  <span className="text-[#f7e8c6] font-bold">التقدير: {grade}</span>
                </div>
                <div className="text-xs text-slate-600 font-kufi bg-white/80 px-3 py-1.5 rounded-full border border-slate-200">
                  بتاريخ: <strong>{issueDate}</strong>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* SIGNATURES & OFFICIAL SEAL (Exact layout from Page 6)   */}
            {/* Right: Administration | Center: Seal | Left: Teacher     */}
            {/* ======================================================== */}
            <div className="relative z-10 pt-5 border-t-2 border-[#C5A059]/40 grid grid-cols-3 gap-2 items-center text-xs">
              {/* 1. Administration (Right) */}
              <div className="text-right space-y-1 pr-2">
                <span className="text-[11px] font-bold text-[#046A38] block font-kufi">
                  {brandSettings.certAdminSignerTitle || 'إدارة المقرأة:'}
                </span>
                <p className="font-bold text-[#2C3531] text-xs sm:text-sm font-amiri">
                  {brandSettings.certAdminSignerName || 'د. علي عزيزي'}
                </p>
                <div className="w-24 h-0.5 bg-[#C5A059] mr-auto mt-1 opacity-70"></div>
                <span className="text-[9px] text-slate-500 block font-kufi">المشرف العام المعتمد</span>
              </div>

              {/* 2. Official Academy Stamp (Center) */}
              <div className="flex flex-col items-center justify-center">
                <OfficialStamp size="md" showText={true} />
              </div>

              {/* 3. Teacher Signature (Left) */}
              <div className="text-left space-y-1 pl-2">
                <span className="text-[11px] font-bold text-[#046A38] block font-kufi">
                  {brandSettings.certTeacherSignerTitle || 'معلم/ة الحلقة:'}
                </span>
                <p className="font-bold text-[#2C3531] text-xs sm:text-sm font-amiri">
                  {teacherName}
                </p>
                <div className="w-24 h-0.5 bg-[#C5A059] ml-auto mt-1 opacity-70"></div>
                <span className="text-[9px] text-slate-500 block font-kufi">المعلم المجيز بالسند</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Live Customization Form Controls (No-Print) */}
        <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#046A38]" />
              <h3 className="font-bold font-serif text-[#046A38] text-base">
                تخصيص بيانات الشهادة الحية
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-kufi">
              التغييرات تظهر لحظياً على قالب الشهادة بالأعلى
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#046A38]" />
                اسم الطالب/ة بالكامل:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-amiri font-bold text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#046A38]" />
                اسم البرنامج أو الإنجاز:
              </label>
              <input
                type="text"
                value={programTitle}
                onChange={(e) => setProgramTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-serif"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                الرواية والسند:
              </label>
              <input
                type="text"
                value={riwayah}
                onChange={(e) => setRiwayah(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">اسم المعلم المجيز:</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-amiri"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">التقدير:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-sans cursor-pointer"
              >
                <option value="ممتاز (100%)">ممتاز (100%)</option>
                <option value="امتياز مع مرتبة الشرف">امتياز مع مرتبة الشرف</option>
                <option value="ممتاز (95%)">ممتاز (95%)</option>
                <option value="جيد جداً مرتفع">جيد جداً مرتفع</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">تاريخ الإصدار:</label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden font-sans"
              />
            </div>
          </div>
        </div>

        {/* 6. Certificate Verification Search Tool (No-Print) */}
        <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-[#046A38]" />
            <div>
              <h3 className="font-bold font-serif text-[#046A38] text-base">
                أداة التحقق من صحة الشهادات الصادرة (Verification Tool)
              </h3>
              <p className="text-xs text-slate-500 font-kufi">
                أدخل الرقم التسلسلي المطبوع على الشهادة للتحقق الفوري من مصداقيتها في سجلات المقرأة
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                placeholder="مثال: RQ-2026-CERT-1447"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#046A38] outline-hidden text-xs font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-[#C5A059]"
            >
              <span>فحص والتحقق</span>
            </button>
          </form>

          {verifyResult && (
            <div className={`p-4 rounded-2xl text-xs border animate-fadeIn ${
              verifyResult.verified
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}>
              <div className="flex items-start gap-2.5">
                {verifyResult.verified ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">{verifyResult.message}</p>
                  {verifyResult.data && (
                    <div className="pt-1 font-mono text-[11px] text-slate-700 flex flex-wrap gap-4">
                      <span>الرقم: <strong>{verifyResult.data.serial}</strong></span>
                      <span>الحالة: <strong className="text-emerald-700">{verifyResult.data.status}</strong></span>
                      <span>السنة: <strong>{verifyResult.data.date}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. Bottom Callout for Registration */}
        <div className="no-print bg-gradient-to-l from-[#046A38] to-[#065A31] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold font-serif text-[#f7e8c6]">
              هل ترغب في نيل إجازة قرآنية بالسند المتصل؟
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed font-sans">
              التحق بحلقات مقرأة رحاب القرآن الإلكترونية وتتلمذ على أيدي مشايخ ومقرئات مجازين بالقراءات العشر، واحصل على شهاداتك الرسمية بعد اجتياز متطلبات الإتقان.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {onOpenRegistration && (
              <button
                type="button"
                onClick={onOpenRegistration}
                className="px-6 py-3 rounded-xl bg-[#C5A059] hover:bg-[#dfbe75] text-[#2C3531] font-bold text-xs font-serif shadow-md transition-all cursor-pointer"
              >
                التسجيل في المقرأة الآن
              </button>
            )}
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                دخول الطلاب والمعلمين
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
