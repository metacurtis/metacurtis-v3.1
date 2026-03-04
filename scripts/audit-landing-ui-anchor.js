/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const CHECKPOINTS = (process.env.UI_ANCHOR_CHECKPOINTS || '7800,9800,12200')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite)
  .sort((a, b) => a - b);

const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 20000);
const OUTPUT_ROOT = path.join(process.cwd(), 'reports', 'landing-ui-anchor-audit');

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function wait(ms) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writePointsCsv(filePath, points) {
  const rows = ['idx,x,y,z,zone,cluster'];
  for (const p of points || []) {
    rows.push([
      p.idx,
      p.x,
      p.y,
      p.z,
      p.zone ?? '',
      p.cluster ?? '',
    ].map(csvEscape).join(','));
  }
  fs.writeFileSync(filePath, `${rows.join('\n')}\n`);
}

function rectArea(box) {
  if (!box?.size) return null;
  return Math.max(0, safeNumber(box.size.x) ?? 0) * Math.max(0, safeNumber(box.size.y) ?? 0);
}

function rectIntersection(a, b) {
  if (!a?.min || !a?.max || !b?.min || !b?.max) return 0;
  const ix = Math.max(0, Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x));
  const iy = Math.max(0, Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y));
  return ix * iy;
}

function rectIoU(a, b) {
  const areaA = rectArea(a);
  const areaB = rectArea(b);
  if (!Number.isFinite(areaA) || !Number.isFinite(areaB) || areaA <= 0 || areaB <= 0) return null;
  const inter = rectIntersection(a, b);
  const union = areaA + areaB - inter;
  if (union <= 1e-9) return null;
  return inter / union;
}

function rectOverlapByMinArea(a, b) {
  const areaA = rectArea(a);
  const areaB = rectArea(b);
  if (!Number.isFinite(areaA) || !Number.isFinite(areaB) || areaA <= 0 || areaB <= 0) return null;
  const inter = rectIntersection(a, b);
  return inter / Math.max(1e-9, Math.min(areaA, areaB));
}

function boxCenter(box) {
  if (!box?.min || !box?.max) return null;
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
}

function centerDistance(a, b) {
  if (!a || !b) return null;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function boxDiagonal(box) {
  if (!box?.size) return null;
  const sx = safeNumber(box.size.x) ?? 0;
  const sy = safeNumber(box.size.y) ?? 0;
  const sz = safeNumber(box.size.z) ?? 0;
  return Math.sqrt(sx * sx + sy * sy + sz * sz);
}

function minFinite(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  return nums.length ? Math.min(...nums) : null;
}

function maxFinite(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  return nums.length ? Math.max(...nums) : null;
}

function computeWholeStability(checkpointEntries) {
  if (!Array.isArray(checkpointEntries) || checkpointEntries.length < 2) {
    return {
      available: false,
      reason: 'Need at least two checkpoints with boxes.',
    };
  }

  const baseBox = checkpointEntries[0]?.wholeWordAabb || null;
  const baseCenter = boxCenter(baseBox);
  const baseArea = rectArea(baseBox);
  const baseDiag = boxDiagonal(baseBox);

  const consecutiveIous = [];
  const centerDriftNorm = [];
  const areaDeltaRatio = [];

  for (let i = 0; i < checkpointEntries.length; i += 1) {
    const cur = checkpointEntries[i];
    const box = cur?.wholeWordAabb || null;
    const center = boxCenter(box);

    if (i > 0) {
      const prev = checkpointEntries[i - 1];
      consecutiveIous.push(rectIoU(prev?.wholeWordAabb || null, box));
    }

    const drift = centerDistance(baseCenter, center);
    centerDriftNorm.push(Number.isFinite(drift) && Number.isFinite(baseDiag) && baseDiag > 1e-9 ? drift / baseDiag : null);

    const area = rectArea(box);
    areaDeltaRatio.push(Number.isFinite(area) && Number.isFinite(baseArea) && baseArea > 1e-9 ? Math.abs(area - baseArea) / baseArea : null);
  }

  return {
    available: true,
    minConsecutiveIoU: minFinite(consecutiveIous),
    maxCenterDriftNorm: maxFinite(centerDriftNorm),
    maxAreaDeltaRatio: maxFinite(areaDeltaRatio),
    consecutiveIous,
    centerDriftNorm,
    areaDeltaRatio,
  };
}

function computeIndexedSeriesStability(checkpointEntries, key, expectedCount) {
  const series = [];
  for (const entry of checkpointEntries) {
    const arr = Array.isArray(entry?.[key]) ? entry[key] : [];
    series.push(arr);
  }

  const hasExpected = series.every((arr) => arr.length === expectedCount);
  if (!hasExpected || series.length < 2) {
    return {
      available: false,
      expectedCount,
      observedCounts: series.map((arr) => arr.length),
    };
  }

  const minIous = [];
  const maxOverlapByMinArea = [];

  for (let idx = 0; idx < expectedCount; idx += 1) {
    const ious = [];
    for (let i = 1; i < series.length; i += 1) {
      ious.push(rectIoU(series[i - 1][idx]?.aabb || null, series[i][idx]?.aabb || null));
    }
    minIous.push(minFinite(ious));
  }

  if (key === 'letters') {
    for (const arr of series) {
      for (let i = 0; i < arr.length - 1; i += 1) {
        maxOverlapByMinArea.push(rectOverlapByMinArea(arr[i]?.aabb || null, arr[i + 1]?.aabb || null));
      }
    }
  }

  return {
    available: true,
    expectedCount,
    observedCounts: series.map((arr) => arr.length),
    perIndexMinConsecutiveIoU: minIous,
    minConsecutiveIoUOverall: minFinite(minIous),
    maxAdjacentOverlapByMinArea: key === 'letters' ? maxFinite(maxOverlapByMinArea) : null,
  };
}

function buildReadiness({ checkpointEntries, whole, zones, letters }) {
  const morphValues = checkpointEntries
    .map((e) => safeNumber(e?.renderer?.uniforms?.uMorphProgress))
    .filter((v) => Number.isFinite(v));
  const morphMin = morphValues.length ? Math.min(...morphValues) : null;

  const wholeReady =
    whole.available === true &&
    Number.isFinite(whole.minConsecutiveIoU) &&
    whole.minConsecutiveIoU >= 0.72 &&
    Number.isFinite(whole.maxCenterDriftNorm) &&
    whole.maxCenterDriftNorm <= 0.1 &&
    (!Number.isFinite(morphMin) || morphMin >= 0.999);

  const zoneReady =
    wholeReady &&
    zones.available === true &&
    Number.isFinite(zones.minConsecutiveIoUOverall) &&
    zones.minConsecutiveIoUOverall >= 0.55;

  const letterReady =
    wholeReady &&
    letters.available === true &&
    Number.isFinite(letters.minConsecutiveIoUOverall) &&
    letters.minConsecutiveIoUOverall >= 0.45 &&
    Number.isFinite(letters.maxAdjacentOverlapByMinArea) &&
    letters.maxAdjacentOverlapByMinArea <= 0.35;

  let recommendedModel = 'none';
  if (letterReady) recommendedModel = 'per-letter';
  else if (zoneReady) recommendedModel = 'zone-based';
  else if (wholeReady) recommendedModel = 'whole-word';

  return {
    morphMin,
    wholeWord: {
      ready: wholeReady,
      reason: wholeReady
        ? 'Whole-word anchor is spatially stable across lock/drift checkpoints.'
        : 'Whole-word stability thresholds not fully met.',
    },
    perLetter: {
      ready: letterReady,
      reason: letterReady
        ? 'Four letter clusters are stable enough for distinct hit regions.'
        : 'Letter clusters are not stable/separate enough for safe per-letter attachment.',
    },
    zoneBased: {
      ready: zoneReady,
      reason: zoneReady
        ? 'Zone boundaries are stable enough for left/center/right interaction regions.'
        : 'Zone stability thresholds not fully met.',
    },
    recommendedModel,
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const runStamp = nowStamp();
  const runDir = path.join(OUTPUT_ROOT, `run-${runStamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

  await page.addInitScript(() => {
    const MAX_EVENTS = 128;

    const getAabbFromTriples = (triples) => {
      if (!Array.isArray(triples) || triples.length === 0) return null;
      let minX = Infinity;
      let minY = Infinity;
      let minZ = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let maxZ = -Infinity;
      for (const p of triples) {
        const x = p.x;
        const y = p.y;
        const z = p.z;
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

    const samplePoints = (arr, maxPoints = 3500) => {
      if (!(arr instanceof Float32Array) || arr.length < 3) return [];
      const count = Math.floor(arr.length / 3);
      const step = Math.max(1, Math.floor(count / Math.max(1, maxPoints)));
      const points = [];
      for (let i = 0; i < count; i += step) {
        const j = i * 3;
        points.push({ idx: i, x: arr[j], y: arr[j + 1], z: arr[j + 2] });
      }
      return points;
    };

    const quantile = (values, q) => {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b);
      const pos = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q)));
      return sorted[pos];
    };

    const kmeans1D = (values, k, iterations = 24) => {
      if (!Array.isArray(values) || values.length < k || k <= 0) return null;
      const centroids = [];
      for (let i = 0; i < k; i += 1) {
        centroids.push(quantile(values, (i + 0.5) / k));
      }

      const labels = new Array(values.length).fill(0);

      for (let it = 0; it < iterations; it += 1) {
        const sums = new Array(k).fill(0);
        const counts = new Array(k).fill(0);

        for (let i = 0; i < values.length; i += 1) {
          const x = values[i];
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let c = 0; c < k; c += 1) {
            const d = Math.abs(x - centroids[c]);
            if (d < bestDist) {
              bestDist = d;
              bestIdx = c;
            }
          }
          labels[i] = bestIdx;
          sums[bestIdx] += x;
          counts[bestIdx] += 1;
        }

        for (let c = 0; c < k; c += 1) {
          if (counts[c] > 0) {
            centroids[c] = sums[c] / counts[c];
          }
        }
      }

      return { labels, centroids };
    };

    const readAttr = (name) => {
      const d = window.__rendererDiagnostics;
      if (!d || typeof d.getAttributeArray !== 'function') return null;
      try {
        return d.getAttributeArray(name);
      } catch {
        return null;
      }
    };

    if (!window.__uiAnchorAuditTap) {
      window.__uiAnchorAuditTap = { events: [] };
    }

    const tap = () => {
      const bus = window.BeatBus || window.__BeatBus;
      if (!bus || typeof bus.on !== 'function' || window.__uiAnchorAuditTap?.installed) return;

      const off = bus.on('BLUEPRINT_READY', (payload = {}) => {
        const bp = payload?.blueprint || {};
        window.__uiAnchorAuditTap.events.push({
          ts: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
          stage: payload?.stage || bp?.stage || null,
          sourceText: payload?.sourceText || payload?.word || null,
          typographyWord: bp?.metadata?.typography?.word ?? null,
          assignedTextParticles: bp?.metadata?.typography?.assignedTextParticles ?? null,
          activeCount: bp?.activeCount ?? bp?.particleCount ?? null,
        });

        if (window.__uiAnchorAuditTap.events.length > MAX_EVENTS) {
          window.__uiAnchorAuditTap.events.splice(0, window.__uiAnchorAuditTap.events.length - MAX_EVENTS);
        }
      });

      window.__uiAnchorAuditTap.installed = true;
      window.__uiAnchorAuditTap.off = off;
    };

    const id = setInterval(tap, 50);
    setTimeout(() => clearInterval(id), 20000);
    tap();

    window.__uiAnchorAuditCompute = (options = {}) => {
      const text = readAttr('text3DPosition');
      const canonical = window.Canonical || null;
      const stage = typeof window.stageAtom?.getState === 'function' ? window.stageAtom.getState() : null;
      const renderer = typeof window.__dumpRendererState === 'function' ? window.__dumpRendererState() : null;

      const count = text instanceof Float32Array ? Math.floor(text.length / 3) : 0;
      const points = samplePoints(text, Number.isFinite(options.maxSamplePoints) ? options.maxSamplePoints : 3500);
      const wholeWordAabb = getAabbFromTriples(points);

      const xs = points.map((p) => p.x);
      const q33 = quantile(xs, 1 / 3);
      const q66 = quantile(xs, 2 / 3);

      const zoneMap = {
        left: [],
        center: [],
        right: [],
      };

      for (const p of points) {
        let zone = 'center';
        if (q33 !== null && p.x <= q33) zone = 'left';
        else if (q66 !== null && p.x >= q66) zone = 'right';
        zoneMap[zone].push(p);
      }

      const zones = ['left', 'center', 'right'].map((id) => ({
        id,
        pointCount: zoneMap[id].length,
        aabb: getAabbFromTriples(zoneMap[id]),
      }));

      const letterLabels = ['F', 'O', 'R', 'M'];
      let letters = [];
      const kmeans = kmeans1D(xs, Math.min(4, Math.max(0, xs.length)), 20);
      if (kmeans && xs.length >= 40) {
        const groups = new Map();
        for (let i = 0; i < points.length; i += 1) {
          const label = kmeans.labels[i];
          if (!groups.has(label)) groups.set(label, []);
          groups.get(label).push(points[i]);
        }

        letters = [...groups.entries()]
          .map(([clusterId, pts]) => ({
            clusterId,
            pointCount: pts.length,
            centerX: pts.reduce((acc, p) => acc + p.x, 0) / Math.max(1, pts.length),
            aabb: getAabbFromTriples(pts),
          }))
          .sort((a, b) => a.centerX - b.centerX)
          .map((entry, index) => ({
            id: `letter-${index}`,
            labelEstimate: letterLabels[index] || null,
            clusterId: entry.clusterId,
            pointCount: entry.pointCount,
            centerX: entry.centerX,
            aabb: entry.aabb,
          }));

        for (let i = 0; i < points.length; i += 1) {
          const cid = kmeans.labels[i];
          points[i].cluster = Number.isFinite(cid) ? String(cid) : '';
        }
      }

      for (const p of points) {
        if (!p.zone) {
          if (q33 !== null && p.x <= q33) p.zone = 'left';
          else if (q66 !== null && p.x >= q66) p.zone = 'right';
          else p.zone = 'center';
        }
      }

      const bpEvents = Array.isArray(window.__uiAnchorAuditTap?.events)
        ? window.__uiAnchorAuditTap.events.slice(-32)
        : [];
      const lastBp = bpEvents.length ? bpEvents[bpEvents.length - 1] : null;

      return {
        capturedAt: new Date().toISOString(),
        authority: {
          resolvedWord: canonical?.landingStageSliceResolved?.word ?? null,
          stageVelocityWord: canonical?.stages?.velocity?.word ?? null,
          visualVelocityWord: canonical?.visual?.letterGeometry?.velocity?.word ?? null,
          canonicalStageWord:
            typeof canonical?.getStageWord === 'function' ? canonical.getStageWord('velocity') : null,
          blueprintSourceText: lastBp?.sourceText ?? null,
          blueprintTypographyWord: lastBp?.typographyWord ?? null,
        },
        stage: {
          currentStage: stage?.currentStage ?? null,
          stageProgress: stage?.stageProgress ?? null,
          morphProgressState: stage?.morphProgress ?? null,
        },
        renderer: {
          drawCount: renderer?.drawRange?.count ?? null,
          camera: renderer?.camera ?? null,
          uniforms: {
            uMorphProgress: renderer?.uniforms?.uMorphProgress ?? null,
            uPointSize: renderer?.uniforms?.uPointSize ?? null,
            uGaussianSigma: renderer?.uniforms?.uGaussianSigma ?? null,
            uOpacityMin: renderer?.uniforms?.uOpacityMin ?? null,
            uOpacityMax: renderer?.uniforms?.uOpacityMax ?? null,
          },
        },
        blueprint: {
          assignedTextParticles: lastBp?.assignedTextParticles ?? null,
          activeCount: lastBp?.activeCount ?? null,
        },
        anchor: {
          pointCount: count,
          wholeWordAabb,
          zones,
          letters,
          samplePoints: points,
        },
      };
    };
  });

  let stageStartTs = null;
  const consoleLogs = [];
  const importantLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('[ConsciousnessTheater] Landing stage mode started')) {
      stageStartTs = Date.now();
    }
    if (/Landing stage mode started|BLUEPRINT_READY|Resolved word|UI anchor/i.test(text)) {
      importantLogs.push({ ts: Date.now(), text });
    }
  });

  console.log(`[ui-anchor-audit] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => typeof window.__dumpRendererState === 'function', null, { timeout: 45000 });
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

  const checkpointEntries = [];
  const csvPaths = [];

  for (const offsetMs of CHECKPOINTS) {
    const targetTs = stageStartTs + offsetMs;
    await wait(targetTs - Date.now());

    const snapshot = await page.evaluate(
      ({ maxSamplePoints }) => window.__uiAnchorAuditCompute?.({ maxSamplePoints }) || null,
      { maxSamplePoints: 3500 }
    );

    if (!snapshot) continue;
    checkpointEntries.push({ offsetMs, ...snapshot });

    const csvPath = path.join(runDir, `anchor-points-${String(offsetMs).padStart(5, '0')}ms.csv`);
    writePointsCsv(csvPath, snapshot?.anchor?.samplePoints || []);
    csvPaths.push(csvPath);
  }

  const whole = computeWholeStability(checkpointEntries.map((c) => ({
    offsetMs: c.offsetMs,
    wholeWordAabb: c?.anchor?.wholeWordAabb || null,
  })));

  const zones = computeIndexedSeriesStability(
    checkpointEntries.map((c) => ({ zones: c?.anchor?.zones || [] })),
    'zones',
    3
  );

  const letters = computeIndexedSeriesStability(
    checkpointEntries.map((c) => ({ letters: c?.anchor?.letters || [] })),
    'letters',
    4
  );

  const readiness = buildReadiness({ checkpointEntries, whole, zones, letters });

  const authoritySnapshots = checkpointEntries.map((c) => c.authority || {});
  const authorityUnique = {
    resolvedWord: [...new Set(authoritySnapshots.map((a) => a.resolvedWord).filter(Boolean))],
    stageVelocityWord: [...new Set(authoritySnapshots.map((a) => a.stageVelocityWord).filter(Boolean))],
    visualVelocityWord: [...new Set(authoritySnapshots.map((a) => a.visualVelocityWord).filter(Boolean))],
    canonicalStageWord: [...new Set(authoritySnapshots.map((a) => a.canonicalStageWord).filter(Boolean))],
    blueprintSourceText: [...new Set(authoritySnapshots.map((a) => a.blueprintSourceText).filter(Boolean))],
    blueprintTypographyWord: [...new Set(authoritySnapshots.map((a) => a.blueprintTypographyWord).filter(Boolean))],
  };

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      runDir,
      url: URL,
      stageStartDetected: !!stageStartTs,
      checkpointsMs: CHECKPOINTS,
    },
    authority: {
      snapshots: authoritySnapshots,
      uniqueValues: authorityUnique,
      aligned:
        new Set(
          [
            ...authorityUnique.resolvedWord,
            ...authorityUnique.stageVelocityWord,
            ...authorityUnique.visualVelocityWord,
            ...authorityUnique.canonicalStageWord,
            ...authorityUnique.blueprintTypographyWord,
          ]
            .filter((v) => typeof v === 'string')
            .map((v) => v.trim().toUpperCase())
        ).size <= 1,
    },
    checkpoints: checkpointEntries.map((entry) => ({
      offsetMs: entry.offsetMs,
      capturedAt: entry.capturedAt,
      stage: entry.stage,
      renderer: entry.renderer,
      blueprint: entry.blueprint,
      anchor: {
        pointCount: entry?.anchor?.pointCount ?? null,
        wholeWordAabb: entry?.anchor?.wholeWordAabb ?? null,
        zones: entry?.anchor?.zones ?? null,
        letters: entry?.anchor?.letters ?? null,
      },
    })),
    stability: {
      wholeWord: whole,
      zoneBased: zones,
      perLetter: letters,
    },
    readiness,
    runtimeExportRecommendation: {
      required: [
        'stage.currentStage',
        'renderer.uniforms.uMorphProgress',
        'anchor.wholeWordAabb',
      ],
      optional: [
        'anchor.zones[left|center|right].aabb',
        'anchor.letters[F|O|R|M].aabb (when letter readiness passes)',
      ],
      suggestedWindowField: 'window.__landingUiAnchor',
    },
    artifacts: {
      pointCsvFiles: csvPaths,
    },
    console: {
      important: importantLogs,
      tail: consoleLogs.slice(-200),
    },
  };

  const reportPath = path.join(runDir, `landing-ui-anchor-audit-${runStamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`[ui-anchor-audit] Report: ${reportPath}`);
  console.log(
    JSON.stringify(
      {
        reportPath,
        checkpointsMs: CHECKPOINTS,
        readiness: report.readiness,
        recommendedModel: report.readiness?.recommendedModel || 'none',
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error('[ui-anchor-audit] Failed');
  console.error(error);
  process.exit(1);
});
