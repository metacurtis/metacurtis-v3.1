/**
 * Advanced Shader Audit (JS↔GLSL interface)
 * - Inventories uniforms/attributes in GLSL and JS set paths
 * - Finds ShaderMaterial/onBeforeCompile hooks, texture usage
 * - Reports mismatches and naming/unused warnings
 * Outputs: reports/shader-audit.{json,md}
 */
import fs from 'fs'; import path from 'path';
import { walk } from '../lib/walk.mjs';
const JS_UNIFORM_RE=/uniforms\s*:\s*{([\s\S]*?)}/g, JS_SET_UNIFORM_RE=/uniforms\.(\w+)\s*\.value\s*=/g;
const GLSL_UNIFORM_RE=/uniform\s+\w+\s+(\w+)\s*;/g, GLSL_ATTRIBUTE_RE=/attribute\s+\w+\s+(\w+)\s*;/g;
const GLSL_VARYING_RE=/varying\s+\w+\s+(\w+)\s*;/g, GLSL_CONST_RE=/const\s+\w+\s+(\w+)\s*=/g;
const JS_MATERIAL_RE=/new\s+THREE\.ShaderMaterial\s*\(/g, JS_ONBEFORE_RE=/onBeforeCompile\s*:\s*/g;
const JS_TEXTURE_RE=/(new\s+THREE\.(?:Texture|DataTexture|CubeTexture)|\.\s*load(?:Texture|CubeTexture)\s*\()/g;
const results={js:{uniformsBlocks:[],uniformSets:[],materials:[],onBeforeCompile:[],textures:[]},glsl:{uniforms:{},attributes:{},varyings:{},consts:{}},mismatches:{jsSetsMissingInGLSL:[],glslUniformNoJSSet:[]},perf:{updateFrequency:{}},warnings:[]};
const linesUntil=(t,i)=>t.slice(0,i).split('\n').length;
const ctx=(arr,i,span=2)=>{const s=Math.max(0,i-span),e=Math.min(arr.length,i+span+1);return arr.slice(s,e).map((l,k)=>`${s+k+1}: ${l}`).join('\n');};
// JS
for await(const file of walk('src')){
  const ext=path.extname(file).toLowerCase(); if(!['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(ext)) continue;
  const txt=await fs.promises.readFile(file,'utf8'), lines=txt.split('\n'); let m;
  while((m=JS_UNIFORM_RE.exec(txt))){ const line=linesUntil(txt,m.index);
    const names=Array.from(m[1].matchAll(/(\w+)\s*:\s*{?\s*value/g)).map(x=>x[1]);
    results.js.uniformsBlocks.push({file,line,names});
  }
  let s; while((s=JS_SET_UNIFORM_RE.exec(txt))){ const line=linesUntil(txt,s.index); const name=s[1];
    results.js.uniformSets.push({file,line,name}); results.perf.updateFrequency[name]=(results.perf.updateFrequency[name]||0)+1;
  }
  let a; while((a=JS_MATERIAL_RE.exec(txt))){ const line=linesUntil(txt,a.index); results.js.materials.push({file,line,context:ctx(lines,line-1)}); }
  let b; while((b=JS_ONBEFORE_RE.exec(txt))){ const line=linesUntil(txt,b.index); results.js.onBeforeCompile.push({file,line,context:ctx(lines,line-1)}); }
  let c; while((c=JS_TEXTURE_RE.exec(txt))){ const line=linesUntil(txt,c.index); results.js.textures.push({file,line,context:ctx(lines,line-1)}); }
}
// GLSL
for await(const file of walk('src', new Set(['.glsl','.vert','.frag','.fs','.vs','.shader']))){
  const txt=await fs.promises.readFile(file,'utf8'); let u,a,v,c;
  while((u=GLSL_UNIFORM_RE.exec(txt))){ (results.glsl.uniforms[u[1]] ||= []).push({file,line:linesUntil(txt,u.index)}); }
  while((a=GLSL_ATTRIBUTE_RE.exec(txt))){ (results.glsl.attributes[a[1]] ||= []).push({file,line:linesUntil(txt,a.index)}); }
  while((v=GLSL_VARYING_RE.exec(txt))){ (results.glsl.varyings[v[1]] ||= []).push({file,line:linesUntil(txt,v.index)}); }
  while((c=GLSL_CONST_RE.exec(txt))){ (results.glsl.consts[c[1]] ||= []).push({file,line:linesUntil(txt,c.index)}); }
}
// mismatches
const glslU=new Set(Object.keys(results.glsl.uniforms)), jsU=new Set(results.js.uniformSets.map(x=>x.name));
for(const s of results.js.uniformSets){ if(!glslU.has(s.name)) results.mismatches.jsSetsMissingInGLSL.push(s); }
for(const u of glslU){ if(!jsU.has(u)) results.mismatches.glslUniformNoJSSet.push({name:u,locations:results.glsl.uniforms[u]}); }
// warnings
for(const u of glslU){ if(!/^u[A-Z]/.test(u)) results.warnings.push(`Naming: GLSL uniform "${u}" not uCamelCase`); }
for(const s of results.js.uniformSets){ if(!/^u[A-Z]/.test(s.name)) results.warnings.push(`Naming: JS uniform set "${s.name}" not uCamelCase`); }
for(const u of glslU){ if(!jsU.has(u)) results.warnings.push(`Unused: GLSL uniform "${u}" not set in JS`); }
for(const n of jsU){ if(!glslU.has(n)) results.warnings.push(`Orphan set: JS sets "${n}" but GLSL has no declaration`); }
// write
fs.writeFileSync('reports/shader-audit.json', JSON.stringify(results,null,2));
const list=(arr,f)=>(arr&&arr.length)?arr.map(f).join('\n'):'(none)';
let md='# Shader Audit Report\n\n';
md+='## JS uniform sets\n\n'+list(results.js.uniformSets,s=>`- \`${s.file}:${s.line}\` sets **${s.name}**`)+'\n\n';
md+='## GLSL uniforms\n\n'; for(const [n,locs] of Object.entries(results.glsl.uniforms)){ md+=`- **${n}**\n`+locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')+'\n'; }
md+='\n## Attributes\n\n'; for(const [n,locs] of Object.entries(results.glsl.attributes)){ md+=`- **${n}**\n`+locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')+'\n'; }
md+='\n## Varyings\n\n'; for(const [n,locs] of Object.entries(results.glsl.varyings)){ md+=`- **${n}**\n`+locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')+'\n'; }
md+='\n## Consts\n\n'; for(const [n,locs] of Object.entries(results.glsl.consts)){ md+=`- **${n}**\n`+locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')+'\n'; }
md+='\n## Materials / onBeforeCompile\n\n'+list(results.js.materials,m=>`- \`${m.file}:${m.line}\`\n\n\`\`\`text\n${m.context}\n\`\`\``)+'\n\n';
md+=list(results.js.onBeforeCompile,m=>`- \`${m.file}:${m.line}\`\n\n\`\`\`text\n${m.context}\n\`\`\``)+'\n\n';
md+='## Texture usage\n\n'+list(results.js.textures,t=>`- \`${t.file}:${t.line}\`\n\n\`\`\`text\n${t.context}\n\`\`\``)+'\n\n';
md+='## Mismatches\n\n### JS sets uniform missing in GLSL\n'+list(results.mismatches.jsSetsMissingInGLSL,m=>`- **${m.name}** at \`${m.file}:${m.line}\``)+'\n\n';
md+='### GLSL uniform with no JS set\n'+list(results.mismatches.glslUniformNoJSSet,m=>`- **${m.name}** at:\n${m.locations.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')}`)+'\n\n';
md+='## Update frequency (perf hint)\n\n'; const top=Object.entries(results.perf.updateFrequency).sort((a,b)=>b[1]-a[1]).slice(0,20);
md+=(top.length?top.map(([k,v])=>`- ${k}: ${v}`).join('\n'):'(none)')+'\n\n';
md+='## Warnings\n\n'+(results.warnings.length?results.warnings.map(w=>`- ${w}`).join('\n'):'(none)');
fs.writeFileSync('reports/shader-audit.md', md);
console.log('[shader-audit] wrote reports/shader-audit.{json,md}');
