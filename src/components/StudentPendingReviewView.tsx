import React from 'react';
import { Clock, Phone, Send, RefreshCw, LogOut, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';

interface StudentPendingReviewViewProps {
  studentName?: string;
  studentPhone?: string;
  studentEmail?: string;
  onRefreshStatus?: () => void;
  onLogout: () => void;
  onBackToHome?: () => void;
}

export const StudentPendingReviewView: React.FC<StudentPendingReviewViewProps> = ({
  studentName = 'أخي الطالب / أختي الطالبة',
  studentPhone,
  studentEmail,
  onRefreshStatus,
  onLogout,
  onBackToHome,
}) => {
  const adminWhatsAppNumber = '+967714371599';
  const cleanAdminPhone = '967714371599';

  const defaultMsg = `السلام عليكم ورحمة الله وبركاته 🌿\nأنا الطالب (${studentName}) المسجل في مقرأة رحاب القرآن الإلكترونية، أود الاستفسار والتواصل بخصوص طلب التسجيل وحالته في المقرأة.`;
  const whatsappUrl = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-xl p-6 sm:p-8 space-y-6 animate-fade-in relative overflow-hidden">
        {/* خلفية جمالية علوية */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-[#046A38] via-[#C5A059] to-[#046A38]" />

        {/* شعار المقرأة المعتمد */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <OfficialLogo variant="badge" size="md" showText={false} />
          <span className="text-[11px] font-bold text-[#C5A059] tracking-wider uppercase font-sans">
            مقرأة رحاب القرآن الإلكترونية العالمية
          </span>
        </div>

        {/* أيقونة الحالة والعنوان الرئيسي */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-xs animate-pulse">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif text-[#046A38]">
              طلبك قيد المراجعة
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-sans">
              أهلاً بك يا <strong>{studentName}</strong> في رحاب القرآن الكريم 🌿
            </p>
          </div>
        </div>

        {/* بطاقة الشرح والتوضيح */}
        <div className="bg-[#F9F6F0] rounded-2xl p-4 border border-[#C5A059]/30 text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>
            تم استلام بيانات تسجيلك بنجاح وحفظها بأمان، وطلبك حالياً <strong>قيد المراجعة والاعتماد</strong> من قِبل إدارة المقرأة والمشرف الأكاديمي لتنسيق الحلقة وتعيين الشيخ المناسب لك.
          </p>
          <div className="pt-2 border-t border-slate-200/70 text-slate-600 space-y-1">
            <p>• سيتم إرسال تعليمات وبيانات الدخول كاملة عبر رقم الواتساب فور اعتماد الحساب.</p>
            <p>• إذا كانت لديك أي استفسارات أو رغبة في استعجال القبول، يمكنك التواصل مباشرة مع إدارة المقرأة.</p>
          </div>
        </div>

        {/* قسم رقم واتساب الإدارة وزر التواصل */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-bold flex items-center gap-1.5 text-[#046A38]">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>رقم واتساب الإدارة:</span>
            </span>
            <span className="font-mono font-bold text-sm text-[#046A38]" dir="ltr">
              {adminWhatsAppNumber}
            </span>
          </div>

          {/* زر تواصل عبر واتساب */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-[#C5A059] cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#C5A059]" />
            <span>تواصل عبر واتساب (+967714371599)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        {/* أزرار التحكم والإجراءات الإضافية */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          {onRefreshStatus && (
            <button
              type="button"
              onClick={onRefreshStatus}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="التحقق من حالة قبول الطلب الآن"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#046A38]" />
              <span>تحديث حالة الطلب</span>
            </button>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#046A38] transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>الرئيسية</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
