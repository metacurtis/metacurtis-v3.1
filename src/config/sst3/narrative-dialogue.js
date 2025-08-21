// @doctor:4b-disposers
const __doctorDisposers = [];export const NARRATIVE_DIALOGUE = { genesis: {
    id: "narr_genesis_001",
    narration: {
      segments: [
      { id: "gen_1", text: "I was eight years old...", timing: { start: 3000, duration: 8000 } },
      { id: "gen_3", text: "I typed those lines exactly...", timing: { start: 17000, duration: 5000 }, memoryFragmentTrigger: "genesis_terminal" }]

    }
  },
  discipline: {
    id: "narr_discipline_001",
    narration: {
      segments: [
      { id: "dis_1", text: "That spark? It got buried.", timing: { start: 0, duration: 3000 } }]

    }
  }
  // ... Add full segments later
};

export const getDialogueSegment = (stage, segmentId) => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return null;
  return s.narration?.segments?.find((seg) => seg.id === segmentId) || null;
};

export const getParticleCuesForStage = (stage) => {
  const s = NARRATIVE_DIALOGUE[stage];
  if (!s) return [];
  return s.narration?.segments?.
  filter((seg) => seg.particleCue).
  map((seg) => ({ timing: seg.timing.start, cue: seg.particleCue, segmentId: seg.id })) || [];
}; // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}