#!/usr/bin/env node
/**
 * tools/mc-pattern-from-E.mjs
 *
 * ROLE:
 *   Take the latest Agent E output for a given flow and turn it into
 *   a versioned pattern file under docs/agents/patterns/<category>/.
 *
 * USAGE:
 *   node tools/mc-pattern-from-E.mjs <flowName> <category> <slug>
 *
 * EXAMPLE:
 *   node tools/mc-pattern-from-E.mjs enable_gentle_drift opening chaos-overlay-fade
 *
 * This will:
 *   - Look for Agent E output in:
 *       out/repo-flows/<flowName>/<flowName>-*-E.md
 *       out/agents/<flowName>-*-E.md          (fallback)
 *   - Pick the latest E file
 *   - Create:
 *       docs/agents/patterns/<category>/<YYYY-MM-DD>-<category>-<slug>.md
 *   - Prepend a small metadata header and then paste Agent E content.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error('\nUsage: node tools/mc-pattern-from-E.mjs <flowName> <category> <slug>\n');
  console.error('Example:');
  console.error('  node tools/mc-pattern-from-E.mjs enable_gentle_drift opening chaos-overlay-fade\n');
  process.exit(1);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(p) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function globAgentEFiles(flowName) {
  const candidates = [];

  // Repo-aware flow outputs: out/repo-flows/<flowName>/<flowName>-*-E.md
  const repoFlowDir = path.join(ROOT, 'out', 'repo-flows', flowName);
  if (await fileExists(repoFlowDir)) {
    const entries = await fs.readdir(repoFlowDir);
    for (const name of entries) {
      if (name.startsWith(`${flowName}-`) && name.endsWith('-E.md')) {
        candidates.push(path.join(repoFlowDir, name));
      }
    }
  }

  // Non-repo flows: out/agents/<flowName>-*-E.md
  const agentsDir = path.join(ROOT, 'out', 'agents');
  if (await fileExists(agentsDir)) {
    const entries = await fs.readdir(agentsDir);
    for (const name of entries) {
      if (name.startsWith(`${flowName}-`) && name.endsWith('-E.md')) {
        candidates.push(path.join(agentsDir, name));
      }
    }
  }

  return candidates;
}

async function pickLatest(files) {
  if (files.length === 0) return null;
  const stats = await Promise.all(
    files.map(async (p) => ({ path: p, stat: await fs.stat(p) }))
  );
  stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  return stats[0].path;
}

function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  const [, , flowName, category, slug] = process.argv;
  if (!flowName || !category || !slug) {
    usageAndExit('Missing arguments.');
  }

  const EFiles = await globAgentEFiles(flowName);
  if (EFiles.length === 0) {
    console.error(
      `❌ No Agent E files found for flow "${flowName}".\n` +
      `   Expected in:\n` +
      `   - out/repo-flows/${flowName}/${flowName}-*-E.md\n` +
      `   - out/agents/${flowName}-*-E.md\n`
    );
    process.exit(1);
  }

  const latestEPath = await pickLatest(EFiles);
  const EContent = await fs.readFile(latestEPath, 'utf8');

  const date = todayISO();
  const fileName = `${date}-${category}-${slug}.md`;
  const targetDir = path.join(ROOT, 'docs', 'agents', 'patterns', category);
  const targetPath = path.join(targetDir, fileName);

  await ensureDir(targetDir);

  const header = [
    `# Agent E Pattern — ${slug.replace(/-/g, ' ')}`,
    '',
    `**Date:** ${date}`,
    `**Category:** ${category}`,
    `**Flow:** ${flowName}`,
    `**Source:** ${path.relative(ROOT, latestEPath)}`,
    '',
    '---',
    '',
  ].join('\n');

  await fs.writeFile(
    targetPath,
    `${header}\n${EContent.trimStart()}\n`,
    'utf8'
  );

  console.log('✅ Agent E pattern created:');
  console.log(`   ${path.relative(ROOT, targetPath)}`);
  console.log('');
  console.log('From Agent E output:');
  console.log(`   ${path.relative(ROOT, latestEPath)}`);
}

main().catch((err) => {
  console.error('Unexpected error in mc-pattern-from-E:', err);
  console.error(err);
  process.exit(1);
});
