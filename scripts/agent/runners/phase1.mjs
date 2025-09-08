/* eslint-env node */
import fs from 'node:fs';

const OS = 'src/components/theater/OpeningSequence.jsx';
const TD = 'src/theater/TheaterDirector.js';

function patchOpeningSequence(src){
  let out = src;
  // strict mono, no glow
  out = out.replace(/fontFamily:\s*["'][^"']*["'][^,]*,?\s*monospace["']?/g,
    "fontFamily: \"'Courier New', Courier, 'Lucida Console', 'DejaVu Sans Mono', monospace\"");
  out = out.replace(/textShadow:\s*cursorVisible\s*\?\s*'0\s*0\s*10px\s*#00FF00'\s*:\s*'none'\s*,/g, "textShadow: 'none',");
  out = out.replace(/textShadow:\s*'0\s*0\s*5px\s*#00FF00'\s*,/g, "textShadow: 'none',");
  out = out.replace(/background:\s*'linear-gradient\(180deg,[^)]*\)'\s*,/g, "background: '#000000',");
  // progressive fill + vision global
  out = out.replace(/setScreenFillLines\(\s*\[\s*fillText\s*\]\s*\)\s*;/g,
    "try { window.__opening_fill_start_lines = 0; } catch {}\n          setScreenFillLines([]);");
  // If SCREEN_FILL handler missing vision global, add it next to setScreenFillLines([])
  if (!/__opening_fill_start_lines/.test(out)) {
    out = out.replace(/setScreenFillLines\(\s*\[\s*\]\s*\)/, "try { window.__opening_fill_start_lines = 0; } catch {}\n          setScreenFillLines([])");
  }
  return out;
}

function makeDirectorStart(){
  return `  async start() {
    if (this.isRunning) { console.log("🎬 Director: Already running, ignoring duplicate start"); return; }
    this.isRunning = true; this.cancelled = false; this.phase="starting"; this.startTime=Date.now(); this.timeline={};
    const sleep = (ms)=> new Promise(r=> setTimeout(r, ms));

    try {
      try { BeatBus.emit(EVENTS.PREWARM_GENESIS_BLUEPRINT); await this.once(EVENTS.PREWARM_COMPLETE, 500); } catch {}
      // T+0..2.0s Black
      this.phase="black"; BeatBus.emit; await sleep(2000); if (this.cancelled) return;

      // T+2.0s Cursor + blinks
      this.phase="cursor"; BeatBus.emit(EVENTS.CURSOR_SHOW);
      BeatBus.emit(EVENTS.CURSOR_BLINK, { count: 2, interval: 250 });

      // T+2.25s Typing
      await sleep(250); if (this.cancelled) return;
      this.phase="terminal";
      BeatBus.emit(EVENTS.TERMINAL_TYPE, { lines: ['READY.','10 PRINT "HELLO CURTIS"','20 GOTO 10','RUN'], typeSpeed: 12, lineDelay: 60 });

      // T+3.0s Fill (absolute)
      const t0 = this.startTime;
      const now = Date.now();
      const toT3 = Math.max(0, 3000 - (now - t0));
      await sleep(toT3); if (this.cancelled) return;
      this.phase="fill";
      BeatBus.emit(EVENTS.SCREEN_FILL, { text: "HELLO CURTIS ", scrollSpeed: 50 });
      this.timeline.tFill = performance.now();

      // dwell canonically (3s)
      await sleep(3000); if (this.cancelled) return;

      // min-fill guard before emergence (>=1200ms since tFill)
      const fillAge = performance.now() - (this.timeline.tFill || performance.now());
      if (fillAge < 1200) { await sleep(1200 - fillAge); if (this.cancelled) return; }

      // Emergence
      this.phase="emergence";
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, { sourceText: "HELLO CURTIS", count: 2000 });
      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      await this.once(EVENTS.PARTICLES_EMERGED, 3000); if (this.cancelled) return;

      // Handoff → Stage-0
      BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: "genesis" });
      this.phase="genesis"; BeatBus.emit(EVENTS.AUDIO_START_STAGE, { stage: "genesis" }); BeatBus.emit(EVENTS.START_NARRATIVE, { stage: "genesis" });
      try { window.scrollTo({top:0,left:0,behavior:"instant"}); } catch {}
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
      await this._easeMorphTo(1, 1400); if (this.cancelled) return;
      BeatBus.emit(EVENTS.ENABLE_SCROLL);

      if (!this.scrollOrchestrator) this.scrollOrchestrator = new (require('./ScrollOrchestrator.js').default || require('./ScrollOrchestrator.js'))();
      try { this.scrollOrchestrator.start(); } catch {}
      this.phase="complete"; this.hasRun=true; this.isRunning=false;
    } catch (e) {
      console.error("Director error:", e); this.isRunning=false; this.phase="error";
    }
  }`;
}

export async function runPhase1({cwd=process.cwd()} = {}){
  let changed=false;

  // OpeningSequence styles + progressive fill
  try {
    const osPath = path.join(cwd, OS);
    const src = fs.readFileSync(osPath,'utf8');
    const out = patchOpeningSequence(src);
    if (out !== src) {
      const bak = osPath + '.bak.' + new Date().toISOString().replace(/[:.]/g,'-');
      fs.writeFileSync(bak, src, 'utf8');
      fs.writeFileSync(osPath, out, 'utf8');
      console.log('✔ OpeningSequence patched (mono/no-glow/progressive); backup:', bak);
      changed=true;
    } else { console.log('= OpeningSequence already compliant'); }
  } catch (e) { console.warn('OpeningSequence patch failed:', e?.message); }

  // TheaterDirector start() swap-in (absolute Phase-1 schedule)
  try {
    const p = path.join(cwd, TD);
    const src = fs.readFileSync(p,'utf8');
    let out = src;
    // Replace async start() body
    out = out.replace(/async\s+start\s*\(\)\s*\{[\s\S]*?\n\s*\}\s*\n/, makeDirectorStart() + '\n');
    if (out !== src) {
      const bak = p + '.bak.' + new Date().toISOString().replace(/[:.]/g,'-');
      fs.writeFileSync(bak, src, 'utf8');
      fs.writeFileSync(p, out, 'utf8');
      console.log('✔ TheaterDirector.start() swapped for Phase-1 absolute schedule; backup:', bak);
      changed=true;
    } else { console.log('= TheaterDirector.start() already aligned'); }
  } catch (e) { console.warn('TheaterDirector patch failed:', e?.message); }

  // Done
  console.log(changed ? 'Phase-1 goal: changes applied.' : 'Phase-1 goal: no changes required.');
  return 0;
}
