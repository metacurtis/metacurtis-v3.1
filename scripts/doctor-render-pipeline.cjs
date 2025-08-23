#!/usr/bin/env node
/**
 * Render Pipeline Doctor (read-only)
 * Purpose: Verify Stage → Engine → BeatBus → Renderer linkage and Morph interpolation.
 * Inputs : doctor_artifacts/hot-dors-report.json + repo files
 * Outputs: doctor_artifacts/render-doctor-report.json
 *          doctor_artifacts/render-doctor-summary.md
 * Exit   : 0 = ok, 2 = issues found, 4 = internal error
 */

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const ART = p => path.join(CWD, 'doctor_artifacts', p);
const HOT = ART('hot-dors-report.json');

const EXIT = { OK:0, ISSUES:2, ERR:4 };

const candidates = {
  engine: [
    'src/engine/ConsciousnessEngine.js',
    'src/engine/NarrativeController.js'
  ],
  bus: [
    'src/modules/orchestration/core/BeatBus.js',
    'modules/orchestration/core/BeatBus.js'
  ],
  renderer: [
    'src/components/webgl/WebGLBackground.jsx',
    'src/components/webgl/WebGLCanvas.jsx'
  ],
  entrypoints: [
    'src/main.jsx','src/index.jsx','src/App.jsx','src/core/index.js',
    'src/canon/contracts/index.js','src/stores/atoms/index.js','modules/state/index.js'
  ],
  eventFiles: ['src/modules/orchestration/core/EventCatalog.js','src/canon/contracts/events.js']
};

function read(p){ try { return fs.readFileSync(p,'utf8'); } catch { return null; } }
function exists(p){ return fs.existsSync(p); }
function listFromImportGraph(){ try {
  const r = JSON.parse(read(HOT));
  return Object.keys(r?.sentinels?.aliases?.importGraph || {});
} catch { return []; }}

// reachability via HOT-DORS graph
function loadGraph(){
  const r = JSON.parse(read(HOT));
  const g = new Map(Object.entries(r.sentinels.aliases.importGraph));
  const roots = (r.sentinels.aliases.specialEntrypoints || []).filter(exists);
  return { g, roots, report:r };
}
function reachable(g, roots, target){
  if(!g.has(target)) return false;
  const seen = new Set(), q = [...roots];
  while(q.length){
    const cur = q.shift();
    if(seen.has(cur)) continue;
    seen.add(cur);
    if(cur === target) return true;
    const node = g.get(cur); if(!node) continue;
    for(const imp of (node.imports||[])){
      // try to resolve literally; HOT-DORS graph keys are already resolved paths
      const variations = [imp, imp+'.js', imp+'.jsx', imp+'.ts', imp+'.tsx', imp+'/index.js'];
      for(const v of variations){ if(g.has(v)) q.push(v); }
    }
  }
  return false;
}

// scan helper over all known source files (from HOT-DORS graph)
function scanAll(pattern){
  const files = listFromImportGraph();
  const hits = [];
  for(const f of files){
    const s = read(f); if(!s) continue;
    if(pattern.test(s)) hits.push(f);
  }
  return hits;
}

function main(){
  try{
    if(!exists(HOT)) {
      console.error('✖ Missing HOT-DORS report. Run: npm run -s hot-dors');
      process.exit(EXIT.ERR);
    }
    const { g, roots } = loadGraph();

    const probe = {
      timestamp: new Date().toISOString(),
      engine: { found:[], reachable:[] },
      bus: { found:[], reachable:[] },
      renderer: { found:[], reachable:[] },
      events: { BLUEPRINT_READY: { definedIn:[], emits:[], subscribers:[] } },
      morph: { hasUniform:false, hasLerp:false, where:{uniform:[], lerp:[]} },
      summary: { pipelineOK:false, morphOK:false, notes:[] }
    };

    // Locate components & reachability
    for(const k of ['engine','bus','renderer']){
      for(const rel of candidates[k]){
        const p = path.join(CWD, rel);
        if(exists(p)){ 
          probe[k].found.push(rel);
          if(reachable(g, roots, rel)) probe[k].reachable.push(rel);
        }
      }
    }

    // Event definition + producers/consumers
    const defHits = scanAll(/\bBLUEPRINT_READY\b/);
    probe.events.BLUEPRINT_READY.definedIn = defHits.filter(f => candidates.eventFiles.some(e => f.endsWith(e)));

    const emitHits = scanAll(/\.emit\s*\(\s*(?:EVENTS\.)?BLUEPRINT_READY\b/);
    probe.events.BLUEPRINT_READY.emits = emitHits;

    const subHits = scanAll(/\.on\s*\(\s*(?:EVENTS\.)?BLUEPRINT_READY\b/);
    probe.events.BLUEPRINT_READY.subscribers = subHits;

    // Morph signals in renderer
    const rFiles = [...probe.renderer.found];
    for(const rel of rFiles){
      const s = read(path.join(CWD, rel)) || '';
      if(/\buMorphProgress\b/.test(s)){ probe.morph.hasUniform = true; probe.morph.where.uniform.push(rel); }
      if(/\blerp\s*\(|\bmix\s*\(|morphProgress\s*[\*\+]/.test(s)){ probe.morph.hasLerp = true; probe.morph.where.lerp.push(rel); }
    }

    // Compute verdicts
    const engineOk = probe.engine.reachable.length > 0;
    const busOk    = probe.bus.reachable.length > 0;
    const renderOk = probe.renderer.reachable.length > 0;
    const emitsOk  = probe.events.BLUEPRINT_READY.emits.length > 0;
    const subsOk   = probe.events.BLUEPRINT_READY.subscribers.length > 0;

    probe.summary.pipelineOK = engineOk && busOk && renderOk && emitsOk && subsOk;
    if(!engineOk) probe.summary.notes.push('Engine not reachable from entrypoints.');
    if(!busOk)    probe.summary.notes.push('BeatBus not reachable from entrypoints.');
    if(!renderOk) probe.summary.notes.push('Renderer not reachable from entrypoints.');
    if(!emitsOk)  probe.summary.notes.push('No BLUEPRINT_READY emit() found.');
    if(!subsOk)   probe.summary.notes.push('No BLUEPRINT_READY subscription found in renderer path.');

    probe.summary.morphOK = probe.morph.hasUniform && probe.morph.hasLerp;
    if(!probe.morph.hasUniform) probe.summary.notes.push('Renderer missing uMorphProgress uniform (or equivalent prop).');
    if(!probe.morph.hasLerp)    probe.summary.notes.push('No morph interpolation detected between positions.');

    // Write artifacts
    fs.writeFileSync(ART('render-doctor-report.json'), JSON.stringify(probe,null,2));
    const md = [
      `# Render Pipeline Doctor`,
      `Generated: ${probe.timestamp}`,
      ``,
      `## Pipeline`,
      `- Engine reachable: ${engineOk ? 'YES' : 'NO'} ${probe.engine.reachable[0]||''}`,
      `- BeatBus reachable: ${busOk ? 'YES' : 'NO'} ${probe.bus.reachable[0]||''}`,
      `- Renderer reachable: ${renderOk ? 'YES' : 'NO'} ${probe.renderer.reachable[0]||''}`,
      `- Emits BLUEPRINT_READY: ${emitsOk ? 'YES' : 'NO'}`,
      `- Subscribes BLUEPRINT_READY: ${subsOk ? 'YES' : 'NO'}`,
      ``,
      `## Morph`,
      `- uMorphProgress uniform (or prop): ${probe.morph.hasUniform ? 'YES' : 'NO'}` + (probe.morph.where.uniform.length?` (${probe.morph.where.uniform.join(', ')})`:``),
      `- Interpolation present (lerp/mix): ${probe.morph.hasLerp ? 'YES' : 'NO'}` + (probe.morph.where.lerp.length?` (${probe.morph.where.lerp.join(', ')})`:``),
      ``,
      `## Files that .emit(BLUEPRINT_READY)`,
      ...(probe.events.BLUEPRINT_READY.emits.length?probe.events.BLUEPRINT_READY.emits.map(f=>`- ${f}`):['- (none)']),
      ``,
      `## Files that .on(BLUEPRINT_READY)`,
      ...(probe.events.BLUEPRINT_READY.subscribers.length?probe.events.BLUEPRINT_READY.subscribers.map(f=>`- ${f}`):['- (none)']),
      ``,
      `## Notes`,
      ...(probe.summary.notes.length?probe.summary.notes.map(n=>`- ${n}`):['- All good.']),
      ``
    ].join('\n');
    fs.writeFileSync(ART('render-doctor-summary.md'), md);

    // Console output
    console.log(`Render Pipeline: ${probe.summary.pipelineOK ? 'OK' : 'ISSUES'}`);
    console.log(`Morph Wiring   : ${probe.summary.morphOK ? 'OK' : 'ISSUES'}`);
    console.log(`Artifacts:\n - ${ART('render-doctor-report.json')}\n - ${ART('render-doctor-summary.md')}`);

    process.exit((probe.summary.pipelineOK && probe.summary.morphOK) ? EXIT.OK : EXIT.ISSUES);
  }catch(err){
    console.error('✖ Render Doctor error:', err.message);
    process.exit(EXIT.ERR);
  }
}

if(require.main === module) main();
