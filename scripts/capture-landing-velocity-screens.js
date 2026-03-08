/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const CHECKPOINTS = (process.env.LANDING_SCREEN_CHECKPOINTS || '5000,7600,9400,12000')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);

const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 15000);
const OUTPUT_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-screens');
const ISOLATED_MODE = process.env.LANDING_SCREEN_ISOLATED === '1';

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

function attachStageStartCapture(page, consoleLogs) {
  let stageStartTs = null;
  let stageStartLogTs = null;

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
  });

  return {
    getStageStartTs: () => stageStartTs,
    getStageStartLogTs: () => stageStartLogTs,
    setStageStartTs: (value) => {
      stageStartTs = value;
    },
  };
}

async function waitForStageStart({ page, getStageStartTs }) {
  const deadline = Date.now() + STAGE_START_TIMEOUT_MS;
  while (getStageStartTs() === null && Date.now() < deadline) {
    await wait(50);
  }
  if (getStageStartTs() === null) {
    throw new Error('Landing stage mode start was not observed in console logs.');
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const runId = nowStamp();
  const runDir = path.join(OUTPUT_DIR, `run-${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const consoleLogs = [];

  const manifest = {
    url: URL,
    runId,
    generatedAt: new Date().toISOString(),
    isolatedMode: ISOLATED_MODE,
    stageStartLogWallClockMs: null,
    stageStartWallClockMs: null,
    stageStartMarker: null,
    checkpoints: [],
  };

  const basePage = ISOLATED_MODE
    ? null
    : await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
    });
  const baseCapture = ISOLATED_MODE ? null : attachStageStartCapture(basePage, consoleLogs);

  if (!ISOLATED_MODE) {
    console.log(`[screens] Opening ${URL}`);
    await basePage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await basePage.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, {
      timeout: 30000,
    });
    await waitForStageStart({ page: basePage, getStageStartTs: baseCapture.getStageStartTs });

    const stageStartMarker = await basePage.evaluate(() => window.__landingStageModeStart || null);
    if (isFiniteNumber(stageStartMarker?.wallClockMs)) {
      baseCapture.setStageStartTs(stageStartMarker.wallClockMs);
    }

    manifest.stageStartLogWallClockMs = baseCapture.getStageStartLogTs();
    manifest.stageStartWallClockMs = baseCapture.getStageStartTs();
    manifest.stageStartMarker = stageStartMarker;
  }

  for (const offsetMs of CHECKPOINTS) {
    const page = ISOLATED_MODE
      ? await browser.newPage({
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 1,
      })
      : basePage;
    const localLogs = ISOLATED_MODE ? [] : consoleLogs;
    const capture = ISOLATED_MODE ? attachStageStartCapture(page, localLogs) : baseCapture;

    if (ISOLATED_MODE) {
      console.log(`[screens][isolated] Opening ${URL} for ${offsetMs}ms`);
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, {
        timeout: 30000,
      });
      await waitForStageStart({ page, getStageStartTs: capture.getStageStartTs });
    }

    const stageStartMarker = await page.evaluate(() => window.__landingStageModeStart || null);
    if (isFiniteNumber(stageStartMarker?.wallClockMs)) {
      capture.setStageStartTs(stageStartMarker.wallClockMs);
    }

    const stageStartTs = capture.getStageStartTs();
    const stageStartLogTs = capture.getStageStartLogTs();
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
      return {
        camera: r?.camera ?? null,
        drawCount: r?.drawRange?.count ?? null,
        uniforms: {
          uMorphProgress: r?.uniforms?.uMorphProgress ?? null,
          uPointSize: r?.uniforms?.uPointSize ?? null,
          uGaussianSigma: r?.uniforms?.uGaussianSigma ?? null,
          uDepthFalloffPower: r?.uniforms?.uDepthFalloffPower ?? null,
          uFlowTurbulence: r?.uniforms?.uFlowTurbulence ?? null,
          uStreakIntensity: r?.uniforms?.uStreakIntensity ?? null,
          uSpreadFactor: r?.uniforms?.uSpreadFactor ?? null,
          uOpacityMin: r?.uniforms?.uOpacityMin ?? null,
          uOpacityMax: r?.uniforms?.uOpacityMax ?? null,
        },
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

    const filename = `landing-${String(offsetMs).padStart(5, '0')}ms.png`;
    const filepath = path.join(runDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: false,
    });

    console.log(`[screens] Saved: ${filepath}`);

    manifest.checkpoints.push({
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
      stageStartLogWallClockMs: stageStartLogTs,
      stageStartWallClockMs: stageStartTs,
      stageStartMarker,
      file: filepath,
      state,
    });

    if (ISOLATED_MODE) {
      manifest.stageStartLogWallClockMs ??= stageStartLogTs;
      manifest.stageStartWallClockMs ??= stageStartTs;
      manifest.stageStartMarker ??= stageStartMarker;
      await page.close();
      consoleLogs.push(...localLogs);
    }
  }

  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, tailLogs: consoleLogs.slice(-200) }, null, 2));

  console.log(`[screens] Manifest: ${manifestPath}`);
  if (basePage) {
    await basePage.close();
  }
  await browser.close();
}

main().catch((error) => {
  console.error('[screens] Failed');
  console.error(error);
  process.exit(1);
});
