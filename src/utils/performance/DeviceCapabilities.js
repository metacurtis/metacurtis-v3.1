// src/utils/performance/DeviceCapabilities.js

const DeviceCapabilities = {
  /**
   * Returns an object with information about the device and GPU.
   *
   * {
   *   cores: number | null,
   *   memory: number | null,           // in GB, if supported
   *   gpu: {
   *     vendor: string | null,
   *     renderer: string | null
   *   },
   *   isMobile: boolean,
   *   screen: {
   *     width: number,
   *     height: number
   *   },
   *   dpr: number
   * }
   */
  getInfo() {
    // 1) CPU & RAM
    const cores = navigator.hardwareConcurrency || null;
    const memory = navigator.deviceMemory || null;

    // 2) GPU Vendor/Renderer
    let vendor = null;
    let renderer = null;
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      if (gl) {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) {
          vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
          renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch {
      // Silent fallback
    }

    // 3) Mobile detection
    const ua = navigator.userAgent || '';
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(ua);

    // 4) Screen & DPR
    const screenWidth = window.screen?.width || window.innerWidth;
    const screenHeight = window.screen?.height || window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    return {
      cores,
      memory,
      gpu: { vendor, renderer },
      isMobile,
      screen: { width: screenWidth, height: screenHeight },
      dpr,
    };
  },
};

export default DeviceCapabilities;
