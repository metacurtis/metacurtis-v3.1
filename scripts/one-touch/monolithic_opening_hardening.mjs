#!/usr/bin/env node
import fs from 'node:fs';

function patchFile(path, mut) {
  if (!fs.existsSync(path)) { console.error('❌ Missing', path); process.exitCode = 1; return; }
  const src = fs.readFileSync(path, 'utf8');
  const out = mut(src);
  if (out !== src) {
    fs.writeFileSync(path + `.bak.fix-${Date.now()}`, src, 'utf8');
    fs.writeFileSync(path, out, 'utf8');
    console.log('✓ Patched', path);
  } else {
    console.log('• No changes needed in', path);
  }
}

/* A) OpeningSequence.jsx — replace inset with top/left/right/bottom */
patchFile('src/components/theater/OpeningSequence.jsx', (s) => {
  let t = s;

  // Replace "inset: 0" in overlay container style
  t = t.replace(
    /inset:\s*0\s*[,}]/g,
    'top: 0, left: 0, right: 0, bottom: 0,'
  );

  // Replace "inset:0" in canvas style (any variant, with or without spaces)
  t = t.replace(
    /inset:\s*0\s*[,}]/g,
    'top: 0, left: 0, right: 0, bottom: 0,'
  );

  // Also catch JSX style strings that used "position:'fixed',inset:0"
  t = t.replace(
    /position:\s*'fixed'\s*,\s*inset:\s*0/g,
    "position: 'fixed', top: 0, left: 0, right: 0, bottom: 0"
  );

  return t;
});

/* B) ConsciousnessTheater.jsx — ensure useState is imported */
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;

  // If import line lacks useState, add it.
  // Match common patterns: import { useEffect, useRef } from 'react';
  t = t.replace(
    /import\s*\{\s*([^}]+)\}\s*from\s*['"]react['"];/,
    (m, inner) => {
      const names = inner.split(',').map(v => v.trim());
      if (!names.includes('useState')) {
        names.push('useState');
      }
      const dedup = Array.from(new Set(names));
      return `import { ${dedup.join(', ')} } from 'react';`;
    }
  );

  return t;
});

/* C) ConsciousnessTheater.jsx — guard OPENING_COMPLETE listener (attach once) */
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;

  // If we already guarded it, do nothing
  if (t.includes('__MC_OPENING_COMPLETE_WIRED__')) return t;

  // Replace the OPENING_COMPLETE handler in "const offs = [ ... ]" with a guarded version
  const reHandler =
    /BeatBus\.on\(EVENTS\.OPENING_COMPLETE,\s*\(p\s*=\s*\{\}\)\s*=>\s*\{\s*([\s\S]*?)\}\s*\),?/m;

  if (reHandler.test(t)) {
    t = t.replace(
      reHandler,
      (_m, body) =>
        `!globalThis.__MC_OPENING_COMPLETE_WIRED__ && (globalThis.__MC_OPENING_COMPLETE_WIRED__ = true, BeatBus.on(EVENTS.OPENING_COMPLETE, (p = {}) => {\n${body}\n})) ,`
    );
  } else {
    // If the handler isn't in offs yet, inject a guarded listener at the start of the offs array
    t = t.replace(
      /const\s+offs\s*=\s*\[/,
      `const offs = [
      !globalThis.__MC_OPENING_COMPLETE_WIRED__ && (globalThis.__MC_OPENING_COMPLETE_WIRED__ = true, BeatBus.on(EVENTS.OPENING_COMPLETE, (p = {}) => {
        setShowCanvas(true);
        BeatBus.emit(EVENTS.STAGE_CHANGE, { stage: 'genesis' });
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 1 });
        BeatBus.emit(EVENTS.ENABLE_SCROLL);
      })),`
    );
  }

  return t;
});
