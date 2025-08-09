#!/usr/bin/env node
/* Canon Verify & Fix v1.0
 * Verifies Canon Guard & Canon Console pattern contracts.
 * Optional --fix adds missing *shader declarations* safely (no inline shader injection).
 *
 * Usage:
 *   node scripts/canon-verify-and-fix.cjs [--fix] [--root ./]
 */

const fs = require('fs');
const path = require('path');

const args = new Set(process.argv.slice(2));
const CAN_FIX = args.has('--fix');
const rootArgIdx = process.argv.indexOf('--root');
const ROOT = rootArgIdx >= 0 ? path.resolve(process.argv[rootArgIdx + 1]) : process.cwd();

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.vite', '.cache',
  'canon-console/agent/node_modules'
]);

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.glsl']);

// ────────────────────────────────────────────────────────────────────────────────
// RULES — keep names stable; audit scripts can grep these ids in logs if needed.
// ────────────────────────────────────────────────────────────────────────────────

/** Regex helpers */
const R = {
  // JS/TS (renderer/engine)
  shaderMaterial: /new\s+THREE\.ShaderMaterial\s*\(/i,
  pointsMaterial: /new\s+THREE\.PointsMaterial\s*\(/i,
  setDrawRange: /setDrawRange\(\s*0\s*,\s*[a-zA-Z0-9_.]+\s*\)/,
  attributeSet: (name) => new RegExp(`\\.setAttribute\\(\\s*['"]${name}['"]\\s*,\\s*new\\s+THREE\\.BufferAttribute`, 'i'),
  glslImport: /from\s+['"][^'"]+\.glsl(\?raw)?['"]/,

  // Engine & events
  makeBlueprint: /build(Emergence)?Blueprint\s*\(/i,
  beatbusOn: /BeatBus\.(on|once)\s*\(\s*EVENTS\.(BLUEPRINT_READY|STAGE_CHANGE|QUALITY_CHANGE)/,
  beatbusEmit: /BeatBus\.emit\s*\(\s*EVENTS\.BLUEPRINT_READY/i,
  beatbusOffBlocker: /BeatBus\.(off|removeListener)\s*\(\s*EVENTS\.(STAGE_CHANGE|QUALITY_CHANGE)/,

  // Console exposure
  consoleWebglBg: /window\.webglBackground\s*=\s*{/,
  consoleRendererDebug: /canonRendererDebug\./,

  // GLSL (vertex & fragment)
  glslAttr: (n) => new RegExp(`^\\s*attribute\\s+${n}\\s*;`, 'm'),
  glslUniform: (n) => new RegExp(`^\\s*uniform\\s+${n}\\s*;`, 'm'),
  glslPointSizeUse: /gl_PointSize\s*=\s*uPointSize\s*;/m
};

// Required shader items (by audit)
const REQUIRED_VERTEX_DECLS = [
  { kind: 'attr', decl: 'vec3 position' },
  { kind: 'attr', decl: 'float particleIndex' },
  { kind: 'attr', decl: 'vec3 atmosphericPosition' },
  { kind: 'attr', decl: 'vec3 allenAtlasPosition' },
  { kind: 'uniform', decl: 'vec2 uResolution' },
  { kind: 'uniform', decl: 'float uPointSize' },
  { kind: 'uniform', decl: 'float uActiveCount' },
  { kind: 'uniform', decl: 'float uMorphProgress' }, // aliasable to uStageProgress
  { kind: 'uniform', decl: 'float uStageProgress' }, // audit looks for one/both
  { kind: 'uniform', decl: 'float uStageBlend' }     // audit alternative to uScrollProgress
];

const REQUIRED_FRAGMENT_DECLS = [
  { kind: 'uniform', decl: 'vec3 uColor' },
  { kind: 'uniform', decl: 'float uGaussianSigma' },
  { kind: 'uniform', decl: 'float uTierHighlight[4]' },
  { kind: 'uniform', decl: 'sampler2D uAtlasTexture' }
];

const RULES = [
  // Renderer
  { id: 'renderer.shaderMaterial',   severity: 'error', test: (t) => R.shaderMaterial.test(t), msg: 'Renderer must use THREE.ShaderMaterial.' },
  { id: 'renderer.attributes.position', severity: 'error', test: (t) => R.attributeSet('position').test(t), msg: 'Geometry must attach "position" attribute.' },
  { id: 'renderer.attributes.atmo',  severity: 'error', test: (t) => R.attributeSet('atmosphericPosition').test(t), msg: 'Geometry must attach "atmosphericPosition".' },
  { id: 'renderer.attributes.allen', severity: 'error', test: (t) => R.attributeSet('allenAtlasPosition').test(t), msg: 'Geometry must attach "allenAtlasPosition".' },
  { id: 'renderer.attributes.index', severity: 'error', test: (t) => R.attributeSet('particleIndex').test(t), msg: 'Geometry must attach "particleIndex".' },
  { id: 'renderer.drawRange',        severity: 'error', test: (t) => R.setDrawRange.test(t), msg: 'Must call geometry.setDrawRange(0, activeCount).' },
  { id: 'renderer.glsl.import',      severity: 'warn',  test: (t) => R.glslImport.test(t),   msg: 'Import GLSL from files (no inline shader text).' },

  // Engine & BeatBus
  { id: 'engine.blueprint.builder',  severity: 'warn',  test: (t) => R.makeBlueprint.test(t), msg: 'Engine blueprint builder detected (build*Blueprint(...)).' },
  { id: 'engine.beatbus.emit',       severity: 'warn',  test: (t) => R.beatbusEmit.test(t),   msg: 'Engine emits EVENTS.BLUEPRINT_READY.' },
  { id: 'engine.beatbus.on',         severity: 'warn',  test: (t) => R.beatbusOn.test(t),     msg: 'BeatBus subscriptions found (BLUEPRINT_READY/STAGE_CHANGE/QUALITY_CHANGE).' },
  { id: 'engine.beatbus.off.block',  severity: 'warn',  anti: true, test: (t) => R.beatbusOffBlocker.test(t), msg: '⚠️ Do NOT unsubscribe from STAGE/QUALITY during/after opening.' },

  // Console exposure
  { id: 'console.webglBackground',   severity: 'info',  test: (t) => R.consoleWebglBg.test(t), msg: 'window.webglBackground debug API exposed.' },
  { id: 'console.rendererDebug',     severity: 'info',  test: (t) => R.consoleRendererDebug.test(t), msg: 'canonRendererDebug commands available.' },

  // GLSL vertex/fragment sanity checks are handled in a dedicated pass with auto-fix.
];

// ────────────────────────────────────────────────────────────────────────────────
// FS utilities
// ────────────────────────────────────────────────────────────────────────────────
function walk(dir, out = []) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (CODE_EXTS.has(path.extname(p))) out.push(p);
  }
  return out;
}

const files = walk(ROOT);

// small helpers
const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const rel = (p) => path.relative(ROOT, p);

// ────────────────────────────────────────────────────────────────────────────────
/** Check JS/TS files against RULES */
function checkCodeRules(file, text) {
  const res = [];
  for (const rule of RULES) {
    // Skip GLSL-specific validation here; we do it in shader pass.
    if (path.extname(file) === '.glsl') continue;

    const ok = !!rule.test(text);
    const status = rule.anti ? !ok : ok;
    res.push({ id: rule.id, status, severity: rule.severity, msg: rule.msg });
  }
  return res;
}

// ────────────────────────────────────────────────────────────────────────────────
/** GLSL scanner + optional fixer (safe header-only inserts) */
function scanAndMaybeFixGLSL(file, text) {
  const isVertex = /vertex/i.test(file) || /vs\.glsl$/i.test(file) || /-vertex\.glsl$/i.test(file);
  const isFragment = /fragment/i.test(file) || /fs\.glsl$/i.test(file) || /-fragment\.glsl$/i.test(file);

  if (!isVertex && !isFragment) {
    // non template shader; still attempt generic checks if both sets missing names
    return { file, changed: false, problems: [] };
  }

  const problems = [];
  let changed = false;
  let out = text;

  const HEADER_START = '// === CANON AUTO INSERT — DO NOT EDIT (BEGIN) ===';
  const HEADER_END   = '// === CANON AUTO INSERT — DO NOT EDIT (END) ===';

  function ensureHeaderBlock(lines) {
    if (out.includes(HEADER_START)) return; // already present
    const header = [HEADER_START, ...lines, HEADER_END].join('\n') + '\n\n';
    out = header + out;
    changed = true;
  }

  if (isVertex) {
    const missing = [];
    for (const req of REQUIRED_VERTEX_DECLS) {
      const re = req.kind === 'attr' ? R.glslAttr(req.decl) : R.glslUniform(req.decl);
      if (!re.test(out)) missing.push(req.decl);
    }
    if (!R.glslPointSizeUse.test(out)) {
      missing.push('gl_PointSize = uPointSize; // usage');
    }

    if (missing.length) {
      problems.push(`Vertex missing: ${missing.join(', ')}`);
      if (CAN_FIX) {
        const lines = [];
        for (const req of REQUIRED_VERTEX_DECLS) {
          const re = req.kind === 'attr' ? R.glslAttr(req.decl) : R.glslUniform(req.decl);
          if (!re.test(out)) {
            lines.push(req.kind === 'attr'
              ? `attribute ${req.decl};`
              : `uniform ${req.decl};`);
          }
        }
        if (!R.glslPointSizeUse.test(out)) {
          // We won’t try to place this inside main(); we declare a helper + recommend usage.
          lines.push('// NOTE: Ensure inside main(): gl_PointSize = uPointSize;');
        }
        // Optional utility: safe clamp macro (no-op if already present)
        if (!/CANON_POINTSIZE_CLAMP/.test(out)) {
          lines.push(
`#ifndef CANON_POINTSIZE_CLAMP
#define CANON_POINTSIZE_CLAMP(ps, minV, maxV) clamp(ps, minV, maxV)
#endif`);
        }
        ensureHeaderBlock(lines);
      }
    }
  }

  if (isFragment) {
    const missing = [];
    for (const req of REQUIRED_FRAGMENT_DECLS) {
      const re = R.glslUniform(req.decl);
      if (!re.test(out)) missing.push(req.decl);
    }
    if (missing.length) {
      problems.push(`Fragment missing: ${missing.join(', ')}`);
      if (CAN_FIX) {
        const lines = [];
        for (const req of REQUIRED_FRAGMENT_DECLS) {
          const re = R.glslUniform(req.decl);
          if (!re.test(out)) {
            lines.push(`uniform ${req.decl};`);
          }
        }
        // Provide a tiny gaussian helper if not found (non-invasive)
        if (!/canonGaussian/.test(out)) {
          lines.push(
`float canonGaussian(float r, float sigma) {
  float a = r / max(0.0001, sigma);
  return exp(-0.5 * a * a);
}`);
        }
        ensureHeaderBlock(lines);
      }
    }
  }

  return { file, changed, problems, text: out };
}

// ────────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────────
const results = [];
let jsPass = 0, jsFail = 0, jsWarn = 0, jsInfo = 0;

for (const f of files) {
  const ext = path.extname(f);
  const text = fs.readFileSync(f, 'utf8');

  if (ext === '.glsl') {
    const gl = scanAndMaybeFixGLSL(f, text);
    if (gl.changed) {
      const bak = `${f}.bak.canon-${nowStamp()}`;
      fs.writeFileSync(bak, text, 'utf8');
      fs.writeFileSync(f, gl.text, 'utf8');
    }
    if (gl.problems?.length) {
      results.push({ file: rel(f), type: 'glsl', status: 'FAIL', details: gl.problems });
      jsFail += gl.problems.length;
    } else {
      results.push({ file: rel(f), type: 'glsl', status: 'PASS', details: [] });
      jsPass++;
    }
    continue;
  }

  // JS/TS
  const checks = checkCodeRules(f, text);
  const fails = checks.filter(r => !r.status && (r.severity === 'error' || r.severity === 'warn'));
  const infos = checks.filter(r => r.status && r.severity === 'info');

  for (const r of checks) {
    if (!r.status) {
      if (r.severity === 'error') jsFail++;
      else if (r.severity === 'warn') jsWarn++;
    } else {
      if (r.severity === 'info') jsInfo++;
      else jsPass++;
    }
  }

  if (fails.length) {
    results.push({
      file: rel(f),
      type: 'code',
      status: 'ISSUES',
      details: fails.map(x => `${x.severity.toUpperCase()}: ${x.id} → ${x.msg}`)
    });
  } else if (infos.length) {
    results.push({
      file: rel(f),
      type: 'code',
      status: 'PASS',
      details: infos.map(x => `INFO: ${x.id} → ${x.msg}`)
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// REPORT
// ────────────────────────────────────────────────────────────────────────────────
function c(s, code) { return `\x1b[${code}m${s}\x1b[0m`; }
const GREEN = 32, RED = 31, YELLOW = 33, CYAN = 36, GREY = 90;

const header = `
————————————————————————————————————————————————————————————————————————
Canon Guard / Console Verification  ${CAN_FIX ? c('(auto-fix ON)', GREEN) : c('(read-only)', GREY)}
Root: ${ROOT}
————————————————————————————————————————————————————————————————————————`;

console.log(header);

for (const r of results) {
  const tag =
    r.status === 'PASS' ? c('PASS', GREEN) :
    r.status === 'ISSUES' ? c('ISSUES', YELLOW) :
    c('FAIL', RED);

  console.log(`${tag}  ${c(r.type.toUpperCase(), CYAN)}  ${r.file}`);
  if (r.details && r.details.length) {
    for (const d of r.details) console.log(`  • ${d}`);
  }
}

console.log('\n————————————————————————————————————————————————————————————————————————');
console.log(`Summary: ${c(`${jsPass} pass`, GREEN)}, ${c(`${jsWarn} warn`, YELLOW)}, ${c(`${jsFail} fail`, RED)}, ${c(`${jsInfo} info`, CYAN)}`);
if (CAN_FIX) {
  console.log(c('Auto-fix applied to GLSL headers where needed (backup created next to file).', CYAN));
}
console.log('————————————————————————————————————————————————————————————————————————\n');

// Exit code: non-zero on any fail
process.exit(jsFail > 0 ? 1 : 0);c