#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

function createSeededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function random() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967295;
  };
}

function sampleEllipse({ cx, cy, rx, ry, count, zRange, rng }) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = Math.sqrt(rng());
    const x = cx + Math.cos(angle) * rx * radius;
    const y = cy + Math.sin(angle) * ry * radius;
    const z = (rng() - 0.5) * zRange;
    points.push(x, y, z);
  }
  return points;
}

function sampleArc({ cx, cy, radius, start, end, count, thickness, zRange, rng }) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const t = start + (end - start) * rng();
    const r = radius + (rng() - 0.5) * thickness;
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    const z = (rng() - 0.5) * zRange;
    points.push(x, y, z);
  }
  return points;
}

function buildPortraitPointCloud() {
  const rng = createSeededRandom('portrait-cloud-v1');
  const points = [];

  points.push(
    ...sampleEllipse({ cx: 0, cy: 2.5, rx: 5.2, ry: 6.4, count: 3800, zRange: 0.6, rng }),
    ...sampleEllipse({ cx: 0, cy: -1.5, rx: 6.0, ry: 3.8, count: 1200, zRange: 0.6, rng }),
    ...sampleEllipse({ cx: -1.6, cy: 3.6, rx: 1.2, ry: 0.8, count: 320, zRange: 0.25, rng }),
    ...sampleEllipse({ cx: 1.6, cy: 3.6, rx: 1.2, ry: 0.8, count: 320, zRange: 0.25, rng }),
    ...sampleEllipse({ cx: -1.6, cy: 3.6, rx: 0.45, ry: 0.32, count: 160, zRange: 0.18, rng }),
    ...sampleEllipse({ cx: 1.6, cy: 3.6, rx: 0.45, ry: 0.32, count: 160, zRange: 0.18, rng }),
    ...sampleEllipse({ cx: 0, cy: 1.6, rx: 0.6, ry: 1.2, count: 220, zRange: 0.2, rng }),
    ...sampleArc({ cx: 0, cy: 0.6, radius: 2.2, start: Math.PI * 0.1, end: Math.PI * 0.9, count: 420, thickness: 0.3, zRange: 0.25, rng }),
    ...sampleEllipse({ cx: -3.4, cy: -3.5, rx: 2.2, ry: 1.2, count: 280, zRange: 0.4, rng }),
    ...sampleEllipse({ cx: 3.4, cy: -3.5, rx: 2.2, ry: 1.2, count: 280, zRange: 0.4, rng })
  );

  const scale = 0.18;
  for (let i = 0; i < points.length; i += 3) {
    points[i] *= scale;
    points[i + 1] *= scale;
    points[i + 2] *= scale * 0.8;
  }

  return {
    points: points.map((value) => Number(value.toFixed(4))),
  };
}

function buildQrPointCloud(url) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'Q' });
  const modules = qr.modules;
  const size = modules.size;
  const data = modules.data;
  const points = [];
  const rng = createSeededRandom('qr-cloud-v1');

  const moduleSize = 0.06;
  const half = (size * moduleSize) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      if (!data[idx]) continue;
      const cx = x * moduleSize - half + moduleSize / 2;
      const cy = (size - 1 - y) * moduleSize - half + moduleSize / 2;
      for (let s = 0; s < 5; s++) {
        const jitterX = (rng() - 0.5) * moduleSize * 0.6;
        const jitterY = (rng() - 0.5) * moduleSize * 0.6;
        const jitterZ = (rng() - 0.5) * moduleSize * 0.15;
        points.push(
          Number((cx + jitterX).toFixed(4)),
          Number((cy + jitterY).toFixed(4)),
          Number(jitterZ.toFixed(4))
        );
      }
    }
  }

  return {
    size,
    moduleSize,
    points,
  };
}

function writeJson(relativePath, data) {
  const outputPath = path.resolve(process.cwd(), relativePath);
  fs.writeFileSync(outputPath, `${JSON.stringify(data)}\n`, 'utf8');
  console.log(`✅ Wrote ${relativePath} (${data.points.length / 3} points)`);
}

(function main() {
  const portrait = buildPortraitPointCloud();
  const qr = buildQrPointCloud('https://curtisworton.com');

  writeJson('src/assets/climax/portrait-pointcloud.json', portrait);
  writeJson('src/assets/climax/qr-curtis.json', qr);
})();

