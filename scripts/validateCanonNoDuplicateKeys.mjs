import fs from 'node:fs';

const file = 'sst/canon/v3.5.json';
const text = fs.readFileSync(file, 'utf8');

async function parseWithJsonc(input) {
  try {
    const { parseTree } = await import('jsonc-parser');
    const tree = parseTree(input);
    if (!tree || tree.type !== 'object') return null;
    const counts = new Map();
    for (const prop of tree.children || []) {
      const keyNode = prop.children?.[0];
      const key = keyNode?.value;
      if (typeof key !== 'string') continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  } catch (err) {
    console.warn('[canon] jsonc-parser not available; falling back to regex scan', err?.message || err);
    return null;
  }
}

function parseWithRegex(input) {
  // Assumes top-level keys are at 2 spaces indentation.
  const counts = new Map();
  const regex = /^ {2}"([^"]+)"\s*:/gm;
  let match;
  while ((match = regex.exec(input)) !== null) {
    const key = match[1];
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

(async () => {
  const counts = (await parseWithJsonc(text)) || parseWithRegex(text);
  if (!counts || !counts.size) {
    console.error('[canon] Unable to parse top-level keys');
    process.exit(1);
  }
  const dups = [...counts.entries()].filter(([, c]) => c > 1);
  if (dups.length) {
    console.error('[canon] Duplicate top-level keys detected:');
    for (const [k, c] of dups) console.error(`  - ${k} (x${c})`);
    process.exit(1);
  }
  console.log('[canon] OK: no duplicate top-level keys');
})();
