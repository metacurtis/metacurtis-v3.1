/**
 * Renderer ShaderMaterial creation and uniform initialization
 * Extracted from WebGLBackground.jsx (material bootstrap section).
 *
 * Responsibilities:
 * - Instantiate the renderer ShaderMaterial
 * - Seed core uniforms with canonical defaults
 * - Provide helpers to update or dispose the material safely
 */

import * as THREE from 'three';

const DEFAULT_FLOAT4 = () => new Float32Array([0, 0, 0, 0]);
const ensureColor = (color, fallbackHex = '#ffffff') => {
  if (color instanceof THREE.Color) return color.clone();
  if (Array.isArray(color) && color.length >= 3) {
    return new THREE.Color(color[0], color[1], color[2]);
  }
  if (typeof color === 'string') return new THREE.Color(color);
  return new THREE.Color(fallbackHex);
};

const ensurePaletteArray = (color) => {
  const c = ensureColor(color);
  return new Float32Array([c.r, c.g, c.b]);
};

/**
 * Create and configure the renderer ShaderMaterial.
 */
export const createRendererMaterial = ({
  vertexShader,
  fragmentShader,
  canonicalConfig = null,
  atlasTexture = null,
  stageIndex = 0,
  morphProgress = 0,
  stageProgress = 0,
  pointSize = 48,
  blueprintCount = 0,
  devicePixelRatio = 1,
  bandHeight = 0,
  gaussianSigma = 2.5,
  tierHighlight = -1,
  gridSpacing = [0.5, 0.5],
  flowTurbulence = 0,
  streakIntensity = 0,
  motionParams = [0, 0, 0, 0],
  totalSprites = 16,
  morphTypeDefault = 0,
  palette = {},
  resolution = new THREE.Vector2(1, 1),
  onBeforeCompile = () => {
    try {
      console.log('🧪 Shader compiled');
    } catch {
      /* noop */
    }
  },
  onLog = console.log,
}) => {
  if (!vertexShader || !fragmentShader) {
    throw new Error('createRendererMaterial requires vertexShader and fragmentShader');
  }

  const features = canonicalConfig?.features ?? canonicalConfig ?? {};
  const gaussianFalloff =
    Number.isFinite(features.gaussianFalloff) ? features.gaussianFalloff : 1.0;
  const centerWeighting =
    Number.isFinite(features.centerWeightingTier4) ? features.centerWeightingTier4 : 1.0;
  const pointSizeDefault = Number.isFinite(pointSize)
    ? pointSize
    : Number(features.pointSizeDefault) || 48.0;

  const paletteCurrent = ensureColor(palette.current, '#00ffcc');
  const paletteNext = ensureColor(palette.next, '#ffffff');
  const paletteAcc1 = ensureColor(palette.acc1, '#f59e0b');
  const paletteAcc2 = ensureColor(palette.acc2, '#f59e0b');

  const uniforms = {
    uTime: { value: 0 },
    uMorphProgress: { value: morphProgress },
    uScrollProgress: { value: 0 },
    uStageProgress: { value: stageProgress },
    uStageBlend: { value: 0 },
    uAtlasTexture: { value: atlasTexture },
    uTotalSprites: { value: totalSprites },
    uPointSize: { value: pointSizeDefault },
    uDevicePixelRatio: { value: devicePixelRatio },
    uResolution: { value: resolution.clone ? resolution.clone() : new THREE.Vector2(1, 1) },
    uAtmoFit: { value: new THREE.Vector2(1, 1) },
    uTextFit: { value: new THREE.Vector2(1, 1) },
    uMoveDampStart: { value: 0.96 },
    uMoveDampStartY: { value: 0.9 },
    uPostMorphFreeze: { value: 0.0 },
    uActiveCount: { value: blueprintCount },
    uTierCutoff: { value: blueprintCount || 15000 },
    uFadeProgress: { value: 1.0 },
    uGaussianSigma: { value: gaussianSigma },
    uBandHeight: { value: bandHeight },
    uBandFade: { value: 0 },
    uGaussianFalloff: { value: gaussianFalloff },
    uCenterWeighting: { value: centerWeighting },
    uStageIndex: { value: stageIndex },
    uBrainRegion: { value: stageIndex },
    uSpreadFactor: { value: 1.0 },
    uMorphType: { value: morphTypeDefault },
    uColorCurrent: { value: paletteCurrent },
    uColorNext: { value: paletteNext },
    uColorAccent1: { value: paletteAcc1 },
    uColorAccent2: { value: paletteAcc2 },
    uTierMode: { value: DEFAULT_FLOAT4() },
    uTierParams0: { value: DEFAULT_FLOAT4() },
    uTierParams1: { value: DEFAULT_FLOAT4() },
    uTierParams2: { value: DEFAULT_FLOAT4() },
    uTierParams3: { value: DEFAULT_FLOAT4() },
    uPalette0: { value: ensurePaletteArray(paletteCurrent) },
    uPalette1: { value: ensurePaletteArray(paletteAcc1) },
    uPalette2: { value: ensurePaletteArray(paletteAcc2) },
    uPalette3: { value: ensurePaletteArray(paletteNext) },
    uTierHighlight: { value: tierHighlight },
    uGridSpacing: { value: new Float32Array(gridSpacing) },
    uFlowTurbulence: { value: flowTurbulence },
    uStreakIntensity: { value: streakIntensity },
    uMotionMode: { value: 1 },
    uParticlePhase: { value: 0 },
    uMotionParams: {
      value:
        motionParams instanceof Float32Array
          ? motionParams
          : new Float32Array(motionParams ?? [0, 0, 0, 0]),
    },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  });

  material.onBeforeCompile = onBeforeCompile;

  if (typeof onLog === 'function') {
    try {
      onLog('[createRendererMaterial] Material initialized', {
        uniformCount: Object.keys(uniforms).length,
        transparent: material.transparent,
        blending: material.blending,
      });
    } catch {
      /* noop */
    }
  }

  return material;
};

/**
 * Update an existing material from canonical configuration values.
 */
export const updateMaterialFromConfig = (material, config = null) => {
  if (!material?.uniforms || !config) return;

  const uniforms = material.uniforms;
  const features = config?.features ?? config ?? {};
  let dirty = false;

  if (Number.isFinite(features.pointSizeDefault) && uniforms.uPointSize) {
    const next = Number(features.pointSizeDefault);
    if (uniforms.uPointSize.value !== next) {
      uniforms.uPointSize.value = next;
      dirty = true;
    }
  }

  if (Number.isFinite(features.gaussianFalloff) && uniforms.uGaussianFalloff) {
    const next = Number(features.gaussianFalloff);
    if (uniforms.uGaussianFalloff.value !== next) {
      uniforms.uGaussianFalloff.value = next;
      dirty = true;
    }
  }

  if (Number.isFinite(features.centerWeightingTier4) && uniforms.uCenterWeighting) {
    const next = Number(features.centerWeightingTier4);
    if (uniforms.uCenterWeighting.value !== next) {
      uniforms.uCenterWeighting.value = next;
      dirty = true;
    }
  }

  if (dirty) {
    material.uniformsNeedUpdate = true;
  }
};

/**
 * Dispose material and clean up resources.
 */
export const disposeMaterial = (material) => {
  if (!material) return;
  try {
    material.dispose?.();
  } catch {
    /* noop */
  }
};
