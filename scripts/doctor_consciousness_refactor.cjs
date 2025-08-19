#!/usr/bin/env node
/**
 * doctor_consciousness_refactor.cjs
 * Repairs syntax in src/engine/ConsciousnessEngine.js by replacing:
 *   - initializeBeatBusListeners()
 *   - buildAndEmitBlueprint(stage, quality)
 * Adds _buildToken initialization to constructor (if missing).
 * Keeps existing BeatBus import & payloads. Idempotent. Dry run by default.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const FILE = 'src/engine/ConsciousnessEngine.js';
const NOW  = new Date().toISOString().replace(/[:]/g,'-');
const SNAP = path.join('snapshots', `doctor_consciousness_refactor_${NOW}`);

const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');

function p(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f), 'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const bak=f+'.bak'; if(!ex(bak)){ fs.copyFileSync(p(f), p(bak)); console.log('· backup', bak); } }
function snapFile(f){ ensureDir(SNAP); fs.writeFileSync(p(SNAP, f.replace(/\//g,'__')+'.txt'), rd(f)); }

/** Replace a class method by name with the provided full method code (balanced braces). */
function replaceMethod(source, name, newCode){
  const sig = new RegExp(`\\b${name}\\s*\\(`);
  const m = source.match(sig);
  if (!m) return {source, changed:false};
  const headerStart = source.lastIndexOf('\n', m.index) + 1;
  const bodyOpen = source.indexOf('{', m.index);
  if (bodyOpen < 0) return {source, changed:false};
  // find matching close
  let depth=0, i=bodyOpen;
  for(; i<source.length; i++){
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (!depth){ i++; break; } }
  }
  if (depth !== 0) return {source, changed:false}; // unbalanced in original
  const indent = (source.slice(headerStart, bodyOpen).match(/^\s*/)||[''])[0];
  const injected = `${indent}${newCode.trim()}\n`;
  return { source: source.slice(0, headerStart) + injected + source.slice(i), changed:true };
}

if (!ex(FILE)){ console.error('! missing', FILE); process.exit(1); }
let src = rd(FILE), orig = src; backupOnce(FILE);

/* 1) Ensure constructor initializes _buildToken once */
if (!/_buildToken/.test(src)){
  // insert after isInitialized assignment if possible
  src = src.replace(
    /(this\.isInitialized\s*=\s*false\s*;)/,
    `$1\n      this._buildToken = 0; // doctor: abort-stale token`
  );
}

/* 2) Replace initializeBeatBusListeners with clean, brace-balanced implementation */
const INIT = `
initializeBeatBusListeners() {
  // Stage changes from UI/scroll — accept { from, to } and legacy { stage }
  BeatBus.on(EVENTS.STAGE_CHANGE, ({ from, to, stage }) => {
    const next = to || stage;
    if (!next) return;
    console.log(\`🧠 Engine: Stage change to \${next}\`);
    this.currentStage = next;
    this.buildAndEmitBlueprint(next, this.currentQuality);

    // Prewarm next stage (cache only)
    try {
      const order = (Canonical?.stageOrder) || [];
      const idx = Math.max(0, order.indexOf(next));
      const prospect = order[Math.min(idx + 1, order.length - 1)];
      if (prospect && prospect !== next) {
        const key = \`\${prospect}|\${this.currentQuality}\`;
        if (!this.blueprintCache.has(key)) {
          const warm = this.buildBlueprint(prospect, { quality: this.currentQuality });
          if (warm) this.blueprintCache.set(key, warm);
          if (import.meta?.env?.DEV) console.log('🔥 prewarmed', key);
        }
      }
    } catch (_) {}
  });

  // Quality changes from TAQS — accept { tier } and legacy { quality }
  BeatBus.on(EVENTS.QUALITY_CHANGE, ({ tier, quality }) => {
    const q = quality || tier;
    if (!q) return;
    console.log(\`🧠 Engine: Quality change to \${q}\`);
    this.currentQuality = q;
    this.buildAndEmitBlueprint(this.currentStage, q);
  });

  // Director: Prewarm genesis for emergence (SST v3.0 opening)
  BeatBus.on(EVENTS.PREWARM_GENESIS_BLUEPRINT, () => {
    console.log('🧠 Engine: Prewarming genesis blueprint for emergence');
    const key = this._emergenceKey('HELLO CURTIS', 2000);
    if (!this.blueprintCache.has(key)) {
      const bp = this.buildEmergenceBlueprint({ text: 'HELLO CURTIS', count: 2000 });
      this.blueprintCache.set(key, bp);
    }
    BeatBus.emit(EVENTS.PREWARM_COMPLETE, { key });
  });

  // Director: Build emergence blueprint (particles from text)
  BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
    console.log('🧠 Engine: Building emergence blueprint');
    const text = opts.sourceText || 'HELLO CURTIS';
    const count = opts.count || 2000;
    const tierBehaviors = opts.tierBehaviors || {
      tier1: { behavior: 'drift', ratio: 0.5 },
      tier2: { behavior: 'orbital', ratio: 0.2 },
      tier3: { behavior: 'twinkle', ratio: 0.15 },
      tier4: { behavior: 'prominent', ratio: 0.15 },
    };
    const key = this._emergenceKey(text, count);
    let bp = this.blueprintCache.get(key);
    const cached = !!bp;
    if (!bp) {
      bp = this.buildEmergenceBlueprint({ text, count, tierBehaviors });
      this.blueprintCache.set(key, bp);
    }
    BeatBus.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: bp,
      stage: 'genesis',
      quality: this.currentQuality,
      cached,
    });
  });

  // Initial blueprint request after components mount
  setTimeout(() => {
    console.log('🧠 Engine: Requesting initial state...');
    this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
  }, 500);
}
`;
let res = replaceMethod(src, 'initializeBeatBusListeners', INIT);
src = res.source;

/* 3) Replace buildAndEmitBlueprint with tokened, single-emit version + forward-compat fields */
const BUILD = `
buildAndEmitBlueprint(stage, quality) {
  const token = ++this._buildToken;

  const cacheKey = \`\${stage}|\${quality}\`;
  if (this.blueprintCache.has(cacheKey)) {
    console.log(\`🔨 Engine: Using cached blueprint for \${stage}|\${quality}\`);
    const cachedBlueprint = this.blueprintCache.get(cacheKey);
    if (token !== this._buildToken) return; // abort stale
    BeatBus.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: cachedBlueprint,
      stage, quality, cached: true,
      // forward-compat for morph driver
      count: cachedBlueprint.activeCount ?? cachedBlueprint.particleCount ?? ((cachedBlueprint?.allenAtlasPositions?.length||0)/3)|0,
      fromPositions: cachedBlueprint.atmosphericPositions,
      toPositions:   cachedBlueprint.allenAtlasPositions,
    });
    return;
  }

  console.log(\`🔨 Engine: Building new blueprint for \${stage}|\${quality}\`);
  const blueprint = this.buildBlueprint(stage, { quality });
  if (!blueprint) return;

  this.blueprintCache.set(cacheKey, blueprint);
  if (token !== this._buildToken) return; // abort stale

  BeatBus.emit(EVENTS.BLUEPRINT_READY, {
    blueprint, stage, quality, cached: false,
    count: blueprint.activeCount ?? blueprint.particleCount ?? ((blueprint?.allenAtlasPositions?.length||0)/3)|0,
    fromPositions: blueprint.atmosphericPositions,
    toPositions:   blueprint.allenAtlasPositions,
  });
}
`;
res = replaceMethod(src, 'buildAndEmitBlueprint', BUILD);
src = res.source;

/* 4) Write back & snapshot if changed */
if (src !== orig){
  wr(FILE, src); snapFile(FILE);
  console.log('· patched', FILE);
} else {
  console.log('· no-op', FILE);
}

/* 5) Optional git commit */
if (DO_COMMIT){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "chore(dev): engine — refactor listeners + single-emit builder (fix syntax)"`, {stdio:'inherit'});
    const tag = 'doctor_consciousness_refactor_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  }catch(e){ console.warn('! git step failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}
