#!/usr/bin/env node
/* eslint-env node */
const fs=require('fs'), p=require('path'), C=process.cwd();
const targets=[
  'src/canon/console/banner.js',
  'src/canon-guard/runtime/GuardRuntimeInject.js',
  'src/components/webgl/WebGLBackground.jsx', // warning-only, but harmless to fix
];
for(const rel of targets){
  const fp=p.join(C,rel); if(!fs.existsSync(fp)){ console.log('skip',rel); continue; }
  let s=fs.readFileSync(fp,'utf8'), o=s;
  // empty catch blocks -> add comment, and rename e -> _e
  s=s.replace(/catch\s*\(\s*e\s*\)\s*\{\s*\}/g,'catch (_e) { /* noop */ }');
  s=s.replace(/catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{\s*\}/g,'catch ($1) { /* noop */ }');
  // arrow handlers like "(e) => {}" -> "() => { /* noop */ }"
  s=s.replace(/\(\s*e\s*\)\s*=>\s*\{\s*\}/g,'() => { /* noop */ }');
  // generic empty blocks in if/for/while -> add noop (keeps semantics but passes lint)
  s=s.replace(/(\b(if|for|while)\s*\([^)]*\)\s*)\{\s*\}/g,'$1{ /* noop */ }');
  if(s!==o){ fs.writeFileSync(fp,s); console.log('fixed',rel); } else { console.log('nochange',rel); }
}
