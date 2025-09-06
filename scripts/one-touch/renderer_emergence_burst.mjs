#!/usr/bin/env node
import fs from 'node:fs';
const file = 'src/components/webgl/WebGLBackground.jsx';
if (!fs.existsSync(file)) { console.error('❌ Missing', file); process.exit(1); }
let s = fs.readFileSync(file, 'utf8'); const orig = s;

// Add a micro-burst when isEmergence binds (without emitting)
if (!/HOTDORS_MICRO_BURST/.test(s)) {
  s = s.replace(
    /if\s*\(isEmergence\)\s*\{\s*console\.log\([\s\S]*?quality=\$\{quality\}\`\);\s*/,
    (m)=> m + `
        // HOTDORS_MICRO_BURST: drive morph 0→1 rapidly to show the explosion
        try {
          const start = performance.now(); const dur = 700;
          const burst = (t0)=>{ const k = Math.min(1, (t0 - start)/dur); const v = k*k*(3-2*k);
            fallbackMorphRef.current = v; __applyMorph(v); if (k<1) requestAnimationFrame(burst); };
          requestAnimationFrame(burst);
        } catch {}
`
  );
}

if (s !== orig) {
  fs.writeFileSync(file + `.bak.hotdors-${Date.now()}`, orig);
  fs.writeFileSync(file, s, 'utf8');
  console.log('✓ Patched', file);
} else {
  console.log('• No changes needed in', file);
}
