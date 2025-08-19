/* eslint-disable no-console */
import * as THREE from 'three';

// ————— helpers —————
function getScene(){
  const r3f = globalThis.__r3f || {};
  return r3f.scene || globalThis.scene || null;
}
function findPoints(){
  const s = getScene(); if (!s) return null;
  let found = null;
  s.traverse?.(o => { if (!found && (o?.isPoints || o?.type === 'Points') && o.geometry && o.material) found = o; });
  return found;
}
function getBus(){
  return globalThis.CANON_BEATBUS || globalThis.BeatBus || null;
}
function keyFrom(obj, keys){
  for (const k of keys) if (obj && obj[k]) return k;
  return null;
}

// ————— state —————
let points = null, geom = null, mat = null, rafId = 0;

// ————— core —————
function ensureTargets(){
  points = findPoints();
  if (!points) return false;
  geom = points.geometry; mat = points.material;
  if (!geom || !mat) return false;

  // normalize uniforms
  const u = mat.uniforms || (mat.uniforms = {});
  if (!('uMorphProgress' in u) && 'uMorph' in u) u.uMorphProgress = u.uMorph;
  if (!('uFadeProgress' in u) && 'uFade' in u)   u.uFadeProgress  = u.uFade;

  // ensure attributes exist (GPU path)
  if (!geom.getAttribute('aFromPosition')) geom.setAttribute('aFromPosition', new THREE.BufferAttribute(new Float32Array(0), 3));
  if (!geom.getAttribute('aToPosition'))   geom.setAttribute('aToPosition',   new THREE.BufferAttribute(new Float32Array(0), 3));
  return true;
}

function mirrorAttr(name, src){
  if (!geom.getAttribute(name)) geom.setAttribute(name, src);
}

function applyBlueprint(bp){
  if (!ensureTargets()) return false;

  // Try common key names
  const fromKey = keyFrom(bp, ['from','fromPositions','positionsFrom','atmosphericPositions','screenTextPositions','positions_prev']);
  const toKey   = keyFrom(bp, ['to','toPositions','positionsTo','allenAtlasPositions','atlasPositions','positions_next','positions']);

  let fromArr = fromKey ? bp[fromKey] : null;
  let toArr   = toKey   ? bp[toKey]   : null;

  // Fallback "from": previous 'to' or current 'position'
  if (!fromArr) {
    const prevTo = geom.getAttribute('aToPosition');
    if (prevTo?.array?.length)      fromArr = prevTo.array.slice ? prevTo.array.slice() : new Float32Array(prevTo.array);
    else if (geom.getAttribute('position')?.array?.length) {
      const pos = geom.getAttribute('position').array;
      fromArr = pos.slice ? pos.slice() : new Float32Array(pos);
    }
  }
  // Fallback "to": single positions field
  if (!toArr && bp?.positions?.length) toArr = bp.positions;

  if (!(fromArr && toArr)) {
    console.warn('[MorphDoctor] Missing from/to arrays', { fromKey, toKey, keys: Object.keys(bp||{}) });
    return false;
  }

  const needVals = Math.min(fromArr.length, toArr.length);
  const count = Math.floor(needVals / 3);

  const from = fromArr instanceof Float32Array ? fromArr : new Float32Array(fromArr);
  const to   = toArr   instanceof Float32Array ? toArr   : new Float32Array(toArr);

  // Resize / set GPU attributes
  const setAttr = (name) => {
    const a = geom.getAttribute(name);
    if (!a?.array || a.array.length !== count*3) {
      geom.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count*3), 3));
    }
    return geom.getAttribute(name);
  };
  const aFrom = setAttr('aFromPosition');
  const aTo   = setAttr('aToPosition');
  aFrom.array.set(from.subarray ? from.subarray(0, count*3) : from.slice(0, count*3));
  aTo.array.set(  to.subarray   ? to.subarray(0, count*3)   : to.slice(0, count*3));
  aFrom.needsUpdate = aTo.needsUpdate = true;

  // Provide common synonyms the shader might use
  mirrorAttr('aFromPos', aFrom);
  mirrorAttr('aToPos',   aTo);
  mirrorAttr('aFrom',    aFrom);
  mirrorAttr('aTo',      aTo);

  // drawRange + active count
  try { geom.setDrawRange(0, count); } catch {}
  try { mat.uniforms.uActiveCount && (mat.uniforms.uActiveCount.value = count); } catch {}

  // Quick diff signal (large = visibly different)
  let diff = 0;
  for (let i=0;i<count*3;i+=3){ diff += Math.abs(to[i]-from[i]) + Math.abs(to[i+1]-from[i+1]) + Math.abs(to[i+2]-from[i+2]); }
  if (diff < 1e-6) console.warn('[MorphDoctor] from/to nearly identical; morph may not be visible.', { diff });

  // Animate GPU uniform + CPU fallback (position)
  const u = mat.uniforms || {};
  if (u.uMorphProgress) u.uMorphProgress.value = 0;

  // Ensure "position" exists for CPU fallback
  if (!geom.getAttribute('position') || geom.getAttribute('position').array.length !== count*3) {
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count*3), 3));
  }
  const pos = geom.getAttribute('position').array;

  cancelAnimationFrame(rafId);
  const start = performance.now();
  const dur = 2200;
  const ease = t => (t<0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2);

  const step = (now) => {
    const t = Math.min(1, (now - start)/dur);
    const et = ease(t);

    // GPU path
    if (u.uMorphProgress) u.uMorphProgress.value = et;

    // CPU fallback (safe even when GPU morph works)
    for (let i=0;i<count*3;i++){
      pos[i] = aFrom.array[i]*(1-et) + aTo.array[i]*et;
    }
    geom.getAttribute('position').needsUpdate = true;

    if (t < 1) rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);

  try { geom.computeBoundingSphere(); } catch {}

  console.log('[MorphDoctor] armed morph', { count, fromKey, toKey, diff: Math.round(diff) });
  return true;
}

function attach(){
  const bus = getBus();
  if (!bus?.on) { console.warn('[MorphDoctor] No BeatBus detected.'); return () => {}; }
  const off = bus.on('BLUEPRINT_READY', ({ blueprint }) => {
    try { applyBlueprint(blueprint); } catch (e) { console.error('[MorphDoctor] apply error', e); }
  });
  return off;
}

function status(){
  const ok = !!findPoints();
  const g = ok ? findPoints().geometry : null;
  const m = ok ? findPoints().material : null;
  const aF = g?.getAttribute?.('aFromPosition');
  const aT = g?.getAttribute?.('aToPosition');
  const pos = g?.getAttribute?.('position');
  const u = m?.uniforms;
  return {
    ok,
    hasFrom: !!aF, hasTo: !!aT, hasPos: !!pos,
    uMorph: u?.uMorphProgress?.value ?? null,
    active: g?.drawRange?.count ?? aT?.count ?? pos?.count ?? 0
  };
}

function preview(stage){
  const sc = globalThis.stateControls || globalThis.stageControls;
  if (sc?.setStage) sc.setStage(stage);
  else if (sc?.set) sc.set(stage);
  else getBus()?.emit?.('STAGE_CHANGE', { stage });
}

if (import.meta.env.DEV) {
  const iv = setInterval(() => {
    if (ensureTargets()) {
      clearInterval(iv);
      attach();
      console.log('🧬 MorphDoctor attached (listening for BLUEPRINT_READY).');
    }
  }, 250);
}

// Expose for DevTools
globalThis.morphDoctor = { applyBlueprint, status, preview };
export default globalThis.morphDoctor;
