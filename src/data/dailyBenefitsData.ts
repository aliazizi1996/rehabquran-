export interface DailyQuranBenefit {
  id: string;
  ayahText: string;
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  tafseerSummary: string;
  tafseerSource: string; // e.g. "التفسير الميسر" أو "تفسير السعدي" أو "تفسير ابن كثير"
  keyTakeaway: string; // الفائدة الإيمانية والعملية
  category: 'faith' | 'manners' | 'hope' | 'action' | 'dhikr';
  categoryLabel: string;
}

export const DAILY_BENEFITS: DailyQuranBenefit[] = [
  {
    id: 'benefit-1',
    ayahText: 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا كَبِيرًا',
    surahName: 'سورة الإسراء',
    ayahNumber: 9,
    juzNumber: 15,
    tafseerSummary: 'إن هذا القرآن يرشد الناس إلى أكمل الطرق وأعدل المناهج في العقائد والأخلاق والتشريعات، ويبشر المصدقين العاملين بالصالحات بأن لهم ثواباً جزيلاً عند ربهم.',
    tafseerSource: 'التفسير الميسر',
    keyTakeaway: 'القرآن هو البوصلة الهادية لكل من التمس الرشاد والثبات، وكلما زاد ارتباطك بالورد وتلاوته، اتضحت لك معالم الصواب في حياتك.',
    category: 'faith',
    categoryLabel: 'هدايات القرآن'
  },
  {
    id: 'benefit-2',
    ayahText: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا * إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا',
    surahName: 'سورة المزمل',
    ayahNumber: 4,
    juzNumber: 29,
    tafseerSummary: 'أي: اقرأ القرآن على تمهل وتأنٍّ، وتبيين الحروف وتفخيم ما يستحق التفخيم وترقيق ما يستحق الترقيق، والوقوف عند رؤوس الآي ليتدبر القارئ والسامع معانيه العظيمة.',
    tafseerSource: 'تفسير ابن كثير',
    keyTakeaway: 'الترتيل وحسن الأداء يعين القلب على استيعاب عظمة كلام الله، فليست العبرة بكثرة الحروف وسرعة السرد، بل بحضور القلب وتدبر الآيات.',
    category: 'action',
    categoryLabel: 'أدب الترتيل'
  },
  {
    id: 'benefit-3',
    ayahText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    surahName: 'سورة الرعد',
    ayahNumber: 28,
    juzNumber: 13,
    tafseerSummary: 'أي تسكن قلوب المؤمنين، وتستقر وتزول وحشتها وقلقها، وترتاح إلى معرفة الله ومحبته وذكره، وأعظم الذكر تلاوة كتابه المجيد.',
    tafseerSource: 'تفسير السعدي',
    keyTakeaway: 'إذا ضاق صدرك أو تكاثرت عليك هموم الدنيا، فأقبل على المصحف بحضور وخشوع، فإن في آياته بلسم الطمأنينة وسكينة الروح.',
    category: 'hope',
    categoryLabel: 'سكينة وطمأنينة'
  },
  {
    id: 'benefit-4',
    ayahText: 'وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ',
    surahName: 'سورة الأعراف',
    ayahNumber: 204,
    juzNumber: 9,
    tafseerSummary: 'أمر إلهي بإلقاء السمع وحضور القلب وترك اللغو عند سماع كتاب الله لرجاء نيل رحمة الله، فالاستماع بالآذان والإنصات بسكوت اللسان والجوارح.',
    tafseerSource: 'تفسير السعدي',
    keyTakeaway: 'الإنصات لتلاوة المعلم في الحلقة القرآنية مفتاح الفتح، وأعظم أسباب ترقيق القلوب وفهم أسرار الآيات.',
    category: 'manners',
    categoryLabel: 'أدب الاستماع'
  },
  {
    id: 'benefit-5',
    ayahText: 'كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ',
    surahName: 'سورة ص',
    ayahNumber: 29,
    juzNumber: 23,
    tafseerSummary: 'هذا القرآن كتاب عظيم أنزلناه إليك كثير الخيرات والبركات، لأجل أن يتفكر الناس في دلالاته وأحكامه، وليتعظ به أصحاب العقول السليمة.',
    tafseerSource: 'التفسير الميسر',
    keyTakeaway: 'بركة القرآن تنال بالتلاوة وتتحقق بالتدبر وتثمر بالعمل، فاجعل لنفسك مع كل وردٍ وقفة تدبر وتطبيق يومي.',
    category: 'action',
    categoryLabel: 'بركة التدبر'
  },
  {
    id: 'benefit-6',
    ayahText: 'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ',
    surahName: 'سورة الإسراء',
    ayahNumber: 82,
    juzNumber: 15,
    tafseerSummary: 'القرآن شفاء للقلوب من أمراض الشبهات والشهوات والحزن والقلق، وشفاء للأبدان، ورحمة تنال أهله بالسكينة والبركة والأجر والمغفرة.',
    tafseerSource: 'تفسير ابن كثير',
    keyTakeaway: 'كلما عكفت على تلاوة كتاب الله وحفظه، غسلت همومك وأحزانك وأشرق في قلبك نور اليقين والرضا.',
    category: 'faith',
    categoryLabel: 'شفاء ورحمة'
  },
  {
    id: 'benefit-7',
    ayahText: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا وَإِنَّ اللَّهَ لَمَعَ الْمُحْسِنِينَ',
    surahName: 'سورة العنكبوت',
    ayahNumber: 69,
    juzNumber: 21,
    tafseerSummary: 'والذين صبروا وجاهدوا أنفسهم ابتغاء مرضاتنا وتعلّموا كتابنا وثبتوا على طاعتنا، لنهدينهم ونوفقهم إلى سبل الخير والصواب والفلاح.',
    tafseerSource: 'تفسير السعدي',
    keyTakeaway: 'مشقة التكرار والحفظ في بداياتك ستعقبها حلاوة الإتقان وطلاقة اللسان، والله مع الصابرين المجاهدين في إتقان كتابه.',
    category: 'action',
    categoryLabel: 'همّة وجهاد النفس'
  }
];

// Returns today's benefit deterministically based on day of year, or allows cyclical rotation
export const getTodayQuranBenefit = (): DailyQuranBenefit => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = Math.abs(dayOfYear) % DAILY_BENEFITS.length;
  return DAILY_BENEFITS[index];
};
