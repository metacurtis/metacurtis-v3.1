# Shader Evidence

## JS uniform sets

- `src/components/webgl/WebGLBackground.jsx:332` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:334` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:339` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:456` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:495` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1037` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1038` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1058` sets **uBandFade**
- `src/components/webgl/WebGLBackground.jsx:1191` sets **shaderMorph**
- `src/components/webgl/WebGLBackground.jsx:1301` sets **uAtlasTexture**
- `src/components/webgl/WebGLBackground.jsx:1302` sets **uStageIndex**
- `src/components/webgl/WebGLBackground.jsx:1303` sets **uBrainRegion**
- `src/components/webgl/WebGLBackground.jsx:1304` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1306` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1307` sets **uDevicePixelRatio**
- `src/components/webgl/WebGLBackground.jsx:1318` sets **uBandHeight**
- `src/components/webgl/WebGLBackground.jsx:1322` sets **uColorCurrent**
- `src/components/webgl/WebGLBackground.jsx:1323` sets **uColorNext**
- `src/components/webgl/WebGLBackground.jsx:1324` sets **uColorAccent1**
- `src/components/webgl/WebGLBackground.jsx:1325` sets **uColorAccent2**
- `src/components/webgl/WebGLBackground.jsx:1327` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1328` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1413` sets **uTime**
- `src/components/webgl/WebGLBackground.jsx:1414` sets **uScrollProgress**
- `src/components/webgl/WebGLBackground.jsx:1415` sets **uStageBlend**
- `src/components/webgl/WebGLBackground.jsx:1416` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1417` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1529` sets **uActiveCount**
- `src/components/webgl/WebGLBackground.jsx:1530` sets **uTierCutoff**
- `src/components/webgl/WebGLBackground.jsx:1545` sets **uMorphProgress**
- `src/components/webgl/WebGLBackground.jsx:1546` sets **uStageProgress**
- `src/components/webgl/WebGLBackground.jsx:1558` sets **uPostMorphFreeze**
- `src/components/webgl/WebGLBackground.jsx:1575` sets **uPointSize**
- `src/components/webgl/WebGLBackground.jsx:1578` sets **uGaussianSigma**
- `src/components/webgl/WebGLBackground.jsx:1581` sets **uSpreadFactor**
- `src/components/webgl/WebGLBackground.jsx:1584` sets **uMorphType**
- `src/components/webgl/WebGLBackground.jsx:1587` sets **uPostMorphFreeze**
- `src/runtime/materialFactory.js:48` sets **uPointSize**
- `src/runtime/materialFactory.js:49` sets **uPointSize**
- `src/runtime/materialFactory.js:54` sets **uTierHighlight**

## GLSL uniforms

- **uAtlasTexture**:
  - `src/shaders/templates/consciousness-fragment.glsl:4`
- **uTime**:
  - `src/shaders/templates/consciousness-fragment.glsl:5`
  - `src/shaders/templates/consciousness-vertex.glsl:14`
- **uColorCurrent**:
  - `src/shaders/templates/consciousness-fragment.glsl:6`
  - `src/shaders/templates/consciousness-vertex.glsl:18`
- **uColorNext**:
  - `src/shaders/templates/consciousness-fragment.glsl:7`
  - `src/shaders/templates/consciousness-vertex.glsl:19`
- **uColorAccent1**:
  - `src/shaders/templates/consciousness-fragment.glsl:8`
- **uColorAccent2**:
  - `src/shaders/templates/consciousness-fragment.glsl:9`
- **uActiveCount**:
  - `src/shaders/templates/consciousness-fragment.glsl:10`
- **uFadeProgress**:
  - `src/shaders/templates/consciousness-fragment.glsl:11`
- **uGaussianSigma**:
  - `src/shaders/templates/consciousness-fragment.glsl:12`
- **uBandHeight**:
  - `src/shaders/templates/consciousness-fragment.glsl:13`
- **uBandFade**:
  - `src/shaders/templates/consciousness-fragment.glsl:14`
- **uMorphProgress**:
  - `src/shaders/templates/consciousness-vertex.glsl:15`
- **uScrollProgress**:
  - `src/shaders/templates/consciousness-vertex.glsl:16`
- **uPointSize**:
  - `src/shaders/templates/consciousness-vertex.glsl:17`
- **uTotalSprites**:
  - `src/shaders/templates/consciousness-vertex.glsl:20`
- **uDevicePixelRatio**:
  - `src/shaders/templates/consciousness-vertex.glsl:21`
- **uResolution**:
  - `src/shaders/templates/consciousness-vertex.glsl:22`
- **uAtmoFit**:
  - `src/shaders/templates/consciousness-vertex.glsl:23`
- **uTextFit**:
  - `src/shaders/templates/consciousness-vertex.glsl:24`
- **uMoveDampStart**:
  - `src/shaders/templates/consciousness-vertex.glsl:25`
- **uMoveDampStartY**:
  - `src/shaders/templates/consciousness-vertex.glsl:26`
- **uPostMorphFreeze**:
  - `src/shaders/templates/consciousness-vertex.glsl:27`
- **uSpreadFactor**:
  - `src/shaders/templates/consciousness-vertex.glsl:28`
- **uMorphType**:
  - `src/shaders/templates/consciousness-vertex.glsl:29`

## Mismatches

### JS sets a uniform missing in GLSL
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:334`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1038`
- **shaderMorph** at `src/components/webgl/WebGLBackground.jsx:1191`
- **uStageIndex** at `src/components/webgl/WebGLBackground.jsx:1302`
- **uBrainRegion** at `src/components/webgl/WebGLBackground.jsx:1303`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1328`
- **uStageBlend** at `src/components/webgl/WebGLBackground.jsx:1415`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1417`
- **uTierCutoff** at `src/components/webgl/WebGLBackground.jsx:1530`
- **uStageProgress** at `src/components/webgl/WebGLBackground.jsx:1546`
- **uTierHighlight** at `src/runtime/materialFactory.js:54`

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