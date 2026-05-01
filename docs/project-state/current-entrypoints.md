# Current Entrypoints

## Shipping Path
Run these from an external worktree created by `./scripts/new-worktree.sh`.

### Preflight
- `npm run scan-single-writer`
- `npm run validate-ownership`

### Landing Development
- `npm run dev`
- Animated URL:
  `/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA`
- Deterministic URL:
  `/?slice=landing_stage&preset=velocity_stage&landingWord=FORM&landingQuality=ULTRA&quality=ULTRA&deterministic=1&seed=123`

### Landing Artifact Pass
- `npm run audit:landing:formation`
- `LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity`
- `LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity`
- `npm run contact:landing:velocity`
- `npm run compare:landing:velocity`
- `npm run diagnose:landing:velocity`
- `npm run gate:landing:velocity`

## Opening Helper Surface
- `npm run validate:opening`
- `npm run agent:run -- --goal=opening:fencepost`
- `npm run agent:run -- --goal=opening:fencepost --apply`
- `npm run agent:record`
- `npm run agent:visuals`
- `npm run validate:vision`

## Contract and Repo Checks
- `npm run validate`
- `npm run canon:verify`
- `npm run ci:fencepost`
- `npm run doctor:agents`

## Thin System Router
- `npm run system:validate`
- `npm run system:doctor`
- `npm run system:query -- "<term>"`
- `npm run system:fix -- "<issue>"`

## Not Current
- `node scripts/run-flow-v3.7.mjs <flowId>`
- Most `scripts/legacy/*`
- Archive and backup folders as execution surfaces
