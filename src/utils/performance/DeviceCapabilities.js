// src/utils/performance/DeviceCapabilities.js
// Utilities to detect device GPU, memory, type, and screen properties for adaptive quality decisions

/**
 * Get GPU renderer and vendor information via WebGL extension
 * @returns {{vendor: string, renderer: string}}
 */
export function getGPUInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    return { vendor: 'unknown', renderer: 'unknown' };
  }

  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
  const renderer = ext
    ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
    : gl.getParameter(gl.RENDERER);

  return { vendor, renderer };
}

/**
 * Get approximate device memory in gigabytes (may be undefined if not supported)
 * @returns {number | undefined}
 */
export function getDeviceMemory() {
  // navigator.deviceMemory returns RAM in GB (Chrome-based browsers)
  return navigator.deviceMemory;
}

/**
 * Classify device type based on screen width
 * @returns {'mobile'|'tablet'|'desktop'}
 */
export function getDeviceType() {
  const width = window.screen.width;
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

/**
 * Get screen characteristics
 * @returns {{width: number, height: number, pixelRatio: number}}
 */
export function getScreenInfo() {
  return {
    width: window.screen.width,
    height: window.screen.height,
    pixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Aggregate device capabilities for easy consumption
 * @returns {Object}
 */
export function getDeviceCapabilities() {
  return {
    ...getGPUInfo(),
    memoryGB: getDeviceMemory(),
    type: getDeviceType(),
    screen: getScreenInfo(),
  };
}
