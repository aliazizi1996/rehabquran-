import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  User, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

export interface TargetAccountUser {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  role: 'student' | 'teacher' | string;
  status?: string;
  isActive?: boolean;
}

interface UserStatusConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  user: TargetAccountUser | null;
  targetStatus: boolean; // true = activate, false = disable
  isProcessing?: boolean;
}

const COMMON_DEACTIVATE_REASONS = [
  'انقطاع متكرر عن الحلقات دون عذر مقبول',
  'مخالفة ضوابط وآداب المقرأة والتسميع',
  'بناءً على طلب الطالب أو ولي الأمر',
  'إجراء تدقيقي مؤقت لمراجعة الحساب',
];

const COMMON_ACTIVATE_REASONS = [
  'زوال سبب التعطيل واستئناف الدراسة والحفظ',
  'استكمال المتطلبات الإدارية والأكاديمية',
  'موافقة الإدارة الأكاديمية على إعادة القيد',
  'تحديث البيانات وإعادة تفعيل الحساب بطلب المعلم',
];

export const UserStatusConfirmationModal: React.FC<UserStatusConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  targetStatus,
  isProcessing = false,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setValidationError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isDeactivating = !targetStatus;
  const userName = user.fullName || user.name || user.id;
  const roleName = user.role === 'student' ? 'طالب' : user.role === 'teacher' ? 'معلم' : 'مستخدم';
  const quickReasons = isDeactivating ? COMMON_DEACTIVATE_REASONS : COMMON_ACTIVATE_REASONS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 3) {
      setValidationError('يرجى كتابة سبب التغيير (3 أحرف على الأقل) لتوثيقه في السجل الأمني للرقابة.');
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-right animate-scale-up"
        dir="rtl"
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-start justify-between gap-4 ${
          isDeactivating 
            ? 'bg-rose-50/70 border-rose-100' 
            : 'bg-emerald-50/70 border-emerald-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDeactivating 
                ? 'bg-rose-100 text-rose-700 border-rose-200' 
                : 'bg-emerald-100 text-[#046A38] border-emerald-200'
            }`}>
              {isDeactivating ? (
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-[#046A38]" />
              )}
            </div>
            <div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                isDeactivating 
                  ? 'bg-rose-200/70 text-rose-900' 
                  : 'bg-emerald-200/70 text-emerald-950'
              }`}>
                إجراء أمني معتمد
              </span>
              <h3 className={`text-lg font-bold font-serif ${
                isDeactivating ? 'text-rose-950' : 'text-[#046A38]'
              }`}>
                {isDeactivating ? 'تأكيد تعطيل حساب' : 'تأكيد تفعيل حساب'} ({roleName})
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target User Info Card */}
          <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#C5A059]/40 flex items-center justify-center font-bold text-slate-800">
                <User className="w-5 h-5 text-[#046A38]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{userName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono">{user.email || user.id}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {roleName}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="text-[10px] text-slate-500 block">الإجراء المستهدف</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mt-0.5 ${
                isDeactivating 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-emerald-100 text-[#046A38]'
              }`}>
                {isDeactivating ? 'تعطيل الحساب' : 'إعادة التفعيل'}
              </span>
            </div>
          </div>

          {/* Warning Notice */}
          <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
            isDeactivating 
              ? 'bg-amber-50 text-amber-900 border-amber-200' 
              : 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
              isDeactivating ? 'text-amber-600' : 'text-emerald-700'
            }`} />
            <p className="leading-relaxed">
              {isDeactivating ? (
                <>
                  <strong>تنبيه أمني:</strong> سيؤدي تعطيل الحساب إلى إبطال جلسة المستخدم في Firebase Auth فوراً ومنعه من تسجيل الدخول والمشاركة في الحلقات والتسميع حتى تتم إعادة تفعيله من قبل المشرف.
                </>
              ) : (
                <>
                  <strong>تأكيد التفعيل:</strong> سيتم استعادة صلاحية الدخول للمستخدم فوراً وإتاحة متابعة الحلقات وجلسات التسميع.
                </>
              )}
            </p>
          </div>

          {/* Quick Selection Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              أسباب شائعة مقترحة (انقر للاختيار السريع):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(q);
                    setValidationError(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-right ${
                    reason === q
                      ? 'bg-[#046A38] text-white border-[#046A38] shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#C5A059] hover:bg-slate-50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input Field */}
          <div className="space-y-1.5">
            <label htmlFor="statusChangeReason" className="block text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#046A38]" />
                <span>سبب التغيير (إلزامي للتوثيق الأمني) <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                يُوثّق في سجل التدقيق ومسار الخادم
              </span>
            </label>
            <textarea
              id="statusChangeReason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError && e.target.value.trim().length >= 3) {
                  setValidationError(null);
                }
              }}
              placeholder={isDeactivating 
                ? 'اكتب سبب تعطيل الحساب بالتفصيل (مثل: غياب غير مبرر لمدة أسبوعين، طلب ولي الأمر...)' 
                : 'اكتب سبب إعادة تفعيل الحساب بالتفصيل (مثل: تقديم العذر وقبوله، انتهاء فترة التعطيل...)'}
              disabled={isProcessing}
              className={`w-full p-3 rounded-2xl text-xs border focus:outline-hidden transition-all resize-none leading-relaxed ${
                validationError 
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' 
                  : 'border-slate-300 focus:border-[#046A38] focus:ring-2 focus:ring-[#046A38]/15 bg-white'
              }`}
            />
            {validationError && (
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء الأمر
            </button>
            <button
              type="submit"
              disabled={isProcessing || !reason.trim() || reason.trim().length < 3}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                isDeactivating
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-[#046A38] hover:bg-[#03542c] text-white shadow-emerald-700/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ المعالجة والتوثيق...</span>
                </>
              ) : isDeactivating ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>تأكيد تعطيل الحساب وتوثيق السبب</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد تفعيل الحساب وتوثيق السبب</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
