import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import SST from '@/config/sst-loader.js';
import portraitPointCloud from '@/assets/climax/portrait-pointcloud.json';
import qrPointCloud from '@/assets/climax/qr-curtis.json';

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
 * @param {number} size - Grid size (e.g., 50 = 50×50 grid)
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...]
 */
export function generateQRPositions(count = getCanonicalTranscendenceCount()) {
  const basePoints = Array.isArray(qrPointCloud?.points) ? qrPointCloud.points : [];
  const safeCount = Math.max(0, Math.floor(count));
  const positions = resamplePointCloud(basePoints, safeCount);
  if (safeCount && import.meta?.env?.DEV) {
    console.debug('🎨 Using QR point cloud asset', {
      requested: safeCount,
      baseCount: Math.floor(basePoints.length / 3),
    });
  }
  return positions;
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
