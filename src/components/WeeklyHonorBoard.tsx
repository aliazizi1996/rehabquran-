import React, { useState, useMemo, useRef } from 'react';
import { 
  Trophy, Award, Crown, Sparkles, Star, Mic, 
  Calendar, CheckCircle2, ChevronLeft, ChevronRight, 
  Flame, UserCheck, Heart, Medal, ExternalLink, ArrowRight
} from 'lucide-react';

export interface HonorCategoryStudent {
  id: string;
  name: string;
  avatarText?: string;
  section: 'male' | 'female';
  category: 'regular' | 'reciter' | 'excellent';
  statDisplay: string;
  secondaryStat?: string;
  rank: 1 | 2 | 3 | number;
  score?: number;
  surah?: string;
  badge: string;
}

interface WeeklyHonorBoardProps {
  currentStudentId?: string;
  onViewAll?: () => void;
  className?: string;
  compact?: boolean;
}

export const WeeklyHonorBoard: React.FC<WeeklyHonorBoardProps> = ({
  currentStudentId,
  onViewAll,
  className = '',
  compact = false,
}) => {
  // حساب تاريخ الأسبوع الحالي (من السبت إلى الجمعة)
  const currentWeekRange = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
    // في التقويم الإسلامي/العربي الأسبوع يبدأ السبت
    const diffToSaturday = (currentDay + 1) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() - diffToSaturday);

    const friday = new Date(saturday);
    friday.setDate(saturday.getDate() + 6);

    const formatDay = (d: Date) => `${d.getDate()} / ${d.getMonth() + 1}`;
    return `من السبت ${formatDay(saturday)} إلى الجمعة ${formatDay(friday)} ${saturday.getFullYear()} م`;
  }, []);

  const [activeCategory, setActiveCategory] = useState<'all' | 'regular' | 'reciter' | 'excellent'>('all');
  const [showFullListModal, setShowFullListModal] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // قائمة الطلاب المتميزين (Mock Data منظمة ومطابقة للمتطلبات)
  const regularStudents: HonorCategoryStudent[] = [
    {
      id: 'usr-s1',
      name: 'عبدالرحمن باجعفر',
      avatarText: 'ع',
      section: 'male',
      category: 'regular',
      statDisplay: '7 / 7 أيام حضور كامل',
      secondaryStat: 'نسبة الحضور 100%',
      rank: 1,
      badge: 'الالتزام التام 🥇'
    },
    {
      id: 'usr-s3',
      name: 'عمر المختار اليماني',
      avatarText: 'ع',
      section: 'male',
      category: 'regular',
      statDisplay: '7 / 7 أيام حضور كامل',
      secondaryStat: 'حضور مبكر في حلقة الفجر',
      rank: 2,
      badge: 'فارس الفجر 🥈'
    },
    {
      id: 'usr-s2',
      name: 'فاطمة الزهراء الشامي',
      avatarText: 'ف',
      section: 'female',
      category: 'regular',
      statDisplay: '6 / 7 أيام حضور',
      secondaryStat: 'انضباط واجتهاد متواصل',
      rank: 3,
      badge: 'همّة قرآنية 🥉'
    },
    {
      id: 'usr-s7',
      name: 'خالد بن وليد الحضرمي',
      avatarText: 'خ',
      section: 'male',
      category: 'regular',
      statDisplay: '6 / 7 أيام حضور',
      secondaryStat: 'حلقة تصحيح التلاوة',
      rank: 4,
      badge: 'مواظب متميز'
    }
  ];

  const mostReciterStudents: HonorCategoryStudent[] = [
    {
      id: 'usr-s4',
      name: 'إبراهيم حسن الكندي',
      avatarText: 'إ',
      section: 'male',
      category: 'reciter',
      statDisplay: '18 تسميعاً وتسجيلاً',
      secondaryStat: 'سرد سورة الكهف ومريم',
      rank: 1,
      badge: 'بلبل المقرأة 🎙️'
    },
    {
      id: 'usr-s1',
      name: 'عبدالرحمن باجعفر',
      avatarText: 'ع',
      section: 'male',
      category: 'reciter',
      statDisplay: '15 تسميعاً صوتياً',
      secondaryStat: 'تسميع ربعين يومياً',
      rank: 2,
      badge: 'سرد متقن 🥈'
    },
    {
      id: 'usr-s5',
      name: 'مريم أحمد باعباد',
      avatarText: 'م',
      section: 'female',
      category: 'reciter',
      statDisplay: '14 تسميعاً صوتياً',
      secondaryStat: 'إتقان مخارج الحروف',
      rank: 3,
      badge: 'ترتيل عذب 🥉'
    },
    {
      id: 'usr-s8',
      name: 'يوسف عبد الكريم الصنعاني',
      avatarText: 'ي',
      section: 'male',
      category: 'reciter',
      statDisplay: '11 تسميعاً صوتياً',
      secondaryStat: 'مراجعة جزء عم كاملاً',
      rank: 4,
      badge: 'تسجيل متواصل'
    }
  ];

  const topScorerStudents: HonorCategoryStudent[] = [
    {
      id: 'usr-s2',
      name: 'فاطمة الزهراء الشامي',
      avatarText: 'ف',
      section: 'female',
      category: 'excellent',
      statDisplay: 'تقييم 99.4% (ممتاز مرتفع)',
      secondaryStat: 'إتقان تام لأحكام المدود والغنن',
      rank: 1,
      badge: 'تاج الإتقان ⭐'
    },
    {
      id: 'usr-s6',
      name: 'محمد الصادق العولقي',
      avatarText: 'م',
      section: 'male',
      category: 'excellent',
      statDisplay: 'تقييم 98.8% (ممتاز مرتفع)',
      secondaryStat: 'صفاء المخارج وجودة الوقف',
      rank: 2,
      badge: 'إتقان وتجويد 🥈'
    },
    {
      id: 'usr-s1',
      name: 'عبدالرحمن باجعفر',
      avatarText: 'ع',
      section: 'male',
      category: 'excellent',
      statDisplay: 'تقييم 98.0% (ممتاز)',
      secondaryStat: 'حفظ راسخ بالسند المتصل',
      rank: 3,
      badge: 'حفظ متين 🥉'
    },
    {
      id: 'usr-s9',
      name: 'زينب سعيد المعلمي',
      avatarText: 'ز',
      section: 'female',
      category: 'excellent',
      statDisplay: 'تقييم 97.2% (ممتاز)',
      secondaryStat: 'تسميع سورة الرحمن',
      rank: 4,
      badge: 'تميز تجويدي'
    }
  ];

  // التحقق من مركز الطالب الحالي إذا وُجد
  const currentStudentRanks = useMemo(() => {
    if (!currentStudentId) return null;
    const regRank = regularStudents.find(s => s.id === currentStudentId);
    const recRank = mostReciterStudents.find(s => s.id === currentStudentId);
    const topRank = topScorerStudents.find(s => s.id === currentStudentId);
    return { regRank, recRank, topRank };
  }, [currentStudentId]);

  // قائمة الطلاب المصفاة بحسب الفئة لعرض الشريط الأفقي القابل للسحب
  const displayedStudents = useMemo(() => {
    let list: Array<HonorCategoryStudent & { catName: string; catIcon: string; catBg: string }> = [];
    
    if (activeCategory === 'all' || activeCategory === 'regular') {
      list = list.concat(
        regularStudents.map(s => ({
          ...s,
          catName: 'فئة الطالب المنتظم',
          catIcon: '🥇',
          catBg: 'bg-emerald-50 text-[#046A38] border-emerald-200'
        }))
      );
    }
    if (activeCategory === 'all' || activeCategory === 'reciter') {
      list = list.concat(
        mostReciterStudents.map(s => ({
          ...s,
          catName: 'فئة الأكثر تسميعاً',
          catIcon: '🎙️',
          catBg: 'bg-amber-50 text-amber-900 border-amber-200'
        }))
      );
    }
    if (activeCategory === 'all' || activeCategory === 'excellent') {
      list = list.concat(
        topScorerStudents.map(s => ({
          ...s,
          catName: 'فئة التميز والإتقان',
          catIcon: '⭐',
          catBg: 'bg-teal-50 text-teal-900 border-teal-200'
        }))
      );
    }

    // Sort so top ranks appear nicely
    return list;
  }, [activeCategory]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. البطاقة الإطارية الرئيسية بتصميم إسلامي ملكي أخضر وذهبي */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#046A38] via-[#05572e] to-[#034424] p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-xl">
        
        {/* خلفية وزخرفة إسلامية خفيفة */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#C5A059]/20 to-transparent pointer-events-none rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-radial from-emerald-400/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        {/* ترويسة لوحة الشرف */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C5A059]/20 border border-[#C5A059]/60 rounded-full text-xs font-bold text-amber-200 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>مكافأة وتكريم أهل القرآن</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
              <span>🌟 لوحة الشرف الأسبوعية 🌟</span>
            </h2>
            <p className="text-xs text-emerald-100/90 font-mono">
              الأسبوع الجاري: <strong className="text-amber-200">{currentWeekRange}</strong> (يتم التحديث التلقائي فجر كل سبت)
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowFullListModal(true)}
              className="px-4 py-2 bg-[#C5A059] hover:bg-[#b58f47] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-white/20"
            >
              <Trophy className="w-4 h-4" />
              <span>عرض القائمة الكاملة</span>
            </button>
          </div>
        </div>

        {/* 2. بطاقة الطالب الشخصية إذا وُجد في لوحة الطالب */}
        {currentStudentRanks && (
          <div className="relative z-10 mt-5 p-4 rounded-2xl bg-white/10 border border-[#C5A059]/50 backdrop-blur-xs text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#C5A059]" />
                <span>موقعك في لوحة الشرف لهذا الأسبوع:</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-200">تحديث فوري</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between">
                <span>🥇 الانضباط الأسبوعي:</span>
                <strong className="text-amber-300 font-mono">
                  {currentStudentRanks.regRank ? `المركز #${currentStudentRanks.regRank.rank}` : 'ضمن أول 10 طلاب'}
                </strong>
              </div>
              <div className="p-2.5 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between">
                <span>🎙️ عدد التسميعات:</span>
                <strong className="text-amber-300 font-mono">
                  {currentStudentRanks.recRank ? `المركز #${currentStudentRanks.recRank.rank}` : '10 تسميعات (نشط)'}
                </strong>
              </div>
              <div className="p-2.5 bg-black/20 rounded-xl border border-white/10 flex items-center justify-between">
                <span>⭐ تقييم الإتقان:</span>
                <strong className="text-amber-300 font-mono">
                  {currentStudentRanks.topRank ? `المركز #${currentStudentRanks.topRank.rank}` : '98% (ممتاز)'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* 3. شريط لوحة الشرف الأفقي التفاعلي القابل للسحب (Horizontal Scrollable Ribbon) */}
        <div className="relative z-10 mt-6 space-y-4">
          {/* شريط التحكم: تصفية الفئات وأزرار السحب يميناً ويساراً */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
            {/* أزرار الفئات السريعة */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                جميع فرسان الأسبوع
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('regular')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'regular'
                    ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>🥇</span>
                <span>المنتظمون</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('reciter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'reciter'
                    ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>🎙️</span>
                <span>الأكثر تسميعاً</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('excellent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'excellent'
                    ? 'bg-[#C5A059] text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>⭐</span>
                <span>المتميزون</span>
              </button>
            </div>

            {/* أدوات السحب السريع بالأسهم وتلميح الإيماءات */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              <span className="text-[11px] text-emerald-200/90 hidden md:inline-flex items-center gap-1 font-sans">
                <span>اسحب أفقياً</span>
                <span className="font-mono text-amber-300">⟷</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={scrollRight}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
                  title="سحب لليمين"
                  aria-label="سحب لليمين"
                >
                  <ChevronRight className="w-4 h-4 text-amber-200" />
                </button>
                <button
                  type="button"
                  onClick={scrollLeft}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
                  title="سحب لليسار"
                  aria-label="سحب لليسار"
                >
                  <ChevronLeft className="w-4 h-4 text-amber-200" />
                </button>
              </div>
            </div>
          </div>

          {/* شريط بطاقات الطلاب الأفقي القابل للسحب (Touch & Drag Ribbon) */}
          <div 
            ref={scrollContainerRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-amber-300/40 scrollbar-track-transparent focus:outline-none"
            style={{ scrollbarWidth: 'thin' }}
            tabIndex={0}
            role="region"
            aria-label="شريط لوحة الشرف القابل للسحب أفقياً"
          >
            {displayedStudents.map((student, idx) => {
              const isFirst = student.rank === 1;
              const isSecond = student.rank === 2;
              const isThird = student.rank === 3;
              const isMe = currentStudentId && student.id === currentStudentId;

              return (
                <div
                  key={`${student.id}-${student.category}-${idx}`}
                  className={`snap-start shrink-0 w-[260px] sm:w-[280px] rounded-3xl p-4.5 bg-white text-slate-800 border-2 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between relative group ${
                    isFirst 
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 bg-gradient-to-b from-amber-50/50 to-white' 
                      : isSecond
                      ? 'border-slate-300 bg-white'
                      : isThird
                      ? 'border-amber-700/40 bg-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* شارة التميز العلوية والمركز */}
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${student.catBg}`}>
                        {student.catIcon} {student.catName}
                      </span>

                      <div className="flex items-center gap-1">
                        {isMe && (
                          <span className="text-[10px] font-bold bg-[#046A38] text-white px-2 py-0.5 rounded-full">
                            أنت
                          </span>
                        )}
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shadow-xs ${
                          isFirst ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300' :
                          isSecond ? 'bg-slate-200 text-slate-800' :
                          isThird ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{student.rank}
                        </span>
                      </div>
                    </div>

                    {/* معلومات الطالب */}
                    <div className="flex items-center gap-3 pt-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-bold text-lg text-white shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                        isFirst 
                          ? 'bg-gradient-to-br from-[#046A38] to-[#C5A059] ring-2 ring-[#C5A059]' 
                          : 'bg-[#046A38]'
                      }`}>
                        {student.avatarText || student.name.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate font-serif leading-tight group-hover:text-[#046A38] transition-colors">
                          {student.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-sans block mt-0.5 truncate">
                          {student.section === 'female' ? 'قسم الطالبات 🌸' : 'قسم الطلاب 🌿'}
                        </span>
                      </div>
                    </div>

                    {/* الإحصائية الرئيسية والفرعية */}
                    <div className="mt-3 p-2.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/30 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">الإنجاز:</span>
                        <strong className="text-[#046A38] font-bold truncate max-w-[150px] font-sans">
                          {student.statDisplay}
                        </strong>
                      </div>
                      {student.secondaryStat && (
                        <p className="text-[10px] text-slate-600 truncate border-t border-slate-200/60 pt-1 mt-1 font-sans">
                          {student.secondaryStat}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* وسام التكريم السفلي */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/80 flex items-center gap-1 truncate">
                      <Sparkles className="w-3 h-3 text-[#C5A059]" />
                      <span>{student.badge}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => { setActiveCategory(student.category); setShowFullListModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#046A38] hover:bg-slate-100 transition-colors cursor-pointer"
                      title="عرض القائمة الموسعة"
                    >
                      <ArrowRight className="w-3.5 h-3.5 -scale-x-100" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. نافذة منبثقة لعرض القائمة الكاملة (Modal) */}
      {showFullListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-[#C5A059]">لوحة الشرف والتكريم</span>
                <h3 className="text-lg font-bold font-serif text-[#046A38]">
                  قائمة أوائل الطلاب المتفوقين في الأسبوع
                </h3>
              </div>
              <button
                onClick={() => setShowFullListModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* أزرار التبديل بين الفئات داخل النافذة */}
            <div className="flex items-center gap-1.5 bg-[#F9F6F0] p-1 rounded-xl text-xs border border-[#C5A059]/30">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeCategory === 'all' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                جميع الفئات
              </button>
              <button
                onClick={() => setActiveCategory('regular')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeCategory === 'regular' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                🥇 المنتظمون
              </button>
              <button
                onClick={() => setActiveCategory('reciter')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeCategory === 'reciter' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                🎙️ الأكثر تسميعاً
              </button>
              <button
                onClick={() => setActiveCategory('excellent')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeCategory === 'excellent' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                ⭐ المتميزون
              </button>
            </div>

            {/* عرض الطلاب بحسب التبويب */}
            <div className="space-y-2 pt-2">
              {(activeCategory === 'all' || activeCategory === 'regular') && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#046A38] block pt-2 pb-1">
                    🥇 الطلاب المنتظمون (الانضباط الكامل في الحضور):
                  </span>
                  {regularStudents.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-500">#{s.rank}</span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <span className="text-[11px] text-slate-500">({s.statDisplay})</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {s.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(activeCategory === 'all' || activeCategory === 'reciter') && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#046A38] block pt-2 pb-1">
                    🎙️ الطلاب الأكثر تسميعاً وتسجيلاً:
                  </span>
                  {mostReciterStudents.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-500">#{s.rank}</span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <span className="text-[11px] text-slate-500">({s.statDisplay})</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {s.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(activeCategory === 'all' || activeCategory === 'excellent') && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#046A38] block pt-2 pb-1">
                    ⭐ الطلاب المتميزون في الحفظ والتجويد:
                  </span>
                  {topScorerStudents.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-500">#{s.rank}</span>
                        <span className="font-bold text-slate-900">{s.name}</span>
                        <span className="text-[11px] text-slate-500">({s.statDisplay})</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {s.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-left">
              <button
                onClick={() => setShowFullListModal(false)}
                className="px-5 py-2 bg-[#046A38] hover:bg-[#03552d] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
