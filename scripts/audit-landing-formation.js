/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const CHECKPOINTS = (process.env.LANDING_CHECKPOINTS || '0,5400,7800,9800,12200')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);

const LOCK_WINDOW_CHECKPOINTS = (process.env.LOCK_WINDOW_CHECKPOINTS || '7700,7800,7900,8300')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);

const LOCK_INSPECTION_MS = Number(process.env.LOCK_INSPECTION_MS || 7800);
const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 20000);

const OUTPUT_ROOT = path.join(process.cwd(), 'reports', 'landing-formation-audit');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeScatterCsv(filePath, points) {
  const rows = ['x,y,z'];
  for (const p of points || []) {
    rows.push([p.x, p.y, p.z].map(csvEscape).join(','));
  }
  fs.writeFileSync(filePath, `${rows.join('\n')}\n`);
}

function writeScatterSvg(filePath, points) {
  if (!Array.isArray(points) || points.length === 0) {
    fs.writeFileSync(
      filePath,
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><text x="24" y="36" font-family="monospace" font-size="18">No points available</text></svg>'
    );
    return;
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  const width = 960;
  const height = 600;
  const pad = 24;
  const spanX = Math.max(1e-9, maxX - minX);
  const spanY = Math.max(1e-9, maxY - minY);
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;

  const normX = (x) => pad + ((x - minX) / spanX) * plotW;
  const normY = (y) => height - pad - ((y - minY) / spanY) * plotH;
  const normZ = (z) => {
    const t = (z - minZ) / Math.max(1e-9, maxZ - minZ);
    return Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0.5;
  };

  const circles = points
    .map((p) => {
      const x = normX(p.x).toFixed(2);
      const y = normY(p.y).toFixed(2);
      const z = normZ(p.z);
      const r = (2 + z * 1.25).toFixed(2);
      const hue = Math.round(220 - z * 170);
      const alpha = (0.45 + z * 0.5).toFixed(2);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="hsla(${hue},85%,62%,${alpha})" />`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#090d14"/>
      <stop offset="100%" stop-color="#121a27"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="none" stroke="#2f3b54" stroke-width="1"/>
  ${circles}
  <text x="${pad}" y="18" fill="#d7deed" font-family="monospace" font-size="12">text3DPosition XY scatter (z encoded as color/size)</text>
</svg>`;

  fs.writeFileSync(filePath, svg);
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function findLatestAuditReportPath(rootDir) {
  if (!fs.existsSync(rootDir)) return null;
  const runDirs = fs
    .readdirSync(rootDir)
    .filter((name) => name.startsWith('run-'))
    .map((name) => path.join(rootDir, name));

  const reportFiles = [];
  for (const runDir of runDirs) {
    const files = fs.readdirSync(runDir).filter((name) => /^landing-formation-audit-.*\\.json$/.test(name));
    for (const file of files) {
      reportFiles.push(path.join(runDir, file));
    }
  }
  if (!reportFiles.length) return null;
  reportFiles.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  return reportFiles.at(-1) || null;
}

async function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const runStamp = nowStamp();
  const runDir = path.join(OUTPUT_ROOT, `run-${runStamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });

  await page.addInitScript(() => {
    const MAX_EVENTS = 64;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    const aabb = (arr) => {
      if (!(arr instanceof Float32Array) || arr.length < 3) return null;
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        const z = arr[i + 2];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      return {
        min: { x: minX, y: minY, z: minZ },
        max: { x: maxX, y: maxY, z: maxZ },
        size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
      };
    };

    const checksum = (arr, maxFloats = 4096) => {
      if (!(arr instanceof Float32Array)) return null;
      const limit = Math.min(arr.length, maxFloats);
      let acc = 2166136261;
      for (let i = 0; i < limit; i += 1) {
        const v = Math.round((arr[i] + 1024) * 1000);
        acc ^= v;
        acc +=
          (acc << 1) +
          (acc << 4) +
          (acc << 7) +
          (acc << 8) +
          (acc << 24);
      }
      return (acc >>> 0).toString(16);
    };

    if (!window.__formationAuditTap) {
      window.__formationAuditTap = {
        installed: false,
        installAttempts: 0,
        blueprintEvents: [],
      };
    }

    const installTap = () => {
      const sink = window.__formationAuditTap;
      if (!sink || sink.installed) return;
      sink.installAttempts += 1;

      const bus = window.BeatBus || window.__BeatBus;
      if (!bus || typeof bus.on !== 'function') return;

      const off = bus.on('BLUEPRINT_READY', (payload = {}) => {
        try {
          const bp = payload?.blueprint || {};
          const text = bp?.text3DPositions;
          const atmo = bp?.atmosphericPositions;

          sink.blueprintEvents.push({
            ts: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
            stage: payload?.stage || null,
            quality: payload?.quality || null,
            mode: payload?.mode || bp?.mode || null,
            cached: payload?.cached === true,
            cacheKey: payload?.cacheKey || null,
            payloadWord: payload?.word || payload?.text || payload?.stageWord || payload?.sourceText || null,
            blueprintStage: bp?.stageName || bp?.stage || null,
            particleCount: bp?.particleCount || null,
            activeCount: bp?.activeCount || null,
            text3DLength: text instanceof Float32Array ? text.length : null,
            atmosphericLength: atmo instanceof Float32Array ? atmo.length : null,
            text3DAabb: aabb(text),
            atmosphericAabb: aabb(atmo),
            text3DChecksum: checksum(text),
            atmosphericChecksum: checksum(atmo),
            metadata: {
              stage: bp?.metadata?.stage ?? null,
              quality: bp?.metadata?.quality ?? null,
              target: bp?.metadata?.target ?? null,
              typographyWord: bp?.metadata?.typography?.word ?? null,
              assignedTextParticles: bp?.metadata?.typography?.assignedTextParticles ?? null,
            },
          });

          if (sink.blueprintEvents.length > MAX_EVENTS) {
            sink.blueprintEvents.splice(0, sink.blueprintEvents.length - MAX_EVENTS);
          }
        } catch {
          // ignore
        }
      });

      sink.installed = true;
      sink.off = off;
      sink.installedAt = new Date().toISOString();
    };

    const id = setInterval(installTap, 50);
    setTimeout(() => clearInterval(id), 20000);
    window.addEventListener('load', installTap, { once: true });
    installTap();

    window.__formationAuditCompute = (options = {}) => {
      const maxSamplePoints = Number.isFinite(options.maxSamplePoints) ? options.maxSamplePoints : 2500;
      const diagnostics = window.__rendererDiagnostics;

      const readAttr = (name) => {
        if (!diagnostics || typeof diagnostics.getAttributeArray !== 'function') return null;
        try {
          return diagnostics.getAttributeArray(name);
        } catch {
          return null;
        }
      };

      const text3D = readAttr('text3DPosition');
      const atmo = readAttr('atmosphericPosition');
      const pos = readAttr('position');
      const tier = readAttr('tierData');

      const getAabb = (arr) => {
        if (!(arr instanceof Float32Array) || arr.length < 3) return null;
        let minX = Infinity;
        let minY = Infinity;
        let minZ = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let maxZ = -Infinity;
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i];
          const y = arr[i + 1];
          const z = arr[i + 2];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
        return {
          min: { x: minX, y: minY, z: minZ },
          max: { x: maxX, y: maxY, z: maxZ },
          size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
        };
      };

      const getChecksum = (arr, maxFloats = 4096) => {
        if (!(arr instanceof Float32Array)) return null;
        const limit = Math.min(arr.length, maxFloats);
        let acc = 2166136261;
        for (let i = 0; i < limit; i += 1) {
          const v = Math.round((arr[i] + 1024) * 1000);
          acc ^= v;
          acc +=
            (acc << 1) +
            (acc << 4) +
            (acc << 7) +
            (acc << 8) +
            (acc << 24);
        }
        return (acc >>> 0).toString(16);
      };

      const countPoints = (arr) => (arr instanceof Float32Array ? Math.floor(arr.length / 3) : 0);

      const samplePoints = (arr, maxPoints = maxSamplePoints) => {
        if (!(arr instanceof Float32Array) || arr.length < 3) return [];
        const count = Math.floor(arr.length / 3);
        const step = Math.max(1, Math.floor(count / Math.max(1, maxPoints)));
        const out = [];
        for (let i = 0; i < count; i += step) {
          const j = i * 3;
          out.push({ x: arr[j], y: arr[j + 1], z: arr[j + 2], idx: i });
        }
        return out;
      };

      const nearestNeighborStats = (arr, targetSampleCount = 700) => {
        if (!(arr instanceof Float32Array) || arr.length < 6) return null;
        const count = Math.floor(arr.length / 3);
        const step = Math.max(1, Math.floor(count / Math.max(2, targetSampleCount)));
        const points = [];
        for (let i = 0; i < count; i += step) {
          const j = i * 3;
          points.push([arr[j], arr[j + 1], arr[j + 2]]);
        }
        if (points.length < 3) return null;

        const dists = [];
        for (let i = 0; i < points.length; i += 1) {
          let best = Infinity;
          const p = points[i];
          for (let j = 0; j < points.length; j += 1) {
            if (i === j) continue;
            const q = points[j];
            const dx = p[0] - q[0];
            const dy = p[1] - q[1];
            const dz = p[2] - q[2];
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < best) best = d2;
          }
          dists.push(Math.sqrt(best));
        }

        dists.sort((a, b) => a - b);
        const pick = (p) => dists[Math.max(0, Math.min(dists.length - 1, Math.floor((dists.length - 1) * p)))];
        const sum = dists.reduce((acc, v) => acc + v, 0);

        return {
          sampledPoints: points.length,
          min: dists[0],
          p25: pick(0.25),
          median: pick(0.5),
          p75: pick(0.75),
          p95: pick(0.95),
          max: dists[dists.length - 1],
          mean: sum / dists.length,
        };
      };

      const occupancyProxy = (arr, gridSize = 96) => {
        if (!(arr instanceof Float32Array) || arr.length < 6) return null;
        const box = getAabb(arr);
        if (!box) return null;

        const spanX = Math.max(1e-9, box.size.x);
        const spanY = Math.max(1e-9, box.size.y);
        const grid = new Uint8Array(gridSize * gridSize);
        const counts = new Uint16Array(gridSize * gridSize);

        for (let i = 0; i < arr.length; i += 3) {
          const nx = (arr[i] - box.min.x) / spanX;
          const ny = (arr[i + 1] - box.min.y) / spanY;
          const gx = clamp(Math.floor(nx * (gridSize - 1)), 0, gridSize - 1);
          const gy = clamp(Math.floor(ny * (gridSize - 1)), 0, gridSize - 1);
          const idx = gy * gridSize + gx;
          counts[idx] = Math.min(65535, counts[idx] + 1);
        }

        let occupied = 0;
        for (let i = 0; i < counts.length; i += 1) {
          if (counts[i] > 0) {
            grid[i] = 1;
            occupied += 1;
          }
        }

        const visited = new Uint8Array(gridSize * gridSize);
        const emptyComponents = [];
        const queueX = [];
        const queueY = [];

        const push = (x, y) => {
          queueX.push(x);
          queueY.push(y);
        };

        for (let y = 0; y < gridSize; y += 1) {
          for (let x = 0; x < gridSize; x += 1) {
            const idx = y * gridSize + x;
            if (grid[idx] === 1 || visited[idx] === 1) continue;

            let area = 0;
            let touchesBoundary = false;
            visited[idx] = 1;
            push(x, y);

            while (queueX.length > 0) {
              const cx = queueX.pop();
              const cy = queueY.pop();
              area += 1;

              if (cx === 0 || cy === 0 || cx === gridSize - 1 || cy === gridSize - 1) {
                touchesBoundary = true;
              }

              const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
              ];

              for (const [nx, ny] of neighbors) {
                if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
                const nidx = ny * gridSize + nx;
                if (grid[nidx] === 1 || visited[nidx] === 1) continue;
                visited[nidx] = 1;
                push(nx, ny);
              }
            }

            emptyComponents.push({ area, touchesBoundary });
          }
        }

        const holes = emptyComponents.filter((c) => !c.touchesBoundary);
        holes.sort((a, b) => b.area - a.area);

        return {
          gridSize,
          occupiedCells: occupied,
          totalCells: gridSize * gridSize,
          occupiedRatio: occupied / Math.max(1, gridSize * gridSize),
          emptyComponents: emptyComponents.length,
          interiorHoleCount: holes.length,
          largestInteriorHoleCells: holes[0]?.area ?? 0,
          largestInteriorHoleRatio: (holes[0]?.area ?? 0) / Math.max(1, gridSize * gridSize),
        };
      };

      const pairDistance = (a, b, targetSampleCount = 1200) => {
        if (!(a instanceof Float32Array) || !(b instanceof Float32Array)) return null;
        const countA = Math.floor(a.length / 3);
        const countB = Math.floor(b.length / 3);
        const n = Math.min(countA, countB);
        if (n <= 0) return null;

        const step = Math.max(1, Math.floor(n / Math.max(1, targetSampleCount)));
        const values = [];
        for (let i = 0; i < n; i += step) {
          const j = i * 3;
          const dx = a[j] - b[j];
          const dy = a[j + 1] - b[j + 1];
          const dz = a[j + 2] - b[j + 2];
          values.push(Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
        values.sort((x, y) => x - y);
        const pick = (p) => values[Math.max(0, Math.min(values.length - 1, Math.floor((values.length - 1) * p)))];
        const mean = values.reduce((acc, v) => acc + v, 0) / values.length;

        return {
          sampledPairs: values.length,
          min: values[0],
          p25: pick(0.25),
          median: pick(0.5),
          p75: pick(0.75),
          p95: pick(0.95),
          max: values[values.length - 1],
          mean,
        };
      };

      const makeGeometrySummary = (arr) => {
        const pointCount = countPoints(arr);
        const box = getAabb(arr);
        const areaXY = box ? Math.max(1e-9, box.size.x * box.size.y) : null;
        const volume = box ? Math.max(1e-9, box.size.x * box.size.y * box.size.z) : null;

        return {
          pointCount,
          length: arr instanceof Float32Array ? arr.length : null,
          checksum: getChecksum(arr),
          aabb: box,
          densityPerAreaXY: areaXY ? pointCount / areaXY : null,
          densityPerVolume: volume ? pointCount / volume : null,
          nearestNeighbor: nearestNeighborStats(arr),
          occupancy: occupancyProxy(arr),
        };
      };

      const renderer = typeof window.__dumpRendererState === 'function' ? window.__dumpRendererState() : null;
      const stageState = typeof window.stageAtom?.getState === 'function' ? window.stageAtom.getState() : null;
      const canonical = window.Canonical || null;
      const viewport = window.__viewportHint || null;
      const textSummary = makeGeometrySummary(text3D);
      const atmoSummary = makeGeometrySummary(atmo);
      const posSummary = makeGeometrySummary(pos);

      const viewportCompression = (() => {
        const textAabb = textSummary?.aabb;
        if (!textAabb || !viewport) return null;
        const vw = Number(viewport?.width);
        const vh = Number(viewport?.height);
        if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw <= 0 || vh <= 0) return null;
        return {
          viewportWidth: vw,
          viewportHeight: vh,
          textCoverageX: textAabb.size.x / vw,
          textCoverageY: textAabb.size.y / vh,
          textCoverageArea: (textAabb.size.x * textAabb.size.y) / Math.max(1e-9, vw * vh),
        };
      })();

      const authority = {
        landingStageSliceResolved: canonical?.landingStageSliceResolved || null,
        landingModesForm: canonical?.landingModes?.form || null,
        stageVelocityWord: canonical?.stages?.velocity?.word || null,
        visualLetterGeometryVelocityWord: canonical?.visual?.letterGeometry?.velocity?.word || null,
        canonicalStageWordVelocity:
          typeof canonical?.getStageWord === 'function' ? canonical.getStageWord('velocity') : null,
      };

      const blueprintEvents = Array.isArray(window.__formationAuditTap?.blueprintEvents)
        ? window.__formationAuditTap.blueprintEvents.slice(-32)
        : [];

      const sample = samplePoints(text3D, maxSamplePoints);
      const tierSample = (() => {
        if (!(tier instanceof Float32Array) || sample.length === 0) return null;
        const out = [];
        for (let i = 0; i < sample.length; i += 1) {
          const p = sample[i];
          out.push({ idx: p.idx, tier: tier[p.idx] ?? null });
        }
        return out;
      })();

      return {
        capturedAt: new Date().toISOString(),
        stageState: {
          currentStage: stageState?.currentStage ?? null,
          stageIndex: stageState?.stageIndex ?? null,
          stageProgress: stageState?.stageProgress ?? null,
          morphProgress: stageState?.morphProgress ?? null,
        },
        renderer,
        viewport,
        authority,
        blueprintTap: blueprintEvents,
        geometry: {
          text3D: textSummary,
          atmospheric: atmoSummary,
          position: posSummary,
          pairDistances: {
            textVsAtmo: pairDistance(text3D, atmo),
            textVsPosition: pairDistance(text3D, pos),
            atmoVsPosition: pairDistance(atmo, pos),
          },
          samplePoints: sample,
          sampleTier: tierSample,
        },
      };
    };
  });

  let stageStartTs = null;
  const consoleLogs = [];
  const importantConsole = [];

  page.on('console', async (msg) => {
    const text = msg.text();
    const wallClockMs = Date.now();
    consoleLogs.push(text);

    if (text.includes('[ConsciousnessTheater] Landing stage mode started')) {
      stageStartTs = wallClockMs;
    }

    if (
      /Landing stage mode started|emitBlueprintReady|Resolved word|BIND_AABB|\[BLUEPRINT\]|BLUEPRINT_READY|DIRECTIVE_CONTENTS/i.test(
        text
      )
    ) {
      const argValues = [];
      for (const arg of msg.args()) {
        try {
          argValues.push(await arg.jsonValue());
        } catch {
          argValues.push(null);
        }
      }
      importantConsole.push({ wallClockMs, text, args: argValues });
    }
  });

  console.log(`[formation-audit] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, {
    timeout: 45000,
  });
  await page.waitForFunction(
    () => !!window.__rendererDiagnostics && typeof window.__rendererDiagnostics.getAttributeArray === 'function',
    null,
    { timeout: 45000 }
  );

  const stageDeadline = Date.now() + STAGE_START_TIMEOUT_MS;
  while (!stageStartTs && Date.now() < stageDeadline) {
    await wait(50);
  }
  if (!stageStartTs) {
    throw new Error('Landing stage mode start was not observed.');
  }

  const checkpointSet = [...new Set([...CHECKPOINTS, ...LOCK_WINDOW_CHECKPOINTS])].sort((a, b) => a - b);
  const timeline = [];

  for (const offsetMs of checkpointSet) {
    const targetTs = stageStartTs + offsetMs;
    await wait(targetTs - Date.now());

    const snapshot = await page.evaluate(() => {
      const r = window.__dumpRendererState?.() || null;
      const stage = typeof window.stageAtom?.getState === 'function' ? window.stageAtom.getState() : null;
      const c = window.Canonical || null;
      return {
        capturedAt: new Date().toISOString(),
        stage: {
          currentStage: stage?.currentStage ?? null,
          stageIndex: stage?.stageIndex ?? null,
          stageProgress: stage?.stageProgress ?? null,
          morphProgress: stage?.morphProgress ?? null,
        },
        authority: {
          landingResolvedWord: c?.landingStageSliceResolved?.word ?? null,
          stageVelocityWord: c?.stages?.velocity?.word ?? null,
          visualVelocityWord: c?.visual?.letterGeometry?.velocity?.word ?? null,
          canonicalStageWord:
            typeof c?.getStageWord === 'function' ? c.getStageWord('velocity') : null,
        },
        renderer: {
          drawCount: r?.drawRange?.count ?? null,
          camera: r?.camera ?? null,
          uniforms: {
            uMorphProgress: r?.uniforms?.uMorphProgress ?? null,
            uPointSize: r?.uniforms?.uPointSize ?? null,
            uGaussianSigma: r?.uniforms?.uGaussianSigma ?? null,
            uDepthFalloffPower: r?.uniforms?.uDepthFalloffPower ?? null,
            uFlowTurbulence: r?.uniforms?.uFlowTurbulence ?? null,
            uStreakIntensity: r?.uniforms?.uStreakIntensity ?? null,
            uSpreadFactor: r?.uniforms?.uSpreadFactor ?? null,
            uOpacityMin: r?.uniforms?.uOpacityMin ?? null,
            uOpacityMax: r?.uniforms?.uOpacityMax ?? null,
          },
        },
      };
    });

    timeline.push({ offsetMs, ...snapshot });
  }

  const deepAudit = await page.evaluate(
    ({ lockInspectionMs }) => window.__formationAuditCompute?.({ maxSamplePoints: 3000, lockInspectionMs }) || null,
    { lockInspectionMs: LOCK_INSPECTION_MS }
  );

  const lockCheckpoint = timeline.find((t) => t.offsetMs === LOCK_INSPECTION_MS) || null;
  const blueprints = deepAudit?.blueprintTap || [];
  const lastBlueprint = blueprints.length ? blueprints[blueprints.length - 1] : null;

  const currentDerived = {
    assignedTextParticles: safeNumber(lastBlueprint?.metadata?.assignedTextParticles),
    activeCount:
      safeNumber(lastBlueprint?.activeCount) ??
      safeNumber(lastBlueprint?.particleCount) ??
      safeNumber(deepAudit?.renderer?.activeCount),
  };
  currentDerived.textAssignmentRatio =
    Number.isFinite(currentDerived.assignedTextParticles) &&
    Number.isFinite(currentDerived.activeCount) &&
    currentDerived.activeCount > 0
      ? currentDerived.assignedTextParticles / currentDerived.activeCount
      : null;

  const previousReportPath = findLatestAuditReportPath(OUTPUT_ROOT);
  const previousReport = previousReportPath ? readJsonSafe(previousReportPath) : null;
  const previousAssigned = safeNumber(previousReport?.derived?.assignedTextParticles);
  const previousRatio = safeNumber(previousReport?.derived?.textAssignmentRatio);
  const assignedDelta =
    Number.isFinite(currentDerived.assignedTextParticles) && Number.isFinite(previousAssigned)
      ? currentDerived.assignedTextParticles - previousAssigned
      : null;
  const ratioDelta =
    Number.isFinite(currentDerived.textAssignmentRatio) && Number.isFinite(previousRatio)
      ? currentDerived.textAssignmentRatio - previousRatio
      : null;

  const alignment = (() => {
    const authority = deepAudit?.authority || {};
    const resolvedWord = authority?.landingStageSliceResolved?.word || null;
    const stageWord = authority?.stageVelocityWord || null;
    const geometryWord = authority?.visualLetterGeometryVelocityWord || null;
    const canonicalWord = authority?.canonicalStageWordVelocity || null;
    const typographyWord = lastBlueprint?.metadata?.typographyWord || null;

    const normalized = [resolvedWord, stageWord, geometryWord, canonicalWord, typographyWord]
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => v.trim().toUpperCase());

    const unique = [...new Set(normalized)];

    return {
      resolvedWord,
      stageWord,
      visualLetterGeometryWord: geometryWord,
      canonicalStageWord: canonicalWord,
      blueprintTypographyWord: typographyWord,
      uniqueNormalizedWords: unique,
      allAligned: unique.length <= 1,
    };
  })();

  const classify = (() => {
    const text = deepAudit?.geometry?.text3D || null;
    const lock = lockCheckpoint?.renderer?.uniforms || {};
    const assignedTextParticles = currentDerived.assignedTextParticles;
    const activeCount = currentDerived.activeCount;
    const textAssignmentRatio = currentDerived.textAssignmentRatio;
    const compression = deepAudit?.viewport && text?.aabb
      ? {
          textCoverageX: safeNumber(text?.aabb?.size?.x) / Math.max(1e-9, safeNumber(deepAudit.viewport.width) || 1),
          textCoverageY: safeNumber(text?.aabb?.size?.y) / Math.max(1e-9, safeNumber(deepAudit.viewport.height) || 1),
        }
      : null;

    const authorityMismatch = alignment.allAligned === false;
    const lowHoleSignal = (text?.occupancy?.interiorHoleCount ?? 0) === 0;
    const overpackedSignal = (text?.densityPerAreaXY ?? 0) > 280;
    const tinyCoverageSignal = compression
      ? (compression.textCoverageX < 0.17 || compression.textCoverageY < 0.09)
      : false;

    const heavyRenderFill =
      (safeNumber(lock.uOpacityMax) ?? 0) >= 0.18 ||
      (safeNumber(lock.uPointSize) ?? 0) >= 7 ||
      (safeNumber(lock.uFlowTurbulence) ?? 0) > 0.08 ||
      (safeNumber(lock.uStreakIntensity) ?? 0) > 0.02;

    if (authorityMismatch) {
      return {
        verdict: 'target_integrity_problem',
        confidence: 'medium',
        reason:
          'Word authority mismatch detected between Canonical sources and/or blueprint metadata.',
      };
    }

    if (Number.isFinite(textAssignmentRatio) && textAssignmentRatio < 0.2) {
      return {
        verdict: 'target_integrity_problem',
        confidence: 'high',
        reason:
          `Only ${assignedTextParticles}/${activeCount} particles are assigned to text targets (${(textAssignmentRatio * 100).toFixed(1)}%).`,
      };
    }

    if (
      Number.isFinite(textAssignmentRatio) &&
      textAssignmentRatio >= 0.2 &&
      Number.isFinite(ratioDelta) &&
      ratioDelta >= 0.08 &&
      Number.isFinite(assignedDelta) &&
      assignedDelta >= 1000
    ) {
      return {
        verdict: 'target_integrity_remediated',
        confidence: 'high',
        reason:
          `Text target density materially improved: ${previousAssigned} -> ${assignedTextParticles} assigned particles (${((previousRatio || 0) * 100).toFixed(1)}% -> ${(textAssignmentRatio * 100).toFixed(1)}%).`,
      };
    }

    if (Number.isFinite(textAssignmentRatio) && textAssignmentRatio >= 0.2) {
      return {
        verdict: 'target_integrity_remediated',
        confidence: 'medium',
        reason:
          `Text assignment ratio is healthy (${(textAssignmentRatio * 100).toFixed(1)}%); upstream density starvation is no longer the dominant blocker.`,
      };
    }

    if (lowHoleSignal || overpackedSignal || tinyCoverageSignal) {
      return {
        verdict: 'target_integrity_problem',
        confidence: 'medium',
        reason:
          'Target-cloud structure shows weak counter/packing/coverage signals before renderer styling.',
      };
    }

    if (heavyRenderFill) {
      return {
        verdict: 'renderer_obscuration_problem',
        confidence: 'low',
        reason:
          'Target-cloud integrity signals are acceptable but lock-time render composition remains fill-heavy.',
      };
    }

    return {
      verdict: 'unresolved_needs_deeper_inspection',
      confidence: 'low',
      reason:
        'Authority and cloud metrics do not isolate a single bottleneck with high confidence.',
    };
  })();

  const samplePoints = deepAudit?.geometry?.samplePoints || [];
  const scatterCsvPath = path.join(runDir, `text3d-scatter-${String(LOCK_INSPECTION_MS).padStart(5, '0')}ms.csv`);
  const scatterSvgPath = path.join(runDir, `text3d-scatter-${String(LOCK_INSPECTION_MS).padStart(5, '0')}ms.svg`);
  writeScatterCsv(scatterCsvPath, samplePoints);
  writeScatterSvg(scatterSvgPath, samplePoints);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      runDir,
      url: URL,
      stageStartDetected: !!stageStartTs,
      checkpointsMs: checkpointSet,
      baseCheckpointsMs: CHECKPOINTS,
      lockWindowCheckpointsMs: LOCK_WINDOW_CHECKPOINTS,
      lockInspectionMs: LOCK_INSPECTION_MS,
    },
    authority: deepAudit?.authority || null,
    alignment,
    derived: {
      ...currentDerived,
      previousReportPath,
      previousAssignedTextParticles: previousAssigned,
      previousTextAssignmentRatio: previousRatio,
      assignedTextParticlesDelta: assignedDelta,
      textAssignmentRatioDelta: ratioDelta,
    },
    timeline,
    deepAudit,
    verdict: classify,
    artifacts: {
      scatterCsv: scatterCsvPath,
      scatterSvg: scatterSvgPath,
    },
    console: {
      important: importantConsole,
      tail: consoleLogs.slice(-200),
    },
  };

  const reportPath = path.join(runDir, `landing-formation-audit-${runStamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`[formation-audit] Report: ${reportPath}`);
  console.log(`[formation-audit] Scatter CSV: ${scatterCsvPath}`);
  console.log(`[formation-audit] Scatter SVG: ${scatterSvgPath}`);
  console.log(
    JSON.stringify(
      {
        reportPath,
        scatterCsvPath,
        scatterSvgPath,
        verdict: classify,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error('[formation-audit] Failed');
  console.error(error);
  process.exit(1);
});
