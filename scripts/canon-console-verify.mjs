#!/usr/bin/env node
/* canon-console-verify.mjs
 * Read-only verifier that checks invariants and prints a concise status.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const rel = p => path.relative(ROOT, p);
const read= p => fs.readFileSync(p,'utf8');
const exists = p => fs.existsSync(p);

const fails = [];

const app = path.join(ROOT,'src/App.jsx');
if (!exists(app) || !read(app).includes("canon-console/browser/inject.js")) {
  fails.push('App.jsx missing DEV import of canon-console/browser/inject.js');
}

const legacy = path.join(ROOT,'canon-console/browser/inject.js');
if (exists(legacy)) fails.push('Legacy injector file exists: canon-console/browser/inject.js');

const inj = path.join(ROOT,'canon-console/browser/inject.js');
if (!exists(inj)) fails.push('Missing injector: canon-console/browser/inject.js');
else if (!/__canonInjectorV3__/.test(read(inj))) fails.push('Injector missing idempotency guard (__canonInjectorV3__)');

const hud = path.join(ROOT,'canon-console/runtime/hud.js');
if (!exists(hud)) fails.push('Missing HUD v2: canon-console/runtime/hud.js');

if (fails.length) {
  console.error('⛔ Canon Console Verify: FAIL');
  for (const f of fails) console.error(' -', f);
  process.exit(1);
} else {
  console.log('✅ Canon Console Verify: PASS');
  console.log('DevTools smoke:\n  await window.CANON_INJECTOR?.ready?.();\n  window.CANON_INJECTOR?.loaded;\n  typeof window.__canonHudV2__;\n  document.getElementById("canon-hud-v2");');
}
