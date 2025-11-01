import fs from 'fs';
const sst = fs.existsSync('reports/sst-extract.json') ? JSON.parse(fs.readFileSync('reports/sst-extract.json','utf8')) : null;
const traceBus = fs.existsSync('reports/trace-bus.json') ? JSON.parse(fs.readFileSync('reports/trace-bus.json','utf8')) : null;
console.log('=== MetaCurtis Onboarding (Pattern D) ===');
console.log('- Key commands: npm run build-evidence, npm run preflight, npm run onboard');
if (sst) {
  console.log('\n[Stages]', (sst.stages||[]).join(', '));
  console.log('[Opening.totalDurationMs]', sst.openingPhases?.totalDurationMs ?? 'n/a');
}
if (traceBus) {
  const eventEntries = Object.entries(traceBus.events || {});
  const sorted = eventEntries.sort((a, b) => (b[1]?.length || 0) - (a[1]?.length || 0));
  const names = sorted.map(([name]) => name);
  console.log('\n[Trace events]', names.slice(0, 20).join(', ') + (names.length > 20 ? ' …' : ''));
  console.log('[Trace summary]', JSON.stringify(traceBus.summary || {}, null, 2));
  if (traceBus.dynamicCalls?.length) {
    console.log('[Dynamic trace calls]', JSON.stringify(traceBus.dynamicCalls.slice(0, 5), null, 2) + (traceBus.dynamicCalls.length > 5 ? ' …' : ''));
  }
}
console.log('\n→ Paste evidence sections into Claude when starting a new session.');
