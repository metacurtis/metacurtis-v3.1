// src/theater/TheaterDirector.js
// SST v3.0 Compliant Theater Director - Complete timing orchestration

// src/theater/TheaterDirector.js
// This one should already be correct:
import BeatBus from '../../modules/orchestration/core/BeatBus.js';
import { EVENTS, FRAGMENT_TRIGGERS, STAGE_AUDIO } from './events.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

class TheaterDirector {
  constructor(bus = BeatBus) {
    this.bus = bus;
    this.phase = 'idle';
    this.startTime = null;
    this._cancelled = false;
    this.scrollMonitor = null;
  }

  cancel() {
    this._cancelled = true;
    if (this.scrollMonitor) {
      clearInterval(this.scrollMonitor);
    }
    this.bus.emit(EVENTS.DIRECTOR_CANCEL);
  }

  once(event, timeoutMs = 0) {
    return new Promise(resolve => {
      let resolved = false;
      const off = this.bus.on(event, data => {
        if (resolved) return;
        resolved = true;
        off();
        resolve(data);
      });
      if (timeoutMs > 0) {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            off();
            console.warn(`⚠️ Director: ${event} timed out after ${timeoutMs}ms`);
            resolve(null);
          }
        }, timeoutMs);
      }
    });
  }

  async prewarm() {
    console.log('🔥 Director: Prewarming assets...');
    // Prewarm genesis blueprint for zero-delay emergence
    this.bus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT);
    // Start ambient computer hum
    this.bus.emit(EVENTS.AUDIO_COMPUTER_HUM, { volume: 0.3 });
    await this.once(EVENTS.PREWARM_COMPLETE, 1000);
  }

  async start() {
    this._cancelled = false;
    this.startTime = Date.now();

    console.log('🎬 Director: Starting SST v3.0 compliant show');

    // Prewarm for smooth performance
    await this.prewarm();
    if (this._cancelled) return;

    // ========== OPENING SEQUENCE (8 seconds total) ==========
    this.phase = 'opening';

    // Black screen - exactly 2 seconds per SST v3.0
    console.log('   Phase: Black screen (2s)');
    await sleep(2000);
    if (this._cancelled) return;

    // Green cursor appears and blinks TWICE per SST v3.0
    console.log('   Phase: Cursor (blinks twice)');
    this.bus.emit(EVENTS.CURSOR_SHOW);
    await sleep(500);
    this.bus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 500 });
    await sleep(1500); // Total cursor phase: 2s
    if (this._cancelled) return;

    // Terminal typing with key click sounds - SST v3.0 exact text
    console.log('   Phase: Terminal typing');
    this.bus.emit(EVENTS.TERMINAL_TYPE, {
      lines: [
        'READY.', // Line 1
        '10 PRINT "HELLO CURTIS"', // Line 2 - double quotes per SST
        '20 GOTO 10', // Line 3
        'RUN', // Line 4
      ],
      typeSpeed: 50, // 50ms per character per SST v3.0
      lineDelay: 300, // Delay between lines
    });

    // Trigger key click sounds during typing
    for (let i = 0; i < 4; i++) {
      await sleep(300);
      this.bus.emit(EVENTS.AUDIO_KEY_CLICK);
    }

    await sleep(2500); // Total typing time
    if (this._cancelled) return;

    // Screen fills with scrolling "HELLO CURTIS"
    console.log('   Phase: Screen fill');
    this.bus.emit(EVENTS.SCREEN_FILL, {
      text: 'HELLO CURTIS ',
      scrollSpeed: 50, // 50ms per line
    });
    await sleep(1500);
    if (this._cancelled) return;

    // ========== EMERGENCE (3 seconds) ==========
    this.phase = 'emergence';
    console.log('🌟 Phase: Emergence - particles from text');

    // Build special emergence blueprint with tier behaviors
    this.bus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      mode: 'emergence',
      sourceText: 'HELLO CURTIS',
      tierBehaviors: {
        tier1: { behavior: 'drift', ratio: 0.5 }, // SST v3.0
        tier2: { behavior: 'orbital', ratio: 0.2 }, // SST v3.0
        tier3: { behavior: 'twinkle', ratio: 0.15 }, // SST v3.0
        tier4: { behavior: 'prominent', ratio: 0.15 }, // SST v3.0
      },
    });

    this.bus.emit(EVENTS.PARTICLES_START_EMERGING);

    // Wait for particles to settle into Genesis formation
    await this.once(EVENTS.PARTICLES_EMERGED, 4000);
    if (this._cancelled) return;

    // ========== GENESIS (User-driven from here) ==========
    this.phase = 'genesis';
    console.log('🧬 Phase: Genesis - narrative begins');

    // Start Genesis audio
    this.bus.emit(EVENTS.AUDIO_START_STAGE, {
      stage: 'genesis',
      file: STAGE_AUDIO.genesis,
      crossfade: true,
    });

    // Start Genesis narrative with SST v3.0 exact text
    this.bus.emit(EVENTS.START_NARRATIVE, {
      stage: 'genesis',
      text: `I was eight years old. End of summer, 1983...`,
    });

    // Enable user control
    this.bus.emit(EVENTS.ENABLE_SCROLL);

    // Start monitoring for memory fragments
    this.startMemoryFragmentMonitoring();

    console.log('🎬 Director: Hand-off complete → user-driven experience');
    console.log(`   Total opening time: ${Date.now() - this.startTime}ms`);
  }

  startMemoryFragmentMonitoring() {
    console.log('📍 Director: Monitoring for memory fragments');

    // Set up scroll monitoring for SST v3.0 fragment triggers
    this.scrollMonitor = setInterval(() => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      // Check each fragment trigger point
      Object.entries(FRAGMENT_TRIGGERS).forEach(([stage, triggerPercent]) => {
        if (Math.abs(scrollPercent - triggerPercent) < 1) {
          this.bus.emit(EVENTS.TRIGGER_FRAGMENT, {
            stage,
            percent: triggerPercent,
          });
        }
      });
    }, 100);
  }

  getStatus() {
    return {
      phase: this.phase,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      cancelled: this._cancelled,
      timeline: {
        opening: '0-8s',
        emergence: '8-11s',
        genesis: '11s+',
        current: this.phase,
      },
    };
  }
}

// Singleton instance
const director = new TheaterDirector();

// Debug access
if (typeof window !== 'undefined') {
  window.theaterDirector = director;
  window.directorStatus = () => director.getStatus();
}

export default director;
export { TheaterDirector };
