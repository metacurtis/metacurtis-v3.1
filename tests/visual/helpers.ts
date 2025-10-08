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

  await page.waitForTimeout(120);
}

export async function sampleTextAabb(page: Page) {
  return await page.evaluate(() => {
    const w = window as any;
    const geo = w.__particleGeometry || w.__consciousnessGeometry || w.__geometry;

    if (!geo || !geo.attributes) {
      console.warn('sampleTextAabb: No geometry found', {
        hasParticleGeo: Boolean(w.__particleGeometry),
        hasConsciousnessGeo: Boolean(w.__consciousnessGeometry),
      });
      return null;
    }

    const textAttr = geo.getAttribute('text3DPosition')
      || geo.getAttribute('text3DPos')
      || geo.getAttribute('textPosition')
      || geo.getAttribute('position');

    if (!textAttr || !textAttr.array) {
      console.warn('sampleTextAabb: No text3D attribute', {
        availableAttrs: Object.keys(geo.attributes || {}),
      });
      return null;
    }

    const positions = textAttr.array as Float32Array;
    const viewportHint = w.__viewportHint;
    let viewport = null as null | { width: number; height: number };
    if (viewportHint && viewportHint.width && viewportHint.height) {
      viewport = { width: viewportHint.width, height: viewportHint.height };
    } else if (typeof w.innerWidth === 'number' && typeof w.innerHeight === 'number') {
      viewport = { width: w.innerWidth, height: w.innerHeight };
      console.warn('sampleTextAabb: using window dimensions as fallback viewport');
    } else {
      console.warn('sampleTextAabb: No viewport hint available');
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    let ratioX: number | null = null;
    let ratioY: number | null = null;
    let ratioZ: number | null = null;

    const camera = w.__camera;
    if (camera && typeof camera.fov === 'number') {
      const aspect = Number(camera.aspect) > 0
        ? Number(camera.aspect)
        : (viewport ? viewport.width / viewport.height : 16 / 9);
      const distance = Math.abs(Number(camera.position?.z ?? 1));
      const fov = Number(camera.fov);
      const halfHeight = Math.tan((fov * Math.PI) / 360) * distance;
      const halfWidth = halfHeight * aspect;
      if (halfWidth > 0) ratioX = width / (halfWidth * 2);
      if (halfHeight > 0) ratioY = height / (halfHeight * 2);
      if (halfWidth > 0) ratioZ = depth / (halfWidth * 2);
    }

    if ((ratioX === null || ratioY === null || ratioZ === null) && viewport) {
      const minDim = Math.min(viewport.width, viewport.height);
      if (minDim > 0) {
        if (ratioX === null) ratioX = width / minDim;
        if (ratioY === null) ratioY = height / minDim;
        if (ratioZ === null) ratioZ = depth / minDim;
      }
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      width,
      height,
      depth,
      ratioX,
      ratioY,
      ratioZ,
      attribute: typeof textAttr.name === 'string' ? textAttr.name : null,
      viewport,
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
