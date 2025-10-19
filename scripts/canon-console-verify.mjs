#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
const ROOT=process.cwd(), rel=p=>path.relative(ROOT,p), read=p=>fs.readFileSync(p,'utf8'), ex=p=>fs.existsSync(p);
const fails=[], warns=[];
const app=path.join(ROOT,'src/App.jsx');
if(!ex(app)) fails.push('Missing src/App.jsx');
else{ const s=read(app);
  if(!/canon-console\/browser\/inject\.js/.test(s)) fails.push('App.jsx missing DEV import of canon-console/browser/inject.js');
  if(/console\/runtime\/inject\.js/.test(s)) fails.push('App.jsx references legacy console/runtime/inject.js');
}
const legacy=path.join(ROOT,'console/runtime/inject.js'); if(ex(legacy)) fails.push('Legacy injector still exists: console/runtime/inject.js');
const inj=path.join(ROOT,'canon-console/browser/inject.js');
if(!ex(inj)) fails.push('Missing modern injector: canon-console/browser/inject.js');
else{ const s=read(inj); if(!/__canonInjectorV3__/.test(s)) warns.push('Injector missing __canonInjectorV3__ marker'); if(!/busCounts/.test(s)||!/__canon_patched/.test(s)) warns.push('Injector may be missing BeatBus counters'); }
const hud=path.join(ROOT,'canon-console/runtime/hud.js'); if(!ex(hud)) fails.push('Missing HUD v2: canon-console/runtime/hud.js');
if(fails.length){ console.error('⛔ Canon Console Verify: FAIL'); for(const f of fails) console.error(' -', f); if(warns.length){console.error('\nWarnings:'); for(const w of warns) console.error(' -', w);} process.exit(1);}
console.log('✅ Canon Console Verify: PASS'); if(warns.length){ console.log('\nWarnings:'); for(const w of warns) console.log(' -', w); }