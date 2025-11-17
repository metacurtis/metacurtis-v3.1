/* eslint-env node */
// tools/sentinel/openingChecks.mjs
// Robust opening checks: hard invariants + advisory (RELAXED-aware). Debug prints snippets+fix tips.

export function runOpeningChecks(options = {}) {
  const {
    opening = '',
    engine = '',
    renderer = '',
    theater = '',
    director = '',
    trace = options.traceEvents ?? options.events ?? [],
    debug = false,
  } = options;
  const RELAXED = !!process.env.SST_RELAXED;

  const rows = []; let fails = 0;
  const add = (ok, label, meta = {}) => {
    const severity = meta.severity || 'hard'; // 'hard' | 'advisory'
    const effectiveFail = !ok && !(RELAXED && severity === 'advisory');
    if (effectiveFail) fails++;
    if (debug && !ok) meta._snippet = meta._snippet ?? snippet(meta.source ?? opening, meta.pattern);
    rows.push({ ok, label, severity, ...meta });
  };

  const snippet = (src, pat) => {
    if (!src || !pat) return null;
    try {
      const re = pat instanceof RegExp ? pat : new RegExp(pat, 'm');
      const m = src.match(re); if (!m) return null;
      const idx = m.index ?? 0, start = Math.max(0, idx-140), end = Math.min(src.length, idx+140);
      return src.slice(start, end);
    } catch { return null; }
  };

  // ── HARD invariants ─────────────────────────────────────────

  add(/import\s+BeatBus\s+from\s+['"]@\/theater\/bus(?:\.m?js)?['"]/.test(opening),
      'OpeningSequence uses single bus',
      { source: opening, pattern: /import\s+BeatBus\s+from\s+['"]@\/theater\/bus/ });

  add(!/CTF_BUILD/.test(opening), 'OpeningSequence has no CTF',
      { source: opening, pattern: /CTF_BUILD/ });

  add(!/(BufferGeometry|useFrame|THREE\.)/.test(opening), 'OpeningSequence overlay-only',
      { source: opening, pattern: /(BufferGeometry|useFrame|THREE\.)/ });

  add(/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(engine),
      'Engine gate at top of buildAndEmitBlueprint', { source: engine });

  const traceEvents = normalizeTrace(trace);
  const directorFlow = detectDirectorFlow(traceEvents, { ...options, theater, director });
  const emergencePattern = /BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/;
  const emergenceLabel = 'Engine emergence emits mode:"emergence" (or director-driven)';
  add(
    directorFlow.active || emergencePattern.test(engine),
    emergenceLabel,
    directorFlow.active
      ? { note: directorFlow.reason || 'director-driven flow detected (opening chaos)', severity: 'advisory' }
      : { source: engine, pattern: emergencePattern }
  );

  const spiral = /(swirl|spiral)/.test(engine) ||
                 (/ang\s*=\s*(?:i|t)[^;]*\*/.test(engine) && /\br\s*=\s*(?:i|t)\s*\*/.test(engine));
  add(!spiral, 'Engine emergence random->random (no spiral)', { source: engine });

  const emergedFencePattern = /BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED|\bemitParticlesEmerged\b/;
  add(emergedFencePattern.test(renderer),
      'Renderer emits PARTICLES_EMERGED fencepost once',
      { source: renderer, pattern: emergedFencePattern });

  add(/ENGINE_VIEWPORT_HINT/.test(theater),
      'Theater start-after-viewport gate present',
      { source: theater, pattern: /ENGINE_VIEWPORT_HINT/ });

  // ── ADVISORY (dev-friendly style/feel) ─────────────────────

  // Strict mono: accept literal OR constant (decl+use) OR inline CSS
  const monoLiteral   = /fontFamily\s*:\s*["'][^"']*(?:Courier\s+New|Lucida\s+Console|DejaVu\s+Sans\s+Mono|monospace)[^"']*["']/i.test(opening);
  const monoConstDecl = /const\s+(?:STRICT_MONO_STACK|STRICT_MONO|MONO)\s*=\s*["'][^"']*(?:Courier\s+New|Lucida\s+Console|DejaVu\s+Sans\s+Mono|monospace)[^"']*["']/i.test(opening);
  const monoConstUse  = /fontFamily\s*:\s*(STRICT_MONO_STACK|STRICT_MONO|MONO)\b/.test(opening);
  const monoCSS       = /font-family\s*:\s*[^;]*(Courier\s+New|Lucida\s+Console|DejaVu\s+Sans\s+Mono|monospace)/i.test(opening);
  add(monoLiteral || (monoConstDecl && monoConstUse) || monoCSS,
      'OpeningSequence strict mono font stack',
      { source: opening, severity:'advisory', pattern:/fontFamily\s*:|font-family\s*:/,
        fix: 'Add a literal once: fontFamily: "Courier New, Courier, Lucida Console, DejaVu Sans Mono, monospace"' });

  // No glow
  const hasShadow = /textShadow\s*:\s*["'][^"']+["']/.test(opening);
  const noneShadow= /textShadow\s*:\s*["']none["']/.test(opening);
  add(!hasShadow || noneShadow,
      'OpeningSequence no glow',
      { source: opening, severity:'advisory', pattern:/textShadow\s*:/, fix: "textShadow: 'none'" });

  // Progressive fill = flag + seed [] and NOT [fillText]
  const setsFlag        = /__opening_fill_start_lines\s*=\s*0/.test(opening);
  const seedsEmptyArray = /setScreenFillLines\(\s*\[\s*\]\s*\)/.test(opening);
  const seedsFillText   = /setScreenFillLines\(\s*\[\s*fillText\s*\]\s*\)/.test(opening);
  const progressiveOK   = setsFlag && seedsEmptyArray && !seedsFillText;
  add(progressiveOK,
      'OpeningSequence progressive fill (no flash)',
      { source: opening, severity:'advisory', pattern:/setScreenFillLines\s*\(/,
        fix: 'Inside SCREEN_FILL: window.__opening_fill_start_lines = 0; setScreenFillLines([]); // not [fillText]' });

  return { rows, fails };
}

function normalizeTrace(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.events)) return raw.events;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.events)) return parsed.events;
    } catch {
      // Fall through to NDJSON-style parsing
    }
    return trimmed
      .split(/\r?\n/)
      .map(line => {
        const text = line.trim();
        if (!text) return null;
        try { return JSON.parse(text); }
        catch { return { raw: text }; }
      })
      .filter(Boolean);
  }
  return [];
}

function detectDirectorFlow(traceEvents = [], options = {}) {
  const hasDirectorEvent = traceEvents.some(isDirectorOpeningEvent);
  if (hasDirectorEvent) return { active: true, reason: 'director-driven flow detected' };

  const hasOpeningChaosEvent = traceEvents.some(isOpeningChaosEvent);
  if (hasOpeningChaosEvent) return { active: true, reason: 'opening_chaos trace detected' };

  if (isOpeningChaosFlagged(options)) return { active: true, reason: 'opening_chaos flag active' };

  if (announcedInDirectorSource(options.director || options.theater)) {
    return { active: true, reason: 'DIRECTOR_OPENING_MODE emit detected' };
  }

  return { active: false };
}

function announcedInDirectorSource(theaterSource = '') {
  if (!theaterSource) return false;
  return /BeatBus\.emit\(\s*(?:EVENTS\.)?DIRECTOR_OPENING_MODE/.test(theaterSource);
}

function isDirectorOpeningEvent(event) {
  if (!event) return false;
  if (typeof event === 'string') return event.includes('DIRECTOR_OPENING_MODE');
  const evName = event.ev || event.event || event.type;
  if (typeof evName === 'string' && evName.includes('DIRECTOR_OPENING_MODE')) return true;
  if (typeof event.raw === 'string' && event.raw.includes('DIRECTOR_OPENING_MODE')) return true;
  return false;
}

function isOpeningChaosEvent(event) {
  if (!event) return false;
  if (typeof event === 'string') return event.includes('opening_chaos');
  const { ev, kind, mode, raw } = event;
  if (ev === 'DIRECTOR_OPENING_MODE') return true;
  if (ev === 'WBG:BIND' && (kind === 'opening_chaos' || mode === 'opening_chaos')) return true;
  if (kind === 'opening_chaos' || mode === 'opening_chaos') return true;
  if (typeof raw === 'string' && raw.includes('opening_chaos')) return true;
  return false;
}

function isOpeningChaosFlagged(options = {}) {
  const candidates = [
    options.openingChaos,
    options.opening_chaos,
    options.flags?.openingChaos,
    options.flags?.opening_chaos,
    options.config?.openingChaos,
    options.config?.opening_chaos,
    options.settings?.openingChaos,
    options.settings?.opening_chaos,
  ];
  return candidates.some(boolish);
}

function boolish(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return Boolean(value);
}
