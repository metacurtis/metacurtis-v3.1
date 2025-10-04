const ENABLE_LEGACY_OPENING_SPEC = process.env.METACURTIS_ENABLE_LEGACY_OPENING === '1';

if (ENABLE_LEGACY_OPENING_SPEC) {
  await (async () => {
    const { test, expect } = await import('@playwright/test');

    const waitForParticles = async (page) => {
      await page.waitForFunction(() => {
        const geometryReady = !!window.__particleGeometry;
        const materialReady = !!window.__particleMaterial && !!window.__particleMaterial.uniforms?.uBandHeight;
        const probesReady = typeof window.probe === 'object';
        return geometryReady && materialReady && probesReady;
      });
    };

    test.describe('Milky Way Opening Sequence (legacy)', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForParticles(page);
      });

      test('should display wide band formation from frame 1', async ({ page }) => {
        const bandMetrics = await page.evaluate(() => {
          return window.probe?.band?.({
            source: 'atmosphericPositions',
            tierRange: [0, 3],
            minAspect: 2.5,
          }) ?? null;
        });

        expect(bandMetrics).toBeTruthy();
        expect(bandMetrics.pass).toBe(true);
        expect(Number(bandMetrics.aspect)).toBeGreaterThan(2.5);
      });

      test('should fit constellation within viewport bounds', async ({ page }) => {
        const coverage = await page.evaluate(() => {
          const result = window.probe?.aabb?.({
            source: 'atmosphericPositions',
            fitFrac: 0.86,
          });
          if (!result || !result.minView) return null;
          const coverageX = result.width / result.minView;
          const coverageY = result.height / result.minView;
          return {
            pass: result.pass,
            coverageX,
            coverageY,
            ratioX: result.ratioX,
            ratioY: result.ratioY,
          };
        });

        expect(coverage).toBeTruthy();
        expect(coverage.pass).toBe(true);
        expect(coverage.coverageX).toBeGreaterThan(0.8);
        expect(coverage.coverageY).toBeGreaterThan(0.2);
        expect(coverage.ratioX).toBeLessThanOrEqual(0.86);
        expect(coverage.ratioY).toBeLessThanOrEqual(0.86);
      });

      test('should maintain Tier-0 distribution at 30/70 band split', async ({ page }) => {
        const distribution = await page.evaluate(() => {
          const geo = window.__particleGeometry;
          const mat = window.__particleMaterial;
          if (!geo || !mat?.uniforms?.uBandHeight) return null;

          const tiers = geo.getAttribute('tierData')?.array;
          const positions = geo.getAttribute('atmosphericPosition')?.array;
          if (!tiers || !positions) return null;

          const bandHalfHeight = Math.max(0.25, mat.uniforms.uBandHeight.value * 0.5);
          let bandCount = 0;
          let scatterCount = 0;

          for (let i = 0; i < positions.length; i += 3) {
            const tier = tiers[i / 3];
            if (tier !== 0) continue;
            const y = positions[i + 1];
            if (Math.abs(y) <= bandHalfHeight) bandCount++;
            else scatterCount++;
          }

          const total = bandCount + scatterCount;
          if (total === 0) return null;

          return {
            bandPercent: bandCount / total,
            scatterPercent: scatterCount / total,
          };
        });

        expect(distribution).toBeTruthy();
        expect(distribution.bandPercent).toBeCloseTo(0.3, 1);
        expect(distribution.scatterPercent).toBeCloseTo(0.7, 1);
      });

      test('should set band height uniform to 35% of viewport', async ({ page }) => {
        const stats = await page.evaluate(() => {
          const uniform = window.__particleMaterial?.uniforms?.uBandHeight?.value ?? null;
          const viewportHeight = window.__viewportHint?.height ?? null;
          const ratio = uniform && viewportHeight ? uniform / viewportHeight : null;
          return { uniform, viewportHeight, ratio };
        });

        expect(stats.uniform).toBeGreaterThan(0);
        expect(stats.viewportHeight).toBeGreaterThan(0);
        expect(stats.ratio).toBeCloseTo(0.35, 2);
      });

      test('should clamp device pixel ratio for sprites', async ({ page }) => {
        const dpiMetrics = await page.evaluate(() => window.probe?.dpi?.() ?? null);
        expect(dpiMetrics).toBeTruthy();
        expect(dpiMetrics.uDevicePixelRatio).toBeLessThanOrEqual(1.5);
      });

      test('should expose band height shader uniform', async ({ page }) => {
        const hasUniform = await page.evaluate(() => {
          return !!window.__particleMaterial?.uniforms?.uBandHeight;
        });

        expect(hasUniform).toBe(true);
      });
    });
  })();
} else {
  if (!process.env.METACURTIS_SILENCE_LEGACY_LOGS) {
    console.warn(
      'Skipping legacy Playwright spec tests/visual/milky-way-opening.spec.js. Set METACURTIS_ENABLE_LEGACY_OPENING=1 to re-enable.'
    );
  }
}
