/* eslint-env node */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');

const FILE = 'src/components/webgl/WebGLBackground.jsx';
const TARGET = path.join(ROOT, FILE);

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function backup(file) {
  const bak = `${file}.bak.behotfix-${stamp()}`;
  await fs.writeFile(bak, await fs.readFile(file, 'utf8'));
  return bak;
}

function replaceOnce(src, pattern, replacement, label) {
  const out = src.replace(pattern, replacement);
  if (out === src) throw new Error(`Patch miss: ${label}`);
  return out;
}

(async () => {
  if (!(await exists(TARGET))) {
    console.error(`❌ Not found: ${FILE}`);
    process.exit(1);
  }

  let code = await fs.readFile(TARGET, 'utf8');
  const original = code;

  // 1) Ensure emergence has different "from" and "to" positions (text -> outward cloud)
  code = replaceOnce(
    code,
    /function ensureArraysFromEmergence\([\s\S]*?return \{\n[\s\S]*?tierData,\n[\s\S]*?\};\n\}/,
    `function ensureArraysFromEmergence(bp) {
  if (bp.atmosphericPositions && bp.allenAtlasPositions) return bp;
  const positions = bp.positions;
  if (!positions) return bp;

  const count = bp.count ?? ((positions.length / 3) | 0);
  const tiersU8 = bp.tiers || new Uint8Array(count);

  // Text shape stays as atmospheric (start), outward cloud becomes "allen" (end)
  const atmosphericPositions = positions; // text
  const allenAtlasPositions = new Float32Array(count * 3);

  // Expand to fill more of the viewport and add slight jitter
  const EXPAND = 3.2;
  for (let i = 0; i < count; i++) {
    const j = i * 3;
    const x = positions[j + 0], y = positions[j + 1], z = positions[j + 2];
    allenAtlasPositions[j + 0] = x * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 1] = y * EXPAND + (Math.random() - 0.5) * 8.0;
    allenAtlasPositions[j + 2] = (Math.random() - 0.5) * 6.0;
  }

  const sizeByTier = [0.6, 0.8, 1.2, 1.5];
  const opacityByTier = [0.5, 0.6, 0.75, 0.9];
  const atlasByTier = [7, 1, 4, 1];

  const sizeMultipliers = new Float32Array(count);
  const opacityData = new Float32Array(count);
  const atlasIndices = new Float32Array(count);
  const tierData = new Float32Array(count);
  const animationSeeds = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = tiersU8[i] | 0;
    const j = i * 3;
    tierData[i] = t;
    sizeMultipliers[i] = sizeByTier[t] || 1.0;
    opacityData[i]   = opacityByTier[t] || 0.8;
    atlasIndices[i]  = atlasByTier[t] || 1;
    const r = Math.random;
    animationSeeds[j + 0] = r();
    animationSeeds[j + 1] = r();
    animationSeeds[j + 2] = r();
  }

  return {
    ...bp,
    stageName: bp.stageName || "genesis",
    maxParticles: count,
    particleCount: count,
    activeCount: count,
    atmosphericPositions,
    allenAtlasPositions,
    animationSeeds,
    sizeMultipliers,
    opacityData,
    atlasIndices,
    tierData,
  };
}`,
    'emergence from->to'
  );

  // 2) Add fallback scroll driver + timed emergence morph + mesh scale
  code = replaceOnce(
    code,
    /function WebGLBackground\(\{[^}]*\}\) \{\n/,
    `function WebGLBackground({ morphProgress = 0, scrollProgress = 0 }) {
  const meshRef = useRef();
  const geometryRef = useRef();
  const materialRef = useRef();
  const lastBlueprintIdRef = useRef(null);
  const emergenceStartMsRef = useRef(null); // to auto-animate emergence
  const { size, gl } = useThree();

  // Fallback scroll/morph (used if parent doesn't pass props)
  const [fallbackScroll, setFallbackScroll] = useState(null);
  const [fallbackMorph, setFallbackMorph] = useState(null);
`,
    'fallback header'
  );

  code = replaceOnce(
    code,
    /useEffect\(\(\) => \{\n\s*const handleBlueprint = \(payload\) => \{\n/,
    `useEffect(() => {
    const handleBlueprint = (payload) => {`,
    'blueprint receiver'
  );

  code = replaceOnce(
    code,
    /if \(bp\.mode === "emergence"\) \{\n\s*setTimeout\(\(\) => \{\n\s*BeatBus\.emit\(EVENTS\.PARTICLES_EMERGED\);\n\s*}, 1200\);\n\s*\}\n/,
    `if (bp.mode === "emergence") {
        // start timed morph (text -> outward)
        emergenceStartMsRef.current = performance.now();
        setTimeout(() => { BeatBus.emit(EVENTS.PARTICLES_EMERGED); }, 1200);
      } else {
        emergenceStartMsRef.current = null;
      }
`,
    'emergence start'
  );

  // Scroll driver effect (maps document scroll -> stage + morph)
  code = replaceOnce(
    code,
    /useEffect\(\(\) => \{\n\s*const atlas = getPointSpriteAtlasSingleton\(\);\n/,
    `useEffect(() => {
    const atlas = getPointSpriteAtlasSingleton();
`,
    'slot for scroll driver'
  );

  code = replaceOnce(
    code,
    /setAtlasTexture\(texture\);\n\s*\}, \[\]\);\n/,
    `setAtlasTexture(texture);
  }, []);

  // Fallback stage/morph driver: only used if parent props aren't wired
  useEffect(() => {
    const breaks = (Canonical?.scroll?.stageBreakpoints) || [0, 0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1];
    const order  = (Canonical?.stageOrder) || Object.keys(Canonical?.stages || {});
    let lastStage = null;

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      setFallbackScroll(p);

      // map to stage + in-stage morph
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
        // Drive engine if higher layer isn't doing it
        try { BeatBus.emit?.(EVENTS.STAGE_CHANGE, { stage: st }); } catch {}
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
`,
    'scroll driver added'
  );

  // 3) Safer point size (GPU max) and viewport scale on mesh
  code = replaceOnce(
    code,
    /uPointSize:\s*\{\s*value:\s*30\.0\s*\},/,
    `uPointSize: { value: (function(){
          try {
            const c = gl.getContext ? gl.getContext() : gl;
            const r = c.getParameter(c.ALIASED_POINT_SIZE_RANGE) || [1, 64];
            const max = (Array.isArray(r) ? r[1] : (r?.[1] ?? 64)) || 64;
            return Math.min(48, max * 0.85);
          } catch { return 30.0; }
        })() },`,
    'point size safer'
  );

  // Scale the mesh to fill viewport better
  code = replaceOnce(
    code,
    /useEffect\(\(\) => \{\n\s*if \(!materialRef\.current\) return;\n/,
    `useEffect(() => {
    // scale the mesh roughly with viewport so it fills screen
    if (meshRef.current) {
      const s = Math.max(size.width, size.height) / 900;
      meshRef.current.scale.setScalar(Math.max(1, s * 1.2));
    }
    if (!materialRef.current) return;
`,
    'mesh scale'
  );

  // 4) Override uniforms each frame (fallback morph/scroll + timed emergence)
  code = replaceOnce(
    code,
    /mat\.uniforms\.uMorphProgress\.value = morphProgress;\n\s*mat\.uniforms\.uScrollProgress\.value = scrollProgress;\n/,
    `// base from props
    let _m = morphProgress;
    let _s = scrollProgress;

    // fallback scroll/morph if parent didn't pass anything
    if (fallbackScroll !== null) _s = fallbackScroll;
    if (fallbackMorph !== null) _m = fallbackMorph;

    // auto-animate emergence (text -> outward) over ~1.2s
    if (emergenceStartMsRef.current != null) {
      const dt = Math.max(0, (performance.now() - emergenceStartMsRef.current) / 1200);
      _m = Math.min(1, dt);
    }

    mat.uniforms.uMorphProgress.value = _m;
    mat.uniforms.uScrollProgress.value = _s;
`,
    'uniform override'
  );

  if (code === original) {
    console.log('No changes necessary.');
    process.exit(0);
  }

  if (DRY) {
    console.log(`(dry) Would patch ${FILE}`);
  } else {
    await backup(TARGET);
    await fs.writeFile(TARGET, code, 'utf8');
    console.log(`✅ Patched ${FILE} (backup created)`);
  }
  console.log('Done.');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
