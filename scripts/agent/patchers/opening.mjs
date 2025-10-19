/* eslint-env node */
import fs from 'node:fs/promises'; import path from 'node:path';
const R = (root,p)=>path.join(root,p);
async function read(p){ return fs.readFile(p,'utf8'); }
async function write(p,s){ return fs.writeFile(p,s,'utf8'); }
export async function applyPatches({ issues, cwd }){
  const enginePath = R(cwd,'src/engine/ConsciousnessEngine.js');
  let s = await read(enginePath); let changed = [];

  // mode:'emergence'
  if (/BLUEPRINT_READY[^]*mode\s*:/.test(s) === false){
    s = s.replace(/(BeatBus\.emit\(\s*EVENTS\.BLUEPRINT_READY\s*,\s*\{[^\}]*)(\}\s*\)\s*\);)/m, (m,a,b)=> a.replace(/\}\s*$/, ", mode: 'emergence' }") + b);
    changed.push('ENGINE_MODE');
  }

  // opening gate
  if (/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(s) === false){
    s = s.replace(/(buildAndEmitBlueprint\s*\(\s*stage\s*,\s*quality\s*\)\s*\{)/, '$1\n    if (this._openingPhase && stage !== "genesis") { console.warn("🧠 Engine: blocked non-genesis during opening:", stage); return; }');
    changed.push('ENGINE_GATE');
  }

  // spiral -> random cloud (very conservative: add pickDisc + rewrite inner body)
  const hasSpiral = /(swirl|spiral)/.test(s) || (/ang\s*=\s*(?:i|t)[^;]*\*/.test(s) && /\br\s*=\s*(?:i|t)\s*\*/.test(s));
  if (hasSpiral){
    if (/function\s+pickDisc\s*\(/.test(s) === false){
      s = s.replace(/(buildEmergenceBlueprint\s*\([^\)]*\)\s*\{)/, '$1\n    function pickDisc(R){ const u=Math.random(); const r=R*Math.sqrt(u); const t=Math.random()*Math.PI*2; return [r*Math.cos(t), r*Math.sin(t)]; }');
    }
    s = s.replace(/for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*count;\s*i\+\+\s*\)\s*\{[\s\S]*?\}/, (m)=>{
      const head = m.match(/for\s*\(\s*let\s+i\s*=\s*0;\s*i\s*<\s*count;\s*i\+\+\s*\)\s*\{/)[0];
      return head + '\n      const j = i*3;\n      const [ax,ay] = pickDisc(gasRadius || Math.min(vw,vh)*0.38);\n      atmosphericPositions[j+0]=ax; atmosphericPositions[j+1]=ay; atmosphericPositions[j+2]=(Math.random()-0.5)*30;\n      const [tx,ty] = pickDisc(expandedRadius || Math.min(vw,vh)*0.52);\n      text3DPositions[j+0]=tx; text3DPositions[j+1]=ty; text3DPositions[j+2]=(Math.random()-0.5)*30;\n    }';
    });
    changed.push('ENGINE_SPIRAL->RANDOM');
  }

  if (changed.length) await write(enginePath, s);
  return { summary: changed.length ? ('patched ' + changed.join(', ')) : 'no changes applied' };
}
