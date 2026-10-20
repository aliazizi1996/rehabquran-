import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UserPlus, 
  KeyRound, 
  Check, 
  Copy, 
  Send, 
  ExternalLink,
  Search,
  Filter,
  UserCheck,
  Info
} from 'lucide-react';
import { 
  fetchPendingAuthStudents, 
  retryCreateStudentAuth, 
  StudentAuthSyncStatusItem,
  StudentAuthSyncStatusResult 
} from '../services/studentApplicationService';
import { validateAndCleanWhatsAppNumber } from '../services/whatsappService';

interface StudentAuthSyncDashboardProps {
  adminName?: string;
  onRefreshParentList?: () => void;
}

export const StudentAuthSyncDashboard: React.FC<StudentAuthSyncDashboardProps> = ({
  adminName = 'إدارة المقرأة',
  onRefreshParentList
}) => {
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<StudentAuthSyncStatusResult | null>(null);
  const [filterMode, setFilterMode] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for immediate account creation modal
  const [selectedStudentForRetry, setSelectedStudentForRetry] = useState<StudentAuthSyncStatusItem | null>(null);
  const [retryPassword, setRetryPassword] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    academicId?: string;
    password?: string;
    phone?: string;
    whatsappUrl?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetchPendingAuthStudents();
      setSyncData(res);
    } catch (e) {
      console.error('Error fetching student auth sync status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // توليد كلمة مرور عشوائية آمنة وسهلة
  const generateNewPassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `RQ@${digits}${rand}`;
  };

  const handleOpenRetryModal = (student: StudentAuthSyncStatusItem) => {
    setSelectedStudentForRetry(student);
    setRetryPassword(generateNewPassword());
    setRetryResult(null);
    setCopiedKey(false);
  };

  const handleExecuteRetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForRetry || !retryPassword.trim()) return;

    setIsRetrying(true);
    setRetryResult(null);

    try {
      const res = await retryCreateStudentAuth({
        academicId: selectedStudentForRetry.academicId,
        fullName: selectedStudentForRetry.name,
        phone: selectedStudentForRetry.phone,
        password: retryPassword.trim()
      });

      if (res.success) {
        // تجهيز رابط الواتساب
        const cleanMsg = `السلام عليكم ورحمة الله وبركاته،\nأهلاً بك يا ${selectedStudentForRetry.name} في مقرأة رحاب القرآن الإلكترونية 🌿\n\nنبارك لك تفعيل حسابك الأكاديمي الرسمي:\n• الرقم الأكاديمي: ${selectedStudentForRetry.academicId}\n• اسم المستخدم: ${selectedStudentForRetry.academicId}\n• كلمة المرور: ${retryPassword.trim()}\n• رابط المنصة: ${window.location.origin}/login\n\nنسأل الله لك التوفيق والسداد في مدارسة كتاب الله وحفظه.`;
        const phoneVal = validateAndCleanWhatsAppNumber(selectedStudentForRetry.phone, 'اليمن');
        const waUrl = phoneVal.isValid 
          ? `https://wa.me/${phoneVal.cleanPhone}?text=${encodeURIComponent(cleanMsg)}` 
          : '';

        setRetryResult({
          success: true,
          message: res.message || 'تم إنشاء الحساب في Firebase Auth بنجاح وتعيين كلمة المرور.',
          academicId: selectedStudentForRetry.academicId,
          password: retryPassword.trim(),
          phone: selectedStudentForRetry.phone,
          whatsappUrl: waUrl
        });

        // تحديث القائمة فوراً
        loadStatus();
        if (onRefreshParentList) onRefreshParentList();
      } else {
        setRetryResult({
          success: false,
          error: res.error || 'تعذر استكمال إنشاء الحساب في Firebase Auth'
        });
      }
    } catch (err: any) {
      setRetryResult({
        success: false,
        error: err?.message || 'حدث خطأ غير متوقع أثناء معالجة الحساب'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const displayedList = (syncData?.allStudentsStatus || []).filter((s) => {
    if (filterMode === 'pending' && s.existsInAuth) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.academicId.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.halqaTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in" dir="rtl">
      {/* رأس اللوحة الإحصائية */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#046A38] border border-[#C5A059]/30">
              <ShieldAlert className="w-5 h-5 text-[#046A38]" />
            </span>
            <h3 className="text-base sm:text-lg font-bold font-serif text-[#046A38]">
              رقابة حسابات Firebase Auth للطلاب المقبولين
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            متابعة دقيقة للطلاب الذين صدرت أرقامهم الأكاديمية واكتشاف أي طالب تعذر إنشاء حسابه السحابي في Firebase Auth تلقائياً مع توضيح سبب الخطأ وزر المعالجة الفورية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadStatus}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
            title="إعادة فحص الاتصال وقائمة الحسابات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#046A38]' : ''}`} />
            <span>تحديث الفحص</span>
          </button>
        </div>
      </div>

      {/* بطاقات المؤشرات الإحصائية */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">إجمالي المقبولين</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {syncData?.totalApproved ?? 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-700 block">حسابات مربوطة بنجاح ✓</span>
            <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">
              {syncData?.syncedCount ?? 0}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#046A38] border border-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#046A38]" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs flex items-center justify-between transition-colors ${
          (syncData?.pendingCount ?? 0) > 0 
            ? 'bg-rose-50/70 border-rose-300' 
            : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className={`text-xs font-bold block ${
              (syncData?.pendingCount ?? 0) > 0 ? 'text-rose-800' : 'text-slate-500'
            }`}>
              بانتظار إنشاء حساب Firebase
            </span>
            <span className={`text-2xl font-bold font-mono mt-1 block ${
              (syncData?.pendingCount ?? 0) > 0 ? 'text-rose-900' : 'text-slate-900'
            }`}>
              {syncData?.pendingCount ?? 0}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            (syncData?.pendingCount ?? 0) > 0 
              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
              : 'bg-slate-100 text-slate-700'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* تنبيه إذا وُجد طلاب بحاجة لإنشاء الحساب */}
      {(syncData?.pendingCount ?? 0) > 0 && (
        <div className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-amber-950">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-amber-900 mb-0.5">
              تنبيه إدارة المقرأة: يوجد ({syncData?.pendingCount}) طالب بحاجة إلى استكمال إنشاء حساب Firebase Auth
            </strong>
            <span>
              هؤلاء الطلاب يملكون أرقاماً أكاديمية مسجلة ومعتمدة في الحلقات، ولكن تعذر تسجيل بريدهم الرسمي في مزود الهوية السحابي. اضغط على زر «إنشاء الحساب الآن» بجانب اسم الطالب لإنشائه وتزويده بكلمة المرور عبر واتساب.
            </span>
          </div>
        </div>
      )}

      {/* شريط الفلاتر والبحث */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'pending'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>غير المنشأة فقط</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {syncData?.pendingCount ?? 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'all'
                ? 'bg-[#046A38] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>جميع الطلاب المقبولين</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {syncData?.totalApproved ?? 0}
            </span>
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الرقم الأكاديمي..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#046A38] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* جدول الطلاب وحالة المزامنة */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#046A38]" />
            <p className="text-xs font-bold text-slate-700">جاري فحص حالة حسابات الطلاب مع خوادم Firebase Auth...</p>
          </div>
        ) : displayedList.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 font-serif">
              {filterMode === 'pending' 
                ? 'رائع! جميع الطلاب المقبولين يملكون حسابات نشطة في Firebase Auth بنجاح ✨' 
                : 'لا توجد نتائج مطابقة لبحثك'}
            </p>
            <p className="text-xs text-slate-400">لا توجد أي حسابات معلقة أو أخطاء مزامنة في الوقت الحالي.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F9F6F0] border-b border-slate-200 text-[#046A38] font-bold">
                <tr>
                  <th className="p-3.5">اسم الطالب</th>
                  <th className="p-3.5">الرقم الأكاديمي</th>
                  <th className="p-3.5">البريد الأكاديمي الرسمي</th>
                  <th className="p-3.5">الحلقة والمعلم</th>
                  <th className="p-3.5 text-center">حالة Firebase Auth</th>
                  <th className="p-3.5">سبب الخطأ / الملاحظة</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.map((item) => {
                  const isMissing = !item.existsInAuth;
                  return (
                    <tr key={item.academicId} className={`transition-colors ${isMissing ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50'}`}>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono" dir="ltr">{item.phone}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[#046A38]" dir="ltr">
                        {item.academicId}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600" dir="ltr">
                        {item.email}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{item.halqaTitle}</span>
                        <span className="text-[11px] text-slate-500 block">{item.teacherName}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        {item.existsInAuth ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-[#046A38] border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>مفعل سحابياً ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>غير منشأ بعد</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        {item.existsInAuth ? (
                          <span className="text-slate-400 text-[11px]">حساب الطالب جاهز لتسجيل الدخول</span>
                        ) : (
                          <span className="text-rose-700 text-[11px] font-medium leading-relaxed block">
                            {item.detailedError || 'لم يتم إنشاء الحساب التلقائي أثناء القبول'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isMissing ? (
                          <button
                            type="button"
                            onClick={() => handleOpenRetryModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all cursor-pointer shadow-xs border border-[#C5A059] flex items-center justify-center gap-1.5 mx-auto active:scale-95"
                            title="إنشاء الحساب فوراً وتوليد كلمة المرور"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>إنشاء الحساب الآن</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenRetryModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            title="إعادة تعيين كلمة المرور للطالب"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                            <span>تغيير كلمة المرور</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة إعادة إنشاء الحساب وتعيين كلمة المرور */}
      {selectedStudentForRetry && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* رأس النافذة */}
            <div className="bg-[#046A38] text-white p-5 flex items-center justify-between border-b-2 border-[#C5A059]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <KeyRound className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-white">
                    إنشاء وتفعيل حساب Firebase Auth للطالب
                  </h3>
                  <p className="text-xs text-white/80 font-sans">
                    {selectedStudentForRetry.name} ({selectedStudentForRetry.academicId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForRetry(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* النموذج والمحتوى */}
            <div className="p-5 sm:p-6 space-y-4">
              {!retryResult?.success ? (
                <form onSubmit={handleExecuteRetry} className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>الرقم الأكاديمي:</span>
                      <strong className="font-mono text-[#046A38]" dir="ltr">{selectedStudentForRetry.academicId}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>البريد المعتمد:</span>
                      <strong className="font-mono text-slate-800" dir="ltr">{selectedStudentForRetry.email}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>رقم الهاتف:</span>
                      <strong className="font-mono text-slate-800" dir="ltr">{selectedStudentForRetry.phone}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      كلمة المرور للطالب في Firebase Auth:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={retryPassword}
                        onChange={(e) => setRetryPassword(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#046A38] focus:ring-1 focus:ring-[#046A38]"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setRetryPassword(generateNewPassword())}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="توليد كلمة مرور عشوائية جديدة"
                      >
                        توليد كلمة جديدة
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      سيتم تسجيل هذه الكلمة مباشرة في مزود الهوية، وتجهيز رسالة واتساب لإرسالها للطالب.
                    </span>
                  </div>

                  {retryResult?.error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{retryResult.error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForRetry(null)}
                      disabled={isRetrying}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isRetrying}
                      className="px-5 py-2.5 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2 border border-[#C5A059]"
                    >
                      {isRetrying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                          <span>جاري إنشاء الحساب...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>اعتماد وإنشاء الحساب في Firebase</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-sm text-emerald-900 mb-1 font-serif">
                        تم إنشاء الحساب بنجاح في Firebase Auth! ✨
                      </strong>
                      <p className="leading-relaxed">
                        أصبح الطالب قادراً الآن على تسجيل الدخول برقم الهاتف أو الرقم الأكاديمي وكلمة المرور المحددة.
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#C5A059]/40 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">الرقم الأكاديمي:</span>
                      <strong className="font-mono text-[#046A38]" dir="ltr">{retryResult.academicId}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">كلمة المرور:</span>
                      <strong className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded" dir="ltr">{retryResult.password}</strong>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`الرقم الأكاديمي: ${retryResult.academicId}\nكلمة المرور: ${retryResult.password}`);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span className="text-emerald-700">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>نسخ بيانات الدخول</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForRetry(null)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer flex-1 sm:flex-none text-center"
                      >
                        إغلاق
                      </button>

                      {retryResult.whatsappUrl && (
                        <a
                          href={retryResult.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm flex-1 sm:flex-none"
                        >
                          <Send className="w-4 h-4" />
                          <span>إرسال عبر WhatsApp ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
