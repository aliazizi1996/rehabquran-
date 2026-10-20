/**
 * إعدادات التصميم والتواصل الرسمية لمقرأة رحاب القرآن الإلكترونية
 * متوافقة مع دليل الهوية البصرية 2026
 */

export interface SocialLinkItem {
  id: string;
  platform: 'facebook' | 'instagram' | 'whatsapp' | 'telegram' | 'youtube' | 'x' | 'tiktok' | 'other';
  label: string;
  url: string;
  description?: string;
  enabled: boolean;
  order: number;
}

export type CardGridDensity = 'compact' | 'comfortable' | 'spacious';
export type CardVisualTheme = 'heritage' | 'emerald_classic' | 'modern_minimal';
export type LessonViewMode = 'grid' | 'cards' | 'grouped_by_level' | 'accordion';
export type MutunCardStyle = 'detailed' | 'compact' | 'banner';
export type ExamBadgeDisplay = 'badge' | 'score_only' | 'hidden';

export interface DesignAndCommunicationSettings {
  // 1. نظام شبكة البطاقات للوحة الطالب (Student Dashboard Grid System)
  studentDashboard: {
    gridDensity: CardGridDensity; // كثافة وتراص البطاقات
    visualTheme: CardVisualTheme; // نمط الهوية للبطاقات
    mobileColumns: 1 | 2; // أعمدة الجوال (1 أو 2)
    tabletColumns: 2 | 3; // أعمدة التابلت (2 أو 3)
    desktopColumns: 3 | 4; // أعمدة الشاشات الكبيرة والحاسوب (3 أو 4)
    showIcons: boolean; // إظهار الأيقونات التعبيرية في البطاقات
    showProgressBars: boolean; // إظهار أشرطة التقدم التفاعلية
    showQuickStats: boolean; // إظهار إحصاءات الإنجاز في رأس كل بطاقة
    cardBorderHighlight: boolean; // إطار ذهبي ناعم مع تفاعل التحويم
  };

  // 2. نظام شبكة البطاقات للوحة المعلم (Teacher Dashboard Grid System)
  teacherDashboard: {
    gridDensity: CardGridDensity;
    visualTheme: CardVisualTheme;
    mobileColumns: 1 | 2;
    tabletColumns: 2 | 3;
    desktopColumns: 3 | 4;
    showStudentPhotosOrAvatars: boolean;
    showDailyAttendanceCounter: boolean;
    showQuickRecitationButtons: boolean;
  };

  // 3. طريقة عرض دروس التجويد والمتون وشروحها واختباراتها الأسبوعية
  curriculumDisplay: {
    tajweedViewMode: LessonViewMode; // طريقة سرد وعرض دروس التجويد
    showTajweedAudioPlayer: boolean; // مشغل التلاوة الصوتي السريع في قائمة الدروس
    tajweedCardsPerRow: 1 | 2 | 3; // عدد بطاقات الدروس بالصف في التجويد
    
    // المتون وشروحها
    mutunViewStyle: MutunCardStyle; // أسلوب بطاقات المتون (مفصل أو مقتضب)
    mutunShowVersesCount: boolean; // إظهار عداد الأبيات
    mutunShowExplanationExcerpt: boolean; // إظهار مقتطف من الشرح الإجمالي في البطاقة
    mutunShowAudioBadge: boolean; // إظهار شارة الاستماع الصوتي
    
    // الاختبارات الأسبوعية
    weeklyExamsDisplay: ExamBadgeDisplay; // عرض مؤشرات الاختبارات الأسبوعية
    highlightPendingExams: boolean; // تمييز الاختبارات الأسبوعية المستحقة بلون ذهبي
    showExamDirectLaunchButton: boolean; // زر مباشر لبدء الاختبار السريع من البطاقة
  };

  // 4. قنوات وروابط التواصل الاجتماعي المخصصة (إضافة، تعديل، حذف، ترتيب)
  socialLinks: SocialLinkItem[];

  // 5. بريد التواصل الرسمي للمقرأة واستفسارات الزوار
  contactEmail: string; // البريد الرسمي المخصص لاستقبال الرسائل والتواصل العام
  contactPhone: string; // رقم هاتف المقرأة الرسمي
  whatsappNumber: string; // رقم الواتساب المباشر للرد والاستفسارات
  supportWorkingHours: string; // أوقات عمل الدعم والتواصل المعتمدة

  // بيانات التحديث والتدقيق
  lastUpdated: number;
  updatedBy?: string;
  version: number;
}

export const DEFAULT_DESIGN_AND_COMMUNICATION_SETTINGS: DesignAndCommunicationSettings = {
  studentDashboard: {
    gridDensity: 'comfortable',
    visualTheme: 'heritage',
    mobileColumns: 2,
    tabletColumns: 3,
    desktopColumns: 3,
    showIcons: true,
    showProgressBars: true,
    showQuickStats: true,
    cardBorderHighlight: true,
  },
  teacherDashboard: {
    gridDensity: 'comfortable',
    visualTheme: 'heritage',
    mobileColumns: 2,
    tabletColumns: 3,
    desktopColumns: 4,
    showStudentPhotosOrAvatars: true,
    showDailyAttendanceCounter: true,
    showQuickRecitationButtons: true,
  },
  curriculumDisplay: {
    tajweedViewMode: 'grid',
    showTajweedAudioPlayer: true,
    tajweedCardsPerRow: 2,
    mutunViewStyle: 'detailed',
    mutunShowVersesCount: true,
    mutunShowExplanationExcerpt: true,
    mutunShowAudioBadge: true,
    weeklyExamsDisplay: 'badge',
    highlightPendingExams: true,
    showExamDirectLaunchButton: true,
  },
  socialLinks: [
    {
      id: 'wa-channel',
      platform: 'whatsapp',
      label: 'قناة الواتساب الرسمية',
      url: 'https://whatsapp.com/channel/0029Vb4RehabQuran',
      description: 'إعلانات وتنبيهات الحلقات والتسجيل',
      enabled: true,
      order: 1,
    },
    {
      id: 'wa-direct',
      platform: 'whatsapp',
      label: 'واتساب خدمة المستفيدين والتسجيل',
      url: 'https://wa.me/967714371599',
      description: 'للتواصل الفوري والاستفسارات العامة',
      enabled: true,
      order: 2,
    },
    {
      id: 'telegram',
      platform: 'telegram',
      label: 'قناة التيليجرام الرسمية',
      url: 'https://t.me/rehabpa',
      description: 'تسجيلات وتلاوات المقرأة ومذكرات التجويد',
      enabled: true,
      order: 3,
    },
    {
      id: 'facebook',
      platform: 'facebook',
      label: 'صفحة الفيسبوك المعتمدة',
      url: 'https://www.facebook.com/profile.php?id=61594338165497',
      description: 'أخبار وفعاليات ومخرجات المقرأة',
      enabled: true,
      order: 4,
    },
    {
      id: 'instagram',
      platform: 'instagram',
      label: 'حساب الإنستجرام',
      url: 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4',
      description: 'مرئيات ومقاطع تلاوات الطلاب والختمات',
      enabled: true,
      order: 5,
    },
    {
      id: 'youtube',
      platform: 'youtube',
      label: 'قناة اليوتيوب الرسمية',
      url: 'https://www.youtube.com/@RehabQuran-s5m',
      description: 'تسجيلات الختمات وتلاوات الحلقات والدروس المرئية',
      enabled: true,
      order: 6,
    },
    {
      id: 'tiktok',
      platform: 'tiktok',
      label: 'حساب تيك توك الرسمي',
      url: 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/',
      description: 'مقاطع التلاوات والوقفات التجويدية القصيرة',
      enabled: true,
      order: 7,
    },
  ],
  contactEmail: 'rehabquran383@gmail.com',
  contactPhone: '+967 714 371 599',
  whatsappNumber: '+967 714 371 599',
  supportWorkingHours: 'على مدار الساعة - متابعة إدارية يومياً 8 صباحاً حتى 10 مساءً',
  lastUpdated: Date.now(),
  updatedBy: 'الإدارة العامة',
  version: 1,
};
