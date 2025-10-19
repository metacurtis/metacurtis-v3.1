#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
'use strict';

/**
 * SST v3 Theater Doctor — READ-ONLY verifier
 * Checks wiring for: EMERGENCE → BLUEPRINT_READY → MORPH, BG listeners, tint, and bridge lane.
 *
 * Usage: node scripts/sst-v3-theater-doctor.cjs
 */

const fs = require('fs');
const _path = require('path');
const root = process.cwd();
const j = (...xs) => path.join(root, ...xs);
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '');

const files = {
  opening: j('src/components/theater/OpeningSequence.jsx'),
  director: j('src/theater/TheaterDirector.js'),
  engine: j('src/engine/ConsciousnessEngine.js'),
  bg: j('src/components/webgl/WebGLBackground.jsx'),
  bridge: j('modules/state/bridges/AtomicToBeatBus.js'),
};

const S = {};
for (const [k, f] of Object.entries(files)) S[k] = read(f);

// Helpers (match EVENTS.X or "X")
const on = (name) => new RegExp(`\\.on\\(\\s*(?:EVENTS\\.|["'])${name}(?:\\b|["'])`);
const emit = (name) => new RegExp(`\\.emit\\(\\s*(?:EVENTS\\.|["'])${name}(?:\\b|["'])`);

// Flags
const flags = {
  morphLane: /HOTDORS:SSTV3_MORPH_FROM_STAGE|stageAtom\.subscribe\([\s\S]*MORPH_PROGRESS/.test(S.bridge)
    ? 'stage'
    : 'unknown',
  invertMorph: /__SST_MORPH_INVERT/.test(S.bridge),

  // Director emits emergence once (we added this)
  directorEmitsEmergence: emit('PARTICLES_START_EMERGING').test(S.director),
  directorBuildsEmergence: emit('BUILD_EMERGENCE_BLUEPRINT').test(S.director),

  // Engine emits full blueprints
  engineBuildsBlueprint: emit('BLUEPRINT_READY').test(S.engine),

  // BG listens
  bgListensBlueprint: on('BLUEPRINT_READY').test(S.bg),
  bgListensMorph: on('MORPH_PROGRESS').test(S.bg),
  stageTintListener: on('STAGE_CHANGE').test(S.bg) || /HOTDORS:stageTint/.test(S.bg),

  // Opening doesn’t *emit* (we want passive fade-out only)
  openingEmitsEmergence: emit('PARTICLES_START_EMERGING').test(S.opening),

  // Any unconditional auto-cancel still around?
  hasAutoDirectorCancel:
    /BeatBus\.emit(?:\?\.)?\(\s*(?:EVENTS\.)?DIRECTOR_CANCEL\s*\)/.test(S.opening) ||
    /BeatBus\.emit(?:\?\.)?\(\s*(?:EVENTS\.)?DIRECTOR_CANCEL\s*\)/.test(S.director),
};

// Report
console.log('\n[SST-DOCTOR] DRY-RUN (verify only)\n');
console.table({
  morphLane: flags.morphLane,
  invertMorph: flags.invertMorph,
  directorEmitsEmergence: flags.directorEmitsEmergence,
  directorBuildsEmergence: flags.directorBuildsEmergence,
  engineBuildsBlueprint: flags.engineBuildsBlueprint,
  bgListensBlueprint: flags.bgListensBlueprint,
  bgListensMorph: flags.bgListensMorph,
  stageTintListener: flags.stageTintListener,
  openingEmitsEmergence: flags.openingEmitsEmergence,
  hasAutoDirectorCancel: flags.hasAutoDirectorCancel,
});

// Suggestions
const todo = [];
if (!flags.bgListensMorph) todo.push('BG missing MORPH_PROGRESS listener');
if (!flags.stageTintListener) todo.push('BG missing STAGE_CHANGE → tint listener');
if (!flags.directorEmitsEmergence) todo.push('Director not emitting PARTICLES_START_EMERGING');
if (!flags.engineBuildsBlueprint) todo.push('Engine not emitting BLUEPRINT_READY');
if (flags.openingEmitsEmergence) todo.push('OpeningSequence should not emit PARTICLES_START_EMERGING (passive only)');
if (flags.hasAutoDirectorCancel) todo.push('Auto DIRECTOR_CANCEL still present somewhere');

if (todo.length) {
  console.log('\nNotes:');
  for (const t of todo) console.log(' -', t);
} else {
  console.log('\nAll key theater links look healthy.');
}
console.log('');
