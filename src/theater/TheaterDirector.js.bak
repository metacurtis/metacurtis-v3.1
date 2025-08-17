// src/theater/TheaterDirector.js
// SST v3.0 Compliant Theater Director - Fixed singleton pattern

import BeatBus from '@modules/orchestration/core/BeatBus';
import { EVENTS } from './events.js';

class TheaterDirector {
  constructor() {
    this.phase = 'idle';
    this.cancelled = false;
    this.isRunning = false;
    this.hasRun = false; // Track if it has ever run
    this.startTime = null;
    this.timeline = {};
  }

  async start() {
    // Only block if currently running, not if it has run before
    if (this.isRunning) {
      console.log('🎬 Director: Already running, ignoring duplicate start');
      return;
    }

    // Reset state for new run
    this.isRunning = true;
    this.cancelled = false;
    this.phase = 'starting';
    this.startTime = Date.now();
    
    console.log('🎬 Director: Starting SST v3.0 compliant show');

    try {
      // Prewarm assets
      await this.prewarm();
      
      // Phase 1: Black screen (2 seconds)
      this.phase = 'black';
      console.log('   Phase: Black screen (2s)');
      await this.sleep(2000);
      if (this.cancelled) return;

      // Phase 2: Cursor appears and blinks twice
      this.phase = 'cursor';
      console.log('   Phase: Cursor (blinks twice)');
      BeatBus.emit(EVENTS.CURSOR_SHOW);
      await this.sleep(500);
      BeatBus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 500 });
      await this.sleep(2500);
      if (this.cancelled) return;

      // Phase 3: Terminal typing
      this.phase = 'terminal';
      console.log('   Phase: Terminal typing');
      BeatBus.emit(EVENTS.TERMINAL_TYPE, {
        lines: [
          'READY.',
          '10 PRINT "HELLO CURTIS"',
          '20 GOTO 10',
          'RUN'
        ],
        typeSpeed: 100,
        lineDelay: 500
      });
      
      // Emit key clicks during typing
      for (let i = 0; i < 4; i++) {
        await this.sleep(500);
        BeatBus.emit(EVENTS.AUDIO_KEY_CLICK);
      }
      
      await this.sleep(3800);
      if (this.cancelled) return;

      // Phase 4: Screen fills with "HELLO CURTIS"
      this.phase = 'fill';
      console.log('   Phase: Screen fill');
      BeatBus.emit(EVENTS.SCREEN_FILL, {
        text: 'HELLO CURTIS ',
        scrollSpeed: 50
      });
      await this.sleep(3000);
      if (this.cancelled) return;

      // Phase 5: Particles emerge from text
      this.phase = 'emergence';
      console.log('🌟 Phase: Emergence - particles from text');
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
        sourceText: 'HELLO CURTIS',
        count: 2000
      });
      
      // Tell opening sequence to start fading
      await this.sleep(500);
      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      
      // Wait for particles to emerge
      await this.once(EVENTS.PARTICLES_EMERGED, 4000);
      if (this.cancelled) return;

      // Phase 6: Start narrative and enable scroll
      this.phase = 'genesis';
      console.log('🧬 Phase: Genesis - narrative begins');
      BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: 'genesis' });
      BeatBus.emit(EVENTS.START_NARRATIVE, { stage: 'genesis' });
      BeatBus.emit(EVENTS.ENABLE_SCROLL);

      // Monitor for memory fragments
      this.monitorFragments();

      // Complete
      this.phase = 'complete';
      const elapsed = Date.now() - this.startTime;
      console.log('🎬 Director: Hand-off complete → user-driven experience');
      console.log(`   Total opening time: ${elapsed}ms`);
      
      this.hasRun = true;
      this.isRunning = false;

    } catch (error) {
      console.error('Director error:', error);
      this.isRunning = false;
      this.phase = 'error';
    }
  }

  async prewarm() {
    console.log('🔥 Director: Prewarming assets...');
    BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
    
    // Start audio
    BeatBus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: 0.3 });
    
    // Wait for prewarm or timeout
    await this.once(EVENTS.PREWARM_COMPLETE, 2000);
  }

  monitorFragments() {
    console.log('📍 Director: Monitoring for memory fragments');
    
    // Set up fragment triggers based on scroll percentage
    const _fragmentTriggers = [
      { stage: 'genesis', percent: 5 },
      { stage: 'discipline', percent: 20 },
      { stage: 'neural', percent: 35 },
      { stage: 'velocity', percent: 49 },
      { stage: 'architecture', percent: 63 },
      { stage: 'harmony', percent: 77 },
      { stage: 'transcendence', percent: 92 }
    ];
    
    // Note: Actual implementation would monitor scroll and trigger fragments
    // For now, this is a placeholder
  }

  cancel() {
    if (!this.isRunning) return;
    
    console.log('🎬 Director: Cancelling show');
    this.cancelled = true;
    this.isRunning = false;
    this.phase = 'cancelled';
    BeatBus.emit(EVENTS.DIRECTOR_CANCEL);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  once(event, timeout = 5000) {
    return new Promise((resolve) => {
      let timeoutId;
      
      const handler = (data) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(data);
      };
      
      const unsubscribe = BeatBus.on(event, handler);
      
      timeoutId = setTimeout(() => {
        console.warn(`⚠️ Director: ${event} timed out after ${timeout}ms`);
        unsubscribe();
        resolve(null);
      }, timeout);
    });
  }

  getStatus() {
    return {
      phase: this.phase,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      cancelled: this.cancelled,
      isRunning: this.isRunning,
      hasRun: this.hasRun,
      timeline: this.timeline
    };
  }
}

// Create singleton instance
const director = new TheaterDirector();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.theaterDirector = director;
}

export default director;
