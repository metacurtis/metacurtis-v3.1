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
const PROBE_OUTPUT_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-probes');
const STAGE_START_MARKER = '[ConsciousnessTheater] Landing stage mode started';

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function installStageStartHook(page) {
  await page.addInitScript((marker) => {
    const captureText = (args) =>
      args
        .map((value) => {
          if (typeof value === 'string') return value;
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        })
        .join(' ');

    const registerStageStart = (...args) => {
      try {
        const text = captureText(args);
        if (!text.includes(marker)) return;
        if (Number.isFinite(window.__LANDING_STAGE_START_PERF_MS__)) return;
        window.__LANDING_STAGE_START_PERF_MS__ = performance.now();
        window.__LANDING_STAGE_START_WALL_ISO__ = new Date().toISOString();
      } catch {
        // Best-effort hook for capture timing only.
      }
    };

    const wrapConsoleMethod = (methodName) => {
      const original = console[methodName];
      if (typeof original !== 'function') return;
      console[methodName] = (...args) => {
        registerStageStart(...args);
        return original.apply(console, args);
      };
    };

    window.__LANDING_STAGE_START_PERF_MS__ = null;
    window.__LANDING_STAGE_START_WALL_ISO__ = null;
    window.__LANDING_CAPTURE_READY_PERF_MS__ = null;
    window.__LANDING_CAPTURE_READY_WALL_ISO__ = null;

    wrapConsoleMethod('log');
    wrapConsoleMethod('info');
    wrapConsoleMethod('debug');
    wrapConsoleMethod('warn');
  }, STAGE_START_MARKER);
}

async function waitForStageStart(page) {
  await page.waitForFunction(() => Number.isFinite(window.__LANDING_STAGE_START_PERF_MS__), null, {
    timeout: STAGE_START_TIMEOUT_MS,
  });

  return page.evaluate(() => ({
    perfMs: window.__LANDING_STAGE_START_PERF_MS__,
    wallIso: window.__LANDING_STAGE_START_WALL_ISO__ || null,
  }));
}

async function waitForCaptureReady(page) {
  await page.waitForFunction(
    () => {
      if (typeof window.__dumpRendererState !== 'function') return false;
      const rendererState = window.__dumpRendererState?.() || null;
      const isReady =
        !!rendererState?.hasMaterial &&
        Number.isFinite(rendererState?.drawRange?.count) &&
        Number.isFinite(rendererState?.uniforms?.uMorphProgress);

      if (isReady && !Number.isFinite(window.__LANDING_CAPTURE_READY_PERF_MS__)) {
        window.__LANDING_CAPTURE_READY_PERF_MS__ = performance.now();
        window.__LANDING_CAPTURE_READY_WALL_ISO__ = new Date().toISOString();
      }

      return Number.isFinite(window.__LANDING_CAPTURE_READY_PERF_MS__);
    },
    null,
    { timeout: 30000, polling: 16 }
  );

  return page.evaluate(() => ({
    perfMs: window.__LANDING_CAPTURE_READY_PERF_MS__,
    wallIso: window.__LANDING_CAPTURE_READY_WALL_ISO__ || null,
    delayFromStageStartMs:
      Number.isFinite(window.__LANDING_CAPTURE_READY_PERF_MS__) &&
      Number.isFinite(window.__LANDING_STAGE_START_PERF_MS__)
        ? window.__LANDING_CAPTURE_READY_PERF_MS__ - window.__LANDING_STAGE_START_PERF_MS__
        : null,
  }));
}

async function waitForCheckpoint(page, captureAnchorPerfMs, offsetMs) {
  await page.waitForFunction(
    ({ startPerfMs, checkpointMs }) => performance.now() >= startPerfMs + checkpointMs,
    { startPerfMs: captureAnchorPerfMs, checkpointMs: offsetMs },
    { timeout: STAGE_START_TIMEOUT_MS + offsetMs + 10000, polling: 16 }
  );

  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      })
  );
}

async function captureCheckpointState(page, offsetMs) {
  return page.evaluate((checkpointMs) => {
    const r = window.__dumpRendererState?.() || null;
    const stageStartPerfMs = window.__LANDING_STAGE_START_PERF_MS__ ?? null;
    const captureReadyPerfMs = window.__LANDING_CAPTURE_READY_PERF_MS__ ?? null;
    const nowPerfMs = performance.now();
    const elapsedSinceStageStartMs =
      Number.isFinite(stageStartPerfMs) && Number.isFinite(nowPerfMs) ? nowPerfMs - stageStartPerfMs : null;
    const elapsedSinceCaptureReadyMs =
      Number.isFinite(captureReadyPerfMs) && Number.isFinite(nowPerfMs) ? nowPerfMs - captureReadyPerfMs : null;

    return {
      timing: {
        requestedOffsetMs: checkpointMs,
        stageStartPerfMs,
        captureReadyPerfMs,
        observedPerfMs: nowPerfMs,
        elapsedSinceStageStartMs,
        elapsedSinceCaptureReadyMs,
        driftMs:
          Number.isFinite(elapsedSinceCaptureReadyMs) && Number.isFinite(checkpointMs)
            ? elapsedSinceCaptureReadyMs - checkpointMs
            : null,
      },
      camera: r?.camera ?? null,
      drawCount: r?.drawRange?.count ?? null,
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
    };
  }, offsetMs);
}

async function hideReviewContamination(page) {
  await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('span')).filter(
      (node) => (node.textContent || '').trim() === 'Demo Launcher'
    );
    const launcher = headers
      .map((node) => {
        let current = node.parentElement;
        while (current && current !== document.body) {
          if (
            current instanceof HTMLElement &&
            getComputedStyle(current).position === 'fixed' &&
            (current.textContent || '').includes('Landing slice')
          ) {
            return current;
          }
          current = current.parentElement;
        }
        return null;
      })
      .find(Boolean);
    if (launcher instanceof HTMLElement) {
      launcher.style.display = 'none';
      launcher.setAttribute('aria-hidden', 'true');
    }
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(PROBE_OUTPUT_DIR, { recursive: true });

  const runId = nowStamp();
  const runDir = path.join(OUTPUT_DIR, `run-${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const consoleLogs = [];
  const schemaViolations = [];
  const singleWriterViolations = [];
  const interestingLogs = [];

  console.log(`[screens] Opening ${URL}`);

  const manifest = {
    url: URL,
    runId,
    generatedAt: new Date().toISOString(),
    checkpoints: [],
    checkpointIsolation: 'fresh-page-per-checkpoint',
    anchor: 'window.__LANDING_CAPTURE_READY_PERF_MS__',
    stageStartReference: 'window.__LANDING_STAGE_START_PERF_MS__',
  };

  for (const offsetMs of CHECKPOINTS) {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: 1,
    });
    await installStageStartHook(page);

    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(text);

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

    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const stageStart = await waitForStageStart(page);
    const captureReady = await waitForCaptureReady(page);
    await waitForCheckpoint(page, captureReady.perfMs, offsetMs);
    const state = await captureCheckpointState(page, offsetMs);
    await hideReviewContamination(page);

    const filename = `landing-${String(offsetMs).padStart(5, '0')}ms.png`;
    const filepath = path.join(runDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: false,
    });

    console.log(`[screens] Saved: ${filepath}`);

    manifest.checkpoints.push({
      offsetMs,
      file: filepath,
      stageStart,
      captureReady,
      state,
    });

    await page.close();
  }

  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        ...manifest,
        schemaViolationCount: schemaViolations.length,
        singleWriterViolationCount: singleWriterViolations.length,
        tailLogs: consoleLogs.slice(-200),
      },
      null,
      2
    )
  );

  const probePayload = {
    meta: {
      url: URL,
      checkpoints: CHECKPOINTS,
      stageStartDetected: manifest.checkpoints.length > 0,
      generatedAt: new Date().toISOString(),
      checkpointIsolation: manifest.checkpointIsolation,
      anchor: manifest.anchor,
      stageStartReference: manifest.stageStartReference,
      synchronizedWithManifest: manifestPath,
      source: 'capture-landing-velocity-screens',
      runId,
    },
    schemaViolationCount: schemaViolations.length,
    singleWriterViolationCount: singleWriterViolations.length,
    schemaViolations,
    singleWriterViolations,
    samples: manifest.checkpoints.map((checkpoint) => ({
      offsetMs: checkpoint.offsetMs,
      capturedAt: new Date().toISOString(),
      stageStart: checkpoint.stageStart,
      captureReady: checkpoint.captureReady,
      screenshotPath: checkpoint.file,
      state: checkpoint.state,
    })),
    interestingLogs,
    tailLogs: consoleLogs.slice(-200),
  };
  const probePath = path.join(PROBE_OUTPUT_DIR, `landing-velocity-probe-sync-${runId}.json`);
  fs.writeFileSync(probePath, JSON.stringify(probePayload, null, 2));

  console.log(`[screens] Manifest: ${manifestPath}`);
  console.log(`[screens] Probe sidecar: ${probePath}`);
  await browser.close();
}

main().catch((error) => {
  console.error('[screens] Failed');
  console.error(error);
  process.exit(1);
});
