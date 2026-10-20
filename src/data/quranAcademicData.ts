/**
 * البيانات الأكاديمية الرسمية للقرآن الكريم
 * مقرأة رحاب القرآن الإلكترونية
 * تدعم: 114 سورة، 30 جزء، 60 حزب، 240 ربع، 604 صفحات
 * والروايات المتواترة، المناهج التعليمية، تصنيفات الأخطاء الستة، ودرجات الإتقان
 */

export interface AcademicSurahMeta {
  number: number;
  name: string;
  totalAyahs: number;
  type: 'مكية' | 'مدنية';
  startPage: number;
  endPage: number;
  startJuz: number;
  startHizb: number;
  startRub: number;
}

export interface AcademicJuzMeta {
  number: number;
  name: string;
  startSurahName: string;
  startAyah: number;
  startPage: number;
  endPage: number;
  hizbs: [number, number]; // e.g. [1, 2]
}

export interface AcademicRiwayah {
  id: string;
  name: string;
  reader: string;
  description: string;
  isPopular?: boolean;
}

export interface AcademicCurriculum {
  id: string;
  title: string;
  targetDailyPace: string;
  weeklyTarget: string;
  durationMonths: number;
  description: string;
  targetAudience: string;
}

// 1. الروايات القرآنية المعتمدة
export const ACADEMIC_RIWAYAHS: AcademicRiwayah[] = [
  {
    id: 'hafs',
    name: 'حفص عن عاصم (طريق الشاطبية)',
    reader: 'الإمام عاصم بن بهدلة الكوفي',
    description: 'الرواية الأكثر انتشاراً في العالم الإسلامي، معتمدة في مصحف المدينة النبوية.',
    isPopular: true
  },
  {
    id: 'warsh',
    name: 'ورش عن نافع (طريق الأزرق)',
    reader: 'الإمام نافع المدني',
    description: 'رواية معتمدة في بلاد المغرب العربي وشمال أفريقيا، تتميز بترقيق الراءات وتغليظ اللامات وتسهيل الهمز.',
    isPopular: true
  },
  {
    id: 'qaloon',
    name: 'قالون عن نافع',
    reader: 'الإمام نافع المدني',
    description: 'رواية مشهورة في ليبيا وتونس وبعض أقطار أفريقيا، تتميز بصلة ميم الجمع وقصر المنفصل.',
    isPopular: true
  },
  {
    id: 'duri_abu_amr',
    name: 'الدوري عن أبي عمرو البصري',
    reader: 'الإمام أبو عمرو البصري',
    description: 'رواية معتمدة في السودان وأجزاء من شرق وغرب أفريقيا، تتميز بالإدغام الكبير والإمالات.',
    isPopular: true
  },
  {
    id: 'shubah',
    name: 'شعبة عن عاصم',
    reader: 'الإمام عاصم الكوفي',
    description: 'الرواية الثانية عن الإمام عاصم، تحظى باهتمام بالغ لدى الحفاظ والدارسين لمقارنتها بحفص.',
  },
  {
    id: 'susi',
    name: 'السوسي عن أبي عمرو',
    reader: 'الإمام أبو عمرو البصري',
    description: 'تتميز بالإدغام الكبير الصريح للأحرف المتقاربة والمتماثلة وصلاً.',
  },
  {
    id: 'ibn_kathir',
    name: 'البزي وقنبل عن ابن كثير المكي',
    reader: 'الإمام عبد الله بن كثير المكي',
    description: 'قراءة إمام أهل مكة، تتميز بصلة هاء الضمير وميم الجمع وإسقاط إحدى الهمزتين.',
  },
  {
    id: 'ashara',
    name: 'القراءات العشر المتواترة (الصغرى والكبرى)',
    reader: 'أئمة الإقراء العشرة ورواتهم',
    description: 'مسار المشايخ وطلبة الإجازة بالسند المتصل إلى رسول الله ﷺ.',
    isPopular: true
  }
];

// 2. المناهج التعليمية المعتمدة
export const ACADEMIC_CURRICULA: AcademicCurriculum[] = [
  {
    id: 'regular',
    title: 'منهج الحفظ العام المنتظم',
    targetDailyPace: 'وجه واحد يومياً (صفحة واحدة)',
    weeklyTarget: '5 أوجه أسبوعياً + مراجعة الحزب الأخير',
    durationMonths: 24,
    description: 'منهج متوازن يناسب الطلاب والمهنيين والموظفين لتحقيق الختمة المتقنة خلال سنتين دون انقطاع.',
    targetAudience: 'عامة الطلاب والمبتدئين'
  },
  {
    id: 'intensive',
    title: 'منهج الحفظ المكثف السريع',
    targetDailyPace: 'صفحتان إلى ثلاثة أوجه يومياً',
    weeklyTarget: 'حزب كامل أسبوعياً (10-15 وجهاً)',
    durationMonths: 10,
    description: 'برنامج همم عالي للطلاب المتفرغين لحفظ كتاب الله كاملاً في غضون عام دراسي واحد.',
    targetAudience: 'المتفرغون وطلبة الدورات الصيفية'
  },
  {
    id: 'mastery_murajaah',
    title: 'منهج الإتقان والتثبيت الراسخ',
    targetDailyPace: 'نصف جزء إلى جزء كامل مراجعة يومية',
    weeklyTarget: '3 إلى 5 أجزاء أسبوعياً',
    durationMonths: 6,
    description: 'مخصص للطلاب الذين أتموا حفظ القرآن أو أجزاء كبيرة منه ويريدون تثبيته ليصبح كالفاتحة.',
    targetAudience: 'الحفاظ المتممون والمستعدون للمسابقات'
  },
  {
    id: 'sanad_ijazah',
    title: 'منهج الإجازة بالسند المتصل',
    targetDailyPace: 'حزب إلى جزء كامل مشافهة وعرضاً على الشيخ',
    weeklyTarget: 'ختمة كاملة غيباً مع دقائق أحكام التجويد والوقف',
    durationMonths: 12,
    description: 'مسار العرض المباشر على الشيوخ المسندين للحصول على الإجازة بالسند المتصل إلى النبي ﷺ.',
    targetAudience: 'الحفاظ المتقنون الراغبون بالسند'
  },
  {
    id: 'young_buds',
    title: 'منهج البراعم وصغار الحفاظ',
    targetDailyPace: 'نصف صفحة أو 3-5 آيات بالتلقين',
    weeklyTarget: 'سورة قصيرة أو صفحتان أسبوعياً',
    durationMonths: 36,
    description: 'منهج تربوي لطيف يبدأ من جزء عم للأطفال والناشئين مع التركيز على النطق السليم ومخارج الحروف.',
    targetAudience: 'الأطفال والناشئة من سن 5 إلى 12 سنة'
  }
];

// 3. تصنيف الأخطاء الستة المعتمد في المقارئ القرآنية
export type QuranErrorType = 
  | 'forgetting'            // نسيان وتوقف
  | 'clear_mistake'         // لحن جلي
  | 'hidden_mistake'        // لحن خفي
  | 'tajweed_mistake'       // خطأ تجويدي
  | 'waqf_ibtida_mistake'   // خطأ في الوقف والابتداء
  | 'hesitation';           // تردد / تلعثم

export interface QuranErrorCategory {
  id: QuranErrorType;
  label: string;
  description: string;
  deductionPoints: number; // حسم الدرجات من 100
  color: string;
  severity: 'high' | 'medium' | 'low';
}

export const QURAN_ERROR_CATEGORIES: QuranErrorCategory[] = [
  {
    id: 'forgetting',
    label: 'نسيان وتوقف',
    description: 'انقطاع الطالب عن الاسترسال أو نسيان بداية الآية وحاجته لفتح الشيخ أو التذكير.',
    deductionPoints: 1.5,
    color: '#D97706', // amber
    severity: 'medium'
  },
  {
    id: 'clear_mistake',
    label: 'لحن جلي',
    description: 'خطأ ظاهر يخل باللفظ أو المعنى، مثل تغيير حركة (فتحة مكان ضمة)، أو إبدال حرف بحرف (سين بصاد). خطأ شرعي حساس.',
    deductionPoints: 2.5,
    color: '#DC2626', // rose/red
    severity: 'high'
  },
  {
    id: 'hidden_mistake',
    label: 'لحن خفي',
    description: 'خطأ يختص بمعرفته علماء القراءة والتجويد، مثل ترك الترقيق، أو المبالغة في التفخيم، أو زيادة تمطيط الحركات.',
    deductionPoints: 1.0,
    color: '#EA580C', // orange
    severity: 'medium'
  },
  {
    id: 'tajweed_mistake',
    label: 'خطأ تجويدي',
    description: 'خلل في تطبيق قاعدة معينة: أحكام النون الساكنة والتنوين (ترك الإخفاء أو الإدغام)، قصر المد الواجب، ترك القلقلة.',
    deductionPoints: 1.0,
    color: '#7C3AED', // purple
    severity: 'medium'
  },
  {
    id: 'waqf_ibtida_mistake',
    label: 'خطأ في الوقف والابتداء',
    description: 'وقف قبيح يفصل بين كلام متصل يؤدي لمعنى فاسد، أو ابتداء بكلام يوهم معنى لا يليق بجلال الله تعالى.',
    deductionPoints: 1.5,
    color: '#2563EB', // blue
    severity: 'medium'
  },
  {
    id: 'hesitation',
    label: 'تردد / تلعثم',
    description: 'تكرار الكلمة أكثر من مرة، أو التردد الطويل قبل نطقها دون توقف كلي عن التلاوة.',
    deductionPoints: 0.5,
    color: '#4B5563', // gray
    severity: 'low'
  }
];

// 4. معايير درجات الإتقان
export interface MasteryLevel {
  minScore: number;
  maxScore: number;
  label: string;
  badgeClass: string;
  description: string;
  passed: boolean;
}

export const MASTERY_LEVELS: MasteryLevel[] = [
  {
    minScore: 90,
    maxScore: 100,
    label: 'ممتاز مرتفع (إتقان تام)',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'تلاوة منضبطة بمخارج الحروف وصفاتها والوقف والابتداء دون لحن أو تردد.',
    passed: true
  },
  {
    minScore: 80,
    maxScore: 89,
    label: 'جيد جداً (متقن)',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'تلاوة طيبة مع هنات يسيرة في اللحن الخفي تم تداركها، الحفظ متين.',
    passed: true
  },
  {
    minScore: 70,
    maxScore: 79,
    label: 'جيد (مقبول الإتقان)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'الحفظ حاضر لكن يلزمه مزيد من التثبيت والتمرين على أزمنة الغدد والمدود.',
    passed: true
  },
  {
    minScore: 60,
    maxScore: 69,
    label: 'مقبول (يحتاج لتثبيت)',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    description: 'حفظ ضعيف نسبياً مع تكرار التردد والنسيان، يوصى بإعادة تسميعه مع مراجعة الحزب.',
    passed: true
  },
  {
    minScore: 0,
    maxScore: 59,
    label: 'بحاجة لإعادة العرض والمراجعة',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'لم يكتمل الحفظ أو كثر اللحن الجلي، يلزم الطالب إعادة تحضير المقرر وعرضه ثانية على الشيخ.',
    passed: false
  }
];

export function calculateMastery(score: number): MasteryLevel {
  const rounded = Math.round(score);
  return (
    MASTERY_LEVELS.find((lvl) => rounded >= lvl.minScore && rounded <= lvl.maxScore) ||
    MASTERY_LEVELS[MASTERY_LEVELS.length - 1]
  );
}

// 5. فهرس الـ 114 سورة كاملة مع تفاصيل الصفحات والأجزاء والأحزاب
export const ALL_114_SURAHS: AcademicSurahMeta[] = [
  { number: 1, name: 'الفاتحة', totalAyahs: 7, type: 'مكية', startPage: 1, endPage: 1, startJuz: 1, startHizb: 1, startRub: 1 },
  { number: 2, name: 'البقرة', totalAyahs: 286, type: 'مدنية', startPage: 2, endPage: 49, startJuz: 1, startHizb: 1, startRub: 1 },
  { number: 3, name: 'آل عمران', totalAyahs: 200, type: 'مدنية', startPage: 50, endPage: 76, startJuz: 3, startHizb: 6, startRub: 21 },
  { number: 4, name: 'النساء', totalAyahs: 176, type: 'مدنية', startPage: 77, endPage: 106, startJuz: 4, startHizb: 8, startRub: 30 },
  { number: 5, name: 'المائدة', totalAyahs: 120, type: 'مدنية', startPage: 106, endPage: 127, startJuz: 6, startHizb: 11, startRub: 41 },
  { number: 6, name: 'الأنعام', totalAyahs: 165, type: 'مكية', startPage: 128, endPage: 150, startJuz: 7, startHizb: 13, startRub: 49 },
  { number: 7, name: 'الأعراف', totalAyahs: 206, type: 'مكية', startPage: 151, endPage: 176, startJuz: 8, startHizb: 16, startRub: 61 },
  { number: 8, name: 'الأنفال', totalAyahs: 75, type: 'مدنية', startPage: 177, endPage: 186, startJuz: 9, startHizb: 18, startRub: 71 },
  { number: 9, name: 'التوبة', totalAyahs: 129, type: 'مدنية', startPage: 187, endPage: 207, startJuz: 10, startHizb: 19, startRub: 75 },
  { number: 10, name: 'يونس', totalAyahs: 109, type: 'مكية', startPage: 208, endPage: 221, startJuz: 11, startHizb: 21, startRub: 83 },
  { number: 11, name: 'هود', totalAyahs: 123, type: 'مكية', startPage: 221, endPage: 235, startJuz: 11, startHizb: 22, startRub: 88 },
  { number: 12, name: 'يوسف', totalAyahs: 111, type: 'مكية', startPage: 235, endPage: 248, startJuz: 12, startHizb: 23, startRub: 93 },
  { number: 13, name: 'الرعد', totalAyahs: 43, type: 'مدنية', startPage: 249, endPage: 255, startJuz: 13, startHizb: 25, startRub: 99 },
  { number: 14, name: 'إبراهيم', totalAyahs: 52, type: 'مكية', startPage: 255, endPage: 261, startJuz: 13, startHizb: 26, startRub: 102 },
  { number: 15, name: 'الحجر', totalAyahs: 99, type: 'مكية', startPage: 262, endPage: 267, startJuz: 14, startHizb: 27, startRub: 105 },
  { number: 16, name: 'النحل', totalAyahs: 128, type: 'مكية', startPage: 267, endPage: 281, startJuz: 14, startHizb: 27, startRub: 107 },
  { number: 17, name: 'الإسراء', totalAyahs: 111, type: 'مكية', startPage: 282, endPage: 293, startJuz: 15, startHizb: 29, startRub: 113 },
  { number: 18, name: 'الكهف', totalAyahs: 110, type: 'مكية', startPage: 293, endPage: 304, startJuz: 15, startHizb: 30, startRub: 118 },
  { number: 19, name: 'مريم', totalAyahs: 98, type: 'مكية', startPage: 305, endPage: 312, startJuz: 16, startHizb: 31, startRub: 122 },
  { number: 20, name: 'طه', totalAyahs: 135, type: 'مكية', startPage: 312, endPage: 321, startJuz: 16, startHizb: 32, startRub: 125 },
  { number: 21, name: 'الأنبياء', totalAyahs: 112, type: 'مكية', startPage: 322, endPage: 331, startJuz: 17, startHizb: 33, startRub: 129 },
  { number: 22, name: 'الحج', totalAyahs: 78, type: 'مدنية', startPage: 332, endPage: 341, startJuz: 17, startHizb: 34, startRub: 133 },
  { number: 23, name: 'المؤمنون', totalAyahs: 118, type: 'مكية', startPage: 342, endPage: 349, startJuz: 18, startHizb: 35, startRub: 137 },
  { number: 24, name: 'النور', totalAyahs: 64, type: 'مدنية', startPage: 350, endPage: 359, startJuz: 18, startHizb: 35, startRub: 140 },
  { number: 25, name: 'الفرقان', totalAyahs: 77, type: 'مكية', startPage: 359, endPage: 366, startJuz: 18, startHizb: 36, startRub: 144 },
  { number: 26, name: 'الشعراء', totalAyahs: 227, type: 'مكية', startPage: 367, endPage: 376, startJuz: 19, startHizb: 37, startRub: 146 },
  { number: 27, name: 'النمل', totalAyahs: 93, type: 'مكية', startPage: 377, endPage: 385, startJuz: 19, startHizb: 38, startRub: 150 },
  { number: 28, name: 'القصص', totalAyahs: 88, type: 'مكية', startPage: 385, endPage: 396, startJuz: 20, startHizb: 39, startRub: 154 },
  { number: 29, name: 'العنكبوت', totalAyahs: 69, type: 'مكية', startPage: 396, endPage: 404, startJuz: 20, startHizb: 40, startRub: 158 },
  { number: 30, name: 'الروم', totalAyahs: 60, type: 'مكية', startPage: 404, endPage: 410, startJuz: 21, startHizb: 41, startRub: 162 },
  { number: 31, name: 'لقمان', totalAyahs: 34, type: 'مكية', startPage: 411, endPage: 414, startJuz: 21, startHizb: 41, startRub: 164 },
  { number: 32, name: 'السجدة', totalAyahs: 30, type: 'مكية', startPage: 415, endPage: 417, startJuz: 21, startHizb: 42, startRub: 166 },
  { number: 33, name: 'الأحزاب', totalAyahs: 73, type: 'مدنية', startPage: 418, endPage: 427, startJuz: 21, startHizb: 42, startRub: 167 },
  { number: 34, name: 'سبأ', totalAyahs: 54, type: 'مكية', startPage: 428, endPage: 434, startJuz: 22, startHizb: 43, startRub: 171 },
  { number: 35, name: 'فاطر', totalAyahs: 45, type: 'مكية', startPage: 434, endPage: 440, startJuz: 22, startHizb: 43, startRub: 173 },
  { number: 36, name: 'يس', totalAyahs: 83, type: 'مكية', startPage: 440, endPage: 445, startJuz: 22, startHizb: 44, startRub: 176 },
  { number: 37, name: 'الصافات', totalAyahs: 182, type: 'مكية', startPage: 446, endPage: 452, startJuz: 23, startHizb: 45, startRub: 178 },
  { number: 38, name: 'ص', totalAyahs: 88, type: 'مكية', startPage: 453, endPage: 458, startJuz: 23, startHizb: 45, startRub: 180 },
  { number: 39, name: 'الزمر', totalAyahs: 75, type: 'مكية', startPage: 458, endPage: 467, startJuz: 23, startHizb: 46, startRub: 183 },
  { number: 40, name: 'غافر', totalAyahs: 85, type: 'مكية', startPage: 467, endPage: 476, startJuz: 24, startHizb: 47, startRub: 187 },
  { number: 41, name: 'فصلت', totalAyahs: 54, type: 'مكية', startPage: 477, endPage: 482, startJuz: 24, startHizb: 48, startRub: 191 },
  { number: 42, name: 'الشورى', totalAyahs: 53, type: 'مكية', startPage: 483, endPage: 489, startJuz: 25, startHizb: 49, startRub: 194 },
  { number: 43, name: 'الزخرف', totalAyahs: 89, type: 'مكية', startPage: 489, endPage: 495, startJuz: 25, startHizb: 49, startRub: 197 },
  { number: 44, name: 'الدخان', totalAyahs: 59, type: 'مكية', startPage: 496, endPage: 498, startJuz: 25, startHizb: 50, startRub: 199 },
  { number: 45, name: 'الجاثية', totalAyahs: 37, type: 'مكية', startPage: 499, endPage: 502, startJuz: 25, startHizb: 50, startRub: 200 },
  { number: 46, name: 'الأحقاف', totalAyahs: 35, type: 'مكية', startPage: 502, endPage: 506, startJuz: 26, startHizb: 51, startRub: 202 },
  { number: 47, name: 'محمد', totalAyahs: 38, type: 'مدنية', startPage: 507, endPage: 510, startJuz: 26, startHizb: 51, startRub: 204 },
  { number: 48, name: 'الفتح', totalAyahs: 29, type: 'مدنية', startPage: 511, endPage: 515, startJuz: 26, startHizb: 52, startRub: 205 },
  { number: 49, name: 'الحجرات', totalAyahs: 18, type: 'مدنية', startPage: 515, endPage: 517, startJuz: 26, startHizb: 52, startRub: 207 },
  { number: 50, name: 'ق', totalAyahs: 45, type: 'مكية', startPage: 518, endPage: 520, startJuz: 26, startHizb: 52, startRub: 208 },
  { number: 51, name: 'الذاريات', totalAyahs: 60, type: 'مكية', startPage: 520, endPage: 523, startJuz: 26, startHizb: 52, startRub: 209 },
  { number: 52, name: 'الطور', totalAyahs: 49, type: 'مكية', startPage: 523, endPage: 525, startJuz: 27, startHizb: 53, startRub: 210 },
  { number: 53, name: 'النجم', totalAyahs: 62, type: 'مكية', startPage: 526, endPage: 528, startJuz: 27, startHizb: 53, startRub: 211 },
  { number: 54, name: 'القمر', totalAyahs: 55, type: 'مكية', startPage: 528, endPage: 531, startJuz: 27, startHizb: 53, startRub: 212 },
  { number: 55, name: 'الرحمن', totalAyahs: 78, type: 'مدنية', startPage: 531, endPage: 534, startJuz: 27, startHizb: 54, startRub: 213 },
  { number: 56, name: 'الواقعة', totalAyahs: 96, type: 'مكية', startPage: 534, endPage: 537, startJuz: 27, startHizb: 54, startRub: 215 },
  { number: 57, name: 'الحديد', totalAyahs: 29, type: 'مدنية', startPage: 537, endPage: 541, startJuz: 27, startHizb: 54, startRub: 216 },
  { number: 58, name: 'المجادلة', totalAyahs: 22, type: 'مدنية', startPage: 542, endPage: 545, startJuz: 28, startHizb: 55, startRub: 218 },
  { number: 59, name: 'الحشر', totalAyahs: 24, type: 'مدنية', startPage: 545, endPage: 548, startJuz: 28, startHizb: 55, startRub: 220 },
  { number: 60, name: 'الممتحنة', totalAyahs: 13, type: 'مدنية', startPage: 549, endPage: 551, startJuz: 28, startHizb: 56, startRub: 221 },
  { number: 61, name: 'الصف', totalAyahs: 14, type: 'مدنية', startPage: 551, endPage: 552, startJuz: 28, startHizb: 56, startRub: 222 },
  { number: 62, name: 'الجمعة', totalAyahs: 11, type: 'مدنية', startPage: 553, endPage: 554, startJuz: 28, startHizb: 56, startRub: 223 },
  { number: 63, name: 'المنافقون', totalAyahs: 11, type: 'مدنية', startPage: 554, endPage: 555, startJuz: 28, startHizb: 56, startRub: 223 },
  { number: 64, name: 'التغابن', totalAyahs: 18, type: 'مدنية', startPage: 556, endPage: 557, startJuz: 28, startHizb: 56, startRub: 224 },
  { number: 65, name: 'الطلاق', totalAyahs: 12, type: 'مدنية', startPage: 558, endPage: 559, startJuz: 28, startHizb: 56, startRub: 225 },
  { number: 66, name: 'التحريم', totalAyahs: 12, type: 'مدنية', startPage: 560, endPage: 561, startJuz: 28, startHizb: 56, startRub: 225 },
  { number: 67, name: 'الملك', totalAyahs: 30, type: 'مكية', startPage: 562, endPage: 564, startJuz: 29, startHizb: 57, startRub: 226 },
  { number: 68, name: 'القلم', totalAyahs: 52, type: 'مكية', startPage: 564, endPage: 566, startJuz: 29, startHizb: 57, startRub: 227 },
  { number: 69, name: 'الحاقة', totalAyahs: 52, type: 'مكية', startPage: 566, endPage: 568, startJuz: 29, startHizb: 57, startRub: 228 },
  { number: 70, name: 'المعارج', totalAyahs: 44, type: 'مكية', startPage: 568, endPage: 570, startJuz: 29, startHizb: 58, startRub: 229 },
  { number: 71, name: 'نوح', totalAyahs: 28, type: 'مكية', startPage: 570, endPage: 571, startJuz: 29, startHizb: 58, startRub: 230 },
  { number: 72, name: 'الجن', totalAyahs: 28, type: 'مكية', startPage: 572, endPage: 573, startJuz: 29, startHizb: 58, startRub: 230 },
  { number: 73, name: 'المزمل', totalAyahs: 20, type: 'مكية', startPage: 574, endPage: 575, startJuz: 29, startHizb: 58, startRub: 231 },
  { number: 74, name: 'المدثر', totalAyahs: 56, type: 'مكية', startPage: 575, endPage: 577, startJuz: 29, startHizb: 58, startRub: 232 },
  { number: 75, name: 'القيامة', totalAyahs: 40, type: 'مكية', startPage: 577, endPage: 578, startJuz: 29, startHizb: 58, startRub: 233 },
  { number: 76, name: 'الإنسان', totalAyahs: 31, type: 'مدنية', startPage: 578, endPage: 580, startJuz: 29, startHizb: 58, startRub: 233 },
  { number: 77, name: 'المرسلات', totalAyahs: 50, type: 'مكية', startPage: 580, endPage: 581, startJuz: 29, startHizb: 58, startRub: 234 },
  { number: 78, name: 'النبأ', totalAyahs: 40, type: 'مكية', startPage: 582, endPage: 583, startJuz: 30, startHizb: 59, startRub: 235 },
  { number: 79, name: 'النازعات', totalAyahs: 46, type: 'مكية', startPage: 583, endPage: 584, startJuz: 30, startHizb: 59, startRub: 235 },
  { number: 80, name: 'عبس', totalAyahs: 42, type: 'مكية', startPage: 585, endPage: 586, startJuz: 30, startHizb: 59, startRub: 236 },
  { number: 81, name: 'التكوير', totalAyahs: 29, type: 'مكية', startPage: 586, endPage: 586, startJuz: 30, startHizb: 59, startRub: 236 },
  { number: 82, name: 'الانفطار', totalAyahs: 19, type: 'مكية', startPage: 587, endPage: 587, startJuz: 30, startHizb: 59, startRub: 237 },
  { number: 83, name: 'المطففين', totalAyahs: 36, type: 'مكية', startPage: 587, endPage: 589, startJuz: 30, startHizb: 59, startRub: 237 },
  { number: 84, name: 'الانشقاق', totalAyahs: 25, type: 'مكية', startPage: 589, endPage: 590, startJuz: 30, startHizb: 59, startRub: 237 },
  { number: 85, name: 'البروج', totalAyahs: 22, type: 'مكية', startPage: 590, endPage: 590, startJuz: 30, startHizb: 59, startRub: 238 },
  { number: 86, name: 'الطارق', totalAyahs: 17, type: 'مكية', startPage: 591, endPage: 591, startJuz: 30, startHizb: 59, startRub: 238 },
  { number: 87, name: 'الأعلى', totalAyahs: 19, type: 'مكية', startPage: 591, endPage: 592, startJuz: 30, startHizb: 59, startRub: 238 },
  { number: 88, name: 'الغاشية', totalAyahs: 26, type: 'مكية', startPage: 592, endPage: 593, startJuz: 30, startHizb: 60, startRub: 239 },
  { number: 89, name: 'الفجر', totalAyahs: 30, type: 'مكية', startPage: 593, endPage: 594, startJuz: 30, startHizb: 60, startRub: 239 },
  { number: 90, name: 'البلد', totalAyahs: 20, type: 'مكية', startPage: 594, endPage: 595, startJuz: 30, startHizb: 60, startRub: 239 },
  { number: 91, name: 'الشمس', totalAyahs: 15, type: 'مكية', startPage: 595, endPage: 595, startJuz: 30, startHizb: 60, startRub: 239 },
  { number: 92, name: 'الليل', totalAyahs: 21, type: 'مكية', startPage: 595, endPage: 596, startJuz: 30, startHizb: 60, startRub: 239 },
  { number: 93, name: 'الضحى', totalAyahs: 11, type: 'مكية', startPage: 596, endPage: 596, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 94, name: 'الشرح', totalAyahs: 8, type: 'مكية', startPage: 596, endPage: 596, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 95, name: 'التين', totalAyahs: 8, type: 'مكية', startPage: 597, endPage: 597, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 96, name: 'العلق', totalAyahs: 19, type: 'مكية', startPage: 597, endPage: 597, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 97, name: 'القدر', totalAyahs: 5, type: 'مكية', startPage: 598, endPage: 598, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 98, name: 'البينة', totalAyahs: 8, type: 'مدنية', startPage: 598, endPage: 599, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 99, name: 'الزلزلة', totalAyahs: 8, type: 'مدنية', startPage: 599, endPage: 599, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 100, name: 'العاديات', totalAyahs: 11, type: 'مكية', startPage: 599, endPage: 600, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 101, name: 'القارعة', totalAyahs: 11, type: 'مكية', startPage: 600, endPage: 600, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 102, name: 'التكاثر', totalAyahs: 8, type: 'مكية', startPage: 600, endPage: 600, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 103, name: 'العصر', totalAyahs: 3, type: 'مكية', startPage: 601, endPage: 601, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 104, name: 'الهمزة', totalAyahs: 9, type: 'مكية', startPage: 601, endPage: 601, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 105, name: 'الفيل', totalAyahs: 5, type: 'مكية', startPage: 601, endPage: 601, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 106, name: 'قريش', totalAyahs: 4, type: 'مكية', startPage: 602, endPage: 602, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 107, name: 'الماعون', totalAyahs: 7, type: 'مكية', startPage: 602, endPage: 602, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 108, name: 'الكوثر', totalAyahs: 3, type: 'مكية', startPage: 602, endPage: 602, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 109, name: 'الكافرون', totalAyahs: 6, type: 'مكية', startPage: 603, endPage: 603, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 110, name: 'النصر', totalAyahs: 3, type: 'مدنية', startPage: 603, endPage: 603, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 111, name: 'المسد', totalAyahs: 5, type: 'مكية', startPage: 603, endPage: 603, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 112, name: 'الإخلاص', totalAyahs: 4, type: 'مكية', startPage: 604, endPage: 604, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 113, name: 'الفلق', totalAyahs: 5, type: 'مكية', startPage: 604, endPage: 604, startJuz: 30, startHizb: 60, startRub: 240 },
  { number: 114, name: 'الناس', totalAyahs: 6, type: 'مكية', startPage: 604, endPage: 604, startJuz: 30, startHizb: 60, startRub: 240 }
];

// 6. أجزاء القرآن الثلاثون (30 جزء)
export const ALL_30_JUZ: AcademicJuzMeta[] = Array.from({ length: 30 }, (_, i) => {
  const juzNum = i + 1;
  const startPage = (juzNum - 1) * 20 + (juzNum > 1 ? 2 : 1);
  const endPage = Math.min(604, juzNum * 20 + (juzNum === 1 ? 1 : 1));
  const hizb1 = (juzNum - 1) * 2 + 1;
  const hizb2 = hizb1 + 1;
  
  // Find surah that starts or contains this juz
  const surah = ALL_114_SURAHS.find(s => s.startJuz === juzNum) || ALL_114_SURAHS[0];
  
  return {
    number: juzNum,
    name: `الجزء ${juzNum}`,
    startSurahName: surah.name,
    startAyah: 1,
    startPage,
    endPage,
    hizbs: [hizb1, hizb2]
  };
});
