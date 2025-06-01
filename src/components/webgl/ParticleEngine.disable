// src/components/webgl/ParticleEngine.jsx - PROPERLY FIXED VERSION
import { useMemo } from 'react';

/**
 * ParticleEngine - React hooks for particle calculations
 */

/**
 * React hook to calculate particle positions
 * @param {number} count - Number of particles
 * @param {Object} fieldDimensions - Field dimensions
 * @returns {Float32Array} Particle positions
 */
export function useParticlePositions(count, fieldDimensions = { w: 14, h: 8, d: 7 }) {
  return useMemo(() => {
    console.log(`ParticleEngine: Calculating positions for ${count} particles`);

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * fieldDimensions.w;
      positions[i3 + 1] = (Math.random() * 2 - 1) * fieldDimensions.h;
      positions[i3 + 2] = (Math.random() * 2 - 1) * fieldDimensions.d;
    }

    return positions;
  }, [count, fieldDimensions.w, fieldDimensions.h, fieldDimensions.d]);
}

/**
 * React hook to calculate animation factors
 * @param {number} count - Number of particles
 * @returns {Object} Animation factors
 */
export function useAnimationFactors(count) {
  return useMemo(() => {
    console.log(`ParticleEngine: Calculating animation factors for ${count} particles`);

    const anim1 = new Float32Array(count * 4);
    const anim2 = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const i4 = i * 4;

      // Animation factors set 1
      anim1[i4] = 0.1 + Math.random() * 0.4; // speed
      anim1[i4 + 1] = Math.random() * Math.PI * 2; // phase
      anim1[i4 + 2] = Math.random(); // randomFactor1
      anim1[i4 + 3] = Math.random() * Math.PI * 2; // randomAngle

      // Animation factors set 2
      anim2[i4] = 0.4 + Math.random() * 0.6; // scaleMultiplier
      anim2[i4 + 1] = 0.2 + Math.random() * 0.4; // swirlFactor
      anim2[i4 + 2] = 0.3 + Math.random() * 0.7; // depthFactor
      anim2[i4 + 3] = 0.1 + Math.random() * 0.2; // noiseDisplacementScale
    }

    return { anim1, anim2 };
  }, [count]);
}

// Alternative: Pure utility functions (no React hooks)
/**
 * Pure function to calculate particle positions (no memoization)
 * @param {number} count - Number of particles
 * @param {Object} fieldDimensions - Field dimensions
 * @returns {Float32Array} Particle positions
 */
export function calculateParticlePositions(count, fieldDimensions = { w: 14, h: 8, d: 7 }) {
  console.log(`ParticleEngine: Calculating positions for ${count} particles`);

  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() * 2 - 1) * fieldDimensions.w;
    positions[i3 + 1] = (Math.random() * 2 - 1) * fieldDimensions.h;
    positions[i3 + 2] = (Math.random() * 2 - 1) * fieldDimensions.d;
  }

  return positions;
}

/**
 * Pure function to calculate animation factors (no memoization)
 * @param {number} count - Number of particles
 * @returns {Object} Animation factors
 */
export function calculateAnimationFactors(count) {
  console.log(`ParticleEngine: Calculating animation factors for ${count} particles`);

  const anim1 = new Float32Array(count * 4);
  const anim2 = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const i4 = i * 4;

    // Animation factors set 1
    anim1[i4] = 0.1 + Math.random() * 0.4; // speed
    anim1[i4 + 1] = Math.random() * Math.PI * 2; // phase
    anim1[i4 + 2] = Math.random(); // randomFactor1
    anim1[i4 + 3] = Math.random() * Math.PI * 2; // randomAngle

    // Animation factors set 2
    anim2[i4] = 0.4 + Math.random() * 0.6; // scaleMultiplier
    anim2[i4 + 1] = 0.2 + Math.random() * 0.4; // swirlFactor
    anim2[i4 + 2] = 0.3 + Math.random() * 0.7; // depthFactor
    anim2[i4 + 3] = 0.1 + Math.random() * 0.2; // noiseDisplacementScale
  }

  return { anim1, anim2 };
}

export default {
  useParticlePositions,
  useAnimationFactors,
  calculateParticlePositions,
  calculateAnimationFactors,
};
