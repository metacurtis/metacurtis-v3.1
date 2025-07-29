// src/components/webgl/consciousness/PointSpriteAtlas.js
// 🎨 POINT-SPRITE ATLAS GENERATOR - MetaCurtis Brain Morphing Enhancement
// ✅ CHECKPOINT 1B: Complete 256×256 texture atlas with contextual sprite selection

import * as THREE from 'three';

export class PointSpriteAtlas {
  constructor() {
    this.atlasSize = 256;
    this.spriteSize = 64; // 4×4 grid = 16 sprites
    this.spritesPerRow = 4;
    this.totalSprites = 16;

    this.canvas = null;
    this.ctx = null;
    this.texture = null;
    this.indexCache = new Map(); // ✅ Performance: Pre-cached indices

    if (import.meta.env.DEV) {
      console.log('🎨 PointSpriteAtlas: Initializing 256×256 atlas with 16 contextual sprites');
    }
  }

  // Generate the complete 256×256 atlas texture
  generateAtlas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.atlasSize;
    this.canvas.height = this.atlasSize;
    this.ctx = this.canvas.getContext('2d');

    // Clear with transparent background
    this.ctx.clearRect(0, 0, this.atlasSize, this.atlasSize);

    // Generate 16 different particle sprites in 4×4 grid
    for (let i = 0; i < this.totalSprites; i++) {
      const row = Math.floor(i / this.spritesPerRow);
      const col = i % this.spritesPerRow;
      const x = col * this.spriteSize;
      const y = row * this.spriteSize;

      this.generateSprite(i, x, y);
    }

    if (import.meta.env.DEV) {
      console.log(
        '✅ PointSpriteAtlas: Generated 256×256 atlas with 16 consciousness-themed sprites'
      );
    }

    return this.canvas;
  }

  // Generate individual sprite based on index (consciousness-themed)
  generateSprite(index, x, y) {
    const ctx = this.ctx;
    const size = this.spriteSize;
    const radius = size * 0.4;
    const centerX = x + size * 0.5;
    const centerY = y + size * 0.5;

    ctx.save();

    switch (index) {
      case 0: // Solid circle - basic consciousness particle
        this.drawSolidCircle(centerX, centerY, radius, 'rgba(255,255,255,0.8)');
        break;

      case 1: // Gradient circle - consciousness core
        this.drawGradientCircle(centerX, centerY, radius);
        break;

      case 2: // Ring - neural connection
        this.drawRing(centerX, centerY, radius * 0.8, radius * 0.4);
        break;

      case 3: // Cross - synaptic junction
        this.drawCross(centerX, centerY, radius);
        break;

      case 4: // Diamond - memory node (perfect for genesis/discipline)
        this.drawDiamond(centerX, centerY, radius);
        break;

      case 5: // Hexagon - brain cell structure
        this.drawHexagon(centerX, centerY, radius);
        break;

      case 6: // Star - consciousness spark (velocity stage)
        this.drawStar(centerX, centerY, radius, 5);
        break;

      case 7: // Soft glow - atmospheric dust
        this.drawSoftGlow(centerX, centerY, radius * 1.2);
        break;

      case 8: // Pulse ring - neural activity
        this.drawPulseRing(centerX, centerY, radius);
        break;

      case 9: // Spiral - consciousness evolution
        this.drawSpiral(centerX, centerY, radius);
        break;

      case 10: // Network node - connectivity (neural stage)
        this.drawNetworkNode(centerX, centerY, radius);
        break;

      case 11: // Crystalline - structured thought (architecture)
        this.drawCrystalline(centerX, centerY, radius);
        break;

      case 12: // Flowing wave - consciousness stream
        this.drawFlowingWave(centerX, centerY, radius);
        break;

      case 13: // Burst - breakthrough moment (velocity)
        this.drawBurst(centerX, centerY, radius);
        break;

      case 14: // Mandala - unified consciousness (harmony)
        this.drawMandala(centerX, centerY, radius);
        break;

      case 15: // Galaxy - transcendence
        this.drawGalaxy(centerX, centerY, radius);
        break;
    }

    ctx.restore();
  }

  // Drawing helper methods
  drawSolidCircle(x, y, radius, color = 'rgba(255,255,255,0.8)') {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  drawGradientCircle(x, y, radius) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.0)');

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawRing(x, y, outerRadius, innerRadius) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
    this.ctx.arc(x, y, innerRadius, 0, Math.PI * 2, true);
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.fill();
  }

  drawCross(x, y, size) {
    const thickness = size * 0.2;
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.fillRect(x - size, y - thickness, size * 2, thickness * 2);
    this.ctx.fillRect(x - thickness, y - size, thickness * 2, size * 2);
  }

  drawDiamond(x, y, size) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x, y + size);
    this.ctx.lineTo(x - size, y);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    this.ctx.fill();
  }

  drawHexagon(x, y, radius) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(hx, hy);
      else this.ctx.lineTo(hx, hy);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
    this.ctx.fill();
  }

  drawStar(x, y, radius, points = 5) {
    const outerRadius = radius;
    const innerRadius = radius * 0.5;

    this.ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const sx = x + r * Math.cos(angle - Math.PI / 2);
      const sy = y + r * Math.sin(angle - Math.PI / 2);
      if (i === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.fill();
  }

  drawSoftGlow(x, y, radius) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.0)');

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  drawPulseRing(x, y, radius) {
    // Inner bright ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    this.ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2, true);
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.fill();

    // Outer faint ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2, true);
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fill();
  }

  drawSpiral(x, y, radius) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    this.ctx.lineWidth = 2;

    for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
      const r = (radius * angle) / (Math.PI * 4);
      const sx = x + r * Math.cos(angle);
      const sy = y + r * Math.sin(angle);
      if (angle === 0) this.ctx.moveTo(sx, sy);
      else this.ctx.lineTo(sx, sy);
    }
    this.ctx.stroke();
  }

  drawNetworkNode(x, y, radius) {
    // Central node
    this.drawSolidCircle(x, y, radius * 0.3, 'rgba(255,255,255,0.9)');

    // Connection lines
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + radius * 0.8 * Math.cos(angle), y + radius * 0.8 * Math.sin(angle));
      this.ctx.stroke();
    }
  }

  drawCrystalline(x, y, radius) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    this.ctx.lineWidth = 1.5;

    // Crystalline structure
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
      this.ctx.stroke();
    }

    // Central diamond
    this.drawDiamond(x, y, radius * 0.3);
  }

  drawFlowingWave(x, y, radius) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    this.ctx.lineWidth = 2;

    for (let wave = 0; wave < 3; wave++) {
      this.ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const r = radius * (0.3 + 0.2 * wave + 0.1 * Math.sin(angle * 3));
        const wx = x + r * Math.cos(angle);
        const wy = y + r * Math.sin(angle);
        if (angle === 0) this.ctx.moveTo(wx, wy);
        else this.ctx.lineTo(wx, wy);
      }
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }

  drawBurst(x, y, radius) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const length = radius * (0.6 + 0.4 * Math.random());
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + length * Math.cos(angle), y + length * Math.sin(angle));
      this.ctx.stroke();
    }

    // Central bright core
    this.drawSolidCircle(x, y, radius * 0.2, 'rgba(255,255,255,1.0)');
  }

  drawMandala(x, y, radius) {
    this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = 1;

    // Outer ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Inner patterns
    for (let ring = 1; ring <= 3; ring++) {
      const r = radius * (ring / 4);
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x + r * 0.5 * Math.cos(angle), y + r * 0.5 * Math.sin(angle));
        this.ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
        this.ctx.stroke();
      }
    }
  }

  drawGalaxy(x, y, radius) {
    // Spiral arms
    this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.ctx.lineWidth = 1.5;

    for (let arm = 0; arm < 3; arm++) {
      this.ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 3; angle += 0.1) {
        const armOffset = (arm * Math.PI * 2) / 3;
        const r = (radius * angle) / (Math.PI * 3);
        const gx = x + r * Math.cos(angle + armOffset);
        const gy = y + r * Math.sin(angle + armOffset);
        if (angle === 0) this.ctx.moveTo(gx, gy);
        else this.ctx.lineTo(gx, gy);
      }
      this.ctx.stroke();
    }

    // Bright core
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.2)');

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  // ✅ CONTEXTUAL SPRITE SELECTION: Different sprites for different consciousness stages
  getContextualSpriteIndex(stage, particleIndex) {
    const stageMapping = {
      genesis: [0, 1, 7], // Solid, gradient, soft glow - genesis memory formation
      discipline: [4, 5, 11], // Diamond, hexagon, crystalline - structured discipline
      neural: [2, 3, 10], // Ring, cross, network node - neural connections
      velocity: [6, 13, 14], // Star, burst, mandala - breakthrough velocity
      architecture: [4, 11, 12], // Diamond, crystalline, flowing wave - architectural systems
      harmony: [8, 9, 15], // Pulse ring, spiral, galaxy - harmonic coordination
      transcendence: [14, 15, 1], // Mandala, galaxy, gradient - unified transcendence
    };

    const sprites = stageMapping[stage] || [0, 1, 2];
    return sprites[particleIndex % sprites.length];
  }

  // ✅ PERFORMANCE: Pre-cached atlas indices
  generateAtlasIndices(particleCount, stage) {
    const cacheKey = `${stage}-${particleCount}`;

    if (this.indexCache.has(cacheKey)) {
      return this.indexCache.get(cacheKey).slice(); // Return cloned cached array
    }

    const atlasIndices = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      atlasIndices[i] = this.getContextualSpriteIndex(stage, i);
    }

    // Cache for reuse
    this.indexCache.set(cacheKey, atlasIndices);

    if (import.meta.env.DEV) {
      console.log(`✅ PointSpriteAtlas: Cached indices for ${stage} (${particleCount} particles)`);
    }

    return atlasIndices.slice(); // Return clone
  }

  // Create WebGL texture with proper settings
  createWebGLTexture() {
    if (!this.canvas) {
      this.generateAtlas();
    }

    // ✅ CORRECTED: Enable mipmaps for better quality at various sizes
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBAFormat;
    this.texture.flipY = false; // Important for point sprites

    // ✅ CORRECTED: Mark texture as needing update
    this.texture.needsUpdate = true;

    if (import.meta.env.DEV) {
      console.log('✅ PointSpriteAtlas: WebGL texture created with mipmaps and proper settings');
    }

    return this.texture;
  }

  // Get UV coordinates for sprite index (for debugging)
  getUVForSprite(index) {
    const row = Math.floor(index / this.spritesPerRow);
    const col = index % this.spritesPerRow;
    const uvSize = 1.0 / this.spritesPerRow;

    return {
      u: col * uvSize,
      v: row * uvSize,
      uvSize: uvSize,
    };
  }

  // Dispose resources
  dispose() {
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }

    if (this.indexCache) {
      this.indexCache.clear();
    }

    this.canvas = null;
    this.ctx = null;
  }
}

// Export default class
export default PointSpriteAtlas;

// ✅ CRITICAL FIX 4: HMR-Safe PointSpriteAtlas singleton
export function getPointSpriteAtlasSingleton() {
  const g = globalThis;
  if (!g.__POINT_SPRITE_ATLAS__) {
    console.log('🎨 Creating new PointSpriteAtlas singleton');
    g.__POINT_SPRITE_ATLAS__ = new PointSpriteAtlas();
  } else {
    console.log('🎨 Reusing existing PointSpriteAtlas singleton (HMR safe)');
  }
  return g.__POINT_SPRITE_ATLAS__;
}

// ✅ DEVELOPMENT ACCESS
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.PointSpriteAtlas = PointSpriteAtlas;

  window.testAtlasGeneration = () => {
    const atlas = new PointSpriteAtlas();
    const canvas = atlas.generateAtlas();

    // Create downloadable link for inspection
    const link = document.createElement('a');
    link.download = 'metacurtis-brain-particle-atlas.png';
    link.href = canvas.toDataURL();
    link.click();

    console.log('🎨 Brain particle atlas downloaded for inspection');
    return canvas;
  };

  window.testContextualSelection = () => {
    const atlas = new PointSpriteAtlas();
    const stages = [
      'genesis',
      'discipline',
      'neural',
      'velocity',
      'architecture',
      'harmony',
      'transcendence',
    ];

    stages.forEach(stage => {
      const indices = [];
      for (let i = 0; i < 5; i++) {
        indices.push(atlas.getContextualSpriteIndex(stage, i));
      }
      console.log(`${stage}: sprites ${indices.join(', ')}`);
    });

    return 'Contextual sprite selection tested for all stages';
  };

  console.log('🎨 PointSpriteAtlas: Development tools ready');
  console.log('🔧 Test atlas: window.testAtlasGeneration()');
  console.log('🧪 Test selection: window.testContextualSelection()');
}
