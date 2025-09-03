#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

const log = {
  ok:  (m) => console.log(`\x1b[32m✔\x1b[0m ${m}`),
  bad: (m) => console.log(`\x1b[31m✘\x1b[0m ${m}`),
  warn:(m) => console.log(`\x1b[33m▲\x1b[0m ${m}`),
  info:(m) => console.log(`\x1b[36mℹ\x1b[0m ${m}`)
};

const cfg = {
  canonicalJson: 'src/config/canonical/sst-v3.3.json',
  schemaJson:    'src/config/canonical/sst-v3.3.schema.json',
  canonicalModule: 'src/config/canonical/canonicalAuthority.js',
  rendererAllow: [
    'src/components/webgl/WebGLBackground.jsx',
    'src/components/webgl/WebGLBackground.tsx',
    'src/components/webgl/WebGLBackground.js'
  ],
  directorHints: [
    'src/theater/TheaterDirector.js',
    'src/theater/TheaterDirector.jsx',
    'src/theater/TheaterDirector.ts',
    'src/theater/TheaterDirector.tsx'
  ],
  openingSequence: [
    'src/components/theater/OpeningSequence.jsx',
    'src/components/theater/OpeningSequence.tsx'
  ]
};

function readIf(p) {
  try { return fs.readFileSync(path.join(root, p), 'utf8'); }
  catch { return null; }
}

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

function loadJSON(p) {
  const s = readIf(p);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

const errors = [];
const warnings = [];

function err(id, msg, file) { errors.push({ id, msg, file }); }
function warn(id, msg, file) { warnings.push({ id, msg, file }); }

function finish() {
  if (!errors.length && !warnings.length) {
    log.ok('SST guard: all checks passed');
    process.exit(0);
  }
  warnings.forEach(w => log.warn(`${w.id}: ${w.msg}${w.file ? ` [${w.file}]` : ''}`));
  if (errors.length) {
    errors.forEach(e => log.bad(`${e.id}: ${e.msg}${e.file ? ` [${e.file}]` : ''}`));
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// 1) JSON + Schema + Version
if (!exists(cfg.canonicalJson)) err('CANON_MISSING', `Canonical JSON not found at ${cfg.canonicalJson}`);
if (!exists(cfg.schemaJson))   err('SCHEMA_MISSING',  `Schema not found at ${cfg.schemaJson}`);

const sst = loadJSON(cfg.canonicalJson);
const schema = loadJSON(cfg.schemaJson);

if (sst && schema) {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true })
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(sst);
  if (!ok) err('SCHEMA_INVALID', JSON.stringify(validate.errors, null, 2));
  if (sst?.meta?.version !== '3.3') err('VERSION_MISMATCH', `meta.version=${sst?.meta?.version}; expected 3.3`, cfg.canonicalJson);
  if (sst?.meta?.authority !== 'ABSOLUTE') err('AUTHORITY_WRONG', `meta.authority must be ABSOLUTE`, cfg.canonicalJson);
  if (sst?.meta?.mode !== 'TEXT_FIRST_REVEAL') err('MODE_WRONG', `meta.mode must be TEXT_FIRST_REVEAL`, cfg.canonicalJson);
}

const stamp = readIf('SST_VERSION');
if (!stamp || stamp.trim() !== '3.3') warn('STAMP_MISSING_OR_WRONG', 'SST_VERSION should be 3.3');

// 2) Canonical module wiring
const canonMod = readIf(cfg.canonicalModule);
if (!canonMod) warn('CANON_MODULE_MISSING', `Expected canonical module at ${cfg.canonicalModule}`);
else if (!/sst-v3\.3\.json/.test(canonMod)) warn('CANON_MODULE_STALE', `canonicalAuthority.js should import sst-v3.3.json`, cfg.canonicalModule);

// 3) Single writer: geometry/uniforms
const codeFiles = fg.sync(['src/**/*.{js,jsx,ts,tsx}'], { cwd: root, dot: false });
const rendererAllowSet = new Set(cfg.rendererAllow.map(p => path.join(root, p)));
for (const f of codeFiles) {
  const full = path.join(root, f);
  const text = readIf(f) || '';
  const writesGeom = /\.setAttribute\s*\(|\.setDrawRange\s*\(/.test(text);
  if (writesGeom && !rendererAllowSet.has(full)) {
    err('SINGLE_WRITER_GEOMETRY', 'Geometry writes outside renderer are forbidden', f);
  }
}

// 4) Renderer synthesis disallowed
for (const r of cfg.rendererAllow) {
  const text = readIf(r);
  if (!text) continue;
  if (/addEventListener\s*\(\s*['"]scroll['"]/.test(text) || /document\.documentElement\.scrollTop/.test(text)) {
    err('RENDERER_SYNTHESIS', 'Renderer must not read scroll', r);
  }
  if (/camera\.fov/.test(text) || /getParameter\(.*ALIASED_POINT_SIZE_RANGE/.test(text)) {
    warn('RENDERER_FOV_TWEAK', 'Renderer should not adjust FOV/point-size heuristics; prefer canon-driven uniforms', r);
  }
  if (/ensureArraysFromEmergence|fabricate/i.test(text)) {
    err('RENDERER_TARGET_FABRICATION', 'Renderer must not fabricate targets/tiers', r);
  }
}

// 5) Event single-source: PARTICLES_EMERGED only from renderer
for (const f of codeFiles) {
  const text = readIf(f) || '';
  if (/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(text)) {
    const isRenderer = rendererAllowSet.has(path.join(root, f));
    if (!isRenderer) err('EMIT_SOURCE', 'Only renderer may emit PARTICLES_EMERGED', f);
  }
}

// 6) Director hints
for (const d of cfg.directorHints) {
  const t = readIf(d);
  if (!t) continue;
  if (!/STAGE_CHANGE[^]*?['"]genesis['"]/.test(t)) {
    warn('DIRECTOR_GENESIS_MISSING', 'Director should emit STAGE_CHANGE(\"genesis\") after emergence', d);
  }
}

// 7) CTF fade gating
const ctfEnabled = !!sst?.features?.ctfOpening;
if (!ctfEnabled) {
  for (const o of cfg.openingSequence) {
    const t = readIf(o);
    if (t && /CTF_BUILD/.test(t)) {
      err('CTF_GATED', 'CTF_BUILD fade is present while Canonical.features.ctfOpening=false', o);
    }
  }
}

finish();
