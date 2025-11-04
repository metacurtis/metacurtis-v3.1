// src/dev/attachDiagnostics.js
// DEV-only, non-invasive diagnostics for full render path & state flow

const FILE_ID = `[attachDiagnostics] ${import.meta.url}`;
if (import.meta.env.DEV) console.log(`${FILE_ID} — loaded`);

const now = () => Date.now();
const rid = () => Math.random().toString(36).slice(2, 8);

async function safeImport(path) {
  try { return await import(/* @vite-ignore */ path); }
  catch { return null; }
}

export default async function attachDiagnostics() {
  if (!import.meta.env.DEV) return;
  if (globalThis.__DIAG_ATTACHED) return;
  globalThis.__DIAG_ATTACHED = true;

  const BusMod = await safeImport('@/modules/orchestration/core/BeatBus.js');
  const EventsMod = await safeImport('@/theater/events.js');
  const StageMod = await safeImport('@/stores/atoms/stageAtom.js');
  const QualityMod = await safeImport('@/stores/atoms/qualityAtom.js');

  const BeatBus = BusMod?.default;
  const EVENTS = EventsMod?.EVENTS || {};
  if (!BeatBus) {
    console.warn(`${FILE_ID} — BeatBus not available, diagnostics skipped`);
    return;
  }

  // ───────────────────────────────────────────────────────────────────
  // Trace wrapper: add traceId + source and keep a diag log (ring buffer)
  // ───────────────────────────────────────────────────────────────────
  const ringMax = 200;
  const diagLog = [];
  const emitOrig = BeatBus.emit.bind(BeatBus);

  BeatBus.emit = (evt, payload = {}) => {
    const traceId = payload.traceId || `${evt}-${rid()}`;
    const data = { ...payload, traceId, _source: payload._source || 'emit' };
    const entry = { t: now(), evt, data, _kind: 'emit' };
    diagLog.push(entry); if (diagLog.length > ringMax) diagLog.shift();
    try {
      return emitOrig(evt, data);
    } finally {
      if (import.meta.env.DEV) {
        console.log(`🧭 [TRACE] ${evt} (${traceId})`, data);
      }
    }
  };

  // Patch BeatBus.on to wrap handlers with trace logging
  const onOrig = BeatBus.on.bind(BeatBus);
  BeatBus.on = (evt, handler) => {
    const wrapped = (payload) => {
      const entry = { t: now(), evt, data: payload, _kind: 'recv' };
      diagLog.push(entry); if (diagLog.length > ringMax) diagLog.shift();
      if (import.meta.env.DEV) {
        console.log(`📬 [RECV] ${evt} (${payload?.traceId || 'no-trace'})`, payload);
      }
      handler?.(payload);
    };
    return onOrig(evt, wrapped);
  };

  // Sticky last formations for replays
  const offCTF = BeatBus.on(EVENTS.CTF_READY, (p) => {
    const f = p?.formation || p;
    if (f?.positions) globalThis.__LAST_CTF_FORMATION = f;
  });
  const offBP = BeatBus.on(EVENTS.BLUEPRINT_READY, (p) => {
    const bp = p?.blueprint || p;
    if (bp?.positions || bp?.atmosphericPositions) globalThis.__LAST_BLUEPRINT = bp;
  });

  // ───────────────────────────────────────────────────────────────────
  // Stage / Quality taps (best-effort, won’t throw if missing)
  // ───────────────────────────────────────────────────────────────────
  const stageAtom = StageMod?.stageAtom;
  const qualityAtom = QualityMod?.qualityAtom;
  const stageState = stageAtom?.getState?.() || {};
  const qualityState = qualityAtom?.getState?.() || {};

  let offStage = null;
  let offQuality = null;
  try {
    if (stageAtom?.subscribe) {
      offStage = stageAtom.subscribe((s) => {
        diagLog.push({ t: now(), evt: 'STAGE_ATOM', data: s, _kind: 'state' });
        if (import.meta.env.DEV) console.log('🧠 [STATE] stageAtom', s);
      });
    }
    if (qualityAtom?.subscribe) {
      offQuality = qualityAtom.subscribe((s) => {
        diagLog.push({ t: now(), evt: 'QUALITY_ATOM', data: s, _kind: 'state' });
        if (import.meta.env.DEV) console.log('🎛️ [STATE] qualityAtom', s);
      });
    }
  } catch {}

  // ───────────────────────────────────────────────────────────────────
  // Renderer taps (best-effort)
  // ───────────────────────────────────────────────────────────────────
  function renderSnapshot() {
    const mat = globalThis.__consciousnessMaterial;
    const geo = globalThis.__particleGeometry;
    const bg = globalThis.__webglBackground;

    const uniforms = mat?.uniforms ? Object.fromEntries(
      Object.entries(mat.uniforms).map(([k, v]) => [k, (v?.value?.toArray?.() || v?.value || v)])
    ) : null;

    const attrs = geo?.attributes ? Object.fromEntries(
      Object.entries(geo.attributes).map(([k, a]) => [k, { itemSize: a.itemSize, count: a.count }])
    ) : null;

    const active = mat?.uniforms?.uActiveCount?.value ?? null;

    return {
      hasMaterial: !!mat,
      hasGeometry: !!geo,
      hasBG: !!bg,
      activeCount: active,
      attributes: attrs,
      uniforms,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // Console API
  // ───────────────────────────────────────────────────────────────────
  globalThis.diag = {
    dumpBus: () => ({ listeners: BeatBus.listeners, log: BeatBus.eventLog, diagLog }),
    snapshot: () => renderSnapshot(),
    emitTestCTF: async () => {
      const positions = new Float32Array([0,0,0, 8,0,0, 0,8,0, 0,0,8]);
      const formation = { positions, count: 4 };
      globalThis.__LAST_CTF_FORMATION = formation;
      BeatBus.emit(EVENTS.CTF_READY, { formation, _source: 'diag' });
      return 'CTF_READY emitted';
    },
    assertPipeline: () => {
      const snap = renderSnapshot();
      const out = [];

      if (!snap.hasMaterial) out.push('❌ material missing');
      if (!snap.hasGeometry) out.push('❌ geometry missing');
      if (snap.attributes?.position?.count && snap.activeCount != null) {
        if (snap.activeCount > snap.attributes.position.count) {
          out.push(`❌ activeCount (${snap.activeCount}) > position.count (${snap.attributes.position.count})`);
        }
      }

      if (!out.length) out.push('✅ pipeline looks consistent');
      console.log('🔎 diag.assertPipeline()', { snap, out });
      return out;
    },
  };

  if (import.meta.env.DEV) {
    console.log(`${FILE_ID} — diagnostics attached`);
    console.log('🔧 window.diag API:', Object.keys(globalThis.diag));
    console.log('🧪 Try: diag.dumpBus(), diag.snapshot(), diag.emitTestCTF(), diag.assertPipeline()');
  }

  // Cleanup on HMR dispose (Vite)
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      offCTF?.(); offBP?.(); offStage?.(); offQuality?.();
      globalThis.__DIAG_ATTACHED = false;
    });
  }
}
