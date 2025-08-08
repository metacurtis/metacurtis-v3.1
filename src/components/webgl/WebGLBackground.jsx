// src/components/webgl/WebGLBackground.jsx
// SST v3.0 COMPLIANT - Pure event-driven renderer
// Accepts both full blueprints (atmospheric/allen arrays) and "emergence" minimal blueprints (positions/tiers)

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import BeatBus from '../../../modules/orchestration/core/BeatBus.js';
import { EVENTS } from '../../theater/events.js';

// Shaders (must expose attributes: position/particleIndex/tierData + uniforms used below)
import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

// --- helpers ----------------------------------------------------

function pickStageColors(stageName) {
  const s = Canonical?.stages?.[stageName] || {};
  const colors = s.colors || ['#00ffcc', '#f59e0b', '#ffffff'];
  return {
    current: new THREE.Color(colors[0]),
    next: new THREE.Color(
      (Canonical?.stages?.[
        Canonical?.stageOrder?.[
          Math.min(
            (Canonical?.stageOrder || []).indexOf(stageName),
            (Canonical?.stageOrder || []).length - 1
          ) + 1
        ]
      ]?.colors || [colors[0]])[0]
    ),
    acc1: new THREE.Color(colors[1] || colors[0]),
    acc2: new THREE.Color(colors[2] || colors[0]),
  };
}

function normalizePayload(payload) {
  // Accept either {blueprint, stage, ...} or direct blueprint
  const bp = payload?.blueprint ?? payload;
  const stageName = bp?.stageName || bp?.stage || payload?.stage || 'genesis';
  const quality = payload?.quality || 'HIGH';
  const cached = !!payload?.cached;

  return { bp, stageName, quality, cached };
}

function ensureArraysFromEmergence(bp) {
  // If this is a minimal emergence blueprint (positions/tiers), synthesize required arrays.
  if (bp.atmosphericPositions && bp.allenAtlasPositions) return bp; // already full

  const positions = bp.positions; // Float32Array (count * 3)
  if (!positions) return bp; // nothing to normalize

  const count = bp.count ?? (positions.length / 3) | 0;
  const tiersU8 = bp.tiers || new Uint8Array(count); // default Tier 0

  // Map tiers -> sizes/opacity/atlas index (Genesis spec)
  const sizeByTier = [0.6, 0.8, 1.2, 1.5];
  const opacityByTier = [0.5, 0.6, 0.75, 0.9];
  const atlasByTier = [7, 1, 4, 1]; // T1 sprite 7 (soft glow), T2 gradient(1), T3 diamond(4), T4 gradient(1)

  const sizeMultipliers = new Float32Array(count);
  const opacityData = new Float32Array(count);
  const atlasIndices = new Float32Array(count);
  const tierData = new Float32Array(count);
  const animationSeeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = tiersU8[i] | 0;
    tierData[i] = t;
    sizeMultipliers[i] = sizeByTier[t] || 1.0;
    opacityData[i] = opacityByTier[t] || 0.8;
    atlasIndices[i] = atlasByTier[t] || 1;
    const r = Math.random,
      j = i * 3;
    animationSeeds[j + 0] = r();
    animationSeeds[j + 1] = r();
    animationSeeds[j + 2] = r();
  }

  // For emergence we start with text plane; use same array for both positions
  const atmosphericPositions = positions;
  const allenAtlasPositions = positions.slice ? positions.slice() : new Float32Array(positions); // duplicate buffer

  return {
    ...bp,
    stageName: bp.stageName || 'genesis',
    maxParticles: count,
    particleCount: count,
    activeCount: count,
    atmosphericPositions,
    allenAtlasPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
  };
}

// --- component --------------------------------------------------

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const { size, gl } = useThree();

  // State
  const [blueprint, setBlueprint] = useState(null);
  const [stageName, setStageName] = useState('genesis');
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // Atlas once
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);
  }, []);

  // Subscribe to BLUEPRINT_READY
  useEffect(() => {
    const off = BeatBus.on(EVENTS.BLUEPRINT_READY, payload => {
      const { bp: raw, stageName: st, quality, cached } = normalizePayload(payload);
      const bp = ensureArraysFromEmergence(raw);
      if (!bp) return;

      setBlueprint(bp);
      setStageName(bp.stageName || st || 'genesis');
      setActiveCount(bp.activeCount || bp.particleCount || bp.maxParticles || 0);

      console.log(
        `✅ Renderer: ${cached ? 'cached' : 'new'} BLUEPRINT_READY`,
        `stage=${bp.stageName || st}, count=${bp.particleCount || bp.maxParticles || bp.count}, quality=${quality}`
      );

      // If this is "emergence", confirm once spawned (spec allows a short grace)
      if (bp.mode === 'emergence') {
        // small lerp window; Director has a 4s fallback
        setTimeout(() => {
          BeatBus.emit(EVENTS.PARTICLES_EMERGED);
        }, 1200);
      }
    });

    return () => off && off();
  }, []);

  // Geometry
  const geometry = useMemo(() => {
    if (!blueprint) return null;

    const count =
      blueprint.maxParticles ||
      blueprint.particleCount ||
      blueprint.activeCount ||
      (blueprint.positions ? (blueprint.positions.length / 3) | 0 : 0);

    if (!count) return null;

    const geo = new THREE.BufferGeometry();

    // Position streams (required)
    const atmos = blueprint.atmosphericPositions;
    const allen = blueprint.allenAtlasPositions;

    if (!atmos || !allen) return null;

    geo.setAttribute('position', new THREE.BufferAttribute(atmos, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(atmos, 3));
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(allen, 3));

    // Optional / synthesized streams
    if (blueprint.animationSeeds)
      geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    if (blueprint.sizeMultipliers)
      geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    if (blueprint.opacityData)
      geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData, 1));
    if (blueprint.atlasIndices)
      geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    if (blueprint.tierData)
      geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData, 1));

    // Particle index for GL1 paths
    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));

    geo.setDrawRange(0, activeCount || count);

    // Dispose previous
    if (geometryRef.current) geometryRef.current.dispose();
    geometryRef.current = geo;
    return geo;
  }, [blueprint, activeCount]);

  // Material
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const { current, next, acc1, acc2 } = pickStageColors(stageName);
    const stageIndex = Math.max(0, (Canonical?.stageOrder || []).indexOf(stageName));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        // Time & morph
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },

        // Colors
        uColorCurrent: { value: current },
        uColorNext: { value: next },
        uColorAccent1: { value: acc1 },
        uColorAccent2: { value: acc2 },

        // Atlas
        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },

        // Display
        uPointSize: { value: 30.0 },
        uDevicePixelRatio: { value: gl.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },

        // Tier & fade
        uActiveCount: { value: activeCount },
        uFadeProgress: { value: 1.0 },

        // Feature toggles
        uGaussianFalloff: { value: Canonical?.features?.gaussianFalloff ? 1.0 : 0.0 },
        uCenterWeighting: { value: Canonical?.features?.centerWeightingTier4 ? 1.0 : 0.0 },

        // Stage meta
        uStageIndex: { value: stageIndex },
        uBrainRegion: { value: stageIndex },
      },
      vertexShader: vertexShaderSource,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    mat.uniformsNeedUpdate = true;
    materialRef.current = mat;
    return mat;
  }, [atlasTexture, blueprint, stageName, morphProgress, scrollProgress, size, gl, activeCount]);

  // On resize
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
    materialRef.current.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    materialRef.current.uniformsNeedUpdate = true;
  }, [size, gl]);

  // RAF
  useFrame(state => {
    const mat = materialRef.current;
    if (!meshRef.current || !mat || !blueprint) return;

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uMorphProgress.value = morphProgress;
    mat.uniforms.uScrollProgress.value = scrollProgress;
    mat.uniforms.uActiveCount.value = activeCount;

    // Camera choreography hints (optional, harmless if undefined)
    const camCfg = Canonical?.stages?.[stageName]?.camera;
    if (camCfg?.movement === 'balletic_orbit') {
      const t = state.clock.elapsedTime * 0.1;
      meshRef.current.rotation.y = Math.sin(t) * 0.5;
      meshRef.current.rotation.x = Math.sin(t * 2) * 0.1;
    } else if (camCfg?.movement === 'dramatic_pullback' && camCfg?.shake) {
      const shake = Math.sin(state.clock.elapsedTime * 10) * 0.01;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02 + shake;
      meshRef.current.rotation.x = shake * 0.5;
    } else if (camCfg?.movement === 'reverent_orbit') {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    } else {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  if (!geometry || !material || !blueprint) return null;

  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}

export default React.memo(WebGLBackground);
