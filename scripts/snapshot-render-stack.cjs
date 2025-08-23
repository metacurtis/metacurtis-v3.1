#!/usr/bin/env node
/* Snapshot the render stack: copies key files to .txt + one concatenated file. */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = process.cwd();

const preferred = [
  // Core render path
  'src/components/webgl/WebGLCanvas.jsx',
  'src/components/webgl/WebGLBackground.jsx',

  // Engine + bus + events
  'src/engine/ConsciousnessEngine.js',
  'src/src/modules/orchestration/core/BeatBus.js',
  'src/theater/events.js',
  'src/theatre/events.js', // alt spelling

  // Canon + atlas
  'src/config/canonical/canonicalAuthority.js',
  'src/components/webgl/consciousness/PointSpriteAtlas.js',

  // Shaders
  'src/shaders/templates/consciousness-vertex.glsl',
  'src/shaders/templates/consciousness-fragment.glsl',

  // App entry (context + providers)
  'src/main.jsx',
  'src/App.jsx',

  // Build config
  'vite.config.js',
  'jsconfig.json',
  'package.json',
];

const args = new Set(process.argv.slice(2));
const includeAllShaders = args.has('--all-shaders');
const includeDevFiles   = args.has('--dev');

function sh(cmd) {
  try { return cp.execSync(cmd, { stdio:['ignore','pipe','pipe'] }).toString().trim(); }
  catch { return ''; }
}

function gitShort() {
  let head = sh('git rev-parse --short HEAD'); if (head) return head;
  return 'no-git';
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g,'-');
}

function walk(dir, out=[]) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes:true }); } catch { return out; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === 'snapshots' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function findByFilename(basename) {
  const base = path.join(root, 'src');
  const all = walk(base);
  return all
    .filter(p => p.endsWith(path.sep + basename))
    .map(p => path.relative(root, p));
}

function ensureList() {
  const wanted = new Set();
  for (const p of preferred) wanted.add(p);
  // If key files missing, search for them:
  const fallbacks = [
    ['BeatBus.js', /BeatBus/],
    ['WebGLBackground.jsx', /WebGLBackground/],
    ['WebGLCanvas.jsx', /WebGLCanvas/],
    ['canonicalAuthority.js', /canonicalAuthority/],
    ['events.js', /EVENTS/],
  ];
  for (const [name] of fallbacks) {
    const has = Array.from(wanted).some(p => p.endsWith(name) && fs.existsSync(path.join(root, p)));
    if (!has) {
      const found = findByFilename(name);
      found.forEach(f => wanted.add(f));
    }
  }
  // Optional expansions
  if (includeAllShaders) {
    walk(path.join(root,'src','shaders'))
      .filter(p => p.endsWith('.glsl'))
      .map(p => path.relative(root, p))
      .forEach(p => wanted.add(p));
  }
  if (includeDevFiles) {
    [
      'src/components/dev/SmartConsole.js',
      'src/components/dev/EngineBlueprintInterceptor.js',
      'src/components/dev/DevPerformanceMonitor.jsx',
      'src/components/dev/DebugExpose.jsx',
    ].forEach(p => wanted.add(p));
  }
  // Keep only existing
  return Array.from(wanted).filter(rel => fs.existsSync(path.join(root, rel)));
}

function safeName(rel) {
  return rel.replace(/[\/\\]/g, '__') + '.txt';
}

function headerBlock(meta) {
  const lines = [];
  lines.push('=== RENDER STACK SNAPSHOT ===');
  lines.push(`createdAt: ${meta.createdAt}`);
  lines.push(`commit   : ${meta.commit}`);
  lines.push(`files    : ${meta.count}`);
  lines.push('');
  lines.push('Order: engine → bus → events → canvas → background → shaders → dev → config');
  lines.push('==============================================');
  lines.push('');
  return lines.join('\n');
}

function fileDivider(rel) {
  return `\n\n====================[ FILE: ${rel} ]====================\n\n`;
}

(function main(){
  const files = ensureList();

  if (files.length === 0) {
    console.error('No files found to snapshot. Are you in the repo root?');
    process.exit(2);
  }

  const outDir = path.join(root, 'snapshots', `render-stack_${stamp()}_${gitShort()}`);
  fs.mkdirSync(outDir, { recursive: true });

  const meta = { createdAt: new Date().toISOString(), commit: gitShort(), count: files.length };
  const manifest = [];
  const concatPath = path.join(outDir, 'CONCAT_render-stack.txt');
  let concat = headerBlock(meta);

  for (const rel of files) {
    const abs = path.join(root, rel);
    const txtName = safeName(rel);
    const dst = path.join(outDir, txtName);
    let src = '';
    try { src = fs.readFileSync(abs, 'utf8'); }
    catch (e) {
      console.warn('⚠️  read failed:', rel, e?.message || e);
      continue;
    }
    try { fs.writeFileSync(dst, src, 'utf8'); }
    catch (e) {
      console.warn('⚠️  write failed:', dst, e?.message || e);
      continue;
    }
    concat += fileDivider(rel) + src;
    const stat = fs.statSync(abs);
    manifest.push({ rel, txt: path.relative(root, dst), size: stat.size });
    console.log('📄 saved', rel, '→', path.relative(root, dst));
  }

  fs.writeFileSync(concatPath, concat, 'utf8');
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({
    ...meta, files: manifest,
  }, null, 2), 'utf8');

  console.log('\n✅ Snapshot complete.');
  console.log('   Dir   :', path.relative(root, outDir));
  console.log('   CONCAT:', path.relative(root, concatPath));
  console.log('   Count :', files.length);
  console.log('\nTips:');
  console.log('  • Open the CONCAT file for a single-file review flow.');
  console.log('  • Or diff individual .txt files across snapshots.');
  console.log('  • Add flags: --all-shaders  (include every .glsl under src/shaders)');
  console.log('               --dev          (include SmartConsole/Interceptors/Monitors)');
})();
