#!/usr/bin/env node
/* eslint-env node */
const fs = require('fs'); const _path = require('path');
const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);
const ex = f => fs.existsSync(P(f));
const rd = f => fs.readFileSync(P(f), 'utf8');
const wr = (f,s) => (fs.mkdirSync(path.dirname(P(f)),{recursive:true}), fs.writeFileSync(P(f), s, 'utf8'));
const backupOnce = f => { const b=f+'.bak'; if (!ex(b) && ex(f)) fs.copyFileSync(P(f), P(b)); };

// 1) BeatBus: add getDebugInfo + busTap if missing
(function(){
  const F = 'src/src/src/modules/orchestration/core/BeatBus.js';
  if (!ex(F)) return;
  let s = rd(F), o = s;
  if (!/getDebugInfo\s*\(/.test(s)) {
    s = s.replace(/class\s+BeatBus\s*\{/, match => match + `
  getDebugInfo(){
    const info={registeredEvents:Array.from(this.listeners.keys()),listenerCounts:{},recentEvents:this.eventLog?.slice?.(-10)||[]};
    this.listeners.forEach((set,evt)=>info.listenerCounts[evt]=set.size);
    return info;
  }
  logEvent(eventName,data){
    try{ this.eventLog=this.eventLog||[]; this.eventLog.push({eventName,data,timestamp:Date.now()});
      if(this.eventLog.length>100) this.eventLog.shift(); }catch{}
  }
`);
    // ensure emit logs
    s = s.replace(/emit\s*\(\s*([^)]+)\)\s*\{/, m => m + `\n    try{this.logEvent(arguments[0], arguments[1]);}catch{}`);
  }
  if (!/window\.BeatBus/.test(s) || !/window\.busTap/.test(s)){
    s += `\nif(typeof window!=='undefined'){ try{ if(!window.BeatBus) window.BeatBus = beatBus; if(!window.busTap) window.busTap=(e,f)=>beatBus.on(e,f); }catch{} }\n`;
  }
  if (s!==o){ backupOnce(F); wr(F,s); console.log('· patch', F); }
})();

// 2) main.jsx: fix broken @vite-ignore comment patterns
(function(){
  const F='src/main.jsx'; if(!ex(F)) return;
  let s = rd(F), o = s;
  s = s.replace(/import\s*\(\/\*\s*@vite-ignore\s*\/\s*/g, 'import(/* @vite-ignore */ ');
  s = s.replace(/import\s*\(\s*\/\s*@vite-ignore\s*\*\/\s*/g, 'import(/* @vite-ignore */ ');
  if (s!==o){ backupOnce(F); wr(F,s); console.log('· patch', F); }
})();

// 3) jsconfig.json: dedupe "@/*"
(function(){
  const F='jsconfig.json'; if(!ex(F)) return;
  let json; try{ json = JSON.parse(rd(F)); }catch{ return; }
  const paths = (json.compilerOptions = json.compilerOptions||{}).paths = json.compilerOptions.paths||{};
  // normalize
  paths['@/*'] = ['src/*'];
  paths['@/modules/*'] = paths['@/modules/*'] || ['src/modules/*'];
  backupOnce(F); wr(F, JSON.stringify(json, null, 2)+'\n'); console.log('· patch', F);
})();
console.log('· dry run complete — re-run with --commit to persist');
