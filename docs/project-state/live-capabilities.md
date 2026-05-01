# Live Capabilities

## Operational Now
- Contract validation lane:
  `npm run validate`
  `npm run scan-single-writer`
  `npm run generate-ownership`
  `npm run validate-ownership`
- Landing deterministic workflow:
  `npm run audit:landing:formation`
  `npm run probe:landing:velocity`
  `npm run screens:landing:velocity`
  `npm run contact:landing:velocity`
  `npm run compare:landing:velocity`
  `npm run diagnose:landing:velocity`
  `npm run gate:landing:velocity`
- Opening and vision helper subset:
  `npm run validate:opening`
  `npm run agent:run -- --goal=opening:fencepost`
  `npm run agent:record`
  `npm run agent:visuals`
  `npm run validate:vision`
- System router:
  `npm run system:validate`
  `npm run system:doctor`
  `npm run system:query`
  `npm run system:fix`

## Partially Operational
- `npm run agent:run -- --goal=opening:fencepost` is wired but not currently green.
- `npm run agent:visuals` and `npm run validate:vision` depend on telemetry in `.vision/telemetry/`.
- Opening helper docs describe a cleaner lane than the repo currently executes.

## Present But Not Current Shipping Path
- The v3.7 orchestration docs, file map, agent specs, and flow definitions exist.
- `node scripts/run-flow-v3.7.mjs <flowId>` is not currently runnable end-to-end.
- Treat `docs/orchestration/*` as a repair track, not the current shipping source of truth.

## Legacy, Archive, and Noise
- `scripts/legacy/`
- `docs/orchestration/legacy/`
- Backup and archive folders:
  `.hotdors_backups/`
  `.migration_backups/`
  `canon-archive/`
  `archive*/`
- Duplicate agent-like and sentinel-like files inflate perceived capability.

## Current Development OS
1. Work from an external worktree created by `./scripts/new-worktree.sh`.
2. Keep artifacts outside the main checkout by using the external worktree as the artifact-producing surface.
3. Make landing changes in the approved landing surfaces only.
4. Run preflight:
   `npm run scan-single-writer`
   `npm run validate-ownership`
5. Run the landing artifact pipeline from the worktree.
6. Record current truth in `docs/project-state/` instead of assuming older docs are still live.

## Not To Rely On For Current Shipping
- `node scripts/run-flow-v3.7.mjs <flowId>`
- Broad repo-wide "doctor everything" passes
- Archive or backup scripts as current authority
- Any workflow that assumes every agent lane in the repo is live
