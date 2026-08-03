// Rasteriza icons/icon.svg → icon16/48/128.png (fondo transparente).
// Uso: FORCE_GEN_ICONS=1 npm run gen:icons   (o via apply-new-logo.mjs)
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fullSvg = readFileSync(resolve(root, 'icons/icon.svg'));

for (const size of [16, 48, 128]) {
  const out = resolve(root, `icons/icon${size}.png`);
  await sharp(fullSvg, { density: 600 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  console.log(`✓ icons/icon${size}.png`);
}
