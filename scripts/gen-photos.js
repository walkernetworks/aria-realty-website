// Generates elegant SVG placeholder "photos" for sample listings.
// Real photos arrive automatically from the MLS media feed once IDX sync is live.
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'assets', 'photos');
fs.mkdirSync(outDir, { recursive: true });

const skies = [
  ['#1a2f52', '#3e6ca8', '#c98f4e'], // dusk
  ['#101d33', '#27486e', '#8fb4d9'], // twilight
  ['#132743', '#2f5e8f', '#e0b36a'], // golden hour
  ['#0d1b2e', '#1f3a5c', '#5d84ad'], // evening
  ['#1c3355', '#3a6493', '#d9a05b'], // sunset
  ['#0f2138', '#2a4a70', '#7fa6cc'], // blue hour
];

function house(seed) {
  // Vary rooflines & massing by seed
  const v = seed % 4;
  if (v === 0) return `
    <g fill="#0a1526" stroke="#c9a35c" stroke-width="2.5">
      <rect x="240" y="330" width="330" height="180"/>
      <polygon points="220,330 405,215 590,330"/>
      <rect x="580" y="380" width="180" height="130"/>
      <polygon points="570,380 670,310 770,380"/>
      <rect x="370" y="400" width="70" height="110" fill="#c9a35c" opacity="0.85"/>
      <rect x="270" y="370" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="470" y="370" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="620" y="410" width="50" height="50" fill="#e8d5ae" opacity="0.7"/>
    </g>`;
  if (v === 1) return `
    <g fill="#0a1526" stroke="#c9a35c" stroke-width="2.5">
      <rect x="200" y="300" width="240" height="210"/>
      <rect x="440" y="360" width="280" height="150"/>
      <polygon points="185,300 320,200 455,300"/>
      <polygon points="430,360 580,265 730,360"/>
      <rect x="300" y="410" width="65" height="100" fill="#c9a35c" opacity="0.85"/>
      <rect x="230" y="340" width="55" height="60" fill="#e8d5ae" opacity="0.7"/>
      <rect x="500" y="395" width="55" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="610" y="395" width="55" height="55" fill="#e8d5ae" opacity="0.7"/>
    </g>`;
  if (v === 2) return `
    <g fill="#0a1526" stroke="#c9a35c" stroke-width="2.5">
      <rect x="260" y="280" width="460" height="230"/>
      <rect x="260" y="280" width="460" height="18" fill="#c9a35c" opacity="0.5"/>
      <rect x="300" y="330" width="90" height="130" fill="#e8d5ae" opacity="0.6"/>
      <rect x="430" y="330" width="90" height="130" fill="#e8d5ae" opacity="0.6"/>
      <rect x="560" y="330" width="90" height="130" fill="#e8d5ae" opacity="0.6"/>
      <rect x="430" y="420" width="90" height="90" fill="#c9a35c" opacity="0.85"/>
    </g>`;
  return `
    <g fill="#0a1526" stroke="#c9a35c" stroke-width="2.5">
      <rect x="230" y="340" width="520" height="170"/>
      <polygon points="210,340 350,240 490,340"/>
      <polygon points="470,340 610,255 750,340"/>
      <rect x="450" y="400" width="75" height="110" fill="#c9a35c" opacity="0.85"/>
      <rect x="280" y="380" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="360" y="380" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="580" y="380" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
      <rect x="660" y="380" width="60" height="55" fill="#e8d5ae" opacity="0.7"/>
    </g>`;
}

function exterior(i) {
  const [top, mid, sun] = skies[i % skies.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="0.7" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.38" r="0.35">
      <stop offset="0" stop-color="${sun}" stop-opacity="0.9"/><stop offset="1" stop-color="${sun}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="600" fill="url(#sky)"/>
  <rect width="960" height="600" fill="url(#glow)"/>
  <circle cx="690" cy="228" r="34" fill="${sun}" opacity="0.95"/>
  <ellipse cx="480" cy="560" rx="620" ry="90" fill="#0c1828"/>
  <ellipse cx="140" cy="330" rx="90" ry="55" fill="#0a1526" opacity="0.85"/>
  <rect x="132" y="330" width="14" height="130" fill="#0a1526" opacity="0.85"/>
  <ellipse cx="850" cy="350" rx="75" ry="48" fill="#0a1526" opacity="0.85"/>
  <rect x="843" y="350" width="12" height="115" fill="#0a1526" opacity="0.85"/>
  ${house(i)}
  <text x="480" y="575" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="#c9a35c" opacity="0.75" letter-spacing="3">ARIA REALTY · SAMPLE LISTING PHOTO</text>
</svg>`;
}

function interior(i) {
  const tones = [['#141f33', '#c9a35c'], ['#1a2740', '#e8d5ae'], ['#0f1a2c', '#b78e45']][i % 3];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 600">
  <rect width="960" height="600" fill="${tones[0]}"/>
  <polygon points="0,0 260,120 260,480 0,600" fill="#0b1424"/>
  <polygon points="960,0 700,120 700,480 960,600" fill="#0b1424"/>
  <rect x="260" y="120" width="440" height="360" fill="#18263e" stroke="${tones[1]}" stroke-width="2"/>
  <rect x="300" y="160" width="160" height="240" fill="${tones[1]}" opacity="0.25"/>
  <rect x="500" y="160" width="160" height="240" fill="${tones[1]}" opacity="0.18"/>
  <line x1="260" y1="480" x2="0" y2="600" stroke="${tones[1]}" stroke-width="2" opacity="0.5"/>
  <line x1="700" y1="480" x2="960" y2="600" stroke="${tones[1]}" stroke-width="2" opacity="0.5"/>
  <circle cx="480" cy="90" r="6" fill="${tones[1]}"/>
  <line x1="480" y1="0" x2="480" y2="84" stroke="${tones[1]}" stroke-width="2"/>
  <text x="480" y="575" text-anchor="middle" font-family="Georgia, serif" font-size="17" fill="${tones[1]}" opacity="0.75" letter-spacing="3">ARIA REALTY · SAMPLE INTERIOR PHOTO</text>
</svg>`;
}

for (let i = 1; i <= 16; i++) {
  fs.writeFileSync(path.join(outDir, `home-${String(i).padStart(2, '0')}.svg`), exterior(i));
}
for (let i = 1; i <= 3; i++) {
  fs.writeFileSync(path.join(outDir, `int-0${i}.svg`), interior(i));
}
console.log('Generated', fs.readdirSync(outDir).length, 'placeholder photos');
