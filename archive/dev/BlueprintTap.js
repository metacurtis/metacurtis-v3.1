/**
 * Repo Medicine: Blueprint tap (DEV ONLY)
 * Non-invasive inspector for blueprint flow.
 */
let attached = false;
export function attachBlueprintTap(BeatBus) {
  if (attached || !BeatBus?.on) return;
  attached = true;
  const summarize = (bp) => {
    const b = bp?.blueprint || bp;
    const n = b?.particleCount ?? b?.positions?.length ?? b?.atmosphericPositions?.length ?? 0;
    return { keys: Object.keys(b||{}), count: n };
  };
  BeatBus.on('BLUEPRINT_READY', (bp) => {
    const s = summarize(bp);
    console.info('[RM] BLUEPRINT_READY', s);
    if (typeof window !== 'undefined') window.__RM_BP_LAST = { at: Date.now(), ...s };
  });
}
