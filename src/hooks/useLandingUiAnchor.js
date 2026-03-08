import { useEffect, useState } from 'react';

function createNullVec3() {
  return { x: null, y: null, z: null };
}

function createNullScreenRect() {
  return {
    min: { x: null, y: null },
    max: { x: null, y: null },
    size: { w: null, h: null },
    center: { x: null, y: null },
  };
}

function createNullAabb() {
  return {
    min: createNullVec3(),
    max: createNullVec3(),
    size: createNullVec3(),
    center: createNullVec3(),
    screenRect: createNullScreenRect(),
  };
}

function createDefaultPayload() {
  return {
    version: '1.1',
    sourceScenarioId: 'target_scale_up_1_6',
    updatedAtMs: 0,
    ready: false,
    stage: 'velocity',
    word: 'FORM',
    checkpoint: 'unknown',
    recommendedModel: 'per-letter',
    whole: createNullAabb(),
    letters: [],
    zones: [],
    stability: {
      wholeReady: false,
      perLetterReady: false,
      zoneReady: false,
    },
  };
}

const DEFAULT_PAYLOAD = Object.freeze(createDefaultPayload());

function clonePayload(payload) {
  if (!payload || typeof payload !== 'object') return createDefaultPayload();
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(payload);
    } catch {
      // fallback below
    }
  }
  return JSON.parse(JSON.stringify(payload));
}

function finiteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeVec3(value) {
  return {
    x: finiteOrNull(value?.x),
    y: finiteOrNull(value?.y),
    z: finiteOrNull(value?.z),
  };
}

function normalizeScreenRect(value) {
  return {
    min: {
      x: finiteOrNull(value?.min?.x),
      y: finiteOrNull(value?.min?.y),
    },
    max: {
      x: finiteOrNull(value?.max?.x),
      y: finiteOrNull(value?.max?.y),
    },
    size: {
      w: finiteOrNull(value?.size?.w),
      h: finiteOrNull(value?.size?.h),
    },
    center: {
      x: finiteOrNull(value?.center?.x),
      y: finiteOrNull(value?.center?.y),
    },
  };
}

function normalizeAabb(value) {
  return {
    min: normalizeVec3(value?.min),
    max: normalizeVec3(value?.max),
    size: normalizeVec3(value?.size),
    center: normalizeVec3(value?.center),
    screenRect: normalizeScreenRect(value?.screenRect),
  };
}

function normalizeEntry(entry, fallbackId) {
  return {
    id: typeof entry?.id === 'string' ? entry.id : fallbackId,
    aabb: normalizeAabb(entry?.aabb),
    center: normalizeVec3(entry?.center),
    screenRect: normalizeScreenRect(entry?.screenRect),
  };
}

function hasFiniteScreenRectCenter(rect) {
  return Number.isFinite(Number(rect?.center?.x)) && Number.isFinite(Number(rect?.center?.y));
}

export function resolveAnchorModel(payload) {
  const letters = Array.isArray(payload?.letters) ? payload.letters : [];
  const zones = Array.isArray(payload?.zones) ? payload.zones : [];
  const stability = payload?.stability || {};

  const perLetterReady =
    stability.perLetterReady === true &&
    letters.length === 4 &&
    letters.every((entry) => hasFiniteScreenRectCenter(entry?.screenRect));
  if (perLetterReady) {
    return { model: 'per-letter', reason: 'stability.perLetterReady' };
  }

  const zoneReady =
    stability.zoneReady === true &&
    zones.length >= 3 &&
    zones.every((entry) => hasFiniteScreenRectCenter(entry?.screenRect));
  if (zoneReady) {
    return { model: 'zone', reason: 'stability.zoneReady fallback' };
  }

  const wholeReady =
    stability.wholeReady === true &&
    hasFiniteScreenRectCenter(payload?.whole?.screenRect);
  if (wholeReady) {
    return { model: 'whole', reason: 'stability.wholeReady fallback' };
  }

  return { model: 'none', reason: 'no valid screen-space anchors' };
}

function normalizePayload(payload) {
  const next = clonePayload(payload);
  const base = createDefaultPayload();

  const letters = Array.isArray(next?.letters)
    ? next.letters.map((entry, idx) => normalizeEntry(entry, ['F', 'O', 'R', 'M'][idx] || String(idx)))
    : [];

  const zones = Array.isArray(next?.zones)
    ? next.zones.map((entry, idx) => normalizeEntry(entry, ['left', 'center', 'right'][idx] || String(idx)))
    : [];

  return {
    ...base,
    ...next,
    version: typeof next?.version === 'string' ? next.version : base.version,
    sourceScenarioId: typeof next?.sourceScenarioId === 'string' ? next.sourceScenarioId : base.sourceScenarioId,
    updatedAtMs: finiteOrNull(next?.updatedAtMs) ?? 0,
    ready: next?.ready === true,
    stage: typeof next?.stage === 'string' ? next.stage : base.stage,
    word: typeof next?.word === 'string' ? next.word : base.word,
    checkpoint: typeof next?.checkpoint === 'string' ? next.checkpoint : base.checkpoint,
    recommendedModel: typeof next?.recommendedModel === 'string' ? next.recommendedModel : base.recommendedModel,
    whole: normalizeAabb(next?.whole),
    letters,
    zones,
    stability: {
      wholeReady: next?.stability?.wholeReady === true,
      perLetterReady: next?.stability?.perLetterReady === true,
      zoneReady: next?.stability?.zoneReady === true,
    },
  };
}

function readLandingUiAnchorPayload() {
  if (typeof window === 'undefined') return createDefaultPayload();
  return normalizePayload(window.__landingUiAnchor);
}

function blendNumber(prev, next, alpha) {
  const p = finiteOrNull(prev);
  const n = finiteOrNull(next);
  if (!Number.isFinite(n)) return null;
  if (!Number.isFinite(p)) return n;
  return p + ((n - p) * alpha);
}

function blendScreenRect(previousRect, nextRect, alpha) {
  const prev = normalizeScreenRect(previousRect);
  const next = normalizeScreenRect(nextRect);
  return {
    min: {
      x: blendNumber(prev.min.x, next.min.x, alpha),
      y: blendNumber(prev.min.y, next.min.y, alpha),
    },
    max: {
      x: blendNumber(prev.max.x, next.max.x, alpha),
      y: blendNumber(prev.max.y, next.max.y, alpha),
    },
    size: {
      w: blendNumber(prev.size.w, next.size.w, alpha),
      h: blendNumber(prev.size.h, next.size.h, alpha),
    },
    center: {
      x: blendNumber(prev.center.x, next.center.x, alpha),
      y: blendNumber(prev.center.y, next.center.y, alpha),
    },
  };
}

function smoothEntryById(prevEntries = [], nextEntries = [], alpha = 0.24) {
  const prevMap = new Map((Array.isArray(prevEntries) ? prevEntries : []).map((entry) => [entry.id, entry]));
  return (Array.isArray(nextEntries) ? nextEntries : []).map((entry) => {
    const prev = prevMap.get(entry.id);
    return {
      ...entry,
      screenRect: blendScreenRect(prev?.screenRect, entry?.screenRect, alpha),
    };
  });
}

function smoothDisplayPayload(previous, next, alpha = 0.24) {
  if (!previous || previous.ready !== true || next.ready !== true) {
    return next;
  }
  return {
    ...next,
    whole: {
      ...next.whole,
      screenRect: blendScreenRect(previous?.whole?.screenRect, next?.whole?.screenRect, alpha),
    },
    letters: smoothEntryById(previous?.letters, next?.letters, alpha),
    zones: smoothEntryById(previous?.zones, next?.zones, alpha),
  };
}

export default function useLandingUiAnchor(options = {}) {
  const pollMs = Number(options?.pollMs) > 0 ? Number(options.pollMs) : 120;
  const smoothing = Number(options?.smoothing);
  const alpha = Number.isFinite(smoothing) ? Math.max(0.05, Math.min(1, smoothing)) : 0.24;

  const [state, setState] = useState(() => {
    const raw = readLandingUiAnchorPayload();
    const resolved = resolveAnchorModel(raw);
    return {
      raw,
      display: raw,
      model: resolved.model,
      modelReason: resolved.reason,
      visible: raw.ready === true && resolved.model !== 'none',
      checkpoint: raw.checkpoint,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const tick = () => {
      const raw = readLandingUiAnchorPayload();

      setState((prev) => {
        const display = smoothDisplayPayload(prev?.display, raw, alpha);
        const resolved = resolveAnchorModel(raw);
        return {
          raw,
          display,
          model: resolved.model,
          modelReason: resolved.reason,
          visible: raw.ready === true && resolved.model !== 'none',
          checkpoint: raw.checkpoint,
        };
      });
    };

    tick();
    const intervalId = window.setInterval(tick, pollMs);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollMs, alpha]);

  return state;
}
