import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation, Copy, Check, Sparkles, Building, Compass, MessageCircle, Send, Youtube } from 'lucide-react';
import { getBrandLogoSettings } from '../utils/brandLogoStore';

interface MakraaLocationCardProps {
  variant?: 'card' | 'compact' | 'footer-inline';
  className?: string;
}

export const MakraaLocationCard: React.FC<MakraaLocationCardProps> = ({
  variant = 'card',
  className = '',
}) => {
  const brandSettings = getBrandLogoSettings();
  const MAPS_URL = brandSettings.googleMapsUrl || 'https://maps.app.goo.gl/eiRa7YpZgcxqAvuH8';
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCopyLink = async () => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(MAPS_URL);
        success = true;
      } catch {
        success = false;
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = MAPS_URL;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        success = false;
      }
    }
    if (success) {
      setCopied(true);
      setToastMsg('تم نسخ رابط موقع المقرأة على خرائط جوجل بنجاح');
      setTimeout(() => setCopied(false), 2500);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  if (variant === 'footer-inline') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`} dir="rtl">
        <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
        <span className="text-slate-300">المقر: {brandSettings.officialAddress || 'اليمن - ومن جميع دول العالم'}</span>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-300 hover:text-white font-bold underline inline-flex items-center gap-1 text-[11px] transition-colors"
          title="عرض موقع المقرأة على خرائط جوجل"
        >
          <span>موقع المقرأة على خرائط جوجل</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <div className="flex items-center gap-1.5 mr-1">
          <a
            href={brandSettings.whatsappUrl || "https://wa.me/967714371599"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-slate-950 transition-colors"
            title="تواصل عبر واتساب مع إدارة المقرأة"
            aria-label="واتساب الإدارة"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
          <a
            href={brandSettings.telegramUrl || "https://t.me/rehabpa"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-[#0088cc]/20 hover:bg-[#0088cc] text-[#0088cc] hover:text-white transition-colors"
            title="قناة مقرأة رحاب القرآن على تيليجرام"
            aria-label="تيليجرام الإدارة"
          >
            <Send className="w-3.5 h-3.5" />
          </a>
          <a
            href={brandSettings.youtubeUrl || "https://www.youtube.com/@RehabQuran-s5m"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white transition-colors"
            title="قناة مقرأة رحاب القرآن على يوتيوب"
            aria-label="يوتيوب المقرأة"
          >
            <Youtube className="w-3.5 h-3.5" />
          </a>
          <a
            href={brandSettings.tiktokUrl || "https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/"}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg bg-slate-800/20 hover:bg-slate-900 text-slate-800 hover:text-white transition-colors"
            title="حساب مقرأة رحاب القرآن على تيك توك"
            aria-label="تيك توك المقرأة"
          >
            <span className="text-[10px] leading-none">🎵</span>
          </a>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${className}`} dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#046A38] border border-emerald-200 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#046A38]" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
              موقع المقرأة على خرائط جوجل
            </h4>
            <p className="text-[11px] text-slate-500 font-sans">
              {brandSettings.officialAddress || 'اليمن — ومن جميع دول العالم عبر منظومة المقرأة السحابية'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            title="نسخ رابط الموقع"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-[#C5A059]"
          >
            <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>فتح الخريطة ↗</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-white border-2 border-[#C5A059]/50 p-6 sm:p-7 shadow-sm space-y-4 ${className}`} dir="rtl">
      {toastMsg && (
        <div className="p-3 bg-emerald-900 border border-emerald-400 text-white rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{toastMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-200">Google Maps</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#046A38] to-[#088247] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-[#C5A059]/50">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
                موقع المقرأة على خرائط جوجل
              </h3>
              <span className="text-[10px] bg-emerald-50 text-[#046A38] border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                الموقع الرسمي
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              مقرأة رحاب القرآن الإلكترونية — موقع المقرأة المعتمد على Google Maps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            title="نسخ رابط الموقع الجغرافي"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ بنجاح' : 'نسخ الرابط'}</span>
          </button>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 border border-[#C5A059]"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>عرض على خرائط جوجل</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>

      {/* Visual Location Preview Container */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 via-[#F9F6F0] to-emerald-50 p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#046A38]">
            <Building className="w-4 h-4 text-[#C5A059]" />
            <span>المقر والموقع الجغرافي المعتمد:</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans max-w-xl">
            يمكنكم زيارة موقع المقرأة أو تحديد المسار والاتجاهات الجغرافية مباشرة عبر تطبيق خرائط جوجل.
          </p>
          <div className="font-mono text-xs text-slate-500 dir-ltr text-right select-all">
            {MAPS_URL}
          </div>
        </div>

        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#046A38] border-2 border-[#046A38] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <MapPin className="w-4 h-4 text-[#046A38]" />
          <span>فتح الموقع والاتجاهات ↗</span>
        </a>
      </div>
    </div>
  );
};
