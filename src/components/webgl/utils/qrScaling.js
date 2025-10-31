/**
 * QR code position autoscaling utilities.
 * Extracted from WebGLBackground.jsx lines 137-151.
 */

export const DEFAULT_QR_AUTO_SCALE_TARGET = 0.06;

export const autoscaleQrPositions = (positions, targetNdc = DEFAULT_QR_AUTO_SCALE_TARGET) => {
  if (!(positions instanceof Float32Array) || positions.length < 3) return positions;
  let maxAbs = 0.000001;
  for (let i = 0; i < positions.length; i += 3) {
    const ax = Math.abs(positions[i]);
    const ay = Math.abs(positions[i + 1]);
    if (ax > maxAbs) maxAbs = ax;
    if (ay > maxAbs) maxAbs = ay;
  }
  if (!Number.isFinite(maxAbs) || maxAbs <= 0) return positions;
  const scale = targetNdc / maxAbs;
  if (!Number.isFinite(scale) || scale <= 0 || scale === 1) return positions;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] *= scale;
    positions[i + 1] *= scale;
  }
  return positions;
};
