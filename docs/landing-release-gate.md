# Landing Release Gate — Velocity Stage

## Purpose
Phase 3 defines the minimum conditions required for a landing slice run to be considered release-candidate quality.

This gate is not aesthetic perfection.
It is the minimum operational and visual standard required before using the slice for:
- outbound sales proof
- client demos
- internal packaging
- UI integration planning

## Required artifacts
A candidate run must have all of these:

1. latest probe JSON
2. latest screenshot manifest
3. latest contact sheet
4. latest readability-scored scenario result OR verifier report

## Required runtime conditions
The latest probe must show:
- schemaViolationCount = 0
- singleWriterViolationCount = 0

## Required checkpoint set
The candidate must include these inside-beat checkpoints:
- `5400`
- `7800`
- `9800`
- `12200`

## Required visual conditions
At minimum:

### 7800ms lock checkpoint
Must satisfy:
- Word Recognition >= 4
- Foreground Dominance >= 4
- UI Anchor Suitability >= 4

### 9800ms drift checkpoint
Must satisfy:
- Word Recognition >= 4
- Transition Stability >= 4

### General
- no checkpoint after formation may score below 3 in Word Recognition
- FORM must not regress from readable to unreadable after lock
- FORM must remain suitable for later UI attachment

## Required reporting note
A release candidate must include a short human or verifier note answering:
1. What improved
2. What is still weak
3. Is this ready for UI integration? yes/no
4. Is this ready for external demo use? yes/no

## Gate result meanings
### PASS
The slice is operationally stable and visually strong enough for release-candidate use.

### FAIL
At least one required artifact, violation threshold, checkpoint, or readability threshold is missing.

## Phase 3 rule
No landing slice may be called "ready" unless this gate passes.
