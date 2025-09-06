#!/usr/bin/env node
import fs from 'node:fs';
const file = 'src/engine/ConsciousnessEngine.js';
if (!fs.existsSync(file)) { console.error('❌ Missing', file); process.exit(1); }
let s = fs.readFileSync(file, 'utf8'); const orig = s;

s = s.replace(
  /(constructor\(\)\s*\{[\s\S]*?this\.currentQuality\s*=\s*'HIGH';)/,
  `$1
    if (this._openingPhase === undefined) this._openingPhase = true;
    if (this._openingEpoch  === undefined) this._openingEpoch  = 0;
    if (this._emergenceCount=== undefined) this._emergenceCount= 0;`
);

if (!/ENABLE_SCROLL[\s\S]*_openingPhase\s*=\s*false/.test(s)) {
  s = s.replace(/initializeBeatBusListeners\(\)\s*\{\s*/m, `initializeBeatBusListeners() {
    BeatBus.on(EVENTS.ENABLE_SCROLL, () => {
      this._openingPhase = false;
      this._openingEpoch += 1;
      this._emergenceCount = 0;
    });
`);
}

if (!/if\s*\(this\._openingPhase\s*&&\s*stage\s*!==\s*'genesis'\)/.test(s)) {
  s = s.replace(
    /BeatBus\.on\(EVENTS\.STAGE_CHANGE,[\s\S]*?\{\s*const stage[\s\S]*?\{[\s\S]*?\}\);\s*\n/m,
    (m) => m.replace(
      /console\.log\(`🧠 Engine: Stage -> \${stage}`\);/,
      `if (this._openingPhase && stage !== 'genesis') { return; }\n      console.log(\`🧠 Engine: Stage -> \${stage}\`);`
    )
  );
}

if (/BUILD_EMERGENCE_BLUEPRINT/.test(s) && !/_emergenceCount/.test(s)) {
  s = s.replace(
    /BeatBus\.on\(EVENTS\.BUILD_EMERGENCE_BLUEPRINT,[\s\S]*?\(\s*opts\s*=\s*\{\}\)\s*=>\s*\{/,
    `BeatBus.on(EVENTS.BUILD_EMERGENCE_BLUEPRINT, (opts = {}) => {
      if (this._openingPhase && this._emergenceCount > 0) {
        console.warn('🧠 Engine: emergence already built this opening; ignoring duplicate');
        return;
      }
      this._emergenceCount += 1;`
  );
}

if (s !== orig) {
  fs.writeFileSync(file + `.bak.hotdors-${Date.now()}`, orig);
  fs.writeFileSync(file, s);
  console.log('✓ Patched', file);
} else {
  console.log('• No changes needed in', file);
}
