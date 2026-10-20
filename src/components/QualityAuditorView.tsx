/**
 * بوابة مراجع الجودة والشيخ المجاز (Quality Auditor & Certified Sheikh)
 * مقرأة رحاب القرآن الإلكترونية
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Award, CheckCircle2, AlertTriangle, FileText, 
  Volume2, Search, ArrowRight, UserCheck, Eye, Star 
} from 'lucide-react';
import { AuthAccount, DailyRecitationRecord } from '../types';
import { getDailyRecitations } from '../data/evaluationStore';

interface QualityAuditorViewProps {
  currentAccount: AuthAccount;
  onLogout: () => void;
  onOpenQuranAudio?: () => void;
}

export const QualityAuditorView: React.FC<QualityAuditorViewProps> = ({
  currentAccount,
  onLogout,
  onOpenQuranAudio,
}) => {
  const [recitations, setRecitations] = useState<DailyRecitationRecord[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});
  const [auditStatus, setAuditStatus] = useState<Record<string, 'approved' | 'needs_review'>>({});

  useEffect(() => {
    setRecitations(getDailyRecitations());
  }, []);

  const handleAuditAction = (id: string, status: 'approved' | 'needs_review') => {
    setAuditStatus((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-sans text-right" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              📜
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                بوابة مراجع الجودة والشيخ المجاز
              </h1>
              <p className="text-[11px] text-rose-800 font-medium">
                المقرئ المعتمد: {currentAccount.name} • تدقيق وضبط جودة التلاوات والإقراء
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
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#173024] via-[#1c3f2f] to-[#173024] p-5 sm:p-6 rounded-3xl text-white border-2 border-[#C5A059] shadow-md space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold">
              صلاحية تدقيق ومراجعة عليا
            </span>
            <span className="text-xs text-[#C5A059] font-bold">
              قسم الإسناد وضبط الأداء
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
            مراجعة التلاوات ورصد الملاحظات الإقرائية
          </h2>
          <p className="text-xs text-emerald-100 leading-relaxed max-w-3xl">
            يتيح هذا القسم لمشايخ الإقراء ومراجعي الجودة الاستماع لتسجيلات الطلاب وتقييمات المعلمين، والتأكد من مطابقة التلاوات لرواية حفص عن عاصم من طريق الشاطبية وضوابط التجويد والأداء.
          </p>
        </div>

        {/* Recitations Table for Audit */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              <span>التلاوات المعروضة للتدقيق والمطابقة ({recitations.length})</span>
            </h3>
            <span className="text-xs text-slate-400">تدقيق عشوائي ودوري للحلقات</span>
          </div>

          <div className="space-y-3">
            {recitations.map((rec) => {
              const currentStatus = auditStatus[rec.id];

              return (
                <div key={rec.id} className="p-4 rounded-2xl bg-[#F9F6F0] border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        الطالب: {rec.studentName}
                      </span>
                      <span className="text-slate-500 text-xs mr-2">
                        • المعلم المقيّم: {rec.evaluatorTeacher}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                        درجة المعلم: {rec.score}% ({rec.grade})
                      </span>
                      {currentStatus === 'approved' && (
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          ✓ معتمد من الجودة
                        </span>
                      )}
                      {currentStatus === 'needs_review' && (
                        <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          ⚠️ يحتاج توجيه
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700">
                    <p className="font-medium">
                      المقطع: سورة <strong>{rec.surahName}</strong> (الآيات {rec.ayahStart} - {rec.ayahEnd})
                    </p>
                    {rec.teacherFeedback && (
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>ملاحظة المعلم:</strong> "{rec.teacherFeedback}"
                      </p>
                    )}
                  </div>

                  {/* Auditor Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="text-[11px] text-slate-400">
                      التاريخ: {rec.date}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAuditAction(rec.id, 'approved')}
                        className="px-3 py-1.5 rounded-xl bg-[#046A38] hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        ✓ اعتماد التقييم
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAuditAction(rec.id, 'needs_review')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
                      >
                        توجيه ملاحظة للشيخ
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
