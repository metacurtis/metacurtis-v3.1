/**
 * RENDER_DIRECTIVE Emitters (Phase 1 Transitional)
 *
 * INVARIANTS (Phase 1):
 * - This module is one of only two allowed RENDER_DIRECTIVE writers:
 *   - VisualOrchestrator (primary orchestration path)
 *   - bus/emitters.js (legacy/transitional path)
 *
 * - tools/check-render-directive-single-writer.cjs enforces that no additional
 *   emitters appear outside of these files without intentional allowlist changes.
 *
 * FUTURE (Phase 2+):
 * - Goal is to route all RENDER_DIRECTIVE emissions through a single orchestrator path
 *   and retire direct use of this module for writes.
 */
import BeatBus from './index.js';
import { EVENTS } from '../events-safe.js';

const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;

function logDev(eventName, payload) {
  if (!DEV) return;
  const stack = new Error().stack?.split('\n')[3]?.trim() || 'unknown';
  console.log(`[PatternS] emit ${eventName} from ${stack}`, payload);
}

export function emitStageChange(payload) {
  if (!payload || !payload.to) {
    throw new Error('STAGE_CHANGE requires { from, to } payload');
  }
  logDev(EVENTS.STAGE_CHANGE, payload);
  BeatBus.emit(EVENTS.STAGE_CHANGE, payload);
}

export function emitBlueprintReady(payload) {
  if (!payload || !payload.stage || !payload.blueprint) {
    throw new Error('BLUEPRINT_READY requires { stage, blueprint }');
  }
  logDev(EVENTS.BLUEPRINT_READY, payload);
  BeatBus.emit(EVENTS.BLUEPRINT_READY, payload);
}

export function emitParticlesEmerged(payload) {
  // Renderer-only ownership; scanner/runtime guard enforce callers.
  logDev(EVENTS.PARTICLES_EMERGED, payload);
  BeatBus.emit(EVENTS.PARTICLES_EMERGED, payload);
}

export function emitRenderDirective(payload) {
  logDev(EVENTS.RENDER_DIRECTIVE, payload);
  BeatBus.emit(EVENTS.RENDER_DIRECTIVE, payload);
}

export function emitMorphProgress(payload) {
  if (!payload || typeof payload.progress !== 'number') {
    throw new Error('MORPH_PROGRESS requires { progress }');
  }
  logDev(EVENTS.MORPH_PROGRESS, payload);
  BeatBus.emit(EVENTS.MORPH_PROGRESS, payload);
}
