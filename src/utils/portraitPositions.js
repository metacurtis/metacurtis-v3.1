import QRCode from 'qrcode';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import SST from '@/config/sst-loader.js';
import portraitPointCloud from '@/assets/climax/portrait-pointcloud.json';

export const DEFAULT_QR_URL = 'https://curtiswhorton.com';
export const DEFAULT_QUIET_ZONE = 4;
export const DEFAULT_ERROR_CORRECTION = 'M';

/**
 * Resolve the canonical transcendence particle count from configuration.
 * Falls back to 15000 if Canonical/SST are not available or not yet initialized.
 */
function getCanonicalTranscendenceCount() {
  const canonicalCount =
    Canonical?.performance?.particleCount?.transcendence ??
    Canonical?.stages?.transcendence?.particleCount;
  if (Number.isFinite(canonicalCount)) {
    return canonicalCount;
  }

  const sstCount =
    SST?.performance?.particleCount?.transcendence ??
    SST?.stages?.transcendence?.particleCount;
  if (Number.isFinite(sstCount)) {
    return sstCount;
  }

  return 15000;
}

/**
 * Generate portrait positions (concentric circles)
 * @param {number} count - Number of particles (defaults to transcendence count from Canonical)
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...]
 */
function resamplePointCloud(points = [], count = 0) {
  const safeCount = Math.max(0, Math.floor(count));
  const out = new Float32Array(safeCount * 3);
  const baseCount = Math.floor(points.length / 3);
  if (safeCount === 0 || baseCount === 0) return out;

  const step = baseCount / safeCount;
  let cursor = 0;
  for (let i = 0; i < safeCount; i++) {
    const index = Math.min(baseCount - 1, Math.floor(cursor));
    const src = index * 3;
    const dst = i * 3;
    out[dst] = points[src];
    out[dst + 1] = points[src + 1];
    out[dst + 2] = points[src + 2];
    cursor += step;
  }
  return out;
}

export function generatePortraitPositions(count = getCanonicalTranscendenceCount()) {
  const basePoints = Array.isArray(portraitPointCloud?.points)
    ? portraitPointCloud.points
    : [];
  const safeCount = Math.max(0, Math.floor(count));
  const positions = resamplePointCloud(basePoints, safeCount);
  if (safeCount && import.meta?.env?.DEV) {
    console.debug('🎨 Using portrait point cloud asset', {
      requested: safeCount,
      baseCount: Math.floor(basePoints.length / 3),
    });
  }
  return positions;
}

/**
 * Generate QR code grid positions
 * @param {number} count - Number of particles (defaults to transcendence count from Canonical)
 * @param {string} url - URL to encode
 * @param {number} quietZone - Padding modules around QR (standard is 4)
 * @param {string} errorCorrectionLevel - 'L', 'M', 'Q', or 'H'
 * @param {object|null} metaOut - Optional object to receive QR metadata
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...], grid-aligned and centered
 */
export function generateQRPositions(
  count = getCanonicalTranscendenceCount(),
  url = DEFAULT_QR_URL,
  quietZone = DEFAULT_QUIET_ZONE,
  errorCorrectionLevel = DEFAULT_ERROR_CORRECTION,
  metaOut = null
) {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return new Float32Array(0);

  try {
    const qr = QRCode.create(url || DEFAULT_QR_URL, { errorCorrectionLevel });
    const size = qr?.modules?.size || 0;
    const data = qr?.modules?.data;
    if (!size || !data) throw new Error('QR modules missing data');

    let darkCount = 0;
    for (let i = 0; i < data.length; i += 1) {
      if (data[i]) darkCount += 1;
    }

    const maxPoints = Math.min(safeCount, darkCount);
    const positions = new Float32Array(maxPoints * 3);
    const span = size + quietZone * 2;
    const scale = span > 0 ? 1 / span : 1;

    let idx = 0;
    for (let row = 0; row < size && idx < maxPoints; row += 1) {
      for (let col = 0; col < size && idx < maxPoints; col += 1) {
        // Only place particles on dark modules
        if (!data[row * size + col]) continue;

        // Center grid; flip Y so top stays up
        const gx = (col + quietZone) - span / 2 + 0.5;
        const gy = (row + quietZone) - span / 2 + 0.5;

        positions[idx * 3] = gx * scale;
        positions[idx * 3 + 1] = -gy * scale;
        positions[idx * 3 + 2] = 0;
        idx += 1;
      }
    }

    if (metaOut && typeof metaOut === 'object') {
      metaOut.moduleCount = size;
      metaOut.quietZone = quietZone;
      metaOut.darkModules = darkCount;
      metaOut.version = qr?.version ?? null;
    }

    return idx === maxPoints ? positions : positions.subarray(0, idx * 3);
  } catch (err) {
    console.error('[QR] Failed to generate QR positions:', err);
    return new Float32Array(0);
  }
}

/**
 * Generate QR positions with multiple particles per module for a denser appearance.
 * @param {number} count - Target particle count
 * @param {string} url - URL to encode
 * @param {number} particlesPerModule - Particles to place per dark module
 * @param {number} jitter - Random offset within module (0 = grid perfect, 0.5 = full module)
 * @param {number} quietZone - Padding modules around QR (standard is 4)
 * @param {string} errorCorrectionLevel - 'L', 'M', 'Q', or 'H'
 * @param {object|null} metaOut - Optional object to receive QR metadata
 * @returns {Float32Array}
 */
export function generateDenseQRPositions(
  count = getCanonicalTranscendenceCount(),
  url = DEFAULT_QR_URL,
  particlesPerModule = 4,
  jitter = 0.2,
  quietZone = DEFAULT_QUIET_ZONE,
  errorCorrectionLevel = DEFAULT_ERROR_CORRECTION,
  metaOut = null
) {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) return new Float32Array(0);

  const ppm = Math.max(1, Math.floor(particlesPerModule));

  try {
    const qr = QRCode.create(url || DEFAULT_QR_URL, { errorCorrectionLevel });
    const size = qr?.modules?.size || 0;
    const data = qr?.modules?.data;
    if (!size || !data) throw new Error('QR modules missing data');

    let darkCount = 0;
    for (let i = 0; i < data.length; i += 1) {
      if (data[i]) darkCount += 1;
    }

    const maxPoints = Math.min(safeCount, darkCount * ppm);
    const positions = new Float32Array(maxPoints * 3);
    const span = size + quietZone * 2;
    const scale = span > 0 ? 1 / span : 1;
    const moduleSize = scale;

    let idx = 0;
    for (let row = 0; row < size && idx < maxPoints; row += 1) {
      for (let col = 0; col < size && idx < maxPoints; col += 1) {
        if (!data[row * size + col]) continue;

        const baseX = (col + quietZone) - span / 2 + 0.5;
        const baseY = (row + quietZone) - span / 2 + 0.5;

        for (let p = 0; p < ppm && idx < maxPoints; p += 1) {
          const jx = (Math.random() - 0.5) * jitter * moduleSize;
          const jy = (Math.random() - 0.5) * jitter * moduleSize;

          positions[idx * 3] = (baseX * scale) + jx;
          positions[idx * 3 + 1] = -(baseY * scale) + jy;
          positions[idx * 3 + 2] = 0;
          idx += 1;
        }
      }
    }

    if (metaOut && typeof metaOut === 'object') {
      metaOut.moduleCount = size;
      metaOut.quietZone = quietZone;
      metaOut.darkModules = darkCount;
      metaOut.version = qr?.version ?? null;
      metaOut.particlesPerModule = ppm;
      metaOut.jitter = jitter;
    }

    return positions.subarray(0, idx * 3);
  } catch (err) {
    console.error('[QR] Failed to generate dense QR positions:', err);
    return new Float32Array(0);
  }
}

/**
 * Generate scattered positions
 * @param {number} count - Number of particles (defaults to transcendence count from Canonical)
 * @param {object|null} spread - Spread parameters {x, y, z} or null for defaults
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...]
 */
export function generateScatterPositions(count = getCanonicalTranscendenceCount(), spread = null) {
  const safeCount = Math.max(0, Math.floor(count));
  const positions = new Float32Array(safeCount * 3);
  if (safeCount === 0) return positions;

  const sx = spread?.x ?? 20;
  const sy = spread?.y ?? 20;
  const sz = spread?.z ?? 5;

  console.log('🔬 generateScatterPositions called', {
    count: safeCount,
    spreadX: sx,
    spreadY: sy,
    spreadZ: sz,
  });

  for (let i = 0; i < safeCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * sx;
    positions[i * 3 + 1] = (Math.random() - 0.5) * sy;
    positions[i * 3 + 2] = (Math.random() - 0.5) * sz;
  }

  console.log('🎨 Generated scatter positions', {
    count: safeCount,
    spread: { sx, sy, sz },
  });
  return positions;
}
