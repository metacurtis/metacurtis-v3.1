#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs';

function stripTopDirective(s) {
  // Remove a single first-line "$@" (optionally quoted)
  return s.replace(/^\s*["']?\$@["']?\s*[\r\n]+/, '');
}

function ensureGenesisEmitBlock(s) {
  // Normalize single → double quotes for sentinel
  s = s.replace(
    /BeatBus\.emit\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\{\s*stage\s*:\s*'genesis'\s*\}\s*\)\s*;/g,
    'BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: "genesis" });'
  );

  // Insert just after the await this.once(EVENTS.PARTICLES_EMERGED, …);
  const reAwait = /await\s+this\.once\s*\(\s*EVENTS\.PARTICLES_EMERGED[^;]*;\s*/m;
  const m = s.match(reAwait);
  if (m) {
    const insertPos = m.index + m[0].length;
    const windowStr = s.slice(insertPos, insertPos + 220);
    const hasEmitNearby = /BeatBus\.emit\(\s*EVENTS\.STAGE_CHANGE\s*,\s*\{\s*stage\s*:\s*"genesis"\s*\}\s*\)\s*;/.test(windowStr);
    if (!hasEmitNearby) {
      s = s.slice(0, insertPos)
        + '\n      BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: "genesis" });\n'
        + s.slice(insertPos);
    }
  }
  // Ensure default export exists
  if (/const\s+director\s*=/.test(s) && !/export\s+default\s+director\s*;?/.test(s)) {
    s += '\nexport default director;\n';
  }
  return s;
}

function patchFile(file, mutator) {
  if (!fs.existsSync(file)) { console.log('! skip (missing)', file); return; }
  const src = fs.readFileSync(file, 'utf8');
  const out = mutator(src);
  if (out !== src) {
    const bak = `${file}.bak.hotdors-${Date.now()}`;
    fs.writeFileSync(bak, src, 'utf8');
    fs.writeFileSync(file, out, 'utf8');
    console.log('✓ patched', file, '→ backup:', bak);
  } else {
    console.log('• noop', file);
  }
}

// Apply fixes
patchFile('src/theater/TheaterDirector.js', s => ensureGenesisEmitBlock(stripTopDirective(s)));
patchFile('src/components/webgl/WebGLBackground.jsx', s => stripTopDirective(s));
