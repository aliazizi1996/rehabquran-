/**
 * أدوات معالجة وتطبيع النصوص العربية للبحث القرآني الميسّر
 * يدعم البحث دون تشكيل ومعالجة كافة اختلافات الألف والهمزات والتاء المربوطة والألف المقصورة
 */

/**
 * علامات التشكيل والحركات القرآنية والرسم العثماني
 */
const TASHKEEL_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08F0-\u08F3]/g;

/**
 * إزالة التشكيل فقط مع الإبقاء على شكل الأحرف
 */
export function stripTashkeel(text: string): string {
  if (!text) return '';
  return text.replace(TASHKEEL_REGEX, '').replace(/\u0640/g, ''); // إزالة الكشيدة والتطويل
}

/**
 * تطبيع النص العربي للبحث المرن:
 * - إزالة التشكيل والرموز والوقف القرآني
 * - توحيد أشكال الألف (أ، إ، آ، ٱ -> ا)
 * - توحيد التاء المربوطة والهاء (ة -> ه)
 * - توحيد الألف المقصورة والياء (ى -> ي)
 * - توحيد الهمزة على الواو والياء (ؤ -> و، ئ -> ي)
 * - إزالة التطويل والمسافات الزائدة
 */
export function normalizeArabicForSearch(text: string): string {
  if (!text) return '';

  let normalized = stripTashkeel(text);

  // توحيد الهمزات والألف
  normalized = normalized.replace(/[أإآٱٲٳ]/g, 'ا');

  // توحيد الألف المقصورة والياء
  normalized = normalized.replace(/[ى]/g, 'ي');

  // توحيد التاء المربوطة والهاء
  normalized = normalized.replace(/[ة]/g, 'ه');

  // توحيد الهمزات المركبة
  normalized = normalized.replace(/[ؤ]/g, 'و');
  normalized = normalized.replace(/[ئ]/g, 'ي');

  // إزالة علامات الترقيم والأقواس الشائعة
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()«»"'\u060C\u061B\u061F۞۩]/g, ' ');

  // توحيد المسافات
  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();

  return normalized;
}

/**
 * فحص ما إذا كان النص يحتوي على كلمة البحث مع تطبيع الحروف والتشكيل
 * يدعم المطابقة المباشرة، والمطابقة مع تجريد أل التعريف إذا لزم
 */
export function arabicTextMatches(sourceText: string, searchPhrase: string): boolean {
  if (!sourceText || !searchPhrase) return false;
  const normSource = normalizeArabicForSearch(sourceText);
  const normQuery = normalizeArabicForSearch(searchPhrase);
  if (!normQuery) return false;

  // 1. المطابقة المباشرة
  if (normSource.includes(normQuery)) return true;

  // 2. البحث بدون "ال" التعريف إذا كانت الكلمة تبدأ بـ "ال"
  if (normQuery.startsWith('ال') && normQuery.length >= 4) {
    const withoutAl = normQuery.slice(2);
    if (normSource.includes(withoutAl)) return true;
  }

  // 3. البحث بإضافة "ال" التعريف إذا كانت الكلمة نكرة
  if (!normQuery.startsWith('ال') && normQuery.length >= 3) {
    const withAl = 'ال' + normQuery;
    if (normSource.includes(withAl)) return true;
  }

  return false;
}

/**
 * استخراج مقتطف مع تمييز الكلمة المطابقة
 */
export function highlightMatch(fullText: string, query: string): { before: string; match: string; after: string } | null {
  if (!fullText || !query) return null;

  const normFull = normalizeArabicForSearch(fullText);
  const normQuery = normalizeArabicForSearch(query);

  const idx = normFull.indexOf(normQuery);
  if (idx === -1) return null;

  // تقريب موقع الكلمة في النص الأصلي (المشكول أو غير المشكول)
  // للعرض المباشر والآمن
  return {
    before: fullText.substring(0, Math.max(0, idx)),
    match: fullText.substring(idx, idx + query.length),
    after: fullText.substring(idx + query.length)
  };
}
