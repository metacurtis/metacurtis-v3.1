// Minimal narrative data to satisfy validator
export const NARRATIVE_DIALOGUE = {
  genesis: {
    id: "narr_genesis_001",
    version: "1.0.0",
    narration: {
      voiceActor: "Curtis",
      emotion: "warm",
      segments: [
        { id: "gen_1", text: "I was eight years old...", timing: { start: 0, duration: 3000 } }
      ]
    }
  },
  discipline: {
    id: "narr_discipline_001",
    version: "1.0.0",
    narration: {
      voiceActor: "Curtis",
      emotion: "structured",
      segments: [
        { id: "dis_1", text: "That spark? It got buried.", timing: { start: 0, duration: 3000 } }
      ]
    }
  }
  // TODO Extend remaining stages later
};

export const getDialogueForStage = (stageName) => NARRATIVE_DIALOGUE[stageName];
