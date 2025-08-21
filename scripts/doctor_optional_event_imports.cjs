#!/usr/bin/env node
/**
 * doctor_optional_event_imports.cjs
 * - Convert EventValidator / EventDebugger dynamic imports to optional, Vite-ignored, relative imports.
 * - Dedupe @ aliases in jsconfig.json.
 * - Ensure main.jsx imports "@/modules/state/index.js" once.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);
const ts = () => new Date().toISOString().replace(/[:.]/g, '-');

function ensureDir(fp){ fs.mkdirSync(path.dirname(fp), { recursive: true }); }
function snap(fp){
  const rel = path.relative(ROOT, fp).replace(/[\\/]/g,'__');
  const dir = P('snapshots', `doctor_optional_event_imports_${ts()}`);
  ensureDir(dir);
  const out = P(dir, rel);
  ensureDir(out);
  fs.copyFileSync(fp, out);
  return out;
}

function read(fp){ return fs.existsSync(fp) ? fs.readFileSync(fp,'utf8') : null; }
function write(fp, s){ ensureDir(fp); fs.writeFileSync(fp, s, 'utf8'); }

let changed = 0;
function replaceOnce(s, re, rep){
  const before = s;
  s = s.replace(re, rep);
  if (s !== before) changed++;
  return s;
}

function patchStateIndex() {
  const fp = P('src/modules/state/index.js');
  let src = read(fp);
  if (!src) {
    console.log('ℹ️  State index not found (src/modules/state/index.js); skipping.');
    return;
  }
  snap(fp);

  // 1) Inject optionalImport helper (only once)
  if (!/function\s+optionalImport\s*\(/.test(src)) {
    const helper = `
/** Canon: optional dynamic import (Vite-safe, optional) */
async function optionalImport(rel) {
  try {
    const url = new URL(rel, import.meta.url).href;
    const mod = await import(/* @vite-ignore */ url);
    return mod;
  } catch (e) {
    console.warn('ℹ️ Optional module not present:', rel, '-', e?.message || e);
    return null;
  }
}
`;
    // Insert after the last import line
    const lastImportIdx = [...src.matchAll(/^import .*;$/gm)].pop()?.index;
    if (lastImportIdx != null) {
      const endOfLine = src.indexOf('\n', lastImportIdx);
      src = src.slice(0, endOfLine+1) + helper + src.slice(endOfLine+1);
      changed++;
    } else {
      src = helper + src;
      changed++;
    }
  }

  // 2) Replace EventValidator block with guarded optional import
  const evBlock = /if\s*\(\s*enableEventValidation\s*\)\s*\{[\s\S]*?\}/m;
  if (evBlock.test(src)) {
    src = src.replace(evBlock, `if (enableEventValidation) {
  const validatorModule = await optionalImport('../orchestration/core/EventValidator.js');
  if (validatorModule) {
    EventValidator = validatorModule.default || validatorModule;
    EventValidator.initialize({ enabled: true, strict: false, validateUnknown: true });
  } else {
    console.log('ℹ️ EventValidator not present — continuing without it.');
  }
}`);
    changed++;
  } else {
    // Fallback: only swap the import line if that’s all we see
    src = replaceOnce(
      src,
      /await\s+import\((['"]).*?orchestration\/core\/EventValidator.*?\1\)/,
      `optionalImport('../orchestration/core/EventValidator.js')`
    );
  }

  // 3) Replace EventDebugger block with guarded optional import
  const edBlock = /if\s*\(\s*enableEventDebugger[^)]*\)\s*\{[\s\S]*?\}/m;
  if (edBlock.test(src)) {
    src = src.replace(edBlock, `if (enableEventDebugger && import.meta.env.DEV) {
  const debuggerModule = await optionalImport('../orchestration/core/EventDebugger.js');
  if (debuggerModule) {
    const EventDebugger = debuggerModule.default || debuggerModule;
    EventDebugger.initialize({ autoShow: false, position: 'bottom-right' });
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        (window.eventDebugger || EventDebugger).toggle?.();
      }
    });
    console.log('  - EventDebugger: Ready (Ctrl+Shift+E to toggle)');
  } else {
    console.log('ℹ️ EventDebugger not present — continuing without it.');
  }
}`);
    changed++;
  } else {
    src = replaceOnce(
      src,
      /await\s+import\((['"]).*?orchestration\/core\/EventDebugger.*?\1\)/,
      `optionalImport('../orchestration/core/EventDebugger.js')`
    );
  }

  write(fp, src);
  console.log(`✅ Patched ${fp}`);
}

function patchJsconfig() {
  const fp = P('jsconfig.json');
  const s = read(fp);
  if (!s) return;
  snap(fp);
  let obj;
  try { obj = JSON.parse(s); } catch(e) {
    console.warn('⚠️ jsconfig.json not valid JSON, skipping alias fix.'); return;
  }
  obj.compilerOptions = obj.compilerOptions || {};
  obj.compilerOptions.baseUrl = obj.compilerOptions.baseUrl || '.';
  const paths = obj.compilerOptions.paths || {};
  paths['@/*'] = ['src/*'];
  paths['@/modules/*'] = ['src/modules/*'];
  // Remove duplicates by reassigning
  obj.compilerOptions.paths = paths;
  write(fp, JSON.stringify(obj, null, 2));
  console.log('✅ jsconfig.json aliases normalized (@/*, @/modules/*)');
}

function ensureMainImportsState() {
  const fp = P('src/main.jsx');
  let s = read(fp);
  if (!s) return;
  if (s.includes("@/modules/state/index.js") || s.includes('./modules/state/index.js')) {
    return;
  }
  snap(fp);
  // Insert right after CSS / canon init imports
  const insertLine = `import "@/modules/state/index.js";\n`;
  // Put it after the first two import lines if possible
  const lines = s.split('\n');
  let insertAt = 0;
  for (let i=0;i<lines.length;i++){
    if (/^import\s+/.test(lines[i])) insertAt = i+1; else break;
  }
  lines.splice(insertAt, 0, insertLine.trimEnd());
  s = lines.join('\n');
  write(fp, s);
  console.log('✅ main.jsx now imports "@/modules/state/index.js"');
}

(function run(){
  patchStateIndex();
  patchJsconfig();
  ensureMainImportsState();

  if (changed === 0) {
    console.log('ℹ️ Nothing to change. You are already patched.');
  } else {
    console.log(`✨ Done. Updated sections: ${changed}`);
  }
})();
