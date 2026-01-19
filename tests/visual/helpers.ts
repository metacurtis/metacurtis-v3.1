import type { Page } from '@playwright/test';

export async function waitForFencepostAndStage(page: Page, timeout = 30_000) {
  try {
    await page.waitForFunction(() => {
      try {
        const dump = (window as any).dumpTrace;
        const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
        if (!Array.isArray(trace)) {
          console.warn('[FENCEPOST] Trace not ready', { type: typeof trace });
          return false;
        }

        const hasFencepost = trace.some((event: any) => {
          const tag = event.tag || event.type || event.ev;
          if (typeof tag === 'string') {
            if (tag.includes('FENCEPOST') || tag.includes('EMERGED')) return true;
          }
          return event.mode === 'emergence' || event.source === 'renderer-directive' || event.ev === 'WBG:FENCEPOST';
        });

        const hasStageBind = trace.some((event: any) => {
          const tag = event.tag || event.type || event.ev;
          if (typeof tag === 'string' && tag.includes('STAGE')) return true;
          if (typeof tag === 'string' && tag.includes('BIND') && event.kind === 'stage') return true;
          return event.kind === 'stage';
        });

        if (!hasFencepost || !hasStageBind) {
          const now = Date.now();
          const lastLog = (window as any).__fencepostLastLog ?? 0;
          if (now - lastLog > 1000) {
            (window as any).__fencepostLastLog = now;
            console.log('[FENCEPOST] Waiting...', {
              hasFencepost,
              hasStageBind,
              traceLength: trace.length,
              latestTags: trace.slice(-5).map((entry: any) => entry.tag || entry.type || entry.ev || 'unknown'),
            });
          }
        }

        return hasFencepost && hasStageBind;
      } catch (error) {
        console.error('[FENCEPOST] Check error', error);
        return false;
      }
    }, { timeout });

    console.log('[FENCEPOST] ✅ Contract satisfied');
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const dump = (window as any).dumpTrace;
      const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
      if (!Array.isArray(trace)) {
        return {
          traceReady: false,
          type: typeof trace,
          hasTheaterDirector: typeof (window as any).theaterDirector !== 'undefined',
          hasProbe: typeof (window as any).probe !== 'undefined',
          hasBeatBus: typeof (window as any).beatBus !== 'undefined',
        };
      }

      const relevantEvents = trace.filter((entry: any) => {
        const serial = JSON.stringify(entry).toLowerCase();
        return serial.includes('fencepost') || serial.includes('emerged') || serial.includes('bind') || serial.includes('stage');
      });

      return {
        traceReady: true,
        traceLength: trace.length,
        hasTheaterDirector: typeof (window as any).theaterDirector !== 'undefined',
        hasProbe: typeof (window as any).probe !== 'undefined',
        hasBeatBus: typeof (window as any).beatBus !== 'undefined',
        relevantEvents: relevantEvents.slice(0, 10),
        allTags: Array.from(new Set(trace.map((entry: any) => entry.tag || entry.type || entry.ev || 'unknown'))),
        lastEvents: trace.slice(-10),
      };
    });

    console.error('\n❌ FENCEPOST TIMEOUT DIAGNOSTIC:');
    console.error(JSON.stringify(diagnostic, null, 2));

    const traceLength = typeof (diagnostic as any)?.traceLength === 'number'
      ? (diagnostic as any).traceLength
      : 'unknown';

    throw new Error(`Fencepost timeout after ${timeout}ms (traceLength=${traceLength}). See console for diagnostic details.`);
  }
}

export async function waitForTraceEvent(
  page: Page,
  matcher: (event: any) => boolean,
  options: { timeout?: number; description?: string } = {},
) {
  const { timeout = 30_000, description = 'event' } = options;
  const matcherSource = matcher.toString();

  await page.waitForFunction(
    (source) => {
      const dump = (window as any).dumpTrace;
      const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
      if (!Array.isArray(trace)) return false;

      let predicate: ((event: any) => boolean) | null = null;
      try {
        predicate = Function('"use strict"; return (' + source + ');')();
      } catch (err) {
        console.error('[TRACE] matcher evaluation failed', err);
        return false;
      }

      if (typeof predicate !== 'function') return false;
      return trace.some((event: any) => {
        try {
          return predicate!(event);
        } catch {
          return false;
        }
      });
    },
    matcherSource,
    { timeout },
  );

  console.log(`[TRACE] ✅ Found ${description}`);
}

export async function waitForTheaterReady(page: Page, timeout = 30_000) {
  await page.waitForFunction(() => typeof (window as any).theaterDirector !== 'undefined', { timeout });
  await waitForFencepostAndStage(page, timeout);
  console.log('[THEATER] ✅ Director ready, fencepost contract satisfied');
}

export async function waitForDemoReady(
  page: Page,
  options: { demoKey?: string; word?: string; timeout?: number } = {},
) {
  const { demoKey, word, timeout = 30_000 } = options;

  await page.waitForFunction(
    ({ demoKey: expectedDemoKey, expectedWord }) => {
      const w = window as any;
      if (!w.__DEMO_MODE__) return false;
      if (expectedDemoKey && w.__DEMO_KEY__ !== expectedDemoKey) return false;
      if (expectedWord && w.__LAST_TEXT_MORPH_WORD__ !== expectedWord) return false;
      if (!w.__rendererDiagnostics?.getAttributeArray) return false;
      if (!w.__viewportHint) return false;
      return true;
    },
    { demoKey, expectedWord: word },
    { timeout },
  );

  console.log('[DEMO] ✅ Demo ready', { demoKey, word });
}

export async function sampleTextAabb(page: Page) {
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

export async function dumpTrace(page: Page) {
  return page.evaluate(() => {
    const dump = (window as any).dumpTrace;
    const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
    return Array.isArray(trace) ? trace.map((entry: any) => ({ ...entry })) : [];
  });
}
