/* eslint-env node */
import fs from 'node:fs/promises'; import path from 'node:path';
async function readSafe(p){ try{ return await fs.readFile(p,'utf8'); }catch{ return ''; } }
export async function detectOpeningIssues({ cwd }){
  const files = {
    engine: path.join(cwd,'src/engine/ConsciousnessEngine.js'),
    renderer: path.join(cwd,'src/components/webgl/WebGLBackground.jsx'),
    theater: path.join(cwd,'src/components/consciousness/ConsciousnessTheater.jsx'),
    opening: path.join(cwd,'src/components/theater/OpeningSequence.jsx'),
  };
  const [engine, renderer, theater, opening] = await Promise.all(Object.values(files).map(readSafe));
  const issues = [];

  // Opening: overlay-only, single bus, no CTF
  if (!/import\s+BeatBus\s+from\s+['"]@\/theater\/bus['"]/.test(opening)) issues.push({code:'OPENING_BUS', msg:'OpeningSequence should import BeatBus (single bus)', file: files.opening});
  if (/CTF_BUILD/.test(opening)) issues.push({code:'OPENING_CTF', msg:'CTF fade present while CTF is off', file: files.opening});
  if (/(BufferGeometry|useFrame|THREE\.)/.test(opening)) issues.push({code:'OPENING_GEOM', msg:'OpeningSequence must be overlay-only (no geometry writes)', file: files.opening});

  // Engine: opening gate
  if (!/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(engine)) issues.push({code:'ENGINE_GATE', msg:'Engine must block non-genesis during opening', file: files.engine});
  // Engine: mode:'emergence'
  if (!/BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/.test(engine)) issues.push({code:'ENGINE_MODE', msg:'Engine BLUEPRINT_READY (emergence) should include mode:"emergence"', file: files.engine});
  // Engine: no spiral math for emergence
  const hasSpiral = /(swirl|spiral)/.test(engine) || (/ang\s*=\s*(?:i|t)[^;]*\*/.test(engine) && /\br\s*=\s*(?:i|t)\s*\*/.test(engine));
  if (hasSpiral) issues.push({code:'ENGINE_SPIRAL', msg:'Engine emergence uses spiral math; use random->random cloud', file: files.engine});

  // Renderer: fencepost emit present (heuristic)
  if (!/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(renderer)) issues.push({code:'RENDERER_FENCEPOST', msg:'Renderer should emit PARTICLES_EMERGED (emit-once)', file: files.renderer});
  // Renderer: FOV tweak (advisory)
  if (/camera\.fov|updateProjectionMatrix\(/.test(renderer)) issues.push({code:'RENDERER_FOV_TWEAK', level:'warn', msg:'Renderer should not adjust FOV/point-size heuristics; prefer canon-driven uniforms', file: files.renderer});
  // Renderer: stage-0 green lock (advisory)
  if (!/uStageBlend[^\n]*=\s*\(\s*stage(Name|)\s*===\s*['"]genesis['"]\s*\)\s*\?\s*0\s*:/.test(renderer)) issues.push({code:'RENDERER_STAGE0', level:'warn', msg:'Renderer should hold Stage-0 green lock (uStageBlend=0 in genesis)', file: files.renderer});

  // Theater: start-after-viewport gate present
  if (!/ENGINE_VIEWPORT_HINT/.test(theater)) issues.push({code:'THEATER_VIEWPORT', msg:'Theater should wait for ENGINE_VIEWPORT_HINT before starting Director', file: files.theater});

  return issues;
}
