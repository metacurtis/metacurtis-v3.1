#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  parseOwnershipDoc,
  scanUniformAssignments,
  scanEventEmitters,
  formatOwnershipDoc,
} from './lib/ownership.mjs';

async function main() {
  const docPath = path.resolve('docs/OWNERSHIP.md');
  let existing;
  try {
    existing = await parseOwnershipDoc(docPath);
  } catch {
    existing = { sections: { geometry: new Map() } };
  }

  const uniformSets = await scanUniformAssignments();
  const eventSets = await scanEventEmitters(['src', 'canon-console']);

  const uniforms = new Map(
    Array.from(uniformSets.entries()).map(([name, owners]) => [
      name,
      Array.from(owners).sort(),
    ])
  );

  const events = new Map(
    Array.from(eventSets.entries()).map(([event, owners]) => [
      event,
      { emitter: Array.from(owners).sort() },
    ])
  );

  const doc = formatOwnershipDoc({
    uniforms,
    geometry: existing.sections.geometry || new Map(),
    events,
    metadata: { phase: 'Phase 2 snapshot' },
  });

  await fs.mkdir(path.dirname(docPath), { recursive: true });
  await fs.writeFile(docPath, `${doc}\n`);

  console.log(
    `[generate-ownership] wrote docs/OWNERSHIP.md (${uniforms.size} uniforms, ${events.size} events)`
  );
}

main().catch((error) => {
  console.error('[generate-ownership] failed:', error);
  process.exit(1);
});
