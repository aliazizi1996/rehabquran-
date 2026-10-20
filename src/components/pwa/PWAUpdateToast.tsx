import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { applyPWAUpdate } from '../../utils/pwaServiceWorker';

export const PWAUpdateToast: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setShowUpdate(true);
    };

    window.addEventListener('pwa_update_available', handleUpdate);
    return () => window.removeEventListener('pwa_update_available', handleUpdate);
  }, []);

  if (!showUpdate) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-update-title"
      className="fixed top-4 left-4 right-4 sm:right-auto sm:left-6 z-50 p-4 rounded-2xl bg-[#046A38] text-white shadow-2xl border-2 border-[#C5A059] max-w-sm animate-slideDown"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center shrink-0 border border-[#C5A059]/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 id="pwa-update-title" className="text-xs font-bold font-serif text-[#F9F6F0]">
            تحديث جديد متاح لمقرأة رحاب القرآن
          </h3>
          <p className="text-[11px] text-emerald-100/90 leading-snug">
            تم إصدار تحسينات جديدة على النظام. اضغط على زر التحديث لتطبيقها فوراً.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => applyPWAUpdate()}
              className="px-3 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b08b47] text-[#2C3531] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث الآن
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs transition-colors cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowUpdate(false)}
          className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          aria-label="إغلاق الإشعار"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
