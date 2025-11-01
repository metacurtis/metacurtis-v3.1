#!/usr/bin/env node

import { SavepointManager } from '../lib/savepoints.js';
import { Logger } from '../lib/logger.js';
import { ConfigManager } from '../lib/config.js';

const logger = new Logger();
const projectRoot = process.cwd();
const args = process.argv.slice(2);
const listOnly = args.includes('--list');

const savepointManager = new SavepointManager(projectRoot);

if (listOnly) {
  const savepoints = savepointManager.listSavepoints();
  if (!savepoints.length) {
    logger.info('No savepoints recorded yet.');
  } else {
    console.table(savepoints.map((s, idx) => ({
      '#': idx + 1,
      tag: s.tag,
      branch: s.branch,
      time: s.timestamp,
      auto: s.auto
    })));
  }
  process.exit(0);
}

const description = args.join(' ') || 'manual';
const config = new ConfigManager(projectRoot).loadConfig();
const prefix = config.automation?.savepoints?.prefix || 'cdp-savepoint';

savepointManager.createSavepoint(description, { prefix, auto: false });
