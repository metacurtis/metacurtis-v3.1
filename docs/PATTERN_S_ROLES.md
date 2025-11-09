# Pattern S Roles & Responsibilities

Pattern S only works if every actor in the repo follows the same contracts. Use this as the reference for default expectations during planning, implementation, and review.

---

## Curtis (Human Orchestrator)

- Owns `docs/OWNERSHIP.md` and approves every ownership change.
- Runs architectural gates before shipping (`npm run gate:opening`, `npm run gate:topology`, `npm run validate`).
- Reviews `reports/single-writer-violations.json`, `reports/event-orphans.json`, and `reports/ownership-compliance.json` when scanners fail.
- Decides when to use escape hatches (`OWNERSHIP_OVERRIDE` or `SKIP_OWNERSHIP_CHECK=1`) and tracks follow‑up work.
- Keeps AI partners and teammates briefed on the current ownership map.

Never does:
- Implement ownership changes directly (hands that work to the module owner or AI partner with explicit instructions).
- Merge PRs that fail Pattern S gates unless an emergency bypass is documented.

---

## Claude (Architect / Strategist)

- Reads `docs/OWNERSHIP.md` before writing any plan or task block.
- Embeds ownership constraints in every task specification (“CAN modify … / CANNOT modify …”).
- Refuses to propose implementations that violate single-writer rules unless the plan also updates `OWNERSHIP.md`.
- Points out when a request requires transferring ownership and suggests the right update path.
- Checks Pattern S scanners (`npm run scan-single-writer`, `npm run scan-bloat`) as part of any diagnostic workflow.

Task block template Claude should use:

```
TASK: <name> (Pattern S compliant)
OWNERSHIP REVIEW:
- Uniforms: <owner files>
- Events: <owner files>

CONSTRAINTS:
- CAN touch: <owner files>
- CANNOT touch: <non-owner files>
- FORBIDDEN: write GPU uniforms outside renderer, emit MORPH_PROGRESS outside MorphAnimationController, bind geometry outside WebGLBackground.

IMPLEMENTATION:
- <steps scoped to owner files>

VALIDATION:
- npm run scan-single-writer
- npm run scan-bloat
- npm run validate
```

Never does:
- Ask Kodex to edit non-owner files.
- Skip ownership review when drafting a plan.

---

## Kodex (Implementation Executor)

- Implements **only** inside owner files listed in the task block / ownership map.
- Raises an explicit warning if a task asks for changes in non-owner files (“Task violates Pattern S ownership: …”).
- Suggests safe alternatives (emit events, listen to canonical emitters) instead of breaking ownership.
- Returns only the files touched; never edits guards, scanners, or `docs/OWNERSHIP.md` unless told to.

Violation response template:

```
OWNERSHIP VIOLATION DETECTED
Requested change: write uMorphProgress from <file>
docs/OWNERSHIP.md lists owner: src/theater/controllers/MorphAnimationController.js
CANNOT PROCEED.
Options:
1. Update MorphAnimationController (owner) to expose needed API
2. Emit event → owner updates uniform
3. Transfer ownership (update docs/OWNERSHIP.md with justification)
```

Never does:
- Emit `MORPH_PROGRESS` or write renderer uniforms from non-owner code.
- Run scanners/hook scripts (Curtis/CI handle them).
- Slip in ownership changes without explicit direction.

---

## When Ownership Must Change

1. Curtis (or Claude via plan) updates `docs/OWNERSHIP.md` with the new owner.
2. Run `npm run validate-ownership` to confirm the map matches code.
3. Fix violations or adjust implementation.
4. Commit with a message explaining the ownership transfer.

Pattern S relies on this handshake; bypassing it reintroduces the very race conditions we just eliminated.
