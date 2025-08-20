#!/usr/bin/env node
/**
 * doctor_state_controller_inputs.cjs
 * Installs State Controller (command layer) + keyboard bindings for
 * stage transitions and morph control. Idempotent & ESM-friendly.
 *
 * Usage:
 *   node scripts/doctor_state_controller_inputs.cjs           # dry run
 *   node scripts/doctor_state_controller_inputs.cjs --commit  # apply changes
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);
const ex = (f) => fs.existsSync(P(f));
const rd = (f) => fs.readFileSync(P(f), 'utf8');
const wr = (f, s) => {
  fs.mkdirSync(path.dirname(P(f)), { recursive: true });
  fs.writeFileSync(P(f), s, 'utf8');
};
const NOW = new Date().toISOString().replace(/[:]/g, '-');
const COMMIT = process.argv.includes('--commit');
const CHANGES = [];
const note = (file, kind, msg='') => CHANGES.push({file, kind, msg});

function backupOnce(file) {
  if (!ex(file)) return null;
  const bak = `${file}.${NOW}.bak`;
  fs.copyFileSync(P(file), P(bak));
  return bak;
}

// Find main file
const MAIN = ['src/main.jsx','src/main.tsx'].find(ex);

// Content: State Controller (command layer)
const CONTROLLER_FILE = 'src/state/Controller.js';
const CONTROLLER_CONTENT = `// src/state/Controller.js
// State Controller (command layer) — orchestrates Stage / Tier / Morph
const clamp01 = (v)=>Math.max(0,Math.min(1,v));

const STAGES = ['genesis','discipline','neural','velocity','architecture','harmony','transcendence'];
const TIERS  = ['LOW','MEDIUM','HIGH','ULTRA'];

export default class StateController {
  constructor({ StateCore, BeatBus } = {}) {
    this.StateCore = StateCore;
    this.BeatBus   = BeatBus;
    this._last = StateCore?.get?.() || { stage: STAGES[0], quality: 'HIGH', morph: 0 };
    this._keysAttached = false;

    // subscribe to stay in sync
    this.StateCore?.on?.('change', s => { this._last = s; });
  }

  // --- read helpers
  get state() { return this.StateCore?.get?.() || this._last; }
  idxStage(name){ return Math.max(0, STAGES.indexOf(name ?? this.state.stage)); }
  idxTier(name){  return Math.max(0, TIERS.indexOf(name ?? this.state.quality)); }

  // --- write helpers (prefer StateCore; fallback to bus if needed)
  setStage(name, trigger='kb') {
    if (this.StateCore?.setStage) return this.StateCore.setStage(name, trigger);
    if (this.BeatBus?.emit) {
      const from = this.state.stage;
      this.BeatBus.emit('STAGE_CHANGE', { from, to: name, trigger });
    }
  }
  setTier(tier, reason='kb') {
    if (this.StateCore?.setQuality) return this.StateCore.setQuality(tier, reason);
    if (this.BeatBus?.emit) this.BeatBus.emit('QUALITY_CHANGE', { tier, reason });
  }
  setMorph(v) {
    v = clamp01(v);
    if (this.StateCore?.setMorph) return this.StateCore.setMorph(v);
    // shader fallback if StateCore absent
    try {
      const mat = window.material || window.Engine?.getMaterial?.();
      if (mat?.uniforms?.uMorphProgress) mat.uniforms.uMorphProgress.value = v;
    } catch {}
  }

  // --- increments / navigation
  nextStage() { this.setStage(STAGES[Math.min(STAGES.length-1, this.idxStage()+1)]); }
  prevStage() { this.setStage(STAGES[Math.max(0, this.idxStage()-1)]); }
  stageByIndex(i){ if (STAGES[i]) this.setStage(STAGES[i]); }
  tierUp()   { this.setTier(TIERS[Math.min(TIERS.length-1, this.idxTier()+1)]); }
  tierDown() { this.setTier(TIERS[Math.max(0, this.idxTier()-1)]); }
  morphDelta(d){ this.setMorph(clamp01((this.state?.morph ?? 0) + d)); }
  morphSnap(v){  this.setMorph(clamp01(v)); }

  // --- help banner
  help() {
    console.log(\`
╔═════════ CANON KEYS ═════════╗
║  1–7      → jump to stage     ║
║  ← / →    → morph -/+         ║
║  ↑ / ↓    → prev/next stage   ║
║  [ / ]    → tier down/up      ║
║  0        → morph=0 (reset)   ║
║  H / ?    → show help         ║
║  (Shift: 5× step, Alt: 0.25×) ║
╚═══════════════════════════════╝\`);
  }

  // --- keyboard wiring
  attachKeybindings({ element=window, devOnly=true, force=false } = {}) {
    if (this._keysAttached) return;
    const dev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) || false;
    const enable = force || !devOnly || dev || (globalThis.localStorage?.canonKeys === '1');
    if (!enable) return;

    const handler = (e) => {
      // ignore in inputs / editable / with meta/ctrl
      const t = e.target;
      if (t && ((t.tagName==='INPUT')||(t.tagName==='TEXTAREA')||t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey) return;

      const base = 0.02;
      const step = (e.shiftKey ? base*5 : e.altKey ? base*0.25 : base);

      // numbers 1..7
      if (/^[1-7]$/.test(e.key)) {
        const idx = parseInt(e.key,10)-1;
        this.stageByIndex(idx);
        e.preventDefault();
        return;
      }

      switch(e.key) {
        case 'ArrowLeft':  this.morphDelta(-step); e.preventDefault(); return;
        case 'ArrowRight': this.morphDelta(+step); e.preventDefault(); return;
        case 'ArrowUp':    this.prevStage();       e.preventDefault(); return;
        case 'ArrowDown':  this.nextStage();       e.preventDefault(); return;
        case '[':          this.tierDown();        e.preventDefault(); return;
        case ']':          this.tierUp();          e.preventDefault(); return;
        case '0':          this.morphSnap(0);      e.preventDefault(); return;
        case 'h': case 'H': case '?': this.help(); return;
      }
    };

    element.addEventListener('keydown', handler, { passive:false });
    this._keysAttached = true;

    // globals for dev convenience
    if (typeof window !== 'undefined') {
      window.SCC = this;             // State Controller Commands
      window.SC  = window.SC || this.StateCore; // don't override if you already export SC
      console.log('🎮 Canon Keys: attached (numbers/arrow/[]). Press H for help.');
    }
  }
}
`;

// Inject Controller wiring block into main file
function withControllerWiring(src) {
  if (/CANON:STATE-CONTROLLER BEGIN/.test(src)) return src; // already wired

  const importBlock = [
    `import StateController from './state/Controller.js';`,
  ].join('\n');

  // place imports after existing imports
  const importRE = /^(import[\s\S]*?;[\t ]*\r?\n)+/m;
  const hasImports = importRE.test(src);
  const withImports = hasImports ? src.replace(importRE, (m)=> m + '\n' + importBlock + '\n')
                                 : importBlock + '\n' + src;

  const runtimeBlock = `
// CANON:STATE-CONTROLLER BEGIN
// Wire controller to existing StateCore & BeatBus
try {
  const __StateCore = (typeof SC !== 'undefined' && SC?.get) ? SC : (await (async()=>StateCore)());
  const __BeatBus   = (typeof window !== 'undefined') ? window.BeatBus : undefined;
  const __controller = new StateController({ StateCore: __StateCore, BeatBus: __BeatBus });
  __controller.attachKeybindings({ devOnly: true });
  // Expose for scripting:
  if (typeof window !== 'undefined') window.SCC = __controller;
} catch (e) {
  console.warn('Canon: StateController wiring skipped:', e?.message || e);
}
// CANON:STATE-CONTROLLER END
`;

  // best effort: inject before first render/root usage
  const rootRE = /(ReactDOM\.createRoot|root\.render|ReactDOM\.render)/;
  if (rootRE.test(withImports)) {
    return withImports.replace(rootRE, `${runtimeBlock}\n$1`);
  }
  return withImports + '\n' + runtimeBlock + '\n';
}

// 1) Write Controller.js
(function ensureController(){
  if (!ex(CONTROLLER_FILE)) {
    if (COMMIT) wr(CONTROLLER_FILE, CONTROLLER_CONTENT);
    note(CONTROLLER_FILE, 'create', 'State Controller command layer');
  } else {
    const cur = rd(CONTROLLER_FILE);
    if (cur.trim() !== CONTROLLER_CONTENT.trim()) {
      if (COMMIT) {
        const bak = backupOnce(CONTROLLER_FILE);
        wr(CONTROLLER_FILE, CONTROLLER_CONTENT);
        note(CONTROLLER_FILE, 'update', `backup -> ${bak}`);
      } else {
        note(CONTROLLER_FILE, 'would-update', 'Content differs');
      }
    } else {
      note(CONTROLLER_FILE, 'ok', 'Up-to-date');
    }
  }
})();

// 2) Patch main.jsx/tsx
(function patchMain(){
  if (!MAIN) { note('src/main.jsx', 'missing', 'Cannot find main.jsx/tsx'); return; }
  const before = rd(MAIN);
  const after  = withControllerWiring(before);
  if (after !== before) {
    if (COMMIT) {
      const bak = backupOnce(MAIN);
      wr(MAIN, after);
      note(MAIN, 'update', `wired controller + keys (backup -> ${bak})`);
    } else {
      note(MAIN, 'would-update', 'Would inject controller wiring');
    }
  } else {
    note(MAIN, 'ok', 'Already wired');
  }
})();

// Report
console.log('\n🎛  Repo Doctor: State Controller + Keyboard Inputs\n');
for (const c of CHANGES) {
  console.log(`• ${c.kind.padEnd(12)} ${c.file}${c.msg?` — ${c.msg}`:''}`);
}
if (!COMMIT) {
  console.log('\nDry-run complete. To apply:');
  console.log('  node scripts/doctor_state_controller_inputs.cjs --commit\n');
} else {
  console.log('\n✅ Applied. Restart dev server and try keys: 1–7, arrows, [ ] , H.');
  console.log('  In console: SCC.help(); SCC.setStage("neural"); SCC.morphDelta(0.1);');
}
