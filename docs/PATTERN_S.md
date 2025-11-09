# Pattern S — Single-Writer & Anti-Bloat Safeguard

**Use when:** Any change that touches GPU uniforms, geometry, event fences, or global state.  
**Goal:** One owner per critical resource, zero duplicate emitters, zero overlay/renderer cross-writes, automatic bloat detection.

---

## S1 — Ownership Map (source of truth)

See `docs/OWNERSHIP.md`. Guards and scanners read that file, so AI/teammates can’t “forget” the rules.

---

## S2 — Dev Guards (runtime, DEV only)

* `src/components/webgl/WebGLBackground.jsx`
  * `guardUniformWrite(origin, name)` blocks non-renderer writes to single-writer uniforms.
  * Renderer-origin directives remain the single source of truth for GPU uniforms.
* `src/theater/bus/index.js`
  * BeatBus now latches the **first** `MORPH_PROGRESS` emitter (animator) and drops the rest in DEV builds.

---

## S3 — Evidence Scanners (automatic detection)

`tools/scan-single-writer.mjs` crawls `src/` and flags:

* Unauthorized uniform writes (e.g., `uMotionMode.value = …`)
* Duplicate `MORPH_PROGRESS` emitters
* Geometry binds outside `WebGLBackground`

Output: `reports/single-writer-violations.json` + non-zero exit code.

`npm run scan-single-writer`

---

## S4 — Git Forensics Hooks (pre-commit & bisect)

Install a pre-commit hook that runs `npm run scan-single-writer`.  
Bisect oracle scripts should also call the scanner so regressions are caught automatically.

```
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash
set -e
npm run scan-single-writer
EOF
chmod +x .git/hooks/pre-commit
```

---

## S5 — Anti-Bloat Rule (diff-size + orphan listener check)

`tools/scan-bloat.mjs` inspects `reports/beatbus-map.json` and fails if any event has emitters without listeners or vice versa.

`npm run scan-bloat`

`gate:topology` runs `trace-bus` + `scan-bloat` to ensure the event graph stays balanced.

Known external consumers can be allowlisted in `tools/pattern-s.config.json` (kept small and documented).

---

## S6 — “Pattern S” Task Block (use with AI)

```
TASK: Pattern S — Single-Writer & Anti-Bloat Guard

GOAL:
- Enforce single-writer for {resource(s)}.
- Remove duplicate emitters/writers.
- Prove zero orphans in event topology.

STEPS:
1) Investigate:
   - run: npm run build-evidence && npm run scan-single-writer
   - attach: reports/single-writer-violations.json (if any), beatbus-map.json
2) Implement:
   - remove all non-owner writes in files: [list]
   - add DEV guards to owner
   - ensure events emitted by single source only
3) Validate:
   - run: npm run gate:opening && npm run gate:topology
   - expect: 0 violations, 0 orphans
TIME: 30–60 min
PRIORITY: CRITICAL
```

---

## S7 — “Does this make sense?” Loop

PR checklist:

1. Which ownership entry does this change touch?
2. Why can’t the existing owner do this?
3. Evidence delta (`reports/*`): event count same or lower?
4. New listeners/emitters? Justify.
5. Visual/perf tests passed?

---

### What you get

* AI can still ship fast, but **can’t** create second writers or event spam.
* Renderer stays the single writer for GPU uniforms; animator stays the single `MORPH_PROGRESS` emitter.
* Bloat is caught immediately (`scan-bloat`) and the opening guard (`gate:opening`) enforces the contract every time.
