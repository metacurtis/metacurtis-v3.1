// src/components/webgl/QualityController.jsx

import { createContext, useContext } from 'react';
import usePerformanceStore from '@/stores/performanceStore.js';
import presets from '@/config/qualityPresets.js';

// Create a React context whose default value is the “high” preset
const QualityContext = createContext(presets.high);

/**
 * QualityProvider
 *
 * Wraps its children and supplies the current quality settings
 * based on the Zustand performance store's `quality` value.
 */
export function QualityProvider({ children }) {
  // Read the current quality level from your performance store
  const quality = usePerformanceStore(state => state.quality);
  // Look up the corresponding settings from your centralized presets
  const settings = presets[quality] || presets.high;
  return <QualityContext.Provider value={settings}>{children}</QualityContext.Provider>;
}

/**
 * useQuality
 *
 * Hook for consuming components to read current quality settings:
 * { dprMin, dprMax, antialias, shaderComplexity, textureResolution, geometryDetailScale }
 */
export function useQuality() {
  return useContext(QualityContext);
}
