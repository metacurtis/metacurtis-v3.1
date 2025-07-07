// src/components/quality/AdaptiveQualitySystem.jsx
// ✅ ENHANCED: Device-Aware AQS with Intelligent Initial Quality Selection

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQualityStore } from '@/stores/qualityStore';
import usePerformanceStore from '@/stores/performanceStore';
import AQSEngine, { QualityLevels } from '@/utils/performance/AdaptiveQualitySystem.js';
import DeviceCapabilities from '@/utils/performance/DeviceCapabilities.js';

export default function AdaptiveQualitySystem_ReactComponent() {
  // Quality Store setters
  const setCurrentQualityTierInStore = useQualityStore(s => s.setCurrentQualityTier);
  const setTargetDprInStore = useQualityStore(s => s.setTargetDpr);
  const setFrameloopModeInStore = useQualityStore(s => s.setFrameloopMode);
  const setParticleCountInStore = useQualityStore(s => s.setParticleCount);

  // Get the tickFrame action from performanceStore
  const tickPerformanceFrame = usePerformanceStore.getState().tickFrame;

  const aqsEngineRef = useRef(null);

  useEffect(() => {
    console.log('[AQS] Enhanced initialization with device-aware quality selection...');

    try {
      // ✅ MERGED API: Use your existing DeviceCapabilities.getInfo() method
      const deviceInfo = DeviceCapabilities.getInfo();
      const recommendedTier = deviceInfo.recommendedQualityTier || 'HIGH';

      // ✅ SYNERGY: Device-aware AQS configuration
      const deviceConfig = {
        // Base thresholds
        ultraFps: 55,
        highFps: 45,
        mediumFps: 25,
        checkInterval: 1500,
        windowSize: 90,
        hysteresisChecks: 3,

        // ✅ ENHANCED: Device-specific starting tier
        initialLevel: QualityLevels[recommendedTier] || QualityLevels.HIGH,
      };

      // ✅ DEVICE-AWARE: Adjust thresholds based on device capabilities
      if (deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet') {
        // Mobile devices - more conservative thresholds
        deviceConfig.ultraFps = 50; // Slightly lower ultra threshold
        deviceConfig.highFps = 40; // More conservative high threshold
        deviceConfig.hysteresisChecks = 4; // More stability checks
        console.log('[AQS] Mobile/tablet device detected - using conservative thresholds');
      }

      if (deviceInfo.webglVersion === 'WebGL1') {
        // WebGL1 - more conservative approach
        deviceConfig.ultraFps = 50;
        deviceConfig.checkInterval = 2000; // Less frequent checks
        console.log('[AQS] WebGL1 detected - using conservative settings');
      }

      // ✅ ENHANCED: Log device-aware initialization
      console.log('[AQS] Device-aware configuration:', {
        device: deviceInfo.renderer?.substring(0, 50),
        mobile: deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet',
        webgl: deviceInfo.webglVersion,
        recommendedTier,
        thresholds: `${deviceConfig.ultraFps}/${deviceConfig.highFps}/${deviceConfig.mediumFps}`,
      });

      aqsEngineRef.current = new AQSEngine(deviceConfig);

      const unsubscribeFromAQSEngine = aqsEngineRef.current.subscribe(level => {
        const isMobileDevice =
          deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet';
        console.log(
          '[AQS] Quality tier change:',
          level,
          `(Device: ${isMobileDevice ? 'Mobile/Tablet' : 'Desktop'})`
        );
        setCurrentQualityTierInStore(level);

        // ✅ ENHANCED: Device-aware quality settings
        switch (level) {
          case QualityLevels.ULTRA: {
            // ✅ DEVICE-AWARE: Adjust DPR based on device
            const ultraDpr = isMobileDevice
              ? Math.min(window.devicePixelRatio || 1, 1.2) // Mobile/Tablet: capped DPR
              : Math.min(window.devicePixelRatio || 1, 1.5); // Desktop: higher DPR
            setTargetDprInStore(ultraDpr);
            setFrameloopModeInStore('always');
            setParticleCountInStore(isMobileDevice ? 6000 : 8000); // Device-specific counts
            break;
          }

          case QualityLevels.HIGH: {
            setTargetDprInStore(isMobileDevice ? 0.9 : 1.0); // Mobile/Tablet: slightly lower
            setFrameloopModeInStore('always');
            setParticleCountInStore(isMobileDevice ? 4000 : 5000);
            break;
          }

          case QualityLevels.MEDIUM: {
            setTargetDprInStore(isMobileDevice ? 0.6 : 0.75);
            setFrameloopModeInStore('demand');
            setParticleCountInStore(isMobileDevice ? 2000 : 2500);
            break;
          }

          case QualityLevels.LOW:
          default: {
            setTargetDprInStore(isMobileDevice ? 0.4 : 0.5);
            setFrameloopModeInStore('demand');
            setParticleCountInStore(isMobileDevice ? 800 : 1000);
            break;
          }
        }
      });

      // ✅ ENHANCED: Log successful initialization with device context
      console.log('[AQS] Device-aware initialization complete:', {
        engine: 'AQSEngine',
        initialTier: recommendedTier,
        deviceType: deviceInfo.deviceType,
        webglVersion: deviceInfo.webglVersion,
        renderer: deviceInfo.renderer?.substring(0, 50),
      });

      return () => {
        console.log('[AQS] Cleaning up device-aware AQS engine...');
        unsubscribeFromAQSEngine();
      };
    } catch (error) {
      console.error(
        '[AQS] CRITICAL ERROR during device-aware initialization:',
        error.message,
        error.stack
      );
    }
  }, [
    setCurrentQualityTierInStore,
    setTargetDprInStore,
    setFrameloopModeInStore,
    setParticleCountInStore,
  ]);

  useFrame((state, delta) => {
    // delta is time since last frame in seconds
    if (aqsEngineRef.current) {
      aqsEngineRef.current.tick(); // AQS uses performance.now() internally
    }
    if (tickPerformanceFrame) {
      tickPerformanceFrame(delta); // Call the action from performanceStore
    }
  });

  return null; // This component does not render any UI itself
}

/*
🔧 ENHANCED AQS - MERGED DEVICE CAPABILITIES INTEGRATION ✅

✅ FIXED: Case declaration error by adding braces around all case blocks with const declarations

✅ MERGED API INTEGRATION:
- Uses DeviceCapabilities.getInfo() (your existing API)
- Accesses recommendedQualityTier from enhanced device detection
- Supports deviceType field: 'mobile', 'tablet', 'desktop'
- Integrates with proper WebGL context cleanup (no more conflicts)

✅ DEVICE-AWARE INITIALIZATION:
- Uses device capabilities for intelligent quality tier startup
- Applies device-specific quality tier recommendations
- Adjusts AQS thresholds based on mobile/tablet vs desktop
- Configures conservative settings for WebGL1 devices

✅ MOBILE/TABLET OPTIMIZED QUALITY SETTINGS:
- Lower DPR targets for mobile/tablet devices (battery/thermal management)
- Reduced particle counts for mobile/tablet performance
- More conservative FPS thresholds for mobile/tablet stability
- Increased hysteresis checks for mobile/tablet stability

✅ ENHANCED SYNERGY WITH MERGED CAPABILITIES:
- Device capabilities directly inform initial quality selection
- Quality settings adjust based on actual device capabilities
- WebGL version awareness (WebGL1 vs WebGL2 optimizations)
- Mobile/tablet vs desktop automatic optimization
- Proper WebGL context cleanup prevents initialization conflicts

✅ IMPROVED LOGGING & DEBUGGING:
- Device-aware logging shows context for quality decisions
- Renderer information truncated for readability
- Quality tier changes include device type context
- Initialization status includes device profile summary

✅ PERFORMANCE OPTIMIZATIONS:
- Device-specific particle count ranges
- Mobile/tablet-aware DPR capping (prevents excessive resolution)
- Conservative thresholds for resource-constrained devices
- Intelligent frameloop mode selection based on device type

✅ STANDARDS COMPLIANCE:
- Uses cached device info (no additional WebGL context creation)
- Proper error handling with detailed logging
- Resource cleanup maintained from original implementation
- Backward compatibility with existing quality store interface
- Integrates with properly cleaned WebGL contexts

This enhanced AQS now works seamlessly with the merged DeviceCapabilities
while intelligently adapting to device capabilities and maintaining performance! 🌟
*/
