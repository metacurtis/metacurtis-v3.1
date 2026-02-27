import { test, expect } from '@playwright/test';
import { waitForTheaterReady, sampleTextAabb, dumpTrace } from './helpers';

const OPENING_TEST_URL = '/?deterministic=1&seed=123&quality=HIGH';

test.describe('Opening Sequence v3.5', () => {
  test.setTimeout(45_000);

  test.beforeEach(async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));

    await page.goto(OPENING_TEST_URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof (window as any).theaterDirector !== 'undefined', {
      timeout: 15_000,
    });

    await page.evaluate(() => {
      const director = (window as any).theaterDirector;
      director?.reset?.();
      director?.forceStart?.();
    });

    await waitForTheaterReady(page);
    await page.mouse.move(1, 1);
  });

  test('no late directives after fencepost', async ({ page }) => {
    const trace = await dumpTrace(page);
    const fenceIndex = trace.findIndex(
      (entry) => entry.ev === 'WBG:FENCEPOST' || entry.ev === 'FENCEPOST_LISTENERS_READY',
    );
    if (fenceIndex === -1) {
      throw new Error('Fencepost event not found in trace');
    }

    const afterFence = trace.slice(fenceIndex + 1);
    const stageIndex = afterFence.findIndex((entry) => entry.ev === 'WBG:BIND' && entry.kind === 'stage');
    const windowEnd = stageIndex >= 0 ? afterFence.slice(0, stageIndex) : afterFence;

    expect(windowEnd.some((entry) => entry.ev === 'WBG:APPLIED')).toBeFalsy();
  });

  test('fencepost waits for listeners before stage bind', async ({ page }) => {
    const ordering = await page.evaluate(() => {
      const trace = (window as any).dumpTrace?.() ?? [];
      const readyIndex = trace.findIndex((entry: any) => entry.ev === 'FENCEPOST_LISTENERS_READY');
      const fenceIndex = trace.findIndex((entry: any) => entry.ev === 'WBG:FENCEPOST');
      const stageBindIndex = trace.findIndex(
        (entry: any) => entry.ev === 'WBG:BIND' && (entry.kind === 'stage' || entry.kind === 'material-init'),
      );
      return { readyIndex, fenceIndex, stageBindIndex };
    });

    expect(ordering.readyIndex).toBeGreaterThanOrEqual(0);
    if (ordering.fenceIndex >= 0) {
      expect(ordering.fenceIndex).toBeGreaterThan(ordering.readyIndex);
    }
    expect(ordering.stageBindIndex).toBeGreaterThanOrEqual(0);
    expect(ordering.stageBindIndex).toBeGreaterThan(ordering.readyIndex);
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
    if (typeof morphState.shaderMorph === 'number') {
      expect(morphState.shaderMorph).toBeCloseTo(1, 2);
    }
  });

  test('movement freeze toggles around fencepost', async ({ page }) => {
    const trace = await dumpTrace(page);
    const freezeEvents = trace
      .filter((entry) => entry.ev === 'WBG:FREEZE')
      .map((entry) => ({ value: entry.value, source: entry.source }));
    if (freezeEvents.length > 0) {
      expect(freezeEvents.some((event) => event.value === 1)).toBeTruthy();
      expect(freezeEvents.some((event) => event.value === 0)).toBeTruthy();

      const firstFreeze = freezeEvents.findIndex((event) => event.value === 1);
      const firstRelease = freezeEvents.findIndex((event) => event.value === 0);
      expect(firstRelease).toBeGreaterThan(firstFreeze);
    } else {
      const hasReady = trace.some((entry) => entry.ev === 'FENCEPOST_LISTENERS_READY');
      const hasBind = trace.some(
        (entry) => entry.ev === 'WBG:BIND' && (entry.kind === 'stage' || entry.kind === 'material-init'),
      );
      expect(hasReady).toBeTruthy();
      expect(hasBind).toBeTruthy();
    }
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
    // allow the post-fencepost stage bind to settle
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const probe = (window as any).probe;
      const result = probe?.aabb?.({ source: 'text3DPosition' });
      const dump = (window as any).dumpTrace;
      const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
      const bind = Array.isArray(trace)
        ? [...trace]
            .reverse()
            .find(
              (entry: any) =>
                entry?.ev === 'WBG:BIND' && entry?.textAABB && (entry.kind === 'material-init' || entry.kind === 'stage'),
            )
        : null;
      if (!result && !bind?.textAABB) return null;

      const width = Number(result?.width ?? bind?.textAABB?.w ?? 0);
      const height = Number(result?.height ?? bind?.textAABB?.h ?? 0);

      const viewport = (window as any).__viewportHint;
      const ratioX = Number.isFinite(result?.ratioX)
        ? Number(result.ratioX)
        : viewport
          ? width / Math.max(1, Number(viewport.width ?? viewport.cssWidth ?? 1))
          : (Number.isFinite(result?.minView) ? width / Math.max(1, Number(result.minView)) : null);
      const ratioY = Number.isFinite(result?.ratioY)
        ? Number(result.ratioY)
        : viewport
          ? height / Math.max(1, Number(viewport.height ?? viewport.cssHeight ?? 1))
          : (Number.isFinite(result?.minView) ? height / Math.max(1, Number(result.minView)) : null);

      return {
        ratioX: ratioX ?? null,
        ratioY: ratioY ?? null,
      };
    });

    console.log('[TEST] text3DPosition ratios', metrics);

    expect(metrics).toBeTruthy();
    expect(metrics!.ratioX).not.toBeNull();
    expect(metrics!.ratioY).not.toBeNull();
    expect.soft(metrics!.ratioX as number).toBeGreaterThan(1.0);
    expect.soft(metrics!.ratioX as number).toBeLessThan(1.6);
    expect.soft(metrics!.ratioY as number).toBeGreaterThan(0.15);
    expect.soft(metrics!.ratioY as number).toBeLessThan(0.45);
  });
});
