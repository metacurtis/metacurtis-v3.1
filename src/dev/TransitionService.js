/* eslint-disable no-console */
// DEV TransitionService (idempotent, singleton)
import * as THREE from 'three';

// Stage → target colour map (adjust to your canonical palette as needed)
const STAGE_COLOUR = {
  genesis:   '#00ff00',
  discipline:'#ffcc00',
  neural:    '#66ccff',
  velocity:  '#ff66aa',
  architecture:'#9b59b6',
  harmony:   '#1abc9c',
  transcendence:'#ffffff',
};

function hexToColor(v){
  // Accept '#rrggbb' | 0xrrggbb | [r,g,b] | THREE.Color
  if (v instanceof THREE.Color) return v.clone();
  if (Array.isArray(v)) return new THREE.Color().fromArray(v);
  if (typeof v === 'number') return new THREE.Color(v);
  return new THREE.Color(v || '#00ff00');
}

function mixColor(a,b,t){
  const c = new THREE.Color();
  c.r = a.r + (b.r - a.r) * t;
  c.g = a.g + (b.g - a.g) * t;
  c.b = a.b + (b.b - a.b) * t;
  return c;
}

function pickScene(){
  // r3f or plain three
  return (globalThis.__r3f && globalThis.__r3f.scene) || globalThis.scene || null;
}

function findPointsMaterial(){
  const scene = pickScene();
  if (!scene) return null;
  let mat = null;
  scene.traverse?.(o=>{
    if (!mat && (o.isPoints || o.type === 'Points')) mat = o.material || null;
  });
  return mat || null;
}

function getU(mat, key){
  const u = mat && mat.uniforms && mat.uniforms[key];
  return u ? u : null;
}
function setUFloat(mat, key, v){
  const u = getU(mat, key);
  if (!u) return false;
  u.value = typeof v === 'number' ? v : 0;
  return true;
}
function setUColor(mat, key, col){
  const u = getU(mat, key);
  if (!u) return false;
  const c = hexToColor(col);
  if (u.value instanceof THREE.Color) {
    u.value.copy(c);
  } else {
    // allow vec3 array uniforms
    u.value = [c.r, c.g, c.b];
  }
  return true;
}
function readColor(mat, key){
  const u = getU(mat, key);
  if (!u) return null;
  if (u.value instanceof THREE.Color) return u.value.clone();
  if (Array.isArray(u.value)) return new THREE.Color().fromArray(u.value);
  return null;
}

class TransitionService {
  constructor(){
    this._mat = null;
    this._raf = 0;
    this._anim = null;
    this._currentStage = 'genesis';
    this._lastResolved = new THREE.Color('#00ff00');
  }
  ensureMaterial(){
    this._mat = this._mat || findPointsMaterial();
    return this._mat;
  }
  getStatus(){
    const m = this.ensureMaterial();
    const has = (k)=> !!getU(m,k);
    return {
      stage: this._currentStage,
      material: !!m,
      uniforms: {
        uColorCurrent: has('uColorCurrent'),
        uColorNext: has('uColorNext'),
        uMorphProgress: has('uMorphProgress'),
        uFadeProgress: has('uFadeProgress'),
      },
      values: {
        uMorphProgress: getU(m,'uMorphProgress')?.value ?? null,
        uFadeProgress: getU(m,'uFadeProgress')?.value ?? null,
      }
    };
  }
  selfTest(){
    const s = this.getStatus();
    console.group('TransitionService selfTest');
    console.table([
      { key:'material', value:s.material },
      { key:'uColorCurrent', value:s.uniforms.uColorCurrent },
      { key:'uColorNext', value:s.uniforms.uColorNext },
      { key:'uMorphProgress', value:s.uniforms.uMorphProgress },
      { key:'uFadeProgress', value:s.uniforms.uFadeProgress },
    ]);
    console.groupEnd();
    return s;
  }
  cancel(){
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._anim = null;
  }
  // Re-arm then animate morph/fade to target colour
  _animateTo(targetColor, ms=1800){
    const m = this.ensureMaterial();
    if (!m) { console.warn('[TransitionService] Points material not found'); return; }

    // Resolve currently displayed colour and use it as new "current"
    const colCur  = readColor(m, 'uColorCurrent') || new THREE.Color('#00ff00');
    const colNext = readColor(m, 'uColorNext') || colCur.clone();
    const tProg   = getU(m,'uMorphProgress')?.value ?? 1.0;
    const fProg   = getU(m,'uFadeProgress')?.value ?? 0.0;
    const shown   = mixColor( mixColor(colCur,colNext,tProg), colNext, fProg );

    setUColor(m, 'uColorCurrent', shown);
    setUColor(m, 'uColorNext', targetColor);
    setUFloat(m, 'uMorphProgress', 0.0);
    setUFloat(m, 'uFadeProgress',  0.0);

    this.cancel();
    const t0 = performance.now();
    const dur = Math.max(120, ms|0);
    const ease = (t)=> t<0.5 ? 2*t*t : -1+(4-2*t)*t; // quad in/out

    const tick = (now)=>{
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      setUFloat(m, 'uMorphProgress', e);
      setUFloat(m, 'uFadeProgress',  e);
      if (t < 1) {
        this._raf = requestAnimationFrame(tick);
      } else {
        // lock in target as current for future re-arms
        setUColor(m, 'uColorCurrent', targetColor);
        setUFloat(m, 'uMorphProgress', 1.0);
        setUFloat(m, 'uFadeProgress',  1.0);
        this._raf = 0;
      }
    };
    this._raf = requestAnimationFrame(tick);
  }
  // Morph visuals to match a stage (colour-only driver)
  toStage(stage, opts={}){
    this._currentStage = stage || this._currentStage || 'genesis';
    const col = STAGE_COLOUR[this._currentStage] || '#00ff00';
    this._animateTo(col, opts.duration ?? 1800);
  }
  // Preview a stage colour without changing logical stage
  preview(stage, opts={}){
    const col = STAGE_COLOUR[stage] || STAGE_COLOUR.genesis;
    this._animateTo(col, opts.duration ?? 1200);
  }
}

// Singleton and window helpers
const __svc = (globalThis.__TransitionService__ ||= new TransitionService());
if (!globalThis.stageVisuals) globalThis.stageVisuals = {};
Object.assign(globalThis.stageVisuals, {
  getStatus: ()=> __svc.getStatus(),
  selfTest : ()=> __svc.selfTest(),
  preview  : (stage, ms)=> __svc.preview(stage, { duration: ms }),
  morphTo  : (stage, ms)=> __svc.toStage(stage, { duration: ms }),
  _cancel  : ()=> __svc.cancel(),
});

try {
  // Auto-subscribe to STAGE_CHANGE (string key is fine for your bus)
  const BeatBus = globalThis.CANON_BEATBUS || globalThis.BeatBus;
  if (BeatBus?.on) {
    BeatBus.on('STAGE_CHANGE', ({stage})=>{
      __svc.toStage(stage);
    });
  }
} catch(e){
  console.warn('[TransitionService] Could not subscribe to STAGE_CHANGE', e);
}

export default __svc;
