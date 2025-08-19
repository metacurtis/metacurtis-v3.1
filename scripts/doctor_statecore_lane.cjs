#!/usr/bin/env node
/**
 * doctor_statecore_lane.cjs
 * Finish deterministic State-Core lane:
 * - StateController: STAGE_CHANGE {from,to}, QUALITY_CHANGE {tier}
 * - ConsciousnessEngine: robust listeners, prewarm next stage, abort-stale emit-once,
 *   cached fast path, plus forward-compat fields in BLUEPRINT_READY payload.
 *
 * Idempotent. Dry run by default. Use --commit to persist & tag.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const FILES = {
  engine: 'src/engine/ConsciousnessEngine.js',
  // common StateController locations—adjust if your repo differs
  stateCandidates: [
    'src/state/StateController.js',
    'src/core/StateController.js',
    'src/modules/state/StateController.js',
    'src/StateController.js'
  ],
};

const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_statecore_lane_${NOW}`);

const DO_COMMIT = process.argv.includes('--commit');
const DO_PUSH   = process.argv.includes('--push');
const NO_VERIFY = process.argv.includes('--no-verify');
const MSG = (()=>{
  const i = process.argv.indexOf('--message');
  return i>0 && process.argv[i+1] ? process.argv[i+1]
        : 'chore(dev): state-core — deterministic lane (from/to, tier, prewarm, abort-stale)';
})();

function p(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f),'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const b=f+'.bak'; if(!ex(b)){ fs.copyFileSync(p(f), p(b)); console.log('· backup', b); } }
function snap(f){ ensureDir(SNAP); fs.writeFileSync(p(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

function replaceMethod(src, name, body){
  const sig = new RegExp(`${name}\\s*\\(`);
  const m = src.match(sig); if(!m) return {src, changed:false};
  const start = src.indexOf('{', m.index); if(start<0) return {src, changed:false};
  let depth=0, i=start; for(; i<src.length; i++){ const c=src[i]; if(c==='{') depth++; else if(c==='}') { depth--; if(!depth){ i++; break; } } }
  if(depth) return {src, changed:false};
  const headStart = src.lastIndexOf('\n', m.index)+1;
  const indent = (src.slice(headStart, start).match(/^\s*/)||[''])[0];
  const injection = `${indent}${body.trim()}\n`;
  return {src: src.slice(0, headStart)+injection+src.slice(i), changed:true};
}

/* -------------------- Patch StateController (from/to, tier) -------------------- */
function patchStateController(){
  const file = FILES.stateCandidates.find(ex);
  if (!file) { console.warn('! StateController not found (tried common paths)'); return false; }
  let s = rd(file), orig = s; backupOnce(file);

  // setStage → {from,to}
  s = s.replace(
    /function\s+setStage\s*\(\s*name\s*\)\s*\{[\s\S]*?\}/m,
    `function setStage(name){
  if (!name || name===_stage) return;
  const _prev = _stage;
  _stage = name;
  _emit(EVENTS.STAGE_CHANGE, { from:_prev, to:_stage });
}`
  );

  // setQuality → {tier}
  s = s.replace(
    /function\s+setQuality\s*\(\s*tier\s*\)\s*\{[\s\S]*?\}/m,
    `function setQuality(tier){
  if (!tier || tier===_quality) return;
  _quality = tier;
  _emit(EVENTS.QUALITY_CHANGE, { tier });
}`
  );

  if (s !== orig){ wr(file, s); snap(file); console.log('· patched', file); return true; }
  console.log('· no-op', file); return false;
}

/* -------------------- Patch Engine (listeners, prewarm, token) ----------------- */
function patchEngine(){
  const file = FILES.engine; if (!ex(file)) { console.warn('! missing', file); return false; }
  let s = rd(file), orig = s; backupOnce(file);

  // ensure adapter import (non-breaking; keep legacy BeatBus import)
  if (!/BeatBusAdapter\.js/.test(s)){
    s = s.replace(
      /^(import[\s\S]*?from\s+['"].+?['"];[\r\n]+)/,
      (m)=> m + `import { getBeatBus } from '@/modules/orchestration/core/BeatBusAdapter.js';\n`
    );
  }

  // replace initializeBeatBusListeners with robust version
  const INIT = `
initializeBeatBusListeners() {
  const BUS = (typeof getBeatBus === 'function' ? getBeatBus() : (typeof BeatBus !== 'undefined' ? BeatBus : null));
  if (!BUS || !BUS.on) { console.error('BeatBus unavailable'); return; }

  // Stage changes: accept { from, to } and legacy { stage }
  BUS.on(EVENTS.STAGE_CHANGE, ({ from, to, stage }) => {
    const next = to || stage;
    if (!next) return;
    console.log(\`🧠 Engine: Stage change to \${next}\`);
    this.currentStage = next;
    this.buildAndEmitBlueprint(next, this.currentQuality);

    // Prewarm next stage (cache only, no emit)
    try {
      const order = (Canonical?.stageOrder)||[];
      const idx = Math.max(0, order.indexOf(next));
      const nxt = order[Math.min(idx+1, order.length-1)];
      if (nxt && nxt !== next) {
        const key = \`\${nxt}|\${this.currentQuality}\`;
        if (!this.blueprintCache.has(key)) {
          const warm = this.buildBlueprint(nxt, { quality: this.currentQuality });
          if (warm) this.blueprintCache.set(key, warm);
          if (import.meta?.env?.DEV) console.log('🔥 prewarmed', key);
        }
      }
    } catch(_) {}
  });

  // Quality changes: accept { tier } and legacy { quality }
  BUS.on(EVENTS.QUALITY_CHANGE, ({ tier, quality }) => {
    const q = quality || tier;
    if (!q) return;
    console.log(\`🧠 Engine: Quality change to \${q}\`);
    this.currentQuality = q;
    this.buildAndEmitBlueprint(this.currentStage, q);
  });

  // Director: Prewarm genesis for emergence
  BUS.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
    console.log('🧠 Engine: Prewarming genesis blueprint for emergence');
    const key = this._emergenceKey('HELLO CURTIS', 2000);
    if (!this.blueprintCache.has(key)) {
      const bp = this.buildEmergenceBlueprint({ text:'HELLO CURTIS', count:2000 });
      this.blueprintCache.set(key, bp);
    }
    BUS.emit(EVENTS.PREWARM_COMPLETE, { key });
  });

  // Director: Build emergence blueprint
  BUS.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts={}) => {
    console.log('🧠 Engine: Building emergence blueprint');
    const text = opts.sourceText || 'HELLO CURTIS';
    const count = opts.count || 2000;
    const key = this._emergenceKey(text, count);
    let bp = this.blueprintCache.get(key);
    const cached = !!bp;
    if (!bp) { bp = this.buildEmergenceBlueprint({ text, count, tierBehaviors: opts.tierBehaviors }); this.blueprintCache.set(key, bp); }
    BUS.emit(EVENTS.BLUEPRINT_READY, { blueprint: bp, stage:'genesis', quality:this.currentQuality, cached });
  });

  // initial blueprint after mount
  setTimeout(() => {
    console.log('🧠 Engine: Requesting initial state...');
    this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
  }, 500);
}
`;

  const res1 = replaceMethod(s, 'initializeBeatBusListeners', INIT);
  s = res1.src;

  // replace buildAndEmitBlueprint with token + cached fast path + forward-compat fields
  const BUILD = `
buildAndEmitBlueprint(stage, quality) {
  if (typeof this._buildToken !== 'number') this._buildToken = 0;
  const token = ++this._buildToken;

  const BUS = (typeof getBeatBus === 'function' ? getBeatBus() : (typeof BeatBus !== 'undefined' ? BeatBus : null));
  if (!BUS || !BUS.emit) return;

  const cacheKey = \`\${stage}|\${quality}\`;
  if (this.blueprintCache.has(cacheKey)) {
    const cachedBlueprint = this.blueprintCache.get(cacheKey);
    if (token !== this._buildToken) return; // abort stale
    BUS.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: cachedBlueprint,
      stage, quality, cached: true,
      count: cachedBlueprint.activeCount ?? cachedBlueprint.particleCount ?? ((cachedBlueprint?.allenAtlasPositions?.length||0)/3)|0,
      fromPositions: cachedBlueprint.atmosphericPositions,
      toPositions:   cachedBlueprint.allenAtlasPositions
    });
    return;
  }

  const blueprint = this.buildBlueprint(stage, { quality });
  if (!blueprint) return;
  this.blueprintCache.set(cacheKey, blueprint);

  if (token !== this._buildToken) return; // abort stale
  BUS.emit(EVENTS.BLUEPRINT_READY, {
    blueprint, stage, quality, cached: false,
    count: blueprint.activeCount ?? blueprint.particleCount ?? ((blueprint?.allenAtlasPositions?.length||0)/3)|0,
    fromPositions: blueprint.atmosphericPositions,
    toPositions:   blueprint.allenAtlasPositions
  });
}
`;
  const res2 = replaceMethod(s, 'buildAndEmitBlueprint', BUILD);
  s = res2.src;

  if (s !== orig){ wr(file, s); snap(file); console.log('· patched', file); return true; }
  console.log('· no-op', file); return false;
}

/* -------------------- Run & snapshot -------------------- */
let changed = false;
changed = patchStateController() || changed;
changed = patchEngine() || changed;

if (changed){
  ensureDir(SNAP);
  fs.writeFileSync(p(SNAP, 'CONCAT.txt'),
    [FILES.engine].concat(FILES.stateCandidates.filter(ex)).map(f => `===== ${f} =====\n`+rd(f)).join('\n\n'),
    'utf8'
  );
}

/* -------------------- Git (opt-in) -------------------- */
if (DO_COMMIT && changed){
  try{
    cp.execSync('git add -A',{stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "${MSG}"`,{stdio:'inherit'});
    const tag = 'doctor_statecore_lane_' + NOW;
    cp.execSync(`git tag ${tag}`,{stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
    if (DO_PUSH){
      cp.execSync(`git push ${NO_VERIFY?'--no-verify':''}`,{stdio:'inherit'});
      cp.execSync(`git push --tags ${NO_VERIFY?'--no-verify':''}`,{stdio:'inherit'});
    }
  }catch(e){ console.warn('! git step failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}
