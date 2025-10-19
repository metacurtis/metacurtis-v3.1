import { spawnSync } from 'node:child_process';

export default async function checkSST() {
  const validate = spawnSync('npm', ['run', '--silent', 'validate-sst'], { encoding: 'utf8' });
  const drift = spawnSync('npm', ['run', '--silent', 'detect-drift'], { encoding: 'utf8' });
  const ok = validate.status === 0 && drift.status === 0;
  return {
    name: 'SST & Drift',
    ok,
    detail: ok ? 'schema+drift OK' : 'schema or drift failed',
    advice: ok
      ? []
      : [
          'Run npm run validate-sst and fix schema errors.',
          'Run npm run detect-drift and replace hardcoded values with SST reads.',
        ],
  };
}
