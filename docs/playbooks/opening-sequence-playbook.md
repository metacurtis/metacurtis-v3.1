# Opening Sequence Playbook

## Preflight
- Font reachable (HEAD 200)
- CE never caches fallback band
- Emergence guard enabled (no mid-morph rebuilds)
- Renderer is single GPU writer

## Steps
1) `await __consciousnessEngine.loadFont(); __consciousnessEngine.clearCache();`
2) `CANON_CONSOLE.showHud(); CANON_CONSOLE.incidents.clear();`
3) `CANON_CONSOLE.runMacro('macroOpening')`
4) Probes:
   - `probe.draw()` → full draw
   - `probe.aabb({fitFrac:0.82})` → pass
   - `probe.compareAtmoTarget()` → endpointsDifferent:true
   - HUD morph → 1.0 in ≤ 2.2s

## Done when
- Morph hits 1.0; no SINGLE_WRITER_VIOLATION; Genesis does not preserve a fallback band.
