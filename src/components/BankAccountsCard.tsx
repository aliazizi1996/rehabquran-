import React, { useState } from 'react';
import { 
  Building2, Wallet, Copy, Check, Send, ShieldCheck, 
  Sparkles, ExternalLink, MessageCircle, AlertCircle, HeartHandshake
} from 'lucide-react';

interface BankAccountsCardProps {
  variant?: 'full' | 'compact' | 'modal';
  className?: string;
  showSupportNote?: boolean;
}

export const BankAccountsCard: React.FC<BankAccountsCardProps> = ({
  variant = 'full',
  className = '',
  showSupportNote = true,
}) => {
  // Official Verified Bank Accounts
  const KURAIMI_SAR_ACCOUNT = '3204371368'; // بنك الكريمي - بالريال السعودي
  const KURAIMI_YER_ACCOUNT = '3204541287'; // بنك الكريمي - بالريال اليمني
  const JEEB_ACCESS_CODE = '313146';       // محفظة جيب - رمز الوصول / رقم الحساب المعتمد حصراً
  const WHATSAPP_NOTIFY = '967714371599';

  const [copiedKuraimiSar, setCopiedKuraimiSar] = useState(false);
  const [copiedKuraimiYer, setCopiedKuraimiYer] = useState(false);
  const [copiedJeeb, setCopiedJeeb] = useState(false);

  const handleCopy = (text: string, type: 'sar' | 'yer' | 'jeeb') => {
    navigator.clipboard.writeText(text);
    if (type === 'sar') {
      setCopiedKuraimiSar(true);
      setTimeout(() => setCopiedKuraimiSar(false), 2200);
    } else if (type === 'yer') {
      setCopiedKuraimiYer(true);
      setTimeout(() => setCopiedKuraimiYer(false), 2200);
    } else {
      setCopiedJeeb(true);
      setTimeout(() => setCopiedJeeb(false), 2200);
    }
  };

  const buildNotifyWhatsAppLink = () => {
    const text = `السلام عليكم ورحمة الله وبركاته،
لقد قمت بإجراء تحويل مالي لصالح مقرأة رحاب القرآن الإلكترونية:
• نوع الحساب المحول إليه: [بنك الكريمي بالريال السعودي ${KURAIMI_SAR_ACCOUNT} / بنك الكريمي بالريال اليمني ${KURAIMI_YER_ACCOUNT} / محفظة جيب رمز الوصول ${JEEB_ACCESS_CODE}]
• اسم المحول:
• رقم الحوالة / العملية:
• المبلغ والعملة:
• الغرض: (اشتراك حلقة / كفالة معلم / دعم المقرأة)

مرفق صورة سند التحويل/الإشعار. جزاكم الله خيراً.`;
    return `https://wa.me/${WHATSAPP_NOTIFY}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-[#0c2419] via-[#0f2e20] to-[#071710] border-2 border-amber-500/60 p-4 sm:p-5 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Subtle Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-emerald-900/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white font-serif">
                  حسابات المقرأة البنكية الرسمية
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  معتمدة 1447 هـ
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                للاشتراكات الشهرية ودعم كفالة حلقات تحفيظ القرآن الكريم
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/40 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>حسابات موثقة</span>
          </div>
        </div>

        {/* Bank Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* 1. Kuraimi Bank Account - Saudi Riyals (SAR) */}
          <div className="rounded-2xl bg-[#071911] border-2 border-amber-400/60 p-3 flex flex-col justify-between space-y-2.5 relative group hover:border-amber-400 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-xs">
                    🇸🇦
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      بنك الكريمي الإسلامي
                    </span>
                    <span className="text-[10px] text-amber-400 block font-bold">
                      بالريال السعودي (SAR)
                    </span>
                  </div>
                </div>
                <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/60 font-bold">
                  ريال سعودي
                </span>
              </div>

              {/* Account Box */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-amber-500/50 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">رقم الحساب (ريال سعودي):</span>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider dir-ltr select-all">
                    {KURAIMI_SAR_ACCOUNT}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(KURAIMI_SAR_ACCOUNT, 'sar')}
                    className="p-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="نسخ رقم حساب الكريمي بالريال السعودي"
                  >
                    {copiedKuraimiSar ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKuraimiSar ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-950">
              <span>كريمي جوال أو أي فرع أو صراف</span>
            </div>
          </div>

          {/* 2. Kuraimi Bank Account - Yemeni Riyals (YER) */}
          <div className="rounded-2xl bg-[#071911] border border-emerald-600/50 p-3 flex flex-col justify-between space-y-2.5 relative group hover:border-emerald-500 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold text-xs">
                    🇾🇪
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      بنك الكريمي الإسلامي
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-bold">
                      بالريال اليمني (YER)
                    </span>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700 font-bold">
                  ريال يمني
                </span>
              </div>

              {/* Account Box */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-emerald-800/80 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">رقم الحساب (ريال يمني):</span>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-sm sm:text-base font-black text-emerald-300 tracking-wider dir-ltr select-all">
                    {KURAIMI_YER_ACCOUNT}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(KURAIMI_YER_ACCOUNT, 'yer')}
                    className="p-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="نسخ رقم حساب الكريمي بالريال اليمني"
                  >
                    {copiedKuraimiYer ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKuraimiYer ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-950">
              <span>كريمي جوال أو مميز أو صرافات</span>
            </div>
          </div>

          {/* 3. Jeeb Wallet Account - Exact Access Code 313146 */}
          <div className="rounded-2xl bg-[#071911] border-2 border-teal-500/60 p-3 flex flex-col justify-between space-y-2.5 relative group hover:border-teal-400 transition-all shadow-md">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/40 flex items-center justify-center font-bold text-xs">
                    <Wallet className="w-4 h-4 text-teal-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      محفظة جيب الإلكترونية
                    </span>
                    <span className="text-[10px] text-teal-300 block font-bold">
                      رمز الوصول / رقم الحساب
                    </span>
                  </div>
                </div>
                <span className="text-[9px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-700 font-bold">
                  حساب الجيب
                </span>
              </div>

              {/* Wallet Number Box */}
              <div className="p-2 rounded-xl bg-[#040f0a] border border-teal-800 space-y-1">
                <span className="text-[10px] text-teal-300 block font-bold">حساب الجيب المعتمد حصراً:</span>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-base sm:text-lg font-black text-teal-300 tracking-wider dir-ltr select-all">
                    {JEEB_ACCESS_CODE}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(JEEB_ACCESS_CODE, 'jeeb')}
                    className="p-1 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-teal-200 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="نسخ حساب محفظة جيب"
                  >
                    {copiedJeeb ? (
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedJeeb ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-teal-400/90 pt-1 border-t border-teal-950 font-medium">
              <span>عبر تطبيق جيب الإلكتروني بالرمز أعلاه</span>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp Receipt Submission Button */}
        <div className="pt-2 border-t border-emerald-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 text-xs">
            <HeartHandshake className="w-4 h-4 text-amber-400 shrink-0" />
            <span>بعد التحويل، يرجى إرسال السند لإدارة المقرأة لتأكيد القيد:</span>
          </div>

          <a
            href={buildNotifyWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال سند التحويل للإدارة عبر الواتساب</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>

        {showSupportNote && (
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-[11px] text-emerald-200/90 leading-relaxed flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              قال رسول الله ﷺ: «خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ». مساهماتكم تسهم في دعم كادر المعلمين وتيسير حفظ كتاب الله عن بُعد.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
