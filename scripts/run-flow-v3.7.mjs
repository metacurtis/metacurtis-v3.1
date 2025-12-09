#!/usr/bin/env node
// scripts/run-flow-v3.7.mjs
//
// Usage:
//   node scripts/run-flow-v3.7.mjs <flowId>
//
// This does NOT call any external APIs by default.
// It assembles per-step input payloads and prints them as JSON so you can
// copy/paste into ChatGPT / repo-aware models / local tools, or wire your own automation.
//
// v3.7 semantics:
// - Uses docs/file-map.json as the canonical spine for fileGroups → filesCanonical.
// - Uses docs/orchestration/agents.v3.7.jsonc for agent IO specs.
// - Uses docs/orchestration/flows/<flowId>.v3.7.jsonc for flow definition.
// - Supports: phase, mode, tools, model, checkpoint, commands, haltOnViolation per step.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();

function readJsonc(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
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
  const fp = path.join(ROOT, 'docs', 'orchestration', 'agents.v3.7.jsonc');
  if (!fs.existsSync(fp)) {
    throw new Error(`agents.v3.7.jsonc not found at ${fp}`);
  }
  return readJsonc(fp);
}

function loadFlow(flowId) {
  const fp = path.join(
    ROOT,
    'docs',
    'orchestration',
    'flows',
    `${flowId}.v3.7.jsonc`
  );
  if (!fs.existsSync(fp)) {
    throw new Error(`Flow file not found: ${fp}`);
  }
  return readJsonc(fp);
}

function resolveFilesForGroups(fileMap, groups) {
  const all = [];
  for (const g of groups) {
    const group = fileMap.groups?.[g];
    if (!group) {
      throw new Error(`File group '${g}' not found in file-map.json`);
    }
    const files = group.files || [];
    for (const f of files) {
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

  // make prior outputs available by alias
  for (const [alias, value] of Object.entries(priorOutputs)) {
    context[alias] = value;
  }

  const input = {};

  if (Array.isArray(step.inputFrom)) {
    for (const key of step.inputFrom) {
      if (key === 'fileMap') {
        input.fileMap = fileMap;
        continue;
      }
      if (key === 'filesCanonical') {
        input.filesCanonical = filesCanonical;
        continue;
      }
      // support nested keys such as "MetaDiagnostics.F_diagnosticFacts"
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
        if (parts.length === 1) {
          input[parts[0]] = ref;
        } else {
          const root = parts[0];
          input[root] = input[root] ?? {};
          if (parts.length === 2) {
            input[root][parts[1]] = ref;
          } else {
            // for deeper nesting, just attach under full path key
            input[key] = ref;
          }
        }
      }
    }
  }

  return input;
}

function buildAgentPrompt(agentSpec, mode, step, inputPayload) {
  const isModeed =
    mode && mode !== 'default' && agentSpec.modes && agentSpec.modes[mode];

  const mission = isModeed
    ? `${agentSpec.mission} [MODE: ${mode}]`
    : agentSpec.mission;

  const fieldsSpec = isModeed
    ? agentSpec.modes[mode]
    : agentSpec;

  const inputFields = fieldsSpec.inputFields || [];
  const outputFields = fieldsSpec.outputFields || [];

  return {
    system: {
      role: agentSpec.name,
      mission,
      mode: isModeed ? mode : 'default',
      inputFields,
      outputFields
    },
    step: {
      id: step.step,
      label: step.label,
      flowId: flow.id || null,
      phase: step.phase || null,
      agent: step.agent,
      tools: step.tools || null,
      model: step.model || null,
      checkpoint: !!step.checkpoint,
      commands: step.commands || null,
      haltOnViolation: !!step.haltOnViolation
    },
    input: inputPayload
  };
}

function printPostflightHint(flow) {
  console.log('Postflight commands (expected after patches):');
  flow.requiredPostflight.forEach((cmd) => console.log(`  - ${cmd}`));
  console.log('');
}

function main() {
  const flowId = process.argv[2];
  if (!flowId) {
    console.error('Usage: node scripts/run-flow-v3.7.mjs <flowId>');
    process.exit(1);
  }

  const fileMap = loadFileMap();
  const agents = loadAgents();
  const flow = loadFlow(flowId);

  if (!Array.isArray(flow.fileGroups) || flow.fileGroups.length === 0) {
    throw new Error(`Flow ${flowId} must define at least one fileGroup`);
  }

  console.log(`\n=== Running v3.7 flow: ${flow.id} ===`);
  console.log(`Description: ${flow.description}\n`);
  console.log(`File groups: ${flow.fileGroups.join(', ')}\n`);

  const filesCanonical = resolveFilesForGroups(fileMap, flow.fileGroups);
  console.log('Resolved canonical files:');
  filesCanonical.forEach((f) => console.log(`  - ${f}`));
  console.log('');

  if (flow.inheritedContracts) {
    console.log(`Contracts: inherited = ${flow.inheritedContracts}`);
  }
  if (Array.isArray(flow.requiredPreflight) && flow.requiredPreflight.length) {
    console.log('Preflight commands:');
    flow.requiredPreflight.forEach((cmd) => console.log(`  - ${cmd}`));
    console.log('');
  }

  const priorOutputs = {};

  for (const step of flow.steps) {
    const agentId = step.agent;
    const mode = step.mode || 'default';

    const agentSpec = agents[agentId];
    if (!agentSpec) {
      throw new Error(`Agent ${agentId} not defined in agents.v3.7.jsonc`);
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
    if (step.phase) {
      console.log(`Phase: ${step.phase}`);
    }
    if (step.tools) {
      console.log(
        `Tools: ${
          Array.isArray(step.tools) ? step.tools.join(', ') : step.tools
        }`
      );
    }
    if (step.model) {
      console.log(`Model: ${step.model}`);
    }
    console.log(`Checkpoint: ${step.checkpoint ? 'YES' : 'no'}`);
    if (Array.isArray(step.commands) && step.commands.length) {
      console.log('Suggested commands:');
      step.commands.forEach((c) => console.log(`  - ${c}`));
    }
    if (step.haltOnViolation) {
      console.log('haltOnViolation: YES (do not proceed if contracts/tests fail)');
    }
    console.log('');

    console.log('INPUT PAYLOAD:');
    console.log(JSON.stringify(inputPayload, null, 2));

    console.log('\nPROMPT JSON (for LLM or repo-aware agent):');
    console.log(JSON.stringify(prompt, null, 2));
    console.log(
      '\nNOTE: Paste this into the appropriate agent: ChatGPT/Claude for A/B/C/D/E, repo-aware model or local tools for F. Replace the corresponding outputAlias in priorOutputs with the real JSON before proceeding.'
    );

    if (step.outputAlias) {
      priorOutputs[step.outputAlias] = {
        "__placeholder": true,
        "note": `Replace this with the actual JSON output from Agent ${agentSpec.name} (${mode})`
      };
    }

    if (step.checkpoint) {
      console.log('\n*** CHECKPOINT ***');
      console.log(
        'At this phase boundary, review the agent output (and any contract/test results) before proceeding to the next step.\n'
      );
    }
  }

  if (Array.isArray(flow.requiredPostflight) && flow.requiredPostflight.length) {
    printPostflightHint(flow);
  }

  console.log('========================================');
  console.log(
    'Flow skeleton complete. To use it deterministically: for each step, run the appropriate agent/tool with the printed PROMPT JSON, then paste the resulting JSON into the corresponding outputAlias before re-running or continuing the flow.'
  );
}

main();
