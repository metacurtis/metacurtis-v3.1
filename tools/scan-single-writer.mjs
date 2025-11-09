#!/usr/bin/env node
/* eslint-env node */
import fs from 'node:fs/promises';
import path from 'node:path';
import { walk } from './lib/walk.mjs';
import {
  parseOwnershipDoc,
  getGeometryRegex,
  hasOverride,
  normalizePath,
  isTestFile,
} from './lib/ownership.mjs';

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function buildUniformRules(uniforms) {
  return Array.from(uniforms.entries()).map(([name, owners]) => ({
    key: name,
    regex: new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.value\\s*=`, 'g'),
    allow: new Set(owners || []),
  }));
}

function buildGeometryRules(geometry) {
  return Array.from(geometry.entries()).map(([name, owners]) => ({
    key: name,
    regex: getGeometryRegex(name),
    allow: new Set(owners || []),
  }));
}

function getLineNumber(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

async function main() {
  const ownership = await parseOwnershipDoc('docs/OWNERSHIP.md');
  const uniformRules = buildUniformRules(ownership.sections.uniforms);
  const geometryRules = buildGeometryRules(ownership.sections.geometry || new Map());
  const violations = [];

  for await (const file of walk('src', CODE_EXTENSIONS)) {
    if (isTestFile(file)) continue;
    const abs = path.resolve(file);
    const rel = normalizePath(path.relative(process.cwd(), abs));
    const text = await fs.readFile(file, 'utf8');

    for (const rule of uniformRules) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(text))) {
        if (rule.allow.has(rel)) continue;
        if (hasOverride(text, match.index)) continue;
        violations.push({
          type: 'uniform',
          resource: rule.key,
          file: rel,
          line: getLineNumber(text, match.index),
        });
        break;
      }
    }

    for (const rule of geometryRules) {
      if (rule.allow.has(rel)) continue;
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(text))) {
        if (hasOverride(text, match.index)) continue;
        violations.push({
          type: 'geometry',
          resource: rule.key,
          file: rel,
          line: getLineNumber(text, match.index),
        });
        break;
      }
    }
  }

  await fs.mkdir('reports', { recursive: true });
  const outputPath = path.join('reports', 'single-writer-violations.json');
  await fs.writeFile(outputPath, JSON.stringify(violations, null, 2));

  if (violations.length) {
    console.error('[scan-single-writer] violations detected:', outputPath);
    process.exit(1);
  } else {
    console.log('[scan-single-writer] 0 violations');
  }
}

main().catch((error) => {
  console.error('[scan-single-writer] failed:', error);
  process.exit(1);
});
