import { ensureCanonGeometry, createCanonMaterial } from '@/renderer/materialFactory';
/* src/dev/SmartConsole.js */
/* eslint-disable no-console */

// Level 1.5 SmartConsole: de-noise, ship logs to agent, guard helpers.
// - HMR-safe (won't double-wrap console.*)
// - Global API: window.smartConsole
// - Never "debugger;" or blocking ops; suspend/resume to step comfortably.

function safeHint(v) {
  try {
    if (v == null) return String(v);
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return String(v);
    if (t === 'function') return `[Function ${v.name || 'anonymous'}]`;
    if (t === 'object') return `[${v.constructor?.name || 'Object'}]`;
    return String(v);
  } catch { return '[Unserializable]'; }
}

export default function initSmartConsole({
  agent = 'http://localhost:6998',
  flushInterval = 1500,
  maxBuffered = 200,
  muteAfter = 3
} = {}) {
  if (typeof window === 'undefined') return null;

  // Singleton guard (survives HMR)
  if (window.__SMART_CONSOLE__) return window.__SMART_CONSOLE__;

  class SmartConsole {
    constructor() {
      // config
      this.agent = agent;
      this.flushInterval = flushInterval;
      this.maxBuffered = maxBuffered;
      this.muteAfter = muteAfter;

      // state
      this.enabled = localStorage.getItem('smartConsole') !== 'false';
      this.agentOffline = true;       // assume offline, probe once
      this.agentWarned = false;
      this.seen = new Map();
      this.patterns = new Map();
      this.buffer = [];

      // keep originals; ensure we only patch once per runtime
      if (!console.__SMART_PATCHED__) {
        console.__SMART_PATCHED__ = true;
        this.orig = {
          log: console.log.bind(console),
          warn: console.warn.bind(console),
          error: console.error.bind(console)
        };
        console.log   = (...a) => this._handle('log',   ...a);
        console.warn  = (...a) => this._handle('warn',  ...a);
        console.error = (...a) => this._handle('error', ...a);
      } else {
        // reuse the originals already stored on previous instance
        this.orig = {
          log: console.log.bind(console),
          warn: console.warn.bind(console),
          error: console.error.bind(console)
        };
      }

      // global API
      window.smartConsole = {
        enable:  () => { this.enabled = true;  localStorage.setItem('smartConsole','true');  this.orig.log('✅ SmartConsole enabled'); },
        disable: () => { this.enabled = false; localStorage.setItem('smartConsole','false'); this.orig.log('🔇 SmartConsole disabled'); },

        // debugger-friendly: temporarily restore native console.*
        suspend: () => {
          console.log   = this.orig.log;
          console.warn  = this.orig.warn;
          console.error = this.orig.error;
          this.orig.log('⏸️  SmartConsole suspended (native console restored)');
        },
        resume: () => {
          console.log   = (...a) => this._handle('log',   ...a);
          console.warn  = (...a) => this._handle('warn',  ...a);
          console.error = (...a) => this._handle('error', ...a);
          this.orig.log('▶️  SmartConsole resumed');
        },

        summary: () => this.showSummary(),
        status:  () => this._showStatus(),
        clear:   () => { this.seen.clear(); this.patterns.clear(); this.buffer.length = 0; this.orig.log('🧹 SmartConsole cleared'); },
        help:    () => this._showHelp(),

        backend: {
          test:     () => this._testAgent(),
          summary:  () => this._get('/summary').then(x => (this._banner('Agent Summary', x), x)),
          gitInfo:  () => this._get('/git-info').then(x => (this._banner('Git Info', x), x))
        },
        guard: {
          sanitize:        () => this._post('/guard/sanitize').then(x => (this._banner('Canon Guard: sanitize', x), x)),
          lintSchema:      () => this._post('/guard/lint-schema').then(x => (this._banner('Canon Guard: lint-schema', x), x)),
          offlineCompile:  () => this._post('/guard/offline-compile').then(x => (this._banner('Canon Guard: offline-compile', x), x)),
          status:          () => this._get('/status').then(x => (this._banner('Guard Status', x), x))
        }
      };

      // periodic flush + flush on unload (non-blocking)
      this._timer = setInterval(() => this._flush(), this.flushInterval);
      window.addEventListener('beforeunload', () => this._flush());

      // initial probe
      this._testAgent(true).finally(() => {
        this._banner('🎯 SmartConsole', {
          msg: 'Level 1.5 activated',
          mode: this.enabled ? 'ENABLED' : 'DISABLED',
          agent: this.agent,
          tip: 'Use window.smartConsole.help()'
        });
      });

      // HMR cleanup
      if (import.meta?.hot) {
        import.meta.hot.dispose(() => clearInterval(this._timer));
      }
    }

    // ---------------- core -----------------------------------------
    _handle(level, ...args) {
      // ALWAYS print original message to keep formatting/objects
      this.orig[level](...args);

      if (!this.enabled) return;

      const text = args.map(safeHint).join(' ');
      const seen = (this.seen.get(text) || 0) + 1;
      this.seen.set(text, seen);

      // a few quick patterns
      if (text.includes('Creating material'))               this._bump('material_recreation');
      if (text.includes('Subscribed to STAGE_CHANGE'))      this._bump('dup_stage_listeners');
      if (text.includes('Emitting STAGE_CHANGE'))           this._bump('stage_change_storm');
      if (text.toLowerCase().includes('shader') && text.toLowerCase().includes('fallback')) this._bump('shader_fallback');
      if (text.includes('Blueprint'))                       this._bump('blueprint_activity');

      if (!this.agentOffline && seen <= this.muteAfter) {
        this._enqueue({ t: performance.now(), level, text });
      }
      if (seen === this.muteAfter + 1) {
        this.orig.log(`🔇 Muting: "${text.slice(0, 100)}..." (seen ${this.muteAfter}+)`);
      }
    }

    _bump(key, by = 1) { this.patterns.set(key, (this.patterns.get(key) || 0) + by); }

    showSummary() {
      const topRepeats = Array.from(this.seen.entries())
        .filter(([, c]) => c > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([msg, c]) => `${String(c).padStart(3,' ')}×  ${msg.slice(0,100)}...`);

      this._banner('📊 Console Summary', {
        status: this.enabled ? 'ACTIVE' : 'DISABLED',
        agent: this.agentOffline ? 'OFFLINE' : 'CONNECTED',
        totalUnique: this.seen.size,
        totalSuppressed: Array.from(this.seen.values()).reduce((s, c) => s + Math.max(0, c - this.muteAfter), 0),
        topRepeats: topRepeats.length ? topRepeats : ['No repeated messages'],
        patterns: Object.fromEntries(this.patterns)
      });
    }

    _showStatus() {
      this._banner('🔍 SmartConsole Status', {
        enabled: this.enabled,
        agent: this.agentOffline ? `OFFLINE (${this.agent})` : `CONNECTED (${this.agent})`,
        messagesTracked: this.seen.size,
        patternsDetected: this.patterns.size,
        bufferSize: this.buffer.length,
        version: '1.5'
      });
    }

    _showHelp() {
      this._banner('📚 SmartConsole Commands', {
        Core: {
          'smartConsole.enable()':  'Enable filtering',
          'smartConsole.disable()': 'Disable filtering',
          'smartConsole.suspend()': 'Restore native console.* for stepping',
          'smartConsole.resume()':  'Re-enable interception',
          'smartConsole.summary()': 'Show summary',
          'smartConsole.status()':  'Show status',
          'smartConsole.clear()':   'Clear tracking',
          'smartConsole.help()':    'Show this help'
        },
        Backend: {
          'smartConsole.backend.test()':     'Ping agent',
          'smartConsole.backend.summary()':  'Server-side summary',
          'smartConsole.backend.gitInfo()':  'Current branch/commit',
          'smartConsole.guard.sanitize()':        'Run Canon Guard sanitize',
          'smartConsole.guard.lintSchema()':      'Run Canon Guard schema lint',
          'smartConsole.guard.offlineCompile()':  'Run Canon Guard offline compile'
        }
      });
    }

    _banner(title, obj) {
      try {
        console.groupCollapsed?.(`%c${title}`, 'color:#00ffa0;font-weight:700');
        console.log(obj);
        console.groupEnd?.();
      } catch { console.log(title, obj); }
    }

    // ---------------- transport -----------------------------------
    _enqueue(evt) {
      this.buffer.push(evt);
      if (this.buffer.length >= this.maxBuffered) this._flush();
    }

    async _flush() {
      if (!this.enabled || this.buffer.length === 0) return;
      if (this.agentOffline) { this.buffer.length = 0; return; }

      const payload = JSON.stringify({ events: this.buffer.splice(0, this.buffer.length) });

      // Try sendBeacon first (non-blocking)
      if (navigator.sendBeacon && this.agent.startsWith('http')) {
        try {
          const ok = navigator.sendBeacon(`${this.agent}/ingest`, payload);
          if (ok) return;
        } catch {}
      }

      // Fallback to fetch with short timeout; never throw
      const res = await this._softFetch(`${this.agent}/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }, 900);

      if (!res.ok && !this.agentOffline) {
        this.agentOffline = true;
        if (!this.agentWarned) {
          this.orig.warn('🟡 SmartConsole: Agent offline at', this.agent);
          this.orig.log('ℹ️  Start it: (cd canon-console/agent && node server.js)');
          this.agentWarned = true;
        }
      } else if (res.ok && this.agentOffline) {
        this.agentOffline = false;
        this.orig.log('✅ SmartConsole: Agent reconnected');
      }
    }

    async _softFetch(url, options = {}, timeoutMs = 800) {
      let done = false;
      const timeoutP = new Promise((resolve) => setTimeout(() => !done && resolve({ ok: false, offline: true }), timeoutMs));
      const fetchP = fetch(url, options).then(
        (r) => r,
        () => ({ ok: false, offline: true })
      );
      const res = await Promise.race([fetchP, timeoutP]);
      done = true;
      if (res.offline) return { ok: false, offline: true };
      return {
        ok: !!res.ok,
        status: res.status,
        json: () => res.json().catch(() => ({}))
      };
    }

    async _testAgent(silent = false) {
      // prefer /healthz, then /status
      const a = await this._softFetch(`${this.agent}/healthz`, { method: 'GET' }, 600);
      let ok = a.ok;
      if (!ok) {
        const b = await this._softFetch(`${this.agent}/status`, { method: 'GET' }, 600);
        ok = b.ok;
      }
      this.agentOffline = !ok;
      if (!silent) {
        if (ok) this.orig.log('🟢 SmartConsole: Agent connected at', this.agent);
        else this.orig.warn('🟡 SmartConsole: Agent not reachable at', this.agent);
      }
      return ok;
    }

    async _get(path) {
      if (this.agentOffline) return { ok: false, offline: true };
      const res = await this._softFetch(`${this.agent}${path}`, { method: 'GET' }, 900);
      return res.ok ? res.json() : { ok: false, offline: true };
    }

    async _post(path, body) {
      if (this.agentOffline) return { ok: false, offline: true };
      const res = await this._softFetch(`${this.agent}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      }, 1200);
      return res.ok ? res.json() : { ok: false, offline: true };
    }
  }

  // create instance, expose globally, and return
  const instance = new SmartConsole();
  window.__SMART_CONSOLE__ = instance;
  return instance;
}
