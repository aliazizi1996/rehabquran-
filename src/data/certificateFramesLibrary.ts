/**
 * مكتبة الإطارات والخلفيات المعتمدة للشهادات القرآنية والعلمية
 * Certificate Frames, Borders & Backgrounds Library (Brand Guide 2026)
 * مقرأة رحاب القرآن الإلكترونية
 *
 * الألوان الرسمية:
 * - الأخضر الزمردي: #046A38
 * - الذهبي الملكي: #C5A059
 * - العاجي الدافئ: #F9F6F0
 * - الرمادي الداكن: #2C3531
 */

export interface CertificateFrameItem {
  id: string;
  title: string;
  category: 'royal' | 'ijaza' | 'matn' | 'appreciation' | 'classic' | 'uploaded';
  type: 'frame' | 'background';
  description: string;
  dataUri: string; // SVG data URL or image URL
  thumbnailUri?: string;
  aspectRatio: '1123:794';
  defaultOpacity: number;
}

// ----------------------------------------------------------------------
// 1. إطار الزخرفة الملكية الزمردية والذهبية (Royal Emerald & Gold)
// ----------------------------------------------------------------------
export const SVG_FRAME_ROYAL_EMERALD_GOLD = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E5C778"/>
      <stop offset="50%" stop-color="#C5A059"/>
      <stop offset="100%" stop-color="#9C7730"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#068A4A"/>
      <stop offset="100%" stop-color="#046A38"/>
    </linearGradient>
    <!-- 8-pointed star pattern -->
    <g id="star8">
      <path d="M0 -18 L5 -5 L18 0 L5 5 L0 18 L-5 5 L-18 0 L-5 -5 Z" fill="url(#goldGrad)" stroke="#046A38" stroke-width="1"/>
      <circle cx="0" cy="0" r="4" fill="#046A38"/>
    </g>
    <!-- Arabesque Corner Motif -->
    <g id="cornerMotif">
      <path d="M0,0 L70,0 C60,15 45,25 35,35 C25,45 15,60 0,70 Z" fill="#F9F6F0" stroke="url(#goldGrad)" stroke-width="2"/>
      <path d="M12,12 L55,12 C48,22 38,30 30,38 C22,46 14,54 12,65 Z" fill="none" stroke="#046A38" stroke-width="1.5"/>
      <circle cx="28" cy="28" r="5" fill="url(#goldGrad)" stroke="#046A38" stroke-width="1"/>
      <path d="M28,14 C35,20 35,36 28,42" fill="none" stroke="url(#goldGrad)" stroke-width="1.5"/>
      <path d="M14,28 C20,35 36,35 42,28" fill="none" stroke="url(#goldGrad)" stroke-width="1.5"/>
    </g>
  </defs>

  <!-- Outer Thick Emerald Border -->
  <rect x="22" y="22" width="1079" height="750" fill="none" stroke="url(#emeraldGrad)" stroke-width="4" rx="6"/>

  <!-- Inner Gold Inlay Border -->
  <rect x="30" y="30" width="1063" height="734" fill="none" stroke="url(#goldGrad)" stroke-width="2" rx="4"/>

  <!-- Thin Dashed Emerald Line -->
  <rect x="36" y="36" width="1051" height="722" fill="none" stroke="#046A38" stroke-width="1" stroke-dasharray="8,4" opacity="0.8"/>

  <!-- Fine Inner Gold Hairline -->
  <rect x="46" y="46" width="1031" height="702" fill="none" stroke="url(#goldGrad)" stroke-width="1" opacity="0.6"/>

  <!-- Four Corners Ornate Motifs -->
  <!-- Top-Left -->
  <g transform="translate(30, 30)">
    <use href="#cornerMotif" />
    <use href="#star8" transform="translate(42, 42) scale(0.9)"/>
  </g>
  <!-- Top-Right -->
  <g transform="translate(1093, 30) scale(-1, 1)">
    <use href="#cornerMotif" />
    <use href="#star8" transform="translate(42, 42) scale(0.9)"/>
  </g>
  <!-- Bottom-Left -->
  <g transform="translate(30, 764) scale(1, -1)">
    <use href="#cornerMotif" />
    <use href="#star8" transform="translate(42, 42) scale(0.9)"/>
  </g>
  <!-- Bottom-Right -->
  <g transform="translate(1093, 764) scale(-1, -1)">
    <use href="#cornerMotif" />
    <use href="#star8" transform="translate(42, 42) scale(0.9)"/>
  </g>

  <!-- Center Top Ornamental Crest -->
  <g transform="translate(561, 26)">
    <path d="M-60,0 Q-30,14 0,16 Q30,14 60,0 Q30,-2 0,-3 Q-30,-2 -60,0 Z" fill="url(#goldGrad)" stroke="#046A38" stroke-width="1"/>
    <use href="#star8" transform="translate(0, 8) scale(0.7)"/>
  </g>

  <!-- Center Bottom Ornamental Crest -->
  <g transform="translate(561, 768)">
    <path d="M-60,0 Q-30,-14 0,-16 Q30,-14 60,0 Q30,2 0,3 Q-30,2 -60,0 Z" fill="url(#goldGrad)" stroke="#046A38" stroke-width="1"/>
    <use href="#star8" transform="translate(0, -8) scale(0.7)"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 2. إطار المحراب والأقواس التراثية للإجازات والسند (Mihrab Arch Ijaza Frame)
// ----------------------------------------------------------------------
export const SVG_FRAME_ISLAMIC_MIHRAB = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <linearGradient id="mihrabGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8CE85"/>
      <stop offset="50%" stop-color="#C5A059"/>
      <stop offset="100%" stop-color="#8F6923"/>
    </linearGradient>
    <linearGradient id="mihrabEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#046A38"/>
      <stop offset="100%" stop-color="#034B28"/>
    </linearGradient>
  </defs>

  <!-- External Frame -->
  <rect x="20" y="20" width="1083" height="754" fill="none" stroke="url(#mihrabGold)" stroke-width="4.5" rx="10"/>
  <rect x="28" y="28" width="1067" height="738" fill="none" stroke="url(#mihrabEmerald)" stroke-width="2" rx="8"/>

  <!-- Top Decorative Islamic Arch / Mihrab Curve -->
  <path d="M120,40 Q340,40 450,48 Q520,54 561.5,85 Q603,54 673,48 Q783,40 1003,40" fill="none" stroke="url(#mihrabGold)" stroke-width="2.5"/>
  <path d="M130,46 Q340,46 448,54 Q518,60 561.5,93 Q605,60 675,54 Q783,46 993,46" fill="none" stroke="#046A38" stroke-width="1.2" stroke-dasharray="6,3"/>

  <!-- Arch Center Finial Star -->
  <g transform="translate(561.5, 42)">
    <circle cx="0" cy="0" r="14" fill="#F9F6F0" stroke="url(#mihrabGold)" stroke-width="2"/>
    <path d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z" fill="#046A38"/>
    <circle cx="0" cy="0" r="2.5" fill="url(#mihrabGold)"/>
  </g>

  <!-- Left & Right Islamic Side Columns Pillars -->
  <g transform="translate(48, 55)">
    <line x1="0" y1="0" x2="0" y2="684" stroke="url(#mihrabGold)" stroke-width="3"/>
    <line x1="6" y1="20" x2="6" y2="664" stroke="#046A38" stroke-width="1"/>
    <!-- Capital -->
    <path d="M-6,0 L6,0 L4,16 L-4,16 Z" fill="url(#mihrabGold)"/>
    <!-- Base -->
    <path d="M-6,684 L6,684 L4,668 L-4,668 Z" fill="url(#mihrabGold)"/>
  </g>
  <g transform="translate(1075, 55)">
    <line x1="0" y1="0" x2="0" y2="684" stroke="url(#mihrabGold)" stroke-width="3"/>
    <line x1="-6" y1="20" x2="-6" y2="664" stroke="#046A38" stroke-width="1"/>
    <!-- Capital -->
    <path d="M-6,0 L6,0 L4,16 L-4,16 Z" fill="url(#mihrabGold)"/>
    <!-- Base -->
    <path d="M-6,684 L6,684 L4,668 L-4,668 Z" fill="url(#mihrabGold)"/>
  </g>

  <!-- Bottom Arch Complement -->
  <path d="M120,754 Q340,754 470,748 Q530,744 561.5,720 Q593,744 653,748 Q783,754 1003,754" fill="none" stroke="url(#mihrabGold)" stroke-width="2"/>

  <!-- Ornate Corner Stars -->
  <g transform="translate(68, 68)">
    <circle cx="0" cy="0" r="8" fill="none" stroke="url(#mihrabGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#046A38"/>
  </g>
  <g transform="translate(1055, 68)">
    <circle cx="0" cy="0" r="8" fill="none" stroke="url(#mihrabGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#046A38"/>
  </g>
  <g transform="translate(68, 726)">
    <circle cx="0" cy="0" r="8" fill="none" stroke="url(#mihrabGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#046A38"/>
  </g>
  <g transform="translate(1055, 726)">
    <circle cx="0" cy="0" r="8" fill="none" stroke="url(#mihrabGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="3" fill="#046A38"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 3. إطار المتون العلمية والتجويدية الهندسي (Geometric Scientific Frame)
// ----------------------------------------------------------------------
export const SVG_FRAME_SCIENTIFIC_MATN = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <linearGradient id="matnGold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#C5A059"/>
      <stop offset="50%" stop-color="#E6C87C"/>
      <stop offset="100%" stop-color="#C5A059"/>
    </linearGradient>
    <pattern id="geomTile" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M0,10 L10,0 L20,10 L10,20 Z" fill="none" stroke="#C5A059" stroke-width="0.8" opacity="0.6"/>
      <circle cx="10" cy="10" r="1.5" fill="#046A38"/>
    </pattern>
  </defs>

  <!-- Outer Boundary -->
  <rect x="24" y="24" width="1075" height="746" fill="none" stroke="#046A38" stroke-width="5" rx="4"/>
  <rect x="33" y="33" width="1057" height="728" fill="none" stroke="url(#matnGold)" stroke-width="2"/>

  <!-- Top Geometric Ribbon Band -->
  <rect x="35" y="35" width="1053" height="14" fill="url(#geomTile)"/>
  <line x1="35" y1="49" x2="1088" y2="49" stroke="#046A38" stroke-width="1.5"/>

  <!-- Bottom Geometric Ribbon Band -->
  <rect x="35" y="745" width="1053" height="14" fill="url(#geomTile)"/>
  <line x1="35" y1="745" x2="1088" y2="745" stroke="#046A38" stroke-width="1.5"/>

  <!-- Left & Right Ribbons -->
  <rect x="35" y="49" width="14" height="696" fill="url(#geomTile)"/>
  <line x1="49" y1="49" x2="49" y2="745" stroke="#046A38" stroke-width="1.5"/>

  <rect x="1074" y="49" width="14" height="696" fill="url(#geomTile)"/>
  <line x1="1074" y1="49" x2="1074" y2="745" stroke="#046A38" stroke-width="1.5"/>

  <!-- Inner Content Border -->
  <rect x="60" y="60" width="1003" height="674" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-dasharray="12,6"/>

  <!-- Andalusian Corner Squares -->
  <g transform="translate(35, 35)">
    <rect x="0" y="0" width="30" height="30" fill="#046A38" stroke="url(#matnGold)" stroke-width="2"/>
    <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="#C5A059"/>
    <circle cx="15" cy="15" r="4" fill="#F9F6F0"/>
  </g>
  <g transform="translate(1058, 35)">
    <rect x="0" y="0" width="30" height="30" fill="#046A38" stroke="url(#matnGold)" stroke-width="2"/>
    <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="#C5A059"/>
    <circle cx="15" cy="15" r="4" fill="#F9F6F0"/>
  </g>
  <g transform="translate(35, 729)">
    <rect x="0" y="0" width="30" height="30" fill="#046A38" stroke="url(#matnGold)" stroke-width="2"/>
    <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="#C5A059"/>
    <circle cx="15" cy="15" r="4" fill="#F9F6F0"/>
  </g>
  <g transform="translate(1058, 729)">
    <rect x="0" y="0" width="30" height="30" fill="#046A38" stroke="url(#matnGold)" stroke-width="2"/>
    <path d="M15,0 L30,15 L15,30 L0,15 Z" fill="#C5A059"/>
    <circle cx="15" cy="15" r="4" fill="#F9F6F0"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 4. إطار التكريم والشكر الأنيق العصري (Appreciation & Gratitude Elegant Frame)
// ----------------------------------------------------------------------
export const SVG_FRAME_APPRECIATION_ELEGANT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <linearGradient id="apprecGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D8BA6C"/>
      <stop offset="50%" stop-color="#C5A059"/>
      <stop offset="100%" stop-color="#A58037"/>
    </linearGradient>
  </defs>

  <!-- Clean Double Line Gold & Emerald -->
  <rect x="25" y="25" width="1073" height="744" fill="none" stroke="url(#apprecGold)" stroke-width="3" rx="16"/>
  <rect x="35" y="35" width="1053" height="724" fill="none" stroke="#046A38" stroke-width="1.8" rx="12"/>

  <!-- Ornate Corner Laurel Leaves / Brackets -->
  <!-- Top-Left -->
  <g transform="translate(38, 38)">
    <path d="M0,40 L0,12 C0,5 5,0 12,0 L40,0" fill="none" stroke="url(#apprecGold)" stroke-width="3"/>
    <path d="M10,25 C14,16 20,12 28,10" fill="none" stroke="#046A38" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="3.5" fill="url(#apprecGold)"/>
  </g>
  <!-- Top-Right -->
  <g transform="translate(1085, 38) scale(-1, 1)">
    <path d="M0,40 L0,12 C0,5 5,0 12,0 L40,0" fill="none" stroke="url(#apprecGold)" stroke-width="3"/>
    <path d="M10,25 C14,16 20,12 28,10" fill="none" stroke="#046A38" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="3.5" fill="url(#apprecGold)"/>
  </g>
  <!-- Bottom-Left -->
  <g transform="translate(38, 756) scale(1, -1)">
    <path d="M0,40 L0,12 C0,5 5,0 12,0 L40,0" fill="none" stroke="url(#apprecGold)" stroke-width="3"/>
    <path d="M10,25 C14,16 20,12 28,10" fill="none" stroke="#046A38" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="3.5" fill="url(#apprecGold)"/>
  </g>
  <!-- Bottom-Right -->
  <g transform="translate(1085, 756) scale(-1, -1)">
    <path d="M0,40 L0,12 C0,5 5,0 12,0 L40,0" fill="none" stroke="url(#apprecGold)" stroke-width="3"/>
    <path d="M10,25 C14,16 20,12 28,10" fill="none" stroke="#046A38" stroke-width="1.5"/>
    <circle cx="10" cy="10" r="3.5" fill="url(#apprecGold)"/>
  </g>

  <!-- Top Center Floral Rosette -->
  <g transform="translate(561.5, 35)">
    <path d="M-30,0 C-15,-10 15,-10 30,0 C15,10 -15,10 -30,0 Z" fill="#F9F6F0" stroke="url(#apprecGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="4" fill="#046A38"/>
  </g>

  <!-- Bottom Center Floral Rosette -->
  <g transform="translate(561.5, 759)">
    <path d="M-30,0 C-15,-10 15,-10 30,0 C15,10 -15,10 -30,0 Z" fill="#F9F6F0" stroke="url(#apprecGold)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="4" fill="#046A38"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 5. خلفية العاج الدافئ مع الزخرفة المائية (Warm Ivory Arabesque Background)
// ----------------------------------------------------------------------
export const SVG_BG_WARM_IVORY_PARCHMENT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <!-- Background Radial Gradient for subtle warm depth -->
    <radialGradient id="ivoryGlow" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F9F6F0"/>
      <stop offset="100%" stop-color="#F2EDE2"/>
    </radialGradient>
    <!-- Islamic Arabesque Watermark Repeat Pattern -->
    <pattern id="islamicPattern" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M60,0 Q90,30 120,60 Q90,90 60,120 Q30,90 0,60 Q30,30 60,0 Z" fill="none" stroke="#C5A059" stroke-width="0.7" opacity="0.08"/>
      <circle cx="60" cy="60" r="18" fill="none" stroke="#046A38" stroke-width="0.6" opacity="0.06"/>
      <circle cx="60" cy="60" r="6" fill="#C5A059" opacity="0.06"/>
    </pattern>
  </defs>

  <!-- Base Ivory Fill -->
  <rect width="1123" height="794" fill="url(#ivoryGlow)"/>

  <!-- Watermark Pattern Overlay -->
  <rect width="1123" height="794" fill="url(#islamicPattern)"/>

  <!-- Center Giant Subtle Medina Rosette -->
  <g transform="translate(561.5, 397)" opacity="0.04">
    <circle cx="0" cy="0" r="180" fill="none" stroke="#046A38" stroke-width="2"/>
    <circle cx="0" cy="0" r="140" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-dasharray="10,5"/>
    <circle cx="0" cy="0" r="90" fill="none" stroke="#046A38" stroke-width="1"/>
    <path d="M0 -140 L35 -35 L140 0 L35 35 L0 140 L-35 35 L-140 0 L-35 -35 Z" fill="none" stroke="#C5A059" stroke-width="1.5"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 6. خلفية المخطوطة القرآنية المذهبة (Gilded Quranic Manuscript Background)
// ----------------------------------------------------------------------
export const SVG_BG_GILDED_MANUSCRIPT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <radialGradient id="manuscriptWash" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#FCFAF5"/>
      <stop offset="75%" stop-color="#F5EFE0"/>
      <stop offset="100%" stop-color="#EBE2CD"/>
    </radialGradient>
    <linearGradient id="goldVignette" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C5A059" stop-opacity="0.12"/>
      <stop offset="50%" stop-color="#046A38" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#C5A059" stop-opacity="0.12"/>
    </linearGradient>
  </defs>

  <!-- Parchment Base -->
  <rect width="1123" height="794" fill="url(#manuscriptWash)"/>
  <!-- Gold Vignette -->
  <rect width="1123" height="794" fill="url(#goldVignette)"/>

  <!-- Delicate Border Frame lines baked into background -->
  <rect x="40" y="40" width="1043" height="714" fill="none" stroke="#C5A059" stroke-width="1" opacity="0.3"/>
  <rect x="44" y="44" width="1035" height="706" fill="none" stroke="#046A38" stroke-width="0.8" opacity="0.2"/>
</svg>
`)}`;

// ----------------------------------------------------------------------
// 7. خلفية السند النبوي التراثية (Heritage Ijaza Parchment)
// ----------------------------------------------------------------------
export const SVG_BG_IJAZA_HERITAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 794" width="1123" height="794">
  <defs>
    <radialGradient id="heritageBg" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#FFFDFA"/>
      <stop offset="60%" stop-color="#F8F3E8"/>
      <stop offset="100%" stop-color="#EDE4D0"/>
    </radialGradient>
  </defs>
  <rect width="1123" height="794" fill="url(#heritageBg)"/>

  <!-- Ancient Calligraphic Watermark Center -->
  <g transform="translate(561.5, 397)" opacity="0.035">
    <circle cx="0" cy="0" r="220" fill="none" stroke="#046A38" stroke-width="3"/>
    <circle cx="0" cy="0" r="200" fill="none" stroke="#C5A059" stroke-width="1"/>
    <circle cx="0" cy="0" r="80" fill="#046A38"/>
  </g>
</svg>
`)}`;

// ----------------------------------------------------------------------
// مصفوفة الإطارات الجاهزة المعتمدة
// ----------------------------------------------------------------------
export const PRESET_CERTIFICATE_FRAMES: CertificateFrameItem[] = [
  {
    id: 'frame-royal-emerald-gold',
    title: 'إطار الزخرفة الملكية الزمردية والذهبية',
    category: 'royal',
    type: 'frame',
    description: 'الإطار الرسمي المعتمد لعام 2026 ذو النجوم الثمانية والزوايا المذهبة والخطوط الزمردية المزدوجة.',
    dataUri: SVG_FRAME_ROYAL_EMERALD_GOLD,
    aspectRatio: '1123:794',
    defaultOpacity: 0.95,
  },
  {
    id: 'frame-islamic-mihrab',
    title: 'إطار المحراب والأقواس التراثية (إجازات وسند)',
    category: 'ijaza',
    type: 'frame',
    description: 'إطار قرآني مهيب مستوحى من محراب المسجد النبوي الشريف والأعمدة المزخرفة، مناسب لإجازات السند المتصل.',
    dataUri: SVG_FRAME_ISLAMIC_MIHRAB,
    aspectRatio: '1123:794',
    defaultOpacity: 0.95,
  },
  {
    id: 'frame-scientific-matn',
    title: 'إطار المتون العلمية والتجويدية الهندسي',
    category: 'matn',
    type: 'frame',
    description: 'إطار أندلسي هندسي متناسق بحواف التوريق والشرائط المتناغمة لشهادات إتقان وضبط المتون والمنظومات.',
    dataUri: SVG_FRAME_SCIENTIFIC_MATN,
    aspectRatio: '1123:794',
    defaultOpacity: 0.92,
  },
  {
    id: 'frame-appreciation-elegant',
    title: 'إطار الشكر والتكريم الأنيق العصري',
    category: 'appreciation',
    type: 'frame',
    description: 'إطار راقٍ ذو زوايا انسيابية وتطعيم ذهبي ناعم مخصص لشهادات الشكر والتقدير وشهادات التكريم السنوية.',
    dataUri: SVG_FRAME_APPRECIATION_ELEGANT,
    aspectRatio: '1123:794',
    defaultOpacity: 0.95,
  },
];

// ----------------------------------------------------------------------
// مصفوفة الخلفيات المعتمدة
// ----------------------------------------------------------------------
export const PRESET_CERTIFICATE_BACKGROUNDS: CertificateFrameItem[] = [
  {
    id: 'bg-warm-ivory-parchment',
    title: 'خلفية العاج الدافئ مع النقوش الإسلامية',
    category: 'royal',
    type: 'background',
    description: 'الخلفية الرسمية المعتمدة (#F9F6F0) بنقوش أرابيسك خافتة ولمعان ناعم في المنتصف لقراءة فائقة الوضوح.',
    dataUri: SVG_BG_WARM_IVORY_PARCHMENT,
    aspectRatio: '1123:794',
    defaultOpacity: 1,
  },
  {
    id: 'bg-gilded-manuscript',
    title: 'خلفية المخطوطة القرآنية المذهبة',
    category: 'classic',
    type: 'background',
    description: 'تأثير الورق القرآني المخطوط القديم بحواف مذهبة خفيفة وملمس عريق.',
    dataUri: SVG_BG_GILDED_MANUSCRIPT,
    aspectRatio: '1123:794',
    defaultOpacity: 1,
  },
  {
    id: 'bg-ijaza-heritage',
    title: 'خلفية السند النبوي التراثية العريقة',
    category: 'ijaza',
    type: 'background',
    description: 'خلفية إجازات السند الأصيلة بعلامة مائية ناعمة متوافقة مع نصوص الإجازات الطويلة.',
    dataUri: SVG_BG_IJAZA_HERITAGE,
    aspectRatio: '1123:794',
    defaultOpacity: 1,
  },
];

// ----------------------------------------------------------------------
// دوال التخزين المحلي والاحتفاظ بالتصميمات المرفوعة
// ----------------------------------------------------------------------
const LOCAL_FRAMES_KEY = 'rehab_quran_custom_frames_library_v1';

export function getLocalSavedFrames(): CertificateFrameItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FRAMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFrameToLocalLibrary(frame: CertificateFrameItem): void {
  try {
    const current = getLocalSavedFrames();
    const filtered = current.filter((f) => f.id !== frame.id);
    const updated = [frame, ...filtered];
    localStorage.setItem(LOCAL_FRAMES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[FramesLibrary] Failed to save to local storage:', err);
  }
}

export function deleteFrameFromLocalLibrary(id: string): void {
  try {
    const current = getLocalSavedFrames();
    const updated = current.filter((f) => f.id !== id);
    localStorage.setItem(LOCAL_FRAMES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[FramesLibrary] Failed to delete from local storage:', err);
  }
}
