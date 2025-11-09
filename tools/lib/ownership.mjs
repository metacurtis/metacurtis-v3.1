import fs from 'node:fs/promises';
import path from 'node:path';
import { walk } from './walk.mjs';

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs']);

const OWNERSHIP_SECTIONS = ['uniforms', 'geometry', 'events'];

const MULTI_FLAG = '⚠️';

const GEOMETRY_PATTERNS = {
  bind: /(setDrawRange\s*\(|setAttribute\s*\(|bindBuffer\s*\(|new\s+THREE\.(?:Buffer|Instanced)BufferGeometry)/,
};

const OVERRIDE_TOKEN = 'OWNERSHIP_OVERRIDE';

export function normalizePath(file) {
  return file.replace(/\\/g, '/');
}

function relativePath(file) {
  return normalizePath(path.relative(process.cwd(), file));
}

export function isTestFile(file) {
  const normalized = normalizePath(file);
  return (
    normalized.includes('__tests__/') ||
    /\.test\./.test(normalized) ||
    /\.spec\./.test(normalized) ||
    normalized.includes('tests/visual/')
  );
}

export async function parseOwnershipDoc(docPath = 'docs/OWNERSHIP.md') {
  const sections = {
    uniforms: new Map(),
    geometry: new Map(),
    events: new Map(),
  };

  const raw = await fs.readFile(docPath, 'utf8');
  let current = null;
  raw.split(/\r?\n/).forEach((lineRaw) => {
    const line = lineRaw.trim();
    if (!line) return;
    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      const label = sectionMatch[1].toLowerCase();
      current = OWNERSHIP_SECTIONS.includes(label) ? label : null;
      return;
    }
    if (!current) return;
    if (!line.includes('=')) return;
    const [lhs, rhsRaw] = line.split('=', 2);
    const key = lhs.trim();
    const rhs = rhsRaw.trim();
    if (!key || !rhs) return;
    const owners =
      rhs.startsWith(MULTI_FLAG) && rhs.includes(':')
        ? rhs
            .split(':')
            .slice(1)
            .join(':')
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
        : rhs.split(',').map((part) => part.trim()).filter(Boolean);

    if (current === 'events') {
      if (!/^[A-Z0-9:_-]+(?:\.[a-z]+)?$/.test(key)) return;
      const [eventName, attribute = 'emitter'] = key.split('.');
      if (!eventName) return;
      const entry = sections.events.get(eventName) || {};
      entry[attribute] = owners;
      sections.events.set(eventName, entry);
      return;
    }

    sections[current].set(key, owners);
  });

  return { raw, sections };
}

export async function scanUniformAssignments(root = 'src') {
  const uniforms = new Map();
  const uniformRegex = /u[A-Z][A-Za-z0-9_]*\.value\s*=/g;
  for await (const file of walk(root, CODE_EXTENSIONS)) {
    if (isTestFile(file)) continue;
    const abs = path.resolve(file);
    const rel = relativePath(abs);
    const text = await fs.readFile(file, 'utf8');
    let match;
    while ((match = uniformRegex.exec(text))) {
      const fullMatch = match[0];
      const nameMatch = fullMatch.match(/(u[A-Za-z0-9_]+)\.value/);
      if (!nameMatch) continue;
      const uniformName = nameMatch[1];
      if (!uniforms.has(uniformName)) uniforms.set(uniformName, new Set());
      uniforms.get(uniformName).add(rel);
    }
  }
  return uniforms;
}

export async function scanEventEmitters(roots = ['src']) {
  const events = new Map();
  const eventRegex =
    /BeatBus(?:\?\.)?\.?emit(?:\?\.)?\(\s*(?:EVENTS\.([A-Z0-9:_-]+)|['"`]([A-Z0-9:_-]+)['"`])/g;
  const list = Array.isArray(roots) ? roots : [roots];
  for (const root of list) {
    if (!root) continue;
    try {
      await fs.access(root);
    } catch {
      continue;
    }
    for await (const file of walk(root, CODE_EXTENSIONS)) {
      if (isTestFile(file)) continue;
      const abs = path.resolve(file);
      const rel = relativePath(abs);
      const text = await fs.readFile(file, 'utf8');
      let match;
      while ((match = eventRegex.exec(text))) {
        const eventName = match[1] || match[2];
        if (!eventName) continue;
        if (!events.has(eventName)) events.set(eventName, new Set());
        events.get(eventName).add(rel);
      }
    }
  }
  return events;
}

export function formatOwners(owners) {
  if (!owners || owners.length === 0) return '';
  if (owners.length === 1) return owners[0];
  return `${MULTI_FLAG} multiple: ${owners.join(', ')}`;
}

export function formatOwnershipDoc({ uniforms, geometry, events, metadata }) {
  const day = metadata?.date ?? new Date().toISOString().split('T')[0];
  const phase = metadata?.phase ?? 'Phase 2 snapshot';

  const lines = [
    '# MetaCurtis Single-Writer Ownership Map v2.0',
    `_Pattern S – ${phase}_`,
    '',
    'This file is machine-readable. Scanners treat it as the source of truth.',
    '',
    '---',
    '',
    '## GPU Uniforms',
    '[uniforms]',
  ];

  const sortedUniforms = Array.from(uniforms.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  sortedUniforms.forEach(([name, ownersList]) => {
    lines.push(`${name} = ${formatOwners(ownersList)}`);
  });

  lines.push(
    '',
    '### Rules',
    '- Owners are the only files allowed to assign `.value` on these uniforms.',
    '- Non-owners must emit `RENDER_DIRECTIVE` and let the renderer apply values.',
    '- Use `// OWNERSHIP_OVERRIDE: reason` on the violating line only for emergency bypasses.',
    '',
    '### Escape hatches',
    "- Tests are auto-excluded (`*.test.*`, `*.spec.*`, `__tests__/**`).",
    '- Inline override: `// OWNERSHIP_OVERRIDE: reason`.',
    '',
    '---',
    '',
    '## Geometry & Buffer Operations',
    '[geometry]'
  );

  const sortedGeom = Array.from((geometry ?? new Map()).entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  sortedGeom.forEach(([name, ownersList]) => {
    lines.push(`${name} = ${formatOwners(ownersList)}`);
  });

  lines.push(
    '',
    '### Includes',
    '- `setDrawRange`, `setAttribute`, `bindBuffer`, `new THREE.BufferGeometry`, `new THREE.InstancedBufferGeometry`.',
    '',
    '---',
    '',
    '## Event Emitters',
    '[events]'
  );

  const sortedEvents = Array.from(events.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  sortedEvents.forEach(([eventName, attrs]) => {
    const emitterOwners = attrs.emitter ?? [];
    lines.push(`${eventName}.emitter = ${formatOwners(emitterOwners)}`);
  });

  lines.push(
    '',
    '### Rules',
    '- Events listed here must be emitted by the owner only.',
    '- Other modules should listen/react, not emit duplicates.',
    '',
    '---',
    '',
    '## Escape Hatches',
    '- Inline override: `// OWNERSHIP_OVERRIDE: <reason>` (document follow-up task).',
    '- Environment bypass: `SKIP_OWNERSHIP_CHECK=1` for emergency commits (document and fix within 48h).',
    '',
    '---',
    '',
    '## Known Violations',
    'None. (Auto-generated)',
    '',
    `---`,
    '',
    `Last updated: ${day} via \`tools/generate-ownership.mjs\``
  );

  return lines.join('\n');
}

export function getGeometryRegex(name) {
  if (GEOMETRY_PATTERNS[name]) {
    return GEOMETRY_PATTERNS[name];
  }
  return new RegExp(name, 'g');
}

export function hasOverride(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  const end = text.indexOf('\n', index);
  const line = text.slice(start, end === -1 ? text.length : end);
  return line.includes(OVERRIDE_TOKEN);
}
