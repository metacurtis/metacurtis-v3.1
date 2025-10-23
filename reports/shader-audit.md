# Shader Audit Report

## JS uniform sets

- `src/components/webgl/WebGLBackground.jsx:342` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:344` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:349` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:466` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:505` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1047` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1048` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1068` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:1201` sets **shaderMorph**
- `src/components/webgl/WebGLBackground.jsx:1321` sets **uAtlasTexture**
- `src/components/webgl/WebGLBackground.jsx:1322` sets **uStageIndex**
- `src/components/webgl/WebGLBackground.jsx:1323` sets **uBrainRegion**
- `src/components/webgl/WebGLBackground.jsx:1324` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1326` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1327` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1338` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1342` sets **uColorCurrent**
- `src/components/webgl/WebGLBackground.jsx:1343` sets **uColorNext**
- `src/components/webgl/WebGLBackground.jsx:1344` sets **uColorAccent1**
- `src/components/webgl/WebGLBackground.jsx:1345` sets **uColorAccent2**
- `src/components/webgl/WebGLBackground.jsx:1347` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1348` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1436` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1437` sets **uScrollProgress**
- `src/components/webgl/WebGLBackground.jsx:1438` sets **uStageBlend**
- `src/components/webgl/WebGLBackground.jsx:1439` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1440` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1566` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1599` sets **uMotionMode**
- `src/components/webgl/WebGLBackground.jsx:1642` sets **uFlowTurbulence**
- `src/components/webgl/WebGLBackground.jsx:1650` sets **uStreakIntensity**
- `src/components/webgl/WebGLBackground.jsx:1734` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1735` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1750` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1751` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1763` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1780` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1783` sets **uGaussianSigma**
- `src/components/webgl/WebGLBackground.jsx:1786` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1789` sets **uMorphType**
- `src/components/webgl/WebGLBackground.jsx:1792` sets **uPostMorphFreeze**
- `src/runtime/materialFactory.js:53` sets **uPointSize**
- `src/runtime/materialFactory.js:54` sets **uPointSize**
- `src/runtime/materialFactory.js:59` sets **uTierHighlight**

## GLSL uniforms

- **uAtlasTexture**
  - `src/shaders/templates/consciousness-fragment.glsl:4`
- **uTime**
  - `src/shaders/templates/consciousness-fragment.glsl:5`
  - `src/shaders/templates/consciousness-vertex.glsl:14`
- **uColorCurrent**
  - `src/shaders/templates/consciousness-fragment.glsl:6`
  - `src/shaders/templates/consciousness-vertex.glsl:18`
- **uColorNext**
  - `src/shaders/templates/consciousness-fragment.glsl:7`
  - `src/shaders/templates/consciousness-vertex.glsl:19`
- **uColorAccent1**
  - `src/shaders/templates/consciousness-fragment.glsl:8`
- **uColorAccent2**
  - `src/shaders/templates/consciousness-fragment.glsl:9`
- **uActiveCount**
  - `src/shaders/templates/consciousness-fragment.glsl:10`
- **uFadeProgress**
  - `src/shaders/templates/consciousness-fragment.glsl:11`
- **uGaussianSigma**
  - `src/shaders/templates/consciousness-fragment.glsl:12`
- **uBandHeight**
  - `src/shaders/templates/consciousness-fragment.glsl:13`
- **uBandFade**
  - `src/shaders/templates/consciousness-fragment.glsl:14`
- **uMorphProgress**
  - `src/shaders/templates/consciousness-vertex.glsl:15`
- **uScrollProgress**
  - `src/shaders/templates/consciousness-vertex.glsl:16`
- **uPointSize**
  - `src/shaders/templates/consciousness-vertex.glsl:17`
- **uTotalSprites**
  - `src/shaders/templates/consciousness-vertex.glsl:20`
- **uDevicePixelRatio**
  - `src/shaders/templates/consciousness-vertex.glsl:21`
- **uResolution**
  - `src/shaders/templates/consciousness-vertex.glsl:22`
- **uAtmoFit**
  - `src/shaders/templates/consciousness-vertex.glsl:23`
- **uTextFit**
  - `src/shaders/templates/consciousness-vertex.glsl:24`
- **uMoveDampStart**
  - `src/shaders/templates/consciousness-vertex.glsl:25`
- **uMoveDampStartY**
  - `src/shaders/templates/consciousness-vertex.glsl:26`
- **uPostMorphFreeze**
  - `src/shaders/templates/consciousness-vertex.glsl:27`
- **uSpreadFactor**
  - `src/shaders/templates/consciousness-vertex.glsl:28`
- **uMorphType**
  - `src/shaders/templates/consciousness-vertex.glsl:29`
- **uMotionMode**
  - `src/shaders/templates/consciousness-vertex.glsl:30`
- **uMotionParams**
  - `src/shaders/templates/consciousness-vertex.glsl:31`
- **uGridSpacing**
  - `src/shaders/templates/consciousness-vertex.glsl:32`
- **uFlowTurbulence**
  - `src/shaders/templates/consciousness-vertex.glsl:33`
- **uStreakIntensity**
  - `src/shaders/templates/consciousness-vertex.glsl:34`

## Attributes

- **particleIndex**
  - `src/shaders/templates/consciousness-vertex.glsl:4`
- **atmosphericPosition**
  - `src/shaders/templates/consciousness-vertex.glsl:5`
- **text3DPosition**
  - `src/shaders/templates/consciousness-vertex.glsl:6`
- **animationSeed**
  - `src/shaders/templates/consciousness-vertex.glsl:7`
- **atlasIndex**
  - `src/shaders/templates/consciousness-vertex.glsl:8`
- **sizeMultiplier**
  - `src/shaders/templates/consciousness-vertex.glsl:9`
- **tierData**
  - `src/shaders/templates/consciousness-vertex.glsl:10`
- **opacityData**
  - `src/shaders/templates/consciousness-vertex.glsl:11`

## Varyings

- **vPosition**
  - `src/shaders/templates/consciousness-fragment.glsl:17`
  - `src/shaders/templates/consciousness-vertex.glsl:37`
- **vBlend**
  - `src/shaders/templates/consciousness-fragment.glsl:18`
  - `src/shaders/templates/consciousness-vertex.glsl:38`
- **vAlpha**
  - `src/shaders/templates/consciousness-fragment.glsl:19`
  - `src/shaders/templates/consciousness-vertex.glsl:39`
- **vAtlasUVOffset**
  - `src/shaders/templates/consciousness-fragment.glsl:20`
  - `src/shaders/templates/consciousness-vertex.glsl:40`
- **vTierID**
  - `src/shaders/templates/consciousness-fragment.glsl:21`
  - `src/shaders/templates/consciousness-vertex.glsl:41`
- **vSizeMultiplier**
  - `src/shaders/templates/consciousness-fragment.glsl:22`
  - `src/shaders/templates/consciousness-vertex.glsl:42`
- **vParticleIndex**
  - `src/shaders/templates/consciousness-fragment.glsl:23`
  - `src/shaders/templates/consciousness-vertex.glsl:43`

## Consts

- **PI**
  - `src/shaders/templates/consciousness-vertex.glsl:45`
- **TWO_PI**
  - `src/shaders/templates/consciousness-vertex.glsl:46`

## Materials / onBeforeCompile

- `src/components/webgl/WebGLBackground.jsx:1260`

```text
1258:     if (!mat) {
1259:       created = true;
1260:       mat = new THREE.ShaderMaterial({
1261:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1262:         uniforms: {
```
- `src/runtime/materialFactory.js:27`

```text
25:   }
26: 
27:   const mat = new THREE.ShaderMaterial({
28:     vertexShader,
29:     fragmentShader,
```

- `src/components/webgl/WebGLBackground.jsx:1261`

```text
1259:       created = true;
1260:       mat = new THREE.ShaderMaterial({
1261:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1262:         uniforms: {
1263:           uTime: { value: 0 },
```

## Texture usage

(none)

## Mismatches

### JS sets uniform missing in GLSL
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:344`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1048`
- **shaderMorph** at `src/components/webgl/WebGLBackground.jsx:1201`
- **uStageIndex** at `src/components/webgl/WebGLBackground.jsx:1322`
- **uBrainRegion** at `src/components/webgl/WebGLBackground.jsx:1323`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1348`
- **uStageBlend** at `src/components/webgl/WebGLBackground.jsx:1438`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1440`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1735`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1751`
- **uTierHighlight** at `src/runtime/materialFactory.js:59`

### GLSL uniform with no JS set
- **uFadeProgress** at:
  - `src/shaders/templates/consciousness-fragment.glsl:11`
- **uTotalSprites** at:
  - `src/shaders/templates/consciousness-vertex.glsl:20`
- **uResolution** at:
  - `src/shaders/templates/consciousness-vertex.glsl:22`
- **uAtmoFit** at:
  - `src/shaders/templates/consciousness-vertex.glsl:23`
- **uTextFit** at:
  - `src/shaders/templates/consciousness-vertex.glsl:24`
- **uMoveDampStart** at:
  - `src/shaders/templates/consciousness-vertex.glsl:25`
- **uMoveDampStartY** at:
  - `src/shaders/templates/consciousness-vertex.glsl:26`
- **uMotionParams** at:
  - `src/shaders/templates/consciousness-vertex.glsl:31`
- **uGridSpacing** at:
  - `src/shaders/templates/consciousness-vertex.glsl:32`

## Update frequency (perf hint)

- uPointSize: 4
- uMorphProgress: 3
- uStageProgress: 3
- uPostMorphFreeze: 3
- uActiveCount: 3
- uTierCutoff: 3
- uBandFade: 2
- uBandHeight: 2
- uDevicePixelRatio: 2
- uSpreadFactor: 2
- shaderMorph: 1
- uAtlasTexture: 1
- uStageIndex: 1
- uBrainRegion: 1
- uColorCurrent: 1
- uColorNext: 1
- uColorAccent1: 1
- uColorAccent2: 1
- uTime: 1
- uScrollProgress: 1

## Warnings

- Naming: JS uniform set "shaderMorph" not uCamelCase
- Unused: GLSL uniform "uFadeProgress" not set in JS
- Unused: GLSL uniform "uTotalSprites" not set in JS
- Unused: GLSL uniform "uResolution" not set in JS
- Unused: GLSL uniform "uAtmoFit" not set in JS
- Unused: GLSL uniform "uTextFit" not set in JS
- Unused: GLSL uniform "uMoveDampStart" not set in JS
- Unused: GLSL uniform "uMoveDampStartY" not set in JS
- Unused: GLSL uniform "uMotionParams" not set in JS
- Unused: GLSL uniform "uGridSpacing" not set in JS
- Orphan set: JS sets "uStageProgress" but GLSL has no declaration
- Orphan set: JS sets "shaderMorph" but GLSL has no declaration
- Orphan set: JS sets "uStageIndex" but GLSL has no declaration
- Orphan set: JS sets "uBrainRegion" but GLSL has no declaration
- Orphan set: JS sets "uTierCutoff" but GLSL has no declaration
- Orphan set: JS sets "uStageBlend" but GLSL has no declaration
- Orphan set: JS sets "uTierHighlight" but GLSL has no declaration