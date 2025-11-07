#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const outDir = 'reports';
mkdirSync(outDir, { recursive: true });

const sst = JSON.parse(readFileSync('sst/canon/v3.5.json', 'utf8'));

const extract = {
  timestamp: new Date().toISOString(),
  stages: sst.stages || {},
  opening: sst.narrative?.opening || {},
  performance: sst.performance || {},
  visual: sst.visual || {}
};

writeFileSync(join(outDir, 'sst-extract.json'), JSON.stringify(extract, null, 2));
console.log(`[sst-extract] Extracted SST → reports/sst-extract.json`);
