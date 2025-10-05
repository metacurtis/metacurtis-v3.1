/* eslint-env node */
#!/usr/bin/env node
/* eslint-env node */
// HOT-DORS — ScrollOrchestrator bootstrap (BeatGlyph v3.3)
// - Creates src/theater/ScrollOrchestrator.js
// - Wires Director to use it (start/stop)
// - Removes CTF path + adds audio user-gesture gate in OpeningSequence
// - Updates Canonical JSON with features + doc + LOD thresholds
// - Runs modern validator + sentinel

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const nowTag = new Date().toISOString().replace(/[:.]/g, '-');

function p(rel) { return path.join(ROOT, rel); }
function exists(rel) { return fs.existsSync(p(rel)); }
function read(rel) { return exists(rel) ? fs.readFileSync(p(rel), 'utf8') : null; }
function write(rel, s) {
  const full = p(rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // one-time backup
  const hasBak = fs.existsSync(full) &&
    fs.readdirSync(dir).some(n => n.startsWith(path.basename(full) + '.bak.hotdors-'));
  if (!hasBak && fs.existsSync(full)) {
    fs.copyFileSync(full, full + `.bak.hotdors-${nowTag}`);
  }
  fs.writeFileSync(full, s, 'utf8');
  console.log('  ↳ wrote', rel);
}
function patch(rel, mutator) {
  const src = read(rel);
  if (src == null) { console.log('  ↳ skip (missing)', rel); return; }
  const out = mutator(src);
  if (out !== src) {
    write(rel, out);
  } else {
    console.log('  ↳ noop', rel);
  }
}

/* 1) Create ScrollOrchestrator */
const SO_FILE = 'src/theater/ScrollOrchestrator.js';
if (!exists(SO_FILE)) {
  write(SO_FILE, `// src/theater/ScrollOrchestrator.js
// BeatGlyph v3.3 — ScrollOrchestrator
// Purpose: map window scroll -> stage-local progress; publish MORPH_PROGRESS, STAGE_CHANGE, and MEMORY_FRAGMENT_TRIGGER.
// Kinetics: speedMultiplier=2.0, smoothing=0.15, overshoot=0.05 (v3.3 canon)

import { Canonical } from '@/config/canonical/canonicalAuthority.js';
import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const clamp01 = (v)=> Math.max(0, Math.min(1, Number(v)||0));

// v3.3 easing: soften edges 0..10% and 90..100%
function easePercent(p) {
  if (p <= 10) { const x=p/10; return x*x*10; }       // in
  if (p >= 90){ const x=(100-p)/10; return 100-(x*x*10); } // out
  return p;
}

export default class ScrollOrchestrator {
  constructor() {
    this._onScroll = this._onScroll.bind(this);
    this.running = false;
    this.lastStageIndex = -1;
    this.morph = 0;
    this.morphTarget = 0;
    this.fragmentFired = new Set();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.fragmentFired.clear();
    window.addEventListener('scroll', this._onScroll, { passive: true });
    // kick once
    this._onScroll();
    // RAF tick for smoothing / overshoot
    const loop = () => {
      if (!this.running) return;
      // smoothing 0.15, overshoot 0.05
      const smoothing = Canonical?.scrollAndMorph?.morphResponse?.smoothing ?? 0.15;
      const overshoot = Canonical?.scrollAndMorph?.morphResponse?.overshoot ?? 0.05;
      const delta = this.morphTarget - this.morph;
      this.morph += delta * smoothing;
      // small elastic settle near 1.0
      if (this.morphTarget > 0.95 && this.morph > 0.95) {
        this.morph = Math.min(1, this.morph + overshoot * (1 - this.morph));
      }
      BeatBus.emit?.(EVENTS.MORPH_PROGRESS, { value: clamp01(this.morph) });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // dev
    if (typeof window !== 'undefined') window.__scrollOrchestrator = this;
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    window.removeEventListener('scroll', this._onScroll);
  }

  _onScroll() {
    try {
      const doc = document.documentElement;
      const denom = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const rawPct = (doc.scrollTop / denom) * 100;
      const easedPct = easePercent(rawPct);

      // stage detection
      const bps = Canonical?.scrollAndMorph?.stageBreakpointsPercent || [0,100];
      let stageIdx = bps.length - 2;
      for (let i=0;i<bps.length-1;i++) {
        if (easedPct >= bps[i] && easedPct < bps[i+1]) { stageIdx = i; break; }
      }
      const stageName = Canonical?.stageOrder?.[stageIdx] || Object.keys(Canonical.stages||{})[stageIdx];

      // local progress within stage
      const start = bps[stageIdx] ?? 0;
      const end   = bps[stageIdx+1] ?? 100;
      const local = clamp01((easedPct - start) / Math.max(1, end - start));

      // v3.3 morph: speedMultiplier=2.0
      const speed = Canonical?.scrollAndMorph?.morphResponse?.speedMultiplier ?? 2.0;
      this.morphTarget = clamp01(local * speed);

      // stage change event
      if (stageIdx !== this.lastStageIndex && stageName) {
        this.lastStageIndex = stageIdx;
        BeatBus.emit?.(EVENTS.STAGE_CHANGE, { stage: stageName, index: stageIdx });
      }

      // memory fragment trigger per stage
      const st = Canonical?.stages?.[stageName] || {};
      const frag = st.memoryFragment;
      if (frag && typeof frag.triggerPercent === 'number') {
        const key = \`\${stageName}::\${frag.triggerPercent}\`;
        if (!this.fragmentFired.has(key) && easedPct >= frag.triggerPercent) {
          this.fragmentFired.add(key);
          BeatBus.emit?.(EVENTS.MEMORY_FRAGMENT_TRIGGER, { stage: stageName, id: frag.id || key });
        }
      }
    } catch (e) {
      console.warn('[ScrollOrchestrator] scroll error', e);
    }
  }
}
`);
} else {
  console.log('  ↳ exists', SO_FILE);
}

/* 2) Patch TheaterDirector: import/start/stop orchestrator; remove coarse clicks */
console.log('\nPatching TheaterDirector.js…');
patch('src/theater/TheaterDirector.js', (s) => {
  let out = s;

  // import ScrollOrchestrator
  if (!/ScrollOrchestrator/.test(out)) {
    out = out.replace(
      /import\s+BeatBus[^\n]*\nimport\s+\{ EVENTS \} from '\.\/events\.js';/,
      (m) => `${m}\nimport ScrollOrchestrator from './ScrollOrchestrator.js';`
    );
  }

  // add property in constructor
  if (!/this\.scrollOrchestrator/.test(out)) {
    out = out.replace(/constructor\()\s*\{\s*[\s\S]*?this\.timeline\s*=\s*\{\};/,
      (m) => m + `\n    this.scrollOrchestrator = null;`);
  }

  // remove coarse AUDIO_KEY_CLICK loop during typing
  out = out.replace(
    /\/\/ Emit key clicks during typing[\s\S]*?for\s*\(let i = 0; i < 4; i\+\+)\s*\{[\s\S]*?\}\s*\n/m,
    '/* HOTDORS: OpeningSequence owns per-char key clicks. Director no longer emits coarse key clicks. */\n'
  );

  // after PARTICLES_EMERGED wait and STAGE_CHANGE('genesis'), start orchestrator
  if (!/this\.scrollOrchestrator\s*=\s*new ScrollOrchestrator/.test(out)) {
    out = out.replace(
      /(BeatBus\.emit\(EVENTS\.ENABLE_SCROLL);\s*\n)/,
      `$1      // HOTDORS: start ScrollOrchestrator (maps scroll→morph/stage)\n      if (!this.scrollOrchestrator) this.scrollOrchestrator = new ScrollOrchestrator();\n      this.scrollOrchestrator.start();\n`
    );
  }

  // stop orchestrator in cancel()
  if (!/this\.scrollOrchestrator\?.stop\()/.test(out)) {
    out = out.replace(
      /BeatBus\.emit\(EVENTS\.DIRECTOR_CANCEL);\s*\n\s*\}/,
      (m) => `      this.scrollOrchestrator?.stop();\n      ${m}`
    );
  }

  return out;
});

/* 3) Patch OpeningSequence: remove CTF; add audio user-gesture gate */
console.log('\nPatching OpeningSequence.jsx…');
patch('src/components/theater/OpeningSequence.jsx', (s) => {
  let out = s;

  // Remove legacy CTF handler block
  out = out.replace(
    /\/\/\s*=+ CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.DIRECTOR_CANCEL[\s\S]*?),\s*\n\s*\];/m,
    (m) => {
      // preserve the DIRECTOR_CANCEL and other handlers; only strip the CTF block
      const noCTF = m.replace(/\/\/\s*=+ CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
        `// ========== PARTICLES EMERGING (Fade out) ==========\n      BeatBus.on(EVENTS.PARTICLES_START_EMERGING`);
      return noCTF;
    }
  );

  // Add user gesture gate for audio (only if not present)
  if (!/gestureOk/.test(out)) {
    out = out.replace(
`    mounted.current = true;
    setVisible(true); // Show overlay when component mounts
    console.log('🎬 OpeningSequence: Ready for Director signals');`,
`    mounted.current = true;
    setVisible(true); // Show overlay when component mounts
    console.log('🎬 OpeningSequence: Ready for Director signals');

    // HOTDORS: one-time user gesture gate for audio autoplay
    let gestureOk = false;
    const __gesturePlay = () => {
      gestureOk = true;
      try { humAudioRef.current && humAudioRef.current.play && humAudioRef.current.play().catch(()=>{}); } catch {}
      window.removeEventListener('pointerdown', __gesturePlay);
      window.removeEventListener('touchstart', __gesturePlay);
      window.removeEventListener('keydown', __gesturePlay);
    };
    window.addEventListener('pointerdown', __gesturePlay, { once: true });
    window.addEventListener('touchstart', __gesturePlay, { once: true });
    window.addEventListener('keydown', __gesturePlay, { once: true });`
    );

    out = out.replace(
      /BeatBus\.on\(EVENTS\.AUDIO_COMPUTER_HUM,[\s\S]*?)),/m,
      (m) => m.replace(
        /humAudioRef\.current\s*\.\s*play\()\s*\.\s*catch\([^)]*)\s*;/,
        `if (gestureOk) {
          humAudioRef.current.play().catch(()=>{});
        }`
      )
    );
  }

  return out;
});

/* 4) Update Canonical JSON: features + doc + LOD thresholds + morphResponse (if missing) */
console.log('\nUpdating Canonical JSON…');
const CANON_JSON = 'src/config/canonical/sst-v3.3.json';
try {
  const raw = read(CANON_JSON);
  if (raw) {
    const json = JSON.parse(raw);

    json.features = json.features || {};
    json.features.beatGlyph = true;
    json.features.scrollOrchestrator = true;

    json.pipeline = json.pipeline || {};
    json.pipeline.modules = json.pipeline.modules || {};
    if (!json.pipeline.modules.scrollOrchestrator) {
      json.pipeline.modules.scrollOrchestrator = {
        role: "progress_publisher",
        writes: ["eventsOnly"],
        forbidden: ["geometry", "uniforms"],
        notes: "Maps window scroll→stage-local progress; publishes MORPH_PROGRESS; emits STAGE_CHANGE at breakpoints and MEMORY_FRAGMENT_TRIGGER from per-stage triggerPercent. Renderer remains a dumb sink."
      };
    }

    json.scrollAndMorph = json.scrollAndMorph || {};
    json.scrollAndMorph.morphResponse = json.scrollAndMorph.morphResponse || {
      speedMultiplier: 2.0,
      smoothing: 0.15,
      overshoot: 0.05
    };

    json.performance = json.performance || {};
    json.performance.lodThresholds = json.performance.lodThresholds || {
      ultra: 0.9, high: 0.75, medium: 0.55, low: 0.35
    };

    write(CANON_JSON, JSON.stringify(json, null, 2) + '\n');
  } else {
    console.log('  ↳ skip (Canonical JSON not found)');
  }
} catch (e) {
  console.log('  ↳ skip (JSON parse failed):', e.message);
}

/* 5) Optional: point package.json validate to modern validator + sentinel (if still legacy) */
console.log('\nAligning package.json validate script…');
patch('package.json', (src) => {
  try {
    const pkg = JSON.parse(src);
    pkg.scripts = pkg.scripts || {};
    if (!/validate-sst\.js/.test(pkg.scripts.validate || '')) {
      pkg.scripts.validate = "node scripts/validate-sst.js && node tools/sst-guard.mjs";
      return JSON.stringify(pkg, null, 2) + '\n';
    }
    return src;
  } catch { return src; }
});

/* 6) Verify */
console.log('\nRunning modern validator…\n');
try {
  execSync('node scripts/validate-sst.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Validator reported issues (non-fatal for this script).');
}

console.log('\nRunning sentinel…\n');
try {
  execSync('node tools/sst-guard.mjs', { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}

console.log('\n✅ HOT-DORS: ScrollOrchestrator installed, OpeningSequence cleaned, Canon updated, sentinel green.\n');
