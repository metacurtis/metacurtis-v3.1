#!/usr/bin/env node
/**
 * ROLE:
 *  - Tiny Phase 0 guardrail to assert that the canonical SST 3.5 JSON
 *    (`sst/canon/v3.5.json`) validates against the canonical schema
 *    (`sst/canon/schema.json`).
 *
 * INVARIANTS:
 *  - Schema + JSON are treated as a PAIR ("the contract").
 *  - If this script fails, the contract is broken and must be fixed
 *    BEFORE runtime code is "updated to match reality".
 */

const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');

const ROOT = path.join(__dirname, '..');
const schemaPath = path.join(ROOT, 'sst', 'canon', 'schema.json');
const dataPath = path.join(ROOT, 'sst', 'canon', 'v3.5.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

try {
  const schema = loadJson(schemaPath);
  const data = loadJson(dataPath);

  const ajv = new Ajv({
    allErrors: true,
    strict: false, // allow partial/legacy schema while pinning ownership
  });

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    console.error('❌ SST 3.5 canonical JSON failed validation against schema.');
    console.error(`Schema: ${schemaPath}`);
    console.error(`Data  : ${dataPath}`);
    console.error('Errors:');
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }

  console.log('✅ SST 3.5 canonical JSON validates against canonical schema.');
  process.exit(0);
} catch (err) {
  console.error('❌ Error while verifying SST 3.5 canonical contract:');
  console.error(err);
  process.exit(1);
}
