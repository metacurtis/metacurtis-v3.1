// canon-console/runtime/incidents.js
// Installs the shared incident pipeline (store + sinks) for Canon Dev-OS

import Incident from '../model/incident.js';
import { incidentStore } from '../store/incidentStore.js';
import ConsoleSink from '../sinks/consoleSink.js';
import WebGLSink from '../sinks/webglSink.js';

let installed = false;

function createCollector(store) {
  const toIncident = (payload = {}) => (payload instanceof Incident ? payload : new Incident(payload));

  return {
    add(payload) {
      return store.add(toIncident(payload));
    },
    get: () => store.getAll(),
    getAll: () => store.getAll(),
    getStats: () => store.getStats(),
    clear: () => store.clear(),
    on: (...args) => store.on(...args),
    off: (...args) => store.off(...args),
  };
}

export function installIncidentPipeline(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win || installed) return win?.CANON_CONSOLE?.incidents;
  installed = true;

  win.CANON_CONSOLE = win.CANON_CONSOLE || {};

  const collector = createCollector(incidentStore);
  win.CANON_CONSOLE.incidents = collector;
  win.CANON_CONSOLE.__incidentStore = incidentStore;
  if (typeof win.CANON_CONSOLE.getIncidents !== 'function') {
    win.CANON_CONSOLE.getIncidents = collector.get;
  }
  if (typeof win.CANON_CONSOLE.getIncidentStats !== 'function') {
    win.CANON_CONSOLE.getIncidentStats = collector.getStats;
  }

  const consoleSink = new ConsoleSink(incidentStore);
  consoleSink.install();

  const webglSink = new WebGLSink(incidentStore);
  webglSink.install();

  try {
    win.__canonBridgePush__?.('INCIDENT_PIPELINE_READY', 'Console + WebGL sinks active');
  } catch {}

  return collector;
}

export default {
  installIncidentPipeline,
};
