// src/components/webgl/QualityController.jsx
import { createContext, useContext } from 'react';
import usePerformanceStore from '@/stores/performanceStore';

// Define the shape of quality settings per tier
const presets = {
  ultra: { complexity: 1.0, textureResolution: 2048, geometryDetail: 1.0 },
  high: { complexity: 0.8, textureResolution: 1024, geometryDetail: 0.8 },
  medium: { complexity: 0.6, textureResolution: 512, geometryDetail: 0.6 },
  low: { complexity: 0.4, textureResolution: 256, geometryDetail: 0.4 },
};

// Create context
const QualityContext = createContext(presets.high);

/**
 * QualityProvider
 *
 * Wraps its children and supplies the current quality settings
 * based on the Zustand performance store's `quality` value.
 */
export function QualityProvider({ children }) {
  const quality = usePerformanceStore(state => state.quality);
  const settings = presets[quality] || presets.high;

  return <QualityContext.Provider value={settings}>{children}</QualityContext.Provider>;
}

/**
 * useQuality
 *
 * Hook for consuming components to read current quality settings:
 * { complexity, textureResolution, geometryDetail }
 */
export function useQuality() {
  return useContext(QualityContext);
}
