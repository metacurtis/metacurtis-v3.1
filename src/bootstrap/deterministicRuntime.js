// src/bootstrap/deterministicRuntime.js
// Opt-in deterministic runtime hooks for visual regression testing.
//
// Enabled only when URL includes either:
//   - deterministic=1
//   - seed=<value>

const VALID_QUALITY_TIERS = new Set(['LOW', 'MEDIUM', 'HIGH', 'ULTRA']);

function hashSeed(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seedInt) {
  let t = seedInt >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function readDeterministicConfig() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const deterministicFlag = params.get('deterministic');
  const explicitSeed = params.get('seed');
  const enabled = deterministicFlag === '1' || explicitSeed !== null;
  if (!enabled) return null;

  const seed = explicitSeed || '123';
  const qualityRaw = (params.get('quality') || '').toUpperCase();
  const quality = VALID_QUALITY_TIERS.has(qualityRaw) ? qualityRaw : null;

  return { enabled, seed, quality };
}

const cfg = readDeterministicConfig();

if (cfg && typeof window !== 'undefined') {
  const seedFactory = hashSeed(String(cfg.seed));
  const seededRandom = mulberry32(seedFactory());
  const originalRandom = Math.random;

  Math.random = () => seededRandom();
  window.__DETERMINISTIC_MODE__ = true;
  window.__DETERMINISTIC_CONFIG__ = {
    seed: String(cfg.seed),
    quality: cfg.quality,
  };

  if (cfg.quality) {
    window.__FORCE_QUALITY_TIER__ = cfg.quality;
  }

  window.__restoreRandom = () => {
    Math.random = originalRandom;
  };

  console.log('[DeterministicRuntime] Enabled', {
    seed: cfg.seed,
    quality: cfg.quality || '(default)',
  });
}
