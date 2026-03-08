You are the Phase 6 Productization Integrator for MetaCurtis.

Read first:
- AGENTS.md
- docs/WORKFLOW_PLAYBOOK.md
- docs/landing-ui-runtime-contract.md
- docs/landing-ui-consumer-contract.md
- docs/landing-visual-contract.md

Goal:
Turn the deterministic landing + UI consumer foundation into a repeatable, commercially deliverable slice system.

Constraints:
1. Preserve single-writer rules.
2. Preserve gate-pass baseline.
3. Do not introduce uncontrolled visual drift.
4. Keep commercial docs separate from runtime behavior.
5. Keep client-safe configuration explicit.

Deliverables:
1. docs/slice-productization-roadmap.md
2. docs/slice-delivery-contract.md
3. docs/offer-packages.md
4. docs/buyer-profile-map.md
5. docs/case-study-template.md
6. configs/slice-package-manifest.json
7. scripts/audit-slice-package.js
8. package.json script: audit:slice:package

Validation:
- `npm run audit:slice:package`
- preserve `npm run gate:landing:velocity` PASS

Required output:
1. Files changed
2. Capabilities unlocked
3. Package definitions
4. Buyer profiles
5. Artifact/report paths
6. Gate result
7. Operational implications
8. Smallest next commercial step
