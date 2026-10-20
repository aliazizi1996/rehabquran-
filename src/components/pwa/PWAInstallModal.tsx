import React from 'react';
import { Share, PlusSquare, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { OfficialLogo } from '../OfficialLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  isIOS = true
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#C5A059]/40 relative overflow-hidden">
        {/* شريط علوي مع الشعار وزر الإغلاق */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <OfficialLogo size="sm" showText={false} />
            <div>
              <h3 id="pwa-install-guide-title" className="text-base font-bold font-serif text-[#046A38]">
                تثبيت تطبيق مقرأة رحاب القرآن
              </h3>
              <p className="text-[11px] text-stone-500 font-sans">
                {isIOS ? 'خطوات التثبيت على أجهزة iPhone و iPad' : 'خطوات التثبيت على هاتفك الذكي'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* المزايا السريعة للتثبيت */}
        <div className="mt-4 p-3 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/30 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#046A38] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>تشغيل فوري في شاشة كاملة وبدون أشرطة المتصفح</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>وصول مباشر وسريع لحلقات التحفيظ والتسميع والمصحف</span>
          </div>
          <div className="flex items-center gap-2 text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>تخزين آمن للملفات وسرعة تصفح فائقة</span>
          </div>
        </div>

        {/* الخطوات العملية */}
        <div className="mt-5 space-y-3">
          {isIOS ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs border border-blue-200">
                  1
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold text-stone-900 block">اضغط على زر المشاركة (Share):</span>
                  <div className="flex items-center gap-1.5 text-stone-600 mt-1">
                    <Share className="w-4 h-4 text-blue-600 inline" />
                    <span>انقر على الأيقونة في أسفل شريط متصفح Safari.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs border border-emerald-200">
                  2
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold text-stone-900 block">اختر الإضافة إلى الصفحة الرئيسية:</span>
                  <div className="flex items-center gap-1.5 text-stone-600 mt-1">
                    <PlusSquare className="w-4 h-4 text-emerald-600 inline" />
                    <span>مرر للأعلى واضغط على «إضافة إلى الصفحة الرئيسية» (Add to Home Screen).</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs border border-amber-200">
                  3
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold text-stone-900 block">تأكيد الإضافة:</span>
                  <span className="text-stone-600 block mt-1">
                    اضغط على زر «إضافة» (Add) في أعلى الزاوية، وسيظهر تطبيق المقرأة على شاشة جهازك كأي تطبيق رسمي!
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed text-stone-700">
                  <span className="font-bold text-stone-900 block mb-1">تثبيت من متصفح Chrome أو Edge:</span>
                  افتح قائمة الخيارات (⋮) أعلى المتصفح، ثم اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* زر الإغلاق والمتابعة */}
        <div className="mt-6 pt-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-[#046A38] text-white hover:bg-[#03542c] font-bold text-xs transition-all cursor-pointer shadow-md border border-[#C5A059]"
          >
            فهمت، شكراً لك
          </button>
        </div>
      </div>
    </div>
  );
};
