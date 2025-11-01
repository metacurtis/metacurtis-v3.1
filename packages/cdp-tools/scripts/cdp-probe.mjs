#!/usr/bin/env node

import { ProbeRunner } from '../lib/probes.js';
import { Logger } from '../lib/logger.js';

const logger = new Logger();
const projectRoot = process.cwd();

const extraArgs = process.argv.slice(2);
const options = {};

extraArgs.forEach((arg, idx) => {
  if (arg === '--headless=false') options.headless = false;
  if (arg.startsWith('--url=')) options.url = arg.split('=')[1];
});

try {
  const runner = new ProbeRunner(projectRoot);
  const results = await runner.runProbes(options);
  if (results.failed > 0) {
    logger.error('Probe failures encountered');
    process.exit(1);
  }
} catch (error) {
  logger.error(error.message);
  process.exit(1);
}
