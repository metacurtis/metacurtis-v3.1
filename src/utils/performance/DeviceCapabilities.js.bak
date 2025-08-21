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
    console.log('DeviceCapabilities: getInfo() called.'); // Log when it's called
    const info = {
      renderer: null,
      vendor: null,
      webglVersion: null,
      // Ensure navigator.deviceMemory exists before trying to access it
      deviceMemory: typeof navigator.deviceMemory !== 'undefined' ? navigator.deviceMemory : null,
      coreCount:
        typeof navigator.hardwareConcurrency !== 'undefined' ? navigator.hardwareConcurrency : null,
      deviceType: null,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
      },
    };

    // Determine device type by user agent or screen size heuristic
    const ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)) {
      // Added 'i' for case-insensitive
      info.deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      // More specific check for tablets
      info.deviceType = 'tablet';
    } else {
      // Fallback based on screen size for non-mobile user agents
      // This is a heuristic and might not always be accurate
      if (Math.min(window.screen.width, window.screen.height) < 768) {
        info.deviceType = 'mobile'; // Or 'tablet' depending on your definition
      } else {
        info.deviceType = 'desktop';
      }
    }
    console.log('DeviceCapabilities: Detected deviceType:', info.deviceType);

    // Try WebGL2 first, then fallback to WebGL1
    let gl = null;
    try {
      const canvas = document.createElement('canvas');
      gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
      if (gl) {
        info.webglVersion = 'WebGL2';
      } else {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          info.webglVersion = 'WebGL1';
        }
      }
    } catch (e) {
      console.warn('DeviceCapabilities: Error while getting WebGL context:', e);
    }

    if (gl) {
      console.log('DeviceCapabilities: WebGL context obtained, version:', info.webglVersion);
      // Try to get unmasked vendor/renderer if extension is available
      const dbgExtension = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgExtension) {
        info.vendor = gl.getParameter(dbgExtension.UNMASKED_VENDOR_WEBGL) || 'N/A';
        info.renderer = gl.getParameter(dbgExtension.UNMASKED_RENDERER_WEBGL) || 'N/A';
        console.log(
          'DeviceCapabilities: Using WEBGL_debug_renderer_info - Vendor:',
          info.vendor,
          'Renderer:',
          info.renderer
        );
      } else {
        // Fallback if the extension is not available
        info.vendor = gl.getParameter(gl.VENDOR) || 'N/A';
        info.renderer = gl.getParameter(gl.RENDERER) || 'N/A';
        console.log(
          'DeviceCapabilities: Using standard VENDOR/RENDERER - Vendor:',
          info.vendor,
          'Renderer:',
          info.renderer
        );
      }
    } else {
      console.warn('DeviceCapabilities: WebGL context not available.');
    }

    // Clean up the temporary canvas
    // While `canvas` is local and should be GC'd, explicit cleanup is good if it held a context.
    // However, there's no direct 'dispose' for a 2D/WebGL canvas element itself,
    // and `gl.getExtension('WEBGL_lose_context')?.loseContext()` is more about forcing context loss.
    // For this static method, simply letting `canvas` go out of scope is usually fine.

    console.log('DeviceCapabilities: Gathered info:', info);
    return info;
  }
}
