import React from 'react';
import { ArrowLeft, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { stopAdminImpersonation, getAdminImpersonationState } from '../services/authRoleService';

interface AdminImpersonationBannerProps {
  targetRole: 'student' | 'teacher';
  adminName?: string;
  onReturnToAdmin: () => void;
}

export const AdminImpersonationBanner: React.FC<AdminImpersonationBannerProps> = ({
  targetRole,
  adminName = 'المشرف الرئيسي',
  onReturnToAdmin
}) => {
  const impersonation = getAdminImpersonationState();
  const displayName = impersonation?.adminName || adminName;

  const handleReturn = async () => {
    await stopAdminImpersonation();
    onReturnToAdmin();
  };

  return (
    <div 
      className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-md border-b-2 border-[#C5A059] px-4 py-2.5 transition-all text-xs select-none"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-right">
          <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center shrink-0 border border-white/20">
            <Shield className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold bg-black/30 text-amber-200 px-2 py-0.5 rounded-md text-[11px] border border-amber-300/40">
                جلسة معاينة واختبار إدارية ({targetRole === 'student' ? 'وضع الطالب' : 'وضع المعلم'})
              </span>
              <span className="font-semibold text-white/95">
                حساب المشرف: <strong>{displayName}</strong>
              </span>
            </div>
            <p className="text-[11px] text-amber-100/90 mt-0.5">
              هذه جلسة إدارية للاختبار والمتابعة؛ لا يتم تعديل أي كلمات مرور أو تغيير بيانات المستخدمين.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReturn}
          className="shrink-0 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-950 font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2 border border-white/40 active:scale-95"
          title="إنهاء جلسة المعاينة والرجوع إلى لوحة المشرف العامة"
        >
          <span>العودة إلى لوحة المشرف</span>
          <ArrowLeft className="w-4 h-4 text-amber-700" />
        </button>
      </div>
    </div>
  );
};
