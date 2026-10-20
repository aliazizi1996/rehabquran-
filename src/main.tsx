import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryProvider } from './providers/QueryProvider';
import { registerPWA } from './utils/pwaServiceWorker';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { PWAUpdateToast } from './components/pwa/PWAUpdateToast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <PWAInstallBanner />
        <App />
        <OfflineIndicator />
        <PWAUpdateToast />
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
);

// تفعيل Service Worker لتسريع تحميل الأصول ودعم التثبيت المباشر (PWA)
registerPWA();
