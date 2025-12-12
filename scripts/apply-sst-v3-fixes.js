// scripts/apply-sst-v3-fixes.js
/* eslint-disable no-console */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');

const projectRoot = path.resolve(__dirname, '..');

// ---- utilities -------------------------------------------------

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function backupName(file) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `${file}.bak.sst3-${ts}`;
}

async function patchFile(absPath, patchers) {
  if (!(await exists(absPath))) {
    return { file: absPath, skipped: true, reason: 'not found' };
  }

  const original = await fs.readFile(absPath, 'utf8');
  let text = original;
  let changed = false;
  const details = [];

  for (const p of patchers) {
    const { description, apply } = p;
    const next = apply(text);
    if (next !== text) {
      changed = true;
      details.push(description);
      text = next;
    }
  }

  if (!changed) return { file: absPath, changed: false };

  if (DRY) return { file: absPath, changed: true, dry: true, details };

  // backup then write
  await fs.copyFile(absPath, backupName(absPath));
  await fs.writeFile(absPath, text, 'utf8');
  return { file: absPath, changed: true, details };
}

function insertAfterOnce(src, anchorRegex, insertBlock, guardRegex) {
  if (guardRegex && guardRegex.test(src)) return src;
  const m = src.match(anchorRegex);
  if (!m) return src;
  const idx = m.index + m[0].length;
  return src.slice(0, idx) + insertBlock + src.slice(idx);
}

function replaceOnce(src, findRegex, replaceWith) {
  if (!findRegex.test(src)) return src;
  return src.replace(findRegex, replaceWith);
}

function ensureCssViewport(src) {
  if (/html,\s*body,\s*#root\s*\{[^}]*height\s*:\s*100%/m.test(src)) return src;
  const block = `\n/* SST v3.0 viewport requirement */\nhtml, body, #root { height: 100%; margin: 0; }\n`;
  return src + block;
}

// ---- patchers --------------------------------------------------

// 1) ConsciousnessEngine.js
function enginePatchers() {
  return [
    {
      description: 'SST fallback particle counts + safe stageConfig',
      apply(text) {
        let out = text;
        // Safe access to stage config
        out = replaceOnce(
          out,
          /const\s+stageConfig\s*=\s*Canonical\.stages\[stageName\];/,
          'const stageConfig = (Canonical?.stages?.[stageName]) || {};'
        );

        // Insert SPEC_COUNTS after stageConfig line (if not already present)
        out = insertAfterOnce(
          out,
          /const\s+stageConfig\s*=\s*\(Canonical\?\.stages\?\.\[stageName\]\)\s*\|\|\s*\{\};/,
          `
    // SST v3.0 absolute stage particle counts (fallback)
    const SPEC_COUNTS = {
      genesis: 2000,
      discipline: 3000,
      neural: 5000,
      velocity: 12000,
      architecture: 8000,
      harmony: 12000,
      transcendence: 15000,
    };`,
          /const\s+SPEC_COUNTS\s*=\s*\{/
        );

        // Replace baseParticleCount line
        out = replaceOnce(
          out,
          /const\s+baseParticleCount\s*=\s*stageConfig\.particleCount\s*;/,
          'const baseParticleCount = Number.isFinite(stageConfig.particleCount) ? stageConfig.particleCount : (SPEC_COUNTS[stageName] ?? 5000);'
        );

        return out;
      },
    },
    {
      description: 'Emergence text shape larger (charWidth/textHeight)',
      apply(text) {
        let out = text;
        out = replaceOnce(out, /const\s+charWidth\s*=\s*8\.0\s*;/, 'const charWidth = 10.0;');
        out = replaceOnce(out, /const\s*textHeight\s*=\s*10\.0\s*;/, 'const textHeight = 12.0;');
        return out;
      },
    },
  ];
}

// 2) WebGLBackground.jsx
function webglBackgroundPatchers() {
  return [
    {
      description: 'Hardware-safe point size helpers + uniforms',
      apply(text) {
        let out = text;

        // Before "const mat = new THREE.ShaderMaterial({", inject safePS calc if not present
        if (!/const\s+safePS\s*=/.test(out)) {
          out = insertAfterOnce(
            out,
            /const\s+mat\s*=\s*new\s+THREE\.ShaderMaterial\s*\(\s*\{\s*uniforms\s*:\s*\{/m, // if we anchor here we’re too late
            '', // fallback to earlier insertion
            null
          );
          // Better anchor: just before ShaderMaterial creation
          out = insertAfterOnce(
            out,
            /const\s+mat\s*=\s*new\s+THREE\.ShaderMaterial\s*\(\s*\{/m,
            '',
            null
          );

          // If we didn't get a reliable anchor, insert right before first ShaderMaterial creation
          out = out.replace(
            /(const\s+mat\s*=\s*new\s+THREE\.ShaderMaterial\s*\(\s*\{)/,
            `// SST v3.0: hardware-safe point size\n` +
              `    const glctx = gl.getContext?.();\n` +
              `    const range = glctx?.getParameter?.(glctx.ALIASED_POINT_SIZE_RANGE);\n` +
              `    const hwMax = Array.isArray(range) ? range[1] : (range?.[1] ?? 64);\n` +
              `    const basePS = blueprint?.mode === 'emergence' ? 60.0 : 36.0;\n` +
              `    const safePS = Math.min(basePS, hwMax * 0.9);\n\n$1`
          );
        }

        // uPointSize → safePS
        out = replaceOnce(
          out,
          /uPointSize:\s*\{\s*value:\s*30\.0\s*\}/,
          'uPointSize: { value: safePS }'
        );

        // add uGaussianSigma + uTierHighlight if missing
        if (!/uGaussianSigma\s*:/.test(out)) {
          out = out.replace(
            /(uResolution:\s*\{\s*value:\s*new\s+THREE\.Vector2\([^)]+\)\s*\),)/,
            `$1\n\n        // SST v3.0\n        uGaussianSigma: { value: 2.8 },\n        uTierHighlight: { value: [1.0, 1.0, 1.0, 1.0] },`
          );
        }

        return out;
      },
    },
  ];
}

// 3) consciousness-fragment.glsl
function fragmentShaderPatchers() {
  return [
    {
      description: 'Declare uGaussianSigma and uTierHighlight[4]',
      apply(text) {
        let out = text;
        if (!/uniform\s+float\s+uGaussianSigma\s*;/.test(out)) {
          out = insertAfterOnce(
            out,
            /uniform\s+vec3\s+uColorNext\s*;\s*/m,
            `uniform float uGaussianSigma;\nuniform float uTierHighlight[4];\n`,
            null
          );
        }
        return out;
      },
    },
    {
      description: 'Use uGaussianSigma for falloff',
      apply(text) {
        // Replace any local gaussianSigma calc with uniform-based + falloff
        if (/gaussianSigma\s*=\s*2\.5/.test(text) || /float\s+gaussianSigma\s*=/.test(text)) {
          let out = text.replace(
            /\/\s*✅\s*PROFESSIONAL\s+GAUSSIAN\s+FALLOFF[\s\S]*?(\n)/m,
            `// ✅ PROFESSIONAL GAUSSIAN FALLOFF (SST v3.0)\n  float gaussianSigma = uGaussianSigma;\n  float falloff = gaussianFalloff(particleCoord, gaussianSigma);\n$1`
          );
          return out;
        }
        // If block not found, ensure we at least add falloff near end
        return text;
      },
    },
    {
      description: 'Tier highlight + falloff in final alpha and color',
      apply(text) {
        // Inject tierGain & falloff usage into final alpha block
        if (/finalAlpha\s*=\s*vAlpha\s*\*\s*atlasColor\.a\s*\*\s*tierFade\s*;/.test(text)) {
          let out = text.replace(
            /finalAlpha\s*=\s*vAlpha\s*\*\s*atlasColor\.a\s*\*\s*tierFade\s*;/,
            `float tierGain = (vTierID < 0.5) ? uTierHighlight[0]\n                 : (vTierID < 1.5) ? uTierHighlight[1]\n                 : (vTierID < 2.5) ? uTierHighlight[2]\n                 : uTierHighlight[3];\n  float finalAlpha = vAlpha * atlasColor.a * tierFade * falloff * tierGain;\n  finalColor *= tierGain;`
          );
          return out;
        }
        return text;
      },
    },
  ];
}

// 4) Global CSS: ensure full viewport
async function patchGlobalCss() {
  const candidates = [
    'src/index.css',
    'src/global.css',
    'src/styles.css',
    'src/main.css',
    'src/app.css',
  ].map(p => path.join(projectRoot, p));

  const results = [];
  for (const file of candidates) {
    if (!(await exists(file))) {
      results.push({ file, skipped: true, reason: 'not found' });
      continue;
    }
    const original = await fs.readFile(file, 'utf8');
    const updated = ensureCssViewport(original);
    if (updated !== original) {
      if (!DRY) {
        await fs.copyFile(file, backupName(file));
        await fs.writeFile(file, updated, 'utf8');
      }
      results.push({ file, changed: true });
    } else {
      results.push({ file, changed: false });
    }
  }
  return results;
}

// 5) package.json: add npm script
async function patchPackageJson() {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!(await exists(pkgPath))) return { skipped: true, reason: 'no package.json' };
  const raw = await fs.readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts['fix:sst']) {
    pkg.scripts['fix:sst'] = 'node scripts/apply-sst-v3-fixes.js';
    if (!DRY) {
      await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
    return { changed: true, file: pkgPath };
  }
  return { changed: false, file: pkgPath };
}

// ---- main ------------------------------------------------------

async function main() {
  const files = {
    engine: path.join(projectRoot, 'src/engine/ConsciousnessEngine.js'),
    webglBg: path.join(projectRoot, 'src/components/webgl/WebGLBackground.jsx'),
    frag: path.join(projectRoot, 'src/shaders/templates/consciousness-fragment.glsl'),
  };

  console.log(`\nSST v3.0 Fixer ${DRY ? '(dry run)' : ''}`);
  console.log('Project:', projectRoot, '\n');

  const results = [];

  results.push(await patchFile(files.engine, enginePatchers()));
  results.push(await patchFile(files.webglBg, webglBackgroundPatchers()));
  results.push(await patchFile(files.frag, fragmentShaderPatchers()));

  const cssResults = await patchGlobalCss();
  const pkgRes = await patchPackageJson();

  // ---- report
  const print = r => {
    if (!r) return;
    if (Array.isArray(r)) return r.forEach(print);
    if (r.skipped) return console.log('•', path.relative(projectRoot, r.file), '— skipped:', r.reason);
    if (r.changed && r.dry) return console.log('•', path.relative(projectRoot, r.file), '— WOULD CHANGE', r.details ? `(${r.details.join('; ')})` : '');
    if (r.changed) return console.log('•', path.relative(projectRoot, r.file), '— changed', r.details ? `(${r.details.join('; ')})` : '');
    console.log('•', path.relative(projectRoot, r.file), '— no changes');
  };

  results.forEach(print);
  cssResults.forEach(print);
  print(pkgRes);

  if (!DRY) {
    console.log('\nBackups created alongside changed files with .bak.sst3-<timestamp> suffix.');
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fixer failed:', err);
  process.exit(1);
});
