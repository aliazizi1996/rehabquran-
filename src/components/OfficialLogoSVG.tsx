import React from 'react';

interface OfficialLogoSVGProps {
  mode?: 'icon' | 'full' | 'emblem';
  className?: string;
}

export const OfficialLogoSVG: React.FC<OfficialLogoSVGProps> = ({
  mode = 'full',
  className = 'w-full h-auto select-none overflow-visible filter drop-shadow-md',
}) => {
  const isIcon = mode === 'icon';
  // For icon: focus tightly on the emblem dome, wings, quran, and finial
  const viewBox = isIcon ? '70 30 260 365' : '0 0 800 720';

  return (
    <svg
      viewBox={viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gold Gradients */}
        <linearGradient id="offGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#faecc8" />
          <stop offset="25%" stopColor="#dfbe75" />
          <stop offset="50%" stopColor="#c5a059" />
          <stop offset="75%" stopColor="#e8cf92" />
          <stop offset="100%" stopColor="#9a762e" />
        </linearGradient>

        <linearGradient id="offGoldGlow" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffecb3" stopOpacity={0.9} />
          <stop offset="60%" stopColor="#ffd54f" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ffca28" stopOpacity={0} />
        </linearGradient>

        <linearGradient id="offEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b5e34" />
          <stop offset="50%" stopColor="#044d27" />
          <stop offset="100%" stopColor="#023319" />
        </linearGradient>

        <linearGradient id="offEmeraldLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0e7742" />
          <stop offset="100%" stopColor="#054b26" />
        </linearGradient>

        <linearGradient id="offQuranPageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="45%" stopColor="#f5eedc" />
          <stop offset="50%" stopColor="#dfbe75" />
          <stop offset="55%" stopColor="#f5eedc" />
          <stop offset="100%" stopColor="#fffdf7" />
        </linearGradient>

        <filter id="offSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#011b0d" floodOpacity={0.25} />
        </filter>

        <linearGradient id="offVGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#faecc8" />
          <stop offset="30%" stopColor="#dfbe75" />
          <stop offset="60%" stopColor="#c5a059" />
          <stop offset="100%" stopColor="#9a762e" />
        </linearGradient>

        <linearGradient id="offTextEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0a6336" />
          <stop offset="50%" stopColor="#044d27" />
          <stop offset="100%" stopColor="#023319" />
        </linearGradient>

        <filter id="offTextShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#011e0e" floodOpacity={0.25} />
        </filter>
      </defs>

      {/* The Emblem Group (Dome, Wings, Quran on Rehal, Finial) */}
      <g transform={isIcon ? 'translate(0, 0)' : 'translate(200, 20)'}>
        {/* Outer Sweeping Emerald & Gold Acanthus Wings */}
        <g id="outer-acanthus-leaves">
          {/* Right Wing */}
          <path
            d="M 200 130 C 265 140 290 190 285 240 C 280 270 250 285 220 285 C 245 270 255 245 250 220 C 245 190 225 165 195 155 Z"
            fill="url(#offEmeraldGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="3.5"
            filter="url(#offSoftShadow)"
          />
          {/* Right Lower Curl */}
          <path
            d="M 230 270 C 275 275 285 320 270 345 C 255 365 220 365 190 345 C 220 345 240 330 240 305 C 240 285 230 275 220 270 Z"
            fill="url(#offEmeraldGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="3"
          />
          {/* Left Wing (Symmetric) */}
          <path
            d="M 200 130 C 135 140 110 190 115 240 C 120 270 150 285 180 285 C 155 270 145 245 150 220 C 155 190 175 165 205 155 Z"
            fill="url(#offEmeraldGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="3.5"
            filter="url(#offSoftShadow)"
          />
          {/* Left Lower Curl */}
          <path
            d="M 170 270 C 125 275 115 320 130 345 C 145 365 180 365 210 345 C 180 345 160 330 160 305 C 160 285 170 275 180 270 Z"
            fill="url(#offEmeraldGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="3"
          />
        </g>

        {/* Central Islamic Pointed Arch Dome */}
        <g id="central-dome" filter="url(#offSoftShadow)">
          {/* Outer Arch Body */}
          <path
            d="M 200 40 C 215 70 265 110 265 185 C 265 260 245 295 200 310 C 155 295 135 260 135 185 C 135 110 185 70 200 40 Z"
            fill="url(#offEmeraldLight)"
            stroke="url(#offGoldGrad)"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          {/* Inner Golden Arched Molding */}
          <path
            d="M 200 62 C 212 88 248 122 248 185 C 248 245 232 278 200 292 C 168 278 152 245 152 185 C 152 122 188 88 200 62 Z"
            fill="#fdf9f0"
            stroke="url(#offGoldGrad)"
            strokeWidth="4"
          />
          {/* Ornate Golden Trefoil / Cusps in Top Arch */}
          <path
            d="M 200 70 C 206 95 224 108 226 125 C 218 126 210 120 200 115 C 190 120 182 126 174 125 C 176 108 194 95 200 70 Z"
            fill="url(#offGoldGrad)"
          />
          {/* Top Apex Fleur-de-lis Finial */}
          <path
            d="M 200 72 C 204 85 212 92 210 102 C 206 104 202 98 200 92 C 198 98 194 104 190 102 C 188 92 196 85 200 72 Z"
            fill="#ffffff"
            stroke="url(#offGoldGrad)"
            strokeWidth="1.5"
          />
          {/* Golden Sunburst Rays from Holy Quran */}
          <g id="golden-sunburst-rays">
            <line x1="200" y1="180" x2="200" y2="90" stroke="url(#offGoldGlow)" strokeWidth="3" strokeLinecap="round" />
            <line x1="200" y1="180" x2="185" y2="95" stroke="url(#offGoldGlow)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="200" y1="180" x2="215" y2="95" stroke="url(#offGoldGlow)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="200" y1="180" x2="170" y2="105" stroke="url(#offGoldGlow)" strokeWidth="2" strokeLinecap="round" />
            <line x1="200" y1="180" x2="230" y2="105" stroke="url(#offGoldGlow)" strokeWidth="2" strokeLinecap="round" />
            <line x1="200" y1="180" x2="160" y2="125" stroke="url(#offGoldGlow)" strokeWidth="2" strokeLinecap="round" />
            <line x1="200" y1="180" x2="240" y2="125" stroke="url(#offGoldGlow)" strokeWidth="2" strokeLinecap="round" />
            <line x1="200" y1="180" x2="155" y2="150" stroke="url(#offGoldGlow)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="200" y1="180" x2="245" y2="150" stroke="url(#offGoldGlow)" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {/* Base of Arch Frame */}
          <path d="M 160 270 C 180 280 220 280 240 270" stroke="url(#offGoldGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Open Holy Quran on Wooden Rehal */}
        <g id="open-holy-quran" filter="url(#offSoftShadow)">
          <ellipse cx="200" cy="180" rx="75" ry="35" fill="url(#offGoldGlow)" />
          {/* Deep Green Quran Cover with Gilded Edge */}
          <path
            d="M 125 185 C 160 178 190 190 200 195 C 210 190 240 178 275 185 L 278 198 C 240 190 210 202 200 206 C 190 202 160 190 122 198 Z"
            fill="#054b26"
            stroke="url(#offGoldGrad)"
            strokeWidth="2.5"
          />
          {/* Stack of Gilded Pages */}
          <path
            d="M 124 188 C 160 181 190 192 200 196 C 210 192 240 181 276 188 L 276 193 C 240 186 210 197 200 201 C 190 197 160 186 124 193 Z"
            fill="url(#offGoldGrad)"
          />
          {/* Left Page */}
          <path
            d="M 200 195 C 190 191 160 180 126 186 C 125 174 158 165 198 178 Z"
            fill="url(#offQuranPageGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="1.5"
          />
          {/* Right Page */}
          <path
            d="M 200 195 C 210 191 240 180 274 186 C 275 174 242 165 202 178 Z"
            fill="url(#offQuranPageGrad)"
            stroke="url(#offGoldGrad)"
            strokeWidth="1.5"
          />
          {/* Page Ayah Lines */}
          <path d="M 140 180 C 155 176 175 180 190 184" stroke="url(#offGoldGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 145 184 C 160 180 175 183 188 187" stroke="url(#offGoldGrad)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 260 180 C 245 176 225 180 210 184" stroke="url(#offGoldGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 255 184 C 240 180 225 183 212 187" stroke="url(#offGoldGrad)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Silk Ribbon Bookmark */}
          <path
            d="M 200 197 C 205 210 195 225 204 240 C 200 238 196 230 198 215 C 199 205 198 200 200 197 Z"
            fill="url(#offGoldGrad)"
            stroke="#9a762e"
            strokeWidth="0.8"
          />
        </g>

        {/* Wooden Rehal Stand */}
        <g id="wooden-rehal-stand" filter="url(#offSoftShadow)">
          <path d="M 150 245 L 245 195 L 255 202 L 160 252 Z" fill="#2d1508" stroke="url(#offGoldGrad)" strokeWidth="1.5" />
          <path d="M 250 245 L 155 195 L 145 202 L 240 252 Z" fill="#4a2511" stroke="url(#offGoldGrad)" strokeWidth="1.5" />
          <path
            d="M 160 250 L 130 335 C 135 345 155 340 165 330 L 188 265 Z"
            fill="#3b1d0a"
            stroke="url(#offGoldGrad)"
            strokeWidth="2"
          />
          <path
            d="M 240 250 L 270 335 C 265 345 245 340 235 330 L 212 265 Z"
            fill="#522a10"
            stroke="url(#offGoldGrad)"
            strokeWidth="2"
          />
          {/* Center Rosette */}
          <circle cx="200" cy="255" r="9" fill="url(#offGoldGrad)" stroke="#9a762e" strokeWidth="1.5" />
          <polygon points="200,249 202,253 206,255 202,257 200,261 198,257 194,255 198,253" fill="#044d27" />
          {/* Carved Base Feet */}
          <path d="M 135 342 C 150 338 165 342 175 332" stroke="url(#offGoldGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 265 342 C 250 338 235 342 225 332" stroke="url(#offGoldGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        {/* Ornate Golden Arabesque Tassel / Finial Beneath Rehal */}
        <g id="arabesque-finial" transform="translate(0, 10)">
          <path
            d="M 200 330 C 210 338 220 345 220 355 C 220 365 210 372 200 380 C 190 372 180 365 180 355 C 180 345 190 338 200 330 Z"
            fill="url(#offGoldGrad)"
            stroke="#9a762e"
            strokeWidth="1.5"
          />
          <path d="M 200 345 C 215 352 230 355 225 365 C 220 375 208 370 200 360" fill="none" stroke="url(#offGoldGrad)" strokeWidth="2" />
          <path d="M 200 345 C 185 352 170 355 175 365 C 180 375 192 370 200 360" fill="none" stroke="url(#offGoldGrad)" strokeWidth="2" />
          <circle cx="200" cy="384" r="3" fill="url(#offGoldGrad)" />
        </g>
      </g>

      {/* Primary Typography for Full / Emblem Mode: "مقرأة رحاب" and "القرآن الإلكترونية" */}
      {!isIcon && (
        <>
          {/* Line 1: مقرأة رحاب */}
          <g transform="translate(400, 520)" textAnchor="middle" filter="url(#offTextShadow)">
            <text
              x="0"
              y="3"
              fontFamily="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif"
              fontWeight="900"
              fontSize="106"
              fill="url(#offVGold)"
              letterSpacing="-1"
            >
              مقرأة رحاب
            </text>
            <text
              x="0"
              y="0"
              fontFamily="'Cairo', 'Amiri', 'Noto Kufi Arabic', Arial, sans-serif"
              fontWeight="900"
              fontSize="106"
              fill="url(#offTextEmerald)"
              stroke="url(#offVGold)"
              strokeWidth="4.5"
              paintOrder="stroke fill"
              letterSpacing="-1"
            >
              مقرأة رحاب
            </text>
          </g>

          {/* Line 2: القرآن الإلكترونية with Gold Spear Flanks */}
          <g transform="translate(400, 610)" textAnchor="middle">
            {/* Right Gold Spear Accent */}
            <g transform="translate(195, -12)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="url(#offVGold)" strokeWidth="3" strokeLinecap="round" />
              <polygon points="80,0 95,-5 110,0 95,5" fill="url(#offVGold)" />
              <line x1="110" y1="0" x2="125" y2="0" stroke="url(#offVGold)" strokeWidth="2" />
            </g>

            <text
              x="0"
              y="0"
              fontFamily="'Cairo', 'Noto Kufi Arabic', Arial, sans-serif"
              fontWeight="800"
              fontSize="52"
              fill="#044d27"
              letterSpacing="1"
            >
              القرآن الإلكترونية
            </text>

            {/* Left Gold Spear Accent */}
            <g transform="translate(-195, -12) scale(-1, 1)">
              <line x1="0" y1="0" x2="80" y2="0" stroke="url(#offVGold)" strokeWidth="3" strokeLinecap="round" />
              <polygon points="80,0 95,-5 110,0 95,5" fill="url(#offVGold)" />
              <line x1="110" y1="0" x2="125" y2="0" stroke="url(#offVGold)" strokeWidth="2" />
            </g>
          </g>

          {/* Bottom Gold Diamond Ornament */}
          <g transform="translate(400, 660)">
            <polygon points="0,-12 12,0 0,12 -12,0" fill="url(#offVGold)" stroke="#9a762e" strokeWidth="1.5" />
            <polygon points="0,-6 6,0 0,6 -6,0" fill="#faecc8" />
            <line x1="22" y1="0" x2="100" y2="0" stroke="url(#offVGold)" strokeWidth="3" strokeLinecap="round" />
            <polygon points="100,0 110,-3 120,0 110,3" fill="url(#offVGold)" />
            <line x1="-22" y1="0" x2="-100" y2="0" stroke="url(#offVGold)" strokeWidth="3" strokeLinecap="round" />
            <polygon points="-100,0 -110,-3 -120,0 -110,3" fill="url(#offVGold)" />
          </g>
        </>
      )}
    </svg>
  );
};
