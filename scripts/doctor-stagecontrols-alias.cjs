#!/usr/bin/env node
'use strict';
const fs=require('fs'), path=require('path'); const root=process.cwd();
function w(p,s){fs.mkdirSync(path.dirname(p),{recursive:true});
  if(fs.existsSync(p)&&!fs.existsSync(p+'.bak')) fs.copyFileSync(p,p+'.bak');
  fs.writeFileSync(p,s,'utf8'); console.log('✍️', path.relative(root,p));}

const aliasFile = path.join(root,'src/dev/stageControlsAlias.js');
w(aliasFile, `// DEV alias: make stageControls.set(..) call stateControls.setStage(..)
(function(){
  if (!import.meta.env.DEV) return;
  const sc = globalThis.stateControls || globalThis.stageControls;
  if (!sc) { console.warn('stageControlsAlias: stateControls missing'); return; }
  const alias = {
    set: (name)=> sc.setStage?.(name) ?? (globalThis.CANON_BEATBUS?.emit?.('STAGE_CHANGE',{stage:name,source:'alias'}), name),
    setStage: (name)=> sc.setStage?.(name),
    get: ()=> sc.getStage?.(),
    getStage: ()=> sc.getStage?.(),
  };
  globalThis.stageControls = Object.assign({}, globalThis.stageControls || {}, sc || {}, alias);
  console.log('🔗 stageControls alias wired → stageControls.set(\"discipline\") is now valid');
})();`);

const hc = path.join(root,'src/dev/renderHealthcheck.js');
if (!fs.existsSync(hc)) { console.error('✖ src/dev/renderHealthcheck.js not found'); process.exit(2); }
let txt = fs.readFileSync(hc,'utf8');
if (!/stageControlsAlias\.js/.test(txt)) {
  txt += `

/* DEV: stageControls alias so set(...) works */
if (import.meta.env.DEV) {
  try { import('./stageControlsAlias.js'); } catch(e){ console.warn('stageControlsAlias inject failed', e); }
}
`;
  w(hc, txt);
} else {
  console.log('ℹ stageControlsAlias already wired');
}

if (process.argv.includes('--commit')) {
  require('child_process').execSync(
    'git add -A && git commit -m "chore(dev): add stageControls.set alias → stateControls.setStage" || true',
    {stdio:'inherit'}
  );
}
console.log('✅ Alias ready. Next: restart dev server, then run:');
console.log('   stageControls.set(\"discipline\");  // should trigger build + transition');
