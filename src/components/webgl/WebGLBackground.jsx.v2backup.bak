// src/components/webgl/WebGLBackground.jsx
// ✅ SIMPLIFIED: Pure renderer with no decision logic

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stageAtom } from '../../stores/atoms/stageAtom.js';
import consciousnessEngine from '../../engine/ConsciousnessEngine.js';
import { getPointSpriteAtlasSingleton } from './consciousness/PointSpriteAtlas.js';
import SST_V2_CANONICAL from '../../config/canonical/sstV2Stages.jsx';

// Import shaders - ensure these paths are correct
import vertexShaderSource from '../../shaders/templates/consciousness-vertex.glsl?raw';
import fragmentShaderSource from '../../shaders/templates/consciousness-fragment.glsl?raw';

function WebGLBackground() {
  const meshRef = useRef();
  const geometryRef = useRef();
  const { size, gl } = useThree();
  
  // State
  const [blueprint, setBlueprint] = useState(null);
  const [atlasTexture, setAtlasTexture] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  
  // Stage data from atom
  const [stageData, setStageData] = useState({
    currentStage: 'genesis',
    nextStage: 'genesis',
    stageProgress: 0,
    stageBlend: 0
  });
  
  // ✅ MUST HAVE: Subscribe to stage changes
  useEffect(() => {
    const unsubscribe = stageAtom.subscribe((state) => {
      setStageData({
        currentStage: state.currentStage || 'genesis',
        nextStage: state.nextStage || state.currentStage || 'genesis',
        stageProgress: state.stageProgress || 0,
        stageBlend: state.stageBlend || 0
      });
    });
    
    return unsubscribe;
  }, []);
  
  // ✅ MUST HAVE: Create atlas texture once
  useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
    const texture = atlas.createWebGLTexture();
    setAtlasTexture(texture);
    
    return () => {
      // Atlas manages its own lifecycle
    };
  }, []);
  
  // ✅ MUST HAVE: Request blueprint from engine with error handling
  useEffect(() => {
    async function requestBlueprint() {
      try {
        const activeParticles = consciousnessEngine.getActiveParticleCount(stageData.currentStage);
        const data = await consciousnessEngine.generateConstellationParticleData(
          activeParticles,
          { stageName: stageData.currentStage }
        );
        
        if (data) {
          setBlueprint(data);
          setActiveCount(activeParticles);
          console.log(`✅ Renderer: Received blueprint for ${stageData.currentStage} (${activeParticles} particles)`);
        }
      } catch (error) {
        console.error('❌ Renderer: Blueprint generation failed', error);
        // Continue with previous blueprint if available
      }
    }
    
    requestBlueprint();
  }, [stageData.currentStage]);
  
  // ✅ MUST HAVE: Create pre-allocated geometry (17K max)
  const geometry = useMemo(() => {
    if (!blueprint) return null;
    
    const geo = new THREE.BufferGeometry();
    
    // ✅ NEW: Create particle index array for WebGL 1 compatibility
    const indexArray = new Float32Array(blueprint.maxParticles);
    for (let i = 0; i < blueprint.maxParticles; i++) {
      indexArray[i] = i;
    }
    
    // Set all attributes from blueprint
    geo.setAttribute('position', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(blueprint.atmosphericPositions, 3));
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(blueprint.allenAtlasPositions, 3));
    geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData, 1));
    geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData, 1));
    
    // ✅ NEW: Add particle index attribute
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(indexArray, 1));
    
    // Set initial draw range
    geo.setDrawRange(0, activeCount);
    
    // Store ref for dynamic updates
    geometryRef.current = geo;
    
    return geo;
  }, [blueprint, activeCount]);
  
  // ✅ MUST HAVE: Update draw range when active count changes
  useEffect(() => {
    if (geometryRef.current && activeCount > 0) {
      geometryRef.current.setDrawRange(0, activeCount);
    }
  }, [activeCount]);
  
  // ✅ MUST HAVE: Create shader material with all uniforms
  const material = useMemo(() => {
    if (!atlasTexture) return null;
    
    const currentStageData = SST_V2_CANONICAL.get.stageByName(stageData.currentStage);
    const nextStageData = SST_V2_CANONICAL.get.stageByName(stageData.nextStage);
    
    // ✅ FIX: Don't modify the fragment shader - use it as-is
    // The uniforms are already declared in the shader file
    const fragmentShader = fragmentShaderSource;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        // Time and progression
        uTime: { value: 0 },
        uStageProgress: { value: 0 },
        uStageBlend: { value: 0 },
        
        // Colors from SST
        uColorCurrent: { value: new THREE.Color(currentStageData.colors[0]) },
        uColorNext: { value: new THREE.Color(nextStageData.colors[0]) },
        
        // Atlas
        uAtlasTexture: { value: atlasTexture },
        uTotalSprites: { value: 16 },
        
        // Display
        uPointSize: { value: 30.0 },
        uDevicePixelRatio: { value: gl.getPixelRatio() },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        
        // Tier fade
        uTierCutoff: { value: activeCount },
        uFadeProgress: { value: 1.0 },
        
        // Depth fade
        uFadeNear: { value: 0.1 },
        uFadeFar: { value: 100.0 }
      },
      vertexShader: vertexShaderSource,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true
    });
  }, [atlasTexture, stageData.currentStage, stageData.nextStage, size, gl, activeCount]);
  
  // ✅ MUST HAVE: Update uniforms on resize
  useEffect(() => {
    if (material) {
      material.uniforms.uResolution.value.set(size.width, size.height);
      material.uniforms.uDevicePixelRatio.value = gl.getPixelRatio();
    }
  }, [size, material, gl]);
  
  // ✅ MUST HAVE: Animation frame updates
  useFrame((state) => {
    if (meshRef.current && material) {
      // Update time
      material.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Update stage progression
      material.uniforms.uStageProgress.value = stageData.stageProgress;
      material.uniforms.uStageBlend.value = stageData.stageBlend;
      
      // Keep tier cutoff at active count
      material.uniforms.uTierCutoff.value = activeCount;
      
      // Gentle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      
      // Update colors if needed
      const currentStageData = SST_V2_CANONICAL.get.stageByName(stageData.currentStage);
      const nextStageData = SST_V2_CANONICAL.get.stageByName(stageData.nextStage);
      
      if (currentStageData?.colors?.[0]) {
        material.uniforms.uColorCurrent.value.set(currentStageData.colors[0]);
      }
      if (nextStageData?.colors?.[0]) {
        material.uniforms.uColorNext.value.set(nextStageData.colors[0]);
      }
    }
  });
  
  // Don't render without data
  if (!geometry || !material || !blueprint) {
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