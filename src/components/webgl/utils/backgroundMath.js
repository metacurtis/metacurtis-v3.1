/**
 * Pure mathematical utilities for WebGL background rendering.
 * Extracted from WebGLBackground.jsx lines 29-187.
 */

export const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export const MORPH_TYPE_ENUM = Object.freeze({
  steady: 0,
  dissolve: 1,
  reform: 2,
});

export const morphTypeToInt = (value) => {
  if (Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(MORPH_TYPE_ENUM, normalized)) {
      return MORPH_TYPE_ENUM[normalized];
    }
  }
  return MORPH_TYPE_ENUM.steady;
};

export const mapBehaviorToMode = (behavior) => {
  if (!behavior) return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
  const b = String(behavior).toLowerCase();
  if (b.includes('drift') || b.includes('perlin')) {
    return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
  }
  if (b.includes('grid')) {
    return { mode: 1, params: [0.15, 0.02, 0.0, 0.0] };
  }
  if (b.includes('flow') || b.includes('laminar')) {
    return { mode: 2, params: [0.6, 0.3, 0.7, 0.0] };
  }
  if (b.includes('streak') || b.includes('trail')) {
    return { mode: 3, params: [1.2, 0.3, 0.0, 0.0] };
  }
  if (b.includes('orbit') || b.includes('arm')) {
    return { mode: 4, params: [0.9, 0.6, 0.2, 0.0] };
  }
  return { mode: 0, params: [0.4, 0.8, 1.2, 0.0] };
};

export const hexToRGBArray = (value) => {
  if (!value) return [1, 1, 1];
  if (Array.isArray(value) && value.length >= 3) {
    return [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0].map((c) =>
      Math.max(0, Math.min(1, c)),
    );
  }
  if (typeof value === 'object' && value !== null && 'r' in value && 'g' in value && 'b' in value) {
    return [value.r, value.g, value.b];
  }
  const normalized = String(value).replace('#', '').padEnd(6, '0');
  const r = parseInt(normalized.substring(0, 2), 16) / 255;
  const g = parseInt(normalized.substring(2, 4), 16) / 255;
  const b = parseInt(normalized.substring(4, 6), 16) / 255;
  return [r, g, b];
};

export const computeAABB = (geo, key) => {
  const attr = geo?.attributes?.[key];
  if (!attr?.array) return null;
  const arr = attr.array;
  if (!arr.length) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i];
    const y = arr[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (minX === Infinity || minY === Infinity) return null;
  return { extX: (maxX - minX) * 0.5, extY: (maxY - minY) * 0.5 };
};
