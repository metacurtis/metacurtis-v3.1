// bootstrap/wireSSTv3.js
// Central wiring layer for SST v3.0 engine components

import { narrativeController } from "@/engine/NarrativeController.js";
import { memoryFragmentController } from "@/engine/MemoryFragmentController.js";
import { stageAtom } from "@/stores/atoms/stageAtom.js";
import { qualityAtom } from "@/stores/atoms/qualityAtom.js";
import consciousnessEngine from "@/engine/ConsciousnessEngine.js";

export function wireSSTv3() {
  console.log("🔌 wireSSTv3: Initializing central event wiring...");
  
  // Forward events to window for WebGLBackground
  if (narrativeController.on) {
    narrativeController.on("particleCue", (event) => {
      window.dispatchEvent(new CustomEvent("sst:particleCue", { 
        detail: event 
      }));
    });
  }
  
  if (memoryFragmentController.on) {
    memoryFragmentController.on("tierHighlightUpdate", (event) => {
      window.dispatchEvent(new CustomEvent("sst:tierHighlight", { 
        detail: event 
      }));
    });
  }
  
  // Subscribe to atoms
  stageAtom.subscribe((state) => {
    window.dispatchEvent(new CustomEvent("sst:stageChange", {
      detail: {
        stage: state.currentStage,
        progress: state.progress,
        isTransitioning: state.isTransitioning
      }
    }));
  });
  
  qualityAtom.subscribe((state) => {
    window.dispatchEvent(new CustomEvent("sst:qualityChange", {
      detail: {
        tier: state.currentTier,
        particleBudget: state.particleBudget,
        dpr: state.dpr
      }
    }));
  });
  
  console.log("✅ wireSSTv3: Event wiring complete");
}
