import { test, expect } from '@playwright/test';
import { waitForFencepostAndStage, sampleTextAabb, dumpTrace } from './helpers';

test.describe('Opening Sequence v3.5', () => {
  test.setTimeout(45_000);

  test.beforeEach(async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/', { waitUntil: 'networkidle' });

    await page.waitForFunction(() => Boolean((window as any).theaterDirector), { timeout: 20_000 });

    await page.evaluate(() => {
      if (typeof (window as any).clearTrace === 'function') {
        (window as any).clearTrace();
      } else {
        (window as any).__trace = [];
      }
      (window as any).theaterDirector?.reset?.();
      (window as any).theaterDirector?.forceStart?.();
    });

    await waitForFencepostAndStage(page);
    await page.mouse.move(1, 1);
  });

  test('no late directives after fencepost', async ({ page }) => {
    const trace = await dumpTrace(page);
    const fenceIndex = trace.findIndex((entry) => entry.ev === 'WBG:FENCEPOST');
    if (fenceIndex === -1) {
      throw new Error('Fencepost event not found in trace');
    }

    const afterFence = trace.slice(fenceIndex + 1);
    const stageIndex = afterFence.findIndex((entry) => entry.ev === 'WBG:BIND' && entry.kind === 'stage');
    const windowEnd = stageIndex >= 0 ? afterFence.slice(0, stageIndex) : afterFence;

    expect(windowEnd.some((entry) => entry.ev === 'DIR')).toBeFalsy();
  });

  test('keeps genesis morph settled after fencepost', async ({ page }) => {
    await page.waitForFunction(() => Boolean((window as any).__scrollOrchestrator), { timeout: 15_000 });

    const morphState = await page.evaluate(() => {
      const orchestrator = (window as any).__scrollOrchestrator;
      const material = (window as any).__consciousnessMaterial;
      return {
        orchestratorMorph: orchestrator?.morph ?? null,
        orchestratorTarget: orchestrator?.morphTarget ?? null,
        shaderMorph: material?.uniforms?.uMorphProgress?.value ?? null,
      };
    });

    expect(morphState.orchestratorMorph).toBeCloseTo(1, 3);
    expect(morphState.orchestratorTarget).toBeCloseTo(1, 3);
    expect(morphState.shaderMorph).toBeCloseTo(1, 3);
  });

  test('movement freeze toggles around fencepost', async ({ page }) => {
    const trace = await dumpTrace(page);
    const freezeEvents = trace
      .filter((entry) => entry.ev === 'WBG:FREEZE')
      .map((entry) => ({ value: entry.value, source: entry.source }));

    expect(freezeEvents.length).toBeGreaterThan(0);
    expect(freezeEvents.some((event) => event.value === 1)).toBeTruthy();
    expect(freezeEvents.some((event) => event.value === 0)).toBeTruthy();

    const firstFreeze = freezeEvents.findIndex((event) => event.value === 1);
    const firstRelease = freezeEvents.findIndex((event) => event.value === 0);
    expect(firstRelease).toBeGreaterThan(firstFreeze);
  });

  test('HELLO CURTIS geometry stays stable between frames', async ({ page }) => {
    const first = await sampleTextAabb(page);
    expect(first).toBeTruthy();

    await page.waitForTimeout(250);
    const second = await sampleTextAabb(page);
    expect(second).toBeTruthy();

    const widthDrift = Math.abs((second!.width - first!.width) / (first!.width || 1));
    const heightDrift = Math.abs((second!.height - first!.height) / (first!.height || 1));

    expect.soft(widthDrift, 'width drift ratio').toBeLessThan(0.005);
    expect.soft(heightDrift, 'height drift ratio').toBeLessThan(0.008);
  });

  test('text geometry fits within expected viewport bounds', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const probe = (window as any).probe;
      const viewport = (window as any).__viewportHint;
      const result = probe?.aabb?.({ source: 'text3DPosition' });
      if (!result || !viewport) return null;

      const widthRatio = result.width / (viewport.width || 1);
      const heightRatio = result.height / (viewport.height || 1);

      return {
        widthRatio,
        heightRatio,
      };
    });

    expect(metrics).toBeTruthy();
    expect.soft(metrics!.widthRatio).toBeGreaterThan(0.4);
    expect.soft(metrics!.widthRatio).toBeLessThan(0.55);
    expect.soft(metrics!.heightRatio).toBeGreaterThan(0.22);
    expect.soft(metrics!.heightRatio).toBeLessThan(0.35);
  });
});
