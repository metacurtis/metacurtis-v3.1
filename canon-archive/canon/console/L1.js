// src/canon/console/L1.js — stub that delegates to CANON_CONSOLE
export class CanonConsoleL1 {
  setLevel(l){ try{ window.CANON_CONSOLE?.setLevel?.(l); }catch{} return l; }
  mute(p){ try{ return window.CANON_CONSOLE?.mute?.(p); }catch{} return []; }
  unmute(){ try{ return window.CANON_CONSOLE?.unmute?.(); }catch{} return []; }
}
export default CanonConsoleL1;
