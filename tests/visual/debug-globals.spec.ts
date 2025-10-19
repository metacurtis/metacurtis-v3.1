import { test } from '@playwright/test';

test.describe('debug globals', () => {
  test('check initialization status over 20s', async ({ page }) => {
    await page.goto('/');

    for (let i = 0; i < 10; i += 1) {
      await page.waitForTimeout(2000);
      const status = await page.evaluate(() => ({
        time: Date.now(),
        documentReady: document.readyState,
        bodyChildren: document.body.childElementCount,
        hasDirector: typeof (window as any).theaterDirector !== 'undefined',
        directorType: typeof (window as any).theaterDirector,
        hasTrace: Array.isArray((window as any).__trace),
        traceLength: Array.isArray((window as any).__trace) ? (window as any).__trace.length : 0,
        hasDumpTrace: typeof (window as any).dumpTrace === 'function',
        hasProbe: typeof (window as any).probe !== 'undefined',
        hasBeatBus: typeof (window as any).beatBus !== 'undefined',
      }));
      console.log(`[${(i + 1) * 2}s]`, status);
    }
  });

  test('trace system snapshot after 15s', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(15000);

    const snapshot = await page.evaluate(() => {
      const dump = (window as any).dumpTrace;
      const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
      return {
        hasTraceArray: Array.isArray(trace),
        traceLength: Array.isArray(trace) ? trace.length : 0,
        firstEvents: Array.isArray(trace) ? trace.slice(0, 5) : [],
        lastEvents: Array.isArray(trace) ? trace.slice(-5) : [],
        hasFencepost: Array.isArray(trace) ? trace.some((entry: any) => entry?.ev === 'WBG:FENCEPOST') : false,
        hasStageBind: Array.isArray(trace) ? trace.some((entry: any) => entry?.ev === 'WBG:BIND' && entry?.kind === 'stage') : false,
        hasEmergence: Array.isArray(trace) ? trace.some((entry: any) => entry?.ev === 'WBG:FENCEPOST' && entry?.source === 'renderer-directive') : false,
      };
    });

    console.log('Trace snapshot:', snapshot);
  });
});
