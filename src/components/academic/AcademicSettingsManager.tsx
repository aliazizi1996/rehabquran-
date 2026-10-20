/**
 * واجهة إعدادات الإدارة الأكاديمية (Academic Admin Settings)
 * تتيح لمدير النظام والمشرف الأكاديمي:
 * 1. اختيار الرواية القرآنية المعتمدة (حفص، ورش، قالون، الدوري، السوسي، شعبة، إلخ)
 * 2. اختيار وضبط المناهج التعليمية المعتمدة (مكثف، منتظم، تثبيت، إجازات)
 * 3. ضبط معايير الإتقان وحسم الدرجات للأخطاء الستة
 * 4. إدارة ضوابط الذكاء الاصطناعي الاسترشادي والاعتماد البشري الإلزامي
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, BookOpen, Check, Save, RotateCcw, 
  ShieldCheck, AlertTriangle, Sparkles, CheckCircle2 
} from 'lucide-react';
import { 
  ACADEMIC_RIWAYAHS, 
  ACADEMIC_CURRICULA, 
  QURAN_ERROR_CATEGORIES 
} from '../../data/quranAcademicData';
import { 
  AcademicSettingsConfig, 
  DEFAULT_ACADEMIC_SETTINGS, 
  fetchAcademicSettings, 
  saveAcademicSettings, 
  AI_ADVISORY_DISCLAIMER 
} from '../../services/academicService';
import { AuthAccount } from '../../types';

interface AcademicSettingsManagerProps {
  currentAccount: AuthAccount;
  onSettingsSaved?: () => void;
}

export const AcademicSettingsManager: React.FC<AcademicSettingsManagerProps> = ({
  currentAccount,
  onSettingsSaved
}) => {
  const [config, setConfig] = useState<AcademicSettingsConfig>(DEFAULT_ACADEMIC_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const data = await fetchAcademicSettings();
    setConfig(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const res = await saveAcademicSettings(config);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'تم حفظ وتعميم الإعدادات الأكاديمية بنجاح في قاعدة البيانات السحابية!' });
      if (onSettingsSaved) onSettingsSaved();
    } else {
      setFeedback({ type: 'error', message: 'حدث خطأ أثناء حفظ الإعدادات' });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C5A059] text-slate-950 font-sans">
              إعدادات الإدارة الأكاديمية
            </span>
            <span className="text-xs text-[#046A38] font-bold">صلاحيات المشرف العام</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-serif text-[#046A38] mt-1">
            تهيئة الروايات والمناهج والضوابط الشرعية للمقرأة
          </h3>
        </div>

        <button
          onClick={loadSettings}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
          title="إعادة تحميل الإعدادات"
        >
          <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-rose-50 text-rose-900 border border-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Riwayah Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-900 block font-serif">
            1. اختيار الرواية القرآنية الافتراضية للمقرأة:
          </label>
          <p className="text-slate-500 text-[11px]">
            تُعتمد هذه الرواية كخيار أولي عند تسجيل الطلاب الجدد وإنشاء خطط الحفظ، مع إمكانية تخصيص روايات أخرى لكل طالب.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ACADEMIC_RIWAYAHS.map((r) => {
              const isSelected = config.defaultRiwayah === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setConfig({ ...config, defaultRiwayah: r.id })}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#046A38] bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-[#C5A059] bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className={`font-bold ${isSelected ? 'text-[#046A38]' : 'text-slate-800'}`}>
                        {r.name}
                      </strong>
                      {isSelected && <Check className="w-4 h-4 text-[#046A38]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{r.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block font-serif">{r.reader}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Curriculum Selection */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 block font-serif">
            2. اختيار وتعيين المنهج التعليمي الافتراضي:
          </label>
          <p className="text-slate-500 text-[11px]">
            يحدد وتيرة الحفظ اليومية والمقدار الأسبوعي ومدة الختمة المتوقعة.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACADEMIC_CURRICULA.map((c) => {
              const isSelected = config.defaultCurriculum === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setConfig({ ...config, defaultCurriculum: c.id })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'border-[#C5A059] bg-amber-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-[#046A38] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className={`font-bold ${isSelected ? 'text-[#046A38]' : 'text-slate-800'}`}>
                      {c.title}
                    </strong>
                    {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{c.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>المعدل اليومي: <strong>{c.targetDailyPace}</strong></span>
                    <span>المدة: <strong>{c.durationMonths} شهر</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Academic Policy & Islamic Guidelines (الضوابط الشرعية والأكاديمية) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 block font-serif">
            3. الضوابط الشرعية والإسنادية لاعتماد التقييمات:
          </label>

          <div className="space-y-3">
            {/* Condition 13: Mandatory Human Teacher Approval */}
            <div className="p-4 rounded-2xl bg-[#F9F6F0] border-2 border-[#C5A059] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#046A38]" />
                  <strong className="text-slate-900 font-bold">
                    إلزامية اعتماد المعلم البشري المجاز (مادة 13):
                  </strong>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#046A38] text-white">
                  مفعل دائم (شرط إسنادي)
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                يُمنع منعاً باتاً إصدار أي حكم شرعي أو تصحيح نهائي آلي أو اعتماد درجة إتقان دون سماع وتوقيع المعلم البشري المختص المجاز بالسند المتصل صوناً لكتاب الله العزيز من التحريف واللحن.
              </p>
            </div>

            {/* Condition 14: AI Advisory Assistant Toggle */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C5A059]" />
                  <strong className="text-slate-900 font-bold">
                    السماح بمساعد التجويد الاسترشادي الذكي (Gemini):
                  </strong>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allowAiAdvisoryNotes}
                    onChange={(e) => setConfig({ ...config, allowAiAdvisoryNotes: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#046A38]"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                يقدم نصائح استرشادية حول مخارج الحروف الشائعة وتذكير بأحكام التجويد للآيات مع التثبيت الإلزامي للتنبيه الشرعي:
              </p>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[10px] text-amber-950 font-medium">
                {AI_ADVISORY_DISCLAIMER}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Save Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer border border-[#C5A059] flex items-center gap-2 transition-all"
          >
            {isSaving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ واعتماد الإعدادات الأكاديمية</span>
          </button>
        </div>
      </form>
    </div>
  );
};
