import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. EMBLEM DEFINITIONS (Vector Components matching user's exact uploaded logo)
// The ornate Islamic dome, acanthus leaves, open Quran with golden sunburst rays, crossed Rehal, and golden Arabesque.
const emblemSvg = `
<g id="emblem-group">
  <defs>
    <!-- Gold Gradients -->
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faecc8" />
      <stop offset="25%" stop-color="#dfbe75" />
      <stop offset="50%" stop-color="#c5a059" />
      <stop offset="75%" stop-color="#e8cf92" />
      <stop offset="100%" stop-color="#9a762e" />
    </linearGradient>

    <linearGradient id="gold-glow" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#ffecb3" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#ffd54f" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#ffca28" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b5e34" />
      <stop offset="50%" stop-color="#044d27" />
      <stop offset="100%" stop-color="#023319" />
    </linearGradient>

    <linearGradient id="emerald-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0e7742" />
      <stop offset="100%" stop-color="#054b26" />
    </linearGradient>

    <linearGradient id="quran-page-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fffdf7" />
      <stop offset="45%" stop-color="#f5eedc" />
      <stop offset="50%" stop-color="#dfbe75" />
      <stop offset="55%" stop-color="#f5eedc" />
      <stop offset="100%" stop-color="#fffdf7" />
    </linearGradient>

    <filter id="soft-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#011b0d" flood-opacity="0.25" />
    </filter>

    <filter id="gold-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Outer Sweeping Emerald & Gold Acanthus Wings -->
  <g id="outer-acanthus-leaves">
    <!-- Right Wing -->
    <path d="M 200 130 C 265 140 290 190 285 240 C 280 270 250 285 220 285 C 245 270 255 245 250 220 C 245 190 225 165 195 155 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="3.5" filter="url(#soft-shadow)" />
    <!-- Right Lower Curl -->
    <path d="M 230 270 C 275 275 285 320 270 345 C 255 365 220 365 190 345 C 220 345 240 330 240 305 C 240 285 230 275 220 270 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="3" />

    <!-- Left Wing (Symmetric) -->
    <path d="M 200 130 C 135 140 110 190 115 240 C 120 270 150 285 180 285 C 155 270 145 245 150 220 C 155 190 175 165 205 155 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="3.5" filter="url(#soft-shadow)" />
    <!-- Left Lower Curl -->
    <path d="M 170 270 C 125 275 115 320 130 345 C 145 365 180 365 210 345 C 180 345 160 330 160 305 C 160 285 170 275 180 270 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="3" />
  </g>

  <!-- Central Islamic Pointed Arch Dome -->
  <g id="central-dome" filter="url(#soft-shadow)">
    <!-- Outer Arch Body -->
    <path d="M 200 40 
             C 215 70 265 110 265 185 
             C 265 260 245 295 200 310 
             C 155 295 135 260 135 185 
             C 135 110 185 70 200 40 Z" 
          fill="url(#emerald-light)" stroke="url(#gold-grad)" stroke-width="5" stroke-linejoin="round" />

    <!-- Inner Golden Arched Molding -->
    <path d="M 200 62 
             C 212 88 248 122 248 185 
             C 248 245 232 278 200 292 
             C 168 278 152 245 152 185 
             C 152 122 188 88 200 62 Z" 
          fill="#fdf9f0" stroke="url(#gold-grad)" stroke-width="4" />

    <!-- Ornate Golden Trefoil / Cusps in Top Arch -->
    <path d="M 200 70 
             C 206 95 224 108 226 125 
             C 218 126 210 120 200 115 
             C 190 120 182 126 174 125 
             C 176 108 194 95 200 70 Z" 
          fill="url(#gold-grad)" />

    <!-- Top Apex Fleur-de-lis Finial -->
    <path d="M 200 72 
             C 204 85 212 92 210 102 
             C 206 104 202 98 200 92 
             C 198 98 194 104 190 102 
             C 188 92 196 85 200 72 Z" 
          fill="#faecc8" stroke="url(#gold-grad)" stroke-width="1.5" />
    <circle cx="200" cy="112" r="3.5" fill="#044d27" stroke="url(#gold-grad)" stroke-width="1" />
  </g>

  <!-- Golden Radiant Sunburst Rays Emenating from Quran -->
  <g id="radiant-sunburst" opacity="0.95">
    <!-- Ray Lines -->
    <line x1="200" y1="210" x2="200" y2="125" stroke="url(#gold-grad)" stroke-width="3" stroke-linecap="round" />
    <line x1="200" y1="210" x2="216" y2="128" stroke="url(#gold-grad)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="200" y1="210" x2="184" y2="128" stroke="url(#gold-grad)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="200" y1="210" x2="230" y2="137" stroke="url(#gold-grad)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="200" y1="210" x2="170" y2="137" stroke="url(#gold-grad)" stroke-width="2.5" stroke-linecap="round" />
    <line x1="200" y1="210" x2="241" y2="152" stroke="url(#gold-grad)" stroke-width="2" stroke-linecap="round" />
    <line x1="200" y1="210" x2="159" y2="152" stroke="url(#gold-grad)" stroke-width="2" stroke-linecap="round" />
    <line x1="200" y1="210" x2="247" y2="172" stroke="url(#gold-grad)" stroke-width="2" stroke-linecap="round" />
    <line x1="200" y1="210" x2="153" y2="172" stroke="url(#gold-grad)" stroke-width="2" stroke-linecap="round" />
    <line x1="200" y1="210" x2="247" y2="194" stroke="url(#gold-grad)" stroke-width="1.8" stroke-linecap="round" />
    <line x1="200" y1="210" x2="153" y2="194" stroke="url(#gold-grad)" stroke-width="1.8" stroke-linecap="round" />
  </g>

  <!-- Open Holy Quran on Rehal Stand -->
  <g id="holy-quran" filter="url(#soft-shadow)">
    <!-- Quran Outer Book Binding (Emerald & Gold) -->
    <path d="M 200 240 
             L 260 215 C 263 214 265 216 264 219 L 254 262 C 253 265 250 266 248 266 L 200 280 L 152 266 C 150 266 147 265 146 262 L 136 219 C 135 216 137 214 140 215 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="3" />

    <!-- Open Pages Right (Right Wing) -->
    <path d="M 200 218 
             C 215 210 242 195 258 202 
             C 260 203 261 205 260 208 
             L 250 252 
             C 238 248 215 255 200 262 Z" 
          fill="url(#quran-page-grad)" stroke="url(#gold-grad)" stroke-width="2.5" />

    <!-- Open Pages Left (Left Wing) -->
    <path d="M 200 218 
             C 185 210 158 195 142 202 
             C 140 203 139 205 140 208 
             L 150 252 
             C 162 248 185 255 200 262 Z" 
          fill="url(#quran-page-grad)" stroke="url(#gold-grad)" stroke-width="2.5" />

    <!-- Page Lines & Quranic Gold Illuminations -->
    <!-- Right Page Verse Lines -->
    <line x1="210" y1="222" x2="246" y2="210" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="210" y1="230" x2="244" y2="220" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="210" y1="238" x2="242" y2="230" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="209" y1="246" x2="239" y2="240" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />

    <!-- Left Page Verse Lines -->
    <line x1="190" y1="222" x2="154" y2="210" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="190" y1="230" x2="156" y2="220" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="190" y1="238" x2="158" y2="230" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />
    <line x1="191" y1="246" x2="161" y2="240" stroke="#c5a059" stroke-width="1.6" stroke-linecap="round" />

    <!-- Center Spine Ridge -->
    <line x1="200" y1="216" x2="200" y2="264" stroke="url(#gold-grad)" stroke-width="3" />
    <!-- Gold Central Spherical Pivot Point -->
    <circle cx="200" cy="265" r="7.5" fill="url(#gold-grad)" stroke="#9a762e" stroke-width="1.5" />
    <circle cx="198" cy="263" r="2.5" fill="#fffdf7" />
  </g>

  <!-- Crossed Rehal Bookstand (Emerald & Gold) -->
  <g id="rehal-stand">
    <!-- Right Crossing Leg -->
    <path d="M 195 268 
             C 175 285 145 320 135 342 
             C 150 344 175 330 195 305 
             L 205 292 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="2.5" />

    <!-- Left Crossing Leg -->
    <path d="M 205 268 
             C 225 285 255 320 265 342 
             C 250 344 225 330 205 305 
             L 195 292 Z" 
          fill="url(#emerald-grad)" stroke="url(#gold-grad)" stroke-width="2.5" />

    <!-- Golden Cusped Bottom Edges of Rehal -->
    <path d="M 135 342 C 150 338 165 342 175 332" stroke="url(#gold-grad)" stroke-width="3" fill="none" stroke-linecap="round" />
    <path d="M 265 342 C 250 338 235 342 225 332" stroke="url(#gold-grad)" stroke-width="3" fill="none" stroke-linecap="round" />
  </g>

  <!-- Ornate Golden Arabesque Tassel / Finial Beneath Rehal -->
  <g id="arabesque-finial" transform="translate(0, 10)">
    <path d="M 200 330 
             C 210 338 220 345 220 355 
             C 220 365 210 372 200 380 
             C 190 372 180 365 180 355 
             C 180 345 190 338 200 330 Z" 
          fill="url(#gold-grad)" stroke="#9a762e" stroke-width="1.5" />
    <!-- Flourish Curls -->
    <path d="M 200 345 C 215 352 230 355 225 365 C 220 375 208 370 200 360" fill="none" stroke="url(#gold-grad)" stroke-width="2" />
    <path d="M 200 345 C 185 352 170 355 175 365 C 180 375 192 370 200 360" fill="none" stroke="url(#gold-grad)" stroke-width="2" />
    <circle cx="200" cy="384" r="3" fill="url(#gold-grad)" />
  </g>
</g>
`;

// 2. VERTICAL / SQUARE OFFICIAL LOGO (matching uploaded image a83c4750-b68e-11f1-a7c9-5dad0a25eff7.png)
const verticalLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" dir="rtl">
  <defs>
    <linearGradient id="v-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faecc8" />
      <stop offset="30%" stop-color="#dfbe75" />
      <stop offset="60%" stop-color="#c5a059" />
      <stop offset="100%" stop-color="#9a762e" />
    </linearGradient>

    <linearGradient id="text-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a6336" />
      <stop offset="50%" stop-color="#044d27" />
      <stop offset="100%" stop-color="#023319" />
    </linearGradient>

    <filter id="text-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#011e0e" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Scale & Position Emblem at Top Center (x: 200, y: 15, scale: 1.0) -->
  <g transform="translate(200, 25)">
    ${emblemSvg}
  </g>

  <!-- Primary Typography: "مقرأة رحاب" -->
  <g transform="translate(400, 525)" text-anchor="middle" filter="url(#text-shadow)">
    <!-- 3D Gold Extrusion Effect -->
    <text x="0" y="3" font-family="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="900" font-size="106" fill="url(#v-gold)" letter-spacing="-1">
      مقرأة رحاب
    </text>
    <!-- Main Emerald Lettering with Gold Border -->
    <text x="0" y="0" font-family="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="900" font-size="106" fill="url(#text-emerald)" stroke="url(#v-gold)" stroke-width="4.5" paint-order="stroke fill" letter-spacing="-1">
      مقرأة رحاب
    </text>
  </g>

  <!-- Secondary Typography & Gold Spear Flanks: "—◆ القرآن الإلكترونية ◆—" -->
  <g transform="translate(400, 615)" text-anchor="middle">
    <!-- Right Gold Spear Accent -->
    <g transform="translate(195, -12)">
      <line x1="0" y1="0" x2="80" y2="0" stroke="url(#v-gold)" stroke-width="3" stroke-linecap="round" />
      <polygon points="80,0 95,-5 110,0 95,5" fill="url(#v-gold)" />
      <line x1="110" y1="0" x2="125" y2="0" stroke="url(#v-gold)" stroke-width="2" />
    </g>

    <!-- Center Text: "القرآن الإلكترونية" -->
    <text x="0" y="0" font-family="'Cairo', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="800" font-size="54" fill="#044d27" letter-spacing="1">
      القرآن الإلكترونية
    </text>

    <!-- Left Gold Spear Accent -->
    <g transform="translate(-195, -12) scale(-1, 1)">
      <line x1="0" y1="0" x2="80" y2="0" stroke="url(#v-gold)" stroke-width="3" stroke-linecap="round" />
      <polygon points="80,0 95,-5 110,0 95,5" fill="url(#v-gold)" />
      <line x1="110" y1="0" x2="125" y2="0" stroke="url(#v-gold)" stroke-width="2" />
    </g>
  </g>

  <!-- Bottom Gold Diamond Ornament -->
  <g transform="translate(400, 665)">
    <!-- Center Diamond Cluster -->
    <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#v-gold)" stroke="#9a762e" stroke-width="1.5" />
    <polygon points="0,-6 6,0 0,6 -6,0" fill="#faecc8" />
    <!-- Horizontal Gold Dividers -->
    <line x1="22" y1="0" x2="100" y2="0" stroke="url(#v-gold)" stroke-width="3" stroke-linecap="round" />
    <polygon points="100,0 110,-3 120,0 110,3" fill="url(#v-gold)" />
    <line x1="-22" y1="0" x2="-100" y2="0" stroke="url(#v-gold)" stroke-width="3" stroke-linecap="round" />
    <polygon points="-100,0 -110,-3 -120,0 -110,3" fill="url(#v-gold)" />
  </g>
</svg>
`;

// 3. HORIZONTAL HEADER LOGO (matching uploaded image 076d05c0-b68f-11f1-a7c9-5dad0a25eff7.png)
// Emblem on the Right, Typography on the Left.
const horizontalLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400" dir="rtl">
  <defs>
    <linearGradient id="h-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faecc8" />
      <stop offset="30%" stop-color="#dfbe75" />
      <stop offset="60%" stop-color="#c5a059" />
      <stop offset="100%" stop-color="#9a762e" />
    </linearGradient>

    <linearGradient id="h-text-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a6336" />
      <stop offset="50%" stop-color="#044d27" />
      <stop offset="100%" stop-color="#023319" />
    </linearGradient>

    <filter id="h-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#011e0e" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- Right Side: The Official Emblem (x: 820, y: 0, scale: 0.95) -->
  <g transform="translate(810, 5) scale(0.95)">
    ${emblemSvg}
  </g>

  <!-- Left Side: Typography Block (Right-aligned next to the emblem) -->
  <g transform="translate(770, 0)">
    <!-- Line 1: "مقرأة رحاب" -->
    <g transform="translate(0, 195)" text-anchor="end" filter="url(#h-shadow)">
      <!-- 3D Gold Accent Underlayer -->
      <text x="0" y="3" font-family="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="900" font-size="112" fill="url(#h-gold)" letter-spacing="-1">
        مقرأة رحاب
      </text>
      <!-- Main Text in Deep Emerald with Gold Outline -->
      <text x="0" y="0" font-family="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="900" font-size="112" fill="url(#h-text-emerald)" stroke="url(#h-gold)" stroke-width="4.5" paint-order="stroke fill" letter-spacing="-1">
        مقرأة رحاب
      </text>
    </g>

    <!-- Line 2: "—◆ القرآن الإلكترونية ◆—" with Gold Spear Dividers -->
    <g transform="translate(0, 280)" text-anchor="end">
      <!-- Right Spear Accent -->
      <g transform="translate(0, -14)">
        <polygon points="0,0 -12,-5 -24,0 -12,5" fill="url(#h-gold)" />
        <line x1="-24" y1="0" x2="-80" y2="0" stroke="url(#h-gold)" stroke-width="3" stroke-linecap="round" />
      </g>

      <!-- Text: "القرآن الإلكترونية" -->
      <text x="-105" y="0" font-family="'Cairo', 'Noto Kufi Arabic', Arial, sans-serif" font-weight="800" font-size="52" fill="#044d27" letter-spacing="1">
        القرآن الإلكترونية
      </text>

      <!-- Left Spear Accent -->
      <g transform="translate(-490, -14)">
        <polygon points="0,0 -12,-5 -24,0 -12,5" fill="url(#h-gold)" />
        <line x1="-24" y1="0" x2="-80" y2="0" stroke="url(#h-gold)" stroke-width="3" stroke-linecap="round" />
      </g>
    </g>
  </g>
</svg>
`;

// 4. OFFICIAL CIRCULAR ACADEMY SEAL (خاتم المقرأة المعتمد)
const sealSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" dir="rtl">
  <defs>
    <linearGradient id="seal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#faecc8" />
      <stop offset="25%" stop-color="#dfbe75" />
      <stop offset="50%" stop-color="#c5a059" />
      <stop offset="100%" stop-color="#9a762e" />
    </linearGradient>
    <linearGradient id="seal-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#044d27" />
      <stop offset="100%" stop-color="#022e17" />
    </linearGradient>
  </defs>

  <!-- Outer Golden Gear / Star Rings -->
  <circle cx="300" cy="300" r="285" fill="none" stroke="url(#seal-gold)" stroke-width="6" stroke-dasharray="10 5" />
  <circle cx="300" cy="300" r="270" fill="url(#seal-emerald)" stroke="url(#seal-gold)" stroke-width="8" />
  <circle cx="300" cy="300" r="225" fill="#fdfaf3" stroke="url(#seal-gold)" stroke-width="5" />

  <!-- Circular Texts Around Rim -->
  <path id="circle-path-top" d="M 75 300 A 225 225 0 0 1 525 300" fill="none" />
  <text font-family="'Cairo', 'Amiri', sans-serif" font-weight="900" font-size="28" fill="url(#seal-gold)">
    <textPath href="#circle-path-top" startOffset="50%" text-anchor="middle">
      ★ مقرأة رحاب القرآن الإلكترونية الرسمية ★
    </textPath>
  </text>

  <path id="circle-path-bottom" d="M 525 300 A 225 225 0 0 1 75 300" fill="none" />
  <text font-family="'Cairo', 'Noto Kufi Arabic', sans-serif" font-weight="800" font-size="22" fill="url(#seal-gold)">
    <textPath href="#circle-path-bottom" startOffset="50%" text-anchor="middle">
      ـ صرح قرآني معتمد لتعليم وإقراء كتاب الله تعالى بالسند ـ
    </textPath>
  </text>

  <!-- Center Emblem (Scale 0.45) -->
  <g transform="translate(210, 130) scale(0.45)">
    ${emblemSvg}
  </g>

  <!-- Verified Stamp Badge -->
  <g transform="translate(300, 430)" text-anchor="middle">
    <rect x="-85" y="-18" width="170" height="36" rx="18" fill="#044d27" stroke="url(#seal-gold)" stroke-width="2.5" />
    <text x="0" y="7" font-family="'Cairo', sans-serif" font-weight="bold" font-size="18" fill="url(#seal-gold)">
      معتمد رسمياً
    </text>
  </g>
</svg>
`;

async function generateAllBranding() {
  const publicDir = path.resolve('public');
  const assetsDir = path.resolve('public/assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('1. Writing SVGs to public directory...');
  // Horizontal logo SVG
  fs.writeFileSync(path.join(assetsDir, 'logo-muqraat-rihab-header.svg'), horizontalLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'logo-muqraat-rihab-header.svg'), horizontalLogoSvg);

  // Vertical logo SVG
  fs.writeFileSync(path.join(publicDir, 'official-logo.svg'), verticalLogoSvg);
  fs.writeFileSync(path.join(assetsDir, 'official-logo.svg'), verticalLogoSvg);

  // Small icon SVG (Emblem only)
  const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 30 300 370" width="300" height="370">
  ${emblemSvg}
</svg>
  `;
  fs.writeFileSync(path.join(publicDir, 'official-logo-small.svg'), iconSvg);

  // Official Seal SVG
  fs.writeFileSync(path.join(publicDir, 'official-seal.svg'), sealSvg);

  console.log('2. Rendering high-res transparent PNGs with Sharp...');
  
  // 1. Horizontal Header Logo PNG (1200x400)
  await sharp(Buffer.from(horizontalLogoSvg))
    .png()
    .toFile(path.join(assetsDir, 'logo-muqraat-rihab-header.png'));
  
  await sharp(Buffer.from(horizontalLogoSvg))
    .png()
    .toFile(path.join(publicDir, 'logo-muqraat-rihab-header.png'));

  // 2. Vertical Official Logo PNG (1024x1024)
  await sharp(Buffer.from(verticalLogoSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(publicDir, 'official-logo.png'));

  await sharp(Buffer.from(verticalLogoSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'official-logo.png'));

  // 3. Small Logo Icon PNG (256x256)
  await sharp(Buffer.from(iconSvg))
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'official-logo-small.png'));

  // 4. Official Seal PNG (600x600)
  await sharp(Buffer.from(sealSvg))
    .resize(600, 600)
    .png()
    .toFile(path.join(publicDir, 'official-seal.png'));

  console.log('✅ All official logo assets successfully generated!');
}

generateAllBranding().catch(err => {
  console.error('Error generating branding:', err);
  process.exit(1);
});
