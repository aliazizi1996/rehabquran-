/**
 * خدمة رسائل وتنسيق أرقام واتساب الذكية الموحدة لمقرأة رحاب القرآن الإلكترونية
 * Smart Unified WhatsApp Messaging & Number Normalization (E.164)
 * 
 * القواعد الصارمة المعتمدة:
 * 1. تحويل وتنظيف أرقام الهاتف إلى صيغة دولية E.164 قبل فتح واتساب.
 * 2. إزالة الصفر المحلي إذا بدأ الرقم بـ 0، وإضافة رمز الدولة المحدد للطالب.
 * 3. عدم إضافة رمز الدولة مرتين إذا كان الرقم مكتوباً أصلاً بـ +967 أو 00967 أو 0967 أو +90 أو +966 وغيرها.
 * 4. تعيين اليمن +967 افتراضياً إذا لم يُحدد المستخدم دولة أخرى.
 * 5. عدم تغيير الرقم الأصلي المحفوظ في بيانات الطالب (استخدام الرقم المنظف للإرسال فقط).
 * 6. عرض الرقم بصيغته الدولية الواضحة للمشرف قبل فتح واتساب.
 * 7. التحقق من صلاحية الرقم ومنع فتح واتساب وإظهار رسالة واضحة إذا كان الرقم غير صالح.
 */

import { DEFAULT_COUNTRY_DIAL_CODE, deduceCountryDialCode, COUNTRY_DIAL_CODES } from '../data/countryPhoneCodes';

export interface WhatsAppNumberValidation {
  isValid: boolean;
  cleanPhone: string;          // أرقام E.164 الخالصة بدون + لاستخدامها في رابط wa.me
  formattedDisplay: string;    // صيغة العرض الواضحة للمشرف، مثل: +967 713801916
  rawInput: string;            // الرقم الأصلي المحفوظ دون أي تغيير
  detectedCountryCode: string; // رمز الدولة المعتمد (مثل: 967)
  error?: string;              // رسالة الخطأ الواضحة إن وُجدت
}

export interface WhatsAppMessageResult {
  sentViaApi: boolean;
  whatsappUrl: string;
  messageText: string;
  cleanPhone: string;
  formattedDisplay?: string;
  isValid?: boolean;
  error?: string;
}

// قائمة رموز الدول الأكثر شيوعاً للمقرأة للتحقق من وجود رمز الدولة مسبقاً
const KNOWN_DIAL_CODES = [
  '967', '966', '90', '20', '971', '968', '974', '965', '973',
  '962', '970', '964', '963', '961', '249', '218', '213', '212',
  '216', '222', '252', '253', '60', '62', '44', '1', '49', '33', '46', '31'
];

/**
 * فحص ما إذا كانت الأرقام تبدأ برمز دولة معروف
 */
function findStartingDialCode(digits: string): string | null {
  // فحص الرموز من الأطول إلى الأقصر (3 خانات، ثم خانتين، ثم خانة)
  const sorted = [...KNOWN_DIAL_CODES].sort((a, b) => b.length - a.length);
  for (const code of sorted) {
    if (digits.startsWith(code) && digits.length >= code.length + 6) {
      return code;
    }
  }
  return null;
}

/**
 * الدالة الموحدة لتنظيف وتحويل رقم الهاتف إلى صيغة دولية E.164 قبل فتح واتساب
 * 
 * @param phone الرقم المدخل أو المحفوظ (مثل: 0967713801916 أو 0713801916 أو +90535...)
 * @param countryOrCode اسم الدولة أو رمز النداء الدولي (اليمن 967 افتراضياً)
 * @returns أرقام E.164 النقية بدون + (جاهزة للاستخدام في رابط wa.me)
 */
export function cleanWhatsAppNumber(phone?: string, countryOrCode?: string): string {
  const result = validateAndCleanWhatsAppNumber(phone, countryOrCode);
  return result.cleanPhone;
}

/**
 * دالة التحقق والتنظيف الشاملة مع إرجاع معلومات الصلاحية والعرض للمشرف
 */
export function validateAndCleanWhatsAppNumber(phone?: string, countryOrCode?: string): WhatsAppNumberValidation {
  const rawInput = phone ? String(phone).trim() : '';

  // 1. تحديد رمز الدولة المستهدف (اليمن 967 افتراضياً)
  let targetDialCode = DEFAULT_COUNTRY_DIAL_CODE;
  if (countryOrCode) {
    const pureCode = String(countryOrCode).replace(/[^0-9]/g, '');
    if (pureCode && pureCode.length <= 4) {
      targetDialCode = pureCode;
    } else {
      targetDialCode = deduceCountryDialCode(String(countryOrCode));
    }
  }

  if (!rawInput) {
    return {
      isValid: false,
      cleanPhone: '',
      formattedDisplay: '',
      rawInput: '',
      detectedCountryCode: targetDialCode,
      error: 'لم يتم إدخال رقم هاتف',
    };
  }

  // 2. فحص البادئات الخاصة (+ أو 00)
  const startsWithPlus = rawInput.startsWith('+');
  const startsWith00 = rawInput.startsWith('00');

  // استخراج الأرقام فقط
  let digits = rawInput.replace(/[^0-9]/g, '');
  if (!digits) {
    return {
      isValid: false,
      cleanPhone: '',
      formattedDisplay: '',
      rawInput,
      detectedCountryCode: targetDialCode,
      error: 'الرقم لا يحتوي على أي خانات رقمية صالحة',
    };
  }

  let finalDigits = digits;
  let detectedCode = targetDialCode;
  const hasExplicitCountry = Boolean(countryOrCode && String(countryOrCode).trim());

  if (startsWithPlus) {
    // كُتب الرقم مسبقاً بالصيغة الدولية مع + (مثال: +967713801916 أو +905351234567)
    // إزالة أي أصفار قد تكون كُتبت خطأ بعد علامة + (مثال: +0967 -> 967)
    finalDigits = digits.replace(/^0+/, '');
    const matched = findStartingDialCode(finalDigits);
    if (matched) detectedCode = matched;
  } else if (startsWith00) {
    // بادئة الاتصال الدولي 00 (مثال: 00967713801916 أو 0090535...)
    finalDigits = digits.slice(2).replace(/^0+/, '');
    const matched = findStartingDialCode(finalDigits);
    if (matched) detectedCode = matched;
  } else if (digits.startsWith('0')) {
    // حالة: الرقم يبدأ بصفر محلي (مثل: 0967713801916 أو 0713801916 أو 05351234567)
    // نزيل الصفر المحلي أولاً
    const withoutLeadingZero = digits.replace(/^0+/, '');

    // التحقق: هل المتبقي يبدأ برمز الدولة المحدد للطالب؟
    // "لا تضف رمز الدولة مرتين إذا كان الرقم مكتوباً أصلاً بصيغة +967 أو +90 وغيرها"
    if (withoutLeadingZero.startsWith(targetDialCode)) {
      // الرقم كان مكتوباً مع رمز الدولة ومسبوقاً بصفر محلي (مثل: 0967713801916 أو 090535...)
      // نحتفظ بـ withoutLeadingZero ولا نضيف رمز الدولة مرة ثانية
      finalDigits = withoutLeadingZero;
      detectedCode = targetDialCode;
    } else if (hasExplicitCountry) {
      // للطالب دولة محددة والرقم محلي بدأ بصفر -> نزيل الصفر ونضيف رمز دولته
      // مثال يمني: 0713801916 -> 967713801916
      // مثال تركي: 05351234567 -> 905351234567
      // مثال مصري: 01012345678 -> 201012345678
      finalDigits = targetDialCode + withoutLeadingZero;
      detectedCode = targetDialCode;
    } else {
      // لم تحدد دولة صريحة (الافتراضي اليمن 967)
      // فحص ما إذا كان الرقم يمني محلي أو دولي آخر
      const otherCode = findStartingDialCode(withoutLeadingZero);
      if (otherCode && otherCode !== '1') {
        finalDigits = withoutLeadingZero;
        detectedCode = otherCode;
      } else {
        // رقم محلي عادي يُنسب إلى اليمن افتراضياً
        finalDigits = targetDialCode + withoutLeadingZero;
        detectedCode = targetDialCode;
      }
    }
  } else {
    // لم يبدأ بـ 0 ولم يبدأ بـ +
    // فحص ما إذا كان الرقم مكتوباً بالصيغة الدولية أصلاً (يبدأ بـ 967 أو 90 أو 966...)
    if (digits.startsWith(targetDialCode)) {
      // يحتوي على رمز الدولة مسبقاً (مثل: 967713801916)
      finalDigits = digits;
      detectedCode = targetDialCode;
    } else if (hasExplicitCountry) {
      // رقم محلي بدون صفر كُتب لدولة محددة (مثل: 713801916 لليمن أو 5351234567 لتركيا)
      finalDigits = targetDialCode + digits;
      detectedCode = targetDialCode;
    } else {
      const otherCode = findStartingDialCode(digits);
      if (otherCode && otherCode !== '1') {
        finalDigits = digits;
        detectedCode = otherCode;
      } else {
        // رقم محلي بدون صفر (مثل يمني: 713801916 بطول 9 أرقام)
        finalDigits = targetDialCode + digits;
        detectedCode = targetDialCode;
      }
    }
  }

  // 3. التحقق من صحة الرقم الدولي (معيار E.164: من 8 إلى 15 رقماً)
  let isValid = true;
  let error: string | undefined;

  if (finalDigits.length < 8) {
    isValid = false;
    error = `رقم الهاتف غير مكتمل (${finalDigits.length} أرقام فقط). الحد الأدنى للأرقام الدولية 8 أرقام.`;
  } else if (finalDigits.length > 15) {
    isValid = false;
    error = `رقم الهاتف طويل جداً (${finalDigits.length} رقماً). الحد الأقصى للمعيار الدولي 15 رقماً.`;
  }

  // تنسيق العرض الواضح للمشرف
  const formattedDisplay = formatInternationalDisplay(finalDigits, detectedCode);

  return {
    isValid,
    cleanPhone: isValid ? finalDigits : '',
    formattedDisplay,
    rawInput,
    detectedCountryCode: detectedCode,
    error,
  };
}

/**
 * تنسيق واضح وسهل القراءة للمشرف بالصيغة الدولية
 */
function formatInternationalDisplay(digits: string, countryCode: string): string {
  if (!digits) return '';
  if (digits.startsWith(countryCode)) {
    const localPart = digits.slice(countryCode.length);
    return `+${countryCode} ${localPart}`;
  }
  return `+${digits}`;
}

/**
 * إنشاء رابط واتساب المباشر للويب أو التطبيق
 */
export function createWhatsAppLink(phone: string, text: string, countryOrCode?: string): string {
  const result = validateAndCleanWhatsAppNumber(phone, countryOrCode);
  const cleanPhone = result.cleanPhone;
  const encodedText = encodeURIComponent(text);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
}

/**
 * فتح محادثة واتساب بأمان مع التحقق المسبق من صحة الرقم الدولي
 * وإظهار رسالة واضحة للمشرف بدلاً من فتح رابط خاطئ
 */
export function openWhatsAppSafely(params: {
  phone?: string;
  text: string;
  countryOrCode?: string;
  onError?: (errorMessage: string) => void;
  onSuccess?: (cleanPhone: string, url: string) => void;
}): boolean {
  const validation = validateAndCleanWhatsAppNumber(params.phone, params.countryOrCode);

  if (!validation.isValid) {
    const msg = validation.error || 'رقم هاتف الطالب غير صالح للإرسال عبر واتساب. يرجى التحقق من الرقم ورمز الدولة.';
    if (params.onError) {
      params.onError(msg);
    } else {
      console.warn('[WhatsApp] تعذر فتح واتساب:', msg, 'الرقم الأصلي:', params.phone);
    }
    return false;
  }

  const url = `https://wa.me/${validation.cleanPhone}?text=${encodeURIComponent(params.text)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  if (params.onSuccess) {
    params.onSuccess(validation.cleanPhone, url);
  }

  return true;
}

/**
 * تجهيز نص رسالة القبول الرسمية للطالب
 */
export function buildAcceptanceMessage(params: {
  studentName: string;
  academicId: string;
  section: 'male' | 'female';
  studyType?: string;
  riwayah?: string;
  preferredTime?: string;
  preferredTimeDetail?: string;
  portalUrl?: string;
}): string {
  const isFemale = params.section === 'female';
  const sectionTitle = isFemale ? 'قسم الطالبات (أخوات)' : 'قسم الطلاب (بنين)';
  const portalUrl = params.portalUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://rehab-quran.com/login');

  return `السلام عليكم ورحمة الله وبركاته،

أهلاً بك في *مقرأة رحاب القرآن الإلكترونية* 🌿
نبارك لكم قبول طلب التسجيل في *${sectionTitle}*.

📋 *بيانات الحساب الأكاديمي المعتمد:*
• اسم الطالب/ـة: *${params.studentName}*
• الرقم الأكاديمي: *${params.academicId}*
• المسار القرآني: ${params.studyType || 'تحفيظ القرآن الكريم'}
• الرواية المعتمدة: ${params.riwayah || 'حفص عن عاصم'}
• وقت الحلقة المفضل: ${params.preferredTime || 'الفجر'} ${params.preferredTimeDetail ? `(${params.preferredTimeDetail})` : ''}

🔐 *بيانات الدخول إلى المنصة:*
• اسم المستخدم / الرقم الأكاديمي: *${params.academicId}*
• رابط تسجيل الدخول: ${portalUrl}

نسأل الله العلي القدير أن يبارك لكم في حفظ كتابه الكريم، وأن يجعله نوراً في صدوركم.


*إدارة مقرأة رحاب القرآن الإلكترونية*
_معاً على مائدة القرآن العظيم_`;
}

/**
 * تجهيز رسالة بيانات دخول الطالب وتفاصيل الحلقة المعتمدة لإرسالها عبر WhatsApp يدوياً
 * البنود الإلزامية:
 * 1. اسم الطالب
 * 2. الرقم الأكاديمي
 * 3. اسم المستخدم
 * 4. كلمة المرور المؤقتة
 * 5. اسم الحلقة
 * 6. اسم المعلم
 * 7. أيام ووقت الحلقة والمنطقة الزمنية
 * 8. رابط تسجيل الدخول
 * + روابط Google Meet ومجموعة واتساب إن وُجدت
 */
export function buildStudentAccountWhatsAppMessage(params: {
  studentName: string;
  academicId: string;
  username: string;
  temporaryPassword: string;
  halqaTitle: string;
  teacherName: string;
  halqaDays: string;
  halqaTime: string;
  timezone?: string;
  loginUrl?: string;
  googleMeetUrl?: string;
  whatsappGroupUrl?: string;
}): string {
  const loginUrl = params.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://rehab-quran.web.app/login');
  const timezoneStr = params.timezone ? ` (${params.timezone})` : ' (توقيت مكة المكرمة GMT+3)';

  let msg = `السلام عليكم ورحمة الله وبركاته،\n\n`;
  msg += `أهلاً بك يا *${params.studentName}* في *مقرأة رحاب القرآن الإلكترونية* 🌿\n`;
  msg += `نبارك لك قبول طلب تسجيلك واعتماد انضمامك رسمياً للمقرأة.\n\n`;
  msg += `🔐 *بيانات الدخول إلى المنصة:*\n`;
  msg += `• اسم الطالب: *${params.studentName}*\n`;
  msg += `• الرقم الأكاديمي: *${params.academicId}*\n`;
  msg += `• اسم المستخدم: *${params.username}*\n`;
  msg += `• كلمة المرور المؤقتة: *${params.temporaryPassword}*\n`;
  msg += `• رابط تسجيل الدخول: ${loginUrl}\n\n`;
  msg += `📖 *تفاصيل الحلقة والمعلم المعيّن:*\n`;
  msg += `• اسم الحلقة: *${params.halqaTitle}*\n`;
  msg += `• فضيلة الشيخ / المعلم: *${params.teacherName}*\n`;
  msg += `• أيام الحلقة: *${params.halqaDays}*\n`;
  msg += `• وقت الحلقة: *${params.halqaTime}*${timezoneStr}\n`;

  if (params.googleMeetUrl && params.googleMeetUrl.trim()) {
    msg += `• رابط Google Meet للحلقة: ${params.googleMeetUrl.trim()}\n`;
  }
  if (params.whatsappGroupUrl && params.whatsappGroupUrl.trim()) {
    msg += `• رابط مجموعة واتساب للحلقة: ${params.whatsappGroupUrl.trim()}\n`;
  }

  msg += `\nيرجى تسجيل الدخول لأول مرة وتغيير كلمة المرور إن رغبت، والالتزام بمواعيد التسميع والحضور.\n\n`;
  msg += `*إدارة مقرأة رحاب القرآن الإلكترونية*\n`;
  msg += `_نسأل الله لك التوفيق والبركة في مدارسة كتابه الكريم_`;

  return msg;
}

/**
 * الرسالة الرسمية المعتمدة لتعليمات الدخول عبر WhatsApp للطلاب المقبولين
 * مطابقة للنموذج القياسي:
 * السلام عليكم ورحمة الله وبركاته 🌿
 * تم قبول تسجيلك في مقرأة رحاب القرآن الإلكترونية.
 * 
 * 🔐 بيانات الدخول:
 * 👤 اسم المستخدم: [البريد أو رقم الهاتف]
 * 🔑 كلمة المرور: التي اخترتها عند التسجيل
 * 🌐 رابط الدخول: [رابط صفحة تسجيل الدخول]
 * 
 * 📖 بيانات حلقتك:
 * الحلقة: [اسم الحلقة]
 * الشيخ: [اسم الشيخ]
 * الأيام: [الأيام]
 * الوقت: [الوقت]
 * 
 * 🎥 رابط Google Meet: [الرابط]
 * 💬 مجموعة WhatsApp: [الرابط]
 * 
 * إذا نسيت كلمة المرور: استخدم زر «نسيت كلمة المرور؟»
 */
export function buildStudentAdmissionWhatsAppInstructions(params: {
  username: string;
  halqaTitle: string;
  teacherName: string;
  halqaDays: string;
  halqaTime: string;
  loginUrl?: string;
  googleMeetUrl?: string;
  whatsappGroupUrl?: string;
}): string {
  const loginUrl = params.loginUrl || (typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://rehab-quran.web.app/login');

  let msg = `السلام عليكم ورحمة الله وبركاته 🌿\n`;
  msg += `تم قبول تسجيلك في مقرأة رحاب القرآن الإلكترونية.\n\n`;
  msg += `🔐 بيانات الدخول:\n`;
  msg += `👤 اسم المستخدم: ${params.username}\n`;
  msg += `🔑 كلمة المرور: التي اخترتها عند التسجيل\n`;
  msg += `🌐 رابط الدخول: ${loginUrl}\n\n`;
  msg += `📖 بيانات حلقتك:\n`;
  msg += `الحلقة: ${params.halqaTitle}\n`;
  msg += `الشيخ: ${params.teacherName}\n`;
  msg += `الأيام: ${params.halqaDays}\n`;
  msg += `الوقت: ${params.halqaTime}\n\n`;
  msg += `🎥 رابط Google Meet: ${params.googleMeetUrl && params.googleMeetUrl.trim() ? params.googleMeetUrl.trim() : 'سيتم تزويدك به لاحقاً'}\n`;
  msg += `💬 مجموعة WhatsApp: ${params.whatsappGroupUrl && params.whatsappGroupUrl.trim() ? params.whatsappGroupUrl.trim() : 'سيتم تزويدك بها لاحقاً'}\n\n`;
  msg += `إذا نسيت كلمة المرور: استخدم زر «نسيت كلمة المرور؟»`;

  return msg;
}


/**
 * تجهيز نص رسالة الاعتذار والرفض اللبقة للطالب
 */
export function buildRejectionMessage(params: {
  studentName: string;
  section: 'male' | 'female';
  reason: string;
}): string {
  const isFemale = params.section === 'female';

  return `السلام عليكم ورحمة الله وبركاته،

الأخ/الأخت الفاضل/ـة: *${params.studentName}* المحترم/ـة،

بخصوص طلب تسجيلكم الكريم في *مقرأة رحاب القرآن الإلكترونية* (${isFemale ? 'قسم الطالبات' : 'قسم الطلاب'}):

نود إفادتكم بأنه يتعذر قبول الطلب في الوقت الحالي نظراً لـ:
📌 *${params.reason}*

شاكرين لكم اهتمامكم وحرصكم المبارك على مدارسة القرآن الكريم، ونرحب بتقديمكم مجدداً في الدورات والحلقات القادمة بإذن الله تعالى.

*إدارة مقرأة رحاب القرآن الإلكترونية*`;
}

/**
 * إرسال أو تجهيز رسالة واتساب
 * إذا كان هناك WhatsApp API مضبوط في المتغيرات سيقوم بالإرسال التلقائي،
 * وإلا فسيجهز الرابط المباشر للزر اليدوي.
 */
export async function sendOrPrepareWhatsAppMessage(params: {
  phone: string;
  messageText: string;
  countryOrCode?: string;
}): Promise<WhatsAppMessageResult> {
  const validation = validateAndCleanWhatsAppNumber(params.phone, params.countryOrCode);
  const cleanPhone = validation.cleanPhone;
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(params.messageText)}`
    : '';

  if (!validation.isValid) {
    return {
      sentViaApi: false,
      whatsappUrl: '',
      messageText: params.messageText,
      cleanPhone: '',
      formattedDisplay: validation.formattedDisplay,
      isValid: false,
      error: validation.error || 'رقم هاتف الطالب غير صالح للإرسال عبر واتساب',
    };
  }

  // فحص ما إذا كان WhatsApp API مهيأ في البيئة
  const apiUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_WHATSAPP_API_URL as string | undefined) : undefined;
  const apiToken = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_WHATSAPP_API_TOKEN as string | undefined) : undefined;

  if (apiUrl && apiToken && cleanPhone) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          to: cleanPhone,
          message: params.messageText,
        }),
      });

      if (response.ok) {
        return {
          sentViaApi: true,
          whatsappUrl,
          messageText: params.messageText,
          cleanPhone,
          formattedDisplay: validation.formattedDisplay,
          isValid: true,
        };
      }
    } catch (err: any) {
      console.warn('[WhatsApp API] فشل الإرسال التلقائي عبر API، سيتم الاعتماد على الرابط اليدوي:', err?.message || err);
    }
  }

  // الوضع الافتراضي: إتاحة الرابط للمشرف للضغط والإرسال المباشر
  return {
    sentViaApi: false,
    whatsappUrl,
    messageText: params.messageText,
    cleanPhone,
    formattedDisplay: validation.formattedDisplay,
    isValid: true,
  };
}
