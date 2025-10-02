#!/usr/bin/env node

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

function loadJSON(filepath) {
  try {
    const fullPath = path.join(process.cwd(), filepath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    console.error(`${colors.red}❌ Error loading ${filepath}:${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateSST() {
  console.log('🔍 Validating SST v3.5...\n');

  const schema = loadJSON('sst/canon/schema.json');
  const sst = loadJSON('sst/canon/v3.5.json');

  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const valid = validate(sst);

  if (valid) {
    console.log(`${colors.green}✅ SST Validation Passed${colors.reset}`);
    console.log(`   Version: ${sst.meta.version}`);
    console.log(`   Authority: ${sst.meta.authority}`);
    console.log(`   Stages: ${Object.keys(sst.visual.letterGeometry).length}`);
    console.log(`   Performance Target: ${sst.performance.frameRate.target} FPS\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ SST Validation Failed${colors.reset}\n`);
    validate.errors.forEach((error, index) => {
      console.log(`${colors.yellow}Error ${index + 1}:${colors.reset}`);
      console.log(`  Path: ${error.instancePath || 'root'}`);
      console.log(`  Issue: ${error.message}`);
      if (error.params) {
        console.log(`  Details: ${JSON.stringify(error.params)}`);
      }
      console.log();
    });
    process.exit(1);
  }
}

validateSST();
