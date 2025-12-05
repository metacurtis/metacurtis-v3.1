// CANONICAL AUTHORITY — SST v3.5 (Unified Single Source)
import sstRaw from '../sst-loader.js';
import { PARTICLE_EFFECTS as OVERRIDE_PARTICLE_EFFECTS, CAMERA_EFFECTS as OVERRIDE_CAMERA_EFFECTS } from './visualEffects.js';

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

const RENDER_UNIFORM_KEYS = [
  'uMotionMode',
  'uFlowTurbulence',
  'uParticleFlash',
  'uOpacityMin',
  'uOpacityMax',
  'uStreakIntensity',
  'tierHighlight',
  'pointSize',
  'uniforms',
  'activeCount',
  'drawCount',
];

// Conservative motion-map: stick to renderer-supported modes (0-4)
const MOTION_MODE_MAP = {
  drift_perlin: 3,
  flicker: 0,
  structuralLock: 1,
  vertexPulse: 0,
  grid_drift: 1,
  breathe: 0,
  edgeLock: 1,
  cadencePulse: 0,
  neural_flow: 2,
  strokeFlow: 2,
  synapseFlash: 3,
  hubNode: 1,
  lag: 3,
  streak: 3,
  burst: 3,
  lead: 3,
  grid_flow: 1,
  modular: 1,
  blueprintPulse: 0,
  constructionGuide: 1,
  laminar_flow: 2,
  orbit_sync: 4,
  ballet: 4,
  conductor: 1,
  cosmic_dust: 4,
  galactic_arm: 4,
  consciousness_node: 0,
  transcendent: 4,
};

/** True when the payload already contains renderer-ready fields */
function hasRendererUniforms(effect) {
  if (!effect || typeof effect !== 'object') return false;
  return RENDER_UNIFORM_KEYS.some((key) => effect[key] !== undefined && effect[key] !== null);
}

/** Lightweight mapper: SST-style effect → renderer-ready directive */
function translateToRendererDirective(verb, effect = {}) {
  if (!effect || effect.type === 'camera') return effect;

  // Preserve existing renderer-ready payloads
  const payload = { ...effect };
  if (!payload.source) payload.source = 'beat_visual';
  if (!payload.verb) payload.verb = verb;
  if (hasRendererUniforms(payload)) return payload;

  const verbKey = String(verb || '').toLowerCase();
  const translated = {
    source: payload.source,
    verb: payload.verb,
  };

  const normalizedType = String(effect.type || effect.behavior || effect.pattern || '').trim();
  const mappedMode = normalizedType ? MOTION_MODE_MAP[normalizedType] : undefined;
  if (mappedMode !== undefined) {
    translated.uMotionMode = mappedMode;
  }

  // Tier modes / params (shader actually uses uTierMode/uTierParams)
  const tierModesPayload = Array.isArray(effect.tierModes) ? effect.tierModes : null;
  const tierParamsPayload = Array.isArray(effect.tierParams) ? effect.tierParams : null;

  if (tierModesPayload) {
    translated.tierModes = tierModesPayload;
  } else {
    // Heuristic fallback for tierModes if we have a mappedMode
    const mode = translated.uMotionMode;
    if (mode !== undefined) {
      translated.tierModes = [mode, mode, mode, mode];
    } else if (verbKey.includes('grid') || verbKey.includes('structure') || verbKey.includes('column')) {
      translated.tierModes = [1, 1, 1, 1];
      translated.uMotionMode = 1;
    } else if (verbKey.includes('flow')) {
      translated.tierModes = [2, 2, 2, 2];
      translated.uMotionMode = 2;
    } else if (verbKey.includes('streak') || verbKey.includes('trail') || verbKey.includes('velocity')) {
      translated.tierModes = [3, 3, 3, 3];
      translated.uMotionMode = 3;
    } else if (verbKey.includes('orbit')) {
      translated.tierModes = [4, 4, 4, 4];
      translated.uMotionMode = 4;
    } else if (verbKey.includes('drift')) {
      translated.tierModes = [0, 0, 0, 0];
      translated.uMotionMode = 3;
    }
  }

  // Turbulence / speed
  if (typeof effect.speed === 'number') {
    translated.uFlowTurbulence = Math.max(0, Math.min(2, effect.speed));
  } else if (typeof effect.amplitude === 'number') {
    translated.uFlowTurbulence = Math.max(0, Math.min(2, effect.amplitude * 0.5));
  }

  // Flash / pulse intensity
  if (effect.pulse && typeof effect.pulse.intensity === 'number') {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.pulse.intensity));
  } else if (typeof effect.intensity === 'number' && verbKey.includes('pulse')) {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.intensity));
  } else if (typeof effect.probability === 'number') {
    translated.uParticleFlash = Math.max(0, Math.min(1, effect.probability));
  }

  // Streak intensity / trail length
  if (typeof effect.trailLength === 'number') {
    translated.uStreakIntensity = Math.min(effect.trailLength / 3, 1.0);
  } else if (typeof effect.streakIntensity === 'number') {
    translated.uStreakIntensity = effect.streakIntensity;
  }

  // Tier targeting
  if (Array.isArray(effect.tiers)) {
    translated.tierHighlight = effect.tiers;
  } else if (typeof effect.tiers === 'number') {
    translated.tierHighlight = [effect.tiers];
  }

  // Opacity range
  if (Array.isArray(effect.opacity) && effect.opacity.length >= 2) {
    translated.uOpacityMin = Math.max(0, Math.min(1, effect.opacity[0]));
    translated.uOpacityMax = Math.max(0, Math.min(1, effect.opacity[1]));
  } else if (typeof effect.opacity === 'number') {
    translated.uOpacityMin = Math.max(0, Math.min(1, effect.opacity));
  }
  if (typeof effect.fadeTrail === 'number') {
    translated.uOpacityMax = Math.max(0, Math.min(1, effect.fadeTrail));
  }
  if (translated.uOpacityMin === undefined && translated.uOpacityMax !== undefined) {
    translated.uOpacityMin = Math.max(0, Math.min(1, translated.uOpacityMax * 0.5));
  }
  if (translated.uOpacityMax === undefined && translated.uOpacityMin !== undefined) {
    translated.uOpacityMax = Math.max(translated.uOpacityMin, 1.0);
  }
  if (translated.uOpacityMin === undefined && translated.uOpacityMax === undefined) {
    translated.uOpacityMin = 0.5;
    translated.uOpacityMax = 1.0;
  }

  if (typeof effect.uSpreadFactor === 'number') {
    translated.uSpreadFactor = effect.uSpreadFactor;
  }

  // Tier params: use provided payload, otherwise derive from speed/amplitude/turbulence
  if (tierParamsPayload && tierParamsPayload.length >= 4) {
    translated.tierParams = tierParamsPayload;
  } else if (translated.tierModes) {
    const speed = typeof effect.speed === 'number' ? effect.speed : 0.8;
    const amp = typeof effect.amplitude === 'number' ? effect.amplitude : 0.2;
    const freq = typeof effect.frequency === 'number' ? effect.frequency : 0.5;
    const params = [speed, amp, freq, 0.0];
    translated.tierParams = [params, params, params, params];
  }

  // Drift-specific amplitude/frequency (for renderer + shader semantics)
  // Pass through explicit SST values, otherwise supply gentle defaults for drift verbs.
  if (typeof effect.amplitude === 'number') {
    translated.amplitude = effect.amplitude;
  } else if (verbKey.includes('drift') && translated.amplitude == null) {
    translated.amplitude = 0.25; // "breathing" baseline
  }

  if (typeof effect.frequency === 'number') {
    translated.frequency = effect.frequency;
  } else if (verbKey.includes('drift') && translated.frequency == null) {
    translated.frequency = 0.15;
  }

  // Point size from scale
  if (typeof effect.scale === 'number') {
    translated.pointSize = Math.max(0.5, Math.min(3.0, effect.scale));
  }

  return hasRendererUniforms(translated) ? translated : payload;
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
    if (stageData.memoryFragments && !stageData.memoryFragment) {
      stageData.memoryFragment =
        stageData.memoryFragments.interactive ||
        stageData.memoryFragments.ambient ||
        stageData.memoryFragments.climax ||
        null;
    }
    if (!stageNarrative.word && letterGeometry?.[stageName]?.word) {
      stageNarrative.word = letterGeometry[stageName].word;
    }
    if (!stageNarrative.memoryFragments && stageData.memoryFragments) {
      stageNarrative.memoryFragments = clone(stageData.memoryFragments);
    }
    if (!stageNarrative.memoryFragment) {
      const primary =
        stageData.memoryFragments?.interactive ||
        stageData.memoryFragments?.ambient ||
        stageData.memoryFragment ||
        null;
      if (primary) {
        stageNarrative.memoryFragment = clone(primary);
      }
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

  const visualEffects = clone(sst.visualEffects || {});
  visualEffects.particleEffects = {
    ...(visualEffects.particleEffects || {}),
    ...(OVERRIDE_PARTICLE_EFFECTS || {}),
  };
  visualEffects.cameraEffects = {
    ...(visualEffects.cameraEffects || {}),
    ...(OVERRIDE_CAMERA_EFFECTS || {}),
  };

  const getVisualEffect = (visualVerb, type = 'particle') => {
    if (!visualVerb || visualVerb === 'no_change') return null;

    const effectKey = type === 'camera' ? 'cameraEffects' : 'particleEffects';
    const effects = visualEffects?.[effectKey];

    if (!effects) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] No ${effectKey} registry found`);
      }
      return null;
    }

    const effect = effects[visualVerb];

    if (!effect) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] Unknown visual verb: "${visualVerb}" (type: ${type})`);
      }
      return null;
    }

    const translated = translateToRendererDirective(visualVerb, effect);

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(`🎨 [Canonical] Resolved visual verb: "${visualVerb}" →`, translated);
    }
    return translated;
  };

  const getBeatSheet = (stageName) => {
    if (!stageName) return null;

    const beatSheets = sst.narrative?.beatSheets;
    if (!beatSheets) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn('🎨 [Canonical] No beat sheets found');
      }
      return null;
    }

    const key = String(stageName);
    const beatSheet = beatSheets[key];

    if (!beatSheet) {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn(`🎨 [Canonical] No beat sheet for stage: "${key}"`);
      }
      return null;
    }

    return clone(beatSheet);
  };

  const getAllVisualVerbs = () => Object.keys(visualEffects?.particleEffects || {});
  const getCoverageStats = () => {
    const verbs = getAllVisualVerbs();
    let translatable = 0;
    let cameraOnly = 0;
    verbs.forEach((verb) => {
      const eff = visualEffects?.particleEffects?.[verb] || null;
      if (eff && eff.type === 'camera') {
        cameraOnly += 1;
        return;
      }
      const resolved = getVisualEffect(verb);
      if (resolved) translatable += 1;
    });
    const total = verbs.length;
    const untranslatable = Math.max(0, total - translatable - cameraOnly);
    const coverage = total > 0 ? ((translatable / total) * 100).toFixed(1) : '0.0';
    return { total, translatable, cameraOnly, untranslatable, coverage: `${coverage}%` };
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
    const source =
      (st.memoryFragments && typeof st.memoryFragments === 'object')
        ? st.memoryFragments
        : (st.memoryFragment
            ? { interactive: st.memoryFragment }
            : null);
    if (!source) return [];

    const fragments = [];
    for (const [tier, fragment] of Object.entries(source)) {
      if (!fragment || typeof fragment !== 'object') continue;
      const cloned = clone(fragment);
      const fallbackName = `${stage} ${tier}`.replace(/_/g, ' ');
      const normalized = {
        ...cloned,
        tier,
        stage,
      };
      if (!normalized.id) normalized.id = `${stage}_${tier}`;
      if (!normalized.name) normalized.name = normalized.title || fallbackName;
      if (!normalized.type) normalized.type = tier;
      fragments.push(normalized);
    }
    return fragments;
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
    visualEffects,
    getStageByName, getStageByIndex, getStageByScroll,
    isFeatureEnabled, getFragmentsForStage, getActiveFragments,
    getVisualEffect, getBeatSheet,
    getCoverageStats, getAllVisualVerbs,
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
    // Alias for tools expecting canonicalAuthority
    if (!window.canonicalAuthority) {
      Object.defineProperty(window, 'canonicalAuthority', {
        value: Canonical,
        writable: false,
        configurable: false
      });
    }
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
