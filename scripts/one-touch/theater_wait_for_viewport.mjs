#!/usr/bin/env node
import fs from 'node:fs';

const file = 'src/components/consciousness/ConsciousnessTheater.jsx';
if (!fs.existsSync(file)) { console.error('❌ Missing', file); process.exit(1); }
let s = fs.readFileSync(file, 'utf8'); const orig = s;

// Add viewportReadyRef if not present
if (!/viewportReadyRef/.test(s)) {
  s = s.replace(
    /const directorStartedRef = useRef\(false\);/,
    `const directorStartedRef = useRef(false);
  const viewportReadyRef = useRef(false);`
  );
}

// Add hint listener + polling start block (race-free)
if (!/ENGINE_VIEWPORT_HINT/.test(s) || !/director\.start\(\)/.test(s) || !/setInterval/.test(s)) {
  s = s.replace(
`  useEffect(() => {
    if (!directorStartedRef.current) {`,
`  useEffect(() => {
    if (!directorStartedRef.current) {
      // listen once for viewport hint from renderer
      const offHint = BeatBus.on(EVENTS.ENGINE_VIEWPORT_HINT, () => {
        viewportReadyRef.current = true;
      });
      // try starting director once viewport hint arrives
      const tick = setInterval(() => {
        if (!directorStartedRef.current && viewportReadyRef.current) {
          document.body.style.overflow = 'hidden'; // lock scroll until ENABLE_SCROLL
          director.start();
          directorStartedRef.current = true;
          clearInterval(tick);
          offHint && offHint();
        }
      }, 50);`
  );

  // Ensure cleanup restores scroll and flags
  if (!/director\.cancel\(\);[\s\S]*directorStartedRef\.current = false;/.test(s)) {
    s = s.replace(
`    return () => {
      offs.forEach(off => off && off());
      document.body.style.overflow = '';
      director.cancel();
      directorStartedRef.current = false;
    };`,
`    return () => {
      offs.forEach(off => off && off());
      document.body.style.overflow = '';
      director.cancel();
      directorStartedRef.current = false;
      viewportReadyRef.current = false;
    };`
    );
  }
}

// Helper import guards (BeatBus/EVENTS)
if (!/BeatBus/.test(s) || !/EVENTS/.test(s)) {
  console.warn('⚠️ Ensure ConsciousnessTheater.jsx already imports BeatBus and EVENTS');
}

if (s !== orig) {
  fs.writeFileSync(file + `.bak.hotdors-${Date.now()}`, orig);
  fs.writeFileSync(file, s, 'utf8');
  console.log('✓ Patched', file);
} else {
  console.log('• No changes needed in', file);
}
