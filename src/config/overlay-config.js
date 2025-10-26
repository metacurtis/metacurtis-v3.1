import SST from '@/config/sst-loader.js';

const DEFAULT_CONFIG = {
  typewriterSpeedMs: 50,
  graceWindowMs: 800,
  deduplication: {
    enabled: true,
    thresholdMs: 100,
  },
  style: {
    background: 'rgba(0, 0, 0, 0.65)',
    color: '#fff',
    fontSize: 16,
    lineHeight: 1.45,
    padding: '12px 18px',
    borderRadius: 10,
    maxWidth: 960,
    zIndex: 1000,
  },
  animation: {
    fadeInDurationMs: 300,
    fadeOutDurationMs: 500,
  },
};

/**
 * Load overlay configuration from SST with fallback
 * @returns {typeof DEFAULT_CONFIG}
 */
export function loadOverlayConfig() {
  try {
    // Debug: Log what SST contains
    console.log('[OverlayConfig] SST object:', {
      exists: !!SST,
      hasNarrative: !!SST?.narrative,
      hasOverlay: !!SST?.narrative?.overlay,
      sstKeys: SST ? Object.keys(SST) : [],
    });

    const config = SST?.narrative?.overlay;

    if (!config) {
      console.warn('[OverlayConfig] No SST narrative.overlay config found, using defaults');
      console.warn('[OverlayConfig] SST structure:', SST);
      return DEFAULT_CONFIG;
    }

    console.log('[OverlayConfig] ✅ Loaded config from SST:', config);

    return {
      ...DEFAULT_CONFIG,
      ...config,
      deduplication: {
        ...DEFAULT_CONFIG.deduplication,
        ...(config.deduplication || {}),
      },
      style: {
        ...DEFAULT_CONFIG.style,
        ...(config.style || {}),
      },
      animation: {
        ...DEFAULT_CONFIG.animation,
        ...(config.animation || {}),
      },
    };
  } catch (error) {
    console.error('[OverlayConfig] Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

export default DEFAULT_CONFIG;
