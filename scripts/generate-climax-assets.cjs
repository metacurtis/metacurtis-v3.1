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

async function buildQrPointCloud(url, opts = {}) {
  const ecc = opts.ecc || 'H';
  const quietZone = Number.isFinite(opts.quietZone) ? opts.quietZone : 4;
  const samplesPerModule = Number.isFinite(opts.samplesPerModule) ? Math.max(1, opts.samplesPerModule) : 6;
  const scale = Number.isFinite(opts.scale) ? opts.scale : 1;

  const qr = QRCode.create(url, { errorCorrectionLevel: ecc });
  const modules = qr.modules;
  const size = modules.size;

  const totalModules = size + quietZone * 2;
  const data = modules.data;
  const jitterRng = createSeededRandom('qr-cloud-v2');

  const positions = [];
  const halfSpan = totalModules * scale * 0.5 || 1;

  const isBlack = (row, col) => {
    if (row < quietZone || col < quietZone) return false;
    if (row >= quietZone + size || col >= quietZone + size) return false;
    const baseRow = row - quietZone;
    const baseCol = col - quietZone;
    const idx = baseRow * size + baseCol;
    return data[idx] === 1;
  };

  for (let r = 0; r < totalModules; r += 1) {
    for (let c = 0; c < totalModules; c += 1) {
      if (!isBlack(r, c)) continue;
      for (let s = 0; s < samplesPerModule; s += 1) {
        const jitter = scale * 0.45;
        const px = (c + 0.5) * scale - halfSpan + (jitterRng() - 0.5) * jitter;
        const py = (r + 0.5) * scale - halfSpan + (jitterRng() - 0.5) * jitter;
        const pz = (jitterRng() - 0.5) * scale * 0.1;
        positions.push([
          Number((px / halfSpan).toFixed(5)),
          Number((-(py) / halfSpan).toFixed(5)),
          Number(pz.toFixed(5)),
        ]);
      }
    }
  }

  const minZ = positions.length ? Math.min(...positions.map((p) => p[2])) : 0;
  const maxZ = positions.length ? Math.max(...positions.map((p) => p[2])) : 0;

  return {
    type: 'qrPointCloud',
    url,
    ecc,
    quietZone,
    moduleCount: size,
    totalModules,
    samplesPerModule,
    normalized: true,
    positions,
    bounds: {
      min: [-1, -1, minZ],
      max: [1, 1, maxZ],
    },
  };
}

function writeJson(relativePath, data) {
  const outputPath = path.resolve(process.cwd(), relativePath);
  fs.writeFileSync(outputPath, `${JSON.stringify(data)}\n`, 'utf8');
  const count = Array.isArray(data.positions) ? data.positions.length : (Array.isArray(data.points) ? data.points.length / 3 : 0);
  console.log(`✅ Wrote ${relativePath} (${count} samples)`);
}

(async function main() {
  const portrait = buildPortraitPointCloud();
  const qr = await buildQrPointCloud('https://curtisworton.com/contact', { ecc: 'H', quietZone: 4, samplesPerModule: 6, scale: 1 });

  writeJson('src/assets/climax/portrait-pointcloud.json', portrait);
  writeJson('src/assets/climax/qr-curtis.json', qr);
})().catch((error) => {
  console.error('❌ Failed to generate climax assets', error);
  process.exitCode = 1;
});
