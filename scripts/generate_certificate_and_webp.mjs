import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const certificateSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2480 1754" width="2480" height="1754">
  <defs>
    <!-- Gold Gradients -->
    <linearGradient id="cert-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faecc8" />
      <stop offset="25%" stop-color="#dfbe75" />
      <stop offset="50%" stop-color="#c5a059" />
      <stop offset="75%" stop-color="#e8cf92" />
      <stop offset="100%" stop-color="#9a762e" />
    </linearGradient>
    <linearGradient id="cert-gold-light" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c5a059" />
      <stop offset="50%" stop-color="#faecc8" />
      <stop offset="100%" stop-color="#c5a059" />
    </linearGradient>

    <!-- Emerald Gradients -->
    <linearGradient id="cert-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b5e34" />
      <stop offset="50%" stop-color="#046a38" />
      <stop offset="100%" stop-color="#023319" />
    </linearGradient>

    <!-- Shadows -->
    <filter id="cert-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#011b0d" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Background Warm Ivory -->
  <rect width="2480" height="1754" fill="#F9F6F0" />

  <!-- Outer Heavy Gold Border -->
  <rect x="50" y="50" width="2380" height="1654" rx="36" fill="none" stroke="url(#cert-gold)" stroke-width="12" />

  <!-- Second Inset Emerald Border -->
  <rect x="80" y="80" width="2320" height="1594" rx="28" fill="none" stroke="url(#cert-emerald)" stroke-width="6" />

  <!-- Third Fine Gold Filigree Inset -->
  <rect x="96" y="96" width="2288" height="1562" rx="22" fill="none" stroke="url(#cert-gold)" stroke-width="2.5" stroke-dasharray="8 6" />

  <!-- Corner Arabesque Ornaments (4 Corners) -->
  <!-- Top Right -->
  <g transform="translate(2300, 180)">
    <path d="M 0 0 C -40 0 -80 -40 -80 -80 L -80 -10 C -80 0 0 0 0 0 Z" fill="url(#cert-gold)" opacity="0.8" />
    <circle cx="-40" cy="-40" r="14" fill="#046a38" stroke="url(#cert-gold)" stroke-width="3" />
    <path d="M -80 -80 Q -10 -80 -10 -10 Q -80 -10 -80 -80 Z" fill="none" stroke="url(#cert-gold)" stroke-width="3" />
  </g>
  <!-- Top Left -->
  <g transform="translate(180, 180) scale(-1, 1)">
    <path d="M 0 0 C -40 0 -80 -40 -80 -80 L -80 -10 C -80 0 0 0 0 0 Z" fill="url(#cert-gold)" opacity="0.8" />
    <circle cx="-40" cy="-40" r="14" fill="#046a38" stroke="url(#cert-gold)" stroke-width="3" />
    <path d="M -80 -80 Q -10 -80 -10 -10 Q -80 -10 -80 -80 Z" fill="none" stroke="url(#cert-gold)" stroke-width="3" />
  </g>
  <!-- Bottom Right -->
  <g transform="translate(2300, 1574) scale(1, -1)">
    <path d="M 0 0 C -40 0 -80 -40 -80 -80 L -80 -10 C -80 0 0 0 0 0 Z" fill="url(#cert-gold)" opacity="0.8" />
    <circle cx="-40" cy="-40" r="14" fill="#046a38" stroke="url(#cert-gold)" stroke-width="3" />
    <path d="M -80 -80 Q -10 -80 -10 -10 Q -80 -10 -80 -80 Z" fill="none" stroke="url(#cert-gold)" stroke-width="3" />
  </g>
  <!-- Bottom Left -->
  <g transform="translate(180, 1574) scale(-1, -1)">
    <path d="M 0 0 C -40 0 -80 -40 -80 -80 L -80 -10 C -80 0 0 0 0 0 Z" fill="url(#cert-gold)" opacity="0.8" />
    <circle cx="-40" cy="-40" r="14" fill="#046a38" stroke="url(#cert-gold)" stroke-width="3" />
    <path d="M -80 -80 Q -10 -80 -10 -10 Q -80 -10 -80 -80 Z" fill="none" stroke="url(#cert-gold)" stroke-width="3" />
  </g>

  <!-- Top Header Islamic Arch Dome Archway -->
  <g transform="translate(1240, 160)" text-anchor="middle">
    <!-- Pointed Arch Header Shape -->
    <path d="M -320 120 C -320 0 -150 -60 0 -90 C 150 -60 320 0 320 120 Z" fill="url(#cert-emerald)" stroke="url(#cert-gold)" stroke-width="4" filter="url(#cert-shadow)" />
    <!-- Golden Arabesque Crest -->
    <circle cx="0" cy="-90" r="10" fill="url(#cert-gold)" />
    <!-- Crown Finial -->
    <path d="M 0 -90 L 0 -120 L 5 -105 L 12 -110 L 4 -98 Z" fill="url(#cert-gold)" />
    
    <!-- Title Text in Arch -->
    <text x="0" y="45" font-family="'Amiri', 'Traditional Arabic', serif" font-weight="bold" font-size="36" fill="#f7e8c6">
      مقرأة رحاب القرآن الإلكترونية
    </text>
    <text x="0" y="90" font-family="'Noto Kufi Arabic', sans-serif" font-weight="600" font-size="20" fill="url(#cert-gold-light)">
      ـ لتعليم القرآن الكريم والقراءات العشر بالسند المتصل ـ
    </text>
  </g>

  <!-- Badge Cartouche "شهادة إنجاز" -->
  <g transform="translate(1240, 360)" text-anchor="middle">
    <!-- Ribbon Box -->
    <rect x="-240" y="-45" width="480" height="90" rx="45" fill="url(#cert-emerald)" stroke="url(#cert-gold)" stroke-width="4.5" filter="url(#cert-shadow)" />
    <rect x="-225" y="-36" width="450" height="72" rx="36" fill="none" stroke="url(#cert-gold)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7" />
    <text x="0" y="16" font-family="'Amiri', serif" font-weight="bold" font-size="52" fill="url(#cert-gold)" letter-spacing="2">
      شَهَادَةُ إِتْقَانٍ وَإِنْجَاز
    </text>
  </g>

  <!-- Central Watermark Emblem (Opacity 6%) -->
  <g transform="translate(1240, 860)" opacity="0.06">
    <circle cx="0" cy="0" r="320" fill="none" stroke="#046a38" stroke-width="8" />
    <circle cx="0" cy="0" r="300" fill="none" stroke="#c5a059" stroke-width="4" stroke-dasharray="12 8" />
    <!-- Large Quran Book Outline in Watermark -->
    <path d="M -160 -80 C -80 -110 0 -70 0 160 C 0 -70 80 -110 160 -80 L 160 140 C 80 110 0 150 0 160 C 0 150 -80 110 -160 140 Z" fill="#046a38" />
  </g>

  <!-- Bottom Dividers & Seal Target Zone -->
  <g transform="translate(1240, 1420)">
    <!-- Central Official Stamp Guide Circle -->
    <circle cx="0" cy="0" r="105" fill="none" stroke="url(#cert-gold)" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.6" />
    <circle cx="0" cy="0" r="95" fill="none" stroke="#046a38" stroke-width="1" opacity="0.4" />
    <text x="0" y="6" text-anchor="middle" font-family="'Noto Kufi Arabic', sans-serif" font-size="16" font-weight="bold" fill="#046a38" opacity="0.5">
      الختم الرسمي المعتمد
    </text>

    <!-- Right Side: Administration Signature -->
    <g transform="translate(560, 0)" text-anchor="middle">
      <line x1="-180" y1="20" x2="180" y2="20" stroke="url(#cert-gold)" stroke-width="2" />
      <text x="0" y="-15" font-family="'Noto Kufi Arabic', sans-serif" font-size="20" font-weight="bold" fill="#046a38">
        إدارة المقرأة العامة
      </text>
      <text x="0" y="55" font-family="'Amiri', serif" font-size="28" font-weight="bold" fill="#2C3531">
        د. علي عزيزي
      </text>
      <text x="0" y="85" font-family="'Noto Kufi Arabic', sans-serif" font-size="15" fill="#987834">
        المشرف العام على المقرأة
      </text>
    </g>

    <!-- Left Side: Teacher Signature -->
    <g transform="translate(-560, 0)" text-anchor="middle">
      <line x1="-180" y1="20" x2="180" y2="20" stroke="url(#cert-gold)" stroke-width="2" />
      <text x="0" y="-15" font-family="'Noto Kufi Arabic', sans-serif" font-size="20" font-weight="bold" fill="#046a38">
        معلم / معلمة الحلقة
      </text>
      <text x="0" y="55" font-family="'Amiri', serif" font-size="28" font-weight="bold" fill="#2C3531">
        المعلم المجيز
      </text>
      <text x="0" y="85" font-family="'Noto Kufi Arabic', sans-serif" font-size="15" fill="#987834">
        إجازة بالسند المتصل
      </text>
    </g>
  </g>

  <!-- Bottom Accreditation Ribbon Footer -->
  <g transform="translate(1240, 1610)" text-anchor="middle">
    <line x1="-400" y1="0" x2="400" y2="0" stroke="url(#cert-gold)" stroke-width="1.5" />
    <text x="0" y="22" font-family="'Noto Kufi Arabic', sans-serif" font-size="15" font-weight="600" fill="#046a38">
      وثيقة رسمية معتمدة صادرة عن مقرأة رحاب القرآن الإلكترونية العالمية — 1447 هـ / 2026 م
    </text>
  </g>
</svg>`;

async function run() {
  const publicDir = path.resolve('public');
  const brandDir = path.resolve('public/brand');
  const assetsDir = path.resolve('public/assets');

  for (const d of [publicDir, brandDir, assetsDir]) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  console.log('Rendering official certificate template PNG and WebP...');

  // 1. Generate High-Res PNG (2480x1754)
  const certPngBuffer = await sharp(Buffer.from(certificateSvg))
    .png({ quality: 95 })
    .toBuffer();

  // Save to brand/, public/, assets/
  fs.writeFileSync(path.join(brandDir, 'official-certificate-template.png'), certPngBuffer);
  fs.writeFileSync(path.join(publicDir, 'official-certificate-template.png'), certPngBuffer);
  fs.writeFileSync(path.join(assetsDir, 'official-certificate-template.png'), certPngBuffer);

  // 2. Generate Compressed WebP
  const certWebpBuffer = await sharp(Buffer.from(certificateSvg))
    .webp({ quality: 90 })
    .toBuffer();

  fs.writeFileSync(path.join(brandDir, 'official-certificate-template.webp'), certWebpBuffer);
  fs.writeFileSync(path.join(publicDir, 'official-certificate-template.webp'), certWebpBuffer);

  // 3. Render official-seal-display.webp from official-seal.png
  const sealPngPath = path.join(brandDir, 'official-seal.png');
  if (fs.existsSync(sealPngPath)) {
    const sealWebp = await sharp(sealPngPath)
      .resize(800, 800)
      .webp({ quality: 95 })
      .toBuffer();

    fs.writeFileSync(path.join(brandDir, 'official-seal-display.webp'), sealWebp);
    fs.writeFileSync(path.join(publicDir, 'official-seal-display.webp'), sealWebp);
    console.log('✅ official-seal-display.webp generated successfully');
  }

  console.log('✅ All certificate and branding assets generated successfully!');
}

run().catch((err) => {
  console.error('Generation error:', err);
  process.exit(1);
});
