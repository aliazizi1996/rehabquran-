import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { OfficialLogo } from '../OfficialLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // التحقق من حالة الإغلاق السابقة في الجلسة الحالية
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('rihab_pwa_banner_dismissed');
      if (!dismissed && !isInstalled) {
        // تأخير ظهور البانر لثانيتين لضمان تجربة مستخدم هادئة
        const timer = setTimeout(() => {
          setIsDismissed(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstalled]);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success && isIOS) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rihab_pwa_banner_dismissed', 'true');
    }
  };

  return (
    <>
      <aside
        role="region"
        aria-label="إشعار تثبيت التطبيق"
        className="bg-gradient-to-r from-[#046A38] via-[#03542c] to-[#046A38] text-white border-b-2 border-[#C5A059] shadow-md px-4 py-2.5 transition-all text-right relative z-40 animate-fadeIn"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* معلومات التثبيت والشعار */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 p-1 shrink-0 flex items-center justify-center border border-[#C5A059]/40">
                <OfficialLogo size="sm" showText={false} />
              </div>
              <div className="min-w-0">
                <p className="font-bold font-serif text-sm text-[#F9F6F0] truncate">
                  تطبيق مقرأة رحاب القرآن الإلكترونية
                </p>
                <p className="text-[11px] text-emerald-100/80 hidden sm:block truncate">
                  ثبّت التطبيق على هاتفك أو حاسوبك لوصول سريع ومباشر للحلقات والتسميع
                </p>
              </div>
            </div>

            {/* زر الإغلاق على الجوال */}
            <button
              onClick={handleDismiss}
              className="sm:hidden text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              aria-label="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b08b47] text-[#2C3531] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-[#E0B967] active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-[#046A38] shrink-0 animate-bounce" />
              <span>{isIOS ? 'إرشادات التثبيت على iOS' : 'تثبيت التطبيق الآن'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs transition-colors cursor-pointer items-center gap-1"
            >
              <span>لاحقاً</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isIOS={isIOS}
      />
    </>
  );
};
