// src/state/Controller.js
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
    console.log(`
╔═════════ CANON KEYS ═════════╗
║  1–7      → jump to stage     ║
║  ← / →    → morph -/+         ║
║  ↑ / ↓    → prev/next stage   ║
║  [ / ]    → tier down/up      ║
║  0        → morph=0 (reset)   ║
║  H / ?    → show help         ║
║  (Shift: 5× step, Alt: 0.25×) ║
╚═══════════════════════════════╝`);
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
