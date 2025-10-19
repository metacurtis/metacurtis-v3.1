import { test } from '@playwright/test';

test('diagnostic: dump actual trace tags', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(12000);

  const traceAnalysis = await page.evaluate(() => {
    const dump = (window as any).dumpTrace;
    const trace = typeof dump === 'function' ? dump() : (window as any).__trace;

    if (!Array.isArray(trace)) {
      return { error: 'Trace is not an array', type: typeof trace };
    }

    const tagSummary: Record<string, number> = {};
    const sampleEvents: any[] = [];

    trace.forEach((event: any) => {
      const tag = event.tag || event.type || event.ev || 'unknown';
      tagSummary[tag] = (tagSummary[tag] || 0) + 1;
      if (
        (typeof tag === 'string' && (
          tag.includes('FENCEPOST')
          || tag.includes('BIND')
          || tag.includes('EMERGED')
          || tag.includes('STAGE')
        ))
        || event.kind === 'stage'
        || event.mode === 'emergence'
        || event.ev === 'WBG:FENCEPOST'
      ) {
        sampleEvents.push({
          tag: event.tag,
          type: event.type,
          ev: event.ev,
          kind: event.kind,
          mode: event.mode,
          source: event.source,
          keys: Object.keys(event).slice(0, 10),
        });
      }
    });

    const containsPattern = (predicate: (event: any) => boolean) => trace.some(predicate);

    return {
      totalEvents: trace.length,
      uniqueTags: Object.keys(tagSummary).length,
      tagSummary,
      sampleEvents: sampleEvents.slice(0, 20),
      hasFencepost: containsPattern((event) => {
        const tag = event.tag || event.type || event.ev;
        return typeof tag === 'string' && tag.includes('FENCEPOST');
      }),
      hasEmergence: containsPattern((event) => {
        const tag = event.tag || event.type || event.ev;
        return (typeof tag === 'string' && tag.includes('EMERGED'))
          || event.mode === 'emergence';
      }),
      hasStageBind: containsPattern((event) => {
        const tag = event.tag || event.type || event.ev;
        return (typeof tag === 'string' && tag.includes('STAGE'))
          || event.kind === 'stage';
      }),
    };
  });

  console.log('\n📊 TRACE TAG ANALYSIS:');
  console.log('='.repeat(60));
  console.log(`Total Events: ${traceAnalysis.totalEvents}`);
  console.log(`Unique Tags: ${traceAnalysis.uniqueTags}`);
  console.log('\n🏷️  TAG SUMMARY:');
  console.log(JSON.stringify(traceAnalysis.tagSummary, null, 2));
  console.log('\n🔍 SAMPLE KEY EVENTS:');
  traceAnalysis.sampleEvents.forEach((event: any, index: number) => {
    console.log(`\n[${index}]`, JSON.stringify(event, null, 2));
  });
  console.log('\n✅ PATTERN MATCHES:');
  console.log(`  Has Fencepost: ${traceAnalysis.hasFencepost}`);
  console.log(`  Has Emergence: ${traceAnalysis.hasEmergence}`);
  console.log(`  Has Stage Bind: ${traceAnalysis.hasStageBind}`);
  console.log('='.repeat(60));
});
