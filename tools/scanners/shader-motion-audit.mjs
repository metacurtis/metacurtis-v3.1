/**
 * Shader Motion Audit (Behavioral)
 * Guards:
 *  1) Morph-safe motion audit:
 *     - In GLSL functions (~ generateMovement), per-mode branches must gate offsets
 *       with morph factor (e.g., (1.0 - uMorphProgress), smoothstep(... uMorphProgress ...)).
 *     - If a branch returns an offset without referencing uMorphProgress near return, flag ERROR.
 *  2) Grid-mode parameter audit:
 *     - If JS sets uMotionMode = 1 (grid), ensure nearby uGridSpacing set; else ERROR.
 *     - If SST/metadata implies grid behavior (grid_drift/grid_flow) but renderer never updates
 *       uGridSpacing, flag ERROR (global).
 *
 * Outputs: reports/shader-motion-audit.{json,md}
 */
import fs from 'fs';
import path from 'path';
import { walk } from '../lib/walk.mjs';

const outDir='reports'; await fs.promises.mkdir(outDir,{recursive:true});

// Heuristics / regexes
const GLSL_FILETYPES = new Set(['.glsl','.vert','.frag','.fs','.vs','.shader']);
const GENMOVE_RE = /(vec[23]\s+)?generateMovement\s*\([\s\S]*?\)\s*{([\s\S]*?)}/g;
const UMORPH_NEAR_RETURN_RE = /(uMorphProgress|smoothstep\s*\([^)]*uMorphProgress[^)]*\))/;
const RETURN_RE = /return\s+[^;]+;/g;
const MODE_CASE_RE = /(case\s+(\d+)\s*:|if\s*\([^)]+uMotionMode[^)]+\)\s*{?)/g;

const SET_MODE_GRID_RE = /\.uMotionMode\s*\.value\s*=\s*1\b/;      // JS set mode to 1 (grid)
const SET_GRID_SPACING_RE = /\.uGridSpacing\s*\.value\s*=/;        // JS set grid spacing
const WINDOW_LINES = 60;                                           // window to scan for spacing

// Grid behavior keywords from SST
const GRID_BEHAVIOR_RE = /\bgrid_(?:drift|flow)\b/i;

// Load SST extract if present
let sst=null;
try {
  if (fs.existsSync('reports/sst-extract.json')) {
    sst = JSON.parse(fs.readFileSync('reports/sst-extract.json','utf8'));
  }
} catch {}

// Collect GLSL audits
const glslFindings = [];
for await (const file of walk('src', GLSL_FILETYPES)) {
  const txt = await fs.promises.readFile(file,'utf8');
  let m;
  while((m = GENMOVE_RE.exec(txt))){
    const fnBody = m[2] || '';
    // per "case" or per "if (uMotionMode...)" block, search returns and morph usage
    let blockIdx = 0;
    // naive split: separate by "case X:" or "if ( ... uMotionMode ... )"
    const pieces = fnBody.split(/(?=case\s+\d+\s*:|if\s*\([^)]+uMotionMode[^)]+\))/g);
    for(const piece of pieces){
      if(!piece.trim()) continue;
      let unsafeReturns = 0, totalReturns = 0;
      const returns = piece.match(RETURN_RE) || [];
      totalReturns = returns.length;
      if (totalReturns===0) continue;
      // Require morph factor in same piece
      const hasMorphRef = UMORPH_NEAR_RETURN_RE.test(piece);
      if (!hasMorphRef) unsafeReturns = totalReturns;
      if (unsafeReturns>0) {
        glslFindings.push({
          type: 'MORPH_UNSAFE_OFFSET',
          file, detail: `Mode-block #${++blockIdx} returns ${unsafeReturns}/${totalReturns} offsets without morph gating`,
          hint: 'Multiply offsets by (1.0 - uMorphProgress) or smoothstep(... uMorphProgress ..., ...)' 
        });
      }
    }
  }
}

// Collect JS grid audit
const jsFiles = [];
for await (const file of walk('src')){
  const ext = path.extname(file).toLowerCase();
  if (!['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(ext)) continue;
  const txt = await fs.promises.readFile(file,'utf8');
  const lines = txt.split('\n');
  lines.forEach((ln, i) => {
    if (SET_MODE_GRID_RE.test(ln)) {
      // scan nearby window for grid spacing set
      let spacingFound = false;
      for (let k=Math.max(0,i-WINDOW_LINES); k<Math.min(lines.length,i+WINDOW_LINES); k++){
        if (SET_GRID_SPACING_RE.test(lines[k])) { spacingFound = true; break; }
      }
      jsFiles.push({
        file, line: i+1,
        modeSetLine: i+1,
        spacingFound
      });
    }
  });
}

// Determine SST grid intent
let sstGridIntent = false;
try {
  if (sst?.source && fs.existsSync(sst.source)) {
    const raw = fs.readFileSync(sst.source,'utf8');
    sstGridIntent = GRID_BEHAVIOR_RE.test(raw);
  }
} catch {}

// Global verdicts
const issues = [];
for (const f of glslFindings) {
  if (f.type==='MORPH_UNSAFE_OFFSET') {
    issues.push({ severity:'ERROR', ...f });
  }
}
// For each JS mode set to grid without spacing
for (const f of jsFiles) {
  if (!f.spacingFound) {
    issues.push({
      severity:'ERROR',
      type:'GRID_MODE_NO_SPACING',
      file: f.file,
      detail:`uMotionMode=1 set at line ${f.modeSetLine} without uGridSpacing assignment in ±${WINDOW_LINES} lines`,
      hint:'Set material.uniforms.uGridSpacing.value = vec2(x,y) before or near mode=1 assignment'
    });
  }
}
// If SST suggests grid but no spacing anywhere
const anySpacingSet = jsFiles.some(f=>f.spacingFound) ||
  (await (async ()=>{
    // fallback: quick global grep for uGridSpacing set
    for await (const x of walk('src')) {
      if (!['.js','.jsx','.ts','.tsx','.mjs','.cjs'].includes(path.extname(x).toLowerCase())) continue;
      const t = await fs.promises.readFile(x,'utf8');
      if (SET_GRID_SPACING_RE.test(t)) return true;
    }
    return false;
  })());
if (sstGridIntent && !anySpacingSet) {
  issues.push({
    severity:'ERROR',
    type:'GRID_BEHAVIOR_NO_SPACING_ANYWHERE',
    file:'(global)',
    detail:'SST shows grid_* behavior but renderer never sets uGridSpacing',
    hint:'Update dispatcher to set uGridSpacing when grid behavior or mode=1 is selected'
  });
}

// Write JSON
const jsonOut = {
  summary: {
    morphUnsafeCount: glslFindings.filter(x=>x.type==='MORPH_UNSAFE_OFFSET').length,
    gridNoSpacingCount: issues.filter(x=>x.type==='GRID_MODE_NO_SPACING').length,
    gridGlobalMissing: issues.some(x=>x.type==='GRID_BEHAVIOR_NO_SPACING_ANYWHERE'),
    sstGridIntent
  },
  glslFindings,
  jsGridChecks: jsFiles,
  issues
};
fs.writeFileSync(path.join(outDir,'shader-motion-audit.json'), JSON.stringify(jsonOut,null,2));

// Write MD
let md = '# Shader Motion Audit\n\n';
md += '## Summary\n\n';
md += `- Morph-unsafe blocks: ${jsonOut.summary.morphUnsafeCount}\n`;
md += `- Grid mode without spacing (local): ${jsonOut.summary.gridNoSpacingCount}\n`;
md += `- Grid behavior in SST: ${jsonOut.summary.sstGridIntent ? 'YES' : 'NO'}\n`;
md += `- Global spacing missing: ${jsonOut.summary.gridGlobalMissing ? 'YES' : 'NO'}\n\n`;

md += '## Morph-Unsafe Findings\n\n';
md += (glslFindings.length
  ? glslFindings.map(f=>`- \`${f.file}\` — ${f.detail}\n  - hint: ${f.hint}`).join('\n')
  : '(none)') + '\n\n';

md += '## Grid Mode Checks (uMotionMode = 1)\n\n';
md += (jsFiles.length
  ? jsFiles.map(f=>`- \`${f.file}:${f.line}\` spacingFound=${f.spacingFound}`).join('\n')
  : '(none)') + '\n\n';

md += '## Issues\n\n';
md += (jsonOut.issues.length
  ? jsonOut.issues.map(i=>`- [${i.severity}] ${i.type} @ ${i.file}\n  - ${i.detail}\n  - hint: ${i.hint}`).join('\n')
  : '(none)') + '\n';

fs.writeFileSync(path.join(outDir,'shader-motion-audit.md'), md);
console.log('[shader-motion-audit] wrote reports/shader-motion-audit.{json,md}');
