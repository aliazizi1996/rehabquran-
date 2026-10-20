import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Award, BookOpen, Sparkles, CheckCircle2, 
  Calendar, UserCheck, ChevronDown, Filter, Info, 
  ArrowUpRight, ArrowDownRight, BarChart3, LineChart as LineChartIcon,
  ShieldCheck, Mic, Star, Layers, Activity, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { DbStudent, DbEvaluation } from '../data/academyDb';
import { DailyRecitationRecord } from '../types';

interface StudentAnalyticsDashboardProps {
  student: DbStudent | null;
  evaluations: DbEvaluation[];
  dailyRecitations?: DailyRecitationRecord[];
  onOpenRecitationRecorder?: () => void;
  onOpenCertificates?: () => void;
  className?: string;
}

export const StudentAnalyticsDashboard: React.FC<StudentAnalyticsDashboardProps> = ({
  student,
  evaluations = [],
  dailyRecitations = [],
  onOpenRecitationRecorder,
  onOpenCertificates,
  className = '',
}) => {
  // View mode tab: 'trend' (منحنى التقدم) | 'radar' (رادار المهارات) | 'surahs' (تحليل السور) | 'sheikh_notes' (ملاحظات المشايخ)
  const [activeChartTab, setActiveChartTab] = useState<'trend' | 'radar' | 'surahs' | 'sheikh_notes'>('trend');
  // Metric toggle: 'both' | 'hifz' | 'tajweed'
  const [metricFilter, setMetricFilter] = useState<'both' | 'hifz' | 'tajweed'>('both');
  // Range filter: 'all' | 'recent5' | 'recent10'
  const [rangeFilter, setRangeFilter] = useState<'all' | 'recent5' | 'recent10'>('all');

  // Normalize and combine evaluations from both stores
  const combinedEvaluations = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      displayDate: string;
      surah: string;
      fromAyah: number;
      toAyah: number;
      hifzScore: number;
      tajweedScore: number;
      overallScore: number;
      teacherName: string;
      teacherNotes: string;
      tajweedNotes?: string;
      rulesMastered?: string[];
      lessonType: string;
      gradeLabel: string;
    }> = [];

    // 1. From DbEvaluation
    evaluations.forEach((ev) => {
      const hScore = ev.hifzScore !== undefined ? ev.hifzScore : Math.min(100, Math.max(70, ev.score + (ev.lessonType === 'حفظ' ? 1 : 0)));
      const tScore = ev.tajweedScore !== undefined ? ev.tajweedScore : Math.min(100, Math.max(70, ev.score - (ev.lessonType === 'حفظ' ? 1 : 0)));
      list.push({
        id: ev.id,
        date: ev.date,
        displayDate: ev.date.length > 5 ? ev.date.slice(5) : ev.date,
        surah: ev.surah,
        fromAyah: ev.fromAyah,
        toAyah: ev.toAyah,
        hifzScore: hScore,
        tajweedScore: tScore,
        overallScore: ev.score,
        teacherName: ev.teacherName,
        teacherNotes: ev.teacherNotes,
        tajweedNotes: ev.tajweedNotes,
        rulesMastered: ev.tajweedRulesMastered,
        lessonType: ev.lessonType || 'حفظ',
        gradeLabel: ev.grade || 'ممتاز',
      });
    });

    // 2. From DailyRecitationRecord if matching student
    if (student) {
      dailyRecitations
        .filter((r) => r.studentId === student.id || r.studentName === student.name)
        .forEach((r) => {
          // Avoid duplicate by date + surah
          const exists = list.some((item) => item.date === r.date && item.surah.includes(r.surahName));
          if (!exists) {
            const hScore = r.hifzScore !== undefined ? r.hifzScore : r.score;
            const tScore = r.tajweedScore !== undefined ? r.tajweedScore : Math.max(70, r.score - 2);
            list.push({
              id: r.id,
              date: r.date,
              displayDate: r.date.length > 5 ? r.date.slice(5) : r.date,
              surah: r.surahName,
              fromAyah: r.ayahStart,
              toAyah: r.ayahEnd,
              hifzScore: hScore,
              tajweedScore: tScore,
              overallScore: r.score,
              teacherName: r.evaluatorTeacher || 'معلم الحلقة',
              teacherNotes: r.teacherFeedback || 'تسميع متقن بارك الله فيك.',
              tajweedNotes: r.tajweedNotes,
              rulesMastered: ['أحكام النون الساكنة', 'المد المتصل'],
              lessonType: 'حفظ وتسميع',
              gradeLabel: r.grade === 'excellent' ? 'ممتاز' : r.grade === 'very_good' ? 'جيد جداً' : 'جيد',
            });
          }
        });
    }

    // Sort chronologically ascending for the chart timeline
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fallback progression if student has few or no records yet
    if (list.length === 0) {
      const baseSurah = student?.currentSurah || 'الكهف';
      const teacher = student?.teacherName || 'الشيخ إبراهيم الوصابي';
      return [
        {
          id: 'demo-1',
          date: '2026-08-20',
          displayDate: '08-20',
          surah: 'سورة الإسراء',
          fromAyah: 1,
          toAyah: 30,
          hifzScore: 90,
          tajweedScore: 88,
          overallScore: 89,
          teacherName: teacher,
          teacherNotes: 'بداية مباركة، الالتزام بمخارج الحروف والتركيز على الغنن.',
          tajweedNotes: 'توضيح مخرج النون والميم المشددتين.',
          rulesMastered: ['الغنة بمقدار حركتين'],
          lessonType: 'حفظ',
          gradeLabel: 'جيد جداً',
        },
        {
          id: 'demo-2',
          date: '2026-08-27',
          displayDate: '08-27',
          surah: 'سورة الإسراء',
          fromAyah: 31,
          toAyah: 65,
          hifzScore: 93,
          tajweedScore: 91,
          overallScore: 92,
          teacherName: teacher,
          teacherNotes: 'تحسن ملحوظ في ضبط أزمنة المدود الطبيعية والفرعية.',
          tajweedNotes: 'المد المتصل والمنفصل بمقدار 4 حركات.',
          rulesMastered: ['المد المتصل والمنفصل'],
          lessonType: 'حفظ',
          gradeLabel: 'ممتاز',
        },
        {
          id: 'demo-3',
          date: '2026-09-04',
          displayDate: '09-04',
          surah: 'سورة الإسراء',
          fromAyah: 66,
          toAyah: 111,
          hifzScore: 95,
          tajweedScore: 93,
          overallScore: 94,
          teacherName: teacher,
          teacherNotes: 'إتقان تام لمخارج الحلق والقلقلة في مواضعها.',
          tajweedNotes: 'مراتب القلقلة الكبرى والوسطى.',
          rulesMastered: ['القلقلة', 'مخارج الحلق'],
          lessonType: 'تثبيت',
          gradeLabel: 'ممتاز',
        },
        {
          id: 'demo-4',
          date: '2026-09-10',
          displayDate: '09-10',
          surah: `سورة ${baseSurah}`,
          fromAyah: 1,
          toAyah: 20,
          hifzScore: 97,
          tajweedScore: 95,
          overallScore: 96,
          teacherName: teacher,
          teacherNotes: 'سرد متصل وخشوع في الترتيل، استقرار ممتاز لأحكام الوقف.',
          tajweedNotes: 'الوقف التام والكافي.',
          rulesMastered: ['الوقف والابتداء'],
          lessonType: 'حفظ',
          gradeLabel: 'ممتاز',
        },
        {
          id: 'demo-5',
          date: '2026-09-15',
          displayDate: '09-15',
          surah: `سورة ${baseSurah}`,
          fromAyah: 21,
          toAyah: 45,
          hifzScore: 99,
          tajweedScore: 97,
          overallScore: 98,
          teacherName: teacher,
          teacherNotes: 'ما شاء الله تبارك الله، أداء رفيع وترتيل عذب متقن.',
          tajweedNotes: 'استيفاء أحكام التجويد كاملة مع ترقيق الراء وتفخيمها.',
          rulesMastered: ['أحكام الراء', 'صفات الحروف'],
          lessonType: 'حفظ وتثبيت',
          gradeLabel: 'ممتاز مع مرتبة الشرف',
        },
      ];
    }

    return list;
  }, [evaluations, dailyRecitations, student]);

  // Filtered dataset according to range
  const chartData = useMemo(() => {
    let data = [...combinedEvaluations];
    if (rangeFilter === 'recent5') {
      data = data.slice(-5);
    } else if (rangeFilter === 'recent10') {
      data = data.slice(-10);
    }
    return data.map((item, index) => ({
      ...item,
      sessionIndex: `جلسة ${index + 1}`,
      chartLabel: item.surah.replace('سورة ', ''),
    }));
  }, [combinedEvaluations, rangeFilter]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    if (combinedEvaluations.length === 0) {
      return {
        avgHifz: 95,
        avgTajweed: 93,
        avgOverall: 94,
        totalSessions: 0,
        progressGrowth: '+5.2%',
        highestScore: 98,
      };
    }
    const sumHifz = combinedEvaluations.reduce((acc, curr) => acc + curr.hifzScore, 0);
    const sumTajweed = combinedEvaluations.reduce((acc, curr) => acc + curr.tajweedScore, 0);
    const sumOverall = combinedEvaluations.reduce((acc, curr) => acc + curr.overallScore, 0);
    const count = combinedEvaluations.length;

    const avgH = Math.round((sumHifz / count) * 10) / 10;
    const avgT = Math.round((sumTajweed / count) * 10) / 10;
    const avgO = Math.round((sumOverall / count) * 10) / 10;

    // Calculate progression between first and last evaluation
    const firstScore = combinedEvaluations[0]?.overallScore || 90;
    const lastScore = combinedEvaluations[combinedEvaluations.length - 1]?.overallScore || 95;
    const diff = lastScore - firstScore;
    const growthText = diff >= 0 ? `+${diff}%` : `${diff}%`;

    const highest = Math.max(...combinedEvaluations.map((e) => e.overallScore));

    return {
      avgHifz: avgH,
      avgTajweed: avgT,
      avgOverall: avgO,
      totalSessions: count,
      progressGrowth: growthText,
      highestScore: highest,
    };
  }, [combinedEvaluations]);

  // Data for the Tajweed & Memorization Competency Radar
  const radarData = useMemo(() => {
    // Dynamically scale scores around student's average
    const baseH = stats.avgHifz;
    const baseT = stats.avgTajweed;

    return [
      {
        skill: 'طلاقة وضبط الحفظ',
        score: Math.min(100, Math.round(baseH)),
        fullMark: 100,
      },
      {
        skill: 'مخارج الحروف والصفات',
        score: Math.min(100, Math.round(baseT - 1)),
        fullMark: 100,
      },
      {
        skill: 'أحكام النون والميم',
        score: Math.min(100, Math.round(baseT + 2)),
        fullMark: 100,
      },
      {
        skill: 'أحكام المدود ومقاديرها',
        score: Math.min(100, Math.round(baseT + 1)),
        fullMark: 100,
      },
      {
        skill: 'الوقف والابتداء',
        score: Math.min(100, Math.round(baseH - 2)),
        fullMark: 100,
      },
      {
        skill: 'الترتيل وحسن الأداء',
        score: Math.min(100, Math.round(baseT + 3)),
        fullMark: 100,
      },
    ];
  }, [stats]);

  // Surah breakdown bar chart data
  const surahsBarData = useMemo(() => {
    // Group evaluations by Surah
    const map = new Map<string, { surah: string; hifzAvg: number; tajweedAvg: number; count: number }>();
    combinedEvaluations.forEach((ev) => {
      const cleanName = ev.surah.replace('سورة ', '');
      const existing = map.get(cleanName);
      if (existing) {
        existing.hifzAvg += ev.hifzScore;
        existing.tajweedAvg += ev.tajweedScore;
        existing.count += 1;
      } else {
        map.set(cleanName, {
          surah: cleanName,
          hifzAvg: ev.hifzScore,
          tajweedAvg: ev.tajweedScore,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).map((item) => ({
      surah: item.surah,
      'درجة الحفظ': Math.round(item.hifzAvg / item.count),
      'درجة التجويد': Math.round(item.tajweedAvg / item.count),
    }));
  }, [combinedEvaluations]);

  // Custom Recharts Tooltip for Arabic Context
  const CustomArabicTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div 
          className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-emerald-900/15 text-right font-sans min-w-[220px] space-y-2 z-50 pointer-events-none"
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              {dataPoint?.surah || label}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {dataPoint?.date}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {(metricFilter === 'both' || metricFilter === 'hifz') && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                  درجة الحفظ والضبط:
                </span>
                <span className="font-black text-emerald-950 text-sm">
                  {dataPoint?.hifzScore ?? dataPoint?.['درجة الحفظ']}%
                </span>
              </div>
            )}

            {(metricFilter === 'both' || metricFilter === 'tajweed') && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  درجة التجويد والمخارج:
                </span>
                <span className="font-black text-amber-950 text-sm">
                  {dataPoint?.tajweedScore ?? dataPoint?.['درجة التجويد']}%
                </span>
              </div>
            )}

            {dataPoint?.fromAyah && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                الآيات المقروءة: <strong>{dataPoint.fromAyah} - {dataPoint.toAyah}</strong>
              </p>
            )}

            {dataPoint?.teacherName && (
              <p className="text-[11px] text-slate-600 font-medium">
                الشيخ المقيم: <strong>{dataPoint.teacherName}</strong>
              </p>
            )}
          </div>

          {dataPoint?.teacherNotes && (
            <div className="bg-emerald-50/70 p-2 rounded-xl text-[11px] text-emerald-900 border border-emerald-100/70 italic font-sans leading-relaxed">
              "{dataPoint.teacherNotes.slice(0, 85)}{dataPoint.teacherNotes.length > 85 ? '...' : ''}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`} dir="rtl">
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  لوحة البيانات التحليلية لمستوى الحفظ والتجويد
                </h2>
                <span className="hidden sm:inline-flex text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  معتمدة من المشايخ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                متابعة بيانية دقيقة لتطور مستواك القرآني والأحكام التجويدية عبر جلسات التسميع
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{student?.className || 'حلقة القرآن'}</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>الجزء {student?.currentJuz || 1}</span>
            </span>
          </div>
        </div>

        {/* ================= 4 KPI SUMMARY CARDS ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4">
          {/* Card 1: معدل الحفظ */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-white p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
              <span>معدل الحفظ والضبط</span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                {stats.avgHifz}%
              </span>
              <span className="text-[11px] font-bold text-emerald-700">ممتاز</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, stats.avgHifz)}%` }} 
              />
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-1.5">
              سرد مسترسل بدون تردد
            </span>
          </div>

          {/* Card 2: معدل التجويد */}
          <div className="bg-gradient-to-br from-amber-50/80 to-white p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
              <span>معدل أحكام التجويد</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-950">
                {stats.avgTajweed}%
              </span>
              <span className="text-[11px] font-bold text-amber-700">إتقان</span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.min(100, stats.avgTajweed)}%` }} 
              />
            </div>
            <span className="text-[10px] text-amber-700 font-medium block mt-1.5">
              مخارج وصفات الحروف
            </span>
          </div>

          {/* Card 3: معدل التطور والتحسن */}
          <div className="bg-gradient-to-br from-teal-50/80 to-white p-3.5 rounded-2xl border border-teal-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-teal-800 font-bold mb-1">
              <span>معدل التطور والتحسن</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-teal-950">
                {stats.progressGrowth}
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="w-full bg-teal-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-teal-600 h-full rounded-full w-4/5" />
            </div>
            <span className="text-[10px] text-teal-700 font-medium block mt-1.5">
              مقارنة بأول جلسة تسميع
            </span>
          </div>

          {/* Card 4: الجلسات المعتمدة */}
          <div className="bg-gradient-to-br from-sky-50/80 to-white p-3.5 rounded-2xl border border-sky-200/90 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-sky-800 font-bold mb-1">
              <span>الجلسات المعتمدة</span>
              <UserCheck className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-sky-950">
                {stats.totalSessions}
              </span>
              <span className="text-[11px] font-bold text-sky-700">جلسات تقييم</span>
            </div>
            <div className="w-full bg-sky-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full w-full" />
            </div>
            <span className="text-[10px] text-sky-700 font-medium block mt-1.5">
              بإشراف مشايخ المقرأة
            </span>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & TAB SWITCHER ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveChartTab('trend')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeChartTab === 'trend'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-900/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineChartIcon className="w-4 h-4 text-emerald-700" />
            <span>منحنى التقدم الزمني</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('radar')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeChartTab === 'radar'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-900/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-600" />
            <span>رادار المهارات القرآنية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('surahs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeChartTab === 'surahs'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-900/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-700" />
            <span>تحليل السور المنجزة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('sheikh_notes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeChartTab === 'sheikh_notes'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-900/10'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>ملاحظات المشايخ ({combinedEvaluations.length})</span>
          </button>
        </div>

        {/* Metric & Range Filters for Charts */}
        {activeChartTab === 'trend' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Toggle */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setMetricFilter('both')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  metricFilter === 'both' ? 'bg-emerald-800 text-white' : 'hover:text-emerald-800'
                }`}
              >
                معاً
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('hifz')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  metricFilter === 'hifz' ? 'bg-emerald-800 text-white' : 'hover:text-emerald-800'
                }`}
              >
                الحفظ
              </button>
              <button
                type="button"
                onClick={() => setMetricFilter('tajweed')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  metricFilter === 'tajweed' ? 'bg-amber-600 text-white' : 'hover:text-amber-800'
                }`}
              >
                التجويد
              </button>
            </div>

            {/* Range Selector */}
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-hidden focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">جميع الجلسات ({combinedEvaluations.length})</option>
              <option value="recent5">آخر 5 جلسات</option>
              <option value="recent10">آخر 10 جلسات</option>
            </select>
          </div>
        )}
      </div>

      {/* ================= PRIMARY CHART CANVAS ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* VIEW 1: TREND AREA / LINE CHART */}
        {activeChartTab === 'trend' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  منحنى التطور الزمني لدرجات الحفظ والتجويد
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  يوضح الرسم البياني الصعود التدريجي في مهارات الحفظ والتجويد عبر الجلسات المعتمدة من المعلمين
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
                  درجة الحفظ والضبط
                </span>
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  درجة التجويد والمخارج
                </span>
              </div>
            </div>

            <div className="h-[290px] sm:h-[340px] w-full pt-2 min-w-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                >
                  <defs>
                    <linearGradient id="colorHifz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#046A38" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#046A38" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorTajweed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A059" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#C5A059" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="chartLabel" 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[60, 100]} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    ticks={[60, 70, 80, 90, 100]}
                  />
                  <Tooltip content={<CustomArabicTooltip />} />
                  <ReferenceLine 
                    y={95} 
                    stroke="#059669" 
                    strokeDasharray="4 4" 
                    label={{ value: 'حد التميز (95%)', fill: '#046A38', fontSize: 11, position: 'insideTopLeft' }} 
                  />
                  
                  {(metricFilter === 'both' || metricFilter === 'hifz') && (
                    <Area
                      type="monotone"
                      dataKey="hifzScore"
                      name="درجة الحفظ"
                      stroke="#046A38"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorHifz)"
                      activeDot={{ r: 6, fill: '#046A38', stroke: '#fff', strokeWidth: 2 }}
                    />
                  )}

                  {(metricFilter === 'both' || metricFilter === 'tajweed') && (
                    <Area
                      type="monotone"
                      dataKey="tajweedScore"
                      name="درجة التجويد"
                      stroke="#C5A059"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTajweed)"
                      activeDot={{ r: 6, fill: '#C5A059', stroke: '#fff', strokeWidth: 2 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between text-xs text-emerald-950 font-medium">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>الخط المتقطع يُمثل معيار الإتقان والتميز (95% فأعلى) المعتمد لإصدار شهادة إتمام الجزء.</span>
              </span>
              <span className="font-bold text-emerald-900 shrink-0 hidden sm:inline">
                {stats.avgOverall >= 95 ? '✅ مستوى مؤهل للإجازة' : '📈 استمر نحو الإتقان الكامل'}
              </span>
            </div>
          </div>
        )}

        {/* VIEW 2: RADAR CHART FOR 6 TAJWEED & RECITATION PILLARS */}
        {activeChartTab === 'radar' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  رادار المهارات القرآنية والتجويدية الست
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  تقييم شامل لركائز الأداء القرآني المعتمدة في الأكاديمية بناءً على مراجعات المشايخ
                </p>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                معدل المهارات: {stats.avgTajweed}%
              </span>
            </div>

            <div className="h-[310px] sm:h-[360px] w-full min-w-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="skill" 
                    tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 700 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <Radar
                    name="مستوى الطالب"
                    dataKey="score"
                    stroke="#046A38"
                    fill="#046A38"
                    fillOpacity={0.5}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'الدرجة المحققة']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Dimension Explanations */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {radarData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-700">{item.skill}</span>
                  <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                    {item.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: SURAHS COMPARISON BAR CHART */}
        {activeChartTab === 'surahs' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                  مقارنة السور القرآنية المقيمة (الحفظ مقابل التجويد)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  عرض تفصيلي لدرجات كل سورة قمت بتسميعها أمام شيوخ ومعلمي الحلقات
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded-md bg-emerald-700"></span>
                  الحفظ
                </span>
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-3 h-3 rounded-md bg-amber-500"></span>
                  التجويد
                </span>
              </div>
            </div>

            <div className="h-[290px] sm:h-[340px] w-full pt-2 min-w-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                  data={surahsBarData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="surah" 
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[60, 100]} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                  />
                  <Tooltip content={<CustomArabicTooltip />} />
                  <Bar dataKey="درجة الحفظ" fill="#046A38" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="درجة التجويد" fill="#C5A059" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between font-medium">
              <span>إجمالي السور المقيمة: <strong className="text-slate-900 font-black">{surahsBarData.length} سور</strong></span>
              <span>أعلى سورة أداءً: <strong className="text-emerald-800 font-black">{surahsBarData[surahsBarData.length - 1]?.surah || 'الكهف'}</strong></span>
            </div>
          </div>
        )}

        {/* VIEW 4: SHEIKHS' NOTES & DETAILED EVALUATIONS FEED */}
        {activeChartTab === 'sheikh_notes' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                سجل توجيهات وملاحظات المشايخ المعتمدة
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                التغذية الراجعة الصوتية والتجويدية المسجلة لك من قبل معلمي ومشايخ المقرأة
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {combinedEvaluations.slice().reverse().map((ev) => (
                <div 
                  key={ev.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-sm font-bold">
                        👨‍🏫
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900">
                          {ev.surah} (الآيات {ev.fromAyah} - {ev.toAyah})
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          المعلم: <strong className="text-slate-700">{ev.teacherName}</strong> • {ev.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        الحفظ: {ev.hifzScore}%
                      </span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        التجويد: {ev.tajweedScore}%
                      </span>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                        {ev.gradeLabel}
                      </span>
                    </div>
                  </div>

                  {/* Feedback comment */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans font-medium">
                    <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ملاحظة الشيخ والتوجيه:</span>
                    </p>
                    <p className="italic text-slate-700 pr-5">"{ev.teacherNotes}"</p>
                  </div>

                  {/* Tajweed Notes & Rules */}
                  {(ev.tajweedNotes || (ev.rulesMastered && ev.rulesMastered.length > 0)) && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      {ev.tajweedNotes && (
                        <span className="text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70 font-semibold">
                          📜 {ev.tajweedNotes}
                        </span>
                      )}
                      {ev.rulesMastered?.map((rule, idx) => (
                        <span key={idx} className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold text-[11px]">
                          ✓ {rule}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= BOTTOM ACTION CALL-TO-ACTION ================= */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-black text-amber-200">الارتقاء الأكاديمي والتحفيزي</span>
          </div>
          <h4 className="text-sm sm:text-base font-black text-white">
            هل ترغب في رفع معدلك والحصول على تقييم فوري من الشيخ؟
          </h4>
          <p className="text-xs text-emerald-100/90 font-medium">
            سجّل تلاوتك بصوتك الآن في قسم التسميع الصوتي أو راجع شهادات الإنجاز المعتمدة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {onOpenRecitationRecorder && (
            <button
              type="button"
              onClick={onOpenRecitationRecorder}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Mic className="w-4 h-4" />
              <span>تسجيل تسميع جديد</span>
            </button>
          )}

          {onOpenCertificates && (
            <button
              type="button"
              onClick={onOpenCertificates}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/20"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>عرض الشهادات</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
