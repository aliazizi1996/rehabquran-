/**
 * أداة توليد وثيقة التقرير القرآني الأسبوعي المعتمد للطالب بصيغة PDF
 * مقرأة رحاب القرآن الإلكترونية - الهوية الرسمية المعتمدة 2026
 * 
 * تلتزم بدليل الهوية البصرية:
 * - الأخضر الزمردي: #046A38
 * - الذهبي الملكي: #C5A059
 * - العاجي الدافئ: #F9F6F0
 * - الرمادي الداكن: #2C3531
 * - الخطوط الرسمية: Amiri للعناوين و Noto Kufi Arabic للمتون
 * - الشعار الرسمي: /brand/official-logo.png
 * - الختم الرسمي: /brand/official-seal.png
 * - توقيع الإدارة: د. علي عزيزي (يميناً)
 * - توقيع المعلم: يساراً
 */

export interface StudentWeeklyReportData {
  studentId: string;
  studentName: string;
  academicId?: string;
  halqaTitle: string;
  teacherName: string;
  riwayah: string;
  weekLabel: string;
  dateRange: string;
  // إحصائيات الحضور
  attendance: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: string; // e.g. "100%"
  };
  // سجل التسميعات
  recitations: Array<{
    surah: string;
    ayahRange: string;
    score: number; // من 10
    status: string; // متقن / جيد / يحتاج تثبيت
    date: string;
    notes?: string;
  }>;
  // الواجبات
  assignments: Array<{
    title: string;
    status: 'completed' | 'pending' | 'needs_revision';
    grade?: number; // من 10
    dueDate?: string;
  }>;
  // التقييم العام وملاحظة المعلم
  overallScore: number; // متوسط الدرجات من 10
  memorizationProgress: string; // مقدار الحفظ
  teacherNotes: string;
  supervisorNotes?: string;
}

import { getBrandLogoSettings } from './brandLogoStore';
import { toAbsoluteUrl, waitForImagesToLoad, preloadImages } from './imagePreloader';
import { exportHtmlStringToDirectPdf } from './directPdfExporter';

export function generateStudentWeeklyReportPdfHtml(
  data: StudentWeeklyReportData,
  issuedAssets?: { logoUrl?: string; sealUrl?: string }
): string {
  const brandSettings = getBrandLogoSettings();
  const rawLogo = issuedAssets?.logoUrl || brandSettings.customLogoUrl || '/brand/official-logo.png';
  const rawSeal = issuedAssets?.sealUrl || brandSettings.customSealUrl || '/brand/official-seal.png';
  const logoUrl = toAbsoluteUrl(rawLogo);
  const sealUrl = toAbsoluteUrl(rawSeal);

  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const toArNum = (num: number | string) => String(num).replace(/[0-9]/g, w => arabicDigits[+w] || w);

  const formattedDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير قرآني أسبوعي - ${data.studentName}</title>
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
  
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
      --royal-gold: #C5A059;
      --gold-light: #fbf7ee;
      --warm-ivory: #F9F6F0;
      --dark-slate: #2C3531;
      --light-border: #e2ddd3;
    }

    body {
      font-family: 'Noto Kufi Arabic', sans-serif;
      background-color: #f4efe6;
      color: var(--dark-slate);
      line-height: 1.6;
      font-size: 12.5px;
      padding: 20px 10px;
      direction: rtl;
      text-align: right;
    }

    .report-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 16mm 18mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 3px double var(--royal-gold);
      position: relative;
      border-radius: 4px;
    }

    /* زخرفة الإطار الملكي */
    .inner-border {
      border: 1px solid rgba(197, 160, 89, 0.4);
      padding: 12mm 14mm;
      height: 100%;
      min-height: 260mm;
      position: relative;
      background: linear-gradient(180deg, rgba(249, 246, 240, 0.4) 0%, rgba(255, 255, 255, 0.95) 15%, #ffffff 85%, rgba(249, 246, 240, 0.4) 100%);
    }

    .header-bismillah {
      text-align: center;
      font-family: 'Amiri', serif;
      font-size: 16px;
      color: var(--primary-green);
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--royal-gold);
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .header-info-right {
      text-align: right;
    }

    .header-title-main {
      font-family: 'Amiri', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--primary-green);
    }

    .header-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .header-logo {
      height: 60px;
      width: auto;
      object-fit: contain;
    }

    .report-banner {
      background: linear-gradient(90deg, #046A38, #05532c);
      color: #ffffff;
      text-align: center;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--royal-gold);
      margin-bottom: 16px;
    }

    .report-banner h1 {
      font-family: 'Amiri', serif;
      font-size: 18px;
      color: #ffffff;
      margin-bottom: 2px;
    }

    .report-banner p {
      font-size: 11px;
      color: #f1ede4;
    }

    /* بطاقة بيانات الطالب */
    .student-card {
      background-color: var(--warm-ivory);
      border: 1px solid var(--royal-gold);
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      font-size: 11.5px;
    }

    .meta-item strong {
      color: var(--primary-green);
      display: inline-block;
      margin-left: 4px;
    }

    /* الإحصاءات الأسبوعية السريعة */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-box {
      border: 1px solid var(--light-border);
      background: #ffffff;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      border-top: 3px solid var(--primary-green);
    }

    .stat-box.highlight {
      border-top-color: var(--royal-gold);
      background-color: #fffdf9;
    }

    .stat-label {
      font-size: 10px;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
    }

    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary-green);
      font-family: 'Amiri', serif;
    }

    .section-title {
      font-family: 'Amiri', serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-green);
      border-bottom: 1.5px solid var(--royal-gold);
      padding-bottom: 4px;
      margin-top: 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* الجداول */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
    }

    th {
      background-color: #f1ede4;
      color: var(--primary-green);
      border: 1px solid #dfd8cb;
      padding: 6px 8px;
      text-align: right;
      font-weight: 700;
    }

    td {
      border: 1px solid #e7e2d7;
      padding: 6px 8px;
      text-align: right;
    }

    tr:nth-child(even) {
      background-color: #faf8f5;
    }

    .badge-mastered {
      background-color: #e6f4ea;
      color: #046A38;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      font-size: 10px;
    }

    .score-pill {
      font-weight: 800;
      color: var(--primary-green);
      font-size: 12px;
    }

    /* ملاحظة المعلم */
    .teacher-note-box {
      background-color: #faf8f5;
      border: 1px solid rgba(197, 160, 89, 0.5);
      border-right: 4px solid var(--royal-gold);
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 11.5px;
      color: var(--dark-slate);
    }

    /* منطقة التوقيع والختم الرسمي */
    .signatures-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed var(--royal-gold);
    }

    .sig-col {
      text-align: center;
      width: 30%;
    }

    .sig-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary-green);
      margin-bottom: 4px;
    }

    .sig-name {
      font-family: 'Amiri', serif;
      font-size: 13px;
      font-weight: 700;
      color: var(--dark-slate);
      margin-bottom: 6px;
    }

    .sig-line {
      width: 120px;
      height: 1px;
      background-color: #cbd5e1;
      margin: 8px auto 2px;
    }

    .seal-container {
      text-align: center;
      width: 30%;
    }

    .official-seal-img {
      width: 72px;
      height: 72px;
      object-fit: contain;
      display: inline-block;
      filter: drop-shadow(0 2px 4px rgba(4, 106, 56, 0.15));
    }

    .report-footer-meta {
      text-align: center;
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 16px;
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
    }

    /* Responsive Styles for Phone & Small Screens */
    @media screen and (max-width: 640px) {
      body {
        padding: 8px 4px !important;
      }
      .report-sheet {
        width: 100% !important;
        max-width: 100% !important;
        padding: 8px 6px !important;
        min-height: auto !important;
        box-shadow: none !important;
        border-width: 1.5px !important;
      }
      .inner-border {
        padding: 8px 6px !important;
        min-height: auto !important;
      }
      .header-top {
        flex-direction: column !important;
        gap: 10px !important;
        text-align: center !important;
      }
      .student-card {
        grid-template-columns: 1fr !important;
        gap: 6px !important;
      }
      .stats-row {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
      }
      .signatures-section {
        flex-direction: column !important;
        gap: 14px !important;
      }
      .sig-col {
        width: 100% !important;
      }
    }

    .no-print-toolbar {
      width: 210mm;
      max-width: 100%;
      margin: 0 auto 12px;
      background: #111f18;
      border: 1.5px solid #C5A059;
      border-radius: 14px;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }
    .toolbar-btn {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0b1510;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .toolbar-btn:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .toolbar-hint {
      font-size: 11px;
      color: #92400e;
      background: #fef3c7;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid #fde68a;
      font-weight: bold;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    @media print {
      .no-print-toolbar {
        display: none !important;
      }
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .report-sheet {
        box-shadow: none;
        border: none;
        padding: 10mm 12mm;
        width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>

  <!-- شريط أدوات الطباعة وحفظ PDF -->
  <div class="no-print-toolbar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="font-weight: 700; color: #fce8bd; font-size: 13px;">وثيقة التقرير القرآني الأسبوعي المعتمد</span>
      <span class="toolbar-hint">💡 يرجى اختيار (حفظ كـ PDF / Save as PDF) من نافذة الطباعة</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="toolbar-btn" onclick="window.printDocument ? window.printDocument() : window.print()">
        🖨️ طباعة فورية / حفظ PDF
      </button>
    </div>
  </div>

  <div class="report-sheet">
    <div class="inner-border">
      
      <!-- البسملة -->
      <div class="header-bismillah">بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ</div>

      <!-- ترويسة التقرير -->
      <div class="header-top">
        <div class="header-info-right">
          <div class="header-title-main">مقرأة رحاب القرآن الإلكترونية</div>
          <div class="header-sub">نظام المتابعة القرآني الأكاديمي الموحد • الإصدار المعتمد 2026</div>
        </div>
        <div>
          <img 
            src="${logoUrl}" 
            alt="شعار مقرأة رحاب القرآن" 
            class="header-logo" 
            crossorigin="anonymous" 
            loading="eager"
            onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-logo.png')}';}else{this.style.display='none';}" 
          />
        </div>
      </div>
      </div>

      <!-- لافتة التقرير -->
      <div class="report-banner">
        <h1>التقرير القرآني الأسبوعي المعتمد</h1>
        <p>${data.weekLabel} • ${data.dateRange}</p>
      </div>

      <!-- بطاقة بيانات الطالب -->
      <div class="student-card">
        <div class="meta-item">
          <strong>اسم الطالب:</strong> ${data.studentName}
        </div>
        <div class="meta-item">
          <strong>الرقم الأكاديمي:</strong> <span style="font-family: monospace;">${data.academicId || data.studentId}</span>
        </div>
        <div class="meta-item">
          <strong>الحلقة:</strong> ${data.halqaTitle}
        </div>
        <div class="meta-item">
          <strong>فضيلة المعلم:</strong> ${data.teacherName}
        </div>
        <div class="meta-item">
          <strong>الرواية المقروءة:</strong> ${data.riwayah}
        </div>
        <div class="meta-item">
          <strong>مقدار الحفظ:</strong> ${data.memorizationProgress}
        </div>
      </div>

      <!-- صناديق الإحصاء السريع -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-label">نسبة الحضور</span>
          <span class="stat-val">${data.attendance.attendanceRate}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">جلسات الحضور</span>
          <span class="stat-val">${toArNum(data.attendance.presentCount)} من ${toArNum(data.attendance.totalSessions)}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">التسميعات المنجزة</span>
          <span class="stat-val">${toArNum(data.recitations.length)} تلاوات</span>
        </div>
        <div class="stat-box highlight">
          <span class="stat-label">التقييم العام (من 10)</span>
          <span class="stat-val" style="color: #C5A059;">${toArNum(data.overallScore)} / ١٠</span>
        </div>
      </div>

      <!-- جدول التسميعات الأسبوعية -->
      <div class="section-title">
        <span>سجل التسميعات والتلاوات الأسبوعية</span>
        <span style="font-size: 10px; color: #64748b; font-family: sans-serif;">تقييم من 10</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">السورة</th>
            <th style="width: 20%;">نطاق الآيات</th>
            <th style="width: 15%;">الدرجة (من 10)</th>
            <th style="width: 15%;">مستوى الإتقان</th>
            <th style="width: 30%;">ملاحظات التجويد والأداء</th>
          </tr>
        </thead>
        <tbody>
          ${data.recitations.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align: center; color: #94a3b8; padding: 12px;">لم يتم رصد تسميعات لهذا الطالب خلال هذا الأسبوع بعد.</td>
            </tr>
          ` : data.recitations.map(r => `
            <tr>
              <td><strong>${r.surah}</strong></td>
              <td>${r.ayahRange}</td>
              <td><span class="score-pill">${toArNum(r.score)} / ١٠</span></td>
              <td><span class="badge-mastered">${r.status}</span></td>
              <td style="color: #475569;">${r.notes || 'تلاوة متقنة وموفقة بارك الله فيك.'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- جدول الواجبات والتكليفات -->
      ${data.assignments && data.assignments.length > 0 ? `
      <div class="section-title">
        <span>متابعة الواجبات والتكليفات المنزلية</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 45%;">عنوان الواجب / التكليف</th>
            <th style="width: 25%;">حالة التسليم</th>
            <th style="width: 30%;">الدرجة / التقييم</th>
          </tr>
        </thead>
        <tbody>
          ${data.assignments.map(a => `
            <tr>
              <td>${a.title}</td>
              <td>${a.status === 'completed' ? 'تم التسليم والاعتماد ✓' : 'قيد المتابعة'}</td>
              <td>${a.grade ? `<span class="score-pill">${toArNum(a.grade)} / ١٠</span>` : 'معتمد'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <!-- توجيه وملاحظات المعلم -->
      <div class="section-title">
        <span>توجيه وملاحظات فضيلة المعلم</span>
      </div>
      <div class="teacher-note-box">
        ${data.teacherNotes || 'ما شاء الله تبارك الله، أداء متميز وحرص دؤوب على الحفظ والإتقان. نوصي الطالب بالاستمرار على هذا الورد اليومي ومراجعة ما سبق ضبطه.'}
      </div>

      <!-- التوقيعات والختم المعتمد -->
      <div class="signatures-section">
        <!-- يمين: توقيع الإدارة (د. علي عزيزي) -->
        <div class="sig-col">
          <div class="sig-title">المشرف العام على المقرأة</div>
          <div class="sig-name">د. علي عزيزي</div>
          <div style="font-size: 10px; color: #046A38; font-weight: bold;">معتمد وموثق</div>
          <div class="sig-line"></div>
        </div>

        <!-- وسط: الختم الرسمي الإلكتروني -->
        <div class="seal-container">
          <img 
            src="${sealUrl}" 
            alt="الختم الرسمي للمقرأة" 
            class="official-seal-img" 
            crossorigin="anonymous" 
            loading="eager"
            onerror="if(!this.dataset.errored){this.dataset.errored='1';this.src='${toAbsoluteUrl('/brand/official-seal.png')}';}else{this.style.display='none';}" 
          />
          <div style="font-size: 9px; color: #C5A059; font-weight: bold; margin-top: 2px;">ختم الاعتماد الإلكتروني 2026</div>
        </div>

        <!-- يسار: توقيع المعلم -->
        <div class="sig-col">
          <div class="sig-title">فضيلة مقرئ الحلقة</div>
          <div class="sig-name">${data.teacherName}</div>
          <div style="font-size: 10px; color: #64748b;">توقيع المعلم المعتمد</div>
          <div class="sig-line"></div>
        </div>
      </div>

      <!-- تذييل الوثيقة -->
      <div class="report-footer-meta">
        صُدر هذا التقرير إلكترونياً بتاريخ: ${formattedDate} • رقم التقرير: REP-${data.studentId.slice(0, 6).toUpperCase()} • مقرأة رحاب القرآن الإلكترونية
      </div>

    </div>
  </div>

  <script>
    window.waitForAllImages = function() {
      var imgs = Array.from(document.querySelectorAll('img'));
      return Promise.all(imgs.map(function(img) {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(function(resolve) {
          var done = false;
          var timer = setTimeout(function() { if (!done) { done = true; resolve(); } }, 4000);
          img.addEventListener('load', function() { if (!done) { done = true; clearTimeout(timer); resolve(); } }, { once: true });
          img.addEventListener('error', function() { if (!done) { done = true; clearTimeout(timer); resolve(); } }, { once: true });
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode().then(function() { if (!done) { done = true; clearTimeout(timer); resolve(); } }).catch(function() {});
          }
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
 * طباعة تقرير الطالب الأسبوعي بجودة A4 عبر Iframe غير مرئي مع انتظار تحميل الصور بالكامل عبر Promise.all
 */
export async function printStudentWeeklyReport(
  data: StudentWeeklyReportData,
  issuedAssets?: { logoUrl?: string; sealUrl?: string }
): Promise<void> {
  const html = generateStudentWeeklyReportPdfHtml(data, issuedAssets);
  
  // إنشاء iframe غير مرئي للطباعة
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
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  try {
    // انتظار اكتمال تحميل وفك ترميز الصور بالكامل داخل الـ iframe
    await waitForImagesToLoad(doc);
    await new Promise(r => setTimeout(r, 250));
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (e) {
    console.warn('Iframe print error:', e);
    window.print();
  } finally {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 10000);
  }
}

/**
 * تنزيل تقرير الطالب الأسبوعي كملف PDF حقيقي ومباشر عبر jsPDF و html2canvas دون الحاجة لنافذة الطباعة
 */
export async function downloadStudentWeeklyReportDirectPdf(
  data: StudentWeeklyReportData,
  issuedAssets?: { logoUrl?: string; sealUrl?: string },
  onProgress?: (msg: string) => void
): Promise<void> {
  const html = generateStudentWeeklyReportPdfHtml(data, issuedAssets);
  const safeName = data.studentName.trim().replace(/\s+/g, '_');
  const safeWeek = data.weekLabel.trim().replace(/\s+/g, '_');
  const fileName = `تقرير_أسبوعي_${safeName}_${safeWeek}.pdf`;

  await exportHtmlStringToDirectPdf(html, {
    fileName,
    orientation: 'portrait',
    fitToOnePage: true,
    scale: 2,
    quality: 0.95,
    title: `تقرير أسبوعي - ${data.studentName}`,
    onProgress,
  });
}
