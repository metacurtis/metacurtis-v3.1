import { HELLO_CURTIS_PATH_D } from '@/assets/paths/hello-curtis-d.js';

export class FormationResolver {
  constructor() {
    this.ready = false;
    this.cache = new Map();
  }

  async precompute() {
    // Genesis - HELLO CURTIS text
    this.set('HELLO_CURTIS', 'hi', this.buildHelloCurtis(2200));
    this.set('HELLO_CURTIS', 'lo', this.buildHelloCurtis(1400));
    
    // Add other formations later (grid, explosion, galaxy, etc.)
    
    this.ready = true;
    console.log('🎯 FormationResolver ready with', this.cache.size, 'formations');
  }

  buildHelloCurtis(count) {
    // Scale and center need adjustment based on your viewport
    return this.sampleSvgPathUniform(HELLO_CURTIS_PATH_D, count, 0.02, [0, 0]);
  }

  sampleSvgPathUniform(d, n, scale = 1, center = [0, 0]) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    document.body.appendChild(svg);

    const len = path.getTotalLength();
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = path.getPointAtLength((i / (n - 1)) * len);
      pts[i * 3 + 0] = center[0] + p.x * scale;
      pts[i * 3 + 1] = center[1] - p.y * scale;
      pts[i * 3 + 2] = 0;
    }
    document.body.removeChild(svg);
    return pts;
  }

  set(name, lod, arr) {
    this.cache.set(`${name}:${lod}`, arr);
  }

  get(name, lod = 'hi') {
    return this.cache.get(`${name}:${lod}`) || this.cache.get(`${name}:lo`);
  }
}
