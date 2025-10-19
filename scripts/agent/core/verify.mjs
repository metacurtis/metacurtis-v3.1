/* eslint-env node */
import { execSync } from 'node:child_process';

export function runValidator() {
  try { execSync('node scripts/validate-sst.js', { stdio: 'inherit' }); return true; }
  catch { return false; }
}
export function runSentinel() {
  try { execSync('node tools/sst-guard.mjs', { stdio: 'inherit' }); return true; }
  catch { return false; }
}
export function verifyAll() {
  const v = runValidator();
  const s = runSentinel();
  return v && s;
}
