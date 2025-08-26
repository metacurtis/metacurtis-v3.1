#!/usr/bin/env node
/**
 * Render Contract Verifier / Doctor
 * - Verifies shader imports (?raw), ShaderMaterial keys, attribute/uniform parity, alias path.
 * - With --fix: applies targeted codemods (idempotent) and makes .bak files on first change.
 */
const fs = require('fs');
const _path = require('path');

const root = process.cwd();
const files = {
  webglBackground: 'src/components/webgl/WebGLBackground.jsx',
  webglCanvas: 'src/components/webgl/WebGLCanvas.jsx',
  engine: 'src/engine/ConsciousnessEngine.js',
  eventsTheater: 'src/theater/events.js',
  vertex: 'src/shaders/templates/consciousness-vertex.glsl',
  fragment: 'src/shaders/templates/consciousness-fragment.glsl',
};

const REQUIRED_ATTRS = [
  'particleIndex',
  'atmosphericPosition',
  'allenAtlasPosition',
  'animationSeed',
  'sizeMultiplier',
  'opacityData',
  'atlasIndex',
  'tierData',
];

const REQUIRED_UNIFORMS_V = [
  'uTime','uStageProgress','uPointSize','uStageBlend','uResolution'
];
const REQUIRED_UNIFORMS_F = [
  'uAtlasTexture','uTierCutoff','uFadeProgress','uGaussianSigma',
  'uColorCurrent','uColorNext'
];

const args = new Set(process.argv.slice(2));
const DO_FIX = args.has('--fix');

function read(rel){ const p=path.join(root, rel); return fs.existsSync(p) ? fs.readFileSync(p,'utf8') : null; }
function write(rel, src){
  const p=path.join(root, rel);
  if (!fs.existsSync(p+'.bak')) fs.writeFileSync(p+'.bak', fs.readFileSync(p,'utf8'));
  fs.writeFileSync(p, src);
}
function grep(re, s){ const m=[]; let k; while((k=re.exec(s))){ m.push(k[1]||k[0]); } return m; }
function uniq(a){ return Array.from(new Set(a)); }
function fail(msg){ console.error('❌', msg); process.exitCode = 1; }

function checkShaderImports() {
  const bg = read(files.webglBackground) || '';
  const problems = [];
  const reImport = /from\s+['"]([^'"]+consciousness-(vertex|fragment)\.glsl)(\?raw)?['"]/g;
  let m; while((m = reImport.exec(bg))){
    const hasRaw = !!m[3];
    if (!hasRaw) problems.push(m[1]);
  }
  if (problems.length && DO_FIX) {
    let fixed = bg.replace(/(consciousness-(vertex|fragment)\.glsl)(['"])/g, '$1?raw$3');
    if (fixed !== bg) {
      write(files.webglBackground, fixed);
      console.log('🩹 Added ?raw to shader imports in WebGLBackground.jsx');
      return true;
    }
  } else if (problems.length) {
    fail(`Missing ?raw on shader imports: ${problems.join(', ')}`);
  }
  return false;
}

function checkShaderMaterialKeys(){
  const bg = read(files.webglBackground) || '';
  const wrong = bg.includes('fragmentShaderSource:');
  if (wrong && DO_FIX){
    const fixed = bg.replace(/fragmentShaderSource\s*:/g, 'fragmentShader:');
    write(files.webglBackground, fixed);
    console.log('🩹 Replaced fragmentShaderSource -> fragmentShader');
    return true;
  } else if (wrong){
    fail('ShaderMaterial uses fragmentShaderSource (must be fragmentShader).');
  }
  return false;
}

function parseAttributesFromGLSL(glsl){
  return uniq(grep(/attribute\s+\w+\s+([A-Za-z0-9_]+)/g, glsl));
}
function parseUniformsFromGLSL(glsl){
  return uniq(grep(/uniform\s+\w+(?:\s*\[\s*\d+\s*\])?\s+([A-Za-z0-9_]+)/g, glsl));
}
function parseAttributesFromBG(bg){
  return uniq(grep(/setAttribute\(\s*['"]([A-Za-z0-9_]+)['"]\s*,/g, bg));
}
function parseUniformsFromBG(bg){
  const block = bg.match(/uniforms\s*:\s*\{([\s\S]*?)\}\s*,\s*vertexShader/);
  if (!block) return [];
  return uniq(grep(/\b([A-Za-z0-9_]+)\s*:\s*\{\s*value:/g, block[1]));
}

function checkAttrParity(){
  const vsrc = read(files.vertex) || '';
  const bg = read(files.webglBackground) || '';
  const need = parseAttributesFromGLSL(vsrc).filter(n => REQUIRED_ATTRS.includes(n));
  const have = parseAttributesFromBG(bg);
  const missing = need.filter(n => !have.includes(n));
  if (missing.length){
    fail('Geometry is missing attributes required by vertex shader: '+missing.join(', '));
    if (DO_FIX){
      // optional: we could try to inject particleIndex block, but auto-coding geometry is risky.
      console.log('ℹ️  Run the app to confirm. Auto-fix for attributes is detection-only.');
    }
  }
}

function checkUniformParity(){
  const vsrc = read(files.vertex)||'';
  const fsrc = read(files.fragment)||'';
  const bg = read(files.webglBackground)||'';
  const vNeed = parseUniformsFromGLSL(vsrc).filter(n => REQUIRED_UNIFORMS_V.includes(n));
  const fNeed = parseUniformsFromGLSL(fsrc).filter(n => REQUIRED_UNIFORMS_F.includes(n));
  const js = parseUniformsFromBG(bg);
  const missV = vNeed.filter(n => !js.includes(n));
  const missF = fNeed.filter(n => !js.includes(n));
  if (missV.length || missF.length){
    fail(`Missing uniforms in ShaderMaterial: ${[...missV, ...missF].join(', ')}`);
  }
}

function checkAlias(){
  const eng = read(files.engine)||'';
  if (/@theatre\/events\.js/.test(eng)){
    if (DO_FIX){
      const fixed = eng.replace(/@theatre\/events\.js/g, '@theater/events.js');
      write(files.engine, fixed);
      console.log('🩹 Fixed alias @theatre → @theater in ConsciousnessEngine.js');
      return true;
    } else {
      fail('Import path uses @theatre/events.js. Should be @theater/events.js.');
    }
  }
  return false;
}

function enforceFloat32ArrayForTierHighlight(){
  const bg = read(files.webglBackground)||'';
  const pat = /uTierHighlight:\s*\{\s*value:\s*\[([^\]]+)\]\s*\}/;
  const m = bg.match(pat);
  if (m && DO_FIX){
    const fixed = bg.replace(pat, (s, inner) =>
      `uTierHighlight: { value: new Float32Array([${inner}]) }`
    );
    if (fixed !== bg){
      write(files.webglBackground, fixed);
      console.log('🩹 Wrapped uTierHighlight in Float32Array (mobile GL1 safety).');
      return true;
    }
  }
  return false;
}

let changed = false;
changed |= checkShaderImports();
changed |= checkShaderMaterialKeys();
changed |= checkAlias();
enforceFloat32ArrayForTierHighlight();
checkAttrParity();
checkUniformParity();

if (!process.exitCode){
  console.log(changed ? '✅ Verified + fixed minor issues.' : '✅ Render contract verified. No issues.');
}
