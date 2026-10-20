import React from 'react';
import { MessageCircle, ExternalLink, Sparkles, BellRing } from 'lucide-react';
import { getBrandLogoSettings } from '../utils/brandLogoStore';

interface WhatsAppChannelBannerProps {
  variant?: 'card' | 'compact' | 'footer';
  className?: string;
}

export const WhatsAppChannelBanner: React.FC<WhatsAppChannelBannerProps> = ({
  variant = 'card',
  className = '',
}) => {
  const brandSettings = getBrandLogoSettings();
  const channelUrl = brandSettings.whatsappChannelUrl || 'https://whatsapp.com/channel/0029Vb4RehabQuran';

  if (variant === 'footer') {
    return (
      <div className={`mt-3 p-3.5 rounded-2xl bg-[#041a0e] border border-emerald-800/80 space-y-2 text-right ${className}`} dir="rtl">
        <div className="flex items-center gap-2">
          <span className="text-sm">📢</span>
          <span className="font-bold text-xs text-[#C5A059] font-serif">
            قناة مقرأة رحاب القرآن على واتساب
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
          تابعنا ليصلك كل جديد من إعلانات المقرأة، ومواعيد الحلقات، والأنشطة القرآنية.
        </p>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-slate-950 text-white" />
          <span>انضم إلى القناة عبر واتساب</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-4 rounded-2xl bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-[#25D366]/40 ${className}`} dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#25D366] flex items-center justify-center font-bold shrink-0 shadow-sm">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm font-serif">
              📢 تابع قناة مقرأة رحاب القرآن الإلكترونية على واتساب
            </h4>
            <p className="text-[11px] text-emerald-100 font-sans">
              تابعنا ليصلك كل جديد من إعلانات المقرأة، ومواعيد الحلقات، والأنشطة القرآنية.
            </p>
          </div>
        </div>

        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap self-end sm:self-center"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>انضم إلى القناة عبر واتساب</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#044e2a] via-[#075E54] to-[#044e2a] p-5 sm:p-7 text-white border-2 border-[#25D366]/50 shadow-xl ${className}`}
      dir="rtl"
    >
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-right">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white text-[#25D366] flex items-center justify-center font-bold shadow-xl shrink-0 border border-white/40 mt-1">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-[#25D366] font-bold text-xs border border-white/20 backdrop-blur-xs">
              <BellRing className="w-3.5 h-3.5 animate-bounce" />
              <span>إعلانات وأنشطة المقرأة الرسمية</span>
            </div>

            <h3 className="text-base sm:text-xl md:text-2xl font-bold font-serif text-white leading-tight">
              📢 تابع قناة مقرأة رحاب القرآن الإلكترونية على واتساب
            </h3>

            <p className="text-xs sm:text-sm text-emerald-100 font-sans leading-relaxed max-w-2xl">
              تابعنا ليصلك كل جديد من إعلانات المقرأة، ومواعيد الحلقات، والأنشطة القرآنية.
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl cursor-pointer hover:scale-102 active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950 text-white" />
            <span>انضم إلى القناة عبر واتساب</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
