#!/usr/bin/env node
import fs from 'node:fs';

// Small helper
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

// 1) ConsciousnessTheater.jsx — wait for viewport hint before director.start()
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;
  // add viewportReadyRef
  t = t.replace(
    /const\s+directorStartedRef\s*=\s*useRef\(false\);/,
    `const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);`
  );

  // install hint listener + deferred start if block not present
  if (!/ENGINE_VIEWPORT_HINT/.test(t) || !/setInterval\(/.test(t)) {
    t = t.replace(
`  useEffect(() => {
    if (!directorStartedRef.current) {`,
`  useEffect(() => {
    if (!directorStartedRef.current) {
      const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { viewportReadyRef.current = true; });
      const tick = setInterval(() => {
        if (!directorStartedRef.current && viewportReadyRef.current) {
          document.body.style.overflow = 'hidden'; // lock scroll until ENABLE_SCROLL
          director.start();
          directorStartedRef.current = true;
          clearInterval(tick);
          offHint && offHint();
        }
      }, 50);`
    );
    // cleanup: also reset viewportReadyRef
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

// 2) Engine — gate opening + single emergence per opening
patchFile('src/engine/ConsciousnessEngine.js', (s) => {
  let t = s;

  // constructor: add fields
  t = t.replace(
    /(constructor\(\)\s*\{[\s\S]*?this\.currentQuality\s*=\s*'HIGH';)/,
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

  // block non-genesis during opening
  if (!/if\s*\(this\._openingPhase\s*&&\s*stage\s*!==\s*'genesis'\)/.test(t)) {
    t = t.replace(
      /BeatBus\.on\(EVENTS\.STAGE_CHANGE,[\s\S]*?\{\s*const stage[\s\S]*?\{[\s\S]*?\}\);\s*\n/m,
      (m) => m.replace(
        /console\.log\(`🧠 Engine: Stage -> \${stage}`\);/,
        `if (this._openingPhase && stage !== 'genesis') { return; }\n      console.log(\`🧠 Engine: Stage -> \${stage}\`);`
      )
    );
  }

  // single emergence per opening
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

// 3) Renderer — guards + micro-burst so explosion is visible
patchFile('src/components/webgl/WebGLBackground.jsx', (s) => {
  let t = s;

  // remove any easing-time emission if present
  t = t.replace(
    /if\s*\(\s*k\s*>=\s*0\.5[\s\S]*?EVENTS\.PARTICLES_EMERGED[\s\S]*?}\s*\n\s*\n?/m,
    ''
  );

  // insert guards after isEmergence
  if (!/Renderer:\s*ignoring pre-scroll full/.test(t)) {
    t = t.replace(
      /(const\s+isEmergence\s*=\s*mode\s*===\s*'emergence'[\s\S]*?;)/,
      `$1

      // Ignore any non-genesis full arriving while emergence pending
      if (!isEmergence && emergencePendingRef.current) {
        if ((raw.stageName || st) !== 'genesis') {
          console.warn('🖼️ Renderer: ignoring pre-scroll full for stage=', raw.stageName || st);
          return;
        }
      }

      // Ignore any late emergence after we've already handed off
      if (isEmergence && emittedEmergedRef.current) {
        console.warn('🖼️ Renderer: ignoring late emergence after handoff');
        return;
      }`
    );
  }

  // add micro-burst when emergence binds (drive morph 0→1 rapidly)
  if (!/HOTDORS_MICRO_BURST/.test(t)) {
    t = t.replace(
      /if\s*\(isEmergence\)\s*\{\s*console\.log\([\s\S]*?quality=\$\{quality\}\`\);\s*/,
      (m)=> m + `
        // HOTDORS_MICRO_BURST: ensure visible viewport explosion
        try {
          const start = performance.now(); const dur = 700;
          const burst = (t0)=>{ const k = Math.min(1, (t0 - start)/dur); const v = k*k*(3-2*k);
            fallbackMorphRef.current = v; __applyMorph(v); if (k<1) requestAnimationFrame(burst); };
          requestAnimationFrame(burst);
        } catch {}
`
    );
  }

  return t;
});

// 4) Director — ensure we wait only for PARTICLES_EMERGED fencepost
patchFile('src/theater/TheaterDirector.js', (s) => {
  let t = s;
  t = t.replace(/await\s+this\.once\s*\(\s*EVENTS\.BLUEPRINT_READY[^;]*;?/g, '// removed BLUEPRINT_READY wait');
  if (!/await\s+this\.once\s*\(\s*EVENTS\.PARTICLES_EMERGED/.test(t)) {
    t = t.replace(
      /(BeatBus\.emit\(EVENTS\.BUILD_EMERGENCE_BLUEPRINT[\s\S]*?\);\s*)\n\s*BeatBus\.emit\(EVENTS\.PARTICLES_START_EMERGING\);[\s\S]*?BeatBus\.emit\(EVENTS\.STAGE_CHANGE/m,
      (m, head) => `${head}
      BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      await this.once(EVENTS.PARTICLES_EMERGED, 3000);

      BeatBus.emit(EVENTS.STAGE_CHANGE`
    );
  }
  return t;
});

