/**
 * studentResourcesData.ts
 * مكتبة المصادر والتسجيلات التعليمية لبوابة الطالب
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

export interface StudentResourceItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'video' | 'audio_rule' | 'pdf_guide';
  categoryLabel: string;
  subject: string;
  speaker: string;
  durationMinutes: number;
  durationLabel: string;
  description: string;
  keyPoints: string[];
  videoUrl?: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  audioTitle?: string;
  pdfUrl?: string;
  pdfTitle?: string;
  isRecommendedBeforeLive: boolean; // موصى بمطالعته قبل الحلقة المباشرة
  thumbnailBadge: string;
}

export const STUDENT_RESOURCES_DATA: StudentResourceItem[] = [
  // 1. مقاطع فيديو توضيحية مختارة
  {
    id: 'res-vid-1',
    title: 'شرح مخارج الحروف العربية وضبط مخرج اللسان والشفتين',
    subtitle: 'برنامج التجويد المصور مع مجسمات ثلاثية الأبعاد للمخارج',
    category: 'video',
    categoryLabel: 'فيديو مرئي توضيحي',
    subject: 'مخارج الحروف العربية',
    speaker: 'فضيلة الشيخ د. أيمن رشدي سويد',
    durationMinutes: 14,
    durationLabel: '14 دقيقة',
    description: 'شرح عملي دقيق لمخارج الحروف السبعة عشر، مع التركيز على موضع خروج الضاد والطاء ومخارج الحلق والشفتين لتجنب اللحن أثناء التسميع المباشر.',
    keyPoints: [
      'الجوف مخرج لحروف المد الثلاثة ويخرج منها الصوت بانسيابية.',
      'الحلق له ثلاثة مخارج: أقصى الحلق (الهمزة والهاء)، وسطه (العين والحاء)، وأدناه (الغين والخاء).',
      'حافة اللسان مخرج لحرف الضاد، وهو من أصعب الحروف ويحتاج لتدريب عملي مستمر.'
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/Es_a0IGHofc',
    youtubeVideoId: 'Es_a0IGHofc',
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3',
    audioTitle: 'تطبيق صوتي على مخرج الضاد وحروف الحلق',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/makharaj_lisan_shafatan.pdf',
    pdfTitle: 'مخطط مخارج الحروف المصور - نسخة PDF',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'HD فيديو مرئي'
  },
  {
    id: 'res-vid-2',
    title: 'أحكام النون الساكنة والتنوين: الإظهار، الإدغام، الإقلاب، والإخفاء',
    subtitle: 'شرح تأصيلي مع أمثلة قرآنية متدرجة وتفريق الغنن',
    category: 'video',
    categoryLabel: 'فيديو مرئي توضيحي',
    subject: 'أحكام النون الساكنة والتنوين',
    speaker: 'فضيلة الشيخ د. أيمن رشدي سويد',
    durationMinutes: 18,
    durationLabel: '18 دقيقة',
    description: 'دورة مسجلة مركزة تشرح الفروق الجوهرية بين أحكام النون الأربعة، مع بيان أحرف كل حكم وكيفية أداء غنة الإخفاء وترقيقها وتفخيمها.',
    keyPoints: [
      'الإظهار الحلقي أحرفه ستة (أ، هـ، ع، ح، غ، خ) ولا غنة فيه.',
      'الإدغام مجموع في كلمة (يرملون)، وينقسم إلى إدغام بغنة (ينمو) وبغير غنة (اللام والراء).',
      'الإقلاب يكون عند الباء فقط، بقلب النون أو التنوين ميماً مخفاة مع الغنة.',
      'الإخفاء الحقيقي أحرفه 15 حرفاً والغنة تتبع ما بعدها تفخيماً وترقيقاً.'
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/jZ_y-kK4e6M',
    youtubeVideoId: 'jZ_y-kK4e6M',
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/112004.mp3',
    audioTitle: 'أمثلة الإظهار والإخفاء بصوت الشيخ الحصري',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/noon_izhar_halqi.pdf',
    pdfTitle: 'دليل أحكام النون الساكنة والتنوين - مقرأة رحاب القرآن',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'HD فيديو مرئي'
  },
  {
    id: 'res-vid-3',
    title: 'أحكام المدود ومقاديرها وتمايز أزمنة المد الفرعي واللازم',
    subtitle: 'ضبط حركات المد بالأصابع والزمن الصوتي الصحيح',
    category: 'video',
    categoryLabel: 'فيديو مرئي توضيحي',
    subject: 'أحكام المدود وأنواعها',
    speaker: 'فضيلة الشيخ د. أيمن رشدي سويد',
    durationMinutes: 16,
    durationLabel: '16 دقيقة',
    description: 'تفصيل عملي لأزمنة المدود في القرآن: المد الطبيعي (حركتان)، المد المتصل والمنفصل (4 أو 5 حركات)، والمد اللازم الكلمي والحرفي (6 حركات لزوماً).',
    keyPoints: [
      'المد الطبيعي لا تقوم ذات الحرف إلا به ولا يتوقف على سبب (حركتان).',
      'المد المتصل واجب، والمد المنفصل جائز في رواية حفص عن عاصم من طريق الشاطبية.',
      'المد اللازم يمد 6 حركات وجوباً، كقوله تعالى: {وَلا الضَّالِّينَ}.'
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/5U9e3wQZ-6s',
    youtubeVideoId: '5U9e3wQZ-6s',
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/001007.mp3',
    audioTitle: 'تطبيق أزمنة المد على فاتحة الكتاب',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/madd_muttasil_munfasil_lazim.pdf',
    pdfTitle: 'جدول أزمنة المدود ومقاديرها - PDF',
    isRecommendedBeforeLive: false,
    thumbnailBadge: 'HD فيديو مرئي'
  },
  {
    id: 'res-vid-4',
    title: 'مراتب القراءة والتحرز من اللحن الجلي والخفي',
    subtitle: 'التحقيق، الترتيل، الحدر، وصون اللسان عن الخطأ في كتاب الله',
    category: 'video',
    categoryLabel: 'فيديو مرئي توضيحي',
    subject: 'مبادئ التجويد ومراتب القراءة',
    speaker: 'فضيلة الشيخ د. أيمن رشدي سويد',
    durationMinutes: 12,
    durationLabel: '12 دقيقة',
    description: 'بيان خطورة اللحن الجلي المغير للمعنى واللحن الخفي المخل بكمال الإتقان والصفات، وكيفية تصحيح التلاوة في الجلسات المباشرة.',
    keyPoints: [
      'اللحن الجلي خطأ يطرأ على اللفظ فيخل بالمبنى سواء أخل بالمعنى أم لم يخل، وحكمه حرام.',
      'اللحن الخفي خطأ يطرأ على الألفاظ فيخل بعرف القراءة دون المعنى (كنقص الغنة أو تكرار الراء).',
      'مراتب القراءة الصحيحة: الترتيل، التحقيق، والحدر؛ وأفضلها الترتيل.'
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/H6WTnSZ6G-0',
    youtubeVideoId: 'H6WTnSZ6G-0',
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3',
    audioTitle: 'تلاوة الترتيل والتحقيق النموذجية',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/lahn_and_recitation_ranks.pdf',
    pdfTitle: 'ورقة عمل مراتب القراءة وأنواع اللحن - PDF',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'HD فيديو مرئي'
  },
  {
    id: 'res-vid-5',
    title: 'صفات الحروف العربية: الصفات المتضادة والقلقلة والصفير',
    subtitle: 'الهمس والجهر، الشدة والرخاوة، الاستعلاء والاستفال، ومراتب القلقلة',
    category: 'video',
    categoryLabel: 'فيديو مرئي توضيحي',
    subject: 'صفات الحروف العربية',
    speaker: 'فضيلة الشيخ د. أيمن رشدي سويد',
    durationMinutes: 15,
    durationLabel: '15 دقيقة',
    description: 'شرح صوتي وتطبيقي للصفات التي تميز الحروف المتحدة في المخرج (كالطاء والتاء والدال)، وبيان صفة القلقلة ومراتبها عند الوقف والوصل.',
    keyPoints: [
      'حروف الهمس عشرة جمعت في: (فحثه شخص سكت)، وضدها الجهر.',
      'حروف الاستعلاء سبعة: (خص ضغط قظ)، وضدها الاستفال.',
      'حروف القلقلة خمسة: (قطب جد)، وتكون أوضح ما تكون عند الوقف على المشدد.'
    ],
    videoUrl: 'https://www.youtube-nocookie.com/embed/P28j8mO3b1k',
    youtubeVideoId: 'P28j8mO3b1k',
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/113005.mp3',
    audioTitle: 'أمثلة نطق القلقلة والهمس بصوت الشيخ الحصري',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/sifat_non_didd_qalqalah.pdf',
    pdfTitle: 'دليل صفات الحروف العربية - PDF',
    isRecommendedBeforeLive: false,
    thumbnailBadge: 'HD فيديو مرئي'
  },

  // 2. قواعد تجويد مسجلة مسبقاً (Audio & Infographic Rules)
  {
    id: 'res-aud-1',
    title: 'تسجيل قاعدة الإظهار الحلقي وتطبيقه الصوتي',
    subtitle: 'أمثلة مسجلة على الهمزة والهاء والعين والحاء والغين والخاء',
    category: 'audio_rule',
    categoryLabel: 'قاعدة مسجلة مسبقاً',
    subject: 'أحكام النون الساكنة والتنوين',
    speaker: 'الشيخ محمود خليل الحصري (المصحف المعلم)',
    durationMinutes: 5,
    durationLabel: '5 دقائق',
    description: 'تسجيل تعليمي مركز لأمثلة الإظهار الحلقي في كلمة وكلمتين، مع تبيين سرعة النطق دون سكت ودون زيادة في زمن النون.',
    keyPoints: [
      'المثال في كلمة: {يَنْأَوْنَ}، {مَنْ آمَنَ}.',
      'حكم النون والتنوين هنا هو الإظهار الصريح من غير غنة زائدة.',
      'السبب: بُعد المخرج بين مخرج النون (طرف اللسان) ومخرج حروف الحلق.'
    ],
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/108002.mp3',
    audioTitle: 'أمثلة الإظهار الحلقي المسجلة - سورة الكوثر وقريش',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/noon_izhar_halqi.pdf',
    pdfTitle: 'قاعدة الإظهار الحلقي - ملخص سريع',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'تسجيل صوتي معتمد'
  },
  {
    id: 'res-aud-2',
    title: 'تسجيل قاعدة الإدغام بغنة وبغير غنة والإظهار المطلق',
    subtitle: 'بيان حروف (ينمو) واللام والراء، واستثناء كلمات (دنيا، قنوان، صنوان، بنيان)',
    category: 'audio_rule',
    categoryLabel: 'قاعدة مسجلة مسبقاً',
    subject: 'أحكام النون الساكنة والتنوين',
    speaker: 'الشيخ محمود خليل الحصري',
    durationMinutes: 6,
    durationLabel: '6 دقائق',
    description: 'استمع للتطبيق الصوتي المعتمد لإدغام النون الساكنة في الياء والواو والميم والنون، والتفريق بين الإدغام الكامل والناقص.',
    keyPoints: [
      'الإدغام بغنة: {مَن يَقُولُ}، {مِن وَالٍ}.',
      'الإدغام بغير غنة: {مِن رَّبِّهِمْ}، {هُدًى لِّلْمُتَّقِينَ}.',
      'الإظهار المطلق: إذا اجتمعت النون مع الياء أو الواو في كلمة واحدة، وجب إظهارها حفظاً للبنية.'
    ],
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/099007.mp3',
    audioTitle: 'أمثلة الإدغام بغنة من سورة الزلزلة',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/noon_idgham_rules.pdf',
    pdfTitle: 'أحكام الإدغام التجويدي - بطاقة استذكار',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'تسجيل صوتي معتمد'
  },
  {
    id: 'res-aud-3',
    title: 'تسجيل أحكام الميم الساكنة: الإخفاء والإدغام والإظهار الشفوي',
    subtitle: 'التحفظ الشديد عند حرفي الواو والفاء لقرب واتحاد المخرج',
    category: 'audio_rule',
    categoryLabel: 'قاعدة مسجلة مسبقاً',
    subject: 'أحكام الميم الساكنة والمشددتين',
    speaker: 'الشيخ محمود خليل الحصري',
    durationMinutes: 5,
    durationLabel: '5 دقائق',
    description: 'تسجيل صوتي يوضح كيفية تلامس الشفتين برقة عند الإخفاء الشفوي للميم قبل الباء، مع المحافظة على الإظهار الشفوي التام عند الواو والفاء.',
    keyPoints: [
      'الإخفاء الشفوي: عند الباء فقط مثل {تَرْمِيهِم بِحِجَارَةٍ}.',
      'إدغام المتماثلين الصغير: عند الميم مثل {لَهُم مَّا يَشَاءُونَ}.',
      'الإظهار الشفوي: عند باقي الحروف الـ 26، وأشده عند الواو والفاء: {عَلَيْهِمْ وَلا الضَّالِّينَ}.'
    ],
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/105004.mp3',
    audioTitle: 'تطبيق أحكام الميم من سورة الفيل',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/meem_sakinah_rules.pdf',
    pdfTitle: 'أحكام الميم الساكنة - بطاقة ميسرة',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'تسجيل صوتي معتمد'
  },
  {
    id: 'res-aud-4',
    title: 'تسجيل قاعدة تفخيم وترقيق الراء وضبط الوجهين',
    subtitle: 'حالات فتح الراء وضمها وكسرها، والراء الساكنة بعد كسر عارض',
    category: 'audio_rule',
    categoryLabel: 'قاعدة مسجلة مسبقاً',
    subject: 'صفات الحروف العربية',
    speaker: 'نخبة شيوخ مقرأة رحاب القرآن',
    durationMinutes: 7,
    durationLabel: '7 دقائق',
    description: 'تسجيل تحليلي يفكك مواضع تفخيم الراء الثمانية، ومواضع ترقيقها الأربعة، والحالات الجائز فيها الوجهان عند الوقف والوصل كـ (مصر، القطر، ونذر).',
    keyPoints: [
      'تفخم الراء إذا كانت مفتوحة أو مضمومة، أو ساكنة بعد فتح أو ضم.',
      'ترقق الراء إذا كانت مكسورة، أو ساكنة بعد كسر أصلي وليس بعدها حرف استعلاء مفتوح.',
      'يجوز الوجهان في كلمة {فِرْقٍ} بحسب سكون القاف وكسر الراء.'
    ],
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/089001.mp3',
    audioTitle: 'أمثلة أحكام الراء من سورة الفجر',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/comprehensive_applied_workshop.pdf',
    pdfTitle: 'ملخص أحكام الراءات تفخيماً وترقيقاً - PDF',
    isRecommendedBeforeLive: false,
    thumbnailBadge: 'تسجيل صوتي معتمد'
  },
  {
    id: 'res-aud-5',
    title: 'تسجيل قواعد الوقف والابتداء وعلامات المصحف الشريف',
    subtitle: 'الوقف التام، الكافي، الحسن، والقبيح، ومراعاة المعنى العقدي واللغوي',
    category: 'audio_rule',
    categoryLabel: 'قاعدة مسجلة مسبقاً',
    subject: 'التطبيق العملي والوقف والابتداء',
    speaker: 'د. أيمن رشدي سويد والشيخ الحصري',
    durationMinutes: 8,
    durationLabel: '8 دقائق',
    description: 'شرح صوتي وعملي لرموز المصحف (مـ، ج، صلي، قلي، لا) وكيفية التوقف الصحيح وحسن الابتداء بما لا يخل بالمعنى.',
    keyPoints: [
      'علامة (مـ): وقف لازم لا يجوز وصله لئلا يوهم غير المراد.',
      'علامة (لا): لا يجوز الوقف عليها لتعلق ما بعدها بما قبلها معنى ولفظاً.',
      'علامة (قلي): الوقف أولى مع جواز الوصل، وعلامة (صلي): الوصل أولى مع جواز الوقف.'
    ],
    audioUrl: 'https://everyayah.com/data/Husary_Muallim_128kbps/114001.mp3',
    audioTitle: 'أمثلة الوقف على رؤوس الآي من سورة الناس والفلق',
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/final_tajweed_curriculum_exam.pdf',
    pdfTitle: 'دليل رموز الوقف والابتداء في المصحف - PDF',
    isRecommendedBeforeLive: true,
    thumbnailBadge: 'تسجيل صوتي معتمد'
  },

  // 3. أدلة وملخصات PDF معتمدة
  {
    id: 'res-pdf-1',
    title: 'دليل التجويد الشامل - مقرأة رحاب القرآن الإلكترونية 2026',
    subtitle: 'الملخص الأكاديمي المعتمد لجميع أحكام التلاوة والقراءات بالسند',
    category: 'pdf_guide',
    categoryLabel: 'دليل PDF معتمد',
    subject: 'مبادئ التجويد ومراتب القراءة',
    speaker: 'إدارة الشؤون الأكاديمية بالمقرأة',
    durationMinutes: 20,
    durationLabel: 'ملف 24 صفحة',
    description: 'كتاب إلكتروني شامل يضم رسومات توضيحية لجميع مخارج الحروف، وجداول مقارنة أحكام النون والميم والمدود، ومنظومة تحفة الأطفال والجزرية مشكولة بالكامل.',
    keyPoints: [
      'يحتوي على تدريبات عملية عقب كل باب تجويدي.',
      'معتمد من فضيلة المشرف العام د. علي عزيزي ونخبة شيوخ الإقراء.',
      'جاهز للطباعة والقراءة غير المتصلة بالإنترنت.'
    ],
    pdfUrl: 'https://archive.org/download/tajweed-guide-rehab/tajweed_intro_basics.pdf',
    pdfTitle: 'تحميل دليل التجويد الشامل 2026 - PDF',
    isRecommendedBeforeLive: true,
    thumbnailBadge: '📄 تحميل PDF'
  }
];

export const RESOURCE_CATEGORIES = [
  { id: 'all', label: 'جميع المصادر' },
  { id: 'video', label: 'مقاطع فيديو توضيحية 🎥' },
  { id: 'audio_rule', label: 'قواعد تجويد مسجلة 🔊' },
  { id: 'pdf_guide', label: 'أدلة وملخصات PDF 📄' }
];

export const RESOURCE_SUBJECTS = [
  'جميع الموضوعات',
  'أحكام النون الساكنة والتنوين',
  'أحكام الميم الساكنة والمشددتين',
  'أحكام المدود وأنواعها',
  'مخارج الحروف العربية',
  'صفات الحروف العربية',
  'مبادئ التجويد ومراتب القراءة',
  'التطبيق العملي والوقف والابتداء'
];
