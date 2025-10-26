/**
 * Event contract validation for NarrationOverlay.
 * Guards BeatBus payloads before they enter the state machine.
 */

const VALID_START_SOURCES = new Set([
  'opening_complete',
  'user_action',
  'auto_advance',
  'director_stage_change',
]);

export const EVENT_CONTRACTS = {
  START_NARRATIVE: {
    validate(payload) {
      if (!payload) return { valid: true };

      if (payload.source && !VALID_START_SOURCES.has(payload.source)) {
        return {
          valid: false,
          reason: `Invalid source: ${payload.source}. Expected one of: ${Array.from(VALID_START_SOURCES).join(', ')}`,
        };
      }

      return { valid: true };
    },
  },

  NARRATIVE_LINE: {
    validate(payload) {
      if (!payload) {
        return { valid: false, reason: 'No payload provided' };
      }

      if (typeof payload.text !== 'string') {
        return { valid: false, reason: 'Missing or invalid text field' };
      }

      if (!payload.text.trim()) {
        return { valid: false, reason: 'Empty text' };
      }

      if (payload.speedMs !== undefined) {
        const asNumber = Number(payload.speedMs);
        if (!Number.isFinite(asNumber) || asNumber < 0) {
          return { valid: false, reason: 'Invalid speedMs (must be positive number)' };
        }
      }

      return { valid: true };
    },
  },

  NARRATION_STOPPED: {
    validate() {
      return { valid: true };
    },
  },

  NARRATION_CLEANUP: {
    validate() {
      return { valid: true };
    },
  },
};

/**
 * Validate event payload against contract.
 * Unknown events are considered valid but logged.
 */
export function validateEvent(eventName, payload) {
  const contract = EVENT_CONTRACTS[eventName];
  if (!contract) {
    console.warn(`[OverlayContracts] No contract defined for event: ${eventName}`);
    return { valid: true };
  }

  return contract.validate(payload);
}
