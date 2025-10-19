#!/usr/bin/env node
/* eslint-env node */
// Complete Canon Console Level 1 Implementation

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('📦 Canon Console: Adding ALL Implementation Files');
console.log('=================================================\n');

async function createAllFiles() {
  const files = {
    // Model - Incident
    'canon-console/model/incident.js': `export class Incident {
  constructor(data) {
    this.id = this.generateId();
    this.code = data.code || 'UNKNOWN';
    this.severity = data.severity || 'info';
    this.ts = Date.now();
    this.fingerprint = this.generateFingerprint(data);
    this.message = data.message || '';
    this.count = 1;
    this.firstSeen = this.ts;
    this.lastSeen = this.ts;
    
    this.evidence = {
      stack: data.stack || data.evidence?.stack || null,
      logs: data.logs || [],
      glLog: data.glLog || null,
      file: data.file || null,
      line: data.line || null,
      raw: data.raw || null
    };
    
    this.context = {
      stage: data.stage || null,
      particleCount: data.particleCount || null,
      fps: data.fps || null,
      gpu: data.gpu || null
    };
    
    this.tags = data.tags || [];
    this.fixed = false;
  }
  
  generateId() {
    return 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  generateFingerprint(data) {
    const parts = [
      data.code,
      data.message?.substring(0, 100),
      data.file,
      data.line
    ].filter(Boolean);
    
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  increment() {
    this.count++;
    this.lastSeen = Date.now();
  }
  
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      severity: this.severity,
      fingerprint: this.fingerprint,
      message: this.message,
      count: this.count,
      firstSeen: this.firstSeen,
      lastSeen: this.lastSeen,
      evidence: this.evidence,
      context: this.context,
      tags: this.tags,
      fixed: this.fixed
    };
  }
}

export default Incident;`,

    // Store - Incident Store
    'canon-console/store/incidentStore.js': `import { Emitter } from './emitter.js';
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
        /\\[HMR\\]/i
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
export default incidentStore;`,

    // Sinks - Console Sink
    'canon-console/sinks/consoleSink.js': `import Incident from '../model/incident.js';

class ConsoleSink {
  constructor(store) {
    this.store = store;
    this.originalConsole = {};
    this.installed = false;
  }
  
  install() {
    if (this.installed) return;
    
    ['log', 'warn', 'error', 'info'].forEach(method => {
      this.originalConsole[method] = console[method];
    });
    
    console.error = (...args) => this.capture('error', args);
    console.warn = (...args) => this.capture('warn', args);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    }
    
    this.installed = true;
  }
  
  capture(level, args) {
    this.originalConsole[level]?.(...args);
    
    const errArg = args.find(a => a instanceof Error);
    const message = errArg
      ? String(errArg.message || errArg)
      : args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    
    if (level !== 'error' && level !== 'warn') return;
    
    const incident = new Incident({
      code: 'CONSOLE_' + level.toUpperCase(),
      severity: level === 'error' ? 'error' : 'warn',
      message: message.substring(0, 500),
      tags: ['console', level],
      evidence: {
        stack: errArg?.stack || (level === 'error' ? new Error().stack : null),
        raw: args
      }
    });
    
    this.store.add(incident);
  }
  
  handleError(event) {
    const incident = new Incident({
      code: 'RUNTIME_ERROR',
      severity: 'error',
      message: event.message,
      tags: ['runtime'],
      evidence: {
        stack: event.error?.stack,
        file: event.filename,
        line: event.lineno
      }
    });
    this.store.add(incident);
  }
  
  handleRejection(event) {
    const incident = new Incident({
      code: 'UNHANDLED_REJECTION',
      severity: 'error',
      message: event.reason?.message || String(event.reason),
      tags: ['promise'],
      evidence: { stack: event.reason?.stack }
    });
    this.store.add(incident);
  }
}

export default ConsoleSink;`,

    // Browser - Main Injection
    'canon-console/browser/inject.js': `import incidentStore from '../store/incidentStore.js';
import ConsoleSink from '../sinks/consoleSink.js';

const CC_DEBUG = typeof window !== 'undefined' && window.__CANON_CONSOLE_DEBUG;

class CanonConsole {
  constructor() {
    this.ws = null;
    this.consoleSink = new ConsoleSink(incidentStore);
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  init() {
    if (CC_DEBUG) console.log('[Canon Console] Initializing...');
    
    this.consoleSink.install();
    this.connect();
    
    incidentStore.on('new', (incident) => this.sendIncident(incident));
    incidentStore.on('duplicate', (incident) => this.sendIncident(incident));
    
    window.__canonConsole = this;
    window.__canonIncidents = incidentStore;
    
    if (CC_DEBUG) console.log('[Canon Console] Ready');
  }
  
  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:6998');
      
      this.ws.onopen = () => {
        if (CC_DEBUG) console.log('[Canon Console] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onclose = () => {
        this.connected = false;
        this.scheduleReconnect();
      };
      
      this.ws.onerror = () => {
        if (CC_DEBUG) console.log('[Canon Console] Connection error');
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }
  
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }
  
  sendIncident(incident) {
    if (!this.connected || !this.ws) return;
    try {
      this.ws.send(JSON.stringify({
        type: 'incident',
        data: incident.toJSON()
      }));
    } catch {}
  }
  
  getStats() { return incidentStore.getStats(); }
  getIncidents() { return incidentStore.getAll(); }
}

if (typeof window !== 'undefined') {
  const canonConsole = new CanonConsole();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => canonConsole.init());
  } else {
    canonConsole.init();
  }
  window.CanonConsole = canonConsole;
}

export default CanonConsole;`,

    // Main Entry
    'canon-console/index.js': `// Canon Console Entry Point
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  import('./browser/inject.js').then(() => {
    console.log('[Canon Console] Browser module loaded');
  });
}

export { default as CanonConsole } from './browser/inject.js';
export { Incident } from './model/incident.js';
export { incidentStore } from './store/incidentStore.js';`
  };

  let created = 0;
  let failed = 0;
  
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(projectRoot, filePath);
    try {
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log('✅ ' + filePath);
      created++;
    } catch (error) {
      console.error('❌ ' + filePath + ': ' + error.message);
      failed++;
    }
  }
  
  console.log('\n========================================');
  console.log('✨ Created ' + created + ' files successfully');
  if (failed > 0) {
    console.log('⚠️  Failed: ' + failed + ' files');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. cd canon-console && npm start');
  console.log('2. In your app, add to src/main.jsx:');
  console.log('');
  console.log('   if (import.meta.env.DEV) {');
  console.log("     import('../canon-console/browser/inject.js')");
  console.log("       .then(() => console.log('Canon Console loaded'))");
  console.log('       .catch(console.error);');
  console.log('   }');
  console.log('');
  console.log('3. Test with:');
  console.log('   console.error(new Error("Test error"));');
  console.log('   window.__canonIncidents.getStats();');
}

createAllFiles().catch(console.error);
