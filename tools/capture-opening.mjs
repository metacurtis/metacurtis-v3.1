#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const PREVIEW_PORT = 5175;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}/`;
const VIDEO_TMP = path.resolve('.tmp/opening-video');
const OUTPUT_DIR = path.resolve('docs/assets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'opening-genesis.webm');

async function waitForServer(retries = 120, intervalMs = 250) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await fetch(PREVIEW_URL, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore until server is ready
    }
    await delay(intervalMs);
  }
  throw new Error('Preview server did not start in time');
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(VIDEO_TMP);
  const preview = spawn('npm', ['run', 'dev', '--', `--host=127.0.0.1`, `--port=${PREVIEW_PORT}`, '--strictPort'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  try {
    await waitForServer();
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: VIDEO_TMP, size: { width: 1280, height: 720 } },
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => console.error('[capture] page error:', error));
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.theaterDirector?.forceStart), null, { timeout: 20000 });
    await page.evaluate(() => {
      window.theaterDirector?.reset?.();
      window.theaterDirector?.forceStart?.();
    });
    await page.waitForTimeout(12000);
    const video = page.video();
    await page.close();
    await context.close();
    await browser.close();
    const recordedPath = await video.path();
    await ensureDir(OUTPUT_DIR);
    await fs.copyFile(recordedPath, OUTPUT_FILE);
    console.log('🎬 Opening capture saved to', OUTPUT_FILE);
  } finally {
    preview.kill('SIGTERM');
    await delay(500);
  }
}

main().catch((err) => {
  console.error('⛔ Failed to capture opening:', err);
  process.exitCode = 1;
});
