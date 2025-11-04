const DEV =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  Boolean(import.meta.env.DEV);

const isBrowser = typeof window !== 'undefined';

const noop = () => {};

const getRendererSurface = () => {
  if (!isBrowser) return null;
  const surface = window.__rendererDiagnostics;
  return surface && typeof surface === 'object' ? surface : null;
};

const materialTypeMatch = (value) =>
  Boolean(value && (value.type?.includes?.('Material') || value.uniforms));
const geometryTypeMatch = (value) =>
  Boolean(value && (value.type?.includes?.('Geometry') || value.attributes));

function createRegistry() {
  const materials = new Map();
  const geometries = new Map();
  const uniforms = new Map();
  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        /* noop */
      }
    });
  };

  const registry = {
    materials,
    geometries,
    uniforms,
    __installed: false,

    register(name, value) {
      if (!name) return registry;
      if (!value) {
        materials.delete(name);
        geometries.delete(name);
        uniforms.delete(name);
        notify();
        return registry;
      }

      if (materialTypeMatch(value)) {
        materials.set(name, value);
        if (value.uniforms) {
          uniforms.set(name, Object.keys(value.uniforms));
        }
      }

      if (geometryTypeMatch(value)) {
        geometries.set(name, value);
      }

      notify();
      return registry;
    },

    unregister(name) {
      if (!name) return registry;
      const removed =
        materials.delete(name) || geometries.delete(name) || uniforms.delete(name);
      if (removed) notify();
      return registry;
    },

    onChange(listener = noop) {
      if (typeof listener !== 'function') return noop;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    listMaterials() {
      return Array.from(materials.keys());
    },

    listGeometries() {
      return Array.from(geometries.keys());
    },

    getUniformValue(name) {
      const surface = getRendererSurface();
      if (surface?.getUniformValue) {
        try {
          return surface.getUniformValue(name);
        } catch {
          /* fall through */
        }
      }

      for (const mat of materials.values()) {
        if (mat?.uniforms?.[name]) {
          const uniform = mat.uniforms[name];
          const value = uniform?.value ?? uniform;
          if (value == null) return value;
          if (typeof value.toArray === 'function') {
            const out = [];
            value.toArray(out);
            return out;
          }
          if (value instanceof Float32Array) {
            return Float32Array.from(value);
          }
          if (value instanceof ArrayBuffer) {
            return value.slice(0);
          }
          if (
            typeof value === 'number' ||
            typeof value === 'string' ||
            typeof value === 'boolean'
          ) {
            return value;
          }
          if (Array.isArray(value)) {
            return [...value];
          }
          if (value && typeof value === 'object') {
            return { ...value };
          }
          return value;
        }
      }
      return null;
    },

    getAttributeArray(name) {
      const surface = getRendererSurface();
      if (surface?.getAttributeArray) {
        try {
          return surface.getAttributeArray(name);
        } catch {
          /* fall through */
        }
      }

      for (const geo of geometries.values()) {
        const attr = geo?.getAttribute?.(name) ?? geo?.attributes?.[name];
        if (!attr) continue;
        const array = attr.array ?? attr;
        if (array instanceof Float32Array) return Float32Array.from(array);
        if (Array.isArray(array)) return [...array];
        if (array instanceof ArrayBuffer) return array.slice(0);
        if (array?.buffer instanceof ArrayBuffer) {
          return array.buffer.slice(0);
        }
        return array ?? null;
      }
      return null;
    },

    getDrawCount() {
      const surface = getRendererSurface();
      if (surface?.getDrawCount) {
        try {
          return surface.getDrawCount();
        } catch {
          /* noop */
        }
      }
      for (const geo of geometries.values()) {
        if (typeof geo?.drawRange?.count === 'number') {
          return geo.drawRange.count;
        }
      }
      return null;
    },

    snapshot() {
      const surface = getRendererSurface();
      return {
        materials: Array.from(materials.keys()),
        geometries: Array.from(geometries.keys()),
        uniforms: Array.from(uniforms.entries()),
        drawCount: registry.getDrawCount(),
        activeCount:
          surface?.getActiveCount?.() ??
          registry.getUniformValue('uActiveCount') ??
          null,
      };
    },

    report() {
      if (!DEV || !isBrowser) return registry;
      console.group('🔍 Render Diagnostic');
      console.log('Materials:', materials.size);
      materials.forEach((mat, name) => {
        const uniformKeys = mat?.uniforms ? Object.keys(mat.uniforms) : [];
        console.log(
          '  -',
          name,
          mat?.type || '(unknown material)',
          uniformKeys.length ? `uniforms: ${uniformKeys.join(', ')}` : 'no uniforms'
        );
      });

      console.log('Geometries:', geometries.size);
      geometries.forEach((geo, name) => {
        const position = geo?.attributes?.position;
        const count = position?.count ?? geo?.drawRange?.count ?? null;
        console.log(
          '  -',
          name,
          count != null ? `${count} vertices` : 'no vertex data'
        );
      });

      console.log('Draw vs Active count:', {
        draw: registry.getDrawCount(),
        active: registry.getUniformValue('uActiveCount'),
      });
      console.groupEnd();
      return registry;
    },

    testMorph(value = 0.5) {
      let updated = 0;
      materials.forEach((mat, name) => {
        if (!mat?.uniforms) return;
        ['uMorphProgress', 'morphProgress', 'uMorph', 'morph'].forEach((key) => {
          const uniform = mat.uniforms[key];
          if (!uniform || uniform.value === value) return;
          uniform.value = value;
          if (typeof uniform.needsUpdate === 'boolean') {
            uniform.needsUpdate = true;
          }
          updated += 1;
          console.log(`✓ Set ${name}.${key} = ${value}`);
        });
      });
      return `${updated} uniforms updated`;
    },

    refresh() {
      registerExistingTargets(registry);
      registry.report();
      return registry;
    },
  };

  return registry;
}

const registerExistingTargets = (registry) => {
  if (!isBrowser || !registry || typeof registry.register !== 'function') return;
  const bg = window.__webglBackground || {};
  const material =
    window.__consciousnessMaterial ||
    bg.material ||
    bg.materialRef?.current ||
    null;
  const geometry =
    window.__particleGeometry ||
    bg.geometry ||
    bg.geometryRef?.current ||
    null;
  const points = bg.points || bg.pointsRef?.current || null;

  if (material) registry.register('WebGLBackground.material', material);
  if (geometry) registry.register('WebGLBackground.geometry', geometry);
  if (points) registry.register('WebGLBackground.points', points);
};

const logInstructions = () => {
  if (!DEV || !isBrowser) return;
  console.log('🔍 Render diagnostics ready.');
  console.log('  __renderDiag.report()            → summarize renderer state');
  console.log('  __renderDiag.getUniformValue(id) → inspect a uniform value');
  console.log('  __renderDiag.getAttributeArray() → read geometry attributes');
  console.log('  __renderDiag.testMorph(0.3)      → force morph progress');
};

export function installRenderDiagnostics(options = {}) {
  const { autoRefresh = true } = options;
  if (!DEV) {
    console.warn('[renderDiagnostics] Available only in DEV mode.');
    return null;
  }
  if (!isBrowser) {
    console.warn('[renderDiagnostics] Requires a browser environment.');
    return null;
  }

  const existing = window.__renderDiag;
  const registry =
    existing && typeof existing === 'object' && typeof existing.register === 'function'
      ? existing
      : createRegistry();

  if (!registry.__installed) {
    Object.defineProperty(registry, '__installed', {
      value: true,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  window.__renderDiag = registry;
  window.__renderDiagnostics = registry;

  registerExistingTargets(registry);

  if (autoRefresh && !registry.__autoRefreshAttached) {
    let active = true;
    const tick = () => {
      if (!active || window.__renderDiag !== registry) return;
      registerExistingTargets(registry);
      if (getRendererSurface()) return;
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
    const unsubscribe = registry.onChange(() => {
      if (!getRendererSurface()) {
        window.requestAnimationFrame(tick);
      }
    });
    const stop = () => {
      active = false;
      unsubscribe();
    };
    Object.defineProperty(registry, '__stopAutoRefresh', {
      value: stop,
      configurable: true,
      enumerable: false,
      writable: false,
    });
    Object.defineProperty(registry, '__autoRefreshAttached', {
      value: true,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  } else if (!autoRefresh && registry.__stopAutoRefresh) {
    try {
      registry.__stopAutoRefresh();
    } catch {
      /* ignore */
    }
  }

  logInstructions();
  return registry;
}

if (isBrowser && DEV) {
  window.installRenderDiagnostics =
    window.installRenderDiagnostics || installRenderDiagnostics;
  if (!window.__renderDiag) {
    installRenderDiagnostics({ autoRefresh: true });
  }
}

export default installRenderDiagnostics;
