/**
 * صفحة لوحة الشرف الموحدة للطالب - مقرأة رحاب القرآن الإلكترونية
 * 1. ترتيب الطالب في 3 فئات:
 *    - فئة الالتزام والحضور اليومي
 *    - فئة التسميع وحفظ الآيات
 *    - فئة الإتقان وجودة التجويد
 * 2. الفائزون الأسبوعيون ومنصة التتويج
 */

import React, { useState, useRef } from 'react';
import { 
  Trophy, Award, Crown, Sparkles, Star, Medal, 
  Calendar, CheckCircle2, UserCheck, Flame, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { AuthAccount } from '../../types';

interface StudentHonorBoardViewProps {
  currentAccount: AuthAccount;
}

export const StudentHonorBoardView: React.FC<StudentHonorBoardViewProps> = ({
  currentAccount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'attendance' | 'recitation' | 'tajweed'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // حساب أسبوع التكريم الحالي
  const currentWeek = 'الأسبوع الثالث - ربيع الأول 1448 هـ / أكتوبر 2026 م';

  // 1. ترتيب الطالب الفعلي في الفئات الثلاث
  const studentRanks = {
    attendance: { rank: 2, badge: 'فارس الفجر والالتزام 🥈', score: '7 / 7 أيام', pct: '100%' },
    recitation: { rank: 3, badge: 'همّة الحفظ والترتيل 🥉', score: '18 مقطعاً مجازاً', pct: '96%' },
    tajweed: { rank: 1, badge: 'إتقان المخارج والصفات 🥇', score: '98 / 100', pct: '98%' },
  };

  // 2. الفائزون الأسبوعيون (منصة التتويج وقوائم الشرف)
  const topWinners = [
    {
      id: 'w1',
      name: 'عبدالرحمن باجعفر',
      rank: 1,
      category: 'الأكثر حفظاً وتسميعاً',
      categoryKey: 'recitation',
      score: '22 مقطعاً مجازاً',
      badge: 'المركز الأول 🥇',
      medalColor: 'from-amber-400 to-amber-600',
      halo: 'ring-amber-400',
    },
    {
      id: 'w2',
      name: currentAccount.name || 'طالب المقرأة',
      rank: 2,
      category: 'فارس الالتزام والحضور',
      categoryKey: 'attendance',
      score: 'حضور مبكر تام 100%',
      badge: 'المركز الثاني 🥈',
      medalColor: 'from-slate-300 to-slate-500',
      halo: 'ring-slate-300',
      isMe: true,
    },
    {
      id: 'w3',
      name: 'عمر المختار اليماني',
      rank: 3,
      category: 'الأعلى إتقاناً وتجويداً',
      categoryKey: 'tajweed',
      score: 'تقدير ممتاز مرتفع 99%',
      badge: 'المركز الثالث 🥉',
      medalColor: 'from-amber-700 to-amber-900',
      halo: 'ring-amber-700',
    },
  ];

  const fullLeaderboard = [
    { id: '1', name: 'عبدالرحمن باجعفر', rank: 1, category: 'recitation', catTitle: 'الأكثر حفظاً وتسميعاً', stat: '22 مقطعاً مجازاً', grade: '100%' },
    { id: '2', name: currentAccount.name || 'طالب المقرأة', rank: 2, category: 'attendance', catTitle: 'فارس الالتزام والحضور', stat: '7/7 أيام حضور كامل', grade: '99%', isMe: true },
    { id: '3', name: 'عمر المختار اليماني', rank: 3, category: 'tajweed', catTitle: 'الأعلى إتقاناً وتجويداً', stat: 'تقدير ممتاز مرتفع', grade: '98%' },
    { id: '4', name: 'فاطمة الزهراء الحضرمية', rank: 4, category: 'recitation', catTitle: 'الأكثر حفظاً وتسميعاً', stat: '19 مقطعاً مجازاً', grade: '97%' },
    { id: '5', name: 'إبراهيم يحيى الأهدل', rank: 5, category: 'attendance', catTitle: 'فارس الالتزام والحضور', stat: 'حضور مبكر دائم', grade: '96%' },
    { id: '6', name: 'خالد بن وليد', rank: 6, category: 'tajweed', catTitle: 'الأعلى إتقاناً وتجويداً', stat: 'أحكام النون والمدود', grade: '95%' },
  ];

  const filteredList = selectedCategory === 'all' 
    ? fullLeaderboard 
    : fullLeaderboard.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      
      {/* 1. الترويسة الذهبية */}
      <div className="bg-gradient-to-r from-[#046A38] via-[#05572e] to-[#046A38] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#C5A059] shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <div className="inline-flex items-center gap-2 bg-[#C5A059] text-white px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
            <Trophy className="w-4 h-4" />
            <span>لوحة الشرف الأسبوعية والفرسان المتميزون</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            منصة تكريم طلاب وطالبات مقرأة رحاب القرآن
          </h2>
          <p className="text-xs text-emerald-100 max-w-xl">
            تكريم أسبوعي معتمد للمتميزين في الحفظ والتسميع، الالتزام بالحلقات، والإتقان التجويدي بالسند.
          </p>
        </div>

        <div className="p-4 bg-white/10 rounded-2xl border border-white/20 text-center min-w-[200px]">
          <span className="text-[11px] text-emerald-200 block">فترة التكريم المعتمدة</span>
          <span className="text-xs font-bold text-[#C5A059] font-serif block mt-1">{currentWeek}</span>
        </div>
      </div>

      {/* 2. بطاقة خاصة: ترتيب الطالب الفعلي في الفئات الثلاث */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#C5A059] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-bold text-base font-serif text-[#046A38]">
              ترتيبك الشخصي في الفئات الثلاث (يا {currentAccount.name})
            </h3>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-xl border border-amber-200">
            أداء أكاديمي استثنائي ⭐
          </span>
        </div>

        {/* شريط أفقي قابل للسحب يميناً ويساراً لمراتب الطالب */}
        <div className="relative pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
            <span className="font-sans text-[11px]">اسحب الشريط أفقياً لمتابعة فئاتك:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('student-ranks-ribbon');
                  if (el) el.scrollBy({ left: 240, behavior: 'smooth' });
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title="سحب لليمين"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('student-ranks-ribbon');
                  if (el) el.scrollBy({ left: -240, behavior: 'smooth' });
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                title="سحب لليسار"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div 
            id="student-ranks-ribbon"
            className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {/* فئة 1: الالتزام والحضور */}
            <div className="snap-start shrink-0 w-[240px] sm:w-[260px] p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/50 shadow-2xs hover:shadow-md transition-all space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block truncate">1. الالتزام والحضور اليومي:</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[#046A38]">المركز #{studentRanks.attendance.rank}</span>
                <span className="text-xl">🥈</span>
              </div>
              <p className="text-xs font-bold text-[#C5A059] truncate">{studentRanks.attendance.badge}</p>
              <p className="text-[11px] text-slate-600">الإنجاز: {studentRanks.attendance.score} ({studentRanks.attendance.pct})</p>
            </div>

            {/* فئة 2: التسميع وحفظ الآيات */}
            <div className="snap-start shrink-0 w-[240px] sm:w-[260px] p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/50 shadow-2xs hover:shadow-md transition-all space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block truncate">2. التسميع وحفظ الآيات:</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[#046A38]">المركز #{studentRanks.recitation.rank}</span>
                <span className="text-xl">🥉</span>
              </div>
              <p className="text-xs font-bold text-[#C5A059] truncate">{studentRanks.recitation.badge}</p>
              <p className="text-[11px] text-slate-600">الإنجاز: {studentRanks.recitation.score} ({studentRanks.recitation.pct})</p>
            </div>

            {/* فئة 3: الإتقان وجودة التجويد */}
            <div className="snap-start shrink-0 w-[240px] sm:w-[260px] p-4 bg-[#F9F6F0] rounded-2xl border border-[#C5A059]/50 shadow-2xs hover:shadow-md transition-all space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block truncate">3. الإتقان وجودة التجويد:</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-[#046A38]">المركز #{studentRanks.tajweed.rank}</span>
                <span className="text-xl">🥇</span>
              </div>
              <p className="text-xs font-bold text-[#C5A059] truncate">{studentRanks.tajweed.badge}</p>
              <p className="text-[11px] text-slate-600">الدرجة: {studentRanks.tajweed.score} ({studentRanks.tajweed.pct})</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. منصة التتويج للمراكز الثلاثة الأولى (Podium) */}
      <div className="bg-gradient-to-b from-slate-900 to-[#046A38] text-white p-6 sm:p-10 rounded-3xl border-2 border-[#C5A059] shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Crown className="w-4 h-4" />
            <span>فرسان الأسبوع على منصة التتويج</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
            المراكز الثلاثة الأولى في مقرأة رحاب القرآن
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 max-w-4xl mx-auto items-end">
          
          {/* المركز الثاني */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-slate-300/40 text-center space-y-3 order-2 md:order-1 relative">
            <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-2xl mx-auto shadow-md ring-4 ring-slate-400/50">
              🥈
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">{topWinners[1].badge}</span>
              <h4 className="font-bold text-base text-white font-serif mt-0.5">{topWinners[1].name}</h4>
              <p className="text-xs text-amber-300 font-bold mt-1">{topWinners[1].category}</p>
              <span className="text-[11px] text-slate-300 block mt-0.5">{topWinners[1].score}</span>
            </div>
          </div>

          {/* المركز الأول (في الوسط وأعلى) */}
          <div className="bg-gradient-to-b from-amber-500/20 to-emerald-950 p-7 rounded-3xl border-2 border-amber-400 text-center space-y-3 order-1 md:order-2 shadow-2xl relative md:-translate-y-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>فارس الأسبوع الملكي</span>
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 flex items-center justify-center font-bold text-3xl mx-auto shadow-lg ring-4 ring-amber-400">
              🥇
            </div>
            <div>
              <span className="text-xs text-amber-300 font-bold block">{topWinners[0].badge}</span>
              <h4 className="font-bold text-lg text-white font-serif mt-0.5">{topWinners[0].name}</h4>
              <p className="text-xs text-amber-300 font-bold mt-1">{topWinners[0].category}</p>
              <span className="text-[11px] text-emerald-200 block mt-0.5">{topWinners[0].score}</span>
            </div>
          </div>

          {/* المركز الثالث */}
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-amber-700/40 text-center space-y-3 order-3 relative">
            <div className="w-16 h-16 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md ring-4 ring-amber-700/50">
              🥉
            </div>
            <div>
              <span className="text-[11px] text-slate-300 block">{topWinners[2].badge}</span>
              <h4 className="font-bold text-base text-white font-serif mt-0.5">{topWinners[2].name}</h4>
              <p className="text-xs text-amber-300 font-bold mt-1">{topWinners[2].category}</p>
              <span className="text-[11px] text-slate-300 block mt-0.5">{topWinners[2].score}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. تصفية وجدول الشرف العام */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Medal className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-bold text-base font-serif text-slate-900">ترتيب الطلاب في الفئات المختلفة</h3>
          </div>

          {/* تبويبات التصفية */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              جميع الفئات
            </button>
            <button
              onClick={() => setSelectedCategory('attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'attendance'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              فئة الالتزام والحضور
            </button>
            <button
              onClick={() => setSelectedCategory('recitation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'recitation'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              فئة التسميع والحفظ
            </button>
            <button
              onClick={() => setSelectedCategory('tajweed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'tajweed'
                  ? 'bg-[#046A38] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              فئة التجويد والإتقان
            </button>
          </div>
        </div>

        {/* شريط بطاقات الطلاب الأفقي القابل للسحب يميناً ويساراً */}
        <div className="space-y-3">
          {/* أسهم التنقل الأفقي السريع */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="text-[11px] font-sans flex items-center gap-1 text-[#046A38] font-bold">
              <span>اسحب البطاقات أفقياً</span>
              <span className="font-mono text-[#C5A059]">⟷</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollRight}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-[#F9F6F0] active:scale-95 text-slate-700 hover:text-[#046A38] border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="سحب لليمين"
                aria-label="سحب لليمين"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollLeft}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-[#F9F6F0] active:scale-95 text-slate-700 hover:text-[#046A38] border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="سحب لليسار"
                aria-label="سحب لليسار"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* حاوية السحب الأفقية */}
          <div 
            ref={scrollContainerRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#C5A059]/40 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
            tabIndex={0}
            role="region"
            aria-label="شريط كوكبة الشرف الأفقي"
          >
            {filteredList.map((item) => {
              const isFirst = item.rank === 1;
              const isSecond = item.rank === 2;
              const isThird = item.rank === 3;

              return (
                <div 
                  key={item.id} 
                  className={`snap-start shrink-0 w-[240px] sm:w-[260px] p-4.5 rounded-3xl border-2 transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between ${
                    item.isMe 
                      ? 'bg-emerald-50/90 border-[#046A38] ring-2 ring-emerald-200' 
                      : isFirst
                      ? 'bg-gradient-to-b from-amber-50/60 to-white border-[#C5A059]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* رأس بطاقة الطالب والرتبة */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        isFirst ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-xs' :
                        isSecond ? 'bg-slate-200 text-slate-800' :
                        isThird ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{item.rank}
                      </span>

                      {item.isMe ? (
                        <span className="text-[10px] font-bold bg-[#046A38] text-white px-2 py-0.5 rounded-full">
                          حسابك
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#C5A059] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {isFirst ? 'المركز الأول 🥇' : isSecond ? 'المركز الثاني 🥈' : isThird ? 'المركز الثالث 🥉' : 'فارس شرف'}
                        </span>
                      )}
                    </div>

                    {/* بيانات الطالب */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#046A38] to-[#02311c] text-white flex items-center justify-center font-bold font-serif text-base shrink-0 shadow-xs">
                        {item.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 font-serif truncate">{item.name}</h4>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">{item.catTitle}</span>
                      </div>
                    </div>

                    {/* الإنجاز والنسبة */}
                    <div className="p-2.5 rounded-2xl bg-[#F9F6F0] border border-[#C5A059]/30 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 text-[11px]">الإنجاز:</span>
                        <strong className="text-[#046A38] font-mono font-bold text-xs">{item.stat}</strong>
                      </div>
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-200/60 pt-1 text-slate-500">
                        <span>التقييم:</span>
                        <span className="font-mono font-bold text-[#C5A059]">{item.grade}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">مقرأة رحاب القرآن</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
