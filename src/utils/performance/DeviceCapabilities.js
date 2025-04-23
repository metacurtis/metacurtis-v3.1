// src/utils/performance/DeviceCapabilities.js

/**
 * DeviceCapabilities
 *
 * Utilities to detect GPU renderer info, memory availability,
 * device type (mobile vs. desktop), and screen characteristics.
 */
export default class DeviceCapabilities {
  /**
   * Gathers and returns an object with:
   * - renderer: GPU renderer string (if available)
   * - vendor:   GPU vendor string (if available)
   * - webglVersion: "WebGL2" | "WebGL1" | null
   * - deviceMemory: number of logical GB of RAM (Navigator API) or null
   * - coreCount: number of logical CPU cores (Navigator API) or null
   * - deviceType: "mobile" | "desktop"
   * - screen: { width, height, pixelRatio }
   */
  static getInfo() {
    const info = {
      renderer: null,
      vendor: null,
      webglVersion: null,
      deviceMemory: navigator.deviceMemory || null,
      coreCount: navigator.hardwareConcurrency || null,
      deviceType: null,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      },
    };

    // Determine device type by user agent or screen size heuristic
    const ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/.test(ua)) {
      info.deviceType = 'mobile';
    } else {
      info.deviceType = 'desktop';
    }

    // Try WebGL2 first, then fallback to WebGL1
    const canvas = document.createElement('canvas');
    let gl = canvas.getContext('webgl2');
    if (gl) {
      info.webglVersion = 'WebGL2';
    } else {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        info.webglVersion = 'WebGL1';
      }
    }

    if (gl) {
      // Try to get unmasked vendor/renderer if extension is available
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        info.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        info.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      } else {
        info.vendor = gl.getParameter(gl.VENDOR);
        info.renderer = gl.getParameter(gl.RENDERER);
      }
    }

    return info;
  }
}
