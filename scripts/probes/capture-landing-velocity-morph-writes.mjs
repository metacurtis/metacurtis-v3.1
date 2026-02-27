#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5174';
const QUALITY = (process.env.PROBE_QUALITY || 'HIGH').toUpperCase();
const OUT_DIR = path.resolve(process.cwd(), 'reports', 'velocity-stage-probes');
const OUT_JSON = path.join(OUT_DIR, 'landing-velocity-morph-writes.json');

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1728, height: 1117 } });
  const url = `${BASE_URL}/?slice=landing_stage&preset=velocity_stage&landingWord=VELOCITY&deterministic=1&seed=123&quality=${encodeURIComponent(QUALITY)}`;

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const samples = [];
  for (let i = 0; i < 20; i += 1) {
    await page.waitForTimeout(1000);
    const sample = await page.evaluate((tMs) => ({
      tMs,
      stage: window.stageControls?.getCurrentStage?.() ?? null,
      stageIndex: window.stageControls?.getCurrentStageIndex?.() ?? null,
      renderer: window.__dumpRendererState?.() ?? null,
      morphWritesCount: window.__dumpMorphWrites?.().length ?? 0,
    }), (i + 1) * 1000);
    samples.push(sample);
  }

  const result = await page.evaluate(() => {
    const writes = window.__dumpMorphWrites?.() || [];
    const traceTail = (window.dumpTrace?.() || window.__trace || []).slice(-200);
    const landingResolved = window.Canonical?.landingStageSliceResolved || null;
    const renderer = window.__dumpRendererState?.() || null;
    return {
      writes,
      traceTail,
      landingResolved,
      renderer,
    };
  });

  await browser.close();

  const appliedWrites = result.writes.filter((w) => w?.blocked !== true);
  const blockedWrites = result.writes.filter((w) => w?.blocked === true);
  const lastApplied = appliedWrites.length ? appliedWrites[appliedWrites.length - 1] : null;
  const lastAny = result.writes.length ? result.writes[result.writes.length - 1] : null;

  const report = {
    generatedAt: new Date().toISOString(),
    probe: { baseUrl: BASE_URL, url, quality: QUALITY },
    summary: {
      totalWrites: result.writes.length,
      appliedWrites: appliedWrites.length,
      blockedWrites: blockedWrites.length,
      lastApplied,
      lastAny,
    },
    samples,
    rendererAtEnd: result.renderer,
    landingResolved: result.landingResolved,
    writes: result.writes,
    traceTail: result.traceTail,
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`);
  console.log('LANDING_MORPH_WRITES_REPORT_START');
  console.log(JSON.stringify(report, null, 2));
  console.log('LANDING_MORPH_WRITES_REPORT_END');
}

run().catch((error) => {
  console.error('[capture-landing-velocity-morph-writes] failed:', error);
  process.exit(1);
});
