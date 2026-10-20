import React, { useState } from 'react';
import { 
  Building2, Wallet, Copy, Check, ChevronDown, ChevronUp, 
  HeartHandshake, Sparkles, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export const FooterSupportDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Official Verified Accounts
  const KURAIMI_YER = '3204541287'; // بنك الكريمي - بالريال اليمني
  const KURAIMI_SAR = '3204371368'; // بنك الكريمي - بالريال السعودي
  const JEEB_WALLET = '313146';     // محفظة جيب

  const copyToClipboard = async (text: string, label: string, key: string) => {
    let success = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

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
        console.error('Copy fallback failed:', err);
        success = false;
      }
    }

    if (success) {
      setCopiedKey(key);
      setToastMessage(`تم نسخ رقم ${label} بنجاح: ${text}`);
      setTimeout(() => setCopiedKey(null), 2500);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="w-full mt-6 pt-6 border-t border-[#C5A059]/30" dir="rtl">
      {/* Toast confirmation */}
      {toastMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-900 border border-emerald-400 text-white text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-200">جاهز للصق في تطبيق التحويل</span>
        </div>
      )}

      {/* Main Big Bold Header / Trigger Button */}
      <div className="flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="footer-support-dropdown"
          className="group w-full max-w-2xl px-6 py-4 rounded-2xl bg-gradient-to-r from-[#034423] via-[#046A38] to-[#034423] hover:from-[#04522a] hover:to-[#04522a] border-2 border-[#C5A059] shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>💚 دعم المقرأة وكفالة حلقات القرآن الكريم</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-sans mt-0.5">
                {isOpen ? 'انقر لإغلاق قائمة الحسابات وطرق التحويل' : 'اضغط هنا لعرض الحسابات البنكية وطرق التحويل المعتمدة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-[#C5A059] hidden sm:inline-block">
              {isOpen ? 'إخفاء' : 'عرض الحسابات'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-black/30 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>
      </div>

      {/* Collapsible Dropdown Content */}
      {isOpen && (
        <div 
          id="footer-support-dropdown"
          className="mt-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#022814] via-[#03331b] to-[#011a0d] border-2 border-[#C5A059]/70 shadow-2xl space-y-6 animate-fade-in"
        >
          {/* Header Explanation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/80 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-sm sm:text-base font-bold font-serif text-white">
                  طرق التحويل والحسابات الرسمية المعتمدة 1447هـ
                </h4>
              </div>
              <p className="text-xs text-emerald-200/80 font-sans">
                مساهمتكم الكريمة تسهم في استمرار الحلقات القرآنية وكفالة معلمي كتاب الله وتغطية نفقات التعليم عن بُعد.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] bg-black/40 px-3 py-1.5 rounded-xl border border-[#C5A059]/40 w-fit shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>حسابات موثقة</span>
            </div>
          </div>

          {/* Accounts Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Kuraimi - YER */}
            <div className="rounded-2xl bg-[#041a0e] border border-emerald-600/60 hover:border-[#C5A059] p-4 flex flex-col justify-between space-y-3 shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#C5A059] flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">الكريمي</span>
                      <span className="text-[11px] text-emerald-300 block font-medium">العملة اليمنية (YER)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 font-bold">
                    ريال يمني
                  </span>
                </div>

                {/* Account Number Box */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-emerald-900 text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">رقم الحساب:</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-amber-300 tracking-wider dir-ltr select-all block">
                    {KURAIMI_YER}
                  </span>
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => copyToClipboard(KURAIMI_YER, 'الكريمي (ريال يمني)', 'yer')}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  copiedKey === 'yer'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم الحساب بالعملة اليمنية"
              >
                {copiedKey === 'yer' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>تم نسخ الرقم ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرقم</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Kuraimi - SAR */}
            <div className="rounded-2xl bg-[#041a0e] border border-amber-600/60 hover:border-[#C5A059] p-4 flex flex-col justify-between space-y-3 shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#C5A059] flex items-center justify-center font-bold text-xs border border-amber-500/30">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">الكريمي</span>
                      <span className="text-[11px] text-amber-300 block font-medium">العملة السعودية (SAR)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 font-bold">
                    ريال سعودي
                  </span>
                </div>

                {/* Account Number Box */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-amber-900 text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">رقم الحساب:</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-amber-300 tracking-wider dir-ltr select-all block">
                    {KURAIMI_SAR}
                  </span>
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => copyToClipboard(KURAIMI_SAR, 'الكريمي (ريال سعودي)', 'sar')}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  copiedKey === 'sar'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم الحساب بالعملة السعودية"
              >
                {copiedKey === 'sar' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>تم نسخ الرقم ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرقم</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Jeeb Wallet */}
            <div className="rounded-2xl bg-[#041a0e] border border-teal-600/60 hover:border-[#C5A059] p-4 flex flex-col justify-between space-y-3 shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">محفظة جيب</span>
                      <span className="text-[11px] text-teal-300 block font-medium">رقم المحفظة المعتمد</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-700/60 font-bold">
                    محفظة إلكترونية
                  </span>
                </div>

                {/* Wallet Number Box */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-teal-900 text-center space-y-0.5">
                  <span className="text-[10px] text-teal-300 block">رقم المحفظة:</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-teal-300 tracking-wider dir-ltr select-all block">
                    {JEEB_WALLET}
                  </span>
                </div>
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={() => copyToClipboard(JEEB_WALLET, 'محفظة جيب', 'jeeb')}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  copiedKey === 'jeeb'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#C5A059] hover:bg-[#b08d47] text-slate-950 hover:text-black'
                }`}
                title="نسخ رقم محفظة جيب"
              >
                {copiedKey === 'jeeb' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>تم نسخ الرقم ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرقم</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Close toggle footer */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-emerald-950">
            <span>قال النبي ﷺ: «خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ»</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer text-xs"
            >
              إغلاق القائمة ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
