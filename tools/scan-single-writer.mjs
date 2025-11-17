import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OWNERSHIP_PATH = path.join(__dirname, 'pattern-s.ownership.json');

function loadOwnership() {
  const raw = fs.readFileSync(OWNERSHIP_PATH, 'utf8');
  return JSON.parse(raw);
}

function walk(dir, filterExt = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      files.push(...walk(full, filterExt));
    } else {
      if (filterExt.includes(path.extname(entry.name))) {
        files.push(full);
      }
    }
  }
  return files;
}

function normalizePath(p) {
  return p.replace(ROOT + path.sep, '').replace(/\\/g, '/');
}

const BEATBUS_EMIT_RE = /BeatBus\.emit\s*\(\s*(?:EVENTS\.([A-Z_]+)|['"]([A-Z_]+)['"])/g;
const UNIFORM_WRITE_RE = /\.uniforms\.([a-zA-Z0-9_]+)\s*\.value\s*=/g;
const DRAWRANGE_RE = /\.setDrawRange\s*\(/g;

function scanFile(file, ownership, violations, coreEvents) {
  const rel = normalizePath(file);
  const src = fs.readFileSync(file, 'utf8');

  let match;

  // Event emits
  while ((match = BEATBUS_EMIT_RE.exec(src)) !== null) {
    const evt = match[1] || match[2];
    if (coreEvents.size && !coreEvents.has(evt)) continue;
    const allowedEmitters = ownership.events?.[evt]?.emitters ?? [];
    const isAllowed = allowedEmitters.includes(rel);
    const isUnknownCore = ownership.rules?.unknownCoreEventIsViolation && ownership.events?.[evt] === undefined;

    if (isUnknownCore || !isAllowed) {
      violations.push({
        type: 'event_emitter',
        event: evt,
        file: rel,
        message: `Unauthorized emitter for ${evt} in ${rel}`,
      });
    }
  }

  // Uniform writes (u*)
  while ((match = UNIFORM_WRITE_RE.exec(src)) !== null) {
    const uniform = match[1];
    if (!uniform.startsWith('u')) continue;
    const owners =
      (ownership.gpu?.uniforms?.[uniform]) ??
      (ownership.gpu?.uniforms?.['u*']) ??
      [];
    const isAllowed = owners.includes(rel);
    if (!isAllowed) {
      violations.push({
        type: 'gpu_uniform',
        uniform,
        file: rel,
        message: `Unauthorized uniform write ${uniform} in ${rel}`,
      });
    }
  }

  // Geometry writes
  if (DRAWRANGE_RE.test(src)) {
    const owners = ownership.gpu?.geometry?.setDrawRange ?? [];
    const isAllowed = owners.includes(rel);
    if (!isAllowed) {
      violations.push({
        type: 'gpu_geometry',
        method: 'setDrawRange',
        file: rel,
        message: `Unauthorized setDrawRange call in ${rel}`,
      });
    }
  }
}

function main() {
  const ownership = loadOwnership();
  const coreEvents = new Set(
    Array.isArray(ownership.rules?.coreEvents)
      ? ownership.rules.coreEvents
      : []
  );
  const files = walk(path.join(ROOT, 'src'));

  const violations = [];
  for (const file of files) {
    scanFile(file, ownership, violations, coreEvents);
  }

  if (violations.length > 0) {
    console.error('❌ Pattern S single-writer violations:');
    violations.forEach((v) => console.error('-', v.message));
    process.exitCode = 1;
  } else {
    console.log('✅ Pattern S single-writer check passed (strict).');
  }
}

main();
