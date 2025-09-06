#!/usr/bin/env node
import fs from 'node:fs';

function patchFile(path, mut) {
  if (!fs.existsSync(path)) { console.error('❌ Missing', path); process.exitCode = 1; return; }
  const src = fs.readFileSync(path, 'utf8');
  const out = mut(src);
  if (out !== src) {
    fs.writeFileSync(path + `.bak.bigbang-${Date.now()}`, src, 'utf8');
    fs.writeFileSync(path, out, 'utf8');
    console.log('✓ Patched', path);
  } else {
    console.log('• No changes needed in', path);
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   1) EVENTS — add new signals used by the timeline
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/theater/events.js', (s) => {
  let t = s;
  if (!/BEGIN_COALESCENCE/.test(t)) {
    t = t.replace(
      /START_NARRATIVE:\s*'START_NARRATIVE',/,
      `START_NARRATIVE: 'START_NARRATIVE',
  BEGIN_COALESCENCE: 'BEGIN_COALESCENCE',
  MORPH_TO_BEATGLYPH: 'MORPH_TO_BEATGLYPH',
  CHAOS_SET: 'CHAOS_SET',`
    );
  }
  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   2) OpeningSequence — single bus & remove CTF fade
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/theater/OpeningSequence.jsx', (s) => {
  let t = s;

  // use the single bus
  t = t.replace(
    /from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"];/,
    `from '@/theater/bus';`
  );

  // remove entire CTF_BUILD fade block if present
  t = t.replace(
    /\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
    `BeatBus.on(EVENTS.PARTICLES_START_EMERGING`
  );

  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   3) ConsciousnessTheater — wait for viewport hint before director.start()
   (dedupe the ref and add the deferred start gate)
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/consciousness/ConsciousnessTheater.jsx', (s) => {
  let t = s;

  // de-dup
  t = t.replace(/\n\s*const\s+viewportReadyRef\s*=\s*useRef\(\s*false\s*\);\s*/g, '\n');

  // ensure one declaration
  if (!/viewportReadyRef\s*=\s*useRef\(\s*false\s*\)/.test(t)) {
    t = t.replace(
      /const\s+directorStartedRef\s*=\s*useRef\(false\);/,
      `const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);`
    );
  }

  // install viewport hint listener + deferred start
  if (!/ENGINE_VIEWPORT_HINT/.test(t) || !/setInterval\(/.test(t)) {
    t = t.replace(
`  useEffect(() => {
    if (!directorStartedRef.current) {`,
`  useEffect(() => {
    if (!directorStartedRef.current) {
      const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => { viewportReadyRef.current = true; });
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
   4) Engine — Big Bang emergence + BeatGlyph reveal + opening gate
   - buildEmergenceBlueprint: SOURCE gas cloud, TARGET swirl
   - add buildBeatGlyphBlueprint (constellation → glyph)
   - gate non-genesis in buildAndEmitBlueprint
   - single-emergence per opening; reset on ENABLE_SCROLL
   - handle MORPH_TO_BEATGLYPH
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/engine/ConsciousnessEngine.js', (s) => {
  let t = s;

  // ensure opening flags only once after currentQuality
  t = t.replace(
    /(this\.currentQuality\s*=\s*'HIGH';)(?![\s\S]*?\/\/ Opening gates)/,
    `$1
    // Opening gates / fences
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;`
  );
  // remove accidental duplicates
  t = t.replace(
    /(if\s*\(this\._openingPhase[\s\S]*?\)\s*;\s*){2,}/g,
    (m)=> m.split('\n').slice(0,5).join('\n')+'\n'
  );

  // ENABLE_SCROLL closes gate & resets
  if (!/ENABLE_SCROLL[\s\S]*_openingPhase\s*=\s*false/.test(t)) {
    t = t.replace(/initializeBeatBusListeners\(\)\s*\{\s*/m, `initializeBeatBusListeners() {
    BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      this._openingPhase = false;
      this._openingEpoch += 1;
      this._emergenceCount = 0;
    });
`);
  }

  // STAGE_CHANGE gate (keep log)
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

  // Single-emergence per opening
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

  // Replace emergence builder to BigBang: SOURCE=gas cloud; TARGET=swirl
  if (!/gas cloud/.test(t)) {
    t = t.replace(
      /buildEmergenceBlueprint\(\{\s*text\s*=\s*'HELLO CURTIS'[\s\S]*?return\s*\{[\s\S]*?}\s*;\s*}\s*/m,
      `buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
    console.log(\`🌟 BigBang emergence: "\${text}" with \${count} particles\`);
    const { width: vw, height: vh } = this._viewportHint || { width:120, height:90 };

    const atmosphericPositions = new Float32Array(count * 3); // SOURCE = gas cloud
    const text3DPositions      = new Float32Array(count * 3); // TARGET = swirl

    const sizeMultipliers      = new Float32Array(count);
    const opacityData          = new Float32Array(count);
    const atlasIndices         = new Float32Array(count);
    const tierData             = new Float32Array(count);
    const animationSeeds       = new Float32Array(count * 3);

    const gasRadius = Math.min(vw, vh) * 0.35;
    for (let i=0;i<count;i++){
      const j=i*3;
      const ang = Math.random() * Math.PI * 2;
      const r   = Math.random() * gasRadius;
      atmosphericPositions[j+0] = Math.cos(ang) * r;
      atmosphericPositions[j+1] = Math.sin(ang) * r;
      atmosphericPositions[j+2] = (Math.random()-0.5) * 20.0;
    }

    const swirlRadius = Math.min(vw, vh) * 0.40;
    for (let i=0;i<count;i++){
      const j=i*3, t = i / count;
      const ang = t * Math.PI * 8.0; // multi-rotations
      const r   = t * swirlRadius;
      text3DPositions[j+0] = Math.cos(ang) * r;
      text3DPositions[j+1] = Math.sin(ang) * r;
      text3DPositions[j+2] = Math.sin(ang * 2.0) * 10.0;
    }

    for (let i=0;i<count;i++){
      const j=i*3;
      const t=(tierData[i]=Math.floor(Math.random()*4))|0;
      sizeMultipliers[i]=0.5+Math.random()*1.5;
      opacityData[i]=0.3+Math.random()*0.7;
      atlasIndices[i]=Math.floor(Math.random()*8);
      animationSeeds[j+0]=Math.random(); animationSeeds[j+1]=Math.random(); animationSeeds[j+2]=Math.random();
    }

    return {
      id:'emergence-genesis',
      mode:'emergence',
      stageName:'genesis',
      count, particleCount:count, maxParticles:count, activeCount:count,
      atmosphericPositions, text3DPositions, animationSeeds,
      sizeMultipliers, opacityData, atlasIndices, tierData,
      metadata:{ sourceText:text, viewport:this._viewportHint }
    };
  }`
    );
  }

  // Add BeatGlyph blueprint builder and listener
  if (!/buildBeatGlyphBlueprint/.test(t)) {
    t = t.replace(
      /initializeBeatBusListeners\(\)\s*\{[\s\S]*?\}\s*$/,
      (m) => m.replace(/\}\s*$/, `
    // BeatGlyph reveal → build constellation→glyph blueprint
    BeatBus.on(EVENTS.MORPH_TO_BEATGLYPH, (opts={})=>{
      const text = opts.text || 'HELLO CURTIS';
      const stage = 'genesis';
      const quality = this.currentQuality || 'HIGH';
      const baseCount = 2000;
      const particleCount = this.getParticleCountForQuality ? this.getParticleCountForQuality(baseCount, quality) : baseCount;
      const view = this._viewportHint || { width:120, height:90 };
      const tierRatios = [0.50,0.20,0.15,0.15];

      // SOURCE = viewport constellation
      const atmos = this.generateConstellationFormation(particleCount, tierRatios, view);
      // TARGET = BeatGlyph text (modern spacing via existing text formation)
      const target = this.generate3DTextFormation ? this.generate3DTextFormation(text, particleCount) : this.textToParticlePositions(text, particleCount);

      const bp = {
        stageName: stage,
        count: particleCount, particleCount, maxParticles: particleCount, activeCount: particleCount,
        atmosphericPositions: atmos,
        text3DPositions: target,
        animationSeeds: new Float32Array(particleCount*3),
        metadata: { reveal: 'beatglyph', text }
      };

      BeatBus.emit(EVENTS.BLUEPRINT_READY, { blueprint: bp, stage, quality, cached:false, mode:'beatglyph' });
    });

  }`)
    );
  }

  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   5) Director — BigBang timeline (gas cloud → swirl → coalesce → settle → BeatGlyph)
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/theater/TheaterDirector.js', (s) => {
  let t = s;

  // swap order so fade starts essentially simultaneously
  t = t.replace(
    /BeatBus\.emit\(EVENTS\.BUILD_EMERGENCE_BLUEPRINT[\s\S]*?count:\s*2000\s*\}\);\s*\n\s*BeatBus\.emit\(EVENTS\.PARTICLES_START_EMERGING\);/m,
    `BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);
      BeatBus.emit(EVENTS.BUILD_EMERGENCE_BLUEPRINT, { sourceText: "HELLO CURTIS", count: 2000 });`
  );

  // Insert BigBang chaos → coalescence → settle → BeatGlyph
  if (!/💥 Phase: Big Bang emergence/.test(t)) {
    t = t.replace(
      /console\.log\("   Phase: Particle emergence"\);/,
      `console.log("💥 Phase: Big Bang emergence");`
    );
  }

  // After PARTICLES_START_EMERGING, let chaos run, then coalesce morph 0.5, then 1.0
  if (!/BEGIN_COALESCENCE/.test(t)) {
    t = t.replace(
      /BeatBus\.emit\(EVENTS\.PARTICLES_START_EMERGING\);\s*\n\s*await this\.once\(EVENTS\.PARTICLES_EMERGED[\s\S]*?;/m,
      `BeatBus.emit(EVENTS.PARTICLES_START_EMERGING);

      // Chaos swirl (~1.5s)
      await this.sleep(1500);

      // Begin coalescence (partial morph)
      BeatBus.emit(EVENTS.BEGIN_COALESCENCE);
      BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0.0 });
      await this._easeMorphTo(0.5, 1500);

      // Final settle to constellation
      await this._easeMorphTo(1.0, 1000);

      // Now wait for fencepost from renderer (first full bind may have occurred already)
      await this.once(EVENTS.PARTICLES_EMERGED, 3000);`
    );
  }

  // After narration starts, schedule BeatGlyph reveal ~30s later
  if (!/MORPH_TO_BEATGLYPH/.test(t)) {
    t = t.replace(
      /BeatBus\.emit\(EVENTS\.START_NARRATIVE[\s\S]*?;\s*\n\s*\/\/ Ensure we start at top/m,
      `BeatBus.emit(EVENTS.START_NARRATIVE, { stage: "genesis" });

      // Schedule BeatGlyph reveal (~30s into genesis)
      setTimeout(() => {
        BeatBus.emit(EVENTS.MORPH_TO_BEATGLYPH, { text: "HELLO CURTIS" });
        // drive morph 0→1 into glyph
        BeatBus.emit(EVENTS.MORPH_PROGRESS, { value: 0 });
        this._easeMorphTo(1, 1500);
      }, 30000);

      // Ensure we start at top`
    );
  }

  return t;
});

/* ──────────────────────────────────────────────────────────────────────────
   6) WebGLBackground — renderer guards + micro-burst (already included above)
   Also ensure single-bus path; leave shader unchanged (chaos via rotation)
   ────────────────────────────────────────────────────────────────────────── */
patchFile('src/components/webgl/WebGLBackground.jsx', (s) => {
  let t = s;

  // bus path
  t = t.replace(
    /from ['"]@\/modules\/orchestration\/core\/BeatBus\.js['"];/,
    `from '@/theater/bus';`
  );

  // micro-burst and guards already added in previous patch section; no extra here

  // Add a light "chaos swirl" at mesh level for dramatic feel (if not present)
  if (!/CHAOS SWIRL/.test(t)) {
    t = t.replace(
      /useFrame\(\(state\) => \{\s*const mat = materialRef\.current;[\s\S]*?if\s*\(!meshRef\.current\s*\|\|\s*!mat\s*\|\|\s*!blueprint\)\s*return;/m,
      (m)=> m + `

    // CHAOS SWIRL: small mesh rotation during opening for additional drama
    if (emergencePendingRef.current && !emittedEmergedRef.current && meshRef.current) {
      const chaosT = Math.min(1, (state.clock.elapsedTime % 1.5) / 1.5);
      meshRef.current.rotation.z += 0.004 + 0.003 * Math.sin(state.clock.elapsedTime*1.7);
      meshRef.current.rotation.x += 0.0015 * Math.cos(state.clock.elapsedTime*1.1);
      meshRef.current.rotation.y += 0.0010 * Math.sin(state.clock.elapsedTime*1.3);
    }`
    );
  }

  return t;
});
