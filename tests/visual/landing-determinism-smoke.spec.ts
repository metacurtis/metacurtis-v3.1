import { expect, test, type Page } from '@playwright/test';

const LANDING_STAGE_SLICE_URL =
  '/?slice=landing_stage&landingStage=genesis&landingWord=FORM&deterministic=1&seed=123&quality=HIGH';
const LANDING_PRESET_SLICE_URL =
  '/?slice=landing_stage&preset=agency_dark&deterministic=1&seed=123&quality=HIGH';
const LANDING_PRESET_SAAS_SLICE_URL =
  '/?slice=landing_stage&preset=saas_clean&deterministic=1&seed=123&quality=HIGH';
const LANDING_PRESET_VELOCITY_SLICE_URL =
  '/?slice=landing_stage&preset=velocity_stage&deterministic=1&seed=123&quality=HIGH';
const SCROLL_SHOTS = [
  { pct: 0, file: 'landing-slice-scroll-00.png' },
  { pct: 50, file: 'landing-slice-scroll-50.png' },
  { pct: 95, file: 'landing-slice-scroll-95.png' },
];
const LANDING_STAGE_SCROLL_SHOTS = [
  { pct: 0, file: 'landing-stage-lock-scroll-00.png' },
  { pct: 50, file: 'landing-stage-lock-scroll-50.png' },
  { pct: 95, file: 'landing-stage-lock-scroll-95.png' },
];
const LANDING_PRESET_SCROLL_SHOTS = [
  { pct: 0, file: 'landing-preset-agency-dark-scroll-00.png' },
  { pct: 50, file: 'landing-preset-agency-dark-scroll-50.png' },
  { pct: 95, file: 'landing-preset-agency-dark-scroll-95.png' },
];
const LANDING_PRESET_VELOCITY_SCROLL_SHOTS = [
  { pct: 0, file: 'landing-preset-velocity-stage-scroll-00.png' },
  { pct: 50, file: 'landing-preset-velocity-stage-scroll-50.png' },
  { pct: 95, file: 'landing-preset-velocity-stage-scroll-95.png' },
];

async function stabilizeFrame(page: Page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function waitForCameraSettled(page: Page) {
  await page.waitForFunction(() => {
    const dump = (window as any).__dumpFormState;
    if (typeof dump !== 'function') return false;
    const state = dump();
    const pos = state?.camera?.pos;
    if (!Array.isArray(pos) || pos.length < 3) return false;

    const meter = ((window as any).__cameraSettleMeter ||= {
      last: null,
      stableCount: 0,
    });

    if (!Array.isArray(meter.last)) {
      meter.last = [...pos];
      meter.stableCount = 0;
      return false;
    }

    const dx = Number(pos[0]) - Number(meter.last[0]);
    const dy = Number(pos[1]) - Number(meter.last[1]);
    const dz = Number(pos[2]) - Number(meter.last[2]);
    const drift = Math.sqrt(dx * dx + dy * dy + dz * dz);

    meter.last = [...pos];
    meter.stableCount = drift < 0.01 ? meter.stableCount + 1 : 0;
    return meter.stableCount >= 3;
  }, { timeout: 12_000 });
}

async function waitForDeterministicScene(page: Page, options: { requireDirectiveOwner?: boolean } = {}) {
  const requireDirectiveOwner = options.requireDirectiveOwner !== false;
  await page.waitForFunction(({ requireDirectiveOwner }) => {
    const hasDump = typeof (window as any).__dumpFormState === 'function';
    const hasCanvas = Boolean(document.querySelector('canvas'));
    const deterministicEnabled = (window as any).__DETERMINISTIC_MODE__ === true;
    const cameraOwner = (window as any).__cameraOwner;
    const ownerReady = requireDirectiveOwner ? cameraOwner === 'directive' : true;
    return hasDump && hasCanvas && deterministicEnabled && ownerReady;
  }, { requireDirectiveOwner }, { timeout: 30_000 });

  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    (window as any).theaterDirector?.forceStart?.();
  });
  await page.evaluate(() => {
    const tier = (window as any).__FORCE_QUALITY_TIER__ || 'HIGH';
    (window as any).qualityAtom?.setCurrentQualityTier?.(tier);
  });
  await stabilizeFrame(page);
}

async function scrollToPercent(page: Page, pct: number) {
  await page.evaluate((value) => {
    const el = document.documentElement;
    const maxScroll = Math.max(0, el.scrollHeight - window.innerHeight);
    const target = Math.round((Math.max(0, Math.min(100, value)) / 100) * maxScroll);
    window.scrollTo(0, target);
  }, pct);

  // WebGLBackground camera directives use ~900ms transitions.
  await page.waitForTimeout(1200);
  await stabilizeFrame(page);
  await waitForCameraSettled(page);
}

async function assertLandingOverlayVisible(page: Page) {
  const cta = page.getByTestId('landing-overlay-cta');
  await expect(cta).toBeVisible();
}

async function readLandingSignature(page: Page) {
  return page.evaluate(() => {
    const dump = (window as any).__dumpFormState;
    const state = typeof dump === 'function' ? dump() : null;
    const cameraPos = Array.isArray(state?.camera?.pos)
      ? state.camera.pos.slice(0, 3).map((value: unknown) => Number(value || 0))
      : [0, 0, 0];
    const stageIndex = Number(state?.uniforms?.uStageIndex ?? -1);
    const resolved = (window as any).Canonical?.landingStageSliceResolved || {};
    return {
      stageIndex,
      cameraPos,
      choreoKey: typeof resolved?.choreoKey === 'string' ? resolved.choreoKey : null,
      demoKey: typeof resolved?.demoKey === 'string' ? resolved.demoKey : null,
    };
  });
}

test.describe('Landing determinism visual smoke', () => {
  test.setTimeout(75_000);

  test('captures stable canvas snapshots at 0%, 50%, and 95% scroll', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(LANDING_STAGE_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page);

    const config = await page.evaluate(() => (window as any).__DETERMINISTIC_CONFIG__ || null);
    expect(config?.seed).toBe('123');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await assertLandingOverlayVisible(page);

    for (const shot of SCROLL_SHOTS) {
      await scrollToPercent(page, shot.pct);
      await expect(canvas).toHaveScreenshot(shot.file, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.12,
      });
    }
  });

  test('captures stable snapshots in landing_stage slice mode with stage lock', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(LANDING_STAGE_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page);

    const config = await page.evaluate(() => (window as any).__DETERMINISTIC_CONFIG__ || null);
    expect(config?.seed).toBe('123');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await assertLandingOverlayVisible(page);

    const lockedStageIndex = await page.evaluate(() => {
      const dump = (window as any).__dumpFormState;
      const state = typeof dump === 'function' ? dump() : null;
      return Number(state?.uniforms?.uStageIndex ?? -1);
    });
    expect(lockedStageIndex).toBeGreaterThanOrEqual(0);

    for (const shot of LANDING_STAGE_SCROLL_SHOTS) {
      await scrollToPercent(page, shot.pct);
      const stageIndexAtScroll = await page.evaluate(() => {
        const dump = (window as any).__dumpFormState;
        const state = typeof dump === 'function' ? dump() : null;
        return Number(state?.uniforms?.uStageIndex ?? -1);
      });
      expect(stageIndexAtScroll).toBe(lockedStageIndex);
      await expect(canvas).toHaveScreenshot(shot.file, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.12,
      });
    }
  });

  test('captures stable snapshots using preset=agency_dark with stage lock', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(LANDING_PRESET_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });

    const config = await page.evaluate(() => (window as any).__DETERMINISTIC_CONFIG__ || null);
    expect(config?.seed).toBe('123');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await assertLandingOverlayVisible(page);
    await expect(page.getByTestId('landing-overlay-preset-value')).toHaveText('agency_dark');

    const lockedStageIndex = await page.evaluate(() => {
      const dump = (window as any).__dumpFormState;
      const state = typeof dump === 'function' ? dump() : null;
      return Number(state?.uniforms?.uStageIndex ?? -1);
    });
    expect(lockedStageIndex).toBeGreaterThanOrEqual(0);

    for (const shot of LANDING_PRESET_SCROLL_SHOTS) {
      await scrollToPercent(page, shot.pct);
      const stageIndexAtScroll = await page.evaluate(() => {
        const dump = (window as any).__dumpFormState;
        const state = typeof dump === 'function' ? dump() : null;
        return Number(state?.uniforms?.uStageIndex ?? -1);
      });
      expect(stageIndexAtScroll).toBe(lockedStageIndex);
      await expect(canvas).toHaveScreenshot(shot.file, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.03,
      });
    }
  });

  test('captures stable snapshots using preset=velocity_stage with stage lock', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto(LANDING_PRESET_VELOCITY_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });

    const config = await page.evaluate(() => (window as any).__DETERMINISTIC_CONFIG__ || null);
    expect(config?.seed).toBe('123');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await assertLandingOverlayVisible(page);
    await expect(page.getByTestId('landing-overlay-preset-value')).toHaveText('velocity_stage');

    const lockedStageIndex = await page.evaluate(() => {
      const dump = (window as any).__dumpFormState;
      const state = typeof dump === 'function' ? dump() : null;
      return Number(state?.uniforms?.uStageIndex ?? -1);
    });
    expect(lockedStageIndex).toBeGreaterThanOrEqual(0);

    for (const shot of LANDING_PRESET_VELOCITY_SCROLL_SHOTS) {
      await scrollToPercent(page, shot.pct);
      const stageIndexAtScroll = await page.evaluate(() => {
        const dump = (window as any).__dumpFormState;
        const state = typeof dump === 'function' ? dump() : null;
        return Number(state?.uniforms?.uStageIndex ?? -1);
      });
      expect(stageIndexAtScroll).toBe(lockedStageIndex);
      await expect(canvas).toHaveScreenshot(shot.file, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.06,
      });
    }
  });

  test('uses distinct deterministic choreography signatures across presets', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto(LANDING_PRESET_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });
    await scrollToPercent(page, 50);
    const agencyCanvas = page.locator('canvas').first();
    await expect(agencyCanvas).toBeVisible();
    const agencySignature = await readLandingSignature(page);
    expect(agencySignature.choreoKey).toBe('agency_dark');
    expect(agencySignature.demoKey).toContain('agency_dark');
    await expect(agencyCanvas).toHaveScreenshot('landing-preset-agency-dark-signature-50.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.1,
    });

    await page.goto(LANDING_PRESET_SAAS_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });
    await scrollToPercent(page, 50);
    const saasCanvas = page.locator('canvas').first();
    await expect(saasCanvas).toBeVisible();
    const saasSignature = await readLandingSignature(page);
    expect(saasSignature.choreoKey).toBe('saas_clean');
    expect(saasSignature.demoKey).toContain('saas_clean');
    await expect(saasCanvas).toHaveScreenshot('landing-preset-saas-clean-signature-50.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.1,
    });

    const cameraDistance = Math.hypot(
      agencySignature.cameraPos[0] - saasSignature.cameraPos[0],
      agencySignature.cameraPos[1] - saasSignature.cameraPos[1],
      agencySignature.cameraPos[2] - saasSignature.cameraPos[2],
    );
    expect(cameraDistance).toBeGreaterThan(0.4);
  });

  test('velocity_stage deterministic signature differs from agency_dark', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto(LANDING_PRESET_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });
    await scrollToPercent(page, 50);
    const agencySignature = await readLandingSignature(page);
    expect(agencySignature.choreoKey).toBe('agency_dark');

    await page.goto(LANDING_PRESET_VELOCITY_SLICE_URL, { waitUntil: 'networkidle' });
    await waitForDeterministicScene(page, { requireDirectiveOwner: false });
    await scrollToPercent(page, 50);
    const velocitySignature = await readLandingSignature(page);
    expect(velocitySignature.choreoKey).toBe('velocity_stage');
    expect(velocitySignature.demoKey).toContain('velocity_stage');
    expect(velocitySignature.choreoKey).not.toBe(agencySignature.choreoKey);
    expect(velocitySignature.demoKey).not.toBe(agencySignature.demoKey);
  });
});
