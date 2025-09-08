/* eslint-env node */
// tools/sentinel/openingChecks.mjs
// Opening sentinel extracted for separation, reusability and debug.

export function runOpeningChecks({ opening, engine, renderer, theater, debug=false }){
  const rows = [];
  let fails = 0;

  const row = (ok, label, meta={}) => {
    if (!ok) fails++;
    if (debug && !ok) meta._snippet = meta._snippet ?? hint(opening, meta.pattern);
    rows.push({ ok, label, ...meta });
  };

  const hint = (src, pat) => {
    if (!pat) return null;
    try {
      const re = pat instanceof RegExp ? pat : new RegExp(pat, 'm');
      const m = src.match(re);
      if (!m) return null;
      const idx = m.index ?? 0;
      const start = Math.max(0, idx - 120);
      const end   = Math.min(src.length, idx + 120);
      return src.slice(start, end);
    } catch { return null; }
  };

  // Baseline fencepost
  row(/import\s+BeatBus\s+from\s+['"]@\/theater\/bus['"]/.test(opening), 'OpeningSequence uses single bus',
      { pattern: /imports+BeatBuss+from/ });

  row(!/CTF_BUILD/.test(opening), 'OpeningSequence has no CTF',
      { pattern: /CTF_BUILD/ });

  row(!/(BufferGeometry|useFrame|THREE\.)/.test(opening), 'OpeningSequence overlay-only',
      { pattern: /(BufferGeometry|useFrame|THREE.)/ });

  row(/buildAndEmitBlueprint[^]*?if\s*\(\s*this\._openingPhase\s*&&\s*stage\s*!==\s*['"]genesis['"]\s*\)/.test(engine),
      'Engine gate at top of buildAndEmitBlueprint',
      { file: 'Engine' });

  row(/BLUEPRINT_READY[^]*mode\s*:\s*['"]emergence['"]/.test(engine),
      'Engine emergence emits mode:"emergence"',
      { file: 'Engine', pattern: /modes*:s*['"]emergence['"]/ });

  const hasSpiral = /(swirl|spiral)/.test(engine) ||
                    (/ang\s*=\s*(?:i|t)[^;]*\*/.test(engine) && /\br\s*=\s*(?:i|t)\s*\*/.test(engine));
  row(!hasSpiral, 'Engine emergence random->random (no spiral)', { file:'Engine' });

  row(/BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/.test(renderer),
      'Renderer emits PARTICLES_EMERGED fencepost once',
      { file: 'Renderer', pattern: /BeatBus\.emit\(\s*EVENTS\.PARTICLES_EMERGED/ });

  row(/ENGINE_VIEWPORT_HINT/.test(theater), 'Theater start-after-viewport gate present',
      { file:'Theater' });

  // Opening style contracts
  // Accept either inline literal with Courier New | ui-monospace OR using STRICT_MONO_STACK symbol
  const monoLiteral = /fontFamilys*:s*["'][^"']*(Couriers*New|ui-monospace)[^"']*["']/.test(opening);
  const monoSymbol  = /fontFamilys*:s*STRICT_MONO_STACK/.test(opening);
  row(monoLiteral || monoSymbol, 'OpeningSequence strict mono font stack',
      { pattern: /(fontFamilys*:s*["'][^"']*Couriers*New[^"']*["']|fontFamilys*:s*STRICT_MONO_STACK)/ });

  row(!/textShadow:s*['"][^'"]+['"]/.test(opening) || /textShadow:s*['"]none['"]/.test(opening),
      'OpeningSequence no glow', { pattern: /textShadow:/ });

  // Must set __opening_fill_start_lines and seed [] on SCREEN_FILL
  const hasNoFlash = /__opening_fill_start_lines/.test(opening) && /setScreenFillLines(s*[s*]s*)/.test(opening);
  row(hasNoFlash, 'OpeningSequence progressive fill (no flash)',
      { pattern: /setScreenFillLines(s*[s*]s*)/ });

  return { rows, fails };
}
