You are implementing Phase 5C.1 UI Consumer integration for MetaCurtis Velocity Landing RC1.1+.

Read:
- AGENTS.md
- docs/WORKFLOW_PLAYBOOK.md
- docs/landing-ui-runtime-contract.md
- docs/landing-ui-consumer-contract.md
- docs/landing-visual-contract.md

Goal:
Upgrade the glass-luxury UI consumer so it feels physically attached to FORM:
1) magnetic lock attachment to word screenRect
2) drift fallback to bottom safe area
3) per-letter bracket + dock-to-letter connector affordances
4) remove standalone competing top-right sales card pattern

Hard constraints:
- no beat-sheet edits
- no visual tuning edits
- renderer remains single writer for geometry/uniforms/camera
- UI only reads window.__landingUiAnchor
- no UI writes into renderer state
- payload remains v1.1 (screenRect)

Runtime model rules:
- resolve model: per-letter -> zone -> whole -> none
- attach mode: lock => word, drift/other => bottom

Deliverables:
1. `src/components/landing/LandingUiOverlay.jsx`
2. `src/components/landing/LetterDockInterface.jsx`
3. `src/components/landing/GlassRailCTA.jsx`
4. `src/components/landing/LandingOverlay.jsx` (remove competing top-right prod card)
5. `scripts/audit-landing-ui-consumer.js` (validate magnetic + fallback + affordances)
6. docs updates if behavior contract changed

Validation required:
- npm run audit:landing:ui-anchor
- npm run audit:landing:ui-runtime
- npm run audit:landing:ui-consumer
- npm run gate:landing:velocity

Required report:
1. files changed
2. magnetic attach behavior summary
3. fallback behavior summary
4. affordance behavior summary (bracket/connector)
5. artifact paths
6. gate result
7. schema violations yes/no
8. single-writer violations yes/no
9. smallest next step
