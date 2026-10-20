import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const NetworkStatusAlert: React.FC = () => {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => setJustReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    try {
      // Test fetch with short timeout
      await fetch('/brand/official-logo-small.png', { cache: 'no-store' });
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 3000);
    } catch {
      // still offline
      setIsOffline(true);
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOffline && !justReconnected) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 transition-all duration-300 pointer-events-auto"
      dir="rtl"
    >
      {isOffline ? (
        <div className="bg-amber-900/95 border-2 border-amber-500/80 backdrop-blur-md text-amber-50 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-800/80 rounded-xl text-amber-300 shrink-0">
              <WifiOff className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold font-kufi">انقطاع أو ضعف في الشبكة</p>
              <p className="text-[11px] text-amber-200 mt-0.5 font-sans leading-relaxed">
                يبدو أن الاتصال بالإنترنت غير مستقر. سيتم إعادة المحاولة تلقائيًا.
              </p>
            </div>
          </div>
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            className="p-2 bg-amber-700/70 hover:bg-amber-600 text-white rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="إعادة المحاولة الآن"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="bg-emerald-900/95 border-2 border-emerald-500/80 backdrop-blur-md text-emerald-50 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
          <div className="p-2 bg-emerald-800/80 rounded-xl text-emerald-300 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold font-kufi">
            تم استعادة الاتصال بالإنترنت بنجاح
          </p>
        </div>
      )}
    </div>
  );
};
