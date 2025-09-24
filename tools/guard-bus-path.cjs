#!/usr/bin/env node
const cp = require('child_process');

try {
  const out = cp.execSync(
    `rg -n "from ['\\\"][^'\\\"]*BeatBus[^'\\\"]*['\\\"]|from ['\\\"][^'\\\"]*theater/bus[^'\\\"]*['\\\"]" src || true`,
    { stdio: ['ignore', 'pipe', 'pipe'] }
  ).toString();

  const lines = out.split('\n').filter(Boolean);
  const bad = lines.filter(line => !line.includes("from '@/theater/bus'"));

  if (bad.length) {
    console.error('Non-canonical BeatBus imports:\n' + bad.join('\n'));
    process.exit(2);
  }

  console.log('BeatBus imports OK');
} catch (error) {
  if (error.status != null) {
    process.exit(error.status);
  }
  console.error('guard-bus-path failed:', error.message || error);
  process.exit(2);
}
