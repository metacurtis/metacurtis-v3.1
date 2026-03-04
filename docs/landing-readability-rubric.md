# Landing Readability Rubric — Velocity Stage

## Purpose
This rubric scores whether the landing slice is visually succeeding at each checkpoint.

The goal is not just “beautiful particles.”  
The goal is for **FORM** to become a readable, dominant, spatially coherent hero word that can later support UI interaction.

## Scoring scale
Use a 0–5 scale for each category.

### 0
Absent / unusable / fully failed

### 1
Barely present / mostly unreadable

### 2
Partially visible but materially weak

### 3
Readable but still compromised

### 4
Strong and usable

### 5
Excellent / production-grade

---

## Scored categories

### 1. Word Recognition
Can a viewer clearly read **FORM** at the checkpoint?

Questions:
- Can all four letters be recognized?
- Does it still read as FORM and not FRM / slab / blur?

### 2. Counter Clarity
Are the inner spaces / negative spaces of the letters preserved?

Questions:
- Do the counters of letters remain visible?
- Does the word still have internal structure?

### 3. Edge Clarity
Are the letter edges readable rather than smeared into a glow mass?

Questions:
- Do the outer edges feel crisp enough to define the word?
- Are strokes distinguishable?

### 4. Foreground Dominance
Does FORM feel like the subject rather than buried in the particle field?

Questions:
- Is the word visually in front?
- Do the particles support rather than overpower the word?

### 5. Transition Stability
Does readability survive the transition from one beat to the next?

Questions:
- Does FORM remain readable as it grows / shifts?
- Does the sequence preserve clarity rather than destroy it?

### 6. UI Anchor Suitability
Is FORM prominent enough to later support UI interaction?

Questions:
- Is the word large enough?
- Is it stable and dominant enough to connect future UI affordances to it?

---

## Required pass criteria

### Lock checkpoint
Must score:
- Word Recognition: **4+**
- Foreground Dominance: **4+**
- UI Anchor Suitability: **4+**

### Drift checkpoint
Must score:
- Word Recognition: **4+**
- Transition Stability: **4+**

### General
- No checkpoint after initial formation should score below **3** in Word Recognition
- A later beat must not make FORM less readable unless that degradation is explicitly intended

---

## Current checkpoint set
These checkpoints are the standard ones for landing velocity evaluation:

- `5400ms`
- `7800ms`
- `9800ms`
- `12200ms`

All times are relative to:
`[ConsciousnessTheater] Landing stage mode started`

---

## Verifier output format
For each checkpoint, score:

- Word Recognition
- Counter Clarity
- Edge Clarity
- Foreground Dominance
- Transition Stability
- UI Anchor Suitability

Then add:
- one-sentence visual summary
- pass/fail
