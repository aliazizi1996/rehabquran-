/**
 * PublicLayout - التخطيط الرسمي للصفحات العامة
 * مقرأة رحاب القرآن الإلكترونية (الهوية المعتمدة 2026)
 * مخصص فقط للصفحات العامة:
 * / (الرئيسية)
 * /about
 * /programs
 * /teachers
 * /reciters
 * /faq
 * /contact
 * /privacy
 * /terms
 * /login
 * /register
 * /forgot-password
 * /verify-email
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Award, HelpCircle, Phone, ShieldCheck, 
  FileText, LogIn, UserPlus, Menu, X, ArrowLeft, Headphones, 
  Mail, MapPin, ExternalLink, MessageCircle
} from 'lucide-react';
import { SocialIcon } from 'react-social-icons';
import { OfficialLogo } from '../components/OfficialLogo';
import { NotificationBanner } from '../components/NotificationBanner';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
const FooterSupportDrawer = React.lazy(() => import('../components/FooterSupportDrawer').then(m => ({ default: m.FooterSupportDrawer })));
import { getBrandLogoSettings, BrandLogoCustomization } from '../utils/brandLogoStore';

interface PublicLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentPath,
  onNavigate,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());

  const isQuranOrTafsirPage = currentPath === '/tafsir' || currentPath === '/quran-audio';
  const [readingMode, setReadingMode] = useState<'light' | 'sepia' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rihab_quran_reading_mode');
      if (saved === 'dark' || saved === 'sepia' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    const handleSync = (e?: Event) => {
      if (typeof window !== 'undefined') {
        const customMode = (e as CustomEvent)?.detail;
        if (customMode === 'dark' || customMode === 'sepia' || customMode === 'light') {
          setReadingMode(customMode);
          return;
        }
        const saved = localStorage.getItem('rihab_quran_reading_mode');
        if (saved === 'dark' || saved === 'sepia' || saved === 'light') {
          setReadingMode(saved);
        }
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('quran_reading_mode_changed', handleSync as EventListener);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('quran_reading_mode_changed', handleSync as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleBrandUpdate = (e: any) => {
      if (e.detail) {
        setBrandSettings(e.detail);
      } else {
        setBrandSettings(getBrandLogoSettings());
      }
    };
    window.addEventListener('brand_logo_updated', handleBrandUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleBrandUpdate);
  }, []);

  const publicNavLinks = [
    { label: 'الرئيسية', path: '/' },
    { label: 'التفسير الميسّر', path: '/tafsir' },
    { label: 'من نحن', path: '/about' },
    { label: 'البرامج التعليمية', path: '/programs' },
    { label: 'المعلمون', path: '/teachers' },
    { label: 'المقرئون والمجازون', path: '/reciters' },
    { label: 'الأسئلة الشائعة', path: '/faq' },
    { label: 'تواصل معنا', path: '/contact' },
  ];

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  const layoutWrapperClass = isQuranOrTafsirPage && readingMode === 'dark'
    ? 'min-h-screen bg-[#0D120F] text-[#EDE6DA] font-sans text-right flex flex-col selection:bg-[#C5A059]/20 selection:text-[#E0B967] transition-colors duration-300'
    : isQuranOrTafsirPage && readingMode === 'sepia'
    ? 'min-h-screen bg-[#F4ECD8] text-[#3B2D1D] font-sans text-right flex flex-col selection:bg-[#C5A876]/30 selection:text-[#7A5416] transition-colors duration-300'
    : 'min-h-screen bg-gradient-to-br from-[#F9F6F0] via-white to-[#F9F6F0] text-[#2C3531] font-sans text-right flex flex-col selection:bg-[#C5A059]/20 selection:text-[#046A38] transition-colors duration-300';

  const headerClass = isQuranOrTafsirPage && readingMode === 'dark'
    ? 'sticky top-0 z-40 bg-[#101713]/98 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-md transition-colors duration-300'
    : isQuranOrTafsirPage && readingMode === 'sepia'
    ? 'sticky top-0 z-40 bg-[#FAF4E6]/98 backdrop-blur-md border-b-2 border-[#D2B98B] shadow-xs transition-colors duration-300'
    : 'sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b-2 border-[#C5A059]/40 shadow-xs transition-colors duration-300';

  const navItemClass = (isActive: boolean) => {
    if (isActive) {
      return isQuranOrTafsirPage && readingMode === 'sepia'
        ? 'bg-[#7A5416] text-[#FAF4E6] shadow-xs font-bold'
        : 'bg-[#046A38] text-white shadow-xs font-bold';
    }
    if (isQuranOrTafsirPage && readingMode === 'dark') {
      return 'text-slate-200 hover:text-white hover:bg-emerald-950/60 font-medium';
    }
    if (isQuranOrTafsirPage && readingMode === 'sepia') {
      return 'text-[#3B2D1D] hover:text-[#7A5416] hover:bg-[#EDE3CB] font-medium';
    }
    return 'text-slate-700 hover:text-[#046A38] hover:bg-[#F9F6F0] font-medium';
  };

  return (
    <div className={layoutWrapperClass} dir="rtl">
      {/* 1. Official Top Announcement Bar */}
      <div className="bg-[#046A38] text-white text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-[#C5A059]/40 flex items-center justify-center gap-2">
        <span className="font-sans font-bold text-[#F9F6F0] flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-[#C5A059] animate-pulse"></span>
          <span>مقرأة رحاب القرآن الإلكترونية</span>
          {brandSettings.showGlobalAssemblyMembership && (
            <>
              <span className="text-[#C5A059]">•</span>
              <span className="text-[#F9F6F0] bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-[#C5A059]/50 text-xs">عضو التجمع العالمي للقرآن الكريم</span>
            </>
          )}
          <span className="text-[#C5A059]">•</span>
          <span className="hidden sm:inline">تعليم وإقراء بالسند المتصل إلى رسول الله ﷺ</span>
        </span>
      </div>

      {/* 2. Main Public Header */}
      <header className={headerClass}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => handleNavClick('/')}
            className="flex min-w-0 items-center gap-3 text-right cursor-pointer group transition-transform active:scale-98"
            aria-label="الرئيسية - مقرأة رحاب القرآن"
          >
            <OfficialLogo size="md" showText={false} />
            <div className="min-w-0">
              <h1 className={`text-base sm:text-xl font-bold font-serif leading-snug transition-colors ${
                isQuranOrTafsirPage && readingMode === 'dark' ? 'text-[#E0B967] group-hover:text-amber-300' : 'text-[#046A38] group-hover:text-emerald-800'
              }`}>
                {brandSettings.titleText || 'مقرأة رحاب القرآن'}
              </h1>
              <p className={`text-xs font-sans hidden sm:block ${
                isQuranOrTafsirPage && readingMode === 'dark' ? 'text-slate-400' : isQuranOrTafsirPage && readingMode === 'sepia' ? 'text-[#846E56]' : 'text-slate-500'
              }`}>
                {brandSettings.subText || 'تعليم القرآن الكريم والقراءات العشر'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex shrink-0 items-center gap-1">
            {publicNavLinks.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`px-2.5 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${navItemClass(isActive)}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* In-App PWA Install Button */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="header" />
          </div>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`xl:hidden p-2.5 rounded-xl border cursor-pointer shrink-0 transition-colors ${
              isQuranOrTafsirPage && readingMode === 'dark'
                ? 'bg-[#161F1A] border-emerald-900 text-slate-200 hover:bg-[#1C2721]'
                : isQuranOrTafsirPage && readingMode === 'sepia'
                ? 'bg-[#EDE3CB] border-[#D2B98B] text-[#3B2D1D] hover:bg-[#E2D4B6]'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            aria-label="القائمة"
            aria-expanded={isMobileMenuOpen}
            aria-controls="public-mobile-nav"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div
            id="public-mobile-nav"
            className={`xl:hidden border-b px-4 py-4 space-y-2 animate-fadeIn ${
              isQuranOrTafsirPage && readingMode === 'dark'
                ? 'bg-[#161F1A] border-emerald-900/60'
                : isQuranOrTafsirPage && readingMode === 'sepia'
                ? 'bg-[#FAF4E6] border-[#D2B98B]'
                : 'bg-white border-slate-200'
            }`}
          >
            {publicNavLinks.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${navItemClass(isActive)}`}
                >
                  <span>{item.label}</span>
                  <ArrowLeft className="w-4 h-4 opacity-50" />
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-200/60">
              <PWAInstallButton variant="sidebar" className="w-full" />
            </div>
          </div>
        )}
      </header>

      {/* Global In-App Notification Banner */}
      <NotificationBanner onJoinHalqa={() => onNavigate('/student')} />

      {/* 3. Main Child Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* 4. Official Brand Footer (No private student/dashboard data) */}
      <footer className="bg-[#2C3531] text-slate-300 border-t-4 border-[#C5A059] pt-12 pb-8 mt-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* قسم القنوات والمنصات الرسمية المعتمدة (في مكان واحد منظم دون تكرار أو تشتيت) */}
          <div id="official-channels" className="mb-10 pb-8 border-b border-slate-700/60 scroll-mt-24" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] animate-pulse"></span>
                  <h3 className="font-bold text-base sm:text-lg text-white font-serif">
                    القنوات والمنصات الرسمية المعتمدة للمقرأة
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A059]/20 text-[#f7e8c6] border border-[#C5A059]/40 font-sans">
                    منصات موثقة
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  تابع جديد المقرأة، وجداول الحلقات، والتلاوات القرآنية اليومية عبر منصاتنا المعتمدة:
                </p>
              </div>

              {/* بطاقة الموقع الرسمي على خرائط جوجل */}
              <a
                href={brandSettings.googleMapsUrl || 'https://maps.app.goo.gl/eiRa7YpZgcxqAvuH8'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#051c11] hover:bg-[#082a1a] text-[#f7e8c6] text-xs font-bold border border-[#C5A059]/40 transition-all shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
                title="موقع المقرأة على خرائط جوجل"
              >
                <MapPin className="w-4 h-4 text-[#C5A059]" />
                <span>المقر على خرائط جوجل</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>

            {/* شبكة القنوات الرسمية المنظمة جنباً إلى جنب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* 1. قناة الواتساب */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-emerald-600/40 hover:border-[#25D366] transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      قناة الواتساب الرسمية
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      إعلانات وتنبيهات الحلقات
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.whatsappChannelUrl || 'https://whatsapp.com/channel/0029Vb4RehabQuran'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>انضم لقناة واتساب</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 2. قناة التيليجرام */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-sky-600/40 hover:border-sky-400 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.196 1.006.128.832.942z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      قناة التيليجرام
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      تسجيلات وتلاوات المقرأة
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.telegramUrl || 'https://t.me/rehabpa'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#229ED9] hover:bg-[#1b8bc2] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>انضم لقناة تيليجرام</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 3. صفحة الفيسبوك */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-blue-600/40 hover:border-blue-400 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-600/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      صفحة الفيسبوك
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      أخبار ومنشورات المقرأة
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.facebookUrl || 'https://www.facebook.com/profile.php?id=61594338165497'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#1569d6] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>متابعة على فيسبوك</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 4. حساب الإنستجرام */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-pink-600/40 hover:border-pink-400 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      حساب الإنستجرام
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      مرئيات وتلاوات الطلاب
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.instagramUrl || 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>متابعة على إنستجرام</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 5. قناة اليوتيوب الرسمية */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-red-600/40 hover:border-red-400 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 border border-red-600/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      قناة اليوتيوب
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      ختمات وتلاوات مرئية
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.youtubeUrl || 'https://www.youtube.com/@RehabQuran-s5m'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#FF0000] hover:bg-[#cc0000] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>اشتراك باليوتيوب</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 6. حساب التيك توك الرسمي */}
              <div className="bg-[#051c11] hover:bg-[#072416] p-4 rounded-2xl border border-teal-500/40 hover:border-teal-400 transition-all flex flex-col justify-between gap-3.5 shadow-sm group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/40 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-[#f7e8c6] font-serif block truncate">
                      حساب التيك توك
                    </span>
                    <span className="text-[11px] text-slate-300 block truncate">
                      مقاطع تلاوات قصيرة
                    </span>
                  </div>
                </div>
                <a
                  href={brandSettings.tiktokUrl || 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 via-sky-600 to-slate-900 hover:opacity-90 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <span>متابعة على تيك توك</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-700/60">
            {/* Column 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <OfficialLogo size="md" showText={false} />
                <span className="font-serif font-bold text-lg text-white">
                  {brandSettings.titleText || 'مقرأة رحاب القرآن'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {brandSettings.sloganText || 'مقرأة قرآنية إلكترونية عالمية تُعنى بتعليم كتاب الله حفظاً وتلاوةً وتجويداً، ومنح الإجازات القرآنية بالسند المتصل إلى رسول الله ﷺ بأعلى معايير الإتقان.'}
              </p>
              {brandSettings.showGlobalAssemblyMembership && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/90 border border-[#C5A059]/50 text-[#C5A059] text-[11px] font-bold shadow-2xs">
                    <span>🏛️</span>
                    <span>عضو التجمع العالمي للقرآن الكريم</span>
                  </span>
                </div>
              )}
            </div>

            {/* Column 2: Public Navigation Links */}
            <div>
              <h4 className="font-bold text-sm text-[#C5A059] mb-3">الصفحات العامة</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavClick('/')} className="hover:text-white transition-colors cursor-pointer">الصفحة الرئيسية</button></li>
                <li><button onClick={() => handleNavClick('/tafsir')} className="hover:text-[#C5A059] text-amber-200 font-bold transition-colors cursor-pointer flex items-center gap-1.5"><span>التفسير الميسّر</span><span className="text-[9px] bg-[#046A38] text-amber-200 px-1.5 py-0.5 rounded-full border border-[#C5A059]">مجمع الملك فهد</span></button></li>
                <li><button onClick={() => handleNavClick('/about')} className="hover:text-white transition-colors cursor-pointer">من نحن ورؤيتنا</button></li>
                <li><button onClick={() => handleNavClick('/programs')} className="hover:text-white transition-colors cursor-pointer">المسارات والبرامج التعليمية</button></li>
                <li><button onClick={() => handleNavClick('/teachers')} className="hover:text-white transition-colors cursor-pointer">نخبة المعلمين المعتمدين</button></li>
                <li><button onClick={() => handleNavClick('/reciters')} className="hover:text-white transition-colors cursor-pointer">المقرئون والمجازون</button></li>
              </ul>
            </div>

            {/* Column 3: Legal & Help */}
            <div>
              <h4 className="font-bold text-sm text-[#C5A059] mb-3">المساعدة والسياسات</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavClick('/faq')} className="hover:text-white transition-colors cursor-pointer">الأسئلة الشائعة</button></li>
                <li><button onClick={() => handleNavClick('/privacy')} className="hover:text-white transition-colors cursor-pointer">سياسة الخصوصية وحماية البيانات</button></li>
                <li><button onClick={() => handleNavClick('/terms')} className="hover:text-white transition-colors cursor-pointer">الشروط والأحكام واللوائح</button></li>
                <li><button onClick={() => handleNavClick('/contact')} className="hover:text-white transition-colors cursor-pointer">تواصل مع إدارة المقرأة</button></li>
              </ul>
            </div>

            {/* Column 4: Contact & Access */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-sm text-[#C5A059] mb-1">تسجيل الدخول والمتابعة</h4>
              <p className="text-slate-400">
                هل أنت طالب أو معلم مسجل بالمقرأة؟ سجل دخولك للوصول إلى حلقتك.
              </p>
              <button
                onClick={() => handleNavClick('/login')}
                className="w-full py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer transition-all border border-[#C5A059] text-center"
              >
                الدخول إلى حسابي
              </button>
              <div className="pt-2 text-slate-400 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>هاتف الإدارة والواتساب:</span>
                  <a 
                    href="https://wa.me/967714371599" 
                    target="_blank" 
                    rel="noreferrer" 
                    dir="ltr"
                    className="text-emerald-300 font-mono hover:underline font-bold inline-block"
                  >
                    +967 714 371 599
                  </a>
                </div>
                <div>
                  <span>البريد: </span>
                  <a 
                    href={`mailto:${brandSettings.contactEmail || 'rehabquran383@gmail.com'}`}
                    className="text-emerald-300 font-mono hover:underline font-bold"
                  >
                    {brandSettings.contactEmail || 'rehabquran383@gmail.com'}
                  </a>
                </div>
                <div>المقر: {brandSettings.officialAddress || 'اليمن - ومن جميع دول العالم'}</div>
                
              </div>
            </div>
          </div>

          {/* أسفل التذييل: دعم المقرأة وكفالة حلقات القرآن الكريم */}
          <React.Suspense fallback={null}>
            <FooterSupportDrawer />
          </React.Suspense>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <OfficialLogo size="xs" showText={false} />
              <p className="font-kufi">
                {brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'} — منصة تعليمية مرخصة ومحمية - جميع الحقوق محفوظة 1447هـ
              </p>
            </div>
            <p className="text-[11px] text-[#C5A059] font-bold font-kufi bg-black/40 px-3.5 py-1.5 rounded-xl border border-[#C5A059]/40">
              منصة تعليمية مرخصة ومحمية - جميع الحقوق محفوظة 1447هـ
            </p>
          </div>
        </div>
      </footer>

      {/* 5. الأيقونة العائمة للتواصل السريع عبر واتساب (Floating WhatsApp Quick Action) */}
      <aside aria-label="تواصل سريع عبر واتساب" className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 flex items-center gap-3 group" dir="ltr">
        {/* زر الواتساب العائم */}
        <a
          href={`https://wa.me/967714371599?text=${encodeURIComponent('السلام عليكم ورحمة الله وبركاته، أود الاستفسار والتواصل السريع مع إدارة مقرأة رحاب القرآن الإلكترونية 📖✨')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/60 hover:ring-[#25D366]/50 group"
          aria-label="تواصل سريع عبر واتساب"
          title="تواصل سريع عبر واتساب"
        >
          {/* تموج بصري ناعم لجذب الانتباه بلباقة */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />

          {/* أيقونة الواتساب SVG */}
          <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-white relative z-10 drop-shadow-xs" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>

          {/* نقطة الاتصال الأخضر المباشر */}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-200 border-2 border-[#046A38] rounded-full z-20 shadow-xs" />
        </a>

        {/* تلميح أنيق للتواصل عند التمرير */}
        <div dir="rtl" className="hidden md:flex items-center gap-2 bg-[#051c11]/95 text-[#f7e8c6] border border-[#C5A059]/60 text-xs font-bold py-2 px-3.5 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap backdrop-blur-xs select-none">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>تواصل سريع مع المقرأة عبر واتساب</span>
        </div>
      </aside>

      {/* 6. شريط التنقل السفلي للهواتف الذكية (Mobile Bottom Tab Navigation) */}
      <nav aria-label="التنقل السريع في الهاتف" className="xl:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-3px_14px_rgba(0,0,0,0.06)] pb-safe" dir="rtl">
        <div className="flex justify-around items-center h-15 px-2">
          <button
            onClick={() => handleNavClick('/')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
              currentPath === '/' ? 'text-[#046A38] font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] leading-tight">الرئيسية</span>
          </button>

          <button
            onClick={() => handleNavClick('/programs')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
              currentPath === '/programs' ? 'text-[#046A38] font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] leading-tight">الحلقات</span>
          </button>

          <button
            onClick={() => handleNavClick('/tafsir')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
              currentPath === '/tafsir' ? 'text-[#046A38] font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-5 h-5 text-[#C5A059]" />
            <span className="text-[11px] leading-tight font-bold text-[#C5A059]">التفسير</span>
          </button>

          <button
            onClick={() => handleNavClick('/reciters')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
              currentPath === '/reciters' ? 'text-[#046A38] font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[11px] leading-tight">المجازون</span>
          </button>

          <button
            onClick={() => handleNavClick('/login')}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors cursor-pointer ${
              currentPath === '/login' ? 'text-[#046A38] font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-5 h-5 text-[#046A38]" />
            <span className="text-[11px] leading-tight font-bold">دخول</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
