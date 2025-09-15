#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const injPath = path.join(ROOT, 'canon-console/browser/inject.js');
if (!fs.existsSync(injPath)) {
  console.error('Injector not found at', injPath);
  process.exit(1);
}
const src = fs.readFileSync(injPath, 'utf8');
const startMarker = '// >>> Canon Dev-OS v3 Idempotency Guard <<<';
const hasMarker = src.includes(startMarker);

// Replace the previously injected block (if present) with a syntax-safe marker.
// We avoid any `export` statements in conditionals and don’t attempt to “bail”—
// injector code should be idempotent by design.
let out = src;
if (hasMarker) {
  const rx = new RegExp(
    String.raw`\/\/ >>> Canon Dev-OS v3 Idempotency Guard <<<[\s\S]*?(?=\n\/\*|\n\/\/|$)`,
    'm'
  );
  out = out.replace(rx, `/* >>> Canon Dev-OS v3 Idempotency Marker (safe) <<< */
if (typeof window !== 'undefined') {
  window.__canonInjectorV3__ = window.__canonInjectorV3__ || { ts: Date.now(), loaded: {} };
}
// Dev-OS is intended for DEV builds; bundlers may tree-shake this in prod.
`);
  fs.writeFileSync(injPath, out, 'utf8');
  console.log('✔ Replaced guard block with syntax-safe marker in', injPath);
} else {
  console.log('No previous guard marker found. Nothing to change.');
}
