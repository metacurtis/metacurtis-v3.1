import { Canonical } from '@/config/canonical/canonicalAuthority.js';

const DEFAULT_CHARS_PER_SECOND = 15;
const MIN_CHARS_PER_SECOND = 4;
const MAX_CHARS_PER_SECOND = 45;

function coerceNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cloneBeat(beat) {
  try {
    return structuredClone(beat);
  } catch {
    return JSON.parse(JSON.stringify(beat || null));
  }
}

function computeDurationMs(text, declaredDuration) {
  const safeText = normalizeText(text);
  const declared = coerceNumber(declaredDuration, 0);
  if (declared > 0) return declared;
  if (!safeText.length) return 0;
  return Math.round((safeText.length / DEFAULT_CHARS_PER_SECOND) * 1000);
}

function computeCharsPerSecond(text, durationMs) {
  const safeText = normalizeText(text);
  const safeDuration = Math.max(durationMs, 1);
  const cps = safeText.length ? (safeText.length / (safeDuration / 1000)) : DEFAULT_CHARS_PER_SECOND;
  if (!Number.isFinite(cps) || cps <= 0) return DEFAULT_CHARS_PER_SECOND;
  return Math.max(MIN_CHARS_PER_SECOND, Math.min(MAX_CHARS_PER_SECOND, cps));
}

function resolveNarrationOffset(stageName) {
  const stage = Canonical?.stages?.[stageName] || {};
  const stageTimeline = stage?.openingTimeline || {};
  const narrativeStage = Canonical?.narrative?.stages?.[stageName] || {};
  const narrativeTimeline = narrativeStage?.timeline || {};

  const offsets = [
    stageTimeline?.narration?.startAtMs,
    stageTimeline?.narrationStartMs,
    narrativeTimeline?.narration?.startAtMs,
    narrativeTimeline?.narrationStartMs,
  ].map((value) => coerceNumber(value, 0));

  return offsets.find((value) => value > 0) ?? 0;
}

function buildStageNarrative(stageName) {
  if (!stageName) return null;

  const beatSheet = Canonical?.narrative?.beatSheets?.[stageName];
  if (!beatSheet) return null;

  const beats = Array.isArray(beatSheet.beats) ? beatSheet.beats : [];
  if (!beats.length) return null;

  const startOffset = resolveNarrationOffset(stageName);
  const normalizedSegments = [];
  let maxEndMs = 0;

  beats.forEach((beat, index) => {
    const narration = beat?.narration || {};
    const text = normalizeText(narration.text || beat?.text || '');
    const baseDuration = computeDurationMs(text, narration.duration ?? beat?.duration);
    const start = Math.max(0, coerceNumber(beat?.time, 0) + startOffset);
    const duration = Math.max(0, baseDuration);
    const endTime = start + duration;
    if (endTime > maxEndMs) {
      maxEndMs = endTime;
    }

    const segment = Object.freeze({
      id: narration.id || beat?.id || `${stageName}_beat_${index}`,
      text,
      timing: Object.freeze({
        start,
        duration,
      }),
      visual: beat?.visual ?? narration.visual ?? null,
      charsPerSecond: narration.charsPerSecond
        ? coerceNumber(narration.charsPerSecond, DEFAULT_CHARS_PER_SECOND)
        : computeCharsPerSecond(text, duration || 1),
      metadata: Object.freeze({
        beatIndex: index,
        canonicalTime: coerceNumber(beat?.time, 0),
      }),
    });

    normalizedSegments.push(segment);
  });

  const totalDuration = coerceNumber(beatSheet?.totalDuration, maxEndMs);

  return Object.freeze({
    id: beatSheet?.id || `narration_${stageName}`,
    stage: stageName,
    totalDuration,
    startOffset,
    beats: Object.freeze(beats.map(cloneBeat)),
    narration: Object.freeze({
      segments: Object.freeze(normalizedSegments),
    }),
  });
}

const dialogueCache = Object.create(null);

function ensureStage(stageName) {
  if (!stageName) return null;
  if (dialogueCache[stageName]) return dialogueCache[stageName];
  const built = buildStageNarrative(stageName);
  if (!built) return null;
  dialogueCache[stageName] = built;
  return built;
}

export const NARRATIVE_DIALOGUE = new Proxy({}, {
  get(_target, key) {
    if (typeof key !== 'string') return undefined;
    return ensureStage(key) || undefined;
  },
  has(_target, key) {
    if (typeof key !== 'string') return false;
    return Boolean(ensureStage(key));
  },
  ownKeys() {
    return Canonical?.stageOrder || Object.keys(Canonical?.narrative?.beatSheets || {});
  },
  getOwnPropertyDescriptor(target, prop) {
    if (!this.has(target, prop)) return undefined;
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

export function getNarrativeForStage(stageName) {
  const stage = ensureStage(stageName);
  if (!stage) return null;
  return stage;
}

export function getNarrationSegments(stageName) {
  const stage = ensureStage(stageName);
  if (!stage) return [];
  // Return defensive copies to prevent mutation downstream.
  return stage.narration.segments.map((segment) => ({
    ...segment,
    timing: { ...segment.timing },
    metadata: { ...segment.metadata },
  }));
}

export function getDialogueSegment(stageName, segmentId) {
  if (!segmentId) return null;
  const segments = getNarrationSegments(stageName);
  return segments.find((segment) => segment.id === segmentId) || null;
}

export function getParticleCuesForStage(stageName) {
  const segments = getNarrationSegments(stageName);
  if (!segments.length) return [];
  return segments
    .filter((segment) => segment.visual)
    .map((segment) => ({
      timing: segment.timing.start,
      cue: segment.visual,
      segmentId: segment.id,
    }));
}
