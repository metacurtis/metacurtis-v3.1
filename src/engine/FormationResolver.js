// src/engine/FormationResolver.js
// Fixed version with proper formation generation and debug methods

import { HELLO_CURTIS_PATH_D } from '@/assets/paths/hello-curtis-d.js';

export class FormationResolver {
  constructor() {
    this.ready = false;
    this.cache = new Map();
  }

  async precompute() {
    console.log('🎯 FormationResolver: Starting precompute...');
    
    const HI = 2200, LO = 1400;

    try {
      // Outline versions (stroke along path)
      const outlineHi = this.sampleSvgPathOutline(HELLO_CURTIS_PATH_D, HI, 'fit');
      this.set('HELLO_CURTIS', 'outline-hi', outlineHi);
      console.log(`✅ Generated outline-hi: ${outlineHi.length/3} particles`);
      
      const outlineLo = this.sampleSvgPathOutline(HELLO_CURTIS_PATH_D, LO, 'fit');
      this.set('HELLO_CURTIS', 'outline-lo', outlineLo);
      console.log(`✅ Generated outline-lo: ${outlineLo.length/3} particles`);

      // Filled versions (particles inside glyphs)
      const fillHi = this.sampleSvgPathFill(HELLO_CURTIS_PATH_D, HI, 'fit');
      this.set('HELLO_CURTIS', 'fill-hi', fillHi);
      console.log(`✅ Generated fill-hi: ${fillHi.length/3} particles`);
      
      const fillLo = this.sampleSvgPathFill(HELLO_CURTIS_PATH_D, LO, 'fit');
      this.set('HELLO_CURTIS', 'fill-lo', fillLo);
      console.log(`✅ Generated fill-lo: ${fillLo.length/3} particles`);

      // Set up aliases for backward compatibility
      this.alias('HELLO_CURTIS', 'hi', 'fill-hi');
      this.alias('HELLO_CURTIS', 'lo', 'fill-lo');

      this.ready = true;
      console.log('🎯 FormationResolver ready with', this.cache.size, 'formations');
      
      // Log bounding box for debugging
      this.debugFormationBounds('HELLO_CURTIS', 'fill-hi');
      
      return true;
    } catch (error) {
      console.error('❌ FormationResolver precompute failed:', error);
      this.ready = false;
      throw error;
    }
  }

  set(name, lod, arr) {
    if (!arr || arr.length === 0) {
      console.warn(`⚠️ FormationResolver: Empty array for ${name}:${lod}`);
      return;
    }
    this.cache.set(`${name}:${lod}`, arr);
  }

  alias(name, lod, targetLod) {
    const target = this.get(name, targetLod);
    if (target) {
      this.cache.set(`${name}:${lod}`, target);
    }
  }

  get(name, lod = 'hi') {
    return this.cache.get(`${name}:${lod}`) || 
           this.cache.get(`${name}:lo`) ||
           this.cache.get(`${name}:fill-${lod}`) ||
           this.cache.get(`${name}:outline-${lod}`);
  }

  getCatalog() {
    return Array.from(this.cache.keys());
  }

  // Debug helper to check formation bounds
  debugFormationBounds(name, lod) {
    const positions = this.get(name, lod);
    if (!positions) {
      console.warn(`No formation found for ${name}:${lod}`);
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
      minZ = Math.min(minZ, positions[i + 2]);
      maxZ = Math.max(maxZ, positions[i + 2]);
    }

    console.log(`📊 Formation bounds for ${name}:${lod}:`, {
      x: { min: minX, max: maxX, range: maxX - minX },
      y: { min: minY, max: maxY, range: maxY - minY },
      z: { min: minZ, max: maxZ, range: maxZ - minZ },
      particles: positions.length / 3,
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  // Outline sampler - particles along the path stroke
  sampleSvgPathOutline(d, n, scale = 0.02, center = [0, 0]) {
    if (!d || d.length === 0) {
      console.error('Empty SVG path data');
      return new Float32Array(0);
    }

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '1');
    svg.setAttribute('height', '1');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    document.body.appendChild(svg);

    try {
      const len = path.getTotalLength();
      const bbox = path.getBBox();
      
      console.log(`📐 SVG path length: ${len}, bbox:`, bbox);

      // Auto-fit to ~24 world units wide
      if (scale === 'fit') {
        const targetW = 24;
        scale = targetW / Math.max(1e-3, bbox.width);
        center = [
          -(bbox.x + bbox.width * 0.5) * scale,
          -(bbox.y + bbox.height * 0.5) * scale  // Negative to flip Y
        ];
        console.log(`📐 Auto-fit scale: ${scale}, center:`, center);
      }

      const pts = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const p = path.getPointAtLength((i / Math.max(1, n - 1)) * len);
        const k = i * 3;
        pts[k + 0] = center[0] + p.x * scale;
        pts[k + 1] = center[1] - p.y * scale;  // Flip Y for world coordinates
        pts[k + 2] = 0;
      }

      document.body.removeChild(svg);
      return pts;
    } catch (error) {
      console.error('Error sampling SVG path:', error);
      document.body.removeChild(svg);
      return new Float32Array(n * 3); // Return zeroed array as fallback
    }
  }

  // Fill sampler - particles inside the glyphs
  sampleSvgPathFill(d, n, scale = 0.02, center = [0, 0]) {
    if (!d || d.length === 0) {
      console.error('Empty SVG path data');
      return new Float32Array(0);
    }

    // Get bbox from SVG path
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    document.body.appendChild(svg);
    
    let bbox;
    try {
      bbox = path.getBBox();
    } catch (error) {
      console.error('Failed to get bbox:', error);
      document.body.removeChild(svg);
      return new Float32Array(n * 3);
    }
    
    document.body.removeChild(svg);

    // Auto-fit
    if (scale === 'fit') {
      const targetW = 24;
      scale = targetW / Math.max(1e-3, bbox.width);
      center = [
        -(bbox.x + bbox.width * 0.5) * scale,
        -(bbox.y + bbox.height * 0.5) * scale
      ];
      console.log(`📐 Fill auto-fit scale: ${scale}, center:`, center);
    }

    // Create canvas for rasterization
    const padding = 4;
    const W = Math.ceil(bbox.width) + padding * 2;
    const H = Math.ceil(bbox.height) + padding * 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Create Path2D and fill
    const p2d = new Path2D(d);
    ctx.save();
    ctx.translate(-bbox.x + padding, -bbox.y + padding);
    ctx.fillStyle = '#fff';
    ctx.fill(p2d);
    ctx.restore();

    // Sample points inside the path
    const candidates = [];
    const step = Math.max(1, Math.floor(Math.sqrt((W * H) / (n * 1.3))));
    
    // Grid sampling with jitter
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const jx = x + Math.random() * step;
        const jy = y + Math.random() * step;
        if (jx < W && jy < H && ctx.isPointInPath(p2d, jx + bbox.x - padding, jy + bbox.y - padding)) {
          candidates.push(jx + bbox.x - padding, jy + bbox.y - padding);
        }
      }
    }

    // Fill up with random samples if needed
    let guard = 0;
    while (candidates.length / 2 < n && guard++ < 50000) {
      const rx = Math.random() * bbox.width + bbox.x;
      const ry = Math.random() * bbox.height + bbox.y;
      if (ctx.isPointInPath(p2d, rx, ry)) {
        candidates.push(rx, ry);
      }
    }

    console.log(`📊 Fill sampling: ${candidates.length/2} candidates for ${n} particles`);

    // Map to world coordinates
    const pts = new Float32Array(n * 3);
    const total = Math.max(1, Math.floor(candidates.length / 2));
    
    for (let i = 0; i < n; i++) {
      const ci = (i % total) * 2;
      const x = candidates[ci] || 0;
      const y = candidates[ci + 1] || 0;
      const k = i * 3;
      pts[k + 0] = center[0] + x * scale;
      pts[k + 1] = center[1] - y * scale;
      pts[k + 2] = 0;
    }

    return pts;
  }

  // Direct text building for testing
  buildHelloCurtis(count) {
    if (this.ready) {
      // Try to get cached version first
      const cached = this.get('HELLO_CURTIS', count > 1500 ? 'hi' : 'lo');
      if (cached && cached.length >= count * 3) {
        return cached.slice(0, count * 3);
      }
    }
    
    // Fallback to outline generation
    return this.sampleSvgPathOutline(HELLO_CURTIS_PATH_D, count, 'fit');
  }

  // Test method to verify formations
  testFormations() {
    const tests = [
      ['HELLO_CURTIS', 'outline-hi'],
      ['HELLO_CURTIS', 'outline-lo'],
      ['HELLO_CURTIS', 'fill-hi'],
      ['HELLO_CURTIS', 'fill-lo'],
      ['HELLO_CURTIS', 'hi'],
      ['HELLO_CURTIS', 'lo'],
    ];

    console.log('🧪 Testing all formations:');
    for (const [name, lod] of tests) {
      const formation = this.get(name, lod);
      if (formation) {
        console.log(`✅ ${name}:${lod} - ${formation.length/3} particles`);
        this.debugFormationBounds(name, lod);
      } else {
        console.log(`❌ ${name}:${lod} - NOT FOUND`);
      }
    }
  }
}

// Export singleton for debugging
if (typeof window !== 'undefined') {
  window.FormationResolver = FormationResolver;
}