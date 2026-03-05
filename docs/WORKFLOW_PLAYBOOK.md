# MetaCurtis Landing Slice Workflow Playbook

## Status
This playbook records the workflow that produced the first gate-passing velocity landing slice baseline (Velocity Landing RC1) for the MetaCurtis Consciousness Theater repo.

It is designed for two audiences:
- **you**, so you do not lose the method you built
- **AI agents**, so they can operate inside the repo with the right expectations, constraints, and validation discipline

## Recommended file format
Use **Markdown as the primary playbook** because:
- humans can scan it quickly
- AI models follow narrative instructions and constraints better in Markdown than in raw JSON
- it supports examples, command blocks, failure modes, and decision rules clearly

Use **JSON as a companion manifest**, not the main playbook, because:
- JSON is good for scenario metadata, role definitions, command templates, and automation hooks
- JSON is bad for nuance, exceptions, and reasoning guidance

The best pattern is:
- `WORKFLOW_PLAYBOOK.md` = main operating document
- `workflow-manifest.json` = compact machine-readable summary

---

# 1. What this workflow actually is

This is not just a "make particles form text" workflow.

It is a **deterministic, inspectable, AI-native delivery workflow** for building premium landing slices inside a real-time WebGL narrative system.

The workflow exists to answer one question repeatedly and safely:

> Can we make a visually premium landing slice that is also deterministic, debuggable, business-usable, and regression-resistant?

The workflow succeeded because it did **not** rely on taste alone.
It used:
- scenario isolation
- runtime probes
- screenshot capture
- contact sheets
- compare reports
- release gating
- formation audits

That is why it found the real root cause instead of endlessly tweaking visuals.

---

# 2. What we achieved by the end of Phase 4

## Final outcome
The workflow produced a **gate-passing RC1 baseline** for the velocity landing slice.

## Decisive keeper
The keeper was **not** beat-sheet polish.
The keeper was an upstream target-density remediation:

- `visual.letterGeometry.velocity.particlesPerLetter: 200 -> 800`

## Why it won
It increased text-assigned particles from:
- `800 / 15000` to `3200 / 15000`
- `5.3%` to `21.3%`

That moved the slice from:
- embedded / soft / buried FORM

to:
- readable / dominant / gate-passing FORM

## Core lesson
When beat tuning plateaued, the workflow forced an upstream audit and found the real bottleneck.

That is the value of this system.

---

# 3. Core principles of the workflow

## 3.1 Determinism over intuition
Never trust visual impressions alone.
Every meaningful claim should be backed by:
- a probe artifact
- a screenshot manifest
- a contact sheet or equivalent visual review
- a scenario result with keep/discard/follow-up

## 3.2 Smallest-change discipline
Every scenario should change **one variable only** unless a compound candidate is explicitly justified.

## 3.3 Control branch first
There should always be a known control baseline.
Scenario branches are compared against control, not against memory.

## 3.4 Architecture is sacred
Do not bypass architecture to force a visual win.
No cheating around:
- stage-mode enforcement
- single-writer rules
- schema discipline
- deterministic behavior
- blueprint ownership

## 3.5 Gate before taste
A slice is not considered "done" because it looks good once.
A slice is done when:
- control reproduces it
- artifacts are current
- schema violations are zero
- single-writer violations are zero
- gate passes

---

# 4. Operating roles for AI

These roles can all be played by one model, but they should be used deliberately.

## 4.1 Architect
Use when:
- defining the next scenario
- deciding whether a problem is orchestration, formation, or renderer-side
- interpreting diagnostic results

Expected behavior:
- propose the smallest valid next move
- do not edit code directly unless asked
- do not skip evidence review

## 4.2 Implementer
Use when:
- applying one scenario or one explicit remediation
- editing approved files only
- running required commands

Expected behavior:
- minimal diff
- no architecture drift
- always report files changed, commands run, artifacts, violations, and decision

## 4.3 Verifier
Use when:
- reading artifacts only
- comparing code intent vs runtime vs visuals
- scoring against the rubric

Expected behavior:
- no code edits
- checkpoint-by-checkpoint judgment
- name exact mismatch and smallest likely cause

## 4.4 Diagnostic agent
Use when:
- running scenario matrices
- ranking candidates
- deciding keep/discard/follow-up

Expected behavior:
- one-variable-only discipline
- scenario JSON output
- ranking summary

## 4.5 Release manager
Use when:
- promoting a keeper into control
- regenerating clean artifacts from control
- freezing RC baselines
- refusing exploratory tuning after PASS unless justified

---

# 5. How to interact with AI in this workflow

## 5.1 Best prompt structure
When you want an AI agent to work effectively, your prompt should contain:

1. **What role it is playing**
2. **What it must read first**
3. **What branch or worktree to start from**
4. **What exact variable(s) may change**
5. **What may not change**
6. **What commands to run**
7. **What artifact(s) to produce**
8. **What final report format to use**

## 5.2 Good instruction style
Good:
- "Change only 7600ms lock sigma by -0.15 and keep drift unchanged"
- "Start from landing-diagnostics-control"
- "Run probe, screens, contact, compare, diagnose, gate"
- "Write scenario JSON with recommendedDecision"

Bad:
- "Try to make it better"
- "See if you can improve readability somehow"
- "Tune until it looks right"

## 5.3 What AI is good at here
AI is strong at:
- scenario isolation
- command sequencing
- artifact discipline
- comparing branches and scenarios
- codifying rules into docs and scripts
- preventing repeated mistakes

AI is weaker at:
- subjective aesthetic judgment without visual evidence
- understanding whether a business surface is commercially viable without a rubric
- noticing subtle visual tradeoffs unless prompted to compare exact checkpoints

So always pair aesthetic goals with measurable checkpoints.

---

# 6. Phases 1 through 4: exact playbook

## Phase 1 - Observability foundation

### Objective
Create the minimum instrumentation needed to inspect the landing slice without guessing.

### Outputs
- AGENTS guidance
- landing visual contract
- runtime probe script
- screenshot capture script
- package scripts to run them

### Required capabilities
- checkpoint-based runtime dump
- checkpoint-based screenshots
- schema violation counting
- single-writer violation counting

### Commands
```bash
npm run probe:landing:velocity
npm run screens:landing:velocity
```

### Exit criteria
You can answer:
- what the code says should happen
- what runtime says actually happened
- what the screen shows at each checkpoint

---

## Phase 1.5 - Readability review layer

### Objective
Turn raw artifacts into interpretable evaluations.

### Outputs
- readability rubric
- probe comparison script
- contact sheet generator
- verifier prompt

### Required capabilities
- score Word Recognition, Counter Clarity, Edge Clarity, Foreground Dominance, Transition Stability, UI Anchor Suitability
- compare the newest run against the previous run
- produce visual review surfaces that are easy to scan

### Commands
```bash
npm run compare:landing:velocity
npm run contact:landing:velocity
```

### Exit criteria
You can distinguish:
- runtime improvement that is visually fake
- visual improvement that runtime does not explain
- true keeper candidates

---

## Phase 2 - Diagnostic scenario system

### Objective
Stop random tweaking and convert landing work into structured scenarios.

### Outputs
- diagnostic matrix
- scenario config
- scenario result JSONs
- summary / ranking output

### Required capabilities
- one-variable-only scenarios
- strict control comparison
- keep/discard/follow-up decisioning
- scenario ranking

### Commands
Typical scenario flow:
```bash
LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity
LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity
npm run contact:landing:velocity
npm run compare:landing:velocity
npm run diagnose:landing:velocity
```

### Exit criteria
You know which hypotheses are dead and which deserve promotion.

### What Phase 2 taught us
The following were tested and discarded as standalone fixes:
- transition verb replacement
- word authority override
- depth falloff reduction
- camera pullback
- lock point reduction
- lock sigma reduction
- lock opacity tightening
- lock spread tightening
- lock isolate pulse

The best single-variable beat-era candidate was:
- `sigma_only_minus_0_1`

But even that did not solve the real bottleneck.

---

## Phase 3 - Release gate discipline

### Objective
Make the workflow capable of saying "not ready" and "ready" in a principled way.

### Outputs
- release gate doc
- release gate script
- pass/fail criteria for lock and drift checkpoints

### Required capabilities
- fail if lock does not meet threshold
- fail if drift regresses
- fail on schema/single-writer violations
- pass only from a clean artifact-backed scenario/control state

### Commands
```bash
npm run gate:landing:velocity
```

### Exit criteria
The workflow can distinguish a cool experiment from a release candidate.

---

## Phase 4 - Formation / target integrity

### Objective
Investigate upstream geometry and target quality once beat tuning plateaus.

### Outputs
- formation audit doc
- formation audit script
- raw scatter artifacts
- verdict logic for target integrity

### Required capabilities
- authority alignment audit
- target cloud inspection
- text-assignment ratio calculation
- formation verdict classification

### Commands
```bash
npm run audit:landing:formation
```

### Exit criteria
You can tell whether the problem is:
- target integrity
- renderer obscuration
- unresolved deeper issue

### What Phase 4 proved
The root cause was **target-density starvation**, not beat orchestration.

The winning remediation was:
- `visual.letterGeometry.velocity.particlesPerLetter = 800`

That produced:
- assigned text particles: `800 -> 3200`
- ratio: `5.3% -> 21.3%`
- gate: `PASS`

---

# 7. How we arrived at the deterministic landing slice

This is the journey in plain language:

1. We started with a visually interesting but unreliable landing slice.
2. We built runtime probes and screenshot capture so the system became inspectable.
3. We created a rubric so readability could be scored instead of argued.
4. We converted tuning into named scenarios with keep/discard logic.
5. We observed that many beat-level changes altered runtime numbers without fixing the lock checkpoint.
6. We concluded beat-sheet tuning had plateaued.
7. We ran a formation audit.
8. The audit revealed only **800 / 15000** particles were assigned into the text target.
9. We ran a single-variable density remediation.
10. That increased target density to **3200 / 15000**.
11. Lock readability improved materially.
12. Gate passed.
13. The keeper was promoted into control.

That is how we got here.

---

# 8. Branches vs worktrees

You specifically asked about this, and it matters.

## 8.1 When a normal branch is enough
Use a branch when:
- you are running one scenario at a time
- you do not need parallel experiment directories
- you are comfortable switching back and forth

Typical flow:
```bash
git switch landing-diagnostics-control
git switch -c landing-diagnostic-sigma-only
```

## 8.2 When to use a worktree
Use a worktree when:
- multiple AI agents or terminals will run in parallel
- you want to preserve a clean control directory while another scenario runs elsewhere
- switching branches in one working directory becomes risky or confusing
- you want one folder per scenario

### Example
```bash
git switch landing-diagnostics-control
git worktree add ../wt-lock-sigma -b landing-diagnostic-lock-sigma-minus-0-15
cd ../wt-lock-sigma
```

## 8.3 Why worktrees matter for this workflow
This workflow benefits from worktrees because:
- scenario isolation becomes physical, not just logical
- control remains untouched in another folder
- two AI agents can operate on different scenarios without stomping each other
- artifact generation is easier to reason about per scenario

## 8.4 Recommended future policy
For shallow repo work, branches are fine.
For deeper concurrent scenario work, use worktrees by default.

### Suggested structure
```bash
repo/                     # main control or current promotion branch
../wt-control             # clean control
../wt-sigma               # sigma scenario
../wt-density             # density scenario
../wt-ui-anchor           # phase 5 audit/integration
```

---

# 9. Capability inventory you should not forget

This is the section you said you often lose track of.

## Current workflow capabilities
You now have a system that can:

### Development control
- enforce stage-mode assumptions
- keep scenario work isolated
- promote a keeper into control cleanly

### Validation
- probe runtime values at specific checkpoints
- capture screenshots at specific checkpoints
- generate contact sheets
- compare recent probe runs
- rank scenario outcomes
- run release gating

### Upstream diagnosis
- audit word authority alignment
- inspect target cloud assignment ratio
- classify target integrity issues
- detect when orchestration tuning has plateaued

### AI coordination
- define role-specific prompts
- constrain what may change
- require exact artifacts and reports
- keep agents from drifting into unbounded experimentation

### Productization foundation
- freeze gate-passing RC baselines
- build reusable slice methodology
- create future slice factory process on top of a proven workflow

---

# 10. Expectations for AI in this repo

## Always expect AI to:
- read the governing docs first
- state the branch/worktree it is using
- state the exact variable(s) being changed
- run the required artifact pipeline
- report violations explicitly
- recommend keep/discard/follow-up

## Never allow AI to:
- say "looks better" without artifacts
- run multiple unrelated changes in one scenario
- bypass architecture to force a pass
- keep tuning after a gate PASS without justification
- conflate control and experimental branches

---

# 11. What RC1 means

## RC1 definition
Velocity Landing RC1 is the first control baseline that:
- uses the promoted density remediation
- reproduces readable FORM lock/drift behavior
- passes diagnose/gate from control
- has current formation audit artifacts

## RC1 is not the end of the platform
RC1 is the first trustworthy slice baseline.

That means future work should be:
- UI anchor integration
- productization
- slice-factory expansion

not random exploration.

---

# 12. Phase 5 starting point

Now that RC1 exists, Phase 5 should focus on **productization and integration**, not diagnosis.

## Recommended Phase 5A
UI-anchor integration contract:
- define whether FORM is a whole-word anchor, per-letter anchor, or zone-based anchor
- audit stable bounds across lock/drift
- expose runtime data needed for UI attachment

## Recommended Phase 5B
Package RC1 as a reusable commercial unit:
- one clean baseline
- one runbook
- one artifact pack
- one offer description

## Recommended Phase 5C
Start slice factory expansion only after RC1 is frozen:
- new words
- new palettes
- new preset families
- new verticalized offers

---

# 13. Standard command sequence cheatsheet

## Full artifact pass
```bash
npm run audit:landing:formation
LANDING_CHECKPOINTS=0,5400,7800,9800,12200 npm run probe:landing:velocity
LANDING_SCREEN_CHECKPOINTS=5400,7800,9800,12200 npm run screens:landing:velocity
npm run contact:landing:velocity
npm run compare:landing:velocity
npm run diagnose:landing:velocity
npm run gate:landing:velocity
```

## Scenario start
```bash
git switch landing-diagnostics-control
git switch -c landing-diagnostic-<scenario-name>
```

## Worktree start
```bash
git switch landing-diagnostics-control
git worktree add ../wt-<scenario-name> -b landing-diagnostic-<scenario-name>
cd ../wt-<scenario-name>
```

---

# 14. Final operational rule

If a slice stops improving under beat tuning, do **not** keep improvising.

Escalate by layer:
1. beat orchestration
2. lock-local composition
3. formation / target integrity
4. packaging / integration

This escalation order is one of the most valuable parts of the workflow.

It prevents wasted weeks.

---

# 15. Phase 5B Runtime Integration Rules

Phase 5B is where the visual system becomes a product surface for UI consumers.

The goal is to expose stable, read-only anchor data without introducing render ownership drift.

## 15.1 Non-negotiable invariants

1. UI only reads `window.__landingUiAnchor`.
2. UI never writes renderer geometry or uniforms.
3. Renderer remains single writer for geometry/uniform state.
4. Every payload-shape change bumps `version`.
5. Every UI integration change must pass `npm run gate:landing:velocity`.
6. No visual tuning inside Phase 5B.

## 15.2 Runtime payload contract (v1.0)

```js
window.__landingUiAnchor = {
  version: "1.0",
  sourceScenarioId: "target_scale_up_1_6",
  updatedAtMs: 0,
  ready: false,
  stage: "velocity",
  word: "FORM",
  checkpoint: "unknown", // "lock" | "drift" | "unknown"
  recommendedModel: "per-letter",
  whole: { min: null, max: null, size: null, center: null },
  letters: [],
  zones: [],
  stability: {
    wholeReady: false,
    perLetterReady: false,
    zoneReady: false
  }
}
```

## 15.3 Null-safe behavior

When landing stage is unavailable, not formed, or geometry cannot be resolved:

- keep `window.__landingUiAnchor` present
- set `ready: false`
- set `checkpoint: "unknown"`
- keep geometric fields null/empty

This prevents consumer-side crashes and avoids fake readiness.

## 15.4 Validation commands

```bash
npm run audit:landing:ui-anchor
npm run gate:landing:velocity
```

For runtime export work, also run:

```bash
npm run audit:landing:ui-runtime
```

## 15.5 Commit boundaries

Use three commits maximum:

1. contract + audit tooling
2. runtime export wiring
3. first UI consumer

This keeps rollbacks clean and isolates regressions.

## 15.6 Done criteria

Phase 5B is complete when:

- runtime payload is available and versioned
- payload is read-only from the UI layer
- anchor readiness remains true for RC1.1 baseline
- release gate remains PASS
