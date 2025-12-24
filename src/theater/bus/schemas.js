/**
 * RENDER_DIRECTIVE Schema
 *
 * This file is the schema implementation of the contract defined in:
 *   docs/render-directive-contract.md
 *
 * INVARIANTS:
 * - The shape of RENDER_DIRECTIVE MUST match the documented contract.
 * - New fields MUST NOT be added here without updating the doc and
 *   src/theater/contracts/renderDirectiveFields.js.
 * - Deprecated fields MUST be explicitly marked as such in both places.
 */
import { RENDER_DIRECTIVE_FIELDS } from '../contracts/renderDirectiveFields.js';
export const DEFAULT_SCHEMA_VERSION = '1.0.0';

const BaseSchema = {
  required: {
    timestamp: 'number',
    source: 'string',
  },
  optional: {
    _extended: 'object',
    _meta: 'object',
  },
};

const RENDER_DIRECTIVE_FIELD_TYPE_MAP = {
  kind: 'string',
  phase: 'string',
  stage: 'string',
  channel: 'string',
  uMotionMode: 'number',
  uParticlePhase: 'number',
  uFlowTurbulence: 'number',
  uParticleFlash: 'number',
  uOpacityMin: 'number',
  uOpacityMax: 'number',
  uMorphProgress: 'number',
  uStageProgress: 'number',
  activeCount: 'number',
  pointSize: 'number',
  gaussianSigma: 'number',
  tierHighlight: 'object',
  uniforms: 'object',
  // @deprecated — legacy alias for uMorphProgress
  morphProgress: 'number',
  drawCount: 'number',
  enterQrMode: 'boolean',
  exitQrMode: 'boolean',
  verb: 'string',
  effect: 'object',
  stageIndex: 'number',
  scrollPercent: 'number',
  easing: 'string',
  durationMs: 'number',
  atMs: 'number',
  camera: 'object',
  cueId: 'string',
};

const renderDirectiveProperties = {};
for (const field of RENDER_DIRECTIVE_FIELDS) {
  if (RENDER_DIRECTIVE_FIELD_TYPE_MAP[field]) {
    renderDirectiveProperties[field] = RENDER_DIRECTIVE_FIELD_TYPE_MAP[field];
  }
}

export const RENDER_DIRECTIVE_SCHEMA_FIELDS = Object.keys(renderDirectiveProperties);

const EVENT_SCHEMAS = new Map([
  ['STAGE_CHANGE', {
    required: { from: ['string', null], to: 'string', source: 'string' },
    optional: { timestamp: 'number' },
  }],
  ['QUALITY_CHANGE', {
    required: { tier: 'string' },
    extended: {
      particleCount: 'number',
      dpr: 'number',
      reason: 'string',
      from: 'string',
      quality: 'string',
    },
  }],
  ['MORPH_PROGRESS', {
    required: { progress: 'number', source: 'string' },
    optional: { timestamp: 'number' },
  }],
  ['GEOMETRY_BOUND', {
    required: {
      stage: 'string',
      source: 'string',
    },
  }],
  ['RENDER_DIRECTIVE', {
    optional: renderDirectiveProperties,
  }],
  ['SCROLL_PROGRESS', {
    optional: {
      scrollPercent: 'number',
      rawScrollPercent: 'number',
      currentStage: 'string',
      stageIndex: 'number',
      stageProgress: 'number',
      localProgress: 'number',
      morphTarget: 'number',
      morph: 'number',
    },
  }],
  ['START_NARRATIVE', {
    required: { stage: 'string' },
    optional: { source: 'string' },
  }],
  ['NARRATIVE_LINE', {
    required: { stage: 'string', text: 'string' },
    optional: {
      segmentId: 'string',
      segmentIndex: 'number',
      speedMs: 'number',
      token: 'number',
    },
  }],
  ['BLUEPRINT_READY', {
    required: {
      stage: 'string',
      quality: 'string',
      blueprint: 'object',
    },
    optional: {
      cached: 'boolean',
      mode: 'string',
      cacheKey: 'string',
      duration: 'number',
      transitionDuration: 'number',
    },
  }],
  ['CLIMAX_STEP', {
    optional: {
      step: 'string',
      holdDuration: 'number',
      transitionDuration: 'number',
      text: 'string',
      url: 'string',
      stepIndex: 'number',
    },
  }],
  ['TEXT_MORPH', {
    required: { word: 'string' },
    optional: {
      stage: 'string',
      particles: 'number',
      transitionDuration: 'number',
      source: 'string',
    },
  }],
  ['TEXT_POSITIONS_READY', {
    required: { positions: 'object', word: 'string' },
    optional: { stage: 'string', count: 'number' },
  }],
  ['PARTICLE_CLICK_REQUEST', {
    optional: {
      mouse: 'object',
      screenX: 'number',
      screenY: 'number',
    },
  }],
  ['PARTICLE_CLICK_HIT', {
    optional: {
      particleIndex: 'number',
      distance: 'number',
      point: 'object',
      hotspot: 'object',
    },
  }],
  ['AUDIO_COMPUTER_HUM', {
    optional: { volume: 'number' },
  }],
  ['PREWARM_COMPLETE', {
    optional: { key: 'string' },
  }],
  ['DIRECTOR_ERROR', {
    optional: { error: 'object', message: 'string' },
  }],
]);

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value) {
  return typeof value === 'string' && value.length > 0;
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function validateField(value, type) {
  if (Array.isArray(type)) {
    return type.includes(value);
  }
  switch (type) {
    case 'number':
      return isNumber(value);
    case 'string':
      return isString(value);
    case 'boolean':
      return isBoolean(value);
    case 'object':
      return isObject(value);
    default:
      return true;
  }
}

function checkSchemaPart(payload, schemaPart, errors, path = '') {
  if (!schemaPart) return;
  const entries = Object.entries(schemaPart);
  for (const [key, type] of entries) {
    const value = payload[key];
    const qualifiedKey = path ? `${path}.${key}` : key;
    if (!validateField(value, type)) {
      errors.push(`Expected ${qualifiedKey} to be ${Array.isArray(type) ? `one of ${type.join(', ')}` : type}`);
    }
  }
}

export function validateEventPayload(eventName, payload) {
  const errors = [];
  if (!isObject(payload)) {
    errors.push('Payload must be an object');
    return { valid: false, errors };
  }

  checkSchemaPart(payload, BaseSchema.required, errors);
  if (!isObject(payload.timestamp) && !isNumber(payload.timestamp)) {
    errors.push('timestamp must be a finite number');
  }
  if (!isString(payload.source)) {
    errors.push('source must be a non-empty string');
  }

  if (payload._meta !== undefined) {
    if (!isObject(payload._meta)) {
      errors.push('_meta must be an object when provided');
    } else {
      if (payload._meta.version !== undefined && !isString(payload._meta.version)) {
        errors.push('_meta.version must be a non-empty string');
      }
      if (payload._meta.sequence !== undefined && !isNumber(payload._meta.sequence)) {
        errors.push('_meta.sequence must be a finite number');
      }
    }
  }

  if (payload._extended !== undefined && !isObject(payload._extended)) {
    errors.push('_extended must be an object when provided');
  }

  const schema = EVENT_SCHEMAS.get(eventName);
  if (schema) {
    if (schema.required) {
      const requiredEntries = Object.entries(schema.required);
      for (const [key, type] of requiredEntries) {
        if (!(key in payload)) {
          errors.push(`Missing required field "${key}" for ${eventName}`);
        } else if (!validateField(payload[key], type)) {
          errors.push(`Field "${key}" must be ${type}`);
        }
      }
    }
    if (schema.optional) {
      const optionalEntries = Object.entries(schema.optional);
      for (const [key, type] of optionalEntries) {
        if (payload[key] !== undefined && !validateField(payload[key], type)) {
          errors.push(`Field "${key}" must be ${type} when provided`);
        }
      }
    }
    if (schema.extended && payload._extended) {
      const extendedEntries = Object.entries(schema.extended);
      for (const [key, type] of extendedEntries) {
        if (payload._extended[key] !== undefined && !validateField(payload._extended[key], type)) {
          errors.push(`_extended.${key} must be ${type} when provided`);
        }
      }
    }
  }

  // Strict: reject unexpected top-level fields only when a schema exists
  const schemaDef = EVENT_SCHEMAS.get(eventName);
  if (schemaDef) {
    const allowed = new Set([
      ...Object.keys(BaseSchema.required || {}),
      ...Object.keys(BaseSchema.optional || {}),
    ]);
    if (schemaDef.required) Object.keys(schemaDef.required).forEach((k) => allowed.add(k));
    if (schemaDef.optional) Object.keys(schemaDef.optional).forEach((k) => allowed.add(k));
    if (schemaDef.extended) Object.keys(schemaDef.extended).forEach((k) => allowed.add(k));
    Object.keys(payload).forEach((key) => {
      if (!allowed.has(key)) {
        errors.push(`Unexpected field: ${key}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
