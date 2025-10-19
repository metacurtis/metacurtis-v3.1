// scripts/canon-console-inventory.cjs
// Read-only inventory of the canon-console folder.
// Usage:
//   node scripts/canon-console-inventory.cjs --dir canon-console --out .canon_reports/canon-console-inventory.md
// Options:
//   --dir <path>   : folder to scan (default: canon-console)
//   --out <path>   : markdown report path (default: .canon_reports/canon-console-inventory.md)
//   --brief        : skip code smells and import graph hints
//   --max <n>      : max bytes to read per file (default 200000)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const getArg = (name, def=null) => {
  const i = argv.indexOf(name);
  return i >= 0 ? (argv[i+1] || true) : def;
};

const ROOT = process.cwd();
const DIR = path.resolve(getArg('--dir', 'canon-console'));
const OUT = path.resolve(getArg('--out', '.canon_reports/canon-console-inventory.md'));
const BRIEF = argv.includes('--brief');
const MAX_BYTES = Number(getArg('--max', 200000));

const isText = (p) => /\.(m?js|jsx|ts|tsx|json|md|css|html|cjs|mjs)$/i.test(p);
const readFileSafe = (p) => {
  try { return fs.readFileSync(p, {encoding:'utf8'}); } catch { return ''; }
};

const walk = (dir) => {
  const entries = [];
  (function rec(d) {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, f.name);
      if (f.isDirectory()) rec(abs);
      else entries.push(abs);
    }
  })(dir);
  return entries;
};

const short = (p) => path.relative(ROOT, p);

const grabHeaderComment = (code) => {
  // First /** ... */ or // lines at top
  const block = code.match(/\/\*\*[\s\S]*?\*\//);
  if (block) return block[0].replace(/\r/g,'').split('\n').slice(0,15).join('\n');
  const lines = code.split(/\r?\n/);
  const lead = [];
  for (const line of lines) {
    if (/^\s*\/\//.test(line)) { lead.push(line); if (lead.length>=15) break; }
    else if (/^\s*$/.test(line)) { lead.push(line); }
    else break;
  }
  return lead.join('\n').trim();
};

const getExports = (code) => {
  const names = new Set();
  // named exports
  (code.match(/export\s+(?:const|function|class|let|var)\s+([A-Za-z0-9_]+)/g) || [])
    .forEach(m => { const n = m.split(/\s+/).pop(); if(n) names.add(n); });
  // export { a, b as c }
  (code.match(/export\s*{\s*([^}]+)\s*}/g) || []).forEach(m => {
    m.replace(/export\s*{([^}]+)}/, '$1')
     .split(',')
     .map(s => s.trim().split(/\s+as\s+/).pop())
     .forEach(n => n && names.add(n));
  });
  // default export?
  if (/export\s+default\s+/.test(code)) names.add('default');
  return [...names].sort();
};

const getImports = (code) => {
  const mods = [];
  (code.match(/import\s+[^'"]+from\s+['"][^'"]+['"]/g) || []).forEach(m => {
    const mod = m.match(/from\s+['"]([^'"]+)['"]/)[1];
    mods.push(mod);
  });
  (code.match(/import\s+['"][^'"]+['"]/g) || []).forEach(m => {
    const mod = m.match(/import\s+['"]([^'"]+)['"]/)[1];
    mods.push(mod);
  });
  return mods;
};

const smellFlags = (code) => {
  // Heuristics to highlight potential conflicts / responsibilities overlap
  const touchesDOM   = /\bdocument\.(getElementById|querySelector|createElement)\b/.test(code);
  const touchesWin   = /\bwindow\./.test(code);
  const usesBus      = /\bBeatBus\b|\bCANON_CONSOLE\b|\bCANON_PILOT\b/.test(code);
  const hudRefs      = /\bhud\b|\b__canonHudV2__\b|canon-hud-v2/.test(code);
  const injectorLike = /\binject(or|ion)\b|__canonInjectorV3__/.test(code);
  const guardRefs    = /\bGuard\b|\bCanon\s*Guard\b|\bbridge-guard\b/.test(code);
  const vtapRefs     = /\bviolation-?tap\b|CANON_VIOLATION/.test(code);
  const consolePoly  = /\bconsole\.(override|proxy|wrap)/i.test(code);
  const envGates     = /import\.meta\.env|process\.env/.test(code);
  return { touchesDOM, touchesWin, usesBus, hudRefs, injectorLike, guardRefs, vtapRefs, consolePoly, envGates };
};

const classify = (relPath) => {
  const parts = relPath.split(path.sep);
  // bucket based on folder
  if (parts.includes('browser')) return 'browser';
  if (parts.includes('runtime')) return 'runtime';
  if (parts.includes('agent'))   return 'agent';
  if (parts.includes('model'))   return 'model';
  if (parts.includes('server'))  return 'server';
  return 'lib';
};

const toTableRow = (o) =>
  `| \`${o.rel}\` | ${o.kind} | ${o.size} | ${o.loc} | \`${o.exports.join(', ')||'-'}\` | ${o.flags.touchesDOM?'DOM':''} ${o.flags.touchesWin?'WIN':''} ${o.flags.usesBus?'BUS':''} ${o.flags.hudRefs?'HUD':''} ${o.flags.guardRefs?'GUARD':''} ${o.flags.vtapRefs?'VTAP':''} ${o.flags.injectorLike?'INJ':''} ${o.flags.envGates?'ENV':''} |`;

const main = () => {
  if (!fs.existsSync(DIR)) {
    console.error(`⛔ Folder not found: ${short(DIR)}`);
    process.exit(1);
  }

  const files = walk(DIR).filter(p => isText(p));
  const rows = [];
  const byKind = new Map();
  const importIndex = new Map(); // mod -> count

  for (const abs of files) {
    const rel = short(abs);
    const stat = fs.statSync(abs);
    let code = readFileSafe(abs);
    if (code.length > MAX_BYTES) code = code.slice(0, MAX_BYTES);

    const header = grabHeaderComment(code);
    const exports_ = getExports(code);
    const imports = BRIEF ? [] : getImports(code);
    const flags = smellFlags(code);
    const kind = classify(rel);
    const loc = code.split(/\r?\n/).length;

    imports.forEach(m => importIndex.set(m, 1 + (importIndex.get(m) || 0)));

    const item = {
      rel, size: stat.size, loc, kind, exports: exports_, flags, header
    };
    rows.push(item);
    byKind.set(kind, (byKind.get(kind) || 0) + 1);
  }

  // Markdown report
  const md = [];
  md.push(`# canon-console Inventory (read-only)\n`);
  md.push(`- Root: \`${short(DIR)}\``);
  md.push(`- Files scanned: **${rows.length}**`);
  md.push(`- Buckets: ${[...byKind.entries()].map(([k,v])=>`\`${k}:${v}\``).join(', ')}\n`);
  md.push(`## Summary Table\n`);
  md.push(`| File | Kind | Bytes | LOC | Exports | Flags |\n|---|---:|---:|---:|---|---|`);
  rows
    .sort((a,b)=> a.rel.localeCompare(b.rel))
    .forEach(o => md.push(toTableRow(o)));

  if (!BRIEF) {
    md.push(`\n## Import Hotspots (top internal references)\n`);
    const hot = [...importIndex.entries()]
      .filter(([m]) => m.startsWith('.') || m.startsWith('@/') || m.startsWith('..'))
      .sort((a,b)=> b[1]-a[1])
      .slice(0, 40);
    if (hot.length === 0) md.push(`(none)`);
    else md.push(hot.map(([m,c]) => `- \`${m}\` × ${c}`).join('\n'));
  }

  md.push(`\n## File Notes (first header/comment block)\n`);
  rows.forEach(o => {
    md.push(`### \`${o.rel}\``);
    if (o.header) md.push('```text\n' + o.header.trim() + '\n```');
    else md.push('_No header comment detected._');
  });

  fs.writeFileSync(OUT, md.join('\n'), 'utf8');
  console.log(`✅ Wrote report: ${short(OUT)}`);
};

main();
