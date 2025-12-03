#!/usr/bin/env node
/**
 * ROLE:
 *  - Phase 1 audit: align Canon visual effects with narrative beat visuals.
 *
 * OUTPUT:
 *  - List of visual effect IDs.
 *  - List of beat visual references.
 *  - Unknown references (beats -> no matching effect).
 *  - Unused effects (effects -> never referenced by beats).
 *
 * INVARIANTS (Phase 1):
 *  - We do NOT fail the build yet; we surface drift.
 *  - Future phase can turn unknown visual references into hard errors.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CANON_PATH = path.join(ROOT, 'sst', 'canon', 'v3.5.json');

function loadCanon() {
  return JSON.parse(fs.readFileSync(CANON_PATH, 'utf8'));
}

function getVisualEffectIds(visualEffects) {
  if (!visualEffects) return [];
  if (Array.isArray(visualEffects)) {
    return visualEffects.map((v) => v && v.id).filter(Boolean);
  }
  if (visualEffects.particleEffects && typeof visualEffects.particleEffects === 'object') {
    return Object.keys(visualEffects.particleEffects);
  }
  return [];
}

function getReservedIds(visualEffects) {
  if (!visualEffects) return [];
  if (Array.isArray(visualEffects)) {
    return visualEffects.filter((v) => v && v.status === 'reserved').map((v) => v.id);
  }
  if (visualEffects.particleEffects && typeof visualEffects.particleEffects === 'object') {
    return Object.entries(visualEffects.particleEffects)
      .filter(([, val]) => val && val.status === 'reserved')
      .map(([key]) => key);
  }
  return [];
}

function getBeatVisuals(beatSheets) {
  const visuals = [];
  if (!beatSheets) return visuals;

  // Object form: stageName -> { beats: [...] }
  if (!Array.isArray(beatSheets) && typeof beatSheets === 'object') {
    for (const [stageName, sheet] of Object.entries(beatSheets)) {
      const beats = Array.isArray(sheet?.beats) ? sheet.beats : [];
      beats.forEach((beat, idx) => {
        const v = beat?.visual;
        if (!v) return;
        const visualId = typeof v === 'string' ? v : (v && v.effectId);
        if (visualId) visuals.push({ beatId: beat.id || `${stageName}#${idx}`, visualId });
      });
    }
    return visuals;
  }

  // Array form: [{ id, visual, ... }]
  if (Array.isArray(beatSheets)) {
    beatSheets.forEach((beat) => {
      const v = beat?.visual;
      if (!v) return;
      const visualId = typeof v === 'string' ? v : (v && v.effectId);
      if (visualId) visuals.push({ beatId: beat.id || '(no-id)', visualId });
    });
  }

  return visuals;
}

function main() {
  const canon = loadCanon();

  const visualEffects = getVisualEffectIds(canon.visualEffects);
  const visualEffectSet = new Set(visualEffects);
  const reservedIds = getReservedIds(canon.visualEffects);

  const beatVisuals = getBeatVisuals(canon.narrative?.beatSheets);
  const beatVisualIds = beatVisuals.map((b) => b.visualId);
  const beatVisualSet = new Set(beatVisualIds);

  const unknownRefs = beatVisuals.filter((b) => !visualEffectSet.has(b.visualId));

  const reservedSet = new Set(reservedIds);

  const unusedEffects = visualEffects.filter(
    (id) => !beatVisualSet.has(id) && !reservedSet.has(id)
  );

  console.log('🔎 Canon Visual Audit');
  console.log('---------------------');
  console.log('Visual Effects (ids):');
  if (visualEffects.length === 0) console.log('  ⚠️ none found');
  visualEffects.forEach((id) => console.log('  -', id));

  console.log('\nBeat Visual References:');
  if (beatVisuals.length === 0) console.log('  ⚠️ none found');
  beatVisuals.forEach((b) => console.log(`  - beat=${b.beatId} visual=${b.visualId}`));

  console.log('\nUnknown Beat Visual References (no matching visualEffects[id]):');
  if (unknownRefs.length === 0) {
    console.log('  ✅ none');
  } else {
    unknownRefs.forEach((b) => console.log(`  ❌ beat=${b.beatId} visual=${b.visualId}`));
  }

  console.log('\nUnused Visual Effects (never referenced by beatSheets, not reserved):');
  if (unusedEffects.length === 0) {
    console.log('  ✅ none');
  } else {
    unusedEffects.forEach((id) => console.log('  ⚠️', id));
  }

  // Phase 1 gate: unknown refs are not allowed.
  if (unknownRefs.length > 0) {
    console.error(
      '\n❌ Canon visual drift: some beatSheets.visual entries do not match any visualEffects[id].'
    );
    process.exit(1);
  }

  // Unused non-reserved effects are warnings only for now.
  process.exit(0);
}

main();
