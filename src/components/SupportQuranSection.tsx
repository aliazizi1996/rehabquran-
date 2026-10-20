import React, { useState } from 'react';
import { 
  Building2, Wallet, Copy, Check, HeartHandshake, 
  Sparkles, ShieldCheck, CheckCircle2 
} from 'lucide-react';

interface SupportQuranSectionProps {
  variant?: 'standalone' | 'embedded';
  className?: string;
}

export const SupportQuranSection: React.FC<SupportQuranSectionProps> = ({
  variant = 'standalone',
  className = '',
}) => {
  // Official Accounts specified by the administration
  const KURAIMI_YER_ACCOUNT = '3204541287'; // بنك الكريمي - بالعملة اليمنية
  const KURAIMI_SAR_ACCOUNT = '3204371368'; // بنك الكريمي - بالعملة السعودية
  const JEEB_WALLET_NUMBER = '313146';     // محفظة جيب - رقم المحفظة

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string, key: string) => {
    let success = false;

    // 1. Modern Clipboard API (Desktop & modern Mobile)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

    // 2. Fallback for older mobile browsers, WebViews or iframe contexts
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Fallback copy failed', err);
        success = false;
      }
    }

    if (success) {
      setCopiedKey(key);
      setToastMessage(`تم نسخ رقم ${label} بنجاح: ${text}`);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2500);
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }
  };

  return (
    <section 
      aria-label="ادعم مقرأة رحاب القرآن واكفل حلقات القرآن الكريم"
      className={`relative w-full rounded-3xl overflow-hidden transition-all duration-300 border-2 border-[#C5A059]/80 shadow-xl ${
        variant === 'standalone' 
          ? 'bg-gradient-to-br from-[#034d28] via-[#046A38] to-[#02371c] text-white p-6 sm:p-8 md:p-10' 
          : 'bg-gradient-to-br from-[#046A38] via-[#055b30] to-[#034423] text-white p-5 sm:p-7'
      } ${className}`}
      dir="rtl"
    >
      {/* Decorative Quranic Background Ornaments */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-6 bottom-4 opacity-10 pointer-events-none hidden lg:block">
        <img 
          src="/brand/official-seal.png" 
          alt="ختم المقرأة المعتمد" 
          width={160}
          height={160}
          loading="lazy" 
          decoding="async" 
          className="w-40 h-40 object-contain" 
        />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full text-xs text-[#C5A059] font-bold border border-[#C5A059]/40 backdrop-blur-xs">
            <HeartHandshake className="w-4 h-4 text-[#C5A059]" />
            <span>مساهمة مباركة وصدقة جارية</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-white tracking-wide flex items-center gap-2.5">
              <span>ادعم مقرأة رحاب القرآن واكفل حلقات القرآن الكريم</span>
            </h2>

            <div className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] bg-black/25 px-3 py-1 rounded-xl border border-[#C5A059]/30 w-fit shrink-0 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>حسابات رسمية معتمدة</span>
            </div>
          </div>

          {/* Description Content */}
          <p className="text-sm sm:text-base text-emerald-100/95 leading-relaxed max-w-4xl font-sans">
            ساهم في دعم مقرأة رحاب القرآن الإلكترونية، والمساعدة في استمرار حلقات تحفيظ القرآن الكريم وتعليم كتاب الله، ودعم المعلمين وتكاليف التعليم عن بُعد.
          </p>
        </div>

        {/* Motivational Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 border border-[#C5A059]/40 backdrop-blur-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0 animate-pulse" />
          <p className="text-xs sm:text-sm font-serif font-bold text-amber-200 leading-normal">
            «بدعمكم تستمر حلقات القرآن الكريم، ويستمر تعليم كتاب الله»
          </p>
        </div>

        {/* Toast confirmation for copying */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-900/90 border border-emerald-400 text-white text-xs sm:text-sm flex items-center justify-between gap-2 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-bold">{toastMessage}</span>
            </div>
            <span className="text-[11px] text-emerald-200">جاهز للصق في تطبيق البنك</span>
          </div>
        )}

        {/* Methods Header */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white font-serif border-b border-white/15 pb-2">
          <span>💳 طرق التحويل والدعم:</span>
        </div>

        {/* Transfer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Card 1: Kuraimi - Yemeni Riyal */}
          <div className="rounded-2xl bg-[#032313]/90 border-2 border-emerald-500/50 hover:border-[#C5A059] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-serif">الكريمي</h3>
                    <span className="text-xs text-emerald-300 font-medium">الحساب بالعملة اليمنية</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 shrink-0">
                  ريال يمني (YER)
                </span>
              </div>

              {/* Number Container */}
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-800/80 space-y-1">
                <span className="text-[11px] text-slate-300 block font-medium">رقم الحساب بالعملة اليمنية:</span>
                <div className="flex items-center justify-center py-1">
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider dir-ltr select-all">
                    {KURAIMI_YER_ACCOUNT}
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <div className="pt-3 mt-3 border-t border-emerald-900/80">
              <button
                type="button"
                onClick={() => copyToClipboard(KURAIMI_YER_ACCOUNT, 'حساب الكريمي (ريال يمني)', 'kuraimi-yer')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  copiedKey === 'kuraimi-yer'
                    ? 'bg-emerald-600 text-white border border-emerald-300'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم الحساب بالعملة اليمنية"
              >
                {copiedKey === 'kuraimi-yer' ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>تم نسخ رقم الحساب ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ رقم الحساب</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Kuraimi - Saudi Riyal */}
          <div className="rounded-2xl bg-[#032313]/90 border-2 border-amber-500/60 hover:border-[#C5A059] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-serif">الكريمي</h3>
                    <span className="text-xs text-amber-300 font-medium">الحساب بالعملة السعودية</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 shrink-0">
                  ريال سعودي (SAR)
                </span>
              </div>

              {/* Number Container */}
              <div className="p-3 rounded-xl bg-black/40 border border-amber-800/80 space-y-1">
                <span className="text-[11px] text-slate-300 block font-medium">رقم الحساب بالعملة السعودية:</span>
                <div className="flex items-center justify-center py-1">
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-300 tracking-wider dir-ltr select-all">
                    {KURAIMI_SAR_ACCOUNT}
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <div className="pt-3 mt-3 border-t border-emerald-900/80">
              <button
                type="button"
                onClick={() => copyToClipboard(KURAIMI_SAR_ACCOUNT, 'حساب الكريمي (ريال سعودي)', 'kuraimi-sar')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  copiedKey === 'kuraimi-sar'
                    ? 'bg-emerald-600 text-white border border-emerald-300'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم الحساب بالعملة السعودية"
              >
                {copiedKey === 'kuraimi-sar' ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>تم نسخ رقم الحساب ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ رقم الحساب</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 3: Jeeb Wallet */}
          <div className="rounded-2xl bg-[#032313]/90 border-2 border-teal-500/60 hover:border-[#C5A059] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between shadow-lg relative group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center font-bold shrink-0">
                    <Wallet className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-serif">محفظة جيب</h3>
                    <span className="text-xs text-teal-300 font-medium">رقم المحفظة المعتمد</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-700/60 shrink-0">
                  محفظة إلكترونية
                </span>
              </div>

              {/* Number Container */}
              <div className="p-3 rounded-xl bg-black/40 border border-teal-800 space-y-1">
                <span className="text-[11px] text-teal-300 block font-medium">رقم المحفظة:</span>
                <div className="flex items-center justify-center py-1">
                  <span className="font-mono text-xl sm:text-2xl font-black text-teal-300 tracking-wider dir-ltr select-all">
                    {JEEB_WALLET_NUMBER}
                  </span>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <div className="pt-3 mt-3 border-t border-emerald-900/80">
              <button
                type="button"
                onClick={() => copyToClipboard(JEEB_WALLET_NUMBER, 'محفظة جيب', 'jeeb-wallet')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  copiedKey === 'jeeb-wallet'
                    ? 'bg-emerald-600 text-white border border-emerald-300'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم محفظة جيب"
              >
                {copiedKey === 'jeeb-wallet' ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>تم نسخ رقم المحفظة ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ رقم المحفظة</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-200/90 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[#C5A059]">❖</span>
            <span>مقرأة رحاب القرآن الإلكترونية — صرح قرآني تعليمي لنشر كتاب الله وإقرائه بالسند المتصل</span>
          </div>
          <span className="text-amber-300 font-medium">جزاكم الله خير الجزاء ونفع بكم</span>
        </div>
      </div>
    </section>
  );
};
