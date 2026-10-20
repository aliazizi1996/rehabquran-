import React, { useState, useEffect } from "react";
import { 
  BookMarked, 
  Sparkles, 
  ChevronLeft, 
  Award, 
  CheckCircle2, 
  Lock, 
  Volume2, 
  Clock 
} from "lucide-react";
import { ScientificMatn, MatnStudentProgress } from "../../types/mutun";
import { fetchScientificMutun, getStudentMatnProgress } from "../../services/mutunService";
import { getDesignAndCommunicationSettings } from "../../services/designSettingsService";
import { DesignAndCommunicationSettings } from "../../types/designAndCommunication";

interface ScientificMutunCardProps {
  studentId: string;
  studentName?: string;
  halqaId?: string;
  teacherId?: string;
  onOpenStudyHub: (matnId?: string) => void;
}

export const ScientificMutunCard: React.FC<ScientificMutunCardProps> = ({
  studentId,
  studentName,
  halqaId,
  teacherId,
  onOpenStudyHub
}) => {
  const [mutun, setMutun] = useState<ScientificMatn[]>([]);
  const [selectedMatn, setSelectedMatn] = useState<ScientificMatn | null>(null);
  const [progress, setProgress] = useState<MatnStudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const list = await fetchScientificMutun();
        if (!isMounted) return;
        setMutun(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedMatn(first);
          const prog = await getStudentMatnProgress(studentId, first.id, studentName, halqaId, teacherId);
          if (isMounted) setProgress(prog);
        }
      } catch (err) {
        console.warn("[ScientificMutunCard] Load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [studentId, halqaId, teacherId, studentName]);

  const [designSettings, setDesignSettings] = useState<DesignAndCommunicationSettings>(() => getDesignAndCommunicationSettings());

  useEffect(() => {
    const handleDesignUpdate = (e: any) => {
      if (e.detail) setDesignSettings(e.detail);
      else setDesignSettings(getDesignAndCommunicationSettings());
    };
    window.addEventListener('rehab_design_settings_updated', handleDesignUpdate);
    return () => window.removeEventListener('rehab_design_settings_updated', handleDesignUpdate);
  }, []);

  const currentGroupNumber = progress?.currentGroupNumber || 1;
  const currentGroup = selectedMatn?.groups.find(g => g.groupNumber === currentGroupNumber) || selectedMatn?.groups[0];
  const percentage = progress?.percentageCompleted || 0;
  const isApproved = progress?.groupProgress[currentGroup?.id || ""]?.isTeacherApproved || false;

  return (
    <div className="bg-gradient-to-br from-white via-[#F9F6F0]/60 to-white rounded-3xl p-5 border-2 border-[#C5A059]/40 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group">
      {/* خلفية جمالية مائية خفيفة */}
      <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-[#046A38]/5 rounded-full blur-2xl pointer-events-none" />

      {/* الرأس: العنوان والشارة */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center shrink-0 border border-[#046A38]/20 group-hover:scale-105 transition-transform">
              <BookMarked className="w-5 h-5 text-[#046A38]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold font-serif text-[#046A38] truncate flex items-center gap-1.5">
                <span>متوني العلمية</span>
                <span className="text-[10px] font-sans font-bold bg-[#C5A059]/20 text-[#046A38] px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                  تجويد
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans truncate">
                {selectedMatn ? selectedMatn.title : "تحفة الأطفال والجزرية"}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold font-mono text-[#046A38] bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
            {percentage}%
          </span>
        </div>

        {/* شريط التقدم الدقيق */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden border border-slate-200/60">
          <div 
            className="bg-gradient-to-r from-[#046A38] to-[#C5A059] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>

        {/* بطاقة مهمة اليوم التفاعلية */}
        <div className="bg-white p-3 rounded-2xl border border-[#C5A059]/30 shadow-2xs space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>مهمة اليوم: المجموعة {currentGroupNumber}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              الأبيات ({currentGroup?.fromVerse} - {currentGroup?.toVerse})
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-1 font-serif pr-1 border-r-2 border-[#046A38]">
            {currentGroup?.title || "المقدمة والتعريف بالمتن"}
          </p>

          {/* مقتطف الشرح الإجمالي للأبيات إذا كان مفعّلاً في الإعدادات */}
          {designSettings.curriculumDisplay.mutunShowExplanationExcerpt && currentGroup?.explanationSummary && (
            <p className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100 font-medium">
              💡 {currentGroup.explanationSummary}
            </p>
          )}

          {/* شارة أو مؤشر الاختبار الأسبوعي إذا كان مفعّلاً ومستحقاً */}
          {designSettings.curriculumDisplay.weeklyExamsDisplay === 'badge' && (
            <div className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
              designSettings.curriculumDisplay.highlightPendingExams
                ? 'bg-amber-50 text-amber-900 border border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            }`}>
              <span className="flex items-center gap-1">
                <span>✏️</span>
                <span>اختبار قياس الاستيعاب الأسبوعي</span>
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                متاح الآن
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100">
            <div className="flex items-center gap-1">
              {isApproved ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  معتمد من الشيخ
                </span>
              ) : (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  بانتظار التسميع والاعتماد
                </span>
              )}
            </div>
            {designSettings.curriculumDisplay.mutunShowVersesCount && (
              <span className="text-slate-400 text-[10px]">
                {selectedMatn ? `${selectedMatn.totalVerses} بيتاً` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* زر المتابعة والانتقال لمركز المدارسة */}
      <button
        onClick={() => onOpenStudyHub(selectedMatn?.id)}
        className="w-full py-2.5 px-4 rounded-xl bg-[#046A38] hover:bg-[#03542c] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 border border-[#C5A059] cursor-pointer group-hover:shadow-md active:scale-98"
      >
        <span>متابعة التعلم والحفظ</span>
        <ChevronLeft className="w-4 h-4 text-[#C5A059] group-hover:-translate-x-1 transition-transform" />
      </button>
    </div>
  );
};