/**
 * خدمة جلب وبيانات التفسير الميسّر للقرآن الكريم
 * المصدر المعتمد: كتاب التفسير الميسّر الصادر عن مجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة
 * 
 * الميزات:
 * 1. دعم التخزين المؤقت الذكي في الذاكرة لتسريع التصفح 0ms
 * 2. دعم البحث السريع في كامل آيات القرآن الـ 6236 آية بدون تشكيل مع تطبيع الهمزات
 * 3. بيانات احتياطية فورية لضمان عمل الصفحة حتى في حال انقطاع الشبكة
 * 4. حفظ كامل لحقوق المصدر الرسمي لمجمع الملك فهد لطباعة المصحف الشريف
 */

import { QURAN_SURAHS_114, SurahSummary } from '../data/quranSurahs114';
import { TAFSIR_FALLBACK_CACHE } from '../data/tafsirFallbackData';
import { normalizeArabicForSearch, arabicTextMatches } from '../utils/arabicSearchUtils';

export interface AyahWithTafsir {
  number: number;           // الرقم التسلسلي للآية في المصحف (1 إلى 6236)
  numberInSurah: number;    // رقم الآية داخل السورة
  textUthmani: string;      // نص الآية بالرسم العثماني المضبوط بالتشكيل
  tafsirText: string;       // التفسير الميسّر المعتمد
  juz: number;
  page: number;
  hizbQuarter?: number;
  sajda?: boolean;
}

export interface SurahDetailWithTafsir {
  number: number;
  name: string;
  fullName: string;
  englishName: string;
  totalAyahs: number;
  type: 'مكية' | 'مدنية';
  ayahs: AyahWithTafsir[];
}

export interface QuranSearchResultItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  textClean: string;
  textUthmani?: string;
  tafsirText?: string;
}

export const TAFSIR_SOURCE_METADATA = {
  bookTitle: 'التفسير الميسّر',
  compiler: 'نخبة من أساتذة التفسير المشهود لهم بالعلم والكفاءة',
  publisher: 'مجمع الملك فهد لطباعة المصحف الشريف',
  location: 'المدينة المنورة - المملكة العربية السعودية',
  accreditationNote: 'تفسير معتمد وموثوق صادر رسمياً عن مجمع الملك فهد لطباعة المصحف الشريف، يتميز بوضوح العبارة وسلامة المعتقد وموافقة مذهب السلف الصالح ووجازة الألفاظ واختيار المعنى الأرجح عند الخلاف.',
  copyrightNotice: 'حقوق النشر والطبع محفوظة لمجمع الملك فهد لطباعة المصحف الشريف بالمدينة المنورة'
};

// ذاكرة التخزين المؤقت للبيانات (Memory Cache)
const surahCache = new Map<number, SurahDetailWithTafsir>();
let searchIndexCache: Array<{ s: number; a: number; t: string }> | null = null;
let isSearchIndexLoading = false;

/**
 * تحويل استجابة واجهة مجمع الملك فهد إلى كائن منظم
 */
function parseAlquranCloudResponse(surahNum: number, editionsData: any[]): SurahDetailWithTafsir | null {
  if (!editionsData || editionsData.length < 2) return null;

  const uthmaniEdition = editionsData.find((e: any) => e.edition?.identifier === 'quran-uthmani') || editionsData[0];
  const tafsirEdition = editionsData.find((e: any) => e.edition?.identifier === 'ar.muyassar') || editionsData[1];

  const meta = QURAN_SURAHS_114.find(s => s.number === surahNum) || {
    number: surahNum,
    name: uthmaniEdition.name || `السورة ${surahNum}`,
    fullName: uthmaniEdition.name,
    englishName: uthmaniEdition.englishName || '',
    englishTranslation: uthmaniEdition.englishNameTranslation || '',
    totalAyahs: uthmaniEdition.numberOfAyahs || uthmaniEdition.ayahs?.length || 0,
    type: uthmaniEdition.revelationType === 'Meccan' ? 'مكية' : 'مدنية'
  };

  const ayahs: AyahWithTafsir[] = [];
  const count = uthmaniEdition.ayahs?.length || 0;

  for (let i = 0; i < count; i++) {
    const uAyah = uthmaniEdition.ayahs[i];
    const tAyah = tafsirEdition.ayahs?.[i];

    ayahs.push({
      number: uAyah?.number || (i + 1),
      numberInSurah: uAyah?.numberInSurah || (i + 1),
      textUthmani: uAyah?.text || '',
      tafsirText: tAyah?.text || 'جاري تحميل التفسير الميسّر...',
      juz: uAyah?.juz || 1,
      page: uAyah?.page || 1,
      hizbQuarter: uAyah?.hizbQuarter,
      sajda: Boolean(uAyah?.sajda)
    });
  }

  return {
    number: meta.number,
    name: meta.name,
    fullName: meta.fullName || uthmaniEdition.name,
    englishName: meta.englishName,
    totalAyahs: meta.totalAyahs,
    type: meta.type as 'مكية' | 'مدنية',
    ayahs
  };
}

/**
 * جلب سورة كاملة مع نصوصها بالرسم العثماني وتفسيرها الميسّر
 */
export async function getSurahWithTafsir(surahNumber: number): Promise<SurahDetailWithTafsir> {
  // 1. فحص الذاكرة المؤقتة (Memory Cache)
  if (surahCache.has(surahNumber)) {
    return surahCache.get(surahNumber)!;
  }

  // 2. فحص التخزين المحلي (LocalStorage) لسرعة فورية
  const localKey = `rihab_tafsir_surah_v1_${surahNumber}`;
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      surahCache.set(surahNumber, parsed);
      return parsed;
    }
  } catch (e) {
    // تجاهل أخطاء التخزين المؤقت
  }

  // 3. فحص النسخة الاحتياطية المرفقة (Fallback Cache)
  if (TAFSIR_FALLBACK_CACHE[surahNumber]) {
    const parsed = parseAlquranCloudResponse(surahNumber, TAFSIR_FALLBACK_CACHE[surahNumber]);
    if (parsed) {
      surahCache.set(surahNumber, parsed);
      return parsed;
    }
  }

  // 4. جلب البيانات من الخادم ومصدر مجمع الملك فهد (AlQuran Cloud API)
  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,ar.muyassar`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`تعذر جلب التفسير من المصدر (رمز الاستجابة: ${res.status})`);
    }

    const json = await res.json();
    if (json.code === 200 && json.data) {
      const parsed = parseAlquranCloudResponse(surahNumber, json.data);
      if (parsed) {
        surahCache.set(surahNumber, parsed);
        try {
          localStorage.setItem(localKey, JSON.stringify(parsed));
        } catch {
          // تجاهل في حال امتلاء السعة
        }
        return parsed;
      }
    }
    throw new Error('تنسيق استجابة التفسير غير متوافق');
  } catch (err: any) {
    console.error('Error fetching surah tafsir:', err);

    // في حال تعذر الشبكة وعدم وجود كاش، إنشاء بنية سورة آمنة مع تنبيه واضح
    const meta = QURAN_SURAHS_114.find(s => s.number === surahNumber);
    if (!meta) throw err;

    return {
      number: meta.number,
      name: meta.name,
      fullName: meta.fullName,
      englishName: meta.englishName,
      totalAyahs: meta.totalAyahs,
      type: meta.type,
      ayahs: Array.from({ length: meta.totalAyahs }, (_, i) => ({
        number: i + 1,
        numberInSurah: i + 1,
        textUthmani: `الآية (${i + 1}) - يرجى التحقق من الاتصال بالإنترنت لعرض الرسم العثماني والتفسير الميسّر`,
        tafsirText: 'يتطلب جلب نص التفسير الميسّر المعتمد توفر اتصال بالشبكة لتنزيل بيانات مجمع الملك فهد لطباعة المصحف الشريف.',
        juz: 1,
        page: 1
      }))
    };
  }
}

/**
 * جلب تفسير آية مفردة مع نصها القرآني
 */
export async function getSingleAyahWithTafsir(surahNumber: number, ayahNumber: number): Promise<AyahWithTafsir | null> {
  const surah = await getSurahWithTafsir(surahNumber);
  const ayah = surah.ayahs.find(a => a.numberInSurah === ayahNumber);
  return ayah || null;
}

/**
 * تحميل فهرس البحث القرآني في الذاكرة (6236 آية)
 */
async function loadSearchIndex(): Promise<Array<{ s: number; a: number; t: string }>> {
  if (searchIndexCache) return searchIndexCache;
  if (isSearchIndexLoading) {
    // انتظر حتى ينتهي التحميل
    while (isSearchIndexLoading) {
      await new Promise(r => setTimeout(r, 50));
    }
    if (searchIndexCache) return searchIndexCache;
  }

  isSearchIndexLoading = true;
  try {
    const res = await fetch('/data/quran_search_index.json');
    if (!res.ok) throw new Error('Search index not found');
    const data = await res.json();
    searchIndexCache = data;
    return data;
  } catch (e) {
    console.warn('Could not load local search index, will fallback to on-demand matching');
    return [];
  } finally {
    isSearchIndexLoading = false;
  }
}

/**
 * البحث في القرآن الكريم بدون تشكيل مع تطبيع الهمزات والألف والتاء المربوطة
 */
export async function searchQuranAyahs(query: string, maxResults: number = 40): Promise<QuranSearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const index = await loadSearchIndex();
  const results: QuranSearchResultItem[] = [];

  const normalizedQuery = normalizeArabicForSearch(trimmed);

  if (index && index.length > 0) {
    for (const item of index) {
      if (arabicTextMatches(item.t, trimmed)) {
        const surahMeta = QURAN_SURAHS_114.find(s => s.number === item.s);
        results.push({
          surahNumber: item.s,
          surahName: surahMeta ? surahMeta.name : `السورة ${item.s}`,
          ayahNumber: item.a,
          textClean: item.t
        });

        if (results.length >= maxResults) break;
      }
    }
  } else {
    // محاولة البحث عبر API إذا لم يكن الفهرس المحلي متاحاً
    try {
      const encoded = encodeURIComponent(trimmed);
      const res = await fetch(`https://api.alquran.cloud/v1/search/${encoded}/all/quran-simple-clean`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.matches) {
          for (const match of json.data.matches.slice(0, maxResults)) {
            const surahMeta = QURAN_SURAHS_114.find(s => s.number === match.surah?.number);
            results.push({
              surahNumber: match.surah?.number || 1,
              surahName: surahMeta ? surahMeta.name : (match.surah?.name || ''),
              ayahNumber: match.numberInSurah,
              textClean: match.text
            });
          }
        }
      }
    } catch {
      // تجاهل
    }
  }

  return results;
}
