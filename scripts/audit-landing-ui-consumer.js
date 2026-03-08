/* eslint-disable no-console */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { resolveAnchorModel } from '../src/hooks/useLandingUiAnchor.js';

const URL =
  process.env.LANDING_URL ||
  'http://127.0.0.1:5173/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA';
const UI_VARIANT = (() => {
  try {
    const raw = (new globalThis.URL(URL).searchParams.get('ui') || 'pill').toLowerCase();
    return raw === 'console' ? 'console' : 'pill';
  } catch {
    return 'pill';
  }
})();

const OUTPUT_ROOT = path.join(process.cwd(), 'reports', 'landing-ui-consumer-audit');
const STAGE_START_TIMEOUT_MS = Number(process.env.STAGE_START_TIMEOUT_MS || 20000);
const OBSERVE_WINDOW_MS = Number(process.env.UI_CONSUMER_OBSERVE_WINDOW_MS || 14000);
const POLL_INTERVAL_MS = Number(process.env.UI_CONSUMER_POLL_INTERVAL_MS || 250);

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildFallbackCases(payload) {
  const baseRect = payload?.whole?.screenRect || {
    min: { x: 400, y: 240 },
    max: { x: 680, y: 420 },
    size: { w: 280, h: 180 },
    center: { x: 540, y: 330 },
  };

  const zonePayload = {
    ...payload,
    stability: {
      wholeReady: true,
      perLetterReady: false,
      zoneReady: true,
    },
    letters: [],
    zones: [
      { id: 'left', screenRect: baseRect },
      { id: 'center', screenRect: baseRect },
      { id: 'right', screenRect: baseRect },
    ],
  };

  const wholePayload = {
    ...payload,
    stability: {
      wholeReady: true,
      perLetterReady: false,
      zoneReady: false,
    },
    letters: [],
    zones: [],
    whole: {
      ...(payload?.whole || {}),
      screenRect: baseRect,
    },
  };

  const nonePayload = {
    ...payload,
    stability: {
      wholeReady: false,
      perLetterReady: false,
      zoneReady: false,
    },
    letters: [],
    zones: [],
    whole: {
      ...(payload?.whole || {}),
      screenRect: {
        min: { x: null, y: null },
        max: { x: null, y: null },
        size: { w: null, h: null },
        center: { x: null, y: null },
      },
    },
  };

  return {
    zone: resolveAnchorModel(zonePayload).model,
    whole: resolveAnchorModel(wholePayload).model,
    none: resolveAnchorModel(nonePayload).model,
  };
}

function evaluateChecks({
  uiVariant,
  finalSnapshot,
  descriptor,
  observedReady,
  snapshotSignals,
  interactionChecks,
}) {
  const checks = [];
  const add = (name, pass, details = null) => checks.push({ name, pass: !!pass, details });

  const payload = finalSnapshot?.payload || null;
  const overlay = finalSnapshot?.overlay || null;
  const pill = finalSnapshot?.pill || null;
  const dock = finalSnapshot?.dock || null;
  const rail = finalSnapshot?.rail || null;
  const affordances = finalSnapshot?.affordances || null;

  const expectedModel = resolveAnchorModel(payload).model;
  const fallbackCases = buildFallbackCases(payload || {});

  add('payload exists', payload != null);
  add('payload version = 1.1', payload?.version === '1.1', { actual: payload?.version ?? null });
  add('runtime getter present', descriptor?.hasGetter === true, descriptor);
  add('runtime setter absent', descriptor?.hasSetter === false, descriptor);
  add('runtime sourceScenarioId preserved', payload?.sourceScenarioId === 'target_scale_up_1_6', {
    actual: payload?.sourceScenarioId,
  });
  add('runtime stage preserved', payload?.stage === 'velocity', { actual: payload?.stage });
  add('runtime word preserved', payload?.word === 'FORM', { actual: payload?.word });
  add('recommended model preserved', payload?.recommendedModel === 'per-letter', {
    actual: payload?.recommendedModel,
  });

  if (uiVariant === 'pill') {
    add('pill nav exists', pill?.exists === true, pill);
    add('overlay suppressed in pill variant', overlay?.exists === false, overlay);
    add('pill has work item', pill?.hasWorkItem === true, pill);
    add('pill has contact item', pill?.hasContactItem === true, pill);
    add(
      'pill active item present',
      typeof pill?.activeId === 'string' && pill.activeId.length > 0,
      { activeId: pill?.activeId ?? null }
    );
    add('ready observed during run', observedReady === true, { observedReady });
    add('pill work scroll works', interactionChecks?.workScrollWorked === true, interactionChecks?.workScroll);
    add('pill contact scroll works', interactionChecks?.contactScrollWorked === true, interactionChecks?.contactScroll);
  } else {
    add('overlay exists', overlay?.exists === true, overlay);
    add('dock exists', dock?.exists === true, dock);
    add('glass rail exists', rail?.exists === true, rail);
    add('overlay model matches resolver output', overlay?.modelAttr === expectedModel, {
      overlayModel: overlay?.modelAttr,
      expectedModel,
    });

    const expectedAttachMode = payload?.checkpoint === 'lock' ? 'word' : 'bottom';
    add('overlay attach mode matches checkpoint', overlay?.attachModeAttr === expectedAttachMode, {
      checkpoint: payload?.checkpoint ?? null,
      expectedAttachMode,
      actualAttachMode: overlay?.attachModeAttr ?? null,
    });

    add('fallback resolver supports zone', fallbackCases.zone === 'zone', fallbackCases);
    add('fallback resolver supports whole', fallbackCases.whole === 'whole', fallbackCases);
    add('fallback resolver supports none', fallbackCases.none === 'none', fallbackCases);
    const lockSignalPass = snapshotSignals?.lockObserved === true
      ? snapshotSignals?.lockPerLetterHitZones === true
      : true;
    add('lock per-letter exposes four hit zones', lockSignalPass, snapshotSignals);
    add('drift suppresses hit zones', snapshotSignals?.driftSuppressesHitZones === true, snapshotSignals);

    if (payload?.ready === true) {
      add('ready observed during run', observedReady === true, { observedReady });

      const dockBottomGapPx = asNumber(dock?.bottomGapPx);
      const dockBelowWholePx = asNumber(dock?.dockBelowWholePx);
      if (payload?.checkpoint === 'lock') {
        add(
          'lock: dock attaches below word',
          Number.isFinite(dockBelowWholePx) && dockBelowWholePx >= 0 && dockBelowWholePx <= 220,
          { dockBelowWholePx }
        );
      } else {
        add(
          'drift/other: dock is near bottom safe area',
          Number.isFinite(dockBottomGapPx) && dockBottomGapPx >= 0 && dockBottomGapPx <= 80,
          { dockBottomGapPx }
        );
      }

      const dockAnchorDistancePx = asNumber(dock?.distanceToWholeCenterXPx);
      add('dock x tracks whole center within 40px', Number.isFinite(dockAnchorDistancePx) && dockAnchorDistancePx <= 40, {
        dockAnchorDistancePx,
        thresholdPx: 40,
      });

      const railAnchorDistancePx = asNumber(rail?.distanceToWholeCenterXPx);
      add('rail x tracks whole center within 48px', Number.isFinite(railAnchorDistancePx) && railAnchorDistancePx <= 48, {
        railAnchorDistancePx,
        thresholdPx: 48,
      });

      add('dock buttons do not overlap', dock?.hasOverlap === false, {
        hasOverlap: dock?.hasOverlap,
        overlapPairs: dock?.overlapPairs,
      });
      add('rail layout does not overlap', rail?.hasOverlap === false, {
        hasOverlap: rail?.hasOverlap,
        overlapPairs: rail?.overlapPairs,
      });

      if (overlay?.modelAttr === 'per-letter') {
        add('per-letter model shows four letter slots', Number(dock?.letterCount) === 4, {
          letterCount: dock?.letterCount,
        });
        add('per-letter model shows letter bracket', affordances?.bracketExists === true, affordances);
        add('per-letter model shows dock-letter connector', affordances?.connectorExists === true, affordances);
      }

      add('panel CTA scroll works', interactionChecks?.panelScrollWorked === true, interactionChecks?.panelScroll);
      add('rail secondary CTA scroll works', interactionChecks?.railScrollWorked === true, interactionChecks?.railScroll);
    }
  }

  const failed = checks.filter((entry) => !entry.pass);
  return {
    pass: failed.length === 0,
    checks,
    failedChecks: failed,
    expectedModel,
    fallbackCases,
  };
}

async function readScrollState(page, targetId) {
  return page.evaluate((id) => {
    const root =
      document.querySelector('[data-ui="landing-scroll-root"]') ||
      document.scrollingElement ||
      document.documentElement;
    const target = document.getElementById(id);
    const rootScrollTop = root?.scrollTop ?? 0;
    const winScrollY = window.scrollY || 0;
    const scrollTop = root && root !== document.documentElement && root !== document.body
      ? rootScrollTop
      : winScrollY;
    const rect = target?.getBoundingClientRect?.() || null;

    return {
      scrollTop,
      targetVisible: !!target && !!rect && rect.top < (window.innerHeight * 0.55) && rect.bottom > 0,
      targetTop: rect?.top ?? null,
      targetBottom: rect?.bottom ?? null,
    };
  }, targetId);
}

async function clickDom(page, selector) {
  const clicked = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }));
    return true;
  }, selector);
  if (!clicked) {
    throw new Error(`Selector not found for click: ${selector}`);
  }
}

async function runScrollInteractions(page) {
  const result = {
    panelScrollWorked: false,
    railScrollWorked: false,
    panelScroll: null,
    railScroll: null,
  };

  try {
    const before = await readScrollState(page, 'foundation');
    await clickDom(page, '[data-ui-letter="F"]');
    await page.waitForTimeout(140);
    await clickDom(page, '[data-ui="dock-panel-cta"]');
    await page.waitForTimeout(900);
    const after = await readScrollState(page, 'foundation');
    result.panelScroll = { before, after };
    result.panelScrollWorked =
      (Number(after?.scrollTop) > Number(before?.scrollTop) + 8) ||
      after?.targetVisible === true;
  } catch (error) {
    result.panelScroll = { error: error?.message || String(error) };
  }

  try {
    const before = await readScrollState(page, 'offer');
    await clickDom(page, '[data-ui="rail-secondary-cta"]');
    await page.waitForTimeout(900);
    const after = await readScrollState(page, 'offer');
    result.railScroll = { before, after };
    result.railScrollWorked =
      (Number(after?.scrollTop) > Number(before?.scrollTop) + 8) ||
      after?.targetVisible === true;
  } catch (error) {
    result.railScroll = { error: error?.message || String(error) };
  }

  return result;
}

async function runPillInteractions(page) {
  const result = {
    workScrollWorked: false,
    contactScrollWorked: false,
    workScroll: null,
    contactScroll: null,
  };

  try {
    const before = await readScrollState(page, 'results');
    await clickDom(page, '[data-ui-pill-id="work"]');
    await page.waitForTimeout(900);
    const after = await readScrollState(page, 'results');
    result.workScroll = { before, after };
    result.workScrollWorked =
      (Number(after?.scrollTop) > Number(before?.scrollTop) + 8) ||
      after?.targetVisible === true;
  } catch (error) {
    result.workScroll = { error: error?.message || String(error) };
  }

  try {
    const before = await readScrollState(page, 'contact');
    await clickDom(page, '[data-ui-pill-id="contact"]');
    await page.waitForTimeout(900);
    const after = await readScrollState(page, 'contact');
    result.contactScroll = { before, after };
    result.contactScrollWorked =
      (Number(after?.scrollTop) > Number(before?.scrollTop) + 8) ||
      after?.targetVisible === true;
  } catch (error) {
    result.contactScroll = { error: error?.message || String(error) };
  }

  return result;
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
    if (/landing|anchor|overlay|BLUEPRINT_READY/i.test(text)) {
      importantLogs.push({ ts: Date.now(), text });
      if (importantLogs.length > 128) {
        importantLogs.splice(0, importantLogs.length - 128);
      }
    }
  });

  console.log(`[ui-consumer-audit] Opening ${URL}`);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.waitForFunction(() => typeof window.__landingUiAnchor !== 'undefined', null, { timeout: 45000 });
  if (UI_VARIANT === 'pill') {
    await page.waitForSelector('[data-ui="pill-nav"]', { timeout: 45000 });
  } else {
    await page.waitForSelector('[data-ui="landing-ui-overlay"]', { timeout: 45000 });
  }

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
    };
  });

  const observeStart = Date.now();
  const observeEnd = observeStart + OBSERVE_WINDOW_MS;
  while (Date.now() <= observeEnd) {
    const snapshot = await page.evaluate(() => {
      const payloadRaw = window.__landingUiAnchor;
      const payload = payloadRaw ? JSON.parse(JSON.stringify(payloadRaw)) : null;

      const toRect = (el) => {
        if (!el?.getBoundingClientRect) return null;
        const r = el.getBoundingClientRect();
        return {
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        };
      };
      const overlaps = (a, b) => {
        if (!a || !b) return false;
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      };

      const overlayEl = document.querySelector('[data-ui="landing-ui-overlay"]');
      const pillEl = document.querySelector('[data-ui="pill-nav"]');
      const pillItems = Array.from(document.querySelectorAll('[data-ui="pill-nav-item"]'));
      const dockEl = document.querySelector('[data-ui="letter-dock"]');
      const railEl = document.querySelector('[data-ui="glass-rail-cta"]');
      const bracketEl = document.querySelector('[data-ui="letter-bracket"]');
      const connectorEl = document.querySelector('[data-ui="dock-letter-connector"]');
      const letterEls = Array.from(document.querySelectorAll('[data-ui-letter]'));
      const hitZoneEls = Array.from(document.querySelectorAll('[data-ui="letter-hit-zone"]'));

      const viewport = {
        w: window.innerWidth,
        h: window.innerHeight,
      };

      const wholeCenterX = Number(payload?.whole?.screenRect?.center?.x);
      const wholeMaxY = Number(payload?.whole?.screenRect?.max?.y);

      const dockRect = dockEl?.getBoundingClientRect?.();
      const dockCenterX = dockRect ? dockRect.left + (dockRect.width / 2) : null;
      const dockBottomGapPx = dockRect ? (viewport.h - dockRect.bottom) : null;
      const dockDistanceToWholeCenterXPx = Number.isFinite(wholeCenterX) && Number.isFinite(dockCenterX)
        ? Math.abs(wholeCenterX - dockCenterX)
        : null;
      const dockBelowWholePx = Number.isFinite(wholeMaxY) && Number.isFinite(dockRect?.top)
        ? dockRect.top - wholeMaxY
        : null;

      const letterRects = letterEls.map((el) => ({
        id: el.getAttribute('data-ui-letter') || null,
        rect: toRect(el),
      }));
      const dockOverlapPairs = [];
      for (let i = 0; i < letterRects.length; i += 1) {
        for (let j = i + 1; j < letterRects.length; j += 1) {
          if (overlaps(letterRects[i]?.rect, letterRects[j]?.rect)) {
            dockOverlapPairs.push(`${letterRects[i]?.id}-${letterRects[j]?.id}`);
          }
        }
      }

      const railCenterX = railEl?.getBoundingClientRect
        ? railEl.getBoundingClientRect().left + (railEl.getBoundingClientRect().width / 2)
        : null;
      const railDistanceToWholeCenterXPx = Number.isFinite(wholeCenterX) && Number.isFinite(railCenterX)
        ? Math.abs(wholeCenterX - railCenterX)
        : null;

      const headlineRect = toRect(document.querySelector('[data-ui="rail-headline"]'));
      const secondaryRect = toRect(document.querySelector('[data-ui="rail-secondary-cta"]'));
      const primaryRect = toRect(document.querySelector('[data-ui="rail-primary-cta"]'));
      const chipRect = toRect(document.querySelector('[data-ui="checkpoint-chip"]'));
      const railOverlapPairs = [];
      const railRects = [
        { id: 'headline', rect: headlineRect },
        { id: 'secondary', rect: secondaryRect },
        { id: 'primary', rect: primaryRect },
        { id: 'chip', rect: chipRect },
      ];
      for (let i = 0; i < railRects.length; i += 1) {
        for (let j = i + 1; j < railRects.length; j += 1) {
          const a = railRects[i];
          const b = railRects[j];
          if (!a?.rect || !b?.rect) continue;
          if (overlaps(a.rect, b.rect)) {
            railOverlapPairs.push(`${a.id}-${b.id}`);
          }
        }
      }

      return {
        payload,
        overlay: {
          exists: !!overlayEl,
          readyAttr: overlayEl?.getAttribute('data-anchor-ready') || null,
          modelAttr: overlayEl?.getAttribute('data-anchor-model') || null,
          checkpointAttr: overlayEl?.getAttribute('data-anchor-checkpoint') || null,
          reasonAttr: overlayEl?.getAttribute('data-anchor-reason') || null,
          attachModeAttr: overlayEl?.getAttribute('data-attach-mode') || null,
        },
        pill: {
          exists: !!pillEl,
          itemCount: pillItems.length,
          activeId: pillItems.find((el) => el.getAttribute('data-active') === 'true')?.getAttribute('data-ui-pill-id') || null,
          hasWorkItem: !!document.querySelector('[data-ui-pill-id="work"]'),
          hasContactItem: !!document.querySelector('[data-ui-pill-id="contact"]'),
        },
        dock: {
          exists: !!dockEl,
          letterCount: letterEls.length,
          bottomGapPx: dockBottomGapPx,
          distanceToWholeCenterXPx: dockDistanceToWholeCenterXPx,
          dockBelowWholePx,
          hasOverlap: dockOverlapPairs.length > 0,
          overlapPairs: dockOverlapPairs,
          letterRects,
        },
        rail: {
          exists: !!railEl,
          checkpointAttr: railEl?.getAttribute('data-checkpoint') || null,
          distanceToWholeCenterXPx: railDistanceToWholeCenterXPx,
          hasOverlap: railOverlapPairs.length > 0,
          overlapPairs: railOverlapPairs,
        },
        hitZones: {
          count: hitZoneEls.length,
        },
        affordances: {
          bracketExists: !!bracketEl,
          connectorExists: !!connectorEl,
        },
      };
    });

    snapshots.push({ ts: Date.now(), ...snapshot });
    await wait(POLL_INTERVAL_MS);
  }

  const interactionChecks = UI_VARIANT === 'pill'
    ? await runPillInteractions(page)
    : await runScrollInteractions(page);
  await browser.close();

  const finalSnapshot = snapshots[snapshots.length - 1] || null;
  const observedReady = snapshots.some((entry) => entry?.payload?.ready === true);
  const snapshotSignals = UI_VARIANT === 'pill'
    ? {}
    : {
      lockObserved: snapshots.some((entry) =>
        entry?.payload?.ready === true
        && entry?.overlay?.checkpointAttr === 'lock'),
      lockPerLetterHitZones: snapshots.some((entry) =>
        entry?.payload?.ready === true
        && entry?.overlay?.checkpointAttr === 'lock'
        && entry?.overlay?.modelAttr === 'per-letter'
        && Number(entry?.hitZones?.count || 0) >= 4),
      driftSuppressesHitZones: snapshots.some((entry) =>
        entry?.payload?.ready === true
        && entry?.overlay?.checkpointAttr === 'drift'
        && Number(entry?.hitZones?.count || 0) === 0),
    };

  const validation = evaluateChecks({
    uiVariant: UI_VARIANT,
    finalSnapshot,
    descriptor,
    observedReady,
    snapshotSignals,
    interactionChecks,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    url: URL,
    uiVariant: UI_VARIANT,
    runDir,
    descriptor,
    observed: {
      stageStartObserved: stageStartTs != null,
      snapshotCount: snapshots.length,
      observedReady,
      finalReady: finalSnapshot?.payload?.ready ?? null,
      finalCheckpoint: finalSnapshot?.payload?.checkpoint ?? null,
      finalRecommendedModel: finalSnapshot?.payload?.recommendedModel ?? null,
      finalOverlayModel: finalSnapshot?.overlay?.modelAttr ?? null,
      finalAttachMode: finalSnapshot?.overlay?.attachModeAttr ?? null,
      finalDockBottomGapPx: finalSnapshot?.dock?.bottomGapPx ?? null,
      finalDockDistanceToWholeCenterXPx: finalSnapshot?.dock?.distanceToWholeCenterXPx ?? null,
      finalRailDistanceToWholeCenterXPx: finalSnapshot?.rail?.distanceToWholeCenterXPx ?? null,
      finalBracketExists: finalSnapshot?.affordances?.bracketExists ?? null,
      finalConnectorExists: finalSnapshot?.affordances?.connectorExists ?? null,
    },
    snapshotSignals,
    interactionChecks,
    finalSnapshot,
    checks: validation.checks,
    failedChecks: validation.failedChecks,
    resolver: {
      expectedModel: validation.expectedModel,
      fallbackCases: validation.fallbackCases,
    },
    pass: validation.pass,
    importantLogs,
  };

  const reportPath = path.join(runDir, `landing-ui-consumer-audit-${runStamp}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  if (!validation.pass) {
    console.error('[ui-consumer-audit] FAIL');
    console.error(`[ui-consumer-audit] Saved: ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  console.log('[ui-consumer-audit] PASS');
  console.log(`[ui-consumer-audit] Saved: ${reportPath}`);
}

main().catch((error) => {
  console.error('[ui-consumer-audit] Error:', error?.stack || error?.message || error);
  process.exit(1);
});
