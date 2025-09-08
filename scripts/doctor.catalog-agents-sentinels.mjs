#!/usr/bin/env node
/* eslint-env node */
/**
 * Repo Doctor — Agents & Sentinels Catalog (one-touch, idempotent)
 * Scans the repo for agent/sentinel/doctor files and emits a JSON report.
 * No deps, no code edits. Works on Node 18+ (tested on Node 22.18).
 */
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// ── arg parse ─────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : null;
  }).filter(Boolean)
);

const ROOT    = path.resolve(String(args.root || process.cwd()));
const WRITE   = Boolean(args.write);
const OUTFILE = args.outfile ? String(args.outfile) : null;
const FORMAT  = (args.format === 'min') ? 'min' : 'pretty';
const INCLUDE = parsePatterns(args.include);
const EXCLUDE = parsePatterns(args.exclude);

function parsePatterns(s) {
  if (!s) return null;
  return String(s)
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .map(globToRegex);
}

// Safe glob→regex (MDN-escaped set), then restore '*'/'?'
function globToRegex(glob) {
  const escaped = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '^' + escaped.replace(/\\\*/g, '.*').replace(/\\\?/g, '.') + '$';
  return new RegExp(pattern, 'i');
}

function matchPatterns(relPath) {
  if (INCLUDE && !INCLUDE.some(r => r.test(relPath))) return false;
  if (EXCLUDE && EXCLUDE.some(r => r.test(relPath)))  return false;
  return true;
}

// ── fs walk ───────────────────────────────────────────────────────────────────
const IGNORE_DIRS  = new Set(['node_modules','.git','.hg','.svn','.next','.vercel','out','dist','build','coverage','.turbo','.cache']);
const CANDIDATE_EXT= new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.sh']);

async function *walk(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) yield *walk(p);
    } else if (e.isFile()) {
      yield p;
    }
  }
}

// ── detection heuristics ──────────────────────────────────────────────────────
function isCandidateFile(filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  if (!CANDIDATE_EXT.has(ext)) return false;
  const base = path.basename(filePath).toLowerCase();
  return /(agent|sentinel|doctor|hotdors|guard|sst|validate|render-doctor|orchestrator)/.test(base);
}

function analyzeContent(rel, s) {
  const roles = new Set();
  if (/sentinel|sst-guard|\bguard\b|validate-sst|ajv|jsonschema|schema|canonical/i.test(s)) roles.add('sentinel');
  if (/goal[- ]?driven|--goal|propose plan|apply(?:\s+patch|)|fs\.writeFileSync|readline|process\.argv|execSync/i.test(s)) roles.add('agent');
  if (/hot[-_]?dors|doctor|render-doctor|repo doctor/i.test(s)) roles.add('doctor');
  if (/globalThis\.hotdors|selfverifyATS|BeatBus\.on|EVENTS\./i.test(s)) roles.add('runtime_doctor');
  if (/\bvalidate\b|validator|lint/i.test(s)) roles.add('validator');

  const type = roles.size ? Array.from(roles) : ['unknown'];

  // Goals/flags/events
  const goals = new Set();
  (s.match(/['"](opening|emergence|fencepost|guard|validate)['"]/gi) || []).forEach(m => goals.add(m.replace(/['"]/g,'')));
  (s.match(/case\s+['"]([a-z0-9:_-]+)['"]/gi) || []).forEach(m => { const g = m.replace(/.*case\s+['"]|['"].*/gi,''); if(g) goals.add(g); });
  const flags  = Array.from(new Set((s.match(/--[a-z0-9:_-]+/gi) || []).map(x => x.replace(/,$/, ''))));
  const events = Array.from(new Set((s.match(/EVENTS\.[A-Z_]+/g) || []).map(x => x.replace('EVENTS.', ''))));

  // Mutations / exec
  const mutates  = /fs\.writeFileSync|fsp\.writeFile|copyFileSync|renameSync|replace\(/i.test(s);
  const executes = /child_process|execSync|spawnSync|\bsh\(|\bexec\(/i.test(s);

  // Module style
  const shebang = /^#!\//.test(s);
  const esm     = /\bimport\s+.*from\s+['"]/m.test(s);
  const cjs     = /\brequire\(.*\)/m.test(s);

  // References map
  const references = {};
  const mapMatch = s.match(/const\s+F\s*=\s*\{([\s\S]*?)\}\s*;?/m);
  if (mapMatch) {
    for (const line of mapMatch[1].split(/\n/)) {
      const m = line.trim().match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*['"]([^'"]+)['"]/);
      if (m) references[m[1]] = m[2];
    }
  }

  // Self-bootstrap & ATS signals (no char classes that create ranges)
  const selfBootstrap = /globalThis\.hotdors|installed:\s*true|idempotent|once\(|one\s*touch/i.test(s);
  const ats = /(selfverifyATS|subseq|hint|fencepost|PARTICLES_EMERGED|ENABLE_SCROLL)/i.test(s);

  return { type, goals: Array.from(goals), flags, events, mutates, executes, shebang, esm, cjs, references, selfBootstrap, ats };
}

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

// ── main ──────────────────────────────────────────────────────────────────────
const findings = [];
const errors   = [];
let scanned    = 0, candidates = 0;
const started  = Date.now();
const MAX_BYTES= 1.5 * 1024 * 1024;

for await (const abs of walk(ROOT)) {
  scanned++;
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  if (!isCandidateFile(rel)) continue;
  if (!matchPatterns(rel))   continue;
  candidates++;

  try {
    const st  = await fsp.stat(abs);
    if (st.size > MAX_BYTES) {
      findings.push({ path: rel, skipped: true, reason: `size>${MAX_BYTES}B`, size_bytes: st.size });
      continue;
    }
    const buf = await fsp.readFile(abs);
    const s   = buf.toString('utf8');
    const meta= analyzeContent(rel, s);
    const hash= sha256(s);
    const lines = s.split(/\r?\n/).length;

    findings.push({
      path: rel,
      type: meta.type,
      size_bytes: st.size,
      lines,
      hash,
      esm: meta.esm,
      cjs: meta.cjs,
      shebang: meta.shebang,
      goals: meta.goals,
      cli_flags: meta.flags,
      beatbus_events: meta.events,
      mutates: meta.mutates,
      executes: meta.executes,
      self_bootstrap: meta.selfBootstrap,
      ats_signals: meta.ats,
      references: meta.references,
      mtime: st.mtime.toISOString(),
      ctime: st.ctime.toISOString(),
    });
  } catch (e) {
    errors.push({ path: rel, error: String(e && e.message || e) });
  }
}

// counts
const typeCounts = {};
for (const f of findings) {
  const types = Array.isArray(f.type) ? f.type : [f.type];
  for (const t of types) typeCounts[t] = (typeCounts[t] || 0) + 1;
}

// duplicates
const dupMap = new Map();
for (const f of findings) {
  if (!f.hash || f.skipped) continue;
  if (!dupMap.has(f.hash)) dupMap.set(f.hash, []);
  dupMap.get(f.hash).push(f.path);
}
const duplicates = Array.from(dupMap.entries())
  .filter(([, arr]) => arr.length > 1)
  .map(([hash, files]) => ({ hash, files }));

// suggestions
const suggestions_global = [];
const agentCount    = Object.entries(typeCounts).filter(([k]) => /agent/.test(k)).reduce((a, [,v]) => a+v, 0);
const sentinelCount = Object.entries(typeCounts).filter(([k]) => /sentinel/.test(k)).reduce((a, [,v]) => a+v, 0);
if (agentCount > 1)    suggestions_global.push(`Multiple agent files detected (${agentCount}). Consolidate into scripts/agent.cjs with a goal registry.`);
if (sentinelCount > 1) suggestions_global.push(`Multiple sentinels detected (${sentinelCount}). Prefer a single tools/sst-guard.mjs and deprecate others.`);
if (duplicates.length) suggestions_global.push(`Duplicate files by content hash found (${duplicates.length} groups). Keep one source-of-truth.`);

// merge candidates
const merge_candidates = findings
  .filter(f => Array.isArray(f.type) && f.type.some(t => /agent|sentinel|doctor/.test(t)))
  .map(f => {
    const risk = f.executes ? 'HIGH' : (f.mutates ? 'MEDIUM' : 'LOW');
    return { path: f.path, type: f.type, risk, goals: f.goals, mutates: f.mutates, executes: f.executes };
  });

// report
const report = {
  tool: 'repo-doctor:agents-sentinels',
  root: ROOT,
  started_at: new Date(started).toISOString(),
  finished_at: new Date().toISOString(),
  scanned_files: scanned,
  candidate_files: candidates,
  summary: {
    counts_by_type: typeCounts,
    agents: agentCount,
    sentinels: sentinelCount,
    duplicates: duplicates.length,
    errors: errors.length,
  },
  duplicates,
  merge_candidates,
  findings,
  suggestions_global,
  errors,
};

// output
const json = FORMAT === 'min' ? JSON.stringify(report) : JSON.stringify(report, null, 2);
if (WRITE) {
  const outDir = path.join(ROOT, '.hotdors_reports');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g,'').slice(0,14);
  const file  = OUTFILE ? path.resolve(ROOT, OUTFILE) : path.join(outDir, `agents-sentinels_${stamp}.json`);
  fs.writeFileSync(file, json, 'utf8');
  console.log(`📄 JSON report written → ${path.relative(ROOT, file)}`);
  process.stdout.write(json + (process.stdout.isTTY ? os.EOL : ''));
} else {
  process.stdout.write(json + (process.stdout.isTTY ? os.EOL : ''));
}
