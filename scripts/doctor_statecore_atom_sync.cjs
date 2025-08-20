#!/usr/bin/env node
/**
 * doctor_statecore_atom_sync.cjs
 * Sync State Core → Atom budgets → Engine, and wire morph feed.
 * - Creates src/atom/bridge.js
 * - Injects imports + runtime wiring into src/main.jsx
 * - Optional morph→stage gating (hysteresis)
 *
 * Usage:
 *   node scripts/doctor_statecore_atom_sync.cjs           # dry run
 *   node scripts/doctor_statecore_atom_sync.cjs --commit  # apply changes
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);
const ex = (f) => fs.existsSync(P(f));
const rd = (f) => fs.readFileSync(P(f), 'utf8');
const wr = (f, s) => {
  fs.mkdirSync(path.dirname(P(f)), { recursive: true });
  fs.writeFileSync(P(f), s, 'utf8');
};
const NOW = new Date().toISOString().replace(/[:]/g, '-');
const COMMIT = process.argv.includes('--commit');

const CHANGES = [];
function change(file, kind, note = '') {
  CHANGES.push({ file, kind, note });
}
function backupOnce(file) {
  const bak = `${file}.${NOW}.bak`;
  if (!ex(file)) return null;
  fs.copyFileSync(P(file), P(bak));
  return bak;
}

// --- small recursive finder for likely files
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}
function findFirst(patterns) {
  try {
    for (const file of walk(P('src'))) {
      for (const re of patterns) {
        if (re.test(file)) return file.replace(ROOT + path.sep, '');
      }
    }
  } catch {}
  return null;
}

// 1) Create/Update atom bridge
const BRIDGE_FILE = 'src/atom/bridge.js';
const BRIDGE_CONTENT = `// src/atom/bridge.js
const MAX_PARTICLES = 15000;

const HIGH = {
  genesis: 2000,
  discipline: 3000,
  neural: 5000,
  velocity: 12000,
  architecture: 8000,
  harmony: 12000,
  transcendence: 15000,
};

const MULTIPLIER = { LOW: 0.6, MEDIUM: 0.85, HIGH: 1.0, ULTRA: 1.5 };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function getBudget(stage, tier = 'HIGH') {
  const qc = globalThis.qualityControls;
  if (qc?.getBudget) {
    try { return clamp(qc.getBudget(stage, tier), 0, MAX_PARTICLES); }
    catch {}
  }
  const base = HIGH[stage] ?? 3000;
  const mult = MULTIPLIER[tier] ?? 1.0;
  return clamp(Math.round(base * mult), 0, MAX_PARTICLES);
}

export function applyBudget(engine, stage, tier) {
  const count = getBudget(stage, tier);
  if (engine?.buildBlueprint) engine.buildBlueprint(stage, count, tier);
  return count;
}

export function syncFromStateCore(StateCore, engine, opts = {}) {
  const onMorph = opts.onMorph || (()=>{});
  let last = StateCore.get?.() || {};

  // initial
  applyBudget(engine, last.stage, last.quality);
  onMorph(last.morph);

  // subscribe
  StateCore.on?.('change', (s) => {
    if (s.stage !== last.stage || s.quality !== last.quality) {
      applyBudget(engine, s.stage, s.quality);
    }
    if (s.morph !== last.morph) onMorph(s.morph);
    last = s;
  });

  if (typeof window !== 'undefined') {
    window.__atom = {
      getBudget,
      apply: (stage, tier) => applyBudget(engine, stage, tier),
    };
  }
}
`;

function ensureBridge() {
  if (!ex(BRIDGE_FILE)) {
    if (COMMIT) wr(BRIDGE_FILE, BRIDGE_CONTENT);
    change(BRIDGE_FILE, ex(BRIDGE_FILE) ? 'update' : 'create', 'Atom bridge with budgets + sync');
    return;
  }
  const cur = rd(BRIDGE_FILE);
  if (cur.trim() !== BRIDGE_CONTENT.trim()) {
    if (COMMIT) {
      const bak = backupOnce(BRIDGE_FILE);
      wr(BRIDGE_FILE, BRIDGE_CONTENT);
      change(BRIDGE_FILE, 'update', `Backed up -> ${bak}`);
    } else {
      change(BRIDGE_FILE, 'would-update', 'Different content detected');
    }
  } else {
    change(BRIDGE_FILE, 'ok', 'Up-to-date');
  }
}

// 2) Patch main.jsx
const MAIN = ['src/main.jsx', 'src/main.tsx'].find(ex);
function insertAfterImports(src, inject) {
  // find last import line
  const importRE = /^(import[\s\S]*?;[\t ]*\r?\n)+/m;
  const m = src.match(importRE);
  if (m) {
    const head = m[0];
    return src.replace(importRE, head + '\n' + inject + '\n');
  }
  // no imports? prefix
  return inject + '\n' + src;
}

function ensureMainWiring() {
  if (!MAIN) {
    change('src/main.jsx', 'missing', 'Cannot locate main.jsx or main.tsx');
    return;
  }
  let content = rd(MAIN);
  const before = content;

  // ensure amplified canon import present
  if (!/canon\/init-amplified\.js/.test(content)) {
    const imp = `import './canon/init-amplified.js';`;
    content = imp + '\n' + content;
  }

  // ensure bridge + engine + state imports (idempotent)
  const hasMarker = /CANON:STATE-ATOM BRIDGE BEGIN/.test(content);
  const importBridge = `import { syncFromStateCore } from './atom/bridge.js';`;

  // try to guess engine + state paths
  let enginePath =
    findFirst([/src\/engine\/ConsciousnessEngine\.js$/, /src\/.*Engine\.js$/]) ||
    'src/engine/ConsciousnessEngine.js';
  let statePath =
    findFirst([/src\/state\/StateCore\.js$/, /src\/state\/core\/StateCore\.js$/, /src\/.*StateCore\.js$/]) ||
    'src/state/StateCore.js';

  // turn into relative-from-main
  function relFromMain(absLike) {
    let p = absLike.startsWith('src/') ? absLike.slice(4) : absLike;
    const rel = './' + p.replace(/\\/g, '/');
    return rel;
  }
  const impState  = `import StateCore from '${relFromMain(statePath)}'; // ← fix path if needed`;
  const impEngine = `import Engine from '${relFromMain(enginePath)}'; // ← fix path if needed`;

  const RUNTIME_BLOCK = `// CANON:STATE-ATOM BRIDGE BEGIN
const onMorph = (v) => {
  try {
    const mat = window.material || Engine?.getMaterial?.();
    if (mat?.uniforms?.uMorphProgress) {
      mat.uniforms.uMorphProgress.value = Math.max(0, Math.min(1, v));
    }
  } catch {}
};

syncFromStateCore(StateCore, Engine, { onMorph });

// Optional: morph → stage gating with hysteresis
const __CANON_GATES__  = [0.00, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1.00];
const __CANON_STAGES__ = ['genesis','discipline','neural','velocity','architecture','harmony','transcendence','transcendence'];
let __gateIdx = null, __hyst = 0.02;

StateCore.on?.('change', (s) => {
  const idx = Math.max(0, __CANON_GATES__.findIndex(m => s.morph <= m));
  if (__gateIdx == null) __gateIdx = idx;
  const fwd = idx > __gateIdx && s.morph > (__CANON_GATES__[idx-1] + __hyst);
  const back= idx < __gateIdx && s.morph < (__CANON_GATES__[idx]   - __hyst);
  if (fwd || back) {
    __gateIdx = idx;
    const nextStage = __CANON_STAGES__[idx];
    if (nextStage && nextStage !== s.stage) {
      StateCore.setStage(nextStage, 'morph-threshold');
    }
  }
});
// CANON:STATE-ATOM BRIDGE END`;

  if (!hasMarker) {
    // add imports (bridge/state/engine) right after imports block
    const INJECT_IMPORTS = [
      importBridge,
      impState,
      impEngine,
    ].join('\n');

    content = insertAfterImports(content, INJECT_IMPORTS);

    // add runtime block before first render/root (best-effort)
    const rootRE = /(ReactDOM\.createRoot|root\.render|ReactDOM\.render)/;
    if (rootRE.test(content)) {
      content = content.replace(rootRE, `${RUNTIME_BLOCK}\n\n$1`);
    } else {
      // fallback: append
      content = content + '\n\n' + RUNTIME_BLOCK + '\n';
    }
  }

  if (content !== before) {
    if (COMMIT) {
      const bak = backupOnce(MAIN);
      wr(MAIN, content);
      change(MAIN, 'update', `Wired bridge + imports. Backup -> ${bak}`);
    } else {
      change(MAIN, 'would-update', 'Would inject imports + runtime block');
    }
  } else {
    change(MAIN, 'ok', 'Already wired');
  }
}

// run
console.log('\n🔧 Repo Doctor: StateCore ↔ Atom ↔ Engine\n');
ensureBridge();
ensureMainWiring();

console.log('\n' + '-'.repeat(60));
const label = COMMIT ? 'APPLIED' : 'PLAN (dry-run)';
console.log(`${label}:`);
for (const c of CHANGES) {
  console.log(`• ${c.kind.padEnd(12)} ${c.file}${c.note ? ' — ' + c.note : ''}`);
}
console.log('-'.repeat(60));

if (!COMMIT) {
  console.log('\nTo apply changes:');
  console.log('  node scripts/doctor_statecore_atom_sync.cjs --commit\n');
} else {
  console.log('\n✅ Done. Next: npm run dev, then in console:');
  console.log('  SC.setStage("neural"); SC.setQuality("ULTRA"); SC.setMorph(0.62);');
  console.log('  __atom.getBudget("neural","ULTRA"); canon.boundary.getReport();\n');
}
