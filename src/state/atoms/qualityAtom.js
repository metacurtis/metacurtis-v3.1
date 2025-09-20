// src/state/atoms/qualityAtom.js
// Canon-compliant quality atom with proper particle budget calculation

import { createAtom } from './createAtom.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events';

// Quality tier definitions
const SST_V3_QUALITY_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];

// Quality multipliers (for non-canonical tiers only)
const SST_V3_QUALITY_MULTIPLIERS = {
  LOW: { particles: 0.4, dpr: 0.5, effects: 0.8 },
  MEDIUM: { particles: 0.6, dpr: 0.75, effects: 0.9 },
  HIGH: { particles: 1.0, dpr: 1.0, effects: 1.0 },    // Canonical
  ULTRA: { particles: 1.5, dpr: 1.2, effects: 1.1 }    // Canonical with boost
};

// Extract canonical particle counts from SST
const CANONICAL_PARTICLE_COUNTS = {
  genesis: 2000,
  discipline: 3000,
  neural: 5000,
  velocity: 12000,
  architecture: 8000,
  harmony: 12000,
  transcendence: 15000
};

// Verify against Canonical if available
if (Canonical?.stages) {
  Object.entries(Canonical.stages).forEach(([stageName, stageData]) => {
    if (stageData.particles) {
      CANONICAL_PARTICLE_COUNTS[stageName] = stageData.particles;
    }
  });
}

// Enhanced caching system for performance
class QualityCache {
  constructor() {
    this.particleCache = new Map();
    this.dprCache = new Map();
    this.lastStage = null;
    this.lastTier = null;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  getParticleCount(stage, tier) {
    const key = `${stage}-${tier}`;
    
    // Always use canonical counts for HIGH/ULTRA
    if (tier === 'HIGH' || tier === 'ULTRA') {
      const baseCount = CANONICAL_PARTICLE_COUNTS[stage] || 5000;
      
      // ULTRA gets a boost for showcase
      if (tier === 'ULTRA') {
        return Math.round(baseCount * 1.5);
      }
      
      return baseCount;
    }
    
    // Check cache for LOW/MEDIUM
    if (this.particleCache.has(key)) {
      this.cacheHits++;
      return this.particleCache.get(key);
    }
    
    // Calculate for LOW/MEDIUM
    this.cacheMisses++;
    const baseCount = CANONICAL_PARTICLE_COUNTS[stage] || 5000;
    const multiplier = SST_V3_QUALITY_MULTIPLIERS[tier]?.particles || 1.0;
    const count = Math.round(baseCount * multiplier);
    
    this.particleCache.set(key, count);
    return count;
  }

  getDPR(tier, devicePixelRatio = 1) {
    const key = `${tier}-${devicePixelRatio}`;
    
    if (this.dprCache.has(key)) {
      this.cacheHits++;
      return this.dprCache.get(key);
    }
    
    this.cacheMisses++;
    const multiplier = SST_V3_QUALITY_MULTIPLIERS[tier]?.dpr || 1.0;
    const dpr = Math.min(devicePixelRatio * multiplier, 3.0); // Cap at 3.0
    
    this.dprCache.set(key, dpr);
    return dpr;
  }

  getStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0 
      ? this.cacheHits / (this.cacheHits + this.cacheMisses) 
      : 0;
    
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate,
      particleCacheSize: this.particleCache.size,
      dprCacheSize: this.dprCache.size
    };
  }

  clear() {
    this.particleCache.clear();
    this.dprCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Initial state
const initialState = {
  currentQualityTier: 'HIGH',
  targetDpr: 1.0,
  frameloopMode: 'always',
  webglEnabled: true,
  particleCount: CANONICAL_PARTICLE_COUNTS.genesis,
  currentStage: 'genesis',
  
  // Device awareness
  deviceType: 'desktop',
  webglVersion: 'WebGL2',
  devicePixelRatio: window?.devicePixelRatio || 1,
  
  // Performance tracking
  currentFPS: 60,
  averageFrameTime: 16.67,
  performanceGrade: 'A',
  
  // Scaling capability
  canScaleToUltra: false,
  lastTierChange: 0
};

// Create the quality atom
export const qualityAtom = createAtom(initialState, (get, setState) => {
  // Initialize cache
  const cache = new QualityCache();
  
  // Subscribe to stage changes to update particle budget
  let unsubscribe = null;
  
  const initializeSubscriptions = () => {
    if (unsubscribe) return; // Already initialized
    
    unsubscribe = BeatBus.on(EVENTS.STAGE_CHANGE, (payload) => {
      const stage = payload?.to || payload?.stage;
      if (stage && stage !== get().currentStage) {
        const state = get();
        const particleCount = cache.getParticleCount(stage, state.currentQualityTier);
        
        setState({
          ...state,
          currentStage: stage,
          particleCount
        });
        
        console.log(`🎨 qualityAtom: Particle budget updated - ${stage}: ${particleCount} particles (${state.currentQualityTier})`);
      }
    });
  };
  
  // Initialize subscriptions on first access
  if (typeof window !== 'undefined') {
    setTimeout(initializeSubscriptions, 0);
  }
  
  return {
    // Core actions
    setCurrentQualityTier: (tier) => {
      if (!SST_V3_QUALITY_TIERS.includes(tier)) {
        console.warn(`[qualityAtom] Invalid tier: ${tier}. Valid tiers:`, SST_V3_QUALITY_TIERS);
        return;
      }
      
      const state = get();
      const dpr = cache.getDPR(tier, state.devicePixelRatio);
      const particleCount = cache.getParticleCount(state.currentStage, tier);
      
      setState({
        ...state,
        currentQualityTier: tier,
        targetDpr: dpr,
        particleCount,
        lastTierChange: performance.now()
      });
      
      // Emit quality change event
      BeatBus.emit(EVENTS.QUALITY_CHANGE, { 
        tier, 
        quality: tier,
        particleCount,
        dpr 
      });
      
      console.log(`🎨 qualityAtom: Quality tier set to ${tier} (DPR: ${dpr.toFixed(2)}, Particles: ${particleCount})`);
    },
    
    setTargetDpr: (dpr) => {
      setState({ ...get(), targetDpr: dpr });
    },
    
    setFrameloopMode: (mode) => {
      setState({ ...get(), frameloopMode: mode });
    },
    
    // Get particle budget for a stage
    getParticleBudget: (stageName, explicitTier) => {
      const state = get();
      const tier = explicitTier || state.currentQualityTier;
      return cache.getParticleCount(stageName, tier);
    },
    
    // Update particle budget for current stage
    updateParticleBudget: (stageName) => {
      const state = get();
      const particleCount = cache.getParticleCount(stageName, state.currentQualityTier);
      
      setState({
        ...state,
        currentStage: stageName,
        particleCount
      });
      
      return particleCount;
    },
    
    // Get optimized DPR
    getOptimizedDPR: () => {
      const state = get();
      return cache.getDPR(state.currentQualityTier, state.devicePixelRatio);
    },
    
    // Initialize for device
    initializeForDevice: (deviceInfo) => {
      const { deviceType, webglVersion, devicePixelRatio = 1 } = deviceInfo;
      
      // Determine recommended tier based on device
      let recommendedTier = 'HIGH';
      if (deviceType === 'mobile') {
        recommendedTier = 'MEDIUM';
      } else if (deviceType === 'tablet') {
        recommendedTier = 'HIGH';
      } else if (webglVersion === 'WebGL2') {
        recommendedTier = 'HIGH';
      }
      
      const state = get();
      const dpr = cache.getDPR(recommendedTier, devicePixelRatio);
      const particleCount = cache.getParticleCount(state.currentStage, recommendedTier);
      
      setState({
        ...state,
        deviceType,
        webglVersion,
        devicePixelRatio,
        currentQualityTier: recommendedTier,
        targetDpr: dpr,
        particleCount
      });
      
      console.log(`🎨 qualityAtom: Initialized for ${deviceType}/${webglVersion} → ${recommendedTier}`);
    },
    
    // Update performance metrics
    updatePerformanceMetrics: (fps, frameTime) => {
      const state = get();
      
      // Calculate performance grade
      let grade = 'A';
      if (fps < 30) grade = 'F';
      else if (fps < 45) grade = 'D';
      else if (fps < 55) grade = 'C';
      else if (fps < 58) grade = 'B';
      
      // Check if we can scale to ULTRA
      const canScaleToUltra = fps >= 58 && frameTime < 18;
      
      setState({
        ...state,
        currentFPS: fps,
        averageFrameTime: frameTime,
        performanceGrade: grade,
        canScaleToUltra
      });
      
      // Auto-downgrade if performance is poor
      if (grade === 'F' && state.currentQualityTier !== 'LOW') {
        qualityAtom.setCurrentQualityTier('LOW');
        console.warn('🎨 qualityAtom: Auto-downgraded to LOW due to poor performance');
      }
    },
    
    // Enable showcase mode
    enableShowcaseMode: () => {
      const state = get();
      if (state.canScaleToUltra) {
        qualityAtom.setCurrentQualityTier('ULTRA');
        console.log('🎨 qualityAtom: Showcase mode enabled - ULTRA quality');
      } else {
        console.warn('🎨 qualityAtom: Cannot enable showcase - insufficient performance');
      }
    },
    
    // Query methods
    getQualityConfig: () => {
      const state = get();
      return {
        tier: state.currentQualityTier,
        particles: state.particleCount,
        dpr: state.targetDpr,
        webgl: state.webglEnabled,
        deviceType: state.deviceType,
        performanceGrade: state.performanceGrade,
        currentFPS: state.currentFPS,
        canScaleToUltra: state.canScaleToUltra
      };
    },
    
    // Get cache statistics
    getCacheStats: () => cache.getStats(),
    
    // Clear cache
    clearCache: () => {
      cache.clear();
      console.log('🎨 qualityAtom: Cache cleared');
    },
    
    // Test canonical compliance
    testCanonicalBudgets: () => {
      console.log('🧪 Testing SST v3.3 canonical compliance...');
      const stages = Object.keys(CANONICAL_PARTICLE_COUNTS);
      let passed = 0;
      
      stages.forEach(stage => {
        const canonical = CANONICAL_PARTICLE_COUNTS[stage];
        const high = cache.getParticleCount(stage, 'HIGH');
        const ultra = cache.getParticleCount(stage, 'ULTRA');
        const medium = cache.getParticleCount(stage, 'MEDIUM');
        const low = cache.getParticleCount(stage, 'LOW');
        
        const highCorrect = high === canonical;
        const ultraCorrect = ultra === Math.round(canonical * 1.5);
        const mediumCorrect = medium === Math.round(canonical * 0.6);
        const lowCorrect = low === Math.round(canonical * 0.4);
        
        if (highCorrect && ultraCorrect && mediumCorrect && lowCorrect) {
          passed++;
          console.log(`✅ ${stage}: HIGH=${high}, ULTRA=${ultra}, MEDIUM=${medium}, LOW=${low}`);
        } else {
          console.error(`❌ ${stage}: HIGH=${high} (${canonical}), ULTRA=${ultra} (${Math.round(canonical * 1.5)})`);
        }
      });
      
      console.log(`✅ Canonical compliance: ${passed}/${stages.length} stages passed`);
      return passed === stages.length;
    },
    
    // Stress test cache
    stressTestCache: (iterations = 1000) => {
      console.log(`🧪 Running cache stress test (${iterations} iterations)...`);
      const startTime = performance.now();
      
      const stages = Object.keys(CANONICAL_PARTICLE_COUNTS);
      const tiers = SST_V3_QUALITY_TIERS;
      
      for (let i = 0; i < iterations; i++) {
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        const randomTier = tiers[Math.floor(Math.random() * tiers.length)];
        cache.getParticleCount(randomStage, randomTier);
      }
      
      const endTime = performance.now();
      const stats = cache.getStats();
      
      console.log('✅ Cache stress test completed:', {
        duration: endTime - startTime,
        iterationsPerMs: iterations / (endTime - startTime),
        ...stats
      });
      
      return stats;
    },
    
    // Cleanup
    dispose: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      cache.clear();
    }
  };
});

// Development tools
if (import.meta.env.DEV && typeof globalThis !== 'undefined') {
  globalThis.qualityAtom = qualityAtom;
  
  globalThis.qualityControls = {
    // Basic controls
    setTier: (tier) => qualityAtom.setCurrentQualityTier(tier),
    getConfig: () => qualityAtom.getQualityConfig(),
    getBudget: (stage, tier) => qualityAtom.getParticleBudget(stage, tier),
    
    // Performance
    updatePerf: (fps, frameTime) => qualityAtom.updatePerformanceMetrics(fps, frameTime),
    enableShowcase: () => qualityAtom.enableShowcaseMode(),
    
    // Testing
    testCanonical: () => qualityAtom.testCanonicalBudgets(),
    stressTest: (n) => qualityAtom.stressTestCache(n),
    getCacheStats: () => qualityAtom.getCacheStats(),
    clearCache: () => qualityAtom.clearCache(),
    
    // Diagnostics
    diagnose: () => {
      const config = qualityAtom.getQualityConfig();
      const stats = qualityAtom.getCacheStats();
      console.group('🎨 Quality Atom Diagnostics');
      console.log('Current Config:', config);
      console.log('Cache Stats:', stats);
      console.log('Canonical Counts:', CANONICAL_PARTICLE_COUNTS);
      console.groupEnd();
      return { config, stats, canonical: CANONICAL_PARTICLE_COUNTS };
    }
  };
  
  console.log('🎨 qualityAtom: Enhanced with canonical particle compliance');
  console.log('🎮 Available: globalThis.qualityControls');
  console.log('🧪 Test canonical: globalThis.qualityControls.testCanonical()');
  console.log('🧪 Test cache: globalThis.qualityControls.stressTest(1000)');
  console.log('📊 Cache stats: globalThis.qualityControls.getCacheStats()');
  console.log('🔬 Diagnostics: globalThis.qualityControls.diagnose()');
}

export default qualityAtom;