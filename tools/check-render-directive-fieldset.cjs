#!/usr/bin/env node
/**
 * ROLE:
 *  - Phase 1 convergence check for RENDER_DIRECTIVE field set.
 *
 * INVARIANTS:
 *  - All schema-defined RENDER_DIRECTIVE fields must come from
 *    src/theater/contracts/renderDirectiveFields.js.
 *  - No schema field name may be invented locally in bus/schemas.js.
 */

const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule(p) {
  const url = pathToFileURL(p).href;
  return import(url);
}

async function main() {
  const root = path.join(__dirname, '..');
  const fieldsMod = await loadModule(path.join(root, 'src', 'theater', 'contracts', 'renderDirectiveFields.js'));
  const schemaMod = await loadModule(path.join(root, 'src', 'theater', 'bus', 'schemas.js'));

  const RENDER_DIRECTIVE_FIELDS = fieldsMod.RENDER_DIRECTIVE_FIELDS || [];
  const RENDER_DIRECTIVE_SCHEMA_FIELDS = schemaMod.RENDER_DIRECTIVE_SCHEMA_FIELDS || [];

  const contractSet = new Set(RENDER_DIRECTIVE_FIELDS);
  const schemaSet = new Set(RENDER_DIRECTIVE_SCHEMA_FIELDS);

  const missingInContract = Array.from(schemaSet).filter((field) => !contractSet.has(field));
  const missingInSchema = Array.from(contractSet).filter((field) => !schemaSet.has(field));

  console.log('🔎 RENDER_DIRECTIVE fieldset check');
  console.log('Contract fields:', RENDER_DIRECTIVE_FIELDS);
  console.log('Schema fields  :', RENDER_DIRECTIVE_SCHEMA_FIELDS);

  let failed = false;

  if (missingInContract.length > 0) {
    console.error('\n❌ Fields present in schema but missing from RENDER_DIRECTIVE_FIELDS (contract):');
    missingInContract.forEach((f) => console.error('  -', f));
    failed = true;
  }

  if (missingInSchema.length > 0) {
    console.error('\n❌ Fields present in contract (RENDER_DIRECTIVE_FIELDS) but missing from schema:');
    missingInSchema.forEach((f) => console.error('  -', f));
    failed = true;
  }

  if (failed) {
    console.error('\nFix by updating both RENDER_DIRECTIVE_FIELDS and the schema definition in src/theater/bus/schemas.js.');
    process.exit(1);
  }

  console.log('\n✅ Field sets are aligned.');
  process.exit(0);
}

main();
