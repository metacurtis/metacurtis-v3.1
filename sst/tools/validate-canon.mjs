import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const targets = [
  {
    name: 'v3.5.runtime',
    dataPath: path.join(repoRoot, 'sst/canon/v3.5.runtime.json'),
    schemaPath: path.join(repoRoot, 'sst/canon/v3.5.schema.json'),
  },
  {
    name: 'v3.3',
    dataPath: path.join(repoRoot, 'sst/canon/sst-v3.3.json'),
    schemaPath: path.join(repoRoot, 'sst/canon/sst-v3.3.schema.json'),
  },
];

const require = createRequire(import.meta.url);
const draft7MetaSchema = require('ajv/dist/refs/json-schema-draft-07.json');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addMetaSchema(draft7MetaSchema);

const readJson = (label, filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error?.message || String(error);
    throw new Error(`[${label}] Invalid JSON: ${message}`);
  }
};

let hasFailure = false;

for (const target of targets) {
  const { name, dataPath, schemaPath } = target;
  console.log(`\n🔎 Validating ${name}`);
  console.log(`   data:   ${path.relative(repoRoot, dataPath)}`);
  console.log(`   schema: ${path.relative(repoRoot, schemaPath)}`);

  let data;
  let schema;
  try {
    data = readJson(`${name} data`, dataPath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    hasFailure = true;
    continue;
  }

  try {
    schema = readJson(`${name} schema`, schemaPath);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    hasFailure = true;
    continue;
  }

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    console.log(`✅ ${name} schema validation passed`);
    continue;
  }

  hasFailure = true;
  console.error(`❌ ${name} schema validation failed`);

  const errors = validate.errors || [];
  errors.slice(0, 10).forEach((err, idx) => {
    const pointer = err.instancePath || '(root)';
    const schemaRef = err.schemaPath || '(unknown)';
    const message = err.message || 'validation error';
    console.error(`  ${idx + 1}. ${pointer} ${message} [schema: ${schemaRef}]`);
  });

  if (errors.length > 10) {
    console.error(`  … ${errors.length - 10} more error(s)`);
  }
}

if (hasFailure) {
  console.error('\n❌ Canon validation failed');
  process.exit(1);
}

console.log('\n✅ Canon validation succeeded');
