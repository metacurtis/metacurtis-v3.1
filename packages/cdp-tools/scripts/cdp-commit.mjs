#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import { ValidationRunner } from '../lib/validation.js';
import { ProbeRunner } from '../lib/probes.js';
import { Logger } from '../lib/logger.js';
import { stagedFiles } from '../lib/git-utils.js';

const logger = new Logger();
const message = process.argv.filter((arg) => !arg.startsWith('--'))[2];
const skipAll = process.argv.includes('--skip-all');
const skipProbes = process.argv.includes('--skip-probes');

if (!message) {
  logger.error('Commit message required');
  process.exit(1);
}

const projectRoot = process.cwd();

if (!skipAll) {
  const validator = new ValidationRunner(projectRoot);
  const spec = await validator.runSpecCheck();
  if (!spec.passed) {
    logger.error('\n❌ Spec validation failed. Aborting commit.');
    process.exit(1);
  }
}

if (!skipAll && !skipProbes) {
  const probeRunner = new ProbeRunner(projectRoot);
  const probes = await probeRunner.runProbes();
  if (probes.failed > 0) {
    logger.error('\n❌ Probe validation failed. Aborting commit.');
    process.exit(1);
  }
}

let visualRecommendation = 'NOT TRIGGERED';
try {
  const config = JSON.parse(fs.readFileSync('.cdp/config.json', 'utf-8'));
  const triggers = config.visualTests?.mandatoryTriggers || [];
  const files = stagedFiles(projectRoot);
  const shouldRun = files.some((file) => triggers.some((pattern) => globMatch(pattern, file)));
  if (shouldRun) {
    visualRecommendation = 'RECOMMENDED';
    logger.warn('\n⚠️  Visual test recommended (trigger patterns matched)');
  }
} catch {
  logger.warn('⚠️  Could not evaluate visual test triggers');
}

const metadata = `\n\nCDP Metadata:\n- Spec validation: ${skipAll ? 'SKIPPED' : 'PASS'}\n- Probes: ${skipAll ? 'SKIPPED' : skipProbes ? 'SKIPPED' : 'PASS'}\n- Visual tests: ${visualRecommendation}`;

try {
  execSync(`git commit -m "${message}${metadata}"`, { stdio: 'inherit' });
  logger.success('\n✅ CDP commit successful');
} catch (error) {
  logger.error('\n❌ Commit failed');
  process.exit(1);
}

function globMatch(pattern, file) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`).test(file);
}
