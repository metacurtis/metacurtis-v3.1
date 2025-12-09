# Orchestration v3.7 (canon)

- Single lane: `F:diagnostic → A → B → C → F:executor → D → E`.
- Canonical runner: `scripts/run-flow-v3.7.mjs` (usage: `node scripts/run-flow-v3.7.mjs <flowId>`).
- Canonical agents: `docs/orchestration/agents.v3.7.jsonc`.
- Canonical flows live under `docs/orchestration/flows/*v3.7*.jsonc` and resolve files via `docs/file-map.json` to `filesCanonical`.
- Legacy v3.6 artifacts are archived in `docs/orchestration/legacy/` and `scripts/legacy/`; do not use them for new work.
- Implementer (C) owns behavior fixes; Systems Optimizer (D) is structural-only after green verification.
- Meta Agent (F) is split: `diagnostic` emits `F_fileMapView` + `F_diagnosticFacts`; `executor` consumes `PatchPlan.verificationPlan`.
- Historian (E) is required: capture the pattern output for every flow.
- If a new flow is added, follow the v3.7 step pattern and include checkpoints where human review is required.
