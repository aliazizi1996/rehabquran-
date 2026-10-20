/**
 * تصنيفات الحلقات المعتمدة لمقرأة رحاب القرآن الإلكترونية
 * (حلقات حفظ، حلقات مراجعة، حلقات إجازة، حلقات تصحيح التلاوة، حلقات الأشبال أطفال)
 * لتسهيل تنظيمها وإدارتها للمعلمين والمشرفين والطلاب.
 */

export type HalqaClassificationId = 'hifz' | 'morajaah' | 'ijazah' | 'tashih' | 'ashbal';

export interface HalqaClassificationConfig {
  id: HalqaClassificationId;
  label: string; // اسم التصنيف العام (جمع)
  singular: string; // المفرد
  badgeTitle: string; // نص الشارة
  desc: string; // الوصف التوضيحي للمسار
  colorKey: 'emerald' | 'blue' | 'amber' | 'teal' | 'purple';
  defaultHalqaType: string;
  badgeClasses: string;
  cardActiveClasses: string;
  darkBadgeClasses: string;
  darkCardActiveClasses: string;
  suggestedPresets: string[];
}

export const HALQA_CLASSIFICATIONS: HalqaClassificationConfig[] = [
  {
    id: 'hifz',
    label: 'حلقات حفظ',
    singular: 'حلقة حفظ',
    badgeTitle: 'مسار التحفيظ والاستظهار',
    desc: 'مسار مخصص لحفظ كتاب الله الجديد، استظهار الآيات الكريمة، وضبط المقدار اليومي المنهجي برعاية المعلمين.',
    colorKey: 'emerald',
    defaultHalqaType: 'حلقة حفظ القرآن الكريم',
    badgeClasses: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 font-bold',
    cardActiveClasses: 'bg-emerald-50/90 border-[#046A38] shadow-md ring-2 ring-[#046A38]/30',
    darkBadgeClasses: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80',
    darkCardActiveClasses: 'bg-emerald-950/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/30',
    suggestedPresets: [
      'حلقة الفجر لحفظ القرآن الكريم (الماهر بالقرآن)',
      'حلقة قسم الطلاب (حفظ القرآن الكريم وتجويده)',
      'حلقة قسم الطالبات (حفظ القرآن الكريم وتجويده)',
      'حلقة الزهراوان (حفظ سورتي البقرة وآل عمران)',
      'حلقة حفظ المفصل وتلقين الآيات',
      'حلقة المتفوقين في الحفظ المتقن'
    ]
  },
  {
    id: 'morajaah',
    label: 'حلقات مراجعة',
    singular: 'حلقة مراجعة',
    badgeTitle: 'مسار التثبيت والمراجعة',
    desc: 'مسار تعزيز وتثبيت المحفوظ التراكمي، المراجعة الصغرى والكبرى، وضبط المتشابهات ورعاية الخاتمين.',
    colorKey: 'blue',
    defaultHalqaType: 'حلقة مراجعة وتثبيت',
    badgeClasses: 'bg-sky-100/90 text-sky-900 border-sky-300 font-bold',
    cardActiveClasses: 'bg-sky-50/90 border-sky-600 shadow-md ring-2 ring-sky-600/30',
    darkBadgeClasses: 'bg-sky-950/80 text-sky-300 border-sky-600/80',
    darkCardActiveClasses: 'bg-sky-950/50 border-sky-500 shadow-md ring-2 ring-sky-500/30',
    suggestedPresets: [
      'حلقة المراجعة السريعة وتثبيت الخاتمين',
      'حلقة إتقان الحفظ والمراجعة الكبرى',
      'حلقة الزهراوان لتثبيت الحفظ (عصراً)',
      'حلقة مراجعة خمسة أحزاب وتثبيت المحفوظ',
      'حلقة السرد الكامل للقرآن الكريم'
    ]
  },
  {
    id: 'ijazah',
    label: 'حلقات إجازة',
    singular: 'حلقة إجازة',
    badgeTitle: 'مسار الإتقان والسند',
    desc: 'مسار الإتقان التام، إقراء القرآن الكريم كاملاً غيباً، ونيل الإجازة بالسند المتصل إلى رسول الله ﷺ ودراسة المتون.',
    colorKey: 'amber',
    defaultHalqaType: 'حلقة إجازة بالسند المتصل',
    badgeClasses: 'bg-amber-100/90 text-amber-900 border-amber-300 font-bold',
    cardActiveClasses: 'bg-amber-50/90 border-[#C5A059] shadow-md ring-2 ring-[#C5A059]/40',
    darkBadgeClasses: 'bg-amber-950/80 text-amber-300 border-amber-600/80',
    darkCardActiveClasses: 'bg-amber-950/50 border-amber-500 shadow-md ring-2 ring-amber-500/30',
    suggestedPresets: [
      'حلقة الإتقان والإجازة بالسند المتصل',
      'حلقة إقراء وإجازة برواية حفص عن عاصم',
      'حلقة إقراء وإجازة برواية ورش عن نافع',
      'حلقة إتقان المتون والتجويد (الجزرية وتحفة الأطفال بالسند)',
      'حلقة إقراء بالقراءات السبع من طريق الشاطبية',
      'مقرأة العرض والإجازة لكبار الحفّاظ والمتقنين'
    ]
  },
  {
    id: 'tashih',
    label: 'تصحيح التلاوة',
    singular: 'حلقة تصحيح التلاوة',
    badgeTitle: 'مسار تصحيح التلاوة وضبط المخارج',
    desc: 'مسار مخصص لتقويم ألسنة القراء والدارسين، ضبط مخارج الحروف وصفاتها، وتطبيق أحكام التجويد وإتقان الأداء برعاية كبار المقرئين.',
    colorKey: 'teal',
    defaultHalqaType: 'حلقة تصحيح التلاوة وأحكام التجويد',
    badgeClasses: 'bg-teal-100/90 text-teal-900 border-teal-300 font-bold',
    cardActiveClasses: 'bg-teal-50/90 border-teal-600 shadow-md ring-2 ring-teal-600/30',
    darkBadgeClasses: 'bg-teal-950/80 text-teal-300 border-teal-600/80',
    darkCardActiveClasses: 'bg-teal-950/50 border-teal-500 shadow-md ring-2 ring-teal-500/30',
    suggestedPresets: [
      'مقرأة تصحيح التلاوة وضبط مخارج الحروف',
      'حلقة تصحيح التلاوة وأحكام التجويد التطبيقي',
      'حلقة تقويم الألسن وتصحيح التلاوة (الفجر)',
      'حلقة تصحيح قراءة جزء عم والمفصل',
      'مجلس تصحيح التلاوة وإتقان الأداء القرآني',
      'حلقة تصحيح التلاوة وتدبر الآيات'
    ]
  },
  {
    id: 'ashbal',
    label: 'حلقة الأشبال أطفال',
    singular: 'حلقة الأشبال أطفال',
    badgeTitle: 'مسار الأشبال والبراعم للأطفال',
    desc: 'مسار تفاعلي وتربوي مشوّق مخصص للأطفال والناشئة لتعليم هجاء القرآن الكريم، القاعدة النورانية، وحفظ قصار السور مع غرس الآداب والقيم القرآنية.',
    colorKey: 'purple',
    defaultHalqaType: 'حلقة الأشبال وبراعم القرآن (أطفال)',
    badgeClasses: 'bg-purple-100/90 text-purple-900 border-purple-300 font-bold',
    cardActiveClasses: 'bg-purple-50/90 border-purple-600 shadow-md ring-2 ring-purple-600/30',
    darkBadgeClasses: 'bg-purple-950/80 text-purple-300 border-purple-600/80',
    darkCardActiveClasses: 'bg-purple-950/50 border-purple-500 shadow-md ring-2 ring-purple-500/30',
    suggestedPresets: [
      'حلقة أشبال القرآن الكريم (أطفال)',
      'حلقة براعم النور لتعليم وتحفيظ جزء عمّ (أطفال)',
      'حلقة القاعدة النورانية وتهجئة الحروف للأطفال',
      'حلقة أشبال الإتقان لحفظ جزء تبارك',
      'نادي أشبال القرآن والآداب النبوية (صغار)',
      'حلقة المهرة الصغار لحفظ وتجويد القرآن'
    ]
  }
];

/**
 * الكشف التلقائي والدقيق لتصنيف أي حلقة قائمة في المقرأة
 */
export function detectHalqaClassification(item: {
  classification?: string | null;
  halqaType?: string | null;
  category?: string | null;
  title?: string | null;
}): HalqaClassificationConfig {
  const normClass = (item.classification || '').toLowerCase();
  if (
    normClass === 'ashbal' || 
    normClass.includes('أشبال') || 
    normClass.includes('اشبال') || 
    normClass.includes('أطفال') || 
    normClass.includes('اطفال') || 
    normClass.includes('براعم') ||
    normClass.includes('حلقة الأشبال') ||
    normClass.includes('حلقه الأشبال') ||
    normClass.includes('أشبال أطفال') ||
    normClass.includes('اشبال اطفال')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'ashbal') || HALQA_CLASSIFICATIONS[4];
  }

  if (
    normClass === 'tashih' || 
    normClass.includes('تصحيح') || 
    normClass.includes('تصحيح التلاوة') ||
    normClass.includes('تلاوة')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'tashih') || HALQA_CLASSIFICATIONS[3];
  }

  if (normClass === 'ijazah' || normClass.includes('إجازة') || normClass.includes('اجازة')) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'ijazah') || HALQA_CLASSIFICATIONS[2];
  }
  if (normClass === 'morajaah' || normClass.includes('مراجعة') || normClass.includes('تثبيت')) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'morajaah') || HALQA_CLASSIFICATIONS[1];
  }
  if (normClass === 'hifz' || normClass.includes('حفظ') || normClass.includes('تحفيظ')) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'hifz') || HALQA_CLASSIFICATIONS[0];
  }

  // كشف ذكي بناءً على العنوان أو النوع أو الوصف
  const combined = `${item.title || ''} ${item.halqaType || ''} ${item.category || ''}`.toLowerCase();
  
  if (
    combined.includes('أشبال') ||
    combined.includes('اشبال') ||
    combined.includes('أطفال') ||
    combined.includes('اطفال') ||
    combined.includes('براعم') ||
    combined.includes('نورانية') ||
    combined.includes('صغار') ||
    combined.includes('ashbal')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'ashbal') || HALQA_CLASSIFICATIONS[4];
  }

  if (
    combined.includes('تصحيح') ||
    combined.includes('مخارج') ||
    combined.includes('تقويم') ||
    combined.includes('ألسن') ||
    combined.includes('tashih') ||
    combined.includes('correction')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'tashih') || HALQA_CLASSIFICATIONS[3];
  }

  if (
    combined.includes('إجازة') ||
    combined.includes('اجازة') ||
    combined.includes('سند') ||
    combined.includes('السند') ||
    combined.includes('إقراء') ||
    combined.includes('متون') ||
    combined.includes('ijazah')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'ijazah') || HALQA_CLASSIFICATIONS[2];
  }

  if (
    combined.includes('مراجعة') ||
    combined.includes('مراجعه') ||
    combined.includes('تثبيت') ||
    combined.includes('تدبر') ||
    combined.includes('سرد') ||
    combined.includes('revision')
  ) {
    return HALQA_CLASSIFICATIONS.find(c => c.id === 'morajaah') || HALQA_CLASSIFICATIONS[1];
  }

  // الافتراضي: حلقات حفظ
  return HALQA_CLASSIFICATIONS[0];
}

/**
 * كافة الأسماء المعتمدة مجمعة
 */
export const ALL_APPROVED_HALQA_PRESETS = [
  ...HALQA_CLASSIFICATIONS[0].suggestedPresets,
  ...HALQA_CLASSIFICATIONS[1].suggestedPresets,
  ...HALQA_CLASSIFICATIONS[2].suggestedPresets,
  ...HALQA_CLASSIFICATIONS[3].suggestedPresets,
  ...HALQA_CLASSIFICATIONS[4].suggestedPresets,
];
