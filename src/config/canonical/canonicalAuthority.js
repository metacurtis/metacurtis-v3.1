// CANONICAL AUTHORITY — SST v3.5 (Unified Single Source)
import sstRaw from '../sst-loader.js';

/** Deep-freeze utility (keeps Canonical read-only) */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) deepFreeze(obj[k]);
  }
  return obj;
}

/** Safe clone */
function clone(obj) {
  try { return typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)); }
  catch { return JSON.parse(JSON.stringify(obj)); }
}

function buildCanonical(source) {
  const sst = clone(source);
  const stageOrder = Array.isArray(sst.stageOrder) ? sst.stageOrder.slice() : Object.keys(sst.stages || {});
  const letterGeometry = sst.visual?.letterGeometry || {};

  // Back-compat aliases for existing code paths
  for (const key of Object.keys(sst.stages || {})) {
    const st = sst.stages[key] || {};
    if (!st.name) st.name = key;
    if (Array.isArray(st.palette) && !st.colors) st.colors = st.palette.slice(0,3);
    if (typeof st.particlesBase === 'number' && !st.particleCount) st.particleCount = st.particlesBase;
    // 👇 add scrollRange alias for validators/tools that still expect it
    if (Array.isArray(st.scrollRangePercent) && !st.scrollRange) st.scrollRange = st.scrollRangePercent.slice(0,2);
    if (!st.label) st.label = key;
    if (!st.word && letterGeometry?.[key]?.word) {
      st.word = letterGeometry[key].word;
    }
  }

  const openingRules = (sst.opening && sst.opening.rules) || sst.openingRules || {};
  const openingTimeline = (sst.opening && sst.opening.timeline) || sst.stages?.genesis?.openingTimeline || {};
  const openingFencepost = (sst.opening && (sst.opening.fencepost || sst.opening.fencepostOrder)) || sst.openingFencepost || {};
  const opening = {
    ...(sst.opening || {}),
    rules: openingRules,
    timeline: openingTimeline,
    fencepost: openingFencepost
  };

  const narrativeStages = {};
  for (const stageName of stageOrder) {
    const stageNarrative = sst.narrative?.stages?.[stageName] ? clone(sst.narrative.stages[stageName]) : {};
    const stageData = sst.stages?.[stageName] || {};
    if (!stageNarrative.word && letterGeometry?.[stageName]?.word) {
      stageNarrative.word = letterGeometry[stageName].word;
    }
    if (!stageNarrative.memoryFragment && stageData.memoryFragment) {
      stageNarrative.memoryFragment = stageData.memoryFragment;
    }
    if (!stageNarrative.audio && stageData.audio) {
      stageNarrative.audio = stageData.audio;
    }
    if (!stageNarrative.timeline && stageData.openingTimeline) {
      stageNarrative.timeline = stageData.openingTimeline;
    }
    narrativeStages[stageName] = stageNarrative;
  }

  const narrative = {
    ...(sst.narrative || {}),
    stages: narrativeStages
  };

  const getStageByName = (name) => sst.stages?.[name] ?? null;
  const getStageByIndex = (index) => {
    const safe = Math.max(0, Math.min(stageOrder.length - 1, Number(index) | 0));
    const name = stageOrder[safe];
    return sst.stages?.[name] ?? null;
  };
  const getStageByScroll = (progress = 0) => {
    const raw = Number(progress);
    const percent = Number.isFinite(raw)
      ? (Math.abs(raw) > 1 ? Math.max(0, Math.min(100, raw)) : Math.max(0, Math.min(1, raw)) * 100)
      : 0;
    const bps = sst.scrollAndMorph?.stageBreakpointsPercent || [0,14,28,42,56,70,84,100];
    for (let i = 0; i < bps.length - 1; i++) {
      if (percent >= bps[i] && percent < bps[i + 1]) return getStageByIndex(i);
    }
    return getStageByIndex(stageOrder.length-1);
  };
  const isFeatureEnabled = (k) => Boolean(sst.features && sst.features[k]);
  const getFragmentsForStage = (stage) => {
    const st = getStageByName(stage);
    if (!st) return [];
    return st.memoryFragment ? [st.memoryFragment] : [];
  };
  const getActiveFragments = (stage /*, scroll */) => getFragmentsForStage(stage);

  const SYSTEM_CONSTANTS = {
    TOTAL_STAGES: stageOrder.length,
    MIN_STAGE_INDEX: 0,
    MAX_STAGE_INDEX: stageOrder.length - 1,
    OPERATIONAL_PARTICLES: sst.quality?.maxParticles ?? 15000,
    SHOWCASE_PARTICLES: Math.min((sst.quality?.maxParticles ?? 15000)+2000, 17000),
    TARGET_FPS: sst.performance?.frameRate?.target ?? sst.performance?.frameRate?.targetFps ?? 60,
    LIGHTHOUSE_TARGET: 90
  };

  const Canonical = {
    meta: sst.meta || {},
    version: sst.meta?.version ?? '3.5',
    authority: sst.meta?.authority ?? 'ABSOLUTE',
    stages: sst.stages || {},
    stageOrder,
    visual: sst.visual || {},
    narrative,
    pipeline: sst.pipeline || {},
    features: sst.features || {},
    performance: sst.performance || {},
    quality: sst.quality || {},
    shaderContract: sst.shaderContract || {},
    events: sst.events || [],
    scrollAndMorph: sst.scrollAndMorph || {},
    openingFencepost: sst.openingFencepost || {},
    openingRules: sst.openingRules || {},
    opening,
    spriteSemantics: sst.spriteSemantics || {},
    integrityRules: sst.integrityRules || [],
    successMetrics: sst.successMetrics || {},
    implementationPhases: sst.implementationPhases || [],
    debugSurface: sst.debugSurface || {},
    changeLog: sst.changeLog || [],
    dialogue: narrative.stages || {},
    getStageByName, getStageByIndex, getStageByScroll,
    isFeatureEnabled, getFragmentsForStage, getActiveFragments,
    SYSTEM_CONSTANTS
  };
  return deepFreeze(Canonical);
}

export const Canonical = buildCanonical(sstRaw);

/** Probe history with temporal analysis utilities (dev only) */
function createProbeHistory() {
  const maxSamples = 300;
  const samples = [];
  let isRecording = false;
  let startTime = null;

  const getDuration = () => (samples[samples.length - 1]?.time ?? 0);

  return {
    start() {
      isRecording = true;
      startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
      samples.length = 0;
      console.log('[PROBE HISTORY] Recording started');
      return this;
    },
    stop() {
      isRecording = false;
      console.log(`[PROBE HISTORY] Recording stopped (${samples.length} samples)`);
      return this;
    },
    clear() {
      samples.length = 0;
      console.log('[PROBE HISTORY] Samples cleared');
      return this;
    },
    record(snapshot = {}) {
      if (!isRecording) return;

      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const origin = startTime || 0;

      samples.push({
        time: now - origin,
        timestamp: Date.now(),
        ...snapshot
      });

      if (samples.length > maxSamples) samples.shift();
    },
    get samples() {
      return [...samples];
    },
    query(predicate) {
      return typeof predicate === 'function' ? samples.filter(predicate) : [];
    },
    analyze() {
      if (!samples.length) return { error: 'No samples recorded' };

      const fpsSamples = samples.map((s) => s.fps).filter((v) => typeof v === 'number');
      const memorySamples = samples.map((s) => s.memory).filter((v) => typeof v === 'number');

      const fps = fpsSamples.length
        ? {
            min: Math.min(...fpsSamples),
            max: Math.max(...fpsSamples),
            avg: fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length,
            drops: fpsSamples.filter((f) => f < 55).length
          }
        : null;

      const memory = memorySamples.length
        ? {
            min: Math.min(...memorySamples),
            max: Math.max(...memorySamples),
            trend: memorySamples[memorySamples.length - 1] > memorySamples[0] ? 'increasing' : 'stable'
          }
        : null;

      return {
        duration: getDuration(),
        sampleCount: samples.length,
        fps,
        memory
      };
    },
    plot(metric = 'fps') {
      const values = samples.map((s) => s[metric]).filter((v) => typeof v === 'number');
      if (!values.length) return `No data for metric "${metric}"`;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;

      return values
        .map((value, index) => {
          const normalized = (value - min) / range;
          const barLength = Math.floor(normalized * 40);
          return `${index.toString().padStart(3, ' ')}: ${'='.repeat(barLength)} ${value.toFixed(1)}`;
        })
        .join('\n');
    },
    export() {
      return {
        meta: {
          startTime,
          duration: getDuration(),
          sampleCount: samples.length
        },
        samples: [...samples]
      };
    }
  };
}

// DEV exposure
const isDev =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

if (typeof window !== 'undefined' && isDev) {
  try {
    Object.defineProperty(window, 'Canonical', {
      value: Canonical,
      writable: false,
      configurable: false
    });
    Object.defineProperty(window, 'SST', {
      value: Canonical,
      writable: false,
      configurable: false
    });
    console.log(`📋 SST v${Canonical.version} loaded as window.Canonical + window.SST (read-only)`);
  } catch (err) {
    console.warn('Failed to expose SST canonical authority', err);
  }

  try {
    if (window.probe) {
      if (!window.probe.history) {
        window.probe.history = createProbeHistory();
      }

      if (typeof window.probe.draw === 'function' && !window.probe.__historyWrapped) {
        const originalDraw = window.probe.draw;
        window.probe.draw = function probeDrawWrapper(...args) {
          const result = originalDraw.apply(this, args);
          const history = window.probe.history;
          if (history && typeof history.record === 'function') {
            const fpsValue = typeof window.probe.fps === 'function' ? window.probe.fps() : undefined;
            const memoryValue =
              typeof performance !== 'undefined' && performance.memory
                ? performance.memory.usedJSHeapSize / 1048576
                : undefined;

            history.record({
              fps: typeof fpsValue === 'number' ? fpsValue : undefined,
              draw: result,
              memory: memoryValue
            });
          }
          return result;
        };
        window.probe.__historyWrapped = true;
      }

      console.log('✅ Probe History initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize probe history', err);
  }
}

export default Canonical;
