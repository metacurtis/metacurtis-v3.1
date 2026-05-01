# Current Focus

## Active Execution Surface
Validated landing execution worktree:
`~/projects/metacurtis-worktrees/landing-premium-v2`

## Current Execution Model
- Main checkout is for repo truth, docs, and baseline maintenance.
- Landing and artifact-producing flows must run from an external worktree.
- Use `./scripts/new-worktree.sh <name>` from the main checkout to create the worktree.
- Use `./scripts/start-flow.sh status`, `landing`, and `landing-verify` inside the worktree.

## Current Shipping Path
- Landing slice refinement
- Contract and ownership validation
- Single-writer discipline
- Deterministic landing probe, screenshot, compare, and gate flow

## Do Not Expand Yet
- Repo-wide doctor sweeps
- v3.7 orchestration repair as a prerequisite for landing work
- Broad automation cleanup beyond the live path
