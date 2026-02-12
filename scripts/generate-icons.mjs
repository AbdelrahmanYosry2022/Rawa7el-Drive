import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');

function createIconSvg(size, maskable = false) {
  const s = size;
  const pad = maskable ? s * 0.2 : 0;
  const iconArea = s - pad * 2;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.18;

  // Book dimensions
  const bw = iconArea * 0.52;
  const bh = iconArea * 0.42;
  const bx = cx - bw;
  const by = cy - bh * 0.55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${s}" y2="${s}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4338ca"/>
      <stop offset="50%" stop-color="#6d28d9"/>
      <stop offset="100%" stop-color="#9333ea"/>
    </linearGradient>
    <linearGradient id="pageShadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e0e7ff"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Subtle diagonal lines -->
  ${Array.from({length: 12}, (_, i) => {
    const offset = (i + 1) * s * 0.08;
    return `<line x1="${offset}" y1="0" x2="0" y2="${offset}" stroke="white" stroke-opacity="0.06" stroke-width="1"/>`;
  }).join('\n  ')}

  <!-- Book - Left page -->
  <path d="M${cx} ${by + bh * 0.1} Q${cx - bw * 0.2} ${by} ${bx} ${by + bh * 0.06} L${bx} ${by + bh} Q${cx - bw * 0.15} ${by + bh - bh * 0.04} ${cx} ${by + bh - bh * 0.01} Z"
        fill="white" fill-opacity="0.95"/>

  <!-- Book - Right page -->
  <path d="M${cx} ${by + bh * 0.1} Q${cx + bw * 0.2} ${by} ${bx + bw * 2} ${by + bh * 0.06} L${bx + bw * 2} ${by + bh} Q${cx + bw * 0.15} ${by + bh - bh * 0.04} ${cx} ${by + bh - bh * 0.01} Z"
        fill="white" fill-opacity="0.9"/>

  <!-- Left page lines -->
  ${Array.from({length: 5}, (_, i) => {
    const ly = by + bh * 0.25 + (bh * 0.5) * ((i + 1) / 6);
    return `<line x1="${bx + bw * 0.12}" y1="${ly}" x2="${cx - bw * 0.08}" y2="${ly}" stroke="#6366f1" stroke-opacity="0.15" stroke-width="${Math.max(1, s * 0.004)}" stroke-linecap="round"/>`;
  }).join('\n  ')}

  <!-- Right page lines -->
  ${Array.from({length: 5}, (_, i) => {
    const ly = by + bh * 0.25 + (bh * 0.5) * ((i + 1) / 6);
    return `<line x1="${cx + bw * 0.08}" y1="${ly}" x2="${bx + bw * 2 - bw * 0.12}" y2="${ly}" stroke="#6366f1" stroke-opacity="0.15" stroke-width="${Math.max(1, s * 0.004)}" stroke-linecap="round"/>`;
  }).join('\n  ')}

  <!-- Spine -->
  <line x1="${cx}" y1="${by + bh * 0.08}" x2="${cx}" y2="${by + bh}" stroke="#6366f1" stroke-opacity="0.2" stroke-width="${Math.max(1.5, s * 0.005)}"/>

  <!-- Sparkle accent -->
  <path d="M${cx + bw * 0.6} ${by - iconArea * 0.02}
           l${iconArea * 0.018} ${-iconArea * 0.04}
           l${iconArea * 0.018} ${iconArea * 0.04}
           l${iconArea * 0.04} ${iconArea * 0.018}
           l${-iconArea * 0.04} ${iconArea * 0.018}
           l${-iconArea * 0.018} ${iconArea * 0.04}
           l${-iconArea * 0.018} ${-iconArea * 0.04}
           l${-iconArea * 0.04} ${-iconArea * 0.018}
           Z"
        fill="white" fill-opacity="0.85"/>

  <!-- Small dots -->
  <circle cx="${bx + bw * 0.15}" cy="${by - iconArea * 0.03}" r="${iconArea * 0.012}" fill="white" fill-opacity="0.4"/>
  <circle cx="${cx + bw * 0.8}" cy="${by + bh * 0.2}" r="${iconArea * 0.009}" fill="white" fill-opacity="0.35"/>

  <!-- "بداية" text -->
  <text x="${cx}" y="${by + bh + iconArea * 0.18}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${iconArea * 0.13}" fill="white" fill-opacity="0.95">بداية</text>
</svg>`;
}

async function generateIcons() {
  const configs = [
    { size: 192, maskable: false, name: 'icon-192.png' },
    { size: 512, maskable: false, name: 'icon-512.png' },
    { size: 192, maskable: true, name: 'icon-maskable-192.png' },
    { size: 512, maskable: true, name: 'icon-maskable-512.png' },
  ];

  for (const cfg of configs) {
    const svg = createIconSvg(cfg.size, cfg.maskable);
    const svgBuffer = Buffer.from(svg);
    const pngBuffer = await sharp(svgBuffer).png().toBuffer();
    const outPath = join(publicDir, cfg.name);
    writeFileSync(outPath, pngBuffer);
    console.log(`✓ Generated ${cfg.name} (${pngBuffer.length} bytes)`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
