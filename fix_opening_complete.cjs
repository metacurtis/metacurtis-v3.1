const fs = require('fs');

console.log('🔧 Fixing opening sequence issues...\n');

// ============================================
// 1. FIX CONSCIOUSNESS ENGINE
// ============================================
console.log('1. Fixing ConsciousnessEngine.js...');
let engine = fs.readFileSync('src/engine/ConsciousnessEngine.js', 'utf8');

// Replace the emergence blueprint to start LARGE
const emergenceFunction = `buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
    console.log(\`💥 BigBang emergence: "\${text}" with \${count} particles\`);
    const { width: vw, height: vh } = this._viewportHint || { width: 120, height: 90 };

    const atmosphericPositions = new Float32Array(count * 3);
    const text3DPositions = new Float32Array(count * 3);
    const sizeMultipliers = new Float32Array(count);
    const opacityData = new Float32Array(count);
    const atlasIndices = new Float32Array(count);
    const tierData = new Float32Array(count);
    const animationSeeds = new Float32Array(count * 3);

    // START BIG - particles fill 75% of viewport immediately
    const startRadius = Math.min(vw, vh) * 0.75;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * startRadius;
      const z = (Math.random() - 0.5) * 40;
      
      atmosphericPositions[j+0] = Math.cos(angle) * r;
      atmosphericPositions[j+1] = Math.sin(angle) * r;
      atmosphericPositions[j+2] = z;
    }

    // TARGET - slightly contracted but still chaotic
    const targetRadius = Math.min(vw, vh) * 0.6;
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      // Different random pattern creates swirling motion
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * targetRadius;
      const z = (Math.random() - 0.5) * 30;
      
      text3DPositions[j+0] = Math.cos(angle) * r;
      text3DPositions[j+1] = Math.sin(angle) * r;
      text3DPositions[j+2] = z;
    }

    // Visual properties for dramatic effect
    for (let i = 0; i < count; i++) {
      const j = i * 3;
      tierData[i] = Math.floor(Math.random() * 4);
      sizeMultipliers[i] = 0.5 + Math.random() * 1.5;
      opacityData[i] = 0.5 + Math.random() * 0.5;
      atlasIndices[i] = Math.floor(Math.random() * 8);
      animationSeeds[j+0] = Math.random();
      animationSeeds[j+1] = Math.random();
      animationSeeds[j+2] = Math.random();
    }

    return {
      id: 'emergence-genesis',
      mode: 'emergence',
      stageName: 'genesis',
      count,
      particleCount: count,
      maxParticles: count,
      activeCount: count,
      atmosphericPositions,
      text3DPositions,
      animationSeeds,
      sizeMultipliers,
      opacityData,
      atlasIndices,
      tierData,
      metadata: { sourceText: text, viewport: this._viewportHint }
    };
  }`;

// Replace the buildEmergenceBlueprint function
engine = engine.replace(
  /buildEmergenceBlueprint\([^{]*\{[\s\S]*?^\s{2}\}/m,
  emergenceFunction
);

// Add HARD lock for stage changes during opening
engine = engine.replace(
  /BeatBus\.on\(EVENTS\.STAGE_CHANGE[\s\S]*?\}\);/,
  `BeatBus.on(EVENTS.STAGE_CHANGE, (payload = {}) => {
      const stage = payload.stage ?? payload.to;
      if (!stage) return;
      
      // HARD BLOCK during opening - no exceptions
      if (this._openingPhase) {
        console.log(\`�� Engine: BLOCKED stage change to \${stage} - opening in progress\`);
        return;
      }
      
      console.log(\`🧠 Engine: Stage -> \${stage}\`);
      this.currentStage = stage;
      this.buildAndEmitBlueprint(stage, this.currentQuality);
    });`
);

// Clean up duplicate flags
engine = engine.replace(
  /if \(this\._openingPhase === undefined\)[\s\S]*?this\._emergenceCount[^;]*;\s*/g,
  ''
);

// Add clean initialization
engine = engine.replace(
  /this\.currentQuality = 'HIGH';/,
  `this.currentQuality = 'HIGH';
    
    // Opening control flags
    this._openingPhase = true;
    this._openingEpoch = 0;
    this._emergenceCount = 0;`
);

fs.writeFileSync('src/engine/ConsciousnessEngine.js', engine);
console.log('✅ Engine fixed: Large start, hard lock on stages\n');

// ============================================
// 2. FIX WEBGL BACKGROUND - GEOMETRY DISPOSAL
// ============================================
console.log('2. Fixing WebGLBackground.jsx...');
let renderer = fs.readFileSync('src/components/webgl/WebGLBackground.jsx', 'utf8');

// Add proper disposal in geometry creation
renderer = renderer.replace(
  /if \(geometryRef\.current\) geometryRef\.current\.dispose\(\);/g,
  `if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = null;
    }`
);

// Ensure PARTICLES_EMERGED fires correctly
if (!renderer.includes('setTimeout(() => {')) {
  renderer = renderer.replace(
    /emergencePendingRef\.current = true;.*?\/\/ Set the flag for emergence/,
    `emergencePendingRef.current = true;
        
        // Emit PARTICLES_EMERGED after emergence binds
        setTimeout(() => {
          if (emergencePendingRef.current && !emittedEmergedRef.current) {
            BeatBus.emit(EVENTS.PARTICLES_EMERGED);
            emittedEmergedRef.current = true;
            emergencePendingRef.current = false;
            console.log('🎯 Renderer: PARTICLES_EMERGED emitted');
          }
        }, 800);`
  );
}

fs.writeFileSync('src/components/webgl/WebGLBackground.jsx', renderer);
console.log('✅ Renderer fixed: Proper disposal, emergence event\n');

// ============================================
// 3. FIX CONSCIOUSNESS THEATER - PREVENT STAGE JUMPS
// ============================================
console.log('3. Fixing ConsciousnessTheater.jsx...');
let theater = fs.readFileSync('src/components/consciousness/ConsciousnessTheater.jsx', 'utf8');

// Block scroll-based stage changes until initialized
theater = theater.replace(
  /const handleScroll = \(\) => \{/g,
  `const handleScroll = () => {
      if (!isInitialized) return; // Block during opening`
);

fs.writeFileSync('src/components/consciousness/ConsciousnessTheater.jsx', theater);
console.log('✅ Theater fixed: No stage changes during opening\n');

console.log('🎉 ALL FIXES APPLIED!\n');
console.log('Expected behavior:');
console.log('1. Particles start LARGE filling viewport');
console.log('2. Swirl chaotically (different random patterns)');
console.log('3. No stage changes during opening');
console.log('4. Proper geometry disposal (no memory leaks)');
console.log('\nRestart your dev server to see the changes.');
