import BeatBus from "@modules/orchestration/core/BeatBus.js";
import { EVENTS } from "@theater/events.js";

export function attachGuardToMaterial(material, opts) {
  const {
    getActiveCount,
    getMorphProgress,
    getScrollProgress,
    getStageIndex,
    getSize,
    gl
  } = opts;

  let stopped = false;

  // Keep point size & DPR safe
  function refreshStatic() {
    try {
      const dpr = gl.getPixelRatio?.() || 1;
      const size = getSize?.();
      if (size) {
        material.uniforms.uResolution.value.set(size.width, size.height);
      }
      material.uniforms.uDevicePixelRatio.value = dpr;
      material.uniformsNeedUpdate = true;
    } catch {}
  }

  function tick() {
    if (stopped) return;

    const m = material.uniforms;
    if (getMorphProgress) {
      const v = getMorphProgress();
      m.uMorphProgress.value = v;
      m.uStageProgress.value = v;       // alias
    }
    if (getScrollProgress) {
      const v = getScrollProgress();
      m.uScrollProgress.value = v;
      m.uStageBlend.value = v;          // alias
    }
    if (getActiveCount) {
      const c = getActiveCount() | 0;
      m.uActiveCount.value = c;
      m.uTierCutoff.value = c;
    }
    if (getStageIndex) {
      m.uStageIndex.value = getStageIndex() | 0;
      m.uBrainRegion.value = getStageIndex() | 0;
    }

    requestAnimationFrame(tick);
  }

  // Make sure stage/quality signals keep flowing after Director teardown
  const resubscribe = () => {
    const listeners = [
      EVENTS.STAGE_CHANGE,
      EVENTS.QUALITY_CHANGE
    ];
    listeners.forEach(evt => {
      BeatBus.off?.(evt); // ignore if not available
      BeatBus.on(evt, () => {}); // keep at least one listener bound
    });
  };

  refreshStatic();
  resubscribe();
  requestAnimationFrame(tick);

  return () => { stopped = true; };
}
