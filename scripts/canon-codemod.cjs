#!/usr/bin/env node
/**
 * canon-codemod.cjs
 * Heuristic source rewriter (no deps).
 * - Adds:   import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
 * - Replaces: new THREE.PointsMaterial({...}) -> createCanonMaterial({...})  (maps size->pointSize)
 * - Wraps Points ctor first arg: new THREE.Points(geo, mat) -> new THREE.Points(ensureCanonGeometry(geo), mat)
 * - After "const|let|var X = new THREE.BufferGeometry();" inserts:
 *     const activeCount = (X.getAttribute('position')?.count ?? 0);
 *     X.setDrawRange(0, activeCount);
 *
 * Safe to run multiple times (idempotent).
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

const JS_EXT = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && JS_EXT.has(path.extname(p))) out.push(p);
  }
  return out;
}

function ensureImport(code) {
  const importLine = `import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';`;
  if (code.includes(importLine)) return code;
  // already importing from materialFactory? add named specifiers if missing
  const re = /import\s+{[^}]*}\s+from\s+['"]@\/renderer\/materialFactory['"];?/;
  if (re.test(code)) {
    return code.replace(re, (m) => {
      if (m.includes('ensureCanonGeometry') && m.includes('createCanonMaterial')) return m;
      const names = new Set();
      m.replace(/import\s+{([^}]*)}/, (_, g1) => g1.split(',').forEach(s => names.add(s.trim())));
      names.add('ensureCanonGeometry'); names.add('createCanonMaterial');
      return `import { ${Array.from(names).join(', ')} } from '@/renderer/materialFactory';`;
    });
  }
  // put after first import or at top
  const firstImport = code.match(/^\s*import\s.*$/m);
  if (firstImport) {
    return code.replace(firstImport[0], firstImport[0] + '\n' + importLine);
  }
  return importLine + '\n' + code;
}

function mapPointsMaterialArgs(args) {
  // map { size } -> { pointSize }, keep others
  return args.replace(/\bsize\s*:/g, 'pointSize:');
}

function replacePointsMaterial(code) {
  // new THREE.PointsMaterial({...}) -> createCanonMaterial({...})
  code = code.replace(
    /new\s+THREE\.PointsMaterial\s*\(\s*\{[\s\S]*?\}\s*\)/g,
    (m) => {
      const obj = m.match(/\{[\s\S]*\}/)[0];
      return `createCanonMaterial(${mapPointsMaterialArgs(obj)})`;
    }
  );
  // new THREE.PointsMaterial() -> createCanonMaterial({})
  code = code.replace(/new\s+THREE\.PointsMaterial\s*\(\s*\)/g, 'createCanonMaterial({})');

  // also handle unqualified PointsMaterial(...)
  code = code.replace(
    /new\s+PointsMaterial\s*\(\s*\{[\s\S]*?\}\s*\)/g,
    (m) => {
      const obj = m.match(/\{[\s\S]*\}/)[0];
      return `createCanonMaterial(${mapPointsMaterialArgs(obj)})`;
    }
  ).replace(/new\s+PointsMaterial\s*\(\s*\)/g, 'createCanonMaterial({})');

  return code;
}

function wrapPointsCtor(code) {
  // new THREE.Points( something , => ensureCanonGeometry(something),
  // avoid double-wrapping
  return code.replace(
    /new\s+THREE\.Points\s*\(\s*(?!ensureCanonGeometry\()\s*([A-Za-z$_][\w$\.]*)\s*,/g,
    'new THREE.Points(ensureCanonGeometry($1),'
  ).replace(
    /new\s+Points\s*\(\s*(?!ensureCanonGeometry\()\s*([A-Za-z$_][\w$\.]*)\s*,/g,
    'new Points(ensureCanonGeometry($1),'
  );
}

function addDrawRangeAfterBufferGeometry(code) {
  // Find "const|let|var name = new THREE.BufferGeometry();"
  const re = /^(?<indent>[ \t]*)(?<decl>const|let|var)\s+(?<name>[A-Za-z$_][\w$]*)\s*=\s*new\s+THREE\.BufferGeometry\s*\(\s*\)\s*;\s*$/gm;
  return code.replace(re, (line, indent, decl, name, _off, _str, groups) => {
    const id = (groups && groups.indent) || '';
    const nm = (groups && groups.name) || name;
    const declKw = (groups && groups.decl) || decl;
    return `${id}${declKw} ${nm} = new THREE.BufferGeometry();\n` +
           `${id}const activeCount = (${nm}.getAttribute('position')?.count ?? 0);\n` +
           `${id}${nm}.setDrawRange(0, activeCount);`;
  });
}

function processFile(p) {
  let code = fs.readFileSync(p, 'utf8');
  const orig = code;

  // skip generated shim/factory themselves
  if (p.endsWith('canonComplianceShim.js')) return false;

  code = ensureImport(code);
  code = replacePointsMaterial(code);
  code = wrapPointsCtor(code);
  code = addDrawRangeAfterBufferGeometry(code);

  if (code !== orig) {
    fs.writeFileSync(p, code, 'utf8');
    return true;
  }
  return false;
}

(function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('✖ src/ not found. Run from project root.');
    process.exit(2);
  }
  const files = walk(SRC_DIR);
  let changed = 0;
  for (const f of files) if (processFile(f)) { changed++; console.log('✓ patched', path.relative(ROOT, f)); }
  console.log(changed ? `\nDone: ${changed} file(s) patched.` : '\nNo changes needed.');
})();
