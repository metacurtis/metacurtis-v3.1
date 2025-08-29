// src/components/webgl/CTFOverlay.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import BeatBus from '@/modules/orchestration/core/BeatBus.js';
import { EVENTS } from '@/theater/events.js';

export default function CTFOverlay() {
  const meshRef = useRef();
  const [formation, setFormation] = useState(null);
  const opacityRef = useRef(1.0);
  const timeRef = useRef(0);
  
  useEffect(() => {
    console.log('CTFOverlay mounted, listening for CTF_READY');
    
    const handleCTF = (payload) => {
      console.log('CTF_READY received:', payload);
      const data = payload?.formation || payload?.blueprint || payload;
      if (data?.positions) {
        setFormation(data);
        opacityRef.current = 1.0;
        timeRef.current = 0;
      }
    };
    
    const handleHide = () => {
      console.log('CTF hiding');
      opacityRef.current = 0;
      setTimeout(() => setFormation(null), 1000);
    };
    
    const off1 = BeatBus.on(EVENTS.CTF_READY, handleCTF);
    const off2 = BeatBus.on(EVENTS.CTF_HIDE, handleHide);
    
    return () => {
      off1?.();
      off2?.();
    };
  }, []);

  // Create geometry with proper positions
  const geometry = useMemo(() => {
    if (!formation || !formation.positions) return null;
    
    const geo = new THREE.BufferGeometry();
    const count = formation.count || formation.particleCount || 2000;
    
    // Create expanded positions for visibility
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = formation.positions[i] * 2; // Scale up for visibility
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Add animation seeds
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds[i * 3] = Math.random();
      seeds[i * 3 + 1] = Math.random();
      seeds[i * 3 + 2] = Math.random();
    }
    geo.setAttribute('seeds', new THREE.BufferAttribute(seeds, 3));
    
    return geo;
  }, [formation]);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      timeRef.current += delta;
      
      // Animate particles emerging from text
      const material = meshRef.current.material;
      material.uniforms.uTime.value = timeRef.current;
      material.uniforms.uOpacity.value += (opacityRef.current - material.uniforms.uOpacity.value) * delta * 2;
      
      // Slight rotation for visual interest
      meshRef.current.rotation.y = Math.sin(timeRef.current * 0.2) * 0.05;
    }
  });
  
  if (!geometry) return null;

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color(0x00ff00) }
    },
    vertexShader: `
      attribute vec3 seeds;
      varying float vAlpha;
      uniform float uTime;
      
      void main() {
        vec3 pos = position;
        
        // Emergence animation
        float emergence = min(uTime * 0.5, 1.0);
        pos.y += sin(uTime + seeds.x * 6.28) * 2.0 * emergence;
        pos.x += cos(uTime * 0.7 + seeds.y * 6.28) * 1.0 * emergence;
        pos.z += sin(uTime * 0.5 + seeds.z * 6.28) * 0.5 * emergence;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = 12.0 * (1.0 + seeds.x * 0.5);
        
        vAlpha = 1.0 - smoothstep(0.0, 100.0, -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(uColor, alpha * vAlpha * uOpacity);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return (
    <points 
      ref={meshRef} 
      geometry={geometry}
      material={shaderMaterial}
      frustumCulled={false} 
      renderOrder={9999}
    />
  );
}