// Instructions for patching WebGLBackground.jsx

console.log(`
MANUAL CHANGES NEEDED in src/components/webgl/WebGLBackground.jsx:

1. Around line 260-280, find the section that scales emergence positions.
   REMOVE or comment out these lines:
   
   // REMOVE THIS SCALING:
   for (let i = 0; i < bp.atmosphericPositions.length; i += 3) {
     bp.atmosphericPositions[i + 0] *= textScale * 1.5;
     bp.atmosphericPositions[i + 1] *= textScale;
     bp.atmosphericPositions[i + 2] *= 0.5;
   }
   
   // REPLACE WITH:
   // Don't scale - use positions as generated

2. Make sure the points element has no constraining scale:
   
   <points
     ref={meshRef}
     geometry={geometry}
     material={material}
     frustumCulled={false}
     scale={[1, 1, 1]}  // Ensure this is [1, 1, 1]
   />

3. In the material uniforms, ensure point size is reasonable:
   
   uPointSize: { value: 24.0 },  // Not too large, not too small
`);
