import fs from 'node:fs';

export default async function checkFallbackCache() {
  const file = 'src/engine/ConsciousnessEngine.js';
  if (!fs.existsSync(file)) {
    return { name: 'Fallback Cache', ok: false, detail: 'CE not found', advice: ['Ensure fallback caching guard in CE'] };
  }
  const source = fs.readFileSync(file, 'utf8');
  const ok = /text3D fallback.*NOT caching fallback/i.test(source);
  return ok
    ? { name: 'Fallback Cache', ok: true }
    : {
        name: 'Fallback Cache',
        ok: false,
        detail: 'Fallback band appears to be cached',
        advice: ['When !font: return band but do NOT cache it.'],
      };
}
