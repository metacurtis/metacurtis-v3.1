import { useEffect, useRef } from 'react';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const BASELINE = Object.freeze({
  turbulence: 0.0,
  driftSpeed: 0.2,
  glowIntensity: 1.0,
  vertexGlow: 1.0,
  edgeFlicker: 1.0,
  pulseFrequency: 0.3,
  pulseAmplitude: 0.15,
});

const BEHAVIOR_TO_UNIFORM = Object.freeze({
  turbulence: 'uFlowTurbulence',
  driftSpeed: 'uDriftSpeed',
  glowIntensity: 'uGlowIntensity',
  vertexGlow: 'uVertexGlow',
  edgeFlicker: 'uEdgeFlicker',
  pulseFrequency: 'uPulseFrequency',
  pulseAmplitude: 'uPulseAmplitude',
});

const VISUAL_BEHAVIORS = Object.freeze({
  gentle_drift: {
    turbulence: 0.22,
    driftSpeed: 0.18,
    glowIntensity: 0.95,
    duration: 3200,
  },
  tier3_subtle_pulse: {
    vertexGlow: 1.8,
    pulseFrequency: 0.35,
    pulseAmplitude: 0.25,
    glowIntensity: 1.2,
    duration: 3600,
  },
  tier2_flicker_increase: {
    edgeFlicker: 1.8,
    turbulence: 0.35,
    glowIntensity: 1.05,
    duration: 2600,
  },
  tier3_sparkle: {
    vertexGlow: 2.6,
    glowIntensity: 1.6,
    pulseFrequency: 0.9,
    pulseAmplitude: 0.4,
    duration: 1400,
  },
  tier3_glow_pulse: {
    glowIntensity: 2.0,
    vertexGlow: 2.2,
    pulseFrequency: 0.55,
    pulseAmplitude: 0.45,
    duration: 4200,
  },
  settle_to_form: {
    turbulence: 0.05,
    driftSpeed: 0.05,
    glowIntensity: 0.85,
    vertexGlow: 1.0,
    edgeFlicker: 0.9,
    pulseFrequency: 0.2,
    pulseAmplitude: 0.05,
    duration: 3000,
  },
});

function applyUniform(uniforms, uniformName, value) {
  if (!uniforms || !uniformName) return;
  const target = uniforms[uniformName];
  if (!target) return;
  if (typeof target.value === 'number') {
    target.value = value;
  } else if (target.value && typeof target.value.setScalar === 'function') {
    target.value.setScalar(value);
  } else {
    target.value = value;
  }
}

export function useParticleChoreography(uniformsRef) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const uniforms = () => uniformsRef?.current || null;

    const restoreBaseline = () => {
      const u = uniforms();
      if (!u) return;
      Object.entries(BASELINE).forEach(([key, value]) => {
        const uniformKey = BEHAVIOR_TO_UNIFORM[key];
        if (uniformKey) applyUniform(u, uniformKey, value);
      });
    };

    const applyBehavior = (verb) => {
      const behavior = VISUAL_BEHAVIORS[verb];
      const u = uniforms();
      if (!behavior || !u) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      Object.entries(behavior).forEach(([key, value]) => {
        if (key === 'duration') return;
        const uniformKey = BEHAVIOR_TO_UNIFORM[key];
        if (!uniformKey) return;
        applyUniform(u, uniformKey, value);
      });

      const duration = behavior.duration ?? 2200;
      timeoutRef.current = setTimeout(() => {
        restoreBaseline();
        timeoutRef.current = null;
      }, duration);

      if (import.meta.env?.DEV) {
        console.log('[Particle Choreography] Applied behavior:', verb);
      }
    };

    const off = BeatBus.on?.(EVENTS.RENDER_DIRECTIVE, (payload = {}) => {
      if (payload?.source !== 'beat_visual') return;
      const verb = payload?.verb || payload?.behavior;
      if (!verb) return;
      applyBehavior(verb);
    });

    return () => {
      off?.();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [uniformsRef]);
}
