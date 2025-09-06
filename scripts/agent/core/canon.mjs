/* eslint-env node */
import fs from 'fs';
import path from 'path';

export function loadCanonical() {
  const p = path.join(process.cwd(), 'src/config/canonical/sst-v3.3.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
export function loadGoal(goalName) {
  const p = path.join(process.cwd(), 'goals', goalName + '.json');
  if (!fs.existsSync(p)) throw new Error('Goal not found: ' + goalName);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
export function getInvariants(goalName) {
  const goal = loadGoal(goalName);
  return goal.invariants || [];
}
export function explainInvariant(inv, canon) {
  if (inv.id === 'engine.glyphSource')          return 'Emergence SOURCE must sample glyph pixels of ' + (canon?.stages?.genesis?.word || 'HELLO CURTIS');
  if (inv.id === 'engine.burstParams')          return 'Ember burst jitter >= 25 and zDepth >= 6 for firefly/embers look';
  if (inv.id === 'renderer.bindGlyphAttrs')     return 'Renderer must bind atmosphericPosition + text3DPosition (no Allen/atlas attributes)';
  if (inv.id === 'renderer.emitOnce')           return 'Renderer must emit PARTICLES_EMERGED once after first full bind';
  if (inv.id === 'renderer.stage0TintLock')     return 'Stage-0 tint locked to Commodore green (no pre-transition crossfade)';
  if (inv.id === 'director.settleBeforeScroll') return 'Settle morph (0→1) before enabling scroll';
  if (inv.id === 'opening.noCTF')               return 'Remove deprecated CTF fade path';
  if (inv.id === 'opening.audioGate')           return 'Add one-time user-gesture gate for autoplay policy';
  return inv.desc || inv.id;
}
