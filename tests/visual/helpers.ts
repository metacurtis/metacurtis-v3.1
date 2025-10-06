import type { Page } from '@playwright/test';

export async function waitForFencepostAndStage(page: Page, timeout = 30_000) {
  await page.waitForFunction(() => {
    const dump = (window as any).dumpTrace;
    const trace = typeof dump === 'function' ? dump() : (window as any).__trace;
    if (!Array.isArray(trace)) return false;
    const readyIndex = trace.findIndex((entry: any) => entry?.ev === 'FENCEPOST_LISTENERS_READY');
    const fenceIndex = trace.findIndex((entry: any) => entry?.ev === 'WBG:FENCEPOST');
    const stageIndex = trace.findIndex((entry: any) => entry?.ev === 'WBG:BIND' && entry?.kind === 'stage');
    if (readyIndex < 0 || fenceIndex <= readyIndex || stageIndex <= fenceIndex) return false;

    const material = (window as any).__consciousnessMaterial;
    const geometry = (window as any).__particleGeometry;
    return Boolean(material?.uniforms?.uMorphProgress && geometry?.attributes?.position?.array);
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
