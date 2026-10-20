import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Radio, Smartphone, Monitor, UserCheck, ShieldCheck, 
  Building2, Crown, Trophy, BellRing, Bell, LogIn, LogOut, Shield, 
  Menu, X, ChevronLeft, Sliders
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { UserProfile } from '../types';
import { getBrandLogoSettings, BrandLogoCustomization } from '../utils/brandLogoStore';

interface HeaderProps {
  user: UserProfile;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  activeLiveCount: number;
  onOpenLiveSession: () => void;
  onToggleRole: () => void;
  onOpenRegistration?: () => void;
  onOpenBankAccounts?: () => void;
  onOpenStudentsSection?: () => void;
  onOpenHonorBoard?: () => void;
  onOpenWirdReminder?: () => void;
  unreadNotificationsCount?: number;
  onOpenAuthModal?: () => void;
  onNavigateAuth?: () => void;
  onOpenSupervisorDashboard?: () => void;
  onLogoutToWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isMobileFrame,
  setIsMobileFrame,
  activeLiveCount,
  onOpenLiveSession,
  onToggleRole,
  onOpenRegistration,
  onOpenBankAccounts,
  onOpenStudentsSection,
  onOpenHonorBoard,
  onOpenWirdReminder,
  unreadNotificationsCount = 0,
  onOpenAuthModal,
  onNavigateAuth,
  onOpenSupervisorDashboard,
  onLogoutToWelcome,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandLogoCustomization>(getBrandLogoSettings());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setBrandSettings(e.detail || getBrandLogoSettings());
    };
    window.addEventListener('brand_logo_updated', handleUpdate);
    return () => window.removeEventListener('brand_logo_updated', handleUpdate);
  }, []);

  const currentTimeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="sticky top-0 z-30 bg-[#0f241a]/95 backdrop-blur-md border-b-2 border-[#C5A059]/40 transition-all overflow-x-hidden max-w-full box-border">
      {/* Android Device Mock Status Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-1 text-xs text-emerald-300/80 bg-[#071710] select-none border-b border-emerald-950/80 max-w-full overflow-hidden box-border">
        <span className="font-semibold">{currentTimeStr}</span>
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] tracking-wider font-medium text-emerald-400/90 truncate">
            {brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
          </span>
          <div className="w-4 h-2.5 border border-emerald-400/70 rounded-xs flex items-center p-0.5 shrink-0">
            <div className="w-full h-full bg-emerald-400 rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* Main App Bar Container (Height at least 82px on desktop, min 72px on mobile) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full flex items-center justify-between min-h-[72px] sm:min-h-[82px] gap-2 sm:gap-6 box-border">
        {/* Right / Start: Official Logo and Academy Identity */}
        <div 
          className="flex items-center gap-2.5 sm:gap-3.5 min-w-0"
        >
          <div className="w-[56px] h-[56px] min-w-[56px] min-h-[56px] sm:w-[64px] sm:h-[64px] sm:min-w-[64px] sm:min-h-[64px] shrink-0 rounded-2xl bg-[#F9F6F0] p-1 border-2 border-[#C5A059] shadow-md flex items-center justify-center">
            <img
              src={brandSettings.customSmallLogoUrl || '/brand/official-logo-small.png'}
              alt={brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
              style={{
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              className="select-none filter drop-shadow-xs"
            />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="font-bold text-base sm:text-xl md:text-2xl text-white tracking-wide leading-tight font-amiri truncate">
                {brandSettings.titleText || 'مقرأة رحاب القرآن الإلكترونية'}
              </h1>
              <span className="hidden sm:inline-block text-[10px] bg-[#C5A059]/30 text-[#dfbe75] px-2 py-0.5 rounded-full border border-[#C5A059]/60 font-bold font-kufi shrink-0">
                الرسمية
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#dfbe75] font-kufi font-bold mt-0.5 truncate">
              {brandSettings.subText || 'ـ لتعليم وحفظ القرآن الكريم عن بُعد ـ'}
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Actions (Hidden on Mobile) with >= 20px spacing */}
        <div className="hidden lg:flex items-center gap-[20px] font-kufi shrink-0">
          {/* Active Live Halqa Banner Button */}
          {activeLiveCount > 0 && (
            <button
              onClick={onOpenLiveSession}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 text-xs font-bold transition-all animate-pulse cursor-pointer shadow-sm"
              title="انضم للحلقة المباشرة الآن"
            >
              <Radio className="w-4 h-4 text-red-400" />
              <span>مباشر الآن ({activeLiveCount})</span>
            </button>
          )}

          {/* Supervisor Dashboard Shortcut */}
          {onOpenSupervisorDashboard && (
            <button
              onClick={onOpenSupervisorDashboard}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
              title="لوحة تحكم المشرف والمعلمين"
            >
              <Shield className="w-4 h-4 fill-slate-950" />
              <span>لوحة المشرفين</span>
            </button>
          )}

          {/* Honor Board Button */}
          {onOpenHonorBoard && (
            <button
              onClick={onOpenHonorBoard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="لوحة الشرف وتكريم المتفوقين أسبوعياً"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>لوحة الشرف</span>
            </button>
          )}

          {/* Bank Accounts Button */}
          {onOpenBankAccounts && (
            <button
              onClick={onOpenBankAccounts}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0c2419] hover:bg-[#113123] border border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="الحسابات البنكية للمقرأة (الكريمي ومحفظة جيب)"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>الحسابات البنكية</span>
            </button>
          )}

          {/* Wird Reminder & Notifications Bell */}
          {onOpenWirdReminder && (
            <button
              onClick={onOpenWirdReminder}
              className="relative p-2.5 rounded-xl bg-[#092115] hover:bg-[#0e2c1c] border border-emerald-600/60 text-emerald-300 hover:text-white transition-all cursor-pointer"
              title="تنبيهات ورد القرآن اليومي والإشعارات"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Switch Role: Student vs Supervisor / Teacher */}
          <button
            onClick={onToggleRole}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              user.role === 'teacher'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-sm'
                : 'bg-emerald-800/40 border-emerald-700/50 text-emerald-200 hover:bg-emerald-700/40'
            }`}
            title="تبديل الصلاحية والمنظور (طالب / مشرف / معلم)"
          >
            {user.role === 'teacher' ? (
              <>
                <Crown className="w-4 h-4 text-amber-400" />
                <span>منظور المشرف ({user.name})</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>منظور الطالب</span>
              </>
            )}
          </button>

          {/* Quick Return to Welcome Screen / Logout */}
          {onLogoutToWelcome && (
            <button
              onClick={onLogoutToWelcome}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="العودة للشاشة الترحيبية وتسجيل الخروج"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Mobile Action Controls (Prominent Hamburger Button & Essential Icons) */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          {/* Active Live Pulse on mobile */}
          {activeLiveCount > 0 && (
            <button
              onClick={onOpenLiveSession}
              className="p-2 rounded-xl bg-red-500/25 border border-red-400/70 text-red-300 animate-pulse cursor-pointer"
              title="انضم للحلقة المباشرة"
            >
              <Radio className="w-5 h-5 text-red-400" />
            </button>
          )}

          {/* Wird Bell on mobile if unread */}
          {onOpenWirdReminder && (
            <button
              onClick={onOpenWirdReminder}
              className="relative p-2.5 rounded-xl bg-[#092115] border border-emerald-700/70 text-emerald-300 cursor-pointer"
              title="تنبيهات ورد القرآن"
            >
              <Bell className="w-5 h-5 text-amber-400" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Large Prominent Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#092215] hover:bg-[#0e2c1c] border-2 border-[#C5A059] text-[#dfbe75] flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-all"
            aria-label="قائمة الخيارات والخدمات"
            title="قائمة المقرأة"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1c13] border-t border-[#C5A059]/40 px-4 py-4 space-y-2 text-white font-kufi animate-fade-in shadow-2xl max-w-full overflow-x-hidden box-border">
          {/* Role Status Card */}
          <div className="p-3 rounded-xl bg-[#05140d] border border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user.role === 'teacher' ? (
                <Crown className="w-5 h-5 text-amber-400" />
              ) : (
                <UserCheck className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <div className="text-xs text-slate-400">المنظور الحالي:</div>
                <div className="text-sm font-bold text-[#dfbe75]">
                  {user.role === 'teacher' ? `المشرف (${user.name})` : 'طالب المقرأة'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleRole();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/60 text-xs font-bold text-emerald-200 border border-emerald-600/50 cursor-pointer"
            >
              تبديل
            </button>
          </div>

          {/* Menu Action List */}
          <div className="space-y-1 pt-1 text-sm font-bold">
            {onOpenSupervisorDashboard && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSupervisorDashboard();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>لوحة تحكم المشرفين والمعلمين</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}

            {onOpenBankAccounts && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBankAccounts();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-900/40 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>الحسابات البنكية (الكريمي ومحفظة جيب)</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}

            {onOpenHonorBoard && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenHonorBoard();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-900/40 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>لوحة الشرف وتكريم المتفوقين</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}

            {onOpenStudentsSection && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenStudentsSection();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-900/40 text-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>قسم الطلاب (بنين)</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}

            {onOpenRegistration && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenRegistration();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl hover:bg-emerald-900/40 text-emerald-300 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>تسجيل جديد في المقرأة</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}

            {onLogoutToWelcome && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogoutToWelcome();
                }}
                className="w-full text-right px-3.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 flex items-center justify-between cursor-pointer mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>العودة للشاشة الترحيبية وتسجيل الخروج</span>
                </div>
                <ChevronLeft className="w-4 h-4 opacity-50" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
