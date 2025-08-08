// src/utils/random.js
// --------------------------------------------------------------
// Deterministic RNG (≈ 60 ns / call) – good enough for visuals.
// createSeededRandom('genesis|tier1') → fn() // 0 ≤ x < 1
// --------------------------------------------------------------

export function createSeededRandom(seed = '42') {
  let state = hash32(seed) || 1; // never 0 – LCG requirement
  return () => {
    state = (state * 16807) % 2147483647; // Park–Miller LCG
    return (state - 1) / 2147483646; // → float in [0,1)
  };
}

// tiny string→32-bit hash
function hash32(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // keep 32-bit
  }
  return Math.abs(h);
}

// Default export for `import rnd from '@/utils/random.js'`
export default createSeededRandom;
