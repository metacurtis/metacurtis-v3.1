#!/usr/bin/env node
/**
 * ROLE:
 *  - Phase 0D reality check + gate for RENDER_DIRECTIVE emitters.
 *  - Enforces "no new writers" without yet forcing single-writer.
 *
 * INVARIANTS (target state):
 *  - Long term, VisualOrchestrator (and/or bus/emitters.js) should be the
 *    single writer for RENDER_DIRECTIVE.
 *  - Today, only explicitly whitelisted files are allowed to emit.
 *  - New emit sites MUST be consciously added to the allowlist (or refactored).
 */

const { execSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Allowed files that may emit RENDER_DIRECTIVE for now.
// 🔧 Adjust these to match your real paths.
const ALLOWED_PATH_SUBSTRINGS = [
  'src/theater/VisualOrchestrator',
  'src/theater/bus/emitters',
];

/**
 * Run ripgrep to find all occurrences of "RENDER_DIRECTIVE" in src.
 * Returns an array of lines like: "path/to/file.js:123:  some code..."
 */
function runRg() {
  try {
    const cmd = `rg "RENDER_DIRECTIVE" src -n`;
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch (err) {
    if (err.stdout) {
      return err.stdout.trim().split('\n').filter(Boolean);
    }
    // No matches is technically OK for now.
    return [];
  }
}

/**
 * Very simple heuristic: treat a line as an "emit" if it looks like
 * it is calling an emit function while mentioning RENDER_DIRECTIVE.
 *
 * This keeps references in events.js / schemas / comments from being
 * treated as writers.
 */
function isEmitLine(line) {
  const lower = line.toLowerCase();
  return (
    lower.includes('.emit(') ||
    lower.includes('beatbus.emit(') ||
    lower.includes('emitrenderdirective') // in case of helpers
  );
}

function isAllowed(line) {
  return ALLOWED_PATH_SUBSTRINGS.some((sub) => line.includes(sub));
}

const matches = runRg();

const emitLines = matches.filter(isEmitLine);
const nonEmitLines = matches.filter((line) => !isEmitLine(line));

const unauthorizedEmitters = emitLines.filter((line) => !isAllowed(line));

console.log('🔎 RENDER_DIRECTIVE references in src:');
matches.forEach((line) => console.log('  ', line));

console.log('\n🔎 RENDER_DIRECTIVE emit sites (heuristic):');
emitLines.forEach((line) => console.log('  ', line));

if (unauthorizedEmitters.length > 0) {
  console.error('\n❌ Non-whitelisted RENDER_DIRECTIVE emitters detected:');
  unauthorizedEmitters.forEach((line) => console.error('  ', line));

  console.error(`
This breaks the Phase 0D invariant:

- New RENDER_DIRECTIVE writers MUST be intentional.
- Long-term goal is a single writer (VisualOrchestrator / bus/emitters.js).

To fix:
- Either route these callsites through a whitelisted emitter, OR
- Consciously add their path fragment to ALLOWED_PATH_SUBSTRINGS
  in tools/check-render-directive-single-writer.cjs (with a comment).
`);

  process.exit(1);
}

console.log('\n✅ All detected RENDER_DIRECTIVE emitters are in whitelisted files.');
process.exit(0);
