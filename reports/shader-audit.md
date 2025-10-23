# Shader Audit Report

## JS uniform sets

- `src/components/webgl/WebGLBackground.jsx:384` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:386` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:391` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:508` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:547` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1047` sets **uPalette0**
- `src/components/webgl/WebGLBackground.jsx:1048` sets **uPalette1**
- `src/components/webgl/WebGLBackground.jsx:1049` sets **uPalette2**
- `src/components/webgl/WebGLBackground.jsx:1050` sets **uPalette3**
- `src/components/webgl/WebGLBackground.jsx:1066` sets **uTierMode**
- `src/components/webgl/WebGLBackground.jsx:1067` sets **uTierParams0**
- `src/components/webgl/WebGLBackground.jsx:1068` sets **uTierParams1**
- `src/components/webgl/WebGLBackground.jsx:1069` sets **uTierParams2**
- `src/components/webgl/WebGLBackground.jsx:1070` sets **uTierParams3**
- `src/components/webgl/WebGLBackground.jsx:1077` sets **uTierHighlight**
- `src/components/webgl/WebGLBackground.jsx:1162` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1163` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1183` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:1316` sets **shaderMorph**
- `src/components/webgl/WebGLBackground.jsx:1444` sets **uAtlasTexture**
- `src/components/webgl/WebGLBackground.jsx:1445` sets **uStageIndex**
- `src/components/webgl/WebGLBackground.jsx:1446` sets **uBrainRegion**
- `src/components/webgl/WebGLBackground.jsx:1447` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1449` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1450` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1461` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1465` sets **uColorCurrent**
- `src/components/webgl/WebGLBackground.jsx:1466` sets **uColorNext**
- `src/components/webgl/WebGLBackground.jsx:1467` sets **uColorAccent1**
- `src/components/webgl/WebGLBackground.jsx:1468` sets **uColorAccent2**
- `src/components/webgl/WebGLBackground.jsx:1470` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1471` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1561` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1565` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1569` sets **uScrollProgress**
- `src/components/webgl/WebGLBackground.jsx:1570` sets **uStageBlend**
- `src/components/webgl/WebGLBackground.jsx:1571` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1572` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1678` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1683` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1688` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1693` sets **uForceMono**
- `src/components/webgl/WebGLBackground.jsx:1728` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1732` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1736` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1740` sets **uForceMono**
- `src/components/webgl/WebGLBackground.jsx:1747` sets **uMonoColor**
- `src/components/webgl/WebGLBackground.jsx:1786` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1813` sets **uTierHighlight**
- `src/components/webgl/WebGLBackground.jsx:1821` sets **uGridSpacing**
- `src/components/webgl/WebGLBackground.jsx:1826` sets **uFlowTurbulence**
- `src/components/webgl/WebGLBackground.jsx:1831` sets **uStreakIntensity**
- `src/components/webgl/WebGLBackground.jsx:1836` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1890` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1891` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1906` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1907` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1919` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1936` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1939` sets **uGaussianSigma**
- `src/components/webgl/WebGLBackground.jsx:1942` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1945` sets **uMorphType**
- `src/components/webgl/WebGLBackground.jsx:1948` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1953` sets **uTierMode**
- `src/components/webgl/WebGLBackground.jsx:1958` sets **uGridSpacing**
- `src/components/webgl/WebGLBackground.jsx:1966` sets **uTierHighlight**
- `src/runtime/materialFactory.js:62` sets **uPointSize**
- `src/runtime/materialFactory.js:63` sets **uPointSize**

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
- **uPalette0**
  - `src/shaders/templates/consciousness-fragment.glsl:10`
- **uPalette1**
  - `src/shaders/templates/consciousness-fragment.glsl:11`
- **uPalette2**
  - `src/shaders/templates/consciousness-fragment.glsl:12`
- **uPalette3**
  - `src/shaders/templates/consciousness-fragment.glsl:13`
- **uTierHighlight**
  - `src/shaders/templates/consciousness-fragment.glsl:14`
- **uActiveCount**
  - `src/shaders/templates/consciousness-fragment.glsl:15`
- **uFadeProgress**
  - `src/shaders/templates/consciousness-fragment.glsl:16`
- **uGaussianSigma**
  - `src/shaders/templates/consciousness-fragment.glsl:17`
- **uBandHeight**
  - `src/shaders/templates/consciousness-fragment.glsl:18`
- **uBandFade**
  - `src/shaders/templates/consciousness-fragment.glsl:19`
- **uForceMono**
  - `src/shaders/templates/consciousness-fragment.glsl:20`
- **uMonoColor**
  - `src/shaders/templates/consciousness-fragment.glsl:21`
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
- **uTierParams0**
  - `src/shaders/templates/consciousness-vertex.glsl:31`
- **uTierParams1**
  - `src/shaders/templates/consciousness-vertex.glsl:32`
- **uTierParams2**
  - `src/shaders/templates/consciousness-vertex.glsl:33`
- **uTierParams3**
  - `src/shaders/templates/consciousness-vertex.glsl:34`
- **uGridSpacing**
  - `src/shaders/templates/consciousness-vertex.glsl:35`
- **uFlowTurbulence**
  - `src/shaders/templates/consciousness-vertex.glsl:36`
- **uStreakIntensity**
  - `src/shaders/templates/consciousness-vertex.glsl:37`

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
  - `src/shaders/templates/consciousness-fragment.glsl:24`
  - `src/shaders/templates/consciousness-vertex.glsl:40`
- **vBlend**
  - `src/shaders/templates/consciousness-fragment.glsl:25`
  - `src/shaders/templates/consciousness-vertex.glsl:41`
- **vAlpha**
  - `src/shaders/templates/consciousness-fragment.glsl:26`
  - `src/shaders/templates/consciousness-vertex.glsl:42`
- **vAtlasUVOffset**
  - `src/shaders/templates/consciousness-fragment.glsl:27`
  - `src/shaders/templates/consciousness-vertex.glsl:43`
- **vTierID**
  - `src/shaders/templates/consciousness-fragment.glsl:28`
  - `src/shaders/templates/consciousness-vertex.glsl:44`
- **vTier**
  - `src/shaders/templates/consciousness-fragment.glsl:29`
  - `src/shaders/templates/consciousness-vertex.glsl:45`
- **vSizeMultiplier**
  - `src/shaders/templates/consciousness-fragment.glsl:30`
  - `src/shaders/templates/consciousness-vertex.glsl:46`
- **vParticleIndex**
  - `src/shaders/templates/consciousness-fragment.glsl:31`
  - `src/shaders/templates/consciousness-vertex.glsl:47`

## Consts

- **PI**
  - `src/shaders/templates/consciousness-vertex.glsl:49`
- **TWO_PI**
  - `src/shaders/templates/consciousness-vertex.glsl:50`

## Materials / onBeforeCompile

- `src/components/webgl/WebGLBackground.jsx:1375`

```text
1373:     if (!mat) {
1374:       created = true;
1375:       mat = new THREE.ShaderMaterial({
1376:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1377:         uniforms: {
```
- `src/runtime/materialFactory.js:27`

```text
25:   }
26: 
27:   const mat = new THREE.ShaderMaterial({
28:     vertexShader,
29:     fragmentShader,
```

- `src/components/webgl/WebGLBackground.jsx:1376`

```text
1374:       created = true;
1375:       mat = new THREE.ShaderMaterial({
1376:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1377:         uniforms: {
1378:           uTime:            { value: 0 },
```

## Texture usage

(none)

## Mismatches

### JS sets uniform missing in GLSL
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:386`
- **uTierMode** at `src/components/webgl/WebGLBackground.jsx:1066`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1163`
- **shaderMorph** at `src/components/webgl/WebGLBackground.jsx:1316`
- **uStageIndex** at `src/components/webgl/WebGLBackground.jsx:1445`
- **uBrainRegion** at `src/components/webgl/WebGLBackground.jsx:1446`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1471`
- **uStageBlend** at `src/components/webgl/WebGLBackground.jsx:1570`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1572`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1891`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1907`
- **uTierMode** at `src/components/webgl/WebGLBackground.jsx:1953`

### GLSL uniform with no JS set
- **uFadeProgress** at:
  - `src/shaders/templates/consciousness-fragment.glsl:16`
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

## Update frequency (perf hint)

- uPointSize: 6
- uPostMorphFreeze: 5
- uSpreadFactor: 5
- uMorphProgress: 3
- uStageProgress: 3
- uTierHighlight: 3
- uActiveCount: 3
- uTierCutoff: 3
- uBandFade: 2
- uBandHeight: 2
- uTierMode: 2
- uDevicePixelRatio: 2
- uTime: 2
- uForceMono: 2
- uGridSpacing: 2
- uPalette0: 1
- uPalette1: 1
- uPalette2: 1
- uPalette3: 1
- uTierParams0: 1

## Warnings

- Naming: JS uniform set "shaderMorph" not uCamelCase
- Unused: GLSL uniform "uFadeProgress" not set in JS
- Unused: GLSL uniform "uTotalSprites" not set in JS
- Unused: GLSL uniform "uResolution" not set in JS
- Unused: GLSL uniform "uAtmoFit" not set in JS
- Unused: GLSL uniform "uTextFit" not set in JS
- Unused: GLSL uniform "uMoveDampStart" not set in JS
- Unused: GLSL uniform "uMoveDampStartY" not set in JS
- Orphan set: JS sets "uStageProgress" but GLSL has no declaration
- Orphan set: JS sets "uTierMode" but GLSL has no declaration
- Orphan set: JS sets "shaderMorph" but GLSL has no declaration
- Orphan set: JS sets "uStageIndex" but GLSL has no declaration
- Orphan set: JS sets "uBrainRegion" but GLSL has no declaration
- Orphan set: JS sets "uTierCutoff" but GLSL has no declaration
- Orphan set: JS sets "uStageBlend" but GLSL has no declaration