/**
 * StudentPointsMedalsCard.tsx
 * نظام النقاط والميداليات وشريط التقدم الأنيق في لوحة التحكم
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  Trophy, 
  Crown, 
  BookOpen, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Lock, 
  ChevronLeft, 
  Plus, 
  Check, 
  X, 
  ArrowRight,
  TrendingUp,
  Star
} from 'lucide-react';
import { 
  getStudentPointsProfile, 
  addStudentPoints, 
  StudentPointsProfile, 
  MedalItem, 
  STUDENT_RANKS 
} from '../../services/pointsMedalsService';

interface StudentPointsMedalsCardProps {
  studentId: string;
  studentName: string;
}

const COMMON_SURAHS = [
  { name: 'سورة الفاتحة', points: 150, category: 'short' },
  { name: 'سورة الإخلاص والمعوذتين', points: 150, category: 'short' },
  { name: 'سورة الكوثر والضحى والشرح', points: 150, category: 'short' },
  { name: 'سورة النبأ (عمّ)', points: 250, category: 'medium' },
  { name: 'سورة الملك (تبارك)', points: 300, category: 'medium' },
  { name: 'سورة الرحمن', points: 300, category: 'medium' },
  { name: 'سورة الواقعة', points: 300, category: 'medium' },
  { name: 'سورة يس', points: 350, category: 'medium' },
  { name: 'سورة الكهف', points: 400, category: 'long' },
  { name: 'سورة مريم', points: 400, category: 'long' },
  { name: 'سورة يوسف', points: 450, category: 'long' },
  { name: 'سورة آل عمران', points: 500, category: 'long' },
  { name: 'سورة البقرة', points: 600, category: 'long' },
];

export const StudentPointsMedalsCard: React.FC<StudentPointsMedalsCardProps> = ({
  studentId,
  studentName
}) => {
  const [profile, setProfile] = useState<StudentPointsProfile>(() => 
    getStudentPointsProfile(studentId, studentName)
  );

  const [isRecordSurahModalOpen, setIsRecordSurahModalOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(COMMON_SURAHS[4]); // سورة الملك default
  const [surahNotes, setSurahNotes] = useState('');
  const [isSubmittingSurah, setIsSubmittingSurah] = useState(false);
  const [celebrationToast, setCelebrationToast] = useState<{ message: string; points: number } | null>(null);

  const [isAllMedalsModalOpen, setIsAllMedalsModalOpen] = useState(false);
  const [selectedMedalDetail, setSelectedMedalDetail] = useState<MedalItem | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getStudentPointsProfile(studentId, studentName));
    };

    window.addEventListener('rehab_points_updated', handleUpdate);
    return () => window.removeEventListener('rehab_points_updated', handleUpdate);
  }, [studentId, studentName]);

  const handleRecordSurah = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSurah(true);

    const res = await addStudentPoints(studentId, studentName, {
      points: selectedSurah.points,
      title: `حفظ ${selectedSurah.name} بإتقان وتجويد`,
      type: 'surah_memorized',
      surahName: selectedSurah.name
    });

    setProfile(res.profile);
    setIsSubmittingSurah(false);
    setIsRecordSurahModalOpen(false);

    setCelebrationToast({
      message: `مبارك! تم تسجيل حفظ ${selectedSurah.name} وإضافة النقاط بنجاح`,
      points: selectedSurah.points
    });

    setTimeout(() => {
      setCelebrationToast(null);
    }, 4500);
  };

  const getMedalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-[#C5A059]" />;
      case 'Award': return <Award className="w-5 h-5 text-[#C5A059]" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-[#046A38]" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-[#046A38]" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-[#C5A059]" />;
      case 'Crown': return <Crown className="w-5 h-5 text-[#C5A059]" />;
      default: return <Award className="w-5 h-5 text-[#C5A059]" />;
    }
  };

  const unlockedMedalsCount = profile.medals.filter(m => m.isUnlocked).length;

  return (
    <div className="bg-white rounded-3xl border-2 border-[#C5A059]/40 shadow-sm overflow-hidden animate-fade-in text-right space-y-0" dir="rtl">
      
      {/* Celebration Toast */}
      {celebrationToast && (
        <div className="p-3.5 bg-gradient-to-r from-[#046A38] to-[#065A31] text-white flex items-center justify-between px-6 border-b border-[#C5A059] shadow-md animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <span className="font-bold text-xs sm:text-sm">{celebrationToast.message}</span>
          </div>
          <span className="px-3 py-1 bg-[#C5A059] text-white rounded-full font-black text-xs font-mono shadow-xs">
            +{celebrationToast.points} نقطة ✨
          </span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#046A38] via-[#055a30] to-[#046A38] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#C5A059] text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>نظام النقاط والميداليات القرآنية</span>
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                <span>{profile.streakDays} أيام التزام متواصل</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
              <span>إنجازاتك ورتبتك القرآنية</span>
            </h3>

            <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl font-sans">
              اكسب النقاط عند إتمام دروس التجويد وحفظ السور الكريمة، وارتقِ في مراتب الشرف بالمقرأة.
            </p>
          </div>

          {/* Points & Rank Badge */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="p-3.5 px-5 bg-black/30 border border-[#C5A059]/60 backdrop-blur-xs rounded-2xl text-center shadow-xs">
              <span className="text-[10px] text-emerald-200 font-bold block uppercase tracking-wider">
                رصيد النقاط الكلي
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#C5A059] font-mono block">
                {profile.totalPoints.toLocaleString()}
              </span>
              <span className="text-[10px] text-white/90 font-medium">نقطة تميز قرآنية</span>
            </div>

            <button
              type="button"
              onClick={() => setIsRecordSurahModalOpen(true)}
              className="px-4 py-3 bg-[#C5A059] hover:bg-[#b38d42] text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0 border border-amber-200"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>تسجيل سورة +نقاط</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* ======================================================== */}
        {/* 1. شريط التقدم الأنيق (Sleek Progression Bar)              */}
        {/* ======================================================== */}
        <div className="p-5 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/40 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#046A38] text-[#C5A059] flex items-center justify-center shrink-0 shadow-2xs border border-[#C5A059]">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">رتبتك القرآنية الحالية:</span>
                <h4 className="font-bold text-sm sm:text-base text-[#046A38] font-serif flex items-center gap-2">
                  <span>{profile.currentRank.title}</span>
                  <span className="text-xs bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-sans">
                    {profile.currentRank.badge}
                  </span>
                </h4>
              </div>
            </div>

            {profile.nextRank ? (
              <div className="text-right sm:text-left text-xs text-slate-600">
                <span className="text-[11px] text-slate-400 block font-bold">الرتبة القادمة:</span>
                <span className="font-bold text-slate-900 font-serif">{profile.nextRank.title}</span>
                <span className="text-xs font-mono text-[#046A38] mr-1">({profile.nextRank.minPoints} نقطة)</span>
              </div>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs">
                أعلى رتبة قرآنية معتمدة 👑
              </span>
            )}
          </div>

          {/* Sleek Gradient Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300/80 relative shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#046A38] via-[#057A40] to-[#C5A059] h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${profile.progressToNextRankPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
              <span className="font-mono font-bold text-[#046A38]">
                {profile.totalPoints} نقطة ({profile.progressToNextRankPercent}%)
              </span>
              {profile.nextRank && (
                <span className="text-[11px] text-slate-500 font-sans">
                  متبقي <strong>{profile.pointsToNextRank}</strong> نقطة للترقية التالية
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. معرض الميداليات والأوسمة (Medals Showcase)             */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#046A38]" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 font-serif">
                الميداليات والأوسمة المكتسبة ({unlockedMedalsCount} من {profile.medals.length})
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsAllMedalsModalOpen(true)}
              className="text-xs text-[#046A38] font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>عرض جميع الأوسمة شروطها ←</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {profile.medals.map((medal) => (
              <div
                key={medal.id}
                onClick={() => setSelectedMedalDetail(medal)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center space-y-2 hover:shadow-sm ${
                  medal.isUnlocked
                    ? 'bg-gradient-to-b from-[#F9F6F0] to-white border-[#C5A059]/60 shadow-2xs hover:border-[#C5A059]'
                    : 'bg-slate-50/70 border-slate-200 text-slate-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs border relative ${
                  medal.isUnlocked
                    ? 'bg-gradient-to-br from-amber-50 to-emerald-50 border-[#C5A059]'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  {medal.isUnlocked ? (
                    <>
                      {getMedalIcon(medal.icon)}
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                    </>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h5 className="font-bold text-xs text-slate-900 font-serif line-clamp-1">
                    {medal.title}
                  </h5>
                  <span className="text-[10px] font-mono text-[#046A38] font-bold block">
                    +{medal.pointsValue} نقطة
                  </span>
                </div>

                {medal.isUnlocked ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    <span>مكتسب</span>
                  </span>
                ) : (
                  <div className="w-full space-y-1">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#046A38] h-full rounded-full"
                        style={{ width: `${Math.round((medal.progressCurrent / medal.progressTarget) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      {medal.progressCurrent}/{medal.progressTarget}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. سجل النقاط الأخير وكيفية كسبها                        */}
        {/* ======================================================== */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#046A38]" />
              <h5 className="font-bold text-xs text-slate-800 font-serif">
                آخر النقاط القرآنية المكتسبة
              </h5>
            </div>
            <span className="text-[11px] text-slate-400">سجل التميز اليومي</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {profile.recentActivities.slice(0, 3).map((act) => (
              <div 
                key={act.id}
                className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs text-xs"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <span className="font-bold text-slate-800 line-clamp-1 block text-[11px]">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-[#046A38] border border-emerald-200 rounded-md font-bold font-mono text-xs shrink-0">
                  +{act.points}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. Modal: تسجيل حفظ سورة لكسب النقاط                       */}
      {/* ======================================================== */}
      {isRecordSurahModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#046A38] text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#046A38] font-serif">
                    تسجيل حفظ سورة جديدة
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    أضف السورة التي أتممت حفظها لكسب نقاط التميز
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRecordSurahModalOpen(false)}
                className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSurah} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اختر السورة الكريمة التي أتممت حفظها:
                </label>
                <select
                  value={selectedSurah.name}
                  onChange={(e) => {
                    const found = COMMON_SURAHS.find(s => s.name === e.target.value);
                    if (found) setSelectedSurah(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-[#046A38] cursor-pointer"
                >
                  {COMMON_SURAHS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} (+{s.points} نقطة)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                <span>المكافأة المكتسبة لهذه السورة:</span>
                <span className="font-black text-base text-[#046A38] font-mono">
                  +{selectedSurah.points} نقطة
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ملاحظة أو الرواية (اختياري):
                </label>
                <input
                  type="text"
                  value={surahNotes}
                  onChange={(e) => setSurahNotes(e.target.value)}
                  placeholder="مثال: تم التسميع برواية حفص عن عاصم..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#046A38]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordSurahModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSurah}
                  className="px-5 py-2 bg-[#046A38] hover:bg-[#03542c] text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 shadow-md border border-[#C5A059]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>تأكيد وكسب النقاط الآن</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Modal: تفاصيل الميدالية المحددة                         */}
      {/* ======================================================== */}
      {selectedMedalDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in text-center">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-md border ${
              selectedMedalDetail.isUnlocked
                ? 'bg-gradient-to-br from-amber-50 to-emerald-50 border-[#C5A059]'
                : 'bg-slate-100 border-slate-200'
            }`}>
              {getMedalIcon(selectedMedalDetail.icon)}
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-[#046A38] font-serif">
                {selectedMedalDetail.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {selectedMedalDetail.description}
              </p>
            </div>

            <div className="p-3 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/30 text-xs text-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">شرط نيل الوسام:</span>
              <p className="font-medium text-[#046A38]">{selectedMedalDetail.requirementText}</p>
            </div>

            <div className="flex items-center justify-between text-xs font-mono font-bold px-3">
              <span className="text-slate-500">مكافأة الوسام:</span>
              <span className="text-[#046A38]">+{selectedMedalDetail.pointsValue} نقطة</span>
            </div>

            {selectedMedalDetail.isUnlocked ? (
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم الحصول على هذا الوسام بتاريخ {selectedMedalDetail.unlockedAt}</span>
              </div>
            ) : (
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>التقدم الحالي: {selectedMedalDetail.progressCurrent} من {selectedMedalDetail.progressTarget}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedMedalDetail(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer mt-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Modal: استعراض جميع الأوسمة ورتب المقرأة                */}
      {/* ======================================================== */}
      {isAllMedalsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#C5A059] relative animate-fade-in max-h-[90vh] overflow-y-auto text-right">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-bold text-base text-[#046A38] font-serif">
                    دليل الأوسمة والرتب القرآنية في المقرأة
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    تعرّف على مستويات الترقية وشروط نيل كل وسام
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllMedalsModalOpen(false)}
                className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ranks list */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-800 font-serif">مراتب الشرف القرآنية الـ 5:</h5>
              <div className="space-y-1.5">
                {STUDENT_RANKS.map((rk) => {
                  const isCurrent = rk.tierNumber === profile.currentRank.tierNumber;
                  return (
                    <div 
                      key={rk.tierNumber}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isCurrent 
                          ? 'bg-[#F9F6F0] border-2 border-[#046A38] shadow-2xs' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#046A38]">#{rk.tierNumber}</span>
                        <div>
                          <span className="font-bold text-slate-900 block">{rk.title}</span>
                          <span className="text-[10px] text-slate-500">{rk.badge}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500">{rk.minPoints} - {rk.maxPoints} نقطة</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-[#046A38] text-white rounded-md font-bold text-[10px]">
                            رتبتك الحالية
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Close button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAllMedalsModalOpen(false)}
                className="px-5 py-2 bg-[#046A38] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                حسناً، فهمت
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
