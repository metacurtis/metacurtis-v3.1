// src/canon-guard/runtime/GuardRuntimeInject.js
import { decideDegrade } from './DegradePolicy.js';


// @doctor:phase4b-hmr-dbdff18d - Component listener cleanup
// @doctor:4b-disposers
const __doctorDisposers = [];const __componentDisposers = [];
// Store original methods if component uses them directly
const __captureUnsub = (unsub) => {
  if (typeof unsub === 'function') {
    __componentDisposers.push(unsub);
  }
  return unsub;
};
(async function () {
  if (!import.meta.env.DEV) return;

  let BeatBus, EVENTS;
  try {
    BeatBus = (await import("@/modules/orchestration/core/BeatBus.js")).default;
    EVENTS = (await import('@/theater/events.js')).EVENTS;
  } catch (e) {
    console.warn('Canon Guard: BeatBus/events not available yet', e);
    return;
  }

  console.log('🛡️ Canon Guard runtime: Blueprint guard ACTIVE (L2→L3)');

  function toF32(a) {
    if (!a) return null;
    if (a instanceof Float32Array) return a;
    return new Float32Array(a);
  }

  function guardBlueprint(payload) {
    const out = { fixes: [] };
    const bp = payload?.blueprint || payload;

    if (!bp) return out;

    // Convert tiers(Uint8Array) -> tierData(Float32Array)
    if (bp.tiers && !bp.tierData) {
      bp.tierData = new Float32Array(bp.tiers);
      out.fixes.push('tiers→tierData(Float32Array)');
    }

    // Ensure Float32Array for GPU-safe attributes
    ['atmosphericPositions', 'allenAtlasPositions', 'animationSeeds', 'sizeMultipliers', 'opacityData', 'atlasIndices'].forEach((k) => {
      if (bp[k] && !(bp[k] instanceof Float32Array)) {
        bp[k] = toF32(bp[k]);
        out.fixes.push(`${k}→Float32Array`);
      }
    });

    // Active count/draw range sanity
    if (!bp.activeCount && (bp.particleCount || bp.maxParticles)) {
      bp.activeCount = bp.particleCount || bp.maxParticles;
      out.fixes.push('activeCount set');
    }

    // Emit incident for Console (if present)
    try {
      window.CANON_CONSOLE?.incident?.({
        code: 'BLUEPRINT_GUARDED',
        severity: out.fixes.length ? 'warn' : 'info',
        message: out.fixes.join(', '),
        context: { stage: bp.stageName, particleCount: bp.activeCount }
      });
    } catch {}

    return out;
  }

  const off = BeatBus.on(EVENTS.BLUEPRINT_READY, (p) => {
    const res = guardBlueprint(p);
    if (res.fixes.length) console.log('🔧 Canon Guard blueprint fixes', res.fixes);
  });

  // Optional L3: simple degrade coordinator (wire your FPS source)
  window.CANON_GUARD_L3 = {
    decideDegrade,
    apply(decision) {
      if (!decision) return;
      // For now we only announce; wire to your qualityAtom or stage bus as you prefer.
      console.log('⚖️  Canon Guard L3 decision', decision);
    }
  };

  // Expose convenience hook for Consoles/Pilot
  // @doctor:4b-handler-dom
  const __doctor_handler_1 = (e) => {const { fpsP95, profile } = e.detail || {};
    const d = decideDegrade({ fpsP95, profile });
    if (d) window.CANON_GUARD_L3.apply(d);
  };__doctorDisposers.push(() => {window.removeEventListener('canon:metrics', __doctor_handler_1);});window.addEventListener('canon:metrics', __doctor_handler_1);

  // cleanup helper
  // @doctor:4b-handler-dom
  const __doctor_handler_2 = () => off && off();__doctorDisposers.push(() => {window.removeEventListener('beforeunload', __doctor_handler_2);});window.addEventListener('beforeunload', __doctor_handler_2);})();


// @doctor:phase4b-hmr-dbdff18d - HMR dispose
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    __componentDisposers.forEach((d) => {
      try {d();} catch (e) {console.warn('Dispose error:', e);}
    });
    __componentDisposers.length = 0;"@doctor:4b-drain";__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error("@doctor:4b dispose error", e);}});
  });
}

/* TODO: Wrap listener calls with __captureUnsub:
   const unsub = __captureUnsub(bus.on('EVENT', handler));
   Lines with uncaptured listeners: 
*/