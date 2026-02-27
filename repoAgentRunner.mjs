#!/usr/bin/env node
/**
 * repoAgentRunner.mjs
 * Phase 1 – Repo-aware prompt generator for multi-agent flows.
 *
 * USAGE:
 *   node repoAgentRunner.mjs <flowName> "<task>" <file1> <file2> ...
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadJson(relPath) {
  const fullPath = path.join(__dirname, relPath);
  const raw = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(raw);
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error('\nUsage: node repoAgentRunner.mjs <flowName> "<task>" <file1> <file2> ...\n');
  process.exit(1);
}

async function readFiles(filePaths) {
  const out = [];
  for (const rel of filePaths) {
    const full = path.join(__dirname, rel);
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile()) {
        console.warn(`⚠️ Skipping ${rel}: not a file`);
        continue;
      }
      const content = await fs.readFile(full, 'utf8');
      out.push({ relPath: rel, content });
    } catch (err) {
      console.warn(`⚠️ Could not read ${rel}: ${err.message}`);
    }
  }
  return out;
}

function buildAgentPrompt({ flowName, stepIndex, task, sharedContextHint, agentId, agent, step# Canon 3.5 Runtime Drift Audit  
**Artifact Type:** Postmortem / Canon Archaeology  
**Location:** `docs/orchestration/postmortems/canon35_runtime_drift_audit.md`  
**Role:** Agent E (Historian)  
**Scope:** Frozen historical record of a completed Canon 3.5 stabilization effort  
**Status:** Complete

---

## Overview

This document captures the stabilization of the Canon 3.5 orchestration layer after extended runtime says drift, silent failures, and architectural ambiguity. The goal of the effort was **determinism**, not feature expansion.

All findings below are derived from:
- Runtime console logs and guard violations
- Schema failures and validation errors
- Code diffs applied during stabilization
- Explicit verification commands (`rg`, `npm run canon:validate`, runtime taps)

This document does **not** propose new work.

---

## 1) Root Cause Ledger (Frozen)

### A. Contract Mismatches

**1. MORPH_PROGRESS payload drift**
- **Files:**  
  - `src/theater/bus/schemas.js`  
  - `canon-console/runtime/contracts/registry.js`
- **Lines:** ~60–90 (schemas), registry MORPH_PROGRESS entry
- **Symptom:**  
  - Repeated runtime error: `Canon violation: MORPH_PROGRESS missing value`
- **Why dangerous:**  
  - Event accepted by some listeners and rejected by others → split-brain morph state
- **Detection:**  
  - Runtime logs + schema middleware errors

**2. STAGE_CHANGE payload inconsistency**
- **Files:**  
  - `src/theater/bus/schemas.js`  
  - `src/theater/bus/emitters.js`  
  - `src/contracts/OptimizedContracts.js`
- **Lines:** ~50–80
- **Symptom:**  
  - Schema violations when payload used `{stage}` instead of `{from,to}`
- **Why dangerous:**  
  - Stage transitions intermittently dropped; Director and consumers desynced
- **Detection:**  
  - Schema middleware failures + grep of emitters

---

### B. Multi-Writer Violations

**3. Multiple RENDER_DIRECTIVE emitters**
- **Files:**  
  - `src/theater/ScrollOrchestrator.js`  
  - `src/components/narrative/NarrationController.jsx`
- **Lines:** ~420–460 (Scroll), ~640–700 (Narration)
- **Symptom:**  
  - `SINGLE_WRITER_VIOLATION: RENDER_DIRECTIVE`
- **Why dangerous:**  
  - Competing visual instructions overwrite each other nondeterministically
- **Detection:**  
  - BeatBus guard throws + runtime stack traces

**4. Multiple MORPH_PROGRESS writers**
- **Files:**  
  - `src/theater/ScrollOrchestrator.js`  
  - `src/theater/controllers/MorphAnimationController.js`
- **Lines:** ~200–260
- **Symptom:**  
  - `Pattern S violation: MORPH_PROGRESS emitted from ScrollOrchestrator`
- **Why dangerous:**  
  - Morph animation driven by two clocks → jitter, resets, stalls
- **Detection:**  
  - Pattern-S guard throws at runtime

---

### C. Dead Execution Paths

**5. Beat sheets not driving visuals**
- **Files:**  
  - `src/theater/TheaterDirector.js`
- **Lines:** ~650–740 (pre-fix)
- **Symptom:**  
  - Beats fired; visuals unchanged
- **Why dangerous:**  
  - Canon intent silently ignored
- **Detection:**  
  - Logs showed beat firing without any downstream visual directives

**6. Opening choreography never executed**
- **Files:**  
  - `src/theater/TheaterDirector.js`
- **Lines:** `_runVisualSchedule` stub (~1100)
- **Symptom:**  
  - Canon `opening.timeline` defined but never run
- **Why dangerous:**  
  - Genesis demo relied on gating hacks instead of canon
- **Detection:**  
  - Grep + runtime absence of opening logs

---

### D. Missing Consumers

**7. Visual verbs resolved but not translated**
- **Files:**  
  - `src/config/canonical/canonicalAuthority.js`
- **Lines:** ~280–330
- **Symptom:**  
  - Verbs resolved but produced no uniform changes
- **Why dangerous:**  
  - Label-only verbs gave illusion of behavior
- **Detection:**  
  - Visual stagnation + later enforced runtime errors

---

### E. Canon Structural Faults

**8. Duplicate top-level canon keys**
- **Files:**  
  - `sst/canon/v3.5.json`
- **Lines:** ~multiple (pre-fix)
- **Symptom:**  
  - Narrative overlay/typewriter config missing at runtime
- **Why dangerous:**  
  - JSON silently overwrote earlier blocks
- **Detection:**  
  - Manual inspection + later automated guard

---

## 2) Ranked Fix Backlog (Historical Order)

### 1. Contract Alignment
- **Objective:** Stop silent event drops
- **Files touched:** schemas, registry, emitters
- **Success criteria:** No schema violations for MORPH_PROGRESS/STAGE_CHANGE
- **If skipped:** All downstream fixes unreliable

### 2. Single-Writer Enforcement
- **Objective:** Enforce one writer per core event
- **Files touched:** ScrollOrchestrator, NarrationController, BeatBus
- **Success criteria:** Guard throws on violation
- **If skipped:** Nondeterministic rendering

### 3. Beat-Driven Visual Scheduling
- **Objective:** Beats invoke visuals
- **Files touched:** TheaterDirector
- **Success criteria:** `applyVerb` called per beat
- **If skipped:** Canon beats remain inert

### 4. Canon Opening Choreography
- **Objective:** Execute `opening.timeline`
- **Files touched:** TheaterDirector, VisualOrchestrator
- **Success criteria:** Ordered opening verbs + single ENABLE_SCROLL
- **If skipped:** Genesis depends on hacks

### 5. Verb → Uniform Translation
- **Objective:** Eliminate label-only verbs
- **Files touched:** visualEffects.js, canonicalAuthority
- **Success criteria:** Missing mappings throw in dev
- **If skipped:** Visual drift returns silently

### 6. Canon Structural Integrity
- **Objective:** Prevent JSON overwrites
- **Files touched:** v3.5.json, validation script
- **Success criteria:** `npm run canon:validate` passes
- **If skipped:** Runtime config loss

---

## 3) Do-Not-Regress Invariants

- VisualOrchestrator is the **sole** RENDER_DIRECTIVE writer
- MorphAnimationController is the **sole** MORPH_PROGRESS writer
- MORPH_PROGRESS payload shape is `{ progress }` only
- STAGE_CHANGE payload shape is `{ from, to, source }` only
- Stage authority is singular (UnifiedNavigation / StateCommands)
- ScrollOrchestrator is events-only (no directives, no morph, no stage)
- Canon must not contain duplicate top-level keys
- Visual verbs without uniform mappings must fail loudly in dev

---

## 4) Trace / Verification Plan Template

### Enable Logs
- BeatBus schema middleware
- Pattern-S guard
- BeatScheduler applyVerb failures

### Success Signals
- No schema violations during normal flow
- Single ENABLE_SCROLL after opening
- Missing verb mappings throw explicit errors
- No multi-writer guard violations

### Partial Regression Signals
- Beats fire but visuals unchanged
- Opening runs but no handoff
- Stage transitions occur without Director response

### Silent Failure Modes (if guards removed)
- JSON overwrites in canon
- Label-only verbs reintroduced
- Multiple emitters for core events

---

## End of Artifact
, codeFiles }) {
  const now = new Date().toISOString();
  const mission = agent.mission || '';
  const invariants = Array.isArray(agent.invariants)
    ? agent.invariants.map((x) => `- ${x}`).join('\n')
    : (agent.invariants || '');
  const inputHint = agent.input || '';
  const outputHint = step.output_hint || agent.output || '';
  const stepRole = step.role || '';
  const stepNotes = step.notes || '';

  const codeSections = codeFiles
    .map((f) => [
      `### File: ${f.relPath}`,
      '',
      '```',
      f.content,
      '```',
      ''
    ].join('\n'))
    .join('\n');

  return [
    `# Agent ${agentId} – ${agent.name}`,
    '',
    `Flow: ${flowName} · Step ${stepIndex}`,
    `Generated at: ${now}`,
    '',
    '---',
    '## Mission',
    mission || '(no mission provided)',
    '',
    '## Invariants',
    invariants || '(no special invariants beyond existing repo contracts and tests.)',
    '',
    '## This Step',
    stepRole ? `Role for this step: ${stepRole}` : '(no specific role beyond mission)',
    stepNotes ? `\nNotes for this step: ${stepNotes}` : '',
    '',
    '## Task',
    `"${task}"`,
    '',
    '## High-Level Context',
    sharedContextHint,
    '',
    '## Code Context (from repo)',
    codeSections || '(no code files were provided)',
    '',
    '## Your Input Expectations',
    inputHint || '(Use the task + context + code above.)',
    '',
    '## Your Output Expectations',
    outputHint || '(Return a clear, structured answer, and if applicable, code diffs or commands.)',
    '',
    '---',
    '## Instructions',
    '- Stay within your mission and invariants.',
    '- Respect existing contracts (schema, Canon, tests, single-writer).',
    '- If you propose code changes, show them as diffs or full snippets.',
    '- If you rely on behavior from other files not shown, state your assumptions.',
    '',
    '## Begin your reasoning and output below:',
    ''
  ].join('\n');
}

async function main() {
  const [,, flowName, task, ...fileArgs] = process.argv;
  if (!flowName) usage('Missing flowName.');
  if (!task) usage('Missing task description.');
  if (!fileArgs.length) usage('Need at least one file path.');

  const agents = await loadJson('docs/agents/agents.json');
  const flows = await loadJson('docs/agents/flows.json');

  const flow = flows[flowName];
  if (!flow) {
    console.error(`Flow "${flowName}" not found in docs/agents/flows.json.`);
    console.error('Available flows:', Object.keys(flows).join(', ') || '(none)');
    process.exit(1);
  }

  const codeFiles = await readFiles(fileArgs);
  if (!codeFiles.length) {
    console.error('No readable files were provided. Nothing to do.');
    process.exit(1);
  }

  const outDir = path.join(__dirname, 'out', 'repo-flows', flowName);
  await ensureDir(outDir);

  console.log(`🧭 Repo-aware flow "${flowName}"`);
  console.log(`Task: "${task}"`);
  console.log(`Files:`);
  codeFiles.forEach((f) => console.log(`  - ${f.relPath}`));
  console.log('');

  let sharedContextHint = `Task: ${task}\nFlow: ${flowName}\nIncluded files:\n` +
    codeFiles.map((f) => `- ${f.relPath}`).join('\n');

  const summaries = [];

  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const agentId = step.agent;
    const agent = agents[agentId];
    if (!agent) {
      console.warn(`⚠️ Unknown agent "${agentId}" in flow; skipping step ${i + 1}`);
      continue;
    }

    const stepIndex = String(i + 1).padStart(2, '0');
    const fileBase = `${flowName}-${stepIndex}-${agentId}`;
    const outFile = path.join(outDir, `${fileBase}.md`);

    const prompt = buildAgentPrompt({
      flowName,
      stepIndex,
      task,
      sharedContextHint,
      agentId,
      agent,
      step,
      codeFiles
    });

    await fs.writeFile(outFile, prompt, 'utf8');
    console.log(`Step ${stepIndex}: Agent ${agentId} (${agent.name}) → out/repo-flows/${flowName}/${fileBase}.md`);

    summaries.push({ stepIndex, agentId, name: agent.name, file: `out/repo-flows/${flowName}/${fileBase}.md` });

    sharedContextHint += `\n---\nAgent ${agentId} (${agent.name}) has completed step ${stepIndex}.`;
  }

  console.log('\n✅ Repo-aware flow prompts generated.');
  console.log('Summary:');
  summaries.forEach((s) => {
    console.log(`[${s.stepIndex}] Agent ${s.agentId} (${s.name}) → ${s.file}`);
  });
}

main().catch((err) => {
  console.error('Unexpected error in repoAgentRunner:', err);
  process.exit(1);
});
