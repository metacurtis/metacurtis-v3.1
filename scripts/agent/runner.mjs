#!/usr/bin/env node
/* eslint-env node */
import readline from 'node:readline';
import { loadCanonical, getInvariants, explainInvariant } from './core/canon.mjs';
import { runValidator, runSentinel } from './core/verify.mjs';
import {
  detectEngineGlyphSource, detectEngineBurstParams,
  detectRendererBindGlyphAttrs, detectRendererEmitOnce, detectRendererStage0TintLock,
  detectDirectorSettle, detectOpeningNoCTF, detectOpeningAudioGate
} from './detectors/emergence.mjs';
import {
  patchEngineGlyphBurst, patchRendererEmitOnce, patchRendererStage0TintLock,
  patchDirectorSettle, patchOpeningNoCTFAndAudioGate
} from './patchers/emergence.mjs';

const F = {
  engine: 'src/engine/ConsciousnessEngine.js',
  renderer: 'src/components/webgl/WebGLBackground.jsx',
  director: 'src/theater/TheaterDirector.js',
  opening: 'src/components/theater/OpeningSequence.jsx',
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q)=> new Promise(res => rl.question(q, a => res(a.trim())));

function detect(goal, scope, canon) {
  const want = getInvariants(goal);
  const checks = [];
  for (const inv of want) {
    let pass = false, file = null;
    if (inv.id === 'engine.glyphSource')          { file = F.engine;   pass = detectEngineGlyphSource(file); }
    if (inv.id === 'engine.burstParams')          { file = F.engine;   pass = detectEngineBurstParams(file); }
    if (inv.id === 'renderer.bindGlyphAttrs')     { file = F.renderer; pass = detectRendererBindGlyphAttrs(file); }
    if (inv.id === 'renderer.emitOnce')           { file = F.renderer; pass = detectRendererEmitOnce(file); }
    if (inv.id === 'renderer.stage0TintLock')     { file = F.renderer; pass = detectRendererStage0TintLock(file); }
    if (inv.id === 'director.settleBeforeScroll') { file = F.director; pass = detectDirectorSettle(file); }
    if (inv.id === 'opening.noCTF')               { file = F.opening;  pass = detectOpeningNoCTF(file); }
    if (inv.id === 'opening.audioGate')           { file = F.opening;  pass = detectOpeningAudioGate(file); }
    if (!file) continue;
    if (scope.length && !scope.includes(file)) continue;
    checks.push({ inv, file, pass, why: explainInvariant(inv, canon) });
  }
  return checks;
}

function applyPatch(id, file) {
  if (id === 'engine.glyphSource' || id === 'engine.burstParams') return patchEngineGlyphBurst(file);
  if (id === 'renderer.bindGlyphAttrs') { /* binding check only; no-op */ return true; }
  if (id === 'renderer.emitOnce')           return patchRendererEmitOnce(file);
  if (id === 'renderer.stage0TintLock')     return patchRendererStage0TintLock(file);
  if (id === 'director.settleBeforeScroll') return patchDirectorSettle(file);
  if (id === 'opening.noCTF' || id === 'opening.audioGate') return patchOpeningNoCTFAndAudioGate(file);
  return false;
}

async function main() {
  const canon = loadCanonical();
  let goal = process.argv.find(a => a.startsWith('--goal='))?.split('=')[1] || '';
  if (!goal) goal = await ask('Goal (supported: emergence): ');
  const scopeArg = process.argv.find(a => a.startsWith('--files='))?.split('=')[1] || '';
  const scope = scopeArg ? scopeArg.split(',').map(s=>s.trim()) : [];

  if (goal !== 'emergence') {
    console.log('Supported goals: emergence');
    rl.close(); process.exit(1);
  }

  const checks = detect(goal, scope, canon);
  const failures = checks.filter(c => !c.pass);

  console.log('\n🧭 Canon word(genesis):', canon?.stages?.genesis?.word || 'HELLO CURTIS');
  console.log('\nFindings:');
  if (!failures.length) console.log('  All invariants satisfied for selected scope.');
  else failures.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.inv.id} — ${c.why} [${c.file}]`);
  });

  if (failures.length) {
    const ok = (await ask('\nApply these change(s)? (y/N): ')).toLowerCase()==='y';
    if (!ok) { rl.close(); process.exit(0); }

    let changed = false;
    for (const f of failures) {
      const did = applyPatch(f.inv.id, f.file);
      console.log(did ? '  ✔ patched' : '  • no change', f.inv.id, '→', f.file);
      changed = changed || did;
    }

    console.log('\n🔁 Validator + Sentinel…');
    const vOk = runValidator();
    const sOk = runSentinel();
    console.log((vOk && sOk) ? '  ✅ green.' : '  ⚠️ still red after patch; re-run to view new findings.');
  }

  rl.close();
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
