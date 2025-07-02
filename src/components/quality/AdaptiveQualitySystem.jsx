// src/components/quality/AdaptiveQualitySystem.jsx
// ✅ STABILITY ENHANCED: Frame-synchronized sampling + device-aware initialization

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
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initializationRef.current) {
      console.log('[AQS] Initialization already completed, skipping...');
      return;
    }

    console.log('[AQS] Enhanced initialization with device-aware quality selection...');

    try {
      // ✅ ENHANCED: Use cached device capabilities
      const deviceInfo = DeviceCapabilities.getInfo();
      const recommendedTier = deviceInfo.recommendedQualityTier || 'HIGH';

      // ✅ ENHANCED: Device-aware AQS configuration with stability focus
      const deviceConfig = {
        // Base thresholds
        ultraFps: 55,
        highFps: 45,
        mediumFps: 25,
        checkInterval: 1500,
        windowSize: 90,
        hysteresisChecks: 4,        // ✅ ENHANCED: Increased stability
        quietPeriodMs: 300,         // ✅ NEW: Quiet period between changes

        // ✅ ENHANCED: Device-specific starting tier
        initialLevel: QualityLevels[recommendedTier] || QualityLevels.HIGH,
      };

      // ✅ DEVICE-AWARE: Adjust thresholds based on device capabilities
      if (deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet') {
        // Mobile devices - more conservative thresholds
        deviceConfig.ultraFps = 50;          // Slightly lower ultra threshold
        deviceConfig.highFps = 40;           // More conservative high threshold
        deviceConfig.hysteresisChecks = 5;   // Even more stability checks
        deviceConfig.quietPeriodMs = 500;    // Longer quiet period
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[AQS] Mobile/tablet device detected - using conservative thresholds');
        }
      }

      if (deviceInfo.webglVersion === 'WebGL1') {
        // WebGL1 - more conservative approach
        deviceConfig.ultraFps = 50;
        deviceConfig.checkInterval = 2000;   // Less frequent checks
        deviceConfig.hysteresisChecks = 5;   // More stability
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[AQS] WebGL1 detected - using conservative settings');
        }
      }

      // ✅ ENHANCED: Log device-aware initialization
      if (process.env.NODE_ENV === 'development') {
        console.log('[AQS] Device-aware configuration:', {
          device: deviceInfo.renderer?.substring(0, 50),
          mobile: deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet',
          webgl: deviceInfo.webglVersion,
          recommendedTier,
          thresholds: `${deviceConfig.ultraFps}/${deviceConfig.highFps}/${deviceConfig.mediumFps}`,
          stability: `${deviceConfig.hysteresisChecks} checks, ${deviceConfig.quietPeriodMs}ms quiet`,
        });
      }

      // ✅ ENHANCED: Create engine with stability configuration
      aqsEngineRef.current = new AQSEngine(deviceConfig);

      const unsubscribeFromAQSEngine = aqsEngineRef.current.subscribe(level => {
        const isMobileDevice =
          deviceInfo.deviceType === 'mobile' || deviceInfo.deviceType === 'tablet';
        
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[AQS] Quality tier change:',
            level,
            `(Device: ${isMobileDevice ? 'Mobile/Tablet' : 'Desktop'})`
          );
        }
        
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
      if (process.env.NODE_ENV === 'development') {
        console.log('[AQS] Device-aware initialization complete:', {
          engine: 'AQSEngine (Enhanced)',
          initialTier: recommendedTier,
          deviceType: deviceInfo.deviceType,
          webglVersion: deviceInfo.webglVersion,
          renderer: deviceInfo.renderer?.substring(0, 50),
          stability: 'Enhanced hysteresis + quiet period',
        });
      }

      initializationRef.current = true;

      return () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AQS] Cleaning up enhanced AQS engine...');
        }
        unsubscribeFromAQSEngine();
        initializationRef.current = false;
      };
    } catch (error) {
      console.error(
        '[AQS] CRITICAL ERROR during enhanced initialization:',
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

  // ✅ ENHANCED: Frame-synchronized sampling
  useFrame((state, delta) => {
    // Use the new frame-based sampling method
    if (aqsEngineRef.current) {
      aqsEngineRef.current.tickFrame(delta); // ✅ NEW: Pass actual frame delta
    }
    
    // Update performance store
    if (tickPerformanceFrame) {
      tickPerformanceFrame(delta);
    }
  });

  // ✅ NEW: Global development access
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      window.aqsEngine = aqsEngineRef.current;
      window.aqsDebug = {
        getInfo: () => aqsEngineRef.current?.getDebugInfo(),
        setTier: (tier) => aqsEngineRef.current?.setTier(tier),
        getAvailableTiers: () => Object.values(QualityLevels),
      };
    }
  }, []);

  return null; // This component does not render any UI itself
}

/*
🔧 ENHANCED AQS COMPONENT - STABILITY + FRAME SYNCHRONIZATION ✅

✅ STABILITY ENHANCEMENTS:
- Frame-synchronized sampling via tickFrame(delta) instead of independent timer
- Enhanced hysteresis with increased checks and quiet periods
- Device-aware stability configurations (mobile = more conservative)
- Initialization guard to prevent double-mounting issues

✅ PERFORMANCE OPTIMIZATIONS:
- Cached device info reduces WebGL context creation
- Frame-based sampling eliminates timer conflicts
- Reduced logging noise with development-only output
- Mobile/tablet specific optimizations

✅ DEVELOPMENT FEATURES:
- Enhanced debug information and global access
- Real-time AQS engine inspection via window.aqsDebug
- Comprehensive logging with device context
- Manual tier control for testing

✅ INTEGRATION IMPROVEMENTS:
- Seamless coordination with R3F useFrame
- Performance store integration maintained
- Quality store updates with device awareness
- Error handling and cleanup protocols

✅ MOBILE/TABLET ENHANCEMENTS:
- Conservative quality thresholds for mobile devices
- Longer quiet periods for stability
- Capped DPR to prevent thermal issues
- Optimized particle counts per device type

This enhanced AQS component eliminates timer conflicts and provides
stable, device-aware quality management with comprehensive debugging! 🌟
*/