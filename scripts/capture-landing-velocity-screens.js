/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const CHECKPOINTS = (process.env.LANDING_SCREEN_CHECKPOINTS || '5200,7600,9300,9500,12000')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);

const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 15000);
const OUTPUT_DIR = path.join(process.cwd(), 'reports', 'velocity-stage-screens');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const runId = nowStamp();
  const runDir = path.join(OUTPUT_DIR, `run-${runId}`);
  fs.mkdirSync(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });

  let stageStartTs = null;
  const consoleLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[ConsciousnessTheater] Landing stage mode started')) {
      stageStartTs = Date.now();
    }
  });

  console.log(`[screens] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, {
    timeout: 30000,
  });

  const deadline = Date.now() + STAGE_START_TIMEOUT_MS;
  while (!stageStartTs && Date.now() < deadline) {
    await wait(50);
  }

  if (!stageStartTs) {
    throw new Error('Landing stage mode start was not observed in console logs.');
  }

  const manifest = {
    url: URL,
    runId,
    generatedAt: new Date().toISOString(),
    checkpoints: [],
  };

  for (const offsetMs of CHECKPOINTS) {
    const targetTs = stageStartTs + offsetMs;
    await wait(targetTs - Date.now());

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
      };
    });

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
      state,
    });
  }

  const manifestPath = path.join(runDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, tailLogs: consoleLogs.slice(-200) }, null, 2));

  console.log(`[screens] Manifest: ${manifestPath}`);
  await browser.close();
}

main().catch((error) => {
  console.error('[screens] Failed');
  console.error(error);
  process.exit(1);
});
