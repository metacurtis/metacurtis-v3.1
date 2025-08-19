/* eslint-disable no-console */
// InputDoctor — robust dev key bindings for stage changes.
// Digits 1–7 select stages; ArrowLeft/ArrowRight step; logs every handled key.
const STAGES = ['genesis','discipline','neural','velocity','architecture','harmony','transcendence'];

function getBus(){ return globalThis.CANON_BEATBUS || globalThis.BeatBus || null; }
function getState(){
  return globalThis.stateControls || globalThis.stageControls || null;
}
function setStage(stage){
  const s = getState();
  if (s?.setStage) { s.setStage(stage); return 'stateControls.setStage'; }
  if (s?.set)      { s.set(stage);      return 'stageControls.set'; }
  const bus = getBus();
  if (bus?.emit)   { bus.emit('STAGE_CHANGE', { stage }); return 'bus.emit(STAGE_CHANGE)'; }
  return 'NO_ROUTE';
}
function idxOf(stage){
  const i = STAGES.indexOf((stage||'').toLowerCase());
  return i >= 0 ? i : 0;
}
function current(){
  try {
    // try to read from exposed controls if present
    const sc = getState();
    const name = sc?.getStage?.() || sc?.stage?.() || null;
    return name || (globalThis.__CANON_STAGE__||'genesis');
  } catch { return 'genesis'; }
}
function step(delta){
  const cur = idxOf(current());
  const next = ( (cur + delta) % STAGES.length + STAGES.length ) % STAGES.length;
  setStage(STAGES[next]);
}

let bound = false;
function handler(e){
  // Ignore typing in inputs/contentEditable
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

  const { code, key } = e;
  let handled = false;
  const route = ()=>{}; // set at call site
  switch (code) {
    case 'Digit1': console.log('🎹 InputDoctor: 1 → genesis');   console.log('route:', setStage(STAGES[0])); handled = true; break;
    case 'Digit2': console.log('🎹 InputDoctor: 2 → discipline');console.log('route:', setStage(STAGES[1])); handled = true; break;
    case 'Digit3': console.log('🎹 InputDoctor: 3 → neural');    console.log('route:', setStage(STAGES[2])); handled = true; break;
    case 'Digit4': console.log('🎹 InputDoctor: 4 → velocity');  console.log('route:', setStage(STAGES[3])); handled = true; break;
    case 'Digit5': console.log('🎹 InputDoctor: 5 → architecture');console.log('route:', setStage(STAGES[4])); handled = true; break;
    case 'Digit6': console.log('🎹 InputDoctor: 6 → harmony');   console.log('route:', setStage(STAGES[5])); handled = true; break;
    case 'Digit7': console.log('🎹 InputDoctor: 7 → transcendence');console.log('route:', setStage(STAGES[6])); handled = true; break;
    case 'ArrowRight': console.log('🎹 InputDoctor: → next'); step(+1); handled = true; break;
    case 'ArrowLeft':  console.log('🎹 InputDoctor: ← prev'); step(-1); handled = true; break;
    default:
      // also allow letter shortcuts when caps/locale differ
      if (key === '>') { console.log('🎹 InputDoctor: > next'); step(+1); handled = true; }
      if (key === '<') { console.log('🎹 InputDoctor: < prev'); step(-1); handled = true; }
  }
  if (handled) { e.preventDefault(); e.stopPropagation(); }
}

function enable(){
  if (bound) return;
  // Capture phase & non-passive so upstream listeners can't swallow it first
  window.addEventListener('keydown', handler, { capture: true });
  bound = true;
  console.log('🎹 InputDoctor enabled (digits 1–7, ← →).');
}
function disable(){
  if (!bound) return;
  window.removeEventListener('keydown', handler, { capture: true });
  bound = false;
  console.log('🎹 InputDoctor disabled.');
}
function simulate(key){
  const code = typeof key === 'string' ? key : 'Digit1';
  handler({ target: document.body, code, key: code, preventDefault(){}, stopPropagation(){}} );
}

if (import.meta.env.DEV) enable();

// window helpers
globalThis.inputDoctor = { enable, disable, simulate, setStage, step, STAGES, status: ()=>({ bound, stage: current() }) };
console.log('🩺 InputDoctor loaded. Try: inputDoctor.simulate("Digit2") or press 2.');
