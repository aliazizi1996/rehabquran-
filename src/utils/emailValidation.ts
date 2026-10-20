/**
 * أداة تنظيف والتحقق من صحة البريد الإلكتروني
 * مقرأة رحاب القرآن الإلكترونية
 *
 * تتولى:
 * 1. إزالة جميع الرموز الخفية وعلامات اتجاه النص (RTL/LTR marks) الناتجة عن النسخ واللصق من الهواتف وواتساب
 * 2. إزالة المسافات من البداية والنهاية trim() والمسافات الخفية (Zero-width spaces, BOM, Non-breaking spaces)
 * 3. التحقق المتسامح باستخدام regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 */

// قائمة بجميع الرموز الخفية الشائعة في البيئات العربية وعلامات الاتجاه
export const INVISIBLE_UNICODE_REGEX = /[\u200B-\u200D\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD\u2000-\u200A\u202F\u205F\u3000]/g;

// التعبير النمطي المعتمد للتحقق من البريد الإلكتروني
export const EMAIL_VALIDATION_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * تنظيف البريد الإلكتروني من الرموز الخفية والمسافات
 */
export function cleanEmail(raw: string): string {
  if (!raw) return '';
  return raw
    // إزالة رموز علامات الاتجاه والمحارف غير المرئية
    .replace(INVISIBLE_UNICODE_REGEX, '')
    // تحويل المسافات غير القابلة للكسر إلى مسافة فارغة لحذفها
    .replace(/\u00A0/g, '')
    // إزالة المسافات من البداية والنهاية
    .trim();
}

/**
 * التحقق من صحة البريد الإلكتروني بشكل متسامح مع التنظيف المسبق
 */
export function isValidEmail(raw: string): boolean {
  const cleaned = cleanEmail(raw);
  if (!cleaned) return false;
  return EMAIL_VALIDATION_REGEX.test(cleaned);
}
