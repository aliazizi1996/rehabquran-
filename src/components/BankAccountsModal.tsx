import React from 'react';
import { X, Building2 } from 'lucide-react';
import { BankAccountsCard } from './BankAccountsCard';

interface BankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankAccountsModal: React.FC<BankAccountsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0b1c14] border-2 border-amber-500/70 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header with Close */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-emerald-900/80 bg-[#071911]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-serif">
                الحسابات البنكية المعتمدة للمقرأة
              </h2>
              <span className="text-[10px] text-emerald-300">
                مقرأة رحاب القرآن الإلكترونية
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0e261b] hover:bg-[#163a2a] text-slate-300 hover:text-white transition-colors cursor-pointer border border-emerald-800"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3">
          <BankAccountsCard />
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#06140e] border-t border-emerald-950 flex items-center justify-between text-xs text-slate-400">
          <span>الجمهورية اليمنية 📍</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
          >
            تم الاطلاع
          </button>
        </div>
      </div>
    </div>
  );
};
