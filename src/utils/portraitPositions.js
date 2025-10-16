// Import Canonical authority if available
// Note: This file may be called before Canonical is fully initialized,
// so we safely access it via window and provide fallbacks

/**
 * Get canonical particle count for transcendence stage
 * Falls back to 15000 if Canonical not available
 */
function getCanonicalTranscendenceCount() {
  if (typeof window !== 'undefined' && window.Canonical) {
    const transcendenceCount =
      window.Canonical?.performance?.particleCount?.transcendence ||
      window.Canonical?.stages?.transcendence?.particleCount;

    if (Number.isFinite(transcendenceCount)) {
      return transcendenceCount;
    }
  }

  if (typeof window !== 'undefined' && window.SST) {
    const transcendenceCount =
      window.SST?.performance?.particleCount?.transcendence ||
      window.SST?.stages?.transcendence?.particleCount;

    if (Number.isFinite(transcendenceCount)) {
      return transcendenceCount;
    }
  }

  return 15000;
}

/**
 * Generate portrait positions (concentric circles)
 * @param {number} count - Number of particles (defaults to transcendence count from Canonical)
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...]
 */
export function generatePortraitPositions(count = getCanonicalTranscendenceCount()) {
  const safeCount = Math.max(0, Math.floor(count));
  const positions = new Float32Array(safeCount * 3);

  if (safeCount === 0) return positions;

  const layers = Math.max(1, Math.min(6, Math.round(Math.sqrt(safeCount / 1500))));
  const particlesPerLayer = Math.max(1, Math.floor(safeCount / layers));

  for (let i = 0; i < safeCount; i++) {
    const layer = Math.min(layers - 1, Math.floor(i / particlesPerLayer));
    const layerRatio = layers > 1 ? layer / (layers - 1) : 0;
    const radius = 2.5 + layerRatio * 2.0 + (Math.random() - 0.5) * 0.25;
    const angle = ((i % particlesPerLayer) / particlesPerLayer) * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (Math.random() - 0.5) * 0.75;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  console.log('🎨 Generated portrait positions (placeholder concentric circles)', { count: safeCount });
  return positions;
}

/**
 * Generate QR code grid positions
 * @param {number} count - Number of particles (defaults to transcendence count from Canonical)
 * @param {number} size - Grid size (e.g., 50 = 50×50 grid)
 * @returns {Float32Array} Position data [x,y,z,x,y,z,...]
 */
export function generateQRPositions(count = getCanonicalTranscendenceCount(), size = 50) {
  const safeCount = Math.max(0, Math.floor(count));
  const positions = new Float32Array(safeCount * 3);
  if (safeCount === 0) return positions;

  const gridSize = size;
  const cellSize = 0.16;
  const usable = Math.min(safeCount, gridSize * gridSize);

  for (let i = 0; i < usable; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    positions[i * 3] = (col - gridSize / 2) * cellSize;
    positions[i * 3 + 1] = (row - gridSize / 2) * cellSize;
    positions[i * 3 + 2] = 0;
  }

  for (let i = usable; i < safeCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * gridSize * cellSize;
    positions[i * 3 + 1] = (Math.random() - 0.5) * gridSize * cellSize;
    positions[i * 3 + 2] = (Math.random() - 0.5) * cellSize * 4;
  }

  console.log('🎨 Generated QR code positions (placeholder grid)', {
    count: safeCount,
    usable,
    gridSize,
  });
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
