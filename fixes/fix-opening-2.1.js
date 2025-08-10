// fixes/fix-opening-2.1.js
// MetaCurtis SST v3.0 — Opening polish (fade + emergence scale + shader uniform alignment)

export default {
  name: 'Opening polish (fade + emergence + shader alignment)',
  version: '2.1',
  description:
    'Keeps OpeningSequence mounted to allow fade, enlarges emergence text positions, and aligns renderer uniforms with shaders.',

  fixes: [
    // 1) OpeningSequence: keep mounted (so opacity transition actually fades)
    {
      file: 'src/components/theater/OpeningSequence.jsx',
      description: 'Do not unmount on !visible; let CSS opacity animate.',
      fixes: [
        {
          find: `if (phase === 'complete' || !visible) {`,
          replace: `if (phase === 'complete') {`,
        },
      ],
    },
    // 1b) OpeningSequence: add a class for optional external fades/debugging
    {
      file: 'src/components/theater/OpeningSequence.jsx',
      description: 'Add className to root div for debug / styling hooks.',
      fixes: [
        {
          find: `return (\n    <div\n      style={{`,
          replace: `return (\n    <div className="opening-sequence"\n      style={{`,
        },
      ],
    },

    // 2) Director: black screen really 2s (not 3s)
    {
      file: 'src/theater/TheaterDirector.js',
      description: 'Set black phase to 2 seconds as per SST v3.0.',
      fixes: [
        {
          find: `console.log('   Phase: Black screen (2s)');\n      await this.sleep(3000);`,
          replace: `console.log('   Phase: Black screen (2s)');\n      await this.sleep(2000);`,
        },
      ],
    },
    // (optional) give typing a touch more breathing room
    {
      file: 'src/theater/TheaterDirector.js',
      description: 'Slightly longer wait after typing so it feels sequential.',
      fixes: [
        {
          find: `// Emit key clicks during typing\n      for (let i = 0; i < 4; i++) {\n        await this.sleep(500);\n        BeatBus.emit(EVENTS.AUDIO_KEY_CLICK);\n      }\n      \n      await this.sleep(3000);`,
          replace: `// Emit key clicks during typing\n      for (let i = 0; i < 4; i++) {\n        await this.sleep(500);\n        BeatBus.emit(EVENTS.AUDIO_KEY_CLICK);\n      }\n      \n      await this.sleep(3800);`,
        },
      ],
    },

    // 3) Emergence positions: make the text shape big enough to see
    {
      file: 'src/engine/ConsciousnessEngine.js',
      description: 'Scale text-to-particle positions so emergence fills screen.',
      fixes: [
        {
          find: `const charWidth = 1.2;`,
          replace: `const charWidth = 8.0; // enlarged for emergence visibility`,
        },
        {
          find: `const textHeight = 2.0;`,
          replace: `const textHeight = 10.0; // taller for emergence`,
        },
        {
          find: `const z = (Math.random() - 0.5) * 0.5; // Slight depth`,
          replace: `const z = (Math.random() - 0.5) * 2.0; // More depth so highlights pop`,
        },
      ],
    },

    // 4) WebGLBackground: add uniforms shaders actually read (uStageProgress/uStageBlend/uTierCutoff)
    {
      file: 'src/components/webgl/WebGLBackground.jsx',
      description: 'Insert missing shader uniforms into material.',
      fixes: [
        {
          find: `uniforms: {`,
          replace: `uniforms: { uStageProgress: { value: 0 }, uStageBlend: { value: 0 }, uTierCutoff: { value: 1e9 },`,
        },
      ],
    },
    // 4b) WebGLBackground: drive those uniforms every frame
    {
      file: 'src/components/webgl/WebGLBackground.jsx',
      description: 'Update stage/blend/cutoff uniforms in RAF.',
      fixes: [
        {
          find: `mat.uniforms.uTime.value = state.clock.elapsedTime;`,
          replace: `mat.uniforms.uTime.value = state.clock.elapsedTime;
    // sync shader-expected names
    if (mat.uniforms.uStageProgress) mat.uniforms.uStageProgress.value = morphProgress;
    if (mat.uniforms.uStageBlend)    mat.uniforms.uStageBlend.value    = scrollProgress;
    if (mat.uniforms.uTierCutoff)    mat.uniforms.uTierCutoff.value    = activeCount;`,
        },
      ],
    },
  ],

  postApply: async () => {
    console.log('✅ Applied: Opening polish 2.1');
    console.log('• OpeningSequence stays mounted to fade out smoothly.');
    console.log('• Emergence text scaled to fill frame.');
    console.log('• Renderer ↔ shader uniforms aligned (uStageProgress/uStageBlend/uTierCutoff).');
    console.log('Tip: If you still see a thin black band, ensure your <Canvas> is full-viewport.');
  },
};
