import fs from 'fs';
import path from 'path';
import { walk } from './lib/walk.mjs';

const outDir = 'reports';
await fs.promises.mkdir(outDir, { recursive: true });

const JS_UNIFORM_RE = /uniforms\s*:\s*{([\s\S]*?)}/g; // naive but useful
const JS_SET_UNIFORM_RE = /uniforms\.(\w+)\s*\.value\s*=/g;
const GLSL_UNIFORM_RE = /uniform\s+\w+\s+(\w+)\s*;/g;
const GLSL_ATTRIBUTE_RE = /attribute\s+\w+\s+(\w+)\s*;/g;

const results = {
  jsUniformBlocks: [],    // {file, line, names[]}
  jsUniformSets: [],      // {file, line, name}
  glslUniforms: {},       // uniform -> [{file,line}]
  glslAttributes: {},     // attribute -> [{file,line}]
  mismatches: {
    jsSetsMissingInGLSL: [], // {name, file, line}
    glslUniformNoJSSet: []   // {name, locations:[{file,line}]}
  }
};

function linesUntil(text, idx){ return text.slice(0, idx).split('\n').length; }

// Collect JS: uniforms blocks & sets
for await (const file of walk('src')) {
  const ext = path.extname(file).toLowerCase();
  if (!['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(ext)) continue;
  const txt = await fs.promises.readFile(file,'utf8');

  // uniforms blocks
  let m;
  while ((m = JS_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, m.index);
    const body = m[1];
    const names = Array.from(body.matchAll(/(\w+)\s*:\s*{?\s*value/g)).map(x=>x[1]);
    results.jsUniformBlocks.push({file, line, names});
  }
  // uniforms.sets
  let s;
  while ((s = JS_SET_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, s.index);
    results.jsUniformSets.push({file, line, name:s[1]});
  }
}

// Collect GLSL: uniforms & attributes
for await (const file of walk('src', new Set(['.glsl','.vert','.frag','.fs','.vs','.shader']))) {
  const txt = await fs.promises.readFile(file,'utf8');
  let mU;
  while ((mU = GLSL_UNIFORM_RE.exec(txt))) {
    const line = linesUntil(txt, mU.index);
    (results.glslUniforms[mU[1]] ||= []).push({file, line});
  }
  let mA;
  while ((mA = GLSL_ATTRIBUTE_RE.exec(txt))) {
    const line = linesUntil(txt, mA.index);
    (results.glslAttributes[mA[1]] ||= []).push({file, line});
  }
}

// Mismatch detection
const glslUniformNames = new Set(Object.keys(results.glslUniforms));
const jsSetNames = new Set(results.jsUniformSets.map(x=>x.name));

// JS sets that shader never declares
for (const s of results.jsUniformSets) {
  if (!glslUniformNames.has(s.name)) {
    results.mismatches.jsSetsMissingInGLSL.push(s);
  }
}
// GLSL uniforms that JS never sets (heuristic)
for (const u of glslUniformNames) {
  if (!jsSetNames.has(u)) {
    results.mismatches.glslUniformNoJSSet.push({
      name: u,
      locations: results.glslUniforms[u]
    });
  }
}

fs.writeFileSync('reports/shader-hits.json', JSON.stringify(results,null,2));

let md = '# Shader Evidence\n\n';
md += '## JS uniform sets\n\n';
md += results.jsUniformSets.map(s=>`- \`${s.file}:${s.line}\` sets **${s.name}**`).join('\n') || '(none)';
md += '\n\n## GLSL uniforms\n\n';
for (const [name, locs] of Object.entries(results.glslUniforms)) {
  md += `- **${name}**:\n` + locs.map(l=>`  - \`${l.file}:${l.line}\``).join('\n') + '\n';
}
md += '\n## Mismatches\n\n';
md += '### JS sets a uniform missing in GLSL\n';
md += results.mismatches.jsSetsMissingInGLSL.map(m=>`- **${m.name}** at \`${m.file}:${m.line}\``).join('\n') || '(none)';
md += '\n\n### GLSL uniform with no JS set\n';
md += results.mismatches.glslUniformNoJSSet.map(m=>`- **${m.name}** at:\n${m.locations.map(l=>`  - \`${l.file}:${l.line}\``).join('\n')}`).join('\n\n') || '(none)';
fs.writeFileSync('reports/shader-hits.md', md);

console.log('[scan-shaders] wrote reports/shader-hits.{json,md}');
