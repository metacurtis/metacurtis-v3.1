#!/usr/bin/env node

import { SavepointManager } from '../lib/savepoints.js';
import { Logger } from '../lib/logger.js';

const logger = new Logger();
const projectRoot = process.cwd();
const args = process.argv.slice(2);

const savepointManager = new SavepointManager(projectRoot);
const list = savepointManager.listSavepoints();

if (!list.length) {
  logger.warn('No savepoints available.');
  process.exit(0);
}

let targetTag;
if (args.includes('--last')) {
  targetTag = list[list.length - 1].tag;
} else {
  targetTag = args[0];
}

if (!targetTag) {
  logger.error('Specify a savepoint tag or use --last');
  process.exit(1);
}

try {
  savepointManager.rollbackToSavepoint(targetTag);
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}
