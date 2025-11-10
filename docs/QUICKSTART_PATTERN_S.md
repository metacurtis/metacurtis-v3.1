# Pattern S Quickstart

1. Read `docs/OWNERSHIP.md` (know the owners before touching uniforms/events). If you must introduce a new owner/event, run `npm run generate-ownership` to refresh the map before coding and update the doc first.
2. Start each day by running `npm run build-evidence` and reviewing `reports/beatbus-map.md` for unexpected drift.
3. Implement changes inside the documented owners only.
4. Validate with `npm run gate:opening && npm run gate:topology` (gate:opening now auto-runs `npm run generate-ownership`, so be ready to stage updated `docs/OWNERSHIP.md`).
5. Commit; the Husky hook enforces Pattern S automatically (can be bypassed only with `SKIP_OWNERSHIP_CHECK=1` + documentation).
6. Pull requests must pass the CI Pattern S gates.
