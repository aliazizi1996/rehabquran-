/**
 * بنك أسئلة اختبارات التثبيت والحفظ القرآني وإدارة ملفات الإنجاز
 * مقرأة رحاب القرآن الإلكترونية 2026
 * يتيح للطلاب اختبار حفظهم للسور التي أتموا مراجعتها وربط النتائج بملف إنجازهم الأكاديمي
 */

import { addStudentEvaluation, getStudentByUserId, getAcademyDatabase, saveAcademyDatabase } from './academyDb';
import { saveDailyRecitation } from './evaluationStore';
import { saveDocumentItem } from '../services/firestoreService';

export interface SurahQuizQuestion {
  id: string;
  surahNumber: number;
  surahName: string;
  type: 'complete_ayah' | 'next_ayah' | 'mutashabihat' | 'surah_info';
  typeLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  ayahNumber?: number;
}

export interface StudentQuizResult {
  id: string;
  studentId: string;
  studentName: string;
  surahNumber: number;
  surahName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage e.g. 100
  grade: 'ممتاز مع مرتبة الشرف' | 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج مزيداً من التثبيت';
  completedAt: string;
  dateStr: string;
  timeStr: string;
  answers: Record<string, number>;
  timeSpentSeconds: number;
  evaluationNote: string;
  badgeAwarded?: string;
}

const STORAGE_KEY = 'rehab_student_surah_quizzes_v1';

// بنك أسئلة قرآني رصين وموثوق للسور الأكثر مراجعة في الحلقات
export const SURAH_QUIZ_BANK: Record<number, SurahQuizQuestion[]> = {
  // سورة الفاتحة (1)
  1: [
    {
      id: 'q-1-1',
      surahNumber: 1,
      surahName: 'الفاتحة',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {اهْدِنَا الصِّرَاطَ ...}',
      options: ['الْمُسْتَقِيمَ', 'الْعَظِيمَ', 'الْكَرِيمَ', 'الْعَلِيَّ'],
      correctIndex: 0,
      explanation: 'الآية (6) من سورة الفاتحة: {اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ}.',
      ayahNumber: 6,
    },
    {
      id: 'q-1-2',
      surahNumber: 1,
      surahName: 'الفاتحة',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {مَالِكِ يَوْمِ الدِّينِ}؟',
      options: [
        '{إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ}',
        '{اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ}',
        '{الرَّحْمَٰنِ الرَّحِيمِ}',
        '{صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ}',
      ],
      correctIndex: 0,
      explanation: 'الآية (5) تلي الآية (4) مباشرة: {إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ}.',
      ayahNumber: 5,
    },
    {
      id: 'q-1-3',
      surahNumber: 1,
      surahName: 'الفاتحة',
      type: 'surah_info',
      typeLabel: 'بيانات السورة',
      question: 'كم عدد آيات سورة الفاتحة الكريمة (السبع المثاني)؟',
      options: ['7 آيات', '6 آيات', '8 آيات', '5 آيات'],
      correctIndex: 0,
      explanation: 'سورة الفاتحة سبع آيات بالاتفاق، وهي السبع المثاني.',
    },
    {
      id: 'q-1-4',
      surahNumber: 1,
      surahName: 'الفاتحة',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل ختام سورة الفاتحة: {صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ ...}',
      options: ['وَلَا الضَّالِّينَ', 'وَلَا الْخَاسِرِينَ', 'وَلَا الْفَاسِقِينَ', 'وَلَا الْكَافِرِينَ'],
      correctIndex: 0,
      explanation: 'الآية (7): {صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ}.',
      ayahNumber: 7,
    },
  ],

  // سورة الكهف (18)
  18: [
    {
      id: 'q-18-1',
      surahNumber: 18,
      surahName: 'الكهف',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى في مطلع الكهف: {الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ ...}',
      options: [
        'وَلَمْ يَجْعَل لَّهُ عِوَجًا',
        'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا',
        'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
        'هُدًى وَبُشْرَىٰ لِلْمُؤْمِنِينَ',
      ],
      correctIndex: 0,
      explanation: 'الآية (1) من سورة الكهف: {وَلَمْ يَجْعَل لَّهُ عِوَجًا}.',
      ayahNumber: 1,
    },
    {
      id: 'q-18-2',
      surahNumber: 18,
      surahName: 'الكهف',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {إِنَّا جَعَلْنَا مَا عَلَى الْأَرْضِ زِينَةً لَّهَا لِنَبْلُوَهُمْ أَيُّهُمْ أَحْسَنُ عَمَلًا}؟',
      options: [
        '{وَإِنَّا لَجَاعِلُونَ مَا عَلَيْهَا صَعِيدًا جُرُزًا}',
        '{أَمْ حَسِبْتَ أَنَّ أَصْحَابَ الْكَهْفِ وَالرَّقِيمِ كَانُوا مِنْ آيَاتِنَا عَجَبًا}',
        '{إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ}',
        '{نَحْنُ نَقُصُّ عَلَيْكَ نَبَأَهُم بِالْحَقِّ}',
      ],
      correctIndex: 0,
      explanation: 'الآية (8) تلي الآية (7): {وَإِنَّا لَجَاعِلُونَ مَا عَلَيْهَا صَعِيدًا جُرُزًا}.',
      ayahNumber: 8,
    },
    {
      id: 'q-18-3',
      surahNumber: 18,
      surahName: 'الكهف',
      type: 'mutashabihat',
      typeLabel: 'ضبط المتشابهات',
      question: 'في قصة صاحب الجنتين، ماذا قال حين دخل جنته وهو ظالم لنفسه؟',
      options: [
        '{قَالَ مَا أَظُنُّ أَن تَبِيدَ هَٰذِهِ أَبَدًا}',
        '{قَالَ لَوْلَا إِذْ دَخَلْتَ جَنَّتَكَ قُلْتَ مَا شَاءَ اللَّهُ}',
        '{قَالَ يَا وَيْلَتَىٰ لَيْتَنِي لَمْ أُشْرِكْ بِرَبِّي أَحَدًا}',
        '{قَالَ إِنَّمَا أُوتِيتُهُ عَلَىٰ عِلْمٍ عِندِي}',
      ],
      correctIndex: 0,
      explanation: 'الآية (35): {وَدَخَلَ جَنَّتَهُ وَهُوَ ظَالِمٌ لِّنَفْسِهِ قَالَ مَا أَظُنُّ أَن تَبِيدَ هَٰذِهِ أَبَدًا}.',
      ayahNumber: 35,
    },
    {
      id: 'q-18-4',
      surahNumber: 18,
      surahName: 'الكهف',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى في أواخر سورة الكهف: {قُل لَّوْ كَانَ الْبَحْرُ مِدَادًا لِّكَلِمَاتِ رَبِّي لَنَفِدَ الْبَحْرُ قَبْلَ أَن تَنفَدَ كَلِمَاتُ رَبِّي ...}',
      options: [
        'وَلَوْ جِئْنَا بِمِثْلِهِ مَدَدًا',
        'إِنَّ رَبِّي لَغَفُورٌ رَّحِيمٌ',
        'وَمَا كَانَ رَبُّكَ نَسِيًّا',
        'وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِ أَحَدًا',
      ],
      correctIndex: 0,
      explanation: 'الآية (109): {وَلَوْ جِئْنَا بِمِثْلِهِ مَدَدًا}.',
      ayahNumber: 109,
    },
    {
      id: 'q-18-5',
      surahNumber: 18,
      surahName: 'الكهف',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة الكهف: {فَمَن كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا ...}',
      options: [
        'وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِ أَحَدًا',
        'وَاتَّقُوا اللَّهَ إِنَّ اللَّهَ شَدِيدُ الْعِقَابِ',
        'وَيُقِيمُوا الصَّلَاةَ وَيُؤْتُوا الزَّكَاةَ',
        'إِنَّهُ كَانَ بِي حَفِيًّا',
      ],
      correctIndex: 0,
      explanation: 'الآية (110): {فَمَن كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِ أَحَدًا}.',
      ayahNumber: 110,
    },
  ],

  // سورة يس (36)
  36: [
    {
      id: 'q-36-1',
      surahNumber: 36,
      surahName: 'يس',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {يس (1) وَالْقُرْآنِ الْحَكِيمِ (2) إِنَّكَ لَمِنَ الْمُرْسَلِينَ (3) ...}',
      options: [
        'عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ',
        'تَنزِيلَ الْعَزِيزِ الرَّحِيمِ',
        'لِتُنذِرَ قَوْمًا مَّا أُنذِرَ آبَاؤُهُمْ',
        'لَقَدْ حَقَّ الْقَوْلُ عَلَىٰ أَكْثَرِهِمْ',
      ],
      correctIndex: 0,
      explanation: 'الآية (4) من سورة يس: {عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ}.',
      ayahNumber: 4,
    },
    {
      id: 'q-36-2',
      surahNumber: 36,
      surahName: 'يس',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {وَجَاءَ مِنْ أَقْصَى الْمَدِينَةِ رَجُلٌ يَسْعَىٰ قَالَ يَا قَوْمِ اتَّبِعُوا الْمُرْسَلِينَ}؟',
      options: [
        '{اتَّبِعُوا مَن لَّا يَسْأَلُكُمْ أَجْرًا وَهُم مُّهْتَدُونَ}',
        '{وَمَا لِيَ لَا أَعْبُدُ الَّذِي فَطَرَنِي وَإِلَيْهِ تُرْجَعُونَ}',
        '{قِيلَ ادْخُلِ الْجَنَّةَ ۖ قَالَ يَا لَيْتَ قَوْمِي يَعْلَمُونَ}',
        '{أَأَتَّخِذُ مِن دُونِهِ آلِهَةً}',
      ],
      correctIndex: 0,
      explanation: 'الآية (21) تلي الآية (20): {اتَّبِعُوا مَن لَّا يَسْأَلُكُمْ أَجْرًا وَهُم مُّهْتَدُونَ}.',
      ayahNumber: 21,
    },
    {
      id: 'q-36-3',
      surahNumber: 36,
      surahName: 'يس',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {سَلَامٌ قَوْلًا مِّن ...}',
      options: ['رَّبٍّ رَّحِيمٍ', 'رَبِّ الْعَالَمِينَ', 'عَزِيزٍ حَكِيمٍ', 'غَفُورٍ رَّحِيمٍ'],
      correctIndex: 0,
      explanation: 'الآية (58) من سورة يس: {سَلَامٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ}.',
      ayahNumber: 58,
    },
    {
      id: 'q-36-4',
      surahNumber: 36,
      surahName: 'يس',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ ...}',
      options: [
        'كُن فَيَكُونُ',
        'حَقًّا عَلَيْنَا نُنْجِ الْمُؤْمِنِينَ',
        'فَسُبْحَانَ الَّذِي بِيَدِهِ مَلَكُوتُ كُلِّ شَيْءٍ',
        'قُلْ يُحْيِيهَا الَّذِي أَنشَأَهَا أَوَّلَ مَرَّةٍ',
      ],
      correctIndex: 0,
      explanation: 'الآية (82) من سورة يس: {إِنَّمَا أَمْرُهُ إِذَا أَرَادَ شَيْئًا أَن يَقُولَ لَهُ كُن فَيَكُونُ}.',
      ayahNumber: 82,
    },
  ],

  // سورة الملك (67)
  67: [
    {
      id: 'q-67-1',
      surahNumber: 67,
      surahName: 'الملك',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل مطلع سورة الملك: {تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ ...}',
      options: ['قَدِيرٌ', 'عَلِيمٌ', 'شَهِيدٌ', 'بَصِيرٌ'],
      correctIndex: 0,
      explanation: 'الآية (1) من سورة الملك: {تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ}.',
      ayahNumber: 1,
    },
    {
      id: 'q-67-2',
      surahNumber: 67,
      surahName: 'الملك',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ}؟',
      options: [
        '{الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ}',
        '{فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ}',
        '{وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ}',
        '{وَإِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا}',
      ],
      correctIndex: 0,
      explanation: 'الآية (3) تلي الآية (2): {الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا...}.',
      ayahNumber: 3,
    },
    {
      id: 'q-67-3',
      surahNumber: 67,
      surahName: 'الملك',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ ۖ إِنَّهُ عَلِيمٌ بِذَاتِ ...}',
      options: ['الصُّدُورِ', 'الْقُلُوبِ', 'النُّفُوسِ', 'السَّمَاوَاتِ'],
      correctIndex: 0,
      explanation: 'الآية (13): {إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ}.',
      ayahNumber: 13,
    },
    {
      id: 'q-67-4',
      surahNumber: 67,
      surahName: 'الملك',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل ختام سورة الملك: {قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ ...}',
      options: ['مَّعِينٍ', 'فُرَاتٍ', 'ثَجَّاجٍ', 'طَهُورٍ'],
      correctIndex: 0,
      explanation: 'الآية (30): {قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ}.',
      ayahNumber: 30,
    },
  ],

  // سورة النبأ (78)
  78: [
    {
      id: 'q-78-1',
      surahNumber: 78,
      surahName: 'النبأ',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {عَمَّ يَتَسَاءَلُونَ (1) عَنِ النَّبَإِ ... (2)}',
      options: ['الْعَظِيمِ', 'الْكَرِيمِ', 'الْمُبِينِ', 'الْحَكِيمِ'],
      correctIndex: 0,
      explanation: 'الآية (2) من سورة النبأ: {عَنِ النَّبَإِ الْعَظِيمِ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-78-2',
      surahNumber: 78,
      surahName: 'النبأ',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا}؟',
      options: [
        '{وَالْجِبَالَ أَوْتَادًا}',
        '{وَخَلَقْنَاكُمْ أَزْوَاجًا}',
        '{وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا}',
        '{وَجَعَلْنَا اللَّيْلَ لِبَاسًا}',
      ],
      correctIndex: 0,
      explanation: 'الآية (7): {وَالْجِبَالَ أَوْتَادًا}.',
      ayahNumber: 7,
    },
    {
      id: 'q-78-3',
      surahNumber: 78,
      surahName: 'النبأ',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {إِنَّ لِلْمُتَّقِينَ مَفَازًا (31) حَدَائِقَ وَأَعْنَابًا (32) وَكَوَاعِبَ ... (33)}',
      options: ['أَتْرَابًا', 'حِسَانًا', 'مُطَهَّرَةً', 'قَاصِرَاتِ الطَّرْفِ'],
      correctIndex: 0,
      explanation: 'الآية (33) من سورة النبأ: {وَكَوَاعِبَ أَتْرَابًا}.',
      ayahNumber: 33,
    },
    {
      id: 'q-78-4',
      surahNumber: 78,
      surahName: 'النبأ',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة النبأ: {وَيَقُولُ الْكَافِرُ يَا لَيْتَنِي كُنتُ ...}',
      options: ['تُرَابًا', 'صَلْصَالًا', 'عِظَامًا', 'نَسْيًا مَّنسِيًّا'],
      correctIndex: 0,
      explanation: 'الآية (40): {وَيَقُولُ الْكَافِرُ يَا لَيْتَنِي كُنتُ تُرَابًا}.',
      ayahNumber: 40,
    },
  ],

  // سورة الأعلى (87)
  87: [
    {
      id: 'q-87-1',
      surahNumber: 87,
      surahName: 'الأعلى',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل مطلع السورة: {سَبِّحِ اسْمَ رَبِّكَ ...}',
      options: ['الْأَعْلَى', 'الْعَظِيمِ', 'الْكَرِيمِ', 'الْوَهَّابِ'],
      correctIndex: 0,
      explanation: 'الآية (1): {سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى}.',
      ayahNumber: 1,
    },
    {
      id: 'q-87-2',
      surahNumber: 87,
      surahName: 'الأعلى',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {سَنُقْرِئُكَ فَلَا تَنسَىٰ}؟',
      options: [
        '{إِلَّا مَا شَاءَ اللَّهُ ۚ إِنَّهُ يَعْلَمُ الْجَهْرَ وَمَا يَخْفَىٰ}',
        '{وَنُيَسِّرُكَ لِلْيُسْرَىٰ}',
        '{فَذَكِّرْ إِن نَّفَعَتِ الذِّكْرَىٰ}',
        '{سَيَذَّكَّرُ مَن يَخْشَىٰ}',
      ],
      correctIndex: 0,
      explanation: 'الآية (7): {إِلَّا مَا شَاءَ اللَّهُ ۚ إِنَّهُ يَعْلَمُ الْجَهْرَ وَمَا يَخْفَىٰ}.',
      ayahNumber: 7,
    },
    {
      id: 'q-87-3',
      surahNumber: 87,
      surahName: 'الأعلى',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى في أواخر سورة الأعلى: {إِنَّ هَٰذَا لَفِي الصُّحُفِ الْأُولَىٰ (18) صُحُفِ إِبْرَاهِيمَ وَ... (19)}',
      options: ['مُوسَىٰ', 'عِيسَىٰ', 'دَاوُودَ', 'نُوحٍ'],
      correctIndex: 0,
      explanation: 'الآية (19): {صُحُفِ إِبْرَاهِيمَ وَمُوسَىٰ}.',
      ayahNumber: 19,
    },
  ],

  // سورة الضحى (93)
  93: [
    {
      id: 'q-93-1',
      surahNumber: 93,
      surahName: 'الضحى',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {وَالضُّحَىٰ (1)}؟',
      options: [
        '{وَاللَّيْلِ إِذَا سَجَىٰ}',
        '{مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ}',
        '{وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ}',
        '{وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ}',
      ],
      correctIndex: 0,
      explanation: 'الآية (2): {وَاللَّيْلِ إِذَا سَجَىٰ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-93-2',
      surahNumber: 93,
      surahName: 'الضحى',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {فَأَمَّا الْيَتِيمَ فَلَا ...}',
      options: ['تَقْهَرْ', 'تَنْهَرْ', 'تَظْلِمْ', 'تَصْرِفْ'],
      correctIndex: 0,
      explanation: 'الآية (9): {فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ}.',
      ayahNumber: 9,
    },
    {
      id: 'q-93-3',
      surahNumber: 93,
      surahName: 'الضحى',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل ختام سورة الضحى: {وَأَمَّا بِنِعْمَةِ رَبِّكَ ...}',
      options: ['فَحَدِّثْ', 'فَاشْكُرْ', 'فَسَبِّحْ', 'فَاذْكُرْ'],
      correctIndex: 0,
      explanation: 'الآية (11): {وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ}.',
      ayahNumber: 11,
    },
  ],

  // سورة الشرح (94)
  94: [
    {
      id: 'q-94-1',
      surahNumber: 94,
      surahName: 'الشرح',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ (1) وَوَضَعْنَا عَنكَ ... (2)}',
      options: ['وِزْرَكَ', 'هَمَّكَ', 'حُزْنَكَ', 'ضِيقَكَ'],
      correctIndex: 0,
      explanation: 'الآية (2): {وَوَضَعْنَا عَنكَ وِزْرَكَ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-94-2',
      surahNumber: 94,
      surahName: 'الشرح',
      type: 'next_ayah',
      typeLabel: 'الآية التالية',
      question: 'ما الآية التالية لقوله تعالى: {فَإِنَّ مَعَ الْعُسْرِ يُسْرًا (5)}؟',
      options: [
        '{إِنَّ مَعَ الْعُسْرِ يُسْرًا}',
        '{فَإِذَا فَرَغْتَ فَانصَبْ}',
        '{وَإِلَىٰ رَبِّكَ فَارْغَب}',
        '{وَرَفَعْنَا لَكَ ذِكْرَكَ}',
      ],
      correctIndex: 0,
      explanation: 'الآية (6): {إِنَّ مَعَ الْعُسْرِ يُسْرًا}.',
      ayahNumber: 6,
    },
  ],

  // سورة القدر (97)
  97: [
    {
      id: 'q-97-1',
      surahNumber: 97,
      surahName: 'القدر',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ (1) وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ (2) لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ ... (3)}',
      options: ['أَلْفِ شَهْرٍ', 'أَلْفِ سَنَةٍ', 'سَبْعِينَ سَنَةٍ', 'مِائَةِ شَهْرٍ'],
      correctIndex: 0,
      explanation: 'الآية (3): {لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ}.',
      ayahNumber: 3,
    },
    {
      id: 'q-97-2',
      surahNumber: 97,
      surahName: 'القدر',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة القدر: {سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ ... (5)}',
      options: ['الْفَجْرِ', 'الشَّمْسِ', 'النَّهَارِ', 'الصَّبَاحِ'],
      correctIndex: 0,
      explanation: 'الآية (5): {سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ}.',
      ayahNumber: 5,
    },
  ],

  // سورة الكوثر (108)
  108: [
    {
      id: 'q-108-1',
      surahNumber: 108,
      surahName: 'الكوثر',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ (1) فَصَلِّ لِرَبِّكَ وَ... (2)}',
      options: ['انْحَرْ', 'اصْبِرْ', 'اسْجُدْ', 'اقْتَرِبْ'],
      correctIndex: 0,
      explanation: 'الآية (2): {فَصَلِّ لِرَبِّكَ وَانْحَرْ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-108-2',
      surahNumber: 108,
      surahName: 'الكوثر',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة الكوثر: {إِنَّ شَانِئَكَ هُوَ ... (3)}',
      options: ['الْأَبْتَرُ', 'الْأَخْسَرُ', 'الْمَهِينُ', 'الْمَغْلُوبُ'],
      correctIndex: 0,
      explanation: 'الآية (3): {إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ}.',
      ayahNumber: 3,
    },
  ],

  // سورة الإخلاص (112)
  112: [
    {
      id: 'q-112-1',
      surahNumber: 112,
      surahName: 'الإخلاص',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {قُلْ هُوَ اللَّهُ أَحَدٌ (1) اللَّهُ ... (2)}',
      options: ['الصَّمَدُ', 'الْأَحَدُ', 'الْعَزِيزُ', 'الْقَدِيرُ'],
      correctIndex: 0,
      explanation: 'الآية (2): {اللَّهُ الصَّمَدُ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-112-2',
      surahNumber: 112,
      surahName: 'الإخلاص',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة الإخلاص: {وَلَمْ يَكُن لَّهُ كُفُوًا ... (4)}',
      options: ['أَحَدٌ', 'أَبَدًا', 'شَرِيكٌ', 'نِدٌّ'],
      correctIndex: 0,
      explanation: 'الآية (4): {وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ}.',
      ayahNumber: 4,
    },
  ],

  // سورة الفلق (113)
  113: [
    {
      id: 'q-113-1',
      surahNumber: 113,
      surahName: 'الفلق',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ (1) مِن شَرِّ مَا ... (2)}',
      options: ['خَلَقَ', 'بَرَأَ', 'ذَرَأَ', 'قَدَّرَ'],
      correctIndex: 0,
      explanation: 'الآية (2): {مِن شَرِّ مَا خَلَقَ}.',
      ayahNumber: 2,
    },
    {
      id: 'q-113-2',
      surahNumber: 113,
      surahName: 'الفلق',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {وَمِن شَرِّ النَّفَّاثَاتِ فِي ... (4)}',
      options: ['الْعُقَدِ', 'الْأَرْضِ', 'الظُّلُمَاتِ', 'الْقُلُوبِ'],
      correctIndex: 0,
      explanation: 'الآية (4): {وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ}.',
      ayahNumber: 4,
    },
  ],

  // سورة الناس (114)
  114: [
    {
      id: 'q-114-1',
      surahNumber: 114,
      surahName: 'الناس',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'أكمل قوله تعالى: {قُلْ أَعُوذُ بِرَبِّ النَّاسِ (1) مَلِكِ النَّاسِ (2) إِلَٰهِ النَّاسِ (3) مِن شَرِّ ... (4)}',
      options: [
        'الْوَسْوَاسِ الْخَنَّاسِ',
        'الشَّيْطَانِ الرَّجِيمِ',
        'الْحَاسِدِينَ',
        'الْمُفْسِدِينَ فِي الْأَرْضِ',
      ],
      correctIndex: 0,
      explanation: 'الآية (4): {مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ}.',
      ayahNumber: 4,
    },
    {
      id: 'q-114-2',
      surahNumber: 114,
      surahName: 'الناس',
      type: 'complete_ayah',
      typeLabel: 'إكمال الآية',
      question: 'ختام سورة الناس: {الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ (5) مِنَ ... (6)}',
      options: [
        'الْجِنَّةِ وَالنَّاسِ',
        'الْأَشْرَارِ وَالْفُجَّارِ',
        'الظَّالِمِينَ وَالْكَافِرِينَ',
        'الْخَائِنِينَ',
      ],
      correctIndex: 0,
      explanation: 'الآية (6): {مِنَ الْجِنَّةِ وَالنَّاسِ}.',
      ayahNumber: 6,
    },
  ],
};

/**
 * توليد أسئلة تثبيت ذكية ومحكمة لأي سورة من سور القرآن الكريم
 */
export function getQuestionsForSurah(surahNumber: number, surahName: string): SurahQuizQuestion[] {
  if (SURAH_QUIZ_BANK[surahNumber] && SURAH_QUIZ_BANK[surahNumber].length > 0) {
    return SURAH_QUIZ_BANK[surahNumber];
  }

  // توليد أسئلة منهجية للسورة إذا لم تكن في البنك اليدوي
  return [
    {
      id: `gen-${surahNumber}-1`,
      surahNumber,
      surahName,
      type: 'surah_info',
      typeLabel: 'بيانات السورة وموضعها',
      question: `ما ترتيب سورة ${surahName} في المصحف الشريف؟`,
      options: [
        `السورة رقم ${surahNumber}`,
        `السورة رقم ${Math.max(1, surahNumber - 1)}`,
        `السورة رقم ${surahNumber + 1}`,
        `السورة رقم ${surahNumber + 2}`,
      ],
      correctIndex: 0,
      explanation: `ترتيب سورة ${surahName} في المصحف الشريف هو السورة رقم ${surahNumber}.`,
    },
    {
      id: `gen-${surahNumber}-2`,
      surahNumber,
      surahName,
      type: 'complete_ayah',
      typeLabel: 'تثبيت الحفظ والمراجعة',
      question: `عند مراجعة سورة ${surahName}، ما الآداب المتعين مراعاتها في التلاوة؟`,
      options: [
        'التأني وتدبر المعاني ومراعاة أحكام التجويد ومخارج الحروف',
        'الإسراع دون التوقف عند رؤوس الآي',
        'تجاوز ضبط الفواصل القرآنية',
        'عدم الالتزام بأوجه الوقف والابتداء',
      ],
      correctIndex: 0,
      explanation: 'التلاوة المتقنة تجمع بين حسن الصوت، وضبط المخارج والصفات، وتدبر الآيات.',
    },
    {
      id: `gen-${surahNumber}-3`,
      surahNumber,
      surahName,
      type: 'mutashabihat',
      typeLabel: 'ضبط المتشابهات',
      question: `كيف تثبت مواضع المتشابهات في سورة ${surahName}؟`,
      options: [
        'بربط الآية بما قبلها وما بعدها وتكرار السرد عن ظهر قلب',
        'بالقراءة العشوائية المتقطعة',
        'بالاكتفاء بالقراءة النظرية من المصحف',
        'بإهمال مراجعة الآيات المتشابهة',
      ],
      correctIndex: 0,
      explanation: 'ضبط المتشابهات يعتمد على التكرار الممنهج والتسميع المباشر على المعلم.',
    },
  ];
}

/**
 * جلب جميع نتائج اختبارات الطالب
 */
export function getStudentQuizResults(studentId?: string): StudentQuizResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: StudentQuizResult[] = JSON.parse(raw);
    if (studentId) {
      return list.filter((r) => r.studentId === studentId);
    }
    return list;
  } catch (e) {
    console.error('Failed to load student quiz results', e);
    return [];
  }
}

/**
 * حفظ نتيجة اختبار وتوثيقها رسمياً في ملف إنجاز الطالب
 */
export async function recordStudentQuizResult(params: {
  studentId: string;
  studentName: string;
  surahNumber: number;
  surahName: string;
  totalQuestions: number;
  correctAnswers: number;
  answers: Record<string, number>;
  timeSpentSeconds: number;
}): Promise<StudentQuizResult> {
  const percentage = Math.round((params.correctAnswers / params.totalQuestions) * 100);

  let grade: StudentQuizResult['grade'] = 'يحتاج مزيداً من التثبيت';
  let badge = '';

  if (percentage === 100) {
    grade = 'ممتاز مع مرتبة الشرف';
    badge = 'وسام الحفظ الذهبي 🌟';
  } else if (percentage >= 85) {
    grade = 'ممتاز';
    badge = 'وسام الإتقان القرآني 🏅';
  } else if (percentage >= 70) {
    grade = 'جيد جداً';
    badge = 'وسام المراجعة المستمرة 📖';
  } else if (percentage >= 50) {
    grade = 'جيد';
    badge = 'وسام المحاولة والتثبيت 🌿';
  }

  const evaluationNote = `تم اجتياز اختبار تثبيت سورة ${params.surahName} بنسبة ${percentage}% بتقدير (${grade}).`;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const result: StudentQuizResult = {
    id: `sqz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    studentId: params.studentId,
    studentName: params.studentName,
    surahNumber: params.surahNumber,
    surahName: params.surahName,
    totalQuestions: params.totalQuestions,
    correctAnswers: params.correctAnswers,
    score: percentage,
    grade,
    completedAt: now.toISOString(),
    dateStr,
    timeStr,
    answers: params.answers,
    timeSpentSeconds: params.timeSpentSeconds,
    evaluationNote,
    badgeAwarded: badge,
  };

  // 1. الحفظ في التخزين المحلي للاختبارات
  const current = getStudentQuizResults();
  const updated = [result, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('rehab_student_quizzes_updated', { detail: result }));
  } catch (e) {
    console.error('Error saving quiz result to localStorage:', e);
  }

  // 2. ربط النتيجة بملف إنجاز الطالب في academyDb (تقييم الحفظ والتسميع)
  try {
    addStudentEvaluation({
      studentId: params.studentId,
      studentName: params.studentName,
      teacherId: 'sheikh-evaluator',
      teacherName: 'لجنة اختبارات التثبيت الإلكترونية',
      date: dateStr,
      surah: params.surahName,
      fromAyah: 1,
      toAyah: params.totalQuestions,
      lessonType: 'تثبيت',
      score: percentage,
      hifzScore: percentage,
      tajweedScore: 95,
      grade: percentage >= 85 ? 'ممتاز' : percentage >= 70 ? 'جيد جداً' : percentage >= 50 ? 'جيد' : 'يحتاج متابعة',
      teacherNotes: `نتيجة اختبار تثبيت سورة ${params.surahName} الإلكتروني: ${percentage}% - ${badge}`,
    });
  } catch (err) {
    console.warn('Error syncing evaluation to academyDb:', err);
  }

  // 3. ربط النتيجة بسجل التسميع اليومي (DailyRecitationRecord)
  try {
    const perfGrade: 'excellent' | 'very_good' | 'good' | 'weak' = 
      percentage >= 85 ? 'excellent' : percentage >= 70 ? 'very_good' : percentage >= 50 ? 'good' : 'weak';

    saveDailyRecitation({
      studentId: params.studentId,
      studentName: params.studentName,
      studentSection: 'male',
      date: dateStr,
      surahName: params.surahName,
      juzNumber: 30,
      ayahStart: 1,
      ayahEnd: params.totalQuestions,
      attendanceStatus: 'present',
      grade: perfGrade,
      score: percentage,
      hifzScore: percentage,
      evaluatorTeacher: 'منظومة اختبارات التثبيت بمقرأة رحاب القرآن',
      memorizationQuality: percentage >= 85 ? 'ممتاز' : percentage >= 70 ? 'جيد جداً' : 'متوسط',
      teacherFeedback: evaluationNote,
    });
  } catch (err) {
    console.warn('Error syncing to dailyRecitations:', err);
  }

  // 4. مزامنة مع Firestore لحفظ السجل في السحابة
  try {
    await saveDocumentItem('student_quizzes', result.id, {
      id: result.id,
      studentId: params.studentId,
      studentName: params.studentName,
      surahName: params.surahName,
      surahNumber: params.surahNumber,
      score: percentage,
      grade,
      badge,
      createdAt: now.toISOString(),
      dateStr,
    });
  } catch (err) {
    // يعمل التطبيق في وضع عدم الاتصال بدون أي مشكلة
  }

  return result;
}

/**
 * إحصاءات إنجازات الطالب في الاختبارات القصيرة
 */
export function getStudentQuizPortfolioSummary(studentId: string) {
  const results = getStudentQuizResults(studentId);
  const totalQuizzes = results.length;
  if (totalQuizzes === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      completedSurahsCount: 0,
      excellentCount: 0,
      badges: [],
      recentResults: [],
    };
  }

  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalQuizzes);
  const uniqueSurahs = new Set(results.map((r) => r.surahName));
  const excellentCount = results.filter((r) => r.score >= 85).length;
  const badges = Array.from(new Set(results.map((r) => r.badgeAwarded).filter(Boolean))) as string[];

  return {
    totalQuizzes,
    averageScore,
    completedSurahsCount: uniqueSurahs.size,
    excellentCount,
    badges,
    recentResults: results.slice(0, 5),
  };
}
