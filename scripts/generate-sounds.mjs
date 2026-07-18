/**
 * Generates short stock notification WAVs (≈3s) into public/sounds/.
 * Run: node scripts/generate-sounds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'sounds');
const SAMPLE_RATE = 44100;
const DURATION = 3;

function clamp(n, min = -1, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function writeWav(filePath, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i]);
    buf.writeInt16LE((s * 0x7fff) | 0, 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

function envelope(t, attack, release, total) {
  if (t < attack) return t / attack;
  if (t > total - release) return Math.max(0, (total - t) / release);
  return 1;
}

function makeSamples(fn) {
  const n = Math.floor(SAMPLE_RATE * DURATION);
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    samples[i] = fn(i / SAMPLE_RATE, i);
  }
  return samples;
}

/** Cricket-like chirps */
function cricket() {
  return makeSamples((t) => {
    let s = 0;
    for (let c = 0; c < 6; c++) {
      const start = 0.15 + c * 0.45;
      const local = t - start;
      if (local < 0 || local > 0.22) continue;
      const chirp = Math.sin(2 * Math.PI * (4200 + local * 900) * local);
      const buzz = Math.sin(2 * Math.PI * 55 * local);
      s += chirp * buzz * envelope(local, 0.01, 0.08, 0.22) * 0.35;
    }
    return s;
  });
}

/** Clean notification beep */
function beep() {
  return makeSamples((t) => {
    let s = 0;
    for (const [start, freq] of [
      [0.05, 880],
      [0.35, 1175],
      [0.65, 880],
    ]) {
      const local = t - start;
      if (local < 0 || local > 0.22) continue;
      s += Math.sin(2 * Math.PI * freq * local) * envelope(local, 0.01, 0.06, 0.22) * 0.4;
    }
    return s;
  });
}

fs.mkdirSync(OUT, { recursive: true });

const sounds = {
  cricket,
  beep,
  // meow.wav and alert.wav are real samples (not synthesized here).
};

for (const [name, fn] of Object.entries(sounds)) {
  const file = path.join(OUT, `${name}.wav`);
  writeWav(file, fn());
  console.log('wrote', file);
}

console.log('skipped meow.wav / alert.wav (external samples)');
