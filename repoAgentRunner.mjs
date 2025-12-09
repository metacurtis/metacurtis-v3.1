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

function buildAgentPrompt({ flowName, stepIndex, task, sharedContextHint, agentId, agent, step, codeFiles }) {
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
