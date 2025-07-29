import * as THREE from 'three';
// src/orchestration/ShaderUniformController.js
// Animate shader uniforms based on timeline events

import { beatBus, Events } from './BeatBus';
import { SST_V3_CONFIG } from '@/config/sst3/sst-v3.0-config.js';

class ShaderUniformController {
  constructor(getMaterial) {
    this.getMaterial = getMaterial;
    this.tweens = new Map();
    this.rafId = null;

    // Subscribe to events
    this.unsubscribers = [
      beatBus.on(Events.SHADER_UPDATE, this.handleUpdate),
      beatBus.on(Events.SHADER_TWEEN, this.handleTween),
      beatBus.on(Events.SEGMENT_START, this.handleSegmentStart),
      beatBus.on(Events.STAGE_CHANGE, this.handleStageChange),
    ];

    this.startAnimationLoop();
  }

  handleUpdate = uniforms => {
    const material = this.getMaterial();
    if (!material?.uniforms) return;

    Object.entries(uniforms).forEach(([key, value]) => {
      if (material.uniforms[key]) {
        material.uniforms[key].value = value;
      }
    });
  };

  handleTween = ({ uniform, to, duration = 1000, ease = 'easeInOut' }) => {
    const material = this.getMaterial();
    if (!material?.uniforms?.[uniform]) return;

    const from = material.uniforms[uniform].value;
    const startTime = Date.now();

    this.tweens.set(uniform, {
      from,
      to,
      duration,
      startTime,
      ease: this.getEaseFunction(ease),
    });
  };

  handleSegmentStart = ({ segment }) => {
    // Apply accent color if specified
    if (segment.accentColor) {
      this.handleTween({
        uniform: 'uColorAccent1',
        to: new THREE.Color(segment.accentColor),
        duration: 800,
      });
    }
  };

  handleStageChange = ({ stage }) => {
    const stageConfig = SST_V3_CONFIG.stages[stage];
    if (!stageConfig?.shader) return;

    // Apply stage defaults
    Object.entries(stageConfig.shader).forEach(([key, value]) => {
      const uniformKey = key.startsWith('u')
        ? key
        : `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
      this.handleUpdate({ [uniformKey]: value });
    });
  };

  getEaseFunction(ease) {
    const easings = {
      linear: t => t,
      easeIn: t => t * t,
      easeOut: t => t * (2 - t),
      easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    };
    return easings[ease] || easings.easeInOut;
  }

  updateTweens = () => {
    const material = this.getMaterial();
    if (!material?.uniforms) return;

    const now = Date.now();
    const completedTweens = [];

    this.tweens.forEach((tween, uniform) => {
      const elapsed = now - tween.startTime;
      const progress = Math.min(elapsed / tween.duration, 1);
      const easedProgress = tween.ease(progress);

      const currentValue = material.uniforms[uniform].value;

      if (typeof tween.from === 'number') {
        // Number interpolation
        material.uniforms[uniform].value = tween.from + (tween.to - tween.from) * easedProgress;
      } else if (currentValue.isColor) {
        // Color interpolation
        currentValue.copy(tween.from).lerp(tween.to, easedProgress);
      } else if (currentValue.isVector2 || currentValue.isVector3) {
        // Vector interpolation
        currentValue.lerpVectors(tween.from, tween.to, easedProgress);
      }

      if (progress >= 1) {
        completedTweens.push(uniform);
      }
    });

    // Remove completed tweens
    completedTweens.forEach(uniform => this.tweens.delete(uniform));
  };

  startAnimationLoop = () => {
    const animate = () => {
      this.updateTweens();
      this.rafId = requestAnimationFrame(animate);
    };
    animate();
  };

  dispose() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.unsubscribers.forEach(unsub => unsub());
    this.tweens.clear();
  }
}

export default ShaderUniformController;
