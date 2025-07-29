// src/engine/TierSystem.js
export const tierSystem = {
  metrics: { distributionsCalculated: 0 },

  distributeParticles(count, stageName) {
    const config = {
      genesis: [0.6, 0.2, 0.1, 0.1],
      discipline: [0.55, 0.25, 0.1, 0.1],
      neural: [0.55, 0.2, 0.15, 0.1],
      velocity: [0.45, 0.2, 0.15, 0.2],
      architecture: [0.5, 0.2, 0.15, 0.15],
      harmony: [0.5, 0.2, 0.15, 0.15],
      transcendence: [0.5, 0.2, 0.15, 0.15],
    };

    const ratios = config[stageName] || [0.5, 0.2, 0.15, 0.15];
    const tiers = [];

    for (let i = 0; i < 4; i++) {
      tiers.push({
        tier: i,
        count: Math.floor(count * ratios[i]),
        ratio: ratios[i],
      });
    }

    this.metrics.distributionsCalculated++;
    return { tiers, total: count };
  },

  applyTierBehavior(particle, stageName, rng) {
    const tier = particle.tier;
    const behaviors = [
      ['drift', 'none'],
      ['orbital', 'structural'],
      ['twinkle', 'pulse'],
      ['prominent', 'connected'],
    ];

    return {
      behaviors: behaviors[tier] || ['drift', 'none'],
      behaviorIntensity: 0.8 + rng() * 0.4,
      sizeMultiplier: [0.6, 0.8, 1.2, 1.5][tier],
      opacityRange: [
        [0.3, 0.6],
        [0.5, 0.8],
        [0.7, 0.9],
        [0.8, 1.0],
      ][tier],
      spriteIndex: Math.floor(rng() * 16),
      clustering: null,
      centerWeight: null,
    };
  },
};
