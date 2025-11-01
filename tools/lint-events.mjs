import fs from 'fs';

const reportPath = 'reports/trace-bus.json';

if (!fs.existsSync(reportPath)) {
  console.error('[events:lint] Missing reports/trace-bus.json');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error('[events:lint] Failed to parse trace-bus.json:', err.message);
  process.exit(1);
}

const summary = report.summary || {};
const events = report.events || {};
const dynamicCalls = report.dynamicCalls || [];
const problems = [];

if (!Object.keys(events).length) {
  problems.push('No literal trace events detected');
}
if ((summary.parseFailures || 0) > 0) {
  problems.push(`Parser failures encountered: ${summary.parseFailures}`);
}

if (problems.length) {
  console.error('[events:lint] FAILED\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}

if (dynamicCalls.length) {
  const preview = dynamicCalls.slice(0, 5).map((d) => `${d.file}:${d.line ?? '?'} → ${d.expression}`).join('\n - ');
  console.warn('[events:lint] WARN dynamic trace calls detected:\n - ' + preview + (dynamicCalls.length > 5 ? '\n - …' : ''));
}

console.log('[events:lint] OK');
