/**
 * بوابة مدير النظام وإدارة الصلاحيات والأمان (RBAC & Security Management)
 * مقرأة رحاب القرآن الإلكترونية
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, UserX, UserCheck, Key, Lock, 
  History, Search, RefreshCw, CheckCircle2, AlertTriangle, 
  ChevronLeft, Award, Eye, Filter, ArrowRight
} from 'lucide-react';
import { User, UserRole, SecurityActivityLog } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { getAcademyDatabase, saveAcademyDatabase } from '../data/academyDb';

const ROLES_LIST: { id: UserRole; label: string; badgeColor: string; description: string }[] = [
  { 
    id: 'student', 
    label: 'طالب', 
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'تسميع، حل الاختبارات، متابعة الورد، حضور الحلقات'
  },
  { 
    id: 'teacher', 
    label: 'معلم / شيخ حلقة', 
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'إدارة حلقات التسميع، تصحيح التلاوات، رصد الحضور'
  },
  { 
    id: 'academic_supervisor', 
    label: 'مشرف أكاديمي', 
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'إشراف على الحلقات والمناهج والمحتوى التعليمي'
  },
  { 
    id: 'system_admin', 
    label: 'مدير النظام (Admin)', 
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'صلاحيات كاملة، إدارة المستخدمين، Custom Claims، سجلات الأمان'
  },
  { 
    id: 'parent', 
    label: 'ولي أمر', 
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'متابعة تقارير وحضور ودرجات الأبناء فقط'
  },
  { 
    id: 'quality_auditor', 
    label: 'مراجع جودة / شيخ مجاز', 
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'تدقيق التلاوات ومراجعة الدرجات وتقييم الأداء الإقرائي'
  }
];

import { SystemDiagnosticsView } from './SystemDiagnosticsView';

interface AdminRBACViewProps {
  onBackToDashboard?: () => void;
  initialTab?: 'users' | 'security_logs' | 'matrix' | 'system_diagnostics';
}

export const AdminRBACView: React.FC<AdminRBACViewProps> = ({ onBackToDashboard, initialTab = 'users' }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'security_logs' | 'matrix' | 'system_diagnostics'>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [securityLogs, setSecurityLogs] = useState<SecurityActivityLog[]>([]);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadUsersAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch from Firestore users with safe limit for performance
      const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
      let fetchedUsers: User[] = [];
      usersSnap.forEach((d) => {
        fetchedUsers.push({ id: d.id, ...d.data() } as User);
      });

      // If firestore users collection is small, seed from local academy db
      if (fetchedUsers.length === 0) {
        const localDb = getAcademyDatabase();
        fetchedUsers = (localDb.users || []).map((u) => ({
          id: u.id,
          fullName: u.name,
          email: u.email || `${u.academicId || 'user'}@rehab-quran.com`,
          phone: u.phone,
          role: (u.role === 'supervisor' ? 'academic_supervisor' : u.role) as UserRole,
          gender: (u.section === 'female' ? 'female' : 'male') as 'male' | 'female',
          country: 'اليمن',
          timezone: 'Asia/Aden',
          isActive: u.status !== 'rejected',
          emailVerified: true,
          createdAt: u.createdAt || '2026-01-01',
          updatedAt: '2026-09-26',
          lastLoginAt: '2026-09-26',
          notificationPreferences: { email: true, push: true, whatsapp: true, halqaReminders: true }
        }));
      }

      setUsers(fetchedUsers);

      // 2. Fetch Security Logs from Server API
      try {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        const res = await fetch('/api/admin/security-logs', {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        });
        const data = await res.json();
        if (data.logs) {
          setSecurityLogs(data.logs);
        }
      } catch {
        // fallback
      }
    } catch (e) {
      console.warn('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndLogs();
  }, []);

  const handleUpdateRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUid(uid);
    try {
      // 1. Update in Firestore
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });

      // 2. Provision Custom Claims via server using authenticated session
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      await fetch('/api/admin/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          uid,
          role: newRole
        })
      });

      // 3. Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
      );

      setActionMessage(`تم تحديث صلاحية المستخدم بنجاح إلى (${ROLES_LIST.find(r => r.id === newRole)?.label}) وتعيين Custom Claims المشفرة.`);
      setTimeout(() => setActionMessage(null), 3500);
      loadUsersAndLogs();
    } catch (e: any) {
      alert(`حدث خطأ أثناء تعديل الصلاحية: ${e?.message || e}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
    setUpdatingUid(uid);
    const newStatus = !currentStatus;
    try {
      // 1. استدعاء خادم الأمان الإداري لتحديث Firebase Auth و Firestore وسجل التدقيق بشكل معتمد
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch(`/api/admin/users/${uid}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          isActive: newStatus,
          reason: newStatus ? 'إعادة تفعيل من الإدارة' : 'تعطيل إداري'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `فشل تعديل حالة الحساب في الخادم (رمز ${res.status})`);
      }

      // 2. تحديث تكميلي من العميل إن وُجدت صلاحية مباشرة
      try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          isActive: newStatus,
          updatedAt: new Date().toISOString()
        });
      } catch {}

      setUsers((prev) =>
        prev.map((u) => (u.id === uid ? { ...u, isActive: newStatus } : u))
      );

      setActionMessage(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} حساب المستخدم بنجاح.`);
      setTimeout(() => setActionMessage(null), 3000);
      loadUsersAndLogs();
    } catch (e: any) {
      alert(`حدث خطأ أثناء تغيير حالة الحساب: ${e?.message || e}`);
    } finally {
      setUpdatingUid(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#065A31] to-[#046A38] rounded-3xl p-5 sm:p-6 text-white border-2 border-[#C5A059] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-white/15 text-[#C5A059] flex items-center justify-center font-bold text-lg border border-[#C5A059]/40">
              🛡️
            </span>
            <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
              نظام إدارة المستخدمين والصلاحيات والأمان (RBAC)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white">
            منظومة الأدوار والصلاحيات المشفرة (Custom Claims)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-sans max-w-2xl">
            إدارة حسابات المقرأة الستة (طالب، معلم، مشرف أكاديمي، مدير نظام، ولي أمر، مراجع جودة) مع حماية المسارات وقواعد Firestore ومنع تصعيد الصلاحيات.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0"
          >
            <span>العودة للوحة الإشراف</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2 animate-scale-up">
          <CheckCircle2 className="w-4 h-4 text-[#046A38]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة المستخدمين ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security_logs')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'security_logs'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل النشاط الأمني والتدقيق ({securityLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>مصفوفة الصلاحيات وقواعد Firestore</span>
        </button>

        <button
          onClick={() => setActiveTab('system_diagnostics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'system_diagnostics'
              ? 'bg-[#046A38] text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <span>⚡ فحص النظام</span>
        </button>

        <button
          onClick={loadUsersAndLogs}
          className="mr-auto p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs flex items-center gap-1"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 text-xs text-[#2C3531] focus:outline-none focus:border-[#046A38]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-[#2C3531] bg-white cursor-pointer"
              >
                <option value="all">كافة الأدوار (الكل)</option>
                {ROLES_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Cards / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F9F6F0] text-[#2C3531] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">المستخدم</th>
                    <th className="p-3.5">الدور الحالي (Custom Claim)</th>
                    <th className="p-3.5">حالة الحساب</th>
                    <th className="p-3.5">البريد والهاتف</th>
                    <th className="p-3.5">تعديل الدور والصلاحية</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        لا توجد حسابات مطابقة لمعايير البحث.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleConfig = ROLES_LIST.find((r) => r.id === u.role) || ROLES_LIST[0];
                      const isUpdating = updatingUid === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#046A38]/10 text-[#046A38] font-bold flex items-center justify-center shrink-0">
                                {u.fullName ? u.fullName[0] : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{u.fullName}</div>
                                <div className="text-[10px] text-slate-400">UID: {u.id.slice(0, 10)}...</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleConfig.badgeColor}`}>
                              {roleConfig.label}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {u.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                نشط
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                معطل
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-600">
                            <div>{u.email}</div>
                            <div className="text-[11px] text-slate-400" dir="ltr">{u.phone || 'بدون هاتف'}</div>
                          </td>

                          <td className="p-3.5">
                            <select
                              value={u.role}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                              className="py-1 px-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-[#F9F6F0] cursor-pointer hover:border-[#046A38] disabled:opacity-50"
                            >
                              {ROLES_LIST.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleToggleStatus(u.id, u.isActive !== false)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                u.isActive !== false
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              } disabled:opacity-50`}
                            >
                              {u.isActive !== false ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY AUDIT LOGS */}
      {activeTab === 'security_logs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2C3531] flex items-center gap-2">
              <History className="w-4 h-4 text-[#046A38]" />
              <span>سجلات النشاط الأمني والتدقيق لجميع المستخدمين</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">سجلات غير قابلة للتعديل أو الحذف (Immutable)</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#F9F6F0] text-[#2C3531] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">الحدث الأمني</th>
                    <th className="p-3.5">المستخدم</th>
                    <th className="p-3.5">تفاصيل العملية</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        لا توجد سجلات أمنية حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    securityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {log.action}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {log.userEmail || log.userId}
                        </td>
                        <td className="p-3.5 text-slate-700 leading-relaxed font-medium">
                          {log.details || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]" dir="ltr">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('ar-SA') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC RULES & PERMISSIONS MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES_LIST.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${r.badgeColor}`}>
                    {r.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">role: {r.id}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {r.description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-[#046A38] font-bold space-y-1">
                  <div>✓ مصادقة Firebase مشفرة</div>
                  <div>✓ Custom Claims مفعلة على السيرفر</div>
                </div>
              </div>
            ))}
          </div>

          {/* Firestore Security Rules Summary */}
          <div className="bg-[#F9F6F0] p-5 rounded-2xl border-2 border-[#C5A059] space-y-3">
            <h3 className="font-bold text-sm text-[#046A38] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#046A38]" />
              <span>ضوابط الحماية المطبقة في Firestore Security Rules</span>
            </h3>
            <ul className="text-xs text-slate-700 space-y-2 leading-relaxed list-disc list-inside">
              <li><strong>حظر قراءة الطلاب:</strong> الطالب محظور تماماً من قراءة بيانات أو تسجيلات طالب آخر.</li>
              <li><strong>عزل المعلمين:</strong> المعلم لا يملك الوصول إلا إلى طلاب حلقاته المعتمدة فقط.</li>
              <li><strong>عزل أولياء الأمور:</strong> ولي الأمر مقيد برؤية بيانات أبنائه المسجلين فقط دون غيرهم.</li>
              <li><strong>منع تصعيد الصلاحيات:</strong> أي مستخدم عادي ممنوع كلياً من تعديل دوره أو تفعيل حسابه المعطل.</li>
              <li><strong>خصوصية التلاوات:</strong> التسجيلات الصوتية في <code>audio_submissions</code> خاصة بالطالب والمعلم المقيّم ومراجع الجودة فقط.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM DIAGNOSTICS & FIREBASE REAL CONNECTION */}
      {activeTab === 'system_diagnostics' && (
        <SystemDiagnosticsView />
      )}
    </div>
  );
};
