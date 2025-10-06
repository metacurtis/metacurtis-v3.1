import { test, expect } from '@playwright/test';

async function waitForOpeningComplete(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const trace = (window as any).__trace;
    const hasFencepost = Array.isArray(trace) && trace.some((e: any) => e.ev === 'WBG:FENCEPOST');
    const hasStageBind = Array.isArray(trace) && trace.some((e: any) => e.ev === 'WBG:BIND' && e.kind === 'stage');
    if (!hasFencepost || !hasStageBind) return false;

    const material = (window as any).__consciousnessMaterial;
    const orchestrator = (window as any).__scrollOrchestrator;
    return Boolean(material?.uniforms?.uMorphProgress && orchestrator);
  }, { timeout: 20000 });
}

async function sampleTextAabb(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const probe = (window as any).probe;
    const result = probe?.aabb?.({ source: 'text3DPosition' });
    if (!result) return null;
    return {
      width: Number(result.width ?? 0),
      height: Number(result.height ?? 0),
      depth: Number(result.depth ?? 0),
      min: result.min ? { x: result.min.x, y: result.min.y, z: result.min.z } : null,
      max: result.max ? { x: result.max.x, y: result.max.y, z: result.max.z } : null,
    };
  });
}

test.describe('Opening Sequence v3.5', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.addInitScript(() => {
      if (typeof window !== 'undefined') {
        (window as any).__trace = [];
      }
    });
    await page.goto('/');
    await page.mouse.move(1, 1);
    await waitForOpeningComplete(page);
  });

  test('no late directives after fencepost', async ({ page }) => {
    const postFence = await page.evaluate(() => {
      const trace = (window as any).dumpTrace?.() ?? [];
      const fenceIndex = trace.findIndex((e: any) => e.ev === 'WBG:FENCEPOST');
      if (fenceIndex === -1) return [];
      const tail = trace.slice(fenceIndex + 1);
      const stageIndex = tail.findIndex((e: any) => e.ev === 'WBG:BIND' && e.kind === 'stage');
      const windowEnd = stageIndex >= 0 ? tail.slice(0, stageIndex) : tail;
      return windowEnd.map((e: any) => ({ ev: e.ev, kind: e.kind ?? null }));
    });

    expect(postFence.some((entry: any) => entry.ev === 'DIR')).toBeFalsy();
  });

  test('keeps genesis morph settled after fencepost', async ({ page }) => {
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
    const freezeEvents = await page.evaluate(() => {
      const trace = (window as any).dumpTrace?.() ?? [];
      return trace.filter((e: any) => e.ev === 'WBG:FREEZE').map((e: any) => ({ value: e.value, source: e.source }));
    });

    expect(freezeEvents.length).toBeGreaterThan(0);
    expect(freezeEvents.some((event: any) => event.value === 1)).toBeTruthy();
    expect(freezeEvents.some((event: any) => event.value === 0)).toBeTruthy();

    const firstFreeze = freezeEvents.findIndex((event: any) => event.value === 1);
    const firstRelease = freezeEvents.findIndex((event: any) => event.value === 0);
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
