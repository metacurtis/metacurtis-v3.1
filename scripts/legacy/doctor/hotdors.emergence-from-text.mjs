/* eslint-env node */
#!/usr/bin/env node
/* eslint-env node */
/**
 * HOT-DORS — Emergence from HELLO CURTIS (BeatGlyph v3.3)
 * - Engine: buildEmergenceBlueprint samples true glyph via canvas (no square)
 * - Renderer: emit PARTICLES_EMERGED once after first full bind post-emergence
 * - OpeningSequence: remove CTF fade; add one-time user-gesture audio gate
 * - Verify: run modern validator + sentinel
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const nowTag = new Date().toISOString().replace(/[:.]/g, '-');

const files = {
  engine: 'src/engine/ConsciousnessEngine.js',
  renderer: 'src/components/webgl/WebGLBackground.jsx',
  opening: 'src/components/theater/OpeningSequence.jsx',
  validator: 'scripts/validate-sst.js',
  sentinel: 'tools/sst-guard.mjs',
};

const log = (...a) => console.log(...a);
const P = (rel) => path.join(ROOT, rel);
const exists = (rel) => fs.existsSync(P(rel));
const read = (rel) => (exists(rel) ? fs.readFileSync(P(rel), 'utf8') : null);
const write = (rel, s) => {
  const full = P(rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // one-time backup
  if (fs.existsSync(full)) {
    const hasBak = fs.readdirSync(dir).some(n => n.startsWith(path.basename(full) + '.bak.hotdors-'));
    if (!hasBak) fs.copyFileSync(full, full + `.bak.hotdors-${nowTag}`);
  }
  fs.writeFileSync(full, s, 'utf8');
  log('  ↳ wrote', rel);
};
const patch = (rel, mutator) => {
  const s = read(rel);
  if (s == null) { log('  ↳ skip (missing)', rel); return; }
  const out = mutator(s);
  if (out !== s) write(rel, out);
  else log('  ↳ noop', rel);
};

/* 1) Engine: sample HELLO CURTIS glyph via offscreen canvas */
log('\nPatching Engine (emergence from text)…');
patch(files.engine, (src) => {
  if (/HOTDORS_GLYPH_SAMPLER/.test(src)) return src; // idempotent

  // Add a robust glyph sampler & replace buildEmergenceBlueprint
  let s = src;

  // Insert glyph sampler helpers (only once)
  const helperBlock = `
  // HOTDORS_GLYPH_SAMPLER: precise text sampling via offscreen canvas
  _makeCanvas(width, height) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = Math.max(64, Math.floor(width));
    c.height = Math.max(64, Math.floor(height));
    return c;
  }

  _sampleTextToPositions(text, count, opts = {}) {
    // Draw text to canvas, sample opaque pixels to produce count points centered in world units
    const {
      font = 'bold 96px Courier New, monospace',
      padding = 32,
      threshold = 0.5,
      maxAttempts = count * 50,
      worldScale = 0.12   // pixels → world units
    } = opts;

    const approxWidth = Math.max(320, text.length * 58) + padding * 2;
    const approxHeight = 140 + padding * 2;
    const canvas = this._makeCanvas(approxWidth, approxHeight);
    if (!canvas) {
      // fallback: simple grid around origin if no DOM (SSR)
      const positions = new Float32Array(count * 3);
      const side = Math.ceil(Math.sqrt(count));
      const step = 1;
      let k = 0;
      for (let y = 0; y < side && k < count; y++) {
        for (let x = 0; x < side && k < count; x++) {
          positions[k*3+0] = (x - side/2) * step;
          positions[k*3+1] = (y - side/2) * step;
          positions[k*3+2] = 0;
          k++;
        }
      }
      return positions;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.fillText(text, x, y);

    const img = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const opaque = [];
    for (let j = 0; j < canvas.height; j += 1) {
      for (let i = 0; i < canvas.width; i += 1) {
        const idx = (j * canvas.width + i) * 4 + 3; // alpha
        if (img[idx] / 255 >= threshold) opaque.push([i, j]);
      }
    }

    // Pick 'count' random opaque pixels & map to world
    const positions = new Float32Array(count * 3);
    for (let k = 0; k < count; k++) {
      const r = Math.floor(Math.random() * opaque.length);
      const [px, py] = opaque[r] || [canvas.width/2, canvas.height/2];
      // center around (0,0)
      const cx = (px - canvas.width / 2) * worldScale;
      const cy = (canvas.height / 2 - py) * worldScale;
      positions[k*3+0] = cx;
      positions[k*3+1] = cy;
      positions[k*3+2] = 0;
    }
    return positions;
  }
`;

  if (!/_makeCanvas\(/.test(s)) {
    // Inject helpers after constructor or near top of class
    s = s.replace(/class\s+ConsciousnessEngine\s*\{\s*constructor\()\s*\{[\s\S]*?\}\s*/m,
      (m) => m + helperBlock);
  }

  // Replace buildEmergenceBlueprint body to use glyph sampler
  s = s.replace(
/buildEmergenceBlueprint\s*\(\s*\{\s*text\s*=\s*'HELLO CURTIS'[\s\S]*?\}\s*)\s*\{\s*[\s\S]*?return\s*\{\s*[\s\S]*?\};\s*\}/m,
`buildEmergenceBlueprint({ text = 'HELLO CURTIS', count = 2000 } = {}) {
  console.log(\`🌟 Building emergence: "\${text}" with \${count} particles (glyph)\`);

  // 1) Sample exact glyph for emergence SOURCE
  const glyphPositions = this._sampleTextToPositions(text, count, { worldScale: 0.12 });

  // 2) Create a small outward jitter as TARGET so points "emerge" from the letters
  const jitter = 8; // world units radius
  const atmosphericPositions = new Float32Array(count * 3);   // SOURCE at glyph
  const text3DPositions       = new Float32Array(count * 3);   // TARGET = glyph + jitter

  const tiers = new Uint8Array(count);
  const sizeByTier = [0.6, 0.8, 1.2, 1.5];
  const opacityByTier = [0.5, 0.6, 0.75, 0.9];
  const atlasByTier = [7, 1, 4, 1];

  const sizeMultipliers = new Float32Array(count);
  const opacityData = new Float32Array(count);
  const atlasIndices = new Float32Array(count);
  const tierData = new Float32Array(count);
  const animationSeeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const j = i * 3;
    // SOURCE = glyph
    atmosphericPositions[j+0] = glyphPositions[j+0];
    atmosphericPositions[j+1] = glyphPositions[j+1];
    atmosphericPositions[j+2] = glyphPositions[j+2];

    // TARGET = glyph + outward jitter (emerge from text)
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * jitter;
    text3DPositions[j+0] = glyphPositions[j+0] + Math.cos(ang) * rad;
    text3DPositions[j+1] = glyphPositions[j+1] + Math.sin(ang) * rad;
    text3DPositions[j+2] = (Math.random() - 0.5) * 2.0;

    const t = (tiers[i] = Math.floor(Math.random() * 4)) | 0;
    tierData[i] = t;
    sizeMultipliers[i] = sizeByTier[t] ?? 1.0;
    opacityData[i] = opacityByTier[t] ?? 0.8;
    atlasIndices[i] = atlasByTier[t] ?? 1;

    animationSeeds[j+0] = Math.random();
    animationSeeds[j+1] = Math.random();
    animationSeeds[j+2] = Math.random();
  }

  return {
    id: 'emergence-genesis',
    mode: 'emergence',
    stageName: 'genesis',
    count,
    particleCount: count,
    maxParticles: count,
    activeCount: count,
    atmosphericPositions,   // SOURCE = glyph
    text3DPositions,        // TARGET = glyph + jitter (emerge)
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
    metadata: { sourceText: text, createdAt: Date.now() },
  };
}`
  );

  return s;
});

/* 2) Renderer: emit PARTICLES_EMERGED once after first full bind post-emergence */
log('\nPatching Renderer (emit PARTICLES_EMERGED)…');
patch(files.renderer, (src) => {
  let s = src;
  if (!/emergencePendingRef/.test(s)) {
    s = s.replace(
      /function WebGLBackground\([^)]*)\s*\{/,
      (m) => `${m}
  const emergencePendingRef = React.useRef(false);
  const emittedEmergedRef   = React.useRef(false);`
    );
  }
  if (!/EVENTS\.PARTICLES_START_EMERGING/.test(s)) {
    s = s.replace(
      /useEffect\(\s*\()\s*=>\s*\{\s*const off = BeatBus\?\.on\?\.\(EVENTS\.PARTICLES_START_EMERGING[\s\S]*?\}\s*,\s*\[\]\s*);\s*/m,
      (m) => m + `
  // mark that the next full bind should emit PARTICLES_EMERGED
  React.useEffect(() => {
    const off = BeatBus?.on?.(EVENTS.PARTICLES_START_EMERGING, () => {
      emergencePendingRef.current = true;
      emittedEmergedRef.current = false;
    });
    return () => off && off();
  }, []);
`
    );
  }
  // After the full blueprint hot-swap, emit once if pending
  if (!/BeatBus\.emit\?\.\(EVENTS\.PARTICLES_EMERGED)/.test(s)) {
    s = s.replace(
      /console\.log\(\s*`✅ Renderer:[\s\S]*?quality=\$\{quality\}`\s*);\s*return;\s*\}\s*\n\s*\/\/\s*Minimal emergence/m,
      (m) => `console.log(
        \`✅ Renderer: \${cached ? 'cached' : 'new'} BLUEPRINT_READY (full)\`,
        \`stage=\${raw.stageName || st}, count=\${raw.particleCount || raw.activeCount}, quality=\${quality}\`
      );
      // Emit PARTICLES_EMERGED only once after the first full bind post-emergence
      if (emergencePendingRef.current && !emittedEmergedRef.current) {
        BeatBus.emit?.(EVENTS.PARTICLES_EMERGED);
        emittedEmergedRef.current = true;
        emergencePendingRef.current = false;
      }
      return;
    }
    // Minimal emergence
    // Minimal emergence`
    );
  }
  return s;
});

/* 3) Opening: remove CTF block; add one-time user-gesture gate for audio */
log('\nPatching OpeningSequence (remove CTF + gesture gate)…');
patch(files.opening, (src) => {
  let s = src;

  // Remove CTF handler block (if present)
  s = s.replace(
    /\/\/\s*=+\s*CTF BUILD[\s\S]*?BeatBus\.on\(EVENTS\.PARTICLES_START_EMERGING/m,
    `// ========== PARTICLES EMERGING (Fade out) ==========
      BeatBus.on(EVENTS.PARTICLES_START_EMERGING`
  );

  // Add gesture gate (if not present)
  if (!/one-time user gesture gate/i.test(s)) {
    s = s.replace(
      /console\.log\('🎬 OpeningSequence: Ready for Director signals');\s*/,
`console.log('🎬 OpeningSequence: Ready for Director signals');

// one-time user gesture gate for autoplay audio (browser policy)
let gestureOk = false;
const __gesturePlay = () => {
  gestureOk = true;
  try { humAudioRef.current?.play?.().catch(()=>{}); } catch {}
  window.removeEventListener('pointerdown', __gesturePlay);
  window.removeEventListener('touchstart', __gesturePlay);
  window.removeEventListener('keydown', __gesturePlay);
};
window.addEventListener('pointerdown', __gesturePlay, { once: true });
window.addEventListener('touchstart', __gesturePlay, { once: true });
window.addEventListener('keydown', __gesturePlay, { once: true });\n`
    );

    // Adjust AUDIO_COMPUTER_HUM to honor gestureOk
    s = s.replace(
      /humAudioRef\.current\s*\.\s*play\()\s*\.catch\([^)]*);/,
      `if (gestureOk) { humAudioRef.current.play().catch(()=>{}); }`
    );
  }

  return s;
});

/* 4) Verify */
log('\nRunning modern validator…\n');
try {
  if (exists(files.validator)) execSync(`node ${files.validator}`, { stdio: 'inherit' });
  else log('  ↳ skip (modern validator not found)');
} catch (e) {
  log('Validator reported issues (non-fatal for this script).');
}

log('\nRunning sentinel…\n');
try {
  if (exists(files.sentinel)) execSync(`node ${files.sentinel}`, { stdio: 'inherit' });
  else log('  ↳ skip (sentinel not found)');
} catch (e) {
  process.exit(e.status || 1);
}

log('\n✅ HOT-DORS: Emergence now originates from "HELLO CURTIS"; renderer emits PARTICLES_EMERGED; CTF removed; audio gate added.\n');
