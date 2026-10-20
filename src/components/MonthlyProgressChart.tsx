import React, { useState } from 'react';
import { 
  TrendingUp, Award, BookOpen, Sparkles, CheckCircle2, 
  Calendar, Flame, Target, Star, Filter, ArrowUpRight
} from 'lucide-react';

interface MonthlyProgressChartProps {
  studentName?: string;
  totalAyahsMemorized?: number;
  totalAyahsReviewed?: number;
  className?: string;
}

export const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({
  studentName = 'الطالب المجد',
  totalAyahsMemorized = 340,
  totalAyahsReviewed = 720,
  className = ''
}) => {
  const [metricView, setMetricView] = useState<'both' | 'memorization' | 'revision'>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // بيانات شهرية واقعية تعكس التدرج خلال أسابيع شهر سبتمبر 2026
  const data = [
    { day: '1 سبتمبر', memorization: 25, revision: 45, target: 50 },
    { day: '5 سبتمبر', memorization: 50, revision: 90, target: 100 },
    { day: '10 سبتمبر', memorization: 85, revision: 160, target: 180 },
    { day: '15 سبتمبر', memorization: 140, revision: 280, target: 300 },
    { day: '20 سبتمبر', memorization: 210, revision: 430, target: 450 },
    { day: '25 سبتمبر', memorization: 280, revision: 590, target: 650 },
    { day: '28 سبتمبر', memorization: totalAyahsMemorized, revision: totalAyahsReviewed, target: 800 },
  ];

  const totalSum = totalAyahsMemorized + totalAyahsReviewed;
  const targetGoal = 1000;
  const completionRate = Math.min(100, Math.round((totalSum / targetGoal) * 100));

  // Chart coordinate calculation for pure SVG area chart
  const width = 640;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;
  const maxVal = 850;

  const pointsMem = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = height - paddingY - (d.memorization / maxVal) * chartH;
    return { x, y, val: d.memorization, day: d.day };
  });

  const pointsRev = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const y = height - paddingY - (d.revision / maxVal) * chartH;
    return { x, y, val: d.revision, day: d.day };
  });

  // Create smooth bezier path
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const pathMemLine = createSmoothPath(pointsMem);
  const pathRevLine = createSmoothPath(pointsRev);

  const pathMemArea = `${pathMemLine} L ${pointsMem[pointsMem.length - 1].x},${height - paddingY} L ${pointsMem[0].x},${height - paddingY} Z`;
  const pathRevArea = `${pathRevLine} L ${pointsRev[pointsRev.length - 1].x},${height - paddingY} L ${pointsRev[0].x},${height - paddingY} Z`;

  const activeHover = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 ${className}`}>
      {/* رأس بطاقة المنحنى البياني */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#046A38]/10 text-[#046A38] flex items-center justify-center shrink-0 border border-[#046A38]/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-serif text-[#046A38] text-base">
                منحنى تقدم الحفظ والمراجعة الشهري
              </h3>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>إنجاز متصاعد 🔥</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              متابعة بصرية دقيقة لمعدل حفظ ومراجعة الآيات الكريمة خلال شهر سبتمبر 2026
            </p>
          </div>
        </div>

        {/* أزرار التصفية التفاعلية */}
        <div className="flex items-center gap-1.5 bg-[#F9F6F0] p-1 rounded-xl text-xs border border-[#C5A059]/30 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetricView('both')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              metricView === 'both' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setMetricView('memorization')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              metricView === 'memorization' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الحفظ الجديد
          </button>
          <button
            type="button"
            onClick={() => setMetricView('revision')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              metricView === 'revision' ? 'bg-[#046A38] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المراجعة
          </button>
        </div>
      </div>

      {/* شريط الأهداف المحققة السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
          <span className="text-[11px] text-slate-500 font-bold block">مجموع آيات الحفظ</span>
          <span className="text-lg font-black text-[#046A38] font-mono">{totalAyahsMemorized} آية</span>
        </div>
        <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
          <span className="text-[11px] text-slate-500 font-bold block">مجموع آيات المراجعة</span>
          <span className="text-lg font-black text-[#C5A059] font-mono">{totalAyahsReviewed} آية</span>
        </div>
        <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100">
          <span className="text-[11px] text-slate-500 font-bold block">الهدف الشهري الكلي</span>
          <span className="text-lg font-black text-sky-800 font-mono">{targetGoal} آية</span>
        </div>
        <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
          <span className="text-[11px] text-slate-500 font-bold block">نسبة الإنجاز الشهري</span>
          <span className="text-lg font-black text-purple-700 font-mono">{completionRate}% ⭐</span>
        </div>
      </div>

      {/* دلالات الألوان التوضيحية */}
      <div className="flex items-center justify-between text-xs px-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {(metricView === 'both' || metricView === 'memorization') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#046A38]"></span>
              <span className="font-bold text-slate-700">الحفظ الجديد (آيات)</span>
            </div>
          )}
          {(metricView === 'both' || metricView === 'revision') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#C5A059]"></span>
              <span className="font-bold text-slate-700">المراجعة والتثبيت (آيات)</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-mono">مرر المؤشر فوق النقاط لعرض التفاصيل</span>
      </div>

      {/* المنحنى البصري المتفاعل بالكامل عبر SVG بدقة فائقة وبدون أي أخطاء سياق */}
      <div className="relative w-full h-64 sm:h-72 select-none" dir="ltr">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            {/* Emerald Gradient */}
            <linearGradient id="svgMemGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#046A38" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#046A38" stopOpacity="0.02" />
            </linearGradient>
            {/* Gold Gradient */}
            <linearGradient id="svgRevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#C5A059" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * chartH;
            const val = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Revision Area & Line */}
          {(metricView === 'both' || metricView === 'revision') && (
            <>
              <path d={pathRevArea} fill="url(#svgRevGradient)" />
              <path d={pathRevLine} fill="none" stroke="#C5A059" strokeWidth="3" strokeLinecap="round" />
              {pointsRev.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === i ? 6 : 4}
                  fill="#ffffff"
                  stroke="#C5A059"
                  strokeWidth={hoveredIndex === i ? 3 : 2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              ))}
            </>
          )}

          {/* Memorization Area & Line */}
          {(metricView === 'both' || metricView === 'memorization') && (
            <>
              <path d={pathMemArea} fill="url(#svgMemGradient)" />
              <path d={pathMemLine} fill="none" stroke="#046A38" strokeWidth="3" strokeLinecap="round" />
              {pointsMem.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === i ? 6 : 4}
                  fill="#ffffff"
                  stroke="#046A38"
                  strokeWidth={hoveredIndex === i ? 3 : 2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              ))}
            </>
          )}

          {/* Interactive Column Hover Hitboxes & X Axis Labels */}
          {data.map((d, i) => {
            const x = paddingX + (i / (data.length - 1)) * chartW;
            return (
              <g key={i}>
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {d.day}
                </text>
                {/* Invisible hover area */}
                <rect
                  x={x - 25}
                  y={paddingY}
                  width={50}
                  height={chartH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {hoveredIndex === i && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {activeHover && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xl text-right z-20 pointer-events-none transition-all duration-150"
            dir="rtl"
          >
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="text-xs font-bold text-slate-800">{activeHover.day}</span>
            </div>
            <div className="space-y-1 text-xs">
              {(metricView === 'both' || metricView === 'memorization') && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#046A38] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#046A38]"></span>
                    حفظ جديد:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{activeHover.memorization} آية</span>
                </div>
              )}
              {(metricView === 'both' || metricView === 'revision') && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#C5A059] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                    مراجعة وتثبيت:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{activeHover.revision} آية</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* شريط الإشادة التحفيزي في أسفل المنحنى */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-[#046A38] to-emerald-900 rounded-2xl text-white flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
          <span>
            أحسنت يا <strong>{studentName}</strong>! لقد تجاوزت معدل الحفظ الأسبوعي بنسبة <strong>18%</strong> مقارنة بالشهر السابق.
          </span>
        </div>
        <span className="hidden sm:inline-block font-mono text-[11px] text-amber-200">
          استمر على هذا الورد المبارك 🌿
        </span>
      </div>
    </div>
  );
};
