// canon-console/runtime/violation-tap.js
// Violation Tap — route Guard/Canonicalizer warnings → incidents (DEV-only, idempotent)
//
// Captures:
//  - "Canon violation: ..." lines (BeatBus boundary/canonicalizer)
//  - "Canon Guard ..." warn/error lines
//  - Optional custom events: 'canon:bus:violation'
(function(){
  if (typeof window === 'undefined') return;
  if (window.__canonViolationTap__) return;
  window.__canonViolationTap__ = true;

  // Unified push → Bridge buffer → Pilot incidents
  const push = (code, msg, detail={}) => {
    try {
      if (typeof window.__canonBridgePush__ === 'function') {
        window.__canonBridgePush__(code, String(msg||code), detail);
      } else if (window.CANON_PILOT?.create) {
        window.CANON_PILOT.create({ code, message:String(msg||code), detail, ts: Date.now() });
      } else {
        // buffer if neither is ready (injector drains this when pilot starts)
        (window.__canonIncidentBacklog ||= []).push({ code, message:String(msg||code), detail, ts: Date.now() });
      }
    } catch {}
  };

  // Lightly wrap console.warn/error to surface canonicalizer and guard messages
  const owarn  = console.warn.bind(console);
  const oerror = console.error.bind(console);

  console.warn = function(...args){
    try {
      const s = String(args[0] ?? '');
      if (/Canon violation/i.test(s)) {
        push('CANON_VIOLATION', s, { logs: args.map(a=>String(a)).slice(0,6) });
      } else if (/Canon Guard/i.test(s) || /CanonGuard/i.test(s)) {
        push('GUARD_WARN', s, { logs: args.map(a=>String(a)).slice(0,6) });
      }
    } catch {}
    return owarn(...args);
  };

  console.error = function(...args){
    try {
      const s = String(args[0] ?? '');
      if (/Canon violation/i.test(s)) {
        push('CANON_VIOLATION', s, { severity:'error', logs: args.map(a=>String(a)).slice(0,6) });
      } else if (/Canon Guard/i.test(s) || /CanonGuard/i.test(s)) {
        push('GUARD_ERROR', s, { severity:'error', logs: args.map(a=>String(a)).slice(0,6) });
      }
    } catch {}
    return oerror(...args);
  };

  // Optional explicit event → incident
  window.addEventListener('canon:bus:violation', (e) => {
    const d = e?.detail || {};
    push('CANON_VIOLATION', d.message || 'Bus violation', d);
  });
})();
