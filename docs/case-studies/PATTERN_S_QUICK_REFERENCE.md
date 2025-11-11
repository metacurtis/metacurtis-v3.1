# Pattern S Quick Reference

**Goal:** Enforce single-writer governance (Layer 0) for MetaCurtis visual stack.

## 1. Ownership Map

Run:
```bash
npm run generate-ownership
```
This refreshes `docs/OWNERSHIP.md` (uniforms + events). No change to code is allowed without updating the manifest.

## 2. Runtime Guards

### WebGL uniforms
```javascript
if (import.meta.env.DEV) {
  const guardUniform = (name) => {
    let value = null;
    Object.defineProperty(material.uniforms, name, {
      set(next) {
        if (!new Error().stack.includes('WebGLBackground')) {
          throw new Error(`Pattern S: ${name} is renderer-owned`);
        }
        value = next;
      },
      get: () => value,
    });
  };
  guardUniform('uMorphProgress');
}
```

### BeatBus events
```javascript
bus.use((evt, payload, next) => {
  if (evt === EVENTS.MORPH_PROGRESS) {
    const source = payload?.source;
    if (!morphOwner) morphOwner = source;
    if (source !== morphOwner) return false;
    if (typeof payload.value !== 'number') return false;
  }
  return next(evt, payload);
});
```

## 3. Tooling

| Command | Purpose |
| --- | --- |
| `npm run scan-single-writer` | Static check: one writer per resource |
| `npm run gate:opening` | Pattern S + Canon validation for opening sequence |
| `npm run trace-bus` | BeatBus topology |
| `npm run test:contracts` | Canon contracts (Blueprint + BeatBus) |

## 4. Signals to Watch

- Console warnings starting with `[Pattern S]`
- `Canon violation: MORPH_PROGRESS missing value`
- Renderer probe mismatches: `window.probe.draw().match !== true`
- Missing `BLUEPRINT_READY` events after stage changes

## 5. When to Apply Pattern S

- Multi-agent collaboration (AI + humans)
- Systems with RAF loops, WebGL uniform side effects, or global buses
- Any time races or “ghost writers” appear

## 6. Expected Outcomes

- Debugging cycles drop from hours to minutes (8‑16×)
- Zero unowned uniforms/events in production
- Consistent Canon compliance (no guard bypasses)

See the full case study for the complete narrative and metrics.

