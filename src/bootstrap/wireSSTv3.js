// src/bootstrap/wireSSTv3.js
// Central wiring layer for SST v3.0 engine components (idempotent + cleanup)

import { narrativeController } from "@/engine/NarrativeController.js";
import { memoryFragmentController } from "@/engine/MemoryFragmentController.js";
import { stageAtom } from "@/stores/atoms/stageAtom.js";
import { qualityAtom } from "@/stores/atoms/qualityAtom.js";
import consciousnessEngine from "@/engine/ConsciousnessEngine.js";

export function wireSSTv3({ force = false } = {}) {
  // Guard against multiple runs unless force = true
  if (globalThis.__SST_WIRED__ && !force) {
    return globalThis.__SST_WIRE_CLEANUP__ || (() => {});
  }
  globalThis.__SST_WIRED__ = true;

  // SSR safety
  if (typeof window === "undefined") {
    console.warn("wireSSTv3() called in non-window context. Skipping wiring.");
    return () => {};
  }

  console.log("🔌 wireSSTv3: Initializing central event wiring...");

  const cleanups = [];

  // ---------- NarrativeController -> window ----------
  if (narrativeController?.on) {
    const handleParticleCue = (event) => {
      window.dispatchEvent(
        new CustomEvent("sst:particleCue", { detail: event })
      );
    };
    narrativeController.on("particleCue", handleParticleCue);

    // Detach if the controller exposes off()
    if (narrativeController.off) {
      cleanups.push(() => narrativeController.off("particleCue", handleParticleCue));
    }
  }

  // ---------- MemoryFragmentController -> window ----------
  if (memoryFragmentController?.on) {
    const handleTierHighlight = (event) => {
      window.dispatchEvent(
        new CustomEvent("sst:tierHighlight", { detail: event })
      );
    };
    memoryFragmentController.on("tierHighlightUpdate", handleTierHighlight);

    if (memoryFragmentController.off) {
      cleanups.push(() =>
        memoryFragmentController.off("tierHighlightUpdate", handleTierHighlight)
      );
    }
  }

  // ---------- Stage atom -> window ----------
  const unsubStage = stageAtom.subscribe((state) => {
    // Make sure these keys match your actual stageAtom shape
    window.dispatchEvent(
      new CustomEvent("sst:stageChange", {
        detail: {
          stage: state.currentStage,
          nextStage: state.nextStage,
          stageProgress: state.stageProgress,
          stageBlend: state.stageBlend,
          isTransitioning: state.isTransitioning ?? false,
        },
      })
    );
  });
  cleanups.push(unsubStage);

  // ---------- Quality atom -> window ----------
  const unsubQuality = qualityAtom.subscribe((state) => {
    window.dispatchEvent(
      new CustomEvent("sst:qualityChange", {
        detail: {
          tier: state.currentTier,
          particleBudget: state.particleBudget,
          dpr: state.dpr,
        },
      })
    );
  });
  cleanups.push(unsubQuality);

  // ---------- Engine quality event relay (optional) ----------
  const engineHandler = (evt) => {
    window.dispatchEvent(
      new CustomEvent("sst:engineQualityChange", { detail: evt.detail })
    );
  };
  window.addEventListener("engineQualityChange", engineHandler);
  cleanups.push(() => window.removeEventListener("engineQualityChange", engineHandler));

  console.log("✅ wireSSTv3: Event wiring complete");

  // Provide a cleanup function
  const cleanup = () => {
    cleanups.forEach((fn) => fn && fn());
    globalThis.__SST_WIRED__ = false;
    globalThis.__SST_WIRE_CLEANUP__ = null;
    console.log("🧹 wireSSTv3: Cleaned up event wiring");
  };

  globalThis.__SST_WIRE_CLEANUP__ = cleanup;
  return cleanup;
}
