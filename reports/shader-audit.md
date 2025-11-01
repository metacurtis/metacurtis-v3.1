# Shader Audit Report

## JS uniform sets

- `src/components/webgl/WebGLBackground.jsx:316` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:318` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:323` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:435` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:899` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:910` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:979` sets **uTurbulence**
- `src/components/webgl/WebGLBackground.jsx:983` sets **uSpeedMultiplier**
- `src/components/webgl/WebGLBackground.jsx:987` sets **uMotionMode**
- `src/components/webgl/WebGLBackground.jsx:991` sets **uDriftAmp**
- `src/components/webgl/WebGLBackground.jsx:1016` sets **uTurbulence**
- `src/components/webgl/WebGLBackground.jsx:1020` sets **uSpeedMultiplier**
- `src/components/webgl/WebGLBackground.jsx:1024` sets **uMotionMode**
- `src/components/webgl/WebGLBackground.jsx:1028` sets **uDriftAmp**
- `src/components/webgl/WebGLBackground.jsx:1037` sets **uTurbulence**
- `src/components/webgl/WebGLBackground.jsx:1041` sets **uSpeedMultiplier**
- `src/components/webgl/WebGLBackground.jsx:1045` sets **uMotionMode**
- `src/components/webgl/WebGLBackground.jsx:1049` sets **uDriftAmp**
- `src/components/webgl/WebGLBackground.jsx:1053` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1125` sets **uAtlasTexture**
- `src/components/webgl/WebGLBackground.jsx:1126` sets **uStageIndex**
- `src/components/webgl/WebGLBackground.jsx:1127` sets **uBrainRegion**
- `src/components/webgl/WebGLBackground.jsx:1128` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1130` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1141` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1145` sets **uColorCurrent**
- `src/components/webgl/WebGLBackground.jsx:1146` sets **uColorNext**
- `src/components/webgl/WebGLBackground.jsx:1147` sets **uColorAccent1**
- `src/components/webgl/WebGLBackground.jsx:1148` sets **uColorAccent2**
- `src/components/webgl/WebGLBackground.jsx:1150` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1151` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1237` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1239` sets **uScrollProgress**
- `src/components/webgl/WebGLBackground.jsx:1240` sets **uStageBlend**
- `src/components/webgl/WebGLBackground.jsx:1241` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1242` sets **uTierCutoff**
- `src/components/webgl/managers/BlueprintBinder.js:394` sets **uActiveCount**
- `src/components/webgl/managers/BlueprintBinder.js:398` sets **uTierCutoff**
- `src/components/webgl/managers/BlueprintBinder.js:424` sets **uMorphProgress**
- `src/components/webgl/managers/BlueprintBinder.js:428` sets **uStageProgress**
- `src/components/webgl/managers/BlueprintBinder.js:438` sets **uPostMorphFreeze**
- `src/components/webgl/managers/BlueprintBinder.js:572` sets **uPostMorphFreeze**
- `src/components/webgl/managers/BlueprintBinder.js:583` sets **uPostMorphFreeze**
- `src/components/webgl/managers/BlueprintBinder.js:587` sets **uPointSize**
- `src/components/webgl/managers/BlueprintBinder.js:692` sets **uPalette0**
- `src/components/webgl/managers/BlueprintBinder.js:693` sets **uPalette1**
- `src/components/webgl/managers/BlueprintBinder.js:694` sets **uPalette2**
- `src/components/webgl/managers/BlueprintBinder.js:695` sets **uPalette3**
- `src/components/webgl/managers/BlueprintBinder.js:724` sets **uTierMode**
- `src/components/webgl/managers/BlueprintBinder.js:725` sets **uTierParams0**
- `src/components/webgl/managers/BlueprintBinder.js:726` sets **uTierParams1**
- `src/components/webgl/managers/BlueprintBinder.js:727` sets **uTierParams2**
- `src/components/webgl/managers/BlueprintBinder.js:728` sets **uTierParams3**
- `src/components/webgl/managers/BlueprintBinder.js:738` sets **uTierHighlight**
- `src/components/webgl/managers/BlueprintBinder.js:894` sets **uMorphProgress**
- `src/components/webgl/managers/BlueprintBinder.js:895` sets **uStageProgress**
- `src/components/webgl/managers/BlueprintBinder.js:896` sets **uPostMorphFreeze**
- `src/components/webgl/managers/BlueprintBinder.js:898` sets **uMorphProgress**
- `src/components/webgl/managers/BlueprintBinder.js:899` sets **uStageProgress**
- `src/components/webgl/managers/BlueprintBinder.js:961` sets **uBandFade**
- `src/components/webgl/managers/BlueprintBinder.js:1138` sets **shaderMorph**
- `src/components/webgl/setup/createRendererMaterial.js:173` sets **uPointSize**
- `src/components/webgl/setup/createRendererMaterial.js:181` sets **uGaussianFalloff**
- `src/components/webgl/setup/createRendererMaterial.js:189` sets **uCenterWeighting**
- `src/components/webgl/setup/viewportFitters.js:127` sets **uBandFade**
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

- `src/components/webgl/setup/createRendererMaterial.js:133`

```text
131:   };
132: 
133:   const material = new THREE.ShaderMaterial({
134:     vertexShader,
135:     fragmentShader,
```
- `src/runtime/materialFactory.js:27`

```text
25:   }
26: 
27:   const mat = new THREE.ShaderMaterial({
28:     vertexShader,
29:     fragmentShader,
```

- `src/components/webgl/WebGLBackground.jsx:1111`

```text
1109:         totalSprites: 16,
1110:         morphTypeDefault: MORPH_TYPE_ENUM.steady,
1111:         onBeforeCompile: () => {
1112:           try { console.log('🧪 Shader compiled'); }
1113:           catch { /* noop */ }
```

## Texture usage

(none)

## Mismatches

### JS sets uniform missing in GLSL
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:318`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:899`
- **uTurbulence** at `src/components/webgl/WebGLBackground.jsx:979`
- **uSpeedMultiplier** at `src/components/webgl/WebGLBackground.jsx:983`
- **uMotionMode** at `src/components/webgl/WebGLBackground.jsx:987`
- **uDriftAmp** at `src/components/webgl/WebGLBackground.jsx:991`
- **uTurbulence** at `src/components/webgl/WebGLBackground.jsx:1016`
- **uSpeedMultiplier** at `src/components/webgl/WebGLBackground.jsx:1020`
- **uMotionMode** at `src/components/webgl/WebGLBackground.jsx:1024`
- **uDriftAmp** at `src/components/webgl/WebGLBackground.jsx:1028`
- **uTurbulence** at `src/components/webgl/WebGLBackground.jsx:1037`
- **uSpeedMultiplier** at `src/components/webgl/WebGLBackground.jsx:1041`
- **uMotionMode** at `src/components/webgl/WebGLBackground.jsx:1045`
- **uDriftAmp** at `src/components/webgl/WebGLBackground.jsx:1049`
- **uStageIndex** at `src/components/webgl/WebGLBackground.jsx:1126`
- **uBrainRegion** at `src/components/webgl/WebGLBackground.jsx:1127`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1151`
- **uStageBlend** at `src/components/webgl/WebGLBackground.jsx:1240`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1242`
- **uTierCutoff** at `src/components/webgl/managers/BlueprintBinder.js:398`
- **uStageProgress** at `src/components/webgl/managers/BlueprintBinder.js:428`
- **uTierMode** at `src/components/webgl/managers/BlueprintBinder.js:724`
- **uStageProgress** at `src/components/webgl/managers/BlueprintBinder.js:895`
- **uStageProgress** at `src/components/webgl/managers/BlueprintBinder.js:899`
- **shaderMorph** at `src/components/webgl/managers/BlueprintBinder.js:1138`
- **uGaussianFalloff** at `src/components/webgl/setup/createRendererMaterial.js:181`
- **uCenterWeighting** at `src/components/webgl/setup/createRendererMaterial.js:189`

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

- uPostMorphFreeze: 6
- uMorphProgress: 5
- uStageProgress: 5
- uPointSize: 5
- uTurbulence: 3
- uSpeedMultiplier: 3
- uMotionMode: 3
- uDriftAmp: 3
- uActiveCount: 3
- uTierCutoff: 3
- uBandHeight: 2
- uBandFade: 2
- uAtlasTexture: 1
- uStageIndex: 1
- uBrainRegion: 1
- uDevicePixelRatio: 1
- uColorCurrent: 1
- uColorNext: 1
- uColorAccent1: 1
- uColorAccent2: 1

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
- Orphan set: JS sets "uTurbulence" but GLSL has no declaration
- Orphan set: JS sets "uSpeedMultiplier" but GLSL has no declaration
- Orphan set: JS sets "uMotionMode" but GLSL has no declaration
- Orphan set: JS sets "uDriftAmp" but GLSL has no declaration
- Orphan set: JS sets "uStageIndex" but GLSL has no declaration
- Orphan set: JS sets "uBrainRegion" but GLSL has no declaration
- Orphan set: JS sets "uTierCutoff" but GLSL has no declaration
- Orphan set: JS sets "uStageBlend" but GLSL has no declaration
- Orphan set: JS sets "uTierMode" but GLSL has no declaration
- Orphan set: JS sets "shaderMorph" but GLSL has no declaration
- Orphan set: JS sets "uGaussianFalloff" but GLSL has no declaration
- Orphan set: JS sets "uCenterWeighting" but GLSL has no declaration