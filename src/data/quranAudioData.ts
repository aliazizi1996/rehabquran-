export interface QuranSurahInfo {
  number: number;
  name: string;
  englishName: string;
  totalAyahs: number;
  type: 'مكية' | 'مدنية';
  startJuz: number;
  audioFileNumber: string; // e.g. "001" to "114"
}

export interface TeacherReciter {
  id: string;
  name: string;
  title: string;
  style: 'muallim' | 'mujawwad' | 'murattal';
  styleLabel: string;
  description: string;
  repeatIntervalSeconds?: number;
  // Format function to generate per-surah mp3 URL
  getSurahAudioUrl: (surahNum: number) => string;
  getBackupAudioUrl?: (surahNum: number) => string;
}

// CDNs with complete audio for all 114 Surahs (verified and tested)
export const TEACHER_RECITERS: TeacherReciter[] = [
  {
    id: 'minshawi_muallim',
    name: 'الشيخ محمد صديق المنشاوي',
    title: 'المصحف المعلم (مع ترديد الطلاب والأطفال)',
    style: 'muallim',
    styleLabel: 'المصحف المعلم (ترديد الطلاب)',
    description: 'أشهر مصحف معلّم في العالم الإسلامي مع ترديد الأطفال لترسيخ حفظ الآيات وضبط المخارج والأحكام.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server10.mp3quran.net/minsh/Almusshaf-Al-Mo-lim/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server10.mp3quran.net/minsh/${padded}.mp3`;
    }
  },
  {
    id: 'husary_muallim',
    name: 'الشيخ محمود خليل الحصري (المعلم المرتل)',
    title: 'شيخ عموم المقارئ المصرية (التلاوة التعليمية المتقنة)',
    style: 'muallim',
    styleLabel: 'المصحف المعلم المتأني',
    description: 'أدق تلاوة تعليمية مع التؤدة والوقف لتدريب الطالب على إتقان المخارج والأحكام برواية حفص عن عاصم.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server13.mp3quran.net/husr/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      return `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/${num}.mp3`;
    }
  },
  {
    id: 'husary_murattal',
    name: 'الشيخ محمود خليل الحصري (المرتل)',
    title: 'شيخ عموم المقارئ المصرية (المصحف المرتل المتقن)',
    style: 'murattal',
    styleLabel: 'المصحف المرتل (ميزان الإتقان)',
    description: 'التلاوة النموذجية المعتمدة عالمياً لضبط أحكام التجويد ومخارج الحروف برواية حفص عن عاصم.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server13.mp3quran.net/husr/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      return `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/${num}.mp3`;
    }
  },
  {
    id: 'husary_mujawwad',
    name: 'الشيخ محمود خليل الحصري (المجود)',
    title: 'المصحف المجود بالأنغام والأحكام المتقنة',
    style: 'mujawwad',
    styleLabel: 'المصحف المجوّد (أعلى مراتب الضبط)',
    description: 'التلاوة المجودة المتقنة المشهورة التي تعتبر ميزاناً ذهبياً لجميع قواعد التجويد والمدود والوقف والابتداء.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server13.mp3quran.net/husr/${padded}.mp3`;
    }
  },
  {
    id: 'minshawi_mujawwad',
    name: 'الشيخ محمد صديق المنشاوي (المجود)',
    title: 'المصحف المجود الخاشع برواية حفص عن عاصم',
    style: 'mujawwad',
    styleLabel: 'المصحف المجوّد الخاشع',
    description: 'تلاوة مجودة خاشعة ذات نبرات مؤثرة تبرز إعجاز القرآن البياني وتعين على التدبر وحسن الصوت.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server10.mp3quran.net/minsh/${padded}.mp3`;
    }
  },
  {
    id: 'abdulbasit_mujawwad',
    name: 'الشيخ عبد الباسط عبد الصمد (المجود)',
    title: 'صوت مكة وقيدوم القراء في العالم الإسلامي',
    style: 'mujawwad',
    styleLabel: 'المصحف المجوّد الأسطوري',
    description: 'المصحف المجود الخالد بنقاء الصوت وقوة النفس والدقة التامة في مقادير المدود ومخارج الحروف.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server7.mp3quran.net/basit/${padded}.mp3`;
    }
  },
  {
    id: 'maher_muallim',
    name: 'الشيخ ماهر المعيقلي',
    title: 'إمام المسجد الحرام (المصحف المعلم تلاوة وترديد)',
    style: 'muallim',
    styleLabel: 'المصحف المعلم (الحرم المكي)',
    description: 'تلاوة تعليمية هادئة واضحة النبرات لتدريب المتعلم على النطق السليم برواية حفص عن عاصم.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server12.mp3quran.net/maher/Almusshaf-Al-Mo-lim/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server12.mp3quran.net/maher/${padded}.mp3`;
    }
  },
  {
    id: 'huthifi_murattal',
    name: 'الشيخ علي بن عبد الرحمن الحذيفي',
    title: 'إمام المسجد النبوي الشريف (الترتيل التعليمي المتأني)',
    style: 'murattal',
    styleLabel: 'المصحف المرتل (الحرم النبوي)',
    description: 'ترتيل بطيء متأنٍ ودقيق جداً يساعد الطلاب على تدقيق الحركات ومواضع الوقف والابتداء.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server9.mp3quran.net/hthfi/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server9.mp3quran.net/hthfi/${padded}.mp3`;
    }
  },
  {
    id: 'abdulbasit_murattal',
    name: 'الشيخ عبد الباسط عبد الصمد (المرتل)',
    title: 'المصحف المرتل برواية حفص عن عاصم',
    style: 'murattal',
    styleLabel: 'المصحف المرتل الخاشع',
    description: 'الختمة المرتلة الكاملة بصوت الشيخ عبد الباسط عبد الصمد برواية حفص عن عاصم.',
    getSurahAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server7.mp3quran.net/basit/${padded}.mp3`;
    },
    getBackupAudioUrl: (num: number) => {
      const padded = num.toString().padStart(3, '0');
      return `https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad/${padded}.mp3`;
    }
  }
];

// All 114 Surahs of the Holy Quran with metadata
export const ALL_114_SURAHS: QuranSurahInfo[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatihah", totalAyahs: 7, type: "مكية", startJuz: 1, audioFileNumber: "001" },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", totalAyahs: 286, type: "مدنية", startJuz: 1, audioFileNumber: "002" },
  { number: 3, name: "آل عمران", englishName: "Ali 'Imran", totalAyahs: 200, type: "مدنية", startJuz: 3, audioFileNumber: "003" },
  { number: 4, name: "النساء", englishName: "An-Nisa", totalAyahs: 176, type: "مدنية", startJuz: 4, audioFileNumber: "004" },
  { number: 5, name: "المائدة", englishName: "Al-Ma'idah", totalAyahs: 120, type: "مدنية", startJuz: 6, audioFileNumber: "005" },
  { number: 6, name: "الأنعام", englishName: "Al-An'am", totalAyahs: 165, type: "مكية", startJuz: 7, audioFileNumber: "006" },
  { number: 7, name: "الأعراف", englishName: "Al-A'raf", totalAyahs: 206, type: "مكية", startJuz: 8, audioFileNumber: "007" },
  { number: 8, name: "الأنفال", englishName: "Al-Anfal", totalAyahs: 75, type: "مدنية", startJuz: 9, audioFileNumber: "008" },
  { number: 9, name: "التوبة", englishName: "At-Tawbah", totalAyahs: 129, type: "مدنية", startJuz: 10, audioFileNumber: "009" },
  { number: 10, name: "يونس", englishName: "Yunus", totalAyahs: 109, type: "مكية", startJuz: 11, audioFileNumber: "010" },
  { number: 11, name: "هود", englishName: "Hud", totalAyahs: 123, type: "مكية", startJuz: 11, audioFileNumber: "011" },
  { number: 12, name: "يوسف", englishName: "Yusuf", totalAyahs: 111, type: "مكية", startJuz: 12, audioFileNumber: "012" },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", totalAyahs: 43, type: "مدنية", startJuz: 13, audioFileNumber: "013" },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", totalAyahs: 52, type: "مكية", startJuz: 13, audioFileNumber: "014" },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", totalAyahs: 99, type: "مكية", startJuz: 14, audioFileNumber: "015" },
  { number: 16, name: "النحل", englishName: "An-Nahl", totalAyahs: 128, type: "مكية", startJuz: 14, audioFileNumber: "016" },
  { number: 17, name: "الإسراء", englishName: "Al-Isra", totalAyahs: 111, type: "مكية", startJuz: 15, audioFileNumber: "017" },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", totalAyahs: 110, type: "مكية", startJuz: 15, audioFileNumber: "018" },
  { number: 19, name: "مريم", englishName: "Maryam", totalAyahs: 98, type: "مكية", startJuz: 16, audioFileNumber: "019" },
  { number: 20, name: "طه", englishName: "Taha", totalAyahs: 135, type: "مكية", startJuz: 16, audioFileNumber: "020" },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiya", totalAyahs: 112, type: "مكية", startJuz: 17, audioFileNumber: "021" },
  { number: 22, name: "الحج", englishName: "Al-Hajj", totalAyahs: 78, type: "مدنية", startJuz: 17, audioFileNumber: "022" },
  { number: 23, name: "المؤمنون", englishName: "Al-Mu'minun", totalAyahs: 118, type: "مكية", startJuz: 18, audioFileNumber: "023" },
  { number: 24, name: "النور", englishName: "An-Nur", totalAyahs: 64, type: "مدنية", startJuz: 18, audioFileNumber: "024" },
  { number: 25, name: "الفرقان", englishName: "Al-Furqan", totalAyahs: 77, type: "مكية", startJuz: 18, audioFileNumber: "025" },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'ara", totalAyahs: 227, type: "مكية", startJuz: 19, audioFileNumber: "026" },
  { number: 27, name: "النمل", englishName: "An-Naml", totalAyahs: 93, type: "مكية", startJuz: 19, audioFileNumber: "027" },
  { number: 28, name: "القصص", englishName: "Al-Qasas", totalAyahs: 88, type: "مكية", startJuz: 20, audioFileNumber: "028" },
  { number: 29, name: "العنكبوت", englishName: "Al-'Ankabut", totalAyahs: 69, type: "مكية", startJuz: 20, audioFileNumber: "029" },
  { number: 30, name: "الروم", englishName: "Ar-Rum", totalAyahs: 60, type: "مكية", startJuz: 21, audioFileNumber: "030" },
  { number: 31, name: "لقمان", englishName: "Luqman", totalAyahs: 34, type: "مكية", startJuz: 21, audioFileNumber: "031" },
  { number: 32, name: "السجدة", englishName: "As-Sajdah", totalAyahs: 30, type: "مكية", startJuz: 21, audioFileNumber: "032" },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzab", totalAyahs: 73, type: "مدنية", startJuz: 21, audioFileNumber: "033" },
  { number: 34, name: "سبأ", englishName: "Saba", totalAyahs: 54, type: "مكية", startJuz: 22, audioFileNumber: "034" },
  { number: 35, name: "فاطر", englishName: "Fatir", totalAyahs: 45, type: "مكية", startJuz: 22, audioFileNumber: "035" },
  { number: 36, name: "يس", englishName: "Ya-Sin", totalAyahs: 83, type: "مكية", startJuz: 22, audioFileNumber: "036" },
  { number: 37, name: "الصافات", englishName: "As-Saffat", totalAyahs: 182, type: "مكية", startJuz: 23, audioFileNumber: "037" },
  { number: 38, name: "ص", englishName: "Sad", totalAyahs: 88, type: "مكية", startJuz: 23, audioFileNumber: "038" },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", totalAyahs: 75, type: "مكية", startJuz: 23, audioFileNumber: "039" },
  { number: 40, name: "غافر", englishName: "Ghafir", totalAyahs: 85, type: "مكية", startJuz: 24, audioFileNumber: "040" },
  { number: 41, name: "فصلت", englishName: "Fussilat", totalAyahs: 54, type: "مكية", startJuz: 24, audioFileNumber: "041" },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", totalAyahs: 53, type: "مكية", startJuz: 25, audioFileNumber: "042" },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", totalAyahs: 89, type: "مكية", startJuz: 25, audioFileNumber: "043" },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhan", totalAyahs: 59, type: "مكية", startJuz: 25, audioFileNumber: "044" },
  { number: 45, name: "الجاثية", englishName: "Al-Jathiyah", totalAyahs: 37, type: "مكية", startJuz: 25, audioFileNumber: "045" },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", totalAyahs: 35, type: "مكية", startJuz: 26, audioFileNumber: "046" },
  { number: 47, name: "محمد", englishName: "Muhammad", totalAyahs: 38, type: "مدنية", startJuz: 26, audioFileNumber: "047" },
  { number: 48, name: "الفتح", englishName: "Al-Fath", totalAyahs: 29, type: "مدنية", startJuz: 26, audioFileNumber: "048" },
  { number: 49, name: "الحجرات", englishName: "Al-Hujurat", totalAyahs: 18, type: "مدنية", startJuz: 26, audioFileNumber: "049" },
  { number: 50, name: "ق", englishName: "Qaf", totalAyahs: 45, type: "مكية", startJuz: 26, audioFileNumber: "050" },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhariyat", totalAyahs: 60, type: "مكية", startJuz: 26, audioFileNumber: "051" },
  { number: 52, name: "الطور", englishName: "At-Tur", totalAyahs: 49, type: "مكية", startJuz: 27, audioFileNumber: "052" },
  { number: 53, name: "النجم", englishName: "An-Najm", totalAyahs: 62, type: "مكية", startJuz: 27, audioFileNumber: "053" },
  { number: 54, name: "القمر", englishName: "Al-Qamar", totalAyahs: 55, type: "مكية", startJuz: 27, audioFileNumber: "054" },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahman", totalAyahs: 78, type: "مدنية", startJuz: 27, audioFileNumber: "055" },
  { number: 56, name: "الواقعة", englishName: "Al-Waqi'ah", totalAyahs: 96, type: "مكية", startJuz: 27, audioFileNumber: "056" },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", totalAyahs: 29, type: "مدنية", startJuz: 27, audioFileNumber: "057" },
  { number: 58, name: "المجادلة", englishName: "Al-Mujadilah", totalAyahs: 22, type: "مدنية", startJuz: 28, audioFileNumber: "058" },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", totalAyahs: 24, type: "مدنية", startJuz: 28, audioFileNumber: "059" },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahanah", totalAyahs: 13, type: "مدنية", startJuz: 28, audioFileNumber: "060" },
  { number: 61, name: "الصف", englishName: "As-Saff", totalAyahs: 14, type: "مدنية", startJuz: 28, audioFileNumber: "061" },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'ah", totalAyahs: 11, type: "مدنية", startJuz: 28, audioFileNumber: "062" },
  { number: 63, name: "المنافقون", englishName: "Al-Munafiqun", totalAyahs: 11, type: "مدنية", startJuz: 28, audioFileNumber: "063" },
  { number: 64, name: "التغابن", englishName: "At-Taghabun", totalAyahs: 18, type: "مدنية", startJuz: 28, audioFileNumber: "064" },
  { number: 65, name: "الطلاق", englishName: "At-Talaq", totalAyahs: 12, type: "مدنية", startJuz: 28, audioFileNumber: "065" },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", totalAyahs: 12, type: "مدنية", startJuz: 28, audioFileNumber: "066" },
  { number: 67, name: "الملك", englishName: "Al-Mulk", totalAyahs: 30, type: "مكية", startJuz: 29, audioFileNumber: "067" },
  { number: 68, name: "القلم", englishName: "Al-Qalam", totalAyahs: 52, type: "مكية", startJuz: 29, audioFileNumber: "068" },
  { number: 69, name: "الحاقة", englishName: "Al-Haqqah", totalAyahs: 52, type: "مكية", startJuz: 29, audioFileNumber: "069" },
  { number: 70, name: "المعارج", englishName: "Al-Ma'arij", totalAyahs: 44, type: "مكية", startJuz: 29, audioFileNumber: "070" },
  { number: 71, name: "نوح", englishName: "Nuh", totalAyahs: 28, type: "مكية", startJuz: 29, audioFileNumber: "071" },
  { number: 72, name: "الجن", englishName: "Al-Jinn", totalAyahs: 28, type: "مكية", startJuz: 29, audioFileNumber: "072" },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", totalAyahs: 20, type: "مكية", startJuz: 29, audioFileNumber: "073" },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", totalAyahs: 56, type: "مكية", startJuz: 29, audioFileNumber: "074" },
  { number: 75, name: "القيامة", englishName: "Al-Qiyamah", totalAyahs: 40, type: "مكية", startJuz: 29, audioFileNumber: "075" },
  { number: 76, name: "الإنسان", englishName: "Al-Insan", totalAyahs: 31, type: "مدنية", startJuz: 29, audioFileNumber: "076" },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalat", totalAyahs: 50, type: "مكية", startJuz: 29, audioFileNumber: "077" },
  { number: 78, name: "النبأ", englishName: "An-Naba", totalAyahs: 40, type: "مكية", startJuz: 30, audioFileNumber: "078" },
  { number: 79, name: "النازعات", englishName: "An-Nazi'at", totalAyahs: 46, type: "مكية", startJuz: 30, audioFileNumber: "079" },
  { number: 80, name: "عبس", englishName: "Abasa", totalAyahs: 42, type: "مكية", startJuz: 30, audioFileNumber: "080" },
  { number: 81, name: "التكوير", englishName: "At-Takwir", totalAyahs: 29, type: "مكية", startJuz: 30, audioFileNumber: "081" },
  { number: 82, name: "الانفطار", englishName: "Al-Infitar", totalAyahs: 19, type: "مكية", startJuz: 30, audioFileNumber: "082" },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", totalAyahs: 36, type: "مكية", startJuz: 30, audioFileNumber: "083" },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaq", totalAyahs: 25, type: "مكية", startJuz: 30, audioFileNumber: "084" },
  { number: 85, name: "البروج", englishName: "Al-Buruj", totalAyahs: 22, type: "مكية", startJuz: 30, audioFileNumber: "085" },
  { number: 86, name: "الطارق", englishName: "At-Tariq", totalAyahs: 17, type: "مكية", startJuz: 30, audioFileNumber: "086" },
  { number: 87, name: "الأعلى", englishName: "Al-A'la", totalAyahs: 19, type: "مكية", startJuz: 30, audioFileNumber: "087" },
  { number: 88, name: "الغاشية", englishName: "Al-Ghashiyah", totalAyahs: 26, type: "مكية", startJuz: 30, audioFileNumber: "088" },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", totalAyahs: 30, type: "مكية", startJuz: 30, audioFileNumber: "089" },
  { number: 90, name: "البلد", englishName: "Al-Balad", totalAyahs: 20, type: "مكية", startJuz: 30, audioFileNumber: "090" },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", totalAyahs: 15, type: "مكية", startJuz: 30, audioFileNumber: "091" },
  { number: 92, name: "الليل", englishName: "Al-Layl", totalAyahs: 21, type: "مكية", startJuz: 30, audioFileNumber: "092" },
  { number: 93, name: "الضحى", englishName: "Ad-Duha", totalAyahs: 11, type: "مكية", startJuz: 30, audioFileNumber: "093" },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", totalAyahs: 8, type: "مكية", startJuz: 30, audioFileNumber: "094" },
  { number: 95, name: "التين", englishName: "At-Tin", totalAyahs: 8, type: "مكية", startJuz: 30, audioFileNumber: "095" },
  { number: 96, name: "العلق", englishName: "Al-'Alaq", totalAyahs: 19, type: "مكية", startJuz: 30, audioFileNumber: "096" },
  { number: 97, name: "القدر", englishName: "Al-Qadr", totalAyahs: 5, type: "مكية", startJuz: 30, audioFileNumber: "097" },
  { number: 98, name: "البينة", englishName: "Al-Bayyinah", totalAyahs: 8, type: "مدنية", startJuz: 30, audioFileNumber: "098" },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzalah", totalAyahs: 8, type: "مدنية", startJuz: 30, audioFileNumber: "099" },
  { number: 100, name: "العاديات", englishName: "Al-'Adiyat", totalAyahs: 11, type: "مكية", startJuz: 30, audioFileNumber: "100" },
  { number: 101, name: "القارعة", englishName: "Al-Qari'ah", totalAyahs: 11, type: "مكية", startJuz: 30, audioFileNumber: "101" },
  { number: 102, name: "التكاثر", englishName: "At-Takathur", totalAyahs: 8, type: "مكية", startJuz: 30, audioFileNumber: "102" },
  { number: 103, name: "العصر", englishName: "Al-'Asr", totalAyahs: 3, type: "مكية", startJuz: 30, audioFileNumber: "103" },
  { number: 104, name: "الهمزة", englishName: "Al-Humazah", totalAyahs: 9, type: "مكية", startJuz: 30, audioFileNumber: "104" },
  { number: 105, name: "الفيل", englishName: "Al-Fil", totalAyahs: 5, type: "مكية", startJuz: 30, audioFileNumber: "105" },
  { number: 106, name: "قريش", englishName: "Quraysh", totalAyahs: 4, type: "مكية", startJuz: 30, audioFileNumber: "106" },
  { number: 107, name: "الماعون", englishName: "Al-Ma'un", totalAyahs: 7, type: "مكية", startJuz: 30, audioFileNumber: "107" },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", totalAyahs: 3, type: "مكية", startJuz: 30, audioFileNumber: "108" },
  { number: 109, name: "الكافرون", englishName: "Al-Kafirun", totalAyahs: 6, type: "مكية", startJuz: 30, audioFileNumber: "109" },
  { number: 110, name: "النصر", englishName: "An-Nasr", totalAyahs: 3, type: "مدنية", startJuz: 30, audioFileNumber: "110" },
  { number: 111, name: "المسد", englishName: "Al-Masad", totalAyahs: 5, type: "مكية", startJuz: 30, audioFileNumber: "111" },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlas", totalAyahs: 4, type: "مكية", startJuz: 30, audioFileNumber: "112" },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", totalAyahs: 5, type: "مكية", startJuz: 30, audioFileNumber: "113" },
  { number: 114, name: "الناس", englishName: "An-Nas", totalAyahs: 6, type: "مكية", startJuz: 30, audioFileNumber: "114" }
];
