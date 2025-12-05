#!/usr/bin/env node
/**
 * repoAgentRunner.mjs
 * Phase 1 – Read-only repo-aware agent runner.
 *
 * ROLE:
 * - Reads agents.json and flows.json
 * - Reads actual repo files you specify
 * - Generates per-step prompts that include:
 *    - Agent mission + invariants
 *    - Flow step role/notes
 *    - Your task description
 *    - Code context from the repo
 *
 * USAGE:
 *   node repoAgentRunner.mjs <flowName> "<task description>" <file1> <file2> ...
 *
 * EXAMPLE:
 *   node repoAgentRunner.mjs enable_gentle_drift \
 *     "Wire gentle_drift/perlin_drift end-to-end" \
 *     src/config/canonical/canonicalAuthority.js \
 *     src/theater/visual/visualEffectSpecs.js \
 *     src/theater/visual/visualCompiler.js \
 *     src/components/webgl/WebGLBackground.jsx \
 *     src/shaders/templates/consciousness-vertex.glsl
 *
 * OUTPUT:
 *   out/repo-flows/<flowName>/<flowName>-<stepIndex>-<Agent>.md
 *   (paste those into ChatGPT step-by-step)
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

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error('\nUsage: node repoAgentRunner.mjs <flowName> "<task description>" <file1> <file2> ...\n');
  console.error('Example:');
  console.error('  node repoAgentRunner.mjs enable_gentle_drift "Wire gentle_drift" src/config/canonical/canonicalAuthority.js src/theater/visual/visualEffectSpecs.js src/components/webgl/WebGLBackground.jsx src/shaders/templates/consciousness-vertex.glsl\n');
  process.exit(1);
}

async function readFiles(filePaths) {
  const results = [];

  for (const rel of filePaths) {
    const fullPath = path.join(__dirname, rel);
    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) {
        console.warn(`⚠️  Skipping ${rel}: not a regular file.`);
        continue;
      }
      const content = await fs.readFile(fullPath, 'utf8');
      results.push({ relPath: rel, content });
    } catch (err) {
      console.warn(`⚠️  Could not read ${rel}: ${err.message}`);
    }
  }

  return results;
}

async function main() {
  const [,, flowName, ...rest] = process.argv;
  if (!flowName) usageAndExit('Missing flowName.');

  if (rest.length === 0) usageAndExit('Missing task description and files.');

  // First argument after flowName is the task (shell already joined quoted string)
  const task = rest[0];
  const filePaths = rest.slice(1);

  if (!task || filePaths.length === 0) {
    usageAndExit('Need both a task description and at least one file path.');
  }

  const agentsPath = 'docs/agents/agents.json';
  const flowsPath = 'docs/agents/flows.json';

  let agents, flows;
  try {
    agents = await loadJson(agentsPath);
  } catch (err) {
    console.error(`Failed to load ${agentsPath}:`, err.message);
    process.exit(1);
  }

  try {
    flows = await loadJson(flowsPath);
  } catch (err) {
    console.error(`Failed to load ${flowsPath}:`, err.message);
    process.exit(1);
  }

  const flow = flows[flowName];
  if (!flow) {
    console.error(`Flow "${flowName}" not found in ${flowsPath}.`);
    console.error('Available flows:', Object.keys(flows).join(', ') || '(none)');
    process.exit(1);
  }

  const codeFiles = await readFiles(filePaths);
  if (codeFiles.length === 0) {
    console.error('No readable files were provided. Nothing to do.');
    process.exit(1);
  }

  const outDir = path.join(__dirname, 'out', 'repo-flows', flowName);
  await ensureDir(outDir);

  console.log(`🧭 Repo-aware flow "${flowName}" for task:`);
  console.log(`  "${task}"\n`);
  console.log(`📄 Including code context from ${codeFiles.length} file(s):`);
  for (const f of codeFiles) {
    console.log(`  - ${f.relPath}`);
  }
  console.log();

  let sharedContextHint =
    `Task: ${task}\n\nFlow: ${flowName}\n\nIncluded files:\n` +
    codeFiles.map((f) => `- ${f.relPath}`).join('\n');

  const stepSummaries = [];

  for (let i = 0; i < flow.steps.length; i += 1) {
    const step = flow.steps[i];
    const agentId = step.agent;
    const agent = agents[agentId];

    if (!agent) {
      console.warn(`⚠️  Step ${i + 1} references unknown agent "${agentId}". Skipping.`);
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
      codeFiles,
    });

    await fs.writeFile(outFile, prompt, 'utf8');

    console.log(`Step ${stepIndex}: Agent ${agentId} (${agent.name})`);
    console.log(`  → Prompt written to: out/repo-flows/${flowName}/${fileBase}.md\n`);

    stepSummaries.push({
      index: stepIndex,
      agentId,
      agentName: agent.name,
      file: `out/repo-flows/${flowName}/${fileBase}.md`,
      role: step.role || '',
    });

    sharedContextHint += `\n---\nAgent ${agentId} (${agent.name}) processed this step.\n`;
  }

  console.log('✅ Repo-aware flow prompts generated.\n');
  console.log('Next steps:');
  console.log(`  1. Open the generated prompt files in out/repo-flows/${flowName}`);
  console.log('  2. Paste each prompt into ChatGPT (or Codex), one agent at a time, in order.\n');

  console.log('Summary:');
  stepSummaries.forEach((s) => {
    console.log(
      `[${s.index}] Agent ${s.agentId} (${s.agentName}) – ${s.role || 'no explicit role'}\n` +
      `    → ${s.file}`
    );
  });
}

function buildAgentPrompt({
  flowName,
  stepIndex,
  task,
  sharedContextHint,
  agentId,
  agent,
  step,
  codeFiles,
}) {
  const now = new Date().toISOString();
  const mission = agent.mission || '';
  const invariants = Array.isArray(agent.invariants)
    ? agent.invariants.join('\n- ')
    : (agent.invariants || '');
  const inputHint = agent.input || '';
  const outputHint = agent.output || '';
  const stepRole = step.role || '';
  const stepNotes = step.notes || '';
  const stepOutputHint = step.output_hint || '';

  const codeSections = codeFiles
    .map((f) =>
      [
        `### File: ${f.relPath}`,
        '',
        f.content,
        '',
        '',
      ].join('\n')
    )
    .join('\n');

  return [
    `You are Agent ${agentId} – ${agent.name}.`,
    '',
    `Flow: ${flowName} · Step ${stepIndex}`,
    `Generated at: ${now}`,
    '',
    '---',
    '## Mission',
    mission || '(no mission provided)',
    '',
    '## Invariants',
    invariants
      ? '- ' + invariants
      : '(no special invariants beyond existing repo contracts and tests.)',
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
    stepOutputHint || outputHint || '(Return a clear, structured answer, and if applicable, code diffs or commands.)',
    '',
    '---',
    '## Instructions',
    '- Stay within your mission and invariants.',
    '- Respect existing contracts (schema, Canon, tests, single-writer).',
    '- If you propose code changes, show them as diffs or full snippets.',
    '- If you rely on behavior from other files not shown, state your assumptions.',
    '',
    '## Begin your reasoning and output below:',
    '',
  ].join('\n');
}

// Run
main().catch((err) => {
  console.error('Unexpected error in repoAgentRunner:', err);
  process.exit(1);
});
