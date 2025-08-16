import incidentStore from '../store/incidentStore.js';
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
    if (CC_DEBUG) if (CC_DEBUG) console.log('[Canon Console] Initializing...');
    
    this.consoleSink.install();
    this.connect();
    
    incidentStore.on('new', (incident) => this.sendIncident(incident));
    incidentStore.on('duplicate', (incident) => this.sendIncident(incident));
    
    window.__canonConsole = this;
    window.__canonIncidents = incidentStore;
    
    if (CC_DEBUG) if (CC_DEBUG) console.log('[Canon Console] Ready');
  }
  
  connect() {
    try {
      this.ws = new WebSocket('ws://localhost:6998');
      
      this.ws.onopen = () => {
        if (CC_DEBUG) if (CC_DEBUG) console.log('[Canon Console] Connected');
        this.connected = true;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onclose = () => {
        this.connected = false;
        this.scheduleReconnect();
      };
      
      this.ws.onerror = () => {
        if (CC_DEBUG) if (CC_DEBUG) console.log('[Canon Console] Connection error');
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }
  
    scheduleReconnect() {
    // Give up quietly after max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (CC_DEBUG) console.log('[Canon Console] Max reconnect attempts reached, going quiet');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;
    
    if (CC_DEBUG) console.log(`[Canon Console] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
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

export default CanonConsole;