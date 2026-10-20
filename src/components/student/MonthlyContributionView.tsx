import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, Building2, Wallet, Copy, Check, 
  AlertCircle, CheckCircle2, Clock, Send, ShieldCheck, 
  Sparkles, RefreshCw, X, ChevronDown, ChevronUp, ExternalLink 
} from 'lucide-react';
import { AuthAccount } from '../../types';
import { 
  MonthlyContributionItem, 
  getOrCreateCurrentMonthContribution, 
  fetchStudentMonthlyContributions, 
  reportMonthlyContributionPayment,
  getCurrentMonthInfo 
} from '../../services/firestoreService';

interface MonthlyContributionViewProps {
  currentAccount: AuthAccount;
  onPaymentReported?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const MonthlyContributionView: React.FC<MonthlyContributionViewProps> = ({
  currentAccount,
  onPaymentReported,
  className = '',
  isCompact = false,
}) => {
  const [currentRecord, setCurrentRecord] = useState<MonthlyContributionItem | null>(null);
  const [historyRecords, setHistoryRecords] = useState<MonthlyContributionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAccountsInFullPage, setShowAccountsInFullPage] = useState(false);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState('الكريمي - ريال يمني (3204541287)');
  const [transferReference, setTransferReference] = useState('');
  const [studentNotes, setStudentNotes] = useState('');

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Official Verified Accounts
  const KURAIMI_YER = '3204541287';
  const KURAIMI_SAR = '3204371368';
  const JEEB_WALLET = '313146';

  const monthInfo = getCurrentMonthInfo();

  useEffect(() => {
    loadContributionData();
  }, [currentAccount.id]);

  const loadContributionData = async () => {
    setIsLoading(true);
    try {
      // 1. Get or create current month record
      const current = await getOrCreateCurrentMonthContribution(currentAccount.id, currentAccount.name);
      setCurrentRecord(current);

      // 2. Fetch history records
      const history = await fetchStudentMonthlyContributions(currentAccount.id);
      setHistoryRecords(history);
    } catch (err: any) {
      console.error('Error loading contribution data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Copy fallback failed:', err);
      }
    }

    if (success) {
      setCopiedKey(key);
      setCopyToast(`تم نسخ رقم ${label} بنجاح: ${text}`);
      setTimeout(() => setCopiedKey(null), 2500);
      setTimeout(() => setCopyToast(null), 3500);
    }
  };

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await reportMonthlyContributionPayment(currentRecord.id, currentAccount.id, {
      paymentMethod,
      transferReference: transferReference.trim(),
      studentNotes: studentNotes.trim()
    });

    setIsSubmitting(false);

    if (res.success) {
      setIsPaymentModalOpen(false);
      setFeedback({
        type: 'success',
        message: 'تم إرسال إشعار السداد للإدارة بنجاح! ستتم مراجعة وتأكيد السداد من قِبل إدارة المقرأة قريباً.'
      });
      // Refresh local state to reflect 'pending_confirmation'
      setCurrentRecord(prev => prev ? {
        ...prev,
        status: 'pending_confirmation',
        paymentMethod,
        transferReference: transferReference.trim(),
        studentNotes: studentNotes.trim(),
        paymentReportedAt: new Date().toISOString()
      } : null);
      if (onPaymentReported) onPaymentReported();
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'تعذر إرسال الإشعار، يرجى التحقق من الاتصال والمحاولة لاحقاً.'
      });
    }
  };

  // Reusable Accounts Grid (ONLY visible when explicitly requested / in modal)
  const renderAccountsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
      {/* 1. الكريمي YER */}
      <div className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/40 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">الكريمي (يمني)</span>
            <span className="text-[10px] bg-emerald-100 text-[#046A38] px-2 py-0.5 rounded font-bold">YER</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">رقم الحساب:</span>
            <span className="font-mono text-base font-black text-[#046A38] tracking-wider dir-ltr select-all block">
              {KURAIMI_YER}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(KURAIMI_YER, 'الكريمي (ريال يمني)', 'yer')}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            copiedKey === 'yer'
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-slate-100 text-[#046A38] border border-[#046A38]/30 shadow-2xs'
          }`}
        >
          {copiedKey === 'yer' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === 'yer' ? 'تم النسخ ✓' : 'نسخ الرقم'}</span>
        </button>
      </div>

      {/* 2. الكريمي SAR */}
      <div className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/40 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">الكريمي (سعودي)</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">SAR</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">رقم الحساب:</span>
            <span className="font-mono text-base font-black text-[#046A38] tracking-wider dir-ltr select-all block">
              {KURAIMI_SAR}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(KURAIMI_SAR, 'الكريمي (ريال سعودي)', 'sar')}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            copiedKey === 'sar'
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-slate-100 text-[#046A38] border border-[#046A38]/30 shadow-2xs'
          }`}
        >
          {copiedKey === 'sar' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === 'sar' ? 'تم النسخ ✓' : 'نسخ الرقم'}</span>
        </button>
      </div>

      {/* 3. محفظة جيب */}
      <div className="p-3.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/40 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">محفظة جيب</span>
            <span className="text-[10px] bg-teal-100 text-teal-900 px-2 py-0.5 rounded font-bold">جيب</span>
          </div>
          <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">رقم المحفظة:</span>
            <span className="font-mono text-base font-black text-[#046A38] tracking-wider dir-ltr select-all block">
              {JEEB_WALLET}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(JEEB_WALLET, 'محفظة جيب', 'jeeb')}
          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            copiedKey === 'jeeb'
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-slate-100 text-[#046A38] border border-[#046A38]/30 shadow-2xs'
          }`}
        >
          {copiedKey === 'jeeb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedKey === 'jeeb' ? 'تم النسخ ✓' : 'نسخ الرقم'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* Toast Feedback */}
      {copyToast && (
        <div className="p-3 rounded-2xl bg-emerald-900 text-white text-xs sm:text-sm flex items-center justify-between border border-emerald-400 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold">{copyToast}</span>
          </div>
          <span className="text-[11px] text-emerald-200">جاهز للصق</span>
        </div>
      )}

      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. التنبيه المدمج للوحة التحكم (Compact Alert Banner)      */}
      {/* شرط الطلب: أقل حجماً، ولا تظهر أرقام الحسابات إلا بعد الضغط */}
      {/* ======================================================== */}
      {isCompact ? (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#C5A059]/40 shadow-xs hover:border-[#C5A059] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#C5A059]">
              <HeartHandshake className="w-5 h-5 text-[#C5A059]" />
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
                  المساهمة الشهرية لدعم المقرأة ({currentRecord?.monthLabel || monthInfo.label})
                </h4>
                
                {/* Status Badge */}
                {currentRecord?.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>تم السداد ✓</span>
                  </span>
                ) : currentRecord?.status === 'pending_confirmation' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px]">
                    <Clock className="w-3 h-3 text-cyan-600" />
                    <span>بانتظار التأكيد</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>مستحقة</span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                تخصص المساهمة لتغطية باقات الإنترنت لمعلمي الحلقات واستمرار التحفيظ عن بُعد. نسأل الله أن يبارك لكم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border border-[#C5A059]"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>
                {currentRecord?.status === 'paid'
                  ? 'عرض بيانات الحسابات'
                  : currentRecord?.status === 'pending_confirmation'
                  ? 'تعديل الإشعار والحسابات'
                  : 'دفع المساهمة وعرض الحسابات'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* 2. العرض الكامل في صفحة المساهمة المستقلة                 */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] rounded-3xl p-6 sm:p-7 text-white border-2 border-[#C5A059] shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs text-[#C5A059] font-bold border border-[#C5A059]/40 backdrop-blur-xs">
                  <HeartHandshake className="w-4 h-4 text-[#C5A059]" />
                  <span>مساهمة شهرية مباركة 1447هـ</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                  المساهمة الشهرية لدعم المقرأة
                </h2>

                <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed font-sans">
                  تنبيه لطيف: تخصص هذه المساهمة الشهرية للمساعدة في تغطية تكاليف باقات الإنترنت لمعلمي ومعلمات الحلقات وضمان استمرار حلقات تحفيظ كتاب الله وتعليم القراءات عن بُعد، وفق نظام ولوائح المقرأة المباركة.
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-black/30 border border-[#C5A059]/50 backdrop-blur-xs text-center min-w-[200px] shrink-0 space-y-2">
                <span className="text-[11px] text-emerald-200 block font-bold">
                  الشهر المستحق: {currentRecord?.monthLabel || monthInfo.label}
                </span>

                <div>
                  {currentRecord?.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم السداد ✓</span>
                    </span>
                  ) : currentRecord?.status === 'pending_confirmation' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold text-xs">
                      <Clock className="w-4 h-4" />
                      <span>بانتظار التأكيد</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400 font-bold text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>مستحقة</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full mt-2 py-2 px-3 bg-[#C5A059] hover:bg-[#b58f47] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{currentRecord?.status === 'pending_confirmation' ? 'تعديل إشعار السداد' : 'دفع المساهمة وإبلاغ الإدارة'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Toggleable Accounts Section on Full Page */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#046A38]" />
                <h3 className="text-sm sm:text-base font-bold font-serif text-[#046A38]">
                  الحسابات البنكية المعتمدة للتحويل
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountsInFullPage(!showAccountsInFullPage)}
                className="px-3 py-1.5 bg-[#F9F6F0] hover:bg-slate-100 text-[#046A38] border border-[#C5A059]/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{showAccountsInFullPage ? 'إخفاء الحسابات' : 'عرض أرقام الحسابات'}</span>
                {showAccountsInFullPage ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showAccountsInFullPage ? (
              renderAccountsGrid()
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>تظهر أرقام الحسابات الرسمية عند الضغط على زر «عرض أرقام الحسابات» أو زر «دفع المساهمة».</span>
                <button
                  type="button"
                  onClick={() => setShowAccountsInFullPage(true)}
                  className="text-xs text-[#046A38] font-bold hover:underline cursor-pointer self-start sm:self-center"
                >
                  إظهار أرقام الحسابات الآن ←
                </button>
              </div>
            )}
          </div>

          {/* History Records Table */}
          {historyRecords.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold font-serif text-slate-900">
                  سجل المساهمات الشهرية السابقة
                </h3>
                <span className="text-xs text-slate-500 font-mono">السجلات: {historyRecords.length}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F9F6F0] text-[#046A38] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">الشهر المستحق</th>
                      <th className="p-3">طريقة التحويل</th>
                      <th className="p-3">رقم العملية / السند</th>
                      <th className="p-3">تاريخ الإبلاغ</th>
                      <th className="p-3">حالة المساهمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRecords.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900 font-serif">{item.monthLabel || item.month}</td>
                        <td className="p-3 text-slate-600">{item.paymentMethod || '—'}</td>
                        <td className="p-3 font-mono text-slate-500">{item.transferReference || '—'}</td>
                        <td className="p-3 text-slate-500">{item.paymentReportedAt ? item.paymentReportedAt.split('T')[0] : '—'}</td>
                        <td className="p-3">
                          {item.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <Check className="w-3 h-3" />
                              <span>تم السداد</span>
                            </span>
                          ) : item.status === 'pending_confirmation' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[11px]">
                              <Clock className="w-3 h-3" />
                              <span>بانتظار التأكيد</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              <AlertCircle className="w-3 h-3" />
                              <span>مستحقة</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. نافذة مودال: الحسابات المعتمدة وإبلاغ السداد            */}
      {/* تظهر فقط عند الضغط على زر دفع المساهمة كما طلب المستخدم   */}
      {/* ======================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#046A38] border border-emerald-200 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4 text-[#046A38]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#046A38] font-serif">
                    دفع المساهمة الشهرية والحسابات الرسمية
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    الشهر: {currentRecord?.monthLabel || monthInfo.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* الحسابات البنكية المعتمدة تظهر هنا بعد الضغط */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                1. الحسابات البنكية المعتمدة للتحويل (انسخ الرقم المراد):
              </span>
              {renderAccountsGrid()}
            </div>

            {/* ملاحظة إدارية */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
              <div className="flex items-center gap-1 font-bold text-amber-950">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>ملاحظة التحقق والمطابقة:</span>
              </div>
              <p className="text-[11px]">
                تتحول الحالة إلى <strong>«تم السداد»</strong> بعد قيام المشرف المالي بمطابقة السند المرفق.
              </p>
            </div>

            {/* 2. نموذج إرسال إشعار السداد للإدارة */}
            <form onSubmit={handleReportPayment} className="space-y-3.5 text-xs border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800 block">
                2. إشعار الإدارة بالسداد فور التحويل:
              </span>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  طريقة التحويل المستخدمة:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                >
                  <option value="الكريمي - ريال يمني (3204541287)">بنك الكريمي — العملة اليمنية (3204541287)</option>
                  <option value="الكريمي - ريال سعودي (3204371368)">بنك الكريمي — العملة السعودية (3204371368)</option>
                  <option value="محفظة جيب الإلكترونية (313146)">محفظة جيب الإلكترونية (313146)</option>
                  <option value="حوالة عبر صراف آخر">حوالة عبر صراف / تحويل آخر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رقم الحوالة أو العملية (إن وُجد):
                </label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder="مثال: 98451203"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم المحوّل أو ملاحظة إضافية (اختياري):
                </label>
                <input
                  type="text"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="مثال: تم التحويل باسم الوالد عبر كريمي جوال"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-[#C5A059] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال إشعار السداد للإدارة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
