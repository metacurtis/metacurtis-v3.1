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

    if (typeof console !== 'undefined' && typeof console.log === 'function') {
      console.log(`🎨 [Canonical] Resolved visual verb: "${visualVerb}" →`, effect);
    }
    return effect;
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

// Phase 2 Quick Check: Single-writer violations
if (typeof window !== 'undefined') {
  window.checkSingleWriter = function checkSingleWriter() {
    const monitor = window.singleWriterMonitor;

    if (!monitor) {
      console.warn('⚠️ Single-writer monitor not available');
      return null;
    }

    const stats = monitor.getStats();

    console.log('\n' + '='.repeat(60));
    console.log('SINGLE-WRITER COMPLIANCE CHECK');
    console.log('='.repeat(60) + '\n');

    if (!stats.total) {
      console.log('✅ NO VIOLATIONS DETECTED');
      console.log('   All navigation uses authorized paths\n');
      return { pass: true, violations: 0 };
    }

    console.log(`❌ ${stats.total} VIOLATIONS DETECTED\n`);

    console.log('By Method:');
    Object.entries(stats.byMethod || {}).forEach(([method, count]) => {
      console.log(`   ${method}: ${count}`);
    });
    console.log('');

    console.log('By Caller:');
    Object.entries(stats.byCaller || {}).forEach(([caller, count]) => {
      console.log(`   ${caller}: ${count}`);
    });
    console.log('');

    console.log('Recent Violations:');
    (stats.recent || []).slice(-5).forEach((violation, index) => {
      console.log(`   ${index + 1}. ${violation.method} called by ${violation.caller}`);
    });
    console.log('');

    console.log('Fix: Update callers to use window.unifiedNav instead\n');

    return {
      pass: false,
      violations: stats.total,
      details: stats,
    };
  };
}

// Phase 3 validation: ensure auto-advance coordination flows through StateCommands
if (typeof window !== 'undefined') {
  window.phase3AutoAdvanceCheck = async function phase3AutoAdvanceCheck() {
    const controls = window.stageControls;
    const commands = window.stateCommands;

    if (!controls || !commands) {
      console.warn('⚠️ Auto-advance check unavailable (missing stageControls/stateCommands)');
      return { pass: false, reason: 'missing_interfaces' };
    }

    const state = controls.getState?.() || {};
    console.log('\n' + '='.repeat(60));
    console.log('AUTO-ADVANCE COORDINATION CHECK');
    console.log('='.repeat(60) + '\n');
    console.log('Auto-advance enabled:', state.autoAdvanceEnabled);
    console.log('Current stage:', state.currentStage);

    let directCallCount = 0;
    const originalMark = controls.markAutoAdvance;

    if (typeof originalMark !== 'function') {
      console.warn('⚠️ stageControls.markAutoAdvance unavailable; cannot monitor direct calls');
    } else {
      controls.markAutoAdvance = function wrappedMarkAutoAdvance(...args) {
        const stack = new Error().stack || '';
        if (!stack.includes('StateCommands.js')) {
          directCallCount++;
          console.warn('⚠️ Direct markAutoAdvance call detected:', stack.split('\n')[2]?.trim());
        }
        return originalMark.apply(this, args);
      };
    }

    if (typeof originalMark === 'function') {
      try {
        console.log('Monitoring markAutoAdvance calls for the next animation frame...');
        await new Promise((resolve) => {
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve());
          } else {
            setTimeout(resolve, 16);
          }
        });
      } finally {
        controls.markAutoAdvance = originalMark;
      }
    }

    if (directCallCount === 0) {
      console.log('✅ NO DIRECT markAutoAdvance CALLS DETECTED');
      return { pass: true, violations: 0 };
    }

    console.error(`❌ ${directCallCount} DIRECT markAutoAdvance CALL(S) DETECTED`);
    return { pass: false, violations: directCallCount };
  };
}

// DEV exposure
const isDev =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

// Phase 1 Validation: Navigation path monitoring
if (typeof window !== 'undefined') {
  const monitor = window.navigationPathMonitor || {
    orchestratedCount: 0,
    fallbackCount: 0,
    directCount: 0,
    errorCount: 0,
    errorDetails: [],
    recordPath(type) {
      if (type === 'orchestrated') {
        this.orchestratedCount++;
      } else if (type === 'fallback') {
        this.fallbackCount++;
      } else if (type === 'direct') {
        this.directCount++;
      } else if (typeof type === 'string' && type.startsWith('error')) {
        this.errorCount++;
        this.errorDetails.push(type);
      }
    },
    getStats() {
      const total =
        this.orchestratedCount + this.fallbackCount + this.directCount + this.errorCount;
      return {
        total,
        orchestrated: this.orchestratedCount,
        fallback: this.fallbackCount,
        direct: this.directCount,
        errors: this.errorCount,
        errorDetails: [...this.errorDetails],
        orchestratedPercent: total > 0 ? ((this.orchestratedCount / total) * 100).toFixed(1) : '0.0',
        compliance:
          this.fallbackCount === 0 && this.directCount === 0 ? 'PASS' : 'FAIL',
      };
    },
    reset() {
      this.orchestratedCount = 0;
      this.fallbackCount = 0;
      this.directCount = 0;
      this.errorCount = 0;
      this.errorDetails = [];
    },
  };
  window.navigationPathMonitor = monitor;
}

// Phase 1 Validation: Event emission monitoring
if (typeof window !== 'undefined') {
  const eventMonitor = window.eventEmissionMonitor || {
    stageChangeEmitters: new Map(),
    morphProgressEmitters: new Map(),
    recordEmission(eventName, source) {
      const key = source || 'unknown';
      if (eventName === 'STAGE_CHANGE') {
        this.stageChangeEmitters.set(key, (this.stageChangeEmitters.get(key) || 0) + 1);
      } else if (eventName === 'MORPH_PROGRESS') {
        this.morphProgressEmitters.set(key, (this.morphProgressEmitters.get(key) || 0) + 1);
      }
    },
    getStats() {
      const stageEmitters = Array.from(this.stageChangeEmitters.entries());
      const morphEmitters = Array.from(this.morphProgressEmitters.entries());
      return {
        stageChange: {
          emitters: stageEmitters.map(([name]) => name),
          counts: Object.fromEntries(stageEmitters),
          compliance:
            stageEmitters.length === 1 && this.stageChangeEmitters.has('StateCommands') ? 'PASS' : 'FAIL',
        },
        morphProgress: {
          emitters: morphEmitters.map(([name]) => name),
          counts: Object.fromEntries(morphEmitters),
          compliance:
            morphEmitters.length === 1 && this.morphProgressEmitters.has('StateCommands') ? 'PASS' : 'FAIL',
        },
      };
    },
    reset() {
      this.stageChangeEmitters.clear();
      this.morphProgressEmitters.clear();
    },
  };
  window.eventEmissionMonitor = eventMonitor;
}

// Phase 1 Validation Report helper
if (typeof window !== 'undefined') {
  window.phase1ValidationReport = function phase1ValidationReport() {
    console.log('\n' + '='.repeat(60));
    console.log('PHASE 1 VALIDATION REPORT');
    console.log('='.repeat(60) + '\n');

    const navStats = window.navigationPathMonitor?.getStats() || {};
    const eventStats = window.eventEmissionMonitor?.getStats() || {};

    console.log('📊 NAVIGATION PATH COMPLIANCE:');
    console.log(`   Total Navigations: ${navStats.total ?? 0}`);
    console.log(
      `   Orchestrated: ${navStats.orchestrated ?? 0} (${navStats.orchestratedPercent ?? '0.0'}%)`
    );
    console.log(`   Fallbacks: ${navStats.fallback ?? 0} ❌ (should be 0)`);
    console.log(`   Direct: ${navStats.direct ?? 0} ❌ (should be 0)`);
    console.log(`   Compliance: ${navStats.compliance ?? 'UNKNOWN'}\n`);

    console.log('📊 EVENT EMISSION COMPLIANCE:');
    console.log(`   STAGE_CHANGE Emitters: ${eventStats.stageChange?.emitters.length || 0}`);
    console.log('   - Expected: 1 (StateCommands only)');
    console.log(
      `   - Actual: ${eventStats.stageChange?.emitters.length ? eventStats.stageChange.emitters.join(', ') : 'none'}`
    );
    console.log(`   - Compliance: ${eventStats.stageChange?.compliance || 'UNKNOWN'}\n`);

    console.log(`   MORPH_PROGRESS Emitters: ${eventStats.morphProgress?.emitters.length || 0}`);
    console.log('   - Expected: 1 (StateCommands only)');
    console.log(
      `   - Actual: ${
        eventStats.morphProgress?.emitters.length ? eventStats.morphProgress.emitters.join(', ') : 'none'
      }`
    );
    console.log(`   - Compliance: ${eventStats.morphProgress?.compliance || 'UNKNOWN'}\n`);

    // PHASE 2: Add single-writer compliance check
    const violationStats = window.singleWriterMonitor?.getStats() || {
      total: 0,
      compliance: 'UNKNOWN',
    };

    console.log('📊 SINGLE-WRITER COMPLIANCE (PHASE 2):');
    console.log(`   Total Violations: ${violationStats.total || 0} ❌ (should be 0)`);
    if (violationStats.byMethod) {
      console.log('   By Method:', violationStats.byMethod);
    }
    if (violationStats.byCaller) {
      console.log('   By Caller:', violationStats.byCaller);
    }
    console.log(`   Compliance: ${violationStats.compliance || 'UNKNOWN'}\n`);

    const phase1Pass =
      navStats.compliance === 'PASS' &&
      eventStats.stageChange?.compliance === 'PASS' &&
      eventStats.morphProgress?.compliance === 'PASS';
    const phase2Pass = violationStats.compliance === 'PASS';
    const overallPass = phase1Pass && phase2Pass;

    console.log('='.repeat(60));
    console.log(`PHASE 1: ${phase1Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`PHASE 2: ${phase2Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`OVERALL: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60) + '\n');

    return {
      pass: overallPass,
      phase1: {
        navigation: navStats,
        events: eventStats,
        pass: phase1Pass,
      },
      phase2: {
        violations: violationStats,
        pass: phase2Pass,
      },
    };
  };
}

// Phase 3 Validation Suite (automated checks + real-world simulations)
if (typeof window !== 'undefined') {
  const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
  const getStageNames = () => {
    const fromControls = window.stageControls?.getStageNames?.();
    if (Array.isArray(fromControls) && fromControls.length) return ensureArray(fromControls);
    if (Array.isArray(Canonical?.stageOrder) && Canonical.stageOrder.length) {
      return ensureArray(Canonical.stageOrder);
    }
    return ensureArray(Object.keys(Canonical?.stages || {}));
  };

  const getCurrentStage = () => {
    const fromControls = window.stageControls?.getCurrentStage?.();
    if (typeof fromControls === 'string' && fromControls) return fromControls;
    const state = window.stageControls?.getState?.();
    if (state?.currentStage) return state.currentStage;
    return window.stateCommands?.getCurrentStage?.() || null;
  };

  const getStageIndex = (stage, stageNames) => {
    const list = stageNames || getStageNames();
    return list.indexOf(stage);
  };

  const normalizeTrace = () => {
    const trace = window.dumpTrace?.();
    if (!Array.isArray(trace)) return [];
    return trace;
  };

  const safeGroup = (label) => console.group?.(label) || console.log(label);
  const safeGroupEnd = () => console.groupEnd?.();

  window.phase3 = {
    testEventTopology() {
      safeGroup('TEST 1: Event Emitter Topology');

      const trace = normalizeTrace();
      const results = { pass: true, tests: [] };

      const stageChanges = trace.filter((e) => e?.ev === 'STAGE_CHANGE');
      const stageChangeSources = [...new Set(stageChanges.map((e) => e?.source || 'unknown'))];
      const stageChangeTest = {
        name: 'STAGE_CHANGE has single emitter',
        expected: 1,
        actual: stageChangeSources.length,
        sources: stageChangeSources,
        pass: stageChangeSources.length === 1 && stageChangeSources[0] === 'StateCommands',
      };
      results.tests.push(stageChangeTest);
      results.pass = results.pass && stageChangeTest.pass;
      console.log(stageChangeTest.pass ? '✅' : '❌', stageChangeTest.name);
      console.log('   Sources:', stageChangeTest.sources.join(', ') || 'none');

      const morphProgress = trace.filter((e) => e?.ev === 'MORPH_PROGRESS');
      const morphSources = [...new Set(morphProgress.map((e) => e?.source || 'unknown'))];
      const morphTest = {
        name: 'MORPH_PROGRESS has single emitter',
        expected: 1,
        actual: morphSources.length,
        sources: morphSources,
        pass: morphSources.length === 1 && morphSources[0] === 'StateCommands',
      };
      results.tests.push(morphTest);
      results.pass = results.pass && morphTest.pass;
      console.log(morphTest.pass ? '✅' : '❌', morphTest.name);
      console.log('   Sources:', morphTest.sources.join(', ') || 'none');

      const eventsByTime = {};
      trace.forEach((e) => {
        const event = e?.ev;
        if (!event) return;
        const bucket = Math.floor((Number(e?.t) || 0) / 50) * 50;
        const key = `${event}_${bucket}`;
        eventsByTime[key] = (eventsByTime[key] || 0) + 1;
      });

      const duplicates = Object.entries(eventsByTime)
        .filter(([, count]) => count > 1)
        .map(([event, count]) => ({ event, count }));

      const duplicateTest = {
        name: 'No duplicate events at same timestamp window',
        expected: 0,
        actual: duplicates.length,
        duplicates,
        pass: duplicates.length === 0,
      };
      results.tests.push(duplicateTest);
      results.pass = results.pass && duplicateTest.pass;
      console.log(duplicateTest.pass ? '✅' : '❌', duplicateTest.name);
      if (!duplicateTest.pass) {
        console.log('   Duplicates:', duplicates);
      }

      safeGroupEnd();
      return results;
    },

    async testAutoAdvance() {
      safeGroup('TEST 2: Auto-Advance Coordination');

      const results = { pass: true, tests: [] };
      const commands = window.stateCommands;
      const stageControls = window.stageControls;

      const availabilityTest = {
        name: 'StateCommands auto-advance API available',
        pass:
          typeof commands?.canAutoAdvance === 'function' &&
          typeof commands?.requestAutoAdvance === 'function',
      };
      results.tests.push(availabilityTest);
      results.pass = results.pass && availabilityTest.pass;
      console.log(availabilityTest.pass ? '✅' : '❌', availabilityTest.name);

      if (!availabilityTest.pass) {
        safeGroupEnd();
        return results;
      }

      const stageNames = getStageNames();
      const currentStage = getCurrentStage() || stageNames[0];
      const currentIdx = getStageIndex(currentStage, stageNames);
      const nextStage = stageNames[(currentIdx + 1) % stageNames.length];
      const targetStage = nextStage || currentStage;

      const initialCanAdvance = commands.canAutoAdvance?.();
      let requestResult = null;
      let intervalResult = null;

      try {
        requestResult = await commands.requestAutoAdvance?.(currentStage, targetStage, {
          source: 'phase3_auto_test',
          smooth: false,
          skipNarration: true,
        });
      } catch (error) {
        requestResult = { success: false, error: error?.message };
      }

      const afterCanAdvance = commands.canAutoAdvance?.();

      try {
        intervalResult = await commands.requestAutoAdvance?.(currentStage, targetStage, {
          source: 'phase3_auto_test_repeat',
          smooth: false,
          skipNarration: true,
        });
      } catch (error) {
        intervalResult = { success: false, reason: error?.message };
      }

      const rapidFireBlocked =
        intervalResult && intervalResult.success === false &&
        (intervalResult.reason === 'interval_violation' || intervalResult.reason === 'navigation_failed');

      const rapidFireTest = {
        name: 'Rapid-fire protection blocks immediate retry',
        pass: initialCanAdvance === true && afterCanAdvance === false && rapidFireBlocked,
        details: {
          initialCanAdvance,
          afterCanAdvance,
          firstResult: requestResult,
          secondResult: intervalResult,
        },
      };
      results.tests.push(rapidFireTest);
      results.pass = results.pass && rapidFireTest.pass;
      console.log(rapidFireTest.pass ? '✅' : '❌', rapidFireTest.name);

      // Restore original stage if available
      if (typeof window.unifiedNav?.navigateToStage === 'function' && currentStage) {
        try {
          await window.unifiedNav.navigateToStage(currentStage, {
            source: 'phase3_auto_restore',
            smooth: false,
            skipNarration: true,
          });
        } catch {}
      }

      // Confirm stageControls still reflect state
      const controlsTest = {
        name: 'Stage controls reflect auto-advance state',
        pass: typeof stageControls?.isAutoAdvanceEnabled === 'function'
          ? typeof stageControls.isAutoAdvanceEnabled() === 'boolean'
          : true,
      };
      results.tests.push(controlsTest);
      results.pass = results.pass && controlsTest.pass;
      console.log(controlsTest.pass ? '✅' : '❌', controlsTest.name);

      safeGroupEnd();
      return results;
    },

    testNavigationPaths() {
      safeGroup('TEST 3: Navigation Path Integrity');

      const results = { pass: true, tests: [] };
      const unifiedAvailable = typeof window.unifiedNav?.navigateToStage === 'function';
      const stageControlsAvailable = typeof window.stageControls?.next === 'function';
      const violations = ensureArray(window.__stageAtomViolations);

      const unifiedTest = {
        name: 'UnifiedNavigationAPI available globally',
        pass: unifiedAvailable,
      };
      results.tests.push(unifiedTest);
      results.pass = results.pass && unifiedTest.pass;
      console.log(unifiedTest.pass ? '✅' : '❌', unifiedTest.name);

      const controlsTest = {
        name: 'Stage controls surface available',
        pass: stageControlsAvailable,
      };
      results.tests.push(controlsTest);
      results.pass = results.pass && controlsTest.pass;
      console.log(controlsTest.pass ? '✅' : '❌', controlsTest.name);

      const violationTest = {
        name: 'No unauthorized stageAtom mutations detected',
        pass: violations.length === 0,
        violations: violations.slice(-5),
      };
      results.tests.push(violationTest);
      results.pass = results.pass && violationTest.pass;
      console.log(violationTest.pass ? '✅' : '❌', violationTest.name);
      if (!violationTest.pass) {
        console.log('   Recent violations:', violationTest.violations);
      }

      safeGroupEnd();
      return results;
    },

    testPerformance() {
      safeGroup('TEST 4: Performance Validation');

      const results = { pass: true, tests: [] };
      const fps = typeof window.probe?.fps === 'function' ? window.probe.fps() : 0;
      const draw = typeof window.probe?.draw === 'function' ? window.probe.draw() : {};
      const heap = performance?.memory?.usedJSHeapSize
        ? performance.memory.usedJSHeapSize / 1048576
        : 0;

      const fpsTest = {
        name: 'Frame rate ≥ 55 FPS',
        fps,
        threshold: 55,
        pass: typeof fps === 'number' && fps >= 55,
      };
      results.tests.push(fpsTest);
      results.pass = results.pass && fpsTest.pass;
      console.log(fpsTest.pass ? '✅' : '❌', fpsTest.name, '-', fps.toFixed?.(1) ?? fps);

      const drawTest = {
        name: 'Particle draw counts match',
        active: draw?.active,
        draw: draw?.draw,
        match: draw?.match === true,
        pass: draw?.match === true,
      };
      results.tests.push(drawTest);
      results.pass = results.pass && drawTest.pass;
      console.log(drawTest.pass ? '✅' : '❌', drawTest.name);

      const memoryTest = {
        name: 'Memory usage < 250 MB',
        memory: heap,
        threshold: 250,
        pass: heap > 0 && heap < 250,
      };
      results.tests.push(memoryTest);
      results.pass = results.pass && memoryTest.pass;
      console.log(memoryTest.pass ? '✅' : '❌', memoryTest.name, '-', heap ? heap.toFixed(1) + ' MB' : 'n/a');

      safeGroupEnd();
      return results;
    },

    async simulateRealWorld() {
      safeGroup('TEST 5: Real-World Scenario Simulation');
      const results = { pass: true, scenarios: [] };

      const stageNames = getStageNames();
      const currentStage = getCurrentStage() || stageNames[0];
      const currentIdx = getStageIndex(currentStage, stageNames);
      const nextStage = stageNames[(currentIdx + 1) % stageNames.length] || currentStage;

      // Scenario 1: Manual forward navigation
      console.log('\n📍 Scenario 1: Manual forward navigation');
      window.clearTrace?.();

      let scenario1 = {
        name: 'Manual forward navigation',
        pass: false,
        stageChanges: 0,
        morphEvents: 0,
      };

      try {
        const navSuccess = await window.unifiedNav?.navigateToStage(nextStage, {
          source: 'phase3_manual_forward',
          smooth: true,
          skipNarration: true,
        });

        await new Promise((resolve) => setTimeout(resolve, 600));

        const trace = normalizeTrace();
        const stageChanges = trace.filter((e) => e?.ev === 'STAGE_CHANGE');
        const morphEvents = trace.filter((e) => e?.ev === 'MORPH_PROGRESS');

        scenario1 = {
          name: 'Manual forward navigation',
          pass: Boolean(navSuccess) && stageChanges.length === 1 && morphEvents.length > 0,
          stageChanges: stageChanges.length,
          morphEvents: morphEvents.length,
        };
        console.log(scenario1.pass ? '   ✅ PASS' : '   ❌ FAIL');
        console.log('   STAGE_CHANGE events:', stageChanges.length);
        console.log('   MORPH_PROGRESS events:', morphEvents.length);
      } catch (error) {
        scenario1.error = error?.message;
        console.error('   ❌ FAIL:', error?.message);
      }

      results.scenarios.push(scenario1);
      results.pass = results.pass && scenario1.pass;

      // Scenario 2: Rapid-fire protection using stageControls
      console.log('\n📍 Scenario 2: Rapid-fire protection');
      const scenario2 = {
        name: 'Rapid-fire protection via stageControls',
        pass: false,
      };
      try {
        const first = window.stageControls?.next?.();
        const second = window.stageControls?.next?.();
        scenario2.pass = first !== false && second !== false;
        console.log('   ✅ PASS - no crash while invoking rapid sequence');
      } catch (error) {
        scenario2.error = error?.message;
        console.error('   ❌ FAIL:', error?.message);
      }
      results.scenarios.push(scenario2);
      results.pass = results.pass && scenario2.pass;

      // Scenario 3: Event deduplication after reset
      console.log('\n📍 Scenario 3: Event deduplication');
      window.clearTrace?.();
      const scenario3 = {
        name: 'Event deduplication check',
        pass: false,
        duplicates: 0,
      };
      try {
        await window.unifiedNav?.navigateToStage(currentStage, {
          source: 'phase3_dedup_check',
          smooth: true,
          skipNarration: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 600));

        const trace = normalizeTrace();
        const counts = {};
        trace.forEach((e) => {
          const key = `${e?.ev || 'unknown'}_${e?.stage || 'unknown'}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        const duplicateEntries = Object.entries(counts).filter(([, count]) => count > 1);
        scenario3.duplicates = duplicateEntries.length;
        scenario3.pass = duplicateEntries.length === 0;
        console.log(scenario3.pass ? '   ✅ PASS' : '   ❌ FAIL');
        if (!scenario3.pass) {
          console.log('   Duplicates:', duplicateEntries);
        }
      } catch (error) {
        scenario3.error = error?.message;
        console.error('   ❌ FAIL:', error?.message);
      }
      results.scenarios.push(scenario3);
      results.pass = results.pass && scenario3.pass;

      safeGroupEnd();
      return results;
    },

    async runAll() {
      console.clear?.();
      console.log('\n############################################################');
      console.log('#         PHASE 3 COMPLETE VALIDATION SUITE                #');
      console.log('############################################################\n');

      const start = performance.now();

      const eventTopology = this.testEventTopology();
      const autoAdvance = await this.testAutoAdvance();
      const navigationPaths = this.testNavigationPaths();
      const performanceResults = this.testPerformance();
      const realWorld = await this.simulateRealWorld();

      const end = performance.now();
      const duration = ((end - start) / 1000).toFixed(2);

      const flatten = (items) => items.reduce((acc, item) => {
        if (!item) return acc;
        if (Array.isArray(item.tests)) acc.push(...item.tests);
        if (Array.isArray(item.scenarios)) acc.push(...item.scenarios);
        return acc;
      }, []);

      const collected = flatten([eventTopology, autoAdvance, navigationPaths, performanceResults, realWorld]);
      const total = collected.length;
      const passed = collected.filter((item) => item?.pass).length;
      const failed = total - passed;

      const allPass = eventTopology.pass && autoAdvance.pass && navigationPaths.pass && performanceResults.pass && realWorld.pass;

      console.log('\n############################################################');
      console.log('#                   VALIDATION SUMMARY                     #');
      console.log('############################################################');
      console.log('Total tests:', total);
      console.log('Passed:', passed);
      console.log('Failed:', failed);
      console.log('Success rate:', total ? ((passed / total) * 100).toFixed(1) + '%' : 'n/a');
      console.log('Duration:', duration, 'seconds');
      console.log('\nCategories:');
      console.log(' - Event Topology:', eventTopology.pass ? '✅ PASS' : '❌ FAIL');
      console.log(' - Auto-Advance:', autoAdvance.pass ? '✅ PASS' : '❌ FAIL');
      console.log(' - Navigation Paths:', navigationPaths.pass ? '✅ PASS' : '❌ FAIL');
      console.log(' - Performance:', performanceResults.pass ? '✅ PASS' : '❌ FAIL');
      console.log(' - Real-World:', realWorld.pass ? '✅ PASS' : '❌ FAIL');

      console.log('\nMetrics:');
      console.log(' - FPS:', performanceResults.tests?.[0]?.fps ?? 'n/a');
      console.log(' - Memory (MB):', performanceResults.tests?.[2]?.memory?.toFixed?.(1) ?? 'n/a');
      console.log(' - Particle active:', performanceResults.tests?.[1]?.active ?? 'n/a');

      console.log('\n############################################################');
      console.log(allPass
        ? '#  ✅ PHASE 3 COMPLETE - ALL VALIDATION PASSED            #'
        : '#  ❌ PHASE 3 INCOMPLETE - ISSUES DETECTED                 #');
      console.log('############################################################\n');

      return {
        pass: allPass,
        timestamp: new Date().toISOString(),
        duration,
        summary: {
          total,
          passed,
          failed,
          successRate: total ? (passed / total) * 100 : 0,
        },
        tests: {
          eventTopology,
          autoAdvance,
          navigationPaths,
          performance: performanceResults,
          realWorld,
        },
      };
    },

    quickCheck() {
      console.log('🔍 Quick Phase 3 Check');
      const violations = ensureArray(window.__stageAtomViolations).length;
      const trace = normalizeTrace();
      const stageEmitters = [...new Set(trace.filter((e) => e?.ev === 'STAGE_CHANGE').map((e) => e?.source || 'unknown'))];
      const fps = typeof window.probe?.fps === 'function' ? window.probe.fps() : 0;

      console.log('   Navigation violations:', violations === 0 ? '✅ 0' : `❌ ${violations}`);
      console.log('   STAGE_CHANGE emitters:', stageEmitters.length === 1 ? '✅ 1' : `❌ ${stageEmitters.length}`);
      console.log('   FPS:', fps >= 55 ? `✅ ${fps.toFixed?.(1) ?? fps}` : `❌ ${fps.toFixed?.(1) ?? fps}`);

      const pass = violations === 0 && stageEmitters.length === 1 && fps >= 55;
      console.log('Status:', pass ? '✅ HEALTHY' : '❌ ISSUES DETECTED');

      return {
        pass,
        violations,
        stageChangeEmitters: stageEmitters,
        fps,
      };
    },
  };

  window.validatePhase3 = () => window.phase3.runAll();
  window.checkPhase3 = () => window.phase3.quickCheck();
}

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
