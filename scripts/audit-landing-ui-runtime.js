/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';

const OUTPUT_ROOT = path.join(process.cwd(), 'reports', 'landing-ui-runtime-audit');
const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 20000);
const OBSERVE_WINDOW_MS = Number(process.env.UI_RUNTIME_OBSERVE_WINDOW_MS || 14000);
const POLL_INTERVAL_MS = Number(process.env.UI_RUNTIME_POLL_INTERVAL_MS || 250);
const ALLOWED_CHECKPOINTS = new Set(['lock', 'drift', 'unknown']);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isVec3(value) {
  return isPlainObject(value)
    && Number.isFinite(Number(value.x))
    && Number.isFinite(Number(value.y))
    && Number.isFinite(Number(value.z));
}

function isNullVec3(value) {
  if (!isPlainObject(value)) return false;
  return value.x === null && value.y === null && value.z === null;
}

function isAabbObject(value) {
  return isPlainObject(value)
    && isPlainObject(value.min)
    && isPlainObject(value.max)
    && isPlainObject(value.size)
    && isPlainObject(value.center);
}

function isNullAabbObject(value) {
  return isAabbObject(value)
    && isNullVec3(value.min)
    && isNullVec3(value.max)
    && isNullVec3(value.size)
    && isNullVec3(value.center);
}

function validEntry(entry, expectedId) {
  if (!isPlainObject(entry) || typeof entry.id !== 'string') return false;
  if (entry.id !== expectedId) return false;
  if (!isAabbObject(entry.aabb)) return false;
  if (!isVec3(entry.center)) return false;
  return true;
}

function evaluateChecks({ payload, descriptor, observedReady }) {
  const checks = [];
  const add = (name, pass, details = null) => checks.push({ name, pass: !!pass, details });

  add('payload exists', payload != null);
  add('descriptor getter exists', descriptor?.hasGetter === true, descriptor);
  add('descriptor setter absent', descriptor?.hasSetter === false, descriptor);
  add('descriptor writable false-or-accessor', descriptor?.writable === null || descriptor?.writable === false, descriptor);

  add('version = 1.0', payload?.version === '1.0', { actual: payload?.version ?? null });
  add('sourceScenarioId = target_scale_up_1_6', payload?.sourceScenarioId === 'target_scale_up_1_6', {
    actual: payload?.sourceScenarioId ?? null,
  });
  add('stage = velocity', payload?.stage === 'velocity', { actual: payload?.stage ?? null });
  add('word = FORM', payload?.word === 'FORM', { actual: payload?.word ?? null });
  add('recommendedModel = per-letter', payload?.recommendedModel === 'per-letter', {
    actual: payload?.recommendedModel ?? null,
  });
  add('updatedAtMs finite', Number.isFinite(Number(payload?.updatedAtMs)), { actual: payload?.updatedAtMs ?? null });
  add('ready is boolean', typeof payload?.ready === 'boolean', { actual: typeof payload?.ready });
  add('checkpoint enum', ALLOWED_CHECKPOINTS.has(payload?.checkpoint), { actual: payload?.checkpoint ?? null });

  add('whole shape present', isAabbObject(payload?.whole), { actual: payload?.whole ?? null });
  add('letters array present', Array.isArray(payload?.letters), { length: payload?.letters?.length ?? null });
  add('zones array present', Array.isArray(payload?.zones), { length: payload?.zones?.length ?? null });

  const stability = payload?.stability;
  add('stability object present', isPlainObject(stability), { actual: stability ?? null });
  add('stability booleans present',
    typeof stability?.wholeReady === 'boolean'
      && typeof stability?.perLetterReady === 'boolean'
      && typeof stability?.zoneReady === 'boolean',
    { actual: stability ?? null }
  );

  if (payload?.ready === true) {
    add('ready payload has whole geometry', isAabbObject(payload.whole) && isVec3(payload.whole.min) && isVec3(payload.whole.max), {
      whole: payload.whole,
    });
    add('ready payload has four letters', Array.isArray(payload.letters) && payload.letters.length === 4, {
      count: payload?.letters?.length ?? null,
    });
    add('ready payload has three zones', Array.isArray(payload.zones) && payload.zones.length === 3, {
      count: payload?.zones?.length ?? null,
    });

    if (Array.isArray(payload?.letters)) {
      add(
        'letter entries shaped',
        validEntry(payload.letters[0], 'F')
          && validEntry(payload.letters[1], 'O')
          && validEntry(payload.letters[2], 'R')
          && validEntry(payload.letters[3], 'M'),
        { letters: payload.letters }
      );
    }

    if (Array.isArray(payload?.zones)) {
      add(
        'zone entries shaped',
        validEntry(payload.zones[0], 'left')
          && validEntry(payload.zones[1], 'center')
          && validEntry(payload.zones[2], 'right'),
        { zones: payload.zones }
      );
    }
  } else {
    add('not-ready payload has null whole', isNullAabbObject(payload?.whole), { whole: payload?.whole ?? null });
    add('not-ready payload has empty letters', Array.isArray(payload?.letters) && payload.letters.length === 0, {
      length: payload?.letters?.length ?? null,
    });
    add('not-ready payload has empty zones', Array.isArray(payload?.zones) && payload.zones.length === 0, {
      length: payload?.zones?.length ?? null,
    });
  }

  add('ready observed during run', observedReady === true, { observedReady });

  const failed = checks.filter((entry) => !entry.pass);
  return {
    pass: failed.length === 0,
    checks,
    failedChecks: failed,
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  const runStamp = nowStamp();
  const runDir = path.join(OUTPUT_ROOT, `run-${runStamp}`);
  fs.mkdirSync(runDir, { recursive: true });

  let stageStartTs = null;
  const importantLogs = [];
  const snapshots = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[ConsciousnessTheater] Landing stage mode started')) {
      stageStartTs = Date.now();
      importantLogs.push({ ts: Date.now(), text });
    }
    if (/landing|anchor|BLUEPRINT_READY/i.test(text)) {
      importantLogs.push({ ts: Date.now(), text });
      if (importantLogs.length > 128) {
        importantLogs.splice(0, importantLogs.length - 128);
      }
    }
  });

  console.log(`[ui-runtime-audit] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => typeof window.__landingUiAnchor !== 'undefined', null, { timeout: 45000 });

  const stageDeadline = Date.now() + STAGE_START_TIMEOUT_MS;
  while (!stageStartTs && Date.now() < stageDeadline) {
    await wait(50);
  }
  if (!stageStartTs) {
    throw new Error('Landing stage mode start was not observed.');
  }

  const descriptor = await page.evaluate(() => {
    const d = Object.getOwnPropertyDescriptor(window, '__landingUiAnchor');
    return {
      hasGetter: typeof d?.get === 'function',
      hasSetter: typeof d?.set === 'function',
      writable: typeof d?.writable === 'boolean' ? d.writable : null,
      configurable: typeof d?.configurable === 'boolean' ? d.configurable : null,
      enumerable: typeof d?.enumerable === 'boolean' ? d.enumerable : null,
    };
  });

  const observeStart = Date.now();
  const observeEnd = observeStart + OBSERVE_WINDOW_MS;
  while (Date.now() <= observeEnd) {
    const snapshot = await page.evaluate(() => {
      const payload = window.__landingUiAnchor;
      if (payload == null) return null;
      return JSON.parse(JSON.stringify(payload));
    });
    if (snapshot) {
      snapshots.push({
        ts: Date.now(),
        payload: snapshot,
      });
    }
    await wait(POLL_INTERVAL_MS);
  }

  await browser.close();

  const latestPayload = snapshots.length ? snapshots[snapshots.length - 1].payload : null;
  const observedReady = snapshots.some((entry) => entry?.payload?.ready === true);

  const validation = evaluateChecks({
    payload: latestPayload,
    descriptor,
    observedReady,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    url: URL,
    runDir,
    descriptor,
    observed: {
      stageStartObserved: stageStartTs != null,
      snapshotCount: snapshots.length,
      observedReady,
      firstReadyAtMs: snapshots.find((entry) => entry?.payload?.ready === true)?.payload?.updatedAtMs ?? null,
      latestPayloadReady: latestPayload?.ready ?? null,
      latestCheckpoint: latestPayload?.checkpoint ?? null,
    },
    latestPayload,
    checks: validation.checks,
    failedChecks: validation.failedChecks,
    pass: validation.pass,
    importantLogs,
  };

  const reportPath = path.join(runDir, `landing-ui-runtime-audit-${runStamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!validation.pass) {
    console.error('[ui-runtime-audit] FAIL');
    console.error(`[ui-runtime-audit] Saved: ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  console.log('[ui-runtime-audit] PASS');
  console.log(`[ui-runtime-audit] Saved: ${reportPath}`);
}

main().catch((error) => {
  console.error('[ui-runtime-audit] Error:', error?.stack || error?.message || error);
  process.exit(1);
});
