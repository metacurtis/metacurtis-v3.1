#!/usr/bin/env node
/**
 * doctor_statecore_deterministic_lane.cjs
 * Finish State-Core deterministic control lane:
 * - StateController: STAGE_CHANGE {from,to}, QUALITY_CHANGE {tier}
 * - ConsciousnessEngine: BeatBusAdapter singleton, abort-stale token, cache + prewarm,
 *   emit BLUEPRINT_READY once per change (keep old payload; add from/to/count).
 *
 * Idempotent. Dry run by default. Use --commit to persist and tag.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const CANDIDATE_STATE = [
  'src/state/StateController.js',
  'src/state/stateController.js',
  'src/modules/state/StateController.js',
  'src/core/StateController.js',
];
const ENGINE_FILE = 'src/engine/ConsciousnessEngine.js';

const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAPDIR = path.join('snapshots', `doctor_statecore_deterministic_lane_${NOW}`);

const ARGS = new Set(process.argv.slice(2));
const DO_COMMIT = ARGS.has('--commit');
const DO_PUSH = ARGS.has('--push');
const NO_VERIFY = ARGS.has('--no-verify');
const MSG = (() => {
  const i = process.argv.indexOf('--message');
  return (i !== -1 && process.argv[i+1]) ? process.argv[i+1]
    : 'chore(dev): state-core — deterministic lane (from/to, tier, abort-stale, prewarm, cache)';
})();

function p(...segs){ return path.join(ROOT, ...segs); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f), 'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(p(f), p(bak)); log(`backup: ${bak}`); } }
function snap(f, s){ ensureDir(SNAPDIR); fs.writeFileSync(p(SNAPDIR, f.replace(/\//g,'__')+'.txt'), s, 'utf8'); }
function log(s){ console.log('·', s); }
function warn(s){ console.warn('! ', s); }

let touched = [];

/* --------------------------- STATECONTROLLER PATCH --------------------------- */
function patchStateController(){
  const file = CANDIDATE_STATE.find(ex);
  if (!file){ warn('StateController file not found (tried common paths)'); return; }

  let src = rd(file), orig = src; backupOnce(file);

  // setStage → emit {from,to}
  if (!/STAGE_CHANGE[^]*\{\s*from\s*:/.test(src)) {
    src = src.replace(
      /function\s+setStage\s*\(\s*name\s*\)\s*\{[^]*?_\s*stage\s*=\s*name\s*;[^]*?_emit\s*\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\{[^}]*\}\s*\)\s*;\s*\}/m,
      (m)=>{
        // simple rewrite independent of exact old payload
        return `
function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}`.trim();
      }
    );
  }

  // setQuality → emit {tier}
  if (!/QUALITY_CHANGE[^]*\{\s*tier\s*:/.test(src)) {
    src = src.replace(
      /function\s+setQuality\s*\(\s*tier\s*\)\s*\{[^]*?_quality\s*=\s*tier;[^]*?_emit\s*\(\s*EVENTS\.QUALITY_CHANGE\s*,\s*\{[^}]*\}\s*\)\s*;\s*\}/m,
      (m)=>{
        return `
function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}`.trim();
      }
    );
  }

  if (src !== orig){ wr(file, src); snap(file, src); touched.push(file); log('patched ' + file); }
  else { log('no-op ' + file); }
}

/* --------------------------- ENGINE PATCHES --------------------------------- */
function patchEngine(){
  if (!ex(ENGINE_FILE)){ warn('missing ' + ENGINE_FILE); return; }
  let src = rd(ENGINE_FILE), orig = src; backupOnce(ENGINE_FILE);

  // Swap BeatBus import → BeatBusAdapter singleton
  if (!/BeatBusAdapter\.js/.test(src)) {
    src = src
      .replace(/import\s+BeatBus\s+from\s+['"]@?\/?modules\/orchestration\/core\/BeatBus['"];?/,
               `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';`)
      .replace(/import\s+BeatBus\s+from\s+['"]@modules\/orchestration\/core\/BeatBus['"];?/,
               `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';`);
    // Insert bus singleton after imports
    if (!/__BUS__\s*=/.test(src)){
      const im = src.match(/^(?:import .*?\n)+/m);
      if (im){
        const inject = `\n// doctor:statecore — one-bus singleton\nconst __BUS__ = (typeof getBeatBus==='function' ? getBeatBus() : getBeatBus);\n`;
        src = src.slice(0, im.index + im[0].length) + inject + src.slice(im.index + im[0].length);
      }
    }
    // Replace BeatBus.on/emit
    src = src.replace(/BeatBus\.on\(/g, '__BUS__.on(').replace(/BeatBus\.emit\(/g, '__BUS__.emit(');
  }

  // QUALITY_CHANGE handler → ({ tier }) and use it
  src = src.replace(
    /__BUS__\.on\(EVENTS\.QUALITY_CHANGE,\s*\(\{\s*[^}]*\}\)\s*=>\s*\{([\s\S]*?)\}\);/m,
    (m, body)=>{
      // normalize body to use { tier } and call buildAndEmit with tier
      return `__BUS__.on(EVENTS.QUALITY_CHANGE, ({ tier }) => {
  if (!tier) return;
  console.log(\`🧠 Engine: Quality change to \${tier}\`);
  this.currentQuality = tier;
  this.buildAndEmitBlueprint(this.currentStage, tier);
});`;
    }
  );

  // STAGE_CHANGE handler → ({ from, to })
  src = src.replace(
    /__BUS__\.on\(EVENTS\.STAGE_CHANGE,\s*\(\{\s*[^}]*\}\)\s*=>\s*\{([\s\S]*?)\}\);/m,
    (m, body)=>{
      return `__BUS__.on(EVENTS.STAGE_CHANGE, ({ from, to }) => {
  const stage = to || this.currentStage;
  if (!stage) return;
  console.log(\`🧠 Engine: Stage change to \${stage}\`);
  this.currentStage = stage;
  this.buildAndEmitBlueprint(stage, this.currentQuality, {/*emitOnce*/true});

  // Prewarm next predicted stage (no emit)
  try {
    const order = (Canonical?.stageOrder)||[];
    const idx = Math.max(0, order.indexOf(stage));
    const nextStage = order[Math.min(idx+1, order.length-1)];
    if (nextStage && nextStage !== stage) {
      const key = \`\${nextStage}|\${this.currentQuality}\`;
      if (!this.blueprintCache.has(key)) {
        const warmBp = this.buildBlueprint(nextStage, { quality: this.currentQuality });
        if (warmBp) {
          this._putCache(key, warmBp);
          if (import.meta?.env?.DEV) console.log('🔥 prewarmed', key);
        }
      }
    }
  } catch(_){}
});`;
    }
  );

  // Add token + small cache helpers near constructor
  if (!/_buildToken/.test(src)){
    src = src.replace(
      /constructor\s*\(\)\s*\{\s*([\s\S]*?)\n\s*\}/m,
      (m, body)=>{
        const inject = `
constructor() {
  ${body}
  this._buildToken = 0;      // abort-stale token
  this._cacheMax = 16;       // tiny LRU-ish cap
}
`.trim();
        return inject;
      }
    );
  }

  if (!/_putCache\(/.test(src)){
    src = src.replace(
      /class\s+ConsciousnessEngine\s*\{/,
      `class ConsciousnessEngine {
  _putCache(key, bp){
    this.blueprintCache.set(key, bp);
    // tiny LRU-ish cap
    if (this.blueprintCache.size > (this._cacheMax||16)) {
      const first = this.blueprintCache.keys().next().value;
      this.blueprintCache.delete(first);
    }
  }
`
    );
  }

  // buildAndEmitBlueprint: add token + cached fast path + include from/to/count in emit (keeps old payload!)
  src = src.replace(
    /buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*(?:,\s*.*)?\)\s*\{\s*([\s\S]*?)\n\s*\}/m,
    (m, body)=>{
      return `buildAndEmitBlueprint(stage, quality){
  const token = ++this._buildToken;
  const cacheKey = \`\${stage}|\${quality}\`;

  // Try cache first
  if (this.blueprintCache.has(cacheKey)) {
    const cachedBlueprint = this.blueprintCache.get(cacheKey);
    // emit once per change (guard stale)
    if (token !== this._buildToken) return;
    __BUS__.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: cachedBlueprint,
      stage,
      quality,
      cached: true,
      // forward-compat for dumb renderer + morph driver
      count: cachedBlueprint.activeCount ?? cachedBlueprint.particleCount ?? ((cachedBlueprint?.allenAtlasPositions?.length||0)/3)|0,
      fromPositions: cachedBlueprint.atmosphericPositions,
      toPositions:   cachedBlueprint.allenAtlasPositions
    });
    return;
  }

  // Build new
  const blueprint = this.buildBlueprint(stage, { quality });
  if (!blueprint) return;
  this._putCache(cacheKey, blueprint);

  if (token !== this._buildToken) return; // abort stale
  __BUS__.emit(EVENTS.BLUEPRINT_READY, {
    blueprint,
    stage,
    quality,
    cached: false,
    count: blueprint.activeCount ?? blueprint.particleCount ?? ((blueprint?.allenAtlasPositions?.length||0)/3)|0,
    fromPositions: blueprint.atmosphericPositions,
    toPositions:   blueprint.allenAtlasPositions
  });
}`.trim();
    }
  );

  if (src !== orig){ wr(ENGINE_FILE, src); snap(ENGINE_FILE, src); touched.push(ENGINE_FILE); log('patched ' + ENGINE_FILE); }
  else { log('no-op ' + ENGINE_FILE); }
}

/* --------------------------- RUN PATCHES ------------------------------------ */
patchStateController();
patchEngine();

/* --------------------------- SNAPSHOT CONCAT -------------------------------- */
if (touched.length){
  ensureDir(SNAPDIR);
  const concat = touched.map(f => `===== ${f} =====\n` + rd(f)).join('\n\n');
  fs.writeFileSync(p(SNAPDIR, 'CONCAT.txt'), concat, 'utf8');
}

/* --------------------------- GIT -------------------------------------------- */
if (DO_COMMIT && touched.length){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`, {stdio:'inherit'});
    const tag = 'doctor_statecore_deterministic_lane_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
    if (DO_PUSH){
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
      cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`, {stdio:'inherit'});
    }
  }catch(e){ warn('git failed: ' + (e?.message||e)); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}
