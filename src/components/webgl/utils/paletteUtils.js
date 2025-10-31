/**
 * Color palette and material uniform utilities.
 * Extracted from WebGLBackground.jsx lines 660-698.
 */

import { hexToRGBArray } from './backgroundMath.js';

export const applyMetadataColors = (material, colors, fallbackPalette) => {
  const fallback =
    Array.isArray(fallbackPalette) && fallbackPalette.length >= 3
      ? fallbackPalette.slice(0, 3)
      : null;
  const palette =
    Array.isArray(colors) && colors.length >= 3
      ? colors
      : fallback;
  if (!palette) return;

  const uniforms = material?.uniforms;
  if (!uniforms) return;

  const assign = (uniform, value) => {
    if (!uniform) return;
    const target = uniform.value ?? uniform;
    if (
      Array.isArray(value) &&
      value.length >= 3 &&
      value.every((v) => typeof v === 'number')
    ) {
      if (target?.setRGB) {
        target.setRGB(value[0], value[1], value[2]);
        return;
      }
    }
    if (target?.set) target.set(value);
    else uniform.value = value;
  };

  assign(uniforms.uColorCurrent, palette[0]);
  assign(uniforms.uColorNext, palette[1] ?? palette[0]);
  assign(uniforms.uColorAccent1, palette[2] ?? palette[0]);

  if (uniforms.uPalette0?.value?.set) {
    uniforms.uPalette0.value.set(hexToRGBArray(palette[0]));
    uniforms.uPalette0.needsUpdate = true;
  }
  if (uniforms.uPalette1?.value?.set) {
    uniforms.uPalette1.value.set(hexToRGBArray(palette[1] ?? palette[0]));
    uniforms.uPalette1.needsUpdate = true;
  }
  if (uniforms.uPalette2?.value?.set) {
    uniforms.uPalette2.value.set(hexToRGBArray(palette[2] ?? palette[0]));
    uniforms.uPalette2.needsUpdate = true;
  }
  if (uniforms.uPalette3?.value?.set) {
    uniforms.uPalette3.value.set(hexToRGBArray(palette[3] ?? palette[0]));
    uniforms.uPalette3.needsUpdate = true;
  }

  if (material) {
    material.uniformsNeedUpdate = true;
  }
};
