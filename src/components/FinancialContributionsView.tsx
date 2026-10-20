import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CheckCircle2, Clock, PlusCircle, Filter, 
  Search, ShieldCheck, Heart, Building, ArrowDownLeft, X,
  Database, RefreshCw
} from 'lucide-react';
import { 
  DbFinancialContribution, 
  fetchAllFinancialContributions, 
  addFinancialContribution, 
  getLocalFinancialContributions 
} from '../data/firebaseSync';

interface FinancialContributionsViewProps {
  onClose?: () => void;
  isSupervisorView?: boolean;
}

export const FinancialContributionsView: React.FC<FinancialContributionsViewProps> = ({
  onClose,
  isSupervisorView = true,
}) => {
  const [contributions, setContributions] = useState<DbFinancialContribution[]>(() => getLocalFinancialContributions());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State for new contribution
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'ريال يمني' | 'ريال سعودي' | 'دولار'>('ريال يمني');
  const [type, setType] = useState<'kefala_sheikh' | 'student_support' | 'waqf' | 'general'>('kefala_sheikh');
  const [bankAccount, setBankAccount] = useState('بنك الكريمي للتمويل الأصغر');
  const [transferReference, setTransferReference] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load from Firestore
  const loadData = async () => {
    setIsSyncing(true);
    const data = await fetchAllFinancialContributions();
    setContributions(data);
    setIsSyncing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsLoading(true);
    const created = await addFinancialContribution({
      donorName: donorName.trim() || 'فاعل خير',
      amount: Number(amount),
      currency,
      type,
      bankAccount,
      transferReference: transferReference.trim() || `TRX-${Date.now().toString().slice(-6)}`,
      status: 'confirmed',
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    });

    setContributions((prev) => [created, ...prev]);
    setIsLoading(false);
    setSuccessMessage('تم تسجيل المساهمة المالية وحفظها بنجاح في قاعدة بيانات Firebase Firestore!');
    
    setTimeout(() => {
      setSuccessMessage('');
      setIsAddModalOpen(false);
      // Reset form
      setDonorName('');
      setAmount('');
      setTransferReference('');
      setNotes('');
    }, 1500);
  };

  const filtered = contributions.filter((c) => {
    const matchType = filterType === 'all' || c.type === filterType;
    const matchSearch = 
      c.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transferReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.bankAccount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // Calculate totals
  const totalYER = contributions.filter((c) => c.currency === 'ريال يمني').reduce((sum, c) => sum + c.amount, 0);
  const totalSAR = contributions.filter((c) => c.currency === 'ريال سعودي').reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-5 text-right font-sans select-none" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              💰
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              سجل المساهمات والتبرعات المالية للمقرأة
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            بيانات الحوالات والمساهمات المحفوظة سحابياً بشكل دائم وموثوق في Firebase Firestore
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Firebase Firestore متصل</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            تسجيل مساهمة جديدة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">إجمالي المساهمات (ريال يمني)</span>
          <p className="text-xl font-black text-emerald-800">
            {totalYER.toLocaleString('ar-YE')} <span className="text-xs font-semibold text-slate-500">ر.ي</span>
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block">مخصصة لكفالة المشايخ والتشغيل</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">إجمالي المساهمات (ريال سعودي)</span>
          <p className="text-xl font-black text-amber-700">
            {totalSAR.toLocaleString('ar-SA')} <span className="text-xs font-semibold text-slate-500">ر.س</span>
          </p>
          <span className="text-[11px] text-amber-600 mt-1 block">جوائز ومكافآت المتفوقين</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-xs text-slate-500 block mb-1">عدد العمليات المعتمدة</span>
          <p className="text-xl font-black text-slate-900">
            {contributions.length} <span className="text-xs font-semibold text-slate-500">عملية</span>
          </p>
          <button
            onClick={loadData}
            disabled={isSyncing}
            className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer pt-1"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            تحديث البيانات من السحابة
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم السند، أو اسم البنك..."
            className="w-full sm:w-64 text-xs text-slate-800 bg-transparent outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'kefala_sheikh', label: 'كفالة شيخ' },
            { id: 'student_support', label: 'دعم الطلاب' },
            { id: 'waqf', label: 'وقف قرآني' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterType === f.id ? 'bg-emerald-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contributions Table / Cards */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs text-right flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{item.donorName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {item.type === 'kefala_sheikh' ? 'كفالة شيخ' :
                   item.type === 'student_support' ? 'دعم الطلاب' :
                   item.type === 'waqf' ? 'وقف قرآني' : 'مساهمة عامة'}
                </span>
                <span className="text-xs text-slate-400">• {item.date}</span>
              </div>
              <p className="text-xs text-slate-500">
                الحساب: {item.bankAccount} • سند التحويل: <strong className="text-slate-800">{item.transferReference}</strong>
              </p>
              {item.notes && (
                <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                  "{item.notes}"
                </p>
              )}
            </div>

            <div className="text-left sm:text-left w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-base font-black text-emerald-800">
                {item.amount.toLocaleString()} {item.currency}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                معتمدة ومحفوظة سحابياً
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contribution Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 text-right animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">تسجيل مساهمة مالية جديدة</h3>
                <p className="text-xs text-slate-500">حفظ المساهمة مباشرة في قاعدة بيانات Firebase Firestore</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleAddContribution} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المساهم / المتبرع</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="مثال: فاعل خير أو اسم المتبرع"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المبلغ *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="المبلغ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">العملة</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                  >
                    <option value="ريال يمني">ريال يمني</option>
                    <option value="ريال سعودي">ريال سعودي</option>
                    <option value="دولار">دولار أمريكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع المساهمة</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'kefala_sheikh', label: 'كفالة شيخ حلقة' },
                    { id: 'student_support', label: 'دعم وتحفيز الطلاب' },
                    { id: 'waqf', label: 'وقف قرآني دائم' },
                    { id: 'general', label: 'مساهمة عامة للمقرأة' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border cursor-pointer transition-colors ${
                        type === t.id ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحساب البنكي / المحفظة</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="مثال: بنك الكريمي أو بنك التضامن"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الحوالة أو السند</label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder="مثال: TRX-123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بالمساهمة أو المتبرع..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 bg-white outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  {isLoading ? 'جاري الحفظ في Firestore...' : 'حفظ المساهمة في Firebase'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
