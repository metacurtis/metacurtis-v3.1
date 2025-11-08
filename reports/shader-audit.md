# Shader Audit Report

## JS uniform sets

- `src/components/webgl/WebGLBackground.jsx:398` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:400` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:405` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:539` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:578` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1093` sets **uPalette0**
- `src/components/webgl/WebGLBackground.jsx:1094` sets **uPalette1**
- `src/components/webgl/WebGLBackground.jsx:1095` sets **uPalette2**
- `src/components/webgl/WebGLBackground.jsx:1096` sets **uPalette3**
- `src/components/webgl/WebGLBackground.jsx:1112` sets **uTierMode**
- `src/components/webgl/WebGLBackground.jsx:1113` sets **uTierParams0**
- `src/components/webgl/WebGLBackground.jsx:1114` sets **uTierParams1**
- `src/components/webgl/WebGLBackground.jsx:1115` sets **uTierParams2**
- `src/components/webgl/WebGLBackground.jsx:1116` sets **uTierParams3**
- `src/components/webgl/WebGLBackground.jsx:1123` sets **uTierHighlight**
- `src/components/webgl/WebGLBackground.jsx:1241` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1242` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1243` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1245` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1246` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1278` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1282` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1307` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:1445` sets **shaderMorph**
- `src/components/webgl/WebGLBackground.jsx:1577` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1588` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1634` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1645` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1763` sets **uAtlasTexture**
- `src/components/webgl/WebGLBackground.jsx:1764` sets **uStageIndex**
- `src/components/webgl/WebGLBackground.jsx:1765` sets **uBrainRegion**
- `src/components/webgl/WebGLBackground.jsx:1766` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1768` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1769` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1780` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1784` sets **uColorCurrent**
- `src/components/webgl/WebGLBackground.jsx:1785` sets **uColorNext**
- `src/components/webgl/WebGLBackground.jsx:1786` sets **uColorAccent1**
- `src/components/webgl/WebGLBackground.jsx:1787` sets **uColorAccent2**
- `src/components/webgl/WebGLBackground.jsx:1789` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1790` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1876` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1878` sets **uScrollProgress**
- `src/components/webgl/WebGLBackground.jsx:1879` sets **uStageBlend**
- `src/components/webgl/WebGLBackground.jsx:1880` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1881` sets **uTierCutoff**
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
  - `src/shaders/templates/consciousness-fragment.glsl:22`
  - `src/shaders/templates/consciousness-vertex.glsl:40`
- **vBlend**
  - `src/shaders/templates/consciousness-fragment.glsl:23`
  - `src/shaders/templates/consciousness-vertex.glsl:41`
- **vAlpha**
  - `src/shaders/templates/consciousness-fragment.glsl:24`
  - `src/shaders/templates/consciousness-vertex.glsl:42`
- **vAtlasUVOffset**
  - `src/shaders/templates/consciousness-fragment.glsl:25`
  - `src/shaders/templates/consciousness-vertex.glsl:43`
- **vTierID**
  - `src/shaders/templates/consciousness-fragment.glsl:26`
  - `src/shaders/templates/consciousness-vertex.glsl:44`
- **vTier**
  - `src/shaders/templates/consciousness-fragment.glsl:27`
  - `src/shaders/templates/consciousness-vertex.glsl:45`
- **vSizeMultiplier**
  - `src/shaders/templates/consciousness-fragment.glsl:28`
  - `src/shaders/templates/consciousness-vertex.glsl:46`
- **vParticleIndex**
  - `src/shaders/templates/consciousness-fragment.glsl:29`
  - `src/shaders/templates/consciousness-vertex.glsl:47`

## Consts

- **PI**
  - `src/shaders/templates/consciousness-vertex.glsl:49`
- **TWO_PI**
  - `src/shaders/templates/consciousness-vertex.glsl:50`

## Materials / onBeforeCompile

- `src/components/webgl/WebGLBackground.jsx:1696`

```text
1694:     if (!mat) {
1695:       created = true;
1696:       mat = new THREE.ShaderMaterial({
1697:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1698:         uniforms: {
```
- `src/runtime/materialFactory.js:27`

```text
25:   }
26: 
27:   const mat = new THREE.ShaderMaterial({
28:     vertexShader,
29:     fragmentShader,
```

- `src/components/webgl/WebGLBackground.jsx:1697`

```text
1695:       created = true;
1696:       mat = new THREE.ShaderMaterial({
1697:         onBeforeCompile: () => { try { console.log('🧪 Shader compiled'); } catch {} },
1698:         uniforms: {
1699:           uTime:            { value: 0 },
```

## Texture usage

(none)

## Mismatches

### JS sets uniform missing in GLSL
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:400`
- **uTierMode** at `src/components/webgl/WebGLBackground.jsx:1112`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1242`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1246`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1282`
- **shaderMorph** at `src/components/webgl/WebGLBackground.jsx:1445`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1634`
- **uStageIndex** at `src/components/webgl/WebGLBackground.jsx:1764`
- **uBrainRegion** at `src/components/webgl/WebGLBackground.jsx:1765`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1790`
- **uStageBlend** at `src/components/webgl/WebGLBackground.jsx:1879`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1881`

### GLSL uniform with no JS set
- **uFadeProgress** at:
  - `src/shaders/templates/consciousness-fragment.glsl:16`
- **uGaussianSigma** at:
  - `src/shaders/templates/consciousness-fragment.glsl:17`
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
- **uSpreadFactor** at:
  - `src/shaders/templates/consciousness-vertex.glsl:28`
- **uMorphType** at:
  - `src/shaders/templates/consciousness-vertex.glsl:29`
- **uGridSpacing** at:
  - `src/shaders/templates/consciousness-vertex.glsl:35`
- **uFlowTurbulence** at:
  - `src/shaders/templates/consciousness-vertex.glsl:36`
- **uStreakIntensity** at:
  - `src/shaders/templates/consciousness-vertex.glsl:37`

## Update frequency (perf hint)

- uStageProgress: 4
- uPostMorphFreeze: 4
- uPointSize: 4
- uMorphProgress: 3
- uActiveCount: 3
- uTierCutoff: 3
- uBandFade: 2
- uBandHeight: 2
- uDevicePixelRatio: 2
- uPalette0: 1
- uPalette1: 1
- uPalette2: 1
- uPalette3: 1
- uTierMode: 1
- uTierParams0: 1
- uTierParams1: 1
- uTierParams2: 1
- uTierParams3: 1
- uTierHighlight: 1
- shaderMorph: 1

## Warnings

- Naming: JS uniform set "shaderMorph" not uCamelCase
- Unused: GLSL uniform "uFadeProgress" not set in JS
- Unused: GLSL uniform "uGaussianSigma" not set in JS
- Unused: GLSL uniform "uTotalSprites" not set in JS
- Unused: GLSL uniform "uResolution" not set in JS
- Unused: GLSL uniform "uAtmoFit" not set in JS
- Unused: GLSL uniform "uTextFit" not set in JS
- Unused: GLSL uniform "uMoveDampStart" not set in JS
- Unused: GLSL uniform "uMoveDampStartY" not set in JS
- Unused: GLSL uniform "uSpreadFactor" not set in JS
- Unused: GLSL uniform "uMorphType" not set in JS
- Unused: GLSL uniform "uGridSpacing" not set in JS
- Unused: GLSL uniform "uFlowTurbulence" not set in JS
- Unused: GLSL uniform "uStreakIntensity" not set in JS
- Orphan set: JS sets "uStageProgress" but GLSL has no declaration
- Orphan set: JS sets "uTierMode" but GLSL has no declaration
- Orphan set: JS sets "uTierCutoff" but GLSL has no declaration
- Orphan set: JS sets "shaderMorph" but GLSL has no declaration
- Orphan set: JS sets "uStageIndex" but GLSL has no declaration
- Orphan set: JS sets "uBrainRegion" but GLSL has no declaration
- Orphan set: JS sets "uStageBlend" but GLSL has no declaration