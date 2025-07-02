// src/utils/performance/DeviceCapabilities.js
// ✅ STABILITY ENHANCED: Singleton caching + Promise-based detection

/**
 * DeviceCapabilities
 *
 * ✅ ENHANCED: Cached utilities to detect GPU renderer info, memory availability,
 * device type (mobile vs. desktop), and screen characteristics.
 * 
 * Prevents multiple WebGL context creation and provides Promise-based caching
 * for consistent performance across components.
 */

// ✅ SINGLETON CACHING: Prevent multiple expensive WebGL detections
let deviceInfoCache = null;
let detectionPromise = null;
let detectionInProgress = false;

export default class DeviceCapabilities {
  /**
   * ✅ ENHANCED: Cached getInfo with Promise-based singleton pattern
   * 
   * Gathers and returns an object with:
   * - renderer: GPU renderer string (if available)
   * - vendor: GPU vendor string (if available)
   * - webglVersion: "WebGL2" | "WebGL1" | null
   * - deviceMemory: number of logical GB of RAM (Navigator API) or null
   * - coreCount: number of logical CPU cores (Navigator API) or null
   * - deviceType: "mobile" | "tablet" | "desktop"
   * - screen: { width, height, pixelRatio }
   * - recommendedQualityTier: Quality recommendation based on capabilities
   */
  static getInfo() {
    // Return cached result if available
    if (deviceInfoCache) {
      if (process.env.NODE_ENV === 'development') {
        console.log('DeviceCapabilities: Returning cached info.');
      }
      return deviceInfoCache;
    }
    
    // Return existing promise if detection in progress
    if (detectionPromise) {
      if (process.env.NODE_ENV === 'development') {
        console.log('DeviceCapabilities: Detection in progress, waiting...');
      }
      return detectionPromise;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('DeviceCapabilities: getInfo() called - performing detection.');
    }
    
    // Create detection promise for async coordination
    detectionPromise = new Promise((resolve) => {
      try {
        detectionInProgress = true;
        const info = this._performDetection();
        deviceInfoCache = info;
        detectionPromise = null;
        detectionInProgress = false;
        resolve(info);
      } catch (error) {
        console.error('DeviceCapabilities: Detection failed:', error);
        detectionPromise = null;
        detectionInProgress = false;
        // Return minimal fallback info
        const fallbackInfo = this._getFallbackInfo();
        deviceInfoCache = fallbackInfo;
        resolve(fallbackInfo);
      }
    });
    
    return detectionPromise;
  }

  /**
   * ✅ NEW: Actual detection logic separated for cleaner caching
   */
  static _performDetection() {
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
      recommendedQualityTier: null, // ✅ NEW: Quality recommendation
    };

    // ✅ ENHANCED: More comprehensive device type detection
    const ua = navigator.userAgent || '';
    if (/iPhone|iPod/.i.test(ua)) {
      info.deviceType = 'mobile';
    } else if (/iPad/.i.test(ua)) {
      info.deviceType = 'tablet';
    } else if (/Android.*Mobile/.i.test(ua)) {
      info.deviceType = 'mobile';
    } else if (/Android/.i.test(ua)) {
      info.deviceType = 'tablet';
    } else if (/Mobi|Windows Phone/.i.test(ua)) {
      info.deviceType = 'mobile';
    } else {
      // Fallback based on screen size for non-mobile user agents
      const minDimension = Math.min(window.screen.width, window.screen.height);
      const maxDimension = Math.max(window.screen.width, window.screen.height);
      
      if (minDimension < 768) {
        info.deviceType = 'mobile';
      } else if (minDimension < 1024 && maxDimension < 1366) {
        info.deviceType = 'tablet';
      } else {
        info.deviceType = 'desktop';
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('DeviceCapabilities: Detected deviceType:', info.deviceType);
    }

    // ✅ ENHANCED: WebGL detection with proper cleanup
    let gl = null;
    let canvas = null;
    
    try {
      canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      // Try WebGL2 first, then fallback to WebGL1
      gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) || 
           canvas.getContext('experimental-webgl2', { failIfMajorPerformanceCaveat: false });
      
      if (gl) {
        info.webglVersion = 'WebGL2';
      } else {
        gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) || 
             canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false });
        if (gl) {
          info.webglVersion = 'WebGL1';
        }
      }
    } catch (e) {
      console.warn('DeviceCapabilities: Error while getting WebGL context:', e);
    }

    if (gl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('DeviceCapabilities: WebGL context obtained, version:', info.webglVersion);
      }
      
      try {
        // Try to get unmasked vendor/renderer if extension is available
        const dbgExtension = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbgExtension) {
          info.vendor = gl.getParameter(dbgExtension.UNMASKED_VENDOR_WEBGL) || 'N/A';
          info.renderer = gl.getParameter(dbgExtension.UNMASKED_RENDERER_WEBGL) || 'N/A';
          
          if (process.env.NODE_ENV === 'development') {
            console.log(
              'DeviceCapabilities: Using WEBGL_debug_renderer_info - Vendor:',
              info.vendor,
              'Renderer:',
              info.renderer
            );
          }
        } else {
          // Fallback if the extension is not available
          info.vendor = gl.getParameter(gl.VENDOR) || 'N/A';
          info.renderer = gl.getParameter(gl.RENDERER) || 'N/A';
          
          if (process.env.NODE_ENV === 'development') {
            console.log(
              'DeviceCapabilities: Using standard VENDOR/RENDERER - Vendor:',
              info.vendor,
              'Renderer:',
              info.renderer
            );
          }
        }
      } catch (paramError) {
        console.warn('DeviceCapabilities: Error getting WebGL parameters:', paramError);
        info.vendor = 'N/A';
        info.renderer = 'N/A';
      }

      // ✅ ENHANCED: Proper WebGL context cleanup
      try {
        const loseContext = gl.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      } catch (cleanupError) {
        console.warn('DeviceCapabilities: Context cleanup warning:', cleanupError);
      }
    } else {
      console.warn('DeviceCapabilities: WebGL context not available.');
    }

    // ✅ ENHANCED: Canvas cleanup
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
      canvas = null;
    }

    // ✅ NEW: Quality tier recommendation based on capabilities
    info.recommendedQualityTier = this._calculateRecommendedQuality(info);

    if (process.env.NODE_ENV === 'development') {
      console.log('DeviceCapabilities: Detection complete:', {
        deviceType: info.deviceType,
        webglVersion: info.webglVersion,
        vendor: info.vendor?.substring(0, 30),
        renderer: info.renderer?.substring(0, 50),
        recommendedQuality: info.recommendedQualityTier,
        memory: info.deviceMemory,
        cores: info.coreCount,
      });
    }

    return info;
  }

  /**
   * ✅ NEW: Calculate recommended quality tier based on device capabilities
   */
  static _calculateRecommendedQuality(info) {
    let score = 0;

    // Device type scoring
    if (info.deviceType === 'desktop') score += 40;
    else if (info.deviceType === 'tablet') score += 20;
    else score += 10; // mobile

    // WebGL version scoring
    if (info.webglVersion === 'WebGL2') score += 30;
    else if (info.webglVersion === 'WebGL1') score += 15;

    // Memory scoring
    if (info.deviceMemory >= 8) score += 20;
    else if (info.deviceMemory >= 4) score += 10;
    else if (info.deviceMemory >= 2) score += 5;

    // Core count scoring
    if (info.coreCount >= 8) score += 10;
    else if (info.coreCount >= 4) score += 5;

    // GPU vendor scoring (basic heuristics)
    if (info.vendor && info.renderer) {
      const gpuInfo = (info.vendor + ' ' + info.renderer).toLowerCase();
      if (gpuInfo.includes('nvidia') || gpuInfo.includes('amd')) score += 15;
      else if (gpuInfo.includes('intel')) score += 5;
    }

    // Determine quality tier
    if (score >= 85) return 'ULTRA';
    else if (score >= 60) return 'HIGH';
    else if (score >= 35) return 'MEDIUM';
    else return 'LOW';
  }

  /**
   * ✅ NEW: Fallback info for error cases
   */
  static _getFallbackInfo() {
    return {
      renderer: 'N/A',
      vendor: 'N/A',
      webglVersion: null,
      deviceMemory: null,
      coreCount: typeof navigator.hardwareConcurrency !== 'undefined' ? navigator.hardwareConcurrency : null,
      deviceType: 'desktop', // Safe fallback
      screen: {
        width: window.screen.width || 1920,
        height: window.screen.height || 1080,
        pixelRatio: window.devicePixelRatio || 1,
      },
      recommendedQualityTier: 'MEDIUM', // Conservative fallback
    };
  }

  /**
   * ✅ NEW: Reset cache (useful for testing or development)
   */
  static clearCache() {
    if (process.env.NODE_ENV === 'development') {
      console.log('DeviceCapabilities: Clearing cache...');
      deviceInfoCache = null;
      detectionPromise = null;
      detectionInProgress = false;
    }
  }

  /**
   * ✅ NEW: Check if detection is cached
   */
  static isCached() {
    return !!deviceInfoCache;
  }

  /**
   * ✅ NEW: Get cache status for debugging
   */
  static getCacheStatus() {
    if (process.env.NODE_ENV === 'development') {
      return {
        cached: !!deviceInfoCache,
        inProgress: detectionInProgress,
        hasPromise: !!detectionPromise,
      };
    }
    return null;
  }
}

// ✅ NEW: Global development access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.DeviceCapabilities = DeviceCapabilities;
}