/**
 * قائمة رموز الدول وأرقام النداء الدولي المعتمدة
 * لمقرأة رحاب القرآن الإلكترونية
 * 
 * اليمن (+967) هو الرمز الافتراضي المعتمد
 */

export interface CountryDialCode {
  iso: string;
  nameAr: string;
  dialCode: string; // بدون علامة +
  flag: string;
}

export const DEFAULT_COUNTRY_DIAL_CODE = '967'; // اليمن افتراضياً

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { iso: 'YE', nameAr: 'اليمن', dialCode: '967', flag: '🇾🇪' },
  { iso: 'SA', nameAr: 'المملكة العربية السعودية', dialCode: '966', flag: '🇸🇦' },
  { iso: 'EG', nameAr: 'مصر', dialCode: '20', flag: '🇪🇬' },
  { iso: 'TR', nameAr: 'تركيا', dialCode: '90', flag: '🇹🇷' },
  { iso: 'AE', nameAr: 'الإمارات العربية المتحدة', dialCode: '971', flag: '🇦🇪' },
  { iso: 'OM', nameAr: 'سلطنة عُمان', dialCode: '968', flag: '🇴🇲' },
  { iso: 'QA', nameAr: 'قطر', dialCode: '974', flag: '🇶🇦' },
  { iso: 'KW', nameAr: 'الكويت', dialCode: '965', flag: '🇰🇼' },
  { iso: 'BH', nameAr: 'البحرين', dialCode: '973', flag: '🇧🇭' },
  { iso: 'JO', nameAr: 'الأردن', dialCode: '962', flag: '🇯🇴' },
  { iso: 'PS', nameAr: 'فلسطين', dialCode: '970', flag: '🇵🇸' },
  { iso: 'IQ', nameAr: 'العراق', dialCode: '964', flag: '🇮🇶' },
  { iso: 'SY', nameAr: 'سوريا', dialCode: '963', flag: '🇸🇾' },
  { iso: 'LB', nameAr: 'لبنان', dialCode: '961', flag: '🇱🇧' },
  { iso: 'SD', nameAr: 'السودان', dialCode: '249', flag: '🇸🇩' },
  { iso: 'LY', nameAr: 'ليبيا', dialCode: '218', flag: '🇱🇾' },
  { iso: 'DZ', nameAr: 'الجزائر', dialCode: '213', flag: '🇩🇿' },
  { iso: 'MA', nameAr: 'المغرب', dialCode: '212', flag: '🇲🇦' },
  { iso: 'TN', nameAr: 'تونس', dialCode: '216', flag: '🇹🇳' },
  { iso: 'MR', nameAr: 'موريتانيا', dialCode: '222', flag: '🇲🇷' },
  { iso: 'SO', nameAr: 'الصومال', dialCode: '252', flag: '🇸🇴' },
  { iso: 'DJ', nameAr: 'جيبوتي', dialCode: '253', flag: '🇩🇯' },
  { iso: 'MY', nameAr: 'ماليزيا', dialCode: '60', flag: '🇲🇾' },
  { iso: 'ID', nameAr: 'إندونيسيا', dialCode: '62', flag: '🇮🇩' },
  { iso: 'GB', nameAr: 'بريطانيا (المملكة المتحدة)', dialCode: '44', flag: '🇬🇧' },
  { iso: 'US', nameAr: 'الولايات المتحدة / كندا', dialCode: '1', flag: '🇺🇸' },
  { iso: 'DE', nameAr: 'ألمانيا', dialCode: '49', flag: '🇩🇪' },
  { iso: 'FR', nameAr: 'فرنسا', dialCode: '33', flag: '🇫🇷' },
  { iso: 'SE', nameAr: 'السويد', dialCode: '46', flag: '🇸🇪' },
  { iso: 'NL', nameAr: 'هولندا', dialCode: '31', flag: '🇳🇱' },
  { iso: 'OTHER', nameAr: 'دولة أخرى', dialCode: '', flag: '🌐' },
];

/**
 * استنتاج رمز الدولة من اسم الدولة العربي أو الإنجليزي إذا كان مسجلاً
 */
export function deduceCountryDialCode(countryString?: string): string {
  if (!countryString) return DEFAULT_COUNTRY_DIAL_CODE;
  const normalized = countryString.trim().toLowerCase();

  // فحص مباشر لأشهر الدول
  if (normalized.includes('يمن') || normalized.includes('yemen')) return '967';
  if (normalized.includes('سعود') || normalized.includes('saudi') || normalized.includes('ksa')) return '966';
  if (normalized.includes('ترك') || normalized.includes('turk')) return '90';
  if (normalized.includes('مصر') || normalized.includes('egypt')) return '20';
  if (normalized.includes('إمارات') || normalized.includes('امارات') || normalized.includes('uae')) return '971';
  if (normalized.includes('عمان') || normalized.includes('عُمان') || normalized.includes('oman')) return '968';
  if (normalized.includes('قطر') || normalized.includes('qatar')) return '974';
  if (normalized.includes('كويت') || normalized.includes('kuwait')) return '965';
  if (normalized.includes('بحرين') || normalized.includes('bahrain')) return '973';
  if (normalized.includes('أردن') || normalized.includes('اردن') || normalized.includes('jordan')) return '962';
  if (normalized.includes('فلسطين') || normalized.includes('palestine')) return '970';
  if (normalized.includes('عراق') || normalized.includes('iraq')) return '964';
  if (normalized.includes('سوريا') || normalized.includes('syria')) return '963';
  if (normalized.includes('لبنان') || normalized.includes('lebanon')) return '961';
  if (normalized.includes('سودان') || normalized.includes('sudan')) return '249';
  if (normalized.includes('ليبيا') || normalized.includes('libya')) return '218';
  if (normalized.includes('جزائر') || normalized.includes('algeria')) return '213';
  if (normalized.includes('مغرب') || normalized.includes('morocco')) return '212';
  if (normalized.includes('تونس') || normalized.includes('tunisia')) return '216';
  if (normalized.includes('ماليزيا') || normalized.includes('malaysia')) return '60';
  if (normalized.includes('إندونيسيا') || normalized.includes('اندونيسيا') || normalized.includes('indonesia')) return '62';
  if (normalized.includes('بريطانيا') || normalized.includes('uk')) return '44';
  if (normalized.includes('أمريكا') || normalized.includes('امريكا') || normalized.includes('usa')) return '1';
  if (normalized.includes('ألمانيا') || normalized.includes('المانيا') || normalized.includes('germany')) return '49';
  if (normalized.includes('فرنسا') || normalized.includes('france')) return '33';
  if (normalized.includes('سويد') || normalized.includes('sweden')) return '46';

  // البحث في قائمة رموز الدول
  const matched = COUNTRY_DIAL_CODES.find(c => 
    c.dialCode && (normalized.includes(c.nameAr.toLowerCase()) || normalized.includes(c.iso.toLowerCase()))
  );
  if (matched && matched.dialCode) {
    return matched.dialCode;
  }

  return DEFAULT_COUNTRY_DIAL_CODE;
}
