/**
 * أداة توليد وتصدير وثائق ملخصات دروس التجويد بصيغة PDF المعتمدة
 * لمقرأة رحاب القرآن الإلكترونية (الهوية الرسمية 2026)
 * متوافقة تماماً مع معايير الطباعة A4، دعم RTL، الخطوط الرسمية (Amiri و Noto Kufi)،
 * الشعار الرسمي، الختم الإلكتروني، العلامة المائية الشفافة، وترقيم الصفحات.
 */

import { TajweedLesson, TajweedChapter } from '../types';
import { getTajweedPdfSettings, TajweedPdfSettings } from '../services/pdfSettingsService';
import { getBrandLogoSettings } from './brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from './imagePreloader';
import { exportHtmlStringToDirectPdf } from './directPdfExporter';

// تحويل الأرقام إلى أرقام عربية مشرقية (١، ٢، ٣ ...)
export function toArabicNumerals(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (w) => arabicDigits[+w]);
}

/**
 * بناء شيفرة HTML الكاملة لملخص درس التجويد مهيأة للطباعة المباشرة وحفظ الـ PDF
 */
export function generateLessonPdfHtml(
  lesson: TajweedLesson,
  chapter?: TajweedChapter,
  customSettings?: TajweedPdfSettings
): string {
  const settings = customSettings || getTajweedPdfSettings();
  const brandSettings = getBrandLogoSettings();
  const chapterTitle = chapter?.title || 'منهج علوم التجويد والإتقان القرآني';
  
  const formattedDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const bismillah = settings.headerBismillah || 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ';
  const academyName = brandSettings.titleText || settings.academyName || 'مقرأة رحاب القرآن الإلكترونية';
  const rawLogo = customSettings?.logoUrl || settings.logoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png';
  const rawSeal = customSettings?.sealUrl || settings.sealUrl || brandSettings.customSealUrl || '/brand/official-seal.png';
  const logoUrl = toAbsoluteUrl(rawLogo);
  const sealUrl = toAbsoluteUrl(rawSeal);
  const copyrightText = settings.copyrightText || '© مقرأة رحاب القرآن الإلكترونية – جميع الحقوق محفوظة';
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
  const watermarkOpacity = settings.watermarkOpacity !== undefined ? settings.watermarkOpacity : 0.05;
  const isWatermarkEnabled = settings.watermarkEnabled !== false;

  // إعداد فقرات الشرح النظري
  const textContentParagraphs = (lesson.textContent || lesson.description || '')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.title} - ${academyName}</title>
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
  
  <!-- استدعاء الخطوط الرسمية المعتمدة لهوية المقرأة 2026: Amiri و Noto Kufi Arabic -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    /* Reset & Base Setup */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary-green: #046A38;
      --deep-forest: #02361c;
      --royal-gold: #C5A059;
      --gold-light: #fef9ed;
      --gold-border: #dfc282;
      --warm-ivory: #F9F6F0;
      --dark-slate: #2C3531;
      --muted-gray: #55625d;
      --light-border: #e2e8e4;
      --card-bg: #ffffff;
    }

    body {
      font-family: 'Noto Kufi Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f1ede4;
      color: var(--dark-slate);
      line-height: 1.8;
      font-size: 13.5px;
      padding: 24px 12px;
      direction: rtl;
      text-align: right;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* A4 Sheet Container */
    .document-wrapper {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 22mm 20mm 20mm 20mm;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border: 1px solid #d5cebf;
      box-sizing: border-box;
    }

    /* Subtle Center Watermark - خفيف جداً في منتصف الصفحة */
    ${isWatermarkEnabled ? `
    .document-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 380px;
      height: 380px;
      background-image: url('${logoUrl}');
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      opacity: ${watermarkOpacity};
      pointer-events: none;
      z-index: 1;
    }
    ` : ''}

    .content-layer {
      position: relative;
      z-index: 2;
    }

    /* Top Bismillah Flourish */
    .header-bismillah-container {
      text-align: center;
      margin-bottom: 12px;
    }
    .header-bismillah {
      font-family: 'Amiri', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--primary-green);
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }
    .header-bismillah::before,
    .header-bismillah::after {
      content: '❖';
      color: var(--royal-gold);
      font-size: 12px;
    }

    /* Academy Official Header */
    .official-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2.5px solid var(--royal-gold);
      padding-bottom: 16px;
      margin-bottom: 20px;
      position: relative;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
    }
    .header-logo {
      width: 76px;
      height: 76px;
      object-fit: contain;
      border-radius: 12px;
      border: 1.5px solid var(--royal-gold);
      padding: 3px;
      background: #ffffff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .academy-name {
      font-family: 'Amiri', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--primary-green);
      line-height: 1.2;
    }
    .academy-subtext {
      font-size: 11px;
      font-weight: 600;
      color: var(--royal-gold);
      letter-spacing: 0.2px;
    }
    /* عنوان الدرس مدمج في الترويسة الرسمية */
    .header-lesson-banner {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #fdfbf7;
      border: 1.5px solid var(--royal-gold);
      padding: 4px 10px;
      border-radius: 8px;
      margin-top: 5px;
      box-shadow: 0 1px 3px rgba(197, 160, 89, 0.15);
      width: fit-content;
    }
    .header-lesson-badge {
      background: var(--primary-green);
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10.5px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .header-lesson-name {
      font-family: 'Amiri', serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-green);
    }
    .header-left {
      text-align: left;
      font-size: 11px;
      color: var(--muted-gray);
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .badge-official {
      display: inline-block;
      background: var(--primary-green);
      color: #ffffff;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 10.5px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    /* Lesson Main Title Banner */
    .lesson-banner {
      background: linear-gradient(135deg, var(--deep-forest) 0%, var(--primary-green) 100%);
      color: #ffffff;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 20px;
      border-right: 6px solid var(--royal-gold);
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(4, 106, 56, 0.15);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .lesson-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 11.5px;
    }
    .lesson-chapter-tag {
      color: #fce8bd;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .lesson-order-badge {
      background: var(--royal-gold);
      color: #1a221d;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 11px;
    }
    .lesson-title-heading {
      font-family: 'Amiri', serif;
      font-size: 23px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.35;
      margin-top: 4px;
    }
    .lesson-speaker-info {
      font-size: 11px;
      color: #e2f5ea;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* General Section Styling */
    .section-block {
      background: var(--card-bg);
      border: 1px solid var(--light-border);
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Amiri', serif;
      font-size: 17px;
      font-weight: 700;
      color: var(--primary-green);
      border-bottom: 1.5px solid var(--gold-border);
      padding-bottom: 6px;
      margin-bottom: 10px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .section-header-icon {
      color: var(--royal-gold);
      font-size: 15px;
    }

    /* Text Content */
    .text-paragraph {
      font-size: 12.5px;
      color: var(--dark-slate);
      line-height: 1.85;
      margin-bottom: 8px;
      text-align: justify;
    }
    .text-paragraph:last-child {
      margin-bottom: 0;
    }

    /* Poetic Verse Box - أبيات تحفة الأطفال أو الجزرية */
    .poetic-verse-box {
      background: var(--gold-light);
      border: 1.5px solid var(--gold-border);
      border-right: 5px solid var(--royal-gold);
      border-radius: 8px;
      padding: 14px 18px;
      margin: 14px 0;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .poetic-title {
      font-size: 11px;
      font-weight: 700;
      color: #8c6a21;
      margin-bottom: 6px;
    }
    .poetic-verse {
      font-family: 'Amiri', serif;
      font-size: 16.5px;
      font-weight: 700;
      color: #4a3608;
      line-height: 2.1;
      white-space: pre-line;
      letter-spacing: 0.3px;
    }

    /* Key Points List */
    .key-points-grid {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .key-point-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
      line-height: 1.65;
      color: var(--dark-slate);
    }
    .key-point-bullet {
      color: var(--royal-gold);
      font-size: 14px;
      line-height: 1;
      margin-top: 3px;
      flex-shrink: 0;
    }

    /* Practice Quranic Table */
    .verse-table-container {
      width: 100%;
      overflow: hidden;
      border: 1px solid var(--light-border);
      border-radius: 6px;
      margin-top: 8px;
    }
    .verse-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .verse-table th {
      background: var(--primary-green);
      color: #ffffff;
      padding: 8px 12px;
      font-weight: 700;
      font-size: 11.5px;
      text-align: right;
    }
    .verse-table td {
      padding: 9px 12px;
      border-bottom: 1px solid var(--light-border);
      vertical-align: middle;
    }
    .verse-table tr:nth-child(even) {
      background: #fafcfb;
    }
    .verse-table tr:last-child td {
      border-bottom: none;
    }
    .quran-verse-text {
      font-family: 'Amiri', serif;
      font-size: 17px;
      font-weight: 700;
      color: var(--primary-green);
      line-height: 1.5;
    }
    .rule-badge {
      display: inline-block;
      background: #fdf5e2;
      color: #795200;
      border: 1px solid #e7cd8e;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
    }

    /* Verification & Seal Section (ختم مقرأة رحاب القرآن الإلكترونية والتوقيع) */
    .verification-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 22px;
      padding-top: 14px;
      border-top: 1.5px dashed var(--gold-border);
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .seal-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .seal-image-wrapper {
      width: 78px;
      height: 78px;
      position: relative;
      flex-shrink: 0;
    }
    .seal-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(4, 106, 56, 0.2));
    }
    .seal-fallback-placeholder {
      width: 78px;
      height: 78px;
      border: 2px dashed var(--primary-green);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 9.5px;
      font-weight: 700;
      color: var(--primary-green);
      padding: 4px;
      background: var(--gold-light);
    }
    .seal-text-meta {
      display: flex;
      flex-direction: column;
    }
    .seal-title {
      font-size: 11.5px;
      font-weight: 800;
      color: var(--primary-green);
    }
    .seal-subtitle {
      font-size: 10px;
      color: var(--muted-gray);
    }

    .signature-block {
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .signature-title {
      font-size: 10.5px;
      color: var(--muted-gray);
      margin-bottom: 2px;
    }
    .signature-name {
      font-family: 'Amiri', serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--primary-green);
    }
    .signature-sub {
      font-size: 9.5px;
      color: var(--royal-gold);
    }

    /* Official Footer (التذييل الرسمي الموحد) */
    .document-footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 2px solid var(--royal-gold);
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 10.5px;
      color: var(--muted-gray);
      page-break-inside: avoid;
      break-inside: avoid;
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
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .footer-page-number {
      font-weight: 700;
      color: var(--dark-slate);
      background: var(--gold-light);
      padding: 2px 10px;
      border-radius: 10px;
      border: 1px solid var(--gold-border);
    }
    /* شبكة روابط الحسابات القابلة للضغط */
    .footer-accounts-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--royal-gold);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .footer-links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 7px;
      background: #faf8f5;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #e8e3d8;
      position: relative;
      z-index: 50;
      pointer-events: auto !important;
    }
    .footer-link-card {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 5px 9px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #ded8cb;
      color: var(--dark-slate);
      text-decoration: none;
      font-size: 10.5px;
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
      box-shadow: 0 2px 5px rgba(4, 106, 56, 0.12);
      transform: translateY(-1px);
    }
    .link-content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .link-icon {
      font-size: 13px;
      line-height: 1;
      flex-shrink: 0;
    }
    .link-label {
      color: var(--primary-green);
      font-weight: 700;
    }
    .link-text {
      color: var(--dark-slate);
      font-size: 10px;
      font-family: inherit;
    }
    .link-action-indicator {
      font-size: 10px;
      color: var(--royal-gold);
      flex-shrink: 0;
      font-weight: bold;
    }

    /* Print Screen Button for Web view */
    .no-print-toolbar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 12px 18px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
      border: 1px solid #dfd8c8;
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

    /* Responsive Styles for Phone & Small Screens */
    @media screen and (max-width: 640px) {
      body {
        padding: 8px 4px !important;
      }
      .document-wrapper {
        padding: 14px 10px !important;
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
      .header-titles {
        align-items: center !important;
        text-align: center !important;
      }
      .header-left {
        align-items: center !important;
        text-align: center !important;
      }
      .lesson-banner {
        padding: 12px 10px !important;
      }
      .lesson-title-heading {
        font-size: 16px !important;
      }
      .lesson-speaker-info {
        flex-direction: column !important;
        gap: 4px !important;
      }
      .verification-section {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
        gap: 16px !important;
      }
      .signature-block {
        align-items: center !important;
        text-align: center !important;
      }
      .footer-links-grid {
        grid-template-columns: 1fr !important;
      }
      .verse-table th, .verse-table td {
        padding: 6px 8px !important;
        font-size: 11px !important;
      }
    }

    /* Print Media Queries (@page & PDF optimization) */
    @page {
      size: A4 portrait;
      margin: 15mm 14mm 16mm 14mm;
      @bottom-center {
        content: "صفحة " counter(page);
        font-family: 'Noto Kufi Arabic', sans-serif;
        font-size: 9pt;
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
        opacity: ${watermarkOpacity} !important;
      }
      .footer-links-grid {
        background: transparent !important;
        border: 1px solid #d5cebf !important;
        padding: 6px 8px !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 4px !important;
      }
      .footer-link-card {
        border: 1px solid #e0dacd !important;
        padding: 3px 6px !important;
        box-shadow: none !important;
        color: #2C3531 !important;
        text-decoration: none !important;
      }
      .link-action-indicator {
        display: none !important;
      }
      .section-block,
      .verse-table,
      .poetic-verse-box,
      .verification-section,
      .lesson-banner,
      .document-footer {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      h1, h2, h3, h4, .section-header {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- شريط أدوات المعاينة والطباعة (يختفي تلقائياً عند الطباعة الحقيقية) -->
  <div class="no-print-toolbar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="font-weight: 700; color: #046A38; font-size: 13px;">وثيقة ملخص الدرس المعتمدة</span>
      <span style="font-size: 11px; color: #777;">(جاهزة للطباعة والتصدير بجودة A4)</span>
      <span style="font-size: 11px; color: #92400e; background: #fef3c7; padding: 4px 10px; border-radius: 8px; border: 1px solid #fde68a; font-weight: bold;">
        💡 يرجى اختيار (حفظ كـ PDF / Save as PDF) من نافذة الطباعة
      </span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="toolbar-btn" onclick="window.printDocument ? window.printDocument() : window.print()">
        🖨️ طباعة فورية / حفظ PDF
      </button>
      <button class="toolbar-btn toolbar-btn-secondary" onclick="window.close()">
        ✕ إغلاق
      </button>
    </div>
  </div>

  <div class="document-wrapper">
    ${isWatermarkEnabled ? '<div class="document-watermark"></div>' : ''}
    
    <div class="content-layer">
      <!-- 1. الترويسة العليا: البسملة الشريفة -->
      <div class="header-bismillah-container">
        <div class="header-bismillah">${bismillah}</div>
      </div>

      <!-- 2. ترويسة المقرأة الرسمية مع الشعار المعتمد وعنوان الدرس -->
      <header class="official-header">
        <div class="header-right">
          <img src="${logoUrl}" alt="${academyName}" class="header-logo" crossorigin="anonymous" loading="eager" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-logo.png')}';}else{this.style.display='none';}">
          <div class="header-titles">
            <h1 class="academy-name">${academyName}</h1>
            <span class="academy-subtext">المنهج التعليمي المعتمد بالسند المتصل إلى رسول الله ﷺ</span>
            
            <!-- عنوان الدرس ورقم الدرس مدمج في الترويسة الرسمية -->
            <div class="header-lesson-banner">
              <span class="header-lesson-badge">الدرس ${toArabicNumerals(lesson.order)}</span>
              <span class="header-lesson-name">${lesson.title}</span>
            </div>
          </div>
        </div>
        <div class="header-left">
          <span class="badge-official">وثيقة دراسية معتمدة</span>
          <div>تاريخ الإصدار: ${formattedDate}</div>
          <div>العام الدراسي: 1447 هـ / 2026 م</div>
          <div style="color: var(--primary-green); font-weight: 700; margin-top: 2px;">${chapterTitle}</div>
        </div>
      </header>

      <!-- 3. بانر عنوان الدرس ورقم الدرس والمعلومات الأكاديمية -->
      <div class="lesson-banner">
        <div class="lesson-meta-row">
          <span class="lesson-chapter-tag">
            📂 ${chapterTitle}
          </span>
          <span class="lesson-order-badge">
            الدرس رقم (${toArabicNumerals(lesson.order)})
          </span>
        </div>
        <h2 class="lesson-title-heading">
          الدرس ${toArabicNumerals(lesson.order)}: ${lesson.title}
        </h2>
        <div class="lesson-speaker-info">
          <span>🎙️ المحاضر المعتمد: <b>${lesson.videoSpeaker || 'فضيلة الشيخ المقرئ'}</b></span>
          <span>•</span>
          <span>⏱️ مدة الدرس المقدرة: ${toArabicNumerals(lesson.durationMinutes)} دقيقة</span>
          ${lesson.certifiedSource ? `<span>•</span><span>📚 المرجع: ${lesson.certifiedSource}</span>` : ''}
        </div>
      </div>

      <!-- 4. الشرح النظري والتأصيل العلمي -->
      <div class="section-block">
        <div class="section-header">
          <span class="section-header-icon">📖</span>
          <span>الشرح النظري والبيان العلمي</span>
        </div>
        <div class="section-body">
          ${textContentParagraphs.map(para => `<p class="text-paragraph">${para}</p>`).join('')}
        </div>
      </div>

      <!-- 5. الشواهد والمنظومات التجويدية (تحفة الأطفال أو الجزرية) إن وجدت -->
      ${lesson.poeticVerse ? `
      <div class="poetic-verse-box">
        <div class="poetic-title">📜 الشاهد المنظوم من متون التجويد المعتمدة (تحفة الأطفال / المقدمة الجزرية)</div>
        <div class="poetic-verse">${lesson.poeticVerse}</div>
      </div>
      ` : ''}

      <!-- 6. القواعد والأحكام الجوهرية للدرس -->
      ${lesson.keyPoints && lesson.keyPoints.length > 0 ? `
      <div class="section-block">
        <div class="section-header">
          <span class="section-header-icon">💎</span>
          <span>القواعد والأحكام الجوهرية المستفادة</span>
        </div>
        <div class="key-points-grid">
          ${lesson.keyPoints.map(point => `
            <div class="key-point-item">
              <span class="key-point-bullet">❖</span>
              <span>${point}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- 7. جدول التطبيقات العملية والتلاوة الموجهة -->
      ${lesson.practicalRequirement && lesson.practicalRequirement.versesToRecite && lesson.practicalRequirement.versesToRecite.length > 0 ? `
      <div class="section-block">
        <div class="section-header">
          <span class="section-header-icon">🎙️</span>
          <span>جدول التطبيقات العملية والتلاوة الموجهة</span>
        </div>
        <p style="font-size: 11.5px; color: var(--muted-gray); margin-bottom: 8px;">
          ${lesson.practicalRequirement.instruction || 'الآيات والكلمات القرآنية الواجب تطبيق أحكام الدرس عليها أثناء التسميع المباشر:'}
        </p>
        <div class="verse-table-container">
          <table class="verse-table">
            <thead>
              <tr>
                <th style="width: 48%;">الآية أو الكلمة القرآنية</th>
                <th style="width: 24%;">السورة وموضعها</th>
                <th style="width: 28%;">الحكم الواجب تطبيقه</th>
              </tr>
            </thead>
            <tbody>
              ${lesson.practicalRequirement.versesToRecite.map(item => `
                <tr>
                  <td class="quran-verse-text">﴿ ${item.text} ﴾</td>
                  <td style="font-weight: 600; color: #3d4a43;">${item.surah}</td>
                  <td>
                    <span class="rule-badge">${item.ruleToApply}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- 8. ختم مقرأة رحاب القرآن الإلكترونية والتوقيع الإداري المعتمد -->
      <div class="verification-section">
        <div class="seal-block">
          <div class="seal-image-wrapper">
            <img src="${sealUrl}" alt="${settings.sealTitle || 'ختم المقرأة'}" class="seal-image" crossorigin="anonymous" loading="eager" onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-seal.png')}';}else{this.outerHTML='<div class=\\'seal-fallback-placeholder\\'>ختم مقرأة رحاب القرآن الإلكترونية</div>';}">
          </div>
          <div class="seal-text-meta">
            <span class="seal-title">${settings.sealTitle || 'ختم مقرأة رحاب القرآن الإلكترونية'}</span>
            <span class="seal-subtitle">وثيقة دراسية معتمدة رسمياً من إدارة المقرأة</span>
          </div>
        </div>

        <div class="signature-block">
          <span class="signature-title">${settings.adminSignerTitle || 'المشرف العام على المقرأة'}</span>
          <span class="signature-name">${settings.adminSignerName || 'د. علي عزيزي'}</span>
          <span class="signature-sub">بالسند المتصل إلى النبي ﷺ</span>
        </div>
      </div>

      <!-- 9. التذييل الرسمي وحسابات التواصل (روابط قابلة للضغط تفاعلية) -->
      <footer class="document-footer">
        <div class="footer-top-row">
          <span class="footer-copyright">❖ ${copyrightText}</span>
          <span class="footer-page-number">صفحة ١ من ١ • وثيقة رسمية A4</span>
        </div>

        <div class="footer-accounts-title">
          <span>🔗</span>
          <span>حسابات وقنوات التواصل الرسمية لمقرأة رحاب القرآن (روابط قابلة للضغط المباشر):</span>
        </div>

        <div class="footer-links-grid">
          <!-- واتساب المقرأة المباشر -->
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="محادثة واتساب مباشرة مع إدارة المقرأة" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">💬</span>
              <span class="link-label">واتساب المقرأة:</span>
              <span class="link-text" dir="ltr">${phone}</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- قناة الواتساب الرسمية -->
          <a href="${whatsappChannelUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="الانضمام إلى قناة الواتساب الرسمية لمقرأة رحاب القرآن" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">📢</span>
              <span class="link-label">قناة الواتساب:</span>
              <span class="link-text">رحاب القرآن الرسمية</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- الاتصال الهاتفي -->
          <a href="tel:${phoneClean}" class="footer-link-card" title="الاتصال الهاتفي المباشر بالمقرأة">
            <span class="link-content">
              <span class="link-icon">📞</span>
              <span class="link-label">هاتف المقرأة:</span>
              <span class="link-text" dir="ltr">${phone}</span>
            </span>
            <span class="link-action-indicator">☎</span>
          </a>

          <!-- قناة تيلجرام -->
          <a href="${telegramUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="قناة تيلجرام الرسمية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">✈️</span>
              <span class="link-label">تيلجرام:</span>
              <span class="link-text" dir="ltr">t.me/rehabpa</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- صفحة فيسبوك -->
          <a href="${facebookUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="الصفحة الرسمية للمقرأة على فيسبوك" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🌐</span>
              <span class="link-label">فيسبوك:</span>
              <span class="link-text">مقرأة رحاب القرآن</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- حساب انستغرام -->
          <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="الحساب الرسمي على انستغرام" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">📸</span>
              <span class="link-label">انستغرام:</span>
              <span class="link-text" dir="ltr">@rehabquran</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- قناة يوتيوب -->
          <a href="${youtubeUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="قناة اليوتيوب الرسمية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">▶️</span>
              <span class="link-label">يوتيوب:</span>
              <span class="link-text" dir="ltr">@RehabQuran</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- حساب تيك توك -->
          <a href="${tiktokUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="حساب التيك توك الرسمي" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🎵</span>
              <span class="link-label">تيك توك:</span>
              <span class="link-text" dir="ltr">@RehabQuran</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>

          <!-- البريد الإلكتروني الرسمي -->
          <a href="mailto:${email}" class="footer-link-card" title="مراسلة المقرأة عبر البريد الإلكتروني">
            <span class="link-content">
              <span class="link-icon">✉️</span>
              <span class="link-label">البريد الرسمي:</span>
              <span class="link-text" dir="ltr">${email}</span>
            </span>
            <span class="link-action-indicator">✉</span>
          </a>

          <!-- منصة المقرأة الإلكترونية -->
          <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="footer-link-card" title="زيارة بوابة وموقع مقرأة رحاب القرآن الإلكترونية" onclick="window.open(this.href, '_blank'); return true;">
            <span class="link-content">
              <span class="link-icon">🏛️</span>
              <span class="link-label">بوابة المقرأة:</span>
              <span class="link-text">rehab-quran.com</span>
            </span>
            <span class="link-action-indicator">↗</span>
          </a>
        </div>
      </footer>
    </div>
  </div>

  <script>
    // دالة انتظار اكتمال تحميل وفك ترميز كافة الصور قبل الطباعة
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

    // تفعيل نافذة الطباعة تلقائياً عند فتح الوثيقة في نافذة مستقلة إن طُلب
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
 * طباعة ملخص الدرس بجودة A4 عبر Iframe صامت مع انتظار تحميل الصور بالكامل (Promise.all)
 */
export async function printLessonPdf(
  lesson: TajweedLesson,
  chapter?: TajweedChapter,
  customSettings?: TajweedPdfSettings
): Promise<void> {
  const brandSettings = getBrandLogoSettings();
  const settings = customSettings || getTajweedPdfSettings();
  const rawLogo = customSettings?.logoUrl || settings.logoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png';
  const rawSeal = customSettings?.sealUrl || settings.sealUrl || brandSettings.customSealUrl || '/brand/official-seal.png';
  await preloadImages([toAbsoluteUrl(rawLogo), toAbsoluteUrl(rawSeal)]);

  const html = generateLessonPdfHtml(lesson, chapter, customSettings);
  
  // إنشاء iframe غير مرئي للطباعة الآمنة
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
    downloadLessonPdfHtml(lesson, chapter, customSettings);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  try {
    // انتظار اكتمال تحميل الشعار والختم وجميع الصور داخل مستند الـ iframe
    await waitForImagesToLoad(doc);
    // مهلة إضافية لضمان اكتمال الرسم في الذاكرة
    await new Promise(r => setTimeout(r, 300));
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (e) {
    console.warn('Iframe print failed, falling back to download:', e);
    downloadLessonPdfHtml(lesson, chapter, customSettings);
  } finally {
    // إزالة الـ iframe بعد انتهاء عملية الطباعة
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  }
}

/**
 * تنزيل ملخص الدرس كملف HTML مستقل متكامل قابل للطباعة والحفظ بصيغة PDF
 */
export function downloadLessonPdfHtml(
  lesson: TajweedLesson,
  chapter?: TajweedChapter,
  customSettings?: TajweedPdfSettings
): void {
  const html = generateLessonPdfHtml(lesson, chapter, customSettings);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = lesson.title.replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '_');
  a.download = `درس_${lesson.order}_${safeTitle}_مقرأة_رحاب_القرآن.html`;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * تنزيل ملخص الدرس كملف PDF حقيقي ومباشر عبر jsPDF و html2canvas دون الحاجة لنافذة الطباعة
 */
export async function downloadLessonDirectPdf(
  lesson: TajweedLesson,
  chapter?: TajweedChapter,
  customSettings?: TajweedPdfSettings,
  onProgress?: (msg: string) => void
): Promise<void> {
  const html = generateLessonPdfHtml(lesson, chapter, customSettings);
  const safeTitle = lesson.title.replace(/[^\u0600-\u06FF\w\s-]/g, '').replace(/\s+/g, '_');
  const fileName = `درس_${lesson.order}_${safeTitle}_مقرأة_رحاب_القرآن.pdf`;

  await exportHtmlStringToDirectPdf(html, {
    fileName,
    orientation: 'portrait',
    fitToOnePage: true,
    scale: 2,
    quality: 0.95,
    title: `${lesson.title} - ملخص الدرس المعتمد`,
    onProgress,
  });
}

/**
 * الدالة الأصلية المحافظ عليها لدعم التوافق مع كامل المشروع
 */
export const generateLessonPdfDocument = (lesson: TajweedLesson, chapter?: TajweedChapter) => {
  printLessonPdf(lesson, chapter);
};
