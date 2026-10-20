/**
 * فهرس سور القرآن الكريم كاملة (114 سورة)
 * مرتبة من الفاتحة إلى الناس حسب الرسم العثماني ومجمع الملك فهد لطباعة المصحف الشريف
 */

export interface SurahSummary {
  number: number;
  name: string;
  fullName: string;
  englishName: string;
  englishTranslation: string;
  totalAyahs: number;
  type: 'مكية' | 'مدنية';
}

export const QURAN_SURAHS_114: SurahSummary[] = [
  {
    "number": 1,
    "name": "ٱلْفَاتِحَةِ",
    "fullName": "سُورَةُ ٱلْفَاتِحَةِ",
    "englishName": "Al-Faatiha",
    "englishTranslation": "The Opening",
    "totalAyahs": 7,
    "type": "مكية"
  },
  {
    "number": 2,
    "name": "البَقَرَةِ",
    "fullName": "سُورَةُ البَقَرَةِ",
    "englishName": "Al-Baqara",
    "englishTranslation": "The Cow",
    "totalAyahs": 286,
    "type": "مدنية"
  },
  {
    "number": 3,
    "name": "آلِ عِمۡرَانَ",
    "fullName": "سُورَةُ آلِ عِمۡرَانَ",
    "englishName": "Aal-i-Imraan",
    "englishTranslation": "The Family of Imraan",
    "totalAyahs": 200,
    "type": "مدنية"
  },
  {
    "number": 4,
    "name": "النِّسَاءِ",
    "fullName": "سُورَةُ النِّسَاءِ",
    "englishName": "An-Nisaa",
    "englishTranslation": "The Women",
    "totalAyahs": 176,
    "type": "مدنية"
  },
  {
    "number": 5,
    "name": "المَائـِدَةِ",
    "fullName": "سُورَةُ المَائـِدَةِ",
    "englishName": "Al-Maaida",
    "englishTranslation": "The Table",
    "totalAyahs": 120,
    "type": "مدنية"
  },
  {
    "number": 6,
    "name": "الأَنۡعَامِ",
    "fullName": "سُورَةُ الأَنۡعَامِ",
    "englishName": "Al-An'aam",
    "englishTranslation": "The Cattle",
    "totalAyahs": 165,
    "type": "مكية"
  },
  {
    "number": 7,
    "name": "الأَعۡرَافِ",
    "fullName": "سُورَةُ الأَعۡرَافِ",
    "englishName": "Al-A'raaf",
    "englishTranslation": "The Heights",
    "totalAyahs": 206,
    "type": "مكية"
  },
  {
    "number": 8,
    "name": "الأَنفَالِ",
    "fullName": "سُورَةُ الأَنفَالِ",
    "englishName": "Al-Anfaal",
    "englishTranslation": "The Spoils of War",
    "totalAyahs": 75,
    "type": "مدنية"
  },
  {
    "number": 9,
    "name": "التَّوۡبَةِ",
    "fullName": "سُورَةُ التَّوۡبَةِ",
    "englishName": "At-Tawba",
    "englishTranslation": "The Repentance",
    "totalAyahs": 129,
    "type": "مدنية"
  },
  {
    "number": 10,
    "name": "يُونُسَ",
    "fullName": "سُورَةُ يُونُسَ",
    "englishName": "Yunus",
    "englishTranslation": "Jonas",
    "totalAyahs": 109,
    "type": "مكية"
  },
  {
    "number": 11,
    "name": "هُودٍ",
    "fullName": "سُورَةُ هُودٍ",
    "englishName": "Hud",
    "englishTranslation": "Hud",
    "totalAyahs": 123,
    "type": "مكية"
  },
  {
    "number": 12,
    "name": "يُوسُفَ",
    "fullName": "سُورَةُ يُوسُفَ",
    "englishName": "Yusuf",
    "englishTranslation": "Joseph",
    "totalAyahs": 111,
    "type": "مكية"
  },
  {
    "number": 13,
    "name": "الرَّعۡدِ",
    "fullName": "سُورَةُ الرَّعۡدِ",
    "englishName": "Ar-Ra'd",
    "englishTranslation": "The Thunder",
    "totalAyahs": 43,
    "type": "مدنية"
  },
  {
    "number": 14,
    "name": "إِبۡرَاهِيمَ",
    "fullName": "سُورَةُ إِبۡرَاهِيمَ",
    "englishName": "Ibrahim",
    "englishTranslation": "Abraham",
    "totalAyahs": 52,
    "type": "مكية"
  },
  {
    "number": 15,
    "name": "الحِجۡرِ",
    "fullName": "سُورَةُ الحِجۡرِ",
    "englishName": "Al-Hijr",
    "englishTranslation": "The Rock",
    "totalAyahs": 99,
    "type": "مكية"
  },
  {
    "number": 16,
    "name": "النَّحۡلِ",
    "fullName": "سُورَةُ النَّحۡلِ",
    "englishName": "An-Nahl",
    "englishTranslation": "The Bee",
    "totalAyahs": 128,
    "type": "مكية"
  },
  {
    "number": 17,
    "name": "الإِسۡرَاءِ",
    "fullName": "سُورَةُ الإِسۡرَاءِ",
    "englishName": "Al-Israa",
    "englishTranslation": "The Night Journey",
    "totalAyahs": 111,
    "type": "مكية"
  },
  {
    "number": 18,
    "name": "الكَهۡفِ",
    "fullName": "سُورَةُ الكَهۡفِ",
    "englishName": "Al-Kahf",
    "englishTranslation": "The Cave",
    "totalAyahs": 110,
    "type": "مكية"
  },
  {
    "number": 19,
    "name": "مَرۡيَمَ",
    "fullName": "سُورَةُ مَرۡيَمَ",
    "englishName": "Maryam",
    "englishTranslation": "Mary",
    "totalAyahs": 98,
    "type": "مكية"
  },
  {
    "number": 20,
    "name": "طه",
    "fullName": "سُورَةُ طه",
    "englishName": "Taa-Haa",
    "englishTranslation": "Taa-Haa",
    "totalAyahs": 135,
    "type": "مكية"
  },
  {
    "number": 21,
    "name": "الأَنبِيَاءِ",
    "fullName": "سُورَةُ الأَنبِيَاءِ",
    "englishName": "Al-Anbiyaa",
    "englishTranslation": "The Prophets",
    "totalAyahs": 112,
    "type": "مكية"
  },
  {
    "number": 22,
    "name": "الحَجِّ",
    "fullName": "سُورَةُ الحَجِّ",
    "englishName": "Al-Hajj",
    "englishTranslation": "The Pilgrimage",
    "totalAyahs": 78,
    "type": "مدنية"
  },
  {
    "number": 23,
    "name": "المُؤۡمِنُونَ",
    "fullName": "سُورَةُ المُؤۡمِنُونَ",
    "englishName": "Al-Muminoon",
    "englishTranslation": "The Believers",
    "totalAyahs": 118,
    "type": "مكية"
  },
  {
    "number": 24,
    "name": "النُّورِ",
    "fullName": "سُورَةُ النُّورِ",
    "englishName": "An-Noor",
    "englishTranslation": "The Light",
    "totalAyahs": 64,
    "type": "مدنية"
  },
  {
    "number": 25,
    "name": "الفُرۡقَانِ",
    "fullName": "سُورَةُ الفُرۡقَانِ",
    "englishName": "Al-Furqaan",
    "englishTranslation": "The Criterion",
    "totalAyahs": 77,
    "type": "مكية"
  },
  {
    "number": 26,
    "name": "الشُّعَرَاءِ",
    "fullName": "سُورَةُ الشُّعَرَاءِ",
    "englishName": "Ash-Shu'araa",
    "englishTranslation": "The Poets",
    "totalAyahs": 227,
    "type": "مكية"
  },
  {
    "number": 27,
    "name": "النَّمۡلِ",
    "fullName": "سُورَةُ النَّمۡلِ",
    "englishName": "An-Naml",
    "englishTranslation": "The Ant",
    "totalAyahs": 93,
    "type": "مكية"
  },
  {
    "number": 28,
    "name": "القَصَصِ",
    "fullName": "سُورَةُ القَصَصِ",
    "englishName": "Al-Qasas",
    "englishTranslation": "The Stories",
    "totalAyahs": 88,
    "type": "مكية"
  },
  {
    "number": 29,
    "name": "العَنكَبُوتِ",
    "fullName": "سُورَةُ العَنكَبُوتِ",
    "englishName": "Al-Ankaboot",
    "englishTranslation": "The Spider",
    "totalAyahs": 69,
    "type": "مكية"
  },
  {
    "number": 30,
    "name": "الرُّومِ",
    "fullName": "سُورَةُ الرُّومِ",
    "englishName": "Ar-Room",
    "englishTranslation": "The Romans",
    "totalAyahs": 60,
    "type": "مكية"
  },
  {
    "number": 31,
    "name": "لُقۡمَانَ",
    "fullName": "سُورَةُ لُقۡمَانَ",
    "englishName": "Luqman",
    "englishTranslation": "Luqman",
    "totalAyahs": 34,
    "type": "مكية"
  },
  {
    "number": 32,
    "name": "السَّجۡدَةِ",
    "fullName": "سُورَةُ السَّجۡدَةِ",
    "englishName": "As-Sajda",
    "englishTranslation": "The Prostration",
    "totalAyahs": 30,
    "type": "مكية"
  },
  {
    "number": 33,
    "name": "الأَحۡزَابِ",
    "fullName": "سُورَةُ الأَحۡزَابِ",
    "englishName": "Al-Ahzaab",
    "englishTranslation": "The Clans",
    "totalAyahs": 73,
    "type": "مدنية"
  },
  {
    "number": 34,
    "name": "سَبَإٍ",
    "fullName": "سُورَةُ سَبَإٍ",
    "englishName": "Saba",
    "englishTranslation": "Sheba",
    "totalAyahs": 54,
    "type": "مكية"
  },
  {
    "number": 35,
    "name": "فَاطِرٍ",
    "fullName": "سُورَةُ فَاطِرٍ",
    "englishName": "Faatir",
    "englishTranslation": "The Originator",
    "totalAyahs": 45,
    "type": "مكية"
  },
  {
    "number": 36,
    "name": "يسٓ",
    "fullName": "سُورَةُ يسٓ",
    "englishName": "Yaseen",
    "englishTranslation": "Yaseen",
    "totalAyahs": 83,
    "type": "مكية"
  },
  {
    "number": 37,
    "name": "الصَّافَّاتِ",
    "fullName": "سُورَةُ الصَّافَّاتِ",
    "englishName": "As-Saaffaat",
    "englishTranslation": "Those drawn up in Ranks",
    "totalAyahs": 182,
    "type": "مكية"
  },
  {
    "number": 38,
    "name": "صٓ",
    "fullName": "سُورَةُ صٓ",
    "englishName": "Saad",
    "englishTranslation": "The letter Saad",
    "totalAyahs": 88,
    "type": "مكية"
  },
  {
    "number": 39,
    "name": "الزُّمَرِ",
    "fullName": "سُورَةُ الزُّمَرِ",
    "englishName": "Az-Zumar",
    "englishTranslation": "The Groups",
    "totalAyahs": 75,
    "type": "مكية"
  },
  {
    "number": 40,
    "name": "غَافِرٍ",
    "fullName": "سُورَةُ غَافِرٍ",
    "englishName": "Ghafir",
    "englishTranslation": "The Forgiver",
    "totalAyahs": 85,
    "type": "مكية"
  },
  {
    "number": 41,
    "name": "فُصِّلَتۡ",
    "fullName": "سُورَةُ فُصِّلَتۡ",
    "englishName": "Fussilat",
    "englishTranslation": "Explained in detail",
    "totalAyahs": 54,
    "type": "مكية"
  },
  {
    "number": 42,
    "name": "الشُّورَىٰ",
    "fullName": "سُورَةُ الشُّورَىٰ",
    "englishName": "Ash-Shura",
    "englishTranslation": "Consultation",
    "totalAyahs": 53,
    "type": "مكية"
  },
  {
    "number": 43,
    "name": "الزُّخۡرُفِ",
    "fullName": "سُورَةُ الزُّخۡرُفِ",
    "englishName": "Az-Zukhruf",
    "englishTranslation": "Ornaments of gold",
    "totalAyahs": 89,
    "type": "مكية"
  },
  {
    "number": 44,
    "name": "الدُّخَانِ",
    "fullName": "سُورَةُ الدُّخَانِ",
    "englishName": "Ad-Dukhaan",
    "englishTranslation": "The Smoke",
    "totalAyahs": 59,
    "type": "مكية"
  },
  {
    "number": 45,
    "name": "الجَاثِيَةِ",
    "fullName": "سُورَةُ الجَاثِيَةِ",
    "englishName": "Al-Jaathiya",
    "englishTranslation": "Crouching",
    "totalAyahs": 37,
    "type": "مكية"
  },
  {
    "number": 46,
    "name": "الأَحۡقَافِ",
    "fullName": "سُورَةُ الأَحۡقَافِ",
    "englishName": "Al-Ahqaf",
    "englishTranslation": "The Dunes",
    "totalAyahs": 35,
    "type": "مكية"
  },
  {
    "number": 47,
    "name": "مُحَمَّدٍ",
    "fullName": "سُورَةُ مُحَمَّدٍ",
    "englishName": "Muhammad",
    "englishTranslation": "Muhammad",
    "totalAyahs": 38,
    "type": "مدنية"
  },
  {
    "number": 48,
    "name": "الفَتۡحِ",
    "fullName": "سُورَةُ الفَتۡحِ",
    "englishName": "Al-Fath",
    "englishTranslation": "The Victory",
    "totalAyahs": 29,
    "type": "مدنية"
  },
  {
    "number": 49,
    "name": "الحُجُرَاتِ",
    "fullName": "سُورَةُ الحُجُرَاتِ",
    "englishName": "Al-Hujuraat",
    "englishTranslation": "The Inner Apartments",
    "totalAyahs": 18,
    "type": "مدنية"
  },
  {
    "number": 50,
    "name": "قٓ",
    "fullName": "سُورَةُ قٓ",
    "englishName": "Qaaf",
    "englishTranslation": "The letter Qaaf",
    "totalAyahs": 45,
    "type": "مكية"
  },
  {
    "number": 51,
    "name": "الذَّارِيَاتِ",
    "fullName": "سُورَةُ الذَّارِيَاتِ",
    "englishName": "Adh-Dhaariyat",
    "englishTranslation": "The Winnowing Winds",
    "totalAyahs": 60,
    "type": "مكية"
  },
  {
    "number": 52,
    "name": "الطُّورِ",
    "fullName": "سُورَةُ الطُّورِ",
    "englishName": "At-Tur",
    "englishTranslation": "The Mount",
    "totalAyahs": 49,
    "type": "مكية"
  },
  {
    "number": 53,
    "name": "النَّجۡمِ",
    "fullName": "سُورَةُ النَّجۡمِ",
    "englishName": "An-Najm",
    "englishTranslation": "The Star",
    "totalAyahs": 62,
    "type": "مكية"
  },
  {
    "number": 54,
    "name": "القَمَرِ",
    "fullName": "سُورَةُ القَمَرِ",
    "englishName": "Al-Qamar",
    "englishTranslation": "The Moon",
    "totalAyahs": 55,
    "type": "مكية"
  },
  {
    "number": 55,
    "name": "الرَّحۡمَٰن",
    "fullName": "سُورَةُ الرَّحۡمَٰن",
    "englishName": "Ar-Rahmaan",
    "englishTranslation": "The Beneficent",
    "totalAyahs": 78,
    "type": "مدنية"
  },
  {
    "number": 56,
    "name": "الوَاقِعَةِ",
    "fullName": "سُورَةُ الوَاقِعَةِ",
    "englishName": "Al-Waaqia",
    "englishTranslation": "The Inevitable",
    "totalAyahs": 96,
    "type": "مكية"
  },
  {
    "number": 57,
    "name": "الحَدِيدِ",
    "fullName": "سُورَةُ الحَدِيدِ",
    "englishName": "Al-Hadid",
    "englishTranslation": "The Iron",
    "totalAyahs": 29,
    "type": "مدنية"
  },
  {
    "number": 58,
    "name": "المُجَادلَةِ",
    "fullName": "سُورَةُ المُجَادلَةِ",
    "englishName": "Al-Mujaadila",
    "englishTranslation": "The Pleading Woman",
    "totalAyahs": 22,
    "type": "مدنية"
  },
  {
    "number": 59,
    "name": "الحَشۡرِ",
    "fullName": "سُورَةُ الحَشۡرِ",
    "englishName": "Al-Hashr",
    "englishTranslation": "The Exile",
    "totalAyahs": 24,
    "type": "مدنية"
  },
  {
    "number": 60,
    "name": "المُمۡتَحنَةِ",
    "fullName": "سُورَةُ المُمۡتَحنَةِ",
    "englishName": "Al-Mumtahana",
    "englishTranslation": "She that is to be examined",
    "totalAyahs": 13,
    "type": "مدنية"
  },
  {
    "number": 61,
    "name": "الصَّفِّ",
    "fullName": "سُورَةُ الصَّفِّ",
    "englishName": "As-Saff",
    "englishTranslation": "The Ranks",
    "totalAyahs": 14,
    "type": "مدنية"
  },
  {
    "number": 62,
    "name": "الجُمُعَةِ",
    "fullName": "سُورَةُ الجُمُعَةِ",
    "englishName": "Al-Jumu'a",
    "englishTranslation": "Friday",
    "totalAyahs": 11,
    "type": "مدنية"
  },
  {
    "number": 63,
    "name": "المُنَافِقُونَ",
    "fullName": "سُورَةُ المُنَافِقُونَ",
    "englishName": "Al-Munaafiqoon",
    "englishTranslation": "The Hypocrites",
    "totalAyahs": 11,
    "type": "مدنية"
  },
  {
    "number": 64,
    "name": "التَّغَابُنِ",
    "fullName": "سُورَةُ التَّغَابُنِ",
    "englishName": "At-Taghaabun",
    "englishTranslation": "Mutual Disillusion",
    "totalAyahs": 18,
    "type": "مدنية"
  },
  {
    "number": 65,
    "name": "الطَّلَاقِ",
    "fullName": "سُورَةُ الطَّلَاقِ",
    "englishName": "At-Talaaq",
    "englishTranslation": "Divorce",
    "totalAyahs": 12,
    "type": "مدنية"
  },
  {
    "number": 66,
    "name": "التَّحۡرِيمِ",
    "fullName": "سُورَةُ التَّحۡرِيمِ",
    "englishName": "At-Tahrim",
    "englishTranslation": "The Prohibition",
    "totalAyahs": 12,
    "type": "مدنية"
  },
  {
    "number": 67,
    "name": "المُلۡكِ",
    "fullName": "سُورَةُ المُلۡكِ",
    "englishName": "Al-Mulk",
    "englishTranslation": "The Sovereignty",
    "totalAyahs": 30,
    "type": "مكية"
  },
  {
    "number": 68,
    "name": "القَلَمِ",
    "fullName": "سُورَةُ القَلَمِ",
    "englishName": "Al-Qalam",
    "englishTranslation": "The Pen",
    "totalAyahs": 52,
    "type": "مكية"
  },
  {
    "number": 69,
    "name": "الحَاقَّةِ",
    "fullName": "سُورَةُ الحَاقَّةِ",
    "englishName": "Al-Haaqqa",
    "englishTranslation": "The Reality",
    "totalAyahs": 52,
    "type": "مكية"
  },
  {
    "number": 70,
    "name": "المَعَارِجِ",
    "fullName": "سُورَةُ المَعَارِجِ",
    "englishName": "Al-Ma'aarij",
    "englishTranslation": "The Ascending Stairways",
    "totalAyahs": 44,
    "type": "مكية"
  },
  {
    "number": 71,
    "name": "نُوحٍ",
    "fullName": "سُورَةُ نُوحٍ",
    "englishName": "Nooh",
    "englishTranslation": "Noah",
    "totalAyahs": 28,
    "type": "مكية"
  },
  {
    "number": 72,
    "name": "الجِنِّ",
    "fullName": "سُورَةُ الجِنِّ",
    "englishName": "Al-Jinn",
    "englishTranslation": "The Jinn",
    "totalAyahs": 28,
    "type": "مكية"
  },
  {
    "number": 73,
    "name": "المُزَّمِّلِ",
    "fullName": "سُورَةُ المُزَّمِّلِ",
    "englishName": "Al-Muzzammil",
    "englishTranslation": "The Enshrouded One",
    "totalAyahs": 20,
    "type": "مكية"
  },
  {
    "number": 74,
    "name": "المُدَّثِّرِ",
    "fullName": "سُورَةُ المُدَّثِّرِ",
    "englishName": "Al-Muddaththir",
    "englishTranslation": "The Cloaked One",
    "totalAyahs": 56,
    "type": "مكية"
  },
  {
    "number": 75,
    "name": "القِيَامَةِ",
    "fullName": "سُورَةُ القِيَامَةِ",
    "englishName": "Al-Qiyaama",
    "englishTranslation": "The Resurrection",
    "totalAyahs": 40,
    "type": "مكية"
  },
  {
    "number": 76,
    "name": "الإِنسَانِ",
    "fullName": "سُورَةُ الإِنسَانِ",
    "englishName": "Al-Insaan",
    "englishTranslation": "Man",
    "totalAyahs": 31,
    "type": "مدنية"
  },
  {
    "number": 77,
    "name": "المُرۡسَلَاتِ",
    "fullName": "سُورَةُ المُرۡسَلَاتِ",
    "englishName": "Al-Mursalaat",
    "englishTranslation": "The Emissaries",
    "totalAyahs": 50,
    "type": "مكية"
  },
  {
    "number": 78,
    "name": "النَّبَإِ",
    "fullName": "سُورَةُ النَّبَإِ",
    "englishName": "An-Naba",
    "englishTranslation": "The Announcement",
    "totalAyahs": 40,
    "type": "مكية"
  },
  {
    "number": 79,
    "name": "النَّازِعَاتِ",
    "fullName": "سُورَةُ النَّازِعَاتِ",
    "englishName": "An-Naazi'aat",
    "englishTranslation": "Those who drag forth",
    "totalAyahs": 46,
    "type": "مكية"
  },
  {
    "number": 80,
    "name": "عَبَسَ",
    "fullName": "سُورَةُ عَبَسَ",
    "englishName": "Abasa",
    "englishTranslation": "He frowned",
    "totalAyahs": 42,
    "type": "مكية"
  },
  {
    "number": 81,
    "name": "التَّكۡوِيرِ",
    "fullName": "سُورَةُ التَّكۡوِيرِ",
    "englishName": "At-Takwir",
    "englishTranslation": "The Overthrowing",
    "totalAyahs": 29,
    "type": "مكية"
  },
  {
    "number": 82,
    "name": "الانفِطَارِ",
    "fullName": "سُورَةُ الانفِطَارِ",
    "englishName": "Al-Infitaar",
    "englishTranslation": "The Cleaving",
    "totalAyahs": 19,
    "type": "مكية"
  },
  {
    "number": 83,
    "name": "المُطَفِّفِينَ",
    "fullName": "سُورَةُ المُطَفِّفِينَ",
    "englishName": "Al-Mutaffifin",
    "englishTranslation": "Defrauding",
    "totalAyahs": 36,
    "type": "مكية"
  },
  {
    "number": 84,
    "name": "الانشِقَاقِ",
    "fullName": "سُورَةُ الانشِقَاقِ",
    "englishName": "Al-Inshiqaaq",
    "englishTranslation": "The Splitting Open",
    "totalAyahs": 25,
    "type": "مكية"
  },
  {
    "number": 85,
    "name": "البُرُوجِ",
    "fullName": "سُورَةُ البُرُوجِ",
    "englishName": "Al-Burooj",
    "englishTranslation": "The Constellations",
    "totalAyahs": 22,
    "type": "مكية"
  },
  {
    "number": 86,
    "name": "الطَّارِقِ",
    "fullName": "سُورَةُ الطَّارِقِ",
    "englishName": "At-Taariq",
    "englishTranslation": "The Morning Star",
    "totalAyahs": 17,
    "type": "مكية"
  },
  {
    "number": 87,
    "name": "الأَعۡلَىٰ",
    "fullName": "سُورَةُ الأَعۡلَىٰ",
    "englishName": "Al-A'laa",
    "englishTranslation": "The Most High",
    "totalAyahs": 19,
    "type": "مكية"
  },
  {
    "number": 88,
    "name": "الغَاشِيَةِ",
    "fullName": "سُورَةُ الغَاشِيَةِ",
    "englishName": "Al-Ghaashiya",
    "englishTranslation": "The Overwhelming",
    "totalAyahs": 26,
    "type": "مكية"
  },
  {
    "number": 89,
    "name": "الفَجۡرِ",
    "fullName": "سُورَةُ الفَجۡرِ",
    "englishName": "Al-Fajr",
    "englishTranslation": "The Dawn",
    "totalAyahs": 30,
    "type": "مكية"
  },
  {
    "number": 90,
    "name": "البَلَدِ",
    "fullName": "سُورَةُ البَلَدِ",
    "englishName": "Al-Balad",
    "englishTranslation": "The City",
    "totalAyahs": 20,
    "type": "مكية"
  },
  {
    "number": 91,
    "name": "الشَّمۡسِ",
    "fullName": "سُورَةُ الشَّمۡسِ",
    "englishName": "Ash-Shams",
    "englishTranslation": "The Sun",
    "totalAyahs": 15,
    "type": "مكية"
  },
  {
    "number": 92,
    "name": "اللَّيۡلِ",
    "fullName": "سُورَةُ اللَّيۡلِ",
    "englishName": "Al-Lail",
    "englishTranslation": "The Night",
    "totalAyahs": 21,
    "type": "مكية"
  },
  {
    "number": 93,
    "name": "س��ورَةُ الضُّحَىٰ",
    "fullName": "س��ورَةُ الضُّحَىٰ",
    "englishName": "Ad-Dhuhaa",
    "englishTranslation": "The Morning Hours",
    "totalAyahs": 11,
    "type": "مكية"
  },
  {
    "number": 94,
    "name": "الشَّرۡحِ",
    "fullName": "سُورَةُ الشَّرۡحِ",
    "englishName": "Ash-Sharh",
    "englishTranslation": "The Consolation",
    "totalAyahs": 8,
    "type": "مكية"
  },
  {
    "number": 95,
    "name": "التِّينِ",
    "fullName": "سُورَةُ التِّينِ",
    "englishName": "At-Tin",
    "englishTranslation": "The Fig",
    "totalAyahs": 8,
    "type": "مكية"
  },
  {
    "number": 96,
    "name": "العَلَقِ",
    "fullName": "سُورَةُ العَلَقِ",
    "englishName": "Al-Alaq",
    "englishTranslation": "The Clot",
    "totalAyahs": 19,
    "type": "مكية"
  },
  {
    "number": 97,
    "name": "القَدۡرِ",
    "fullName": "سُورَةُ القَدۡرِ",
    "englishName": "Al-Qadr",
    "englishTranslation": "The Power, Fate",
    "totalAyahs": 5,
    "type": "مكية"
  },
  {
    "number": 98,
    "name": "البَيِّنَةِ",
    "fullName": "سُورَةُ البَيِّنَةِ",
    "englishName": "Al-Bayyina",
    "englishTranslation": "The Evidence",
    "totalAyahs": 8,
    "type": "مدنية"
  },
  {
    "number": 99,
    "name": "الزَّلۡزَلَةِ",
    "fullName": "سُورَةُ الزَّلۡزَلَةِ",
    "englishName": "Az-Zalzala",
    "englishTranslation": "The Earthquake",
    "totalAyahs": 8,
    "type": "مدنية"
  },
  {
    "number": 100,
    "name": "العَادِيَاتِ",
    "fullName": "سُورَةُ العَادِيَاتِ",
    "englishName": "Al-Aadiyaat",
    "englishTranslation": "The Chargers",
    "totalAyahs": 11,
    "type": "مكية"
  },
  {
    "number": 101,
    "name": "القَارِعَةِ",
    "fullName": "سُورَةُ القَارِعَةِ",
    "englishName": "Al-Qaari'a",
    "englishTranslation": "The Calamity",
    "totalAyahs": 11,
    "type": "مكية"
  },
  {
    "number": 102,
    "name": "التَّكَاثُرِ",
    "fullName": "سُورَةُ التَّكَاثُرِ",
    "englishName": "At-Takaathur",
    "englishTranslation": "Competition",
    "totalAyahs": 8,
    "type": "مكية"
  },
  {
    "number": 103,
    "name": "العَصۡرِ",
    "fullName": "سُورَةُ العَصۡرِ",
    "englishName": "Al-Asr",
    "englishTranslation": "The Declining Day, Epoch",
    "totalAyahs": 3,
    "type": "مكية"
  },
  {
    "number": 104,
    "name": "الهُمَزَةِ",
    "fullName": "سُورَةُ الهُمَزَةِ",
    "englishName": "Al-Humaza",
    "englishTranslation": "The Traducer",
    "totalAyahs": 9,
    "type": "مكية"
  },
  {
    "number": 105,
    "name": "الفِيلِ",
    "fullName": "سُورَةُ الفِيلِ",
    "englishName": "Al-Fil",
    "englishTranslation": "The Elephant",
    "totalAyahs": 5,
    "type": "مكية"
  },
  {
    "number": 106,
    "name": "قُرَيۡشٍ",
    "fullName": "سُورَةُ قُرَيۡشٍ",
    "englishName": "Quraish",
    "englishTranslation": "Quraysh",
    "totalAyahs": 4,
    "type": "مكية"
  },
  {
    "number": 107,
    "name": "المَاعُونِ",
    "fullName": "سُورَةُ المَاعُونِ",
    "englishName": "Al-Maa'un",
    "englishTranslation": "Almsgiving",
    "totalAyahs": 7,
    "type": "مكية"
  },
  {
    "number": 108,
    "name": "الكَوۡثَرِ",
    "fullName": "سُورَةُ الكَوۡثَرِ",
    "englishName": "Al-Kawthar",
    "englishTranslation": "Abundance",
    "totalAyahs": 3,
    "type": "مكية"
  },
  {
    "number": 109,
    "name": "الكَافِرُونَ",
    "fullName": "سُورَةُ الكَافِرُونَ",
    "englishName": "Al-Kaafiroon",
    "englishTranslation": "The Disbelievers",
    "totalAyahs": 6,
    "type": "مكية"
  },
  {
    "number": 110,
    "name": "النَّصۡرِ",
    "fullName": "سُورَةُ النَّصۡرِ",
    "englishName": "An-Nasr",
    "englishTranslation": "Divine Support",
    "totalAyahs": 3,
    "type": "مدنية"
  },
  {
    "number": 111,
    "name": "المَسَدِ",
    "fullName": "سُورَةُ المَسَدِ",
    "englishName": "Al-Masad",
    "englishTranslation": "The Palm Fibre",
    "totalAyahs": 5,
    "type": "مكية"
  },
  {
    "number": 112,
    "name": "الإِخۡلَاصِ",
    "fullName": "سُورَةُ الإِخۡلَاصِ",
    "englishName": "Al-Ikhlaas",
    "englishTranslation": "Sincerity",
    "totalAyahs": 4,
    "type": "مكية"
  },
  {
    "number": 113,
    "name": "الفَلَقِ",
    "fullName": "سُورَةُ الفَلَقِ",
    "englishName": "Al-Falaq",
    "englishTranslation": "The Dawn",
    "totalAyahs": 5,
    "type": "مكية"
  },
  {
    "number": 114,
    "name": "النَّاسِ",
    "fullName": "سُورَةُ النَّاسِ",
    "englishName": "An-Naas",
    "englishTranslation": "Mankind",
    "totalAyahs": 6,
    "type": "مكية"
  }
];
