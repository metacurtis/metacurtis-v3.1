// @doctor:4b-disposers
const __doctorDisposers = []; // src/canon-guard/runtime/DegradePolicy.js
const DEFAULT = { targetFpsP95: 55,
  degradeOrder: ['particleCount.tier1', 'particleCount.tier2', 'pointSize', 'atlasRes'],
  neverSacrifice: ['tier4Prominence', 'colorPhilosophy', 'morphSmoothness']
};

export function decideDegrade({ fpsP95, profile }) {
  const order = profile?.degradeOrder || DEFAULT.degradeOrder;
  const target = profile?.targetFpsP95 || DEFAULT.targetFpsP95;
  if (typeof fpsP95 !== 'number') return null;
  if (fpsP95 >= target) return null;
  const what = order[0];
  return { action: 'DEGRADE', what, amount: 0.15, reason: `p95=${fpsP95} < target=${target}` };
} // @doctor:4b-hmr
if (import.meta?.hot) {import.meta.hot.accept?.();import.meta.hot.dispose?.(() => {'@doctor:4b-drain';__doctorDisposers.splice(0).forEach((fn) => {try {fn?.();} catch (e) {console.error('@doctor:4b dispose error', e);}});});}