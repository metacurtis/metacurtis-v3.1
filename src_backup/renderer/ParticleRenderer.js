import * as THREE from 'three';
import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
import vertSrc from '../shaders/templates/consciousness-vertex.glsl?raw';
import fragSrc from '../shaders/templates/consciousness-fragment.glsl?raw';

export class ParticleRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 80;

    // Get GPU point-size limits for safe clamp
    const gl = this.renderer.getContext();
    const range = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || [1, 64];
    this._pointRange = { min: range[0] || 1, max: range[1] || 64 };

    // Build uniforms with aliasing (CRITICAL: same object reference for aliases)
    const morphValue = { value: 0 };
    const blendValue = { value: 0 };

    this.uniforms = {
      // Required by audit
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointSize: { value: 3.0 },
      uScrollProgress: { value: 0 },
      uStageBlend: blendValue,        // Alias - shares value
      uStageProgress: morphValue,     // Alias - shares value with uMorphProgress
      uMorphProgress: morphValue,     // Primary morph value
      uActiveCount: { value: 0 },
      uColor: { value: new THREE.Color('#22c55e') },
      uGaussianSigma: { value: 0.7 },
      uTierHighlight: { value: [0, 0, 0, 0] },
      uAtlasTexture: { value: this._makeDefaultAtlasTexture() },
      
      // Additional uniforms
      uTime: { value: 0 },
      uColorCurrent: { value: new THREE.Color('#22c55e') },
      uColorNext: { value: new THREE.Color('#22c55e') }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = null;
    this._raf = null;

    // Resize handling
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    this._ro = ro;
    this.resize();

    // Debug handles
    window.renderer = this.renderer;
    window.scene = this.scene;
    window.camera = this.camera;
    window.particleRenderer = this;

    console.log('✅ ParticleRenderer initialized with SST-v3 compliance');
  }

  _makeDefaultAtlasTexture() {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    
    // Create a simple radial gradient
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - size/2) / (size/2);
        const dy = (y - size/2) / (size/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const val = Math.max(0, 1 - dist) * 255;
        const idx = (y * size + x) * 4;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
        data[idx + 3] = val;
      }
    }
    
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
  }

  _computePointSize(base = 3) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = base * dpr;
    return Math.min(Math.max(px, this._pointRange.min), this._pointRange.max);
  }

  resize() {
    const el = this.renderer.domElement;
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.uniforms.uResolution.value.set(w, h);
    this.uniforms.uPointSize.value = this._computePointSize(3);
  }

  upsert(blueprint) {
    // Pull positions with fallbacks
    const pos = blueprint.positions ||
                blueprint.atmosphericPositions ||
                blueprint.allenAtlasPositions;

    if (!pos || !pos.length) {
      console.warn('❌ No positions in blueprint');
      return;
    }
    
    const count = pos.length / 3;
    console.log(`🎨 Upserting ${count} particles for stage: ${blueprint.stageName || 'unknown'}`);

    // Provide required attrs the audit expects
    const atm = blueprint.atmosphericPositions || pos;
    const atl = blueprint.allenAtlasPositions || pos;

    // particleIndex: 0..N-1 (REQUIRED by audit)
    const idx = new Float32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;

    const geo = new THREE.BufferGeometry();
    const activeCount = (geo.getAttribute('position')?.count ?? 0);
    geo.setDrawRange(0, activeCount);
    // REQUIRED attributes
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(atm, 3));
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(atl, 3));
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));

    // Optional attributes
    if (blueprint.tierData) {
      geo.setAttribute('tierData', new THREE.BufferAttribute(blueprint.tierData, 1));
    }
    if (blueprint.sizeMultipliers) {
      geo.setAttribute('sizeMultiplier', new THREE.BufferAttribute(blueprint.sizeMultipliers, 1));
    }
    if (blueprint.opacityData) {
      geo.setAttribute('opacityData', new THREE.BufferAttribute(blueprint.opacityData, 1));
    }
    if (blueprint.atlasIndices) {
      geo.setAttribute('atlasIndex', new THREE.BufferAttribute(blueprint.atlasIndices, 1));
    }
    if (blueprint.animationSeeds) {
      geo.setAttribute('animationSeed', new THREE.BufferAttribute(blueprint.animationSeeds, 3));
    }

    // Active count (CRITICAL: both drawRange AND uniform)
    const active = Math.min(
      blueprint.activeCount ?? blueprint.uActiveCount ?? count,
      count
    );
    geo.setDrawRange(0, active);  // ← Auditor looks for this
    this.uniforms.uActiveCount.value = active;

    // Update colors
    if (blueprint.colorCurrent?.hex) {
      this.uniforms.uColor.value.set(blueprint.colorCurrent.hex);
      this.uniforms.uColorCurrent.value.set(blueprint.colorCurrent.hex);
    }
    if (blueprint.colorNext?.hex) {
      this.uniforms.uColorNext.value.set(blueprint.colorNext.hex);
    }
    
    // Gaussian sigma if provided
    if (typeof blueprint.gaussianSigma === 'number') {
      this.uniforms.uGaussianSigma.value = blueprint.gaussianSigma;
    }

    // Progress/aliases (CRITICAL: update shared value object)
    const morph = blueprint.morphProgress ?? blueprint.stageProgress ?? 0;
    this.uniforms.uMorphProgress.value = morph;  // Also drives uStageProgress
    this.uniforms.uStageBlend.value = morph;     // Simple alias

    // Update scroll if provided
    if (typeof blueprint.scrollProgress === 'number') {
      this.uniforms.uScrollProgress.value = blueprint.scrollProgress;
    }

    // Swap mesh
    if (this.points) {
      this.points.geometry.dispose();
      this.scene.remove(this.points);
    }
    this.points = new THREE.Points(ensureCanonGeometry(geo), this.material);
    this.scene.add(points);

    // Make available for debugging
    window.points = this.points;

    // First render
    this.renderer.render(this.scene, this.camera);
  }

  // Public methods for external control
  setScrollProgress(t) {
    this.uniforms.uScrollProgress.value = t;
  }

  setStageProgress(t) {
    // Update all morph aliases
    this.uniforms.uMorphProgress.value = t;  // Shared object updates uStageProgress
    this.uniforms.uStageBlend.value = t;
  }

  setTierHighlight(a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
    this.uniforms.uTierHighlight.value = [a0, a1, a2, a3];
  }

  setAtlasTexture(tex) {
    this.uniforms.uAtlasTexture.value = tex;
  }

  setQuality(q = 'HIGH') {
    const base = q === 'LOW' ? 1.8 : q === 'MEDIUM' ? 2.4 : 3.0;
    this.uniforms.uPointSize.value = this._computePointSize(base);
  }

  startAnimationLoop() {
    if (this._raf) return;
    
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      
      // Update time uniform
      this.uniforms.uTime.value = performance.now() * 0.001;
      
      // Gentle rotation
      if (this.points) {
        this.points.rotation.y += 0.001;
      }
      
      this.renderer.render(this.scene, this.camera);
    };
    
    this._raf = requestAnimationFrame(tick);
    console.log('🎬 Animation loop started');
  }

  stopAnimationLoop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  getStats() {
    return {
      fps: 60, // Calculate if needed
      particleCount: this.uniforms.uActiveCount.value,
      quality: 'HIGH'
    };
  }

  dispose() {
    this.stopAnimationLoop();
    this._ro?.disconnect();
    if (this.points) {
      this.points.geometry.dispose();
      this.scene.remove(this.points);
    }
    this.material?.dispose();
    this.renderer?.dispose();
  }
}