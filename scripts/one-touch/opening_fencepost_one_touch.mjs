#!/usr/bin/env node
import fs from 'node:fs';

function patchFile(path, mut) {
  if (!fs.existsSync(path)) { console.error('❌ Missing', path); process.exitCode = 1; return; }
  const src = fs.readFileSync(path, 'utf8');
  const out = mut(src);
  if (out !== src) {
    fs.writeFileSync(path + `.bak.hotdors-${Date.now()}`, src, 'utf8');
    fs.writeFileSync(path, out, 'utf8');
    console.log('✓ Patched', path);
  } else {
    console.log('• No changes needed in', path);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   OpeningSequence.jsx
   - Use single bus path
   - Remove CTF fade handler
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/theater/OpeningSequence.jsx', (s) => {
  let t = s;
  // fix BeatBus path
  t = t.replace(
    /from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"];/,
    `from '@/theater/bus';`
  );
  // remove CTF_BUILD block if present
  t = t.replace(
    /\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
    `BeatBus.on(EVENTS.PARTICLES_START_EMERGING`
  );
  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   ConsciousnessTheater.jsx
   - Wait for ENGINE_VIEWPORT_HINT before director.start()
   - Ensure single viewportReadyRef and clean cleanup
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;

  // dedupe viewportReadyRef
  t = t.replace(/\n\s*const\s+viewportReadyRef\s*=\s*useRef\(\s*false\s*\);\s*/g, '\n');
  // ensure one declaration after directorStartedRef
  if (!/viewportReadyRef\s*=\s*useRef\(\s*false\s*\)/.test(t)) {
    t = t.replace(
      /const\s+directorStartedRef\s*=\s*useRef\(false\);/,
      `const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);`
    );
  }

  // install hint listener + deferred start (if not present)
  if (!/ENGINE_VIEWPORT_HINT/.test(t) || !/setInterval\(/.test(t) || !/viewportReadyRef/.test(t)) {
    t = t.replace(
`  useEffect(() => {
    if (!directorStartedRef.current) {`,
`  useEffect(() => {
    if (!directorStartedRef.current) {
      const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
        viewportReadyRef.current = true;
      });
      const tick = setInterval(() => {
        if (!directorStartedRef.current && viewportReadyRef.current) {
          document.body.style.overflow = 'hidden';
          director.start();
          directorStartedRef.current = true;
          clearInterval(tick);
          offHint && offHint();
        }
      }, 50);`
    );
    // cleanup adds viewport reset
    t = t.replace(
`    return () => {
      offs.forEach(off => off && off());
      document.body.style.overflow = '';
      director.cancel();
      directorStartedRef.current = false;
    };`,
`    return () => {
      offs.forEach(off => off && off());
      document.body.style.overflow = '';
      director.cancel();
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };`
    );
  }
  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   ConsciousnessEngine.js
   - Dedup opening flags in constructor
   - Gate non-genesis in buildAndEmitBlueprint + in STAGE_CHANGE
   - Single emergence per opening (count fence)
   - Ensure ENABLE_SCROLL resets opening flags
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/engine/ConsciousnessEngine.js', (s) => {
  let t = s;

  // remove duplicated opening flags
  t = t.replace(
    /(if\s*\(this\._openingPhase[\s\S]*?\)\s*;\s*){2,}/g,
    (m)=> m.split('\n').slice(0,5).join('\n')+'\n'  // keep only first block-ish
  );

  // ensure one clean block after currentQuality
  t = t.replace(
    /(this\.currentQuality\s*=\s*'HIGH';)(?![\s\S]*?\/\/ Opening gates)/,
    `$1
    // Opening gates / fences
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;`
  );

  // ENABLE_SCROLL closes gate
  if (!/ENABLE_SCROLL[\s\S]*_openingPhase\s*=\s*false/.test(t)) {
    t = t.replace(/initializeBeatBusListeners\(\)\s*\{\s*/m, `initializeBeatBusListeners() {
    BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      this._openingPhase = false;
      this._openingEpoch += 1;
      this._emergenceCount = 0;
    });
`);
  }

  // STAGE_CHANGE gate (keep existing log)
  if (!/if\s*\(this\._openingPhase\s*&&\s*stage\s*!==\s*'genesis'\)/.test(t)) {
    t = t.replace(
      /BeatBus\.on\(EVENTS\.STAGE_CHANGE,[\s\S]*?\{\s*const stage[\s\S]*?\{[\s\S]*?\}\);\s*\n/m,
      (m)=> m.replace(
        /console\.log\(`🧠 Engine: Stage -> \${stage}`\);/,
        `if (this._openingPhase && stage !== 'genesis') { console.log(\`🧠 Engine: Blocking \${stage} during opening\`); return; }\n      console.log(\`🧠 Engine: Stage -> \${stage}\`);`
      )
    );
  }

  // Add direct gate at top of buildAndEmitBlueprint
  if (!/buildAndEmitBlueprint\(stage, quality\)\s*\{\s*if\s*\(this\._openingPhase\s*&&\s*stage\s*!==\s*'genesis'\)/.test(t)) {
    t = t.replace(
      /buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*\)\s*\{\s*/,
      `buildAndEmitBlueprint(stage, quality) {
    if (this._openingPhase && stage !== 'genesis') {
      console.warn('🧠 Engine: blocked non-genesis during opening:', stage);
      return;
    }
`
    );
  }

  // Single emergence per opening (fence)
  if (/BUILD_EMERGENCE_BLUEPRINT/.test(t) && !/_emergenceCount/.test(t)) {
    t = t.replace(
      /BeatBus\.on\(EVENTS\.BUILD_EMERGENCE_BLUEPRINT,[\s\S]*?\(\s*opts\s*=\s*\{\}\)\s*=>\s*\{/,
      `BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      if (this._openingPhase && this._emergenceCount > 0) {
        console.warn('🧠 Engine: emergence already built this opening; ignoring duplicate');
        return;
      }
      this._emergenceCount += 1;`
    );
  }

  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   WebGLBackground.jsx
   - Guards: ignore pre-scroll non-genesis full, ignore late emergences
   - Micro-burst on emergence bind
   - No easing-time emission
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/webgl/WebGLBackground.jsx', (s) => {
  let t = s;

  // ensure bus path
  t = t.replace(
    /from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"];/,
    `from '@/theater/bus';`
  );

  // remove emission during easing if present
  t = t.replace(
    /if\s*\(\s*k\s*>=\s*0\.5[\s\S]*?EVENTS\.PARTICLES_EMERGED[\s\S]*?}\s*\n\s*\n?/m,
    ''
  );

  // insert guards after isEmergence calc
  if (!/Renderer:\s*ignoring pre-scroll full/.test(t)) {
    t = t.replace(
      /(const\s+isEmergence\s*=\s*mode\s*===\s*'emergence'[\s\S]*?;)/,
      `$1

      if (!isEmergence && emergencePendingRef.current) {
        if ((raw.stageName || st) !== 'genesis') {
          console.warn('🖼️ Renderer: ignoring pre-scroll full for stage=', raw.stageName || st);
          return;
        }
      }

      if (isEmergence && emittedEmergedRef.current) {
        console.warn('🖼️ Renderer: ignoring late emergence after handoff');
        return;
      }`
    );
  }

  // add micro-burst & ensure flag on emergence
  if (!/HOTDORS_MICRO_BURST/.test(t)) {
    t = t.replace(
      /if\s*\(isEmergence\)\s*\{\s*console\.log\([\s\S]*?quality=\$\{quality\}\`\);\s*/,
      (m)=> m + `
        // HOTDORS_MICRO_BURST: drive morph 0→1 to show the explosion
        try {
          const start = performance.now(); const dur = 700;
          const burst = (t0)=>{ const k = Math.min(1, (t0 - start)/dur); const v = k*k*(3-2*k);
            fallbackMorphRef.current = v; __applyMorph(v); if (k<1) requestAnimationFrame(burst); };
          requestAnimationFrame(burst);
        } catch {}
        emergencePendingRef.current = true;
`
    );
  }

  return t;
});

/* ────────────────────────────────────────────────────────────────────────── */
