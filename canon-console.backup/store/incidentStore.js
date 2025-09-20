import { Emitter } from './emitter.js';
import Incident from '../model/incident.js';

class IncidentStore {
  constructor() {
    this.bus = new Emitter();
    this.incidents = new Map();
    this.maxIncidents = 100;
    this.stats = this.initStats();
    this.patterns = this.initPatterns();
  }
  
  on(...args) { return this.bus.on(...args); }
  off(...args) { return this.bus.off(...args); }
  
  initStats() {
    return {
      total: 0,
      duplicates: 0,
      fixed: 0,
      byCode: {},
      bySeverity: { info: 0, warn: 0, error: 0, critical: 0 },
      dedupeRate: 0
    };
  }
  
  initPatterns() {
    return {
      critical: [
        /SHADER_COMPILE_ERROR/i,
        /Cannot find module/i,
        /WebGL.*lost/i
      ],
      error: [
        /Failed to compile/i,
        /TypeError:/i,
        /ReferenceError:/i
      ],
      warn: [
        /Performance Warning/i,
        /Deprecated/i,
        /Low FPS/i
      ],
      ignore: [
        /Download the React DevTools/i,
        /source map warning/i,
        /\[HMR\]/i
      ]
    };
  }
  
  add(incident) {
    if (this.shouldIgnore(incident.message)) return null;
    
    incident.severity = this.determineSeverity(incident);
    const existing = this.incidents.get(incident.fingerprint);
    
    if (existing) {
      existing.increment();
      this.stats.duplicates++;
      this.bus.emit('duplicate', existing);
    } else {
      this.incidents.set(incident.fingerprint, incident);
      if (this.incidents.size > this.maxIncidents) {
        const firstKey = this.incidents.keys().next().value;
        this.incidents.delete(firstKey);
      }
      this.bus.emit('new', incident);
    }
    
    this.updateStats(incident);
    this.bus.emit('update', this.getAll());
    return existing || incident;
  }
  
  shouldIgnore(message) {
    return this.patterns.ignore.some(p => p.test(message));
  }
  
  determineSeverity(incident) {
    const msg = incident.message;
    if (this.patterns.critical.some(p => p.test(msg))) return 'critical';
    if (this.patterns.error.some(p => p.test(msg))) return 'error';
    if (this.patterns.warn.some(p => p.test(msg))) return 'warn';
    return incident.severity;
  }
  
  updateStats(incident) {
    this.stats.total++;
    this.stats.byCode[incident.code] = (this.stats.byCode[incident.code] || 0) + 1;
    this.stats.bySeverity[incident.severity]++;
    this.stats.dedupeRate = this.stats.duplicates / Math.max(1, this.stats.total);
  }
  
  getAll() {
    return Array.from(this.incidents.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  }
  
  getStats() {
    return { ...this.stats };
  }
  
  clear() {
    this.incidents.clear();
    this.stats = this.initStats();
    this.bus.emit('clear');
  }
}

export const incidentStore = new IncidentStore();
export default incidentStore;