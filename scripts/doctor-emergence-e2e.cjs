#!/usr/bin/env node
/**
 * doctor-emergence-e2e.cjs
 * Hermetic One-Touch: Fix director emission + harden engine listener (idempotent)
 * - Updates TheaterDirector BUILD_EMERGENCE_BLUEPRINT payload to canonical
 * - Ensures Engine has emergence listener + tolerant payload normalization
 * - Adds one-time debug logs to prove build/emit path
 * - Self-verifies at the end
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const FILES = {
  engine: [
    'src/engine/ConsciousnessEngine.js',
  ],
  director: [
    'src/theater/TheaterDirector.js',
    'src/components/theater/TheaterDirector.js',
    'src/components/consciousness/TheaterDirector.js',
  ],
};

const found = {};
for (const k of Object.keys(FILES)) {
  found[k] = FILES[k].map(p => path.join(ROOT, p)).find(p => fs.existsSync(p)) || null;
}
if (!found.engine) { console.error('❌ Engine not found'); process.exit(2); }
if (!found.director) { console.error('❌ TheaterDirector not found'); process.exit(2); }

const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const backup = (p) => {
  const outDir = path.join(ROOT, 'doctor_backups');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, path.basename(p) + '.' + stamp() + '.bak');
  fs.copyFileSync(p, out);
  return out;
};

/* ========== 1) Patch TheaterDirector emission ========== */
let dirSrc = read(found.director);
const dirOrig = dirSrc;
let dirChanged = false;

// Canonical payload snippet
const canonicalPayload = `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      mode: 'emergence',
      source: 'viewportSpread',
      target: 'constellation',
      count: 2000,
      tierRatios: [0.5, 0.2, 0.15, 0.15],
      viewportHint: { width: window.innerWidth, height: window.innerHeight, aspect: window.innerWidth / window.innerHeight }
    })`;

// Replace classic old-form with canonical
const oldFormRe = /BeatBus\.emit\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT\s*,\s*\{\s*[^}]*sourceText[^}]*\}\s*\)/m;
if (oldFormRe.test(dirSrc)) {
  dirSrc = dirSrc.replace(oldFormRe, canonicalPayload);
  dirChanged = true;
}

// Generic upgrade: ensure mode/source/target present
if (/BUILD_EMERGENCE_BLUEPRINT/.test(dirSrc) && !/mode\s*:\s*['"]emergence['"]/.test(dirSrc)) {
  dirSrc = dirSrc.replace(
    /BeatBus\.emit\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT\s*,\s*\{([\s\S]*?)\}\s*\)/m,
    (full, inner) => {
      let body = inner.trim();
      if (!/mode\s*:/.test(body)) body = `mode: 'emergence',\n      ` + body;
      if (!/source\s*:/.test(body)) body = `source: 'viewportSpread',\n      ` + body;
      if (!/target\s*:/.test(body)) body = `target: 'constellation',\n      ` + body;
      if (!/viewportHint\s*:/.test(body)) body += `,\n      viewportHint: { width: window.innerWidth, height: window.innerHeight, aspect: window.innerWidth / window.innerHeight }`;
      if (!/tierRatios\s*:/.test(body)) body += `,\n      tierRatios: [0.5, 0.2, 0.15, 0.15]`;
      return `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {\n      ${body}\n    })`;
    }
  );
  dirChanged = true;
}

if (dirChanged) {
  const bak = backup(found.director);
  console.log('🗂  Backup (Director):', path.relative(ROOT, bak));
  write(found.director, dirSrc);
  console.log('✅ Patched (Director):', path.relative(ROOT, found.director));
} else {
  console.log('ℹ️  Director already emits canonical emergence payload.');
}

/* ========== 2) Ensure Engine listener + tolerant normalization ========== */
let engSrc = read(found.engine);
const engOrig = engSrc;
let engChanged = false;

// Ensure imports canonical
if (!/from\s+['"]@\/theater\/bus\/index\.js['"]/.test(engSrc) && /from\s+['"]@\/theater\/bus['"]/.test(engSrc)) {
  engSrc = engSrc.replace(/from\s+['"]@\/theater\/bus['"]/, "from '@/theater/bus/index.js'");
  engChanged = true;
}
if (!/import\s*\{\s*EVENTS\s*\}\s*from\s*['"]@\/theater\/events\.js['"]/.test(engSrc)) {
  if (/from\s*['"]@\/theater\/events\.js['"]/.test(engSrc)) {
    engSrc = engSrc.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]@\/theater\/events\.js['"]/, "import { EVENTS } from '@/theater/events.js'");
  } else {
    engSrc = engSrc.replace(/(^\s*import[\s\S]*?;)/, `$1\nimport { EVENTS } from '@/theater/events.js';`);
  }
  engChanged = true;
}

// Ensure buildEmergenceBlueprint method exists (basic)
if (!/buildEmergenceBlueprint\s*\(/.test(engSrc)) {
  // Inject before HMR-safe singleton anchor
  const anchor = engSrc.indexOf('// HMR-safe singleton');
  const insPos = anchor > -1 ? anchor : engSrc.lastIndexOf('}\n');
  const method = `

// ---- emergence builder (tolerant) -------------------------------------------
buildEmergenceBlueprint({
  mode = 'emergence',
  count = 2000,
  viewportHint = this._viewportHint,
  tierRatios = [0.5, 0.2, 0.15, 0.15],
} = {}) {
  const N = Math.max(1, Math.floor(count));
  const atmosphericPositions = new Float32Array(N * 3);
  const text3DPositions      = new Float32Array(N * 3);
  const animationSeeds       = new Float32Array(N * 3);
  const sizeMultipliers      = new Float32Array(N);
  const opacityData          = new Float32Array(N);
  const atlasIndices         = new Float32Array(N);
  const tierData             = new Float32Array(N);

  const src = this._generateViewportSpread(N, viewportHint);
  const tgt = this._generateConstellation(N, tierRatios);

  for (let i = 0; i < N; i++) {
    const j = i * 3;
    atmosphericPositions[j+0] = src[j+0];
    atmosphericPositions[j+1] = src[j+1];
    atmosphericPositions[j+2] = src[j+2];
    text3DPositions[j+0] = tgt[j+0];
    text3DPositions[j+1] = tgt[j+1];
    text3DPositions[j+2] = tgt[j+2];
    animationSeeds[j+0] = Math.random();
    animationSeeds[j+1] = Math.random();
    animationSeeds[j+2] = Math.random();
    sizeMultipliers[i] = 0.6 + Math.random() * 1.2;
    opacityData[i]     = 0.35 + Math.random() * 0.6;
    atlasIndices[i]    = (Math.random() * 8) | 0;
    tierData[i]        = (Math.random() * 4) | 0;
  }

  return {
    mode,
    stageName: 'genesis',
    particleCount: N,
    maxParticles: N,
    activeCount: N,
    atmosphericPositions,
    text3DPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
    metadata: { quality: this.currentQuality, emergence: true },
  };
}
`;
  engSrc = engSrc.slice(0, insPos) + method + engSrc.slice(insPos);
  engChanged = true;
}

// Ensure _installListeners() has tolerant BUILD_EMERGENCE_BLUEPRINT handler
if (!/BeatBus\.on\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT/.test(engSrc)) {
  // Find body end of _installListeners
  const idx = engSrc.indexOf('_installListeners(');
  const open = engSrc.indexOf('{', idx);
  let depth = 0, end = -1;
  for (let i = open; i < engSrc.length; i++) {
    const ch = engSrc[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) { console.error('❌ Could not locate _installListeners() body'); process.exit(3); }
  const inject = `

    // Emergence builder (tolerant to old/new payloads)
    this._listeners.push(
      BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (payload = {}) => {
        try {
          // Normalize: accept old {sourceText,count} or new canonical fields
          const count = Math.max(1, Math.floor(payload.count || 2000));
          const viewportHint = payload.viewportHint || this._viewportHint;
          const tierRatios = payload.tierRatios || [0.5, 0.2, 0.15, 0.15];

          const bp = this.buildEmergenceBlueprint({
            mode: 'emergence',
            count,
            viewportHint,
            tierRatios,
          });

          if (!this._validateBlueprint(bp)) {
            console.error('🧠 Engine: invalid emergence blueprint; not emitting');
            return;
          }

          this._lastEmergenceTargets = bp.text3DPositions;

          // DEBUG (once): prove build → emit path
          if (!this.__debugEmergenceLogged) {
            this.__debugEmergenceLogged = true;
            console.log('🧠 Engine: Built emergence blueprint', { count: bp.activeCount });
          }

          BeatBus.emit(EVENTS.BLUEPRINT_READY, {
            blueprint: bp,
            stage: 'genesis',
            quality: this.currentQuality,
            mode: 'emergence',
            cached: false,
          });

          if (!this.__debugEmergenceEmitted) {
            this.__debugEmergenceEmitted = true;
            console.log('🧠 Engine: Emitted BLUEPRINT_READY(mode:emergence)');
          }
        } catch (e) {
          console.error('🧠 Engine: emergence build failed:', e);
        }
      })
    );
`;
  engSrc = engSrc.slice(0, end) + inject + engSrc.slice(end);
  engChanged = true;
}

if (engChanged) {
  const bak = backup(found.engine);
  console.log('🗂  Backup (Engine):   ', path.relative(ROOT, bak));
  write(found.engine, engSrc);
  console.log('✅ Patched (Engine):   ', path.relative(ROOT, found.engine));
} else {
  console.log('ℹ️  Engine listener already present & tolerant.');
}

/* ========== 3) Self-verify (static) ========== */
const okDirector = /BUILD_EMERGENCE_BLUEPRINT[\s\S]+mode\s*:\s*['"]emergence['"][\s\S]+source\s*:\s*['"]viewportSpread['"][\s\S]+target\s*:\s*['"]constellation['"]/.test(read(found.director));
const okEngineListener = /BeatBus\.on\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT/.test(read(found.engine))
  && /BLUEPRINT_READY[\s\S]+mode\s*:\s*['"]emergence['"]/.test(read(found.engine));

console.table({
  director_payload: okDirector ? 'OK' : 'X',
  engine_listener:  okEngineListener ? 'OK' : 'X'
});

if (!okDirector || !okEngineListener) process.exit(4);
console.log('✨ Doctor complete.');
