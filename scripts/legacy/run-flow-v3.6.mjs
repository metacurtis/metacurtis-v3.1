#!/usr/bin/env node
// scripts/run-flow-v3.6.mjs
//
// Usage:
//   node scripts/run-flow-v3.6.mjs tune_opening_sequence
//
// This does NOT call any external APIs by default.
// It assembles per-step input payloads and prints them as JSON so you can
// copy/paste into ChatGPT / Codex / etc. or wire your own API calls.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function readJsonc(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  // lazy jsonc: strip // and /* */ comments
  const noLineComments = raw.replace(/\/\/.*$/gm, '');
  const noBlockComments = noLineComments.replace(/\/\*[\s\S]*?\*\//gm, '');
  return JSON.parse(noBlockComments);
}

function loadFileMap() {
  const fp = path.join(ROOT, 'docs', 'file-map.json');
  if (!fs.existsSync(fp)) {
    throw new Error(`file-map.json not found at ${fp}`);
  }
  return readJsonc(fp);
}

function loadAgents() {
  const fp = path.join(ROOT, 'docs', 'orchestration', 'agents.v3.6.jsonc');
  if (!fs.existsSync(fp)) {
    throw new Error(`agents.v3.6.jsonc not found at ${fp}`);
  }
  return readJsonc(fp);
}

function loadFlow(flowId) {
  const fp = path.join(
    ROOT,
    'docs',
    'orchestration',
    'flows',
    `${flowId}.v3.6.jsonc`,
  );
  if (!fs.existsSync(fp)) {
    throw new Error(`Flow file not found: ${fp}`);
  }
  return readJsonc(fp);
}

function resolveFilesForGroups(fileMap, groups) {
  const all = [];
  for (const g of groups) {
    const group = fileMap.groups[g];
    if (!group) {
      throw new Error(`File group '${g}' not found in file-map.json`);
    }
    for (const f of group.files) {
      if (!all.includes(f)) all.push(f);
    }
  }
  return all;
}

function buildStepInput(step, flow, fileMap, priorOutputs) {
  const context = {};
  context.humanGoal = flow.humanGoal;
  context.issueDescription = flow.issueDescription;
  context.fileGroups = flow.fileGroups;
  context.fileMap = fileMap;

  const filesCanonical = resolveFilesForGroups(fileMap, flow.fileGroups);
  context.filesCanonical = filesCanonical;

  for (const [alias, value] of Object.entries(priorOutputs)) {
    context[alias] = value;
  }

  const input = {};
  if (Array.isArray(step.inputFrom)) {
    for (const key of step.inputFrom) {
      if (key === 'fileMap') {
        input.fileMap = fileMap;
      } else if (key === 'filesCanonical') {
        input.filesCanonical = filesCanonical;
      } else if (context[key] !== undefined) {
        input[key] = context[key];
      } else {
        const parts = key.split('.');
        let ref = context;
        for (const part of parts) {
          if (ref && Object.prototype.hasOwnProperty.call(ref, part)) {
            ref = ref[part];
          } else {
            ref = undefined;
            break;
          }
        }
        if (ref !== undefined) {
          input[parts[0]] = input[parts[0]] ?? {};
          if (parts.length === 2) {
            input[parts[0]][parts[1]] = ref;
          } else {
            input[key] = ref;
          }
        }
      }
    }
  }

  return input;
}

function buildAgentPrompt(agentSpec, mode, step, inputPayload) {
  const mission =
    mode && agentSpec.modes && agentSpec.modes[mode]
      ? agentSpec.mission + ` [MODE: ${mode}]`
      : agentSpec.mission;

  const fieldsSpec =
    mode && agentSpec.modes && agentSpec.modes[mode]
      ? agentSpec.modes[mode]
      : agentSpec;

  const inputFields = fieldsSpec.inputFields || [];
  const outputFields = fieldsSpec.outputFields || [];

  return {
    system: {
      role: agentSpec.name,
      mission,
      inputFields,
      outputFields
    },
    step: {
      id: step.step,
      label: step.label,
      flowId: step.flowId || null
    },
    input: inputPayload
  };
}

function main() {
  const flowId = process.argv[2];
  if (!flowId) {
    console.error('Usage: node scripts/run-flow-v3.6.mjs <flowId>');
    process.exit(1);
  }

  const fileMap = loadFileMap();
  const agents = loadAgents();
  const flow = loadFlow(flowId);

  console.log(`\n=== Running v3.6 flow: ${flow.id} ===`);
  console.log(`Description: ${flow.description}\n`);
  console.log(`File groups: ${flow.fileGroups.join(', ')}\n`);

  const priorOutputs = {};

  for (const step of flow.steps) {
    const agentId = step.agent;
    const mode = step.mode || 'default';

    const agentSpec = agents[agentId];
    if (!agentSpec) {
      throw new Error(`Agent ${agentId} not defined in agents.v3.6.jsonc`);
    }

    const inputPayload = buildStepInput(
      step,
      flow,
      fileMap,
      priorOutputs
    );

    const prompt = buildAgentPrompt(agentSpec, mode, step, inputPayload);

    console.log('----------------------------------------');
    console.log(
      `STEP ${step.step}: ${step.label} [Agent ${agentId}${
        mode !== 'default' ? ` / ${mode}` : ''
      }]`
    );
    console.log('INPUT PAYLOAD:');
    console.log(JSON.stringify(inputPayload, null, 2));

    console.log('\nPROMPT JSON (for LLM):');
    console.log(JSON.stringify(prompt, null, 2));
    console.log('\nNOTE: Paste this into the appropriate AI (ChatGPT for A/B/D/E, repo-aware model for F).\n');

    priorOutputs[step.outputAlias] = {
      "__placeholder": true,
      "note": `Replace this with the actual JSON output from ${agentSpec.name} (${mode})`
    };
  }

  console.log('========================================');
  console.log('Flow complete (skeleton run).');
  console.log('Fill in each step output by replacing the __placeholder with real agent JSON.');
}

main();
