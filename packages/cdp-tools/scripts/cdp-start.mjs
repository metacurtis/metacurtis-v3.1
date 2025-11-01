#!/usr/bin/env node

import { SavepointManager } from '../lib/savepoints.js';
import { ValidationRunner } from '../lib/validation.js';
import { ConfigManager } from '../lib/config.js';
import { Logger } from '../lib/logger.js';
import { ensureGitAvailable, currentBranch } from '../lib/git-utils.js';
import { spawnSync } from 'child_process';

const logger = new Logger();
const projectRoot = process.cwd();
const args = process.argv.slice(2);
const targetBranch = args.find((arg) => !arg.startsWith('--'));
const passThrough = args.filter((arg) => arg.startsWith('--'));

ensureGitAvailable(projectRoot);

if (targetBranch) {
  logger.info(`🏷 Switching to branch ${targetBranch}...`);
  spawnSync('git', ['checkout', '-B', targetBranch], { cwd: projectRoot, stdio: 'inherit' });
}

const savepointManager = new SavepointManager(projectRoot);
const config = new ConfigManager(projectRoot).loadConfig();
const skipSavepoint = passThrough.includes('--no-savepoint') || !config.automation?.savepoints?.enabled;
const prefix = config.automation?.savepoints?.prefix || 'cdp-savepoint';
if (!skipSavepoint) {
  const tag = savepointManager.createSavepoint('session start', { prefix, auto: true });
  logger.info(`📌 Savepoint captured: ${tag}`);
} else {
  logger.warn('⚠️ Savepoint creation skipped (--no-savepoint)');
}

const validator = new ValidationRunner(projectRoot);
await validator.runSpecCheck();

logger.info(`
✅ Ready on branch ${currentBranch(projectRoot)}
Use npm run cdp:validate as you iterate.
`);
