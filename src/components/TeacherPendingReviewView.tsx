/**
 * شاشة «طلب المعلم قيد المراجعة»
 * مقرأة رحاب القرآن الإلكترونية - الإصدار المعتمد 2026
 *
 * تظهر للمعلم عند تسجيل الدخول إذا كانت حالته في Firestore "pending".
 */

import React from 'react';
import { Clock, Phone, Send, RefreshCw, LogOut, ExternalLink, ShieldCheck, ArrowRight, GraduationCap } from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';

interface TeacherPendingReviewViewProps {
  teacherName?: string;
  teacherPhone?: string;
  teacherEmail?: string;
  onRefreshStatus?: () => void;
  onLogout: () => void;
  onBackToHome?: () => void;
}

export const TeacherPendingReviewView: React.FC<TeacherPendingReviewViewProps> = ({
  teacherName = 'فضيلة المعلم / المعلمة',
  teacherPhone,
  teacherEmail,
  onRefreshStatus,
  onLogout,
  onBackToHome,
}) => {
  const adminWhatsAppNumber = '+967714371599';
  const cleanAdminPhone = '967714371599';

  const defaultMsg = `السلام عليكم ورحمة الله وبركاته 🌿\nأنا المعلم (${teacherName}) المسجل في كادر مقرأة رحاب القرآن الإلكترونية، أود الاستفسار والتواصل بخصوص طلب الانضمام وحالته في المقرأة.`;
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
            <GraduationCap className="w-8 h-8 text-[#046A38]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-serif text-[#046A38]">
              طلبك قيد المراجعة والاعتماد
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-sans">
              أهلاً بكم فضيلة الشيخ / <strong>{teacherName}</strong> في رحاب القرآن الكريم 🌿
            </p>
          </div>
        </div>

        {/* بطاقة الشرح والتوضيح */}
        <div className="bg-[#F9F6F0] rounded-2xl p-4 border border-[#C5A059]/30 text-xs text-slate-700 space-y-2 leading-relaxed">
          <p>
            تم استلام بيانات تسجيلكم وسيرتكم العلمية بنجاح، وطلبكم حالياً <strong>قيد المراجعة والتدقيق</strong> من قِبل المشرف العام وإدارة شؤون المعلمين.
          </p>
          <div className="pt-2 border-t border-[#C5A059]/20 flex items-center gap-2 text-[#046A38] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
            <span>سيتم تعيين الحلقات والأوقات وإرسال إشعار القبول عبر الواتساب فور الاعتماد.</span>
          </div>
        </div>

        {/* بيانات الحساب المسجلة */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
          <span className="font-bold text-slate-700 block">بيانات الحساب المسجلة:</span>
          {teacherEmail && (
            <div className="flex items-center justify-between text-slate-600">
              <span>البريد الإلكتروني:</span>
              <span className="font-mono font-medium text-slate-900" dir="ltr">{teacherEmail}</span>
            </div>
          )}
          {teacherPhone && (
            <div className="flex items-center justify-between text-slate-600">
              <span>رقم الواتساب للتواصل:</span>
              <span className="font-mono font-medium text-slate-900" dir="ltr">{teacherPhone}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-600">
            <span>حالة الطلب:</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              <span>قيد المراجعة (Pending)</span>
            </span>
          </div>
        </div>

        {/* زر التواصل المباشر عبر واتساب الإدارة */}
        <div className="space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#C5A059] rotate-180" />
            <span>تواصل مع المشرف العام عبر WhatsApp ({adminWhatsAppNumber})</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </a>
          <p className="text-[11px] text-center text-slate-500">
            يمكنكم الاستفسار المباشر ومتابعة سرعة اعتماد الطلب مع إدارة المقرأة.
          </p>
        </div>

        {/* أزرار الإجراءات السريعة (تحديث الحالة - تسجيل الخروج - الرئيسية) */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          {onRefreshStatus && (
            <button
              type="button"
              onClick={onRefreshStatus}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="التحقق من حالة الطلب الآن"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#046A38]" />
              <span>تحديث الحالة</span>
            </button>
          )}

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-[#046A38] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>الصفحة الرئيسية</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-1.5 transition-colors cursor-pointer mr-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
