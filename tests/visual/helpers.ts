import type { Page } from '@playwright/test';

export async function waitForFencepostAndStage(page: Page, timeout = 30_000) {
  await page.waitForFunction(() => {
    const dump = (window as any).dumpTrace;
    const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
    if (!Array.isArray(trace)) return false;
    const fenceIndex = trace.findIndex((entry: any) => entry?.ev === 'WBG:FENCEPOST');
    if (fenceIndex < 0) return false;
    const afterFence = trace.slice(fenceIndex + 1);
    return afterFence.some((entry: any) => entry?.ev === 'WBG:BIND' && entry?.kind === 'stage');
  }, { timeout });
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
