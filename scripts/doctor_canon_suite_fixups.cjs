#!/usr/bin/env node
/**
 * Canon Suite fix-ups (L1/L2 finish) — v1.1
 * - Fix console shadowing in src/canon/init.js
 * - Add optional console proxy (localStorage.canonConsoleProxy='1')
 * - Wrap BeatBus.emit for preflight + canonicalization + logging
 * - Ensure BeatBus.getDebugInfo() and window.busTap()
 * - De-dupe "@/*" alias in jsconfig.json (optional)
 * Idempotent; .bak on first touch.
 */
const fs = require('fs'); const path = require('path');
const ROOT = process.cwd();
const P = (...s) => path.join(ROOT, ...s);
const ex = f => fs.existsSync(P(f));
const rd = f => fs.readFileSync(P(f),'utf8');
const wr = (f,s) => { fs.mkdirSync(path.dirname(P(f)),{recursive:true}); fs.writeFileSync(P(f), s, 'utf8'); };
const backupOnce = f => { const b=f+'.bak'; if (!ex(b) && ex(f)) fs.copyFileSync(P(f), P(b)); };

let touched = 0;

function patchCanonInit(){
  const F='src/canon/init.js'; if(!ex(F)) return;
  let s = rd(F), o = s;
  // 1) rename local "console" variable -> canonConsole
  s = s.replace(/\bconst\s+console\s*=\s*new\s+CanonConsoleL2\s*\(\s*\)\s*;/, 'const canonConsole = new CanonConsoleL2();');

  // 2) add console proxy (optional flag)
  if (!/__attachCanonConsoleProxy/.test(s)) {
    s = s.replace(/export function initCanon\(\)\s*\{/, match => `${match}
  // Optional: console proxy (enable with localStorage.canonConsoleProxy='1')
  function __attachCanonConsoleProxy(){
    try{
      if (!canonConsole) return;
      const orig = { log:console.log.bind(console), warn:console.warn.bind(console), error:console.error.bind(console), info:console.info.bind(console) };
      ['log','warn','error','info'].forEach(level=>{
        console[level] = (...args)=>{
          try{
            const showLevel = (canonConsole.shouldShow?.(level, args) ?? true);
            const showCtx   = (canonConsole.shouldShowContextual?.(args?.[0]??'') ?? true);
            canonConsole.detectPattern?.(args?.[0]??'');
            if (showLevel && showCtx) orig[level](...args);
          }catch{ orig[level](...args); }
        };
      });
      console.info('🎮 Canon Console proxy attached');
      return ()=>{ console.log=orig.log; console.warn=orig.warn; console.error=orig.error; console.info=orig.info; };
    }catch(e){ try{console.warn('Canon console proxy failed:', e);}catch{} }
  }`);
  }

  // 3) BeatBus preflight wrapper
  if (!/__canonWrapEmit/.test(s)) {
    s = s.replace(/if\s*\(\s*BeatBus\s*\)\s*\{/, match => `${match}
    // Preflight + canonicalize payloads
    (function __canonWrapEmit(){
      try{
        if (!BeatBus.emit || BeatBus.__canonWrapped) return;
        const origEmit = BeatBus.emit.bind(BeatBus);
        const state = { stage: 'genesis', quality: 'HIGH' };

        function canonize(evt, data){
          const p = data || {};
          if (evt === 'STAGE_CHANGE'){
            // accept {stage} or {to}; derive from if missing
            const to = p.to ?? p.stage;
            const from = p.from ?? state.stage ?? 'genesis';
            if (to) { p.to = to; delete p.stage; }
            if (!p.from) p.from = from;
            state.stage = p.to || state.stage;
          }
          if (evt === 'QUALITY_CHANGE'){
            // accept {tier} or {quality}
            const tier = p.tier ?? p.quality;
            if (tier) p.tier = tier;
            delete p.quality;
            state.quality = p.tier || state.quality;
          }
          return p;
        }

        BeatBus.emit = function(evt, data){
          const payload = canonize(evt, data);
          try { typeof guard!=='undefined' && guard.validate?.(evt, payload); } catch {}
          try {
            // best-effort event log
            if (typeof BeatBus.logEvent === 'function') BeatBus.logEvent(evt, payload);
          } catch {}
          return origEmit(evt, payload);
        };
        BeatBus.__canonWrapped = true;

        // Ensure getDebugInfo + busTap
        if (typeof BeatBus.getDebugInfo !== 'function'){
          BeatBus.getDebugInfo = function(){
            const info={ registeredEvents:[], listenerCounts:{}, recentEvents: (this.eventLog||[]).slice(-10) };
            try{
              info.registeredEvents = Array.from(this.listeners?.keys?.() || []);
              this.listeners?.forEach?.((set,evt)=>info.listenerCounts[evt]=set.size);
            }catch{}
            return info;
          };
        }
        if (typeof window!=='undefined'){
          if (!window.BeatBus) window.BeatBus = BeatBus;
          if (!window.busTap)  window.busTap  = (e,f)=>BeatBus.on?.(e,f);
        }
      }catch(e){ try{console.warn('Canon BeatBus preflight failed:', e);}catch{} }
    })();

    // Attach console proxy only when opted in
    try { if (globalThis?.localStorage?.canonConsoleProxy === '1') __attachCanonConsoleProxy(); } catch {}
`);
  }

  if (s!==o){ backupOnce(F); wr(F,s); touched++; console.log('· patch', F); }
}

function hardenBeatBus(){
  const F='src/src/modules/orchestration/core/BeatBus.js'; if(!ex(F)) return;
  let s = rd(F), o = s;

  // Ensure logEvent exists and emit calls it
  if (!/logEvent\s*\(/.test(s)) {
    s = s.replace(/class\s+BeatBus\s*\{/, m => m + `
  logEvent(eventName, data){
    try{
      this.eventLog = this.eventLog || [];
      this.eventLog.push({ eventName, data, timestamp: Date.now() });
      if (this.eventLog.length > (this.maxLogSize||100)) this.eventLog.shift();
    }catch{}
  }
`);
  }
  if (!/this\.logEvent\(/.test(s) && /emit\s*\(/.test(s)) {
    s = s.replace(/emit\s*\(\s*([^)]+)\)\s*\{/, m => m + `\n    try{ this.logEvent(arguments[0], arguments[1]); }catch{}`);
  }

  // Ensure dev globals (BeatBus, busTap)
  if (!/window\.BeatBus/.test(s) || !/window\.busTap/.test(s)){
    s += `\nif (typeof window!=='undefined'){ try{ if(!window.BeatBus) window.BeatBus = beatBus; if(!window.busTap) window.busTap=(e,f)=>beatBus.on(e,f);}catch{} }\n`;
  }

  if (s!==o){ backupOnce(F); wr(F,s); touched++; console.log('· patch', F); }
}

function fixAliases(){
  const F='jsconfig.json'; if(!ex(F)) return;
  let json; try{ json = JSON.parse(rd(F)); }catch{ return; }
  const co = json.compilerOptions = json.compilerOptions || {};
  const paths = co.paths = co.paths || {};
  // Normalize
  paths['@/*'] = ['src/*'];
  paths['@/modules/*'] = paths['@/modules/*'] || ['src/modules/*'];
  backupOnce(F); wr(F, JSON.stringify(json,null,2)+'\n'); touched++; console.log('· patch', F);
}

/* run */
patchCanonInit();
hardenBeatBus();
fixAliases();

console.log(touched ? '✓ fix-ups applied' : '· no-op (already correct)');
