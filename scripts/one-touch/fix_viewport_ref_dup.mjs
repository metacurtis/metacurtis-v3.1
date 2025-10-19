#!/usr/bin/env node
import fs from 'node:fs';

const file = 'src/components/consciousness/ConsciousnessTheater.jsx';
if (!fs.existsSync(file)) {
  console.error('❌ Missing file:', file);
  process.exit(1);
}

let s = fs.readFileSync(file, 'utf8');
const orig = s;

// 1) Remove ALL occurrences of the duplicate declaration
const declRE = /\n\s*const\s+viewportReadyRef\s*=\s*useRef\(\s*false\s*\);\s*/g;
const found = (s.match(declRE) || []).length;

s = s.replace(declRE, '\n');

// 2) Ensure there is exactly ONE declaration immediately after directorStartedRef
if (!/viewportReadyRef\s*=\s*useRef\(\s*false\s*\)/.test(s)) {
  s = s.replace(
    /const\s+directorStartedRef\s*=\s*useRef\(false\);\s*/,
    (m) => `${m}\n  const viewportReadyRef = useRef(false);\n`
  );
}

// 3) (Optional safety) De-dupe cleanup reset line if it appears twice
s = s.replace(
  /viewportReadyRef\.current\s*=\s*false;\s*\n\s*viewportReadyRef\.current\s*=\s*false;\s*/g,
  'viewportReadyRef.current = false;\n'
);

if (s !== orig) {
  fs.writeFileSync(file + `.bak.hotdors-${Date.now()}`, orig, 'utf8');
  fs.writeFileSync(file, s, 'utf8');
  console.log(`✓ Fixed duplicate viewportReadyRef (${found} → 1) in`, file);
} else {
  console.log('• No changes needed (viewportReadyRef de-dup not found)', file);
}
