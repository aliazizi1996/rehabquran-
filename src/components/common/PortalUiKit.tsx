/**
 * مكونات الواجهة الموحدة للمقرأة (Portal UI Kit)
 * تدعم: حالات التحميل، حالات الخطأ، الحالات الفارغة الهادفة، الترقيم، البحث والتصفية
 * متوافقة 100% مع الهوية البصرية الرسمية 2026
 */

import React from 'react';
import { 
  Search, RefreshCw, AlertTriangle, Inbox, 
  ChevronRight, ChevronLeft, CheckCircle2, X 
} from 'lucide-react';

// ==========================================
// 1. حالة التحميل (Loading State)
// ==========================================
export const LoadingState: React.FC<{ message?: string }> = ({ 
  message = 'جاري جلب البيانات من خوادم المقرأة السحابية...' 
}) => {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 bg-[#F9F6F0]/60 rounded-3xl border border-[#C5A059]/20 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center border border-[#046A38]/20 shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-bold text-[#2C3531] font-sans">{message}</p>
      <div className="flex gap-1.5 pt-1">
        <span className="w-2 h-2 rounded-full bg-[#046A38] animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#046A38] animate-bounce"></span>
      </div>
    </div>
  );
};

// ==========================================
// 2. حالة الخطأ مع إعادة المحاولة (Error State)
// ==========================================
export const ErrorState: React.FC<{ 
  message?: string; 
  onRetry?: () => void; 
}> = ({ 
  message = 'تعذر تحميل البيانات في الوقت الحالي', 
  onRetry 
}) => {
  return (
    <div className="p-8 text-center bg-rose-50/80 rounded-3xl border border-rose-200 space-y-3 animate-fade-in">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-rose-900 font-serif">تنبيه أثناء معالجة البيانات</h4>
      <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-700 hover:bg-rose-100/60 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة الآن</span>
        </button>
      )}
    </div>
  );
};

// ==========================================
// 3. الحالة الفارغة الهادفة (Helpful Empty State)
// ==========================================
export const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  actionLabel?: string; 
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon
}) => {
  return (
    <div className="p-10 text-center bg-[#F9F6F0] rounded-3xl border border-[#C5A059]/30 space-y-3 animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-3xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center border border-[#C5A059]/40 shadow-xs">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h4 className="text-base font-bold text-[#046A38] font-serif">{title}</h4>
      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#C5A059]"
          >
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. شريط البحث والتصفية (Search & Filter Bar)
// ==========================================
export const SearchFilterBar: React.FC<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filterOptions?: { label: string; value: string }[];
  currentFilter?: string;
  onFilterChange?: (value: string) => void;
  extraActions?: React.ReactNode;
}> = ({
  searchTerm,
  onSearchChange,
  placeholder = 'ابحث في السجلات...',
  filterOptions,
  currentFilter,
  onFilterChange,
  extraActions
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#2C3531] placeholder-slate-400 focus:outline-none focus:border-[#046A38] focus:bg-white transition-all text-right font-sans"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentFilter === opt.value
                    ? 'bg-[#046A38] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {extraActions}
      </div>
    </div>
  );
};

// ==========================================
// 5. مكون الترقيم المتقدم (Pagination Controls)
// ==========================================
export const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs text-slate-600 font-sans">
      <div>
        <span>عرض السجلات من </span>
        <strong className="text-slate-900 font-mono">{startItem}</strong>
        <span> إلى </span>
        <strong className="text-slate-900 font-mono">{endItem}</strong>
        <span> من إجمالي </span>
        <strong className="text-[#046A38] font-mono">{totalItems}</strong>
        <span> سجل</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-xl border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
            currentPage === 1 ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-100 bg-white'
          }`}
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 bg-[#F9F6F0] rounded-xl border border-[#C5A059]/40 font-bold text-[#046A38]">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-xl border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
            currentPage === totalPages ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-100 bg-white'
          }`}
          title="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 6. شريط الإشعار والتأكيد (Toast / Feedback Banner)
// ==========================================
export const FeedbackBanner: React.FC<{
  type: 'success' | 'error' | 'info';
  message: string | null;
  onClose?: () => void;
}> = ({ type, message, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : isError
          ? 'bg-rose-50 border-rose-300 text-rose-900'
          : 'bg-blue-50 border-blue-300 text-blue-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#046A38] shrink-0" />}
        {isError && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
        <span className="font-bold">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-500 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ==========================================
// 6. الهيكل العظمي للصفحات (Page Skeleton)
// ==========================================
export const PageSkeleton: React.FC<{ title?: string }> = ({ 
  title = 'جاري التحميل السريع...' 
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse p-4 sm:p-6" dir="rtl">
      {/* Top Banner Skeleton */}
      <div className="h-28 bg-[#046A38]/10 rounded-3xl border border-[#046A38]/15 flex items-center justify-between p-6">
        <div className="space-y-3">
          <div className="h-6 w-48 bg-[#046A38]/20 rounded-xl"></div>
          <div className="h-4 w-72 bg-[#046A38]/15 rounded-lg"></div>
        </div>
        <div className="hidden sm:block h-12 w-12 rounded-2xl bg-[#046A38]/20"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
            <div className="h-6 w-12 bg-slate-300 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white/90 rounded-3xl border border-slate-200/80 p-6 space-y-4">
        <div className="h-6 w-36 bg-slate-200 rounded-lg"></div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl border border-slate-200/50 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded"></div>
                  <div className="h-3 w-24 bg-slate-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 font-sans">{title}</p>
    </div>
  );
};

