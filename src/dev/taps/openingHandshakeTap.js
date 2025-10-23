import BeatBus from '@/theater/bus';
import { EVENTS } from '@/theater/events.js';

const log = [];

function record(evt, payload) {
  try {
    const entry = {
      t: (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()),
      evt,
      keys: payload ? Object.keys(payload) : [],
      payload,
    };
    log.push(entry);
    if (log.length > 700) log.splice(0, log.length - 700);
    if (typeof window !== 'undefined') {
      window.__openHandshake = log;
    }
  } catch (err) {
    if (import.meta?.env?.DEV) console.warn('[openingHandshakeTap] record failed', err);
  }
}

export function installOpeningHandshakeTap() {
  const disposers = [];
  [
    EVENTS.ENGINE_VIEWPORT_HINT,
    EVENTS.BLUEPRINT_READY,
    EVENTS.PARTICLES_EMERGED,
    EVENTS.RENDER_DIRECTIVE,
  ].forEach((eventName) => {
    try {
      const off = BeatBus.on(eventName, (payload) => record(eventName, payload));
      disposers.push(off);
    } catch (err) {
      if (import.meta?.env?.DEV) console.warn('[openingHandshakeTap] failed to subscribe', eventName, err);
    }
  });
  return () => disposers.forEach((off) => off && off());
}
