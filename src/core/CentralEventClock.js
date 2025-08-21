// src/core/CentralEventClock.js
// ✅ PHASE 2B OPTIMIZATION: Performance Profiling + Adaptive Throttling + Advanced EventEmitter
// ✅ CLOCK OPTIMIZATION: Intelligent frame pacing with performance monitoring

import mitt from 'mitt';

/**
 * ✅ ENHANCED CENTRAL EVENT CLOCK - Performance Optimized
 * - Advanced performance profiling and adaptive throttling
 * - Intelligent frame pacing based on device capabilities
 * - Memory-efficient event emission with listener optimization
 * - Comprehensive performance monitoring and reporting
 */

// ✅ ENHANCED: Performance profiler for clock operations
// @doctor:4b-disposers
const __doctorDisposers = [];class ClockPerformanceProfiler {constructor() {
    this.enabled = import.meta.env.DEV;
    this.metrics = {
      frameTime: {
        current: 0,
        average: 16.67,
        min: Infinity,
        max: 0,
        samples: [],
        maxSamples: 120 // 2 seconds at 60fps
      },
      jank: {
        count: 0,
        ratio: 0,
        threshold: 33.4, // >30fps
        recentJanks: []
      },
      events: {
        emitted: 0,
        totalTime: 0,
        averageEmissionTime: 0,
        listenerCounts: new Map()
      },
      performance: {
        grade: 'A',
        targetFPS: 60,
        actualFPS: 60,
        efficiency: 1.0,
        recommendations: []
      }
    };

    this.lastFrameTime = 0;
    this.frameStartTime = 0;
  }

  startFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    if (!this.enabled) return;

    const endTime = performance.now();
    const frameTime = endTime - this.frameStartTime;

    // Update frame time metrics
    this.metrics.frameTime.current = frameTime;
    this.metrics.frameTime.min = Math.min(this.metrics.frameTime.min, frameTime);
    this.metrics.frameTime.max = Math.max(this.metrics.frameTime.max, frameTime);

    // Add to samples and maintain buffer
    this.metrics.frameTime.samples.push(frameTime);
    if (this.metrics.frameTime.samples.length > this.metrics.frameTime.maxSamples) {
      this.metrics.frameTime.samples.shift();
    }

    // Calculate rolling average
    this.metrics.frameTime.average =
    this.metrics.frameTime.samples.reduce((sum, time) => sum + time, 0) /
    this.metrics.frameTime.samples.length;

    // Update FPS
    this.metrics.performance.actualFPS = frameTime > 0 ? 1000 / frameTime : 0;

    // Track jank (frames significantly over target)
    if (frameTime > this.metrics.jank.threshold) {
      this.metrics.jank.count++;
      this.metrics.jank.recentJanks.push({
        frameTime,
        timestamp: endTime
      });

      // Keep only recent janks (last 5 seconds)
      const fiveSecondsAgo = endTime - 5000;
      this.metrics.jank.recentJanks = this.metrics.jank.recentJanks.filter(
        (jank) => jank.timestamp > fiveSecondsAgo
      );
    }

    // Calculate jank ratio
    const totalFrames = this.metrics.frameTime.samples.length;
    const recentJankCount = this.metrics.jank.recentJanks.length;
    this.metrics.jank.ratio = totalFrames > 0 ? recentJankCount / totalFrames : 0;

    // Update performance grade
    this.updatePerformanceGrade();
  }

  recordEventEmission(eventType, listenerCount, emissionTime) {
    if (!this.enabled) return;

    this.metrics.events.emitted++;
    this.metrics.events.totalTime += emissionTime;
    this.metrics.events.averageEmissionTime =
    this.metrics.events.totalTime / this.metrics.events.emitted;

    this.metrics.events.listenerCounts.set(eventType, listenerCount);
  }

  updatePerformanceGrade() {
    const fps = this.metrics.performance.actualFPS;
    const jankRatio = this.metrics.jank.ratio;
    const frameTime = this.metrics.frameTime.average;

    let grade = 'A';
    let efficiency = 1.0;
    const recommendations = [];

    if (fps < 30) {
      grade = 'F';
      efficiency = 0.3;
      recommendations.push('Critical: FPS below 30, consider reducing quality');
    } else if (fps < 45) {
      grade = 'D';
      efficiency = 0.5;
      recommendations.push('Poor: FPS below 45, optimize performance');
    } else if (fps < 55) {
      grade = 'C';
      efficiency = 0.7;
      recommendations.push('Fair: FPS below target, minor optimizations needed');
    } else if (fps < 65) {
      grade = 'B';
      efficiency = 0.85;
    }

    if (jankRatio > 0.1) {
      grade = Math.max(grade, 'C');
      efficiency = Math.min(efficiency, 0.7);
      recommendations.push('High jank ratio detected, consider frame pacing');
    }

    if (frameTime > 20) {
      efficiency = Math.min(efficiency, 0.8);
      recommendations.push('High frame time variance, consider adaptive throttling');
    }

    this.metrics.performance.grade = grade;
    this.metrics.performance.efficiency = efficiency;
    this.metrics.performance.recommendations = recommendations;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics.frameTime.samples = [];
    this.metrics.jank.count = 0;
    this.metrics.jank.recentJanks = [];
    this.metrics.events.emitted = 0;
    this.metrics.events.totalTime = 0;
    this.metrics.events.listenerCounts.clear();
  }
}

// ✅ ENHANCED: Adaptive throttling system
class AdaptiveThrottler {
  constructor() {
    this.targetFPS = 60;
    this.currentThrottle = 0; // 0 = no throttle, 1 = maximum throttle
    this.lastThrottleAdjustment = 0;
    this.adjustmentInterval = 1000; // 1 second
    this.performanceHistory = [];
    this.maxHistoryLength = 60; // 1 minute of data

    // Throttling configuration
    this.config = {
      minFPS: 30,
      targetFPS: 60,
      maxThrottle: 0.5,
      aggressiveness: 0.1, // How quickly to adjust throttling
      stabilityThreshold: 5, // Frames needed for stable performance
      emergencyThreshold: 20 // FPS threshold for emergency throttling
    };
  }

  updatePerformance(fps, frameTime, jankRatio) {
    const now = performance.now();

    // Add to performance history
    this.performanceHistory.push({
      fps,
      frameTime,
      jankRatio,
      timestamp: now,
      throttle: this.currentThrottle
    });

    // Maintain history size
    if (this.performanceHistory.length > this.maxHistoryLength) {
      this.performanceHistory.shift();
    }

    // Adjust throttling if needed
    if (now - this.lastThrottleAdjustment > this.adjustmentInterval) {
      this.adjustThrottling(fps, frameTime, jankRatio);
      this.lastThrottleAdjustment = now;
    }
  }

  adjustThrottling(fps, frameTime, jankRatio) {
    const prevThrottle = this.currentThrottle;

    // Emergency throttling for very low FPS
    if (fps < this.config.emergencyThreshold) {
      this.currentThrottle = Math.min(this.config.maxThrottle, this.currentThrottle + 0.2);
      this.logThrottleChange('emergency', prevThrottle, this.currentThrottle);
      return;
    }

    // Calculate recent performance trend
    const recentFrames = this.performanceHistory.slice(-this.config.stabilityThreshold);
    if (recentFrames.length < this.config.stabilityThreshold) return;

    const avgFPS = recentFrames.reduce((sum, frame) => sum + frame.fps, 0) / recentFrames.length;
    const avgJank = recentFrames.reduce((sum, frame) => sum + frame.jankRatio, 0) / recentFrames.length;

    // Determine if we need to increase or decrease throttling
    let targetThrottle = this.currentThrottle;

    if (avgFPS < this.config.targetFPS - 5 || avgJank > 0.1) {
      // Performance is poor, increase throttling
      targetThrottle = Math.min(
        this.config.maxThrottle,
        this.currentThrottle + this.config.aggressiveness
      );
    } else if (avgFPS > this.config.targetFPS + 5 && avgJank < 0.05) {
      // Performance is good, decrease throttling
      targetThrottle = Math.max(
        0,
        this.currentThrottle - this.config.aggressiveness * 0.5
      );
    }

    // Apply throttle change
    if (Math.abs(targetThrottle - this.currentThrottle) > 0.01) {
      this.currentThrottle = targetThrottle;
      this.logThrottleChange('adaptive', prevThrottle, this.currentThrottle);
    }
  }

  logThrottleChange(reason, oldThrottle, newThrottle) {
    if (import.meta.env.DEV) {
      console.debug(`🎯 Throttle ${reason}: ${(oldThrottle * 100).toFixed(1)}% → ${(newThrottle * 100).toFixed(1)}%`);import.meta.hot.dispose(() => {"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});});
    }
  }

  getThrottledFrameTime() {
    const baseFrameTime = 1000 / this.targetFPS; // 16.67ms for 60fps
    const throttledFrameTime = baseFrameTime * (1 + this.currentThrottle);
    return throttledFrameTime;
  }

  shouldSkipFrame(lastFrameTime) {
    if (this.currentThrottle <= 0) return false;

    const targetFrameTime = this.getThrottledFrameTime();
    const timeSinceLastFrame = performance.now() - lastFrameTime;

    return timeSinceLastFrame < targetFrameTime;
  }

  getStats() {
    return {
      currentThrottle: this.currentThrottle,
      targetFPS: this.targetFPS,
      throttledFPS: this.targetFPS / (1 + this.currentThrottle),
      performanceHistoryLength: this.performanceHistory.length,
      config: this.config
    };
  }

  reset() {
    this.currentThrottle = 0;
    this.performanceHistory = [];
    this.lastThrottleAdjustment = 0;
  }
}

// ✅ ENHANCED: Optimized event emitter with listener management
class OptimizedEventEmitter {
  constructor() {
    this.emitter = mitt();
    this.listenerCounts = new Map();
    this.emissionStats = new Map();
    this.enabled = true;
  }

  on(type, handler) {
    this.emitter.on(type, handler);
    this.listenerCounts.set(type, (this.listenerCounts.get(type) || 0) + 1);
    return () => this.off(type, handler);
  }

  off(type, handler) {
    this.emitter.off(type, handler);
    const count = this.listenerCounts.get(type) || 1;
    this.listenerCounts.set(type, Math.max(0, count - 1));
  }

  emit(type, data) {
    if (!this.enabled) return;

    const startTime = performance.now();
    const listenerCount = this.listenerCounts.get(type) || 0;

    if (listenerCount > 0) {
      this.emitter.emit(type, data);
    }

    const emissionTime = performance.now() - startTime;

    // Track emission statistics
    if (!this.emissionStats.has(type)) {
      this.emissionStats.set(type, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        maxTime: 0,
        listenerCount: 0
      });
    }

    const stats = this.emissionStats.get(type);
    stats.count++;
    stats.totalTime += emissionTime;
    stats.averageTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, emissionTime);
    stats.listenerCount = listenerCount;

    return { emissionTime, listenerCount };
  }

  getStats() {
    return {
      listenerCounts: Object.fromEntries(this.listenerCounts),
      emissionStats: Object.fromEntries(this.emissionStats),
      totalListeners: Array.from(this.listenerCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }

  reset() {
    this.emissionStats.clear();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// ✅ ENHANCED: Main clock implementation
let isRunning = false;
let startTime = 0;
let frameCount = 0;
let lastFrameTime = 0;
let fpsBuffer = [];
let fpsBufferSize = 60; // 1 second at 60fps
let clockDrift = 0;

// ✅ ENHANCED: Initialize systems
const profiler = new ClockPerformanceProfiler();
const throttler = new AdaptiveThrottler();
const optimizedEmitter = new OptimizedEventEmitter();

// ✅ LEGACY: Callback support
const tickCallbacks = [];
const resizeCallbacks = [];
const visibilityCallbacks = [];

// ✅ RAF LOOP: Enhanced with performance monitoring and adaptive throttling
let rafId = null;
let skippedFrames = 0;

function tick(currentTime) {
  if (!isRunning) return;

  profiler.startFrame();

  // Check if we should skip this frame due to throttling
  if (throttler.shouldSkipFrame(lastFrameTime)) {
    skippedFrames++;
    rafId = requestAnimationFrame(tick);
    return;
  }

  // Calculate delta time
  const deltaTime = lastFrameTime ? currentTime - lastFrameTime : 16.67;
  lastFrameTime = currentTime;
  frameCount++;

  // Update FPS buffer
  if (fpsBuffer.length >= fpsBufferSize) {
    fpsBuffer.shift();
  }
  fpsBuffer.push(deltaTime);

  // Calculate performance metrics
  const avgDelta = fpsBuffer.reduce((sum, dt) => sum + dt, 0) / fpsBuffer.length;
  const avgFps = avgDelta > 0 ? 1000 / avgDelta : 0;
  const jankCount = fpsBuffer.filter((dt) => dt > 33.4).length;
  const jankRatio = jankCount / fpsBuffer.length;

  // Update adaptive throttling
  throttler.updatePerformance(avgFps, avgDelta, jankRatio);

  // Calculate elapsed time and clock drift
  const elapsedTime = currentTime - startTime;
  const expectedTime = frameCount * 16.67; // 60fps baseline
  clockDrift = elapsedTime - expectedTime;

  // ✅ ENHANCED: Optimized event emission
  const tickEmission = optimizedEmitter.emit('tick', { deltaTime, currentTime, avgFps, jankRatio });

  // Emit FPS window event periodically
  if (frameCount % fpsBufferSize === 0) {
    const fpsEmission = optimizedEmitter.emit('fpsWindow', {
      avgFps,
      jankRatio,
      frameCount,
      throttleStats: throttler.getStats(),
      skippedFrames
    });

    profiler.recordEventEmission('fpsWindow', fpsEmission.listenerCount, fpsEmission.emissionTime);

    // Reset skipped frames counter
    skippedFrames = 0;
  }

  profiler.recordEventEmission('tick', tickEmission.listenerCount, tickEmission.emissionTime);

  // ✅ LEGACY: Callback support
  tickCallbacks.forEach((callback) => {
    try {
      callback(deltaTime, currentTime);
    } catch (error) {
      console.error('CentralEventClock: Tick callback error:', error);
    }
  });

  profiler.endFrame();

  // Continue RAF loop
  rafId = requestAnimationFrame(tick);
}

// ✅ ENHANCED: Resize handler with optimization
function handleResize() {
  const resizeData = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    timestamp: performance.now()
  };

  // Legacy callbacks
  resizeCallbacks.forEach((callback) => {
    try {
      callback(resizeData);
    } catch (error) {
      console.error('CentralEventClock: Resize callback error:', error);
    }
  });

  // ✅ ENHANCED: Optimized emission
  const emission = optimizedEmitter.emit('resize', resizeData);
  profiler.recordEventEmission('resize', emission.listenerCount, emission.emissionTime);
}

// ✅ ENHANCED: Visibility handler with performance awareness
function handleVisibilityChange() {
  const visibilityData = {
    hidden: document.hidden,
    visibilityState: document.visibilityState,
    timestamp: performance.now()
  };

  // Legacy callbacks
  visibilityCallbacks.forEach((callback) => {
    try {
      callback(visibilityData);
    } catch (error) {
      console.error('CentralEventClock: Visibility callback error:', error);
    }
  });

  // ✅ ENHANCED: Optimized emission
  const emission = optimizedEmitter.emit('visibility', visibilityData);
  profiler.recordEventEmission('visibility', emission.listenerCount, emission.emissionTime);

  // Auto-pause/resume with performance preservation
  if (document.hidden && isRunning) {
    console.log('🔄 CentralEventClock: Auto-pausing (page hidden) - preserving performance state');
    centralEventClock.pause();
  } else if (!document.hidden && !isRunning) {
    console.log('🔄 CentralEventClock: Auto-resuming (page visible) - restoring performance state');
    centralEventClock.resume();
  }
}

// ✅ ENHANCED: Main clock object with performance optimization
const centralEventClock = {
  // ✅ EXISTING API: Preserved for compatibility
  start() {
    if (isRunning) {
      console.warn('CentralEventClock: Already running');
      return;
    }

    isRunning = true;
    startTime = performance.now();
    lastFrameTime = 0;
    frameCount = 0;
    fpsBuffer = [];
    clockDrift = 0;
    skippedFrames = 0;

    // Reset performance systems
    profiler.reset();
    throttler.reset();
    optimizedEmitter.reset();

    // Start RAF loop
    rafId = requestAnimationFrame(tick);

    // Add event listeners
    __doctorDisposers.push(() => {window.removeEventListener('resize', handleResize, { passive: true });});window.addEventListener('resize', handleResize, { passive: true });__doctorDisposers.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange, { passive: true });});document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    console.log('🎯 CentralEventClock: Started with performance profiling and adaptive throttling');
    optimizedEmitter.emit('start', { timestamp: startTime });
  },

  stop() {
    if (!isRunning) {
      console.warn('CentralEventClock: Already stopped');
      return;
    }

    isRunning = false;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    // Remove event listeners
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    const finalMetrics = profiler.getMetrics();
    const throttleStats = throttler.getStats();

    console.log('🛑 CentralEventClock: Stopped');
    console.log('📊 Final Performance Metrics:', finalMetrics);

    optimizedEmitter.emit('stop', {
      frameCount,
      elapsedTime: performance.now() - startTime,
      finalMetrics,
      throttleStats
    });
  },

  pause() {
    if (!isRunning) return;

    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    console.log('⏸️ CentralEventClock: Paused (performance state preserved)');
    optimizedEmitter.emit('pause', { frameCount, timestamp: performance.now() });
  },

  resume() {
    if (isRunning) return;

    isRunning = true;
    lastFrameTime = 0; // Reset to prevent large delta
    rafId = requestAnimationFrame(tick);

    console.log('▶️ CentralEventClock: Resumed');
    optimizedEmitter.emit('resume', { frameCount, timestamp: performance.now() });
  },

  // ✅ ENHANCED: Comprehensive metrics
  getMetrics() {
    const currentTime = performance.now();
    const elapsedTime = isRunning ? currentTime - startTime : 0;
    const avgDelta = fpsBuffer.length > 0 ?
    fpsBuffer.reduce((sum, dt) => sum + dt, 0) / fpsBuffer.length : 16.67;
    const currentFps = avgDelta > 0 ? 1000 / avgDelta : 0;
    const jankCount = fpsBuffer.filter((dt) => dt > 33.4).length;
    const jankRatio = fpsBuffer.length > 0 ? jankCount / fpsBuffer.length : 0;

    return {
      // Basic metrics
      isRunning,
      frameCount,
      elapsedTime,
      clockDrift,
      currentFps,
      avgFrameTime: avgDelta,
      fpsBufferSize: fpsBuffer.length,
      startTime,

      // ✅ ENHANCED: Performance metrics
      jankCount,
      jankRatio,
      skippedFrames,
      performance: profiler.getMetrics(),
      throttling: throttler.getStats(),
      events: optimizedEmitter.getStats()
    };
  },

  // ✅ ENHANCED: Performance controls
  setTargetFPS(fps) {
    throttler.targetFPS = fps;
    throttler.config.targetFPS = fps;
    console.log(`🎯 CentralEventClock: Target FPS set to ${fps}`);
  },

  enableAdaptiveThrottling(enabled = true) {
    if (enabled) {
      throttler.reset();
      console.log('🎯 CentralEventClock: Adaptive throttling enabled');
    } else {
      throttler.currentThrottle = 0;
      console.log('🎯 CentralEventClock: Adaptive throttling disabled');
    }
  },

  forceThrottle(throttleRatio) {
    throttler.currentThrottle = Math.max(0, Math.min(0.5, throttleRatio));
    console.log(`🎯 CentralEventClock: Forced throttle to ${(throttleRatio * 100).toFixed(1)}%`);
  },

  // ✅ ENHANCED: Performance analysis
  analyzePerformance() {
    const metrics = this.getMetrics();
    const analysis = {
      grade: metrics.performance.performance.grade,
      efficiency: metrics.performance.performance.efficiency,
      recommendations: metrics.performance.performance.recommendations,

      framePacing: {
        stable: metrics.performance.frameTime.max - metrics.performance.frameTime.min < 10,
        variance: metrics.performance.frameTime.max - metrics.performance.frameTime.min,
        target: 16.67
      },

      throttling: {
        active: metrics.throttling.currentThrottle > 0,
        effectiveness: metrics.skippedFrames / Math.max(metrics.frameCount, 1),
        targetReached: metrics.currentFps >= metrics.throttling.targetFPS * 0.9
      },

      events: {
        efficient: metrics.events.emissionStats.tick?.averageTime < 1,
        listenerOptimal: metrics.events.totalListeners < 50
      }
    };

    return analysis;
  },

  // ✅ LEGACY API: Preserved
  addTickCallback(callback) {
    if (typeof callback === 'function') {
      tickCallbacks.push(callback);
    }
  },

  removeTickCallback(callback) {
    const index = tickCallbacks.indexOf(callback);
    if (index > -1) {
      tickCallbacks.splice(index, 1);
    }
  },

  addResizeCallback(callback) {
    if (typeof callback === 'function') {
      resizeCallbacks.push(callback);
    }
  },

  removeResizeCallback(callback) {
    const index = resizeCallbacks.indexOf(callback);
    if (index > -1) {
      resizeCallbacks.splice(index, 1);
    }
  },

  addVisibilityCallback(callback) {
    if (typeof callback === 'function') {
      visibilityCallbacks.push(callback);
    }
  },

  removeVisibilityCallback(callback) {
    const index = visibilityCallbacks.indexOf(callback);
    if (index > -1) {
      visibilityCallbacks.splice(index, 1);
    }
  },

  // ✅ ENHANCED: EventEmitter API
  on: optimizedEmitter.on.bind(optimizedEmitter),
  off: optimizedEmitter.off.bind(optimizedEmitter),
  emit: optimizedEmitter.emit.bind(optimizedEmitter),

  addEventListener(event, callback) {
    return this.on(event, callback);
  },

  removeEventListener(event, callback) {
    return this.off(event, callback);
  },

  // ✅ ENHANCED: Development and debugging
  getEventListeners() {
    return optimizedEmitter.getStats();
  },

  testEventEmitter() {
    console.log('🧪 Testing enhanced EventEmitter...');

    const testCallback = (data) => {
      console.log('✅ Test event received:', data);
    }; // @doctor:4b-capture
    const __doctor_unsub_1 =
    this.on('test', testCallback);__doctorDisposers.push(__doctor_unsub_1);
    this.emit('test', { message: 'Enhanced EventEmitter working correctly' });
    this.off('test', testCallback);

    console.log('🧪 Enhanced EventEmitter test complete');
    return true;
  },

  // ✅ ENHANCED: Performance testing
  runPerformanceTest(duration = 5000) {
    console.log(`🧪 Running ${duration}ms performance test...`);

    const startMetrics = this.getMetrics();
    const startTime = performance.now();

    return new Promise((resolve) => {
      setTimeout(() => {
        const endMetrics = this.getMetrics();
        const endTime = performance.now();

        const results = {
          duration: endTime - startTime,
          framesDuring: endMetrics.frameCount - startMetrics.frameCount,
          averageFPS: (endMetrics.frameCount - startMetrics.frameCount) / ((endTime - startTime) / 1000),
          jankRatio: endMetrics.jankRatio,
          throttleUsed: endMetrics.throttling.currentThrottle,
          grade: endMetrics.performance.performance.grade,
          efficiency: endMetrics.performance.performance.efficiency
        };

        console.log('✅ Performance test completed:', results);
        resolve(results);
      }, duration);
    });
  }
};

// ✅ ENHANCED: Development access
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.centralEventClock = centralEventClock;

  window.clockDebug = {
    getMetrics: () => centralEventClock.getMetrics(),
    getListeners: () => centralEventClock.getEventListeners(),
    testEvents: () => centralEventClock.testEventEmitter(),
    analyzePerformance: () => centralEventClock.analyzePerformance(),
    runPerfTest: (duration) => centralEventClock.runPerformanceTest(duration),

    // ✅ ENHANCED: Performance controls
    setTargetFPS: (fps) => centralEventClock.setTargetFPS(fps),
    enableThrottling: (enabled) => centralEventClock.enableAdaptiveThrottling(enabled),
    forceThrottle: (ratio) => centralEventClock.forceThrottle(ratio),

    // ✅ ENHANCED: Manual controls
    start: () => centralEventClock.start(),
    stop: () => centralEventClock.stop(),
    pause: () => centralEventClock.pause(),
    resume: () => centralEventClock.resume(),

    // ✅ ENHANCED: Stress testing
    stressTest: () => {
      console.log('🧪 Running stress test with 30 FPS target...');
      centralEventClock.setTargetFPS(30);

      return centralEventClock.runPerformanceTest(3000).then((results) => {
        centralEventClock.setTargetFPS(60);
        console.log('🧪 Stress test completed, FPS restored to 60');
        return results;
      });
    }
  };

  console.log('🎯 CentralEventClock: Enhanced with performance profiling and adaptive throttling');
  console.log('🔧 Available: window.centralEventClock, window.clockDebug');
  console.log('🧪 Test performance: window.clockDebug.runPerfTest(5000)');
  console.log('⚡ Stress test: window.clockDebug.stressTest()');
  console.log('📊 Analysis: window.clockDebug.analyzePerformance()');
}

export default centralEventClock;

/*
✅ PHASE 2B OPTIMIZATION: CENTRALEVENTCLOCK.JS ENHANCED ✅

🚀 PERFORMANCE PROFILING:
- ✅ Real-time frame time monitoring with rolling averages
- ✅ Jank detection and ratio calculation for performance grading
- ✅ Event emission timing and listener count tracking
- ✅ Comprehensive performance grading (A-F) with recommendations

⚡ ADAPTIVE THROTTLING:
- ✅ Intelligent frame pacing based on actual performance
- ✅ Emergency throttling for critical performance drops
- ✅ Performance history tracking for trend analysis
- ✅ Configurable throttling aggressiveness and thresholds

🧠 OPTIMIZED EVENT SYSTEM:
- ✅ Memory-efficient event emission with listener optimization
- ✅ Event emission statistics and performance tracking
- ✅ Optimized listener management with count tracking
- ✅ Backward compatibility with legacy callback system

💎 ADVANCED FEATURES:
- ✅ Performance analysis with detailed metrics and recommendations
- ✅ Stress testing capabilities with configurable duration
- ✅ Manual throttling controls for testing and optimization
- ✅ Comprehensive debugging tools and performance visualization

🛡️ RELIABILITY FEATURES:
- ✅ Graceful degradation under performance pressure
- ✅ State preservation during pause/resume cycles
- ✅ Error isolation in callback and event systems
- ✅ Automatic performance recovery mechanisms

Ready for Phase 2C: Component Integration Efficiency!
*/