import React from 'react';
import { 
  Users, Sparkles, BookOpen, Calendar, GraduationCap, 
  Mic, Award, User, UserCheck, ClipboardCheck, FileCheck, Trophy, Shield, LogIn, Headphones
} from 'lucide-react';

export type ActiveTab = 
  | 'supervisor_dashboard'
  | 'students_section' 
  | 'female_section' 
  | 'honor_board'
  | 'quran_audio'
  | 'difficult_words'
  | 'tajweed'
  | 'teacher_log'
  | 'certificates'
  | 'halawat' 
  | 'registered_students'
  | 'schedule' 
  | 'teacher_reg' 
  | 'recorder' 
  | 'wird'
  | 'login'
  | 'profile';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReviewsCount: number;
  registeredStudentsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewsCount,
  registeredStudentsCount = 0,
}) => {
  // Balanced navigation items requested by the user
  const navItems: { 
    id: ActiveTab; 
    label: string; 
    subLabel?: string;
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number | string;
    colorVariant?: 'emerald' | 'amber' | 'teal';
  }[] = [
    { 
      id: 'supervisor_dashboard', 
      label: 'لوحة المشرف', 
      subLabel: 'إدارة وقبول وحضور',
      icon: Shield,
      colorVariant: 'amber'
    },
    { 
      id: 'students_section', 
      label: 'قسم الطلاب', 
      subLabel: 'حلقات البنين',
      icon: Users,
      colorVariant: 'emerald'
    },
    { 
      id: 'female_section', 
      label: 'قسم الطالبات', 
      subLabel: 'حلقات الأخوات',
      icon: Sparkles, 
      colorVariant: 'amber' 
    },
    { 
      id: 'honor_board', 
      label: 'لوحة الشرف', 
      subLabel: 'المتفوقون',
      icon: Trophy, 
      colorVariant: 'amber' 
    },
    { 
      id: 'quran_audio', 
      label: 'المصحف المعلم', 
      subLabel: 'استماع وترديد',
      icon: Headphones, 
      colorVariant: 'emerald' 
    },
    { 
      id: 'difficult_words', 
      label: 'الكلمات الصعبة', 
      subLabel: 'تدريب النطق',
      icon: Mic,
      colorVariant: 'amber'
    },
    { 
      id: 'tajweed', 
      label: 'دروسي', 
      subLabel: 'المسار المتدرج',
      icon: GraduationCap,
      colorVariant: 'emerald'
    },
    { 
      id: 'teacher_log', 
      label: 'سجل المتابعة', 
      subLabel: 'لوحة المعلم',
      icon: ClipboardCheck,
      colorVariant: 'emerald'
    },
    { 
      id: 'certificates', 
      label: 'الشهادات', 
      subLabel: 'الإنجازات',
      icon: Award,
      colorVariant: 'amber'
    },
    { 
      id: 'halawat', 
      label: 'الحلقات', 
      icon: BookOpen,
      colorVariant: 'emerald'
    },
    { 
      id: 'registered_students', 
      label: 'سجل الطلاب', 
      subLabel: 'المسجلون',
      icon: UserCheck,
      badge: registeredStudentsCount > 0 ? registeredStudentsCount : undefined,
      colorVariant: 'amber'
    },
    { 
      id: 'schedule', 
      label: 'الجدول', 
      icon: Calendar,
      colorVariant: 'emerald'
    },
    { 
      id: 'teacher_reg', 
      label: 'المعلمون', 
      icon: GraduationCap,
      colorVariant: 'teal'
    },
    { 
      id: 'login', 
      label: 'تسجيل الدخول', 
      subLabel: 'حساب جديد / دخول',
      icon: LogIn, 
      colorVariant: 'amber' 
    },
    { 
      id: 'profile', 
      label: 'حسابي', 
      icon: User,
      colorVariant: 'emerald'
    },
  ];


  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#091b12]/98 backdrop-blur-md border-t-2 border-emerald-800/80 shadow-2xl max-w-lg mx-auto md:max-w-none md:sticky md:bottom-0">
      <div className="w-full max-w-4xl mx-auto px-1 py-1.5 flex items-center justify-between gap-0.5 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Color themes for active and inactive states
          const activeBg = 
            item.colorVariant === 'amber' 
              ? 'bg-amber-500/25 text-amber-300 border border-amber-400/50 shadow-inner'
              : item.colorVariant === 'teal'
                ? 'bg-teal-500/25 text-teal-300 border border-teal-400/50 shadow-inner'
                : 'bg-emerald-700/60 text-emerald-200 border border-emerald-500/40 shadow-inner';

          const activeText =
            item.colorVariant === 'amber'
              ? 'text-amber-300 font-black'
              : item.colorVariant === 'teal'
                ? 'text-teal-300 font-black'
                : 'text-emerald-300 font-black';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 min-w-[46px] sm:min-w-[62px] py-1.5 px-0.5 flex flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none ${
                isActive ? 'scale-[1.03]' : 'opacity-80 hover:opacity-100'
              }`}
              title={item.subLabel ? `${item.label} (${item.subLabel})` : item.label}
            >
              {/* Pill Container */}
              <div className={`relative flex items-center justify-center w-8 sm:w-10 h-7.5 rounded-full transition-all duration-200 ${
                isActive ? activeBg : 'bg-transparent text-slate-400'
              }`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label Text */}
              <span className={`text-[11px] sm:text-xs mt-1 tracking-tight text-center truncate max-w-full leading-tight font-medium ${
                isActive ? activeText : 'text-slate-300'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
