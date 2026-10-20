/**
 * أداة تصدير المستندات والتقارير والشهادات مباشرة إلى ملف PDF (Direct PDF Exporter)
 * تعتمد على jsPDF و html2canvas لتوليد ملف PDF حقيقي وتنزيله فوراً في جهاز المستخدم
 * دون الحاجة لفتح نافذة الطباعة الخاصة بالمتصفح.
 * 
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية 2026
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { waitForImagesToLoad, preloadOfficialBrandAssets, toAbsoluteUrl } from './imagePreloader';

export interface DirectPdfOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'a3' | 'letter';
  scale?: number;
  quality?: number; // 0.1 to 1.0 for image compression
  imageType?: 'PNG' | 'JPEG';
  fitToOnePage?: boolean;
  backgroundColor?: string | null;
  title?: string;
  onProgress?: (status: string) => void;
}

/**
 * تحويل أي عنصر DOM في الصفحة مباشرة إلى ملف PDF وتحميله
 */
export async function exportElementToDirectPdf(
  element: HTMLElement,
  options: DirectPdfOptions = {}
): Promise<void> {
  const {
    fileName = 'وثيقة_مقرأة_رحاب_القرآن.pdf',
    orientation = 'portrait',
    format = 'a4',
    scale = 2.5,
    quality = 0.98,
    imageType = 'PNG',
    fitToOnePage = true,
    backgroundColor = null,
    title = 'وثيقة معتمدة - مقرأة رحاب القرآن',
    onProgress
  } = options;

  onProgress?.('جاري فحص الصور والخطوط المعتمدة...');
  
  // 1. التأكد من اكتمال تحميل الصور والخطوط
  await waitForImagesToLoad(element, 6000);
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready.catch(() => {});
  }

  onProgress?.('جاري تصيير المستند بدقة عالية عبر html2canvas...');
  
  // 2. تحويل العنصر إلى Canvas عبر html2canvas
  const canvas = await html2canvas(element, {
    scale: Math.min(Math.max(scale, 1.5), 3),
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: backgroundColor === null ? undefined : backgroundColor,
    imageTimeout: 15000,
    windowWidth: element.scrollWidth || 1200,
    onclone: (clonedDoc) => {
      // إخفاء أي أزرار أو أشرطة أدوات أثناء التصدير
      const noPrintEls = clonedDoc.querySelectorAll('.no-print, .no-print-toolbar, [data-no-print="true"], button');
      noPrintEls.forEach((el) => {
        if (el.classList.contains('no-print') || el.classList.contains('no-print-toolbar') || el.getAttribute('data-no-print') === 'true') {
          (el as HTMLElement).style.display = 'none';
        }
      });

      // تأكيد روابط الصور المطلقة و crossorigin داخل النسخة المستنسخة
      const images = clonedDoc.querySelectorAll('img');
      images.forEach((img) => {
        img.crossOrigin = 'anonymous';
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          img.src = toAbsoluteUrl(src);
        }
      });
    }
  });

  onProgress?.('جاري توليد ملف PDF عبر jsPDF...');

  const formatType = imageType === 'PNG' ? 'image/png' : 'image/jpeg';
  const imgData = canvas.toDataURL(formatType, quality);

  // أبعاد A4 بالمليمتر
  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
    compress: true
  });

  pdf.setProperties({
    title,
    author: 'مقرأة رحاب القرآن الإلكترونية',
    subject: 'وثيقة رسمية معتمدة بالسند المتصل',
    creator: 'نظام المقرأة الرقمي 2026'
  });

  const canvasWidthPx = canvas.width;
  const canvasHeightPx = canvas.height;
  const imgRatio = canvasWidthPx / canvasHeightPx;

  if (fitToOnePage) {
    // ملاءمة محكمة لصفحة A4 واحدة
    let renderWidth = pageWidth;
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > pageHeight) {
      renderHeight = pageHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const marginX = (pageWidth - renderWidth) / 2;
    const marginY = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, imageType, marginX, marginY, renderWidth, renderHeight, undefined, 'FAST');
  } else {
    // دعم التقسيم لعدة صفحات إذا كان المحتوى طويلاً
    let renderedHeight = 0;
    const totalHeightMm = (canvasHeightPx * pageWidth) / canvasWidthPx;

    while (renderedHeight < totalHeightMm) {
      if (renderedHeight > 0) {
        pdf.addPage();
      }
      const positionY = -renderedHeight;
      pdf.addImage(imgData, imageType, 0, positionY, pageWidth, totalHeightMm, undefined, 'FAST');
      renderedHeight += pageHeight;
    }
  }

  onProgress?.('جاري حفظ ملف PDF في جهازك...');
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(safeFileName);
}

/**
 * تصدير شهادة الطالب مباشرة بصيغة PDF وتنزيلها
 */
export async function exportCertificateDirectPdf(
  element: HTMLElement,
  options: {
    studentName: string;
    certificateNumber?: string;
    onProgress?: (status: string) => void;
  }
): Promise<void> {
  const safeStudent = options.studentName.trim().replace(/\s+/g, '_') || 'الطالب';
  const safeCertNum = options.certificateNumber ? `_${options.certificateNumber}` : '';
  const fileName = `شهادة_معتمدة_${safeStudent}${safeCertNum}_مقرأة_رحاب_القرآن.pdf`;

  await exportElementToDirectPdf(element, {
    fileName,
    orientation: 'portrait',
    format: 'a4',
    fitToOnePage: true,
    scale: 2.5,
    quality: 1.0,
    imageType: 'PNG',
    title: `شهادة إتقان قرآنية - ${options.studentName}`,
    onProgress: options.onProgress
  });
}

/**
 * تصدير محتوى Iframe مباشرة إلى ملف PDF وتنزيله
 */
export async function exportIframeToDirectPdf(
  iframe: HTMLIFrameElement,
  options: DirectPdfOptions = {}
): Promise<void> {
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !doc.body) {
    throw new Error('تعذر الوصول إلى محتوى مستند الـ Iframe');
  }

  // البحث عن الحاوية الرئيسية إن وجدت
  const targetElement = 
    (doc.querySelector('.report-sheet') as HTMLElement) ||
    (doc.querySelector('.document-wrapper') as HTMLElement) ||
    (doc.querySelector('#officialA4Certificate') as HTMLElement) ||
    (doc.querySelector('.certificate-print-root') as HTMLElement) ||
    doc.body;

  // إخفاء شريط الأدوات داخل الـ iframe مؤقتاً
  const toolbar = doc.querySelector('.no-print-toolbar') as HTMLElement;
  const originalToolbarDisplay = toolbar ? toolbar.style.display : '';
  if (toolbar) toolbar.style.display = 'none';

  try {
    await exportElementToDirectPdf(targetElement, {
      ...options,
      backgroundColor: options.backgroundColor || '#ffffff'
    });
  } finally {
    if (toolbar) toolbar.style.display = originalToolbarDisplay;
  }
}

/**
 * تصدير شيفرة HTML كاملة إلى ملف PDF وتنزيله مباشرة في جهاز المستخدم
 */
export async function exportHtmlStringToDirectPdf(
  htmlString: string,
  options: DirectPdfOptions = {}
): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = options.orientation === 'landscape' ? '1200px' : '900px';
  iframe.style.height = '1400px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-99999';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) throw new Error('تعذر إنشاء مستند Iframe مؤقت');

    doc.open();
    doc.write(htmlString);
    doc.close();

    // انتظار اكتمال تحميل الصور والخطوط
    await waitForImagesToLoad(doc, 7000);
    if (doc.fonts && doc.fonts.ready) {
      await doc.fonts.ready.catch(() => {});
    }

    // مهلة صغيرة لرسم المتصفح
    await new Promise((r) => setTimeout(r, 350));

    await exportIframeToDirectPdf(iframe, options);
  } finally {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }
}
