#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5174';
const SAMPLE_MS = Number.parseInt(process.env.PROBE_SAMPLE_MS || '1000', 10);
const MAX_SECONDS = Number.parseInt(process.env.PROBE_MAX_SECONDS || '45', 10);
const REQUIRED_WINDOW = Number.parseInt(process.env.PROBE_REQUIRED_WINDOW || '8', 10);
const TARGET_DRAW_COUNT = Number.parseInt(process.env.PROBE_TARGET_DRAW_COUNT || '12000', 10);
const CAMERA_EPSILON = Number.parseFloat(process.env.PROBE_CAMERA_EPSILON || '0.05');
const OUTPUT_BASENAME = (process.env.PROBE_OUTPUT_BASENAME || 'velocity-hero-rest').trim() || 'velocity-hero-rest';
const VALID_QUALITY = new Set(['LOW', 'MEDIUM', 'HIGH', 'ULTRA']);
const QUALITY_SEQUENCE = (() => {
  const explicit = String(process.env.PROBE_QUALITY || '').trim().toUpperCase();
  if (VALID_QUALITY.has(explicit)) return [explicit];
  const raw = String(process.env.PROBE_QUALITY_SEQUENCE || 'HIGH,ULTRA')
    .split(',')
    .map((v) => v.trim().toUpperCase())
    .filter((v) => VALID_QUALITY.has(v));
  return raw.length ? raw : ['ULTRA'];
})();

const OUT_DIR = path.resolve(process.cwd(), 'reports', 'velocity-stage-probes');
const OUT_JSON = path.join(OUT_DIR, `${OUTPUT_BASENAME}.json`);
const OUT_SHOT = path.join(OUT_DIR, `${OUTPUT_BASENAME}.png`);
const OUT_SHOT_MAX = path.join(OUT_DIR, `${OUTPUT_BASENAME}-max-draw.png`);

const isFiniteNumber = (v) => Number.isFinite(v);
const toNumberOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const makeWindowSummary = (samples, startIdx, endIdx, reason = 'candidate') => {
  const windowSamples = samples.slice(startIdx, endIdx + 1);
  const first = windowSamples[0];
  const last = windowSamples[windowSamples.length - 1];
  return {
    reason,
    startIndex: startIdx,
    endIndex: endIdx,
    startTMs: first?.tMs ?? null,
    endTMs: last?.tMs ?? null,
    drawRangeCount: first?.drawRangeCount ?? null,
    samples: windowSamples,
  };
};

const cameraStable = (windowSamples, epsilon = 0.05) => {
  if (!windowSamples.length) return false;
  const base = windowSamples[0]?.camera;
  const basePosRaw = Array.isArray(base?.pos) ? base.pos : null;
  const basePos = basePosRaw ? basePosRaw.map((v) => toNumberOrNull(v)) : null;
  const baseFov = toNumberOrNull(base?.fov);
  if (!basePos || basePos.length < 3 || baseFov == null || basePos.some((v) => v == null)) return false;
  return windowSamples.every((sample) => {
    const cam = sample?.camera;
    const posRaw = Array.isArray(cam?.pos) ? cam.pos : null;
    const pos = posRaw ? posRaw.map((v) => toNumberOrNull(v)) : null;
    const fov = toNumberOrNull(cam?.fov);
    if (!pos || pos.length < 3 || fov == null || pos.some((v) => v == null)) return false;
    return (
      Math.abs(pos[0] - basePos[0]) <= epsilon &&
      Math.abs(pos[1] - basePos[1]) <= epsilon &&
      Math.abs(pos[2] - basePos[2]) <= epsilon &&
      Math.abs(fov - baseFov) <= epsilon
    );
  });
};

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1728, height: 1117 } });

  const url = `${BASE_URL}/?deterministic=1&seed=123&quality=${encodeURIComponent(QUALITY_SEQUENCE[0])}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.evaluate(async ({ qualitySequence }) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const disableAutoAdvance = () => {
      try { window.stageControls?.pauseAutoAdvance?.(); } catch {}
      try { window.stageControls?.setAutoAdvanceEnabled?.(false); } catch {}
      try { window.stageAtom?.pauseAutoAdvance?.(); } catch {}
      try { window.stageAtom?.setAutoAdvanceEnabled?.(false); } catch {}
    };
    const disableAdaptiveQuality = () => {
      try { window.performanceAtom?.setAutoQuality?.(false); } catch {}
      try { window.atomicUtils?.disablePerformanceMonitoring?.(); } catch {}
      try {
        if (
          window.qualityAtom &&
          typeof window.qualityAtom.updatePerformanceMetrics === 'function' &&
          !window.__probeOriginalUpdatePerformanceMetrics
        ) {
          window.__probeOriginalUpdatePerformanceMetrics = window.qualityAtom.updatePerformanceMetrics;
          window.qualityAtom.updatePerformanceMetrics = () => {};
        }
      } catch {}
    };

    disableAutoAdvance();
    disableAdaptiveQuality();

    try { window.theaterDirector?.forceStart?.(); } catch {}
    try { window.theaterDirector?._requestSkip?.('probe:velocity-true-rest'); } catch {}
    await wait(100);
    try { window.theaterDirector?._requestSkip?.('probe:velocity-true-rest'); } catch {}
    for (const quality of qualitySequence) {
      try { window.qualityControls?.setTier?.(quality); } catch {}
      try { window.qualityAtom?.setCurrentQualityTier?.(quality); } catch {}
      try {
        if (window.__consciousnessEngine) window.__consciousnessEngine.currentQuality = quality;
      } catch {}
      await wait(250);
    }
    disableAutoAdvance();
    disableAdaptiveQuality();
  }, { qualitySequence: QUALITY_SEQUENCE });

  await page.waitForFunction(() => {
    const d = window.theaterDirector;
    if (!d) return true;
    const openingActive = typeof d.isOpeningInProgress === 'function'
      ? d.isOpeningInProgress()
      : d._openingInProgress === true;
    return d.hasRun === true && openingActive === false;
  }, { timeout: 30000 }).catch(() => null);

  const setupState = await page.evaluate(async ({ qualitySequence }) => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const disableAutoAdvance = () => {
      try { window.stageControls?.pauseAutoAdvance?.(); } catch {}
      try { window.stageControls?.setAutoAdvanceEnabled?.(false); } catch {}
      try { window.stageAtom?.pauseAutoAdvance?.(); } catch {}
      try { window.stageAtom?.setAutoAdvanceEnabled?.(false); } catch {}
    };
    const navigateVelocity = async () => {
      try {
        await window.unifiedNav?.navigateToStage?.('velocity', {
          smooth: false,
          skipNarration: true,
          source: 'probe:velocity-true-rest',
          settleMs: 250,
        });
      } catch {}
      try { window.NavigationCommands?.navigateToStageCanonical?.('velocity', { origin: 'probe:velocity-true-rest' }); } catch {}
      try { window.stageControls?.jumpToStage?.('velocity'); } catch {}
      try { window.stageAtom?.setStage?.('velocity', { source: 'probe:velocity-true-rest' }); } catch {}
    };

    disableAutoAdvance();
    await navigateVelocity();
    await wait(350);

    const targetQuality = qualitySequence[qualitySequence.length - 1] || 'ULTRA';
    try { window.qualityControls?.setTier?.(targetQuality); } catch {}
    try { window.qualityAtom?.setCurrentQualityTier?.(targetQuality); } catch {}
    try {
      if (window.__consciousnessEngine) window.__consciousnessEngine.currentQuality = targetQuality;
    } catch {}
    await wait(200);

    try {
      await window.__consciousnessEngine?.buildAndEmitBlueprint?.('velocity', targetQuality);
    } catch {}
    await wait(350);
    await navigateVelocity();
    await wait(350);
    try {
      await window.__consciousnessEngine?.buildAndEmitBlueprint?.('velocity', targetQuality);
    } catch {}
    await wait(300);
    disableAutoAdvance();

    return {
      requestedQualitySequence: qualitySequence,
      targetQuality,
      qualityState: window.qualityAtom?.getState?.() || null,
      stageState: window.stageAtom?.getState?.() || null,
      stageControls: {
        stage: window.stageControls?.getCurrentStage?.() ?? null,
        stageIndex: window.stageControls?.getCurrentStageIndex?.() ?? null,
      },
      engine: window.engineDebug?.getStats?.() ?? null,
      cacheKeys: window.engineDebug?.getCacheKeys?.() ?? null,
    };
  }, { qualitySequence: QUALITY_SEQUENCE });

  const samples = [];
  let selectedWindow = null;
  let screenshotTaken = false;
  let maxObserved = null;
  let maxScreenshotTaken = false;

  for (let i = 0; i < MAX_SECONDS; i += 1) {
    await page.waitForTimeout(SAMPLE_MS);
    const tMs = (i + 1) * SAMPLE_MS;

    const sample = await page.evaluate((tickMs) => {
      const stage = window.stageControls?.getCurrentStage?.() ?? window.stageAtom?.getState?.()?.currentStage ?? null;
      const stageIndex = window.stageControls?.getCurrentStageIndex?.() ?? window.stageAtom?.getState?.()?.stageIndex ?? null;
      const qualityTier = window.qualityAtom?.getState?.()?.currentQualityTier ?? null;
      const renderer = window.__dumpRendererState?.() || null;
      const formState = window.__dumpFormState?.() || null;
      const cameraSource = renderer?.camera || formState?.camera || null;
      const cameraPos = Array.isArray(cameraSource?.pos)
        ? cameraSource.pos.slice(0, 3)
        : null;
      const cameraFov = Number.isFinite(Number(cameraSource?.fov))
        ? Number(cameraSource.fov)
        : null;

      return {
        tMs: tickMs,
        stage,
        stageIndex,
        qualityTier,
        drawRangeCount: renderer?.drawRange?.count ?? formState?.drawRange?.count ?? null,
        activeCount: renderer?.activeCount ?? formState?.uniforms?.uActiveCount ?? null,
        uMorphProgress: renderer?.uniforms?.uMorphProgress ?? formState?.uniforms?.uMorphProgress ?? null,
        uPointSize: renderer?.uniforms?.uPointSize ?? formState?.uniforms?.uPointSize ?? null,
        uGaussianSigma: renderer?.uniforms?.uGaussianSigma ?? formState?.uniforms?.uGaussianSigma ?? null,
        uTierCutoff: renderer?.uniforms?.uTierCutoff ?? null,
        uCenterWeighting: renderer?.uniforms?.uCenterWeighting ?? null,
        camera: cameraPos && cameraPos.length >= 3 && cameraFov != null
          ? { pos: cameraPos, fov: cameraFov }
          : null,
        renderer,
        formState,
      };
    }, tMs);
    samples.push(sample);

    if (isFiniteNumber(sample.drawRangeCount)) {
      const sampleDraw = Number(sample.drawRangeCount);
      const maxDraw = Number(maxObserved?.drawRangeCount ?? -Infinity);
      if (sampleDraw > maxDraw) {
        maxObserved = sample;
        await page.screenshot({ path: OUT_SHOT_MAX, fullPage: true });
        maxScreenshotTaken = true;
      }
    }

    if (samples.length >= REQUIRED_WINDOW) {
      const endIdx = samples.length - 1;
      const startIdx = endIdx - (REQUIRED_WINDOW - 1);
      const win = samples.slice(startIdx, endIdx + 1);

      const allVelocity = win.every((s) => s.stage === 'velocity');
      const allMorph = win.every((s) => isFiniteNumber(s.uMorphProgress) && s.uMorphProgress >= 0.995);
      const allAboveTarget = win.every((s) => isFiniteNumber(s.drawRangeCount) && s.drawRangeCount >= TARGET_DRAW_COUNT);
      const firstCount = Number(win[0]?.drawRangeCount);
      const stableCount = isFiniteNumber(firstCount) && win.every((s) => Number(s.drawRangeCount) === firstCount);
      const stableCamera = cameraStable(win, CAMERA_EPSILON);

      if (allVelocity && allMorph && allAboveTarget && stableCount && stableCamera) {
        selectedWindow = makeWindowSummary(samples, startIdx, endIdx, 'hero_rest_window');
        if (!screenshotTaken) {
          await page.screenshot({ path: OUT_SHOT, fullPage: true });
          screenshotTaken = true;
        }
        break;
      }
    }
  }

  const finalSnapshot = await page.evaluate(() => ({
    stage: window.stageControls?.getCurrentStage?.() ?? window.stageAtom?.getState?.()?.currentStage ?? null,
    stageIndex: window.stageControls?.getCurrentStageIndex?.() ?? window.stageAtom?.getState?.()?.stageIndex ?? null,
    qualityTier: window.qualityAtom?.getState?.()?.currentQualityTier ?? null,
    renderer: window.__dumpRendererState?.() || null,
    formState: window.__dumpFormState?.() || null,
  }));
  const traceTail = await page.evaluate(() => (window.dumpTrace?.() || window.__trace || []).slice(-200));

  await browser.close();

  const selectedRest = selectedWindow ? selectedWindow.samples[0] : null;
  const maxObservedSummary = maxObserved
    ? {
        tMs: maxObserved.tMs,
        stage: maxObserved.stage,
        stageIndex: maxObserved.stageIndex,
        qualityTier: maxObserved.qualityTier,
        drawRangeCount: maxObserved.drawRangeCount,
        activeCount: maxObserved.activeCount,
        uMorphProgress: maxObserved.uMorphProgress,
        camera: maxObserved.camera,
      }
    : null;

  const report = {
    generatedAt: new Date().toISOString(),
    probe: {
      baseUrl: BASE_URL,
      url,
      qualitySequence: QUALITY_SEQUENCE,
      sampleMs: SAMPLE_MS,
      maxSeconds: MAX_SECONDS,
      requiredWindow: REQUIRED_WINDOW,
      targetDrawRangeCount: TARGET_DRAW_COUNT,
      cameraEpsilon: CAMERA_EPSILON,
      outputBasename: OUTPUT_BASENAME,
    },
    setupState,
    status: {
      success: !!selectedWindow,
      note: selectedWindow
        ? null
        : `No ${REQUIRED_WINDOW}-sample HERO window met stage=velocity, morph>=0.995, drawRange>=${TARGET_DRAW_COUNT}, stable count, and stable camera.`,
    },
    windows: { selectedWindow },
    maxObservedDraw: maxObservedSummary,
    heroRest: selectedRest
      ? {
          sample: selectedRest,
          dumpRendererState: selectedRest.renderer || null,
          dumpFormState: selectedRest.formState || null,
        }
      : null,
    screenshots: {
      heroRest: selectedWindow && screenshotTaken ? path.relative(process.cwd(), OUT_SHOT) : null,
      maxObservedDraw: maxScreenshotTaken ? path.relative(process.cwd(), OUT_SHOT_MAX) : null,
    },
    finalSnapshot,
    samples,
    traceTail,
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  console.log('VELOCITY_TRUE_REST_REPORT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('VELOCITY_TRUE_REST_REPORT_END');

  if (!selectedWindow) {
    console.error(
      `[capture-velocity-true-rest] HERO rest not found. maxObservedDrawCount=${maxObservedSummary?.drawRangeCount ?? 'n/a'} at t=${maxObservedSummary?.tMs ?? 'n/a'}ms stage=${maxObservedSummary?.stage ?? 'n/a'}`
    );
    process.exit(2);
  }
}

run().catch((error) => {
  console.error('[capture-velocity-true-rest] failed:', error);
  process.exit(1);
});
