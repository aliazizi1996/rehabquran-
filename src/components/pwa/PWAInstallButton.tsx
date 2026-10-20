import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'compact' | 'solid';
  showIconOnly?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
  showIconOnly = false
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // إذا كان التطبيق مثبتاً ويعمل في وضع Standalone، لا داعي لإظهار الزر
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome && isIOS) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const baseStyles = {
    header:
      'px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#046A38] to-[#03542c] text-white hover:shadow-md transition-all border border-[#C5A059]/60 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98',
    sidebar:
      'w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-[#046A38]/10 text-[#046A38] hover:bg-[#046A38]/20 transition-all border border-[#046A38]/20 flex items-center justify-between cursor-pointer',
    compact:
      'p-2 rounded-xl text-stone-700 hover:text-[#046A38] hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200',
    solid:
      'px-4 py-2 rounded-xl bg-[#046A38] text-white hover:bg-[#03542c] font-bold text-xs shadow-md border border-[#C5A059] flex items-center gap-2 cursor-pointer transition-all active:scale-98'
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`${baseStyles[variant]} ${className}`}
        title="تثبيت تطبيق مقرأة رحاب القرآن على جهازك"
        aria-label="تثبيت التطبيق"
      >
        <span className="flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-[#C5A059] shrink-0 animate-pulse" />
          {!showIconOnly && <span>تثبيت التطبيق</span>}
        </span>
        {variant === 'sidebar' && <Smartphone className="w-4 h-4 text-[#046A38]/60" />}
      </button>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isIOS={isIOS}
      />
    </>
  );
};
