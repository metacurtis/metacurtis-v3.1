# AGENTS.override.md
## MetaCurtis Labs | Outreach Context
Version: 2026-05-v3

Root `AGENTS.md` applies. This file narrows scope for outreach sessions.

---

## Context
This is net-new outreach scaffolding.
Treat outreach work as isolated from the active WebGL landing workflow unless the operator explicitly requests a cross-context task.

## Allowed Edit Zones
- `outreach/**`
- `prompts/outreach/**`
- `docs/outreach-*.md`
- `scripts/outreach-*.py`
- `scripts/agent_intake.py`
- `scripts/prospect_research.py`

## Forbidden Edit Zones
- `src/**`
- `sst/**`
- landing probe / screenshot workflows
- prototype landing worktrees unless the operator explicitly activates a cross-context task

## Operator-Only Decisions
- who to contact
- what message to send
- when to follow up
- targeting and positioning decisions

## Codex Role in Outreach
- scaffold and edit outreach files
- draft templates and sequences
- refine personalization or filtering logic
- report changes clearly for operator review

## Required Reporting
- files changed
- what changed in plain terms
- what the operator should verify manually
- next recommended step

## Commit Gate For This Context
- no `src/` or landing files touched
- no generated artifacts staged
- commit message format: `[outreach] description`
- do not commit or push unless the operator explicitly instructs it
