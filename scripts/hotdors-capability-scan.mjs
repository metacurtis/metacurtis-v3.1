#!/usr/bin/env node
// HOT-DORS Capability Indexer
// Scans Canon Suite & Theater for capabilities: EVENTS, Steps/Playbooks, HUD macros,
// Agent goals, Vision contracts, Sentinel checks, Incidents, and common module exports.
// Outputs: .canon_reports/canon-capabilities.{md,json}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import fg from 'fast-glob';

const ROOT = process.cwd();
const rel  = p => path.relative(ROOT, p);
const read = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const sha8 = s => crypto.createHash('sha1').update(s).digest('hex').slice(0,8);
const outMD = path.join(ROOT, '.canon_reports/canon-capabilities.md');
const outJSON = path.join(ROOT, '.canon_reports/canon-capabilities.json');

const files = await fg([
  'canon-console/**/*.{js,jsx,mjs,cjs}',
  'src/theater/**/*.{js,jsx}',
  'src/engine/**/*.{js,jsx}',
  'src/components/webgl/**/*.{js,jsx}',
  'tools/**/*.mjs',
  'vision/**/*.json',
  'scripts/agent/**/*.mjs',
], { dot:false, absolute:true });

const cap = {
  meta: { generatedAt: new Date().toISOString() },
  events: [],                 // from src/theater/events.js
  steps: [],                  // names in runtime/steps*.js
  playbooks: [],              // names in runtime/playbooks*.js
  hudMacros: [],              // heuristics from runtime/hud.js
  agentGoals: [],             // from scripts/agent/goals/*.mjs (filename → goal)
  visionContracts: [],        // vision/*.json keys
  sentinelChecks: [],         // labels from tools/sst-guard.mjs
  incidents: [],              // strings like CANON_*, GUARD_*, SHADER_*, FPS_*, FENCEPOST_*
  modules: [],                // generic exports per file
};

const addUniq = (arr, v) => { if (!arr.includes(v)) arr.push(v); };

// --- Parsers ---------------------------------------------------------
function parseEvents(src) {
  // export const EVENTS = { FOO: 'FOO', ... }
  const m = src.match(/export\s+const\s+EVENTS\s*=\s*{([\s\S]*?)}\s*;?/);
  if (!m) return [];
  const body = m[1];
  const keys = [...body.matchAll(/([A-Z0-9_]+)\s*:/g)].map(x => x[1]);
  return keys;
}
function parseObjectKeys(src, nameCandidates = ['Steps','ExtraSteps','Playbooks','ExtraPlaybooks']) {
  const names = [];
  for (const nm of nameCandidates) {
    const m = src.match(new RegExp(`export\\s+const\\s+${nm}\\s*=\\s*{([\\s\\S]*?)}\\s*;?`));
    if (!m) continue;
    const body = m[1];
    const keys = [...body.matchAll(/([A-Za-z0-9_]+)\s*:/g)].map(x => x[1]);
    for (const k of keys) addUniq(names, `${nm}.${k}`);
  }
  return names;
}
function parseHudMacros(src) {
  // heuristic: look for functions named run*Macro or handlers wired to buttons
  const hits = [];
  const reFn = /(function\s+(run\w+Macro)\s*\(|const\s+(run\w+Macro)\s*=\s*\(|\bmacro\s*:\s*['"]?([A-Za-z0-9_ -]+)['"]?)/g;
  let m;
  while ((m = reFn.exec(src))) {
    const name = m[2] || m[3] || m[4];
    if (name) addUniq(hits, name);
  }
  // common known ones:
  if (src.includes('Fencepost') || src.includes('FENCEPOST')) addUniq(hits, 'Fencepost Report');
  if (src.includes('Verify FPS')) addUniq(hits, 'Verify FPS');
  if (src.includes('Opening Macro')) addUniq(hits, 'Run Opening Macro');
  return hits;
}
function parseAgentGoalsFromFiles(filePaths) {
  // scripts/agent/goals/<name>.mjs  →  opening:<name>
  const goals = [];
  for (const p of filePaths) {
    const base = path.basename(p).replace(/\.(mjs|js)$/, '');
    const dir = rel(path.dirname(p));
    // heuristic: if under goals/, prefix with 'opening:' unless it already looks namespaced
    if (dir.includes('scripts/agent/goals')) {
      const g = /[:]/.test(base) ? base : `opening:${base}`;
      addUniq(goals, g);
    } else {
      // inspect for "--goal=<id>" patterns
      const s = read(p);
      const matches = [...s.matchAll(/--goal\s*=\s*([A-Za-z0-9:_-]+)/g)].map(x => x[1]);
      for (const g of matches) addUniq(goals, g);
    }
  }
  return goals;
}
function parseIncidents(src) {
  const hits = [];
  const re = /\b(CANON_[A-Z0-9_]+|GUARD_[A-Z0-9_]+|SHADER_[A-Z0-9_]+|RENDER_[A-Z0-9_]+|FENCEPOST_[A-Z0-9_]+|FPS_[A-Z0-9_]+)\b/g;
  let m;
  while ((m = re.exec(src))) addUniq(hits, m[1]);
  return hits;
}
function parseExports(src) {
  const out = new Set();
  [...src.matchAll(/export\s+(?:function|const|class|let|var)\s+([A-Za-z0-9_]+)/g)].forEach(m => out.add(m[1]));
  [...src.matchAll(/export\s*{\s*([^}]+)\s*}/g)].forEach(m => {
    m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop()).forEach(n => n && out.add(n));
  });
  if (/export\s+default\s+/.test(src)) out.add('default');
  return [...out];
}
function parseVisionKeys(p) {
  try {
    const j = JSON.parse(read(p));
    const keys = Object.keys(j || {});
    return { file: rel(p), keys };
  } catch { return null; }
}
function parseSentinelChecks(src) {
  const lines = src.split(/\r?\n/);
  const labels = [];
  for (const ln of lines) {
    const m = ln.match(/(OK|X)\s+(.+?)$/);
    if (m) labels.push(m[2]);
  }
  return labels;
}

// --- Collect ----------------------------------------------------------------
let eventsParsed = false;

for (const p of files) {
  const s = read(p);
  if (!s) continue;

  // EVENTS (only parse once)
  if (!eventsParsed && /src[\/\\]theater[\/\\]events\.js$/.test(p)) {
    const evs = parseEvents(s);
    cap.events.push(...evs);
    eventsParsed = true;
  }

  // Steps/Playbooks
  if (/canon-console[\/\\]runtime[\/\\](steps|playbooks).*\.js/.test(p))
    parseObjectKeys(s).forEach(k => addUniq(cap.steps, k.includes('Steps.') ? k : k));
  if (/canon-console[\/\\]runtime[\/\\]playbooks.*\.js/.test(p))
    parseObjectKeys(s).forEach(k => addUniq(cap.playbooks, k));

  // HUD macros
  if (/canon-console[\/\\]runtime[\/\\]hud\.js$/.test(p))
    parseHudMacros(s).forEach(k => addUniq(cap.hudMacros, k));

  // Agent goals
  if (/scripts[\/\\]agent[\/\\]/.test(p))
    ; // collect paths, processed later

  // Vision contracts
  if (/vision[\/\\].*\.json$/.test(p)) {
    const v = parseVisionKeys(p);
    if (v) cap.visionContracts.push(v);
  }

  // Sentinel checks (labels)
  if (/tools[\/\\]sst-guard\.mjs$/.test(p))
    parseSentinelChecks(s).forEach(k => addUniq(cap.sentinelChecks, k));

  // Incidents
  parseIncidents(s).forEach(k => addUniq(cap.incidents, k));

  // Generic exports
  const ex = parseExports(s);
  if (ex.length) cap.modules.push({
    file: rel(p), hash: sha8(s), exports: ex
  });
}

// Agent goals pass (after loop)
const goalFiles = await fg(['scripts/agent/**/*.mjs'], { absolute:true });
parseAgentGoalsFromFiles(goalFiles).forEach(k => addUniq(cap.agentGoals, k));

// Sort for stability
const sort = a => a.sort((x,y)=> (x.name||x).toString().localeCompare((y.name||y).toString()));
sort(cap.events); sort(cap.steps); sort(cap.playbooks);
sort(cap.hudMacros); sort(cap.agentGoals); sort(cap.incidents);
cap.modules.sort((a,b)=> a.file.localeCompare(b.file));
cap.visionContracts.sort((a,b)=> a.file.localeCompare(b.file));
cap.sentinelChecks.sort();

// Write JSON
fs.writeFileSync(outJSON, JSON.stringify(cap, null, 2), 'utf8');

// Write Markdown
const md = [];
md.push(`# Canon Suite — HOT-DORS Capability Index`);
md.push(`- Generated: ${cap.meta.generatedAt}`);
md.push(``);
md.push(`## BeatBus Events (EVENTS)`);
md.push(cap.events.length ? cap.events.map(k=>`- \`${k}\``).join('\n') : '_none_');
md.push(``);
md.push(`## Steps`);
md.push(cap.steps.length ? cap.steps.map(k=>`- \`${k}\``).join('\n') : '_none_');
md.push(``);
md.push(`## Playbooks`);
md.push(cap.playbooks.length ? cap.playbooks.map(k=>`- \`${k}\``).join('\n') : '_none_');
md.push(``);
md.push(`## HUD Macros`);
md.push(cap.hudMacros.length ? cap.hudMacros.map(k=>`- ${k}`).join('\n') : '_none_');
md.push(``);
md.push(`## Agent Goals`);
md.push(cap.agentGoals.length ? cap.agentGoals.map(k=>`- \`${k}\``).join('\n') : '_none_');
md.push(``);
md.push(`## Vision Contracts`);
md.push(cap.visionContracts.length ? cap.visionContracts.map(v=>`- \`${v.file}\` → keys: ${v.keys.map(k=>`\`${k}\``).join(', ')}`).join('\n') : '_none_');
md.push(``);
md.push(`## Sentinel Checks (labels seen)`);
md.push(cap.sentinelChecks.length ? cap.sentinelChecks.map(k=>`- ${k}`).join('\n') : '_none_');
md.push(``);
md.push(`## Incidents (strings observed)`);
md.push(cap.incidents.length ? cap.incidents.map(k=>`- \`${k}\``).join('\n') : '_none_');
md.push(``);
md.push(`## Module Exports (quick surface)`);
cap.modules.forEach(m => {
  md.push(`- \`${m.file}\`  _(sha:${m.hash})_ → ${m.exports.map(e=>`\`${e}\``).join(', ')}`);
});
fs.writeFileSync(outMD, md.join('\n'), 'utf8');

console.log(`✅ Wrote:
  - ${rel(outMD)}
  - ${rel(outJSON)}`);
