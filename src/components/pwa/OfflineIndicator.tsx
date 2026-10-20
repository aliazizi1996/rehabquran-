import React from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  // في حال استعادة الاتصال بنجاح
  if (isOnline && wasOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-700 text-white shadow-xl border border-emerald-500/30 text-xs font-medium animate-fadeIn"
        dir="rtl"
      >
        <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
        <span>تمت استعادة الاتصال بالإنترنت بنجاح.</span>
      </div>
    );
  }

  // في حال انقطاع الاتصال
  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 rounded-2xl bg-gradient-to-r from-amber-900 to-stone-900 text-amber-100 shadow-2xl border border-amber-600/40 text-xs backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-bold text-amber-200 text-sm">أنت غير متصل بالإنترنت</p>
          <p className="text-amber-100/80 leading-relaxed text-[11px]">
            التطبيق يعمل في وضع التصفح للملفات المخبأة. لن يتم حفظ أي تلاوات أو درجات أو تعديلات حتى يتم استعادة الاتصال بالشبكة.
          </p>
        </div>
      </div>
      <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex justify-end gap-2">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          إعادة المحاولة
        </button>
      </div>
    </aside>
  );
};
