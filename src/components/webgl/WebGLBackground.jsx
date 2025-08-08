// src/components/webgl/WebGLBackground.jsx
// SST v3.0 COMPLIANT - Pure event-driven renderer

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import { Canonical } from '../../config/canonical/canonicalAuthority.js';
import BeatBus from '@orchestration/BeatBus';

// Import shaders
import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

// Define EVENTS locally to avoid import issues
const EVENTS = {
  BLUEPRINT_READY: 'BLUEPRINT_READY',
};

function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const meshRef = useRef();
  const geometryRef = useRef();
  const { size, gl } = useThree();

  // State
  const [blueprint, setBlueprint] = useState(null);
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);

  // Create atlas texture once
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);

    return () => {
      // Atlas manages its own lifecycle
    };
  }, []);

  // Subscribe to blueprint ready events
  useEffect(() => {
    const handleBlueprint = data => {
      const { blueprint, stage, quality, cached } = data;

      if (blueprint) {
        setBlueprint(blueprint);
        setActiveCount(blueprint.activeCount || blueprint.particleCount);
        console.log(
          `✅ Renderer: Received ${cached ? 'cached' : 'new'} blueprint for ${stage} (${blueprint.particleCount} particles, quality: ${quality})`
        );
      }
    };

    // Subscribe to blueprint updates
    const unsubscribe = BeatBus.on(EVENTS.BLUEPRINT_READY, handleBlueprint);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  // Create geometry with blueprint data
  const geometry = useMemo(() => {
    if (!blueprint) return null;

    const geo = new THREE.BufferGeometry();

    // Particle index array for WebGL 1 compatibility
    const indexArray = new Float32Array(blueprint.maxParticles);
    for (let i = 0; i < blueprint.maxParticles; i++) {
      indexArray[i] = i;
    }

    // Set all attributes
    geo.setAttribute('position', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute(
      'atmosphericPosition',
      new THREE.BufferAttribute(blueprint.atmosphericPositions, 3)
    );
    geo.setAttribute(
      'allenAtlasPosition',
      new THREE.BufferAttribute(blueprint.allenAtlasPositions, 3)
    );
    geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData, 1));
    geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData, 1));
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(indexArray, 1));

    // Set draw range
    geo.setDrawRange(0, activeCount);

    // Dispose old geometry if exists
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }

    // Store ref
    geometryRef.current = geo;

    return geo;
  }, [blueprint, activeCount]);

  // Update draw range when count changes
  useEffect(() => {
    if (geometryRef.current && activeCount > 0) {
      geometryRef.current.setDrawRange(0, activeCount);
    }
  }, [activeCount]);

  // Create shader material
  const material = useMemo(() => {
    if (!atlasTexture || !blueprint) return null;

    const stageData = Canonical.stages[blueprint.stageName];
    if (!stageData) return null;

    // Get next stage for blending
    const stageIndex = Canonical.stageOrder.indexOf(blueprint.stageName);
    const nextStageIndex = Math.min(stageIndex + 1, Canonical.stageOrder.length - 1);
    const nextStage = Canonical.stageOrder[nextStageIndex];
    const nextStageData = Canonical.stages[nextStage];

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        // Time and morphing
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uScrollProgress: { value: scrollProgress },

        // Colors from SST v3.0
        uColorCurrent: { value: new THREE.Color(stageData.colors[0]) },
        uColorNext: { value: new THREE.Color(nextStageData.colors[0]) },
        uColorAccent1: { value: new THREE.Color(stageData.colors[1] || stageData.colors[0]) },
        uColorAccent2: { value: new THREE.Color(stageData.colors[2] || stageData.colors[0]) },

        // Atlas
        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },

        // Display
        uPointSize: { value: 30.0 },
        uDevicePixelRatio: { value: gl.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },

        // Tier control
        uActiveCount: { value: activeCount },
        uFadeProgress: { value: 1.0 },

        // Effects from features
        uGaussianFalloff: { value: Canonical.features.gaussianFalloff ? 1.0 : 0.0 },
        uCenterWeighting: { value: Canonical.features.centerWeightingTier4 ? 1.0 : 0.0 },

        // Stage-specific
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

    // Force update flag
    mat.uniformsNeedUpdate = true;

    return mat;
  }, [atlasTexture, blueprint, morphProgress, scrollProgress, size, gl, activeCount]);

  // Update uniforms on resize
  useEffect(() => {
    if (material) {
      material.uniforms.uResolution.value.set(size.width, size.height);
      material.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
      material.uniformsNeedUpdate = true;
    }
  }, [size, material, gl]);

  // Animation frame
  useFrame(state => {
    if (meshRef.current && material && blueprint) {
      // Update time
      material.uniforms.uTime.value = state.clock.elapsedTime;

      // Update morph progress (ensure it's always current)
      material.uniforms.uMorphProgress.value = morphProgress;
      material.uniforms.uScrollProgress.value = scrollProgress;
      material.uniforms.uActiveCount.value = activeCount;

      // Stage-specific rotation
      const stageData = Canonical.stages[blueprint.stageName];
      const cameraConfig = stageData?.camera;

      if (cameraConfig?.movement === 'balletic_orbit') {
        // Harmony - figure-8 pattern
        const t = state.clock.elapsedTime * 0.1;
        meshRef.current.rotation.y = Math.sin(t) * 0.5;
        meshRef.current.rotation.x = Math.sin(t * 2) * 0.1;
      } else if (cameraConfig?.movement === 'dramatic_pullback' && cameraConfig?.shake) {
        // Velocity - shake effect
        const shake = Math.sin(state.clock.elapsedTime * 10) * 0.01;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.02 + shake;
        meshRef.current.rotation.x = shake * 0.5;
      } else if (cameraConfig?.movement === 'reverent_orbit') {
        // Transcendence - wide orbit
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.01;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      } else {
        // Default gentle rotation
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      }
    }
  });

  // Don't render without data
  if (!geometry || !material || !blueprint) {
    return null;
  }

  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}

export default React.memo(WebGLBackground);
