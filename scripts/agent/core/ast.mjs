/* eslint-env node */
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

export function readFile(rel) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}
export function writeFile(rel, content) {
  const p = path.join(process.cwd(), rel);
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}
export function backupOnce(rel) {
  const p = path.join(process.cwd(), rel);
  if (!fs.existsSync(p)) return;
  const dir = path.dirname(p), base = path.basename(p);
  const has = fs.readdirSync(dir).some(n => n.startsWith(base + '.bak.agent-'));
  if (!has) fs.copyFileSync(p, path.join(dir, base + '.bak.agent-' + Date.now()));
}
export function parseModule(src) {
  return parse(src, { sourceType: 'module', plugins: ['jsx', 'classProperties', 'typescript'] });
}
export function transform(rel, fn) {
  const src = readFile(rel); if (!src) return false;
  const ast = parseModule(src);
  const ctx = { mutated: false, src };
  fn(ast, ctx, src, traverse);
  if (ctx.mutated) {
    const out = generate(ast, { retainLines: true }).code;
    backupOnce(rel);
    writeFile(rel, out);
    return true;
  }
  return false;
}
export function patchText(rel, replacers = []) {
  const src = readFile(rel); if (!src) return false;
  let out = src, changed = false;
  for (const [pattern, replacement] of replacers) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (out !== before) changed = true;
  }
  if (changed) { backupOnce(rel); writeFile(rel, out); }
  return changed;
}
