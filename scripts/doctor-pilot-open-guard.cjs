#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path'), cp=require('child_process');
const R=process.cwd(), P=(...x)=>path.join(R,...x);
const read=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const ensure=d=>{ if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); };
const backup=p=>{ if(fs.existsSync(p) && !fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak'); };
const write=(p,s)=>{ ensure(path.dirname(p)); const cur=read(p); if(cur===s) return 'ok'; backup(p); fs.writeFileSync(p,s,'utf8'); return 'wrote'; };
const ok=(w,msg)=>console.log((w==='wrote'?'✍️ ':'✓ ')+msg);

// 1) OpeningDoneFlag: flips __OPENING_DONE__ once; also dedup PARTICLES_EMERGED fan-out in DEV
const openingFlagPath = P('src/theater/OpeningDoneFlag.js');
const openingFlagCode = `// OpeningDoneFlag: mark opening complete once, then silence duplicate EMERGED in DEV
import BeatBus from '@/modules/orchestration/core/BeatBusAdapter.js';
import { EVENTS as E } from '@/theater/events.js';

if (!globalThis.__OPENING_FLAG_V3__) {
  globalThis.__OPENING_FLAG_V3__ = true;
  globalThis.__OPENING_DONE__ = !!globalThis.__OPENING_DONE__;
  let emittedOnce = false;

  const mark = (via) => {
    if (!globalThis.__OPENING_DONE__) {
      globalThis.__OPENING_DONE__ = true;
      console.log('🏁 Opening complete (', via, ')');
    }
  };

  // First EMERGED wins; swallow later ones in DEV (no-op but still let original emit flow)
  const off1 = BeatBus.on(E.PARTICLES_EMERGED, (payload={}) => {
    if (!emittedOnce) {
      emittedOnce = true;
      mark(payload.via || 'emerged');
    } else {
      if (import.meta.env?.DEV) console.log('🔇 (DEV) duplicate PARTICLES_EMERGED ignored');
    }
  });

  // Backup tripwires
  const off2 = BeatBus.on(E.ENABLE_SCROLL, () => mark('enable_scroll'));
  const off3 = BeatBus.on(E.START_NARRATIVE, () => mark('start_narrative'));

  // Optional: expose a reset in DEV
  if (import.meta.env?.DEV) {
    globalThis.__resetOpeningForTest = () => { emittedOnce=false; globalThis.__OPENING_DONE__=false; console.log('🔄 Opening flags reset'); };
  }

  console.log('✅ OpeningDoneFlag armed');
}
`;

const pilotGuardPath = P('canon-console/runtime/pilot-open-guard.js');
const pilotGuardCode = `// Pilot Open Guard (DEV): hold Pilot Auto OFF until __OPENING_DONE__, then restore
(function(){
  if (import.meta.env?.PROD) return;
  if (globalThis.__PILOT_OPEN_GUARD__) return;
  globalThis.__PILOT_OPEN_GUARD__ = true;

  let savedAuto = null;
  function forceOff() {
    try {
      const s = globalThis.CANON_PILOT?.getStatus?.();
      if (savedAuto === null && s && typeof s.auto === 'boolean') savedAuto = s.auto;
      globalThis.CANON_PILOT?.setAuto?.(false);
      // noisy only first few times
    } catch {}
  }
  function restore() {
    try {
      const target = (savedAuto === null) ? true : !!savedAuto;
      globalThis.CANON_PILOT?.setAuto?.(target);
      console.log('✅ Pilot Auto restored after opening:', target);
    } catch {}
  }

  // Enforce OFF until opening completes, check frequently to beat loader races
  const iv = setInterval(() => {
    if (!globalThis.__OPENING_DONE__) {
      forceOff();
    } else {
      clearInterval(iv);
      restore();
    }
  }, 200);

  // Also apply immediately and once after load
  setTimeout(forceOff, 0);
  window.addEventListener('load', forceOff, { once:true });

  console.log('⏹ Pilot Auto hold engaged (until opening complete)');
})();`;

// 2) Wire into injector (DEV) and main.jsx as fallback
const injectPath = P('canon-console/browser/inject.js');
let inject = read(injectPath);
if (!inject) { console.error('✖ Missing canon-console/browser/inject.js'); process.exit(1); }

function addDevImport(src, rel) {
  const line = `await import(${JSON.stringify(rel)})`;
  if (src.includes(rel)) return src; // already wired
  const m = src.match(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{/);
  if (m) return src.replace(m[0], m[0] + `\n  try { ${line}; } catch(e) { console.warn('dev import failed', ${JSON.stringify(rel)}, e); }`);
  // append a dev block
  return src + `\n\nif (import.meta.env.DEV) {\n  try { ${line}; } catch(e) { console.warn('dev import failed', ${JSON.stringify(rel)}, e); }\n}\n`;
}
inject = addDevImport(inject, '../runtime/pilot-open-guard.js');
inject = addDevImport(inject, '@/theater/OpeningDoneFlag.js');

const mainPath = P('src/main.jsx');
let main = read(mainPath);
if (main) {
  function addLazy(src, abs) {
    if (src.includes(abs)) return src;
    if (/if\s*\(\s*import\.meta\.env\.DEV/.test(src)) {
      return src.replace(/if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{\s*/m,
        m => `${m}  import(${JSON.stringify(abs)}).catch(()=>{});\n`);
    }
    return src + `\nif (import.meta.env.DEV) {\n  import(${JSON.stringify(abs)}).catch(()=>{});\n}\n`;
  }
  main = addLazy(main, '/src/theater/OpeningDoneFlag.js');
  main = addLazy(main, '/canon-console/runtime/pilot-open-guard.js');
}

// 3) Write files
ok(write(openingFlagPath, openingFlagCode), 'src/theater/OpeningDoneFlag.js');
ok(write(pilotGuardPath,   pilotGuardCode),  'canon-console/runtime/pilot-open-guard.js');
ok(write(injectPath,       inject),          'canon-console/browser/inject.js');
if (main) ok(write(mainPath, main),          'src/main.jsx');

// 4) Optional commit/tag
if (process.argv.includes('--commit')) {
  try {
    require('child_process').execSync('git add -A', { stdio:'inherit' });
    require('child_process').execSync('git commit -m "fix(dev): gate Pilot until opening completes; add OpeningDoneFlag" --no-verify', { stdio:'inherit' });
    const tag='doctor_pilot_open_guard_' + new Date().toISOString().replace(/[:.]/g,'-');
    require('child_process').execSync(`git tag ${tag}`, { stdio:'inherit' });
    console.log('✅ committed & tagged:', tag);
  } catch(e) {
    console.log('⚠ commit/tag skipped:', e.message);
  }
}

console.log('\nNext:\n  • Restart dev server\n  • In DevTools: CANON_PILOT?.getStatus?.() (auto should be false) → run CANON_SEQ.probe(); CANON_SEQ.dump();\n  • After EMERGED, auto restores.\n');
