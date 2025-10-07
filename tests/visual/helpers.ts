import type { Page } from '@playwright/test';

export async function bootstrapTrace(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;

    const ensureBuffer = () => {
      if (!Array.isArray(w.__trace)) {
        w.__trace = [];
      }
      return w.__trace;
    };

    const createDump = () => () => {
      const buf = ensureBuffer();
      return Array.isArray(buf) ? buf.slice() : [];
    };

    const createClear = () => () => {
      w.__trace = [];
      return w.__trace;
    };

    ensureBuffer();

    if (typeof w.dumpTrace !== 'function') {
      w.dumpTrace = createDump();
    }

    if (typeof w.clearTrace !== 'function') {
      w.clearTrace = createClear();
    }
  });

  const url = page.url();
  if (!url || url === 'about:blank') {
    // First call executed before navigation; init script will run once the page loads.
    return;
  }

  await page.evaluate(() => {
    const w = window as any;

    const ensureBuffer = () => {
      if (!Array.isArray(w.__trace)) {
        w.__trace = [];
      }
      return w.__trace;
    };

    const dump = () => {
      const buf = ensureBuffer();
      return Array.isArray(buf) ? buf.slice() : [];
    };

    const clear = () => {
      w.__trace = [];
      return w.__trace;
    };

    ensureBuffer();

    if (typeof w.dumpTrace !== 'function') {
      w.dumpTrace = dump;
    }

    if (typeof w.clearTrace !== 'function') {
      w.clearTrace = clear;
    }

    return true;
  });

  await page.waitForFunction(() => {
    const w = window as any;
    return typeof w.dumpTrace === 'function' && typeof w.clearTrace === 'function';
  }, { timeout: 10_000 });
}

export async function waitForFencepostAndStage(page: Page, timeout = 30_000) {
  await page.waitForFunction(() => {
    const dump = (window as any).dumpTrace;
    const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
    if (!Array.isArray(trace)) return false;
    const readyIndex = trace.findIndex((entry: any) => entry?.ev === 'FENCEPOST_LISTENERS_READY');
    const fenceIndex = trace.findIndex((entry: any) => entry?.ev === 'WBG:FENCEPOST');
    const stageIndex = trace.findIndex((entry: any) => entry?.ev === 'WBG:BIND' && entry?.kind === 'stage');
    return readyIndex >= 0 && fenceIndex > readyIndex && stageIndex > fenceIndex;
  }, { timeout });
}

export async function sampleTextAabb(page: Page) {
  return page.evaluate(() => {
    const probe = (window as any).probe;
    const result = probe?.aabb?.({ source: 'text3DPosition' });
    const camera = (window as any).__camera;
    if (!result || !camera) return null;

    const width = Number(result.width ?? 0);
    const height = Number(result.height ?? 0);
    const depth = Number(result.depth ?? 0);

    const fov = Number.isFinite(camera.fov) ? camera.fov : 50;
    const aspect = Number.isFinite(camera.aspect) && camera.aspect > 0 ? camera.aspect : 16 / 9;
    const distance = Math.abs(Number(camera.position?.z ?? 1));
    const halfHeight = Math.tan((fov * Math.PI) / 360) * distance;
    const halfWidth = halfHeight * aspect;

    const ratioX = halfWidth > 0 ? width / (2 * halfWidth) : null;
    const ratioY = halfHeight > 0 ? height / (2 * halfHeight) : null;

    return {
      width,
      height,
      depth,
      ratioX,
      ratioY,
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
