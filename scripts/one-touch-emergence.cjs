#!/usr/bin/env node
/**
 * Hermetic One-Touch Emergence Patcher (idempotent, self-verifying)
 * Usage:
 *   node scripts/one-touch-emergence.cjs --apply --verify --run-validate --commit
 *
 * Guarantees:
 *   - No network calls
 *   - Creates timestamped backup 1x per run
 *   - Idempotent inserts (safe to re-run)
 *   - Verifies presence of method + listener + imports
 *   - Optional: runs `npm run validate` if present
 *   - Optional: commits changes
 */

const fs = require('node:fs');
const path = require('node:path');
const cp  = require('node:child_process');

const ROOT = process.cwd();
const ENGINE_PATH = path.join(ROOT, 'src/engine/ConsciousnessEngine.js');
const PKG_PATH    = path.join(ROOT, 'package.json');

const args = new Set(process.argv.slice(2));
const wantApply       = args.has('--apply') || args.size === 0;
const wantVerify      = args.has('--verify') || args.size === 0;
const wantRunValidate = args.has('--run-validate');
const wantCommit      = args.has('--commit');

const stamp = () => new Date().toISOString().replace(/[:.]/g,'-');

const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');

function backupOnce(p){
  const base = path.basename(p);
  const out = path.join(ROOT, `doctor_backups/${base}.${stamp()}.bak`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(p, out);
  return out;
}

function ensureImports(src){
  let s = src;
  // Normalize BeatBus import to explicit index.js
  const beatDir = /import\s+BeatBus\s+from\s+['"]@\/theater\/bus\/?['"];?/g;
  const beatIdx = /import\s+BeatBus\s+from\s+['"]@\/theater\/bus\/index\.js['"];?/g;
  if (beatDir.test(s) && !beatIdx.test(s)) {
    s = s.replace(/import\s+BeatBus\s+from\s+['"]@\/theater\/bus\/?['"];?/g,
                  "import BeatBus from '@/theater/bus/index.js';");
  }
  // Ensure named EVENTS import
  if (!/import\s*\{\s*EVENTS\s*\}\s*from\s*['"]@\/theater\/events\.js['"];?/.test(s)) {
    if (/from\s*['"]@\/theater\/events\.js/.test(s)) {
      // Replace any default import of events with named EVENTS
      s = s.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['"]@\/theater\/events\.js['"];?/,
                    "import { EVENTS } from '@/theater/events.js';");
    } else {
      // Add the EVENTS import next to other imports
      s = s.replace(/(\nimport[^;]+;[\s\S]*?\n)(?!import)/, (m) =>
        `${m}import { EVENTS } from '@/theater/events.js';\n`
      );
      if (!/import\s*\{\s*EVENTS\s*\}\s*from\s*['"]@\/theater\/events\.js['"];?/.test(s)) {
        // fallback: prepend
        s = `import { EVENTS } from '@/theater/events.js';\n` + s;
      }
    }
  }
  return s;
}

// crude brace matcher to find end of a function body
function findFunctionBodyRange(src, fnName){
  const idx = src.indexOf(fnName);
  if (idx < 0) return null;
  const openBrace = src.indexOf('{', idx);
  if (openBrace < 0) return null;
  let depth = 0;
  for (let i = openBrace; i < src.length; i++){
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return { start: idx, bodyStart: openBrace+1, bodyEnd: i };
    }
  }
  return null;
}

function insertBefore(src, pos, snippet){
  return src.slice(0, pos) + snippet + src.slice(pos);
}

function applyPatch(src){
  let s = ensureImports(src);
  let changed = s !== src;

  // Ensure buildEmergenceBlueprint exists
  const hasMethod = /buildEmergenceBlueprint\s*\(/.test(s);
  if (!hasMethod){
    // Insert before class closing brace
    // Find last occurrence of "\n}" that closes the class by heuristic: last "}\n\n// HMR-safe singleton" anchor
    const anchor = s.indexOf('// HMR-safe singleton');
    let insertPos = anchor > -1 ? anchor : s.lastIndexOf('}\n');
    if (insertPos < 0) insertPos = s.length - 1;

    const methodSnippet = `

// ---- emergence builder -------------------------------------------------------
buildEmergenceBlueprint({
  mode = 'emergence',
  source = 'viewportSpread',
  target = 'constellation',
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
    s = insertBefore(s, insertPos, methodSnippet);
    changed = true;
  }

  // Ensure BUILD_EMERGENCE_BLUEPRINT listener exists inside _installListeners()
  const hasListener = /BeatBus\.on\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT/.test(s);
  if (!hasListener){
    const range = findFunctionBodyRange(s, '_installListeners(');
    if (!range) throw new Error('Could not locate _installListeners() to inject listener.');
    const inject = `

    // Build emergence on demand — Engine emits BLUEPRINT_READY only.
    // Renderer owns PARTICLES_EMERGED (do not emit it here).
    this._listeners.push(
      BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (payload = {}) => {
        try {
          const bp = this.buildEmergenceBlueprint({
            mode: 'emergence',
            count: payload.count || 2000,
            viewportHint: payload.viewportHint || this._viewportHint,
            tierRatios: payload.tierRatios || [0.5, 0.2, 0.15, 0.15],
          });

          if (!this._validateBlueprint(bp)) {
            console.error('🧠 Engine: invalid emergence blueprint; not emitting');
            return;
          }

          this._lastEmergenceTargets = bp.text3DPositions;
          BeatBus.emit(EVENTS.BLUEPRINT_READY, {
            blueprint: bp,
            stage: 'genesis',
            quality: this.currentQuality,
            mode: 'emergence',
            cached: false,
          });
          this._log('blueprint_emit', { stage: 'genesis', quality: this.currentQuality, mode: 'emergence', count: bp.activeCount });
        } catch (e) {
          console.error('🧠 Engine: emergence build failed:', e);
        }
      })
    );
`;
    s = insertBefore(s, range.bodyEnd, inject);
    changed = true;
  }

  return { code: s, changed };
}

function verify(src){
  const okImports  = /import\s+BeatBus\s+from\s+['"]@\/theater\/bus\/index\.js['"]/.test(src)
                  && /import\s*\{\s*EVENTS\s*\}\s*from\s*['"]@\/theater\/events\.js['"]/.test(src);
  const okMethod   = /buildEmergenceBlueprint\s*\(/.test(src);
  const okListener = /BeatBus\.on\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT/.test(src)
                  && /BLUEPRINT_READY[^}]+mode\s*:\s*['"]emergence['"]/.test(src);

  const report = {
    imports: okImports ? 'OK' : 'X',
    method:  okMethod  ? 'OK' : 'X',
    listener:okListener? 'OK' : 'X'
  };
  const pass = okImports && okMethod && okListener;
  return { pass, report };
}

function run(cmd, opts={}){
  try {
    cp.execSync(cmd, { stdio: 'inherit', ...opts });
    return true;
  } catch {
    return false;
  }
}

(function main(){
  if (!fs.existsSync(ENGINE_PATH)) {
    console.error('❌ Engine file not found:', ENGINE_PATH);
    process.exit(2);
  }

  const original = read(ENGINE_PATH);

  if (wantApply) {
    fs.mkdirSync(path.dirname(ENGINE_PATH), { recursive: true });
    const bak = backupOnce(ENGINE_PATH);
    console.log('🗂  Backup saved:', path.relative(ROOT, bak));

    let { code, changed } = applyPatch(original);
    if (!changed) {
      console.log('ℹ️  No changes needed (already patched).');
    } else {
      write(ENGINE_PATH, code);
      console.log('✅ Patch applied to Engine.');
    }
  }

  const after = read(ENGINE_PATH);

  if (wantVerify) {
    const { pass, report } = verify(after);
    console.log('\n🔎 Self-Verification');
    console.table(report);
    if (!pass) {
      console.error('❌ Verification failed. Restoring backup is recommended.');
      process.exit(3);
    } else {
      console.log('✅ Verification passed (imports + method + listener present).');
    }
  }

  if (wantRunValidate && fs.existsSync(PKG_PATH)) {
    const pkg = JSON.parse(read(PKG_PATH) || '{}');
    const hasValidate = pkg.scripts && (pkg.scripts.validate || pkg.scripts['validate:opening']);
    if (hasValidate) {
      console.log('\n📏 Running project validate…');
      const ok = run('npm run validate') || run('npm run validate:opening');
      if (!ok) {
        console.error('⚠️  Project validator reported issues. Review output above.');
      } else {
        console.log('✅ Project validator completed.');
      }
    } else {
      console.log('ℹ️  No validate script found. Skipping.');
    }
  }

  if (wantCommit) {
    console.log('\n📝 Creating commit…');
    const ok = run(`git add ${JSON.stringify(path.relative(ROOT, ENGINE_PATH))}`) &&
               run(`git commit -m "Hermetic One-Touch: wire BUILD_EMERGENCE_BLUEPRINT → BLUEPRINT_READY(mode:'emergence'); keep renderer fencepost"`);
    if (!ok) {
      console.log('ℹ️  Commit skipped or failed (possibly no changes).');
    } else {
      console.log('✅ Commit created.');
    }
  }

  console.log('\n✨ Done.');
})();
