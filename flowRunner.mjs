#!/usr/bin/env node
// flowRunner.mjs
// Phase-based runner: generates per-step prompts, pauses at phase boundaries for human approval.

import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = process.cwd();

async function loadJson(rel) {
  const full = path.join(ROOT, rel);
  const raw = await fs.readFile(full, 'utf8');
  return JSON.parse(raw);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function askYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return await new Promise((resolve) => {
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

function buildPrompt({ flowName, phase, step, agentDef, task }) {
  const now = new Date().toISOString();
  const invariants = Array.isArray(agentDef.invariants)
    ? agentDef.invariants.map((i) => `- ${i}`).join('\n')
    : (agentDef.invariants || '(respect existing contracts + tests)');

  return [
    `# Flow: ${flowName} · Phase: ${phase.id} – ${phase.label} · Agent ${step.agent} – ${agentDef.name}`,
    '',
    `Generated at: ${now}`,
    '',
    '---',
    '## Mission',
    agentDef.mission || '(no mission provided)',
    '',
    '## This Step',
    step.role ? `Role: ${step.role}` : '(no specific role override)',
    step.notes ? `\nNotes: ${step.notes}` : '',
    '',
    '## Task',
    task,
    '',
    '## Invariants',
    invariants,
    '',
    '## Output Expectations',
    step.output_hint || agentDef.output || '(return a clear, structured answer; diffs if needed)',
    '',
    '---',
    '## Instructions',
    '- Stay within your mission.',
    '- Do NOT assume you can apply changes directly; propose diffs/steps.',
    '- If you suggest patches, be explicit about files and tests to run.',
    '',
    '## Begin:',
    '',
  ].join('\n');
}

async function main() {
  const [, , flowName, ...rest] = process.argv;
  if (!flowName) {
    console.error('Usage: node flowRunner.mjs <flowName> [task description]');
    process.exit(1);
  }

  const task = rest.join(' ').trim() || '(no explicit task provided)';

  const agents = await loadJson('docs/agents/agents.json');
  const flows = await loadJson('docs/agents/flows.json');
  const flow = flows[flowName];

  if (!flow) {
    console.error(`Flow "${flowName}" not found.`);
    process.exit(1);
  }

  const outRoot = path.join(ROOT, 'out', 'flows', flowName);
  await ensureDir(outRoot);

  console.log(`🧭 Running flow "${flowName}"`);
  console.log(`   Task: ${task}\n`);

  for (const phase of flow.phases || []) {
    console.log(`📂 Phase "${phase.id}" – ${phase.label}`);

    for (let i = 0; i < (phase.steps || []).length; i += 1) {
      const step = phase.steps[i];
      const agentDef = agents[step.agent];
      if (!agentDef) {
        console.warn(`⚠️ Unknown agent "${step.agent}", skipping step.`);
        continue;
      }

      const idx = String(i + 1).padStart(2, '0');
      const fileName = `${phase.id}-${idx}-${step.agent}.md`;
      const outPath = path.join(outRoot, fileName);

      const prompt = buildPrompt({ flowName, phase, step, agentDef, task });
      await fs.writeFile(outPath, prompt, 'utf8');

      console.log(
        `  • Step ${idx}: Agent ${step.agent} (${agentDef.name}) → open: out/flows/${flowName}/${fileName}`
      );
      if (step.kind === 'patch') {
        console.log('    (Hint: run this in Codex / repo-aware LLM)');
      } else {
        console.log('    (Hint: run this in ChatGPT / reasoning LLM)');
      }
    }

    console.log('');
    const needsApproval = (phase.steps || []).some((s) => s.requiresApproval);
    if (needsApproval) {
      const ok = await askYesNo(
        `Phase "${phase.id}" complete. Have you reviewed outputs & applied any patches you accept?`
      );
      if (!ok) {
        console.log('⏹  Stopping flow so you can make adjustments.');
        process.exit(0);
      }
    } else {
      console.log(`Phase "${phase.id}" has no required approvals. Continuing.\n`);
    }
  }

  console.log('\n✅ Flow complete. Remember to run tests and record the pattern (Agent E).');
}

main().catch((err) => {
  console.error('Fatal error in flowRunner:', err);
  process.exit(1);
});
