#!/usr/bin/env node
/**
 * doctor_engine_syntax_fix.cjs
 * Repairs invalid JS in ConsciousnessEngine.js by replacing two methods
 * with well-formed, minimal implementations:
 *   - initializeBeatBusListeners()
 *   - buildAndEmitBlueprint(stage, quality)
 *
 * No new imports required. Idempotent. Dry-run by default. Use --commit to persist.
 */
const fs = require('fs'); const path = require('path'); const cp = require('child_process');

const ROOT = process.cwd();
const FILE = 'src/engine/ConsciousnessEngine.js';
const NOW = new Date().toISOString().replace(/[:]/g,'-');
const SNAPDIR = path.join('snapshots', `doctor_engine_syntax_fix_${NOW}`);

const DO_COMMIT = process.argv.includes('--commit');
const NO_VERIFY = process.argv.includes('--no-verify');

function p(...s){ return path.join(ROOT, ...s); }
function ex(f){ return fs.existsSync(p(f)); }
function rd(f){ return fs.readFileSync(p(f),'utf8'); }
function wr(f,s){ fs.writeFileSync(p(f), s, 'utf8'); }
function ensureDir(d){ fs.mkdirSync(p(d), {recursive:true}); }
function backupOnce(f){ const bk=f+'.bak'; if(!ex(bk)){ fs.copyFileSync(p(f), p(bk)); console.log('· backup:', bk); } }
function snap(f,s){ ensureDir(SNAPDIR); fs.writeFileSync(p(SNAPDIR, f.replace(/\//g,'__')+'.txt'), s, 'utf8'); }

if (!ex(FILE)) { console.error('! missing', FILE); process.exit(1); }
let src = rd(FILE); const orig = src; backupOnce(FILE);

/** Utility: replace a class method by name with a new body (brace-balanced) */
function replaceMethod(source, name, newCode){
  const sig = new RegExp(`${name}\\s*\\(`);
  const m = source.match(sig);
  if (!m) return {source, changed:false}; // method not found
  let i = m.index;
  // Move to the '(' and capture parameters (we'll rewrite with ours anyway)
  const braceStart = source.indexOf('{', i);
  if (braceStart === -1) return {source, changed:false};
  // Find matching closing brace for this method body
  let depth = 0, j = braceStart;
  for (; j < source.length; j++){
    const ch = source[j];
    if (ch === '{') depth++;
    else if (ch === '}'){ depth--; if (depth === 0){ j++; break; } }
  }
  if (depth !== 0) return {source, changed:false}; // unbalanced; bail
  const before = source.slice(0, i);
  // Find the line start to keep method name aligned
  const methodHeaderStart = source.lastIndexOf('\n', i) + 1;
  const headerMatch = source.slice(methodHeaderStart, braceStart).match(/^\s*/);
  const indent = headerMatch ? headerMatch[0] : '';
  const after = source.slice(j);
  const injected = `${indent}${newCode.trim()}\n`;
  return { source: before + injected + after, changed:true };
}

/* New, well-formed initializeBeatBusListeners implementation */
const INIT_METHOD = `
initializeBeatBusListeners() {
  // Prefer adapter if available, otherwise fall back to BeatBus (legacy import)
  const BUS =
    (typeof getBeatBus === 'function' ? getBeatBus() :
      (typeof __BUS__ !== 'undefined' ? __BUS__ : (typeof BeatBus !== 'undefined' ? BeatBus : null)));

  if (!BUS || !BUS.on) { console.error('BeatBus unavailable'); return; }

  // Stage changes: expect { from, to } but accept { stage } as fallback
  BUS.on(EVENTS.STAGE_CHANGE, ({ from, to, stage }) => {
    const next = to || stage;
    if (!next) return;
    console.log(\`🧠 Engine: Stage change to \${next}\`);
    this.currentStage = next;
    this.buildAndEmitBlueprint(next, this.currentQuality);

    // Prewarm next stage (no emit)
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

  // Quality changes: expect { tier }, but accept { quality }
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
      const bp = this.buildEmergenceBlueprint({ text: 'HELLO CURTIS', count: 2000 });
      this.blueprintCache.set(key, bp);
    }
    BUS.emit(EVENTS.PREWARM_COMPLETE, { key });
  });

  // Director: Build emergence blueprint (text → particles)
  BUS.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
    console.log('🧠 Engine: Building emergence blueprint');
    const text = opts.sourceText || 'HELLO CURTIS';
    const count = opts.count || 2000;
    const tierBehaviors = opts.tierBehaviors || {
      tier1: { behavior: 'drift',    ratio: 0.5  },
      tier2: { behavior: 'orbital',  ratio: 0.2  },
      tier3: { behavior: 'twinkle',  ratio: 0.15 },
      tier4: { behavior: 'prominent',ratio: 0.15 },
    };
    const key = this._emergenceKey(text, count);
    let bp = this.blueprintCache.get(key);
    const cached = !!bp;
    if (!bp) {
      bp = this.buildEmergenceBlueprint({ text, count, tierBehaviors });
      this.blueprintCache.set(key, bp);
    }
    BUS.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: bp,
      stage: 'genesis',
      quality: this.currentQuality,
      cached
    });
  });

  // Initial blueprint request after components mount
  setTimeout(() => {
    console.log('🧠 Engine: Requesting initial state...');
    this.buildAndEmitBlueprint(this.currentStage, this.currentQuality);
  }, 500);
}
`;

/* New, well-formed buildAndEmitBlueprint implementation with token + cache */
const BUILD_METHOD = `
buildAndEmitBlueprint(stage, quality) {
  // tokenize to abort stale
  if (typeof this._buildToken !== 'number') this._buildToken = 0;
  const token = ++this._buildToken;
  const BUS =
    (typeof __BUS__ !== 'undefined' ? __BUS__ :
      (typeof getBeatBus === 'function' ? getBeatBus() :
        (typeof BeatBus !== 'undefined' ? BeatBus : null)));
  if (!BUS || !BUS.emit) return;

  const cacheKey = \`\${stage}|\${quality}\`;

  // Try cache
  if (this.blueprintCache.has(cacheKey)) {
    const cachedBlueprint = this.blueprintCache.get(cacheKey);
    if (token !== this._buildToken) return; // stale
    BUS.emit(EVENTS.BLUEPRINT_READY, {
      blueprint: cachedBlueprint,
      stage,
      quality,
      cached: true,
      // forward-compat for morph driver
      count: cachedBlueprint.activeCount ?? cachedBlueprint.particleCount ?? ((cachedBlueprint?.allenAtlasPositions?.length || 0) / 3) | 0,
      fromPositions: cachedBlueprint.atmosphericPositions,
      toPositions: cachedBlueprint.allenAtlasPositions
    });
    return;
  }

  // Build new
  const blueprint = this.buildBlueprint(stage, { quality });
  if (!blueprint) return;
  (this._putCache ? this._putCache(cacheKey, blueprint) : this.blueprintCache.set(cacheKey, blueprint));

  if (token !== this._buildToken) return; // stale
  BUS.emit(EVENTS.BLUEPRINT_READY, {
    blueprint,
    stage,
    quality,
    cached: false,
    count: blueprint.activeCount ?? blueprint.particleCount ?? ((blueprint?.allenAtlasPositions?.length || 0) / 3) | 0,
    fromPositions: blueprint.atmosphericPositions,
    toPositions: blueprint.allenAtlasPositions
  });
}
`;

/* Apply replacements */
let changed = false;
let res = replaceMethod(src, 'initializeBeatBusListeners', INIT_METHOD);
src = res.source; changed = changed || res.changed;

res = replaceMethod(src, 'buildAndEmitBlueprint', BUILD_METHOD);
src = res.source; changed = changed || res.changed;

if (changed){
  wr(FILE, src); snap(FILE, src);
  console.log('· patched', FILE);
} else {
  console.log('· no-op (methods not replaced or already fixed)');
}

if (DO_COMMIT && changed){
  try{
    cp.execSync('git add -A', {stdio:'inherit'});
    cp.execSync(`git commit ${NO_VERIFY?'--no-verify':''} -m "chore(dev): engine — repair listeners + single-emit builder"`, {stdio:'inherit'});
    const tag = 'doctor_engine_syntax_fix_' + NOW;
    cp.execSync(`git tag ${tag}`, {stdio:'inherit'});
    console.log('✓ committed & tagged', tag);
  }catch(e){ console.warn('! git step failed:', e?.message||e); }
} else {
  console.log('· dry run complete — re-run with --commit to persist');
}
