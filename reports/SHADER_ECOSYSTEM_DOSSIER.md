# Shader Ecosystem Dossier
Generated: 2025-10-23T05:29:12.803Z
Source artifacts: shader-motion-audit.json, shader-motion-audit.md, shader-audit.json, shader-audit.md

## Quick Metrics
- Morph-unsafe blocks flagged: 0
- Grid mode without spacing (local findings): 0
- Grid behavior declared in SST: YES
- Global grid spacing missing: YES
- Total GLSL uniforms enumerated: 29
- Total JS uniform set sites: 44
- Total ShaderMaterial constructions detected: 2
- Total onBeforeCompile hooks detected: 1

## Morph Branches That Need Taper
- No morph-unsafe branches detected.
- Guardrail 1: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 2: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 3: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 4: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 5: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 6: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 7: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 8: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 9: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 10: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 11: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.
- Guardrail 12: Confirm each mode multiplies offsets by a morph-dependent gain to preserve formations.

## Grid Mode Sites Requiring Spacing Checks
- No explicit uMotionMode=1 assignments located.
- Action: ensure runtime tier behavior dispatcher applies uGridSpacing when resolving grid behaviors.

## Global Grid Intent Summary
- SST indicates grid behavior: Yes
- Grid spacing detected anywhere in JS: No
- ❗ ACTION: Add explicit uGridSpacing assignments where grid behaviors are expected.

## Uniform Interface Inventory (GLSL → JS)
- GLSL uniform `uActiveCount`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:10
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1347
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1439
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1735

- GLSL uniform `uAtlasTexture`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:4
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1321

- GLSL uniform `uAtmoFit`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:23
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uBandFade`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:14
  - Set in JS at src/components/webgl/WebGLBackground.jsx:466
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1068

- GLSL uniform `uBandHeight`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:13
  - Set in JS at src/components/webgl/WebGLBackground.jsx:505
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1338

- GLSL uniform `uColorAccent1`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:8
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1344

- GLSL uniform `uColorAccent2`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:9
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1345

- GLSL uniform `uColorCurrent`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:6
  - Declared at src/shaders/templates/consciousness-vertex.glsl:18
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1342

- GLSL uniform `uColorNext`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:7
  - Declared at src/shaders/templates/consciousness-vertex.glsl:19
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1343

- GLSL uniform `uDevicePixelRatio`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:21
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1326
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1327

- GLSL uniform `uFadeProgress`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:11
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uFlowTurbulence`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:33
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1643

- GLSL uniform `uGaussianSigma`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:12
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1784

- GLSL uniform `uGridSpacing`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:32
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uMorphProgress`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:15
  - Set in JS at src/components/webgl/WebGLBackground.jsx:342
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1047
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1751

- GLSL uniform `uMorphType`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:29
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1790

- GLSL uniform `uMotionMode`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:30
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1600

- GLSL uniform `uMotionParams`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:31
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uMoveDampStart`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:25
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uMoveDampStartY`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:26
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uPointSize`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:17
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1324
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1781
  - Set in JS at src/runtime/materialFactory.js:53
  - Set in JS at src/runtime/materialFactory.js:54

- GLSL uniform `uPostMorphFreeze`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:27
  - Set in JS at src/components/webgl/WebGLBackground.jsx:349
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1764
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1793

- GLSL uniform `uResolution`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:22
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uScrollProgress`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:16
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1437

- GLSL uniform `uSpreadFactor`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:28
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1566
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1787

- GLSL uniform `uStreakIntensity`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:34
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1651

- GLSL uniform `uTextFit`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:24
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

- GLSL uniform `uTime`
  - Declared at src/shaders/templates/consciousness-fragment.glsl:5
  - Declared at src/shaders/templates/consciousness-vertex.glsl:14
  - Set in JS at src/components/webgl/WebGLBackground.jsx:1436

- GLSL uniform `uTotalSprites`
  - Declared at src/shaders/templates/consciousness-vertex.glsl:20
  - ⚠️ No JS setter discovered. Verify renderer assigns this uniform.

## Uniform Naming & Mismatch Warnings
### JS sets missing GLSL declaration
- Case 1: uStageProgress via src/components/webgl/WebGLBackground.jsx:344
- Case 2: uStageProgress via src/components/webgl/WebGLBackground.jsx:1048
- Case 3: shaderMorph via src/components/webgl/WebGLBackground.jsx:1201
- Case 4: uStageIndex via src/components/webgl/WebGLBackground.jsx:1322
- Case 5: uBrainRegion via src/components/webgl/WebGLBackground.jsx:1323
- Case 6: uTierCutoff via src/components/webgl/WebGLBackground.jsx:1348
- Case 7: uStageBlend via src/components/webgl/WebGLBackground.jsx:1438
- Case 8: uTierCutoff via src/components/webgl/WebGLBackground.jsx:1440
- Case 9: uTierCutoff via src/components/webgl/WebGLBackground.jsx:1736
- Case 10: uStageProgress via src/components/webgl/WebGLBackground.jsx:1752
- Case 11: uTierHighlight via src/runtime/materialFactory.js:59
### GLSL uniforms lacking JS setters
- Uniform 1: uFadeProgress
  - Declared at src/shaders/templates/consciousness-fragment.glsl:11
- Uniform 2: uTotalSprites
  - Declared at src/shaders/templates/consciousness-vertex.glsl:20
- Uniform 3: uResolution
  - Declared at src/shaders/templates/consciousness-vertex.glsl:22
- Uniform 4: uAtmoFit
  - Declared at src/shaders/templates/consciousness-vertex.glsl:23
- Uniform 5: uTextFit
  - Declared at src/shaders/templates/consciousness-vertex.glsl:24
- Uniform 6: uMoveDampStart
  - Declared at src/shaders/templates/consciousness-vertex.glsl:25
- Uniform 7: uMoveDampStartY
  - Declared at src/shaders/templates/consciousness-vertex.glsl:26
- Uniform 8: uMotionParams
  - Declared at src/shaders/templates/consciousness-vertex.glsl:31
- Uniform 9: uGridSpacing
  - Declared at src/shaders/templates/consciousness-vertex.glsl:32

## ShaderMaterial Construction Sites
- Material site 1: src/components/webgl/WebGLBackground.jsx:1260
```text
1258:     if (!mat) {
1259:       created = true;
1260:       mat = new THREE.ShaderMaterial({
1261:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1262:         uniforms: {
```
- Material site 2: src/runtime/materialFactory.js:27
```text
25:   }
26: 
27:   const mat = new THREE.ShaderMaterial({
28:     vertexShader,
29:     fragmentShader,
```

## onBeforeCompile Hooks
- Hook 1: src/components/webgl/WebGLBackground.jsx:1261
```text
1259:       created = true;
1260:       mat = new THREE.ShaderMaterial({
1261:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1262:         uniforms: {
1263:           uTime: { value: 0 },
```

## Implementation Checkpoints (per File)
- File 1: src/components/webgl/WebGLBackground.jsx
  - Action 1: Remove or add GLSL declaration for uStageProgress
  - Action 2: Remove or add GLSL declaration for uStageProgress
  - Action 3: Remove or add GLSL declaration for shaderMorph
  - Action 4: Remove or add GLSL declaration for uStageIndex
  - Action 5: Remove or add GLSL declaration for uBrainRegion
  - Action 6: Remove or add GLSL declaration for uTierCutoff
  - Action 7: Remove or add GLSL declaration for uStageBlend
  - Action 8: Remove or add GLSL declaration for uTierCutoff
  - Action 9: Remove or add GLSL declaration for uTierCutoff
  - Action 10: Remove or add GLSL declaration for uStageProgress
  - Action 11: Confirm uniforms passed to ShaderMaterial cover morph and grid requirements.
  - Action 12: Review onBeforeCompile mutations for compatibility with motion audit.

- File 2: src/runtime/materialFactory.js
  - Action 1: Remove or add GLSL declaration for uTierHighlight
  - Action 2: Confirm uniforms passed to ShaderMaterial cover morph and grid requirements.

- File 3: src/shaders/templates/consciousness-fragment.glsl
  - Action 1: Wire JS setter for uFadeProgress at src/shaders/templates/consciousness-fragment.glsl:11

- File 4: src/shaders/templates/consciousness-vertex.glsl
  - Action 1: Wire JS setter for uTotalSprites at src/shaders/templates/consciousness-vertex.glsl:20
  - Action 2: Wire JS setter for uResolution at src/shaders/templates/consciousness-vertex.glsl:22
  - Action 3: Wire JS setter for uAtmoFit at src/shaders/templates/consciousness-vertex.glsl:23
  - Action 4: Wire JS setter for uTextFit at src/shaders/templates/consciousness-vertex.glsl:24
  - Action 5: Wire JS setter for uMoveDampStart at src/shaders/templates/consciousness-vertex.glsl:25
  - Action 6: Wire JS setter for uMoveDampStartY at src/shaders/templates/consciousness-vertex.glsl:26
  - Action 7: Wire JS setter for uMotionParams at src/shaders/templates/consciousness-vertex.glsl:31
  - Action 8: Wire JS setter for uGridSpacing at src/shaders/templates/consciousness-vertex.glsl:32

## Narrative & Next Steps
- [ ] Validate that morph-safe taper remains after implementing 2.4 tier motion handlers.
- [ ] When wiring stage color transitions (2.5), ensure `uColor*` uniforms stay synchronized with ShaderMaterial blocks above.
- [ ] For beat visual effects (2.6), treat this dossier as baseline and re-run audits after each major change.
- [ ] Consider adding automated tests that parse shader-motion-audit.json to guard regression in CI.
- [ ] Document any new uniforms or modes inside this dossier for future reference.
