#!/usr/bin/env node
/**
 * Hermetic One-Touch: TheaterDirector emergence contract fixer (idempotent)
 * - Normalizes BUILD_EMERGENCE_BLUEPRINT payload (new contract)
 * - Adds strong duplicate-start guard (isRunning/hasRun)
 * - Makes viewport wait non-recursive if needed
 * - Self-verifies after patch
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const CANDIDATES = [
  'src/theater/TheaterDirector.js',
  'src/theater/TheaterDirector.jsx',
  'src/components/theater/TheaterDirector.js',
  'src/components/consciousness/TheaterDirector.js',
].map(p => path.join(ROOT,p));

const TD_PATH = CANDIDATES.find(p => fs.existsSync(p));
if (!TD_PATH) {
  console.error('❌ Could not find TheaterDirector file in known locations.');
  process.exit(2);
}

const read = p => fs.readFileSync(p,'utf8');
const write = (p,s) => fs.writeFileSync(p,s,'utf8');
const stamp = () => new Date().toISOString().replace(/[:.]/g,'-');
const backup = p => {
  const outDir = path.join(ROOT,'doctor_backups');
  fs.mkdirSync(outDir,{recursive:true});
  const out = path.join(outDir, path.basename(p)+'.'+stamp()+'.bak');
  fs.copyFileSync(p,out);
  return out;
};

let src = read(TD_PATH);
const original = src;
const report = { payload:'unchanged', guards:'unchanged', viewportWait:'unchanged' };

/** 1) Fix payload for BUILD_EMERGENCE_BLUEPRINT */
const oldPayloadRe = /BeatBus\.emit\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT\s*,\s*\{\s*[^}]*sourceText[^}]*\}\s*\)/m;
if (oldPayloadRe.test(src)) {
  src = src.replace(oldPayloadRe, (m)=>{
    return `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {
      mode: 'emergence',
      source: 'viewportSpread',
      target: 'constellation',
      count: 2000,
      tierRatios: [0.5, 0.2, 0.15, 0.15],
      viewportHint: {
        width: window.innerWidth,
        height: window.innerHeight,
        aspect: window.innerWidth / window.innerHeight
      }
    })`;
  });
  report.payload = 'patched';
} else if (/BUILD_EMERGENCE_BLUEPRINT/.test(src) && !/mode\s*:\s*['"]emergence['"]/.test(src)) {
  // Generic upgrade: inject mode/source/target if missing
  src = src.replace(/BeatBus\.emit\s*\(\s*EVENTS\.BUILD_EMERGENCE_BLUEPRINT\s*,\s*\{([\s\S]*?)\}\s*\)/m,
  (full, inner)=>{
    const hasMode = /mode\s*:/.test(inner);
    const hasSource = /source\s*:/.test(inner);
    const hasTarget = /target\s*:/.test(inner);
    let body = inner.trim();
    if (!hasMode) body = `mode: 'emergence',\n      ` + body;
    if (!hasSource) body = `source: 'viewportSpread',\n      ` + body;
    if (!hasTarget) body = `target: 'constellation',\n      ` + body;
    if (!/viewportHint\s*:/.test(body)) {
      body += `,\n      viewportHint: { width: window.innerWidth, height: window.innerHeight, aspect: window.innerWidth / window.innerHeight }`;
    }
    if (!/tierRatios\s*:/.test(body)) {
      body += `,\n      tierRatios: [0.5, 0.2, 0.15, 0.15]`;
    }
    return `BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, {\n      ${body}\n    })`;
  });
  report.payload = 'patched';
}

/** 2) Strengthen duplicate-start guard */
if (!/if\s*\(\s*this\.isRunning\s*\|\|\s*this\.hasRun\s*\)/.test(src)) {
  src = src.replace(/async\s+start\s*\(\s*\)\s*\{/,
    `async start() {\n    if (this.isRunning || this.hasRun) { console.log('🎬 Director: Start blocked'); return; }`);
  report.guards = 'patched';
}

/** 3) Make viewport wait non-recursive (avoid calling start() from inside listener) */
if (/this\.start\(\)\s*;?\s*\}\s*\)\s*;?\s*\)\s*;?/.test(src) && /ENGINE_VIEWPORT_HINT/.test(src)) {
  // Replace direct start() inside viewport hint with a flag + setTimeout
  src = src.replace(/BeatBus\.on\s*\(\s*EVENTS\.ENGINE_VIEWPORT_HINT\s*,\s*\(\s*\w+\s*\)\s*=>\s*\{\s*([\s\S]*?)\}\s*\)\s*;?/m,
  (full, inner)=>{
    if (/this\.start\(\)/.test(inner)) {
      const fixed = inner.replace(/this\.start\(\)\s*;?/g, 'this.viewportReady = true; setTimeout(() => { if (!this.isRunning && !this.hasRun) this.start(); }, 0);');
      report.viewportWait = 'patched';
      return `BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, (data) => { ${fixed} })`;
    }
    return full;
  });
}

if (src !== original) {
  const bak = backup(TD_PATH);
  console.log('🗂  Backup:', path.relative(ROOT,bak));
  write(TD_PATH, src);
  console.log('✅ Patched:', path.relative(ROOT,TD_PATH));
} else {
  console.log('ℹ️  No changes needed (already correct).');
}

/** Self-check */
const okPayload = /BUILD_EMERGENCE_BLUEPRINT[\s\S]+mode\s*:\s*['"]emergence['"][\s\S]+source\s*:\s*['"]viewportSpread['"][\s\S]+target\s*:\s*['"]constellation['"]/.test(src);
const okGuards  = /if\s*\(\s*this\.isRunning\s*\|\|\s*this\.hasRun\s*\)/.test(src);
console.table({ payload: okPayload?'OK':'X', guards: okGuards?'OK':'X', viewportWait: report.viewportWait==='patched'?'OK':'?(' + report.viewportWait + ')' });
