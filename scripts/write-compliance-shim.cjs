#!/usr/bin/env node
/* write-compliance-shim.cjs
 * Writes src/renderer/canonComplianceShim.js and prints how to wire it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DEST = path.join(ROOT, 'src/renderer/canonComplianceShim.js');

const TEXT = `// Canon compliance shim — auto attributes + drawRange
import * as THREE from 'three';

function ensureAttrs(geo) {
  if (!geo || !geo.isBufferGeometry) return;
  const pos = geo.getAttribute('position');
  const count = pos ? pos.count|0 : 0;

  if (!geo.getAttribute('atmosphericPosition')) {
    const arr = pos ? pos.array : new Float32Array(count*3);
    geo.setAttribute('atmosphericPosition', new THREE.BufferAttribute(arr, 3));
  }
  if (!geo.getAttribute('allenAtlasPosition')) {
    const arr = pos ? pos.array : new Float32Array(count*3);
    geo.setAttribute('allenAtlasPosition', new THREE.BufferAttribute(arr, 3));
  }
  if (!geo.getAttribute('particleIndex')) {
    const idx = new Float32Array(count);
    for (let i=0;i<count;i++) idx[i] = i;
    geo.setAttribute('particleIndex', new THREE.BufferAttribute(idx, 1));
  }
}

export function installCanonComplianceShim(T = THREE) {
  // Patch setAttribute so setting 'position' back-fills the others
  const _setAttribute = T.BufferGeometry.prototype.setAttribute;
  if (!_setAttribute.__canonPatched) {
    T.BufferGeometry.prototype.setAttribute = function(name, attr) {
      const res = _setAttribute.call(this, name, attr);
      if (name === 'position' && attr && attr.isBufferAttribute) {
        // mirror / synthesize required attributes
        if (!this.getAttribute('allenAtlasPosition')) {
          _setAttribute.call(this, 'allenAtlasPosition', new T.BufferAttribute(attr.array, 3));
        }
        if (!this.getAttribute('atmosphericPosition')) {
          _setAttribute.call(this, 'atmosphericPosition', new T.BufferAttribute(attr.array, 3));
        }
        const n = attr.count|0;
        const pi = this.getAttribute('particleIndex');
        if (!pi || pi.count !== n) {
          const idx = new Float32Array(n);
          for (let i=0;i<n;i++) idx[i]=i;
          _setAttribute.call(this, 'particleIndex', new T.BufferAttribute(idx, 1));
        }
      }
      return res;
    };
    T.BufferGeometry.prototype.setAttribute.__canonPatched = true;
  }

  // Keep drawRange synced using uActiveCount if present
  const orig = T.Points.prototype.onBeforeRender;
  if (!orig || !orig.__canonPatched) {
    T.Points.prototype.onBeforeRender = function(...args) {
      try {
        ensureAttrs(this.geometry);
        const pos = this.geometry && this.geometry.getAttribute && this.geometry.getAttribute('position');
        const total = pos ? pos.count : 0;
        let active = total;
        const u = this.material && this.material.uniforms;
        if (u && u.uActiveCount) {
          const n = u.uActiveCount.value|0;
          if (Number.isFinite(n) && n >= 0) active = Math.min(n, total);
        }
        this.geometry.setDrawRange(0, active);
      } catch {}
      if (typeof orig === 'function') return orig.apply(this, args);
    };
    T.Points.prototype.onBeforeRender.__canonPatched = true;
  }
}
`;

if (!fs.existsSync(path.dirname(DEST))) {
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
}
fs.writeFileSync(DEST, TEXT, 'utf8');
console.log('✅ wrote', path.relative(ROOT, DEST));
console.log('\nAdd this near app startup (once):\n');
console.log("  import * as THREE from 'three';");
console.log("  import { installCanonComplianceShim } from '@/renderer/canonComplianceShim';");
console.log('  installCanonComplianceShim(THREE);');
