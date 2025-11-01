#!/usr/bin/env node

import { ValidationRunner } from '../lib/validation.js';
import { Logger } from '../lib/logger.js';

const runner = new ValidationRunner(process.cwd());
const logger = new Logger();

const result = await runner.runSpecCheck();

if (!result.passed) {
  logger.error('\nSpec validation failed');
  process.exit(1);
}
