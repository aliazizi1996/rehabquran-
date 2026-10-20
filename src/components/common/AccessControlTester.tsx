/**
 * مكون اختبارات الوصول ومصفوفة الصلاحيات (RBAC Access Matrix Tester)
 * يتحقق برمجياً من الحالات السبعة الإلزامية:
 * 1. زائر يفتح /student → تحويل إلى /login
 * 2. طالب يفتح /student → السماح
 * 3. طالب يفتح /teacher → منع (403)
 * 4. طالب يفتح /admin → منع (403)
 * 5. معلم يفتح /teacher → السماح
 * 6. معلم يفتح /admin → منع (403)
 * 7. مدير يفتح /admin → السماح
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Play, RefreshCw, Lock } from 'lucide-react';

interface TestCase {
  id: string;
  role: 'guest' | 'student' | 'teacher' | 'admin';
  targetPath: string;
  expectedAction: 'redirect_to_login' | 'allow' | 'forbidden_403';
  description: string;
  result?: {
    passed: boolean;
    status: number;
    action: string;
    message: string;
  };
}

export const AccessControlTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: 'tc-1',
      role: 'guest',
      targetPath: '/student',
      expectedAction: 'redirect_to_login',
      description: 'زائر يفتح /student → تحويل تلقائي إلى /login'
    },
    {
      id: 'tc-2',
      role: 'student',
      targetPath: '/student',
      expectedAction: 'allow',
      description: 'طالب يفتح /student → السماح بالوصول الكامل'
    },
    {
      id: 'tc-3',
      role: 'student',
      targetPath: '/teacher',
      expectedAction: 'forbidden_403',
      description: 'طالب يفتح /teacher → منع وصول 403 أو تحويل إلى /student'
    },
    {
      id: 'tc-4',
      role: 'student',
      targetPath: '/admin',
      expectedAction: 'forbidden_403',
      description: 'طالب يفتح /admin → منع وصول 403 وحظر الدخول'
    },
    {
      id: 'tc-5',
      role: 'teacher',
      targetPath: '/teacher',
      expectedAction: 'allow',
      description: 'معلم يفتح /teacher → السماح بالوصول الكامل'
    },
    {
      id: 'tc-6',
      role: 'teacher',
      targetPath: '/admin',
      expectedAction: 'forbidden_403',
      description: 'معلم يفتح /admin → منع وصول 403 وحظر الدخول'
    },
    {
      id: 'tc-7',
      role: 'admin',
      targetPath: '/admin',
      expectedAction: 'allow',
      description: 'مدير يفتح /admin → السماح بالوصول الكامل'
    }
  ]);

  const runAllTests = async () => {
    setIsRunning(true);
    const updated = [...testCases];

    for (let i = 0; i < updated.length; i++) {
      const tc = updated[i];
      try {
        const res = await fetch('/api/auth/test-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: tc.role, targetPath: tc.targetPath })
        });
        const data = await res.json();
        const action = data.action || (res.status === 200 ? 'allow' : res.status === 401 ? 'redirect_to_login' : 'forbidden_403');
        const passed = action === tc.expectedAction;

        tc.result = {
          passed,
          status: res.status,
          action,
          message: data.message || (passed ? 'اجتياز الفحص الأمني' : 'فشل الفحص')
        };
      } catch (err: any) {
        tc.result = {
          passed: false,
          status: 500,
          action: 'network_error',
          message: err.message || 'خطأ اتصال'
        };
      }
      setTestCases([...updated]);
    }
    setIsRunning(false);
  };

  const allPassed = testCases.every((t) => t.result?.passed);
  const executedCount = testCases.filter((t) => t.result).length;

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-[#C5A059]/40 shadow-sm space-y-5 text-right font-sans" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-[#046A38] border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold font-serif text-[#046A38]">
              اختبارات الحماية وتصاريح الوصول (RBAC Guard Suite)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            فحص أمني دقيق للتأكد من حظر المسارات المحمية ومنع تسريب بيانات الطلاب للزوار أو تبديل الأدوار
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="px-4 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-2 shrink-0 border border-[#C5A059]"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الفحص على الخادم...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>تشغيل الاختبارات الـ 7 الآن</span>
            </>
          )}
        </button>
      </div>

      {executedCount > 0 && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          allPassed ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {allPassed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>جميع اختبارات الوصول الـ 7 نجحت واعتُمدت بالكامل وفق القواعد الصارمة!</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>يوجد فحص لم يجتز المعيار المتوقع، يرجى مراجعة إعدادات التوجيه.</span>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {testCases.map((tc, index) => (
          <div
            key={tc.id}
            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded">
                  فحص {index + 1}
                </span>
                <span className="font-bold text-slate-900">{tc.description}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span>الدور: <strong>{tc.role}</strong></span>
                <span>•</span>
                <span>المسار: <strong className="font-mono">{tc.targetPath}</strong></span>
                <span>•</span>
                <span>الإجراء المتوقع: <strong>{tc.expectedAction}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {tc.result ? (
                tc.result.passed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ناجح ({tc.result.status})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 rounded-xl font-bold text-xs border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-700" />
                    <span>فشل ({tc.result.status})</span>
                  </span>
                )
              ) : (
                <span className="text-slate-400 text-[11px] bg-slate-100 px-3 py-1 rounded-xl">
                  في انتظار التشغيل
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
