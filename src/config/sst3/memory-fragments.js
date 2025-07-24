// Minimal fragment data for validator
export const MEMORY_FRAGMENTS = {
  genesis_spark: {
    id: "frag_001",
    stage: "genesis",
    trigger: { type: "scroll", value: 5, unit: "percentage" },
    content: { type: "interactive", element: "commodore_terminal", interaction: "type_enabled" },
    duration: 10000,
    dismissible: true,
    particleEffect: { targetTier: 0, behavior: "converge", intensity: 0.7, radius: 100 },
    audio: { trigger: "keyboard_click_1980s.mp3" }
  }
  // TODO Add the rest
};

export const getFragmentsForStage = (stageName) =>
  Object.values(MEMORY_FRAGMENTS).filter(f => f.stage === stageName);
