#!/usr/bin/env node
/**
 * Unified System Router (thin). No new policy here.
 * - validate: run SST validation + drift + structural checks
 * - doctor: summarize issues; optional --autofix applies 2–3 safe patches
 * - query: quick grep across SST/docs/core files
 * - fix: write AI-ready context (SST excerpt + last checks) to .system/ai-context.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SYSTEM = path.join(ROOT, '.system');
fs.mkdirSync(SYSTEM, { recursive: true });

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return { code: r.status ?? 0, out: r.stdout || '', err: r.stderr || '' };
}
function writeJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }

async function load(name) { return (await import(`./playbooks/checks/${name}.mjs`)).default(); }

async function validate() {
  const v = run('npm', ['run', '--silent', 'validate-sst']);
  const d = run('npm', ['run', '--silent', 'detect-drift']);
  const checks = [];
  for (const c of ['check-sst', 'check-font', 'check-single-writer', 'check-emergence-guard', 'check-fallback-cache']) {
    checks.push(await load(c));
  }
  const ok = v.code === 0 && d.code === 0 && checks.every((x) => x.ok);
  const summary = { ok, sst: { validate: v.code === 0, drift: d.code === 0 }, checks };
  writeJSON(path.join(SYSTEM, 'validate-summary.json'), summary);
  console.log(ok ? '✅ validate: OK' : '❌ validate: issues (see .system/validate-summary.json)');
  process.exit(ok ? 0 : 1);
}

function applyPatch(name) {
  const patchPath = path.join(__dirname, 'patches', name);
  if (!exists(patchPath)) return { patch: name, ok: false, detail: 'patch not found' };
  const chk = run('git', ['apply', '--check', patchPath]);
  if (chk.code) return { patch: name, ok: false, detail: chk.err || chk.out };
  const ap = run('git', ['apply', patchPath]);
  return { patch: name, ok: ap.code === 0, detail: ap.err || ap.out };
}

async function doctor(args) {
  const auto = args.includes('--autofix');
  const checksArr = [];
  for (const c of ['check-sst', 'check-font', 'check-single-writer', 'check-emergence-guard', 'check-fallback-cache']) {
    checksArr.push(await load(c));
  }
  const issues = checksArr.filter((c) => !c.ok);
  const advice = issues.flatMap((i) => i.advice || []);
  const out = {
    ok: issues.length === 0,
    checks: checksArr,
    next: advice.length ? advice : ['Run opening macro → run probes → commit'],
  };

  if (auto && issues.length) {
    out.autofix = [];
    const byName = Object.fromEntries(checksArr.map((c) => [c.name, c]));
    if (byName['Fallback Cache'] && !byName['Fallback Cache'].ok) out.autofix.push(applyPatch('no-cache-fallback.diff'));
    if (byName['Single-Writer Policy'] && !byName['Single-Writer Policy'].ok) out.autofix.push(applyPatch('single-writer-request.diff'));
    if (byName['Emergence Guard'] && !byName['Emergence Guard'].ok) out.autofix.push(applyPatch('emergence-guard.diff'));
  }
  writeJSON(path.join(SYSTEM, 'doctor.json'), out);
  console.log(out.ok ? '✅ doctor: OK' : '❗ doctor: issues (see .system/doctor.json)');
  process.exit(out.ok ? 0 : 1);
}

function grep(file, q) {
  const t = fs.readFileSync(file, 'utf8');
  const lines = t.split(/\r?\n/);
  const hits = [];
  lines.forEach((ln, i) => ln.toLowerCase().includes(q.toLowerCase()) && hits.push({ file, line: i + 1, text: ln.trim().slice(0, 200) }));
  return hits;
}

async function query(args) {
  const q = (args.join(' ') || '').trim();
  if (!q) {
    console.log('Usage: system:query "term"');
    process.exit(1);
  }
  const hits = [];
  const files = [
    'sst/canon/v3.5.json',
    'src/engine/ConsciousnessEngine.js',
    'src/components/webgl/WebGLBackground.jsx',
    'docs/playbooks/constitutional-dev-playbook.md',
    'docs/playbooks/opening-sequence-playbook.md',
    'docs/ARCHITECTURE.md',
  ]
    .map((f) => path.join(ROOT, f))
    .filter(exists);
  files.forEach((f) => hits.push(...grep(f, q)));
  writeJSON(path.join(SYSTEM, 'query.json'), { query: q, hits });
  console.log(hits.length ? `🔎 ${hits.length} hits → .system/query.json` : '🟦 No direct hits.');
}

async function fix(args) {
  const issue = (args.join(' ') || 'unspecified').trim();
  const doctor = exists(path.join(SYSTEM, 'doctor.json'))
    ? JSON.parse(fs.readFileSync(path.join(SYSTEM, 'doctor.json'), 'utf8'))
    : {};
  const sst = exists(path.join(ROOT, 'sst/canon/v3.5.json'))
    ? JSON.parse(fs.readFileSync(path.join(ROOT, 'sst/canon/v3.5.json'), 'utf8'))
    : {};
  const context = {
    issue,
    failingChecks: doctor.checks?.filter((c) => !c.ok).map((c) => c.name) || [],
    sstExcerpt: { performance: sst?.performance, genesis: sst?.visual?.letterGeometry?.genesis },
    likelyFiles: [
      'src/engine/ConsciousnessEngine.js',
      'src/components/webgl/WebGLBackground.jsx',
      'src/theater/TheaterDirector.js',
      'src/config/visual-controls.js',
    ],
    recommendedPatches: (doctor.checks || [])
      .filter((c) => !c.ok)
      .map((c) => {
        if (c.name === 'Fallback Cache') return 'no-cache-fallback.diff';
        if (c.name === 'Single-Writer Policy') return 'single-writer-request.diff';
        if (c.name === 'Emergence Guard') return 'emergence-guard.diff';
        return null;
      })
      .filter(Boolean),
  };
  const out = path.join(SYSTEM, 'ai-context.json');
  writeJSON(out, context);
  console.log(`🧠 Wrote AI context → ${path.relative(ROOT, out)} (paste to your model or run system:doctor --autofix)`);
}

(async function main() {
  const [, , sub, ...rest] = process.argv;
  if (sub === 'validate') return validate();
  if (sub === 'doctor') return doctor(rest);
  if (sub === 'query') return query(rest);
  if (sub === 'fix') return fix(rest);
  console.log(`Usage:
  npm run system:validate
  npm run system:doctor [--autofix]
  npm run system:query "term"
  npm run system:fix "issue description"`);
})();
