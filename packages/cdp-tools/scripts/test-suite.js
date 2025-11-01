#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'bin/cdp.js',
  'lib/config.js',
  'lib/validation.js',
  'lib/probes.js',
  'lib/savepoints.js',
  'lib/logger.js',
  'scripts/init.js'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length) {
  console.error('Missing package files:', missing.join(', '));
  process.exit(1);
}

console.log('cdp-tools sanity test passed');
