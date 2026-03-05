You are the Phase 5B Integrator for MetaCurtis Velocity Landing RC1.1.

Read first:
- AGENTS.md
- docs/WORKFLOW_PLAYBOOK.md
- docs/landing-ui-runtime-contract.md
- docs/landing-ui-anchor-contract.md
- docs/landing-visual-contract.md

Goal:
Expose a read-only runtime payload for UI consumers without changing landing behavior.

Constraints:
1. No beat-sheet edits.
2. No visual tuning edits.
3. Renderer remains single writer for geometry/uniforms.
4. UI consumes only `window.__landingUiAnchor`.
5. Payload shape changes require version bump.

Deliverables:
1. Runtime wiring for `window.__landingUiAnchor`.
2. `scripts/audit-landing-ui-runtime.js`.
3. `package.json` script `audit:landing:ui-runtime`.

Runtime contract requirements:
- `version: "1.0"`
- `sourceScenarioId: "target_scale_up_1_6"`
- `stage: "velocity"`
- `word: "FORM"`
- `recommendedModel: "per-letter"`
- null-safe when not ready
- ready state includes whole/letters/zones geometry

Validation commands:
- `npm run audit:landing:ui-anchor`
- `npm run audit:landing:ui-runtime`
- `npm run gate:landing:velocity`

Required output format:
1. Files changed
2. Payload shape summary
3. Artifact paths
4. Null-safe behavior status
5. Readiness preservation status (whole/per-letter/zone)
6. Gate result
7. Schema violations yes/no
8. Single-writer violations yes/no
9. Smallest next step
