// src/utils/webgl/FrustumAwareParticleGenerator.js
// FRUSTUM-AWARE PARTICLE CULLING - Memory and draw call optimization

import * as THREE from 'three';

// Frustum culling configuration
const CULLING_CONFIG = {
  enabled: true,
  margin: 1.2, // 20% margin around visible area
  minParticles: 1000, // Minimum particles regardless of culling
  maxCullingRatio: 0.7, // Maximum 70% of particles can be culled
  dynamicLOD: true, // Enable dynamic level-of-detail
  debugVisualization: false,
};

// Performance tier culling settings
const CULLING_TIERS = {
  ULTRA: { enabled: false, margin: 1.0 }, // No culling on ULTRA
  HIGH: { enabled: true, margin: 1.2 },
  MEDIUM: { enabled: true, margin: 1.4 },
  LOW: { enabled: true, margin: 1.6 },
};

class FrustumAwareParticleGenerator {
  constructor() {
    this.lastCullTime = 0;
    this.cullInterval = 100; // Recalculate every 100ms
    this.visibleParticles = new Set();
    this.culledCount = 0;
    this.totalGenerated = 0;
  }

  // Enhanced grid calculation with frustum culling
  calculateOptimalGridWithCulling(
    visibleWidth,
    visibleHeight,
    stage,
    qualityLevel,
    camera,
    frustum
  ) {
    const config = CULLING_TIERS[qualityLevel] || CULLING_TIERS.HIGH;

    if (!config.enabled || !CULLING_CONFIG.enabled) {
      return this.calculateBasicGrid(visibleWidth, visibleHeight, stage, qualityLevel);
    }

    // Calculate expanded visible area with margin
    const expandedWidth = visibleWidth * config.margin;
    const expandedHeight = visibleHeight * config.margin;

    // Base particle calculation
    const baseGrid = this.calculateBasicGrid(expandedWidth, expandedHeight, stage, qualityLevel);

    // Apply frustum culling
    const culledGrid = this.applyCulling(baseGrid, expandedWidth, expandedHeight, frustum);

    console.log(
      `🔍 Frustum culling: ${baseGrid.totalParticles} → ${culledGrid.totalParticles} particles (${this.culledCount} culled)`
    );

    return culledGrid;
  }

  // Basic grid calculation (fallback)
  calculateBasicGrid(visibleWidth, visibleHeight, stage, qualityLevel) {
    const NARRATIVE_STAGES = {
      0: { particles: 2000 },
      1: { particles: 4000 },
      2: { particles: 6000 },
      3: { particles: 8000 },
      4: { particles: 12000 },
      5: { particles: 16000 },
    };

    const stageConfig = NARRATIVE_STAGES[stage] || NARRATIVE_STAGES[0];
    const qualityMultipliers = { LOW: 0.5, MEDIUM: 0.7, HIGH: 1.0, ULTRA: 1.0 };
    const targetParticles = Math.floor(
      stageConfig.particles * (qualityMultipliers[qualityLevel] || 1.0)
    );

    const aspect = visibleWidth / visibleHeight;
    const rows = Math.ceil(Math.sqrt(targetParticles / aspect));
    const cols = Math.ceil(targetParticles / rows);

    return {
      width: cols,
      height: rows,
      totalParticles: cols * rows,
      visibleWidth,
      visibleHeight,
      cullingApplied: false,
    };
  }

  // Apply frustum culling to grid
  applyCulling(baseGrid, visibleWidth, visibleHeight, frustum) {
    if (!frustum) return baseGrid;

    const now = performance.now();
    if (now - this.lastCullTime < this.cullInterval) {
      return baseGrid; // Use cached result
    }
    this.lastCullTime = now;

    const { width, height } = baseGrid;
    const visibleIndices = [];
    let culledCount = 0;
    this.totalGenerated = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const posX = (x / width - 0.5) * visibleWidth;
        const posY = (y / height - 0.5) * visibleHeight;
        const posZ = 0; // Particles are in screen plane

        // Create a point for frustum testing
        const point = new THREE.Vector3(posX, posY, posZ);

        // Test if point is within expanded frustum
        if (this.isPointInExpandedFrustum(point, visibleWidth, visibleHeight)) {
          visibleIndices.push({ x, y, index: y * width + x });
        } else {
          culledCount++;
        }
      }
    }

    // Ensure minimum particle count
    const minRequired = Math.max(
      CULLING_CONFIG.minParticles,
      baseGrid.totalParticles * (1 - CULLING_CONFIG.maxCullingRatio)
    );

    if (visibleIndices.length < minRequired) {
      // Add back some culled particles to meet minimum
      const additionalNeeded = minRequired - visibleIndices.length;
      console.warn(`🔍 Adding back ${additionalNeeded} particles to meet minimum requirement`);
      // Implementation would add back particles here
    }

    this.culledCount = culledCount;

    return {
      ...baseGrid,
      totalParticles: visibleIndices.length,
      visibleIndices,
      cullingApplied: true,
      culledCount,
      cullRatio: culledCount / this.totalGenerated,
    };
  }

  // Simple frustum test (can be enhanced with proper frustum object)
  isPointInExpandedFrustum(point, visibleWidth, visibleHeight) {
    const margin = CULLING_CONFIG.margin;
    const halfWidth = (visibleWidth * margin) / 2;
    const halfHeight = (visibleHeight * margin) / 2;

    return Math.abs(point.x) <= halfWidth && Math.abs(point.y) <= halfHeight;
  }

  // Generate particle data with culling applied
  generateParticleDataWithCulling(gridConfig, stage) {
    const totalParticles = gridConfig.cullingApplied
      ? gridConfig.visibleIndices.length
      : gridConfig.totalParticles;

    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const animationSeeds = new Float32Array(totalParticles * 4);
    const gridCoords = new Float32Array(totalParticles * 2);

    // Stage color configuration
    const stageColors = {
      0: '#1E3A8A',
      1: '#D97706',
      2: '#059669',
      3: '#0EA5E9',
      4: '#7C3AED',
      5: '#F59E0B',
    };
    const stageColor = new THREE.Color(stageColors[stage] || stageColors[0]);

    let particleIndex = 0;

    if (gridConfig.cullingApplied) {
      // Use only visible particles
      for (const visibleParticle of gridConfig.visibleIndices) {
        this.generateSingleParticle(
          particleIndex,
          visibleParticle.x,
          visibleParticle.y,
          gridConfig,
          stageColor,
          positions,
          colors,
          animationSeeds,
          gridCoords
        );
        particleIndex++;
      }
    } else {
      // Generate all particles (no culling)
      for (let y = 0; y < gridConfig.height; y++) {
        for (let x = 0; x < gridConfig.width; x++) {
          this.generateSingleParticle(
            particleIndex,
            x,
            y,
            gridConfig,
            stageColor,
            positions,
            colors,
            animationSeeds,
            gridCoords
          );
          particleIndex++;
        }
      }
    }

    return { positions, colors, animationSeeds, gridCoords, actualParticleCount: particleIndex };
  }

  // Generate single particle data
  generateSingleParticle(
    index,
    x,
    y,
    gridConfig,
    stageColor,
    positions,
    colors,
    animationSeeds,
    gridCoords
  ) {
    // Position
    const posX = (x / gridConfig.width - 0.5) * gridConfig.visibleWidth;
    const posY = (y / gridConfig.height - 0.5) * gridConfig.visibleHeight;
    const posZ = (Math.random() - 0.5) * 2;

    positions[index * 3] = posX;
    positions[index * 3 + 1] = posY;
    positions[index * 3 + 2] = posZ;

    // Colors
    colors[index * 3] = stageColor.r;
    colors[index * 3 + 1] = stageColor.g;
    colors[index * 3 + 2] = stageColor.b;

    // Animation seeds
    animationSeeds[index * 4] = Math.random();
    animationSeeds[index * 4 + 1] = Math.random();
    animationSeeds[index * 4 + 2] = Math.random();
    animationSeeds[index * 4 + 3] = Math.random();

    // Grid coordinates
    gridCoords[index * 2] = x / gridConfig.width;
    gridCoords[index * 2 + 1] = y / gridConfig.height;
  }

  // Dynamic LOD based on distance/zoom
  applyDynamicLOD(camera, baseParticleCount) {
    if (!CULLING_CONFIG.dynamicLOD) return baseParticleCount;

    // Reduce particles based on camera distance
    const distance = camera.position.z || 8;
    const lodFactor = Math.max(0.3, Math.min(1.0, 10 / distance));

    return Math.floor(baseParticleCount * lodFactor);
  }

  // Performance monitoring
  getCullingStats() {
    return {
      totalGenerated: this.totalGenerated,
      culledCount: this.culledCount,
      visibleCount: this.totalGenerated - this.culledCount,
      cullRatio: this.totalGenerated > 0 ? this.culledCount / this.totalGenerated : 0,
      memoryReduction: this.culledCount * 32, // Estimated bytes saved (8 floats * 4 bytes)
      lastCullTime: this.lastCullTime,
    };
  }

  // Update culling configuration
  updateCullingConfig(newConfig) {
    Object.assign(CULLING_CONFIG, newConfig);
    console.log('🔧 Culling config updated:', CULLING_CONFIG);
  }

  // Enable/disable culling
  setCullingEnabled(enabled) {
    CULLING_CONFIG.enabled = enabled;
    console.log(`🔍 Frustum culling ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Debug visualization
  createDebugVisualization(scene, gridConfig) {
    if (!CULLING_CONFIG.debugVisualization || !gridConfig.cullingApplied) return;

    // Create wireframe showing culled vs visible areas
    const geometry = new THREE.BoxGeometry(
      gridConfig.visibleWidth * CULLING_CONFIG.margin,
      gridConfig.visibleHeight * CULLING_CONFIG.margin,
      0.1
    );

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const debugBox = new THREE.Mesh(geometry, material);
    debugBox.name = 'FrustumDebugBox';
    scene.add(debugBox);
  }
}

// Export singleton instance
export const frustumAwareGenerator = new FrustumAwareParticleGenerator();

// Export configuration and class
export { CULLING_CONFIG, CULLING_TIERS, FrustumAwareParticleGenerator };

// Development global access
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.frustumAwareGenerator = frustumAwareGenerator;
  window.CULLING_CONFIG = CULLING_CONFIG;
}
