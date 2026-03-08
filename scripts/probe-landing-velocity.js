/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const CHECKPOINTS = (process.env.LANDING_CHECKPOINTS || '0,5000,7600,9400,12000')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);

const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 15000);
const OUTPUT_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-probes');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
  });

  let stageStartTs = null;
  let stageStartLogTs = null;
  let stageStartMarker = null;
  const consoleLogs = [];
  const schemaViolations = [];
  const singleWriterViolations = [];
  const interestingLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);

    if (text.includes('[ConsciousnessTheater] Landing stage mode started')) {
      if (stageStartLogTs === null) {
        stageStartLogTs = Date.now();
      }
      if (stageStartTs === null) {
        stageStartTs = stageStartLogTs;
      }
    }

    if (/Schema violation for RENDER_DIRECTIVE|BeatBus schema fail: RENDER_DIRECTIVE/.test(text)) {
      schemaViolations.push(text);
    }

    if (/SINGLE_WRITER_VIOLATION|single-writer/i.test(text)) {
      singleWriterViolations.push(text);
    }

    if (
      /Landing stage mode started|Scheduled landing velocity beat|\[WBG\] handleDirective|DIRECTIVE_CONTENTS|MORPH_PROGRESS/i.test(
        text
      )
    ) {
      interestingLogs.push({
        wallClockMs: Date.now(),
        text,
      });
    }
  });

  console.log(`[probe] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, {
    timeout: 30000,
  });

  const deadline = Date.now() + STAGE_START_TIMEOUT_MS;
  while (stageStartTs === null && Date.now() < deadline) {
    await wait(50);
  }

  if (stageStartTs === null) {
    throw new Error('Landing stage mode start was not observed in console logs.');
  }

  stageStartMarker = await page.evaluate(() => window.__landingStageModeStart || null);
  if (isFiniteNumber(stageStartMarker?.wallClockMs)) {
    stageStartTs = stageStartMarker.wallClockMs;
  }

  const samples = [];

  for (const offsetMs of CHECKPOINTS) {
    const targetTs = isFiniteNumber(stageStartTs) ? (stageStartTs + offsetMs) : null;
    if (isFiniteNumber(stageStartMarker?.performanceNow)) {
      const targetPerfNow = stageStartMarker.performanceNow + offsetMs;
      await page.waitForFunction(
        ({ target }) =>
          (typeof performance !== 'undefined' && typeof performance.now === 'function')
            ? performance.now() >= target
            : false,
        { target: targetPerfNow },
        { timeout: Math.max(30000, offsetMs + 10000) }
      );
    } else if (isFiniteNumber(targetTs)) {
      await wait(targetTs - Date.now());
    }

    const state = await page.evaluate(() => {
      const r = window.__dumpRendererState?.() || null;
      const stage = typeof window.stageAtom?.getState === 'function' ? window.stageAtom.getState() : null;

      return {
        renderer: r,
        summary: {
          stage: stage?.currentStage ?? null,
          stageIndex: stage?.stageIndex ?? null,
          stageProgress: stage?.stageProgress ?? null,
          morphProgressState: stage?.morphProgress ?? null,
          drawCount: r?.drawRange?.count ?? null,
          camera: r?.camera ?? null,
          uniforms: {
            uMorphProgress: r?.uniforms?.uMorphProgress ?? null,
            uPointSize: r?.uniforms?.uPointSize ?? null,
            uGaussianSigma: r?.uniforms?.uGaussianSigma ?? null,
            uDepthFalloffPower: r?.uniforms?.uDepthFalloffPower ?? null,
            uCenterWeighting: r?.uniforms?.uCenterWeighting ?? null,
            uFlowTurbulence: r?.uniforms?.uFlowTurbulence ?? null,
            uStreakIntensity: r?.uniforms?.uStreakIntensity ?? null,
            uSpreadFactor: r?.uniforms?.uSpreadFactor ?? null,
            uOpacityMin: r?.uniforms?.uOpacityMin ?? null,
            uOpacityMax: r?.uniforms?.uOpacityMax ?? null,
          },
        },
        landingStageSliceResolved: window.Canonical?.landingStageSliceResolved || null,
        landingModesForm: window.Canonical?.landingModes?.form || null,
        pageTiming: {
          performanceNow:
            (typeof performance !== 'undefined' && typeof performance.now === 'function')
              ? performance.now()
              : null,
          stageStartMarker: window.__landingStageModeStart || null,
        },
      };
    });

    const capturedWallClockMs = Date.now();
    const capturedOffsetFromLogMs =
      isFiniteNumber(stageStartLogTs) ? (capturedWallClockMs - stageStartLogTs) : null;
    const capturedOffsetFromWallClockStageMs =
      isFiniteNumber(stageStartTs) ? (capturedWallClockMs - stageStartTs) : null;
    const capturedOffsetFromMarkerMs =
      isFiniteNumber(state?.pageTiming?.performanceNow)
        && isFiniteNumber(stageStartMarker?.performanceNow)
        ? state.pageTiming.performanceNow - stageStartMarker.performanceNow
        : null;
    const capturedOffsetFromStageStartMs =
      isFiniteNumber(capturedOffsetFromMarkerMs)
        ? capturedOffsetFromMarkerMs
        : (isFiniteNumber(capturedOffsetFromWallClockStageMs)
          ? capturedOffsetFromWallClockStageMs
          : null);

    samples.push({
      offsetMs,
      targetWallClockMs: targetTs,
      capturedWallClockMs,
      capturedOffsetFromLogMs,
      capturedOffsetFromWallClockStageMs,
      capturedOffsetFromMarkerMs,
      capturedOffsetFromStageStartMs,
      captureDriftFromRequestedMs:
        isFiniteNumber(capturedOffsetFromStageStartMs)
          ? capturedOffsetFromStageStartMs - offsetMs
          : null,
      capturedAt: new Date().toISOString(),
      state,
    });
  }

  const payload = {
    meta: {
      url: URL,
      checkpoints: CHECKPOINTS,
      stageStartDetected: stageStartTs !== null,
      stageStartLogWallClockMs: stageStartLogTs,
      stageStartWallClockMs: stageStartTs,
      stageStartMarker,
      generatedAt: new Date().toISOString(),
    },
    schemaViolationCount: schemaViolations.length,
    singleWriterViolationCount: singleWriterViolations.length,
    schemaViolations,
    singleWriterViolations,
    samples,
    interestingLogs,
    tailLogs: consoleLogs.slice(-200),
  };

  const outPath = path.join(OUTPUT_DIR, `landing-velocity-probe-${nowStamp()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

  console.log(`[probe] Saved: ${outPath}`);
  console.log(
    JSON.stringify(
      {
        outPath,
        schemaViolationCount: schemaViolations.length,
        singleWriterViolationCount: singleWriterViolations.length,
        checkpoints: CHECKPOINTS,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error('[probe] Failed');
  console.error(error);
  process.exit(1);
});
