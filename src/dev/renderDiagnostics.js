import { EVENTS } from '@/theater/events.js';

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

const DIAG_EVENT_DIRECTIVE = EVENTS?.RENDER_DIRECTIVE ?? 'RENDER_DIRECTIVE';
const DIAG_EVENT_BLUEPRINT = EVENTS?.BLUEPRINT_READY ?? 'BLUEPRINT_READY';

const snapshotUniformValue = (value) => {
  if (value == null) return value;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) return value.slice();
  if (value instanceof Float32Array) return Array.from(value);
  if (value && typeof value.toArray === 'function') {
    const out = [];
    value.toArray(out);
    return out;
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
  return value;
};

function installPipelineDiagnosticSuite() {
  if (!isBrowser || !DEV) return;
  if (window.PIPELINE_DIAGNOSTIC) return;

  const getBeatBus = () => window.BeatBus || null;
  const eventName = DIAG_EVENT_DIRECTIVE;

  const identifySourceFromStack = (stack) => {
    if (!stack) return 'unknown';
    if (stack.includes('BlueprintBinder')) return 'BlueprintBinder';
    if (stack.includes('WebGLBackground')) return 'WebGLBackground';
    if (stack.includes('OpeningSequenceController')) return 'OpeningSequenceController';
    return 'unknown';
  };

  const identifyHandler = (handler) => {
    if (!handler) return 'unknown';
    if (handler.name) return handler.name;
    const src = handler.toString();
    if (src.includes('BlueprintBinder')) return 'BlueprintBinder';
    if (src.includes('WebGLBackground')) return 'WebGLBackground';
    if (src.includes('OpeningSequenceController')) return 'OpeningSequenceController';
    return 'anonymous';
  };

  const listDirectiveHandlers = () => {
    const bus = getBeatBus();
    if (!bus?.listeners?.get) return [];
    const set = bus.listeners.get(eventName);
    return set ? Array.from(set) : [];
  };

  const diag = {
    eventLog: [],
    subscribers: new Map(),

    mapEventFlow() {
      console.group('🔍 RENDER_DIRECTIVE Event Flow Mapping');
      const bus = getBeatBus();
      if (!bus) {
        console.error('❌ BeatBus not found');
        console.groupEnd();
        return { listenerCount: 0, listeners: [] };
      }
      const handlers = listDirectiveHandlers();
      const listenerCount = handlers.length;
      console.log(`📊 Total ${eventName} listeners: ${listenerCount}`);
      if (listenerCount > 1) {
        console.warn(`⚠️ Multiple listeners detected for ${eventName} (expected 1)`);
      }
      console.groupEnd();
      return {
        listenerCount,
        listeners: handlers.map((handler) => identifyHandler(handler)),
      };
    },

    identifySource(stack) {
      return identifySourceFromStack(stack);
    },

    traceDirective(verb = 'diagnostic_trace') {
      console.group(`🔬 Directive Trace: ${verb}`);
      const bus = getBeatBus();
      if (!bus) {
        console.error('❌ BeatBus not available');
        console.groupEnd();
        return [];
      }
      const handlers = listDirectiveHandlers();
      const trace = handlers.map((handler) => ({
        handler: identifyHandler(handler),
      }));

      const payload = {
        verb,
        effect: {
          type: 'particle',
          uMotionMode: 2,
          uFlowTurbulence: 0.5,
          uTierHighlight: 1,
        },
        source: 'pipeline_diagnostic',
      };

      const start = performance.now();
      try {
        bus.emit(eventName, payload);
      } catch (error) {
        console.error('❌ Emitting directive failed', error);
      }
      const duration = performance.now() - start;

      console.table(trace);
      console.log(`⏱️ Emit duration: ${duration.toFixed(2)}ms`);
      if (trace.length > 2) {
        console.warn('⚠️ More than two handlers processed the directive');
      }
      console.groupEnd();
      return trace;
    },

    detectUpdateSource() {
      const stack = new Error().stack || '';
      return identifySourceFromStack(stack);
    },

    monitorUniformUpdates(duration = 5000) {
      console.group(`🔬 Uniform Update Monitor (${duration}ms)`);
      const material = window.__webglBackground?.material;
      if (!material?.uniforms) {
        console.error('❌ WebGLBackground material not available');
        console.groupEnd();
        return [];
      }
      const records = [];
      const baseline = new Map(
        Object.entries(material.uniforms).map(([key, uniform]) => [
          key,
          JSON.stringify(snapshotUniformValue(uniform?.value)),
        ]),
      );
      const start = performance.now();
      const timer = setInterval(() => {
        Object.entries(material.uniforms).forEach(([key, uniform]) => {
          const serialized = JSON.stringify(snapshotUniformValue(uniform?.value));
          const prev = baseline.get(key);
          if (serialized !== prev) {
            records.push({
              time: `${(performance.now() - start).toFixed(1)}ms`,
              uniform: key,
              source: diag.detectUpdateSource(),
              newValue: snapshotUniformValue(uniform?.value),
            });
            baseline.set(key, serialized);
          }
        });
      }, 16);

      setTimeout(() => {
        clearInterval(timer);
        console.table(records);
        const uniqueUniforms = new Set(records.map((record) => record.uniform));
        console.log(`📊 Updates: ${records.length} · Unique uniforms: ${uniqueUniforms.size}`);
        if (records.length === 0) {
          console.log('✅ No uniform changes detected during window');
        }
        console.groupEnd();
      }, duration);
      return records;
    },

    getMostUpdated(updates) {
      if (!updates?.length) return 'none';
      const counts = updates.reduce((acc, update) => {
        acc[update.uniform] = (acc[update.uniform] || 0) + 1;
        return acc;
      }, {});
      let maxUniform = 'unknown';
      let maxCount = 0;
      Object.entries(counts).forEach(([uniform, count]) => {
        if (count > maxCount) {
          maxUniform = uniform;
          maxCount = count;
        }
      });
      return `${maxUniform} (${maxCount} updates)`;
    },

    validatePathways() {
      console.group('🔍 Render Pathway Validation');
      const checks = {
        narrationController: Boolean(window.narrationController || window.narrativeAtom),
        beatBus: Boolean(getBeatBus()),
        blueprintBinder: Boolean(window.__webglBinder),
        webglBackground: Boolean(window.__webglBackground),
        material: Boolean(window.__webglBackground?.material),
        uniforms: Boolean(window.__webglBackground?.material?.uniforms),
      };
      console.table(checks);

      const binderHasHandler =
        typeof window.__webglBinder?.applyDirective === 'function';
      const bgHasHandler =
        typeof window.__webglBackground?.handleDirective === 'function';

      console.log('🔎 Directive handlers:');
      console.log(`  BlueprintBinder: ${binderHasHandler}`);
      console.log(`  WebGLBackground: ${bgHasHandler}`);

      const dual = binderHasHandler && bgHasHandler;
      if (dual) {
        console.warn('⚠️ Dual RENDER_DIRECTIVE handlers detected');
      }
      console.groupEnd();
      return {
        checks,
        dualSubscription: dual,
        recommendation: dual ? 'Consolidate directive handling to a single source' : 'No action needed',
      };
    },

    detectRaces(testDuration = 3000) {
      console.group(`🔬 Race Condition Detector (${testDuration}ms)`);
      const bus = getBeatBus();
      const material = window.__webglBackground?.material;
      if (!bus || !material) {
        console.error('❌ Missing BeatBus or material');
        console.groupEnd();
        return [];
      }
      const races = [];
      let emitted = 0;

      const tick = setInterval(() => {
        emitted += 1;
        const before = material.uniformsNeedUpdate;
        bus.emit(eventName, {
          verb: `race_test_${emitted}`,
          effect: { type: 'particle', uTierHighlight: emitted % 4 },
          source: 'pipeline_race_test',
        });
        setTimeout(() => {
          if (before === true && material.uniformsNeedUpdate === false) {
            races.push({
              directive: emitted,
              issue: 'uniformsNeedUpdate toggled unexpectedly',
            });
          }
        }, 10);
      }, 100);

      setTimeout(() => {
        clearInterval(tick);
        console.log(`📊 Directives emitted: ${emitted}`);
        if (races.length) {
          console.warn('⚠️ Potential races detected:');
          console.table(races);
        } else {
          console.log('✅ No race conditions detected');
        }
        console.groupEnd();
      }, testDuration);

      return races;
    },

    testSimplePath() {
      console.group('🎯 Simple Pathway Test');
      const bus = getBeatBus();
      const material = window.__webglBackground?.material;
      if (!bus || !material?.uniforms) {
        console.error('❌ Missing BeatBus or material uniforms');
        console.groupEnd();
        return;
      }
      const snapshotBefore = {
        uMotionMode: material.uniforms.uMotionMode?.value,
        uTierHighlight: material.uniforms.uTierHighlight?.value,
        uFlowTurbulence: material.uniforms.uFlowTurbulence?.value,
      };
      console.log('📊 Before:', snapshotBefore);
      bus.emit(eventName, {
        verb: 'simple_test',
        effect: {
          type: 'particle',
          uMotionMode: 3,
          uTierHighlight: 2,
          uFlowTurbulence: 0.8,
        },
        source: 'pipeline_simple_test',
      });
      setTimeout(() => {
        const snapshotAfter = {
          uMotionMode: material.uniforms.uMotionMode?.value,
          uTierHighlight: material.uniforms.uTierHighlight?.value,
          uFlowTurbulence: material.uniforms.uFlowTurbulence?.value,
        };
        console.log('📊 After:', snapshotAfter);
        const changed = {
          uMotionMode: snapshotAfter.uMotionMode !== snapshotBefore.uMotionMode,
          uTierHighlight: snapshotAfter.uTierHighlight !== snapshotBefore.uTierHighlight,
          uFlowTurbulence: snapshotAfter.uFlowTurbulence !== snapshotBefore.uFlowTurbulence,
        };
        console.log('✅ Changes detected:', changed);
        if (Object.values(changed).every(Boolean)) {
          console.log('🎉 Directive successfully propagated to shader uniforms');
        } else {
          console.warn('⚠️ Some uniforms did not update — investigate directive handling');
        }
        console.groupEnd();
      }, 100);
    },

    generateReport() {
      console.group('📋 COMPLETE PIPELINE DIAGNOSTIC REPORT');
      const flow = this.mapEventFlow();
      const pathways = this.validatePathways();
      this.testSimplePath();
      setTimeout(() => {
        console.log('📊 Summary recommendations:');
        if (pathways.dualSubscription) {
          console.warn('🔴 Dual directive handlers detected · consolidate updates');
        }
        if ((flow?.listenerCount ?? 0) > 1) {
          console.warn('🟡 Multiple RENDER_DIRECTIVE listeners registered');
        }
        console.log('Next steps:');
        console.log('  1. PIPELINE_DIAGNOSTIC.detectRaces()');
        console.log('  2. PIPELINE_DIAGNOSTIC.monitorUniformUpdates()');
        console.log('  3. Review directive ownership');
        console.groupEnd();
      }, 500);
    },
  };

  window.PIPELINE_DIAGNOSTIC = diag;

  console.log('');
  console.log('🔧 Rendering Pipeline Diagnostics Ready');
  console.log('════════════════════════════════════════');
  console.log('📋 Full report: window.PIPELINE_DIAGNOSTIC.generateReport()');
  console.log('🔬 Utilities: mapEventFlow(), validatePathways(), testSimplePath(), traceDirective(), detectRaces(), monitorUniformUpdates()');
  console.log('');
}

if (isBrowser && DEV) {
  window.installRenderDiagnostics =
    window.installRenderDiagnostics || installRenderDiagnostics;
  if (!window.__renderDiag) {
    installRenderDiagnostics({ autoRefresh: true });
  }
  installPipelineDiagnosticSuite();
}

export default installRenderDiagnostics;
