import { test, expect } from '@playwright/test';
import { waitForDemoReady } from './helpers';

test.describe('demo_technologist fit', () => {
  test.setTimeout(45_000);

  test('TECHNOLOGIST fits within viewport bounds', async ({ page }) => {
    await page.route('**/*.mp3', (route) => route.fulfill({ status: 204, body: '' }));
    await page.goto('/?demo=demo_technologist&autoplay=1&delay=300', { waitUntil: 'networkidle' });

    await waitForDemoReady(page, { demoKey: 'demo_technologist', word: 'TECHNOLOGIST' });
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const diag = (window as any).__rendererDiagnostics;
      const positions = diag?.getAttributeArray?.('text3DPosition');
      if (!positions || positions.length < 3) return null;

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

      const viewport = (window as any).__viewportHint || {};
      const viewW = Number(viewport.width ?? viewport.cssWidth ?? 0);
      const viewH = Number(viewport.height ?? viewport.cssHeight ?? 0);

      return {
        width,
        height,
        depth,
        viewW,
        viewH,
        ratioX: viewW > 0 ? width / viewW : null,
        ratioY: viewH > 0 ? height / viewH : null,
      };
    });

    console.log('[TECHNOLOGIST] text3DPosition metrics', metrics);

    expect(metrics).toBeTruthy();
    expect(metrics!.ratioX).not.toBeNull();
    expect(metrics!.ratioY).not.toBeNull();
    expect.soft(metrics!.ratioX as number).toBeLessThan(0.95);
    expect.soft(metrics!.ratioY as number).toBeLessThan(0.75);
    expect.soft(metrics!.depth).toBeGreaterThan(0.5);
  });
});
