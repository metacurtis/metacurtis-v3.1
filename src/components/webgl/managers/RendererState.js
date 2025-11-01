/**
 * Renderer State Manager
 * Extracted from WebGLBackground.jsx (renderer clear-color handling).
 *
 * Responsibilities:
 * - Persist and restore WebGL clear color
 * - Reset renderer after QR mode or temporary overrides
 * - Provide helpers for explicit clear color control
 */

import * as THREE from 'three';

const noop = () => {};

export const createRendererState = ({
  renderer,
  onLog = noop,
}) => {
  if (!renderer) {
    return {
      restoreClearColor: noop,
      saveClearColor: noop,
      restoreSavedClearColor: noop,
      cleanupQrMode: noop,
      setClearColor: noop,
      getClearColor: () => null,
    };
  }

  let savedClearColor = null;
  let savedClearAlpha = null;

  const restoreClearColor = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      const bgColor = bodyStyle.backgroundColor;
      const color = new THREE.Color(bgColor || '#000000');
      renderer.setClearColor(color, 1.0);
      onLog('[RendererState] Clear color restored from CSS', bgColor);
    } catch (error) {
      console.error('[RendererState] Failed to restore clear color', error);
    }
  };

  const saveClearColor = () => {
    savedClearColor = renderer.getClearColor(new THREE.Color());
    savedClearAlpha = renderer.getClearAlpha();
    onLog('[RendererState] Clear color saved', {
      color: savedClearColor.getHexString(),
      alpha: savedClearAlpha,
    });
  };

  const restoreSavedClearColor = () => {
    if (!savedClearColor) return;
    renderer.setClearColor(savedClearColor, savedClearAlpha ?? 1);
    onLog('[RendererState] Clear color restored from save', {
      color: savedClearColor.getHexString(),
      alpha: savedClearAlpha,
    });
  };

  const cleanupQrMode = () => {
    restoreSavedClearColor();
    if (!savedClearColor) {
      restoreClearColor();
    }
    onLog('[RendererState] QR mode cleaned up');
  };

  const setClearColor = (color, alpha = 1.0) => {
    renderer.setClearColor(color, alpha);
    onLog('[RendererState] Clear color set', { color, alpha });
  };

  const getClearColor = () => ({
    color: renderer.getClearColor(new THREE.Color()),
    alpha: renderer.getClearAlpha(),
  });

  return {
    restoreClearColor,
    saveClearColor,
    restoreSavedClearColor,
    cleanupQrMode,
    setClearColor,
    getClearColor,
  };
};
