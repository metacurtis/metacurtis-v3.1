# Landing Decision Log
MetaCurtis Consciousness Theater

## Purpose

This file records the major design and engineering decisions that produced the current frozen Phase 1 baseline.

It exists to prevent:
- forgetting why a change was made
- reopening solved problems
- repeating invalid branches

## Major decisions

### Decision 1 - Do not solve mist with more particles
Reason:
The problem was not particle count alone. The bigger issues were ontology, routing, hierarchy, and perceptual readability.

Status:
Frozen.

---

### Decision 2 - Correct the atlas ontology
Reason:
The original live field contained symbolic shapes that made the scene read as iconography instead of atmosphere.

Action:
Low-tier and then live-routed atlas usage were shifted toward mist/density primitives.

Status:
Frozen.

---

### Decision 3 - Fix live atlas routing upstream
Reason:
Even after ontology cleanup, live stage build still routed tier 2/3 into the invalid 8-15 slot band.

Action:
Live stage-build atlas routing was constrained to valid mist-family slots.

Status:
Frozen.

---

### Decision 4 - Author carrier identity upstream
Reason:
Renderer heuristics and tier alone were not sufficient to distinguish true FORM carriers from nearby mist.

Action:
`formWeight` was added and bound through the pipeline.

Status:
Frozen.

---

### Decision 5 - Suppress false authority upstream
Reason:
Non-carrier tier 2/3 particles retained too much visual authority.

Action:
Non-selected high-tier particles were damped in size/opacity at the stage-build seam.

Status:
Frozen, with only deliberate future revisions allowed.

---

### Decision 6 - Restore FORM readability via renderer polish
Reason:
FORM became readable but too soft / over-bloomed.

Action:
Fragment-only renderer polish increased carrier contrast, reduced halo contribution, and clarified edges.

Status:
Frozen baseline achieved.

---

### Decision 7 - Restore mist body after readability was solved
Reason:
Once readability was correct, the atmosphere became too faint on black.

Action:
Small fragment-only mist-body recovery passes were made.

Status:
Baseline stable.

---

### Decision 8 - Introduce atmospheric currents
Reason:
Mist existed and was readable, but lacked enough structured movement to imply luxurious atmospheric flow.

Action:
Tier 0 / Tier 1 vertex-side atmospheric currents were introduced and the visual contract was updated to include mist motion structure.

Status:
Implemented, but the perceptual gain remains subtle in still images.

## Current frozen truths

At the end of Phase 1 the following are treated as solved enough to preserve:

- FORM is anchor-readable
- mist is present and atmospheric
- ontology is correct enough
- live atlas routing is corrected
- carrier authority exists
- false high-tier authority is reduced
- renderer hierarchy works
- deterministic validation still works

## Open Phase 2 questions

- How should mist be staged before FORM is visible?
- How should scroll reveal FORM?
- How should wave/topography become perceptible after reveal?
- How should UI peel integrate with the hero?
- How much mist visibility is enough before the scene stops feeling luxurious?

## Reopen policy

Do not reopen:
- particle ontology
- live atlas routing
- single-writer architecture
- stage-mode baseline
- carrier authority path

unless a future targeted ZAG pass proves that Phase 2 cannot proceed without it.
