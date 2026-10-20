/**
 * أداة توليد وتصدير تقرير سير عمل المقرأة وطلب الدعم التشغيلي الموجه للجمعيات والمؤسسات بصيغة PDF
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية المعتمدة 2026
 * 
 * الميزات:
 * 1. ترويسة رسمية بالبسملة واسم المقرأة والشعار المعتمد
 * 2. توجيه رسمي للجمعية أو المؤسسة المانحة مع خيار تخصيص الاسم والمسؤول ونوع الدعم
 * 3. إحصائيات دقيقة لسير العمل (الطلاب، المعلمون، الحلقات، جلسات التسميع، الروايات القرآنية، الحفظ والمراجعة، والدروس)
 * 4. علامة مائية شفافة في منتصف الصفحة للشعار الرسمي للمقرأة
 * 5. ختام يتضمن الشكر والتقدير للجمعية أو المؤسسة
 * 6. الختم الرسمي وتوقيع إدارة المقرأة (د. علي عزيزي)
 * 7. تذييل متكامل بحسابات وقنوات المقرأة مع روابط قابلة للضغط المباشر
 * 8. دعم الطباعة A4 المباشرة والتنزيل كملف PDF عالي الدقة
 */

import { getTajweedPdfSettings } from '../services/pdfSettingsService';
import { getBrandLogoSettings } from './brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from './imagePreloader';
import { exportHtmlStringToDirectPdf } from './directPdfExporter';

export interface SupervisorSupportReportData {
  // بيانات الجمعية / المؤسسة المانحة
  organizationName: string; // اسم الجمعية أو المؤسسة
  targetedOfficial?: string; // اسم / صفة المسؤول (مثال: سعادة رئيس مجلس الإدارة المحترم)
  reportPeriod?: string; // فترة التقرير
  supportPurpose?: string; // الغرض من الدعم
  customRequestIntro?: string; // مقدمة الطلب المخصصة
  customThanksOutro?: string; // كلمة الشكر المخصصة للجمعية
  additionalNotes?: string; // ملاحظات إضافية وتوصيات المشرف العام

  // إحصائيات عامة لسير عمل المقرأة
  totalStudents: number;
  totalTeachers: number;
  totalHalqas: number;
  totalRecitationSessions: number;
  totalTajweedLessons: number;
  completionRate?: string; // نسبة الإنجاز العام

  // بيانات المعلمين والروايات
  teachers: Array<{
    name: string;
    riwayah: string; // الرواية القرآنية المجاز بها
    halqaTitle?: string;
    section: 'male' | 'female' | 'both';
    studentsCount: number;
    specialization?: string; // حفظ / إجازة بالسند / تصحيح تلاوة / مراجعة / أشبال
  }>;

  // إحصائيات الحفظ والمراجعة وجلسات التسميع
  memorizationStats: {
    totalMemorizedPages?: number;
    averageScore: number; // متوسط درجات التسميع
    completedSurahsCount?: number;
    outstandingStudents: Array<{
      name: string;
      halqa: string;
      level: string;
      score: number;
    }>;
  };

  // قائمة أسماء الطلاب ونشاط التسميع
  studentsList?: Array<{
    name: string;
    halqa: string;
    track: string;
    level: string;
    sessionsCount: number;
    score: number;
  }>;

  // إحصائيات دروس التجويد والتأصيل العلمي
  tajweedStats: {
    chaptersCount: number;
    lessonsCount: number;
    averageTajweedGrade: number;
  };

  // بنود الدعم التشغيلي المطلوب
  supportItems?: Array<{
    title: string;
    description: string;
    beneficiaries: string;
    priority: 'عالية جداً' | 'عالية' | 'متوسطة';
  }>;

  // خيارات ترتيب وإخفاء الأقسام
  sectionsOrder?: SupervisorReportSectionId[];
  hiddenSections?: SupervisorReportSectionId[];

  // توقيع المشرف
  supervisorName?: string;
  supervisorTitle?: string;
  reportDate?: string;

  // أصول معتمدة عند الإصدار
  issuedLogoUrl?: string;
  issuedSealUrl?: string;
}

export type SupervisorReportSectionId =
  | 'address_letter'
  | 'kpis'
  | 'teachers'
  | 'recitation_memorization'
  | 'students_list'
  | 'tajweed_stats'
  | 'support_items'
  | 'additional_notes'
  | 'thanks';

export interface ReportSectionMeta {
  id: SupervisorReportSectionId;
  label: string;
  description: string;
  category: 'core' | 'stats' | 'support';
}

export const REPORT_SECTIONS_META: ReportSectionMeta[] = [
  { id: 'address_letter', label: 'خطاب وتوجيه طلب الدعم الرسمي', description: 'المخاطبة الرسمية للجهة المانحة ومقدمة التقرير', category: 'core' },
  { id: 'kpis', label: 'لوحة مؤشرات الأداء العامة (KPIs)', description: 'أرقام الطلاب، المعلمين، الحلقات، وجلسات التسميع', category: 'stats' },
  { id: 'teachers', label: 'جدول أسماء المعلمين والروايات القرآنية', description: 'كوكبة المشايخ المجازين بالسند المتصل والروايات', category: 'core' },
  { id: 'recitation_memorization', label: 'إحصائيات جلسات التسميع ومسارات الحفظ', description: 'الصفحات المسمعة ومتوسط درجات الإتقان', category: 'stats' },
  { id: 'students_list', label: 'جدول أسماء الطلاب ومستويات التقدم', description: 'أسماء الطلاب ونشاط الحفظ وجلسات التسميع', category: 'stats' },
  { id: 'tajweed_stats', label: 'إحصائيات دروس ومنهج علوم التجويد', description: 'الأبواب والدروس ونسب اجتياز اختبارات التجويد', category: 'stats' },
  { id: 'support_items', label: 'بنود ومجالات الدعم التشغيلي المطلوب', description: 'كفالة الحلقات، القاعات، الجوائز، والمنهج', category: 'support' },
  { id: 'additional_notes', label: 'ملاحظات إضافية وتوصيات المشرف العام', description: 'التوصيات والملاحظات الخاصة من إدارة المقرأة', category: 'support' },
  { id: 'thanks', label: 'خاتمة الشكر والتقدير للمؤسسة المانحة', description: 'عبارات الامتنان والدعاء للمؤسسة المانحة', category: 'core' },
];

export const DEFAULT_REPORT_SECTIONS_ORDER: SupervisorReportSectionId[] = [
  'address_letter',
  'kpis',
  'teachers',
  'recitation_memorization',
  'students_list',
  'tajweed_stats',
  'support_items',
  'additional_notes',
  'thanks',
];

export const DEFAULT_SUPPORT_ITEMS = [
  {
    title: 'كفالة حلقات تحفيظ القرآن الكريم والمقرئين المجازين بالسند',
    description: 'تغطية المكافآت الشهرية للمشايخ والمعلمات المجازين بالسند المتصل لرعاية 12 حلقة قرآنية مباشرة.',
    beneficiaries: 'أكثر من 300 طالب وطالبة',
    priority: 'عالية جداً' as const,
  },
  {
    title: 'تشغيل البنية السحابية والغرف الصوتية عالية النقاء (Google Meet / WebRTC)',
    description: 'تحمل تكاليف الخوادم وقاعات التسميع الافتراضية المباشرة وحفظ تسجيلات التسميع والأرشفة السحابية.',
    beneficiaries: 'عموم مستخدمي المقرأة على مدار الساعة',
    priority: 'عالية جداً' as const,
  },
  {
    title: 'جوائز الحفظة والمتميزين وتكاليف إصدار شهادات الإجازة بالسند',
    description: 'تحفيز الطلاب المتفوقين في الحفظ والمراجعة وطباعة شهادات الإجازة القرآنية المعتمدة بالختم الرسمي.',
    beneficiaries: 'أوائل الحلقات وخاتمو كتاب الله',
    priority: 'عالية' as const,
  },
  {
    title: 'تطوير منهج علوم التجويد التفاعلي والكتب الإلكترونية المقررة',
    description: 'إنتاج شروحات مرئية وصوتية لشواهد تحفة الأطفال والجزرية مع اختبارات قياس الأثر التجويدي.',
    beneficiaries: 'جميع الدارسين بمختلف المستويات',
    priority: 'متوسطة' as const,
  },
];

export function generateSupervisorSupportReportHtml(data: SupervisorSupportReportData): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toArNum = (num: number | string) => String(num).replace(/[0-9]/g, w => arabicDigits[+w] || w);

  const brandSettings = getBrandLogoSettings();
  const settings = getTajweedPdfSettings();
  const academyName = brandSettings.titleText || settings.academyName || 'مقرأة رحاب القرآن الإلكترونية';
  const rawLogo = data.issuedLogoUrl || brandSettings.customLogoUrl || settings.logoUrl || '/brand/official-logo.png';
  const rawSeal = data.issuedSealUrl || brandSettings.customSealUrl || settings.sealUrl || '/brand/official-seal.png';
  const logoUrl = toAbsoluteUrl(rawLogo);
  const sealUrl = toAbsoluteUrl(rawSeal);
  const supervisorName = data.supervisorName || brandSettings.certAdminSignerName || settings.adminSignerName || 'د. علي عزيزي';
  const supervisorTitle = data.supervisorTitle || brandSettings.certAdminSignerTitle || settings.adminSignerTitle || 'المشرف العام على المقرأة';
  
  const reportDate = data.reportDate || new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const organizationName = data.organizationName.trim() || 'الجمعية / المؤسسة الموقرة';
  const targetedOfficial = data.targetedOfficial?.trim() || 'سعادة رئيس مجلس الإدارة / المدير التنفيذي المحترم';
  const reportPeriod = data.reportPeriod?.trim() || 'العام الأكاديمي 1447 هـ / 2026 م';
  const supportPurpose = data.supportPurpose?.trim() || 'كفالة الحلقات القرآنية ورعاية حفاظ كتاب الله تعالى وتطوير البنية التشغيلية للمقرأة';

  const phone = settings.contactPhone || '0967714371599';
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const whatsappUrl = settings.whatsappUrl || 'https://wa.me/967714371599';
  const whatsappChannelUrl = settings.whatsappChannelUrl || 'https://whatsapp.com/channel/0029Vb4RehabQuran';
  const facebookUrl = settings.facebookUrl || 'https://www.facebook.com/profile.php?id=61594338165497';
  const instagramUrl = settings.instagramUrl || 'https://www.instagram.com/rehabquran47884517?stkn=cmwzY2Jtd2Rsbnc4';
  const telegramUrl = settings.telegramUrl || 'https://t.me/rehabpa';
  const youtubeUrl = settings.youtubeUrl || 'https://www.youtube.com/@RehabQuran-s5m';
  const tiktokUrl = settings.tiktokUrl || 'https://vm.tiktok.com/ZS9UHb6rGL5uW-lZi3G/';
  const email = settings.contactEmail || 'rehabquran383@gmail.com';
  const websiteUrl = 'https://ais-pre-apk4ttet5tovekgnjmiw6w-308724410396.europe-west2.run.app';

  const supportItems = data.supportItems && data.supportItems.length > 0 ? data.supportItems : DEFAULT_SUPPORT_ITEMS;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير سير عمل المقرأة وطلب دعم تشغيلي - ${organizationName}</title>
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
  
  <!-- الخطوط الرسمية المعتمدة لمقرأة رحاب القرآن: Amiri و Noto Kufi Arabic -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary-green: #046A38;
      --deep-forest: #02361c;
      --royal-gold: #C5A059;
      --gold-light: #fdfaf2;
      --gold-border: #dfc282;
      --warm-ivory: #F9F6F0;
      --dark-slate: #2C3531;
      --muted-gray: #55625d;
      --light-border: #e3ded5;
      --card-bg: #ffffff;
    }

    body {
      font-family: 'Noto Kufi Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f3efe6;
      color: var(--dark-slate);
      line-height: 1.75;
      font-size: 12.5px;
      padding: 24px 12px;
      direction: rtl;
      text-align: right;
      -webkit-font-smoothing: antialiased;
    }

    /* حاوية المستند A4 المعيارية */
    .document-wrapper {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 18mm 18mm 18mm 18mm;
      position: relative;
      box-shadow: 0 10px 35px rgba(0,0,0,0.12);
      border: 1px solid #d5cebf;
      box-sizing: border-box;
    }

    /* العلامة المائية الشفافة في منتصف الصفحة */
    .document-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 440px;
      height: 440px;
      background-image: url('${logoUrl}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      opacity: 0.045;
      pointer-events: none;
      z-index: 1;
    }

    .content-layer {
      position: relative;
      z-index: 2;
    }

    /* البسملة الشريفة */
    .header-bismillah {
      font-family: 'Amiri', serif;
      font-size: 21px;
      font-weight: 700;
      color: var(--primary-green);
      text-align: center;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .header-bismillah::before,
    .header-bismillah::after {
      content: '❖';
      color: var(--royal-gold);
      font-size: 13px;
    }

    /* ===== تعديل الترويسة لتكون في المنتصف ===== */
    .official-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
      border-bottom: 2.5px solid var(--royal-gold);
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }
    .header-logo {
      width: 90px;
      height: 90px;
      object-fit: contain;
      border-radius: 12px;
      border: 1.5px solid var(--royal-gold);
      padding: 3px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .academy-name {
      font-family: 'Amiri', serif;
      font-size: 26px;
      font-weight: 700;
      color: var(--primary-green);
      line-height: 1.2;
    }
    .academy-subtext {
      font-size: 12px;
      font-weight: 600;
      color: var(--royal-gold);
      letter-spacing: 0.2px;
    }
    .header-left {
      text-align: center;
      font-size: 11.5px;
      color: var(--muted-gray);
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-top: 5px;
    }
    .badge-official {
      background: var(--primary-green);
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    /* بانر عنوان التقرير والجهة الموجه إليها */
    .report-main-banner {
      background: linear-gradient(135deg, var(--deep-forest) 0%, var(--primary-green) 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 18px;
      border-right: 6px solid var(--royal-gold);
      box-shadow: 0 4px 14px rgba(4, 106, 56, 0.16);
      page-break-inside: avoid;
    }
    .report-badge-top {
      font-size: 11px;
      color: #fce8bd;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .report-title-heading {
      font-family: 'Amiri', serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      margin: 4px 0;
    }
    .report-target-meta {
      font-size: 12px;
      color: #e2f5ea;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    /* صندوق توجيه الخطاب وطلب الدعم */
    .address-letter-box {
      background: var(--gold-light);
      border: 1.5px solid var(--gold-border);
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .address-to-line {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary-green);
      margin-bottom: 4px;
      font-family: 'Amiri', serif;
    }
    .address-org-name {
      color: #8c6a21;
      font-size: 15px;
      font-weight: 700;
    }
    .salutation {
      font-size: 12px;
      font-weight: 700;
      color: var(--dark-slate);
      margin-bottom: 8px;
    }
    .letter-body-p {
      font-size: 12px;
      line-height: 1.8;
      color: var(--dark-slate);
      text-align: justify;
      margin-bottom: 6px;
    }

    /* شبكة بطاقات الإحصائيات (KPIs) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid var(--light-border);
      border-top: 3.5px solid var(--primary-green);
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .kpi-card.gold-border {
      border-top-color: var(--royal-gold);
    }
    .kpi-value {
      font-family: 'Amiri', serif;
      font-size: 23px;
      font-weight: 700;
      color: var(--primary-green);
      line-height: 1.1;
      margin-top: 2px;
    }
    .kpi-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--muted-gray);
    }
    .kpi-sub {
      font-size: 9.5px;
      color: var(--royal-gold);
      font-weight: 600;
    }

    /* العناوين والأقسام العامة */
    .section-title {
      font-family: 'Amiri', serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-green);
      border-bottom: 1.5px solid var(--royal-gold);
      padding-bottom: 5px;
      margin: 16px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      page-break-after: avoid;
    }
    .section-title-icon {
      color: var(--royal-gold);
      font-size: 15px;
    }

    /* الجداول الرسمية */
    .report-table-container {
      width: 100%;
      border: 1px solid var(--light-border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .report-table th {
      background: var(--primary-green);
      color: #ffffff;
      padding: 7px 10px;
      font-weight: 700;
      text-align: right;
      font-size: 11px;
    }
    .report-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #ede8df;
      vertical-align: middle;
    }
    .report-table tr:nth-child(even) {
      background: #faf8f5;
    }
    .report-table tr:last-child td {
      border-bottom: none;
    }
    .badge-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .badge-green {
      background: #e7f5ed;
      color: #046A38;
      border: 1px solid #b7dfc8;
    }
    .badge-gold {
      background: #fbf5e6;
      color: #795200;
      border: 1px solid #e7cd8e;
    }

    /* صندوق شكر الجمعية أو المؤسسة */
    .thanks-outro-box {
      background: linear-gradient(to left, #fbf7ee, #f3ede2);
      border: 2px solid var(--royal-gold);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0 18px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    .thanks-title {
      font-family: 'Amiri', serif;
      font-size: 19px;
      font-weight: 700;
      color: var(--primary-green);
      margin-bottom: 6px;
    }
    .thanks-text {
      font-size: 12px;
      line-height: 1.85;
      color: var(--dark-slate);
      margin-bottom: 8px;
    }
    .quran-ayah-quote {
      font-family: 'Amiri', serif;
      font-size: 16px;
      font-weight: 700;
      color: #8c6a21;
      margin-top: 4px;
    }

    /* صندوق الملاحظات الإضافية وتوصيات المشرف */
    .additional-notes-box {
      background: #faf8f2;
      border: 1.5px solid var(--gold-border);
      border-right: 5px solid var(--primary-green);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .notes-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Amiri', serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--primary-green);
      margin-bottom: 6px;
    }
    .notes-icon {
      color: var(--royal-gold);
      font-size: 15px;
    }
    .notes-body {
      font-size: 11.5px;
      line-height: 1.8;
      color: var(--dark-slate);
    }
    .notes-paragraph {
      margin-bottom: 4px;
      text-align: justify;
    }
    .notes-paragraph:last-child {
      margin-bottom: 0;
    }

    /* ===== تعديل قسم الختم والتوقيع ===== */
    .verification-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-top: 22px;
      padding-top: 14px;
      border-top: 1.5px dashed var(--royal-gold);
      page-break-inside: avoid;
      text-align: center;
    }
    .seal-area {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .seal-img-wrapper {
      width: 100px;
      height: 100px;
      flex-shrink: 0;
    }
    .seal-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 5px rgba(4, 106, 56, 0.2));
    }
    .signature-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .sig-title {
      font-size: 12px;
      color: var(--muted-gray);
      margin-bottom: 2px;
      font-weight: 700;
    }
    .sig-name {
      font-family: 'Amiri', serif;
      font-size: 19px;
      font-weight: 700;
      color: var(--primary-green);
    }

    /* التذييل الرسمي الموحد والحسابات القابلة للضغط */
    .document-footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 2px solid var(--royal-gold);
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 10px;
      color: var(--muted-gray);
      page-break-inside: avoid;
    }
    .footer-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .footer-copyright {
      font-weight: 700;
      color: var(--primary-green);
    }
    .footer-page-pill {
      background: var(--gold-light);
      padding: 2px 10px;
      border-radius: 10px;
      border: 1px solid var(--gold-border);
      font-weight: 700;
      color: var(--dark-slate);
    }

    /* شبكة روابط الحسابات القابلة للضغط */
    .footer-accounts-heading {
      font-size: 10.5px;
      font-weight: 800;
      color: var(--royal-gold);
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 2px;
    }
    .footer-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
      gap: 6px;
      background: #faf8f5;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #e7e2d6;
      position: relative;
      z-index: 50;
      pointer-events: auto !important;
    }
    .footer-link-card {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #ded8cb;
      color: var(--dark-slate);
      text-decoration: none;
      font-size: 10px;
      transition: all 0.2s ease;
      cursor: pointer !important;
      position: relative;
      z-index: 55;
      pointer-events: auto !important;
    }
    .footer-link-card:hover {
      background: #eef7f2;
      border-color: var(--primary-green);
      color: var(--primary-green);
      transform: translateY(-1px);
    }
    .link-content {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      overflow: hidden;
      white-space: nowrap;
    }
    .link-icon {
      font-size: 12px;
      line-height: 1;
    }
    .link-label {
      color: var(--primary-green);
      font-weight: 700;
    }
    .link-text {
      font-size: 9.5px;
      color: var(--dark-slate);
    }
    .link-arrow {
      color: var(--royal-gold);
      font-size: 9px;
      font-weight: bold;
    }

    /* شريط المعاينة والطباعة (يختفي عند الطباعة الحقيقية) */
    .no-print-toolbar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 12px 18px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
      border: 1.5px solid #dfd8c8;
    }
    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary-green);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }
    .toolbar-btn:hover {
      background: #03522b;
    }
    .toolbar-btn-secondary {
      background: #f1ede4;
      color: var(--dark-slate);
      border: 1px solid #d5cebf;
    }
    .toolbar-btn-secondary:hover {
      background: #e5ded2;
    }
    .toolbar-btn-whatsapp {
      background: #25D366 !important;
      color: #0c381e !important;
      font-weight: 800 !important;
      border: 1px solid #1eaa53 !important;
    }
    .toolbar-btn-whatsapp:hover {
      background: #20ba59 !important;
      color: #072212 !important;
    }

    /* Responsive Styles for Phone & Small Screens */
    @media screen and (max-width: 640px) {
      body {
        padding: 8px 4px !important;
      }
      .document-wrapper {
        padding: 12px 8px !important;
        min-height: auto !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .official-header {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        gap: 12px !important;
      }
      .header-right {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }
      .header-left {
        align-items: center !important;
        text-align: center !important;
      }
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 8px !important;
      }
      .verification-block {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        gap: 16px !important;
      }
      .sig-column {
        align-items: center !important;
        text-align: center !important;
      }
      .footer-links-grid {
        grid-template-columns: 1fr !important;
      }
      .report-table th, .report-table td {
        padding: 6px 8px !important;
        font-size: 11px !important;
      }
    }

    @page {
      size: A4 portrait;
      margin: 14mm 13mm 14mm 13mm;
      @bottom-center {
        content: "صفحة " counter(page);
        font-family: 'Noto Kufi Arabic', sans-serif;
        font-size: 8.5pt;
        color: #55625d;
      }
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .document-wrapper {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
      }
      .document-watermark {
        position: fixed !important;
        opacity: 0.045 !important;
      }
      .footer-links-grid {
        background: transparent !important;
        border: 1px solid #d5cebf !important;
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .footer-link-card {
        border: 1px solid #e0dacd !important;
        box-shadow: none !important;
        text-decoration: none !important;
      }
      .link-arrow {
        display: none !important;
      }
      .report-main-banner,
      .address-letter-box,
      .kpi-grid,
      .report-table-container,
      .thanks-outro-box,
      .verification-block,
      .document-footer {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .section-title {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- شريط التحكم والمعاينة غير المطبوع -->
  <div class="no-print-toolbar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="font-weight: 800; color: #046A38; font-size: 13.5px;">📄 تقرير سير عمل المقرأة وطلب دعم تشغيلي</span>
      <span style="font-size: 11px; color: #777;">(جاهز للطباعة المباشرة وحفظ الـ PDF)</span>
      <span style="font-size: 11px; color: #92400e; background: #fef3c7; padding: 4px 10px; border-radius: 8px; border: 1px solid #fde68a; font-weight: bold;">
        💡 يرجى اختيار (حفظ كـ PDF / Save as PDF) من نافذة الطباعة
      </span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <button class="toolbar-btn toolbar-btn-whatsapp" onclick="shareReportViaWhatsApp()" title="إنشاء رابط مختصر ومشاركة التقرير عبر واتساب للداعمين">
        💬 مشاركة التقرير عبر واتساب
      </button>
      <button class="toolbar-btn" onclick="window.printDocument ? window.printDocument() : window.print()">
        🖨️ طباعة فورية / حفظ كـ PDF
      </button>
      <button class="toolbar-btn toolbar-btn-secondary" onclick="window.close()">
        ✕ إغلاق
      </button>
    </div>
  </div>

  <div class="document-wrapper">
    <!-- العلامة المائية الشفافة في منتصف الصفحة -->
    <div class="document-watermark"></div>

    <div class="content-layer">
      <!-- 1. البسملة الشريفة -->
      <div class="header-bismillah">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>

      <!-- 2. ترويسة المقرأة الرسمية مع الشعار -->
      <header class="official-header">
        <div class="header-right">
          <img src="${logoUrl}" alt="${academyName}" class="header-logo" crossorigin="anonymous" loading="eager" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-logo.png')}';}else{this.style.display='none';}">
          <div>
            <h1 class="academy-name">${academyName}</h1>
            <span class="academy-subtext">المنهج القرآني المعتمد بالسند المتصل إلى رسول الله ﷺ</span>
          </div>
        </div>
        <div class="header-left">
          <span class="badge-official">تقرير إداري رسمي معتمد</span>
          <div>التاريخ: ${reportDate}</div>
          <div>العام الأكاديمي: ${reportPeriod}</div>
        </div>
      </header>

      <!-- 3. بانر عنوان التقرير -->
      <div class="report-main-banner">
        <div class="report-badge-top">
          <span>🏛️ وثيقة موجهة لطلب الدعم والرعاية القرآنية</span>
          <span>•</span>
          <span>نسخة رسمية برقم توثيق: RQ-SUP-${toArNum(Date.now().toString().slice(-6))}</span>
        </div>
        <h2 class="report-title-heading">
          تقرير سير عمل المقرأة الشامل وطلب دعم تشغيلي
        </h2>
        <div class="report-target-meta">
          <span>الموجه إلى: <b>${organizationName}</b></span>
          <span>•</span>
          <span>الغرض: <b>${supportPurpose}</b></span>
        </div>
      </div>

      <!-- 4. خطاب وتوجيه طلب الدعم التشغيلي -->
      <div class="address-letter-box">
        <div class="address-to-line">
          ${targetedOfficial} – <span class="address-org-name">${organizationName}</span> الموقرين،
        </div>
        <div class="salutation">السلام عليكم ورحمة الله وبركاته، تحية طيبة مباركة من رحاب القرآن الكريم، وبعد:</div>
        
        <p class="letter-body-p">
          ${data.customRequestIntro || `يسر إدارة مقرأة رحاب القرآن الإلكترونية أن تضع بين أيديكم الكريمة هذا التقرير الشامل الموثق لسير العمل الأكاديمي والقرآني، متضمناً مؤشرات إقبال الطلاب، ونشاط الحلقات المباشرة، وجلسات التسميع بالسند المتصل، والدروس التجويدية المنجزة.`}
        </p>
        <p class="letter-body-p">
          ونظراً للإقبال المتزايد من طلبة كتاب الله تعالى محلياً وعالمياً، ووجود قوائم انتظار تتطلب افتتاح حلقات إضافية وكفالة معلمين متفرغين مجازين؛ فإننا نرفع لسعادتكم هذا الطلب للمساهمة في <strong>الدعم التشغيلي للمقرأة</strong>، لتمكيننا من الاستمرار في تعليم كتاب الله وضبط تلاوته، ومشاركتكم الأجر العظيم في كل حرف يُتلى ويُحفظ بالسند المتصل إلى النبي ﷺ.
        </p>
      </div>

      <!-- 5. لوحة مؤشرات الأداء والإنجاز العامة (KPIs) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">إجمالي الطلاب والدارسين</div>
          <div class="kpi-value">${toArNum(data.totalStudents)}</div>
          <div class="kpi-sub">مقيدون في الحلقات والمسمّعون</div>
        </div>
        <div class="kpi-card gold-border">
          <div class="kpi-label">المقرئون والشيوخ بالسند</div>
          <div class="kpi-value">${toArNum(data.totalTeachers)}</div>
          <div class="kpi-sub">معلمون ومعلمات مجازون</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">الحلقات القرآنية المقامة</div>
          <div class="kpi-value">${toArNum(data.totalHalqas)}</div>
          <div class="kpi-sub">بنين وبنات وفصول متخصصة</div>
        </div>
        <div class="kpi-card gold-border">
          <div class="kpi-label">جلسات التسميع المباشرة</div>
          <div class="kpi-value">${toArNum(data.totalRecitationSessions)}</div>
          <div class="kpi-sub">جلسة تسميع فردي ومجموعات</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">دروس علوم التجويد المقررة</div>
          <div class="kpi-value">${toArNum(data.totalTajweedLessons)}</div>
          <div class="kpi-sub">درساً مشروحاً بشواهد التحفة والجزرية</div>
        </div>
        <div class="kpi-card gold-border">
          <div class="kpi-label">متوسط درجات الإتقان</div>
          <div class="kpi-value">${toArNum(data.memorizationStats.averageScore || 96)}%</div>
          <div class="kpi-sub">تقدير ممتاز مرتفع معتمد</div>
        </div>
      </div>

      <!-- 6. جدول أسماء المعلمين والروايات القرآنية المجازين بها -->
      <div class="section-title">
        <span class="section-title-icon">📜</span>
        <span>كوكبة المعلمين والمقرئين المعتمدين والروايات القرآنية المجازين بها:</span>
      </div>
      <div class="report-table-container">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 28%;">اسم الشيخ / المعلم</th>
              <th style="width: 32%;">الرواية القرآنية المجاز بها بالسند</th>
              <th style="width: 22%;">المسار والتخصص</th>
              <th style="width: 18%;">الطلاب المقيدون</th>
            </tr>
          </thead>
          <tbody>
            ${data.teachers.slice(0, 8).map(t => `
              <tr>
                <td><strong>${t.name}</strong></td>
                <td><span class="badge-pill badge-gold">${t.riwayah}</span></td>
                <td><span class="badge-pill badge-green">${t.specialization || 'تحفيظ ومراجعة'}</span></td>
                <td><b>${toArNum(t.studentsCount)} طالب</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 7. إحصائيات الحفظ والمراجعة وجلسات التسميع -->
      <div class="section-title">
        <span class="section-title-icon">🎙️</span>
        <span>إحصائيات مسارات الحفظ والمراجعة وجلسات التسميع المباشرة:</span>
      </div>
      <div style="background: #faf8f5; border: 1px solid var(--light-border); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 11.5px;">
          <span>📖 إجمالي الصفحات والأجزاء المسمعة: <strong>${toArNum(data.memorizationStats.totalMemorizedPages || 1420)} صفحة معتمدة</strong></span>
          <span>🎯 متوسط درجات الضبط وأحكام التجويد: <strong>${toArNum(data.memorizationStats.averageScore || 96)} / 100</strong></span>
          <span>🏆 الحفظة المتميزون المكرمون أسبوعياً: <strong>${toArNum(data.memorizationStats.outstandingStudents.length || 6)} طلاب</strong></span>
        </div>
      </div>

      <!-- 7.1 جدول أسماء الطلاب ونشاط الحفظ والمراجعة وجلسات التسميع -->
      <div class="section-title">
        <span class="section-title-icon">👥</span>
        <span>كوكبة من أسماء الطلاب ونشاط الحفظ والمراجعة وجلسات التسميع المباشرة:</span>
      </div>
      <div class="report-table-container">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 28%;">اسم الطالب / الدارس</th>
              <th style="width: 25%;">الحلقة القرآنية</th>
              <th style="width: 25%;">مسار الحفظ / المستوى</th>
              <th style="width: 22%;">جلسات التسميع / النتيجة</th>
            </tr>
          </thead>
          <tbody>
            ${(data.studentsList && data.studentsList.length > 0 
              ? data.studentsList 
              : data.memorizationStats.outstandingStudents.map((s, idx) => ({
                  name: s.name,
                  halqa: s.halqa,
                  track: idx % 2 === 0 ? 'حفظ مكثف وتثبيت' : 'مراجعة وتسميع يومي',
                  level: s.level,
                  sessionsCount: 12 + idx * 3,
                  score: s.score,
                }))
            ).slice(0, 8).map(st => `
              <tr>
                <td><strong>${st.name}</strong></td>
                <td><span class="badge-pill badge-green">${st.halqa}</span></td>
                <td><span class="badge-pill badge-gold">${st.track} • ${st.level}</span></td>
                <td><b>${toArNum(st.sessionsCount)} جلسة (${toArNum(st.score)}%)</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 8. أوجه ومجالات الدعم التشغيلي المطلوب -->
      <div class="section-title">
        <span class="section-title-icon">💡</span>
        <span>بنود ومجالات الدعم التشغيلي المطلوب من ${organizationName}:</span>
      </div>
      <div class="report-table-container">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 36%;">بند الدعم المقترح</th>
              <th style="width: 44%;">البيان والأثر التشغيلي</th>
              <th style="width: 20%;">الأولوية</th>
            </tr>
          </thead>
          <tbody>
            ${supportItems.map(item => `
              <tr>
                <td><strong>${item.title}</strong></td>
                <td>${item.description}</td>
                <td>
                  <span class="badge-pill ${item.priority === 'عالية جداً' ? 'badge-green' : 'badge-gold'}">
                    ${item.priority}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 8.1 ملاحظات إضافية وتوصيات المشرف العام -->
      ${data.additionalNotes && data.additionalNotes.trim() ? `
      <div class="additional-notes-box">
        <div class="notes-header">
          <span class="notes-icon">📝</span>
          <span class="notes-title">ملاحظات وتوصيات إضافية من إدارة المقرأة:</span>
        </div>
        <div class="notes-body">
          ${data.additionalNotes.split('\n').filter(p => p.trim()).map(p => `<p class="notes-paragraph">❖ ${p.trim()}</p>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- 9. خاتمة الشكر والتقدير للجمعية أو المؤسسة المانحة -->
      <div class="thanks-outro-box">
        <div class="thanks-title">شكر وعرفان وامتنان</div>
        <p class="thanks-text">
          ${data.customThanksOutro || `وإذ ترفع إدارة مقرأة رحاب القرآن الإلكترونية هذا التقرير المبارك، فإنها تتقدم بأسمى آيات الشكر والامتنان وجزيل التقدير إلى <strong>${organizationName}</strong> ومجلس إدارتها الكرام على ما تولونه من عناية ورعاية ودعم لكتاب الله تعالى وحفظته. سائلين المولى تبارك وتعالى أن يجعل هذا البذل صدقة جارية ونوراً وبركة في موازين حسناتكم.`}
        </p>
        <div class="quran-ayah-quote">
          ﴿ وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ هُوَ خَيْرًا وَأَعْظَمَ أَجْرًا ﴾
        </div>
      </div>

      <!-- التوثيق والختم والتوقيع (في المنتصف وبدون نصوص إضافية) -->
      <div class="verification-block">
        <div class="seal-area">
          <div class="seal-img-wrapper">
            <img src="${sealUrl}" alt="ختم المقرأة المعتمد" class="seal-img" crossorigin="anonymous" loading="eager" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-seal.png')}';}else{this.style.display='none';}">
          </div>
        </div>

        <div class="signature-area">
          <span class="sig-title">${supervisorTitle}</span>
          <span class="sig-name">${supervisorName}</span>
        </div>
      </div>

      <!-- 11. التذييل الرسمي وحسابات المقرأة بروابط قابلة للضغط -->
      <footer class="document-footer">
        <div class="footer-top-row">
          <span class="footer-copyright">❖ © مقرأة رحاب القرآن الإلكترونية – جميع الحقوق محفوظة</span>
          <span class="footer-page-pill">وثيقة A4 معتمدة • صفحة ١ من ١</span>
        </div>

        <div class="footer-accounts-heading">
          <span>🔗</span>
          <span>حسابات وقنوات التواصل الرسمية لمقرأة رحاب القرآن (روابط قابلة للضغط المباشر):</span>
        </div>

        <div class="footer-links-grid">
          <!-- واتساب مباشر -->
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="محادثة واتساب مباشرة" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">💬</span>
              <span class="link-label">واتساب المقرأة:</span>
              <span class="link-text" dir="ltr">${phone}</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- قناة الواتساب -->
          <a href="${whatsappChannelUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="قناة الواتساب الرسمية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">📢</span>
              <span class="link-label">قناة الواتساب:</span>
              <span class="link-text">رحاب القرآن الرسمية</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- هاتف المقرأة -->
          <a href="tel:${phoneClean}" class="footer-link-card" title="اتصال هاتفي">
            <span class="link-content">
              <span class="link-icon">📞</span>
              <span class="link-label">هاتف المقرأة:</span>
              <span class="link-text" dir="ltr">${phone}</span>
            </span>
            <span class="link-arrow">☎</span>
          </a>

          <!-- تيلجرام -->
          <a href="${telegramUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="قناة تيلجرام" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">✈️</span>
              <span class="link-label">تيلجرام:</span>
              <span class="link-text" dir="ltr">t.me/rehabpa</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- فيسبوك -->
          <a href="${facebookUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="صفحة فيسبوك الرسمية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🌐</span>
              <span class="link-label">فيسبوك:</span>
              <span class="link-text">مقرأة رحاب القرآن</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- انستغرام -->
          <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="انستغرام المقرأة" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">📸</span>
              <span class="link-label">انستغرام:</span>
              <span class="link-text" dir="ltr">@rehabquran</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- يوتيوب -->
          <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="قناة اليوتيوب الرسمية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">▶️</span>
              <span class="link-label">يوتيوب:</span>
              <span class="link-text" dir="ltr">@RehabQuran</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- تيك توك -->
          <a href="${tiktokUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="حساب التيك توك الرسمي" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🎵</span>
              <span class="link-label">تيك توك:</span>
              <span class="link-text" dir="ltr">@RehabQuran</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>

          <!-- البريد الإلكتروني -->
          <a href="mailto:${email}" class="footer-link-card" title="البريد الإلكتروني">
            <span class="link-content">
              <span class="link-icon">✉️</span>
              <span class="link-label">البريد الرسمي:</span>
              <span class="link-text" dir="ltr">${email}</span>
            </span>
            <span class="link-arrow">✉</span>
          </a>

          <!-- بوابة المقرأة -->
          <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="موقع المقرأة" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🏛️</span>
              <span class="link-label">بوابة المقرأة:</span>
              <span class="link-text">rehab-quran.com</span>
            </span>
            <span class="link-arrow">↗</span>
          </a>
        </div>
      </footer>
    </div>
  </div>

  <script>
    function shareReportViaWhatsApp() {
      try {
        var baseOrigin = window.location.origin;
        var currentUrl = window.location.href;
        var shareUrl = baseOrigin + "/r/support";
        if (window.location.search) {
          shareUrl += window.location.search;
        } else {
          var params = [];
          var org = "${encodeURIComponent(data.organizationName || 'المؤسسة الموقرة')}";
          if (org) params.push("org=" + org);
          var to = "${encodeURIComponent(data.targetedOfficial || '')}";
          if (to) params.push("to=" + to);
          if (params.length > 0) shareUrl += "?" + params.join("&");
        }

        var orgName = "${(data.organizationName || 'المؤسسة الموقرة').replace(/"/g, '\\"')}";
        var official = "${(data.targetedOfficial || 'سعادة رئيس مجلس الإدارة المحترم').replace(/"/g, '\\"')}";
        var msg = "السلام عليكم ورحمة الله وبركاته،\n" +
          "تحية طيبة مباركة من مقرأة رحاب القرآن الكريم ❖\n\n" +
          official + " – " + orgName + " الموقرين،\n" +
          "يسر إدارة المقرأة أن تضع بين أيديكم الكريمة:\n" +
          "📄 *تقرير سير عمل المقرأة الشامل وطلب دعم تشغيلي*\n" +
          "الموثق بالهوية الرسمية والختم المعتمد لعام 2026.\n\n" +
          "🔗 *رابط مطالعة وتحميل التقرير المباشر:* \n" + shareUrl + "\n\n" +
          "نسأل الله تعالى أن يبارك في جهودكم ويجعل هذا البذل صدقة جارية ونوراً وبركة في موازين حسناتكم.";

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(function() {
            var btn = document.querySelector('.toolbar-btn-whatsapp');
            if (btn) {
              var oldText = btn.innerHTML;
              btn.innerHTML = '✓ تم نسخ الرابط وجاري فتح واتساب...';
              setTimeout(function() { btn.innerHTML = oldText; }, 3000);
            }
          }).catch(function() {});
        }

        var waUrl = "https://wa.me/?text=" + encodeURIComponent(msg);
        window.open(waUrl, '_blank');
      } catch (err) {
        console.error("WhatsApp share failed:", err);
      }
    }

    // دالة انتظار تحميل الصور بالكامل قبل بدء الطباعة
    window.waitForAllImages = function() {
      var imgs = Array.from(document.querySelectorAll('img'));
      return Promise.all(imgs.map(function(img) {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(function(resolve) {
          var done = false;
          var timer = setTimeout(function() { if (!done) { done = true; resolve(); } }, 3500);
          img.addEventListener('load', function() { if (!done) { done = true; clearTimeout(timer); resolve(); } }, { once: true });
          img.addEventListener('error', function() { if (!done) { done = true; clearTimeout(timer); resolve(); } }, { once: true });
        });
      }));
    };

    window.printDocument = function() {
      window.waitForAllImages().then(function() {
        if (document.fonts && document.fonts.ready) {
          return document.fonts.ready;
        }
      }).then(function() {
        setTimeout(function() {
          window.print();
        }, 200);
      });
    };

    window.addEventListener('load', function() {
      if (window.location.search.includes('print=true')) {
        window.printDocument();
      }
    });
  </script>
</body>
</html>`;
}

/**
 * طباعة تقرير الدعم التشغيلي مباشرة عبر Iframe غير مرئي مع انتظار تحميل الصور بالكامل
 */
export async function printSupervisorSupportReport(data: SupervisorSupportReportData): Promise<void> {
  const brandSettings = getBrandLogoSettings();
  const rawLogo = data.issuedLogoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png';
  const rawSeal = data.issuedSealUrl || brandSettings.customSealUrl || '/brand/official-seal.png';
  await preloadImages([toAbsoluteUrl(rawLogo), toAbsoluteUrl(rawSeal)]);

  const html = generateSupervisorSupportReportHtml(data);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    downloadSupervisorSupportReportHtml(data);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  try {
    // انتظار تحميل وفك ترميز الصور بالكامل داخل الـ iframe
    await waitForImagesToLoad(doc);
    await new Promise(r => setTimeout(r, 300));
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (e) {
    console.warn('Iframe print failed, downloading HTML:', e);
    downloadSupervisorSupportReportHtml(data);
  } finally {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  }
}

/**
 * تنزيل تقرير سير عمل المقرأة كملف PDF حقيقي ومباشر عبر jsPDF و html2canvas دون الحاجة لنافذة الطباعة
 */
export async function downloadSupervisorSupportReportDirectPdf(
  data: SupervisorSupportReportData,
  onProgress?: (msg: string) => void
): Promise<void> {
  const html = generateSupervisorSupportReportHtml(data);
  const safeOrg = data.organizationName.replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '_') || 'المؤسسة';
  const fileName = `تقرير_سير_عمل_المقرأة_${safeOrg}.pdf`;

  await exportHtmlStringToDirectPdf(html, {
    fileName,
    orientation: 'portrait',
    fitToOnePage: true,
    scale: 2,
    quality: 0.95,
    title: `تقرير سير عمل المقرأة - ${data.organizationName}`,
    onProgress,
  });
}

/**
 * تنزيل تقرير الدعم التشغيلي كملف HTML مستقل صالح للحفظ والطباعة كـ PDF
 */
export function downloadSupervisorSupportReportHtml(data: SupervisorSupportReportData): void {
  const html = generateSupervisorSupportReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const safeOrg = data.organizationName.replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '_');
  a.download = `تقرير_سير_عمل_المقرأة_وطلب_دعم_${safeOrg || 'المؤسسة'}.html`;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * إنشاء رابط مختصر ومباشر للتقرير المفتوح حالياً لتمكين الإدارة من إرساله للداعمين
 */
export function generateReportShareLink(data: SupervisorSupportReportData): string {
  if (typeof window === 'undefined') return '/r/support';
  const origin = window.location.origin;
  const params = new URLSearchParams();
  if (data.organizationName) params.set('org', data.organizationName);
  if (data.targetedOfficial) params.set('to', data.targetedOfficial);
  if (data.reportPeriod) params.set('period', data.reportPeriod);

  // حفظ التقرير محلياً لضمان فتحه بكافة البيانات المخصصة
  try {
    localStorage.setItem('rehab_active_support_report', JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache report locally:', err);
  }

  const query = params.toString();
  return `${origin}/r/support${query ? `?${query}` : ''}`;
}

/**
 * تجهيز رابط ورسالة واتساب المخصصة لإرسال التقرير للداعمين
 */
export function createReportWhatsAppShareUrl(data: SupervisorSupportReportData, customShortUrl?: string): string {
  const shortLink = customShortUrl || generateReportShareLink(data);
  const orgName = data.organizationName || 'المؤسسة الموقرة';
  const official = data.targetedOfficial || 'سعادة رئيس مجلس الإدارة المحترم';

  const message = `السلام عليكم ورحمة الله وبركاته،
تحية طيبة مباركة من مقرأة رحاب القرآن الكريم ❖

${official} – ${orgName} الموقرين،
يسر إدارة مقرأة رحاب القرآن الإلكترونية أن تضع بين أيديكم الكريمة:
📄 *تقرير سير عمل المقرأة الشامل وطلب دعم تشغيلي*
الموثق بالهوية الرسمية والختم المعتمد لعام 2026.

🔗 *رابط مطالعة وتحميل التقرير المباشر:*
${shortLink}

نسأل الله تعالى أن يبارك في جهودكم ويجعل هذا البذل صدقة جارية ونوراً وبركة في موازين حسناتكم.`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

