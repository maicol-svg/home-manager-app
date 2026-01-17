import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Housy brand color - sky blue
const primaryColor = '#0ea5e9';
const backgroundColor = '#ffffff';

// Create a simple house icon SVG
const createHouseIcon = (size) => {
  const padding = Math.floor(size * 0.15);
  const iconSize = size - (padding * 2);
  const strokeWidth = Math.max(2, Math.floor(size / 32));

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="${Math.floor(size * 0.2)}"/>
      <g transform="translate(${padding}, ${padding})">
        <path
          d="M ${iconSize * 0.5} ${iconSize * 0.1}
             L ${iconSize * 0.1} ${iconSize * 0.45}
             L ${iconSize * 0.25} ${iconSize * 0.45}
             L ${iconSize * 0.25} ${iconSize * 0.85}
             L ${iconSize * 0.75} ${iconSize * 0.85}
             L ${iconSize * 0.75} ${iconSize * 0.45}
             L ${iconSize * 0.9} ${iconSize * 0.45}
             Z"
          fill="${primaryColor}"
          stroke="${primaryColor}"
          stroke-width="${strokeWidth}"
          stroke-linejoin="round"
        />
        <rect
          x="${iconSize * 0.4}"
          y="${iconSize * 0.55}"
          width="${iconSize * 0.2}"
          height="${iconSize * 0.3}"
          fill="${backgroundColor}"
          rx="${iconSize * 0.02}"
        />
      </g>
    </svg>
  `;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  for (const size of sizes) {
    const svg = createHouseIcon(size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Also generate favicon
  const faviconSvg = createHouseIcon(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(iconsDir, '..', 'favicon.ico'));

  console.log('Generated favicon.ico');
  console.log('Done!');
}

generateIcons().catch(console.error);
