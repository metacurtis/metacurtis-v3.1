/**
 * Advanced Shader Audit Scanner
 * - JS/TS: uniforms blocks, uniform sets, ShaderMaterial, onBeforeCompile, textures
 * - GLSL: uniforms, attributes, varyings, consts
 * - Mismatches: JS sets missing in GLSL; GLSL uniforms not set by JS
 * - Warnings: naming conventions, unused uniforms, frequent sets (perf hint)
 * Outputs:
 *   reports/shader-audit.json (machine)
 *   reports/shader-audit.md   (human)
 */

import fs from 'fs';
import path from 'path';
import { walk } from '../lib/walk.mjs';

// ── Regex Patterns (from Curtis' tech notes)
const JS_UNIFORM_RE       = /uniforms\s*:\s*{([\s\S]*?)}/g;            // block
const JS_SET_UNIFORM_RE   = /uniforms\.(\w+)\s*\.value\s*=/g;          // set
const GLSL_UNIFORM_RE     = /uniform\s+\w+\s+(\w+)\s*;/g;              // uniform name
const GLSL_ATTRIBUTE_RE   = /attribute\s+\w+\s+(\w+)\s*;/g;            // attribute name

// ── Extensible patterns (ecosystem)
const GLSL_VARYING_RE     = /varying\s+\w+\s+(\w+)\s*;/g;
const GLSL_CONST_RE       = /const\s+\w+\s+(\w+)\s*=/g;
const JS_TEXTURE_RE       = /(new\s+THREE\.(?:Texture|DataTexture|CubeTexture)|\.\s*load(?:Texture|CubeTexture)\s*\()/g;
const JS_MATERIAL_RE      = /new\s+THREE\.ShaderMaterial\s*\(/g;
const JS_ONBEFORE_RE      = /onBeforeCompile\s*:\s*/g;

// ── Helpers: line numbers + context
function linesUntil(text, idx) { return text.slice(0, idx).split('\n').length; }
function context(lines, i, span=2) {
  const s = Math.max(0, i-span), e = Math.min(lines.length, i+span+1);
  return lines.slice(s, e).map((l,k)=>`${s+k+1}: ${l}`).join('\n');
}

// ── Results skeleton
const results = {
  js: {
    uniformsBlocks: [],      // {file,line,names[]}
    uniformSets: [],         // {file,line,name}
    materials: [],           // {file,line,context}
    onBeforeCompile: [],     // {file,line,context}
    textures: []             // {file,line,context}
  },
  glsl: {
    uniforms: {},            // name -> [{file,line}]
    attributes: {},          // name -> [{file,line}]
    varyings: {},            // name -> [{file,line}]
    consts: {}               // name -> [{file,line}]
  },
  mismatches: {
    jsSetsMissingInGLSL: [], // {name,file,line}
    glslUniformNoJSSet: []   // {name,locations:[{file,line}]}
  },
  perf: {
    updateFrequency: {}      // name -> count
  },
  warnings: []               // strings
};

// ── Collect JS/TS evidence
for await (const file of walk('src')) {
  const ext = path.extname(file).toLowerCase();
  if (!['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(ext)) continue;
  const txt = await fs.promises.readFile(file,'utf8');
  const lines = txt.split('\n');

  // uniforms blocks
  let m;
  while ((m = JS_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, m.index);
    const body = m[1];
    const names = Array.from(body.matchAll(/(\w+)\s*:\s*{?\s*value/g)).map(x=>x[1]);
    results.js.uniformsBlocks.push({file, line, names});
  }

  // uniforms.<name>.value =
  let s;
  while ((s = JS_SET_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, s.index);
    const name = s[1];
    results.js.uniformSets.push({file, line, name});
    results.perf.updateFrequency[name] = (results.perf.updateFrequency[name]||0) + 1;
  }

  // ShaderMaterial creation
  let mm;
  while ((mm = JS_MATERIAL_RE.exec(txt))) {
    const line = linesUntil(txt, mm.index);
    results.js.materials.push({file, line, context: context(lines, line-1)});
  }

  // onBeforeCompile blocks
  let ob;
  while ((ob = JS_ONBEFORE_RE.exec(txt))) {
    const line = linesUntil(txt, ob.index);
    results.js.onBeforeCompile.push({file, line, context: context(lines, line-1)});
  }

  // texture usage
  let tx;
  while ((tx = JS_TEXTURE_RE.exec(txt))) {
    const line = linesUntil(txt, tx.index);
    results.js.textures.push({file, line, context: context(lines, line-1)});
  }
}

// ── Collect GLSL evidence
for await (const file of walk('src', new Set(['.glsl','.vert','.frag','.fs','.vs','.shader'])) ) {
  const txt = await fs.promises.readFile(file,'utf8');

  let u; while ((u = GLSL_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, u.index);
    (results.glsl.uniforms[u[1]] ||= []).push({file, line});
  }
  let a; while ((a = GLSL_ATTRIBUTE_RE.exec(txt))) {
    const line = linesUntil(txt, a.index);
    (results.glsl.attributes[a[1]] ||= []).push({file, line});
  }
  let v; while ((v = GLSL_VARYING_RE.exec(txt))) {
    const line = linesUntil(txt, v.index);
    (results.glsl.varyings[v[1]] ||= []).push({file, line});
  }
  let c; while ((c = GLSL_CONST_RE.exec(txt))) {
    const line = linesUntil(txt, c.index);
    (results.glsl.consts[c[1]] ||= []).push({file, line});
  }
}

// ── Mismatch detection
const glslUniformNames = new Set(Object.keys(results.glsl.uniforms));
const jsSetNames       = new Set(results.js.uniformSets.map(x=>x.name));

// JS sets that GLSL never declares
for (const s of results.js.uniformSets) {
  if (!glslUniformNames.has(s.name)) {
    results.mismatches.jsSetsMissingInGLSL.push(s);
  }
}

// GLSL uniforms that JS never sets
for (const u of glslUniformNames) {
  if (!jsSetNames.has(u)) {
    results.mismatches.glslUniformNoJSSet.push({
      name: u,
      locations: results.glsl.uniforms[u]
    });
  }
}

// ── Conventions & “unused” warnings
for (const u of glslUniformNames) {
  if (!/^u[A-Z]/.test(u)) {
    results.warnings.push(`Naming: GLSL uniform "${u}" does not follow uCamelCase`);
  }
}
for (const s of results.js.uniformSets) {
  if (!/^u[A-Z]/.test(s.name)) {
    results.warnings.push(`Naming: JS uniform set "${s.name}" does not follow uCamelCase`);
  }
}
for (const u of glslUniformNames) {
  if (!jsSetNames.has(u)) {
    results.warnings.push(`Unused: GLSL uniform "${u}" appears not to be set by JS`);
  }
}
for (const name of jsSetNames) {
  if (!glslUniformNames.has(name)) {
    results.warnings.push(`Orphan set: JS sets "${name}" but no GLSL declaration found`);
  }
}

// ── Write JSON
await fs.promises.writeFile('reports/shader-audit.json', JSON.stringify(results,null,2));

// ── Write Markdown
const toList = (arr, f) => (arr && arr.length) ? arr.map(f).join('\n') : '(none)';
let md = '# Shader Audit Report\n\n';

md += '## Uniform sets in JS/TS\n\n';
md += toList(results.js.uniformSets, s=>`- \`${s.file}:${s.line}\` sets **${s.name}**`) + '\n\n';

md += '## GLSL uniforms\n\n';
for (const [name, locs] of Object.entries(results.glsl.uniforms)) {
  md += `- **${name}**\n` + locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n') + '\n';
}
md += '\n## Attributes\n\n';
for (const [name, locs] of Object.entries(results.glsl.attributes)) {
  md += `- **${name}**\n` + locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n') + '\n';
}
md += '\n## Varyings\n\n';
for (const [name, locs] of Object.entries(results.glsl.varyings)) {
  md += `- **${name}**\n` + locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n') + '\n';
}
md += '\n## Consts\n\n';
for (const [name, locs] of Object.entries(results.glsl.consts)) {
  md += `- **${name}**\n` + locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n') + '\n';
}

md += '\n## Materials & onBeforeCompile hooks\n\n';
md += toList(results.js.materials, m=>`- \`${m.file}:${m.line}\`\n\n\`\`\`text\n${m.context}\n\`\`\``) + '\n\n';
md += toList(results.js.onBeforeCompile, m=>`- \`${m.file}:${m.line}\`\n\n\`\`\`text\n${m.context}\n\`\`\``) + '\n\n';

md += '## Texture usage\n\n';
md += toList(results.js.textures, t=>`- \`${t.file}:${t.line}\`\n\n\`\`\`text\n${t.context}\n\`\`\``) + '\n\n';

md += '## Mismatches\n\n';
md += '### JS sets uniform missing in GLSL\n';
md += toList(results.mismatches.jsSetsMissingInGLSL, m=>`- **${m.name}** at \`${m.file}:${m.line}\``) + '\n\n';
md += '### GLSL uniform with no JS set\n';
md += toList(results.mismatches.glslUniformNoJSSet, m=>`- **${m.name}** at:\n${m.locations.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')}`) + '\n\n';

md += '## Update frequency (perf hint)\n\n';
const entries = Object.entries(results.perf.updateFrequency).sort((a,b)=>b[1]-a[1]).slice(0,20);
md += entries.length ? entries.map(([k,v])=>`- ${k}: ${v}`).join('\n') : '(none)';
md += '\n\n## Warnings\n\n' + (results.warnings.length ? results.warnings.map(w=>`- ${w}`).join('\n') : '(none)');

await fs.promises.writeFile('reports/shader-audit.md', md);
console.log('[shader-audit] wrote reports/shader-audit.{json,md}');
