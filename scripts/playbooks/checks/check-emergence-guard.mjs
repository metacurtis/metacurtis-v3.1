import fs from 'node:fs';

export default async function checkEmergenceGuard() {
  const file = 'src/engine/ConsciousnessEngine.js';
  if (!fs.existsSync(file)) {
    return {
      name: 'Emergence Guard',
      ok: false,
      detail: 'CE not found',
      advice: ['Add emergence guard to CE'],
    };
  }
  const source = fs.readFileSync(file, 'utf8');
  const hasActiveFlags = source.includes('this._emergenceActive = true') && source.includes('this._emergenceActive = false');
  const hasGate = /buildAndEmitBlueprint\([^)]*\)\s*{[\s\S]*?if\s*\(this\._emergenceActive/.test(source);
  const ok = hasActiveFlags && hasGate;
  return ok
    ? { name: 'Emergence Guard', ok: true }
    : {
        name: 'Emergence Guard',
        ok: false,
        detail: 'guard not found',
        advice: [
          'Set this._emergenceActive=true at emergence start; false on settle & PARTICLES_EMERGED.',
          'Gate buildAndEmitBlueprint while _emergenceActive is true.',
        ],
      };
}
