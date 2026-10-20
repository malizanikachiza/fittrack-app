import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  // Create RGBA image buffer with scanline filters (filter byte = 0)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const rSafe = isMaskable ? width * 0.4 : width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient: Emerald to Cyan / Electric Green
      // dark athletic palette #0f172a background for full bleed maskable
      let r = 15, g = 23, b = 42, a = 255;

      // Circle badge
      if (dist <= rSafe) {
        // Inner gradient from emerald (16, 185, 129) to cyan (6, 182, 212)
        const t = (x + y) / (width + height);
        r = Math.round(16 * (1 - t) + 6 * t);
        g = Math.round(185 * (1 - t) + 182 * t);
        b = Math.round(129 * (1 - t) + 212 * t);
        a = 255;

        // Draw an electrocardiogram / pulse wave icon in white in center
        // Center normalized: nx from -1 to 1, ny from -1 to 1
        const nx = (x - cx) / (rSafe * 0.65);
        const ny = (y - cy) / (rSafe * 0.65);

        // ECG waveform function
        let ecgY = 0;
        if (nx >= -0.8 && nx < -0.4) {
          ecgY = 0;
        } else if (nx >= -0.4 && nx < -0.2) {
          ecgY = -0.25 * Math.sin(((nx + 0.4) / 0.2) * Math.PI); // P wave
        } else if (nx >= -0.2 && nx < -0.05) {
          ecgY = 0.15 * Math.sin(((nx + 0.2) / 0.15) * Math.PI); // Q dip
        } else if (nx >= -0.05 && nx < 0.1) {
          // Sharp R peak
          const tP = (nx + 0.05) / 0.15;
          ecgY = tP < 0.5 ? -1.2 * (tP * 2) : -1.2 * (2 - tP * 2);
        } else if (nx >= 0.1 && nx < 0.25) {
          ecgY = 0.3 * Math.sin(((nx - 0.1) / 0.15) * Math.PI); // S dip
        } else if (nx >= 0.25 && nx < 0.55) {
          ecgY = -0.35 * Math.sin(((nx - 0.25) / 0.3) * Math.PI); // T wave
        } else {
          ecgY = 0;
        }

        const waveDist = Math.abs(ny - ecgY);
        const thickness = 0.1;
        if (nx >= -0.85 && nx <= 0.85 && waveDist < thickness) {
          const alphaFade = Math.max(0, 1 - waveDist / thickness);
          r = Math.round(r * (1 - alphaFade) + 255 * alphaFade);
          g = Math.round(g * (1 - alphaFade) + 255 * alphaFade);
          b = Math.round(b * (1 - alphaFade) + 255 * alphaFade);
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per sample
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // standard filter
  ihdrData[12] = 0; // no interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />
  <circle cx="256" cy="256" r="180" fill="url(#circleGrad)" />
  <!-- Heartbeat ECG wave -->
  <path d="M 120 256 L 180 256 L 205 210 L 225 310 L 255 140 L 285 350 L 305 230 L 330 270 L 345 256 L 392 256"
        fill="none" stroke="#ffffff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// Generate PNGs
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64, 64, false));

console.log('Successfully generated all PWA icons in /public');
