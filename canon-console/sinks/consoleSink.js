import Incident from '../model/incident.js';

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

export default ConsoleSink;