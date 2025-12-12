import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FILE = 'src/components/webgl/WebGLBackground.jsx';
const TARGET = path.join(ROOT, FILE);
const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const read = p => fs.readFile(p, 'utf8');
const write = (p, s) => fs.writeFile(p, s, 'utf8');

async function backup(p) {
  const bak = `${p}.bak.behotfix-${stamp()}`;
  await write(bak, await read(p));
  return bak;
}

const HAS = (h, n) => h.includes(n);

function replaceOrThrow(hay, re, replacement, label) {
  const out = hay.replace(re, replacement);
  if (out === hay) throw new Error(`Patch miss: ${label}`);
  return out;
}

function upsertAfter(hay, anchorRe, insert, presentMarker, label) {
  if (HAS(hay, presentMarker)) return hay; // already inserted
  const m = hay.match(anchorRe);
  if (!m) throw new Error(`Patch miss: ${label}`);
  const idx = m.index + m[0].length;
  return hay.slice(0, idx) + insert + hay.slice(idx);
}

function upgradeUniformPointSize(uniformBlock) {
  const gpuSafe =
    `uPointSize: { value: (function(){\n` +
    `  try {\n` +
    `    const c = (typeof gl?.getContext === 'function') ? gl.getContext() : gl;\n` +
    `    const r = c?.getParameter?.(c.ALIASED_POINT_SIZE_RANGE) || [1, 64];\n` +
    `    const max = (Array.isArray(r) ? r[1] : (r?.[1] ?? 64)) || 64;\n` +
    `    return Math.min(48, max * 0.85);\n` +
    `  } catch { return 30.0; }\n` +
    `})() },`;

  // If uPointSize exists, replace its value-blob with gpuSafe
  if (/uPointSize\s*:\s*\{\s*value\s*:\s*[^}]*\}/.test(uniformBlock)) {
    return uniformBlock.replace(/uPointSize\s*:\s*\{\s*value\s*:\s*[^}]*\}/, gpuSafe);
  }

  // Otherwise, insert near the top of the uniforms object (after the first entry)
  return uniformBlock.replace(/\{\s*/, `{ ${gpuSafe}\n`);
}

(async () => {
  let src = await read(TARGET);
  const original = src;

  // 0) Fallback state + emergence timer (after useThree)
  src = upsertAfter(
    src,
    /const\s*\{\s*size\s*,\s*gl\s*\}\s*=\s*useThree\(\);\s*\n/,
    `  // HOTFIX v3: fallback scroll/morph + emergence timer
  const [fallbackScroll, setFallbackScroll] = useState(null);
  const [fallbackMorph, setFallbackMorph] = useState(null);
  const emergenceStartMsRef = useRef(null);
`,
    'HOTFIX v3: fallback scroll/morph',
    'insert fallback state'
  );

  // 1) Emergence atlas: make allen positions expand (text -> outward)
  const cloneLineRe =
    /const\s+allenAtlasPositions\s*=\s*positions\.slice\s*\?\s*positions\.slice\(\)\s*:\s*new\s+Float32Array\(positions\)\s*;/;

  if (cloneLineRe.test(src)) {
    src = src.replace(
      cloneLineRe,
      `const allenAtlasPositions = new Float32Array(count * 3);
  const EXPAND = 3.2;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const x = positions[j], y = positions[j + 1], z = positions[j + 2];
    allenAtlasPositions[j]     = x * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 1] = y * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 2] = (Math.random() - 0.5) * 6.0;
  }`
    );
  } else {
    src = replaceOrThrow(
      src,
      /(\batmosphericPositions\s*=\s*positions\s*;\s*\n\s*const\s+allenAtlasPositions\s*=\s*)([\s\S]*?);/,
      `$1new Float32Array(count * 3);
  const EXPAND = 3.2;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const x = positions[j], y = positions[j + 1], z = positions[j + 2];
    allenAtlasPositions[j]     = x * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 1] = y * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 2] = (Math.random() - 0.5) * 6.0;
  }`,
      'emergence outward cloud'
    );
  }

  // 2) Timed emergence morph marker
  src = replaceOrThrow(
    src,
    /if\s*\(bp\.mode\s*===\s*["']emergence["']\)\s*\{\s*setTimeout\(\(\)\s*=>\s*\{\s*BeatBus\.emit\(EVENTS\.PARTICLES_EMERGED\);\s*\}\s*,\s*1200\);\s*\}\s*/,
    `if (bp.mode === "emergence") {
        emergenceStartMsRef.current = performance.now();
        setTimeout(() => { BeatBus.emit(EVENTS.PARTICLES_EMERGED); }, 1200);
      } else {
        emergenceStartMsRef.current = null;
      }`,
    'emergence timer'
  );

  // 3) Fallback scroll driver (only if props aren’t wired)
  src = upsertAfter(
    src,
    /setAtlasTexture\(texture\);\s*\}\s*,\s*\[\]\s*\)\s*;\s*\n/,
    `\n  // HOTFIX v3: fallback scroll driver (only used if parent isn’t wiring props)
  useEffect(() => {
    const breaks = (Canonical?.scroll?.stageBreakpoints) || [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1];
    const order  = (Canonical?.stageOrder) || Object.keys(Canonical?.stages || {});
    let lastStage = null;

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      setFallbackScroll(p);

      // map progress to stage & in-stage morph
      let idx = breaks.length - 2;
      for (let i = 0; i < breaks.length - 1; i++) {
        if (p >= breaks[i] && p < breaks[i + 1]) { idx = i; break; }
      }
      const st = order[Math.max(0, Math.min(idx, order.length - 1))] || "genesis";
      const start = breaks[idx], end = breaks[idx + 1] ?? 1;
      const localMorph = Math.min(1, Math.max(0, (p - start) / Math.max(1e-6, end - start)));
      setFallbackMorph(localMorph);

      if (st !== lastStage) {
        lastStage = st;
        try { BeatBus.emit?.(EVENTS.STAGE_CHANGE, { stage: st }); } catch {}
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);\n`,
    'HOTFIX v3: fallback scroll driver',
    'scroll driver'
  );

  // 4) GPU-safe uPointSize: handle any current value or insert if missing
  {
    // capture the uniforms block from ShaderMaterial creation
    const uniformsRe =
      /new\s+THREE\.ShaderMaterial\s*\(\s*\{\s*uniforms\s*:\s*\{([\s\S]*?)\}\s*,\s*vertexShader/;

    const m = src.match(uniformsRe);
    if (!m) {
      console.warn(
        '⚠️ Could not locate ShaderMaterial uniforms block — skipping pointSize upgrade.'
      );
    } else {
      const before = m[0];
      const block = m[1]; // inner of uniforms { ... }

      const upgraded = upgradeUniformPointSize(block);

      if (upgraded !== block) {
        const rebuilt = before.replace(block, upgraded);
        src = src.replace(before, rebuilt);
      } else {
        console.warn('⚠️ uniforms block unchanged (pointSize already GPU-safe?).');
      }
    }
  }

  // 5) Mesh scale with viewport (be tolerant to formatting)
  src = src.replace(
    /useEffect\(\(\)\s*=>\s*\{\s*[\r\n\s]*if\s*\(!materialRef\.current\)\s*return;/,
    `useEffect(() => {
    // HOTFIX v3: scale the points cloud with viewport
    if (meshRef.current) {
      const s = Math.max(size.width, size.height) / 900;
      meshRef.current.scale.setScalar(Math.max(1, s * 1.2));
    }
    if (!materialRef.current) return;`
  );

  // 6) Uniform override logic each frame (props + fallbacks + timed emergence)
  src = src.replace(
    /mat\.uniforms\.uMorphProgress\.value\s*=\s*morphProgress;\s*[\r\n]+\s*mat\.uniforms\.uScrollProgress\.value\s*=\s*scrollProgress;/,
    `// base from props
    let _m = morphProgress;
    let _s = scrollProgress;

    // fallback (if parent isn't passing props)
    if (fallbackScroll !== null) _s = fallbackScroll;
    if (fallbackMorph !== null) _m = fallbackMorph;

    // auto-animate emergence over ~1.2s
    if (emergenceStartMsRef.current != null) {
      const dt = Math.max(0, (performance.now() - emergenceStartMsRef.current) / 1200);
      _m = Math.min(1, dt);
    }

    mat.uniforms.uMorphProgress.value = _m;
    mat.uniforms.uScrollProgress.value = _s;`
  );

  if (src === original) {
    console.log('No changes necessary.');
    return;
  }

  if (DRY) {
    console.log(`(dry) Would patch ${FILE}`);
    return;
  }

  await backup(TARGET);
  await write(TARGET, src);
  console.log(`✅ Patched ${FILE} (backup created).`);
})();
