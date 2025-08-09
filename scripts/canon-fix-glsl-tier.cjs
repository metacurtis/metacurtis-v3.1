#!/usr/bin/env node
// Adds `uniform float uTierHighlight[4];` to fragment shaders that miss it.
const fs = require('fs'); const path = require('path');
const ROOT = process.cwd();
const targets = [
  'src/shaders/baseline/points-fragment.glsl',
  'src/shaders/templates/consciousness-fragment.glsl',
  // keep it generic too:
];

function addUniform(txt) {
  if (/uniform\s+float\s+uTierHighlight\s*\[\s*4\s*\]\s*;/.test(txt)) return txt;
  const line = 'uniform float uTierHighlight[4];\n';
  const m = txt.match(/^\s*#version[^\n]*\n/);
  if (m) return txt.replace(m[0], m[0] + line);
  return line + txt;
}

function tryFile(fp) {
  if (!fs.existsSync(fp)) return false;
  const t0 = fs.readFileSync(fp, 'utf8');
  const t1 = addUniform(t0);
  if (t0 !== t1) { fs.writeFileSync(fp, t1, 'utf8'); console.log('✓ patched', fp); return true; }
  return false;
}

let changed = 0;
for (const t of targets) changed += tryFile(path.join(ROOT, t)) ? 1 : 0;

// also sweep all fragment.glsl files:
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.isFile() && ent.name.toLowerCase().includes('fragment') && p.endsWith('.glsl')) {
      changed += tryFile(p) ? 1 : 0;
    }
  }
}
const src = path.join(ROOT, 'src');
if (fs.existsSync(src)) walk(src);
console.log(changed ? `\nDone: ${changed} fragment file(s) patched.` : '\nNo changes needed.');
