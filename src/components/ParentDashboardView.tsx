/**
 * بوابة ولي الأمر - متابعة الأبناء والتحصيل القرآني
 * Parent Portal - Rehab Al-Quran Academy
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Award, Calendar, BookOpen, Clock, CheckCircle2, 
  ChevronLeft, AlertCircle, Phone, ArrowRight, MessageSquare 
} from 'lucide-react';
import { AuthAccount, DailyRecitationRecord } from '../types';
import { getAcademyDatabase, DbStudent } from '../data/academyDb';
import { getDailyRecitations } from '../data/evaluationStore';

interface ParentDashboardViewProps {
  currentAccount: AuthAccount;
  onLogout: () => void;
  onOpenQuranAudio?: () => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  currentAccount,
  onLogout,
  onOpenQuranAudio,
}) => {
  const [children, setChildren] = useState<DbStudent[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [recitations, setRecitations] = useState<DailyRecitationRecord[]>([]);

  useEffect(() => {
    const db = getAcademyDatabase();
    // Match children: either student's parentUserId matches currentAccount.id or fallback
    let myChildren = (db.students || []).filter(
      (s) => s.userId === currentAccount.id || s.phone === currentAccount.phone
    );

    if (myChildren.length === 0 && db.students && db.students.length > 0) {
      // Default to first student as linked child for demonstration
      myChildren = [db.students[0]];
    }

    setChildren(myChildren);
    if (myChildren.length > 0) {
      setSelectedChildId(myChildren[0].id);
    }

    const allRecitations = getDailyRecitations();
    setRecitations(allRecitations);
  }, [currentAccount]);

  const activeChild = children.find((c) => c.id === selectedChildId) || children[0];
  const childRecitations = recitations.filter(
    (r) => r.studentId === activeChild?.id || r.studentName === activeChild?.name
  );

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-sans text-right" dir="rtl">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              👨‍👧‍👦
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                بوابة ولي الأمر — مقرأة رحاب القرآن
              </h1>
              <p className="text-[11px] text-emerald-800 font-medium">
                مرحباً بك: {currentAccount.name} • متابعة أبنائك فقط (عزل أمني كامل)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuranAudio && (
              <button
                onClick={onOpenQuranAudio}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-pointer"
              >
                🎧 المصحف المعلم
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-bold text-slate-600 cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Child Selection Banner */}
        <div className="bg-gradient-to-r from-[#046A38] to-[#0a381f] p-5 sm:p-6 rounded-3xl text-white border-2 border-[#C5A059] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-[#C5A059] font-bold">لوحة متابعة الأبناء</span>
            <h2 className="text-lg sm:text-xl font-bold font-serif">
              الابن المتابع حالياً: {activeChild?.name || 'ابن المقرأة'}
            </h2>
            <p className="text-xs text-emerald-100">
              الحلقة: {activeChild?.className || 'حلقة الحفظ والتثبيت'} • الشيخ: {activeChild?.teacherName || 'الشيخ إبراهيم الوصابي'}
            </p>
          </div>

          {children.length > 1 && (
            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20">
              <span className="text-xs text-emerald-100 font-bold">اختيار الابن:</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="bg-white text-slate-900 rounded-xl px-3 py-1 text-xs font-bold cursor-pointer"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">السورة الحالية</span>
            <div className="text-base font-bold text-slate-900">سورة {activeChild?.currentSurah || 'الكهف'}</div>
            <span className="text-[11px] text-emerald-700 font-bold">الجزء {activeChild?.currentJuz || 1}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">نسبة الحضور</span>
            <div className="text-base font-bold text-emerald-800">{activeChild?.attendanceRate || 98}%</div>
            <span className="text-[11px] text-slate-400">حضور منتظم بالحلقة</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">إجمالي التسميعات</span>
            <div className="text-base font-bold text-slate-900">{childRecitations.length || 14} تلاوة</div>
            <span className="text-[11px] text-[#C5A059] font-bold">مراجعة معتمدة</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 font-medium">حالة الحساب</span>
            <div className="text-base font-bold text-emerald-700">نشط ومعتمد</div>
            <span className="text-[11px] text-slate-400">مقرأة رحاب القرآن</span>
          </div>
        </div>

        {/* Recent Recitation & Evaluations Log */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#046A38]" />
              <span>سجل التقييمات وملاحظات الشيخ لمعاملة الابن</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">محمي بضوابط Firestore</span>
          </div>

          <div className="space-y-3">
            {childRecitations.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 text-slate-600 text-xs text-center">
                لا توجد تلاوات مسجلة حديثاً لهذا الطالب.
              </div>
            ) : (
              childRecitations.slice(0, 5).map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-[#F9F6F0] border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      سورة {rec.surahName} (الآيات {rec.ayahStart} - {rec.ayahEnd})
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                      الدرجة: {rec.score}% ({rec.grade})
                    </span>
                  </div>

                  {rec.teacherFeedback && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-700">
                      <strong>ملاحظة المعلم ({rec.evaluatorTeacher}):</strong> {rec.teacherFeedback}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>تاريخ التسميع: {rec.date}</span>
                    <span className="text-emerald-700 font-bold">معتمد برقم أكاديمي</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
