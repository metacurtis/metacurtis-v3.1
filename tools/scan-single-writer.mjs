#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { walk } from './lib/walk.mjs';

const PROJECT_ROOT = process.cwd();

const RULES = [
  {
    key: 'uMotionMode_write',
    pattern: /uMotionMode\s*\.value\s*=/g,
    allow: ['src/components/webgl/WebGLBackground.jsx', 'src/runtime/materialFactory.js'],
  },
  {
    key: 'uFlowTurbulence_write',
    pattern: /uFlowTurbulence\s*\.value\s*=/g,
    allow: ['src/components/webgl/WebGLBackground.jsx', 'src/runtime/materialFactory.js'],
  },
  {
    key: 'uOpacity_write',
    pattern: /uOpacity(Min|Max)\s*\.value\s*=/g,
    allow: ['src/components/webgl/WebGLBackground.jsx', 'src/runtime/materialFactory.js'],
  },
  {
    key: 'uParticleFlash_write',
    pattern: /uParticleFlash\s*\.value\s*=/g,
    allow: ['src/components/webgl/WebGLBackground.jsx', 'src/runtime/materialFactory.js'],
  },
  {
    key: 'emit_MORPH_PROGRESS',
    pattern: /BeatBus\.emit\([^)]*MORPH_PROGRESS/g,
    allow: ['src/engine/ConsciousnessEngine.js'],
  },
];

const violations = [];

const allowMatcher = (file, allowList) =>
  allowList.some((allowed) => file === allowed || file.endsWith(`/${allowed}`));

async function scan() {
  for await (const file of walk('src')) {
    const rel = path.relative(PROJECT_ROOT, path.join(PROJECT_ROOT, file));
    const contents = await fs.promises.readFile(file, 'utf8');
    RULES.forEach((rule) => {
      if (!rule.pattern.test(contents)) return;
      if (allowMatcher(rel, rule.allow)) return;
      violations.push({ rule: rule.key, file: rel });
    });
  }

  await fs.promises.mkdir(path.join(PROJECT_ROOT, 'reports'), { recursive: true });
  const outPath = path.join(PROJECT_ROOT, 'reports', 'single-writer-violations.json');
  await fs.promises.writeFile(outPath, JSON.stringify(violations, null, 2));
  if (violations.length) {
    console.error(`[scan-single-writer] violations: ${violations.length}`);
    violations.slice(0, 10).forEach((v) =>
      console.error(`  • ${v.rule} at ${v.file}`)
    );
    process.exit(1);
  } else {
    console.log('[scan-single-writer] ✅ no violations');
  }
}

scan().catch((error) => {
  console.error('[scan-single-writer] failed', error);
  process.exit(1);
});
