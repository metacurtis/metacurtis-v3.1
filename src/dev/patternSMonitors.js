import BeatBus from '@/theater/bus/index.js';
import EVENTS from '@/theater/events.js';

const GLOBAL_SYM = '__PATTERN_S_MONITORS_ACTIVE__';

if (!globalThis[GLOBAL_SYM]) {
  globalThis[GLOBAL_SYM] = true;

  const DEV_MODE =
    (typeof import.meta !== 'undefined' && import.meta.env && 'DEV' in import.meta.env)
      ? !!import.meta.env.DEV
      : (typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false);

  const diagnostics = {
    engineMorph: null,
    directorMorph: null,
    rendererTune: null,
    directorMode: null,
    blueprintInvalidations: 0,
    lastParticleHit: null,
  };

  const logDiag = (label, payload) => {
    if (!DEV_MODE) return;
    console.debug(`[PatternS:${label}]`, payload);
  };

  if (typeof BeatBus?.on !== 'function') {
    if (DEV_MODE) {
      console.warn('[PatternS:Monitors] BeatBus not ready; diagnostics disabled');
    }
  } else {
    BeatBus.on('ENGINE:MORPH_STATE', (payload = {}) => {
      diagnostics.engineMorph = payload;
      logDiag('ENGINE:MORPH_STATE', payload);
    });

    BeatBus.on('DIRECTOR:MORPH_STATE', (payload = {}) => {
      diagnostics.directorMorph = payload;
      logDiag('DIRECTOR:MORPH_STATE', payload);
    });

    BeatBus.on(EVENTS.DIRECTOR_OPENING_MODE, (payload = {}) => {
      diagnostics.directorMode = payload;
      logDiag('DIRECTOR_OPENING_MODE', payload);
    });

    BeatBus.on(EVENTS.RENDERER_TUNE, (payload = {}) => {
      diagnostics.rendererTune = payload;
      logDiag('RENDERER_TUNE', payload);
    });

    BeatBus.on(EVENTS.PARTICLE_CLICK_HIT, (payload = {}) => {
      diagnostics.lastParticleHit = payload;
      logDiag('PARTICLE_CLICK_HIT', payload);
    });

    BeatBus.on(EVENTS.BLUEPRINT_INVALIDATED, (payload = {}) => {
      diagnostics.blueprintInvalidations += 1;
      logDiag('BLUEPRINT_INVALIDATED', payload);
    });

    BeatBus.on(EVENTS.DIRECTOR_ERROR, (payload = {}) => {
      logDiag('DIRECTOR_ERROR', payload);
    });

    BeatBus.on('CANON_VIOLATION', (payload = {}) => {
      logDiag('CANON_VIOLATION', payload);
    });

    BeatBus.on('FENCEPOST_REPORT', (payload = {}) => {
      logDiag('FENCEPOST_REPORT', payload);
    });
  }

  if (typeof window !== 'undefined') {
    window.patternSDiagnostics = {
      getState: () => ({ ...diagnostics }),
      log: () => console.table(diagnostics),
    };
  }
}
