#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseOwnershipDoc,
  scanUniformAssignments,
  scanEventEmitters,
} from './lib/ownership.mjs';

function normalizeList(value) {
  if (!value) return [];
  if (value instanceof Set) {
    return Array.from(value).sort();
  }
  return [...value].sort();
}

function diffOwners(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((owner) => !actualSet.has(owner));
  const extra = actual.filter((owner) => !expectedSet.has(owner));
  if (missing.length === 0 && extra.length === 0) return null;
  return { missing, extra };
}

function compareSimple(section, docMap, actualMap) {
  const issues = [];
  const docKeys = new Set(docMap.keys());
  const actualKeys = new Set(actualMap.keys());

  for (const key of actualKeys) {
    if (!docKeys.has(key)) {
      issues.push({
        section,
        key,
        type: 'missing_doc_entry',
        actual: normalizeList(actualMap.get(key)),
      });
    }
  }

  for (const key of docKeys) {
    if (!actualKeys.has(key)) {
      issues.push({
        section,
        key,
        type: 'stale_doc_entry',
        doc: docMap.get(key),
      });
    }
  }

  for (const key of docKeys) {
    if (!actualKeys.has(key)) continue;
    const docOwners = normalizeList(docMap.get(key));
    const actualOwners = normalizeList(actualMap.get(key));
    const delta = diffOwners(docOwners, actualOwners);
    if (delta) {
      issues.push({
        section,
        key,
        type: 'owner_mismatch',
        doc: docOwners,
        actual: actualOwners,
        delta,
      });
    }
  }

  return issues;
}

function compareEvents(docEvents, actualEvents) {
  const issues = [];
  const docKeys = new Set(docEvents.keys());
  const actualKeys = new Set(actualEvents.keys());

  for (const key of actualKeys) {
    if (!docKeys.has(key)) {
      issues.push({
        section: 'events',
        key,
        type: 'missing_doc_entry',
        actual: normalizeList(actualEvents.get(key)),
      });
    }
  }

  for (const key of docKeys) {
    if (!actualKeys.has(key)) {
      issues.push({
        section: 'events',
        key,
        type: 'stale_doc_entry',
        doc: docEvents.get(key),
      });
      continue;
    }
    const docOwners = normalizeList(docEvents.get(key).emitter || []);
    const actualOwners = normalizeList(actualEvents.get(key));
    const delta = diffOwners(docOwners, actualOwners);
    if (delta) {
      issues.push({
        section: 'events',
        key,
        type: 'owner_mismatch',
        doc: docOwners,
        actual: actualOwners,
        delta,
      });
    }
  }

  return issues;
}

async function main() {
  const docPath = path.resolve('docs/OWNERSHIP.md');
  const ownership = await parseOwnershipDoc(docPath);
  const uniformActual = await scanUniformAssignments();
  const eventActual = await scanEventEmitters(['src', 'canon-console']);

  const issues = [
    ...compareSimple('uniforms', ownership.sections.uniforms, uniformActual),
    ...compareEvents(ownership.sections.events, eventActual),
  ];

  await fs.mkdir('reports', { recursive: true });
  const outputPath = path.join('reports', 'ownership-compliance.json');
  await fs.writeFile(outputPath, JSON.stringify(issues, null, 2));

  if (issues.length) {
    console.error(
      `[validate-ownership] Detected ownership drift. See ${outputPath}`
    );
    process.exit(1);
  }

  console.log('[validate-ownership] Ownership map matches current code');
}

main().catch((error) => {
  console.error('[validate-ownership] failed:', error);
  process.exit(1);
});
