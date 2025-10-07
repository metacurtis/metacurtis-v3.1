import { test, expect } from '@playwright/test';
import { bootstrapTrace, waitForFencepostAndStage, sampleTextAabb, dumpTrace } from './helpers';

test.describe('Opening Sequence v3.5', () => {
  test.setTimeout(45_000);

  test.beforeEach(async ({ page }) => {
    await bootstrapTrace(page);

    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto('/', { waitUntil: 'networkidle' });

    await bootstrapTrace(page);

    await page.waitForFunction(() => Boolean((window as any).theaterDirector), { timeout: 20_000 });

    await page.evaluate(() => {
      (window as any).clearTrace?.();
      (window as any).theaterDirector?.reset?.();
      (window as any).theaterDirector?.forceStart?.();
    });

    await waitForFencepostAndStage(page);

    await page.waitForFunction(() => {
      const material = (window as any).__consciousnessMaterial;
      const geometry = (window as any).__particleGeometry;
      return Boolean(material?.uniforms?.uMorphProgress && geometry?.attributes?.position?.array);
    }, { timeout: 10_000 });
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

    const appliedEvents = windowEnd.filter((entry) => entry.ev === 'DIR' && entry.source === 'WBG:APPLIED');
    expect(appliedEvents.length).toBe(0);
  });

  test('fencepost waits for listeners before stage bind', async ({ page }) => {
    const ordering = await page.evaluate(() => {
      const trace = (window as any).dumpTrace?.() ?? [];
      const readyIndex = trace.findIndex((entry: any) => entry.ev === 'FENCEPOST_LISTENERS_READY');
      const fenceIndex = trace.findIndex((entry: any) => entry.ev === 'WBG:FENCEPOST');
      const stageBindIndex = trace.findIndex((entry: any) => entry.ev === 'WBG:BIND' && entry.kind === 'stage');
      return { readyIndex, fenceIndex, stageBindIndex };
    });

    expect(ordering.readyIndex).toBeGreaterThanOrEqual(0);
    expect(ordering.fenceIndex).toBeGreaterThan(ordering.readyIndex);
    expect(ordering.stageBindIndex).toBeGreaterThanOrEqual(0);
    expect(ordering.stageBindIndex).toBeGreaterThan(ordering.fenceIndex);
  });

  test('keeps genesis morph settled after fencepost', async ({ page }) => {
    await page.waitForFunction(() => {
      const orchestrator = (window as any).__scrollOrchestrator;
      const material = (window as any).__consciousnessMaterial;
      return Boolean(orchestrator && material?.uniforms?.uMorphProgress);
    }, { timeout: 15_000 });

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
    const metrics = await sampleTextAabb(page);

    expect(metrics).toBeTruthy();
    expect(metrics!.ratioX).not.toBeNull();
    expect(metrics!.ratioY).not.toBeNull();
    expect.soft(metrics!.ratioX as number).toBeGreaterThan(0.35);
    expect.soft(metrics!.ratioX as number).toBeLessThan(0.65);
    expect.soft(metrics!.ratioY as number).toBeGreaterThan(0.15);
    expect.soft(metrics!.ratioY as number).toBeLessThan(0.45);
  });
});
