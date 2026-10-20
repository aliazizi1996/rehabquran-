import React, { useState } from 'react';
import { 
  Search, Users, Clock, Radio, CheckCircle, PlusCircle, 
  Sparkles, Award, ChevronLeft, Info, Bookmark, Calendar, MessageCircle, ExternalLink,
  GraduationCap, Mic, User, ShieldCheck, ArrowRight, BookOpen, Video
} from 'lucide-react';
import { OfficialLogo } from './OfficialLogo';
import { BankAccountsCard } from './BankAccountsCard';
import { Halqa, HalqaCategory, UserProfile } from '../types';
import { ActiveTab } from './Navigation';

interface HalawatViewProps {
  halawat: Halqa[];
  user: UserProfile;
  onToggleEnroll: (halqaId: string) => void;
  onJoinLiveRoom: (halqa: Halqa) => void;
  onOpenFemaleSection?: () => void;
  onOpenStudentsSection?: () => void;
  onOpenTeacherRegistration?: () => void;
  onOpenRegistration?: (type?: 'male' | 'female' | 'teacher') => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const HalawatView: React.FC<HalawatViewProps> = ({
  halawat,
  user,
  onToggleEnroll,
  onJoinLiveRoom,
  onOpenFemaleSection,
  onOpenStudentsSection,
  onOpenTeacherRegistration,
  onOpenRegistration,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HalqaCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHalqaDetail, setSelectedHalqaDetail] = useState<Halqa | null>(null);

  const filteredHalawat = halawat.filter((h) => {
    let matchesCategory = true;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'female_section') {
      matchesCategory = h.isFemaleSection === true;
    } else if (selectedCategory === 'correction' || (selectedCategory as string) === 'tashih') {
      matchesCategory = (h.category === 'correction' || (h.category as string) === 'tashih' || h.classification === 'tashih' || h.title.includes('تصحيح') || h.title.includes('مخارج')) && !h.isFemaleSection;
    } else if (selectedCategory === 'ashbal') {
      matchesCategory = (h.category === 'ashbal' || h.classification === 'ashbal' || h.title.includes('أشبال') || h.title.includes('أطفال') || h.title.includes('براعم')) && !h.isFemaleSection;
    } else {
      matchesCategory = h.category === selectedCategory && !h.isFemaleSection;
    }

    const matchesSearch =
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.sheikhName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.targetJuzOrSurah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: Halqa['category'], isFemale?: boolean) => {
    if (isFemale) {
      return {
        label: 'قسم الطالبات',
        className: 'bg-amber-950/70 text-amber-300 border-amber-500/50',
      };
    }
    switch (category) {
      case 'memorization':
        return {
          label: 'حلقة حفظ وتثبيت',
          className: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
        };
      case 'recitation':
        return {
          label: 'حلقة تلاوة وتدبر',
          className: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
        };
      case 'correction':
      case 'tashih':
        return {
          label: 'تصحيح التلاوة',
          className: 'bg-teal-950/60 text-teal-300 border-teal-800/50',
        };
      case 'ashbal':
        return {
          label: 'حلقة الأشبال أطفال',
          className: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
        };
      case 'revision':
        return {
          label: 'حلقة مراجعة',
          className: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
        };
      case 'ijazah':
        return {
          label: 'حلقة إجازة بالسند',
          className: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
        };
      default:
        return {
          label: 'حلقة قرآنية معتمدة',
          className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
        };
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Official Academy Hero Banner with Prominent Official Logo */}
      <div className="rounded-3xl bg-gradient-to-b sm:bg-gradient-to-r from-[#0d261a] via-[#102d1f] to-[#0a1e15] p-4 sm:p-6 border-2 border-emerald-700/60 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          
          {/* Prominent Official Logo Showcase (شعار مقرأة رحاب القرآن الإلكترونية البارز) */}
          <div className="w-full sm:w-auto flex justify-center shrink-0">
            <OfficialLogo 
              size="md" 
              variant="icon" 
              clickable={false} 
              className="drop-shadow-2xl" 
            />
          </div>

          {/* Academy Identity & Call to Action */}
          <div className="flex-1 text-center sm:text-right space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>الشعار الرسمي المعتمد • مقرأة رحاب القرآن الإلكترونية</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide leading-snug">
              عطاء مستمر في إقراء وتعليم كتاب الله تعالى عن بُعد
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              مشروع قرآني تعليمي يهدف إلى تيسير حفظ القرآن الكريم وضبط تلاوته بأحكام التجويد، وتقديم الإجازات القرآنية بالسند المتصل إلى رسول الله صلى الله عليه وسلم بإشراف نخبة من المعلمين والمعلمات المجازين.
            </p>

            {/* Quick Hero Registration CTAs */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
              {onOpenRegistration && (
                <>
                  <button
                    onClick={() => onOpenRegistration('male')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/60"
                  >
                    <span>تسجيل الطلاب (بنين)</span>
                  </button>
                  <button
                    onClick={() => onOpenRegistration('female')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/60"
                  >
                    <span>تسجيل الطالبات (بنات)</span>
                  </button>
                  <button
                    onClick={() => onOpenRegistration('teacher')}
                    className="px-3 py-2 rounded-xl bg-[#081810] hover:bg-[#0f2e20] text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>انضمام كمعلم / معلمة</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Islamic Star Pattern watermark */}
        <div className="absolute left-2 -bottom-6 opacity-10 pointer-events-none text-emerald-400">
          <svg className="w-48 h-48" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="50 0, 62 38, 100 50, 62 62, 50 100, 38 62, 0 50, 38 38" />
            <polygon points="50 10, 60 40, 90 50, 60 60, 50 90, 40 60, 10 50, 40 40" opacity="0.6"/>
          </svg>
        </div>
      </div>

      {/* 
        ========================================================================
        TWO MAIN INDEPENDENT SECTIONS (قسم الطلاب & قسم الطالبات)
        ========================================================================
      */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>الأقسام الرئيسية المستقلة بالمقرأة:</span>
          </h2>
          <span className="text-[11px] text-slate-400">بنين وبنات</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Main Independent Section 1: قسم الطلاب (بنين) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0c2419] via-[#0f2e20] to-[#071710] p-4 sm:p-5 border-2 border-emerald-500/80 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="space-y-3 relative z-10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-lg shadow-inner">
                    📖
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">قسم الطلاب (بنين)</h3>
                    <span className="text-[10px] bg-emerald-950 text-amber-300 border border-amber-500/50 px-2.5 py-0.5 rounded-full font-bold inline-block mt-0.5">
                      بإشراف: إدارة قسم الطلاب
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-xl border border-emerald-800">
                  قسم مستقل
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                حلقات حفظ وتلاوة وإجازة بالسند المتصل بمتابعة يومية مباشرة، بموعد فجري منتظم ورابط Google Meet مباشر.
              </p>

              {/* Timing and WhatsApp Details */}
              <div className="p-2.5 rounded-xl bg-[#06150e] border border-emerald-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold">
                  <span>⏰ الموعد اليومي:</span>
                  <span className="text-white font-mono">05:00 ص - 06:30 ص</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>📅 أيام الانعقاد:</span>
                  <span className="text-emerald-300 font-semibold">جميع أيام الأسبوع ما عدا الجمعة</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-900/60">
                  <span className="text-slate-400">قناة التواصل الرسمية:</span>
                  <span className="text-emerald-300 font-semibold">واتساب قسم الطلاب المباشر</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-emerald-900/60 flex items-center gap-2 flex-wrap relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (onOpenStudentsSection) onOpenStudentsSection();
                  else if (onNavigateTab) onNavigateTab('students_section');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/80 min-w-[140px]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>دخول قسم الطلاب</span>
              </button>

              <a
                href="https://meet.google.com/fid-iqwm-zxm"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                title="رابط مباشر للانضمام عبر Google Meet"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Google Meet</span>
              </a>

              <a
                href="https://wa.me/967714371599?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D9%81%D9%8A%20%D8%AD%D9%84%D9%82%D8%A9%20%D9%82%D8%B3%D9%85%20%D8%A7%D9%84%D8%B7%D9%84%D8%A7%D8%A8%20%D8%A8%D9%85%D9%82%D8%B1%D8%A3%D8%A9%20%D8%B1%D8%AD%D8%A7%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20-%20%D9%85%D9%88%D8%B9%D8%AF%2005:00%20%D8%B5%20%D8%A5%D9%84%D9%89%2006:30%20%D8%B5."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#06150e] hover:bg-[#0c2419] text-emerald-300 border border-emerald-700/60 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="واتساب الطلاب المباشر"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>

          {/* Main Independent Section 2: قسم الطالبات */}
          <div className="rounded-3xl bg-gradient-to-br from-[#1c2c22] via-[#163324] to-[#0c1e15] p-4 sm:p-5 border-2 border-amber-500/70 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="space-y-3 relative z-10">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 text-lg shadow-inner">
                    🌸
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-serif">قسم الطالبات</h3>
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-bold inline-block mt-0.5">
                      بإشراف: إدارة قسم الطالبات
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-1 rounded-xl border border-amber-800">
                  قسم مستقل
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                بيئة قرآنية خاصة بالأخوات والفتيات لحفظ كتاب الله وضبط مخارج الحروف وأحكام التجويد مع كامل الخصوصية والأمان.
              </p>

              {/* Schedule time & Google Meet indication */}
              <div className="p-2 rounded-xl bg-[#091e13] border border-amber-500/40 text-[11px] space-y-1 text-slate-200">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>الموعد: 4:00 عصراً - 6:00 مساءً</span>
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700/50">
                    يومياً عدا الجمعة
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Video className="w-3 h-3 text-emerald-400" />
                    <span>مباشر عبر Google Meet</span>
                  </span>
                  <span className="text-amber-300 font-semibold">واتساب الطالبات المباشر</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-amber-900/60 flex flex-wrap items-center gap-2 relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (onOpenFemaleSection) onOpenFemaleSection();
                  else if (onNavigateTab) onNavigateTab('female_section');
                }}
                className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/80"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>دخول قسم الطالبات</span>
              </button>

              <a
                href="https://meet.google.com/zdz-zcmn-ium"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#081b12] hover:bg-[#103021] text-amber-300 border border-amber-500/50 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="الانضمام المباشر عبر Google Meet"
              >
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Google Meet</span>
                <span className="sm:hidden">Meet</span>
              </a>

              <a
                href="https://wa.me/967711607573?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D9%81%D9%8A%20%D9%82%D8%B3%D9%85%20%D8%A7%D9%84%D8%B7%D8%A7%D9%84%D8%A8%D8%A7%D8%AA%20%D8%A8%D9%85%D9%82%D8%B1%D8%A3%D8%A9%20%D8%B1%D8%AD%D8%A7%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85%20%D8%A8%D8%A5%D8%B4%D8%B1%D8%A7%D9%81%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D8%A9%20%D9%84%D9%85%D9%8A%D8%A7%D8%A1%20%D8%A7%D9%84%D8%AD%D9%85%D9%8A%D8%AF%D9%8A."
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#08170f] hover:bg-[#10291b] text-amber-300 border border-amber-700/60 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                title="واتساب الطالبات المباشر"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        NEW PROMINENT SECTION & INTERACTIVE BUTTON: تسجيل المعلمين
        ========================================================================
      */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2318] via-[#0f3323] to-[#081b12] p-4 sm:p-5 border-2 border-teal-500/60 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center text-teal-300 shrink-0 shadow-inner">
              <GraduationCap className="w-6 h-6 text-teal-300" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white font-serif">
                  قسم تسجيل وانضمام المعلمين والمعلمات
                </h3>
                <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold">
                  بوابة الكادر التعليمي
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xl">
                نموذج تسجيل إلكتروني للمقرئين والمجازين يطلب البيانات الأساسية: (الاسم الكامل، التخصص أو القراءات المجاز بها، البلد، وسائل التواصل، وخبرة التدريس) مع زر إرسال مباشر عبر الواتساب.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                if (onOpenTeacherRegistration) onOpenTeacherRegistration();
                else if (onNavigateTab) onNavigateTab('teacher_reg');
              }}
              className="flex-1 md:flex-initial py-3 px-5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-950/70"
            >
              <GraduationCap className="w-4 h-4 text-slate-950" />
              <span>تسجيل المعلمين (النموذج والإرسال)</span>
            </button>

            <a
              href="https://wa.me/967714371599?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%88%D8%B1%D8%AD%D9%85%D8%A9%20%D8%A7%D9%84%D9%84%D9%87%20%D9%88%D8%A8%D8%B1%D9%83%D8%A7%D8%AA%D9%87%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%A7%D9%84%D8%A7%D9%86%D8%B6%D9%85%D8%A7%D9%85%20%D9%84%D9%83%D8%A7%D8%AF%D8%B1%20%D8%A7%D9%84%D9%85%D8%B9%D9%84%D9%85%D9%8A%D9%86%20%D8%A8%D9%85%D9%82%D8%B1%D8%A3%D8%A9%20%D8%B1%D8%AD%D8%A7%D8%A8%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86%20%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A%D8%A9."
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-2xl bg-[#06150e] hover:bg-[#0c2419] text-teal-300 border border-teal-700/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              title="واتساب مباشر للإدارة"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">واتساب الإدارة</span>
            </a>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        BALANCED QUICK-ACCESS GRID FOR ALL APP SECTIONS (الحلقات، الجدول، التسجيل، التجويد، حسابي)
        ========================================================================
      */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>بقية أقسام التطبيق:</span>
          </h2>
          <span className="text-[11px] text-slate-400">تصفح سريع ومتوازن</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {/* Section: الحلقات */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              if (onNavigateTab) onNavigateTab('halawat');
            }}
            className="p-3 rounded-2xl bg-[#091d13] border border-emerald-800/80 hover:border-emerald-500 hover:bg-[#0d2a1b] transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-white">الحلقات</span>
            <span className="text-[10px] text-slate-400">جميع الحلقات القرآنية</span>
          </button>

          {/* Section: الجدول */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('schedule')}
            className="p-3 rounded-2xl bg-[#091d13] border border-emerald-800/80 hover:border-emerald-500 hover:bg-[#0d2a1b] transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-white">الجدول</span>
            <span className="text-[10px] text-slate-400">مواعيد وفترات الحلقات</span>
          </button>

          {/* Section: التسجيل (التسميع الصوتي) */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('recorder')}
            className="p-3 rounded-2xl bg-[#091d13] border border-emerald-800/80 hover:border-emerald-500 hover:bg-[#0d2a1b] transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-white">التسجيل</span>
            <span className="text-[10px] text-slate-400">التسميع الصوتي والمراجعة</span>
          </button>

          {/* Section: التجويد */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('tajweed')}
            className="p-3 rounded-2xl bg-[#091d13] border border-emerald-800/80 hover:border-emerald-500 hover:bg-[#0d2a1b] transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-white">التجويد</span>
            <span className="text-[10px] text-slate-400">أحكام ومخارج الحروف</span>
          </button>

          {/* Section: حسابي */}
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('profile')}
            className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-[#091d13] border border-emerald-800/80 hover:border-emerald-500 hover:bg-[#0d2a1b] transition-all cursor-pointer flex flex-col items-center text-center gap-1.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-white">حسابي</span>
            <span className="text-[10px] text-slate-400">الملف الشخصي والمتابعة</span>
          </button>
        </div>
      </div>

      {/* Official Academy Bank Accounts Card */}
      <BankAccountsCard />

      {/* Search & Filter Section */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث عن حلقة، اسم الشيخ، سورة، أو كلمة مفتاحية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#0e2118] border border-emerald-900/70 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-emerald-400" />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all' as HalqaCategory, label: 'جميع الحلقات' },
            { id: 'female_section' as HalqaCategory, label: 'قسم الطالبات' },
            { id: 'memorization' as HalqaCategory, label: 'حلقات الحفظ (تحفيظ وتثبيت)' },
            { id: 'recitation' as HalqaCategory, label: 'حلقات التلاوة (تدبر وترتيل)' },
            { id: 'correction' as HalqaCategory, label: 'تصحيح التلاوة' },
            { id: 'ashbal' as HalqaCategory, label: 'حلقة الأشبال أطفال' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat.id
                  ? cat.id === 'female_section'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-950'
                  : 'bg-[#0f231a] text-slate-300 border-emerald-900/60 hover:border-emerald-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Halawat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredHalawat.map((halqa) => {
          const isEnrolled = user.enrolledHalqaIds.includes(halqa.id);
          const badge = getCategoryBadge(halqa.category, halqa.isFemaleSection);

          return (
            <div
              key={halqa.id}
              className={`rounded-2xl p-4 bg-[#0e2118]/90 border transition-all duration-200 flex flex-col justify-between hover:border-emerald-600/60 shadow-sm ${
                isEnrolled ? 'border-emerald-600/80 bg-[#0e251a]' : 'border-emerald-900/50'
              }`}
            >
              <div>
                {/* Header Row: Category Badge + Live indicator */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                    {badge.label}
                  </span>

                  {halqa.isLiveNow ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-full animate-pulse">
                      <Radio className="w-3 h-3 text-red-400" />
                      مباشر الآن
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {halqa.days.length} أيام أسبوعياً
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-base text-white mb-1.5 leading-snug">
                  {halqa.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                  {halqa.description}
                </p>

                {/* Sheikh / Teacher details */}
                <div className="flex items-center gap-2 mb-3 bg-[#0a1812] p-2.5 rounded-xl border border-emerald-950">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                    halqa.isFemaleSection 
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300' 
                      : 'bg-emerald-800/60 border-emerald-700/60 text-amber-300'
                  }`}>
                    {halqa.isFemaleSection ? 'ل' : (halqa.sheikhName.charAt(6) || 'ش')}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{halqa.sheikhName}</p>
                    <p className="text-[10px] text-emerald-400/80 truncate">{halqa.sheikhTitle}</p>
                  </div>
                </div>

                {/* Meta details: Time, Target, Capacity */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-3">
                  <div className="flex items-center gap-1.5 bg-[#0b1b13] px-2.5 py-1.5 rounded-lg border border-emerald-950">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{halqa.scheduleTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0b1b13] px-2.5 py-1.5 rounded-lg border border-emerald-950">
                    <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{halqa.targetJuzOrSurah}</span>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      المقاعد المحجوزة
                    </span>
                    <span className="font-semibold text-emerald-300">
                      {halqa.enrolledCount} / {halqa.capacity}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${Math.min(100, (halqa.enrolledCount / halqa.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {halqa.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-[#091710] text-emerald-400/80 border border-emerald-950">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-emerald-900/40">
                {/* If female section with WhatsApp registration, show direct WhatsApp action */}
                {halqa.isFemaleSection ? (
                  <a
                    href={`https://wa.me/967711607573?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في (${halqa.title}) بمقرأة رحاب القرآن الإلكترونية.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-slate-950 text-amber-500" />
                    <span>تسجيل طالبات مباشرة عبر الواتساب</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/967714371599?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في (${halqa.title}) بمقرأة رحاب القرآن الإلكترونية.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#0b2419] hover:bg-[#0f2e20] text-emerald-300 border border-emerald-800/80 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-emerald-400 text-slate-950" />
                    <span>تسجيل طلاب مباشرة عبر الواتساب</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                )}

                <div className="flex items-center gap-2">
                  {halqa.isLiveNow && (
                    <button
                      onClick={() => onJoinLiveRoom(halqa)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 transition-all cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-spin" />
                      دخول المقرأة المباشرة
                    </button>
                  )}

                  <button
                    onClick={() => onToggleEnroll(halqa.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isEnrolled
                        ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-700/60 hover:bg-emerald-800/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950'
                    }`}
                  >
                    {isEnrolled ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        أنت مسجل بالحلقة
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        انضمام للحلقة
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedHalqaDetail(halqa)}
                    className="py-2 px-3 rounded-xl bg-[#091710] hover:bg-emerald-950 text-emerald-300 border border-emerald-900 text-xs transition-all cursor-pointer"
                    title="تفاصيل الحلقة والمنهج"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Modal for Halqa Curriculum & Teacher Info */}
      {selectedHalqaDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0b1c14] border border-emerald-700/80 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-900">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadge(selectedHalqaDetail.category, selectedHalqaDetail.isFemaleSection).className}`}>
                {getCategoryBadge(selectedHalqaDetail.category, selectedHalqaDetail.isFemaleSection).label}
              </span>
              <button
                onClick={() => setSelectedHalqaDetail(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-950 rounded-lg cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {selectedHalqaDetail.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedHalqaDetail.description}
              </p>
            </div>

            {/* Sheikh / Teacher details */}
            <div className="bg-[#081810] p-3 rounded-2xl border border-emerald-950 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-sm">
                {selectedHalqaDetail.isFemaleSection ? 'ل' : (selectedHalqaDetail.sheikhName.charAt(6) || 'ش')}
              </div>
              <div>
                <p className="font-bold text-xs text-white">{selectedHalqaDetail.sheikhName}</p>
                <p className="text-[11px] text-emerald-400">{selectedHalqaDetail.sheikhTitle}</p>
              </div>
            </div>

            {/* WhatsApp Registration CTA inside modal */}
            {selectedHalqaDetail.isFemaleSection ? (
              <a
                href={`https://wa.me/967711607573?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في (${selectedHalqaDetail.title}) بمقرأة رحاب القرآن الإلكترونية.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>تسجيل واستفسار الطالبات مباشرة عبر الواتساب</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : (
              <a
                href={`https://wa.me/967714371599?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته،\nأرغب بالتسجيل في (${selectedHalqaDetail.title}) بمقرأة رحاب القرآن الإلكترونية.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0e2c1f] hover:bg-[#133b2a] text-emerald-300 border border-emerald-700/70 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-400 text-slate-950" />
                <span>تسجيل واستفسار الطلاب مباشرة عبر الواتساب</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#081810] rounded-xl border border-emerald-950">
                <span className="text-slate-400 block text-[10px]">الموعد الأسبوعي</span>
                <span className="font-semibold text-white mt-0.5 block">{selectedHalqaDetail.scheduleTime}</span>
              </div>
              <div className="p-2.5 bg-[#081810] rounded-xl border border-emerald-950">
                <span className="text-slate-400 block text-[10px]">المستوى المطلوب</span>
                <span className="font-semibold text-emerald-300 mt-0.5 block">{selectedHalqaDetail.levelName}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-900/60 flex items-center gap-2">
              <button
                onClick={() => {
                  onToggleEnroll(selectedHalqaDetail.id);
                  setSelectedHalqaDetail(null);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {user.enrolledHalqaIds.includes(selectedHalqaDetail.id)
                  ? 'إلغاء التسجيل من الحلقة'
                  : 'تأكيد التسجيل في الحلقة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
