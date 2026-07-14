// Genera los PNG del icono de la extensión a partir de icons/icon.svg.
// Uso: npm run gen:icons
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'icons/icon.svg'));
const sizes = [16, 48, 128];

for (const size of sizes) {
  const out = resolve(root, `icons/icon${size}.png`);
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(`✓ icons/icon${size}.png`);
}
