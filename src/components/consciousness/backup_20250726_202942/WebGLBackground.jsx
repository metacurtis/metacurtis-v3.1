// src/components/webgl/WebGLBackground.jsx
// SST v3.0 COMPLIANT – WebGL background with context‑loss handling, frame‑loop hardening,
// stage blending, uniform‑sphere distribution, and instrumentation.

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import consciousnessEngineDefault, { consciousnessEngine as namedEngine } from '@/engine/ConsciousnessEngine.js';
import { getPointSpriteAtlasSingleton } from '@/components/webgl/consciousness/PointSpriteAtlas.js';
import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import { SST_V3_CONFIG } from '@/config/sst3/sst-v3.0-config.js';
import { markFrame } from '@/utils/performance/Telemetry.js';
import { DEV_LOG } from '@/utils/featureFlags.js';

// Import shaders (raw sources)
import vertexShaderSource from '@/shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '@/shaders/templates/consciousness-fragment.glsl?raw';

function WebGLBackground({
  stage = 'genesis',
  morphProgress = 0,
  scrollProgress = 0
}) {
  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const { size, gl } = useThree();
  const contextLostRef = useRef(false);
  const [glEpoch, setGlEpoch] = useState(0);

  // Select stable engine instance
  const engine = useMemo(
    () => (namedEngine ?? consciousnessEngineDefault ?? globalThis.consciousnessEngine ?? null),
    []
  );

  // Print once
  useEffect(() => {
    if (DEV_LOG) {
      console.log('🔍 Engine ready', {
        hasEngine: !!engine,
        gen: !!engine?.generateConstellationParticleData
      });
    }
  }, [engine]);

  // Animated props -> refs (avoid re-render loops)
  const morphRef = useRef(morphProgress);
  const scrollRef = useRef(scrollProgress);
  useEffect(() => { morphRef.current = morphProgress; }, [morphProgress]);
  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  // Fallback particle count derivation
  const deriveParticleCount = (stageKey) => {
    const cfg = Canonical.stages[stageKey];
    const base = cfg?.particles ?? 2000;
    const q = engine?.currentQuality ?? 'HIGH';
    const mul = { LOW:0.4, MEDIUM:0.6, HIGH:0.9, ULTRA:1.0 }[q] ?? 0.9;
    return Math.min(Math.round(base * mul), Canonical.performance?.maxParticles ?? 15000);
  };

  // Mount instrumentation
  useEffect(() => {
    if (DEV_LOG) console.log('🎨 WebGLBackground mount, stage =', stage);
  }, [stage]);

  // Handle WebGL context loss/restoration
  useEffect(() => {
    if (!gl?.domElement) return;
    const onLost = (e) => { e.preventDefault?.(); contextLostRef.current = true; DEV_LOG && console.warn('🛑 WebGL context lost'); };
    const onRestored = () => { contextLostRef.current = false; DEV_LOG && console.info('✅ WebGL context restored'); setGlEpoch(v=>v+1); };
    const el = gl.domElement;
    el.addEventListener('webglcontextlost', onLost, false);
    el.addEventListener('webglcontextrestored', onRestored, false);
    return () => {
      el.removeEventListener('webglcontextlost', onLost);
      el.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);

  // State
  const [blueprint, setBlueprint] = useState(null);
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const tierHighlightsRef = useRef(new Float32Array([0,0,0,0]));
  const [_, forceTick] = useState(0); // micro rerender when highlights fade
  const [fusionState, setFusionState] = useState({ active:false, intensity:0, epicenter:new THREE.Vector3() });
  const lastMatKeyRef = useRef('');

  // Re-create atlas texture on epoch bump
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    setAtlasTexture(atlas.createWebGLTexture());
    DEV_LOG && console.log('🧩 Atlas texture (epoch', glEpoch, ') ready');
  }, [glEpoch]);

  // Blueprint per stage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cfg = Canonical.stages[stage];
      if (!cfg) return console.error('❌ Unknown stage:', stage);
      const count = engine?.getActiveParticleCount?.(stage) ?? cfg.particles?.total ?? deriveParticleCount(stage);
      const data = await engine?.generateConstellationParticleData?.(count, { stageName: stage });
      if (cancelled) return;
      if (data) {
        setBlueprint(data);
        setActiveCount(Math.min(data.activeCount ?? count, count));
        DEV_LOG && console.log(`✅ Blueprint for ${stage}: ${data.activeCount}/${count}`);
      } else {
        console.error('❌ No engine or generator; placeholder unsupported.');
      }
    }
    if (engine) load();
    return () => { cancelled = true; };
  }, [engine, stage, glEpoch]);

  // Build geometry
  const geometry = useMemo(() => {
    if (!blueprint) return null;
    const cap = blueprint.activeCount ?? activeCount;
    const geo = new THREE.BufferGeometry();
    const idx = new Float32Array(cap).map((_,i)=>i);
    geo.setAttribute('position', new THREE.BufferAttribute(blueprint.atmosphericPositions,3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(blueprint.atmosphericPositions,3));
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(blueprint.allenAtlasPositions,3));
    geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds,3));
    geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers,1));
    geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData,1));
    geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices,1));
    geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData,1));
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx,1));
    geo.setAttribute('behaviorData', new THREE.BufferAttribute(blueprint.behaviorData,3));
    geo.setAttribute('storyAffinity', new THREE.BufferAttribute(blueprint.storyAffinity,1));
    geo.setAttribute('memoryFragment', new THREE.BufferAttribute(blueprint.memoryFragment,1));
    geo.setAttribute('fusionMoment', new THREE.BufferAttribute(blueprint.fusionMoment,1));
    geo.setDrawRange(0, cap);
    geo.computeBoundingSphere();
    if (geo.boundingSphere) geo.boundingSphere.radius *= 2;
    geometryRef.current = geo;
    return geo;
  }, [blueprint, activeCount]);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setDrawRange(0, activeCount);
      DEV_LOG && console.log('✏️ drawRange set to', activeCount);
    }
  }, [activeCount]);

  // Uniforms
  const uniforms = useMemo(() => {
    if (!atlasTexture) return null;
    const sd = Canonical.stages[stage];
    if (!sd) return null;
    const idx = Canonical.stageOrder.indexOf(stage);
    const next = Canonical.stages[Canonical.stageOrder[Math.min(idx+1, Canonical.stageOrder.length-1)]];
    const grid = getPointSpriteAtlasSingleton().getGridSize?.() ?? 4;
    return {
      uTime:              { value:0 },
      uMorphProgress:     { value:morphProgress },
      uStageBlend:        { value:scrollProgress },
      uScrollProgress:    { value:scrollProgress },
      uWorldScale:        { value:sd.sceneScale ?? 6.0 },
      uSceneScale:        { value:4.5 },
      uColorCurrent:      { value:new THREE.Color(sd.colors[0]) },
      uColorNext:         { value:new THREE.Color(next.colors[0]) },
      uColorAccent1:      { value:new THREE.Color(sd.colors[1]||sd.colors[0]) },
      uColorAccent2:      { value:new THREE.Color(sd.colors[2]||sd.colors[0]) },
      uAtlasTexture:      { value:atlasTexture },
      uSpritesPerRow:     { value:grid },
      uTotalSprites:      { value:grid*grid },
      uPointSize:         { value:30 },
      uDevicePixelRatio:  { value:window?.devicePixelRatio||1 },
      uResolution:        { value:new THREE.Vector2(size.width,size.height) },
      uActiveCount:       { value:activeCount },
      uFadeProgress:      { value:1 },
      uEnableGaussian:    { value:Canonical.features?.gaussianFalloff?1:0 },
      uShimmerIntensity:  { value:1 },
      uFogDensity:        { value:0.02 },
      uTierHighlight:     { value:tierHighlightsRef.current },
      uHighlightStrength: { value:1 },
      uFusionActive:      { value:0 },
      uFusionIntensity:   { value:0 },
      uFusionEpicenter:   { value:new THREE.Vector3() },
      uStageIndex:        { value:idx },
      uBrainRegion:       { value:idx },
      // --- new uniforms (defaults; will be overridden in frame loop) ---
      uAnchorLockStrength:{ value:0.5 },
      uDriftAmplitude:    { value:0.3 },
      uAlphaCutoff:       { value:0.35 },
      uEdgeSoftness:      { value:0.08 }
    };
  }, [atlasTexture, stage, activeCount, size.width, size.height]);

  // Material
  const material = useMemo(() => {
    if (!uniforms) return null;
    const grid = getPointSpriteAtlasSingleton().getGridSize?.() ?? 4;
    const texId = atlasTexture?.uuid||'tex';
    const key = `${stage}|${grid}|${texId}|${activeCount}|${size.width}x${size.height}`;
    if (lastMatKeyRef.current===key && materialRef.current) return materialRef.current;
    lastMatKeyRef.current = key;
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:   vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      transparent:    true,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false,
      depthTest:      true
    });
    materialRef.current?.dispose?.();
    materialRef.current = mat;
    mat.uniformsNeedUpdate = true;
    DEV_LOG && console.log('🧪 Shader material built', key);
    return mat;
  }, [uniforms, atlasTexture, stage, activeCount, size.width, size.height]);

  // Handle resize
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    mat.uniforms.uResolution.value.set(size.width, size.height);
    mat.uniforms.uDevicePixelRatio.value = window?.devicePixelRatio||1;
    mat.uniformsNeedUpdate = true;
  }, [size.width, size.height]);

  // Frame loop
  useFrame((state) => {
    if (contextLostRef.current) return;
    const m = meshRef.current, mat = materialRef.current;
    if (!m || !mat || !m.rotation) return;

    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t;

    const mp = morphRef.current, sp = scrollRef.current;
    mat.uniforms.uMorphProgress.value    = mp;
    mat.uniforms.uScrollProgress.value   = sp;
    mat.uniforms.uStageBlend.value       = sp;
    mat.uniforms.uActiveCount.value      = activeCount;

    // Stage‑driven shader defaults
    const s = Canonical.stages[stage]?.shader || SST_V3_CONFIG.stages[stage]?.shader;
    if (s) {
      mat.uniforms.uWorldScale.value         = s.worldScale    ?? mat.uniforms.uWorldScale.value;
      mat.uniforms.uAnchorLockStrength.value = s.anchorLock    ?? mat.uniforms.uAnchorLockStrength.value;
      mat.uniforms.uDriftAmplitude.value     = s.drift         ?? mat.uniforms.uDriftAmplitude.value;
      mat.uniforms.uAlphaCutoff.value        = s.alphaCutoff   ?? mat.uniforms.uAlphaCutoff.value;
      mat.uniforms.uEdgeSoftness.value       = s.edgeSoftness  ?? mat.uniforms.uEdgeSoftness.value;
    }

    // Highlights & fusion
    mat.uniforms.uTierHighlight.value.set(tierHighlightsRef.current);
    mat.uniforms.uFusionActive.value    = fusionState.active ? 1 : 0;
    mat.uniforms.uFusionIntensity.value = fusionState.intensity;
    mat.uniforms.uFusionEpicenter.value.copy(fusionState.epicenter);

    // Camera motion
    const cam = Canonical.stages[stage]?.camera;
    if (cam?.movement === 'balletic_orbit') {
      m.rotation.y = Math.sin(t * 0.1) * 0.5;
      m.rotation.x = Math.sin(t * 0.2) * 0.1;
    } else if (cam?.movement === 'dramatic_pullback' && cam.shake) {
      const shake = Math.sin(t * 10) * 0.01;
      m.rotation.y = t * 0.02 + shake;
      m.rotation.x = shake * 0.5;
    } else if (cam?.movement === 'reverent_orbit') {
      m.rotation.y = t * 0.01;
      m.rotation.x = Math.sin(t * 0.2) * 0.05;
    } else {
      m.rotation.y = t * 0.02;
    }

    // Fusion fade guard
    if (fusionState.active && fusionState.intensity > 0) {
      const ni = Math.max(0, fusionState.intensity - 0.02);
      if (ni !== fusionState.intensity) {
        setFusionState(p => ({ ...p, intensity: ni, active: ni > 0.01 }));
      }
    }
  });

  // Tier highlighting system
  const highlightTiers = (tiers, intensity) => {
    const arr = tierHighlightsRef.current;
    if (tiers === 'all') arr.fill(intensity);
    else tiers.forEach(i => { if (i >= 0 && i < 4) arr[i] = intensity; });
    forceTick(t => t + 1);
    setTimeout(() => {
      arr.fill(0);
      forceTick(t => t + 1);
    }, 2000);
  };

  useEffect(() => {
    const h = e => e.detail?.tiers && e.detail?.intensity != null && highlightTiers(e.detail.tiers, e.detail.intensity);
    window.addEventListener('sst:tierHighlight', h);
    return () => window.removeEventListener('sst:tierHighlight', h);
  }, []);

  // Placeholder while loading
  if (!geometry || !material || !blueprint) {
    DEV_LOG && console.log('⏳ Waiting for resources', { blueprint:!!blueprint, geom:!!geometry, mat:!!material });
    return null;
  }

  return (
    <points
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

export default React.memo(WebGLBackground);

/*
SUGGESTIONS (not applied):
- Move `fusionState` to a ref to eliminate re-renders during fusion fade; only use state when UI needs it.
- Cache blueprints per (stage, quality) in a WeakMap to avoid regeneration when revisiting stages.
- Promote key shader parameters (e.g., uPointSize, uFogDensity) to props for live tuning without code changes.
- Debounce the resize uniform updates (e.g., 100ms) to prevent rapid DPR oscillations.
- Consider batching uniform updates via `gl.uniform*` calls for maximum performance in raw WebGL.
*/
