import { Halqa, DailySession, TajweedTopic, UserProfile, AudioSubmission, AttendanceRecord } from '../types';

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  totalAyahs: number;
  type: 'مكية' | 'مدنية';
}

export const SURAHS_LIST: SurahMeta[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatihah", totalAyahs: 7, type: "مكية" },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", totalAyahs: 286, type: "مدنية" },
  { number: 3, name: "آل عمران", englishName: "Ali 'Imran", totalAyahs: 200, type: "مدنية" },
  { number: 4, name: "النساء", englishName: "An-Nisa", totalAyahs: 176, type: "مدنية" },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", totalAyahs: 120, type: "مدنية" },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", totalAyahs: 165, type: "مكية" },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", totalAyahs: 206, type: "مكية" },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", totalAyahs: 75, type: "مدنية" },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", totalAyahs: 129, type: "مدنية" },
  { number: 10, name: "يونس", englishName: "Yunus", totalAyahs: 109, type: "مكية" },
  { number: 11, name: "هود", englishName: "Hud", totalAyahs: 123, type: "مكية" },
  { number: 12, name: "يوسف", englishName: "Yusuf", totalAyahs: 111, type: "مكية" },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", totalAyahs: 43, type: "مدنية" },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", totalAyahs: 52, type: "مكية" },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", totalAyahs: 99, type: "مكية" },
  { number: 16, name: "النحل", englishName: "An-Nahl", totalAyahs: 128, type: "مكية" },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", totalAyahs: 111, type: "مكية" },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", totalAyahs: 110, type: "مكية" },
  { number: 19, name: "مريم", englishName: "Maryam", totalAyahs: 98, type: "مكية" },
  { number: 20, name: "طه", englishName: "Taha", totalAyahs: 135, type: "مكية" },
  { number: 36, name: "يس", englishName: "Ya-Sin", totalAyahs: 83, type: "مكية" },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", totalAyahs: 78, type: "مدنية" },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", totalAyahs: 96, type: "مكية" },
  { number: 67, name: "الملك", englishName: "Al-Mulk", totalAyahs: 30, type: "مكية" },
  { number: 78, name: "النبأ", englishName: "An-Naba", totalAyahs: 40, type: "مكية" },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", totalAyahs: 46, type: "مكية" },
  { number: 80, name: "عبس", englishName: "Abasa", totalAyahs: 42, type: "مكية" },
  { number: 81, name: "التكوير", englishName: "At-Takwir", totalAyahs: 29, type: "مكية" },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", totalAyahs: 19, type: "مكية" },
  { number: 93, name: "الضحى", englishName: "Ad-Duha", totalAyahs: 11, type: "مكية" },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", totalAyahs: 8, type: "مكية" },
  { number: 97, name: "القدر", englishName: "Al-Qadr", totalAyahs: 5, type: "مكية" },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", totalAyahs: 3, type: "مكية" },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", totalAyahs: 4, type: "مكية" },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", totalAyahs: 5, type: "مكية" },
  { number: 114, name: "الناس", englishName: "An-Nas", totalAyahs: 6, type: "مكية" }
];

export const INITIAL_HALAWAT: Halqa[] = [
  {
    id: "h-m1",
    title: "حلقة قسم الطلاب (حفظ وتثبيت القرآن وتصحيح التلاوة بالسند)",
    category: "memorization",
    description: "حلقة فجرية يومية مباركة مخصصة للطلاب، لحفظ وتثبيت كتاب الله وضبط مخارج الحروف والإتقان بالسند المتصل مباشرة عبر Google Meet.",
    sheikhName: "مشرف قسم الطلاب",
    sheikhTitle: "إدارة حلقات قسم الطلاب بمقرأة رحاب القرآن الإلكترونية",
    scheduleTime: "05:00 ص - 06:30 ص",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    capacity: 40,
    enrolledCount: 0,
    isLiveNow: true,
    targetJuzOrSurah: "حفظ وتثبيت ومراجعة القرآن الكريم وضبط التلاوة",
    levelName: "جميع مستويات الطلاب (بنين)",
    tags: ["قسم الطلاب", "5:00 ص - 6:30 ص", "Google Meet", "جميع أيام الأسبوع عدا الجمعة"],
    isMaleSection: true,
    supervisorWhatsapp: "+967 713 801 916",
    meetUrl: "https://meet.google.com/fid-iqwm-zxm",
    whatsappGroupUrl: "https://chat.whatsapp.com/GjZ8rehabQuranMale",
    whatsappGroupTitle: "مجموعة واتساب قسم الطلاب"
  },
  {
    id: "h-1",
    title: "حلقة الفجر لتثبيت حفظ القرآن (الماهر بالقرآن)",
    category: "memorization",
    description: "حلقة يومية بعد صلاة الفجر تعنى بتثبيت المحفوظ وإتقان الأجزاء ومراجعة خمسة أحزاب أسبوعياً بضبط متقن.",
    sheikhName: "الشيخ د. عبد الرحمن الشهري",
    sheikhTitle: "مقرئ مجاز بالقراءات العشر الصغرى والكبرى",
    scheduleTime: "05:15 ص - 06:45 ص",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء"],
    capacity: 25,
    enrolledCount: 22,
    isLiveNow: true,
    targetJuzOrSurah: "الأجزاء (1 - 10)",
    levelName: "متقدم (خاتمون وحَفَظة)",
    tags: ["حفظ مكثف", "تسميع غيبي", "فجر"],
    whatsappGroupUrl: "https://chat.whatsapp.com/GjZ8rehabQuranMale",
    whatsappGroupTitle: "مجموعة واتساب حلقة الماهر بالقرآن"
  },
  {
    id: "h-2",
    title: "مقرأة تصحيح التلاوة وضبط مخارج الحروف",
    category: "correction",
    description: "جلسات تصحيح فردية وجماعية تعنى بدقة النطق، ومخارج الحروف، وتفكيك الكلمات القرآنية المشكلة برواية حفص عن عاصم.",
    sheikhName: "الشيخ المقرئ معاذ بن يوسف",
    sheikhTitle: "أستاذ القراءات والتجويد بالجامعة الإسلامية",
    scheduleTime: "04:30 م - 06:00 م",
    days: ["الأحد", "الثلاثاء", "الخميس"],
    capacity: 20,
    enrolledCount: 16,
    isLiveNow: false,
    targetJuzOrSurah: "جزء عمّ وتبارك",
    levelName: "جميع المستويات",
    tags: ["تصحيح", "مخارج", "تجويد عملي"]
  },
  {
    id: "h-3",
    title: "حلقة التلاوة والتدبر القرآني (المسائية)",
    category: "recitation",
    description: "تلاوة مرتلة بالصوت الندي، مع وقفات تدبرية واستخراج الهدايات والفوائد الإيمانية مع شيخ الحلقة بعد صلاة العشاء.",
    sheikhName: "الشيخ أ.د. طارق السويداني",
    sheikhTitle: "عضو هيئة الإقراء والمجاز بالسند المتصل",
    scheduleTime: "08:30 م - 09:45 م",
    days: ["السبت", "الإثنين", "الأربعاء"],
    capacity: 35,
    enrolledCount: 31,
    isLiveNow: false,
    targetJuzOrSurah: "سورة الكهف ومريم",
    levelName: "متوسط وتدبر",
    tags: ["ترتيل", "تدبر", "أمسية قرآنية"]
  },
  {
    id: "h-4",
    title: "حلقة إتقان سورة البقرة وآل عمران (الزهراوان)",
    category: "memorization",
    description: "برنامج منهجي لحفظ وضبط السورتين العظيمتين مع بيان المتشابهات اللفظية وأسباب النزول.",
    sheikhName: "الشيخ إبراهيم الكردي",
    sheikhTitle: "مقرئ معتمد بالجمعية الخيرية لتحفيظ القرآن",
    scheduleTime: "06:30 م - 08:00 م",
    days: ["يومياً عدا الجمعة"],
    capacity: 30,
    enrolledCount: 27,
    isLiveNow: false,
    targetJuzOrSurah: "سورة البقرة وآل عمران",
    levelName: "متوسط إلى متقدم",
    tags: ["الزهراوان", "متشابهات", "حفظ جديد"]
  },
  {
    id: "h-5",
    title: "حلقة رواية ورش عن نافع من طريق الأزرق",
    category: "correction",
    description: "إقراء متخصص في أصول وفرش رواية ورش، مع تطبيقات عملية على تغليظ اللامات، وترقيق الراءات، وتقليل ذوات الياء.",
    sheikhName: "الشيخ محمد أمين التلمساني",
    sheikhTitle: "مقرئ بالمدرسة المغربية ومجاز بالقراءات السبع",
    scheduleTime: "09:00 ص - 10:30 ص",
    days: ["الإثنين", "الأربعاء"],
    capacity: 15,
    enrolledCount: 12,
    isLiveNow: false,
    targetJuzOrSurah: "من أول سورة الأنعام",
    levelName: "قراءات متخصصة",
    tags: ["رواية ورش", "قراءات", "إجازات"]
  },
  {
    id: "h-f1",
    title: "حلقة قسم الطالبات (حفظ وتثبيت القرآن وتصحيح التلاوة)",
    category: "memorization",
    description: "حلقة يومية مباركة للأخوات، لمدارسة وحفظ وتثبيت كتاب الله وتصحيح التلاوة وأحكام التجويد مباشرة عبر Google Meet.",
    sheikhName: "مشرفة قسم الطالبات",
    sheikhTitle: "إدارة حلقات الطالبات بمقرأة رحاب القرآن الإلكترونية",
    scheduleTime: "04:00 م - 06:00 م",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    capacity: 35,
    enrolledCount: 0,
    isLiveNow: true,
    targetJuzOrSurah: "سورة البقرة، آل عمران، وقصار السور",
    levelName: "جميع مستويات الطالبات (حفظ وتجويد)",
    tags: ["قسم الطالبات", "4:00 م - 6:00 م", "Google Meet", "يومياً عدا الجمعة"],
    isFemaleSection: true,
    supervisorWhatsapp: "+967 711 607 573",
    meetUrl: "https://meet.google.com/zdz-zcmn-ium",
    whatsappGroupUrl: "https://chat.whatsapp.com/L7KhrehabQuranFemale",
    whatsappGroupTitle: "مجموعة واتساب قسم الطالبات"
  },
  {
    id: "h-f2",
    title: "مقرأة الإتقان وتصحيح التلاوة وأحكام التجويد (للأخوات)",
    category: "correction",
    description: "تصحيح فردي للتلاوة ومخارج الحروف وصفاتها والمدود والغنن في أجواء نسائية مريحة وخاصة عبر Google Meet.",
    sheikhName: "مشرفة قسم الطالبات",
    sheikhTitle: "إدارة حلقات الطالبات بمقرأة رحاب القرآن الإلكترونية",
    scheduleTime: "04:00 م - 06:00 م",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
    capacity: 25,
    enrolledCount: 0,
    isLiveNow: true,
    targetJuzOrSurah: "الأجزاء الأخيرة (عمّ وتبارك)",
    levelName: "جميع مستويات الطالبات",
    tags: ["تصحيح نسائي", "Google Meet", "مخارج الحروف", "تجويد"],
    isFemaleSection: true,
    supervisorWhatsapp: "+967 711 607 573",
    meetUrl: "https://meet.google.com/zdz-zcmn-ium",
    whatsappGroupUrl: "https://chat.whatsapp.com/L7KhrehabQuranFemale",
    whatsappGroupTitle: "مجموعة واتساب مقرأة الإتقان للأخوات"
  },
  {
    id: "h-f3",
    title: "حلقة الأترجة للفتيات والناشئات (جزء عمّ والبراعم)",
    category: "memorization",
    description: "تلقين وتسميع محبب للناشئات والفتيات لغرس حب كتاب الله وضبط مخارج الحروف وقصار السور.",
    sheikhName: "مشرفة قسم الطالبات",
    sheikhTitle: "إدارة حلقات الطالبات بمقرأة رحاب القرآن الإلكترونية",
    scheduleTime: "05:30 م - 06:45 م",
    days: ["السبت", "الأحد", "الثلاثاء"],
    capacity: 20,
    enrolledCount: 0,
    isLiveNow: false,
    targetJuzOrSurah: "جزء عمّ كاملاً",
    levelName: "فتيات وبراعم",
    tags: ["ناشئات", "فتيات", "جزء عم"],
    isFemaleSection: true,
    supervisorWhatsapp: "+967 711 607 573",
    meetUrl: "https://meet.google.com/zdz-zcmn-ium",
    whatsappGroupUrl: "https://chat.whatsapp.com/L7KhrehabQuranFemale",
    whatsappGroupTitle: "مجموعة واتساب حلقة الأترجة للفتيات والبراعم"
  },
  {
    id: "h-f4",
    title: "حلقة التدبر والوقف والابتداء النسائية",
    category: "recitation",
    description: "مدارسة لطائف الآيات وهدايات السور مع تطبيق قواعد الوقف والابتداء وحسن الترتيل للأخوات.",
    sheikhName: "مشرفة قسم الطالبات",
    sheikhTitle: "إدارة حلقات الطالبات بمقرأة رحاب القرآن الإلكترونية",
    scheduleTime: "08:00 م - 09:15 م",
    days: ["الأربعاء", "الخميس"],
    capacity: 30,
    enrolledCount: 0,
    isLiveNow: false,
    targetJuzOrSurah: "سورة الكهف ومريم وطه",
    levelName: "تلاوة وتدبر",
    tags: ["تدبر نسائي", "ترتيل", "وقف وابتداء"],
    isFemaleSection: true,
    supervisorWhatsapp: "+967 711 607 573",
    meetUrl: "https://meet.google.com/zdz-zcmn-ium",
    whatsappGroupUrl: "https://chat.whatsapp.com/L7KhrehabQuranFemale",
    whatsappGroupTitle: "مجموعة واتساب التدبر والترتيل للأخوات"
  }
];

export const INITIAL_DAILY_SESSIONS: DailySession[] = [
  {
    id: "s-m1",
    halqaId: "h-m1",
    title: "حلقة قسم الطلاب",
    sheikhName: "مشرف قسم الطلاب",
    timeSlot: "05:00 ص - 06:30 ص (يومياً عدا الجمعة)",
    period: "fajr",
    category: "memorization",
    status: "live",
    attendeesCount: 0,
    currentReader: undefined,
    meetUrl: "https://meet.google.com/fid-iqwm-zxm",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  },
  {
    id: "s-1",
    halqaId: "h-1",
    title: "حلقة الفجر لتثبيت حفظ القرآن (الماهر بالقرآن)",
    sheikhName: "الشيخ د. عبد الرحمن الشهري",
    timeSlot: "05:15 ص - 06:45 ص",
    period: "fajr",
    category: "memorization",
    status: "live",
    attendeesCount: 0,
    currentReader: undefined
  },
  {
    id: "s-2",
    halqaId: "h-5",
    title: "حلقة رواية ورش عن نافع من طريق الأزرق",
    sheikhName: "الشيخ محمد أمين التلمساني",
    timeSlot: "09:00 ص - 10:30 ص",
    period: "duha",
    category: "correction",
    status: "upcoming",
    attendeesCount: 12
  },
  {
    id: "s-3",
    halqaId: "h-2",
    title: "مقرأة تصحيح التلاوة وضبط مخارج الحروف",
    sheikhName: "الشيخ المقرئ معاذ بن يوسف",
    timeSlot: "04:30 م - 06:00 م",
    period: "asr",
    category: "correction",
    status: "upcoming",
    attendeesCount: 16
  },
  {
    id: "s-4",
    halqaId: "h-4",
    title: "حلقة إتقان سورة البقرة وآل عمران",
    sheikhName: "الشيخ إبراهيم الكردي",
    timeSlot: "06:30 م - 08:00 م",
    period: "maghrib",
    category: "memorization",
    status: "upcoming",
    attendeesCount: 27
  },
  {
    id: "s-5",
    halqaId: "h-3",
    title: "حلقة التلاوة والتدبر القرآني (المسائية)",
    sheikhName: "الشيخ أ.د. طارق السويداني",
    timeSlot: "08:30 م - 09:45 م",
    period: "isha",
    category: "recitation",
    status: "upcoming",
    attendeesCount: 31
  },
  {
    id: "s-f1",
    halqaId: "h-f1",
    title: "حلقة قسم الطالبات",
    sheikhName: "مشرفة قسم الطالبات",
    timeSlot: "04:00 م - 06:00 م (يومياً عدا الجمعة)",
    period: "asr",
    category: "memorization",
    status: "live",
    attendeesCount: 0,
    currentReader: undefined,
    meetUrl: "https://meet.google.com/zdz-zcmn-ium",
    days: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  }
];

export const INITIAL_USER: UserProfile = {
  id: "u-official",
  name: "طالب المقرأة",
  email: "student@rehab-quran.com",
  role: "student",
  riwayah: "حفص عن عاصم من طريق الشاطبية",
  level: "متوسط (حفظ وتثبيت)",
  enrolledHalqaIds: ["h-m1"],
  memorizedJuzs: [],
  dailyTargetPages: 0,
  streakDays: 0,
  totalSubmissions: 0,
  attendanceRate: 100
};

export const INITIAL_SUBMISSIONS: AudioSubmission[] = [];

export const TAJWEED_TOPICS: TajweedTopic[] = [
  {
    id: "t-1",
    title: "أحكام النون الساكنة والتنوين",
    category: "noon",
    summary: "أربعة أحكام أساسية: الإظهار الحلقي، الإدغام (بغنة وبغير غنة)، الإقلاب، والإخفاء الحقيقي.",
    explanation: "للنون الساكنة والتنوين أربعة أحكام عند ملاقاة حروف الهجاء: الإظهار عند حروف الحلق الستة (همز، هاء، عين، حاء، غين، خاء)، والإدغام في ستة أحرف تجمعها كلمة (يرملون)، والإقلاب عند حرف الباء فقط بقلبها ميماً مخفاة مع الغنة، والإخفاء عند باقي الحروف الخمسة عشر.",
    poesyRule: "لِلنُّونِ إِن تَسْكُنْ وَلِلتَّنْوِينِ * أَرْبَعُ أَحْكَامٍ فَخُذْ تَبْيِينِي\nفَالأَوَّلُ الإِظْهَارُ قَبْلَ أَحْرُفِ * لِلْحَلْقِ سِتٌّ رُتِّبَتْ فَلْتَعْرِفِ",
    examples: [
      { text: "مَنْ ءَامَنَ", rule: "إظهار حلقي لوقوع الهمزة بعد النون الساكنة", surah: "البقرة", explanation: "نطق النون مظهرة بغير غنة زائدة." },
      { text: "مَن يَقُولُ", rule: "إدغام بغنة لوقوع الياء بعد النون الساكنة", surah: "البقرة", explanation: "إدخال النون في الياء مع بقاء الغنة بمقدار حركتين." },
      { text: "مِن بَعْدِ", rule: "إقلاب لوقوع الباء بعد النون الساكنة", surah: "البقرة", explanation: "قلب النون الساكنة ميماً مخفاة بغنة حركتين مع تقارب الشفتين." },
      { text: "كِتَابٌ كَرِيمٌ", rule: "إخفاء حقيقي لوقوع الكاف بعد التنوين", surah: "النمل", explanation: "نطق التنوين بصفة بين الإظهار والإدغام مع مراعاة ترقيق الغنة." }
    ]
  },
  {
    id: "t-2",
    title: "أحكام المدود (الأصلي والفرعي)",
    category: "madd",
    summary: "المد الطبيعي بمقدار حركتين، والمدود الفرعية بسبب الهمز (المتصل، المنفصل، البدل) أو السكون (العارض للسكون، اللازم).",
    explanation: "المد لغة هو الزيادة، واصطلاحاً هو إطالة الصوت بحرف من حروف المد الثلاثة (الألف الساكنة المفتوح ما قبلها، الواو الساكنة المضموم ما قبلها، والياء الساكنة المكسور ما قبلها). يقسم إلى أصلي (طبيعي) وفرعي متوقف على سبب من همز أو سكون.",
    poesyRule: "وَالْمَدُّ أَصْلِيٌّ وَفَرْعِيٌّ لَهُ * وَسَمِّ أَوَّلاً طَبِيعِيّاً وَهُوْ\nمَا لا تَوَقُّفٌ لَهُ عَلَى سَبَبْ * وَلا بِدُونِهِ الحُرُوفُ تُجْتَلَبْ",
    examples: [
      { text: "قَالَ ، يَقُولُ ، قِيلَ", rule: "مد طبيعي أصلي بمقدار حركتين", surah: "متنوع", explanation: "لا يتوقف على همز أو سكون ويمد بمقدار حركتين فقط." },
      { text: "جِيءَ ، السَّمَاءِ", rule: "مد واجب متصل (4 أو 5 حركات)", surah: "الفجر / البقرة", explanation: "اجتماع حرف المد والهمز في كلمة واحدة." },
      { text: "إِنَّا أَعْطَيْنَاكَ", rule: "مد جائز منفصل (4 أو 5 حركات)", surah: "الكوثر", explanation: "حرف المد في آخر الكلمة والهمزة في أول الكلمة التي تليها." },
      { text: "الضَّآلِّينَ", rule: "مد لازم كلمي مثقل (6 حركات لزوماً)", surah: "الفاتحة", explanation: "مجيء حرف مشدد بعد حرف المد في كلمة واحدة ويمد 6 حركات حتماً." }
    ]
  },
  {
    id: "t-3",
    title: "صفة القلقلة ومراتبها",
    category: "qalqalah",
    summary: "اضطراب المخرج عند النطق بالحرف ساكناً حتى يُسمع له نبرة قوية، وحروفها خمسة: (قطب جد).",
    explanation: "حروف القلقلة خمسة يجمعها قولك: (قُطْبُ جَدٍّ). ومراتبها: قلقلة كبرى عند الوقف على الحرف المشدد (مثل: وتَبَّ)، وقلقلة وسطى عند الوقف على الحرف المخفف (مثل: كَسَبْ)، وقلقلة صغرى إذا كان الحرف ساكناً في وسط الكلمة أو الكلام (مثل: يَجْعَلْ).",
    poesyRule: "بَيِّنْ مُقَلْقَلاً إِنْ سَكَنَا * وَإِنْ يَكُنْ فِي الْوَقْفِ كَانَ أَبْيَنَا",
    examples: [
      { text: "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ", rule: "قلقلة كبرى (أعلى المراتب)", surah: "المسد", explanation: "الوقف على حرف قلقلة مشدد." },
      { text: "قُلْ هُوَ اللَّهُ أَحَدٌ", rule: "قلقلة وسطى", surah: "الإخلاص", explanation: "الوقف على الدال الساكنة غير المشددة في نهاية الآية." },
      { text: "أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ", rule: "قلقلة صغرى", surah: "الفيل", explanation: "الجيم الساكنة في وسط الكلمة أثناء الوصل." }
    ]
  },
  {
    id: "t-4",
    title: "مخارج الحروف وصفاتها الأساسية",
    category: "makharaj",
    summary: "المخارج العامة خمسة: الجوف، والحلق، واللسان، والشفتان، والخيشوم. يتفرع منها 17 مخرجاً خاصاً.",
    explanation: "مخارج الحروف هي الأماكن التي تتولد منها الحروف الهجائية، والصفات هي الكيفيات التي تلحق بالحرف عند النطق به كالجهر والهمس والشدة والرخاوة والاستعلاء والاستفال والإطباق والانفتاح.",
    poesyRule: "مَخَارِجُ الحُرُوفِ سَبْعَةَ عَشَرْ * عَلَى الَّذِي يَخْتَارُهُ مَنِ اخْتَبَرْ\nفَأَلِفُ الجَوْفِ وَأُخْتَاهَا وَهِي * حُرُوفُ مَدٍّ لِلْهَوَاءِ تَنْتَهِي",
    examples: [
      { text: "حروف الحلق (ء، هـ، ع، ح، غ، خ)", rule: "مخرج الحلق (أقصى ووسط وأدنى)", surah: "قواعد التجويد", explanation: "تخرج من الحلق من أقصاه (الهمز والهاء) ووسطه (العين والحاء) وأدناه (الغين والخاء)." },
      { text: "حرف الضاد (ض)", rule: "حافة اللسان مع ما يليه من الأضراس العليا", surah: "صفات الحروف", explanation: "أصعب الحروف مخرجاً، ويتصف بالاستطالة والرخاوة والإطباق." }
    ]
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
