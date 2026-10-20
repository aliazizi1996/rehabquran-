import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. فحص إذا كان التطبيق يعمل بالفعل بوضع التثبيت (Standalone Mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        (typeof window !== 'undefined' &&
          window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        (typeof document !== 'undefined' &&
          document.referrer.includes('android-app://'));
      setIsStandalone(Boolean(isStandaloneMode));
      setIsInstalled(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // 2. الكشف عن أجهزة iOS (Safari على الآيفون والآيباد)
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Error triggering install prompt:', err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled: isInstalled || isStandalone,
    isStandalone,
    isIOS,
    install,
  };
}
