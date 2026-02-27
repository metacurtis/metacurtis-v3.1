import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const REPRO_URL =
  'http://localhost:5173/?slice=landing_stage&preset=agency_dark&deterministic=1&seed=123&quality=HIGH';

test.describe('ZAG runtime probes', () => {
  test('capture landing black-screen probes', async ({ page }, testInfo) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(REPRO_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(4500);

    const probe1 = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return { hasCanvas: false };
      const r = c.getBoundingClientRect();
      return { hasCanvas: true, cssW: r.width, cssH: r.height, w: c.width, h: c.height };
    });

    const probe2 = await page.evaluate(() => ({
      search: window.location.search,
      landingResolved: window.Canonical?.landingStageSliceResolved || null,
      landingModeForm: window.Canonical?.landingModes?.form || null,
      demoKey: window.Canonical?.landingStageSliceResolved?.demoKey || null,
      demo: window.Canonical?.visualDemos?.[window.Canonical?.landingStageSliceResolved?.demoKey] || null,
    }));

    const probe3Before = await page.evaluate(() => ({
      dumpFormStateType: typeof window.__dumpFormState,
      formState: typeof window.__dumpFormState === 'function' ? window.__dumpFormState() : null,
      traceTail: (window.dumpTrace?.() || window.__trace || []).slice(-20),
    }));

    const probe4Before = await page.evaluate(() => {
      const mat = window.__consciousnessMaterial;
      if (!mat?.uniforms) return { hasMaterial: false };
      const u = mat.uniforms;
      const pick = (k) => (u[k] ? u[k].value : undefined);
      return {
        hasMaterial: true,
        uTime: pick('uTime'),
        uMorphProgress: pick('uMorphProgress'),
        uScrollProgress: pick('uScrollProgress'),
        uStageIndex: pick('uStageIndex'),
        uActiveCount: pick('uActiveCount'),
        uTierCutoff: pick('uTierCutoff'),
        uPointSize: pick('uPointSize'),
        uGaussianSigma: pick('uGaussianSigma'),
        uFadeProgress: pick('uFadeProgress'),
        uColorCurrent: pick('uColorCurrent'),
        uColorNext: pick('uColorNext'),
        uColorAccent1: pick('uColorAccent1'),
        uColorAccent2: pick('uColorAccent2'),
      };
    });

    const brightnessBefore = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return { hasCanvas: false };
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(c.width / 4));
      off.height = Math.max(1, Math.floor(c.height / 4));
      const ctx = off.getContext('2d');
      if (!ctx) return { hasCanvas: true, sampleReady: false };
      ctx.drawImage(c, 0, 0, off.width, off.height);
      const img = ctx.getImageData(0, 0, off.width, off.height).data;
      let bright = 0;
      let total = 0;
      for (let i = 0; i < img.length; i += 4) {
        const r = img[i];
        const g = img[i + 1];
        const b = img[i + 2];
        const a = img[i + 3];
        if (a < 4) continue;
        total += 1;
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (l > 12) bright += 1;
      }
      return {
        hasCanvas: true,
        sampleReady: true,
        brightPixels: bright,
        totalPixels: total,
        brightRatio: total ? bright / total : 0,
      };
    });

    const beforePath = testInfo.outputPath('zag-before-probe5.png');
    await page.screenshot({ path: beforePath, fullPage: true });

    const probe5 = await page.evaluate(() => {
      const mat = window.__consciousnessMaterial;
      if (!mat?.uniforms) return { forced: false, reason: 'no material/uniforms' };
      const u = mat.uniforms;
      const set = (k, v) => {
        if (u[k]) u[k].value = v;
      };
      set('uPointSize', Math.max(6, Number(u.uPointSize?.value || 0)));
      set('uGaussianSigma', Math.max(2.0, Number(u.uGaussianSigma?.value || 0)));
      set('uTierCutoff', 3);
      set('uMorphProgress', 1.0);
      set('uFadeProgress', 1.0);
      set('uTime', 0.0);
      mat.needsUpdate = true;
      return { forced: true };
    });

    await page.waitForTimeout(1500);

    const probe3After = await page.evaluate(() => ({
      dumpFormStateType: typeof window.__dumpFormState,
      formState: typeof window.__dumpFormState === 'function' ? window.__dumpFormState() : null,
      traceTail: (window.dumpTrace?.() || window.__trace || []).slice(-20),
    }));

    const probe4After = await page.evaluate(() => {
      const mat = window.__consciousnessMaterial;
      if (!mat?.uniforms) return { hasMaterial: false };
      const u = mat.uniforms;
      const pick = (k) => (u[k] ? u[k].value : undefined);
      return {
        hasMaterial: true,
        uTime: pick('uTime'),
        uMorphProgress: pick('uMorphProgress'),
        uScrollProgress: pick('uScrollProgress'),
        uStageIndex: pick('uStageIndex'),
        uActiveCount: pick('uActiveCount'),
        uTierCutoff: pick('uTierCutoff'),
        uPointSize: pick('uPointSize'),
        uGaussianSigma: pick('uGaussianSigma'),
        uFadeProgress: pick('uFadeProgress'),
        uColorCurrent: pick('uColorCurrent'),
        uColorNext: pick('uColorNext'),
        uColorAccent1: pick('uColorAccent1'),
        uColorAccent2: pick('uColorAccent2'),
      };
    });

    const brightnessAfter = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return { hasCanvas: false };
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(c.width / 4));
      off.height = Math.max(1, Math.floor(c.height / 4));
      const ctx = off.getContext('2d');
      if (!ctx) return { hasCanvas: true, sampleReady: false };
      ctx.drawImage(c, 0, 0, off.width, off.height);
      const img = ctx.getImageData(0, 0, off.width, off.height).data;
      let bright = 0;
      let total = 0;
      for (let i = 0; i < img.length; i += 4) {
        const r = img[i];
        const g = img[i + 1];
        const b = img[i + 2];
        const a = img[i + 3];
        if (a < 4) continue;
        total += 1;
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (l > 12) bright += 1;
      }
      return {
        hasCanvas: true,
        sampleReady: true,
        brightPixels: bright,
        totalPixels: total,
        brightRatio: total ? bright / total : 0,
      };
    });

    const afterPath = testInfo.outputPath('zag-after-probe5.png');
    await page.screenshot({ path: afterPath, fullPage: true });

    const report = {
      reproUrl: REPRO_URL,
      probes: {
        probe1,
        probe2,
        probe3Before,
        probe4Before,
        probe5,
        probe3After,
        probe4After,
      },
      brightness: {
        before: brightnessBefore,
        after: brightnessAfter,
        increased:
          (brightnessAfter.brightRatio || 0) > (brightnessBefore.brightRatio || 0) + 0.01,
      },
      artifacts: {
        beforeScreenshot: beforePath,
        afterScreenshot: afterPath,
      },
    };

    const outDir = path.join(process.cwd(), 'reports', 'zag-runtime-probes');
    fs.mkdirSync(outDir, { recursive: true });
    const reportPath = path.join(outDir, 'runtime-probes.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('ZAG_RUNTIME_PROBES_START');
    console.log(JSON.stringify(report, null, 2));
    console.log('ZAG_RUNTIME_PROBES_END');
  });
});

