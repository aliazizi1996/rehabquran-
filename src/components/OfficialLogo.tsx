import React, { useState, useEffect } from 'react';
import { Sparkles, X, Download, Share2, Check, ShieldCheck, Award, BookOpen, Sliders, Edit3, Wand2 } from 'lucide-react';
import { getBrandLogoSettings, BrandLogoCustomization, DEFAULT_BRAND_LOGO_SETTINGS, autoCalibrateBrandLogo } from '../utils/brandLogoStore';



interface OfficialLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  variant?: 'icon' | 'full' | 'badge' | 'emblem' | 'horizontal';
  theme?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  className?: string;
  clickable?: boolean;
  onOpenModal?: () => void;
  showEditTrigger?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  size = 'md',
  variant = 'badge',
  theme = 'auto',
  showText = true,
  className = '',
  clickable = false,
  onOpenModal,
  showEditTrigger = false,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [calibratedFeedback, setCalibratedFeedback] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(DEFAULT_BRAND_LOGO_SETTINGS);

  useEffect(() => {
    setBrandSettings(getBrandLogoSettings());

    const handleLogoUpdate = (e: any) => {
      if (e.detail) {
        setBrandSettings(e.detail);
      } else {
        setBrandSettings(getBrandLogoSettings());
      }
    };

    window.addEventListener('brand_logo_updated', handleLogoUpdate);
    return () => {
      window.removeEventListener('brand_logo_updated', handleLogoUpdate);
    };
  }, []);

  const handleQuickAutoCalibrate = () => {
    const updated = autoCalibrateBrandLogo('balanced');
    setBrandSettings(updated);
    setCalibratedFeedback('تمت المعايرة التلقائية بنجاح: زاوية 0° مستقيمة ونسبة متناسقة 100%');
    setTimeout(() => setCalibratedFeedback(null), 3500);
  };

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal();
    } else if (clickable) {
      setShowDetailModal(true);
    }
  };

  // Dimensions configuration
  const iconDimensions = {
    xs: 'w-8 h-8',
    sm: 'w-[56px] h-[56px] sm:w-[64px] sm:h-[64px]',
    md: 'w-[56px] h-[56px] sm:w-[64px] sm:h-[64px]',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
    '2xl': 'w-36 h-36 sm:w-44 sm:h-44',
    '3xl': 'w-52 h-52 sm:w-60 sm:h-60',
  }[size];

  const fullDimensions = {
    xs: 'w-24',
    sm: 'w-32',
    md: 'w-44',
    lg: 'w-60',
    xl: 'w-72',
    '2xl': 'w-80 sm:w-96',
    '3xl': 'w-96 sm:w-[420px]',
  }[size];

  // Effective Image URLs
  const activeLogoSrc = brandSettings.customLogoUrl || '/brand/official-logo.png';
  const activeSmallLogoSrc = brandSettings.customSmallLogoUrl || '/brand/official-logo-small.png';

  // Dynamic Visual Transforms
  const imageTransformStyle: React.CSSProperties = {
    transform: `scale(${brandSettings.scale}) rotate(${brandSettings.rotation}deg)`,
    filter: `brightness(${brandSettings.brightness}%) contrast(${brandSettings.contrast}%)`,
    transition: 'transform 0.2s ease, filter 0.2s ease',
  };

  return (
    <>
      {/* ---------------------------------------------------- */}
      {/* RENDER MODE 0: EMBLEM ONLY (Self-Contained Arched Medallion from PNG) */}
      {/* ---------------------------------------------------- */}
      {variant === 'emblem' && (
        <div
          onClick={handleClick}
          className={`relative inline-flex items-center justify-center select-none transition-transform duration-300 ${
            clickable || onOpenModal ? 'cursor-pointer hover:scale-[1.02]' : ''
          } ${className}`}
        >
          <div className={`${fullDimensions} mx-auto flex items-center justify-center`}>
            <img
              src={activeLogoSrc}
              alt={brandSettings.titleText}
              loading="lazy"
              decoding="async"
              style={imageTransformStyle}
              className="w-full h-auto object-contain select-none filter drop-shadow-xl"
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* RENDER MODE 1: FULL PROMINENT DISPLAY (Arch + Texts from PNG) */}
      {/* ---------------------------------------------------- */}
      {variant === 'full' && (
        <div
          onClick={handleClick}
          className={`flex flex-col items-center select-none ${
            clickable || onOpenModal ? 'cursor-pointer group' : ''
          } ${className}`}
        >
          {/* Main Card with Warm Ivory (#F9F6F0) Backing from the Brand Guide */}
          <div className="relative p-4 sm:p-5 rounded-3xl bg-[#F9F6F0] text-[#2C3531] border-2 border-[#C5A059] shadow-2xl shadow-emerald-950/50 overflow-hidden group-hover:border-[#dfbe75] transition-all duration-300">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#046A38]/5 via-transparent to-[#C5A059]/10 pointer-events-none" />

            {/* Top Official Accreditation Tag */}
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#046A38] text-white text-xs font-bold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#dfbe75]" />
                <span>الهوية الرسمية المعتمدة</span>
              </div>
              <span className="text-xs font-serif text-[#046A38] font-bold bg-[#C5A059]/20 px-2.5 py-1 rounded-full border border-[#C5A059]/40">
                1447 هـ
              </span>
            </div>

            {/* Official Logo PNG Graphic */}
            <div className={`${fullDimensions} mx-auto transition-transform duration-300 group-hover:scale-[1.02] relative z-10 flex items-center justify-center py-2`}>
              <img
                src={activeLogoSrc}
                alt={brandSettings.titleText}
                loading="lazy"
                decoding="async"
                style={imageTransformStyle}
                className="w-full h-auto object-contain select-none filter drop-shadow-2xl"
              />
            </div>

            {/* Bottom Interactive Prompt if clickable */}
            {(clickable || onOpenModal) && (
              <div className="mt-3 pt-2.5 border-t border-[#C5A059]/20 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#046A38] group-hover:text-[#068346] transition-colors relative z-10">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>دليل وتعديل الهوية البصرية</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* RENDER MODE 2: ICON ONLY (For circular buttons / header from PNG) */}
      {/* ---------------------------------------------------- */}
      {variant === 'icon' && (
        <div
          onClick={handleClick}
          className={`relative ${iconDimensions} rounded-2xl bg-[#F9F6F0] p-1 border border-[#C5A059] shadow-md shadow-emerald-950/40 flex items-center justify-center shrink-0 overflow-hidden ${
            clickable || onOpenModal ? 'cursor-pointer hover:border-[#dfbe75] hover:scale-105 transition-all' : ''
          } ${className}`}
        >
          <img
            src={activeSmallLogoSrc}
            alt={brandSettings.titleText}
            loading="lazy"
            decoding="async"
            style={imageTransformStyle}
            className="w-full h-full object-contain select-none"
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* RENDER MODE 3: BADGE (Icon + Title alongside from PNG) */}
      {/* ---------------------------------------------------- */}
      {variant === 'badge' && (
        <div
          onClick={handleClick}
          className={`flex items-center gap-3 ${
            clickable || onOpenModal ? 'cursor-pointer group' : ''
          } ${className}`}
        >
          {/* Logo Icon Frame */}
          <div className={`relative ${iconDimensions} rounded-2xl bg-[#F9F6F0] p-1 border border-[#C5A059] shadow-lg shadow-emerald-950/60 flex items-center justify-center shrink-0 group-hover:border-[#dfbe75] transition-all overflow-hidden`}>
            <img
              src={activeSmallLogoSrc}
              alt={brandSettings.titleText}
              loading="lazy"
              decoding="async"
              style={imageTransformStyle}
              className="w-full h-full object-contain select-none"
            />
          </div>

          {showText && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-base sm:text-lg leading-tight font-serif">
                  {brandSettings.titleText}
                </span>
                <span className="text-[10px] bg-[#C5A059]/25 text-[#f5c754] px-2 py-0.5 rounded-full border border-[#C5A059]/50 font-bold">
                  الرسمية
                </span>
              </div>
              <span className="text-xs sm:text-sm text-emerald-300 font-medium mt-0.5 font-kufi">
                {brandSettings.subText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* RENDER MODE 4: HORIZONTAL (Header Logo from PNG)      */}
      {/* ---------------------------------------------------- */}
      {variant === 'horizontal' && (
        <div
          onClick={handleClick}
          className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none overflow-hidden max-w-full ${
            clickable || onOpenModal ? 'cursor-pointer group hover:opacity-95 transition-opacity' : ''
          } ${className}`}
        >
          <div className="w-[56px] h-[56px] min-w-[56px] min-h-[56px] sm:w-[64px] sm:h-[64px] sm:min-w-[64px] sm:min-h-[64px] shrink-0 rounded-xl bg-[#F9F6F0] p-1 border border-[#C5A059] shadow-xs flex items-center justify-center">
            <img
              src={activeSmallLogoSrc}
              alt={brandSettings.titleText}
              loading="lazy"
              decoding="async"
              style={{
                ...imageTransformStyle,
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className="select-none filter drop-shadow-xs"
            />
          </div>
          <div className="flex flex-col text-right justify-center min-w-0">
            <span className="font-amiri font-bold text-base sm:text-xl md:text-2xl text-[#046A38] leading-tight truncate">
              {brandSettings.titleText}
            </span>
            <span className="font-kufi text-[11px] sm:text-xs text-[#C5A059] font-bold mt-0.5 truncate">
              {brandSettings.sloganText || 'ـ لتعليم وحفظ القرآن الكريم عن بُعد ـ'}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PROMINENT LOGO MODAL (دليل الهوية البصرية المعتمدة 2026)  */}
      {/* ======================================================== */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-[#0a2318] border-2 border-[#C5A059] rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-4 bg-[#06150e] border-b border-emerald-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
                <div>
                  <h3 className="text-base font-bold text-white font-amiri">دليل الهوية البصرية المعتمدة</h3>
                  <p className="text-xs text-emerald-300 font-kufi">{brandSettings.titleText}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Prominent Logo Showcase & Official Brand Guide Details */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Logo Presentation in Warm Ivory Card */}
              <div className="p-5 rounded-2xl bg-[#F9F6F0] text-[#2C3531] border-2 border-[#C5A059] shadow-xl text-center">
                <div className="w-56 sm:w-64 mx-auto py-2">
                  <img
                    src={activeLogoSrc}
                    alt="الشعار الرسمي المعتمد"
                    loading="lazy"
                    decoding="async"
                    style={imageTransformStyle}
                    className="w-full h-auto object-contain drop-shadow-2xl mx-auto select-none"
                  />
                </div>
                <p className="text-xs text-[#046A38] font-bold mt-2 font-kufi">
                  {brandSettings.titleText}
                </p>

                {/* Feedback pill */}
                {calibratedFeedback && (
                  <div className="mt-2.5 p-2 rounded-xl bg-emerald-900/95 border border-emerald-400 text-white text-xs font-kufi font-bold animate-fade-in flex items-center justify-center gap-1.5 shadow-md">
                    <Check className="w-4 h-4 text-[#dfbe75]" />
                    <span>{calibratedFeedback}</span>
                  </div>
                )}

              </div>

              {/* 1. Official Color Palette (الألوان المعتمدة من الدليل) */}
              <div className="p-4 rounded-2xl bg-[#0d261b] border border-emerald-800/80 text-xs space-y-3 text-slate-200">
                <div className="flex items-center gap-2 text-[#dfbe75] font-bold text-sm font-amiri">
                  <Award className="w-4 h-4 text-[#C5A059]" />
                  <span>لوحة الألوان الرسمية المعتمدة (Brand Colors):</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#046A38] text-white flex items-center gap-2 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-white"></span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">أخضر زمردي</div>
                      <div className="font-mono text-[10px] text-emerald-200">#046A38</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#C5A059] text-slate-950 flex items-center gap-2 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-black/15 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-white"></span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">ذهبي ملكي</div>
                      <div className="font-mono text-[10px] text-amber-950 font-bold">#C5A059</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F9F6F0] text-[#2C3531] flex items-center gap-2 shadow-xs border border-[#C5A059]/40">
                    <div className="w-7 h-7 rounded-lg bg-[#046A38]/15 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#046A38]"></span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">عاجي دافئ</div>
                      <div className="font-mono text-[10px] text-slate-600">#F9F6F0</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#2C3531] text-white flex items-center gap-2 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#C5A059]"></span>
                    </div>
                    <div>
                      <div className="font-bold text-xs">رمادي داكن</div>
                      <div className="font-mono text-[10px] text-slate-300">#2C3531</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Official Typography (الخطوط المعتمدة) */}
              <div className="p-3.5 rounded-xl bg-[#06150e] border border-emerald-950 text-xs text-slate-300 space-y-2 font-kufi">
                <div className="text-[#dfbe75] font-bold flex items-center gap-1.5 font-amiri text-sm">
                  <BookOpen className="w-4 h-4 text-[#C5A059]" />
                  <span>الخطوط والتنسيق المعتمد:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#0b2116] border border-emerald-900">
                    <span className="text-[#dfbe75] font-bold block font-amiri text-xs">خط أميري (Amiri):</span>
                    <span className="text-slate-300 block text-[10px] mt-0.5">للعناوين، الشعارات، والشهادات الرسمية</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0b2116] border border-emerald-900">
                    <span className="text-emerald-300 font-bold block font-kufi text-xs">خط نوتو كوفي (Noto Kufi):</span>
                    <span className="text-slate-300 block text-[10px] mt-0.5">لنصوص المتن، البيانات، والقراءة الرقمية</span>
                  </div>
                </div>
              </div>

              {/* 3. Official Brand Assets Files (ملفات الهوية المعتمدة) */}
              <div className="p-3.5 rounded-xl bg-[#06150e] border border-emerald-900/80 text-xs text-slate-300 space-y-2 font-kufi">
                <div className="text-[#dfbe75] font-bold flex items-center gap-1.5 font-amiri text-sm">
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  <span>ملفات الشعار والختم المعتمدة للتحميل المباشر:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <a
                    href="/brand/official-logo.png"
                    download="official-logo.png"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#0b2116] hover:bg-[#0e2a1d] border border-emerald-800 flex items-center justify-between gap-1 transition-colors text-slate-200"
                  >
                    <span>شعار الهيدر العريض (PNG)</span>
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                  <a
                    href="/brand/official-logo.png"
                    download="official-logo.png"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#0b2116] hover:bg-[#0e2a1d] border border-emerald-800 flex items-center justify-between gap-1 transition-colors text-slate-200"
                  >
                    <span>الشعار الكامل (PNG)</span>
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                  <a
                    href="/brand/official-logo-small.png"
                    download="official-logo-small.png"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#0b2116] hover:bg-[#0e2a1d] border border-emerald-800 flex items-center justify-between gap-1 transition-colors text-slate-200"
                  >
                    <span>أيقونة الشعار (PNG)</span>
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                  <a
                    href="/brand/official-seal.png"
                    download="official-seal.png"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#0b2116] hover:bg-[#0e2a1d] border border-emerald-800 flex items-center justify-between gap-1 transition-colors text-slate-200"
                  >
                    <span>الختم المعتمد (PNG)</span>
                    <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                </div>
              </div>

              {/* 4. Usage Guidelines (ضوابط الاستخدام من الدليل) */}
              <div className="p-3.5 rounded-xl bg-[#0d261b] border border-emerald-800/80 text-xs text-slate-300 space-y-1.5">
                <span className="text-[#dfbe75] font-bold block font-amiri">ضوابط الشعار المعتمد:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed">
                  <li>الرمز البصري: المصحف الشريف المفتوح بأنوار صاعدة وقوس إسلامي زمردي.</li>
                  <li>عدم إضافة أي رموز خارجية (مثل الهلال والنجمة) للشعار التزاماً بالدليل.</li>
                  <li>استخدام النسخة الشفافة فوق الخلفيات الملونة الهادئة.</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 bg-[#06150e] border-t border-emerald-900 flex items-center justify-between gap-2">


              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://bucolic-mooncake-7af778.netlify.app');
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#046A38] hover:bg-[#068346] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-kufi"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-[#dfbe75]" />
                    <span>تم نسخ الرابط المعتمد</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#C5A059]" />
                    <span>مشاركة الرابط المعتمد</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="py-2.5 px-5 rounded-xl bg-[#C5A059] hover:bg-[#dfbe75] text-slate-950 font-bold text-xs sm:text-sm cursor-pointer transition-colors font-kufi"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

// ========================================================
// 7. THE OFFICIAL ELECTRONIC STAMP (الختم الإلكتروني المعتمد)
// As described on Pages 3 and 6 of the Official Brand Guide 2026:
// Circular emerald green (#046A38) realistic seal with transparent background.
// ========================================================
export interface OfficialStampProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const getSealDisplaySource = (source?: string) => {
  if (!source || source.split('?')[0] === '/brand/official-seal.png') {
    return '/brand/official-seal-display.webp';
  }
  return source;
};

export const OfficialStamp: React.FC<OfficialStampProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [settings, setSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());
  const [sealSrc, setSealSrc] = useState(() => getSealDisplaySource(settings.customSealUrl));

  useEffect(() => {
    const s = getBrandLogoSettings();
    setSettings(s);
    setSealSrc(getSealDisplaySource(s.customSealUrl));

    const handleUpdate = (e: any) => {
      const updated = e.detail || getBrandLogoSettings();
      setSettings(updated);
      setSealSrc(getSealDisplaySource(updated.customSealUrl));
      setUseFallback(false);
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  const stampSizes = {
    sm: 'w-20 h-20 sm:w-24 sm:h-24',
    md: 'w-28 h-28 sm:w-32 sm:h-32',
    lg: 'w-36 h-36 sm:w-40 sm:h-40',
    xl: 'w-48 h-48 sm:w-52 sm:h-52',
  }[size];

  const sealColor = settings.sealColor || '#046A38';
  const topText = settings.sealTextTop || 'مقرأة رحاب';
  const bottomText = settings.sealTextBottom || 'القرآن الإلكترونية';

  const transformStyle: React.CSSProperties = {
    transform: `scale(${settings.sealScale ?? 1}) rotate(${settings.sealRotation ?? 0}deg)`,
    opacity: settings.sealOpacity ?? 0.95,
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  };

  return (
    <div className={`relative ${stampSizes} select-none shrink-0 inline-flex flex-col items-center justify-center ${className}`}>
      {!useFallback ? (
        <img
          src={sealSrc}
          alt="الختم الرسمي لمقرأة رحاب القرآن الإلكترونية"
          loading="lazy"
          decoding="async"
          style={transformStyle}
          className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none hover:rotate-0 transition-transform duration-300"
          onError={() => setUseFallback(true)}
        />
      ) : (
        <svg
          viewBox="0 0 240 240"
          className="w-full h-auto overflow-visible"
          style={transformStyle}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Arc Path for Text */}
            <path
              id="stampTopArc"
              d="M 32,120 A 88,88 0 1,1 208,120"
              fill="none"
            />

            {/* Bottom Arc Path for Text */}
            <path
              id="stampBottomArc"
              d="M 208,120 A 88,88 0 0,1 32,120"
              fill="none"
            />
          </defs>

          {/* 1. Outer Solid Emerald Ring */}
          <circle
            cx="120"
            cy="120"
            r="114"
            fill="none"
            stroke={sealColor}
            strokeWidth="4"
          />

          {/* 2. Middle Decorative Beaded/Dotted Ring */}
          <circle
            cx="120"
            cy="120"
            r="105"
            fill="none"
            stroke={sealColor}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* 3. Inner Solid Separation Ring */}
          <circle
            cx="120"
            cy="120"
            r="72"
            fill="none"
            stroke={sealColor}
            strokeWidth="2.5"
          />

          {/* 4. Top Curved Text */}
          <text
            fill={sealColor}
            style={{
              fontFamily: "'Amiri', 'Cairo', serif",
              fontSize: '25px',
              fontWeight: 900,
              letterSpacing: '1px',
            }}
          >
            <textPath
              href="#stampTopArc"
              startOffset="50%"
              textAnchor="middle"
            >
              {topText}
            </textPath>
          </text>

          {/* 5. Bottom Curved Text */}
          <text
            fill={sealColor}
            style={{
              fontFamily: "'Noto Kufi Arabic', 'Cairo', sans-serif",
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '0.8px',
            }}
          >
            <textPath
              href="#stampBottomArc"
              startOffset="50%"
              textAnchor="middle"
            >
              {bottomText}
            </textPath>
          </text>

          {/* 6. Side Ornaments */}
          <g transform="translate(30, 120) scale(0.9)">
            <polygon points="0,-7 5,0 0,7 -5,0" fill={sealColor} />
            <circle cx="0" cy="-12" r="2" fill={sealColor} />
            <circle cx="0" cy="12" r="2" fill={sealColor} />
          </g>

          <g transform="translate(210, 120) scale(0.9)">
            <polygon points="0,-7 5,0 0,7 -5,0" fill={sealColor} />
            <circle cx="0" cy="-12" r="2" fill={sealColor} />
            <circle cx="0" cy="12" r="2" fill={sealColor} />
          </g>

          {/* 7. Center Emblem */}
          <g id="stampCenterQuran" transform="translate(120, 118) scale(0.85)">
            <path
              d="M -26,10 C -12,18 -4,25 0,28 C 4,25 12,18 26,10"
              fill="none"
              stroke={sealColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M -20,28 L 0,16 L 20,28"
              fill="none"
              stroke={sealColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 0,12 
                 C -14,8 -32,-3 -42,-14 
                 C -28,-14 -14,-7 0,-4 
                 C 14,-7 28,-14 42,-14 
                 C 32,-3 14,8 0,12 Z"
              fill="none"
              stroke={sealColor}
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path
              d="M -34,-9 C -24,-9 -12,-5 -2,-2"
              fill="none"
              stroke={sealColor}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M 2,-2 C 12,-5 24,-9 34,-9"
              fill="none"
              stroke={sealColor}
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <line x1="0" y1="-3" x2="0" y2="12" stroke={sealColor} strokeWidth="2" />
            <path
              d="M -12,34 C -5,38 0,39 0,42 C 0,39 5,38 12,34"
              fill="none"
              stroke={sealColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="0" cy="43" r="1.5" fill={sealColor} />
          </g>
        </svg>
      )}
      {showText && (
        <span className="text-[10px] font-mono text-[#046A38] font-bold mt-1">
          الختم الرسمي المعتمد
        </span>
      )}
    </div>
  );
};
