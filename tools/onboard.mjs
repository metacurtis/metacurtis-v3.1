import fs from 'fs';
const sst = fs.existsSync('reports/sst-extract.json') ? JSON.parse(fs.readFileSync('reports/sst-extract.json','utf8')) : null;
const bus = fs.existsSync('reports/beatbus-map.json') ? JSON.parse(fs.readFileSync('reports/beatbus-map.json','utf8')) : null;
console.log('=== MetaCurtis Onboarding (Pattern D) ===');
console.log('- Key commands: npm run build-evidence, npm run preflight, npm run onboard');
if (sst) {
  console.log('\n[Stages]', (sst.stages||[]).join(', '));
  console.log('[Opening.totalDurationMs]', sst.openingPhases?.totalDurationMs ?? 'n/a');
}
if (bus) {
  const events = Object.keys(bus.emitters||{}).sort();
  console.log('\n[Events]', events.slice(0,20).join(', ') + (events.length>20?' …':''));
  console.log('[START_NARRIATIVE emitters]', JSON.stringify(bus.emitters?.START_NARRIATIVE||[], null, 2));
  console.log('[START_NARRIATIVE listeners]', JSON.stringify(bus.listeners?.START_NARRIATIVE||[], null, 2));
}
console.log('\n→ Paste evidence sections into Claude when starting a new session.');
